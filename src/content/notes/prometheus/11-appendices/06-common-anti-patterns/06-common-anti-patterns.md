---
title: "6 — Common Anti-Patterns"
description: "Three concrete Prometheus anti-patterns seen in this book's source material — high-cardinality labels, invalid/reserved metric naming, and misaligned histogram_quantile buckets — with why each one breaks and where to read the full explanation."
tags: ["prometheus", "appendix", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-39"
relations:
  - slug: prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality
    kind: depends_on
  - slug: prometheus/02-prometheus-data-model/01-metrics-deep-dive/01-metrics-deep-dive
    kind: depends_on
  - slug: prometheus/05-promql-masterclass/02-promql-functions/02-promql-functions
    kind: related
---

# 6 — Common Anti-Patterns

## Purpose

This is a short, deliberately scoped list. It is not "every mistake you could make with Prometheus"
— it is exactly three anti-patterns that trace directly back to warnings already made elsewhere in
this book's source material, restated here as a quick "what people do wrong / why it breaks"
reference rather than invented gotchas.

## 1. Using high-cardinality labels

**What people do wrong:** Adding a label whose value space is effectively unbounded — the classic
example is tagging a metric with a raw user ID, request ID, or similar per-entity identifier.

**Why it breaks:** Every unique combination of label values creates a brand new time series. A
counter with just a `hostname` label across 20 servers is 20 time series. Add a `region` label
across 4 regions and it's 80. A label like "user ID" has potentially millions of distinct values, so
a single metric with that label can explode into millions of time series — each with its own memory,
storage, and query overhead. Prometheus can manage millions of time series on a single server, but a
high-cardinality label can push a single metric past that budget on its own, degrading write and
query performance and forcing premature horizontal scaling.

**Full explanation:** see [[02-labels-and-cardinality|Labels and Cardinality]].

## 2. Violating metric-naming rules (and misusing the reserved colon)

**What people do wrong:** Naming a hand-written metric with characters outside the allowed set, or
using a colon (`:`) in a metric name that isn't a recording rule output.

**Why it breaks:** Metric names must match the regex `[a-zA-Z_:][a-zA-Z0-9_:]*` — only ASCII
letters, numbers, underscores, and colons are valid. Colons are a reserved convention specifically
for recording rules (e.g. `job:http_errors:rate5m`) to visually distinguish a pre-aggregated,
recorded series from a raw instrumentation metric. A hand-instrumented metric that includes a colon
blurs that distinction — anyone reading `job:something` in a dashboard or alert will reasonably
assume it's a recording rule output when it isn't, making it harder to reason about which metrics
are raw versus pre-computed.

**Full explanation:** see [[01-metrics-deep-dive|Metrics Deep Dive]].

## 3. Choosing histogram buckets that don't align with the SLO target

**What people do wrong:** Defining histogram bucket boundaries without regard to the actual SLO
threshold being measured — for example, an SLO of "95% of requests under 0.5s" measured against
buckets of `0.1`, `0.2`, and `0.5` looks fine at first glance because `0.5` is present, but a looser
bucket layout without an exact boundary at the SLO value silently produces the wrong answer.

**Why it breaks:** `histogram_quantile()` approximates a quantile using linear interpolation between
bucket boundaries — it does not have access to the individual observations, only the cumulative
bucket counts. If the SLO threshold has an exact matching bucket boundary (e.g. a bucket literally
at `le="0.5"`), the "was the SLO met" question is answered exactly. But if the SLO value falls
_between_ two buckets, the interpolated result is an estimate that can be meaningfully wrong, and
worse, it fails silently: the query returns a number that looks precise but may not reflect reality,
with no error or warning to flag the mismatch. Getting a more accurate value requires more buckets
specifically around the SLO threshold — not just more buckets in general.

**Full explanation:** see [[01-metrics-deep-dive|Metrics Deep Dive]].

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
