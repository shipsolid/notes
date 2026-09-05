---
title: "3 — Aggregation Composability — Why You Can't Average Percentiles"
description: "Some statistics merge correctly across shards, replicas, and time windows — sum, count, max. Percentiles do not. The distinction that decides whether a fleet-wide dashboard is trustworthy or quietly wrong."
tags: ["concepts", "distributed-systems", "observability", "maang-prep"]
updated: 2026-07-16
hidden: false
zettelId: "202607161816"
relations:
  - slug: observability/02-metrics-engineering/08-query-optimization/08-query-sharding
    kind: related
  - slug: observability/11-visualization/02-golden-signals/02-tail-latency
    kind: related
  - slug: observability/11-visualization/01-dashboard-design/01-dashboard-design
    kind: related
  - slug: observability/10-observability-data-platforms/02-mimir/02-shards-workers
    kind: related
  - slug: observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb
    kind: related
---

# 3 — Aggregation Composability — Why You Can't Average Percentiles

Every dashboard that shows a fleet-wide number is doing arithmetic on numbers that came from
different pods, different shards, or different time windows. Most of the time that arithmetic is
silently invalid, and the number rendered is confidently wrong rather than obviously wrong.

---

## What "composable" means for an aggregate

An aggregate statistic is **composable** if partial aggregates — one per pod, one per shard, one per
15-second scrape window — can be combined into the correct aggregate for the whole, without going
back to the raw data.

```
Pod A: 100 requests ─┐
Pod B: 140 requests ─┼──► combine partial aggregates ──► fleet-wide aggregate
Pod C:  80 requests ─┘         (no raw data needed)
```

This matters because raw data almost never survives past the point it was measured — a Prometheus
`scrape_interval` window is gone once the counter increments past it, and a query that fans out
across 50 shards ([[08-query-sharding]]) cannot ship every raw sample back to the coordinator.
Whatever merging happens, happens on partial aggregates.

---

## The statistics that compose

| Statistic | Merge rule                | Composable?                                                       |
| --------- | ------------------------- | ----------------------------------------------------------------- |
| `sum`     | sum of sums               | Yes                                                               |
| `count`   | sum of counts             | Yes                                                               |
| `max`     | max of maxes              | Yes                                                               |
| `min`     | min of mins               | Yes                                                               |
| `average` | `sum(sums) / sum(counts)` | Yes — but **only** via sum and count, never by averaging averages |

`average` looks like it doesn't compose because averaging three averages directly gives the wrong
answer whenever the underlying counts differ:

```
Pod A: avg=10ms over  900 requests   (sum = 9,000ms)
Pod B: avg=200ms over 100 requests   (sum = 20,000ms)

Wrong:   (10 + 200) / 2        = 105ms
Correct: (9,000 + 20,000) / (900 + 100) = 29ms
```

The fix is cheap: carry `sum` and `count` as the two composable primitives, and compute `average`
from their merged totals — never merge pre-computed averages directly.

---

## The statistic that doesn't compose: percentiles

A percentile is a property of the **shape** of a distribution, not a running total. There is no
merge rule that takes "p99 = 300ms on Pod A" and "p99 = 250ms on Pod B" and produces the fleet's p99
— the two pods' underlying samples are gone, and percentiles don't distribute over merges the way
sums do.

```
avg(p99_A, p99_B, p99_C)  ≠  p99(all requests from A, B, and C combined)
```

### A concrete counterexample

```
Pod A: 1,000 requests, p99 = 50ms   (the slowest 10 requests are 50–60ms)
Pod B:    10 requests, p99 = 900ms  (the slowest 1 request is 900ms)

avg(p99_A, p99_B) = (50 + 900) / 2 = 475ms   ← what the "average the pod p99s" panel shows

Merge the 1,010 raw requests and recompute:
the true fleet p99 sits around 50–60ms, because Pod B's one slow request
is only 1 out of 1,010 — nowhere near the 99th percentile of the combined set.
```

