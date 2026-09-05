---
title: "Production Agent Systems"
description: "A book-shaped table of contents for Production Agent Systems: the runtime substrate, observability, reliability/security/governance, performance/cost engineering, and platform engineering underneath every agent in production. Book 4 of the AI Systems Engineering series."
tags: ["production-agent-systems", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202608101902-6"
noteType: moc
---

## Production Agent Systems

> _Running agents in production, for Principal & Staff Engineers (L6/L7)_
>
> This book assumes you already know how to build and evaluate an agent — see
> [[building-agentic-systems/readme|Building & Evaluating Agents]] first. If this were a book, this
> page is the table of contents. It is organized as a learning journey — from the runtime substrate
> through observability, reliability/security/governance, performance/cost engineering, and the
> internal platform other teams build agents on top of. Each chapter links out to the framework,
> platform, and SRE notes that already exist elsewhere in this wiki instead of duplicating them.
> Unwritten chapters are listed as **stub** rows, not empty files.

## Parts

### 00 — Production Infrastructure

The runtime substrate underneath every agent in production. See
`4-archive/h-aiops/02-playbooks/*.yaml` for real declarative playbook/orchestration artifacts.

- **Chapter 1.** [[01-agent-runtime|Agent Runtime]] — _(stub)_ — The execution substrate hosting an
  agent's reasoning loop — process model, container vs. serverless, cold-start latency,
  max-iteration/timeout enforcement.
- **Chapter 2.** [[02-session-management|Session Management]] — _(stub)_ — Session ID generation,
  TTL/idle-timeout policy, session affinity, and resuming a stale session on a different instance.
- **Chapter 3.** [[03-state-persistence|State Persistence]] — _(stub)_ — Durable stores for message
  history and working memory, write-ahead patterns, and snapshotting vs. event-log replay.
- **Chapter 4.** [[04-event-streaming|Event Streaming]] — _(stub)_ — Publishing agent lifecycle
  events onto a stream (Kafka, Kinesis) so observability/billing/audit can react without coupling to
  the request path.
- **Chapter 5.** [[05-message-queues|Message Queues]] — _(stub)_ — Decoupling long-running agent
  tasks from the synchronous request path — delivery semantics, idempotency keys, dead-letter
  queues.
- **Chapter 6.** [[06-workflow-engines|Workflow Engines]] — _(stub)_ — Orchestrating multi-step,
  long-running agent workflows with durable execution engines (Temporal, Step Functions) that resume
  after a crash.
- **Chapter 7.** [[07-distributed-execution|Distributed Execution]] — _(stub)_ — Running agent
  workloads across multiple nodes — sharding by session/tenant, coordinating shared state.
- **Chapter 8.** [[08-scheduling|Scheduling]] — _(stub)_ — Placing agent workloads onto compute —
  priority queues, autoscaling tied to queue depth/token throughput, preemption policy.
- **Chapter 9.** [[09-scaling-strategies|Scaling Strategies]] — Stateless vs. stateful agent design,
  offloading long-running work to queues, horizontal scaling, and rate limiting against the LLM
  provider.
- **Chapter 10.** [[10-multi-tenant-architectures|Multi-Tenant Architectures]] — _(stub)_ —
  Per-tenant rate limits and token budgets, noisy-neighbor containment, and the pool-vs-silo
  tradeoff for provider capacity.
- **Chapter 11.** [[11-high-availability|High Availability]] — _(stub)_ — Redundant LLM provider
  routing with failover, degraded-endpoint health checks, and graceful degradation under partial
  outage.
- **Chapter 12.** [[12-disaster-recovery|Disaster Recovery]] — _(stub)_ — RTO/RPO targets for
  stateful components, cross-region failover, and the recovery drill that validates a region loss
  doesn't corrupt in-flight tool calls.

### 01 — Observability

Watching the agent itself, not just the systems it touches. This Part covers the telemetry substrate
— metrics, traces, logs — while [[building-agentic-systems/readme|Building & Evaluating Agents]]'
Part 02 covers what you do with the scores that substrate feeds. Builds on
[[observability/readme|observability's Instrumentation Part]]; see
[[01-aiops-agentic-rca|AIOps / Agentic RCA]] for the conceptual frame this Part's chapters
implement.

- **Chapter 1.** [[01-ai-observability-fundamentals|AI Observability Fundamentals]] — Why agentic
  unpredictability (path, output, cost) demands observability and evals as one of two mitigations
  (guardrails being the other), business/commercial vs. LLM-as-judge evals, and why "the LLM
  hallucinated" isn't a valid excuse for the engineer who built the system.
- **Chapter 2.** [[02-agent-tracing|Agent Tracing]] — _(stub)_ — What AI observability adds on top
  of standard OTel instrumentation — spans around LLM and tool calls, tracing full agent execution,
  token usage as a first-class attribute.
- **Chapter 3.** [[03-token-metrics|Token Metrics]] — _(stub)_ — Treating input/output/cached token
  counts as first-class SLIs, and alerting on anomalies as an early signal of prompt drift or a
  runaway loop.
- **Chapter 4.** [[04-prompt-observability|Prompt Observability]] — _(stub)_ — Capturing and
  versioning the exact prompt sent on every call, with redaction rules for what's safe to log.
- **Chapter 5.** [[05-memory-observability|Memory Observability]] — _(stub)_ — Instrumenting what an
  agent actually retrieved from long-term memory — hit rate, relevance score distributions,
  embedding staleness.
- **Chapter 6.** [[06-tool-invocation-metrics|Tool Invocation Metrics]] — _(stub)_ — Per-tool
  latency, error rate, and call-volume dashboards, plus argument-validation failure tracking.
- **Chapter 7.** [[07-ai-logging|AI Logging]] — _(stub)_ — Structured logging conventions for an
  agent's reasoning trace, balancing debuggability against cost and privacy risk.
- **Chapter 8.** [[08-ai-slos|AI SLOs]] — _(stub)_ — SLOs, error budgets, incident response, and
  cost optimization applied to an agent workload — token cost as a first-class SLI and
  degrade-to-human-handoff as an error-budget policy.

### 02 — Reliability, Security & Governance

Threat model and safety net once an agent has real tool access. Closes with the two review-flagged
gaps: the specific failure-containment mechanics (circuit breakers, timeouts, runaway-loop
prevention) that a general "failure recovery" chapter doesn't fully cover, and the human-factors
side of trust — calibration and explainability — as a sibling to the existing approval-workflow
chapter rather than a duplicate of it.

- **Chapter 1.** [[01-guardrails|Guardrails]] — Input/output validation layers that constrain what
  an agent can say or do — schema constraints, content-safety classifiers.
- **Chapter 2.** [[02-prompt-injection|Prompt Injection]] — Authentication, authorization, and
  secrets management for an agent, plus the genuinely agent-specific threat: prompt injection
  defense and data privacy in a tool-calling loop.
- **Chapter 3.** [[03-jailbreak-prevention|Jailbreak Prevention]] — Prompt-injection-resistant
  system prompt structuring, instruction-hierarchy techniques, and red-teaming against known
  jailbreak corpora.
- **Chapter 4.** [[04-sandboxing|Sandboxing]] — Isolating code-execution and shell-access tools —
  container/VM isolation, egress restrictions, resource limits.
- **Chapter 5.** [[05-identity-and-authentication|Identity & Authentication]] — Service-to-service
  identity versus delegated user identity when an agent acts on a user's behalf.
- **Chapter 6.** [[06-authorization-and-permissions|Authorization & Permissions]] — Least-privilege
  tool permissions, per-tool RBAC/ABAC policy, and what the LLM can request versus what the runtime
  authorizes.
- **Chapter 7.** [[07-secrets-management|Secrets Management]] — Vault-backed secret injection at
  call time, rotation without redeploying the agent.
- **Chapter 8.** [[08-human-approval-systems|Human Approval Systems]] — Approval UI/API contract
  design, timeout/escalation behavior, and audit-trail requirements.
- **Chapter 9.** [[09-compliance|Compliance]] — Data residency, retention/deletion policy, and the
  audit evidence a compliance review actually asks for.
- **Chapter 10.** [[10-ai-governance|AI Governance]] — Organizational policy for what agents may be
  built, what models they may use, and who signs off before production.
- **Chapter 11.** [[11-failure-recovery|Failure Recovery]] — Partial-completion checkpointing,
  retry-with-backoff versus fail-fast policy, and distinguishing transient errors from genuine
  failures.
- **Chapter 12.** [[12-rollback-strategies|Rollback Strategies]] — Versioned prompt/model artifacts
  as deploy units, canary/shadow rollout, and rollback triggers tied to evaluation regressions.
- **Chapter 13.**
  [[13-circuit-breakers-and-timeout-strategies|Circuit Breakers & Timeout Strategies]] — The
  failure-containment mechanics one level below Failure Recovery: cascading-failure prevention,
  timeout budgets across a multi-hop tool chain, deadlock and oscillation detection between
  cooperating agents, and runaway-loop circuit breakers.
- **Chapter 14.** [[14-trust-and-explainability|Trust & Explainability]] — The human side of
  reliability that Human Approval Systems (Chapter 8) doesn't cover on its own: calibrating user
  trust to actual agent competence, confidence calibration, and explaining a decision after the fact
  well enough that a human can actually evaluate it, not just rubber-stamp it.

### 03 — Performance & Cost Engineering

Making an agent fast and affordable at scale.

- **Chapter 1.** [[01-latency-optimization|Latency Optimization]] — _(stub)_ — Model selection
  tradeoffs, reducing tool-call round trips, and time-to-first-token versus total completion time.
- **Chapter 2.** [[02-parallel-execution|Parallel Execution]] — Running independent tool calls and
  sub-agent tasks concurrently via code-driven fan-out/fan-in (sectioning and voting), bounding
  concurrency against provider rate limits, and the correctness hazards of parallel writes to shared
  agent state.
- **Chapter 3.** [[03-streaming-optimization|Streaming Optimization]] — _(stub)_ — Chunking strategy
  for tool-call detection mid-stream and buffering tradeoffs.
- **Chapter 4.** [[04-token-optimization|Token Optimization]] — _(stub)_ — Prompt compression,
  few-shot example pruning, and summarize-vs-truncate decisions.
- **Chapter 5.** [[05-context-optimization|Context Optimization]] — _(stub)_ — Relevance-ranked
  retrieval over raw dump, and the accuracy cost of over- versus under-stuffing context.
- **Chapter 6.** [[06-semantic-caching|Semantic Caching]] — _(stub)_ — Caching by semantic
  similarity rather than exact match, and similarity-threshold tuning to avoid serving a
  wrong-but-close cached answer.
- **Chapter 7.** [[07-response-caching|Response Caching]] — _(stub)_ — Exact-match and prefix
  caching, provider-level prompt caching versus application-level response caching.
- **Chapter 8.** [[08-cost-engineering|Cost Engineering]] — The engineering levers for agent cost —
  caching, batching, model routing/tiering, and inference optimization — attributed by
  tenant/feature with budget alerts on spend. Paired with the executive ROI framing in
  [[agentic-ai-projects-and-mastery/01-principal-and-staff-engineer-mastery/08-ai-economics-and-roi/08-ai-economics-and-roi|AI Economics & ROI (Part 01 of Agentic AI: Projects & Engineering Mastery)]],
  which this chapter feeds rather than duplicates.
- **Chapter 9.** [[09-capacity-planning|Capacity Planning]] — _(stub)_ — Translating request volume
  into token throughput requirements and provider rate-limit headroom planning.
- **Chapter 10.** [[10-performance-benchmarking|Performance Benchmarking]] — _(stub)_ — Synthetic
  load testing that mimics real tool-call patterns and identifies the actual bottleneck under load.

### 04 — AI Platform Engineering

Building the internal platform other teams build agents on top of — golden paths and paved roads,
applied to agent workloads specifically.

- **Chapter 1.** [[01-designing-internal-ai-platforms|Designing Internal AI Platforms]] — _(stub)_ —
  The reference architecture for an internal AI platform team — shared inference layer, tool/agent
  registry, paved-road SDKs.
- **Chapter 2.** [[02-agent-sdks|Agent SDKs]] — _(stub)_ — Building a first-party agent SDK versus
  adopting a vendor SDK — API stability, versioning, abstraction leakage.
- **Chapter 3.** [[03-agent-apis|Agent APIs]] — _(stub)_ — The contract layer for exposing agents as
  internal APIs — schemas, streaming vs. synchronous invocation, idempotency, versioning.
- **Chapter 4.** [[04-plugin-ecosystems|Plugin Ecosystems]] — _(stub)_ — Designing a
  plugin/extension model — tool manifests, capability declarations, sandboxed execution — so
  third-party tools register without a platform code change.
- **Chapter 5.** [[05-agent-registries|Agent Registries]] — _(stub)_ — A central registry of agents
  and tools with ownership metadata, capability tags, and discovery APIs.
- **Chapter 6.** [[06-ai-gateways|AI Gateways]] — _(stub)_ — A single ingress for model routing,
  rate limiting, cost attribution, and prompt/response logging across providers.
- **Chapter 7.** [[07-multi-model-infrastructure|Multi-Model Infrastructure]] — _(stub)_ — Routing
  and fallback across foundation models by cost/latency/capability tier, with circuit breakers and
  shadow-testing.
- **Chapter 8.** [[08-deployment-strategies|Deployment Strategies]] — _(stub)_ — Canary, blue-green,
  and shadow-deployment patterns for agent releases, where a bad deploy means bad tool calls, not
  just bad HTTP responses.
- **Chapter 9.** [[09-platform-operations|Platform Operations]] — _(stub)_ — The day-2 operating
  model — on-call ownership between platform and product teams, cost governance, platform SLOs.

## Metadata

|        |                          |
| ------ | ------------------------ |
| Author | Amit Singh               |
| Scope  | production-agent-systems |
