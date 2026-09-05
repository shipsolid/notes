---
title: "9 — Fan-Out Metrics and Trace Shape"
description: "The Prometheus metrics that instrument a fan-out pattern (width, shard latency, aggregation, partial results, cancelled workers, hedged requests), the OTel trace waterfall shape that reveals the tail shard, and when requests fan out to multiple shards vs route to a single one."
tags: ["concepts", "distributed-systems", "observability", "maang-prep"]
updated: 2026-07-01
hidden: false
zettelId: "202607010006"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-2-fan-out-olly-kpis
    kind: related
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
  - slug: observability/10-observability-data-platforms/02-mimir/02-shards-workers
    kind: related
  - slug: observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend
    kind: related
---

# 9 — Fan-Out Metrics and Trace Shape

One thing that confuses many people is that these metrics are **not automatically available**. They
are **application-level business metrics** that the developer (or platform team) instruments into
the code.

Let's use a realistic example.

---

## Example: Amazon Search

Suppose a customer searches for:

> **"wireless headphones"**

The Search API receives the request.

Instead of one database, the data is spread across **5 shards**.

```
                Search API
                     │
        ┌──────┬─────┼──────┬──────┐
        │      │     │      │      │
     Shard1 Shard2 Shard3 Shard4 Shard5
```

The Search API sends **5 requests simultaneously**.

This is a **[[04-1-fan-out-fan-in|fan-out]]**.

---

## When will you see `fan_out_width_total`?

Suppose every request is split into 5 shards.

```
Request 1
 ├──Shard1
 ├──Shard2
 ├──Shard3
 ├──Shard4
 └──Shard5
```

Developer records

```
fan_out_width_total{service="search",operation="search"} 5
```

Meaning

> Every search request fans out into 5 workers.

If tomorrow data grows and there are 20 shards,

```
fan_out_width_total = 20
```

This metric tells you how much parallel work every request creates.

---

## When will you see `fan_out_shard_latency_seconds`?

Every shard responds at different speeds.

```
Shard1   25 ms
Shard2   31 ms
Shard3   19 ms
Shard4   420 ms   ← Slow
Shard5   28 ms
```

The application records

```
fan_out_shard_latency_seconds{shard_id="1"}
fan_out_shard_latency_seconds{shard_id="2"}
...
```

Over time, Prometheus builds histograms.

Grafana might show

```
P99

Shard1 30ms
Shard2 35ms
Shard3 22ms
Shard4 430ms   ← problem
Shard5 31ms
```

Immediately you know:

> Shard 4 is the slow shard.

---

## When will you see `fan_out_aggregation_latency_seconds`?

After all workers return,

the parent still has work to do.

For example:

```
Shard1 -> 100 products
Shard2 -> 90 products
Shard3 -> 120 products
Shard4 -> 80 products
Shard5 -> 110 products
```

Now the Search API must

- combine results
- remove duplicates
- rank
- sort
- return top 20

That processing might take

```
18 ms
```

Developer records

```
fan_out_aggregation_latency_seconds = 18ms
```

If this suddenly becomes

```
220 ms
```

the bottleneck isn't the shards—it's the aggregation logic.

---

## When will you see `fan_out_partial_result_total`?

Suppose

```
Shard1 ✓
Shard2 ✓
Shard3 ✗ Timeout
Shard4 ✓
Shard5 ✓
```

Instead of failing the request,

the service returns

```
Results from 4 shards
```

This is a **partial result**.

Developer records

```
fan_out_partial_result_total{
    reason="timeout"
}
```

Later Grafana may show

```
Timeout partial results

10 yesterday

150 today
```

Meaning

> One or more shards are frequently failing.

---

## When will you see `fan_out_cancelled_worker_total`?

Imagine the client waits only

```
200 ms
```

Timeline

```
Shard1 30ms
Shard2 45ms
Shard3 40ms
Shard4 500ms
Shard5 35ms
```

At

```
200ms
```

the client gives up.

The parent cancels everything.

```
Parent
   │
   ├──Worker1 ✓
   ├──Worker2 ✓
   ├──Worker3 ✓
   ├──Worker4 CANCELLED
   └──Worker5 ✓
```

Developer increments

```
fan_out_cancelled_worker_total++
```

If this metric keeps increasing,

either

- deadlines are too aggressive, or
- some shard is consistently slow.

That's why the alert says:

```
fan_out_cancelled_worker_total rising
```

Then you check

```
fan_out_shard_latency_seconds
```

and usually find

```
Shard4 P99 = 480ms
```

---

## When will you see `fan_out_hedged_requests_used_total`?

Suppose

Normally

```
Shard4 = 25ms
```

Sometimes

```
Shard4 = 800ms
```

After waiting 50 ms,

the system sends another request to a replica.

```
Original -----> Replica A

                 50ms later

Duplicate -----> Replica B
```

Replica B finishes first.

The application uses Replica B's answer and cancels Replica A.

Developer records

```
fan_out_hedged_requests_used_total++
```

This metric tells you

> How often slow replicas forced us to send backup requests.

A sudden increase may indicate growing tail latency in the storage or service layer.

---

## When would you see these metrics in Grafana?

Imagine a dashboard during an incident:

| Metric                             |           Value | Interpretation                            |
| ---------------------------------- | --------------: | ----------------------------------------- |
| fan_out_width_total                |               5 | Each request queries 5 shards             |
| fan_out_cancelled_worker_total     | 2/min → 500/min | Many workers are being cancelled          |
| fan_out_partial_result_total       |     0 → 120/min | Users are receiving incomplete results    |
| fan_out_shard_latency P99 (Shard4) |  30 ms → 650 ms | Shard 4 is the bottleneck                 |
| fan_out_aggregation_latency        |           15 ms | Aggregation is healthy                    |
| fan_out_hedged_requests_used_total | 3/min → 250/min | Backup requests are being used frequently |

