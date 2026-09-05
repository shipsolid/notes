---
title: "System Design"
description: "Principal/Staff-level system design reference collection for MAANG interview preparation — observability pipelines, distributed systems, reliability engineering, and beyond."
tags: ["system-design", "maang-prep", "observability"]
hidden: false
zettelId: "202606292300"
noteType: moc
---

## System Design

> A curated collection of Principal/Staff-level system design references, organized for MAANG
> interview preparation. Every design is grounded in lived production experience with Grafana Cloud,
> Alloy, Mimir, Loki, and Tempo at global scale.

## Purpose

This directory holds deep-dive system design documents structured for L6/L7 interview practice. Each
note covers one system end-to-end: requirements clarification, high-level architecture, component
deep dives, self-observability of the system, and trade-offs at 10x scale.

The collection is not generic — every design explicitly brings observability in as a first-class
structural concern, not an afterthought. That framing is the unfair advantage at MAANG: most
candidates bolt monitoring on at the end; these designs wire SLOs, trace propagation, cardinality
constraints, and alert routing into the architecture from the start.

The notes are accessible at `/notes/system-design/` on the site but are excluded from the main notes
index — they are an internal prep resource, not public reference material.

## How to Use Each Note

Every document follows the same five-step interview format:

1. **Clarify requirements** — scale envelope, signal types, consistency model, multi-tenancy needs.
   Spend the first 5 minutes here; the answers change the entire design.
2. **High-level design** — components and data flow at the whiteboard level.
3. **Deep dive** — storage layer, critical path, failure modes, protocol choices.
4. **Observability of the system itself** — how you would monitor the thing you just designed. This
   is the differentiator.
5. **Trade-offs at 10x scale** — what breaks first, what you would change, cost vs reliability
   tension.

Practice each section independently before running the full design end-to-end under time pressure.

Chapters are numbered per Part and restart at 1 in every Part. Most concept Parts (01–14, 16) now
carry their own **applied-practice case study** — a full five-step design of a system that exercises
that Part's theory, sitting right after the concept chapters (e.g. Part 05's Distributed Message
Queue, Part 02's Consensus & Leader Election, Part 08's Telemetry Ingestion Pipeline). Part 15
("Composite Case Studies") holds only the full-product designs that don't reduce to a single concept
— URL shorteners, chat systems, ride-hailing, payments, and the like. Concept chapters still link
out to existing designs, patterns, and platform notes elsewhere in this wiki rather than duplicating
them.

## Parts

### 01 — Engineering Mindset

The foundational habits of mind the rest of this curriculum builds on — what actually changes at the
L6/L7 bar, the systems-thinking lens, and the quantitative vocabulary (latency, throughput, queueing
theory) used in every later Part.

- [[01-what-changes-at-l6-l7|Chapter 1 — What Changes at L6/L7]] — _(stub)_
- [[02-thinking-in-systems|Chapter 2 — Thinking in Systems]] — _(stub)_
- [[system-design/01-engineering-mindset/03-performance-fundamentals/03-performance-fundamentals|Chapter 3 — Performance Fundamentals]]
  — _(stub)_

### 02 — Distributed Systems Theory

The general distributed-systems theory this book's case studies put into practice — read the concept
chapters here for the "why," then the applied-practice chapters (in this Part and in Parts 05
and 11) for "build it end-to-end."

- [[01-distributed-system-fundamentals|Chapter 1 — Distributed System Fundamentals]] — _(stub)_
- [[02-consistency-models|Chapter 2 — Consistency Models]] — _(stub)_
- [[03-cap-theorem-and-pacelc|Chapter 3 — CAP Theorem & PACELC]] — _(stub)_
- [[system-design/02-distributed-systems-theory/04-consensus-algorithms/04-consensus-algorithms|Chapter 4 — Consensus Algorithms]]
  — _(stub)_ — applied practice: [[09-consensus-and-leader-election|Consensus & Leader Election]]
- [[system-design/02-distributed-systems-theory/05-distributed-transactions/05-distributed-transactions|Chapter 5 — Distributed Transactions]]
  — _(stub)_ — Saga and Outbox are already fully written: [[15-saga|Saga]], [[14-outbox|Outbox]]
