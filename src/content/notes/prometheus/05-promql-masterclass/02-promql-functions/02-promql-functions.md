---
title: "2 — PromQL Functions"
description: "Math, date/time, type-conversion, and sorting functions; the rate() vs irate() decision; and the histogram_quantile() function-call mechanics."
tags: ["prometheus", "promql", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-18"
relations:
  - slug: prometheus/02-prometheus-data-model/01-metrics-deep-dive/01-metrics-deep-dive
    kind: depends_on
  - slug: prometheus/05-promql-masterclass/03-aggregation-operators/03-aggregation-operators
    kind: depends_on
  - slug: prometheus/11-appendices/06-common-anti-patterns/06-common-anti-patterns
    kind: related
---

# 2 — PromQL Functions

PromQL ships a function library for reshaping raw samples into the numbers dashboards and alerts
actually need — rounding, type conversion, sorting, and, most importantly, turning ever-increasing
counters into meaningful rates. This chapter covers the general-purpose functions plus the mechanics
of calling `histogram_quantile()`; the conceptual side of histograms — what a bucket is, why `le` is
cumulative, cardinality cost of adding buckets — belongs to
[[01-metrics-deep-dive|Metrics Deep Dive]] and isn't repeated here.

## Math Functions

Three simple rounding/absolute-value functions apply element-wise across every series in a vector.

```
node_cpu_seconds_total
  {cpu="0", mode="idle"}   115.12
  {cpu="0", mode="irq"}    87.4482
  {cpu="0", mode="steal"}  44.245
```

`ceil()` rounds every value up to the nearest integer:

```
ceil(node_cpu_seconds_total)
  {cpu="0", mode="idle"}   116
  {cpu="0", mode="irq"}    88
  {cpu="0", mode="steal"}  45
```

`floor()` rounds down instead:

```
floor(node_cpu_seconds_total)
  {cpu="0", mode="idle"}   115
  {cpu="0", mode="irq"}    87
  {cpu="0", mode="steal"}  44
```

`abs()` returns the absolute value — useful after a subtraction that could go negative:

```
abs(1 - node_cpu_seconds_total)
```

## Date & Time Functions

`time()` returns the current Unix timestamp as a scalar, which is what makes uptime-style
calculations possible:

```
time()
  1663872361.957

time() - process_start_time_seconds
  process_start_time_seconds{instance="node"}   1109175.01
```

Beyond that, Prometheus exposes calendar-aware accessors — handy for anything that needs to reason
about day-of-week or month-end behavior directly in a query. If the current time is 15:07 Thursday,
September 22nd 2022 UTC:

| Expression        | Result |
| ----------------- | ------ |
| `minute()`        | 07     |
| `hour()`          | 15     |
| `day_of_week()`   | 4      |
| `day_of_month()`  | 22     |
| `days_in_month()` | 30     |
| `month()`         | 09     |
| `year()`          | 2022   |

## Changing Type

Two functions convert between scalars and instant vectors, which matters because most PromQL
functions only accept one or the other.

`vector()` wraps a bare scalar into a single-element instant vector:

```
vector(4)
  {} 4
```

`scalar()` does the reverse — given a vector with exactly one element, it returns that element's
value as a scalar. Give it a vector with more than one element (or zero) and it returns `NaN`
instead of guessing:

```
scalar(process_start_time_seconds{instance="node1"})
```

## Sorting Functions

`sort()` and `sort_desc()` reorder the series in a vector by value, ascending or descending:

```
sort(node_filesystem_avail_bytes)        # ascending
sort_desc(node_filesystem_avail_bytes)   # descending
```

These are cosmetic — they change the order results are returned/displayed in, not which series are
included.

## The Rate Family: `rate()` vs `irate()`

A raw counter, plotted as-is, isn't informative — counters only ever go up (or reset to zero on a
process restart), so the graph is just a slope with no texture. What's actually useful is the **rate
of change**, and PromQL provides two functions for computing it, both consuming a range vector:

```
rate(http_errors[1m])
```

