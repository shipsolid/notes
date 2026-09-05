---
title: "What is Google ADK"
description: "Google's open-source, code-first Agent Development Kit — a multi-language framework for building, evaluating, and deploying agents, positioned as an 'agent execution framework' rather than a toolkit."
tags: ["tech", "ai-agents", "agent-frameworks", "google-cloud", "open-source"]
updated: 2026-07-10
hidden: false
zettelId: "202607081949-3"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/mem0
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/vertex-ai
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/mcp-toolbox
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/gemini-enterprise-agent-platform
    kind: related
---

ADK (Agent Development Kit) is Google's open-source framework for building AI agents in a way that
"feels like software development" — explicit orchestration, structured context, and multi-language
support, rather than a thin prompt wrapper.

---

## Positioning: framework, not toolkit

Google has been explicit that ADK is not a grab-bag of helper functions — it's an **agent execution
framework**: it owns the orchestration loop, context assembly, and evaluation harness, the same way
a web framework owns request routing rather than leaving you to wire it yourself.

## Language support

ADK is unusually broad here compared to most agent frameworks (which are Python-only):

| Language              | Status      |
| --------------------- | ----------- |
| Python                | Primary     |
| TypeScript/JavaScript | Supported   |
| Go                    | Supported   |
| Java                  | 1.0 shipped |
| Kotlin                | Supported   |

## Orchestration model

ADK gives you two ways to control agent behavior, and expects most real systems to mix both:

```
Workflow agents (predictable)     Dynamic routing (adaptive)
        │                                  │
   fixed pipeline steps          agent-coordinated delegation
  (sequential / parallel / loop)  agents decide the order
```

It natively supports **multi-agent composition** — specialized agents that collaborate and delegate,
conceptually similar to [[tech/crewai]]'s Crews, but tied to Google's own runtime and
context-management model rather than being runtime-agnostic. Cross-agent (not just cross-framework)
communication runs over Google's **A2A protocol** (Agent-to-Agent) — the piece CrewAI leaves to you.

**v2.0 added graph-based workflows** — the ability to weave deterministic code and adaptive LLM
reasoning into the same execution graph, instead of choosing one mode per agent. This sits between
the two poles above rather than replacing them.

## Model flexibility

ADK isn't a Gemini-only framework, despite being Google's own tooling — it routes to whatever model
backend a step needs:

| Backend                                   | Notes                                |
| ----------------------------------------- | ------------------------------------ |
| Gemini                                    | First-party, tightest integration    |
| Claude, Gemma                             | Supported directly                   |
| Ollama, vLLM, LiteLLM, LiteRT-LM          | Local / self-hosted model routing    |
| Vertex AI Agent Engine, Apigee AI Gateway | Managed / gateway-fronted deployment |

This matters for the same reason OTel-native instrumentation matters over vendor SDKs: the
orchestration layer doesn't lock you into one model vendor even though the managed _runtime_ (Agent
Engine) is Google Cloud-only.

## Evaluation framework

Evaluation is a first-class ADK component, not an afterthought bolted on post-launch: criteria-based
scoring, user simulation, and environment simulation, with custom metrics for domain-specific
correctness checks. This is the harness ADK expects you to run before promoting an agent out of dev.

## Context management — the actual differentiator

Most agent frameworks handle context by concatenating strings into the prompt until the window
overflows. ADK treats context closer to source code: every token in the context window has to earn
its place.

```
Session state + Memory + Tool outputs + Artifacts
              │
              ▼
   ADK context assembler:
     - filters irrelevant events
     - summarizes older turns
     - lazy-loads artifacts (not eagerly inlined)
     - tracks token budget continuously
              │
              ▼
        Structured context ──▶ LLM call
```

This is the same problem [[mem0]] solves for memory specifically — ADK's version is broader,
covering session state and tool artifacts too, not just long-term memory facts.

## Deployment targets

```
adk deploy ──▶ Vertex AI Agent Engine (see [[vertex-ai]]), now under [[gemini-enterprise-agent-platform]]
          ├──▶ Google Cloud Run
          ├──▶ Google Kubernetes Engine (GKE)
          └──▶ any other container/Kubernetes environment
```

ADK code isn't locked to Google Cloud at deploy time — the framework is open source and the agent
can run anywhere containers run — but the managed runtime option (Agent Engine) is Google Cloud
only.

## Where it fits

| Concern              | ADK                                          | [[tech/crewai]]                     |
| -------------------- | -------------------------------------------- | ----------------------------------- |
| Languages            | Python, TS/JS, Go, Java, Kotlin              | Python only                         |
| Model backend        | Gemini, Claude, Gemma, Ollama, vLLM, LiteLLM | OpenAI/Anthropic + Snowflake Cortex |
| Context management   | Built-in, structured                         | Left to you / pluggable             |
| Managed runtime      | Vertex AI Agent Engine (optional)            | None — bring your own               |
| Database tool access | First-class integration with [[mcp-toolbox]] | Wrap as a generic tool              |

**Why it's on the backlog:** if the h-aiops SRE-agent line ever needs multi-language agents (a
Go-based collector talking to a Python reasoning layer) or a managed deploy target, ADK is the
framework built for exactly that, at the cost of coupling more tightly to Google Cloud's runtime.
