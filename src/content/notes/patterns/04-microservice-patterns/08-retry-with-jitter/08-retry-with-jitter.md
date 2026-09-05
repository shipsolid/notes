---
title: "08 — Retry with Exponential Backoff and Jitter"
description: "Retry transient failures with exponentially increasing wait times and randomised jitter to prevent thundering-herd recovery storms. The foundational pattern for resilient RPC."
tags: ["patterns", "resilience", "distributed-systems", "maang-prep"]
updated: 2026-06-30
hidden: false
zettelId: "202606301405-9"
relations:
  - slug: patterns/04-microservice-patterns/07-circuit-breaker/07-circuit-breaker
    kind: related
  - slug: patterns/04-microservice-patterns/10-hedged-requests/10-hedged-requests
    kind: related
  - slug: networks/reference/envoy
    kind: related
  - slug: patterns/04-microservice-patterns/04-fan-out-fan-in/04-1-fan-out-fan-in
    kind: related
---

## 08 — Retry with Exponential Backoff and Jitter

> **Interview level:** Principal / Staff (L6/L7) — every candidate knows "retry with backoff"; the
> L6/L7 differentiator is jitter strategies, idempotency requirements, retry budgets, and the
> distinction between retryable and non-retryable errors.

---

## Context

A distributed system makes RPC calls. Transient failures occur: a pod restarts, a network blip
causes a brief TCP reset, a rate-limited response returns 429, a database primary fails over. These
failures are temporary — a retry seconds later would succeed. Without retries, the error propagates
to the user unnecessarily.

---

## Problem

| Force                | Description                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| Transient failures   | Brief unavailability (< 30s) should not surface as user-visible errors                  |
| Thundering herd      | All callers retry simultaneously at the same interval → recovery dependency overwhelmed |
| Retry storms         | Retries amplify load exactly when the dependency is most fragile                        |
| Non-retryable errors | Retrying a 400 Bad Request or a duplicate-key violation wastes resources and masks bugs |
| Cascading delay      | Unbounded retries hold threads and add latency up the call chain                        |

---

## Solution

### The naive approach — why it fails

```python
for attempt in range(3):
    try:
        return call_service()
    except TransientError:
        time.sleep(1)   # fixed interval — all callers wake at the same time
```

100K callers all sleep for exactly 1 second, then all retry simultaneously. The recovering
dependency sees a traffic spike 10× larger than its steady-state load and goes down again.

### Exponential backoff with decorrelated jitter

```python
import random, time

BASE      = 0.1   # 100ms base
CAP       = 30.0  # 30s maximum wait
MAX_TRIES = 5

def backoff_with_jitter(attempt: int) -> float:
    # Decorrelated jitter (AWS recommendation) — spreads retries better than full jitter
    sleep = min(CAP, BASE * (2 ** attempt))
    return random.uniform(BASE, sleep)

def call_with_retry(fn):
    last_exc = None
    for attempt in range(MAX_TRIES):
        try:
            return fn()
        except NonRetryableError:
            raise          # never retry 4xx, duplicate key, validation errors
        except RetryableError as e:
            last_exc = e
            if attempt == MAX_TRIES - 1:
                raise
            wait = backoff_with_jitter(attempt)
            time.sleep(wait)
    raise last_exc
```

### Jitter strategies compared

| Strategy                | Formula                                        | Distribution                            | When to use               |
| ----------------------- | ---------------------------------------------- | --------------------------------------- | ------------------------- |
| **No jitter**           | `base * 2^n`                                   | All callers identical — thundering herd | Never                     |
| **Full jitter**         | `random(0, base * 2^n)`                        | Uniform across [0, max]                 | General purpose           |
| **Equal jitter**        | `(base * 2^n / 2) + random(0, base * 2^n / 2)` | Avoids very short waits                 | When minimum wait matters |
| **Decorrelated jitter** | `random(base, prev_sleep * 3)`                 | Best statistical spread                 | High fan-in systems       |

AWS's analysis ("Exponential Backoff and Jitter", 2015) shows decorrelated jitter produces the
lowest average completion time and lowest peak load on the recovering dependency.

---

## Idempotency — The Prerequisite for Safe Retries

**Retrying a non-idempotent operation creates duplicate side effects.** This is the silent bug:

```
Call 1: POST /orders (creates order #42, charges card $100)
→ Network timeout — caller never receives 200
Call 2: POST /orders (retry) → creates order #43, charges card again
Customer charged twice.
```

Retries are only safe when:

1. **The operation is idempotent by design** (GET, DELETE, PUT with full resource replacement)
2. **The client sends an idempotency key**: `Idempotency-Key: uuid-v4` header; the server
   deduplicates on this key within a time window

```http
POST /orders
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{"item": "widget", "qty": 1}
```

The server stores `(idempotency_key → response)` in Redis with a 24h TTL. On retry with the same
key, it returns the cached response without re-executing the operation. Always design mutation
endpoints with idempotency keys when retries are part of the protocol.

---

## Retry Budget