- [[06-data-replication|Chapter 6 — Data Replication]] — _(stub)_
- [[07-partitioning-and-sharding|Chapter 7 — Partitioning & Sharding]] — _(stub)_ — applied
  practice: [[08-distributed-key-value-store|Distributed Key-Value Store]]
- [[08-distributed-key-value-store|Chapter 8 — Distributed Key-Value Store (DynamoDB-like)]] —
  _(stub)_ — applied practice for Chapters 6–7: consistent hashing, replication, read/write quorum
- [[09-consensus-and-leader-election|Chapter 9 — Consensus & Leader Election]] — _(stub)_ — applied
  practice for Chapter 4: Raft/Paxos, split-brain prevention, fencing tokens
- [[10-distributed-lock-service|Chapter 10 — Distributed Lock Service]] — _(stub)_ — applied
  practice for Chapters 4/9: leases, fencing tokens, and the split-brain failure mode

### 03 — Storage Systems

Database internals underneath the design decisions in Part 02 and Part 15 — see
[[dbms/readme|dbms/]] for the deeper reference book this Part draws on.

- [[01-database-selection|Chapter 1 — Database Selection]] — _(stub)_
- [[system-design/03-storage-systems/02-indexing/02-indexing|Chapter 2 — Indexing]] — _(stub)_
- [[system-design/03-storage-systems/03-storage-engines/03-storage-engines|Chapter 3 — Storage Engines]]
  — _(stub)_
- [[system-design/03-storage-systems/04-data-lifecycle/04-data-lifecycle|Chapter 4 — Data Lifecycle]]
  — _(stub)_
- [[05-distributed-search-engine|Chapter 5 — Search Engine (Elasticsearch-like)]] — _(stub)_ —
  applied practice: inverted indexes, sharding, near-real-time indexing
- [[06-object-storage-s3|Chapter 6 — Object Storage (S3-like)]] — _(stub)_ — applied practice:
  erasure coding, durability math, consistent vs. eventually-consistent listing
- [[07-distributed-sql-database|Chapter 7 — Distributed SQL Database]] — _(stub)_ — applied
  practice: consensus-replicated storage under a SQL layer with distributed transactions

### 04 — Networking

The transport and API layer every design in this book sits on — see [[networks/readme|networks/]]
for fully-written OSI/protocol/gRPC/TLS reference material this Part links into rather than repeats.

- [[01-network-fundamentals|Chapter 1 — Network Fundamentals]] — _(stub)_ — see
  [[03-1-osi-layer-model|OSI Layer Model]], [[03-2-protocol-inventory|Protocol Inventory]]
- [[02-rpc-rest-graphql-grpc|Chapter 2 — RPC: REST, GraphQL, gRPC]] — _(stub)_ — see
  [[networks/05-http-ecosystem/05-grpc/05-grpc|gRPC]]
- [[system-design/04-networking/03-load-balancing/03-load-balancing|Chapter 3 — Load Balancing]] —
  _(stub)_
- [[04-cdn-and-edge-caching|Chapter 4 — CDN & Edge Caching]] — _(stub)_
- [[05-api-gateway|Chapter 5 — API Gateway]] — _(stub)_ — applied practice: routing, auth, rate
  limiting, and protocol translation as one front door for a service fleet

### 05 — Messaging Systems

Message-passing and event-driven building blocks — several already have real applied practice
elsewhere in this wiki, linked below.

- [[system-design/05-messaging-systems/01-message-brokers/01-message-brokers|Chapter 1 — Message Brokers]]
  — _(stub)_ — applied practice: [[04-distributed-message-queue|Distributed Message Queue]]
- [[02-event-streaming-cqrs|Chapter 2 — Event Streaming, CQRS & Event Sourcing]] — _(stub)_ — CQRS
  and Event Sourcing are already fully written: [[12-cqrs|CQRS]],
  [[13-event-sourcing|Event Sourcing]]; applied practice:
  [[05-stream-processing-system|Stream Processing System]]
- [[03-workflow-systems-temporal|Chapter 3 — Workflow Systems]] — _(stub)_
- [[04-distributed-message-queue|Chapter 4 — Distributed Message Queue (Kafka-like)]] — _(stub)_ —
  applied practice for Chapter 1: partitioning, consumer groups, at-least-once vs. exactly-once
