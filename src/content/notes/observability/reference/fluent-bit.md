---
title: "What is Fluent Bit"
description: "CNCF-graduated, C-written log/metrics/trace forwarder — Fluentd's lightweight sibling, the de facto node-level log-collection DaemonSet in most Kubernetes clusters, and Grafana Alloy's main incumbent competitor for that slot."
tags: ["tech", "observability", "logs", "collector", "cncf"]
updated: 2026-07-12
hidden: false
zettelId: "202607121601-2"
relations:
  - slug: observability/reference/telegraf
    kind: related
  - slug: observability/reference/cardinality
    kind: related
  - slug: observability/reference/loki
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-24-telemetry-gateways
    kind: related
---

Fluent Bit is a CNCF-graduated telemetry agent — written in C for a tiny footprint (~450KB), built
as the lightweight sibling to Fluentd (the original, Ruby-based CNCF-graduated log collector). Where
Fluentd was designed as a flexible aggregation-tier daemon, Fluent Bit was designed to run at the
edge: one instance per node, one instance per pod sidecar, low enough overhead that running
thousands of them is a non-issue. That's why it's the collector most Kubernetes distributions ship
by default for node-level log collection.

---

## Pipeline shape

Same four-stage shape as [[telegraf]] — input plugin, transform, buffer, output plugin — just
purpose-built for logs first:

```
Input ──▶ Parser ──▶ Filter ──▶ Buffer ──▶ Router ──▶ Output
  │           │           │                              │
 tail,     regex,     kubernetes         (mem/fs)      Loki, ES,
 systemd,  json,      (pod metadata                    S3, Kafka,
 docker,   ltsv       enrichment),                     forward,
 forward   ...        grep, modify                     stdout, ...
```

| Stage      | Job                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------- |
| **Input**  | Tail a file, read `systemd`/journald, receive over the `forward` protocol, scrape Docker |
| **Parser** | Turn a raw line into structured fields (regex, JSON, key-value)                          |
| **Filter** | Enrich or drop records — the `kubernetes` filter attaches pod/namespace/label metadata   |
| **Output** | Ship to one or more destinations concurrently                                            |

## The Kubernetes DaemonSet pattern

```
        Node
┌─────────────────────────┐
│  Pod A   Pod B   Pod C  │
│    │       │       │    │
│    └───────┼───────┘    │
│      /var/log/containers │
│            │              │
│      Fluent Bit (DaemonSet pod)
│      + kubernetes filter (enrich with pod/ns/labels via K8s API)
└────────────┼─────────────┘
             ▼
     Loki / Elasticsearch / S3 / Kafka
```

One Fluent Bit pod per node tails every container's log file under `/var/log/containers`, enriches
each line with Kubernetes metadata, and forwards it on — no per-pod sidecar needed for the common
case, which is the main reason it stays cheap at scale.

## Fluent Bit vs Fluentd vs Grafana Alloy

| Concern              | Fluent Bit                                              | Fluentd                                   | Grafana Alloy                                    |
| -------------------- | ------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| Language / footprint | C, ~450KB                                               | Ruby + C, heavier                         | Go, OTel-native                                  |
| Typical role         | Node-level DaemonSet collector                          | Aggregation tier (fan-in from Bit agents) | Both — scrape + collect + forward in one binary  |
| Config model         | INI-style / YAML                                        | Ruby-ish DSL                              | River/Alloy syntax                               |
| Native signal focus  | Logs first, metrics/traces via OTel plugins added later | Logs                                      | Metrics, logs, traces — OTLP-native from day one |
| Ecosystem home       | CNCF graduated                                          | CNCF graduated                            | Grafana Labs (not CNCF-donated)                  |

Fluent Bit has grown OpenTelemetry input/output plugins, so it _can_ act as a lightweight
OTLP-compatible collector — but it's still reached for primarily as a log shipper. In a stack that's
standardized on OTel-native pipelines end to end, Alloy is the default; Fluent Bit remains the
practical choice wherever a cluster already runs it as the platform-default DaemonSet and swapping
it out isn't worth the migration.

**Why it matters here:** Fluent Bit is the collector most likely to already be running in any
cluster ShipSolid onboards that wasn't built Alloy-first — the `kubernetes` filter's label
enrichment is exactly the point where [[cardinality]] discipline has to be applied on the way into
[[loki]], since a careless enrichment rule (e.g. keeping full pod name instead of a stable label)
fragments Loki streams the same way an unbounded Prometheus label fragments a metric.
