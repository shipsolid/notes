---
title: "What is Mem0"
description: "Universal memory layer for AI agents — combines vector search, a knowledge graph, and key-value caching behind one API, so any framework can bolt on persistent, cross-session memory in under a day."
tags: ["tech", "ai-agents", "memory", "llm", "open-source"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-8"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/hermes-agent
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/google-adk
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/vertex-ai
    kind: compared_to
---

Mem0 is a memory layer you attach to an LLM application or agent so it can retain facts across
sessions instead of starting from zero every conversation. It's infrastructure, not a framework — it
doesn't orchestrate agents itself, it sits underneath frameworks like [[tech/crewai]] or
[[tech/google-adk]] and answers "what do we already know about this user/task."

---

## The problem it solves

```
Without memory:  every session starts cold — no preferences, no prior context, no continuity
With Mem0:       facts extracted from conversation → stored → retrieved when relevant next time
```

## How retrieval works

```
Conversation happens
        │
        ▼
Extract facts  ──▶  Store, indexed by user / session / agent ID
        │
        ▼
New session starts
        │
        ▼
Retrieve relevant memories:
  - semantic similarity (vector search)
  - keyword matching
  - entity matching
        │
        ▼
Inject into context window ──▶ LLM responds with continuity
```

## Architecture: three storage types behind one API

| Layer           | What it's good at                                      |
| --------------- | ------------------------------------------------------ |
| Vector search   | "Find memories similar in meaning" — fuzzy recall      |
| Knowledge graph | Relationships between entities — "who reports to whom" |
| Key-value cache | Fast exact-match lookups for hot facts                 |

Combining all three behind a single API is the actual product — most teams building this themselves
would otherwise stitch together a vector DB, a graph DB, and Redis by hand.

## Memory Compression Engine

The other headline feature: instead of just storing raw conversation turns, Mem0 compresses chat
history into optimized memory representations, cutting prompt tokens by up to 80% while preserving
context fidelity. This matters directly for cost and latency — every token of re-injected memory is
a token you're paying for and waiting on at every single turn.

## Where this overlaps with other tools on this list

| Tool                | Its own memory story                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------ |
| [[hermes-agent]]    | Built-in "holographic" memory (SQLite + FTS5, fact-based, not vector search)               |
| [[tech/google-adk]] | Structured context management (session state, artifacts) — broader than just memory        |
| [[vertex-ai]]       | Managed Memory Bank (GA in 2026) inside its own Agent Engine runtime                       |
| **Mem0**            | Framework-agnostic — the thing you reach for when your framework doesn't already have this |

## Adoption signal

~48,000 GitHub stars, a $24M Series A (October 2025), YC-backed — by 2026 it's positioned as the
default choice for bolting production-grade memory onto an existing agent quickly, rather than
building the vector+graph+cache stack yourself.

**Why it's on the backlog:** it's the answer for any agent framework in this list that doesn't ship
first-class long-term memory out of the box — most notably [[tech/crewai]], where memory is
explicitly pluggable rather than built-in.
