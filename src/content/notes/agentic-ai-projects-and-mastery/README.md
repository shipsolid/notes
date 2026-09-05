---
title: "Agentic AI: Projects & Engineering Mastery"
description: "A book-shaped table of contents for Agentic AI: Projects & Engineering Mastery: hands-on practitioner builds, Principal/Staff-level technical leadership, and the lookup appendices and vendor/framework reference notes for the whole series. Book 6 of the AI Systems Engineering series."
tags: ["agentic-ai-projects-and-mastery", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202608101902-2"
noteType: moc
---

## Agentic AI: Projects & Engineering Mastery

> _Hands-on builds and Principal/Staff-level judgment, for L6/L7 engineers_
>
> This book assumes everything from
> [[ai-architecture-and-system-design/readme|AI Architecture & System Design]] and the five books
> before it. If this were a book, this page is the table of contents. It closes the series: every
> practitioner build from the earlier version of this scaffold, the judgment and communication layer
> an L6/L7 loop actually screens for, and the reference material meant for lookup rather than
> sequential reading — lettered appendices and the vendor/framework notes the whole series links out
> to instead of duplicating. Unwritten chapters are listed as **stub** rows, not empty files.

## Parts

### 00 — Hands-on Engineering Projects

Where the book's own hands-on lineage lives — every practitioner build from the earlier version of
this scaffold moved here rather than being discarded, since building one of these end to end is
still the fastest way to internalize everything from [[ai-foundations/readme|AI & LLM Foundations]]
through [[ai-architecture-and-system-design/readme|AI Architecture & System Design]].

- **Chapter 1. Build Your First Agent** — hand-rolled tool calling first, then LangGraph's
  state-graph abstraction over the same loop, then how to test and debug it.
  - [[01-1-development-environment-setup|Setting Up the Development Environment]] — Python project
    setup, virtual environments, and installing the OpenAI SDK, LangChain, and LangGraph.
  - [[01-2-creating-a-tool-using-agent|Creating a Tool-Using Agent]] — Designing an agent from
    scratch — tools, tool calling, prompt templates, response generation.
  - [[01-3-building-agents-with-langgraph|Building Agents with LangGraph]] — State management,
    nodes, edges, conditional routing, execution flow.
  - [[01-4-testing-and-debugging-agents|Testing and Debugging Agents]] — Unit testing tools, mocking
    LLM calls, debugging agent flows, a troubleshooting guide.
- **Chapter 2.** [[02-build-an-mcp-server|Build an MCP Server]] — _(stub)_ — A Model Context
  Protocol server exposing a real tool with schema-validated inputs and outputs, deployable end to
  end. See [[h-mcp-reference-guide|Appendix H — MCP Reference Guide]].
- **Chapter 3.** [[03-adding-agent-memory|Build an Agent with Memory]] — Hand-rolling short-term and
  long-term memory — SQLite-backed storage for conversation and investigation history across
  sessions.
- **Chapter 4. Build an Agentic RAG System** — the corpus, then the retrieval pipeline built on top
  of it.
  - [[04-1-building-an-operational-knowledge-base|Building an Operational Knowledge Base]] — Turning
    runbooks, playbooks, architecture documents, and incident reports into a RAG corpus.
  - [[04-2-retrieval-augmented-generation|Retrieval-Augmented Generation (RAG)]] — Document
    processing, chunking, embeddings, vector database choice, and the retrieval pipeline.
- **Chapter 5.** [[05-build-a-coding-agent|Build a Coding Agent]] — _(stub)_ — A coding agent that
  reads a repository, plans a change, edits files, and runs tests in a sandboxed loop with a
  human-review checkpoint before merge.
- **Chapter 6.** [[06-build-a-multi-agent-system|Build a Multi-Agent System]] — _(stub)_ — Applies
  the supervisor and orchestrator-worker patterns from
  [[ai-architecture-and-system-design/readme#00 — AI Architecture Patterns|Part 00 of AI Architecture & System Design]]
  to a concrete task, with message-passing and failure-handling code.
- **Chapter 7. Build an AI SRE Assistant** — the capstone-grade practitioner build: wiring an
  agent's tool layer directly to Grafana, Loki, and Tempo so it can investigate real incidents. See
  [[grafana-mcp|Grafana MCP]], [[loki|Loki]], [[tempo|Tempo]], [[prometheus|Prometheus]], and
  [[holmesgpt|HolmesGPT]] — the closest real production implementation of this exact pattern.
  - [[07-1-connecting-agents-to-grafana|Connecting Agents to Grafana]] — Grafana architecture,
    authentication, metrics API, querying Prometheus, error handling.
  - [[07-2-building-a-log-investigation-tool|Building a Log Investigation Tool]] — Loki API, LogQL
    basics, time range filtering, log summarization, pattern detection.
  - [[07-3-building-a-trace-investigation-tool|Building a Trace Investigation Tool]] — Tempo API,
    trace retrieval, span analysis, latency investigation, service dependency analysis.
  - [[07-4-automated-root-cause-analysis|Automated Root Cause Analysis]] — Correlating
    metrics/logs/traces, evidence collection, confidence scoring, incident summaries.
- **Chapter 8.** [[08-build-an-enterprise-ai-platform|Build an Enterprise AI Platform]] — _(stub)_ —
  A minimal enterprise AI platform slice — gateway, registry, one deployed agent — wiring together
  [[ai-architecture-and-system-design/readme#01 — Enterprise AI System Design|Part 01 of AI Architecture & System Design]]'s
  architecture into working infrastructure.
- **Chapter 9.** [[09-deployment-strategies|Production Deployment]] — Containerizing and deploying
  an agent through Docker, Kubernetes, and CI/CD — versioning prompts and models as deploy
  artifacts.
- **Chapter 10.** [[10-capstone-observability-investigation-platform|Capstone Project]] — Assembling
  every book of this series into one deployable system — architecture, project structure, end-to-end
  workflow, RCA generation, dashboards, and deployment.

### 01 — Principal & Staff Engineer Mastery

Everything that isn't code — the judgment and communication layer an L6/L7 loop actually screens
for.

- **Chapter 1.** [[01-technical-strategy-for-ai|Technical Strategy for AI]] — _(stub)_ — Writing a
  multi-year technical strategy for AI adoption, and sequencing platform investment against
  product-team demand.
- **Chapter 2.** [[02-build-vs-buy-decisions|Build vs Buy Decisions]] — _(stub)_ — A worked
  cost/lock-in/velocity comparison for AI platform components a Staff engineer would present to
  leadership.
- **Chapter 3.** [[03-ai-platform-roadmaps|AI Platform Roadmaps]] — _(stub)_ — Translating technical
  strategy into a quarter-by-quarter roadmap with explicit dependency sequencing.
- **Chapter 4.** [[04-architecture-reviews|Architecture Reviews]] — _(stub)_ — The review rubric,
  common objections a review board raises to agentic designs, and defending a proposal under
  scrutiny.
- **Chapter 5.** [[05-engineering-rfcs-and-adrs|Engineering RFCs & ADRs]] — _(stub)_ — Writing
  RFCs/ADRs for agentic-system decisions, where blast radius (e.g. granting write access) changes
  how much rigor the document needs.
- **Chapter 6.** [[06-organizational-design-for-ai-teams|Organizational Design for AI Teams]] —
  _(stub)_ — Centralized platform team versus embedded AI engineers versus hybrid, and how ownership
  shifts as the platform matures.
- **Chapter 7.** [[07-ai-governance-at-scale|AI Governance at Scale]] — _(stub)_ — Model approval
  workflows, audit logging requirements, and policy-as-code enforcement across an enterprise.
- **Chapter 8.** [[08-ai-economics-and-roi|AI Economics & ROI]] — Building the cost model and ROI
  narrative for an AI platform investment in the form a CFO or VP Engineering would accept. Paired
  with the engineering-levers view in
  [[production-agent-systems/03-performance-and-cost-engineering/08-cost-engineering/08-cost-engineering|Cost Engineering (Part 03 of Production Agent Systems)]],
  which this chapter's numbers are built on top of rather than re-deriving.
- **Chapter 9.** [[09-interview-case-studies-l6andl7|Interview Case Studies (L6/L7)]] — _(stub)_ —
  Full mock L6/L7 system-design interview transcripts on agentic-AI topics, with follow-up probes
  and what separates a passing answer from a borderline one.
- **Chapter 10.** [[10-the-future-of-agentic-ai|The Future of Agentic AI]] — _(stub)_ — Closes the
  series with where agentic AI architecture is heading, and which of today's patterns are likely to
  age well.

### 02 — Appendices

Reference material meant for lookup, not sequential reading.

- **Appendix A.** [[a-agent-framework-comparison-matrix|Agent Framework Comparison Matrix]] —
  _(stub)_ — Compares frameworks (LangGraph, AutoGen, CrewAI, custom) across state management,
  tool-calling model, and production-readiness.
- **Appendix B.** [[b-prompt-engineering-cheat-sheet|Prompt Engineering Cheat Sheet]] — _(stub)_ — A
  condensed reference of prompt-engineering techniques with when-to-use guidance.
- **Appendix C. Agent Design Pattern Catalog** — A condensed table of every pattern covered in
  [[ai-architecture-and-system-design/readme#00 — AI Architecture Patterns|Part 00 of AI Architecture & System Design]],
  plus Anthropic's workflow taxonomy against a runnable arena lab, applicability criteria and
  trade-offs, for interview-day review.
  - [[c-1-agent-design-pattern-catalog|C.1 — Agent Design Pattern Catalog]] — Anthropic's
    five-pattern workflow taxonomy plus this book's own eleven-pattern Part 00 catalog, condensed to
    applicability criteria and trade-offs. Six of the eleven Part 00 patterns are condensed from
    standard usage rather than a written chapter — their source chapters are still stubs.
  - [[c-2-llm-arena-reference-implementation|C.2 — LLM Arena Reference Implementation]] — The full
    runnable cross-provider arena lab (fail-fast control flow, fan-out calls, LLM-as-judge scoring)
    backing C.1's Fan-Out and LLM-as-a-Judge patterns.
- **Appendix D.** [[d-ai-security-checklist|AI Security Checklist]] — _(stub)_ — A pre-launch
  security-posture audit checklist — prompt injection defenses, tool-permission scoping, secrets
  handling.
- **Appendix E.** [[e-production-readiness-checklist|Production Readiness Checklist]] — _(stub)_ — A
  pre-launch checklist covering observability, rollback plan, rate limiting, and on-call ownership.
- **Appendix F.** [[f-ai-system-design-interview-questions|AI System Design Interview Questions]] —
  _(stub)_ — A bank of practice system-design prompts specific to agentic AI, by difficulty.
- **Appendix G.**
  [[g-openai-anthropic-and-google-api-comparison|OpenAI, Anthropic & Google API Comparison]] —
  _(stub)_ — Tool-calling formats, context window/pricing tiers, and streaming semantics across the
  three major model APIs.
- **Appendix H.** [[h-mcp-reference-guide|MCP Reference Guide]] — _(stub)_ — A condensed reference
  for the Model Context Protocol specification — message types, capability negotiation,
  server/client lifecycle.
- **Appendix I.** [[i-ai-engineering-glossary|AI Engineering Glossary]] — A glossary of the
  agentic-AI terminology used throughout the series. Seeded so far with the "agentic engineer"
  ambiguity and the believable-vs-correct distinction; more entries accrue as later chapters land.
- **Appendix J.**
  [[j-recommended-papers-books-and-open-source-projects|Recommended Papers, Books & Open-Source Projects]]
  — _(stub)_ — An annotated reading list for readers who want to go deeper on a specific topic.

## Framework & API references

Reference-lookup material for specific tools — LangChain, LangGraph, the OpenAI SDK, Grafana/Loki/
Tempo APIs, OTel-for-AI conventions — lives as standalone single-tool notes in this book's own
`reference/` folder rather than as numbered chapters: see [[crewai|CrewAI]],
[[google-adk|Google ADK]], [[mcp-toolbox|MCP Toolbox]], [[mem0|Mem0]], [[vertex-ai|Vertex AI]],
[[openclaw|OpenClaw]], [[hermes-agent|Hermes Agent]],
[[gemini-enterprise-agent-platform|Gemini Enterprise Agent Platform]] (Google's A2A protocol), and
the API-surface companions to [[building-agentic-systems/readme|Building & Evaluating Agents]]' Part
03 framework chapters — [[openai-agents-sdk|OpenAI Agents SDK]], [[langgraph|LangGraph]],
[[autogen|AutoGen]], [[semantic-kernel|Semantic Kernel]], [[llamaindex|LlamaIndex Workflows]], and
[[haystack|Haystack Agents]] — plus [[grafana-mcp|Grafana MCP]], [[holmesgpt|HolmesGPT]],
[[loki|Loki]], [[tempo|Tempo]], and [[prometheus|Prometheus]], which live in the `grafana-cloud/`
and `observability/` books they belong to instead.

Azure's AI platform — the counterpart to [[vertex-ai|Vertex AI]] on GCP — gets its own cluster:
[[azure-ai-services|Azure AI Services]] (the service catalog and account model),
[[azure-ai-content-safety|Azure AI Content Safety]] (moderation), and
[[azure-ai-service-management|Managing, Monitoring, and Securing Azure AI Services]] (the
operational layer), plus [[azure-sre-agent|Azure SRE Agent]] for Azure-native incident response.
[[harness-engineering|Harness Engineering]] is a cross-cutting pattern note that also lives here
rather than under a numbered chapter — the discipline underneath every framework in this list. See
`1-projects/agentic-ai-lab/README.md` for the hands-on build backlog that puts Part 00 into
practice.

## Metadata

|        |                                 |
| ------ | ------------------------------- |
| Author | Amit Singh                      |
| Scope  | agentic-ai-projects-and-mastery |
