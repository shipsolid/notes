---
title: "1 — Metrics Deep Dive"
description: "The four Prometheus metric types — Counter, Gauge, Histogram, Summary — walked through hands-on across a Linux batch app + Node Exporter and a Windows web app + Windows Exporter, plus the histogram_quantile bucket-math caveat and the Histogram-vs-Summary tradeoff."
tags: ["prometheus", "data-model", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-8"
relations:
  - slug: prometheus/00-monitoring-foundations/02-time-series-fundamentals/02-time-series-fundamentals
    kind: depends_on
  - slug: prometheus/03-instrumentation/02-exporters/02-exporters
    kind: related
  - slug: prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality
    kind: related
  - slug: observability/02-metrics-engineering/03-histograms-deep-dive/03-aggregation-composability
    kind: related
  - slug: prometheus/05-promql-masterclass/02-promql-functions/02-promql-functions
    kind: related
---

# 1 — Metrics Deep Dive

[[prometheus/00-monitoring-foundations/02-time-series-fundamentals/02-time-series-fundamentals|Time Series Fundamentals]]
previewed the four metric types in one line each. This chapter is where that preview gets cashed in:
real definitions, real `docker run` / exporter commands, and the bucket math that trips people up
when they try to turn a histogram into an SLO number.

This chapter is also the **single canonical home** for the hands-on walkthrough below. Other
chapters in this book that touch counters, gauges, histograms, or summaries link back here instead
of re-embedding the commands — so if you're looking for the exact container images and hostnames,
this is the page that has them.

## Two Demo Environments, One Metrics Format

The walkthrough runs two independent environments that happen to expose metrics through the exact
same HTTP-and-text-format mechanism, which is the point: Prometheus doesn't care whether it's
scraping a Linux container or a Windows exporter.

### Environment 1 — Linux batch app + Node Exporter

```
ssh ps-prom-ub1804
```

Run the batch processor (a .NET Core console app instrumented with the Prometheus client library):

```bash
docker run -d -p 8080:80 --name batch sixeyed/prometheus-demo-batch:linux

docker logs batch
```

Browse to `http://ps-prom-ub1804:8080/metrics`. You'll see custom application metrics
(`worker_jobs_active`, `worker_jobs_total`) alongside .NET runtime metrics
(`dotnet_total_memory_bytes`, `dotnet_collection_count_total`) — all in the same text exposition
format.

Now add server-level metrics with [[02-exporters|Node Exporter]]:

```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.0.0/node_exporter-1.0.0.linux-amd64.tar.gz

tar xvfz node_exporter-1.0.0.linux-amd64.tar.gz

cd node_exporter-1.0.0.linux-amd64/

./node_exporter
```

Browse to `http://ps-prom-ub1804:9100/metrics` for hardware/OS metrics:
`node_disk_io_time_seconds_total`, `node_cpu_seconds_total`, `node_filesystem_avail_bytes`, and the
info metric `node_uname_info`.

### Environment 2 — Windows web app + Windows Exporter

```
ssh Administrator@ps-prom-win2019
```

Run the web app (a .NET Core web app, same client library):

```bash
docker run -d -p 8080:80 --name web sixeyed/prometheus-demo-web:windows

docker logs web
```

Browse to `http://ps-prom-win2019:8080` (the app itself) and `http://ps-prom-win2019:8080/metrics`
(its metrics). You'll see `dotnet_total_memory_bytes` / `dotnet_collection_count_total` again, plus
`http_requests_received_total` (a counter with `method` and response-code labels) and
`http_request_duration_seconds` (a histogram of request-processing time).

Then hit the endpoint that deliberately adds latency, and re-check the metrics:

```
http://ps-prom-win2019:8080?slow
http://ps-prom-win2019:8080/metrics
```

Now `web_delay_seconds` (a summary of the injected delay) appears, and
`http_request_duration_seconds` shows the extra response time flowing through its buckets.

Add server-level metrics with Windows Exporter:

```powershell
iwr -useb -o windows_exporter-0.13.0-amd64.exe https://github.com/prometheus-community/windows_exporter/releases/download/v0.13.0/windows_exporter-0.13.0-amd64.exe

.\windows_exporter-0.13.0-amd64.exe
```

This needs firewall access on the default port `9182`. Browse to
`http://ps-prom-win2019:9182/metrics` — there's a lot there, so filter it down:

```powershell
.\windows_exporter-0.13.0-amd64.exe --collectors.enabled "os,cpu,logical_disk"
```

Refresh `http://ps-prom-win2019:9182/metrics` and you'll find
`windows_logical_disk_read_seconds_total` / `windows_logical_disk_write_seconds_total` (counters
with a volume-name label), `windows_cpu_time_total` (labels for core and work mode),
`windows_logical_disk_free_bytes` (gauge), and the info metric `windows_os_info`.

With both environments running, four endpoints are live and consistent in format:

| Endpoint                              | What it exposes                           |
| ------------------------------------- | ----------------------------------------- |
| `http://ps-prom-ub1804:8080/metrics`  | Batch app — custom + .NET runtime metrics |
| `http://ps-prom-ub1804:9100/metrics`  | Node Exporter — Linux server metrics      |
| `http://ps-prom-win2019:8080/metrics` | Web app — custom + .NET runtime metrics   |
| `http://ps-prom-win2019:9182/metrics` | Windows Exporter — Windows server metrics |

## Counter

**Definition:** a value that only ever increases (or resets to zero when the process restarts). It
answers "how many times did X happen."

**When to use it:** anything you'd describe as a running total — requests served, jobs completed,
errors thrown, bytes written. If the question is "how many," reach for a counter and let `rate()` or
`increase()` turn the running total into a per-second or per-window figure at query time.

**Worked example:** in the batch app, `worker_jobs_total` is a counter with labels distinguishing
outcome (it only ever climbs — refresh `/metrics` a few times and watch the number go up, never
down). Node Exporter's `node_disk_io_time_seconds_total{device="sda"}` behaves the same way: it
accumulates seconds of disk I/O time on device `sda` and is only ever useful as a rate, not as a raw
number — nobody cares that a disk has spent 105 seconds doing I/O since boot, they care whether that
number is climbing faster this hour than last hour.

## Gauge

**Definition:** a value that can go up or down. It answers "what is X right now."

**When to use it:** current state — active connections, queue depth, memory in use, temperature. If
the value can legitimately decrease, it's a gauge, never a counter.

**Worked example:** `worker_jobs_active` in the batch app is a gauge — as jobs start and finish,
this number rises and falls, unlike the counter next to it. The same pattern shows up in
`dotnet_total_memory_bytes` (allocated managed memory goes up and down as the GC runs) and in Node
Exporter's `node_filesystem_avail_bytes{device, mountpoint}` (free disk space, reported in bytes,
typically shown in exponential notation for large filesystems). All three are "what is the value
right now," not "how many times has something happened."

