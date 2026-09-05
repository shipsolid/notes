---
title: "What is Hermes Agent"
description: "Nous Research's open-source, self-hosted AI agent that runs continuously on your own server, builds persistent memory over time, and distills its own reusable 'skills' from completed tasks."
tags: ["tech", "ai-agents", "agent-frameworks", "open-source", "llm"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-6"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/openclaw
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/playwright
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/mem0
    kind: related
---

Hermes Agent is easy to mistake for "the Hermes model, used as an agent." It's actually a distinct
product: an open-source, self-hosted **agent runtime** built by Nous Research (the lab behind the
Hermes model family — currently `Hermes-4.3-36B`), released February 2026 under MIT license. The
model provides the reasoning; Hermes Agent is the always-on process, memory store, and
tool-execution loop wrapped around it.

---

## What makes it different from a chatbot

Most agent frameworks are invoked per-task and forget everything when the process exits. Hermes
Agent is designed to run **persistently** on infrastructure you control — a home server, a VPS, a
Raspberry Pi — accumulating context and capability the longer it runs, rather than starting cold
every session.

```
Chatbot loop:   spin up → answer → tear down → forget
Hermes Agent:   spin up once → keep running → remember → get better at repeat tasks
```

---

## Architecture

| Component               | What it does                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profiles**            | Each profile is an independent agent identity — its own config, identity document, memory store, gateway process, and cron definitions. Enables multi-agent setups on one host. |
| **Holographic memory**  | Fact-based persistent memory backed by SQLite + FTS5 full-text search — not a vector DB. Retrieval is fact lookup, not embedding similarity.                                    |
| **Skill learning loop** | After a task that takes 5+ tool calls, the agent distills a reusable "skill" document and stores it. Skills get patched automatically when later found outdated or wrong.       |
| **Gateway process**     | Single process fans out to Telegram, Discord, Slack, WhatsApp, Signal, and CLI — plus voice-memo transcription — with conversation continuity across channels.                  |

```
User (any channel) ──▶ Gateway ──▶ Agent loop ──▶ Tool calls (incl. browser use)
                                       │
                                       ▼
                          Holographic memory (SQLite/FTS5)
                                       │
                                       ▼
                          Distilled Skills (reused on similar future tasks)
```

## The skill-learning loop, concretely

This is the headline feature: the agent doesn't just execute a task, it **writes down how it solved
it** so it doesn't have to re-derive the approach next time.

```
Task completed (≥5 tool calls)
   │
   ▼
Distill a named "skill" document (steps, tools used, gotchas)
   │
   ▼
Store in persistent memory
   │
   ▼
Next similar task → retrieve skill → apply → patch if it was wrong/stale
```

Over months of continuous operation this produces a personal library of proven procedures — closer
to how a human on-call engineer builds a runbook from lived incidents than to a stateless LLM call.

## Release velocity

Development has been unusually fast for an open-source project: seven major versions shipped between
late March and mid-April 2026 alone. The `v0.8.0` release (April 8, 2026) added 209 merged PRs in
one drop, including Browser Use integration (agentic web browsing — see [[playwright]] for the
MCP-based alternative) and worktree parallelism for running multiple tasks concurrently without
state collisions.

## Where it sits in the agent landscape

| Tool             | Deployment model               | Memory                             | Best fit                                                 |
| ---------------- | ------------------------------ | ---------------------------------- | -------------------------------------------------------- |
| **Hermes Agent** | Self-hosted, always-on         | Built-in holographic (SQLite)      | A personal always-on assistant that gets better with age |
| [[openclaw]]     | Self-hosted, always-on         | Built-in + skills marketplace      | Broad computer/browser control across 29+ channels       |
| [[tech/crewai]]  | Invoked per-run (job/pipeline) | Pluggable (RAG/knowledge/[[mem0]]) | Structured multi-agent workflows in production pipelines |

**Why it's on the backlog:** if you're evaluating agent runtimes for the h-aiops SRE-agent line of
work, Hermes Agent is the clearest example of a framework where memory and skill-accumulation are
first-class — worth comparing against bolting [[mem0]] onto a stateless framework like
[[tech/crewai]] or [[tech/google-adk]].
