---
title: "Q5 Answer — Sizing the Fan-Out Width"
description: "Worked answer to Fan-Out/Fan-In Practice Q5: the questions to ask and safeguards to add before accepting a design that fans out to all 8,000 tenant shards in prod."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112-5"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-6-q4-answer-aggregator-bottleneck
    kind: related
---

## Q5 — Sizing the fan-out width

> A new feature requires fanning out a user request to all active tenant shards. In dev there are 10
> shards; in prod there will be 8,000. The service receives 2,000 RPS. What questions do you ask
> before accepting this design, and what safeguards would you add?

---

## Why this is a red flag before anything else

2,000 RPS × 8,000 shards = 16M backend calls/sec. That number alone should stop the design review —
whatever this looks like at 10 shards in dev tells you almost nothing about whether it survives
contact with 8,000 shards in prod, because the dev environment never exercises the dimension
(fan-out width) that actually determines cost here.

---

## Questions to ask before accepting the design

- **Is fan-out to _all_ shards actually required?** If the request is scoped to a single user, is
  "all active tenant shards" really the right target, or does a routing key (tenant ID, region,
  whatever partitions the data) narrow this to a handful of shards instead of all 8,000? Most
  "fan-out to everything" designs are actually "fan-out to everything because we haven't built the
  routing layer yet."
- **What is the downstream QPS limit per shard?** 16M calls/sec has to land somewhere; does each of
  the 8,000 shards have headroom for its share of that, or does this design assume infinite backend
  capacity because dev's 10 shards never stressed it?
- **What does the aggregator's merge cost look like at N=8,000?** Whatever merge strategy is chosen
  (see [[04-6-q4-answer-aggregator-bottleneck|Q4]] for the top-K case) has to be evaluated at the
  real N, not the dev N — an O(K log N) merge that's invisible at N=10 is a different story at
  N=8,000.
- **What's the actual growth path from 10 to 8,000?** Is this a step-function jump at launch, or a
  gradual ramp? That changes whether safeguards need to exist on day one or can be phased in.

---

## Safeguards

- **Cap the fan-out width with a hard limit**, and route anything beyond it to a secondary tier
  (batched, asynchronous, or paginated) rather than letting the width grow unbounded with tenant
  count.
- **Use a worker pool instead of goroutine-per-shard** at this scale —
  [[04-1-fan-out-fan-in|this note]]'s own Consequences section puts the
  goroutine-per-shard/worker-pool cutover around 10K, and 8,000 is close enough to that line to plan
  for pooling rather than assume raw concurrency scales for free.
- **Add a `fan_out_width_total` histogram** from day one, so the actual fan-out width in production
  is visible and any drift between the assumed shard count and the real one is caught before it
  becomes an incident.
- **Load test at 10× the target fan-out width before launch** — given the jump from 10 to 8,000 is
  already 800×, this design needs to be proven at prod scale in a test environment, not extrapolated
  from dev numbers that never touched the actual bottleneck.
