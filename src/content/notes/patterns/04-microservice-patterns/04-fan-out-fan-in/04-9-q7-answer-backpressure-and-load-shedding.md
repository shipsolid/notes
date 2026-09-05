---
title: "Q7 Answer — Backpressure and Load Shedding"
description: "Worked answer to Fan-Out/Fan-In Practice Q7: why an aggregate latency average hides a single overloaded shard, and where the fix belongs — dispatcher, worker, or shard."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112-7"
relations:
  - slug: patterns/04-microservice-patterns/05-backpressure/05-backpressure
    kind: depends_on
  - slug: patterns/04-microservice-patterns/09-bulkhead/09-bulkhead
    kind: depends_on
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-3-q1-answer-search-fan-out-design
    kind: related
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-6-q4-answer-aggregator-bottleneck
    kind: related
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
---

## Q7 — Backpressure and load shedding

> During a traffic spike, a fan-out target shard's CPU hits 95% and it starts rejecting connections.
> The dispatcher keeps fanning out to it at full rate because average latency across all 500 shards
> still looks healthy. What is the fix, and where does it live — dispatcher, worker, or shard?

---

## Why the average hides it

At 500 shards, one shard at 95% CPU and rejecting connections is a rounding error in an aggregate
average — its contribution gets diluted by the 499 shards that are fine. This is the same class of
problem as the per-shard latency histogram argument elsewhere in [[04-1-fan-out-fan-in|this note]]
(see [[04-3-q1-answer-search-fan-out-design|Q1]], [[04-6-q4-answer-aggregator-bottleneck|Q4]]): any
metric that's averaged across the fan-out width will systematically hide a localized problem,
because localization is exactly the information an average throws away. The dispatcher "sees"
healthy aggregate latency and keeps behaving as if all 500 shards are equally healthy, when one
specifically isn't.

---

## Where the fix lives, and what it is

**Primarily at the dispatcher.** The dispatcher is the only component with a system-wide view across
all 500 shards, so it's the right place to track per-shard health — rolling error rate or per-shard
latency, not the global average — and to shed or reroute load away from a specific shard before it
collapses entirely. This is a per-shard instance of [[05-backpressure]]: back off the concurrency
allowed to a shard (AIMD-style adaptive limits) as its rejection rate or latency rises, rather than
continuing to send it a fixed, undifferentiated share of traffic.

**Paired with a [[09-bulkhead]] at the worker level.** Isolate the worker pool (or connection pool)
used for each shard, or at least for groups of shards, so that one shard's slow or rejected calls
don't exhaust the shared pool that healthy shards depend on. Without this, even a dispatcher that
correctly identifies the bad shard can still suffer collateral damage if all shards share one
undifferentiated resource pool — the overloaded shard's stuck calls tie up capacity that should be
serving the other 499.

**Not primarily at the shard.** The shard's job here is just to reject when overloaded (which it's
already doing at 95% CPU) — that's a correct, expected signal, not the bug. The bug is that nothing
upstream is listening to that signal and adjusting behavior.

**Instrumentation:** `fan_out_shard_reject_total{shard_id}` and a per-shard concurrency-limit gauge.
Alert on a _rise in a single shard's_ rejection rate, not on aggregate P99 — the aggregate is the
wrong signal for this exact failure mode, which is precisely why it went unnoticed in the scenario
as described.