- [[05-stream-processing-system|Chapter 5 — Stream Processing System (Flink-like)]] — _(stub)_ —
  applied practice for Chapter 2: watermarks, windowing, stateful operators, exactly-once
- [[06-notification-platform|Chapter 6 — Notification Platform]] — _(stub)_ — applied practice:
  fan-out to push/email/SMS with per-channel rate limits, retries, and delivery-guarantee trade-offs
- [[07-distributed-scheduler|Chapter 7 — Distributed Scheduler]] — _(stub)_ — applied practice:
  cron-at-scale — exactly-once trigger semantics, backfill, leader election for the scheduler itself

### 06 — Caching

- [[01-cache-design-patterns|Chapter 1 — Cache Design Patterns]] — _(stub)_
- [[02-distributed-cache|Chapter 2 — Distributed Cache]] — _(stub)_
- [[03-distributed-cache-case-study|Chapter 3 — Distributed Cache (Case Study)]] — _(stub)_ —
  applied practice for Chapters 1–2: sharding, eviction, cache-coherence under concurrent writes

### 07 — Reliability Engineering

Reliability theory underneath the SLO/error-budget and resilience work Amit already ships in
production — heavy link-out to real content below.

- [[01-reliability-sli-slo-sla|Chapter 1 — Reliability: SLI, SLO, SLA & Error Budgets]] — _(stub)_ —
  already fully written: [[02-slos-and-error-budgets|SLOs & Error Budgets]]; applied practice:
  [[05-slo-error-budget-tracking-system|SLO / Error Budget Tracking System]]
- [[system-design/07-reliability-engineering/02-resilience-patterns/02-resilience-patterns|Chapter 2 — Resilience Patterns]]
  — _(stub)_ — already fully written: [[07-circuit-breaker|Circuit Breaker]],
  [[09-bulkhead|Bulkhead]], [[08-retry-with-jitter|Retry with Jitter]],
  [[10-hedged-requests|Hedged Requests]]
- [[system-design/07-reliability-engineering/03-disaster-recovery/03-disaster-recovery|Chapter 3 — Disaster Recovery]]
  — _(stub)_
- [[04-chaos-engineering-and-game-days|Chapter 4 — Chaos Engineering & Game Days]] — _(stub)_
- [[05-slo-error-budget-tracking-system|Chapter 5 — SLO / Error Budget Tracking System]] — _(stub)_
  — applied practice for Chapter 1: burn-rate calculation, multi-window alerting, budget ledger
- [[06-incident-management-platform|Chapter 6 — Incident Management Platform]] — _(stub)_ — applied
  practice: alert correlation, incident lifecycle, escalation, runbook automation

### 08 — Observability

Curriculum coverage for completeness — almost every concept here is already fully written in
[[observability/readme|observability/]]; the concept chapters (1–4) are a thin pointer layer, not a
duplicate. Chapter 5 is the exception: the fully-written Telemetry Ingestion Pipeline case study (37
notes — the applied core of this Part).

- [[system-design/08-observability/01-observability-architecture/01-observability-architecture|Chapter 1 — Observability Architecture]]
  — the four correlated signals and why "three pillars" is a monitoring answer, not an architecture
  one
- [[system-design/08-observability/02-telemetry-pipelines/02-telemetry-pipelines|Chapter 2 — Telemetry Pipelines]]
  — OTel API/SDK split, the Collector's agent/gateway topology, and sampling trade-offs
- [[03-monitoring-at-scale|Chapter 3 — Monitoring at Scale]] — TSDB write path, cardinality as a
  storage-engine problem, and scaling out via Mimir/Cortex/Thanos
- [[04-alerting-systems|Chapter 4 — Alerting Systems]] — burn rate, multi-window alerting, symptom
  vs. cause-based paging, and noise reduction
