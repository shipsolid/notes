---
title: "8 — Deadline Propagation"
description: "How a client deadline must be inherited by every downstream goroutine or service call so that cancelled work stops consuming resources rather than running to completion unobserved."
tags: ["concepts", "distributed-systems", "go", "concurrency", "maang-prep"]
updated: 2026-06-30
hidden: false
zettelId: "202606302351"
relations:
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
  - slug: observability/11-visualization/02-golden-signals/02-tail-latency
    kind: related
  - slug: observability/06-opentelemetry/01-opentelemetry-architecture/01-opentelemetry-sdks-and-semantic-conventions
    kind: related
---

# 8 — Deadline Propagation

This is a fundamental concept in **Go concurrency**, **distributed systems**, and **SRE/system
design**. Let's break it down from first principles.

---

## What is a deadline?

A **deadline** is the maximum amount of time an operation is allowed to run.

For example:

```
Client
   │
   │ HTTP Request
   ▼
API Server
```

The client says:

> "I'm willing to wait only 5 seconds."

That becomes a deadline.

```
Deadline = Now + 5 seconds
```

If the server hasn't responded within 5 seconds, the client disconnects.

---

## What is Context?

In Go, `context.Context` carries:

- cancellation signal
- deadline
- request-scoped values

Example:

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
```

Now every function receives this context.

```
Handler(ctx)
     │
     ├── Database(ctx)
     ├── Redis(ctx)
     └── ExternalAPI(ctx)
```

Notice the **same context** flows everywhere.

---

## What is deadline propagation?

Imagine this request.

```
Client
   │
   ▼
API
   │
   ├── DB Query
   ├── Cache Query
   └── Recommendation Service
```

The client waits **5 seconds**.

If the API starts three goroutines:

```
go queryDB()
go queryCache()
go queryRecommendation()
```

Each worker **must know** that the request expires after 5 seconds.

Instead:

```
go queryDB(ctx)
go queryCache(ctx)
go queryRecommendation(ctx)
```

Now each worker has the deadline.

This is **deadline propagation**.

---

## Why is this important?

Suppose the recommendation service takes 30 seconds.

Timeline:

```
0s   Request starts

3s   DB finishes

5s   Client disconnects

30s  Recommendation finishes
```

Without propagation:

```
Client
   │
   X disconnected

Recommendation goroutine
██████████████████████████████
Still consuming CPU
Still using memory
Still holding connections
```

The work is useless because nobody is waiting for the result.

---

## With deadline propagation

Every worker periodically checks

```go
select {
case <-ctx.Done():
    return
default:
}
```

or simply calls APIs that respect the context:

```go
db.QueryContext(ctx, ...)
```

When the deadline expires:

```
Client
   │
   X timeout

Context
   │
   ▼
Cancelled

Database
Redis
HTTP Client
Workers

All stop immediately
```

Everything exits together.

---

## The statement explained

> **The parent context deadline must be inherited by every worker goroutine/thread.**

Suppose your handler creates 10 workers.

Bad:

```go
go worker()
```

The worker has no idea when the request ends.

Good:

```go
go worker(ctx)
```

Every worker inherits

- cancellation
- deadline
- request values

---

## What happens if a worker ignores it?

Imagine this.

```
HTTP Handler

 ├── Worker A
 ├── Worker B
 └── Worker C
```

Client leaves after 2 seconds.

Worker B ignores the context.

```
Worker A
Stopped

Worker B
Still running...

Worker C
Stopped
```

Worker B may:

- hold a database connection
- keep CPU busy
- occupy memory
- hold file handles
- continue making external API calls

All for a request that no longer exists.

This is exactly what the sentence means:

> **A worker that ignores the deadline will hold resources long after the client has given up.**

---

## Real production example

Suppose a product search request.

```
Search API

├── Elasticsearch
├── Inventory Service
├── Pricing Service
└── Recommendation Engine
```

Client timeout = **3 seconds**

Recommendation Engine usually takes **10 seconds**.

Without context propagation:

```
3s

Client leaves

↓

Recommendation still computes

↓

CPU
Memory
Network

↓

Result discarded
```

Multiply this by:

```
5,000 requests/second
```

Now you have thousands of useless goroutines consuming resources.

---

## In Go

Bad:

```go
func handler(w http.ResponseWriter, r *http.Request) {
    go expensiveWork()
}
```

Good:

```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    go expensiveWork(ctx)
}
```

Worker:

```go
func expensiveWork(ctx context.Context) {

    for {
        select {

        case <-ctx.Done():
            return

        default:
            doSmallPieceOfWork()
        }
    }
}
```

Or better yet, use libraries that already support contexts:

```go
db.QueryContext(ctx, query)

http.NewRequestWithContext(ctx, ...)

grpcClient.Call(ctx, ...)
```

These operations will automatically stop when the context is canceled or its deadline is exceeded.

---

## Why this matters for an Observability Architect

In distributed systems, you often have request chains like:

```
Client
   │
API Gateway
   │
Service A
   │
Service B
   │
Database
```

If the client times out after 5 seconds, the cancellation should propagate all the way through the
call chain:

```
Client
   │
API Gateway
   │
Service A
   │
Service B
   │
Database
```

Each component should stop work as soon as it knows the request can no longer succeed. This reduces
wasted CPU, memory, network traffic, and connection pool usage. It also prevents "zombie" work that
can increase latency for active requests.

This propagation is one reason tracing systems such as
[[01-opentelemetry-sdks-and-semantic-conventions|OpenTelemetry]] often show spans ending early with
cancellation or deadline-exceeded errors—the context carrying the deadline flows with the request
through the entire distributed trace.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
