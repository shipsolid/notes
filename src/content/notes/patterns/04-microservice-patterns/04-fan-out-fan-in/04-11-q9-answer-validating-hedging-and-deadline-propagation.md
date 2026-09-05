---
title: "Q9 Answer — Validating Hedging and Deadline Propagation"
description: "Worked answer to Fan-Out/Fan-In Practice Q9: fault-injection, load testing, and canary comparison for validating a deadline-propagation and hedging rewrite before it reaches production."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112-9"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-5-q3-answer-context-cancellation-leak
    kind: related
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-7-q5-answer-sizing-the-fan-out-width
    kind: related
  - slug: observability/06-opentelemetry/08-context-propagation/08-deadline-propagation
    kind: depends_on
  - slug: patterns/04-microservice-patterns/10-hedged-requests/10-hedged-requests
    kind: depends_on
---

## Q9 — Validating deadline propagation and hedging before rollout

> A team is about to ship [[10-hedged-requests|hedged requests]] and a [[08-deadline-propagation]]
> rewrite to a fan-out layer serving 50K RPS. A bug here causes silent resource leaks (ghost
> requests) or subtly wrong partial results rather than a loud crash. How do you validate
> correctness before this reaches production?

---

## Why this is a fault-injection problem, not a unit-test problem

A unit test can confirm the happy path merges results correctly. It cannot confirm that, under real
contention, cancellation actually propagates or that a hedge actually cancels its loser — those are
properties that only show up when something is deliberately made to fail or run slow, which is
exactly what unit tests don't do by default. Both failure modes named in the question (ghost
requests, subtly wrong partial results) are silent by construction — they don't crash, they just
quietly waste resources or quietly under-report — so validation has to actively go looking for them
rather than waiting for them to announce themselves.

---

## Fault injection

Inject artificial per-shard latency and forced cancellations in a staging fan-out, then confirm
goroutine/thread counts don't grow unbounded after the parent context is cancelled. A flat or
recovering goroutine count after induced cancellation is direct proof that `ctx.Done()` is actually
being respected all the way down the call chain — not just accepted at the top level and ignored
further in, which is exactly the leak this note's [[04-5-q3-answer-context-cancellation-leak|Q3]]
describes.

For hedging specifically: confirm the _losing_ replica's request is actually cancelled, not merely
ignored by the caller. Check downstream connection count and CPU on the losing replica during an
induced hedge — if those don't drop when the hedge resolves, the hedge is running both requests to
completion regardless of which one "won," silently doubling load with none of the benefit visible in
client-facing metrics.

---

## Load testing

Run the load test at the real target — 50K RPS — with induced shard slowness, not at a smaller scale
extrapolated upward. The claimed P99 improvement from hedging is a claim about behavior under real
contention; testing it in isolation (low RPS, no induced slowness) can pass while the real system,
with real resource contention across 50K RPS of concurrent requests, behaves differently. This is
the same principle as [[04-7-q5-answer-sizing-the-fan-out-width|Q5]]'s "load test at 10× target
fan-out before launch" — validate at the scale where the failure mode actually manifests, not at a
scale where it's invisible.

---

## Canary rollout and comparison

Roll out as a canary and diff `fan_out_cancelled_worker_total` and
`fan_out_hedged_requests_used_total` pre- and post-change. A discrepancy here — most notably,
cancelled-worker count not dropping when it should after the deadline-propagation fix ships — is the
leading indicator of a leak that's still present. This is deliberately cheap to catch in a canary (a
metric comparison across two versions) and expensive to catch after a full rollout (a resource leak
or correctness bug discovered in production, at 50K RPS, after the fact). The canary comparison is
the last gate between "we believe this works" and "we've observed this works" before the whole fleet
is exposed to it.
