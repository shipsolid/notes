---
title: "2 — Long-Term Storage"
description: "Why single-node Prometheus has no built-in long-term-storage or HA story, and how remote_write receivers like Thanos, Cortex, Mimir, and VictoriaMetrics fill that gap at a horizontally-scaled, multi-tenant layer."
tags: ["prometheus", "production", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-25"
relations:
  - slug: observability/reference/mimir
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-07-scaling-each-layer
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-09-multi-tenancy
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-10-data-tiering-and-compaction
    kind: related
  - slug: observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb
    kind: related
---

# 2 — Long-Term Storage

## The gap this chapter frames

A single Prometheus server owns its own TSDB on local disk, and nothing else. There is no
replication, no clustering, and no built-in mechanism for keeping data beyond the local retention
window. That is a deliberate design choice, not an oversight — Prometheus trades away distributed
storage complexity for a simple, reliable, single-binary operational model. But it means two
questions that come up the moment Prometheus goes into production have no native answer:

- **How do I keep metrics for a year, not two weeks?** Local disk and local retention don't scale to
  that horizon, and nobody wants to run one Prometheus server sized for a year of full-resolution
  data.
- **How do I make "the monitoring system" itself highly available** without ending up with two
  independent servers that each hold half the truth?

Prometheus's own answer to both is the same escape hatch: `remote_write`. Rather than solving
long-term storage and HA inside the server, Prometheus ships every sample out over `remote_write` to
a receiver that implements roughly the same query surface (PromQL, and often the same HTTP API) at a
horizontally-scaled, multi-tenant layer. That receiver is where retention, replication,
downsampling, and multi-tenancy actually get solved. **Thanos, Cortex, Grafana Mimir, and
VictoriaMetrics** are the well-known implementations of that receiver pattern — different projects,
different storage engines, but the same shape: take the remote-write firehose from many Prometheus
servers, and give back a single, durable, queryable, long-horizon view.

## Why this chapter stays short

None of the source material behind this book goes deep on any of these backends — there's no
walkthrough of Thanos's sidecar-and-store-gateway split, no Cortex ingester/distributor
architecture, no Mimir microservice map, no VictoriaMetrics storage internals. Rather than write a
thin, second-hand comparison that duplicates content that already exists in more depth elsewhere in
this wiki, this chapter is intentionally a short frame plus pointers. The real depth lives in the
linked notes below — treat this page as the map, not the territory.

## Where to go next

- **[[mimir|What is Mimir]]** — a dedicated note on Grafana Mimir specifically: its microservice
  write path and read path, and why it's the system actually serving every PromQL query and
  remote-write in a Grafana Cloud metrics stack. Go here for the "Grafana Mimir" answer.
- **[[05-07-scaling-each-layer|3.4 Scaling Each Layer]]** and
  **[[05-09-multi-tenancy|3.6 Multi-Tenancy]]** — comparative scaling and multi-tenancy context
  across Cortex, Thanos, and VictoriaMetrics-style architectures, from the telemetry ingestion
  pipeline system design.
- **[[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb|Metrics Storage (TSDB)]]**
  — TSDB internals (chunk/block encoding, WAL, compaction), and the single-node vs.
  horizontally-scaled framing that this chapter only gestures at.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