The averaged-panel number (475ms) overstates the real tail by roughly 8x, in the direction that
triggers a false-positive page. Averaging percentiles the other way — many fast pods diluting one
genuinely sick pod — just as easily _hides_ a real regression instead of manufacturing a fake one.
Either direction is wrong; which way it's wrong is what makes it dangerous, because it isn't
consistently pessimistic or consistently optimistic.

---

## Why this happens

Percentiles require the ranked position of every sample relative to every other sample. Once you've
discarded the raw samples and kept only "here is my p99," you've thrown away exactly the information
needed to re-rank them against another pod's samples. `sum` and `count` never needed that
information in the first place — they're order-independent.

---

## The two ways to get a correct fleet-wide percentile

**1. Ship histogram buckets, not pre-computed percentiles, and compute the percentile once at the
top.** Prometheus/Mimir's `histogram_quantile()` works this way: every instance exports bucketed
counts (`≤10ms`, `≤50ms`, `≤100ms`, ...), the buckets sum correctly across instances (they're just
counts — composable), and the percentile is computed exactly once, after the merge, from the merged
buckets. This is also why [[02-tail-latency]] calls histograms "the right metric type for latency" —
this is the mechanical reason why.

```
Pod A buckets: {≤10ms: 800, ≤50ms: 950, ≤100ms: 995, ≤1000ms: 1000}
Pod B buckets: {≤10ms:   5, ≤50ms:   9, ≤100ms:    9, ≤1000ms:   10}
                        │ sum bucket-by-bucket (composable) │
Merged buckets:        {≤10ms: 805, ≤50ms: 959, ≤100ms: 1004, ≤1000ms: 1010}
                                 │
                        compute p99 ONCE, on the merged buckets
```

**2. Use a mergeable sketch** (t-digest, HDRHistogram, Prometheus native histograms) when
fixed-width buckets lose too much precision at the tail. These structures are explicitly designed so
two sketches can be merged into a third that approximates the percentile of the _combined_ raw data
— trading some accuracy for the composability that a bare `p99: 300ms` number never had.

What never works is exporting `p99` (or `p50`, or any quantile) as a plain gauge per instance and
averaging, summing, or maxing those gauges across instances afterward — none of those operations
recovers the true combined percentile.

---

## Where this bites in practice

- **Dashboards** — a panel wired as `avg(p99) by (namespace)` across pods is the single most common
  version of this bug; it should be `histogram_quantile(0.99, sum(rate(bucket[5m])) by (le))`
  instead. See [[01-dashboard-design]].
- **SLO burn-rate math** — an SLO defined on p99 latency must alert on the merged-histogram
  percentile across the whole service, not an average of per-pod percentiles, or the burn-rate
  calculation drifts from what users actually experience.
- **Query sharding coordinators** — a scatter-gather query that returns "the p99 from each shard" to
  the caller has pushed the composability problem onto the client instead of solving it; the
  coordinator should merge sketches/buckets before returning a single number. See
  [[08-query-sharding]] and [[02-shards-workers]].
- **Metrics storage** — this is a direct driver of why
  [[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb|Metrics Storage (TSDB)]]
  cares about histogram bucket encoding and cardinality: more buckets means finer percentile
  accuracy, at a direct cardinality cost.

---

## Why this matters for an Observability Architect

A dashboard built on averaged percentiles doesn't fail loudly — it just quietly reports a number
that has no relationship to any real request a user experienced. The failure mode is worse than a
missing metric, because a wrong-but-plausible number gets trusted in an incident review and can
point the investigation at the wrong service entirely. When reviewing anyone's dashboard or alerting
rule, "is this percentile computed from merged raw data, or averaged from other percentiles?" is a
five-second check that catches a surprising fraction of production dashboards.

## Metadata

|        |               |
| ------ | ------------- |
| Author | Amit Singh    |
| Scope  | observability |
