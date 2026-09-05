---
title: "Q4 Answer — Aggregator Bottleneck"
description: "Worked answer to Fan-Out/Fan-In Practice Q4: min-heap merge strategy for a 500-shard top-K aggregation, its complexity, and how to keep aggregator latency from contaminating per-shard dashboards."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112-4"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-2-fan-out-olly-kpis
    kind: related
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
---

## Q4 — Aggregator bottleneck

> A fan-out of 500 shards each returns a sorted list of 1,000 time-series data points. The
> aggregator merges them into a global top-1,000. Describe the merge strategy, its time complexity,
> and how you'd separate aggregator latency from per-shard latency in your dashboards.

---

## Merge strategy

Each shard already returns its 1,000 points sorted, so the aggregator's job is a k-way merge, not a
sort from scratch — re-sorting 500,000 points when 500 of the input lists are already ordered would
be throwing away information the shards already computed for free.

Use a min-heap (priority queue) seeded with the head element of each of the 500 shard result lists.
Repeatedly pop the smallest element, push it to the output, and push the next element from that same
shard's list onto the heap. Stop once the output reaches 1,000 elements — you don't need to fully
merge all 500,000 points, only pull as many as the top-K requires.

---

## Time complexity

O(K log N), where K = 1,000 (the output size) and N = 500 (the number of shards/lists being merged).
Each of the K pops/pushes costs O(log N) for the heap operation. This is the key insight that makes
the merge cheap regardless of how much data sits behind each shard: complexity scales with the
output size and the fan-out width, not with the total number of points across all shards (500,000
here). Doubling each shard's result size to 2,000 points wouldn't change the merge cost at all,
since K is still capped at 1,000; only increasing the fan-out width (N) or the requested top-K size
(K) moves the needle.

---

## Separating aggregator latency from per-shard latency in dashboards

Emit `fan_out_aggregation_latency_seconds` as its own histogram, distinct from
`fan_out_shard_latency_seconds`. This matters because the two failure modes look identical from the
outside (both show up as elevated total request latency) but have completely different fixes: a slow
shard means you look at `fan_out_shard_latency_seconds{shard_id}` to find the culprit; a slow
aggregator means every request pays the cost regardless of which shards were fast, and the fix is in
the merge implementation (or heap size, or output size), not in any individual shard.

Concretely, alert when aggregator P99 exceeds roughly 20% of total request latency — at that point
the merge step itself is a meaningful fraction of the SLO budget, not just tracing overhead, and is
worth profiling directly (e.g., is the heap comparator doing unnecessary work, is K larger than it
needs to be, is N larger than it needs to be). Without the separate histogram, an aggregator
regression just looks like "everything got slower," and the natural but wrong first move is to go
hunting through 500 shard dashboards for a problem that isn't there.
