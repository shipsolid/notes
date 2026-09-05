---
title: "8 — Query Sharding"
description: "Splitting a single logical query into N independently-executable sub-queries that run in parallel and merge into one result — how Grafana Mimir and Loki answer high-cardinality queries within tight SLOs without adding more data shards."
tags: ["concepts", "distributed-systems", "observability", "promql", "maang-prep"]
updated: 2026-07-07
hidden: false
zettelId: "202607072030"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
  - slug: observability/10-observability-data-platforms/02-mimir/02-shards-workers
    kind: related
  - slug: observability/reference/mimir
    kind: depends_on
  - slug: observability/reference/loki
    kind: related
---

# 8 — Query Sharding

This is a specific, very common instance of [[04-1-fan-out-fan-in]] — parallelizing **one query**,
not partitioning **stored data**. It's easy to conflate with the shard concept in
[[02-shards-workers]], so let's separate the two first.

---

**Query sharding** is a technique where a single query is split into multiple smaller queries that
can be executed **in parallel** across different data partitions (shards), and the results are
merged into one final response.

It is one of the most common scalability techniques in distributed databases, search engines,
analytics systems, and observability platforms such as [[mimir|Grafana Mimir]], [[loki|Loki]],
Tempo, Elasticsearch, and ClickHouse.

---

## Simple analogy

Imagine a library with **100 million books**.

You ask:

> "Find every book written by Stephen King."

Instead of asking one librarian to search every shelf:

- Librarian A searches shelves 1–20
- Librarian B searches shelves 21–40
- Librarian C searches shelves 41–60
- ...

Everyone searches simultaneously.

Finally, one librarian combines all the results and gives you the answer.

That's query sharding.

---

## Without query sharding

Suppose your database stores data for 365 days.

You execute

```sql
SELECT *
FROM Logs
WHERE timestamp >= now() - 365d;
```

One server reads

```
Day 1
Day 2
Day 3
...
Day 365
```

Sequentially.

```
Client
   |
   |
Query
   |
Single Server
   |
Read entire dataset
```

This may take

```
30 seconds
```

---

## With query sharding

Instead, the coordinator divides the work.

```
Shard 1
Days 1-30

Shard 2
Days 31-60

Shard 3
Days 61-90

...
Shard 12
Days 331-365
```

Now all shards execute simultaneously.

```
                Query

                  |
          Query Coordinator
       /      |      |      \
      /       |      |       \
 Worker1  Worker2 Worker3 Worker12
```

Each worker processes only its own partition.

Finally

```
Merge Results
↓

Return to client
```

Instead of

```
30 sec
```

you might get

```
3 sec
```

---

## Where do shards come from?

Shards are simply partitions of the data.

For example

```
Logs

Shard A
January

Shard B
February

Shard C
March

...
```

or

```
Users

Shard 1
User IDs 1-100000

Shard 2
100001-200000

Shard 3
...
```

or

```
Metrics

Shard 1
service=A

Shard 2
service=B

Shard 3
service=C
```

---

## Example in Grafana Mimir

Suppose Prometheus has stored

```
365 days

2 billion samples
```

You run

```promql
sum(rate(http_requests_total[5m]))
```

for

```
Last 365 days
```

Without sharding

```
One querier

Reads all 2 billion samples
```

With query sharding

```
Querier

↓

Split into 24 time blocks

↓

Worker 1 → Jan
Worker 2 → Feb
Worker 3 → Mar
...
Worker 24
```

Each worker computes

```
Partial sum
```

The coordinator adds them

```
Final sum
```

Splitting by calendar month like this illustrates Mimir's **interval-splitting** middleware
(`-query-frontend.split-queries-by-interval`, default 24h) — it chunks a long time range for caching
and parallel dispatch. It is a different mechanism from Mimir's **query sharding** proper, which
hashes on the label set instead of time (see Kind 1 below). Production Mimir runs both together:
split by interval first, then shard each interval's sub-query by label hash.

---

## Example in Loki

Suppose you search

```
{namespace="prod"} |= "ERROR"
```

over

```
90 days
```

Loki can split the query into

```
Day 1-10

Day 11-20

Day 21-30

...
```

Each backend searches different chunks.

Then

```
Merge logs

Sort by timestamp

Return
```

---

## Example in Elasticsearch

Search

```
"database timeout"
```

Cluster

```
Shard 1
Shard 2
Shard 3
Shard 4
```

Each shard independently calculates

```
Top documents

Scores

Matches
```

Coordinator merges

```
Top 10 documents
```

