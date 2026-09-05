---
title: "1 — PromQL Fundamentals"
description: "The four PromQL data types, label matchers and selectors, and how to run PromQL outside the Prometheus UI via the HTTP API."
tags: ["prometheus", "promql", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-19"
relations:
  - slug: prometheus/10-maang-interview-preparation/03-deep-dive-discussions/03-deep-dive-discussions
    kind: related
  - slug: prometheus/05-promql-masterclass/02-promql-functions/02-promql-functions
    kind: related
  - slug: prometheus/00-monitoring-foundations/02-time-series-fundamentals/02-time-series-fundamentals
    kind: depends_on
  - slug: prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality
    kind: related
---

# 1 — PromQL Fundamentals

PromQL — the **Prom**etheus **Q**uery **L**anguage — is the single interface Prometheus exposes for
reading back everything it has scraped. Every dashboard panel, every alert rule, and every recording
rule in this book compiles down to a PromQL expression. It is the mechanism for pulling metrics out
of the time series database, and the same expressions that render a graph in the web UI can also
drive alerting rules that notify an on-call engineer.

## Why PromQL, and Not SQL

Prometheus could, in principle, have exposed a SQL-like interface over its stored samples. It
didn't, because a relational query language is a poor fit for the shape of the data underneath it:
millions of independent, append-only `(timestamp, value)` streams identified by a label set, sampled
on a fixed interval and queried far more often than they're written by hand. PromQL is purpose-built
for that shape — range windows, rate-of-change, and per-label aggregation are first -class syntax
rather than something bolted onto `GROUP BY` and window functions. The fuller version of this
argument — the one worth having ready for an interview question like "why wouldn't you just put this
in Postgres" — lives in [[03-deep-dive-discussions|Deep-Dive Discussions]] rather than being
re-litigated here.

## The Four PromQL Data Types

Every PromQL expression evaluates to exactly one of four types:

| Type           | What it is                                                                                 | Example                      |
| -------------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| String         | A literal string value (currently unused by any built-in function)                         | `"some random text"`         |
| Scalar         | A single floating-point number, with no labels attached                                    | `54.743`                     |
| Instant Vector | A set of time series, each contributing exactly one sample, all sharing the same timestamp | `node_cpu_seconds_total`     |
| Range Vector   | A set of time series, each contributing a range of samples over a time window              | `node_cpu_seconds_total[3m]` |

**Instant vectors** are what a bare metric name returns — a snapshot, one row per distinct label
combination, all read at the same instant:

| Metric                   | Labels                          | Value     | Timestamp         |
| ------------------------ | ------------------------------- | --------- | ----------------- |
| `node_cpu_seconds_total` | `{cpu="0", instance="server1"}` | 258277.86 | March 3rd 11:05AM |
| `node_cpu_seconds_total` | `{cpu="1", instance="server1"}` | 448430.21 | March 3rd 11:05AM |
| `node_cpu_seconds_total` | `{cpu="0", instance="server2"}` | 941202.32 | March 3rd 11:05AM |
| `node_cpu_seconds_total` | `{cpu="1", instance="server2"}` | 772838.83 | March 3rd 11:05AM |

Every row above shares the same timestamp — that's the defining property of an instant vector.

**Range vectors** are what you get by appending a duration in square brackets — instead of one value
per series, every sample recorded inside that window comes back:

```
node_cpu_seconds_total[3m]
```

| Metric                   | Labels                          | Value     | Timestamp |
| ------------------------ | ------------------------------- | --------- | --------- |
| `node_cpu_seconds_total` | `{cpu="0", instance="server1"}` | 674478.07 | 08:05AM   |
|                          |                                 | 674626.76 | 08:06AM   |
|                          |                                 | 566873.04 | 08:07AM   |
| `node_cpu_seconds_total` | `{cpu="1", instance="server2"}` | 884597.02 | 08:05AM   |
|                          |                                 | 540071.18 | 08:06AM   |
|                          |                                 | 944799.49 | 08:07AM   |

A range vector selector is the raw material that rate-of-change and windowing functions (`rate()`,
`max_over_time()`, and friends, covered in [[02-promql-functions|PromQL Functions]]) consume — they
can't operate on an instant vector because there's nothing to compute a trend over.

## Selectors and Label Matchers

The simplest possible query is a metric name on its own — it returns **every** time series that
carries that name:

```
node_filesystem_avail_bytes
```

```
node_filesystem_avail_bytes{device="/dev/sda2", fstype="vfat", instance="node1", mountpoint="/boot/efi"}
node_filesystem_avail_bytes{device="/dev/sda3", fstype="ext4", instance="node1", mountpoint="/"}
node_filesystem_avail_bytes{device="tmpfs",     fstype="tmpfs", instance="node1", mountpoint="/run"}
node_filesystem_avail_bytes{device="tmpfs",     fstype="tmpfs", instance="node2", mountpoint="/run"}
```

To narrow that down to a subset, PromQL supports four label matchers inside the `{}` braces:

| Matcher | Meaning                                                             |
| ------- | ------------------------------------------------------------------- |
| `=`     | Exact match on a label value                                        |
| `!=`    | Negative equality — series whose label does **not** equal the value |
| `=~`    | Regular expression match                                            |
| `!~`    | Negative regular expression match                                   |

**Equality** — every series from `node1`:

```
node_filesystem_avail_bytes{instance="node1"}
```

**Negative equality** — every series where the device isn't `tmpfs`:

```
node_filesystem_avail_bytes{device!="tmpfs"}
```

**Regex** — every series whose device starts with `/dev/sda` (matches both `sda2` and `sda3`):

```
node_filesystem_avail_bytes{device=~"/dev/sda.*"}
```

Regex matchers use [RE2 syntax](https://github.com/google/re2/wiki/Syntax), the same engine used
throughout Go.

**Negative regex** — every series whose mountpoint does **not** start with `/boot`:

```
node_filesystem_avail_bytes{mountpoint!~"/boot.*"}
```

**Multiple selectors** combine with a comma — every filter must match:

```
node_filesystem_avail_bytes{instance="node1", device!="tmpfs"}
```

That returns everything from `node1` except its `tmpfs` mounts.

### Range Vector Selectors

Appending a duration in square brackets after any label selector turns an instant vector into a
range vector — the query below returns every sample of `node_arp_entries` on `node1` recorded in the
last two minutes, not just the latest one:

```
node_arp_entries{instance="node1"}[2m]
```

```
8 @1669253129.609
2 @1669253144.609
3 @1669253159.609
1 @1669253174.609   ─┐
7 @1669253189.609    │ 2 minutes of samples
7 @1669253204.609    │
7 @1669253219.609   ─┘
6 @1669253234.609
```

## Running PromQL Outside the Prometheus UI

The Graph tab in the Prometheus web UI is the easiest way to iterate on a query while learning it,
but it isn't the only — or even primary — way PromQL gets used in production. Prometheus exposes a
full HTTP API for executing queries, and that same API is what every external tool, including
Grafana, actually talks to.

### The `/api/v1/query` and `/api/v1/query_range` endpoints

An instant query — one snapshot, one timestamp — goes to `/api/v1/query` as a POST with the
expression in a `query` parameter:

```bash
curl <prometheus-host>:9090/api/v1/query \
  --data 'query=node_arp_entries{instance="192.168.1.168:9100"}'
```

Add a `time` parameter to evaluate the query as of a specific point in the past rather than now:

```bash
curl localhost:9090/api/v1/query \
  --data 'query=node_arp_entries{instance="192.168.1.168:9100"}' \
  --data 'time=1670380680.132'
```

Passing a range-vector expression (a metric with a `[duration]` suffix) returns every sample in that
window rather than a single point:

```bash
curl localhost:9090/api/v1/query \
  --data 'query=node_arp_entries{instance="192.168.1.168:9100"}[5m]' \
  --data 'time=1670382680.132'
```

For a genuine time series — many points, evenly spaced, suitable for plotting — the
`/api/v1/query_range` endpoint is the one to reach for instead of trying to stitch together repeated
instant queries: it takes `start`, `end`, and `step` parameters and returns a full range of
evaluated results, one per step, which is exactly what a graphing tool needs.

Reasons to go straight to the HTTP API instead of the built-in UI:

- Building a custom tool or internal dashboard that needs raw query results as JSON
- Wiring up a third-party integration that only speaks HTTP
- Scripting a one-off check without opening a browser at all

### Grafana as the usual API consumer

In practice, the most common consumer of this API isn't a hand-rolled script — it's Grafana. Grafana
connects to Prometheus as a data source by pointing at the same base URL this API lives on, and
every panel on a Grafana dashboard is, underneath its visualization, a PromQL expression sent to
`/api/v1/query_range`. Dashboards can be authored panel-by-panel, or imported wholesale from a JSON
file that already has the queries, panel layout, and visualization types defined — useful for
standing up a known-good dashboard (node metrics, container metrics, and so on) without rebuilding
every panel from scratch.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