- **Chapter 5 — Telemetry Ingestion Pipeline** — complete end-to-end case study: requirements →
  three-layer architecture → deep dives → self-observability → trade-offs at 10x scale
  - [[05-01-telemetry-ingestion-pipeline|Full Design]]
  - [[05-24-telemetry-gateways|Telemetry Gateways]] ·
    [[05-21-rate-limiting-architecture|Rate-Limiting Architecture]] ·
    [[05-22-retry-policies|Retry Policies]] · [[05-19-head-vs-tail-sampling|Head vs. Tail Sampling]]
  - Layer deep dives §3.1–3.8 and Practice Q&A (Q1–Q12) live alongside the full design in the same
    chapter directory
- [[06-metrics-storage-tsdb|Chapter 6 — Metrics Storage (TSDB)]] — _(stub)_ — write amplification,
  chunk encoding, compaction, cardinality explosion
- [[07-log-aggregation-system|Chapter 7 — Log Aggregation System]] — _(stub)_ — structured vs.
  unstructured, schema-on-read vs. schema-on-write, deduplication
- [[08-distributed-tracing-backend|Chapter 8 — Distributed Tracing Backend]] — _(stub)_ — trace
  assembly from spans, tail-based vs. head-based sampling
- [[09-multi-tenant-observability-platform|Chapter 9 — Multi-tenant Observability Platform]] —
  _(stub)_ — tenant isolation, quota enforcement, cost attribution
- [[10-otel-collector-pipeline|Chapter 10 — OpenTelemetry Collector Pipeline]] — _(stub)_ —
  multi-pipeline routing, processor chaining, exporter fan-out
- [[11-observability-data-lake|Chapter 11 — Observability Data Lake]] — _(stub)_ — cold/warm/hot
  tiers, Parquet storage, query federation (Thanos/Cortex/Mimir)
- [[12-cost-optimization-pipeline|Chapter 12 — Cost Optimization Pipeline]] — _(stub)_ — adaptive
  sampling, metric drop rules, cardinality-aware ingestion

### 09 — Cloud Architecture

- [[01-compute-platforms|Chapter 1 — Compute Platforms]] — _(stub)_ — see
  [[kubernetes/readme|kubernetes/]] for CKA-level fundamentals
- [[02-cloud-storage-services|Chapter 2 — Cloud Storage Services]] — _(stub)_
- [[system-design/09-cloud-architecture/03-multi-cloud-architecture/03-multi-cloud-architecture|Chapter 3 — Multi-Cloud Architecture]]
  — _(stub)_
- [[04-kubernetes-control-plane|Chapter 4 — Kubernetes Control Plane]] — _(stub)_ — applied
  practice: etcd, the API server, schedulers, and controllers as a distributed-systems case study
- [[05-cloud-file-storage-google-drive|Chapter 5 — Cloud File Storage (Google Drive-like)]] —
  _(stub)_ — applied practice: chunked upload/sync, conflict resolution, metadata-service design

### 10 — Security

- [[01-identity-oauth-oidc-jwt-mtls|Chapter 1 — Identity: OAuth, OIDC, JWT, SPIFFE, mTLS]] —
  _(stub)_ — see [[02-tls-offload|TLS Offload]]
- [[02-security-architecture-zero-trust|Chapter 2 — Security Architecture & Zero Trust]] — _(stub)_
- [[03-secrets-manager|Chapter 3 — Secrets Manager]] — _(stub)_ — applied practice: envelope
  encryption, key rotation, access-audit trails (Vault/KMS-like)

### 11 — Scalability

- [[01-scaling-patterns|Chapter 1 — Scaling Patterns]] — _(stub)_
- [[02-geo-distributed-systems|Chapter 2 — Geo-Distributed Systems]] — _(stub)_
- [[03-cost-engineering-finops|Chapter 3 — Cost Engineering & FinOps]] — _(stub)_
- [[04-capacity-planning-system|Chapter 4 — Capacity Planning System]] — _(stub)_ — growth modeling,
  headroom analysis, cost vs. reliability simulation
- [[05-distributed-rate-limiter|Chapter 5 — Global Rate Limiter (Distributed)]] — _(stub)_ — applied
  practice: token/leaky bucket, sliding window, Redis-backed global limiter
- [[06-ride-matching-engine|Chapter 6 — Ride Matching Engine]] — _(stub)_ — applied practice:
  geospatial indexing (geohash/quadtree/H3) and the matching algorithm's latency budget
