---
title: "Q8 Answer — Hierarchical Fan-Out"
description: "Worked answer to Fan-Out/Fan-In Practice Q8: budgeting a deadline across two nested fan-out levels and preventing partial failure from silently compounding across hops."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112-8"
relations:
  - slug: observability/06-opentelemetry/08-context-propagation/08-deadline-propagation
    kind: depends_on
  - slug: observability/13-reliability-and-sre-integration/05-incident-response/05-partial-results-vs-fail-fast
    kind: depends_on
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
---

## Q8 — Hierarchical (multi-level) fan-out

> A Loki-style system fans out a query from the query-frontend to N queriers, and each querier fans
> out again to M ingesters. The end-to-end SLO is 5s. How do you
> [[08-deadline-propagation|propagate the deadline]] across both levels, and how do
> [[05-partial-results-vs-fail-fast|partial failures]] compose across levels without silently
> degrading correctness?

---

## Deadline propagation across two levels

The rule from single-level fan-out — propagate the _remaining_ deadline, not the original — applies
recursively here, once per hop. The query-frontend doesn't hand all N queriers the full 5s; it
subtracts its own dispatch and (eventual) aggregation overhead first, then propagates what's left.
Each querier receiving that budget does the same thing again before fanning out to its own M
ingesters: it subtracts its own overhead (routing, partial merging of ingester results) and
propagates the remainder downward.

Concretely: if the frontend's own overhead is ~50ms, queriers get ~4.95s. If a querier's own
overhead is ~30ms, its ingesters get ~4.92s. Skipping this and handing every level the original 5s
means the frontend can end up waiting past its own deadline for queriers that are, individually,
still "within budget" from their own (wrong) frame of reference — the classic bug of copying a
deadline instead of recomputing the remaining one at every hop.

---

## How partial failures compose without silently degrading correctness

Composed failure tolerance is multiplicative if left implicit. If each querier independently accepts
"1% of my ingesters can fail and I'll still return a result," and the frontend independently accepts
"1% of my queriers can be incomplete and I'll still return a result," the _effective_ completeness
guarantee at the top isn't 99% — it's whatever those two independent 1% tolerances compose to, and
nobody explicitly decided that number. Worse, it's invisible: a result comes back looking complete
at every level because each level's own partial-result policy silently absorbed its own gap.

The fix is to make completeness an explicit, propagated fact rather than an implicit, absorbed one.
Each querier should report "N of M ingesters answered" up to the frontend as part of its response,
not just a best-effort merged result with no completeness signal. The frontend then applies _its
own_ fail-fast/best-effort/quorum policy to the _real_ aggregate completeness across all queriers
and ingesters — e.g., "I need ≥95% of total ingesters represented across all queriers," computed
from the actual reported numbers — rather than each level independently deciding "good enough"
against assumed completeness that was never verified.

---

## Instrumentation

Use a `level` label on the per-hop latency histogram —
`fan_out_shard_latency_seconds{level="querier"}` versus `{level="ingester"}` — so a slow
querier-level hop and a slow ingester-level hop are distinguishable in dashboards and trace
waterfalls instead of blurring into a single "fan-out was slow" signal. Without the level label, a
P99 regression at 5s end-to-end gives no indication of which hop to look at first, which matters a
great deal more here than in single-level fan-out because there are twice as many places the
regression could be hiding.