## Histogram

**Definition:** observations bucketed into cumulative, configurable size boundaries, exposed as a
family of counters. It answers "how long or how big, distributed how."

**When to use it:** latency and size distributions where you need percentiles computed _after_ the
fact, at query time, potentially sliced by any label combination — and where you're willing to pick
bucket boundaries in advance and pay the storage cost of one time series per bucket.

**Worked example:** the web app's `http_request_duration_seconds` histogram uses boundaries like
`1ms`, `2ms`, `4ms`, `0.1s`, `0.25s`. Under normal load, nearly everything lands under 4ms; after
triggering `?slow`, one request lands in the 0.1s–0.25s bucket. On the wire, a histogram looks like
this (illustrative counts, same cumulative mechanics `http_request_duration_seconds_bucket`
produces):

```
http_request_duration_seconds_bucket{le="0.001"}  118
http_request_duration_seconds_bucket{le="0.002"}  142
http_request_duration_seconds_bucket{le="0.004"}  150
http_request_duration_seconds_bucket{le="0.1"}    150
http_request_duration_seconds_bucket{le="0.25"}   151
http_request_duration_seconds_bucket{le="+Inf"}   151
http_request_duration_seconds_sum                 0.62
http_request_duration_seconds_count               151
```

The critical thing to internalize: **buckets are cumulative**. The `le="0.004"` bucket counts every
request at or under 4ms — which includes everything already counted in `le="0.002"` and
`le="0.001"`. `+Inf` counts everything, so it equals `_count` (they can differ only if negative
observations are possible). Each `le` value is its own time series, which is why histograms cost
more than counters or gauges: more buckets means more series.

### Turning buckets into numbers

