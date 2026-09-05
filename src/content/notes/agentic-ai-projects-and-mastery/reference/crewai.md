---
title: "What is CrewAI"
description: "Open-source Python framework for multi-agent orchestration — role-based 'Crews' for autonomous collaboration and event-driven 'Flows' for precise control, now a de facto standard for production agentic pipelines."
tags: ["tech", "ai-agents", "agent-frameworks", "python", "open-source"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/google-adk
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/mem0
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/mcp-toolbox
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/playwright
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/vertex-ai
    kind: related
---

CrewAI is an open-source Python framework for building **multi-agent** systems — several LLM agents
collaborating on one task instead of a single agent doing everything. It's become one of the most
widely adopted frameworks in this space, built around a metaphor that maps directly onto how humans
organize teams.

---

## The core metaphor

Every agent gets three things, the same way you'd brief a new hire:

| Field         | Purpose                                                   |
| ------------- | --------------------------------------------------------- |
| **Role**      | What this agent is ("Senior Data Analyst", "QA Reviewer") |
| **Goal**      | What it's trying to achieve on this task                  |
| **Backstory** | Context that shapes tone, priorities, and judgment calls  |

Agents are assigned **Tasks**, and Tasks are grouped into a **Crew** that executes them under one of
three process types:

```
Sequential    Agent A → Agent B → Agent C            (fixed pipeline)
Hierarchical  Manager agent ──▶ delegates to workers  (dynamic delegation)
Consensual    Agents vote on a decision before proceeding
```

## Crews vs. Flows

This is the distinction that matters most when picking CrewAI for a real system:

- **Crews** — autonomous agent collaboration. You describe roles and goals; the agents figure out
  the "how." Good for open-ended reasoning tasks.
- **Flows** — event-driven, low-level control. You define exact state transitions and routing logic,
  calling into Crews as steps when you need agentic reasoning inside an otherwise deterministic
  pipeline.

```
Flow (deterministic backbone)
  ├── Step 1: fetch data (plain code)
  ├── Step 2: Crew("triage") — agents reason about the data
  ├── Step 3: if triage.severity == "high": Crew("investigate")
  └── Step 4: write result (plain code)
```

Production systems tend to use Flows as the skeleton and Crews only where genuine reasoning is
needed — this avoids the classic failure mode of letting agents "decide" things a simple `if`
statement should have decided.

## Recent architecture additions (2026)

- **Pluggable backends** for memory, knowledge, and RAG — swap in [[mem0]] or another memory
  provider instead of the default, without rewriting the Crew.
- **Chat API** for conversational (multi-turn) flows, not just one-shot task execution.
- **Scoped runtime state** — isolates state between concurrent runs so parallel Crew executions
  don't leak context into each other. This matters the moment you run CrewAI as a shared service
  rather than a single local script.
- Native LLM providers beyond OpenAI/Anthropic, including Snowflake Cortex.

## Where it fits next to the rest of the agent stack

| Concern                  | CrewAI's answer                                                                   |
| ------------------------ | --------------------------------------------------------------------------------- |
| Orchestration            | Native — Crews (autonomous) + Flows (deterministic)                               |
| Memory                   | Pluggable — bring your own, e.g. [[mem0]]                                         |
| Tool access to your data | Bring your own MCP client, or wrap [[mcp-toolbox]] as a CrewAI tool               |
| Browser/computer control | Not native — pair with [[playwright]] MCP as a tool                               |
| Deployment               | Your own process/container — no managed runtime like [[vertex-ai]]'s Agent Engine |

**Why it's on the backlog:** it's the most direct comparison point for [[tech/google-adk]] — both
solve multi-agent orchestration, but ADK is Google's "agent execution framework" tied to its own
runtime and languages, while CrewAI is runtime-agnostic Python you can drop into any pipeline,
including an h-aiops SRE-agent step.
