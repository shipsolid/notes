---
title: "What is Vertex AI"
description: "Google Cloud's managed ML/AI platform — as of 2026 rebranded and consolidated into the Gemini Enterprise Agent Platform, bundling 200+ foundation models, Agent Builder, and a managed agent runtime (formerly 'Agent Engine')."
tags: ["tech", "google-cloud", "ai-agents", "mlops"]
updated: 2026-07-10
hidden: false
zettelId: "202607081949-11"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/google-adk
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/gemini-enterprise-agent-platform
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/mem0
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/mcp-toolbox
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/hermes-agent
    kind: related
---

Vertex AI is Google Cloud's managed platform for building, training, and serving ML/AI models — and,
as of Google Cloud Next 2026, its identity has shifted decisively toward agents. Google rebranded it
to the **Gemini Enterprise Agent Platform**, consolidating it with Agentspace into a single product.
Existing Vertex AI customers don't need to migrate anything — the platform and APIs continue to
work, the umbrella name changed. This note stays focused on the deploy runtime and pricing; the full
build/scale/govern/optimize lifecycle and the new governance stack (Agent Identity, Agent Registry,
Agent Gateway) live in [[gemini-enterprise-agent-platform]].

---

## What actually changed

```
Before 2026:  Vertex AI (ML platform)  +  Agentspace (separate agent product)
2026:         Gemini Enterprise Agent Platform (one product)
                ├── Agent Builder  — build agents
                └── Deployments    — run agents (formerly "Agent Engine")
```

## Agent Builder: two ways to build

| Mode                    | Who it's for                          | How it works                                       |
| ----------------------- | ------------------------------------- | -------------------------------------------------- |
| **Agent Studio**        | Low-code / business users             | Visual builder over Google's foundation models     |
| **[[tech/google-adk]]** | Engineers who want code-first control | Open-source framework, deployed onto this platform |

Both paths bundle access to 200+ foundation models, a managed runtime, and governance controls (tool
allow-listing, audit, access policy) in one pay-as-you-go service — the governance layer is the part
most enterprise adopters actually pay for, not the models themselves.

## Deployments (formerly Agent Engine)

This is the managed runtime layer — where an agent actually lives and takes requests, as opposed to
where it was authored.

```
Your ADK / LangGraph / custom agent code
              │
              ▼
      Deployments (managed runtime)
              │
       ┌──────┴──────┐
       ▼             ▼
  Session state   Memory Bank
  (short-term)    (long-term, GA)
```

**Memory Bank** reaching General Availability in 2026 means this runtime now manages both short-term
session state and long-term memory for production workloads directly — functionally overlapping with
what [[mem0]] does as a standalone layer, except scoped to agents deployed on this specific runtime.

## Pricing shape (2026)

Worth knowing before recommending this as a deploy target, since the billing model is metered
compute + memory, not per-request:

| Meter                                                | Rate                               |
| ---------------------------------------------------- | ---------------------------------- |
| Agent Engine runtime (vCPU)                          | $0.0864 / vCPU-hour                |
| Agent Engine runtime (memory)                        | $0.0090 / GB-hour                  |
| Free tier                                            | 50 vCPU-hours + 100 GB-hours/month |
| Stored session events / memories (from Jan 28, 2026) | $0.25 per 1,000 events/memories    |

The practical implication: an idle-but-deployed agent still bills for the runtime keeping it alive,
the same cost model as a running container rather than a serverless function that scales to zero.

## Where it fits

| Layer                  | Component                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| Build (code-first)     | [[tech/google-adk]]                                               |
| Build (low-code)       | Agent Studio                                                      |
| Run                    | Deployments (managed runtime + Memory Bank)                       |
| Data access for agents | [[mcp-toolbox]] (databases), [[grafana-mcp]] (observability data) |

**Why it's on the backlog:** it's the "where does this actually run in production" answer for
anything built with [[tech/google-adk]] — worth evaluating against self-hosting
[[hermes-agent]]/[[tech/crewai]] on your own infra when the governance and managed-memory features
outweigh the metered-compute cost.
