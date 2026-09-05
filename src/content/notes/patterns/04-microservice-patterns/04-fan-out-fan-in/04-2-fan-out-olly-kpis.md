---
title: "Observability KPIs for the Fan-out / Fan-in Pattern"
description: "Observability KPIs for the Fan-out / Fan-in Pattern"
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607071933"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
  - slug: observability/06-opentelemetry/08-context-propagation/08-deadline-propagation
    kind: related
  - slug: observability/11-visualization/02-golden-signals/02-tail-latency
    kind: related
---

## Overview

The **[[04-1-fan-out-fan-in|Fan-out / Fan-in]]** pattern is a distributed systems design pattern
where a single incoming request is split into multiple parallel sub-requests (fan-out), and the
results are later aggregated into a single response (fan-in).

```
                   Client Request
                         |
                  Search Service
                         |
        +--------+--------+--------+--------+
        |        |        |        |        |
     Worker1  Worker2  Worker3  Worker4  Worker5
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                   Aggregator (Fan-in)
                         |
                    Final Response
```

Unlike a traditional service, the performance of a fan-out system depends on:

- Number of parallel workers
- Slowest worker
- Aggregation efficiency
- Partial failures
- Cancellation propagation
- Tail-latency mitigation

Generic RED metrics (Rate, Errors, Duration) are necessary but insufficient. A fan-out service
should expose additional pattern-specific telemetry.

---

## 1. Fan-out Width

### Metric

```text
fan_out_width{service,operation}
```

**Type**

Histogram

**Purpose**

Measures how many child requests are created for every parent request.

Example

```
Search Request

↓

20 shard requests
```

Fan-out width = **20**

This metric helps identify:

- Query amplification
- Routing issues
- Retry storms
- Shard count growth
- Unexpected increases in parallelism

Useful Grafana panels:

- Average fan-out width
- P95 fan-out width
- Histogram of width distribution

Example PromQL

```promql
histogram_quantile(
  0.95,
  sum(rate(fan_out_width_bucket[5m])) by (le)
)
```

---

## 2. Per-Shard Latency

### Metric

```text
fan_out_shard_latency_seconds{
    service,
    operation,
    shard_id
}
```

**Type**

Histogram

**Purpose**

Measures latency of each individual worker or shard.

Example

| Shard | Latency |
| ----- | ------- |
| 1     | 20 ms   |
| 2     | 18 ms   |
| 3     | 145 ms  |
| 4     | 22 ms   |

Although three shards are fast, the client waits for the slowest one.

This metric identifies:

- Hot partitions
- Slow databases
- Network issues
- Uneven workload distribution

Recommended labels

- service
- operation
- shard_id
- region
- availability_zone

Useful dashboards

- Heatmap
- Top slowest shards
- P95 latency by shard

---

## 3. Aggregation Latency

### Metric

```text
fan_out_aggregation_latency_seconds{
    service,
    operation
}
```

**Type**

Histogram

**Purpose**

Measures the time spent in the fan-in stage.

Aggregation often performs:

- Merge
- Sort
- Deduplication
- Ranking
- Filtering
- Response serialization

Example

```
Workers complete in

40 ms

Aggregation

150 ms

Total

190 ms
```

Without this metric, it is easy to incorrectly blame downstream services.

Useful dashboard

```
Total Request Time

├── Child Processing
└── Aggregation
```

---

## 4. Partial Result Count

### Metric

```text
fan_out_partial_result_total{
    service,
    operation,
    reason
}
```

**Type**

Counter

**Purpose**

Counts requests that returned partial responses.

Example

```
20 shards

↓

18 succeeded

2 timed out

↓

Client still receives response
```

Reasons might include

```
timeout

cancelled

quota

circuit_open

unavailable

hedged_loser
```

Without this metric, successful HTTP 200 responses may hide significant backend degradation.

Useful dashboard

- Partial response rate
- Partial responses by reason
- Trend over time

---

## 5. Cancelled Workers

### Metric

```text
fan_out_cancelled_worker_total{
    service,
    operation
}
```

**Type**

Counter

**Purpose**

Counts workers cancelled because the parent request expired or was cancelled.

Example

```
Client timeout

↓

Parent context cancelled

↓

Workers terminate immediately
```

This validates proper [[08-deadline-propagation|deadline propagation]].

A spike may indicate:

- Downstream slowdown
- Parent timeout reached
- Correct cancellation behavior during incidents

If parent requests time out but this metric remains zero, workers may be ignoring cancellation.

---

## 6. Hedged Requests

### Metric

```text
fan_out_hedged_requests_used_total{
    service,
    operation
}
```

**Type**

Counter

**Purpose**

Measures how often hedged requests were issued.

Hedging reduces [[02-tail-latency|tail latency]].

Example

```
Original request

↓

Taking too long

↓

Launch duplicate request

↓

First response wins

↓

Second response cancelled
```

