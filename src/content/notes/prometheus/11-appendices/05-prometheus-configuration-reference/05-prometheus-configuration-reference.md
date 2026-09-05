---
title: "5 — Prometheus Configuration Reference"
description: "A field-by-field reference for prometheus.yml — global settings, scrape_configs options, and worked examples pulled from real multi-job configurations."
tags: ["prometheus", "appendix", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-43"
relations:
  - slug: prometheus/01-prometheus-architecture/01-prometheus-components/01-prometheus-components
    kind: related
  - slug: prometheus/04-service-discovery/01-discovery-mechanisms/01-discovery-mechanisms
    kind: related
  - slug: prometheus/06-alerting/03-alertmanager/03-alertmanager
    kind: related
  - slug: prometheus/07-production-prometheus/02-long-term-storage/02-long-term-storage
    kind: related
  - slug: prometheus/06-alerting/02-alerting-rules/02-alerting-rules
    kind: related
---

# 5 — Prometheus Configuration Reference

## Purpose

`prometheus.yml` is the single file that controls what Prometheus scrapes, how often, and where its
rules and remote storage live. This chapter is a field-by-field reference for that file. For the
install narrative (downloading the binary, systemd unit files, directory layout) see
[[01-prometheus-components|Prometheus Components]]. For service-discovery-specific configuration
(`kubernetes_sd_configs`, `ec2_sd_configs`, relabeling, etc.) see
[[01-discovery-mechanisms|Discovery Mechanisms]] — this chapter covers only `static_configs`-based
scraping.

## Top-level config sections

`prometheus.yml` is built from these top-level keys:

```yaml
global:
  scrape_interval: 1m
  scrape_timeout: 10s

scrape_configs:
  - job_name: "node"
    scrape_interval: 15s
    scrape_timeout: 5s
    sample_limit: 1000
    static_configs:
      - targets: ["172.16.12.1:9090"]

# Configuration related to AlertManager
alerting:

# Rule files specifies a list of files rules are read from
rule_files:

# Settings related to the remote read/write feature
remote_read:
remote_write:

# Storage related settings
storage:
```

| Section                        | Purpose                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `global`                       | Default parameters applied to every other config section unless overridden locally |
| `scrape_configs`               | Defines the targets and per-job settings for metrics collection                    |
| `alerting`                     | Points Prometheus at one or more Alertmanager instances                            |
| `rule_files`                   | Lists the files (globs allowed) containing recording and alerting rules            |
| `remote_read` / `remote_write` | Configures remote storage integrations for long-term retention or federation       |
| `storage`                      | Local TSDB storage settings                                                        |

## `global`

Defaults inherited by every scrape job unless overridden at the job level:

| Field                 | Meaning                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `scrape_interval`     | How often targets are scraped, fleet-wide, unless a job overrides it |
| `scrape_timeout`      | How long Prometheus waits for a scrape response before giving up     |
| `evaluation_interval` | How often recording/alerting rules are evaluated                     |

Minimal example:

```yaml
global:
  scrape_interval: 5s
```

## `scrape_configs`

A list of scrape jobs. Each entry is a collection of instances (targets) that share the same purpose
and get scraped the same way.

| Field                    | Meaning                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `job_name`               | Name of the job — becomes the `job` label on every metric scraped by it                  |
| `scrape_interval`        | Overrides `global.scrape_interval` for this job only                                     |
| `scrape_timeout`         | Overrides `global.scrape_timeout` for this job only                                      |
| `sample_limit`           | Hard cap on the number of samples accepted per scrape — a scrape exceeding it fails      |
| `metrics_path`           | The HTTP path metrics are fetched from — default `/metrics`                              |
| `scheme`                 | `http` or `https` — default `http`                                                       |
| `basic_auth`             | Sets an `Authorization` header using `username` + `password` (or `password_file`)        |
| `tls_config`             | Certificate/CA settings for scraping over HTTPS (e.g. `ca_file`, `insecure_skip_verify`) |
| `static_configs`         | A fixed list of targets for this job (as opposed to a dynamic `*_sd_configs` block)      |
| `static_configs.targets` | The actual `host:port` list to scrape                                                    |

Full option block, as documented inline in `prometheus.yml`:

```yaml
scrape_configs:
  # How frequently to scrape targets from this job.
  [ scrape_interval: <duration> | default = <global_config.scrape_interval> ]

  # Per-scrape timeout when scraping this job.
  [ scrape_timeout: <duration> | default = <global_config.scrape_timeout> ]

  # The HTTP resource path on which to fetch metrics from targets.
  [ metrics_path: <path> | default = /metrics ]

  # Configures the protocol scheme used for requests.
  [ scheme: <scheme> | default = http ]

  # Sets the `Authorization` header on every scrape request with the
  # configured username and password.
  # password and password_file are mutually exclusive.
  basic_auth:
    [ username: <string> ]
    [ password: <secret> ]
    [ password_file: <string> ]
```

## Worked examples

### Minimal single-job config

The smallest useful config — one job, one target, Prometheus scraping itself:

```yaml
global:
  scrape_interval: 5s
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
```

### Node exporter alongside Prometheus itself

```yaml
global:
  scrape_interval: 5s
scrape_configs:
  - job_name: node
    static_configs:
      - targets: ["localhost:9100"]
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
```

### Requirement-driven job (worked example)

Requirement: a job named `nodes`, scraped every 30s with a 3s timeout, over HTTPS, on a non-default
metrics path, against two targets:

```yaml
scrape_configs:
  - job_name: "nodes"
    scrape_interval: 30s
    scrape_timeout: 3s
    scheme: https
    metrics_path: /stats/metrics
    static_configs:
      - targets: ["10.231.1.2:9090", "192.168.43.9:9090"]
```

Each option maps directly to one requirement line: `scrape_interval: 30s` → "every 30s",
`scrape_timeout: 3s` → "timeout of 3s", `scheme: https` → "use HTTPS",
`metrics_path: /stats/metrics` → "changed from default `/metrics`", and the two `targets` entries →
the two IPs.

### Multiple heterogeneous jobs

A single `prometheus.yml` scraping four different kinds of targets — a Linux host, a batch
application, a Windows host, and a web application — each as its own job:

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

This is the standard shape for a small, mostly-static fleet: one job per exporter/application type,
each with its own port and (implicitly) its own `job` label on the resulting metrics.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