- [[07-multi-tenant-saas-platform|Chapter 7 — Multi-Tenant SaaS Platform]] — _(stub)_ — applied
  practice: tenant isolation, noisy-neighbor containment, per-tenant cost attribution

### 12 — Architecture Patterns

- [[01-monoliths-and-modular-monolith|Chapter 1 — Monoliths & the Modular Monolith]] — _(stub)_ —
  see [[01-monolithic|Monolithic]], [[02-strangler-fig|Strangler Fig]]
- [[system-design/12-architecture-patterns/02-microservices/02-microservices|Chapter 2 — Microservices]]
  — _(stub)_
- [[03-event-driven-architecture|Chapter 3 — Event-Driven Architecture]] — _(stub)_ — see
  [[12-cqrs|CQRS]], [[13-event-sourcing|Event Sourcing]]
- [[04-data-mesh|Chapter 4 — Data Mesh]] — _(stub)_
- [[system-design/12-architecture-patterns/05-service-mesh/05-service-mesh|Chapter 5 — Service Mesh]]
  — _(stub)_ — see [[01-sidecar|Sidecar]], [[envoy|tech/envoy.md]]
- [[06-platform-engineering-overview|Chapter 6 — Platform Engineering]] — _(stub)_
- [[07-feature-flag-platform|Chapter 7 — Feature Flag Platform]] — _(stub)_ — applied practice:
  low-latency flag evaluation, targeting rules, safe rollout/rollback
- [[08-ci-cd-platform|Chapter 8 — CI/CD Platform]] — _(stub)_ — applied practice: build queueing,
  artifact caching, progressive-delivery rollout

### 13 — AI-era System Design

- [[01-designing-ai-systems-rag-vector-db|Chapter 1 — Designing AI Systems: RAG & Vector Databases]]
  — _(stub)_ — see [[01-agent-architecture|Agent Architecture]]
- [[02-ai-infrastructure-gpu-model-serving|Chapter 2 — AI Infrastructure]] — _(stub)_
- [[03-ai-observability|Chapter 3 — AI Observability]] — _(stub)_ — see
  [[01-aiops-agentic-rca|AIOps / Agentic RCA]]
- [[04-runbook-automation-aiops-engine|Chapter 4 — Runbook Automation / AIOps Engine]] — _(stub)_ —
  applied practice: LLM-powered diagnosis, trigger-action mappings, safety guardrails
- [[05-recommendation-engine|Chapter 5 — Recommendation Engine]] — _(stub)_ — applied practice:
  candidate generation, ranking, online/offline serving split
- [[06-large-scale-ai-agent-platform|Chapter 6 — Large-Scale AI Agent Platform]] — _(stub)_ —
  applied practice: tool-call orchestration, memory/state, cost-aware model routing at fleet scale

### 14 — Interview Frameworks

- [[01-interview-methodology|Chapter 1 — Interview Methodology]] — _(stub)_
- [[02-whiteboarding-and-communication|Chapter 2 — Whiteboarding & Communication]] — _(stub)_
- [[03-architecture-reviews-defending-decisions|Chapter 3 — Architecture Reviews: Defending Decisions]]
  — _(stub)_

### 15 — Composite Case Studies

The full-product designs that don't reduce to a single concept Part — each exercises half a dozen
Parts at once. Use the five-step format above. Component-level case studies (message queue, KV
store, rate limiter, telemetry pipeline, and the rest) now live as applied-practice chapters in the
concept Part that owns their dominant idea — see Parts 02–13.

- [[01-url-shortener|Chapter 1 — URL Shortener]] — _(stub)_ — the canonical warm-up: ID-generation
  strategy and read-heavy caching are the whole design
- [[02-chat-system|Chapter 2 — Chat System]] — _(stub)_ — real-time delivery, presence, and ordering
  guarantees at WhatsApp/Messenger scale
- [[03-video-streaming|Chapter 3 — Video Streaming]] — _(stub)_ — transcoding pipelines, adaptive
  bitrate, CDN placement (YouTube/Netflix-like)
- [[04-news-feed|Chapter 4 — News Feed]] — _(stub)_ — fan-out-on-write vs. -on-read ranked delivery
  (Facebook/Twitter-like)
