---
title: "3 — Prometheus in the Observability Ecosystem"
description: "Where Prometheus sits in the CNCF landscape — its pull-based cloud-native origins, its companion projects, and where this book does (and doesn't yet) connect it to the wider stack."
tags: ["prometheus", "ecosystem", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229"
relations:
  - slug: observability/reference/prometheus
    kind: related
  - slug: observability/reference/mimir
    kind: related
  - slug: prometheus/06-alerting/03-alertmanager/03-alertmanager
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-07-scaling-each-layer
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-09-multi-tenancy
    kind: related
---

# 3 — Prometheus in the Observability Ecosystem

This book spends most of its pages inside Prometheus itself — scrape configs, PromQL, alerting
rules. Before going there, it's worth placing Prometheus on the map relative to everything around
it, so later chapters don't read as if Prometheus operates in isolation.

## Cloud-Native Origins

Prometheus was originally built at SoundCloud and joined the Cloud Native Computing Foundation in
2016 (the second project to do so, after Kubernetes). It's written in Go, and its design choices — a
pull-based scrape model, a purpose-built local TSDB, service discovery as a first-class concept —
reflect the operational reality of container-orchestrated infrastructure: instances come and go, and
something needs to keep asking "what's currently running, and is it healthy" rather than waiting to
be told.

The architecture, at its simplest, is a straight line:

```
Targets → Service Discovery (DNS, Kubernetes, AWS, Consul, custom…) → Prometheus (TSDB) → Grafana Web UI
```

Targets are anything exposing metrics on an HTTP endpoint — natively instrumented applications, or
services fronted by an adapter (an "exporter") that translates existing metrics into Prometheus's
exposition format. Service discovery is the source of truth for which targets currently exist;
Prometheus polls that list, scrapes it, stores the result, and answers PromQL queries against it.
Full history, the CNCF governance angle, and how this connects to Grafana Cloud as a managed
destination are covered in [[prometheus|tech/prometheus.md]] — this chapter isn't re-deriving that.

## Companion Projects in the Same Stack

Prometheus solves metrics. It deliberately does not solve logs, traces, or dashboards — those are
separate CNCF projects designed to interoperate with it, not built into it:

- **Grafana** — the visualization and dashboarding layer most commonly paired with Prometheus as a
  data source; it's also where PromQL results actually get looked at day to day.
- **[[loki|Loki]]** — the logs counterpart, using a similar label-based indexing philosophy so log
  streams and metric series can be correlated by the same labels.
- **[[tempo|Tempo]]** — the traces counterpart, for the request-level detail that metrics and logs
  can't provide on their own.
- **[[03-alertmanager|Alertmanager]]** — not a separate observability signal but Prometheus's own
  alert-routing companion: Prometheus evaluates alerting rules and pushes firing alerts to
  Alertmanager, which deduplicates, groups, and routes them to email, Slack, PagerDuty, and similar
  destinations.

None of these get a deep dive in this book — they're named here because a Prometheus deployment in
practice is rarely deployed alone, and this chapter would be dishonest if it implied otherwise.

## Scaling Beyond a Single Prometheus Server

A single Prometheus server has real limits — local disk retention, no built-in horizontal scale-out,
no native multi-tenancy. Projects like Mimir, Cortex, Thanos, and VictoriaMetrics exist specifically
to take the Prometheus data model and TSDB format and make it horizontally scalable, long-term, and
multi-tenant. Mimir's positioning is covered in [[mimir|tech/mimir.md]]. The comparative
architecture question — how each of these layers actually scales ingestion, storage, and query
fan-out, and how multi-tenancy gets implemented at that scale — is covered in
[[05-07-scaling-each-layer|Scaling Each Layer]] and [[05-09-multi-tenancy|Multi-Tenancy]]. This
chapter is only flagging that the question exists, not answering it.

## OpenTelemetry Relationship

This book does not yet cover how Prometheus relates to OpenTelemetry — that's an honest gap, not an
oversight to paper over.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