---

## Example in distributed SQL

Suppose a sales table is partitioned by country.

```
India

USA

Japan

Germany
```

Query

```sql
SELECT SUM(sales)
FROM Orders;
```

Coordinator sends

```
Worker 1

SUM(India)

↓

Worker 2

SUM(USA)

↓

Worker 3

SUM(Japan)

↓

Worker 4

SUM(Germany)
```

Each returns

```
Partial sum
```

Coordinator computes

```
India +
USA +
Japan +
Germany
```

---

## How the coordinator works

```
Client

↓

Coordinator

↓

Split query

↓

Dispatch to workers

↓

Workers execute

↓

Collect partial results

↓

Merge

↓

Return response
```

The coordinator does not process the full dataset itself. It mainly:

1. Parses the query.
2. Determines the relevant shards.
3. Sends subqueries to workers.
4. Waits for responses.
5. Merges the results.
6. Returns the final answer.

---

## Advantages

- **Parallel execution**: Multiple workers process data simultaneously.
- **Lower latency**: Large queries finish faster.
- **Horizontal scalability**: Add more workers instead of making one server larger.
- **Better resource utilization**: CPU and memory usage is distributed.
- **Fault isolation**: A slow shard affects only part of the work (depending on the system's
  strategy).

---

## Trade-offs

- **Merge overhead**: Combining partial results takes time.
- **Network traffic**: Data must travel between workers and the coordinator.
- **Load imbalance**: If one shard contains much more data, it becomes the bottleneck.
- **Duplicate work**: Some queries (for example, global sorting or joins) require additional
  processing after the shard-level work.

---

## Query sharding vs. data sharding

These terms are related but describe different concepts.

| Data sharding                                                 | Query sharding                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| Splits **data** across multiple machines or partitions.       | Splits **one query** into multiple subqueries.                 |
| A storage technique.                                          | An execution technique.                                        |
| Usually decided when data is written.                         | Happens when a query is executed.                              |
| Example: January data on server A, February data on server B. | Example: A 12-month query becomes 12 parallel monthly queries. |

A system often uses **both** together. For example, **Grafana Mimir** stores metric blocks across
many partitions (data sharding) and, when you query a year of data, it splits that query into many
smaller time-range subqueries that run in parallel (query sharding). The combination allows the
system to scale to very large datasets while keeping query latency manageable.

[[02-shards-workers]] already covers this: a **shard** is a partition of the dataset, and a query
naturally fans out to whichever shards hold the relevant data.

**Query sharding** is a different, orthogonal idea:

> Take a single query — even one that only touches a small number of data shards — and split the
> **computation** of that query into N independent pieces that can run concurrently, then merge the
> partial results.

You can query-shard a query that hits exactly one data shard. You do it because the query itself
(not the storage layer) is the bottleneck — too many series to aggregate, too much CPU to spend on
one node, too tight an SLO to survive a single-threaded scan.

---

## The motivating problem

```
Query: sum(rate(http_requests_total[5m]))

Series matched: 50,000,000
SLO:            2s
Single querier: ~40s to scan and aggregate all series
```

One node cannot scan 50M series and stay under a 2s SLO. Adding more **data** shards doesn't
directly help either — the query still has to touch all of them and aggregate everything into one
number. What actually helps is splitting the _aggregation work itself_ across many workers.

---

## Kind 1 — label-based (horizontal) sharding

This is what Grafana Mimir's query-frontend does via AST rewriting (`astmapper`). The frontend
parses the PromQL query, injects a synthetic shard label, and rewrites it into N sub-queries.

Original:

```promql
sum(rate(http_requests_total[5m]))
```

Conceptually rewritten into 16 shards:

```promql
sum without(__query_shard__) (
    sum by(__query_shard__) (rate(http_requests_total{__query_shard__="1_of_16"}[5m]))
  or
    sum by(__query_shard__) (rate(http_requests_total{__query_shard__="2_of_16"}[5m]))
  or
    ...
  or
    sum by(__query_shard__) (rate(http_requests_total{__query_shard__="16_of_16"}[5m]))
)
```

Each series is assigned to exactly one shard by hashing its label set — the same series always lands
in the same shard, so results are deterministic. Each of the 16 sub-queries:

- touches roughly 1/16th of the matched series
- runs concurrently against the querier pool (this is the fan-out)
- returns a partial `sum`

The outer `sum without(__query_shard__)` is the fan-in: it merges 16 partial sums into one number.

