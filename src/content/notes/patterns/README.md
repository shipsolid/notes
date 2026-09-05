---
title: "Patterns"
description: "A book-shaped table of contents for reusable engineering patterns spanning object-oriented design, enterprise architecture, distributed systems, messaging, APIs, cloud infrastructure, observability, security, concurrency, AI/agentic systems, and organizational design — grounded in production experience at scale."
tags: ["patterns", "book", "distributed-systems", "reliability", "maang-prep"]
hidden: false
zettelId: "202606301322"
noteType: moc
---

## Patterns

> A curated library of reusable engineering patterns drawn from production experience across global
> observability platforms, AKS clusters, and SRE practice, extended to the full Principal/Staff
> (L6/L7) pattern landscape. Each pattern is opinionated — it names the context, the forces at play,
> the solution, and the trade-offs. If this were a book, this page is the table of contents: each
> Part groups patterns that solve the same class of problem, from pattern thinking itself, through
> object-oriented design, enterprise architecture, and microservices, out to distributed systems,
> cloud infrastructure, observability, security, and organizational design. Where a Part overlaps a
> sibling book already covering the same concept in depth (GoF in `object-oriented-programming/`,
> caching/consensus in `system-design/`, K8s multi-container patterns in `kubernetes/`), that Part's
> chapters link out to it rather than duplicate it.

## Purpose

This directory holds design patterns structured for repeated application and quick recall. Unlike
one-off system designs, these are building blocks: pull out a pattern, adapt it to the target
system, and wire it in. The framing keeps observability and reliability as first-class properties of
every pattern, not afterthoughts.

The notes are accessible at `/notes/patterns/` on the site but are excluded from the main notes
index — they are an internal reference, not public material.

## How to Use Each Note

Each pattern follows a consistent structure:

1. **Context** — the situation where this pattern applies
2. **Problem** — the force or constraint being resolved
3. **Solution** — the canonical approach, with a diagram where useful
4. **Consequences** — what you gain, what you give up
5. **Known uses** — where this has been applied in production

## Parts

### 00 — Pattern Thinking

Before the catalog, the vocabulary: what makes something a pattern rather than a one-off decision,
how to choose between competing patterns under real forces, and SOLID reframed at architecture scale
rather than as a five-bullet mnemonic.

- [[01-what-is-a-pattern|01 — What Is a Pattern?]] — _(stub)_
- [[02-pattern-selection-and-trade-offs|02 — Pattern Selection & Trade-offs]] — _(stub)_
- [[03-solid-revisited|03 — SOLID Revisited — Principal-Level Framing]] — _(stub)_ — see also the
  per-principle 101-level stubs in
  [[object-oriented-programming/readme|Object-Oriented Programming]]

### 01 — Object-Oriented Design Patterns (GoF)

The classic Gang of Four catalog, framed as composition and trade-off decisions rather than a
23-pattern memorization exercise. Per-pattern 101-level stubs already live in
[[object-oriented-programming/readme|Object-Oriented Programming]]; these chapters are the
principal-level synthesis layer on top.

- [[patterns/01-object-oriented-design-patterns/01-creational-patterns/01-creational-patterns|01 — Creational Patterns]]
  — _(stub)_
- [[patterns/01-object-oriented-design-patterns/02-structural-patterns/02-structural-patterns|02 — Structural Patterns]]
  — _(stub)_
- [[patterns/01-object-oriented-design-patterns/03-behavioral-patterns/03-behavioral-patterns|03 — Behavioral Patterns]]
  — _(stub)_

### 02 — Enterprise Application Patterns

How a domain model stays coherent and how it talks to everything outside it — layering styles, DDD's
tactical toolkit, transactional integrity, and integration. A genuine gap: no other book in this
repo covers Hexagonal/Clean architecture or DDD's Aggregate/Entity/Repository vocabulary.

- [[01-layering-patterns|01 — Layering Patterns]] — _(stub)_
- [[02-domain-modeling-patterns|02 — Domain Modeling Patterns]] — _(stub)_
- [[03-transaction-patterns|03 — Transaction Patterns]] — _(stub)_ — see also
  [[14-outbox|Transactional Outbox]]
- [[04-integration-patterns|04 — Integration Patterns]] — _(stub)_

### 03 — Dependency Injection Patterns

How a dependency graph gets assembled, and how a system stays open to new behavior without
recompiling its core.

- [[patterns/03-dependency-injection-patterns/01-dependency-management/01-dependency-management|01 — Dependency Management Patterns]]
  — _(stub)_