Retries amplify load. A service receiving 1000 RPS with a 5% error rate and 3 retries could generate
up to 1000 × 0.05 × 3 = 150 additional RPS to a struggling dependency.

**Retry budget**: cap total retries as a percentage of traffic.

```python
MAX_RETRY_RATE = 0.1   # retries cannot exceed 10% of total calls

# In-process counter (or Redis for distributed)
if retry_count / total_count > MAX_RETRY_RATE:
    raise CircuitOpen("retry budget exhausted")
```

At [[envoy|Envoy]]/Linkerd level, this is configured per route:

```yaml
retry_policy:
  retry_on: 5xx,connect-failure,reset
  num_retries: 3
  retry_host_predicate:
    - name: envoy.retry_host_predicates.previous_hosts
  host_selection_retry_max_attempts: 3
  # Retry budget: retries ≤ 20% of active requests
  retry_budget:
    budget_percent: 20.0
    min_retry_concurrency: 3
```

---

## What to Retry vs. Not

| Error                       | Retryable?                      | Reason                                                     |
| --------------------------- | ------------------------------- | ---------------------------------------------------------- |
| `503 Service Unavailable`   | Yes                             | Transient overload                                         |
| `429 Too Many Requests`     | Yes, after `Retry-After` header | Rate limit; back off and try later                         |
| `500 Internal Server Error` | Maybe                           | Depends on whether the server is idempotent; err toward no |
| `502/504 Gateway Timeout`   | Yes                             | Network/proxy issue                                        |
| `400 Bad Request`           | Never                           | Client error; retry won't fix malformed input              |
| `401 Unauthorized`          | Never (refresh token first)     | Auth error                                                 |
| `409 Conflict`              | Application-specific            | Duplicate key = don't retry; optimistic lock = retry       |
| TCP connection refused      | Yes                             | Server pod not yet ready                                   |
| TCP reset mid-stream        | Yes                             | Network blip                                               |

---

## Consequences

### Gains

- Transient failures are invisible to the user; success rate improves without code changes in the
  dependency
- Jitter prevents thundering-herd recovery storms — the key mechanism that makes retries safe at
  scale

### Trade-offs

- Retries increase tail latency: P99 latency may spike because the P99 request is now a retry
- Load amplification: retries add traffic exactly when the dependency is most fragile
- Non-idempotent operations become dangerous; requires disciplined API design
- Debugging is harder: a successful retry hides the original error; logs must capture attempt count

---

## Observability

```
retry_attempts_total{service, method, attempt_number}    # breakdown by attempt ordinal
retry_success_total{service, method, attempt_number}     # which attempt succeeded
retry_exhausted_total{service, method}                   # all attempts failed
retry_budget_utilisation{service}                        # retries / total calls ratio
retry_delay_seconds{attempt_number}                      # actual sleep time histogram
```

Alert: `retry_budget_utilisation > 0.15` — retries exceeding 15% of traffic means the dependency is
genuinely degraded, not just experiencing transient blips. Escalate to
[[07-circuit-breaker|circuit breaker]] or incident response.

---

## MAANG Interview Anchors

- "Retries without jitter are worse than no retries in a recovery scenario. All callers back off for
  the same 1 second and then spike together, re-overloading the recovering dependency. Decorrelated
  jitter is the fix — it statistically spreads retries across the sleep window."

- "The prerequisite for safe retries is idempotency. I'd design every mutation endpoint with an
  `Idempotency-Key` header before enabling client-side retries. Without it, retries cause duplicate
  charges, duplicate orders, duplicate notifications — silent data corruption that's hard to detect
  and expensive to remediate."

- "Retry budgets are how you prevent retry storms from becoming an amplification attack on a
  recovering service. I'd set the budget at 10–20% of total traffic and enforce it at the proxy
  level (Envoy retry budget) rather than in application code — the proxy has global visibility."

- "I always instrument which attempt ordinal succeeds. If P99 of my calls succeed on attempt 3,
  that's a signal the dependency is borderline and I should fix the dependency, not add more
  retries. Retries are a coping mechanism, not a solution."

---

## Relation to Fan-Out

Retries compound fan-out amplification: a [[04-1-fan-out-fan-in]] to N shards with per-call retries
can turn a transient blip into a full outage, because retries concentrate extra load on exactly the
shards already struggling. Backoff and jitter alone aren't sufficient at fan-out scale — pair them
with a retry budget capped as a percentage of total fan-out volume, not a fixed count per shard
call, and a circuit breaker per shard to stop the feedback loop once a shard is clearly not
recovering.

---

## Known Uses

| System         | Retry implementation                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| AWS SDK        | Exponential backoff + full jitter; adaptive retry mode with retry budget            |
| Envoy          | `retry_policy` with `retry_budget`; per-route configurable                          |
| Kafka producer | `retries=INT_MAX` + `delivery.timeout.ms`; idempotent producer prevents duplication |
| gRPC           | Built-in retry policy in service config; hedged requests variant                    |
| Stripe API     | Idempotency keys on every POST; documented retry guidance                           |
