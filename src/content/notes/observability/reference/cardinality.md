---
title: "What is Cardinality (in observability)"
description: "The number of unique time series (or unique log/trace label combinations) a metric produces — the single biggest driver of ingest cost and query latency in Prometheus-family backends (Mimir, Cortex, Thanos), and the reason unbounded labels are a production incident waiting to happen."
tags: ["tech", "observability", "metrics", "cardinality", "cost"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-13"
relations:
  - slug: observability/reference/telegraf
    kind: related
  - slug: prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality
    kind: related
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: related
  - slug: observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy
    kind: related
---

Cardinality is the number of **unique
[[prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality|label-value combinations]]**
a metric produces — each unique combination is one time series. It's the central cost and
performance variable in any Prometheus- family backend (Prometheus, Mimir, Cortex, Thanos): every
series has to be stored, indexed, and held in memory for querying, so cardinality growth is what
actually breaks these systems, not raw sample volume.

---

## Why one label can multiply cardinality

A metric's cardinality is the **product** of its label value counts, not the sum:

```
http_requests_total{method, status, endpoint, pod}

  method:   4 values   (GET, POST, PUT, DELETE)
  status:   6 values   (200, 201, 400, 401, 404, 500)
  endpoint: 50 values  (routes in the service)
  pod:      20 values  (replica count, churns on every deploy)

Total series = 4 × 6 × 50 × 20 = 24,000 active series
              for ONE metric name
```

Add one high-churn label — `pod` in the example above is already a warning sign, because pod names
change on every rollout, meaning old series go stale and new ones spin up constantly (**series
churn**, a second cost dimension beyond flat cardinality). Add something genuinely unbounded — a
`request_id`, a raw `user_id`, a full URL with query params — and that same metric goes from 24,000
series to unbounded, unpredictable growth.

## Where the cost actually lands

| System                 | What cardinality drives                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Prometheus/Mimir       | Active series held in memory (ingester working set) — the primary OOM cause                                                                  |
| Query engine           | Every PromQL query touching that metric scans all matching series                                                                            |
| Grafana Cloud bill     | Priced on active series + samples/sec — cardinality is the ingest cost lever                                                                 |
| Loki (structured logs) | Same problem, one layer up: high-cardinality **labels** on log streams (not the log lines themselves) fragment streams and blow up the index |
| Tempo (traces)         | Span **attributes** with unbounded values don't multiply series the same way, but still bloat storage and hurt trace-search performance      |

## The [[observability/02-metrics-engineering/05-label-design/05-label-schema-design|label-keep vs. label-drop]] decision

The standing rule: **default to dropping or hashing a label before keeping it**, and treat any label
sourced from a high-churn field (request IDs, user IDs, raw timestamps, full paths with path params)
as an automatic stop.

```
New label proposed
        │
        ▼
Is the value set bounded and known ahead of time?
   │                              │
  YES                             NO
   │                              │
   ▼                              ▼
Keep as a label              Push it elsewhere:
(method, status,               • Log line (Loki) — searchable, not a series dimension
 region, env)                   • Trace attribute (Tempo) — per-span, not per-series
                                 • Exemplar — sampled link from a metric sample to a trace
```

This is exactly the job of a **cardinality budget**: before a new metric or label ships into an
Alloy/OTel-collector/Prometheus config, estimate active series count, samples/sec, and monthly
ingest cost impact — never ship on a "looks fine" guess. See the Cardinality Budget Calculator skill
for the concrete estimation workflow.

## Mitigation techniques, in order of preference

| Technique                                                                                                             | What it does                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Don't add the label**                                                                                               | Cheapest fix — ask whether the dimension is needed at query time at all                                                                                                                             |
| **Drop at collection**                                                                                                | Alloy/OTel processor drops the label before it ever reaches the write path                                                                                                                          |
| **Hash / bucket**                                                                                                     | Collapse a wide value set into a small number of buckets (e.g. status class `2xx`/`4xx`/`5xx` instead of raw status code)                                                                           |
| **Recording rules**                                                                                                   | Pre-aggregate high-cardinality raw series into a smaller derived series for the dashboards/alerts that actually get queried                                                                         |
| **Route to logs/traces instead**                                                                                      | Move the high-churn dimension out of the metrics data plane entirely — see [[telegraf]] for an example of aggregation happening at the collector layer, same principle Alloy applies via label-drop |
| **[[observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy\|Per-tenant limits]]** | Backend-enforced ceiling (Mimir tenant limits) as the last line of defense, not the primary control                                                                                                 |

## Quick mental check before adding any label

Ask: _if this service scales from 20 pods to 200, or onboards 10x the users, does this label's value
count grow with it?_ If yes, it's not a label — it's an exemplar, a log field, or a trace attribute.

**Why it matters here:** this is the gating question behind every Alloy/OTel/Prometheus config
change in the observability pillar — the standing rule is that cardinality impact is surfaced in the
same response as the config itself, never silently.
