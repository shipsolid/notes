---
title: "1 — Discovery Mechanisms"
description: "How Prometheus finds scrape targets — static configs, file-based service discovery with watched JSON files, and DNS service discovery via SRV/A records — plus validating and reloading configuration safely."
tags: ["prometheus", "service-discovery", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-14"
relations:
  - slug: prometheus/04-service-discovery/02-kubernetes-discovery/02-kubernetes-discovery
    kind: related
  - slug: prometheus/04-service-discovery/03-cloud-discovery/03-cloud-discovery
    kind: related
  - slug: prometheus/03-instrumentation/02-exporters/02-exporters
    kind: related
  - slug: prometheus/01-prometheus-architecture/01-prometheus-components/01-prometheus-components
    kind: related
  - slug: prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality
    kind: related
---

# 1 — Discovery Mechanisms

Every scrape job in Prometheus needs an answer to one question: which targets should I pull metrics
from? `prometheus.yml` answers that question per job, under `scrape_configs`, and the answer can
come from any of several discovery mechanisms — some are just a fixed list you type in, others watch
a file on disk, others query DNS at scrape time. This chapter covers the three mechanisms that have
concrete configuration in this book's source material: static configuration, file-based service
discovery, and DNS service discovery. It closes with how to validate a config before applying it and
how to get Prometheus to pick up changes without downtime.

## Static Configuration

The simplest form of target discovery is also the most explicit: list the targets directly in the
config file under `static_configs`. Each `scrape_config` entry is a job — a named group of targets
that share scrape settings — and each job can list one or more targets as `host:port` pairs:

```yaml
global:
  scrape_interval: 30s

scrape_configs:
  - job_name: 'linux'
    static_configs:
      - targets: ['ps-prom-ub1804:9100']
```

Nothing stops a single config from running several independent jobs side by side, each with its own
static target list:

```yaml
scrape_configs:
  - job_name: 'linux'
    static_configs:
      - targets: ['ub1804:9100']

  - job_name: 'batch'
    static_configs:
      - targets: ['ub1804:8080']

  - job_name: 'windows'
    static_configs:
      - targets: ['win2019:9182']

  - job_name: 'web'
    static_configs:
      - targets: ['win2019:8080']
```

Static configuration is fine for a demo, a home lab, or a small and stable fleet — anywhere the
target list changes rarely enough that hand-editing YAML is not a burden. It stops scaling the
moment targets are added and removed on their own schedule (autoscaling groups, ephemeral
containers, a fleet that changes weekly), which is exactly the gap the remaining mechanisms close.

## File-Based Service Discovery

File-based service discovery (`file_sd_configs`) moves the target list out of `prometheus.yml` and
into one or more separate files — JSON (or YAML) documents that Prometheus watches on disk.
Something else owns writing that file: a config management tool, a small script, a CI job, anything
that knows the current target inventory. Prometheus itself just re-reads the file whenever it
changes.

A targets file looks like this:

```json
[
  {
    "targets": ["ub1804:9100", "ub2004:9100"],
    "labels": {
      "job": "linux"
    }
  }
]
```

And the corresponding `scrape_config` points at it:

```yaml
scrape_configs:
  - job_name: 'linux'
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/linux-targets.json'
        refresh_interval: 30s
```

The important operational property here is that Prometheus notices file changes on its own — there
is no need to send `SIGHUP` or hit the reload endpoint just because the target list changed. A full
config reload is still required if you change the _shape_ of the job itself
([[02-labels-and-cardinality|relabeling rules]], scrape interval, the path to the file), but
day-to-day target churn is handled by the file watch alone. That makes file SD a natural fit for any
automation that already knows how to render a JSON file but doesn't want to own the whole Prometheus
config.

## DNS Service Discovery

DNS service discovery (`dns_sd_configs`) asks a DNS server for the current target list at each
refresh interval, instead of reading it from a file. Two record types are used, and they return
different amounts of information:

- **SRV records** return hostnames _and_ ports in one query — useful when a single DNS name can
  resolve to a whole job's worth of targets.
- **A (or AAAA) records** return only IP addresses; the port has to be supplied separately in the
  config, since A records carry no port information.

```yaml
scrape_configs:
  - job_name: 'linux-dns'
    dns_sd_configs:
      - names:
          - '_prometheus._tcp.example.internal'
        type: 'SRV'

  - job_name: 'linux-dns-a'
    dns_sd_configs:
      - names:
          - 'linux-targets.example.internal'
        type: 'A'
        port: 9100
```

DNS SD suits environments that already maintain accurate DNS entries for their fleet — many on-prem
and traditional VM setups do this as a matter of course — without needing a separate file-generation
pipeline or a platform-specific API integration.

## Validating Configuration with promtool

Before any of the above reaches a running server, `promtool` — the command-line utility shipped
alongside Prometheus — can check the config file's syntax without touching the server at all:

```bash
$ promtool check config /etc/prometheus/prometheus.yml
# Checking prometheus.yml
#   SUCCESS: prometheus.yml is valid prometheus config file syntax
```

A malformed field is caught the same way. For example, misspelling `metrics_path` as `metric_path`:

```yaml
scrape_configs:
  - job_name: "node"
    metric_path: "/metrics"   # should be "metrics_path"
    static_configs:
      - targets: ["node1:9100"]
```

```bash
$ promtool check config /etc/prometheus/prometheus.yml
# Checking prometheus.yml
#   FAILED: parsing YAML file prometheus.yml: yaml: unmarshal errors:
#   line 24: field metric_path not found in type config.ScrapeConfig
```

Validating with `promtool` before every reload — ideally as a pre-deploy CI step — turns a config
typo from a production incident into a failed pipeline step.

## Reloading Configuration

A `prometheus.yml` edit only takes effect once Prometheus reloads it. There are three ways to
trigger that:

1. **Restart the process.** Simple, but drops in-memory state and briefly stops scraping.
2. **Send `SIGHUP`** to the running Prometheus process:

   ```bash
   sudo killall -HUP prometheus
   ```

3. **Send an HTTP reload request**, which requires starting Prometheus with `--web.enable-lifecycle`
   (disabled by default, since it lets anyone who can reach the port force a reload):

   ```ini
   ExecStart=/usr/local/bin/prometheus \
       --config.file /etc/prometheus/prometheus.yml \
       --storage.tsdb.path /var/lib/prometheus/ \
       --web.console.templates=/etc/prometheus/consoles \
       --web.console.libraries=/etc/prometheus/console_libraries \
       --web.enable-lifecycle
   ```

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart prometheus
   curl -X POST http://<prometheus>/-/reload
   ```

Of these, the `SIGHUP` and HTTP-reload paths are the ones worth reaching for in practice — both
re-read the config in place without dropping the TSDB or losing scrape continuity, and both pair
naturally with a `promtool check config` step run immediately beforehand.

## What This Chapter Doesn't Cover

Two discovery mechanisms are deliberately left out of this chapter because the source material
behind this book has no concrete coverage of them here:

- **HTTP-based service discovery** (`http_sd_configs`) — polling a custom HTTP endpoint that returns
  a target list — has no worked example in this book's source notes, so it is skipped rather than
  invented.
- **Kubernetes-native discovery** and **cloud-provider / registry-based discovery** (AWS, Azure,
  GCP, Consul, Eureka) get their own dedicated chapters —
  [[02-kubernetes-discovery|Kubernetes Discovery]] and [[03-cloud-discovery|Cloud Discovery]] —
  since they warrant more depth than a subsection here.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
