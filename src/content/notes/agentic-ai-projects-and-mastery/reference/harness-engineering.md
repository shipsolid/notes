---
title: "What is Harness Engineering"
description: "The discipline of designing everything that wraps a raw LLM into a reliable agent — tool contracts, system prompt architecture, context/memory management, permission gates, and feedback loops. Distinct from prompt engineering and model training."
tags: ["tech", "ai-agents", "agentic-ai", "llm", "systems-design"]
updated: 2026-08-09
hidden: false
zettelId: "202608011200"
kind: "pattern"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/google-adk
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/hermes-agent
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/openclaw
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/mcp-toolbox
    kind: related
---

**Harness engineering** is the discipline of designing the system that _wraps_ a raw LLM so it
behaves as a dependable, steerable agent — the tool-calling loop, system prompt architecture,
context and memory management, permission gates, sandboxing, sub-agent orchestration, and the
feedback loops that catch drift. The model supplies reasoning; the harness turns that reasoning into
software you can actually run in production.

It's a distinct layer from two things it's often confused with:

<div style="border-left: 3px solid #10b981; padding: 0.75rem 1rem; margin: 1rem 0; background: rgba(16, 185, 129, 0.08); border-radius: 4px;">
  <strong>Not the same as:</strong>
  <ul style="margin: 0.5rem 0 0 0;">
    <li><strong>Prompt engineering</strong> — optimizing the text of a single instruction or few-shot example.</li>
    <li><strong>Model training / fine-tuning</strong> — optimizing the weights themselves.</li>
  </ul>
  Harness engineering optimizes <em>everything around</em> the model: what it's allowed to touch,
  what it can see, what stops it when it's wrong.
</div>

---

## The components of a harness

| Component                              | What it does                                                                        | Failure mode if missing                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Tool contracts**                     | Typed schemas for every action the agent can take (file edit, shell exec, API call) | Agent invents arguments, calls undefined tools, silent no-ops             |
| **System prompt architecture**         | Durable behavior rules layered over per-turn instructions                           | Instructions drift or get overridden turn to turn                         |
| **Context/memory management**          | Compaction, retrieval, summarization once the window fills                          | Silent context loss, contradictory actions after compaction               |
| **Permission model**                   | Approve/deny gates scoped to blast radius (read vs. destructive)                    | Irreversible actions (force-push, `rm -rf`, prod writes) run unsupervised |
| **Sandboxing / execution environment** | Isolates what a tool call can actually reach                                        | A shell tool becomes a full RCE surface                                   |
| **Orchestration**                      | Sub-agent spawning, parallel fan-out, workflow sequencing                           | Monolithic context window, no separation of concerns                      |
| **Feedback loops**                     | Hooks, telemetry, evals, guardrails that catch bad behavior                         | Regressions ship silently; no signal until a user complains               |

<details style="margin: 1rem 0; padding: 0.5rem 1rem; border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 4px;">
<summary style="cursor: pointer; font-weight: 600;">Concrete example: this session is a harness</summary>

The Claude Code session you're reading this in _is_ a harness around an LLM: typed tool schemas
(Bash, Edit, Read, Agent, Workflow), a layered system prompt (global CLAUDE.md → project CLAUDE.md →
session context), a permission-mode gate on risky tool calls, hooks for pre/post tool-call behavior,
a memory system for cross-session state, and sub-agent orchestration via the `Agent` and `Workflow`
tools. None of that is the model — it's the engineering that makes the model trustworthy enough to
run `git commit` on your behalf.

</details>

---

## Why it's its own discipline

Harness engineering brings **systems-design rigor** to a layer that's often treated as an
afterthought bolted onto a prompt:

- **Reliability framing** — the harness needs the same posture as any distributed system: failure
  modes enumerated, blast radius bounded, degraded modes defined. A tool call without a permission
  gate is the agentic equivalent of an ungated destructive API endpoint.
- **Observability framing** — every tool call, every context compaction, every sub-agent spawn is an
  event worth being able to trace and audit after the fact, the same way a request is traced through
  a distributed system.
- **Guardrails as circuit breakers** — an evaluator that halts a bad agent loop plays the same role
  a circuit breaker plays in a service mesh: fail fast, contain the blast radius, don't let one bad
  decision cascade.

This is why [[google-adk]], [[crewai]], [[hermes-agent]], and [[openclaw]] are all, underneath their
differing APIs, competing answers to the same harness design questions: how is memory scoped, how
are tools sandboxed, how does orchestration compose. Comparing them productively means comparing
harness decisions, not comparing prompts.

## Where this shows up in practice

- The [[07-1-connecting-agents-to-grafana|Build an AI SRE Assistant]] hands-on build (Part 00) is a
  harness engineering exercise in miniature: the tool layer wiring to Grafana/Loki/Tempo, the
  approval checkpoints before remediation, and the RCA-confidence scoring are harness decisions, not
  prompt decisions — see also [[09-production-ready-agent-design|Production-Ready Agent Design]]
  (Part 00 of Building & Evaluating Agents) for the checklist this generalizes into.
- MCP servers like [[mcp-toolbox]] and [[grafana-mcp]] are harness _inputs_ — they define the tool
  contract surface an agent can be granted, with their own permission scoping (OAuth2, RBAC) layered
  underneath.

The practical takeaway: when an agent misbehaves, the fix is rarely "reword the prompt." It's almost
always a harness gap — a missing tool contract, an ungated destructive action, or a context window
that silently dropped the constraint that mattered.
