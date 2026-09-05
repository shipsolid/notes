---
title: "What is Gemini Enterprise Agent Platform"
description: "Google's April 2026 unification of agent tooling — a four-stage lifecycle (build, scale, govern, optimize) wrapping Agent Studio/ADK, a stateful Agent Runtime, an Identity/Registry/Gateway governance stack, and native A2A + MCP interop."
tags: ["tech", "ai-agents", "agent-frameworks", "google-cloud", "governance"]
updated: 2026-07-10
hidden: false
zettelId: "202607081949-18"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/vertex-ai
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/google-adk
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/mem0
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/hermes-agent
    kind: related
---

Gemini Enterprise Agent Platform (GEAP) is Google's April 2026 platform for the full agent lifecycle
— "build, scale, govern, and optimize agents" in Google's own framing. It's the umbrella that now
sits over what used to be three separate stories: Vertex AI (see [[vertex-ai]]) as the ML platform,
Agentspace (launched December 2024) as the enterprise agent product, and [[tech/google-adk]] as the
code-first build framework. Agentspace was rebranded Gemini Enterprise roughly ten months after
launch; this platform is the next consolidation on top of that.

---

## The four-stage lifecycle

Everything else in this note is a component slotted into one of four named stages:

```
Build                Scale                 Govern                Optimize
"choose the right    "clear the path       "establish             "guarantee
 environment"          to production"        centralized control"   quality"
     │                     │                      │                    │
Agent Studio        Agent Runtime          Agent Identity        Agent Simulation
ADK                  Memory Bank            Agent Registry        Agent Evaluation
Agent Garden         Agent Sandbox          Agent Gateway         Agent Observability
                                            Semantic Gov Policies  Agent Optimizer
```

## Build

| Component               | What it is                                                                     |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Agent Studio**        | Low-code visual canvas for designing agent reasoning loops                     |
| **[[tech/google-adk]]** | Code-first, model-agnostic framework — "AI-native coding capabilities"         |
| **Agent Garden**        | Curated templates (code modernization, financial analysis, invoice processing) |

This is the same Agent Builder split already covered in [[vertex-ai]] — GEAP is the branding it now
ships under.

## Scale — a runtime built for long-running agents

The **Agent Runtime** was explicitly re-engineered to support agents that "maintain state for days
at a time," not just request/response calls. Two things make that possible:

- **Memory Bank** — persistent, long-term context, functionally the same problem [[mem0]] solves
  standalone, except scoped to this runtime.
- **Agent Sandbox** — a hardened execution environment for model-generated code, so a long-running
  agent can safely run code it wrote itself rather than only calling pre-registered tools.

The metered vCPU/memory pricing for this runtime layer (formerly "Agent Engine") is detailed in
[[vertex-ai]] rather than duplicated here.

## Govern — the control plane

This is the part of GEAP that doesn't have an equivalent in [[tech/crewai]] or a self-hosted
[[hermes-agent]] setup — it's the reason an enterprise buys the managed platform instead of
assembling the pieces:

| Component                        | Role                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Agent Identity**               | Unique cryptographic ID per agent — the basis for access control and audit                               |
| **Agent Registry**               | Single source of truth indexing every internal agent, tool, and skill — including registered MCP servers |
| **Agent Gateway**                | "Air traffic control" — central policy enforcement for all MCP + A2A traffic                             |
| **Semantic Governance Policies** | Natural-language constraints applied to an agent's tool calls, not just RBAC on the tool itself          |

## Model access and discovery

- **Model Garden** — first-class access to 200+ models, not just Google's own: Gemini 3.1 Pro,
  Claude Opus/Sonnet/Haiku, Gemma 4, Lyria 3. Anthropic is a named first-party partner here, the
  same multi-model posture [[tech/google-adk]] has at the framework level.
- **Agent Gallery** — the discovery surface for _agents_, not models: validated agents from partners
  including Adobe, Salesforce, ServiceNow, and Workday, browsable inside the Gemini Enterprise app.

## Optimize — closing the loop

| Component               | What it does                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Agent Simulation**    | Tests agents against synthetic, human-like user interactions                        |
| **Agent Evaluation**    | Continuously scores agents against live production traffic                          |
| **Agent Observability** | Full execution traces — a real-time view into agent reasoning, not just outcomes    |
| **Agent Optimizer**     | Clusters real-world failures automatically and suggests refined system instructions |

This is a superset of the evaluation harness [[tech/google-adk]] ships (criteria-based scoring,
user/ environment simulation) — GEAP adds the always-on observability and auto-clustering of
failures on top.

## Interop: A2A + MCP as first-class traffic, not an afterthought

The **Agent2Agent (A2A) protocol** is Google's open protocol so agents from different builders and
platforms can discover each other, collaborate, and securely delegate tasks — the piece that lets a
partner agent from Agent Gallery talk to an in-house ADK agent without custom glue code. Agent
Gateway enforces policy across both A2A and MCP traffic uniformly, and Agent Registry treats MCP
servers as first-class citizens alongside agents and skills. Real deployments already lean on this:
L'Oréal's Beauty Tech Agentic Platform pairs ADK with MCP; PayPal layers its own **Agent Payment
Protocol (AP2)** on top for multi-agent commerce workflows.

## Pricing shape (2026)

Platform-level meters, distinct from the Agent Runtime's own vCPU/memory billing (see
[[vertex-ai]]):

| Meter         | Rate                          |
| ------------- | ----------------------------- |
| Agent Storage | $0.30 / GiB-month             |
| Agent Compute | $0.085 per 3M read operations |

Editions are named Standard, Plus, Frontline, and Business — the public pricing page splits
entitlements across these but doesn't fully enumerate what's gated per tier as of this writing, so
treat the edition boundary as directional until confirmed against a live quote.

## Where it fits

| Concern                                | This note (GEAP)                               | [[tech/google-adk]]             | [[vertex-ai]]                           |
| -------------------------------------- | ---------------------------------------------- | ------------------------------- | --------------------------------------- |
| Scope                                  | Umbrella platform: build+scale+govern+optimize | Code-first build framework only | Deploy runtime + historical ML platform |
| Governance (Identity/Registry/Gateway) | Native, platform-level                         | None — bring your own           | Not covered                             |
| Agent discovery                        | Agent Gallery (partner agents)                 | N/A                             | N/A                                     |
| Multi-agent interop                    | A2A protocol, native                           | A2A client support              | N/A                                     |

**Why it's on the backlog:** the governance stack (Agent Identity, Agent Registry, Agent Gateway) is
the piece that would actually matter if the h-aiops SRE-agent line ever needs to run multiple agents
with different trust levels against ShipSolid's production tooling — audit and policy enforcement
per-agent, not just per-service-account. The A2A protocol is the other reason to watch this: it's
what would let a home-grown ADK agent interoperate with a partner-built agent from Agent Gallery
without custom integration work.
