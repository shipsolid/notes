---
title: "3 — Aggregation Operators"
description: "The PromQL aggregation operator table, the by clause, the without clause, and worked collapsing examples across single and multiple labels."
tags: ["prometheus", "promql", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-17"
relations:
  - slug: prometheus/05-promql-masterclass/01-promql-fundamentals/01-promql-fundamentals
    kind: depends_on
---

# 3 — Aggregation Operators

[[01-promql-fundamentals|Selectors and matchers]] narrow down _which_ time series a query returns,
but they don't reduce _how many_ there are. Aggregation operators do the opposite job: they take an
instant vector and collapse it down to a new instant vector with fewer elements — a total, an
average, a top-N, a count — across whichever labels you choose.

## The Operator Table

| Aggregator     | Description                                   |
| -------------- | --------------------------------------------- |
| `sum`          | Sum over dimensions                           |
| `min`          | Select the minimum over dimensions            |
| `max`          | Select the maximum over dimensions            |
| `avg`          | Average over dimensions                       |
| `group`        | Every value in the resulting vector is `1`    |
| `stddev`       | Population standard deviation over dimensions |
| `stdvar`       | Population standard variance over dimensions  |
| `count`        | Count of elements in the vector               |
| `count_values` | Count of elements sharing the same value      |
| `bottomk`      | Smallest _k_ elements by sample value         |
| `topk`         | Largest _k_ elements by sample value          |
| `quantile`     | φ-quantile (0 ≤ φ ≤ 1) over dimensions        |

Applied with no further qualification, an aggregator collapses an entire vector down to a single
series. Take a request counter broken out by `method` and `path`:

```
http_requests
  {method="get",  path="/auth"}     3
  {method="post", path="/auth"}     1
  {method="get",  path="/user"}     4
  {method="post", path="/user"}     8
  {method="post", path="/upload"}   2
  {method="get",  path="/tasks"}    4
  {method="put",  path="/tasks"}    6
  {method="post", path="/tasks"}    1
  {method="get",  path="/admin"}    3
  {method="post", path="/admin"}    9
```

```
sum(http_requests)
  {} 41    # 3+1+4+8+2+4+6+1+3+9

max(http_requests)
  {} 9

avg(http_requests)
  {} 4.1
```

Every label is discarded and every series folded into one — useful for a single top-line number, but
too coarse for most real dashboards, which is exactly what `by` and `without` exist to fix.

## The `by` Clause

`by(<labels>)` tells the aggregator which labels to **keep** — every series sharing the same value
for those labels gets folded together, and everything else is dropped:

```
sum by(path) (http_requests)
  {path="/auth"}    4    # 3+1
  {path="/user"}    12   # 4+8
  {path="/upload"}  2    # 2
  {path="/tasks"}   11   # 4+6+1
  {path="/admin"}   12   # 3+9
```

```
sum by(method) (http_requests)
  {method="get"}   14   # 3+4+4+3
  {method="post"}  21   # 1+8+2+1+9
  {method="put"}   6    # 6
```

`by` accepts multiple labels, which narrows the grouping further rather than widening it — each
additional label splits the result into more distinct series, not fewer:

```
sum by(instance) (http_requests)
  {instance="node1"}  41    # 3+1+4+8+2+4+6+1+3+9
  {instance="node2"}  114   # 13+11+14+18+12+14+16+11+13+19

sum by(instance, method) (http_requests)
  {instance="node1", method="get"}   14  # 3+4+4+3
  {instance="node1", method="post"}  21  # 1+8+2+1+9
  {instance="node1", method="put"}   6   # 6
  {instance="node2", method="get"}   54  # 13+14+14+13
  {instance="node2", method="post"}  71  # 11+18+12+11+19
  {instance="node2", method="put"}   16  # 16
```

## The `without` Clause

`without(<labels>)` is the mirror image — it names the labels to **drop** rather than keep, and the
result groups by everything left over:

```
sum without(path) (http_requests)
  {instance="node1", method="get"}   7    # 3+4
  {instance="node1", method="post"}  2    # 1+1
  {instance="node1", method="put"}   6    # 6
  {instance="node2", method="get"}   27   # 13+14
  {instance="node2", method="post"}  71   # 11+18+12+11+19
  {instance="node2", method="put"}   22   # 11+11
```

`sum without(path) (http_requests)` aggregates on every label _except_ `path` — for this data set
that's exactly equivalent to `sum by(instance, method) (http_requests)`. The two clauses solve the
same problem from opposite directions: `by` is a keep-list, `without` is a drop-list, and which one
reads more clearly usually comes down to whether the metric has more labels you want than labels you
don't.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