From this dashboard alone, you could conclude:

- The aggregator is functioning normally.
- Shard 4 is experiencing high latency.
- Parent requests are timing out and cancelling slow workers.
- Partial results are increasing because of those timeouts.
- Hedged requests are masking some of the latency but at the cost of extra load.

### The trace shape

If the service is instrumented with OpenTelemetry, a trace for one request would look like this:

```text
Parent Request Span (Search API)
│
├── Worker Span (Shard 1)  25 ms
├── Worker Span (Shard 2)  31 ms
├── Worker Span (Shard 3)  19 ms
├── Worker Span (Shard 4) 420 ms  ← longest child span
├── Worker Span (Shard 5)  28 ms
└── Aggregation Span        18 ms
```

In a trace waterfall, the longest child span immediately identifies the **tail shard** that is
delaying the overall request. This is exactly the trace pattern interviewers often expect you to
describe when discussing fan-out architectures.

## Is this realistic?

Yes. This is realistic, but the key concept you're missing is **why data is sharded in the first
place**.

A request does **not** fan out because someone arbitrarily decided to send it to 20 places. It fans
out because **the required data is physically distributed across multiple machines**.

Let's build the intuition.

---

## Start with one database

Suppose you're building a small e-commerce site.

All products live in one database.

```text
                Search API
                     │
                     ▼
              Products Database
```

A search request

> "wireless headphones"

goes to one database.

No fan-out.

---

## The database becomes too large

Now your company has:

- 500 million products
- millions of users
- tens of thousands of searches per second

One database server can no longer:

- store everything
- answer queries fast enough
- handle all the traffic

So you **partition (shard)** the data.

---

## Now there are 5 shards

Instead of one huge database:

```text
          Products

        ┌──────────┐
        │ Shard 1  │
        ├──────────┤
        │ Shard 2  │
        ├──────────┤
        │ Shard 3  │
        ├──────────┤
        │ Shard 4  │
        └──────────┘
        │ Shard 5  │
```

Each shard stores **different products**.

Example

```text
Shard1
A-D

Shard2
E-H

Shard3
I-L

Shard4
M-R

Shard5
S-Z
```

---

## Now what happens?

User searches

> "wireless headphones"

Which shard has it?

Could be:

- Shard1
- Shard2
- Shard3
- Shard4
- Shard5

The Search API doesn't know.

So it asks **every shard simultaneously**.

```text
Search API

 ├──Shard1
 ├──Shard2
 ├──Shard3
 ├──Shard4
 └──Shard5
```

This is fan-out.

---

## Is this actually how companies do it?

Sometimes.

But there are **different sharding strategies**.

---

### Strategy 1 — Broadcast search (fan-out)

Search engines often broadcast the query.

```text
Search

     "headphones"

        │
        ▼

Shard1
Shard2
Shard3
Shard4
Shard5
```

Each shard returns its best matches.

The Search API merges them.

This is exactly what:

- Elasticsearch
- OpenSearch
- Solr

do internally.

If you have 50 shards, the coordinator node really may send the search to all 50 relevant shards.

---

### Strategy 2 — Route to one shard

Suppose you're fetching

```
Customer ID = 12345
```

The system computes:

```
12345 % 5 = 0
```

Therefore

```
Shard 0
```

Only one shard is queried.

No fan-out.

Many user profile, banking, and order services use this approach.

---

### Strategy 3 — Partial fan-out

Suppose data is partitioned by region.

```text
Shard1  US-East

Shard2  US-West

Shard3  Europe

Shard4  India

Shard5  Japan
```

If the user searches

```
Hotels in Pune
```

Only the India shard is queried.

No need to contact the others.

---

## So when do we really fan out to 20 shards?

Very commonly in search systems.

For example:

```text
Amazon Search

Search Coordinator

        │

 ├──Shard1
 ├──Shard2
 ├──Shard3
 ...
 ├──Shard20
```

Each shard indexes a subset of products.

Each shard returns:

```
Top 100 matches
```

The coordinator merges them into

```
Top 100 overall
```

This is called **scatter-gather**, a classic distributed search pattern.

---

## Another example: Log search

Think about Grafana Loki or Elasticsearch.

You search:

```
error AND payment
last 24 hours
```

Logs may be split across many storage nodes or time partitions.

The query fans out:

```text
Query Frontend

   │

 ├──Store1
 ├──Store2
 ├──Store3
 ├──Store4
 └──Store5
```

Each store searches its local data.

Results are merged.

This is exactly how large-scale log systems achieve performance.

---

## Since you're an Observability Architect

You'll encounter this pattern frequently in systems such as:

- **Grafana Mimir**: A query frontend fans out PromQL queries to multiple queriers, which in turn
  fetch data from distributed storage.
- **Grafana Loki**: Query frontends split and distribute log queries across ingesters and
  store-gateways.
- **Elasticsearch/OpenSearch**: A coordinating node sends search requests to all relevant index
  shards and merges the results.
- **Apache Cassandra**: Reads may contact multiple replicas depending on the requested consistency
  level.
- **Bigtable, HBase, ScyllaDB**: Range scans can span multiple tablets or partitions.

### The important distinction

You're mixing two different ideas:

- **Data partitioning (sharding)**: Data is split across machines so the system can scale.
- **Fan-out**: A single request is sent to multiple machines because the data needed for that
  request spans multiple partitions.

Not every sharded system fans out every request. Point lookups often go to a single shard, while
search, analytics, dashboards, and distributed queries commonly fan out to many shards.
Understanding **when** a request can be routed directly versus **when** it must gather results from
multiple partitions is a fundamental system design concept.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
