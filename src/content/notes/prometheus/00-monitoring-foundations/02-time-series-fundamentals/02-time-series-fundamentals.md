---
title: "2 — Time Series Fundamentals"
description: "The time series data model behind Prometheus — metric names, labels, timestamps, samples, and how PromQL classifies the data it operates on."
tags: ["prometheus", "foundations", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-2"
relations:
  - slug: prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality
    kind: related
  - slug: observability/reference/cardinality
    kind: related
  - slug: prometheus/02-prometheus-data-model/01-metrics-deep-dive/01-metrics-deep-dive
    kind: related
  - slug: prometheus/05-promql-masterclass/01-promql-fundamentals/01-promql-fundamentals
    kind: related
---

# 2 — Time Series Fundamentals

Before touching
[[prometheus/05-promql-masterclass/01-promql-fundamentals/01-promql-fundamentals|PromQL]] syntax or
scrape configs, it helps to be precise about what Prometheus actually stores. Every concept in this
book — rate calculations, alert thresholds, cardinality budgets — sits on top of one simple data
structure: the time series.

## What a Time Series Actually Is

At its core, a time series is a stream of `(timestamp, value)` pairs identified by a name:

```
<identifier> → [ (t0, v0), (t1, v1), … ]
```

- `<identifier>` — which metric this stream belongs to
- `t0, t1, …` — `int64` Unix timestamps (seconds since 1970-01-01 UTC, e.g. `1668215300`)
- `v0, v1, …` — `float64` values

In Prometheus's actual text exposition format, the identifier is a metric name plus an optional set
of labels, and each line carries one value:

```
node_cpu_seconds_total{cpu="0",mode="idle"} 258277.86
```

Read that as three parts:

- **Metric name** — `node_cpu_seconds_total`, the general thing being measured
- **Labels** — `{cpu="0",mode="idle"}`, the dimensions that distinguish this particular series from
  siblings
- **Value** — `258277.86`, a `float64` sample

A single scrape of a target rarely returns just one line. The same metric name typically appears
many times, once per distinct label combination:

```
node_cpu_seconds_total{cpu="0",mode="idle"}    258277.86
node_cpu_seconds_total{cpu="0",mode="iowait"}  61.16
node_cpu_seconds_total{cpu="1",mode="idle"}    427262.54
node_cpu_seconds_total{cpu="1",mode="iowait"}  58.02
```

Each of those lines is a **different time series**, even though they share a metric name — the label
set is part of the series identity, not an annotation on top of it. Internally, Prometheus treats
the metric name itself as just another label, stored under the reserved key `__name__`. So
`node_cpu_seconds_total{cpu="0"}` is equivalent to `{__name__="node_cpu_seconds_total", cpu="0"}`.
Every metric also picks up two default labels from the scrape configuration itself — `instance` (the
`host:port` that was scraped) and `job` (the name of the scrape job in `prometheus.yml`) — without
any instrumentation code needing to set them.

## Labels Are Dimensions, Not Decoration

The reason labels matter this much is that they're what make a metric queryable along more than one
axis. Take an HTTP request counter without labels: to track requests per API path you'd need a
separate metric per path (`requests_auth_total`, `requests_products_total`, `requests_cart_total`,
…), and combining them into a total requires summing metric names by hand. With a `path` label
instead:

```
requests_total{path="/auth"}
requests_total{path="/products"}
requests_total{path="/cart"}
```

a single query — `sum(requests_total)` — collapses all of them, and slicing by any one label (or
combination, e.g. `path` + `method`) is a query-time decision rather than an instrumentation-time
one. That flexibility is also exactly where the risk lives: every additional label multiplies the
number of distinct series a metric can produce. This chapter treats that as a one-line warning
rather than the full story — the mitigation playbook (label drop/hash, budget estimation, high-churn
label detection) belongs in [[02-labels-and-cardinality|Labels and Cardinality]] and in
[[cardinality|tech/cardinality.md]], not here.

## Metadata: HELP and TYPE

Alongside the samples themselves, Prometheus's exposition format carries two comment-prefixed
metadata lines per metric:

```
# HELP node_disk_discard_time_seconds_total This is the total number of seconds spent by all discards.
# TYPE node_disk_discard_time_seconds_total counter
node_disk_discard_time_seconds_total{device="sda"} 0
```

- **HELP** is a free-text description of what the metric measures — the thing a human reads when
  they've forgotten what a metric name means.
- **TYPE** declares which of Prometheus's metric types this series is: counter, gauge, histogram, or
  summary. This determines which PromQL functions are valid against it (you don't `rate()` a gauge)
  and how it should be visualized.

This chapter only previews the type system enough to make later chapters make sense:

- **Counter** — a value that only ever goes up (or resets to zero on restart); answers "how many
  times did X happen."
- **Gauge** — a value that can go up or down; answers "what is X right now."
- **Histogram** — buckets observations by configurable size boundaries; answers "how long or how
  big, distributed how."
- **Summary** — similar to a histogram but computes client-side quantiles directly, without needing
  bucket boundaries chosen ahead of time.

The full mechanics — bucket selection, `histogram_quantile()`, summary vs. histogram trade-offs,
counter reset handling — are covered in [[01-metrics-deep-dive|Metrics Deep Dive]]. This chapter is
deliberately not re-deriving that material.

## How PromQL Sees This Data

PromQL, Prometheus's query language, classifies every expression it evaluates into one of four
types. Two of them are the plain scalar/string primitives you'd expect from any expression language;
the other two are what make time series querying distinct:

| Type           | What it is                                                                                     | Example                      |
| -------------- | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| String         | A literal string value (currently unused by any built-in function)                             | `"some text"`                |
| Scalar         | A single floating-point number, no labels attached                                             | `54.743`                     |
| Instant Vector | A set of time series, each contributing exactly **one** sample, all sharing the same timestamp | `node_cpu_seconds_total`     |
| Range Vector   | A set of time series, each contributing a **range** of samples over a time window              | `node_cpu_seconds_total[3m]` |

An instant vector is what you get from a bare metric selector — a snapshot: one value per distinct
label combination, all read at the same instant. A range vector is what you get by appending a
duration in square brackets — instead of one value per series you get every sample recorded within
that window, which is the raw material that functions like `rate()` and `increase()` consume.
Selectors, functions, operators, and aggregations — the machinery that turns these four types into
alerts and dashboards — are covered in depth starting with querying-focused chapters later in this
book.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