Useful for monitoring

- Tail latency
- Replica imbalance
- Slow storage
- Overloaded shards

Increasing hedged requests often indicate degrading infrastructure before users notice failures.

---

## Recommended Additional Metrics

### Slowest Child Latency

```text
fan_out_max_child_latency_seconds{
    service,
    operation
}
```

Tracks the latency of the slowest child request.

Since overall request latency is constrained by the slowest worker, this is often the most important
latency metric.

---

### Straggler Count

```text
fan_out_stragglers_total{
    service,
    operation
}
```

Counts workers significantly slower than the median.

Example

```
Median worker

20 ms

Slow worker

400 ms

↓

Straggler detected
```

Useful for detecting:

- Hot partitions
- Resource contention
- Garbage collection pauses
- Network congestion

---

### Queue Wait Time

```text
fan_out_queue_wait_seconds{
    service,
    operation
}
```

Measures time spent waiting for an available worker.

High queue wait usually indicates:

- Worker pool exhaustion
- Downstream saturation
- Insufficient concurrency

---

### Worker Utilization

```text
fan_out_worker_utilization{
    service
}
```

Measures

```
Busy Workers
-------------
Total Workers
```

High utilization (>90%) often precedes latency increases.

---

### Deadline Exceeded

```text
fan_out_deadline_exceeded_total{
    service,
    operation
}
```

Counts parent requests that exceeded their deadline.

Useful for SLO monitoring.

---

### Retry Count

```text
fan_out_retry_total{
    service,
    operation
}
```

Tracks retries performed by workers.

An increasing retry rate often signals downstream instability before outright failures occur.

---

### Success Ratio

Derived metric

```
Successful Child Requests
-------------------------
Total Child Requests
```

Example

```
98 / 100

=

98%
```

Useful for measuring graceful degradation.

---

## Recommended Metric Types

| Metric                              | Type      |
| ----------------------------------- | --------- |
| fan_out_width                       | Histogram |
| fan_out_shard_latency_seconds       | Histogram |
| fan_out_aggregation_latency_seconds | Histogram |
| fan_out_queue_wait_seconds          | Histogram |
| fan_out_max_child_latency_seconds   | Histogram |
| fan_out_partial_result_total        | Counter   |
| fan_out_cancelled_worker_total      | Counter   |
| fan_out_hedged_requests_used_total  | Counter   |
| fan_out_retry_total                 | Counter   |
| fan_out_deadline_exceeded_total     | Counter   |
| fan_out_stragglers_total            | Counter   |

---

## Example Grafana Dashboard

### Row 1 — Overview

- Request Rate
- Error Rate
- P95 Latency
- P99 Latency
- Availability

---

### Row 2 — Fan-out

- Fan-out Width Distribution
- Average Width
- Queue Wait
- Worker Utilization

---

### Row 3 — Child Requests

- P95 Latency by Shard
- Heatmap
- Top Slowest Shards
- Retry Rate

---

### Row 4 — Aggregation

- Aggregation Latency
- Aggregation CPU
- Merge Size

---

### Row 5 — Resilience

- Partial Result Rate
- Cancelled Workers
- Deadline Exceeded
- Hedged Requests

---

### Row 6 — Resources

- CPU
- Memory
- Goroutines / Threads
- Active Connections

---

## Example Metrics

```text
fan_out_width{service,operation}

fan_out_shard_latency_seconds{
    service,
    operation,
    shard_id
}

fan_out_aggregation_latency_seconds{
    service,
    operation
}

fan_out_partial_result_total{
    service,
    operation,
    reason
}

fan_out_cancelled_worker_total{
    service,
    operation
}

fan_out_hedged_requests_used_total{
    service,
    operation
}

fan_out_max_child_latency_seconds{
    service,
    operation
}

fan_out_queue_wait_seconds{
    service,
    operation
}

fan_out_retry_total{
    service,
    operation
}

fan_out_deadline_exceeded_total{
    service,
    operation
}

fan_out_stragglers_total{
    service,
    operation
}
```

---

## Key Takeaways

- Fan-out systems require **pattern-specific observability** beyond standard RED metrics.
- **Histograms** should be used for measurements such as latency, width, and queue wait time to
  enable percentile analysis.
- **Counters** are appropriate for events such as retries, cancellations, partial responses, and
  hedged requests.
- The **slowest child request** determines end-to-end latency, making per-shard latency one of the
  most valuable KPIs.
- Monitoring **aggregation latency** is essential, as the fan-in stage can become a bottleneck
  independent of downstream services.
- Metrics for **partial results**, **cancelled workers**, and **hedged requests** provide visibility
  into resilience mechanisms that are otherwise invisible in standard HTTP success rates.
- Combining these metrics with **distributed tracing** and **RED/USE methodologies** provides a
  comprehensive observability strategy for fan-out/fan-in architectures.
