---
title: "Q2 Answer — Hedging Trade-off"
description: "Worked answer to Fan-Out/Fan-In Practice Q2: the load-vs-latency math of hedged requests, when to enable them, and what to instrument first to justify the decision."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112-2"
relations:
  - slug: patterns/04-microservice-patterns/10-hedged-requests/10-hedged-requests
    kind: depends_on
  - slug: observability/11-visualization/02-golden-signals/02-tail-latency
    kind: related
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
---

## Q2 — Hedging trade-off

> A recommendation service has a P99 of 280ms but a P50 of 30ms, with a 200ms SLO. An engineer
> proposes enabling [[10-hedged-requests|hedged requests]] to all 50 shards. What is the load
> impact, when would you enable hedging, and what would you instrument first to justify the
> decision?

---

## Load impact

Hedging to all 50 shards means every request potentially issues up to 2× the calls: the original
plus a hedge for any shard that hasn't responded within some threshold. Since P50 here is 30ms —
comfortably under the 200ms SLO — the vast majority of shards would respond well before a
reasonably-set hedge delay ever fires, so hedging every shard mostly means paying close to 2× load
on the P50 path for the small minority of requests where the hedge actually helps. That's the core
trade: you tax the common case (30ms shards, already fine) to fix the rare case (the P99 tail).

---

## When to enable hedging

Not as a first resort, and not to all 50 shards. This P99/P50 gap (280ms vs 30ms, roughly 9×) is a
strong signal of a slow-replica problem rather than a systemic capacity problem — a systemic issue
would show up as elevated P50 too. That's the precondition for hedging to make sense at all: it
fixes [[02-tail-latency|tail latency]] caused by a subset of slow replicas, not overall load or a
uniformly slow service.

Given that, I'd hedge only the tail — the slowest ~5% of shards, identified from a per-shard latency
histogram, not by a request threshold applied to all 50 uniformly. Hedging every shard because the
aggregate P99 is bad is treating the symptom (aggregate P99) instead of the cause (specific shards).

---

## What to instrument first to justify the decision

`fan_out_shard_latency_seconds` P99, broken out by `shard_id`, before writing any hedging code.
Without this, "enable hedging" is a guess dressed up as a fix — you'd be paying the load tax
blindly, with no way to confirm afterward whether it actually helped or just added load.

Concretely: pull the per-shard P99 distribution, identify which shards are consistently in the
250–300ms range (the actual contributors to the aggregate 280ms P99), and set the hedge delay near
those shards' own P50 or P75 — not an arbitrary global number. Once hedging ships, watch
`fan_out_hedged_requests_used_total` alongside the aggregate P99: a real slow-replica problem shows
hedging firing on a small, stable set of shard IDs with a measurable P99 improvement; a hedge rate
that's high and spread evenly across all 50 shards means the "hedging trade-off" premise was wrong
and the real problem is systemic, not tail-latency.
