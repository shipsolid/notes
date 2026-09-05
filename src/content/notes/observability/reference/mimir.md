---
title: "What is Mimir"
description: "Grafana Labs' horizontally-scalable, multi-tenant long-term storage for Prometheus metrics — the 2022 successor to Cortex, and the actual system serving every PromQL query and remote-write in a Grafana Cloud metrics stack."
tags: ["tech", "observability", "metrics", "grafana-cloud"]
updated: 2026-07-12
hidden: false
zettelId: "202607121601-5"
relations:
  - slug: observability/reference/prometheus
    kind: related
  - slug: observability/reference/cardinality
    kind: related
  - slug: prometheus/07-production-prometheus/02-long-term-storage/02-long-term-storage
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-10-data-tiering-and-compaction
    kind: related
  - slug: observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy
    kind: related
---

Mimir is Grafana Labs' open-source, horizontally-scalable, multi-tenant backend for [[prometheus]]
metrics — the project Grafana Labs built starting in 2022 as the successor to Cortex (Cortex was a
CNCF project; Grafana Labs stepped back from co-maintaining it to focus engineering effort on
Mimir). It implements the Prometheus remote-write API on the write side and the PromQL query API on
the read side, at a scale a single Prometheus server was never built for.

---

## Microservice architecture: write path and read path

```
Write path                              Read path
───────────                             ──────────
remote_write                            Grafana / API client
     │                                        │
     ▼                                        ▼
 Distributor  (validate, shard by tenant+series)   Query-frontend  (split, cache, dedupe)
     │                                        │
     ▼                                        ▼
  Ingester  (in-memory, recent blocks)     Querier  (merges ingester + store-gateway data)
     │                                        │
     ▼                                        ▼
 Object storage (S3 / GCS / Azure Blob)  ◀── Store-gateway  (serves historical blocks)
     │
     ▼
 Compactor  (merges + downsamples blocks over time)
```

This split — distributor/ingester on write, querier/query-frontend/store-gateway on read, object
storage as the durable tier, compactor running continuously in the background — is the same shape
[[loki]] and [[tempo]] use. All three were built by the same team around the same pattern, which is
why they scale, upgrade, and operate almost identically once you've learned one of them.

## [[observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy|Multi-tenancy]]

Every request carries an `X-Scope-OrgID` header identifying the tenant; Mimir isolates storage,
limits, and query execution per tenant on that basis. This is the literal implementation of "tenant"
in the cardinality-budget vocabulary — a workload team's series count, ingestion rate, and query
load are capped independently of every other tenant sharing the cluster.

| Tenant limit                           | What it protects against                                                  |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Max active series per tenant           | One workload's [[cardinality]] explosion consuming shared ingester memory |
| Max samples/sec ingested               | A misconfigured scrape interval or retry storm flooding the write path    |
| Max query concurrency / series scanned | A single runaway PromQL query starving other tenants' queries             |

These per-tenant caps are explicitly the **last line of defense** in the cardinality mitigation
hierarchy — the goal is never hitting them because the label schema was designed correctly upstream.

## Why Prometheus-compatible matters operationally

Because Mimir speaks the same remote-write and PromQL APIs, nothing about how a service is
instrumented or how a dashboard is written changes when the backend is Mimir instead of a single
Prometheus — the migration is purely at the collector's `remote_write` target and at query routing,
not at instrumentation or dashboard JSON.

**Why it matters here:** Mimir is literally the metrics system of record in the ShipSolid Grafana
Cloud stack — every Alloy `remote_write` block and every dashboard PromQL query ultimately resolves
against Mimir's distributor/querier, and every new label proposed anywhere upstream (scrape config,
StatsD receiver, exporter) is a Mimir active-series cost before it's anything else — the
[[cardinality]] budget check happens before the config ships, not after ingesters start paging.
