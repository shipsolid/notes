---
title: "Q1 Answer — Search Fan-Out Design"
description: "Worked answer to Fan-Out/Fan-In Practice Q1: partitioning, deadline propagation, partial-result policy, and instrumentation priority for a 200-shard search API at 150ms P99."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-4-q2-answer-hedging-trade-off
    kind: related
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-5-q3-answer-context-cancellation-leak
    kind: related
---

## Q1 — Design the fan-out layer for a distributed search API

> Your search service must query 200 shards in under 150ms P99. Walk through: how you partition the
> fan-out, deadline propagation strategy, partial-result policy, and what you'd instrument first
> when P99 degrades in production.

---

## Partitioning

At 200 shards, goroutine-per-shard is still well under the pooling threshold —
[[04-1-fan-out-fan-in|this note]]'s Consequences section puts the worker-pool cutover around 10K —
so no pool is needed; spawn one goroutine per shard directly.

Route by whatever key the index is naturally partitioned on: consistent hash on document ID range,
or time-range if the index mirrors Mimir/Loki-style time-partitioned storage. The dispatcher's own
routing work has to be O(1) or O(log N) — a hash or range lookup, not a linear scan of 200 shards —
or its own overhead starts eating into the deadline before any worker has even started.

---

## Deadline propagation

Given a 150ms P99 SLO, budget ~130–140ms as the actual worker deadline, reserving 10–20ms headroom
for dispatch and aggregation. That remaining budget — not the original 150ms — gets set once as a
`context.WithTimeout` (or equivalent deadline header) and passed identically to all 200 workers.

Every downstream call a worker makes must derive its context from that same parent so cancellation
actually propagates. A worker that spawns a fresh background context for its own downstream call
becomes exactly the ghost-request leak this note's [[04-5-q3-answer-context-cancellation-leak|Q3]]
describes.

---

## Partial-result policy

Missing 1 of 200 shards in a search response degrades ranking quality — it doesn't produce a wrong
answer the way a missing shard in a replicated read would. That's a reason to deliberately deviate
from this note's "default to fail-fast" guidance here.

Use a minimum quorum (e.g., require ≥95% of shards, or an explicit K of 200) rather than strict
fail-fast, and return `partial: true` / `shards_returned: 190/200` on the response so the caller can
render an "incomplete results" indicator instead of silently under-representing the result set.
Fail-fast would mean one flaky shard takes down every search request — the wrong trade for this
correctness profile.

---

## What to instrument first when P99 degrades

`fan_out_shard_latency_seconds{shard_id}` P99, broken out per shard, first. At 200 shards, a P99
regression is almost always a small number of hot or slow shards dragging the tail, not a uniform
slowdown, so the per-shard histogram is the fastest way to localize the culprit.

Correlate that against `fan_out_cancelled_worker_total`: if cancellations climb in lockstep with a
specific shard's latency, that shard is genuinely slow; if cancellations climb with no single shard
standing out, the deadline budget itself is too tight.

Also watch `fan_out_partial_result_total{reason}` to confirm the quorum policy isn't quietly
absorbing an error rate that should be paged on.

If the per-shard histogram shows a small set of shards with a persistent 250–300ms tail (the kind of
P99/P50 gap this note's [[04-4-q2-answer-hedging-trade-off|Q2]] covers), that's the trigger to
consider hedging those specific shards — not all 200 — rather than reaching for hedging as a first
response to the P99 alert.
