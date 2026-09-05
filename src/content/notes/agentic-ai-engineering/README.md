---
title: "Agentic AI Engineering"
description: "A book-shaped table of contents for Agentic AI Engineering: where 'LLM application' becomes 'agent' — introduction to agentic AI, agent cognition, memory systems, planning & reasoning algorithms, tools & environment interaction, retrieval & knowledge systems, and context engineering. Book 2 of the AI Systems Engineering series."
tags: ["agentic-ai-engineering", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202608101902"
noteType: moc
---

## Agentic AI Engineering

> _The conceptual core of agent design, for Principal & Staff Engineers (L6/L7)_
>
> This book assumes the substrate from [[ai-foundations/readme|AI & LLM Foundations]] — read that
> first. If this were a book, this page is the table of contents. It is organized as a learning
> journey — every Part builds on the previous one, from what makes a system "agentic" through
> cognitive architecture, memory, tools, reasoning algorithms, and retrieval and context
> engineering. Each chapter links out to the framework, platform, and SRE notes that already exist
> elsewhere in this wiki instead of duplicating them. Unwritten chapters are listed as **stub**
> rows, not empty files.

## Parts

### 00 — Introduction to Agentic AI

Where "LLM application" becomes "agent." The deep architectural treatment of the loop this Part
introduces conceptually lives in [[01-agent-architecture|Agent Architecture]] (Part 00 of Building &
Evaluating Agents) — read that alongside this Part's framing chapters.

- **Chapter 1.** [[01-what-is-agentic-ai|What is Agentic AI?]] — What makes a system 'agentic'
  rather than a chatbot or a script, the recurring design patterns, real-world use cases, and the
  engineering mindset this book assumes.
- **Chapter 2.** [[02-agent-vs-workflow-vs-automation|Agent vs Workflow vs Automation]] — Draws the
  architectural line between a fixed automation script, a deterministic workflow/DAG, and a true
  agent with dynamic control flow.
- **Chapter 3.** [[03-characteristics-of-intelligent-agents|Characteristics of Intelligent Agents]]
  — Defines the properties that qualify a system as agentic — autonomy, goal-directedness,
  environment perception, and adaptive planning.
- **Chapter 4.** [[04-agent-lifecycle|Agent Lifecycle]] — Covers an agent's full lifecycle from
  initialization through the perceive-plan-act-reflect loop to termination or handoff.
- **Chapter 5.** [[05-agent-taxonomy|Agent Taxonomy]] — Classifies agent architectures — reactive,
  deliberative, hybrid, and multi-agent — and maps each to production use cases and reliability
  tradeoffs.
- **Chapter 6.** [[06-agent-design-principles|Agent Design Principles]] — When a deterministic
  system beats an agentic one, how to choose and scope tools, prompt engineering, error handling,
  guardrails, and security considerations that apply before any code is written.
- **Chapter 7.** [[07-when-not-to-build-an-agent|When NOT to Build an Agent]] — Covers the decision
  criteria for rejecting an agentic architecture in favor of a simpler deterministic pipeline.
- **Chapter 8.** [[08-ai-agent-use-cases|AI Agent Use Cases]] — Surveys production-proven agent use
  cases and the common architectural shape each one shares underneath the domain-specific framing.
- **Chapter 9.** [[09-enterprise-adoption-patterns|Enterprise Adoption Patterns]] — Covers how
  enterprises roll out agentic systems safely — human-in-the-loop gating, phased autonomy levels,
  audit logging, and governance structures.

### 01 — Agent Cognition

The cognitive loop underneath every agent architecture. See `3-references/AI/agent-harness-demo.md`
for a working context-injection harness that implements a version of this loop end to end.

- **Chapter 1.** [[01-perception|Perception]] — Covers how an agent ingests and represents its
  environment — structured tool outputs, unstructured text, multimodal inputs.
- **Chapter 2.** [[02-decision-making|Decision Making]] — Covers the decision-making layer that
  selects the next action from the perceived state, and how confidence and risk thresholds shape
  when an agent should act versus escalate.
- **Chapter 3.** [[03-planning|Planning]] — Covers agent planning strategies — task decomposition,
  hierarchical planning, and plan-and-execute versus ReAct-style interleaved planning.
- **Chapter 4.** [[04-reasoning|Reasoning]] — Covers the reasoning strategies an agent applies
  mid-execution and how reasoning depth trades off against latency and token cost.
- **Chapter 5.** [[05-reflection|Reflection]] — Covers self-evaluation loops where an agent
  critiques its own intermediate output before acting on it.
- **Chapter 6.** [[06-self-correction|Self-Correction]] — Covers how an agent detects and repairs
  its own errors mid-task, and the failure boundary where correction should hand off to a human.
- **Chapter 7.** [[07-learning-loops|Learning Loops]] — Covers how agents improve across invocations
  without full retraining — memory-based adaptation, and the online-eval loop that turns production
  traces into improvement signal.
- **Chapter 8.** [[08-agent-state-machines|Agent State Machines]] — Covers modeling an agent's
  execution as an explicit state machine — states, transitions, and guards.
- **Chapter 9.** [[09-goal-oriented-behavior|Goal-Oriented Behavior]] — Covers how an agent
  maintains and decomposes a top-level goal across multi-step execution.
- **Chapter 10.** [[10-autonomous-execution|Autonomous Execution]] — Covers the execution layer that
  carries a planned action through to completion — validation, rollback, and autonomy-level gating.

### 02 — Memory Systems

Solving the LLM's stateless-by-design limitation. See `3-references/AI/agent-harness-demo.md` for a
working per-persona memory implementation this Part generalizes into a full taxonomy.

- **Chapter 1.** [[01-why-agents-need-memory|Why Agents Need Memory]] — _(stub)_ — Frames the
  stateless-by-default nature of LLM inference and why an agent operating across tool calls,
  sessions, or users needs an explicit memory subsystem.
- **Chapter 2.** [[02-context-windows|Context Windows]] — _(stub)_ — Covers context window mechanics
  and the tradeoffs between stuffing history into the prompt versus offloading it to external
  memory.
- **Chapter 3.** [[03-working-memory|Working Memory]] — _(stub)_ — Covers the agent's working memory
  — the mutable scratchpad of current task state that lives only for one execution loop.
- **Chapter 4.** [[04-short-term-memory|Short-Term Memory]] — _(stub)_ — Covers short-term memory as
  bounded, session-scoped conversation history — sliding windows, summarization-on-overflow.
- **Chapter 5.** [[05-long-term-memory|Long-Term Memory]] — _(stub)_ — Covers persistent memory that
  survives across sessions and restarts, and how an agent decides what's worth remembering
  permanently.
- **Chapter 6.** [[06-semantic-memory|Semantic Memory]] — _(stub)_ — Covers semantic memory as
  structured factual and conceptual knowledge decoupled from any specific conversation.
- **Chapter 7.** [[07-episodic-memory|Episodic Memory]] — _(stub)_ — Covers episodic memory as a log
  of specific past events, and how agents use it for recall of prior incidents and precedent-based
  reasoning.
- **Chapter 8.** [[08-memory-storage-architectures|Memory Storage Architectures]] — _(stub)_ —
  Compares relational, key-value, document, and hybrid storage architectures for agent memory.
- **Chapter 9.** [[09-vector-databases|Vector Databases]] — _(stub)_ — Covers embedding generation,
  ANN indexing (HNSW, IVF), similarity metrics, and recall/latency/cost tradeoffs.
- **Chapter 10.** [[10-knowledge-graphs|Knowledge Graphs]] — _(stub)_ — Covers knowledge graphs as a
  structured alternative to vector similarity search for multi-hop reasoning.
- **Chapter 11.** [[11-memory-retrieval|Memory Retrieval]] — _(stub)_ — Covers retrieval strategies
  for pulling relevant memory back into an agent's context.
- **Chapter 12.** [[12-memory-compression|Memory Compression]] — _(stub)_ — Covers techniques for
  compressing accumulated memory before it consumes context budget.
- **Chapter 13.** [[13-memory-versioning|Memory Versioning]] — _(stub)_ — Covers versioning and
  conflict resolution for agent memory that changes over time.

### 03 — Planning & Reasoning Algorithms

The algorithm catalog every agent architecture in Part 00 of Building & Evaluating Agents draws
from. [[01-agent-architecture|Agent Architecture]] already covers ReAct, Plan-and-Execute, and
Chain-of-Thought at an overview level — this Part goes one level deeper into each, plus the
algorithms that chapter doesn't cover.

- **Chapter 1.** [[01-chain-of-thought|Chain of Thought]] — _(stub)_ — Eliciting intermediate
  reasoning steps before a final answer, why it improves multi-step performance, and its limits on
  tasks requiring backtracking.
- **Chapter 2.** [[02-react|ReAct]] — _(stub)_ — Interleaving reasoning traces with tool-invoking
  actions in a single loop, and why it became the default architecture for tool-using agents.
- **Chapter 3.** [[03-self-consistency|Self-Consistency]] — _(stub)_ — Sampling multiple independent
  reasoning paths and taking a majority vote over final answers.
- **Chapter 4.** [[04-tree-of-thoughts|Tree of Thoughts]] — _(stub)_ — Exploring multiple reasoning
  branches with lookahead and backtracking.
- **Chapter 5.** [[05-graph-of-thoughts|Graph of Thoughts]] — _(stub)_ — Where intermediate thoughts
  can merge, refine, and feed back into each other as a DAG rather than a tree.
- **Chapter 6.** [[06-reflexion|Reflexion]] — _(stub)_ — An agent critiquing its own failed attempt
  in natural language and feeding that self-reflection back into the next attempt.
- **Chapter 7.** [[07-plan-and-execute|Plan-and-Execute]] — The single-agent-scoped view of
  decomposing a task into an explicit upfront plan before executing steps, and its tradeoffs against
  ReAct. Formalized as a cross-cutting pattern, with applicability criteria, in
  [[ai-architecture-and-system-design/00-ai-architecture-patterns/02-planner-executor-pattern/02-planner-executor-pattern|Planner–Executor Pattern (Part 00 of AI Architecture & System Design)]]
  — read that for the canonical treatment.
- **Chapter 8.** [[08-program-aided-language-models|Program-Aided Language Models]] — _(stub)_ —
  Offloading deterministic computation to generated code executed by an interpreter instead of
  having the LLM compute the answer directly.
- **Chapter 9.** [[09-llm-compiler|LLM Compiler]] — _(stub)_ — Planning a DAG of tool calls upfront
  and executing independent branches in parallel.
- **Chapter 10.** [[10-debate-and-critic-agents|Debate & Critic Agents]] — Critic agents (the
  generator/evaluator loop commonly called LLM-as-judge) distinguished from
  [[06-reflexion|Reflexion]]'s self-critique, plus debate's adversarial and independent-voting
  shapes — the latter identical to
  [[production-agent-systems/03-performance-and-cost-engineering/02-parallel-execution/02-parallel-execution|Parallel Execution]]'s
  voting variant.
- **Chapter 11.** [[11-hierarchical-planning|Hierarchical Planning]] — _(stub)_ — Decomposing a goal
  into subgoals handled by higher- and lower-level planners at different abstraction levels.

### 04 — Tools & Environment Interaction

How an agent reaches outside the model. See `3-references/AI/llm-engineering-layers.md` for a worked
tool-dispatch loop with real code.

- **Chapter 1.** [[01-tool-calling-architecture|Tool Calling Architecture]] — The mechanics of
  function/tool calling in modern LLM APIs — schema definition, structured-call output, execution,
  result injection.
- **Chapter 2.** [[02-apis-as-tools|APIs as Tools]] — Wrapping arbitrary external APIs as agent
  tools — authentication, schema translation, error surfacing.
- **Chapter 3.** [[03-rest-and-graphql-integration|REST & GraphQL Integration]] — Schema
  introspection for GraphQL, pagination handling, and rate-limit-aware retry design.
- **Chapter 4.** [[04-database-tools|Database Tools]] — Text-to-SQL generation, read-only scoping,
  query validation, and the injection-attack surface of letting an LLM generate queries.
- **Chapter 5.** [[05-search-tools|Search Tools]] — Web search APIs, retrieval-augmented search over
  internal corpora, and result-ranking strategies.
- **Chapter 6.** [[06-browser-automation|Browser Automation]] — Headless browser control, DOM
  parsing, and accessibility-tree extraction for dynamic pages.
- **Chapter 7.** [[07-computer-use-agents|Computer Use Agents]] — Agents that operate a full desktop
  GUI via screenshots and coordinate-based actions.
- **Chapter 8.** [[08-code-execution|Code Execution]] — Sandboxed code execution as an agent tool —
  isolation boundaries, resource limits, output capture.
- **Chapter 9.** [[09-model-context-protocol-mcp|Model Context Protocol (MCP)]] — The standardized
  interface between agents and external tools/data sources, and its client-server architecture for
  tool discovery and invocation. See
  [[agentic-ai-projects-and-mastery/02-appendices/h-mcp-reference-guide/h-mcp-reference-guide|Appendix H — MCP Reference Guide]].
- **Chapter 10.** [[10-tool-discovery|Tool Discovery]] — Static registration versus dynamic
  discovery, tool metadata design, and scaling tool catalogs beyond one prompt.
- **Chapter 11.** [[11-tool-selection-strategies|Tool Selection Strategies]] — Embedding-based tool
  retrieval and hierarchical tool routing as the number of available tools grows.
- **Chapter 12.** [[12-tool-security|Tool Security]] — Least-privilege scoping, output sanitization
  against prompt injection, approval gates, and audit logging.
- **Chapter 13.** [[13-agents-in-ci-cd-and-sdlc-workflows|Agents in CI/CD & SDLC Workflows]] —
  Establishing an agent's execution context, scoping it to a repository and branch, triggering it
  from CI/SDLC events, and letting it act autonomously via branch/PR creation while merge stays
  gated — using GitHub Copilot coding agent as the reference implementation.
- **Chapter 14.**
  [[14-safe-execution-paths-and-error-handling|Safe Execution Paths & Error Handling]] —
  Error-handling taxonomy, retry design, rollback mechanics, escalation paths, and the traceability
  record that lets an agent operate safely when a tool call fails.

### 05 — Retrieval & Knowledge Systems

Grounding an agent in more than its context window can hold. See
`4-archive/h-aiops/06-hybrid-retrieval-aiops-assistant/spec.md` for a real hybrid BM25+vector+RRF
retrieval design this Part's chapters generalize. Context Engineering — how what's retrieved here
actually gets assembled into a prompt — is broken out into its own Part (06), since it grew larger
than a single chapter could hold.

- **Chapter 1.** [[01-retrieval-augmented-generation-rag|Retrieval-Augmented Generation (RAG)]] —
  _(stub)_ — The core RAG pipeline of indexing, retrieval, and generation, and why retrieval quality
  bounds answer quality regardless of context window size.
- **Chapter 2.** [[02-embeddings|Embeddings]] — _(stub)_ — How embedding models turn text into dense
  vectors, and the tradeoffs between commercial and open-source models.
- **Chapter 3.** [[03-chunking-strategies|Chunking Strategies]] — _(stub)_ — Compares fixed-size,
  recursive, and semantic chunking and how boundary choices affect retrieved-passage quality.
- **Chapter 4.** [[04-vector-search|Vector Search]] — _(stub)_ — The approximate nearest neighbor
  algorithms (HNSW, IVF) behind vector databases.
- **Chapter 5.** [[05-hybrid-search|Hybrid Search]] — _(stub)_ — Why combining dense vector
  similarity with sparse keyword search (BM25) outperforms either alone.
- **Chapter 6.** [[06-reranking|Reranking]] — _(stub)_ — Cross-encoder reranking models that reorder
  an initial retrieval candidate set for precision.
- **Chapter 7.** [[07-agentic-rag|Agentic RAG]] — _(stub)_ — RAG architectures where an agent
  decides when and what to retrieve, iteratively refining queries.
- **Chapter 8.** [[08-graphrag|GraphRAG]] — _(stub)_ — How knowledge-graph-structured retrieval
  captures entity relationships and multi-hop reasoning that vector search misses.
- **Chapter 9.** [[09-multi-stage-retrieval|Multi-Stage Retrieval]] — _(stub)_ — Pipelines that
  chain coarse-to-fine retrieval stages to balance recall and precision at scale.

### 06 — Context Engineering

What actually gets assembled into the prompt, in what order, and within what budget — arguably the
discipline that has displaced prompt engineering as the core skill of building reliable agents. This
Part was a single stub chapter inside Retrieval & Knowledge Systems; it's promoted to its own Part
here because the surface area (assembly, ranking, budgets, retrieval policy, compression, and the
emerging idea of a prompt compiler) is as broad as memory or planning.

- **Chapter 1.** [[01-context-assembly|Context Assembly]] — How the final prompt gets built from
  disparate sources — system instructions, retrieved chunks, memory, tool schemas, and conversation
  history — and the ordering decisions that affect what the model actually attends to.
- **Chapter 2.** [[02-context-ranking|Context Ranking]] — Scoring and ordering candidate context
  fragments by relevance before they're admitted into a fixed token budget.
- **Chapter 3.** [[03-memory-selection|Memory Selection]] — The policy layer between memory
  retrieval (Part 02) and context assembly — selection criteria beyond raw similarity, the cost of
  over-including memory (crowded-out context, stale precedent), and a worked contrast between a turn
  needing deep multi-session recall and one needing almost none.
- **Chapter 4.** [[04-prompt-budgets|Prompt Budgets]] — Allocating a fixed token budget across
  system prompt, retrieved context, memory, tool schemas, and conversation history, with explicit
  tradeoffs when the budget is exceeded.
- **Chapter 5.** [[05-retrieval-policies|Retrieval Policies]] — When to retrieve, how much (fixed-k
  vs. adaptive), and from which source (routing across corpora, echoing the Router Pattern) — the
  decision layer that sits in front of the retrieval mechanics in Part 05, and how Agentic RAG
  relocates the whole policy into the model's own iterative loop.
- **Chapter 6.** [[06-context-compression|Context Compression]] — Summarization, extractive pruning,
  and structured compression techniques for fitting more signal into less context without silently
  dropping what the model needed.
- **Chapter 7.** [[07-prompt-compilers|Prompt Compilers]] — The emerging idea of treating context
  assembly as a compilation step — a declarative spec of what the model needs, compiled down to an
  optimized prompt, rather than hand-assembled string concatenation.

## Metadata

|        |                        |
| ------ | ---------------------- |
| Author | Amit Singh             |
| Scope  | agentic-ai-engineering |
