---
title: "Q3 Answer — Context Cancellation Leak"
description: "Worked answer to Fan-Out/Fan-In Practice Q3: diagnosing a ghost-request leak where client-visible errors look healthy but infra cost and downstream CPU are elevated."
tags: ["patterns", "distributed-systems", "concurrency", "maang-prep"]
updated: 2026-07-06
hidden: false
zettelId: "202607060112-3"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: depends_on
  - slug: observability/04-distributed-tracing/09-critical-path-analysis/09-trace-shape
    kind: related
  - slug: observability/06-opentelemetry/08-context-propagation/08-deadline-propagation
    kind: depends_on
  - slug: networks/05-http-ecosystem/05-grpc/05-grpc
    kind: related
---

## Q3 — Context cancellation leak

> A fan-out to 30 downstream services looks healthy in the client dashboard (errors < 0.1%), but
> infra cost is 3× higher than expected and downstream CPU is elevated. What is the most likely root
> cause and how do you confirm it?

---

## Most likely root cause

This is the classic ghost-request symptom: the client-facing dashboard only sees requests from the
client's point of view, and from that view everything looks fine — the client got a response (or a
timeout) either way. What it can't see is that the parent context was cancelled (client gave up or
hit its own timeout) but one or more of the 30 workers didn't propagate that cancellation to their
own downstream calls. Those downstream calls keep running to completion for a request nobody is
waiting on anymore — consuming CPU, holding connections, and generating cost that never shows up as
a client-visible error, because from the client's side the request already "finished" (with a
timeout).

The reason error rate stays under 0.1% while cost triples is precisely because this failure mode is
invisible at the client boundary — it only manifests as resource consumption further down the stack.

---

## How to confirm it

Compare `fan_out_cancelled_worker_total` against the downstream request rate on the services those
30 workers call. If cancellations are rising (or present at all) but the downstream request rate
doesn't drop in step, that's the tell: workers are being told to stop (via `ctx.Done()`) but their
own downstream calls are still running as if nothing happened.

A second, corroborating signal: downstream span duration in tracing. If you look at the trace for a
request the client saw time out at, say, 3 seconds, and a downstream span for one of the 30 services
keeps running past that 3-second mark, that span is doing exactly the wasted work described above —
this is the [[09-trace-shape]] signature [[04-1-fan-out-fan-in|this note]] calls out elsewhere: work
continuing after the parent span should have ended.

---

## Fix

Audit every downstream call inside each of the 30 workers and make sure it's passing the _derived_
context — the one that inherits the parent's cancellation and deadline — rather than a fresh
`context.Background()` or equivalent. Concretely: every `shard.Query(ctx, ...)` (or HTTP client
call, DB call, [[networks/05-http-ecosystem/05-grpc/05-grpc|gRPC]] call) must take the context
argument that was handed to the worker, not a new one constructed inside it. This is the same
[[08-deadline-propagation]] contract the rest of this note depends on — a single worker that
"forgets" to forward `ctx` breaks it silently, and silently is exactly how this bug survives long
enough to triple your infra bill before anyone notices.
