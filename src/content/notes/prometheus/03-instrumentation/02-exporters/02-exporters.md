---
title: "2 — Exporters"
description: "What a Prometheus exporter is, installing Node Exporter as a systemd service, and monitoring the container runtime itself via Docker Engine metrics and cAdvisor."
tags: ["prometheus", "instrumentation", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-12"
relations:
  - slug: prometheus/02-prometheus-data-model/01-metrics-deep-dive/01-metrics-deep-dive
    kind: related
  - slug: prometheus/01-prometheus-architecture/03-data-flow/03-data-flow
    kind: related
  - slug: prometheus/04-service-discovery/01-discovery-mechanisms/01-discovery-mechanisms
    kind: related
  - slug: prometheus/11-appendices/04-exporter-catalog/04-exporter-catalog
    kind: related
  - slug: prometheus/01-prometheus-architecture/02-pull-model-deep-dive/02-pull-model-deep-dive
    kind: related
---

# 2 — Exporters

## What an exporter is

Most systems were never built to speak Prometheus. A Linux kernel doesn't expose `/metrics`, and
neither does a MySQL server, a Docker daemon, or a piece of network hardware. An **exporter** is the
translation layer that sits between a system's native metrics — kernel counters, a database's
`SHOW STATUS` output, a device's SNMP OIDs — and the exposition format Prometheus expects. The
exporter process runs alongside (or as an agent on) the thing being monitored, reads its native
metrics, and re-exposes them over HTTP in Prometheus's plain-text format so a normal scrape config
can pull them.

Because this pattern is so common, Prometheus ships a set of first-party exporters (Node Exporter
for Linux hosts, a Windows equivalent, and a small set of others) and the wider ecosystem maintains
dozens more for databases, message queues, hardware, and network devices. The two exporters covered
below — Node Exporter and cAdvisor — are the ones this book has hands-on source material for.

## Node Exporter

Node Exporter exposes host-level metrics: CPU time per mode, memory, disk I/O, filesystem usage,
network counters. Running it manually (`./node_exporter`) works for a quick check but runs in the
foreground and won't survive a reboot — for anything persistent it needs to run as a systemd
service, the same pattern used for Prometheus itself.

**1. Copy the binary into place** (after downloading and extracting the release tarball, as with
Prometheus itself):

```bash
sudo cp node_exporter /usr/local/bin
```

**2. Create a dedicated, unprivileged system user.** Node Exporter doesn't need a login shell or a
home directory — it only needs to run and bind a port:

```bash
sudo useradd --no-create-home --shell /bin/false node_exporter
```

**3. Set ownership** so the binary runs as that user:

```bash
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
```

**4. Write the systemd unit file** at `/etc/systemd/system/node_exporter.service`:

```ini
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
```

`Wants=network-online.target` / `After=network-online.target` delay startup until the network is up;
`WantedBy=multi-user.target` wires it into normal boot, independent of whether a GUI is present.

**5. Reload systemd, then start and enable the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl status node_exporter
sudo systemctl enable node_exporter   # starts on boot
```

A quick sanity check confirms metrics are flowing before wiring up a Prometheus scrape job:

```bash
curl localhost:9100/metrics
```

From there it's a normal `static_configs` target in `prometheus.yml`, on port `9100` by default.

## Windows Exporter

Windows Exporter is the Windows-host equivalent of Node Exporter — same idea, different metric
surface (Windows performance counters instead of `/proc`). The hands-on install-and-scrape demo for
it lives with the metrics deep-dive material rather than being duplicated here: see
[[01-metrics-deep-dive|Metrics Deep Dive]] for the walkthrough.

## Monitoring the container runtime itself

Host-level and application-level metrics don't tell you anything about the container runtime layer
in between. Docker Engine has its own internal health (build failures, engine CPU use, time to
process container actions), and each running container has its own resource footprint that the
engine's own metrics don't break out individually. Prometheus covers both, via two different
mechanisms.

### Docker Engine metrics

The Docker daemon can expose its own internal metrics directly — no separate exporter binary needed.
Enable it in the daemon config:

```bash
vi /etc/docker/daemon.json
```

```json
{
  "metrics-addr": "127.0.0.1:9323",
  "experimental": true
}
```

Restart Docker and confirm metrics are being served:

```bash
sudo systemctl restart docker
curl localhost:9323/metrics
```

Then add a scrape job pointing at the Docker host:

```yaml
scrape_configs:
  - job_name: "docker"
    static_configs:
      - targets: ["<ip-docker-host>:9323"]
```

These metrics answer engine-level questions — how much CPU the Docker daemon itself is consuming,
how many image builds have failed, how long container actions take to process. They say nothing
about what's happening _inside_ any individual container.

### cAdvisor metrics

For per-container visibility — CPU/memory per container, process counts, container uptime — you need
[cAdvisor](https://github.com/google/cadvisor), which runs as its own container alongside the
workloads it's watching:

```yaml
# docker-compose.yml
version: '3.4'
services:
  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    container_name: cadvisor
    privileged: true
    devices:
      - "/dev/kmsg:/dev/kmsg"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - 8080:8080
```

```bash
docker-compose up
curl localhost:8080/metrics
```

And the matching scrape job:

```yaml
scrape_configs:
  - job_name: "cAdvisor"
    static_configs:
      - targets: ["<docker-host-ip>:8080"]
```

### Docker Engine metrics vs. cAdvisor — which one answers which question

| Question                                                | Docker Engine metrics | cAdvisor |
| ------------------------------------------------------- | :-------------------: | :------: |
| How much CPU/memory does the Docker daemon use?         |          Yes          |    No    |
| Total failed image builds                               |          Yes          |    No    |
| Time to process container actions                       |          Yes          |    No    |
| How much CPU/memory does _this specific container_ use? |          No           |   Yes    |
| Number of processes running inside a container          |          No           |   Yes    |
| Per-container uptime                                    |          No           |   Yes    |

In practice both scrape jobs are run side by side: Docker Engine metrics for the health of the
runtime itself, cAdvisor for per-container resource attribution — the same split you'd expect
between host-level and process-level monitoring anywhere else.

## What's not covered yet

This book has no source material yet for the Blackbox exporter, SNMP exporter, or the
database/service exporters for PostgreSQL, MySQL, Redis, Kafka, HAProxy, or NGINX. Rather than
invent configuration for them, this chapter leaves them as a known gap — they'd each warrant their
own real walkthrough once there's hands-on material to adapt.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
