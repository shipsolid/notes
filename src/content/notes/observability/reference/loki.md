---
title: "What is Loki"
description: "Grafana Labs' log aggregation system — 'like Prometheus, but for logs': index only labels, store compressed chunks in object storage, query with LogQL. Shares its distributor/ingester/compactor architecture with Mimir and Tempo."
tags: ["tech", "observability", "logs", "grafana-cloud"]
updated: 2026-07-12
hidden: false
zettelId: "202607121601-4"
relations:
  - slug: observability/reference/mimir
    kind: related
  - slug: observability/reference/cardinality
    kind: related
  - slug: observability/reference/fluent-bit
    kind: related
  - slug: observability/03-logging-engineering/08-large-scale-log-search/08-log-aggregation
    kind: related
  - slug: observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy
    kind: related
---

Loki is Grafana Labs'
[[observability/03-logging-engineering/08-large-scale-log-search/08-log-aggregation|log aggregation]]
system, built on a deliberate simplification: index only the **labels** attached to a log stream,
never the log content itself. Full-text indexing is what makes Elasticsearch-based log stacks
expensive to run at scale; Loki's bet is that most log queries start from a small, known label set
(service, namespace, pod) and only need full-text search _within_ that already-narrowed stream — so
that's the only thing it indexes.

---

## Streams, not documents

```
Log stream = a unique set of label values
{app="checkout", env="prod", pod="checkout-7f9c-x2k1"}
     │
     ├── 14:02:01.001  {"level":"info","msg":"order placed","order_id":"9931"}
     ├── 14:02:01.045  {"level":"error","msg":"payment timeout"}
     └── 14:02:01.203  {"level":"info","msg":"order shipped"}
```

Everything inside the curly braces is indexed; everything after it is compressed into chunks and
pushed to object storage, unindexed. A LogQL query always starts with a label selector (cheap,
index-backed) and only then applies a log-content filter or parser (the expensive part, but scoped
to just that stream's chunks):

```logql
{app="checkout", env="prod"} |= "payment timeout" | json | duration > 500ms
```

## Architecture: same shape as Mimir

```
Write path                       Read path
Promtail/Alloy/Fluent Bit        Grafana / API client
     │                                 │
     ▼                                 ▼
 Distributor                     Query-frontend
     │                                 │
     ▼                                 ▼
  Ingester                         Querier
     │                                 │
     ▼                                 ▼
Object storage (chunks)  ◀──  Store-gateway
     │
     ▼
 Compactor
```

Loki actually predates [[mimir]] — Mimir's architecture was modeled directly on Loki's, which is why
operating one gives you a working mental model of the other: distributor validates and shards,
ingester holds recent data in memory, object storage is the durable tier, compactor merges blocks in
the background.

## The cardinality trap, one layer up

Because Loki indexes labels the same way Prometheus indexes metric labels, the identical failure
mode applies: a label sourced from a high-churn or unbounded field (a raw `request_id`, a full URL
path, a user ID used as a label instead of a log field) doesn't blow up a metric series count — it
fragments log streams and bloats the label index, with the same operational symptom (memory pressure
on ingesters, slow queries). See [[cardinality]] for the general mitigation hierarchy; for Loki
specifically the fix is the same: keep labels bounded (service, env, region), and put anything
high-cardinality into the log line itself where LogQL's `| json | ...` pipeline can filter on it
without it ever becoming an index dimension.

## Ingestion agents

| Agent          | Status                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------- |
| Promtail       | Original Loki-specific agent; in maintenance mode, feature development moved to Alloy         |
| Grafana Alloy  | `loki.source.*` + `loki.write` components — current default                                   |
| [[fluent-bit]] | Native Loki output plugin — common where Fluent Bit is already the platform-default DaemonSet |
| Fluentd        | Loki output plugin also available                                                             |

**Why it matters here:** Loki is the log-storage tier alongside Mimir and Tempo in the ShipSolid
Grafana Cloud stack — label-schema discipline for Loki streams matters exactly as much as it does
for Mimir metric labels, and the same [[cardinality]] budget check applies before a new label gets
added to an Alloy `loki.write` or Fluent Bit `kubernetes` filter config, not after stream counts
spike.
