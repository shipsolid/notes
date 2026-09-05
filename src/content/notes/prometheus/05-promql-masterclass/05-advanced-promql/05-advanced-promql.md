---
title: "5 — Advanced PromQL"
description: "The complete recording-rule syntax reference (rule files, worked example, level:metric_name:operations naming), the offset and @ modifiers, and subqueries."
tags: ["prometheus", "promql", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-16"
relations:
  - slug: prometheus/05-promql-masterclass/04-vector-matching/04-vector-matching
    kind: depends_on
  - slug: prometheus/05-promql-masterclass/02-promql-functions/02-promql-functions
    kind: depends_on
  - slug: prometheus/06-alerting/01-recording-rules/01-recording-rules
    kind: related
---

# 5 — Advanced PromQL

This chapter rounds out the PromQL masterclass with the pieces that don't fit cleanly into
selectors, functions, aggregation, or vector matching: pre-computing expressions ahead of time with
recording rules, reaching backward in time with offsets, and running an instant query over a sliding
window with subqueries.

## Recording Rules

A recording rule lets Prometheus periodically evaluate a PromQL expression on its own schedule and
store the result as a brand-new time series — instead of every dashboard panel or alert re-running
the same expensive expression from scratch on every load, it's computed once and read back cheaply
as a simple metric name. The two payoffs are speeding up dashboards that would otherwise re-run a
heavy aggregation on every refresh, and producing a pre-aggregated series that other rules or
dashboards can build on. This chapter is the authoritative syntax reference for recording rules for
the whole book — the _why and when_ to reach for one is covered separately
[[01-recording-rules|wherever alerting is discussed]], and that material links back here rather than
repeating the syntax.

### Wiring a Rule File into `prometheus.yml`

Recording rules don't live inline in the main config — they go in a separate **rule file**, which
`prometheus.yml` references by glob under `rule_files`:

```yaml
global:
  scrape_interval:     15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

One operational gotcha: changes to a rule file are **not** picked up automatically the way scrape
target changes can be via service discovery — Prometheus needs a restart (or a reload signal) to
notice a new or edited rule file.

### Rule File Structure

Every rule file is organized into one or more named **groups**, each holding an ordered list of
rules:

```yaml
groups:
  - name: <group name 1>
    interval: <evaluation interval>
    rules:
      - record: <rule name 1>
        expr: <promql expression 1>
        labels:
          <label name>: <label value>
      - record: <rule name 2>
        expr: <promql expression 2>
  - name: <group name 2>
    rules:
      ...
```

A few structural rules worth being precise about:

- **`interval`** — how often the group's rules are evaluated; if omitted, it falls back to the
  global `evaluation_interval`.
- **`record`** — the name of the new metric this rule produces.
- **`expr`** — the PromQL expression Prometheus evaluates on each tick to populate that metric.
- **`labels`** — optional; adds or overrides labels on the resulting series before it's stored.
- Rules **within a group** are evaluated **sequentially**, in the order they're declared — a later
  rule in the same group can reference the metric a rule above it just produced.

### Worked Example

Two expressions worth turning into recording rules — free memory percentage on a node, and free
filesystem space percentage:

```
100 - (100 * node_memory_MemFree_bytes / node_memory_MemTotal_bytes)
```

```
100 * node_filesystem_free_bytes / node_filesystem_avail_bytes
```

Rather than re-typing either expression every time, both become rules in a group:

```yaml
groups:
  - name: example1
    interval: 15s
    rules:
      - record: node_memory_memFree_percent
        expr: 100 - (100 * node_memory_MemFree_bytes / node_memory_MemTotal_bytes)
      - record: node_filesystem_free_percent
        expr: 100 * node_filesystem_free_bytes / node_filesystem_size_bytes
```

Once loaded, both rules show up in the Prometheus UI under **Status → Rules**, alongside Runtime &
Build information, Command-Line Flags, Configuration, Service Discovery, and TSDB Status — each
entry showing its last evaluation time and how long that evaluation took.

The recorded metrics are then queried exactly like any other metric — no special syntax required:

```
node_memory_memFree_percent
  {instance="192.168.1.168:9100", job="node"}   ...

node_filesystem_free_percent
  {device="/dev/sda3", instance="192.168.1.168:9100", job="node", mountpoint="/"}     ...
  {device="tmpfs",     instance="192.168.1.168:9100", job="node", mountpoint="/run"}  ...
```

Because a recording rule's output is a normal metric, later rules in the same group (or a later
group) can build on it — here a second rule averages the first rule's own output by instance:

```yaml
groups:
  - name: example1
    interval: 15s
    rules:
      - record: node_filesystem_free_percent
        expr: 100 * node_filesystem_free_bytes / node_filesystem_size_bytes{job="node"}
      - record: node_filesystem_free_percent_avg
        expr: avg by(instance) (node_filesystem_free_percent)
```

### Naming Convention: `level:metric_name:operations`

Prometheus's own documentation recommends a three-part naming scheme for recorded metrics, and it's
worth following mechanically rather than improvising:

```
level:metric_name:operations
```

- **`level`** — the aggregation level of the metric, expressed as the labels it still carries. This
  always includes the `job` label plus whatever other target labels survived the aggregation.
- **`metric_name`** — the underlying metric/time-series name the rule is derived from.
- **`operations`** — the functions and aggregators applied, in the order that matters (e.g. `rate5m`
  for a `rate(...)` over a 5-minute window).

Take an `http_errors` counter carrying two instrumentation labels, `method` and `path`:

```yaml
- record: job_method_path:http_errors:rate5m
  expr: sum without(instance) (rate(http_errors{job="api"}[5m]))
```

Both `method` and `path` are still present after the `sum without(instance)`, so the aggregation
level is `job_method_path`. The metric name is `http_errors`. The operation applied is `rate` over a
`5m` window, hence `rate5m`.

Drop `path` from the aggregation and the level shrinks to match:

```yaml
- record: job_method:http_errors:rate5m
  expr: sum without(instance, path) (rate(http_errors{job="api"}[5m]))
```

If `method` were dropped too, the level would collapse to just `job`. The name is a direct,
mechanical readout of what the `expr` actually does — anyone reading `job_method:http_errors:rate5m`
in a dashboard knows exactly what it means without opening the rule file.

### Best Practice: Group by Job

All the rules for a given job should live together in a single group, rather than spread across
multiple files or groups — it keeps the sequential-evaluation guarantee useful and makes a job's
full set of derived metrics discoverable in one place:

```yaml
groups:
  - name: node
    interval: <interval>
    rules:
      - record: job:node_memory_memFree_percent:avg
        expr: avg by(job) (100 - (100 * node_memory_MemFree_bytes{job="node"} / node_memory_MemTotal_bytes{job="node"}))
      # ...
```

## Offset Modifier

A plain query always returns the **current** value:

```
node_memory_Active_bytes{instance="node1"}     22259302   # most recent value
```

Appending `offset <duration>` after the label matchers shifts the query back in time instead:

```
node_memory_Active_bytes{instance="node1"} offset 5m      22259302   # value 5 minutes ago
```

### Time Units

| Suffix | Meaning          |
| ------ | ---------------- |
| `ms`   | Milliseconds     |
| `s`    | Seconds          |
| `m`    | Minutes          |
| `h`    | Hours            |
| `d`    | Days             |
| `w`    | Weeks            |
| `y`    | Years (365 days) |

```
node_memory_Active_bytes{instance="node1"} offset 5d      22259302
node_memory_Active_bytes{instance="node1"} offset 2w      44823311
node_memory_Active_bytes{instance="node1"} offset 1h30m   11864917
```

### The `@` Modifier

Where `offset` is relative ("N minutes/hours/days ago"), the `@` modifier pins a query to an
**absolute** Unix timestamp:

```
node_memory_Active_bytes{instance="node1"} @1663265188     22259302
```

`1663265188` corresponds to September 15, 2022, 6:06:28 PM GMT.

The two can be combined — `@` sets the anchor point, `offset` shifts relative to it:

```
node_memory_Active_bytes{instance="node1"} @1663265188 offset 5m     22259302
```

That returns the value 5 minutes before the anchor timestamp. Order between the two doesn't matter:

```
node_memory_Active_bytes{instance="node1"} @1663265188 offset 5m
= node_memory_Active_bytes{instance="node1"} offset 5m @1663265188
```

Both modifiers also apply to range vectors — get 2 minutes of data ending 10 minutes before the
anchor timestamp:

```
node_memory_Active_bytes{instance="node1"}[2m] @1663265188 offset 10m
```

## Subqueries

Some computations need a range vector as _input_ to a function that itself only accepts a range
vector — for a gauge, the maximum over a 10-minute window is a direct call:

```
max_over_time(node_filesystem_avail_bytes[10m])
```

But for a counter, what's usually wanted is the maximum _rate_ over that window, and this doesn't
work directly:

```
max_over_time(rate(http_requests_total[10m]))    # ERROR
```

`rate()` returns an instant vector, but `max_over_time()` expects a range vector as its argument —
the two don't compose without something in between to re-expand the instant result back into a
range. That's the gap subqueries close.

### Subquery Format

```
<instant_query> [<range>:<resolution>] [offset <duration>]
```

```
rate(http_requests_total[1m]) [5m:30s]
```

- `1m` — the sample range fed to `rate()`
- `5m` — the subquery's own range (pull data from the last 5 minutes)
- `30s` — the resolution/step at which the inner instant query is re-evaluated across that range

Wrapping the original problem in a subquery makes it valid:

```
max_over_time(rate(http_requests_total[1m])[5m:30s])
```

Read as: evaluate `rate(http_requests_total[1m])` every 30 seconds over the last 5 minutes, then
take the maximum of those evaluations.

```
rate(node_cpu_seconds_total[1m])[2m:10s]
```

Sampled every 10 seconds, over a 2-minute range.

## Joins

PromQL doesn't have a `JOIN` keyword, but the mechanism that plays the same role — matching samples
across two different metrics by their shared labels, with explicit control over cardinality via
`group_left`/`group_right` — is exactly vector matching. Rather than re-explain it here, see
[[04-vector-matching|Vector Matching]] for the full treatment of `ignoring`/`on` and one-to-one vs.
many-to-one matching.

## Query Optimization and Performance

Two habits from this book's own material carry most of the weight when it comes to query
performance. First, the ordering rule from [[02-promql-functions|PromQL Functions]]: always call
`rate()` before aggregating, never after — aggregating first destroys the per-series counter
information `rate()` needs to detect resets, so the two aren't interchangeable in cost or
correctness. Second, histogram cardinality is a direct cost lever: every additional `_bucket`
boundary is its own time series, so a histogram with too many buckets means higher active-series
count, higher RAM and disk usage on the Prometheus server, and slower writes — the accuracy gained
from an extra bucket has to be weighed against that cost, not assumed to be free. Everything below
the query layer — storage engine tuning, scrape performance, and TSDB-level knobs — belongs to
[[03-performance-tuning|Performance Tuning]], which isn't written yet; this section only covers
what's controllable from inside a PromQL expression itself.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
