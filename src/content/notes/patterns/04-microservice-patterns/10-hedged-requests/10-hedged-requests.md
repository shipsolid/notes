---
title: "10 — Hedged Requests"
description: "A tail-latency optimization that issues the same idempotent request to multiple replicas and uses whichever responds first, trading extra compute for dramatically lower P99/P999."
tags: ["patterns", "distributed-systems", "latency", "maang-prep"]
updated: 2026-06-30
hidden: false
zettelId: "202606302351-2"
relations:
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: related
  - slug: observability/11-visualization/02-golden-signals/02-tail-latency
    kind: related
  - slug: observability/06-opentelemetry/08-context-propagation/08-deadline-propagation
    kind: related
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-4-q2-answer-hedging-trade-off
    kind: related
  - slug: networks/05-http-ecosystem/05-grpc/05-grpc
    kind: related
---

Hedged requests are a **[[02-tail-latency|tail-latency optimization]]**. The idea is simple:

> Instead of waiting for one server that might be slow, ask multiple identical servers the same
> question and use whichever responds first.

This intentionally spends **extra compute** to achieve **lower latency**.

---

## Why is this needed?

Imagine you have three replicas of the same service.

```
Replica A
Replica B
Replica C
```

Each replica has the same data and can answer the request.

Normally, your load balancer chooses one.

```
Client
   |
   +----> Replica A
```

Suppose the response times are:

| Request |  Replica A |
| ------- | ---------: |
| 1       |      12 ms |
| 2       |      15 ms |
| 3       |      14 ms |
| 4       | **180 ms** |

Most requests are fast.

Occasionally a replica experiences:

- CPU scheduling delays
- GC pauses
- disk I/O
- network congestion
- noisy neighbors
- container throttling

That one slow request becomes your **tail latency**.

---

## Normal request

```
Client
   |
   +------> Replica A
               |
               |
             180 ms
```

User waits **180 ms**.

---

## Hedged request

Instead:

```
Client

   +---------> Replica A

   +---------> Replica B
```

Both start processing immediately.

Suppose

```
Replica A = 180 ms

Replica B = 42 ms
```

Timeline

```
0 ms
|
|------Send to A

|------Send to B

42 ms
|
|------Replica B replies

43 ms
|
|------Cancel request to A

180 ms
|
|------A finishes but result discarded
```

User experiences

```
42 ms

instead of

180 ms
```

---

## Why does this work?

Most latency distributions look like this.

```
Response Times

10ms ███████████████████

15ms ███████████

20ms ███████

30ms ████

40ms ██

150ms █

300ms █
```

Most requests are fast.

A tiny percentage are extremely slow.

Those few slow ones dominate your:

- P95
- P99
- P99.9

Hedged requests eliminate many of those slow outliers.

---

## Example

Without hedging

```
Request 1  18 ms

Request 2  20 ms

Request 3  19 ms

Request 4  240 ms

Request 5  16 ms
```

P99 becomes terrible because of Request 4.

Now hedge.

```
Request 4

Replica A = 240 ms

Replica B = 25 ms

Winner = 25 ms
```

Now

```
18
20
19
25
16
```

Tail disappears.

---

## Why cancel the slower request?

Suppose both continue running.

```
Replica A

180 ms of CPU

Replica B

42 ms of CPU
```

You wasted

```
180 + 42 = 222 ms
```

Instead

```
42 ms

cancel

A stops processing
```

Less wasted CPU.

This requires **[[08-deadline-propagation|deadline propagation]]** and **context cancellation**,
which is why many RPC frameworks (such as [[networks/05-http-ecosystem/05-grpc/05-grpc|gRPC]])
propagate cancellation signals to the server.

---

## Where does the 2× load come from?

Normally

```
1000 requests/sec

↓

1000 upstream requests/sec
```

With immediate hedging

```
1000 user requests

↓

2000 upstream requests
```

Each client request becomes two backend requests.

Hence

```
~2× network

~2× CPU

~2× connections
```

---

## Why is Netflix okay with that?

Netflix optimizes for **viewer experience**.

Imagine opening Netflix.

If recommendations take

```
80 ms
```

instead of

```
350 ms
```

the UI feels instant.

Reducing latency can improve engagement and user satisfaction enough to justify the additional
infrastructure cost.

---

## Is it always exactly 2×?

No.

A common optimization is **delayed hedging**.

Instead of sending both immediately:

```
0 ms

Send to A

Wait 20 ms

If A hasn't responded

↓

Send to B
```

Timeline

```
0 ms

A starts

18 ms

A responds

Done

Never send B
```

Only one request was needed.

For slow requests

```
0 ms

A starts

20 ms

Still waiting

↓

Send B

40 ms

B responds

Cancel A
```

Many production systems use this approach because it greatly reduces the extra load while still
cutting tail latency.

---

## When should you use hedged requests?

They work well when:

- The operation is **idempotent** (safe to execute multiple times).
- Multiple replicas can process the same request independently.
- Low latency is more valuable than the extra resource usage.
- The request path is latency-sensitive (e.g., user-facing APIs with strict P99 SLOs).

Avoid or use caution when:

- The operation has side effects (e.g., charging a credit card or creating an order), unless
  protected by idempotency keys.
- The backend is already heavily overloaded, since duplicate requests can make overload worse.
- Replicas share the same bottleneck (for example, all waiting on the same slow database), in which
  case hedging may provide little benefit.

---

### Relation to fan-out

Hedging is a tail-latency tactic layered on top of [[04-1-fan-out-fan-in]].

Suppose Netflix's homepage needs data from five services:

```
             Home API
                |
    --------------------------
    |   |   |   |   |
 User  Ads  ML  Video  Ratings
```

If **any one** service is slow, the entire page is delayed.

Netflix may hedge requests to each dependency:

```
Ratings Service

Replica A <-----+

                +---- Client

Replica B <-----+
```

This reduces the chance that a single slow replica determines the overall page latency, which is
especially valuable in fan-out architectures where the slowest branch often dictates the total
response time.
