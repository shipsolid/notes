---
title: "What is Tempo"
description: "Grafana Labs' distributed tracing backend — the radical simplification vs. Jaeger's classic architecture: no dedicated index, just object storage and a trace-ID lookup, queried with TraceQL and linked from metrics via exemplars."
tags: ["tech", "observability", "tracing", "grafana-cloud"]
updated: 2026-07-12
hidden: false
zettelId: "202607121601-8"
relations:
  - slug: observability/reference/jaeger
    kind: compared_to
  - slug: observability/reference/loki
    kind: related
  - slug: observability/reference/cardinality
    kind: related
  - slug: observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend
    kind: compared_to
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
---

Tempo is Grafana Labs'
[[observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend|distributed tracing backend]],
built around one deliberate simplification: unlike [[jaeger]]'s classic architecture (which requires
Cassandra or Elasticsearch to index span tags for search), Tempo maintains **no secondary index at
all**. The only lookup it needs is trace ID → storage block, which means the only infrastructure
dependency is object storage — no index cluster to size, operate, or pay for.

---

## Ingest: multi-protocol by design

```
OTLP  ──┐
Jaeger ─┼──▶  Tempo distributor  ──▶  Ingester  ──▶  Object storage (blocks)
Zipkin ─┘                                                    │
                                                              ▼
                                                         Compactor
```

Tempo accepts OTLP, Jaeger, and Zipkin wire protocols natively at the same distributor — a service
or vendor agent that "sends to Jaeger" doesn't need a separate Jaeger deployment; pointing its
Jaeger-protocol exporter at Tempo's Jaeger receiver is a drop-in replacement.

## Finding a trace without an index

| Access path                  | How it works                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Trace ID lookup**          | Direct block lookup — the one operation Tempo was built to make cheap                                                           |
| **Exemplars from Mimir**     | A Prometheus/Mimir histogram bucket carries a sampled trace ID linking straight to the request that produced that latency value |
| **Log-to-trace correlation** | A structured log line in [[loki]] carrying `trace_id` links directly into Tempo                                                 |
| **TraceQL search**           | Structured query over span attributes/duration/status, added later to close the gap with tag-indexed search                     |

```traceql
{ span.http.status_code = 500 && duration > 800ms }
```

TraceQL search still has to scan recent blocks rather than hit a pre-built tag index, which is the
real tradeoff behind Tempo's cost model: cheap storage and ingestion, in exchange for search being
scoped to recent time windows rather than instant across all history the way an ES-backed Jaeger
index would be.

## Exemplars: the concrete [[observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation|metrics-to-trace bridge]]

```
Mimir histogram: http_request_duration_seconds_bucket{le="1.0"}
                       │
                       │  exemplar: trace_id="a1b2c3...", value=0.94
                       ▼
                  Tempo trace a1b2c3...  (the actual request that produced that sample)
```

This is the mechanism [[cardinality]] points to as the alternative to keeping high-churn fields
(request IDs, user IDs) as metric labels: instead of a label multiplying series count, a sampled
exemplar carries just enough of a pointer to jump from an aggregate metric straight to one concrete
trace — no series growth, full request-level detail on demand.

## Tempo vs Jaeger

| Concern              | Tempo                             | Jaeger                                                  |
| -------------------- | --------------------------------- | ------------------------------------------------------- |
| Storage requirement  | Object storage only               | Cassandra / Elasticsearch (indexed) or Badger (local)   |
| Operational overhead | Low — no index cluster to run     | Higher — index cluster sizing, retention, upgrades      |
| Tag/attribute search | TraceQL, scoped to recent blocks  | Full tag index, historically stronger ad hoc search     |
| Ingest protocols     | OTLP, Jaeger, Zipkin — all native | OTLP-native since Jaeger v2 (rebuilt on OTel Collector) |

**Why it matters here:** Tempo is the trace-storage tier in the ShipSolid Grafana Cloud stack, and
exemplars are the standing answer to "how do I get request-level detail without adding a label" —
whenever a proposed metric label is actually about identifying one specific request, the exemplar
path into Tempo is the correct redirect, not a [[cardinality]] exception.
