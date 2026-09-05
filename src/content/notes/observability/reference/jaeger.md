---
title: "What is Jaeger"
description: "CNCF-graduated distributed tracing system built at Uber in 2015, Dapper-lineage like Zipkin before it — and, since Jaeger v2, rebuilt on top of the OpenTelemetry Collector rather than bespoke ingestion code."
tags: ["tech", "observability", "tracing", "cncf"]
updated: 2026-07-12
hidden: false
zettelId: "202607121601-3"
relations:
  - slug: observability/reference/tempo
    kind: compared_to
  - slug: observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend
    kind: compared_to
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-24-telemetry-gateways
    kind: related
---

Jaeger is a
[[observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend|distributed tracing]]
system originally built at Uber in 2015, open-sourced and later CNCF-graduated. It sits in the same
lineage as Zipkin (Twitter, earlier) — both trace models trace back to Google's Dapper paper — but
Jaeger became the reference implementation most tracing tooling (including OpenTracing, its
predecessor API standard) was validated against.

---

## Classic architecture

```
Instrumented service
     │  spans (UDP, historically via a per-host Agent sidecar)
     ▼
Jaeger Collector
     │  validates, batches
     ▼
Storage (Cassandra / Elasticsearch / Kafka as a durable buffer)
     │
     ▼
Query service  ──▶  Jaeger UI
```

The per-host Agent (a lightweight UDP relay) has been deprecated in newer deployments in favor of
direct OTLP export from the instrumented service — one fewer hop, and it drops the requirement that
every host run a sidecar just to batch spans.

## The storage dependency is the operational cost

Jaeger's tag-based search (find every trace where `http.status_code=500` and `service=checkout`)
requires an actual search index — Cassandra or Elasticsearch, sized, retained, and upgraded like any
other stateful cluster. That's the direct tradeoff against [[tempo]], which was built specifically
to avoid this: Tempo gives up instant full-history tag search in exchange for needing nothing but
object storage.

| Concern              | Jaeger                                                          |
| -------------------- | --------------------------------------------------------------- |
| Storage              | Cassandra / Elasticsearch (indexed) or Badger (embedded, local) |
| Tag/attribute search | Full index — strong ad hoc search across all retained history   |
| Operational surface  | An index cluster to run, in addition to Jaeger itself           |
| Ingest protocols     | OTLP-native since v2; Jaeger thrift/proto for legacy clients    |

## Jaeger v2: rebuilt on the OpenTelemetry Collector

The significant architectural shift: Jaeger v2 (2024) is no longer a bespoke ingestion pipeline —
it's distributed as an **OpenTelemetry Collector configuration**, reusing the same
receivers/processors/exporters framework as any other OTel Collector deployment. Jaeger-the-project
now contributes storage backends as OTel Collector exporters rather than maintaining a parallel
ingestion codebase, which converges Jaeger's ingest path with the rest of the OTel ecosystem instead
of running alongside it as a separate implementation.

```
OTel Collector (Jaeger distribution)
     │  receivers: otlp, jaeger, zipkin
     │  exporters: jaeger_storage (Cassandra/ES/Badger/...)
     ▼
Jaeger Query + UI
```

## Where a "Jaeger" mention actually points

In practice, when a vendor SDK or legacy service says it "exports to Jaeger," it almost always means
it emits the Jaeger wire protocol (Thrift/UDP or gRPC), not that a full Jaeger deployment is
required downstream — [[tempo]]'s Jaeger receiver ingests that same protocol directly, which is why
Tempo was explicitly designed as a drop-in destination for Jaeger-protocol traffic.

**Why it matters here:** ShipSolid runs Tempo, not a standalone Jaeger deployment — but any
third-party service or older SDK that talks about "Jaeger" is describing the wire protocol, and
Tempo's Jaeger receiver is the actual ingestion point. Knowing the difference is what stops a "do we
need to stand up Jaeger" conversation from turning into unnecessary infrastructure.
