---
title: "2 — Tail Latency"
description: "Why the p99/p999 request latency matters more than the average in distributed systems — a single slow dependency in a fan-out can dominate the response time even when most calls are fast."
tags: ["concepts", "distributed-systems", "observability", "maang-prep"]
updated: 2026-07-08
hidden: false
zettelId: "202607081200"
relations:
  - slug: observability/06-opentelemetry/08-context-propagation/08-deadline-propagation
    kind: related
  - slug: observability/13-reliability-and-sre-integration/05-incident-response/05-partial-results-vs-fail-fast
    kind: related
  - slug: observability/02-metrics-engineering/08-query-optimization/08-query-sharding
    kind: related
  - slug: observability/10-observability-data-platforms/02-mimir/02-shards-workers
    kind: related
  - slug: observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets
    kind: related
---

# 2 — Tail Latency

This is a fundamental concept in **distributed systems**, **performance engineering**, and
**SRE/system design**. Let's break it down from first principles.

---

## What is latency?

**Latency** is how long a single operation takes — from request sent to response received.

```
Client
   │
   │ Request
   ▼
Server
   │
   │ 42ms later
   ▼
Response
```

A service doesn't have one latency number. It has a **distribution** — thousands of requests, each
taking a slightly different amount of time.

---

## What does "tail" mean?

If you sort every request's latency from fastest to slowest and plot it, most requests cluster near
the front (fast). A small number stretch out into a long **tail** (slow).

```
Fast ────────────────────────────────────────► Slow

█████████████████████████████████▏░░░░░░▏___
p50            p90        p99   p99.9  p99.99
```

**Tail latency** refers to that stretched-out end of the distribution — the slowest 1%, 0.1%, or
0.01% of requests.

**Tail latency** refers to the slowest requests in a system—the "tail" of the response time
distribution. Instead of looking at the average latency, it focuses on high percentiles like the
95th, 99th, or 99.9th percentile.

---

## Percentile notation

| Term   | Meaning                                                        |
| ------ | -------------------------------------------------------------- |
| p50    | Median — half of requests are faster than this                 |
| p90    | 90% of requests are faster than this                           |
| p99    | 99% of requests are faster than this — only 1 in 100 is slower |
| p99.9  | 1 in 1,000 requests is slower than this                        |
| p99.99 | 1 in 10,000 requests is slower than this                       |

Example distribution for a service:

```
p50    =   20ms
p90    =   45ms
p99    =  300ms
p99.9  = 1200ms
```

The **average** (mean) here might report as ~30ms — looking healthy — while 1 in 100 users is
waiting 10x longer than that. Averages hide tail latency; percentiles expose it.

---

## Why does the average lie?

Averages are dominated by the bulk of fast requests. A handful of very slow outliers barely move the
mean, but they are very real to the users who experience them.

```
999 requests at 20ms
  1 request  at 5000ms
─────────────────────────
Average ≈ 25ms   ← looks fine
p99.9   = 5000ms ← the truth
```

If you only alert on average latency, you will never see the users who are getting the worst
experience.

---

## Why tail latency gets worse at scale — the fan-out problem

Imagine a request that has to call **10 backend services** before it can respond, and each backend
has a p99 latency of 1% (1 in 100 requests is slow).

```
Client
   │
   ▼
API
 ├── Service 1
 ├── Service 2
 ├── ...
 └── Service 10
```

The response can only return once **all 10** have replied. The probability that at least one of the
10 hits its slow tail is:

```
1 - (0.99)^10 ≈ 9.6%
```

So even though each individual service is "fast 99% of the time," almost **10% of overall requests**
are now slow, because it only takes one straggler to slow down the whole fan-out. This is sometimes
called **the tail at scale** (Dean & Barroso, Google).

The more services you fan out to, the worse this compounds:

```
Services fanned out    Chance request is slow
        1                      1%
        10                     9.6%
        100                    63%
```

---

## Real production example

Suppose a product page request:

```
Product Page API
 ├── Inventory Service    (p99 = 50ms)
 ├── Pricing Service      (p99 = 40ms)
 ├── Reviews Service      (p99 = 200ms)
 └── Recommendation Engine (p99 = 800ms)
```

The page can't render until all four return. Even if Inventory, Pricing, and Reviews are almost
always fast, the Recommendation Engine's p99 spikes will drag the whole page's tail latency up to
~800ms for that 1% of users — and at 5,000 requests/second, that's 50 slow page loads every second.

---

## Common causes of tail latency

- **Garbage collection pauses** (JVM, Go GC) — stop-the-world pauses spike a subset of requests
- **Resource contention** — lock contention, connection pool exhaustion, thread starvation
- **Network jitter** — retransmits, congestion, noisy-neighbor VMs
- **Cold caches** — cache misses for long-tail keys
- **Skewed load** — one shard or partition getting disproportionate traffic
- **Background work** — compaction, checkpointing, batch jobs competing for the same resources

---

## Mitigation strategies

**Hedged requests** — send a duplicate request to a second replica if the first hasn't responded
within some threshold (e.g. p50), and take whichever answers first.

```
Request ──► Replica A (no response after 20ms)
        └─► Replica B (hedge, fired at 20ms)
                │
                ▼
         First response wins
```

**Request deadlines / timeouts** — bound how long any single dependency is allowed to hold up the
overall response. See [[08-deadline-propagation]].

**Load shedding** — reject or degrade low-priority requests before they queue behind slow ones.

**Tied requests / cancel-on-first** — cancel the loser once the winner responds, to avoid wasting
resources (ties directly into [[08-deadline-propagation]] and [[05-partial-results-vs-fail-fast]]).

**Reduce fan-out width** — fewer dependencies in the critical path means fewer chances to hit
someone's tail. See [[08-query-sharding]] and [[02-shards-workers]] for how fan-out width trades off
against per-worker latency.

**Isolate noisy neighbors** — dedicated resource pools/queues so one slow class of request can't
starve others.

---

## Why this matters for an Observability Architect

Alerting and SLOs built on **average latency** will miss tail latency regressions entirely — the
mean can stay flat while p99/p999 blows up for a meaningful slice of users. This is why:

- SLOs should be defined on percentiles (typically p99 or p99.9), not averages — see
  [[02-slos-and-error-budgets]] patterns for burn-rate alerting on percentile targets.
- Histograms (not just counters/gauges) are the right metric type for latency — Prometheus/Mimir
  histograms let you compute percentiles after the fact instead of pre-choosing which percentile to
  track.
- Distributed tracing (Tempo, OpenTelemetry) is what lets you find _which_ span in a fan-out caused
  a specific slow trace — aggregate percentiles tell you tail latency exists, traces tell you why.
  See [[09-trace-shape]] for how a scatter-gather call tree should look in a waterfall.
- Cardinality-aware label design matters here too — bucketing histograms per-service or per-route is
  useful, but avoid high-cardinality labels (user ID, request ID) directly on latency histograms.

## Metadata

|        |               |
| ------ | ------------- |
| Author | Amit Singh    |
| Scope  | observability |
