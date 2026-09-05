---
title: "AI Architecture & System Design"
description: "A book-shaped table of contents for AI Architecture & System Design: the cross-cutting agent pattern catalog and full enterprise system-design case studies at L6/L7 interview depth. Book 5 of the AI Systems Engineering series."
tags: ["ai-architecture-and-system-design", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202608101902-3"
noteType: moc
---

## AI Architecture & System Design

> _Cross-cutting patterns and system design, for Principal & Staff Engineers (L6/L7)_
>
> This book assumes you can already build, evaluate, and run an agent — see
> [[production-agent-systems/readme|Production Agent Systems]] first. If this were a book, this page
> is the table of contents. It is organized as a learning journey — from the pattern catalog that
> formalizes what earlier books introduced in passing, through full system-design case studies
> grounded in real production agent products. Each chapter links out to the framework, platform, and
> SRE notes that already exist elsewhere in this wiki instead of duplicating them. Unwritten
> chapters are listed as **stub** rows, not empty files.

## Parts

### 00 — AI Architecture Patterns

The cross-cutting pattern catalog. Two of these chapters formalize patterns already introduced in
context in [[building-agentic-systems/readme|Building & Evaluating Agents]]' Parts 00–01 — they
cross-reference back rather than re-teaching from scratch, and are the single canonical source for
each pattern's full treatment; every other chapter that mentions Router Pattern or Planner–Executor
Pattern in passing links back here.

- **Chapter 1.** [[01-architectural-thinking|Architectural Thinking]] — _(stub)_ — How to evaluate
  an agentic architecture pattern against determinism, cost, latency, and blast-radius tradeoffs
  rather than picking the newest framework default.
- **Chapter 2.**
  [[ai-architecture-and-system-design/00-ai-architecture-patterns/02-planner-executor-pattern/02-planner-executor-pattern|Planner–Executor Pattern]]
  — The canonical treatment. Formalizes the planner–executor pattern introduced in
  [[building-agentic-systems/00-building-single-agent-systems/02-planner-executor-pattern/02-planner-executor-pattern|Building Single-Agent Systems]]
  as a reusable pattern, with applicability criteria and trade-offs against the rest of this
  catalog.
- **Chapter 3.** [[03-supervisor-pattern|Supervisor Pattern]] — _(stub)_ — Formalizes the supervisor
  pattern introduced in
  [[building-agentic-systems/01-multi-agent-systems/09-supervisor-architectures/09-supervisor-architectures|Multi-Agent Systems]],
  covering when a central supervisor outperforms peer-to-peer coordination and where it bottlenecks.
- **Chapter 4.** [[04-orchestrator-worker-pattern|Orchestrator–Worker Pattern]] — An orchestrator
  LLM decomposes a task into subtasks at runtime and a synthesizer LLM combines worker results — the
  single fact that distinguishes it from
  [[production-agent-systems/03-performance-and-cost-engineering/02-parallel-execution/02-parallel-execution|Parallel Execution]]
  (whether decompose/aggregate are LLM calls or fixed code), worker failure isolation, and when it
  beats a supervisor-style hierarchy.
- **Chapter 5.** [[05-router-pattern|Router Pattern]] — The canonical treatment. Formalizes the
  router pattern introduced in
  [[building-agentic-systems/00-building-single-agent-systems/03-router-pattern/03-router-pattern|Building Single-Agent Systems]],
  covering intent classification and confidence-based fallback.
- **Chapter 6.** [[06-blackboard-pattern|Blackboard Pattern]] — _(stub)_ — A shared, structured
  workspace multiple specialist agents read and write to opportunistically, versus explicit
  message-passing.
- **Chapter 7.** [[07-event-driven-pattern|Event-Driven Pattern]] — _(stub)_ — Building agent
  systems on an event bus — event schema design, at-least-once delivery, idempotent reactions to
  replayed events.
- **Chapter 8.** [[08-memory-centric-pattern|Memory-Centric Pattern]] — _(stub)_ — Architectures
  where long-term/episodic memory, not the planner, is the primary coordination substrate.
- **Chapter 9.** [[09-human-approval-pattern|Human Approval Pattern]] — _(stub)_ — Designing
  human-in-the-loop checkpoints for high-risk actions without becoming a rubber-stamp bottleneck.
- **Chapter 10.** [[10-agent-mesh-pattern|Agent Mesh Pattern]] — _(stub)_ — A decentralized mesh of
  peer agents that discover and negotiate directly, contrasted with centralized
  orchestrator/supervisor patterns.
- **Chapter 11.** [[11-pattern-selection-framework|Pattern Selection Framework]] — _(stub)_ — A
  scorecard across coordination overhead, failure isolation, latency, and observability for choosing
  among the patterns in this catalog.

### 01 — Enterprise AI System Design

Full system-design case studies at the depth an L6/L7 loop expects, closing with architectural
walkthroughs of real production agent products — grounded in their public engineering writing, not
speculation about internals no one has disclosed.

- **Chapter 1.** [[01-ai-copilot-architecture|AI Copilot Architecture]] — _(stub)_ — Reference
  design for an in-product AI copilot — context assembly, streaming responses, scoped guardrails.
- **Chapter 2.** [[02-coding-agent-platforms|Coding Agent Platforms]] — _(stub)_ — Codebase
  indexing, sandboxed execution, and diff review workflow, at L6/L7 interview depth.
- **Chapter 3.** [[03-research-agents|Research Agents]] — _(stub)_ — An agent that plans multi-step
  web/document retrieval, cites sources, and self-critiques for completeness.
- **Chapter 4.** [[04-customer-support-agents|Customer Support Agents]] — _(stub)_ — Ticket triage,
  knowledge-base grounding, human escalation, and the metrics (deflection rate, CSAT) that define
  success.
- **Chapter 5.** [[05-enterprise-knowledge-assistants|Enterprise Knowledge Assistants]] — _(stub)_ —
  An enterprise-wide knowledge assistant over heterogeneous internal sources, with
  access-control-aware retrieval.
- **Chapter 6.** [[06-autonomous-operations-agents|Autonomous Operations Agents]] — _(stub)_ —
  Agents that take autonomous remediation actions, and the safety envelope (dry-run, blast-radius
  limits, auto-rollback) required before granting write access.
- **Chapter 7.** [[07-ai-sre-platforms|AI SRE Platforms]] — _(stub)_ — Alert ingestion, correlation,
  root-cause hypothesis generation, and runbook execution — the natural extension of
  [[agentic-ai-projects-and-mastery/00-hands-on-engineering-projects/07-build-an-ai-sre-assistant/07-4-automated-root-cause-analysis|Build an AI SRE Assistant]]
  (Part 00 of Agentic AI: Projects & Engineering Mastery) to platform scale.
- **Chapter 8.** [[08-ai-platform-architecture|AI Platform Architecture]] — _(stub)_ — Ties together
  the gateway, registry, and multi-model infrastructure from
  [[production-agent-systems/readme#04 — AI Platform Engineering|Part 04 of Production Agent Systems]]
  into a single architecture-review-ready diagram.
- **Chapter 9.** [[09-global-ai-infrastructure|Global AI Infrastructure]] — _(stub)_ — Multi-region
  deployment — data residency, cross-region model failover, latency budgets.
- **Chapter 10.** [[10-cursor-architecture-case-study|Cursor: Architecture Case Study]] — An
  external, engineering-blog-grounded analysis of Cursor's likely architecture — codebase indexing,
  inline edit prediction, and agent-mode tool use.
- **Chapter 11.** [[11-claude-code-architecture-case-study|Claude Code: Architecture Case Study]] —
  An external, documentation-grounded analysis of Claude Code's architecture — the agentic coding
  loop, tool permissions model, and subagent/orchestration design.
- **Chapter 12.**
  [[12-github-copilot-architecture-case-study|GitHub Copilot: Architecture Case Study]] — An
  external, engineering-blog-grounded analysis of GitHub Copilot's evolution from inline completion
  to an agentic coding platform, including its CI/CD-triggered coding agent (see
  [[agentic-ai-engineering/readme|Agentic AI Engineering]], Part 04, Chapter 13).
- **Chapter 13.** [[13-perplexity-architecture-case-study|Perplexity: Architecture Case Study]] — An
  external, engineering-blog-grounded analysis of Perplexity's real-time research-agent architecture
  — retrieval, citation grounding, and answer synthesis at low latency.

## Metadata

|        |                                   |
| ------ | --------------------------------- |
| Author | Amit Singh                        |
| Scope  | ai-architecture-and-system-design |