- [[02-extensibility-patterns|02 — Extensibility Patterns]] — _(stub)_

### 04 — Microservice Patterns

The biggest Part in the book — it absorbs what used to be this book's entire original 4-Part
scaffold (Structural, Communication, Data, Resilience & Operational), regrouped under the outline's
own Service Decomposition / Service Communication / Reliability / Data Patterns chapters. Grouped
below with bold sub-headings for scannability; still one Part, matching the outline.

**Decomposition** — one monolith or many services, and how to migrate between them without a
big-bang rewrite.

- [[01-monolithic|01 — Monolith — Modular and Majestic]] — a single deployable unit with
  well-defined internal module boundaries; the right answer when decomposition cost exceeds the
  benefit
- [[02-strangler-fig|02 — Strangler Fig]] — incrementally replace a legacy system by routing new
  functionality to a new implementation while the old system keeps running
- [[03-service-decomposition|03 — Service Decomposition]] — _(stub)_ — the remaining decomposition
  axes: By Business Capability, By Domain, By Bounded Context, Self-Contained Systems

**Communication** — coordinating work and surviving load without one slow or failed component taking
down the request.

- **04 — Fan-Out / Fan-In** — decompose a request into parallel sub-tasks, execute concurrently,
  merge results; the fullest chapter in this book — nine worked practice questions plus an
  observability-KPI companion note
  - [[04-1-fan-out-fan-in|Fan-Out / Fan-In]]
  - [[04-2-fan-out-olly-kpis|Observability KPIs for the Fan-out / Fan-in Pattern]]
  - [[04-3-q1-answer-search-fan-out-design|Q1 — Search Fan-Out Design]]
  - [[04-4-q2-answer-hedging-trade-off|Q2 — Hedging Trade-off]]
  - [[04-5-q3-answer-context-cancellation-leak|Q3 — Context Cancellation Leak]]
  - [[04-6-q4-answer-aggregator-bottleneck|Q4 — Aggregator Bottleneck]]
  - [[04-7-q5-answer-sizing-the-fan-out-width|Q5 — Sizing the Fan-Out Width]]
  - [[04-8-q6-answer-retry-storm|Q6 — Retry Storm]]
  - [[04-9-q7-answer-backpressure-and-load-shedding|Q7 — Backpressure and Load Shedding]]
  - [[04-10-q8-answer-hierarchical-fan-out|Q8 — Hierarchical Fan-Out]]
  - [[04-11-q9-answer-validating-hedging-and-deadline-propagation|Q9 — Validating Hedging and Deadline Propagation]]
- [[05-backpressure|05 — Backpressure]] — signal from a slow consumer to a fast producer to slow
  down
- [[06-service-communication|06 — Service Communication]] — _(stub)_ — the remaining communication
  styles: Request-Response, Async Messaging, Event Streaming, Pub/Sub, RPC/gRPC

**Reliability** — stopping cascading failure, controlling retries, and isolating blast radius.

- [[07-circuit-breaker|07 — Circuit Breaker]] — stop calls to a failing dependency before they
  cascade
- [[08-retry-with-jitter|08 — Retry with Exponential Backoff and Jitter]] — retry transient failures
  without a thundering herd
- [[09-bulkhead|09 — Bulkhead]] — partition resources so one failure can't exhaust another's
- [[10-hedged-requests|10 — Hedged Requests]] — send the same request to multiple replicas, use
  whichever responds first, cancel the rest
- [[11-reliability-patterns|11 — Reliability Patterns (Microservice Building Blocks)]] — _(stub)_ —
  the remaining building blocks: Timeout, Rate Limiter, Fallback, Adaptive Concurrency

**Data** — keeping data consistent and recoverable once writes and reads happen independently,
asynchronously, or across service boundaries.

- [[12-cqrs|12 — CQRS — Command Query Responsibility Segregation]] — separate the write model
  (commands) from the read model (queries)
- [[13-event-sourcing|13 — Event Sourcing]] — store state as an immutable, append-only sequence of
  domain events
- [[14-outbox|14 — Transactional Outbox]] — atomically write to the database and publish a message
- [[15-saga|15 — Saga]] — distributed transactions via a sequence of local transactions with
  compensations
- [[16-data-patterns|16 — Data Patterns (Microservice)]] — _(stub)_ — the remaining data-ownership
  patterns: Database-per-Service, Shared Database, Materialized View

### 05 — Distributed Systems Patterns

Consensus, coordination, replication, and consistency — the primitives underneath every pattern in
this book that assumes multiple nodes agree on something.

