---
title: "4 — Vector Matching"
description: "How PromQL matches labels between two instant vectors — ignoring/on, one-to-one vs many-to-one/one-to-many with group_left/group_right — plus arithmetic, comparison, and logical operators."
tags: ["prometheus", "promql", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-20"
relations:
  - slug: prometheus/05-promql-masterclass/01-promql-fundamentals/01-promql-fundamentals
    kind: depends_on
  - slug: prometheus/06-alerting/02-alerting-rules/02-alerting-rules
    kind: related
---

# 4 — Vector Matching

Binary operators in PromQL don't only work between a vector and a [[01-promql-fundamentals|scalar]]
(`node_filesystem_avail_bytes < 1000`) — they also work between two instant vectors. That second
case is more subtle, because it raises a question a scalar operation never has to answer: _which_
sample on the left pairs up with _which_ sample on the right?

## Matching Rule: Identical Labels

The default rule is simple to state and easy to get wrong in practice — **samples with exactly the
same label set get matched together.** Given two related gauges:

```
node_filesystem_avail_bytes{instance="node1", job="node", mountpoint="/home"}   512
node_filesystem_avail_bytes{instance="node1", job="node", mountpoint="/var"}    484
node_filesystem_size_bytes{instance="node1", job="node", mountpoint="/home"}    1024
node_filesystem_size_bytes{instance="node1", job="node", mountpoint="/var"}     2048
```

```
node_filesystem_avail_bytes / node_filesystem_size_bytes * 100
  {instance="node1", job="node", mountpoint="/home"}   50
  {instance="node1", job="node", mountpoint="/var"}    23.6328125
```

Every label on both sides had to line up for that match to happen. Any difference at all breaks it —
a different `instance`, a different `mountpoint`, or even one extra label present on only one side
(say a stray `device="/dev/sda1"`) all produce **no match**, and the pair silently drops out of the
result rather than erroring.

This becomes a real problem the moment two metrics that should logically relate to each other don't
share the same label set:

```
http_errors
  {method="get",  code="500"}   40
  {method="get",  code="404"}   77
  {method="put",  code="501"}   23
  {method="post", code="500"}   61
  {method="post", code="404"}   42

http_requests
  {method="get"}    421
  {method="del"}    288
  {method="post"}   372
```

`http_errors` carries two labels (`method`, `code`); `http_requests` carries only one (`method`).
Trying to divide the two directly fails to match anything:

```
http_errors{code="500"} / http_requests    →  no match
```

## `ignoring` / `on`

Two keywords let you override the default all-labels-must-match rule.

**`ignoring(<labels>)`** tells PromQL to disregard the named labels when deciding whether two series
match:

```
http_errors{code="500"} / ignoring(code) http_requests
  {method="get"}    0.0950   # 40 / 421
  {method="post"}   0.1612   # 60 / 372
```

Series with `method="put"` or `method="del"` have no counterpart on the other side and simply don't
appear in the output.

**`on(<labels>)`** is the inverse — instead of naming labels to ignore, it names the _exact_ list of
labels to match on, and everything else is disregarded:

```
http_errors{code="500"} / on(method) http_requests
```

That's equivalent to the `ignoring(code)` version above whenever `method` and `code` are the only
two labels in play — `on(method)` and `ignoring(code)` express the same intent from opposite
directions.

A clearer illustration with fully synthetic vectors:

```
vector1                            vector2
{cpu=0, mode=idle}    4            {cpu=1, mode=steal}  4   # no counterpart in vector1
{cpu=1, mode=iowait}  7            {cpu=2, mode=user}   7
{cpu=2, mode=user}    2            {cpu=0, mode=idle}   2
```

```
vector1{} + on(cpu) vector2{}          = {cpu=0} 6
vector1{} + ignoring(mode) vector2{}   = {cpu=1} 11
                                          {cpu=2} 9
```

The resulting vector keeps whatever labels were listed in `on(...)`, or everything _not_ listed in
`ignoring(...)`.

## One-to-One Matching

One-to-one is the default matching cardinality: every element on the left side of the operator looks
for exactly one matching element on the right.

```
vector1                      vector2
{cpu=0, mode=idle}  2        {cpu=0, mode=idle}  4
{cpu=0, mode=user}  5        {cpu=0, mode=user}  6
{cpu=0, mode=user}  1        {cpu=0, mode=user}  3
{cpu=0, mode=user}  7        {cpu=0, mode=user}  3
```

```
= {cpu=0, mode=idle}  6
  {cpu=0, mode=user}  11
  {cpu=0, mode=user}  4
  {cpu=0, mode=user}  10
```

## Many-to-One / One-to-Many

Sometimes the relationship genuinely isn't one-to-one — one side legitimately has fewer, broader
series than the other:

```
many                                  one
{error=400, path=/cats}  2            {path=/cats}  2
{error=500, path=/cats}  5            {path=/dogs}  7
{error=400, path=/dogs}  1
{error=500, path=/dogs}  7
```

Trying a plain match here refuses to run:

```
http_errors + on(path) http_requests

Error executing query: multiple matches for labels: many-to-one matching must be explicit (group_left/group_right)
```

PromQL treats an ambiguous many-to-one match as a hard error rather than silently picking one — the
intent has to be spelled out explicitly with `group_left` or `group_right`.

**`group_left`** tells PromQL that the right-hand side is the "one" and the left-hand side is the
"many" — each element on the right can now match multiple elements on the left:

```
http_errors + on(path) group_left http_requests

= {error=400, path=/cats}   4
  {error=500, path=/cats}   7
  {error=400, path=/dogs}   8
  {error=500, path=/dogs}   14
```

**`group_right`** is the mirror image — the left-hand side is the "one," and elements on the left
now match multiple elements on the right:

```
one                                    many
{path=/cats}  2                        {error=400, path=/cats}  2
{path=/dogs}  7                        {error=500, path=/cats}  5
                                        {error=400, path=/dogs}  1
                                        {error=500, path=/dogs}  7

http_requests + on(path) group_right http_errors

= {error=400, path=/cats}   4
  {error=500, path=/cats}   7
  {error=400, path=/dogs}   8
  {error=500, path=/dogs}   14
```

The rule of thumb: whichever side has the coarser, "one" label set goes on the side named by
`group_left`/`group_right` — `group_left` when the many side is on the left, `group_right` when the
many side is on the right.

## Operators

### Arithmetic Operators

| Operator | Description    |
| -------- | -------------- |
| `+`      | Addition       |
| `-`      | Subtraction    |
| `*`      | Multiplication |
| `/`      | Division       |
| `%`      | Modulo         |
| `^`      | Power          |

```
node_memory_Active_bytes{instance="node1"}          2204815360
node_memory_Active_bytes{instance="node1"} + 10      2204815370
```

One consequence worth internalizing: when a scalar or another vector is combined with an instant
vector via an arithmetic operator, the metric name is dropped from the result — the output is no
longer considered "the same metric," just an unnamed set of labeled values:

```
node_memory_Active_bytes
  {instance="node1", job="node"}   2204844032

node_memory_Active_bytes / 1024
  {instance="node1", job="node"}   2153168     # kilobytes, metric name gone
```

### Comparison Operators

| Operator | Description      |
| -------- | ---------------- |
| `==`     | Equal            |
| `!=`     | Not equal        |
| `>`      | Greater than     |
| `<`      | Less than        |
| `>=`     | Greater or equal |
| `<=`     | Less or equal    |

By default, comparison operators **filter** — they return only the series that satisfy the
condition, with their original values intact:

```
node_network_flags > 100
  {device="enp0s3", instance="node1", job="node"}   5000
  {device="enp0s3", instance="node2", job="node"}   4800
```

Appending the `bool` modifier changes that behavior: instead of filtering, every series is kept and
the value is replaced with `1` (true) or `0` (false) — the shape used almost universally in
[[02-alerting-rules|alerting rules]], where you want a series to exist regardless of whether the
condition is currently true:

```
node_filesystem_avail_bytes < bool 1000
  {device="/dev/sda2", mountpoint="/boot/efi"}    0
  {device="/dev/sda3", mountpoint="/"}             0
  {device="tmpfs",     mountpoint="/run"}          1
  {device="tmpfs",     mountpoint="/run/lock"}     0
  {device="tmpfs",     mountpoint="/run/snapd/ns"} 1
```

### Binary Operator Precedence

When an expression chains multiple binary operators, PromQL resolves them by precedence, highest to
lowest:

1. `^`
2. `*`, `/`, `%`, `atan2`
3. `+`, `-`
4. `==`, `!=`, `<=`, `<`, `>=`, `>`
5. `and`, `unless`
6. `or`

Operators sharing a precedence level are left-associative — `2 * 3 % 2` evaluates as `(2 * 3) % 2`.
`^` is the one exception, right-associative instead: `2 ^ 3 ^ 2` evaluates as `2 ^ (3 ^ 2)`.

### Logical Operators

PromQL has three set-style logical operators, all of which operate between two instant vectors:
`and`, `or`, and `unless`.

**`and`** keeps only the left-hand series that also have a matching series on the right:

```
node_filesystem_avail_bytes > 1000 and node_filesystem_avail_bytes < 3000
  {mountpoint="/var"}   1771
  {mountpoint="/home"}  2872
```

**`or`** returns every left-hand series, plus any right-hand series that had no match on the left:

```
node_filesystem_avail_bytes < 500 or node_filesystem_avail_bytes > 70000
  {mountpoint="/etc"}   421
  {mountpoint="/opt"}   80012
```

**`unless`** is the set-difference operator — it keeps left-hand series for which there is **no**
matching series on the right:

```
node_filesystem_avail_bytes > 1000 unless node_filesystem_avail_bytes > 30000
  {mountpoint="/var"}   1771
  {mountpoint="/home"}  2872
```

That reads as "everything above 1000, except anything that's also above 30000."

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