- **`rate()`** looks at the first and last data point in the range and computes an average
  per-second rate across the whole window. It smooths out noise, correctly detects and compensates
  for counter resets, and is the right choice for slow-moving counters and — critically — for
  anything feeding an alerting rule, where a stable number matters more than reacting to every blip.
- **`irate()`** looks at only the last two data points in the range — an "instant" rate — and is
  meant for graphing fast-moving, volatile counters where you want the graph to react immediately to
  spikes rather than average them away.

Either way, the range needs enough samples to be meaningful — aim for at least four samples inside
the window (a 15s scrape interval with a 60s range gives four), otherwise the rate calculation is
working with too little data to be trustworthy.

One ordering rule matters when `rate()` is combined with an
[[03-aggregation-operators|aggregation]]: always apply `rate()` first, then aggregate the result —
never the other way around. `rate()` needs to see the raw, per-series counter values to correctly
detect a reset; aggregating first would hide exactly the signal it depends on.

```
sum without(code, handler) (rate(http_requests_total[24h]))
```

This book's source material covers `rate()` and `irate()` in depth but doesn't include a worked
example for `increase()` — worth knowing it exists as the cumulative sibling of `rate()` (an
extrapolated total change over the window rather than a per-second rate), but treat it as a gap in
this book's demos rather than something covered here.

## `histogram_quantile()` — Function-Call Mechanics

Once a histogram's `_bucket` series are in hand, `histogram_quantile()` is the function that turns
them into a percentile. Its call shape is:

```
histogram_quantile(φ, <vector of _bucket series>)
```

- The first argument, φ (0 ≤ φ ≤ 1), is the quantile being asked for — `0.75` for the 75th
  percentile, `0.95` for the 95th, and so on.
- The second argument must be a vector of the metric's `_bucket` series, `le` label intact — that's
  what the function reads to interpolate the answer.

```
histogram_quantile(0.75, request_latency_seconds_bucket{instance="192.168.1.66:8000", job="api"})
```

This says: 75% of requests to that instance completed in a given latency or less. The same call
shape is what makes histograms useful for SLO checks — an SLO of "95% of requests under 0.5s" is
answered directly:

```
histogram_quantile(0.95, request_latency_seconds_bucket)
```

If the value that comes back is above `0.5`, the SLO was missed for that window.

One mechanical caveat worth carrying forward: `histogram_quantile()` computes its answer via
**linear interpolation** between the two bucket boundaries the true value falls between — it is an
approximation, not an exact reading. For a threshold-style SLO check ("were 95% of requests under
0.5s, yes or no"), that's fine as long as one of the histogram's bucket boundaries is set to exactly
the SLO value itself. What the interpolation can't tell you is _how far_ a miss was — if the two
nearest boundaries are 0.2 and 0.5 and the function reports 0.4, the true value could be anywhere
between them, and [[06-common-anti-patterns|closing that gap requires adding more buckets]], not
calling the function differently.

## Illustrative Queries: Gauges, Counters, Summaries, Histograms

A few worked examples tie the function categories above to actual metric types:

**Gauges** — a snapshot metric like an active-jobs count is summed or averaged directly, no rate
needed, since the raw value already means something on its own:

```
sum(worker_jobs_active)
avg(worker_jobs_active)
```

**Counters** — always wrapped in `rate()` before being useful, e.g. failed jobs per second, filtered
down to the failure label first:

```
rate(jobs_processed_total{status="failure"}[5m])
```

**Summaries** — expose a `_count` and `_sum`; rate both and divide to get an average (e.g. average
delay added by a "slow mode" toggle):

```
rate(app_slow_mode_delay_seconds_sum[5m]) / rate(app_slow_mode_delay_seconds_count[5m])
```

**Histograms** — rate the `_bucket` series to see how the distribution is shifting over time, then
call `histogram_quantile()` for a specific percentile, e.g. the 90th-percentile response time:

```
histogram_quantile(0.90, rate(request_latency_seconds_bucket[5m]))
```

## What's Not Covered Yet

`idelta()`, `predict_linear()`, `label_replace()`, and `absent()` all have zero source material in
this book — rather than invent usage for them, they're flagged here as a known gap to fill once
there's a real worked example to adapt.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
