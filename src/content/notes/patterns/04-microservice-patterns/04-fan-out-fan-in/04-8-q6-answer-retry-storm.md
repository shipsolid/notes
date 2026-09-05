---
title: "Q6 Answer — Retry Storm"
description: "Worked answer to Fan-Out/Fan-In Practice Q6: how uncapped per-worker retries turn a transient blip into a full outage, and the retry policy that prevents it."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112-6"
relations:
  - slug: patterns/04-microservice-patterns/08-retry-with-jitter/08-retry-with-jitter
    kind: depends_on
  - slug: patterns/04-microservice-patterns/07-circuit-breaker/07-circuit-breaker
    kind: depends_on
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
---

## Q6 — Retry storm

> A fan-out to 100 shards retries each failed call up to 3 times with no backoff. During a transient
> regional network blip, 15 shards start timing out. Traffic to those 15 shards triples within
> seconds and the blip turns into a full outage. What went wrong, and how do you fix the retry
> policy?

---

## What went wrong

This is retry amplification stacked on top of fan-out amplification. Fan-out already multiplies one
client request into 100 backend calls; adding up to 3 retries per call means each of those 100 calls
can become up to 4 attempts (1 original + 3 retries), so the 15 shards that started timing out don't
just see their existing load — they see up to 3× more traffic arriving with no delay between
attempts, aimed specifically at the shards already least able to handle it.

That's the mechanism behind "traffic to those 15 shards triples": it isn't a coincidence, it's the
direct, predictable output of fixed, immediate, uncapped retries during a partial failure. A
transient network blip that would have recovered on its own gets turned into a self-inflicted
thundering herd, because the retry policy adds load precisely where and when the system can least
absorb it.

---

## How to fix the retry policy

**[[08-retry-with-jitter|Exponential backoff with jitter]].** Fixed-interval retries in a fan-out
are what create the thundering herd — every failed worker retries at the same cadence, so retries
arrive in synchronized waves. Backoff spaces retries out over time; jitter desynchronizes them
across workers so they don't pile up in the same instant.

**A retry budget, not a per-call retry count.** Instead of "each call gets up to 3 retries"
regardless of what's happening system-wide, cap total retries as a percentage of total request
volume (e.g., 10%). This means that during a regional blip affecting 15 shards, the system as a
whole stops retrying once it's already spent its budget, rather than multiplying load indefinitely
as more and more calls fail.

**A [[07-circuit-breaker|circuit breaker]] per shard.** After N consecutive failures to a given
shard, stop sending new attempts (retries or otherwise) to it for a cooldown period, rather than
continuing to retry into a shard that's clearly not recovering. This directly breaks the feedback
loop where retries make the failure worse, which makes more retries fire, which makes the failure
worse still.

**Instrument `fan_out_retry_total{shard_id}` as its own series**, separate from
`fan_out_shard_latency_seconds`. Retries are often invisible in a latency dashboard right up until
they've already caused a cascading failure — by the time elevated latency shows up in the aggregate,
the retry storm is already underway. A retry-rate metric, watched per shard, is the leading
indicator that would have caught this before it became a full outage.