```
Query: sum(rate(...))  [50M series]

           Query-Frontend (rewrite + dispatch)
                 │
   ┌──────┬──────┼──────┬ ... ┬──────┐
   ▼      ▼      ▼      ▼     ▼      ▼
 Shard1 Shard2 Shard3 Shard4 ... Shard16     ← ~3M series each, parallel
   │      │      │      │           │
   └──────┴──────┴──────┴───────────┘
                 │
              Merge (sum)
                 │
              Final result
```

40s of serial scanning becomes roughly 40s/16 ≈ 2.5s of parallel scanning plus merge overhead —
close enough to the 2s SLO to be viable, whereas the unsharded query never was.

---

## Kind 2 — time-based splitting

The second axis: split a long time range into smaller intervals, run each interval concurrently,
then stitch the results back together in time order. Both Loki's query-frontend (for LogQL) and
Mimir's query-frontend (`-query-frontend.split-queries-by-interval`, for PromQL) do this — it is not
a Loki-only technique. It composes with label-based sharding rather than replacing it: Mimir applies
interval-splitting first, then shards each interval's sub-query by label hash (Kind 1).

```
Query: {app="checkout"} |= "error"   over the last 30 days

Split into 24h intervals:

Day 1  Day 2  Day 3  ...  Day 30
 │      │      │           │
 ▼      ▼      ▼           ▼
Q1     Q2     Q3    ...   Q30      ← run in parallel

         │
   Stitch in time order
         │
    Final log stream
```

Time-based splitting is attractive because it's cheap to reason about (no label hashing, no
correctness subtleties around merge functions — see below) and it bounds how much data any single
sub-query has to scan, regardless of query shape.

---

## Which aggregations can be sharded safely?

This is the hard part — the same class of problem as merge correctness in the parent pattern's
[[04-1-fan-out-fan-in|Failure Handling]] section, applied to PromQL/LogQL semantics specifically.

| Operator                                          | Shardable as-is?  | Merge strategy                                                                                                                                         |
| ------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sum`, `count`, `min`, `max`                      | Yes               | Apply the same operator again at merge (associative, commutative)                                                                                      |
| `avg`                                             | No — must rewrite | Shard as `sum` and `count` separately; divide `sum/count` at merge                                                                                     |
| `topk` / `bottomk`                                | Partially         | Compute local `topk(k, ...)` per shard, then `topk(k, ...)` again at merge — never fewer than k candidates per shard                                   |
| `histogram_quantile`                              | No — must rewrite | Shard the underlying histogram **buckets** (which are additive), merge buckets, compute the quantile once at merge — never average per-shard quantiles |
| `rate`/`irate` over a shardable outer aggregation | Yes               | Push the `sum by(__query_shard__)` inside the rate calculation per series, same as the worked example above                                            |

The recurring trap: **anything that isn't associative/commutative over partial results cannot be
naively re-applied at merge time.** Averaging five per-shard P99s is not the same number as the true
global P99 — it's a common correctness bug in home-grown sharding implementations, and it fails
silently (no error, just a wrong number) rather than loudly.

---

## Diminishing returns — how many shards?

More shards ≠ always better, for the same reason fan-out width is a budget in the parent pattern:

- Each shard is a network round trip to a querier plus per-request overhead (connection setup,
  serialization, a child span). Below some series-per-shard threshold, this overhead dominates the
  actual scan time.
- The frontend's merge step still has to combine N partial results — at high shard counts the merge
  itself becomes non-trivial CPU work, echoing the aggregator-bottleneck failure mode from the
  parent pattern.
- A query matching 10,000 series gains little from 16-way sharding; a query matching 500 million
  series needs it just to finish inside the SLO.

Because of this, production systems (Mimir included) size the shard count **per query**, based on an
estimate of how many series the query will touch, rather than using one fixed global shard count for
every query. A cheap query stays unsharded; an expensive query gets sharded wide.

---

## Relation to fan-out-fan-in

Query sharding is the [[04-1-fan-out-fan-in]] pattern applied inside a query engine instead of
across microservices:

- **Dispatcher** = query-frontend, rewriting the AST and assigning shard labels or time windows
- **Workers** = queriers pulling their shard's series or interval
- **Aggregator** = the outer merge operator (`sum`, bucket-merge, or time-ordered stitch)

Everything that applies to the general pattern still applies here: the merge operator must be chosen
deliberately (associative/commutative or explicitly rewritten), the shard count is a budget sized to
the query's cost rather than a fixed constant, and per-shard latency should be instrumented
separately from merge latency so a slow querier isn't mistaken for a slow frontend — or vice versa.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
