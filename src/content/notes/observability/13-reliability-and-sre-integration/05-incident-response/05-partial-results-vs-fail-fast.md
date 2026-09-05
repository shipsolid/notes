---
title: "5 — Partial Results vs Fail-Fast"
description: "Three policies for partial failures in fan-out calls: fail-fast (abort if any dependency fails), best-effort (return what succeeded and surface what's missing), and minimum quorum (K-of-N replicas). Default to fail-fast unless correctness explicitly permits partial data."
tags: ["concepts", "distributed-systems", "reliability", "maang-prep"]
updated: 2026-06-30
hidden: false
zettelId: "202606302351-3"
relations:
  - slug: observability/10-observability-data-platforms/02-mimir/02-shards-workers
    kind: related
---

# 5 — Partial Results vs Fail-Fast

This topic is about **what a distributed system should do when it asks multiple services (or
[[02-shards-workers|shards]]) for data and some of them fail**.

Suppose you have a service that needs data from **5 different sources** before responding to the
user.

```
                Client
                   |
                   v
           Recommendation API
          /    |    |    |    \
         A     B    C    D     E
```

Each service returns part of the final answer.

Now imagine service **C** times out.

The question is:

> **Should we return something anyway, or return an error?**

That's what these policies describe.

---

## 1. Fail-fast

**Rule:**

> If **any required dependency fails**, abort immediately and return an error.

Example:

```
A ✅
B ✅
C ❌ timeout
D ✅
E ✅

Response:
500 Internal Server Error
```

You don't even attempt to construct a partial answer.

---

### Why?

Because returning incomplete data would be **incorrect**.

Example:

Imagine you're checking your bank balance.

```
Checking account: ₹50,000
Savings account: ₹1,00,000
Fixed deposit: timeout
```

Would you want the app to show

```
Total balance:
₹1,50,000
```

No.

The actual total might be ₹5,50,000.

Returning a smaller number would be misleading.

Better:

```
Unable to retrieve account information.
Please try again.
```

Correctness matters more than availability.

---

### Another example

An e-commerce checkout calculates

- inventory
- tax
- shipping
- discounts

If tax service fails...

Should checkout continue?

No.

Better to fail than charge the wrong amount.

---

## 2. Best-effort (Partial Results)

Here the philosophy changes.

Instead of

> everything or nothing

it's

> give the user whatever succeeded.

Example

Search engine:

```
Search request

↓

Shard 1 ✅
Shard 2 ✅
Shard 3 ❌
Shard 4 ✅
```

Instead of

```
Error
```

you return

```
90 search results
instead of 120
```

The user still gets useful information.

Google, Bing, Elasticsearch, OpenSearch all use variations of this idea.

---

### Dashboard example

Suppose a Grafana dashboard has

- CPU
- Memory
- Errors
- Network

Network metrics fail.

Instead of

```
Dashboard unavailable
```

Grafana can show

```
CPU ✅
Memory ✅
Errors ✅
Network unavailable
```

This is much more useful.

---

### Recommendation system

Netflix recommendations

```
Trending service ✅
Watch history ✅
Friends recommendations ❌
```

Still show recommendations.

No need to fail the entire page.

---

### The danger

Suppose you hide the failure.

User sees

```
Top 10 products
```

But actually

```
Warehouse Europe timed out
```

The user is unknowingly seeing incomplete results.

This is called **silent data loss**.

That's dangerous.

---

## 3. Minimum Quorum

This is mostly used with **replicated data**, not partitioned data.

Imagine the same data exists on three servers.

```
Replica A
Replica B
Replica C
```

You ask all three.

```
A ✅
B ✅
C ❌
```

Do you have enough information?

Yes.

Because A and B contain the same data.

You define a quorum.

Example:

```
N = 3 replicas
K = 2 required
```

If at least 2 respond,

success.

If only one responds,

fail.

---

This is common in

- Cassandra
- DynamoDB
- Etcd
- Consul
- ZooKeeper
- Raft

---

## Why "K of N"?

Suppose

```
N = 5 replicas
```

You might require

```
K = 3
```

because 3 is a majority.

```
Replica 1 ✅
Replica 2 ✅
Replica 3 ✅
Replica 4 ❌
Replica 5 ❌
```

Enough responses.

Proceed.

---

## Why interviewers like fail-fast

The note says:

> **Default to fail-fast unless the product explicitly allows partial results.**

This demonstrates conservative engineering.

Imagine an interviewer asks:

> "Your API calls five downstream services. One fails. What do you do?"

A good answer is:

> "I'd default to fail-fast because I don't know whether missing data changes correctness. If the
> product specification explicitly permits partial results—such as for search, recommendations, or
> dashboards—I would return partial results, clearly indicate which data is missing, and emit
> metrics and logs so operators can detect the degraded response."

That answer shows you're thinking about **correctness first**.

---

## Why silently incomplete results are hard to debug

Suppose your recommendation engine is supposed to query

```
US
Europe
Asia
Australia
```

Europe fails every third request.

Your API still returns recommendations.

No alerts.

No errors.

Users only notice:

> "Recommendations seem worse lately."

Now engineers spend days debugging.

If instead the API returned

```
503
Recommendation service unavailable
```

the issue would be obvious.

Or, if partial results are acceptable, include explicit metadata such as:

```json
{
  "results": [...],
  "partial": true,
  "missing_shards": ["Europe"]
}
```

This preserves availability while making the degradation visible.

---

## Summary

| Policy             | Behavior                                          | Typical use cases                                              |
| ------------------ | ------------------------------------------------- | -------------------------------------------------------------- |
| **Fail-fast**      | Abort if any required component fails             | Payments, checkout, banking, inventory, financial calculations |
| **Best-effort**    | Return available data and indicate what's missing | Search, dashboards, recommendations, news feeds                |
| **Minimum quorum** | Succeed once at least **K of N** replicas respond | Replicated databases, consensus systems, distributed storage   |

The key principle is to choose the policy based on the **correctness requirements** of the
operation. If missing data can produce a wrong or misleading answer, fail-fast is usually the safer
default. If partial information is still valuable, return it—but make the incompleteness explicit
rather than silently hiding it.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