- [[01-consensus-patterns|01 — Consensus Patterns]] — _(stub)_ — see also
  `system-design/02-distributed-systems-theory/04-consensus-algorithms.md` and `dbms`'s
  consensus-in-databases note
- [[02-coordination-patterns|02 — Coordination Patterns]] — _(stub)_
- [[03-replication-patterns|03 — Replication Patterns]] — _(stub)_
- [[04-consistency-patterns|04 — Consistency Patterns]] — _(stub)_

### 06 — Messaging Patterns

Broker topologies, event patterns, and stream processing semantics — building on Event Sourcing and
Saga, already covered in this book.

- [[01-message-broker-patterns|01 — Message Broker Patterns]] — _(stub)_
- [[02-event-patterns|02 — Event Patterns]] — _(stub)_ — see also
  [[13-event-sourcing|Event Sourcing]] and [[15-saga|Saga]]
- [[03-streaming-patterns|03 — Streaming Patterns]] — _(stub)_

### 07 — API Patterns

REST, RPC, and API Gateway design — the contract layer between a service and everything that calls
it.

- [[01-rest-patterns|01 — REST Patterns]] — _(stub)_
- [[02-rpc-patterns|02 — RPC Patterns]] — _(stub)_
- [[03-api-gateway-patterns|03 — API Gateway Patterns]] — _(stub)_ — see also
  `system-design/04-networking/05-api-gateway/05-api-gateway.md`

### 08 — Data Patterns (Database, Caching & Search)

Database design, caching, and search — distinct from Part 04's microservice-scoped Data Patterns
chapter (the outline reuses "Data Patterns" as a title twice; disambiguated here).

- [[01-database-design-patterns|01 — Database Design Patterns]] — _(stub)_
- [[02-caching-patterns|02 — Caching Patterns]] — _(stub)_ — see also
  `system-design/06-caching/01-cache-design-patterns.md`
- [[03-search-patterns|03 — Search Patterns]] — _(stub)_

### 09 — Cloud Native Patterns

Kubernetes multi-container patterns, deployment strategies, and multi-region availability.

- [[01-sidecar|01 — Sidecar]] — co-locate a helper container to handle cross-cutting concerns
- [[02-kubernetes-patterns|02 — Kubernetes Patterns]] — _(stub)_ — the remaining multi-container and
  control-plane patterns: Ambassador, Adapter, Init Container, Operator — see also
  `kubernetes/03-application-design-and-build/multi-container-pod-patterns.md` and
  `platform-engineering/02-platform-control-plane/crds-and-operators.md`
- [[03-cloud-infrastructure-patterns|03 — Cloud Infrastructure Patterns]] — _(stub)_ — includes
  Blue-Green/Canary/Rolling deployment strategies
- [[04-multi-region-patterns|04 — Multi-Region Patterns]] — _(stub)_

### 10 — Observability Patterns

Monitoring, logging, tracing, and alerting frameworks — the vocabulary layer above the
[[observability/readme|Observability]] book's build-level instrumentation detail, which this Part
links to rather than duplicates.

- [[01-monitoring-patterns|01 — Monitoring Patterns]] — _(stub)_
- [[02-logging-patterns|02 — Logging Patterns]] — _(stub)_
- [[03-tracing-patterns|03 — Tracing Patterns]] — _(stub)_
- [[04-alerting-patterns|04 — Alerting Patterns]] — _(stub)_ — see also
  `3-references/Observability/slo/slo-design-patterns.md`

### 11 — Reliability Patterns (Resilience, Availability & Scale)

System-level resilience postures, availability practices, and scaling levers — one level above any
single pattern like Circuit Breaker or Bulkhead. Named "Resilience, Availability & Scale" rather
than "Reliability Patterns" to avoid colliding with Part 04's chapter of the same outline title.

- [[01-resilience|01 — Resilience Patterns]] — _(stub)_
- [[02-availability|02 — Availability Patterns]] — _(stub)_ — see also
  `4-archive/g-reliability/chaos/` and the `dr-runbook-writer` skill
- [[patterns/11-resilience-availability-scale/03-scalability/03-scalability|03 — Scalability Patterns]]
  — _(stub)_

### 12 — Security Patterns

Authentication, authorization, and secure communication — a genuine gap; `b-security/` is
charter-only with no content yet.

- [[01-authentication-patterns|01 — Authentication Patterns]] — _(stub)_
- [[02-authorization-patterns|02 — Authorization Patterns]] — _(stub)_
- [[03-secure-communication-patterns|03 — Secure Communication Patterns]] — _(stub)_

