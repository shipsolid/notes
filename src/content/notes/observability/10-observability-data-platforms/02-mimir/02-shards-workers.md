---
title: "2 — Shards vs Workers"
description: "Clarifies the distinction between shards (persistent data partitions) and workers (execution units): workers fan out to query shards, each concept serves a different dimension of scale."
tags: ["concepts", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-06-30
hidden: false
zettelId: "202606302356"
relations:
  - slug: observability/02-metrics-engineering/08-query-optimization/08-query-sharding
    kind: related
  - slug: observability/13-reliability-and-sre-integration/05-incident-response/05-partial-results-vs-fail-fast
    kind: related
  - slug: observability/reference/mimir
    kind: related
---

# 2 — Shards vs Workers

This is a common point of confusion because **shards** and **workers** are different concepts, even
though both appear in distributed systems.

| Term       | What it is                                                  | Purpose                   |
| ---------- | ----------------------------------------------------------- | ------------------------- |
| **Shard**  | A partition of data                                         | Scale storage and queries |
| **Worker** | A unit of execution (thread, process, goroutine, container) | Perform work concurrently |

Let's look at each.

---

## 1. What is a shard?

A **shard** is simply **one piece of a larger dataset**.

Imagine you have 1 billion customer records.

Instead of storing them on one server:

```
Server 1

Customers:
1
2
3
...
1,000,000,000
```

you split the data across multiple servers.

```
Shard 1
Customers A–F

Shard 2
Customers G–M

Shard 3
Customers N–S

Shard 4
Customers T–Z
```

or

```
Shard 1
ID 1–250M

Shard 2
250M–500M

Shard 3
500M–750M

Shard 4
750M–1B
```

Each server owns **only a subset of the data**.

That's a **shard**.

---

### Why shard data?

Because one machine eventually becomes too slow or too full.

Instead of

```
One huge database
```

you have

```
Many smaller databases
```

which lets you

- store more data
- handle more traffic
- query in parallel

---

### Example: Search Engine

Suppose Google indexes

```
100 billion webpages
```

No single machine stores everything.

Instead

```
Search Request

↓

Shard 1
10 billion pages

Shard 2
10 billion pages

Shard 3
10 billion pages

...

Shard 10
10 billion pages
```

Each shard searches only its own data.

The coordinator merges the results.

```
User Search

↓

Query every shard

↓

Merge top results

↓

Return page
```

If one shard fails, you must decide:

- [[05-partial-results-vs-fail-fast|fail-fast]]
- partial results

That's exactly where the previous discussion applies.

---

## 2. What is a worker?

A **worker** executes work.

Think of workers as employees in a warehouse.

Suppose ten packages arrive.

Instead of one person packing all of them,

```
Worker 1
Worker 2
Worker 3
Worker 4
```

each handles one package.

In software:

- thread
- goroutine (Go)
- process
- container
- Lambda
- Kubernetes Pod

can all act as workers depending on the architecture.

---

### Python Example

Sequential:

```python
for url in urls:
    download(url)
```

Only one worker exists.

Now imagine four workers.

```
Worker 1 → download file A

Worker 2 → download file B

Worker 3 → download file C

Worker 4 → download file D
```

Everything happens simultaneously.

---

### Go Example

```go
for _, url := range urls {
    go download(url)
}
```

Each goroutine is a worker.

---

## Workers may query shards

This is where people mix them up.

Suppose your search API receives a request.

```
                User
                  |
                  v
            Search API
```

The API starts four workers.

```
Worker 1
Worker 2
Worker 3
Worker 4
```

Each worker contacts one shard.

```
                Search API

      Worker1 → Shard1

      Worker2 → Shard2

      Worker3 → Shard3

      Worker4 → Shard4
```

Notice:

- **Workers** are doing the work.
- **Shards** are where the data lives.

Workers are temporary execution units; shards are persistent data partitions.

---

## Another example: Grafana Loki

Imagine Loki stores logs across many shards.

```
Shard 1
Application A logs

Shard 2
Application B logs

Shard 3
Application C logs
```

A query arrives:

```
error
```

Loki starts multiple workers.

```
Worker 1 → searches Shard 1

Worker 2 → searches Shard 2

Worker 3 → searches Shard 3
```

Then combines the results.

---

## Another example: Prometheus / Mimir

Series are partitioned by a consistent hash of their label set — not by metric name or category.

```
Shard 1
Series hashing into range 1

Shard 2
Series hashing into range 2

Shard 3
Series hashing into range 3
```

Workers execute queries against each shard.

```
Worker 1 → Shard 1

Worker 2 → Shard 2

Worker 3 → Shard 3
```

See [[08-query-sharding]] for how [[mimir|Mimir]] actually derives these shards at query time (label
hashing via AST rewriting), plus the separate time-interval splitting it also applies.

---

## Simple analogy

Imagine a library.

The books are split into rooms.

```
Room A
Room B
Room C
Room D
```

These rooms are **shards**.

Now four librarians search simultaneously.

```
Librarian 1 → Room A

Librarian 2 → Room B

Librarian 3 → Room C

Librarian 4 → Room D
```

The librarians are **workers**.

If one librarian can't find the requested book because their room is closed:

- **Fail-fast:** "Sorry, we can't complete your request because one section is unavailable."
- **Best-effort:** "Here are the books we found from the other rooms."
- **Quorum:** Only relevant if the same book exists in multiple rooms (replicas), not if each room
  has different books.

### Key distinction

- **Shard = where the data is stored** (a partition of the dataset).
- **Worker = who performs the computation** (a thread, goroutine, process, pod, etc.).

In many systems, a single client request fans out into **multiple workers**, and each worker queries
a different **shard**. That's why discussions about partial results often mention both terms
together.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