The `_count` metric is a counter, so query it as a rate, not a raw value:

```
rate(http_request_duration_seconds_count[5m])
```

Average latency over the same window divides the rate of the sum by the rate of the count:

```
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

The percentage of requests under a specific bucket boundary:

```
rate(http_request_duration_seconds_bucket{le="0.004"}[5m])
  / ignoring(le) rate(http_request_duration_seconds_count[5m])
```

And for percentiles rather than a fixed threshold, `histogram_quantile()` does the interpolation for
you:

```
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### The interpolation caveat that breaks SLO math

`histogram_quantile()` doesn't know the true distribution inside a bucket — it assumes observations
are spread evenly between the bucket below and the bucket it lands in, and linearly interpolates.
That approximation is fine for dashboards, but it is a real problem if you're trying to prove an SLO
was met.

If your SLO is "95% of requests under 0.5s" but your buckets are `0.1`, `0.2`, `0.5`, and
`histogram_quantile(0.95, ...)` returns `0.4`, that `0.4` could genuinely be anywhere between the
`0.2` and `0.5` boundaries — you cannot tell whether you cleared the SLO with room to spare or
barely scraped by. The fix is to **put a bucket exactly at the SLO threshold**. With a bucket at
`le="0.5"`, you can compute the exact fraction of requests at or under 0.5s directly (the
percentage-of-bucket query above) instead of trusting an interpolated quantile. What you still won't
get from that is _how far_ over or under the threshold the tail is — for that you'd need more
buckets clustered around the threshold, which trades accuracy for cardinality. Every extra `le`
bucket is another time series, so tightening bucket resolution has a direct cost in RAM, disk, and
query latency, particularly once you cross that with per-request labels like path or status code.

## Summary

**Definition:** like a histogram, a summary tracks how long or how big something is — but instead of
exposing bucket counters, it computes quantiles **client-side** and streams them out directly,
alongside a `_sum` and a `_count`.

**When to use it:** when you need an accurate quantile for a fixed, known set of percentiles and
can't tolerate the interpolation error histograms introduce — and when you're willing to accept that
those percentiles [[03-aggregation-composability|can't be aggregated across instances]] (a p95
computed on one process can't be averaged with a p95 from another to get a fleet-wide p95; a
histogram can).

**Worked example:** `web_delay_seconds` in the web app is a summary of the artificially injected
delay on `/?slow`. It exposes something like:

```
web_delay_seconds{quantile="0.5"}   0.011
web_delay_seconds{quantile="0.9"}   0.19
web_delay_seconds{quantile="0.99"}  0.24
web_delay_seconds_sum               1.8
web_delay_seconds_count             150
```

The `quantile` label reports the value **below which** that fraction of observations fell —
`quantile="0.9"` at `0.19` means 90% of observed delays were 0.19s or less. `_sum` and `_count`
behave exactly like a histogram's, so the same average-over-time query pattern applies:
`rate(web_delay_seconds_sum[5m]) / rate(web_delay_seconds_count[5m])`. The quantiles themselves,
though, were fixed by the client library when the metric was instrumented — you cannot ask for a
`quantile="0.95"` at query time if the app only exports `0.5`, `0.9`, and `0.99`.

## Histogram vs. Summary

|                        | Histogram                                                                   | Summary                                                                       |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Bucket/quantile choice | Bucket boundaries picked by the instrumenter, any quantile computable later | Quantiles must be decided ahead of time in the client                         |
| Client-library cost    | Low — just increments counters                                              | Higher — computes quantiles in-process                                        |
| Query-time flexibility | Any quantile, any aggregation across instances                              | Only the quantiles exported; cannot be meaningfully averaged across instances |
| Server-side cost       | Prometheus computes quantiles via `histogram_quantile()` at query time      | Minimal — the number is already computed                                      |

The short version: reach for a histogram by default because it's aggregatable and its cost lives on
the server, where you can see and manage it. Reach for a summary only when you need an accurate
fixed quantile the moment it's scraped and you don't need to aggregate it across instances.

## What's Not Covered Yet

Prometheus's **Native Histograms** (sparse, high-resolution histograms that don't require picking
bucket boundaries up front) and **Exemplars** (trace-ID pointers attached to histogram buckets) are
both real, current Prometheus features — but none of the source material this book draws from covers
either one, so they're named here honestly rather than described from guesswork.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
