---
title: "Building & Evaluating Agents"
description: "A book-shaped table of contents for Building & Evaluating Agents: the architectural core of agent design — building single-agent systems, multi-agent systems, evaluation, and the agent framework landscape. Book 3 of the AI Systems Engineering series."
tags: ["building-agentic-systems", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202608101902-5"
noteType: moc
---

## Building & Evaluating Agents

> _The architectural core, for Principal & Staff Engineers (L6/L7)_
>
> This book assumes the conceptual foundation from
> [[agentic-ai-engineering/readme|Agentic AI Engineering]] — read that first. If this were a book,
> this page is the table of contents. It is organized as a learning journey — from building a single
> agent through coordinating many of them, knowing whether either is any good, and the vendor/OSS
> landscape that implements all of it. Each chapter links out to the framework, platform, and SRE
> notes that already exist elsewhere in this wiki instead of duplicating them. Unwritten chapters
> are listed as **stub** rows, not empty files.

## Parts

### 00 — Building Single-Agent Systems

The architectural core of the book — this Part contains the one fully-written chapter.

- **Chapter 1.** [[01-agent-architecture|Agent Architecture]] — The five core components of an agent
  (LLM, Tools, Memory, Planning, Execution Loop), how they wire into a loop, and a concept-check +
  vocabulary glossary mapped across frameworks.
- **Chapter 2.**
  [[building-agentic-systems/00-building-single-agent-systems/02-planner-executor-pattern/02-planner-executor-pattern|Planner–Executor Pattern]]
  — The single-agent-scoped view: a planning component decomposes a goal into steps and a separate
  executor carries them out. Formalized as a cross-cutting pattern, with applicability criteria and
  trade-offs against the rest of the pattern catalog, in
  [[ai-architecture-and-system-design/00-ai-architecture-patterns/02-planner-executor-pattern/02-planner-executor-pattern|Part 00 of AI Architecture & System Design]]
  — that's the canonical treatment; this chapter stays scoped to what it looks like inside one
  agent.
- **Chapter 3.** [[03-router-pattern|Router Pattern]] — The single-agent-scoped view: how a router
  component classifies incoming requests and dispatches them to the right specialized handler, tool,
  or sub-agent. Formalized in
  [[ai-architecture-and-system-design/00-ai-architecture-patterns/05-router-pattern/05-router-pattern|Part 00 of AI Architecture & System Design]]
  — that's the canonical treatment; this chapter stays scoped to the single-agent case.
- **Chapter 4.** [[04-workflow-agents|Workflow Agents]] — _(stub)_ — Agents that follow a
  predefined, deterministic sequence of steps rather than freely choosing their own next action.
- **Chapter 5.** [[05-autonomous-agents|Autonomous Agents]] — _(stub)_ — Agents that independently
  decide their own sequence of actions toward a goal, and the loop-control problems that make them
  harder to bound.
- **Chapter 6.** [[06-event-driven-agents|Event-Driven Agents]] — _(stub)_ — Agents triggered by
  external events (webhooks, queues, alerts) rather than direct user prompts.
- **Chapter 7.** [[07-human-in-the-loop-systems|Human-in-the-Loop Systems]] — _(stub)_ — Patterns
  for pausing an agent to request human input mid-task, and designing the handoff so it resumes with
  full context.
- **Chapter 8.** [[08-approval-workflows|Approval Workflows]] — _(stub)_ — Gating high-risk agent
  actions behind explicit human approval steps, including timeout handling and audit trails.
- **Chapter 9.** [[09-production-ready-agent-design|Production-Ready Agent Design]] — _(stub)_ — The
  checklist that separates a demo agent from a production one: retries, timeouts, cost controls,
  observability hooks, graceful degradation.

### 01 — Multi-Agent Systems

Coordinating more than one agent. See
`4-archive/h-aiops/07-evidence-backed-operational-reasoning-engine/{spec,agents,architecture}.md`
for a real multi-agent design (Topology/Telemetry/Incident-Pattern/Risk/Recommendation agents under
a reasoning-orchestrator harness), and
`4-archive/l-labs/01-ai-code-review-agent/ai-code-review-agent-spec.md` for a multi-pass reviewer
architecture.

- **Chapter 1.** [[01-why-multi-agent-systems|Why Multi-Agent Systems]] — The concrete failure modes
  of single-agent systems — context overload, tool sprawl, conflicting objectives — that motivate
  splitting work across agents.
- **Chapter 2.** [[02-collaboration-models|Collaboration Models]] — Splitting one investigation
  agent into metrics, logs, and traces specialists — tool isolation and prompt specialization as the
  design levers that make each one reliable.
- **Chapter 3.** [[03-communication-protocols|Communication Protocols]] — Agent-to-agent protocols,
  shared memory, message passing, coordination patterns, and how a multi-agent system recovers when
  one agent in the chain fails.
- **Chapter 4.** [[04-task-decomposition|Task Decomposition]] — Strategies for breaking a complex
  goal into subtasks assigned to different agents.
- **Chapter 5.** [[05-agent-negotiation|Agent Negotiation]] — How agents with different objectives
  or partial information reach agreement on a shared action.
- **Chapter 6.** [[06-consensus-mechanisms|Consensus Mechanisms]] — How multi-agent systems reach
  agreement when individual agents disagree — voting, quorum, distributed-consensus analogies.
- **Chapter 7.** [[07-swarm-intelligence|Swarm Intelligence]] — Decentralized patterns where global
  behavior emerges from simple local rules rather than centralized planning.
- **Chapter 8.** [[08-distributed-coordination|Distributed Coordination]] — Coordinating agent state
  and actions across distributed processes — partial failure, message loss, race conditions.
- **Chapter 9.** [[09-supervisor-architectures|Supervisor Architectures]] — A supervisor agent that
  delegates to specialist agents, aggregates their results, resolves conflicting conclusions, and
  generates the final report. Formalized as a cross-cutting pattern in
  [[ai-architecture-and-system-design/00-ai-architecture-patterns/03-supervisor-pattern/03-supervisor-pattern|Part 00 of AI Architecture & System Design]].
- **Chapter 10.** [[10-agent-meshes|Agent Meshes]] — Service-mesh-inspired architectures for
  agent-to-agent discovery, routing, and observability at the scale of dozens of interacting agents.
- **Chapter 11.** [[11-agent-lifecycle-management|Agent Lifecycle Management]] — Adding, updating,
  reconfiguring, or retiring an agent within an already-running multi-agent workflow without
  disrupting in-flight work, while preserving auditability.

### 02 — Evaluation

"How do I know my agent is good?" comes before "should I use LangGraph?" — this Part used to sit
after Agent Frameworks and Production Infrastructure; it's kept here deliberately, so the question
of what "good" means for an agent is answered before any framework-selection chapter assumes an
answer to it. Observability — the telemetry substrate evaluation and everything downstream of it
consumes — is covered separately in [[production-agent-systems/readme|Production Agent Systems]],
near Production Infrastructure where it operationally belongs.

- **Chapter 1.** [[01-ai-evaluation-frameworks|AI Evaluation Frameworks]] — The metrics that
  actually define a good agent — latency, cost, success rate, failure analysis — and the frameworks
  used to score them objectively.
- **Chapter 2.** [[02-benchmarks|Benchmarks]] — A standing benchmark suite that runs against every
  model or prompt change, distinguishing provider regressions from your own prompt/tool changes.
- **Chapter 3.** [[03-online-evaluation|Online Evaluation]] — Continuously scoring live traffic —
  LLM-as-judge scoring, implicit user-feedback signals, shadow-mode comparison.
- **Chapter 4.** [[04-offline-evaluation|Offline Evaluation]] — Running a held-out golden dataset
  through a candidate agent version before deploy — regression gates in CI.

### 03 — Agent Frameworks

The vendor/OSS landscape implementing everything from Agentic AI Engineering's Part 03 through this
book's own Part 01 cover conceptually. Before comparing frameworks, decide how you'll evaluate agent
quality — see Part 02 — since "which framework" is a much easier question once "what does good look
like" already has an answer. This Part evaluates and compares frameworks; hands-on tool-specific
reference detail lives in the standalone reference notes under the "Framework & API references"
section of [[agentic-ai-projects-and-mastery/readme|Agentic AI: Projects & Engineering Mastery]],
not duplicated here.

- **Chapter 1.** [[01-evaluation-criteria|Evaluation Criteria]] — The axes — orchestration model,
  state management, observability, ecosystem maturity — used to compare agent frameworks before
  adopting one.
- **Chapter 2.** [[02-openai-agents-sdk|OpenAI Agents SDK]] — OpenAI's Agents SDK primitives —
  agents, handoffs, guardrails, sessions — and where it fits versus building an orchestration layer
  from scratch.
- **Chapter 3.** [[03-langgraph|LangGraph]] — LangGraph's graph-based state machine model for agent
  orchestration, including cycles, checkpointing, and human-in-the-loop interrupts.
- **Chapter 4.** [[04-crewai|CrewAI]] — CrewAI's role-based multi-agent orchestration model of
  crews, tasks, and processes. See [[crewai|CrewAI]].
- **Chapter 5.** [[05-autogen|AutoGen]] — Microsoft AutoGen's conversational multi-agent framework,
  where agents coordinate via group-chat message exchange.
- **Chapter 6.** [[06-semantic-kernel|Semantic Kernel]] — Microsoft Semantic Kernel's
  plugin-and-planner model for embedding agentic behavior into existing enterprise .NET and Python
  applications.
- **Chapter 7.** [[07-google-adk|Google ADK]] — Google's Agent Development Kit, its composition
  model, tool integration, and deployment path onto Vertex AI. See [[google-adk|Google ADK]].
- **Chapter 8.** [[08-llamaindex-workflows|LlamaIndex Workflows]] — LlamaIndex's event-driven
  Workflows abstraction for building retrieval-heavy agents.
- **Chapter 9.** [[09-haystack-agents|Haystack Agents]] — Haystack's pipeline-based approach to
  building agents for production search and RAG use cases.
- **Chapter 10.** [[10-choosing-the-right-framework|Choosing the Right Framework]] — _(stub)_ — A
  decision framework for picking among frameworks based on team skillset, orchestration complexity,
  and observability needs.

## Metadata

|        |                          |
| ------ | ------------------------ |
| Author | Amit Singh               |
| Scope  | building-agentic-systems |