### 13 — Concurrency Patterns

Threading, lock-free programming, and async composition — the concurrency primitives underneath
patterns like Fan-Out/Fan-In and Backpressure.

- [[01-threading-patterns|01 — Threading Patterns]] — _(stub)_
- [[patterns/13-concurrency-patterns/02-lock-free-programming/02-lock-free-programming|02 — Lock-Free Programming]]
  — _(stub)_
- [[03-async-patterns|03 — Async Patterns]] — _(stub)_

### 14 — AI & Agentic System Patterns

The pattern vocabulary for composing LLM calls into a system — a synthesis layer above
[[agentic-ai-engineering/readme|Agentic AI Engineering]]'s and
[[building-agentic-systems/readme|Building & Evaluating Agents]]' build-level RAG and multi-agent
content, which this Part links to rather than rebuilds.

- [[01-llm-system-patterns|01 — LLM System Patterns]] — _(stub)_ — see also
  `agentic-ai-engineering/02-memory-systems/`,
  `agentic-ai-engineering/05-retrieval-and-knowledge-systems/`, and
  `building-agentic-systems/01-multi-agent-systems/`
- [[02-ai-infrastructure-patterns|02 — AI Infrastructure Patterns]] — _(stub)_

### 15 — Organizational Patterns

Team Topologies, Conway's Law, and the governance scaffolding that lets an organization make
architecture decisions without every one becoming a meeting.

- [[patterns/15-organizational-patterns/01-team-topologies/01-team-topologies|01 — Team Topologies]]
  — _(stub)_ — see also `observability/07-org-and-narrative/building-a-platform-team.md`
- [[patterns/15-organizational-patterns/02-conways-law/02-conways-law|02 — Conway's Law]] — _(stub)_
- [[03-engineering-leadership-patterns|03 — Engineering Leadership Patterns]] — _(stub)_ — see also
  the `adr-writer` skill and `a-governance/`'s ADR process

### 16 — Architecture Decision Patterns

Recurring architecture forks and the trade-off frameworks that actually resolve them.

- [[01-decision-making-patterns|01 — Decision-Making Patterns]] — _(stub)_ — see also
  [[01-monolithic|Monolith]] and [[02-strangler-fig|Strangler Fig]]
- [[02-trade-off-analysis|02 — Trade-off Analysis Frameworks]] — _(stub)_

### 17 — Pattern Composition

How patterns interact once more than one is applied to the same system, the failure modes that look
like patterns but aren't, and case studies of how real companies combined them in production.

- [[01-combining-patterns|01 — Combining Patterns]] — _(stub)_
- [[02-anti-patterns|02 — Anti-Patterns]] — _(stub)_
- [[03-case-studies|03 — Pattern Case Studies]] — _(stub)_ — one chapter covering
  Amazon/Google/Netflix/Uber/Stripe/LinkedIn/Cloudflare; splits into per-company notes once one is
  actually researched and written

> **Deferred:** the outline's Appendix (cross-cutting matrices and cheat sheets) isn't stubbed here
> — it's a reference index over content that doesn't exist yet. Worth a follow-up pass once enough
> of the chapters above are actually written to make the matrices meaningful.

## Shared Concepts

Some ideas support more than one pattern — or a full system design — without being a pattern
themselves. Those live inside [[observability/readme|observability/]]'s book-chapter structure
instead of nested under whichever pattern first needed them, and get pulled in via `[[wikilink]]`
from wherever they're relevant:

- [[08-deadline-propagation]] — a client deadline must be inherited by every downstream call
- [[05-partial-results-vs-fail-fast]] — fail-fast vs. best-effort vs. quorum when part of a fan-out
  fails
- [[02-shards-workers]] — the distinction between a data partition and an execution unit
- [[09-trace-shape]] — how a scatter-gather call tree should look in a distributed trace
- [[08-query-sharding]] — splitting one query's computation across N workers, distinct from
  partitioning where the data lives

See [[observability/readme|observability/README.md]] for the full book structure, including concepts
shared with the design library.

## Metadata

| Dimension    | Detail                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Author       | Amit Singh                                                                                     |
| Scope        | Engineering reference — not production documentation                                           |
| Access       | Internal — hidden from public notes index via `HIDDEN_TOPICS` in `src/pages/notes/index.astro` |
| Landing page | `src/pages/notes/patterns/index.astro` → `/notes/patterns/`                                    |