- [[05-collaborative-document-editor|Chapter 5 — Collaborative Document Editor]] — _(stub)_ —
  operational transforms and CRDTs for real-time multi-user editing (Google Docs-like)
- [[06-ride-hailing-platform-uber|Chapter 6 — Ride-Hailing Platform (Uber-like)]] — _(stub)_ —
  rider/driver matching, geospatial indexing, surge pricing under real-time load
- [[07-payment-system|Chapter 7 — Payment System]] — _(stub)_ — idempotent transaction processing,
  ledger design, exactly-once where a bug moves real money twice
- [[08-github-scale-version-control|Chapter 8 — GitHub-Scale Version Control]] — _(stub)_ — Git
  object storage, fork/merge at scale, the read-heavy caching layer

### 16 — Principal Engineer Topics

The leadership and organizational layer above pure system design — what separates a Principal from a
Staff-plus-strong-technical-skills engineer.

- [[01-architectural-decision-records|Chapter 1 — Architectural Decision Records]] — _(stub)_ — see
  the `adr-writer` skill for producing one
- [[02-evolutionary-architecture|Chapter 2 — Evolutionary Architecture]] — _(stub)_ — see
  [[02-strangler-fig|Strangler Fig]]
- [[system-design/16-principal-engineer-topics/03-build-vs-buy/03-build-vs-buy|Chapter 3 — Build vs. Buy]]
  — _(stub)_
- [[04-organization-scaling|Chapter 4 — Organization Scaling]] — _(stub)_
- [[05-platform-strategy|Chapter 5 — Platform Strategy]] — _(stub)_
- [[06-engineering-economics|Chapter 6 — Engineering Economics]] — _(stub)_
- [[07-technical-debt-management|Chapter 7 — Technical Debt Management]] — _(stub)_
- [[08-leading-cross-functional-architecture|Chapter 8 — Leading Cross-Functional Architecture]] —
  _(stub)_
- [[09-executive-communication|Chapter 9 — Executive Communication]] — _(stub)_
- [[10-principal-engineer-interview-prep|Chapter 10 — Principal Engineer Interview Preparation]] —
  _(stub)_ — see the `mock-interview-driver` and `star-story-crafter` skills

## Common

Reusable engineering concepts — as opposed to prep/process material above — live inside
[[observability/readme|observability/]]'s book-chapter structure instead, shared with the pattern
library too. For example, [[03-push-vs-pull-ingestion]] used to live nested under the telemetry
ingestion pipeline design, then moved to a shared `concepts/` shelf once it became clear the idea
applies well beyond that one design; it now lives in `observability/02-pipeline/` as part of the
observability book, and this design links in rather than owning it.

## Adding a New Design

1. Decide where it belongs. A case study that exercises one dominant concept goes in that concept
   Part (01–14, 16) as an applied-practice chapter, right after the concept chapters; a full-product
   design that spans many concepts at once goes in Part 15 (Composite Case Studies). Then create a
   new chapter directory under that Part, numbered for its position within it — chapter numbers
   restart at 1 in every Part, they don't continue the previous Part's count:
   `0X-part-slug/NN-system-slug/`.
2. Add a content file named for the chapter (`NN-system-slug.md` — same `NN-` prefix as the
   directory, never `README.md`) with the required frontmatter, prefixing `title` with
   `Chapter <N> —`:

   ```yaml
   ---
   title: "Chapter <N> — <System Name>"
   description: "<One-line summary of the design focus and scale target>"
   tags: ["system-design", "<domain>", "maang-prep"]
   updated: <YYYY-MM-DD>
   hidden: false
   ---
   ```

3. Structure the body using the five-step format above, and prefix the first `##` heading the same
   way: `## Chapter <N> — <System Name>`.
4. Update this Part's entry in the **Parts** section above, prefixing the link text with
   `Chapter <N> —` to match.

## Metadata

| Dimension    | Detail                                                                              |
| ------------ | ----------------------------------------------------------------------------------- |
| Author       | Amit Singh                                                                          |
| Scope        | MAANG interview preparation — not production documentation                          |
| Access       | Internal — individual design notes are `hidden` per-note; this root index is public |
| Landing page | `src/pages/notes/system-design/index.astro` → `/notes/system-design/`               |
