---
title: "What is Telegraf"
description: "InfluxData's plugin-driven metrics/events/logs collection agent — 300+ input/output plugins, written in Go, single static binary — the collector layer in the InfluxDB (TICK-stack-descendant) ecosystem, comparable in role to Grafana Alloy."
tags: ["tech", "observability", "metrics", "collector", "influxdata"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-12"
relations:
  - slug: observability/reference/cardinality
    kind: related
  - slug: observability/reference/statsd
    kind: related
  - slug: observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline
    kind: compared_to
---

Telegraf (`influxdata/telegraf`) is InfluxData's open-source, plugin-driven server agent for
collecting, processing, and shipping metrics, events, and logs. It's the collection layer of the
InfluxDB ecosystem — same architectural slot Grafana Alloy fills for the Grafana Cloud stack (see
[[grafana-mcp]] for the MCP-facing side of that stack), just built around a plugin bus instead of an
OTel-native pipeline.

---

## Core shape: a plugin pipeline

Telegraf is a single static Go binary with **zero external dependencies**, configured entirely
through plugins wired into one pipeline:

```
Inputs ──▶ Processors ──▶ Aggregators ──▶ Outputs
  │             │              │              │
  system,    rename,        mean,         InfluxDB,
  docker,    filter,        min/max,      Prometheus
  postgres,  enum,          histogram     remote-write,
  exec,      ...                          Kafka, HTTP,
  300+ ...                                Loki, ...
```

| Plugin type    | Job                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------- |
| **Input**      | Pull or receive metrics from a source (system stats, a database, an API, StatsD, a webhook) |
| **Processor**  | Transform metrics in-flight (rename fields, filter tags, parse strings)                     |
| **Aggregator** | Roll up metrics over a time window (mean, min/max, histograms) before they leave the agent  |
| **Output**     | Write the final metric set to one or more destinations                                      |

300+ plugins ship in the main repo across all four categories — this is the main reason teams reach
for Telegraf: broad out-of-the-box coverage for infra/db/queue metrics without writing a custom
exporter per system.

## Where it sits vs. the [[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|OTel]]/Alloy world

| Concern              | Telegraf                                               | Grafana Alloy / OTel Collector                             |
| -------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| Config model         | Plugin list in TOML                                    | Pipeline config in River/Alloy syntax (or OTel YAML)       |
| Native data model    | InfluxDB line protocol                                 | OTLP-native                                                |
| Origin ecosystem     | InfluxDB / TICK stack                                  | CNCF / OpenTelemetry                                       |
| Metrics → Prometheus | Via `outputs.prometheus_client` or remote-write output | Native remote-write to Mimir                               |
| Extensibility        | Compiled-in plugins (or `execd` for external)          | OTel-native processors/receivers, native Prometheus scrape |

Functionally they occupy the same slot: an agent that runs near the workload, pulls metrics from
whatever it's pointed at, and ships them to a backend. In an OTel-native stack the default choice is
Alloy; Telegraf becomes relevant when a target system already has a **mature, pre-built Telegraf
input plugin** (many databases, queues, and hardware/IoT sources do) and writing an equivalent OTel
receiver isn't worth the effort.

## Interop path into a Grafana Cloud stack

Telegraf doesn't require InfluxDB as the destination — it can write straight to a Prometheus-
compatible remote-write endpoint, which is the practical path if data needs to land in Mimir
alongside everything else Alloy collects:

```
Source (e.g. exotic DB, IoT sensor, queue)
        │
        ▼
   Telegraf agent
   (input plugin)
        │
        ▼
outputs.prometheus_client  ──or──  remote-write output
        │
        ▼
   Mimir (Grafana Cloud)
```

This makes Telegraf a legitimate **gap-filler** in an otherwise OTel/Alloy-native pipeline: reach
for it only for the specific source system that has a strong Telegraf input and no equivalent OTel
receiver, not as a wholesale replacement for Alloy.

**Why it matters here:** for [[cardinality]]-sensitive pipelines, Telegraf's aggregator stage is a
legitimate pre-aggregation point — same mitigation role as label-drop in an Alloy pipeline, just
implemented as a plugin instead of a River expression.
