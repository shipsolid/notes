---
title: "1 — Prometheus Components"
description: "The functional pieces inside a Prometheus server — scrape manager, TSDB, rule engine, query engine — and the real commands used to install and run one on a VM, under systemd, or in Docker."
tags: ["prometheus", "architecture", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-5"
relations:
  - slug: prometheus/07-production-prometheus/02-long-term-storage/02-long-term-storage
    kind: related
  - slug: prometheus/05-promql-masterclass/01-promql-fundamentals/01-promql-fundamentals
    kind: related
  - slug: prometheus/06-alerting/03-alertmanager/03-alertmanager
    kind: related
  - slug: observability/reference/mimir
    kind: related
  - slug: prometheus/01-prometheus-architecture/03-data-flow/03-data-flow
    kind: related
---

# 1 — Prometheus Components

## Overview

"Prometheus server" is really shorthand for several cooperating pieces bundled into a single Go
binary. Understanding them separately makes the rest of this book easier to reason about: a scrape
failure, a slow query, and a missed alert are three different components misbehaving, not one
monolithic "Prometheus is broken."

## The Components

| Component                               | Role                                                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server**                              | The umbrella process — coordinates scraping, storage, rule evaluation, and query serving.                                                     |
| **Scrape Manager (Retrieval)**          | The data retrieval worker. Reads the current target list and pulls `/metrics` from each one on schedule.                                      |
| **Service Discovery**                   | Resolves _which_ targets exist right now — static config, Kubernetes, EC2, DNS, Consul, and others.                                           |
| **TSDB (Storage)**                      | The on-disk time-series database that persists every scraped sample under its metric name and label set.                                      |
| **Rule Engine**                         | Evaluates recording rules and alerting rules on the `evaluation_interval`, writing results back into TSDB or forwarding firing alerts onward. |
| **HTTP Server / Query Engine (PromQL)** | Exposes `/api/v1/query` and friends; answers PromQL expressions from the built-in web UI, `promtool`, or Grafana.                             |

Put together, the flow looks like the diagram from the [[03-data-flow|data-flow chapter]]:
applications and servers expose metrics → the Scrape Manager pulls them on an interval → TSDB stores
the samples → the HTTP Server answers PromQL queries against that storage, either from the
Prometheus web UI directly or from an external tool like Grafana. Alerting rides alongside this: the
Rule Engine evaluates alerting rules against the same storage and pushes firing alerts to
[[03-alertmanager|Alertmanager]], which handles routing and notification (Slack, email, and so on) —
Alertmanager itself is a separate binary and out of scope for this chapter.

## Running the Server

The components above are all compiled into one binary. What differs across environments is how that
binary gets started and kept running. The three real deployment shapes below are adapted directly
from install steps, with the narration trimmed and the commands kept intact.

### Bare-Metal / VM

For a quick, foreground run — useful for a first look, not for production:

```bash
# Download the release archive
wget https://github.com/prometheus/prometheus/releases/download/v2.37.0/prometheus-2.37.0.linux-amd64.tar.gz

# Extract it
tar xvf prometheus-2.37.0.linux-amd64.tar.gz
cd prometheus-2.37.0.linux-amd64/
ls -l
```

The extracted directory contains three things that matter: the `prometheus` executable, the
`prometheus.yml` configuration file, and `promtool`, the command-line validation utility. Running
`./prometheus` starts the server in the foreground; the web UI is then available at
`http://localhost:9090`. Prometheus ships configured to scrape itself, so querying `up` should
immediately return a result for `instance="localhost:9090", job="prometheus"`.

### systemd (persistent service)

Running `./prometheus` directly ties the process to your terminal session and won't survive a
reboot. A systemd unit fixes both problems.

1. Create a dedicated, login-disabled system user:

```bash
sudo useradd --no-create-home --shell /bin/false prometheus
```

2. Create the config and data directories and hand them to that user:

```bash
sudo mkdir /etc/prometheus
sudo mkdir /var/lib/prometheus
sudo chown prometheus:prometheus /etc/prometheus
sudo chown prometheus:prometheus /var/lib/prometheus
```

3. Download, extract, and install the binaries:

```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.37.0/prometheus-2.37.0.linux-amd64.tar.gz
tar xvf prometheus-2.37.0.linux-amd64.tar.gz

sudo cp prometheus /usr/local/bin/
sudo cp promtool /usr/local/bin/
sudo chown prometheus:prometheus /usr/local/bin/prometheus
sudo chown prometheus:prometheus /usr/local/bin/promtool
```

4. Copy the console templates and the config file into place:

```bash
sudo cp -r consoles /etc/prometheus
sudo cp -r console_libraries /etc/prometheus
sudo chown -R prometheus:prometheus /etc/prometheus/consoles
sudo chown -R prometheus:prometheus /etc/prometheus/console_libraries

sudo cp prometheus.yaml /etc/prometheus/prometheus.yml
sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml
```

5. Sanity-check by running it manually as the `prometheus` user before wiring up systemd:

```bash
sudo -u prometheus /usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries
```

6. Create the unit file at `/etc/systemd/system/prometheus.service`:

```ini
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
```

`Wants=`/`After=network-online.target` delay startup until the network is up;
`WantedBy=multi-user.target` starts the service as part of normal boot, whether or not a local GUI
is running.

7. Reload systemd and bring the service up:

```bash
sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl status prometheus
sudo systemctl enable prometheus   # starts on boot
```

### Docker

The containerized path skips user/directory setup entirely — mount a config file and expose the
port:

```yaml
# prometheus.yml
global:
scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

```bash
docker run -d \
  -v /path-to/prometheus.yml:/etc/prometheus/prometheus.yml \
  -p 9090:9090 \
  prom/prometheus
```

### Restarting

Three equivalent ways to stop and restart a running server, depending on how it was started:

```bash
ctrl+c   # then re-run ./prometheus
kill -HUP <pid>
systemctl restart prometheus
```

### Reloading Configuration Without a Restart

A config edit alone doesn't take effect until Prometheus reloads it. There are three ways to trigger
that:

1. **Restart the service outright:**

   ```bash
   systemctl restart prometheus
   ```

2. **Send a SIGHUP signal** to the running process:

   ```bash
   sudo killall -HUP prometheus
   ```

3. **POST to the `/-/reload` endpoint** — not enabled by default; it requires starting Prometheus
   with `--web.enable-lifecycle`:

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

The SIGHUP and `/-/reload` paths both re-read config without dropping any in-flight scrapes or
losing TSDB state — that's the main reason to prefer them over a full restart on a production
server.

## Remote Write, Remote Read, and the Query Engine

Three of the components table entries above deserve a pointer rather than a full treatment here,
because the depth belongs in other chapters of this book:

- **Remote Write / Remote Read** — the mechanism by which a Prometheus server offloads samples to
  (or reads history back from) an external long-term-storage backend such as [[mimir|Mimir]],
  Thanos, or Cortex, instead of relying solely on its own local TSDB. The `prometheus.yml` schema
  has bare `remote_read:` / `remote_write:` stanzas for this, but none of the source material behind
  this chapter goes further than that — no wire-protocol mechanics, no compression details, no
  failure semantics. For the real depth, see [[02-long-term-storage|Long-Term Storage]].
- **Query Engine (PromQL)** — the language and evaluation engine behind every `/api/v1/query` call.
  Covered in full starting at [[01-promql-fundamentals|PromQL Fundamentals]].

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
