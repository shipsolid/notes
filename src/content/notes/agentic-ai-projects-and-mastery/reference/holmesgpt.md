---
title: "What is HolmesGPT"
description: "Robusta.dev's open-source SRE agent (CNCF Sandbox) for investigating production incidents across Kubernetes, VMs, cloud services, and databases — an agentic tool-calling loop over 70+ toolsets, not a chatbot or RAG system, with a proactive 'operator mode' that monitors and opens fix PRs without a human trigger."
tags: ["tech", "ai-agents", "kubernetes", "observability", "cncf"]
updated: 2026-07-13
hidden: false
zettelId: "202607130811"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/hermes-agent
    kind: compared_to
  - slug: observability/17-ai-and-intelligent-observability/01-aiops/01-aiops-agentic-rca
    kind: related
---

HolmesGPT (`robusta-dev/holmesgpt`) is an open-source SRE agent built by
[Robusta.dev](https://robusta.dev), with significant contributions from Microsoft, now a **CNCF
Sandbox project** under Apache 2.0. Its stated scope is broad on purpose: "investigating production
incidents across any infrastructure — Kubernetes, VMs, cloud services, databases, and more," not
just Kubernetes-native troubleshooting.

---

## Not a chatbot, not RAG — an agentic tool-calling loop

The distinguishing architectural choice: HolmesGPT doesn't retrieve documents and summarize them. It
runs an
**[[observability/17-ai-and-intelligent-observability/01-aiops/01-aiops-agentic-rca|agentic loop]]**
that actively queries _live_ observability data through deep integrations called **toolsets**,
iterating until it has enough evidence to name a root cause.

```
Alert / question in ──▶ Agent loop ──▶ pick toolset(s) ──▶ query live system
                             ▲                                    │
                             └──────────── more evidence needed? ─┘
                                             │ no
                                             ▼
                                   Root cause + explanation
```

This is the same category distinction [[hermes-agent]] makes against a stateless chatbot, but
applied to the incident-investigation domain specifically rather than general personal-assistant
tasks — toolsets are the SRE-agent equivalent of Hermes Agent's skill library, except pre-built
against observability platforms instead of self-distilled from completed tasks.

## Deployment modes

| Mode                 | What it's for                                                           |
| -------------------- | ----------------------------------------------------------------------- |
| CLI                  | Ad-hoc, terminal-driven investigation                                   |
| Web UI / TUI         | Interactive troubleshooting session                                     |
| Kubernetes operator  | Continuous, always-on background monitoring — no human trigger required |
| Slack / MS Teams bot | Findings and questions routed through existing chat workflows           |
| HTTP server          | Docker / Helm-deployed, for wiring into existing incident tooling       |

## Toolset integrations (70+)

| Category           | Examples                                                         |
| ------------------ | ---------------------------------------------------------------- |
| Kubernetes         | Pod logs, events, resource status                                |
| Metrics / alerting | Prometheus, AlertManager, Grafana dashboards                     |
| Ticketing / paging | PagerDuty, OpsGenie, Jira — bidirectional alert/ticket workflows |
| Chat               | Slack, Microsoft Teams                                           |
| Observability SaaS | Datadog, New Relic, Elasticsearch                                |
| Cloud providers    | AWS, Azure, GCP                                                  |
| Databases          | Multiple relational/NoSQL integrations                           |

LLM backend is pluggable: OpenAI, Anthropic, Azure, Bedrock, and Gemini are all supported, so the
reasoning model is a config choice independent of which toolsets are wired up.

## Operator mode — the actual headline feature

Most "AI SRE" demos are still human-triggered: something pages, a human invokes the agent.
HolmesGPT's **operator mode** removes that trigger:

```
Continuous background loop (Kubernetes operator)
   │
   ├── Watches for new deployments → verifies them post-rollout
   ├── Runs scheduled health checks → catches regressions before they alert
   └── Detects an issue
          │
          ▼
   Investigates via toolsets (same agentic loop as CLI mode)
          │
          ▼
   Reports to Slack  ──  or, with GitHub integration, opens a PR with the fix
```

Opening a pull request as the remediation step (rather than just paging a human with a root-cause
summary) is the part worth flagging — it's a step further into the "autonomous" end of the Reactive
→ Resilient → Autonomous spectrum than most tools in this space currently ship.

## Guardrails for production use against real observability data

Three specific design choices address the failure modes that matter when you point an LLM agent at
production telemetry rather than a curated document set:

- **Read-only RBAC compliance** — the agent's Kubernetes/cloud credentials are scoped read-only, so
  a bad tool call can't mutate cluster state (contrast with the scoping concern in [[grafana-mcp]],
  where a write-scoped service-account token is the actual risk).
- **Server-side filtering at petabyte scale** — queries push filtering down to the data source
  instead of pulling raw logs/metrics into the agent's context window.
- **Memory-safe execution** — bounded to avoid OOM crashes when a toolset query against a large
  observability dataset returns more than expected.

## Where it sits next to what's already in this repo

| Tool                                      | Deployment                            | Scope                                                          | Autonomy                                                        |
| ----------------------------------------- | ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| **HolmesGPT**                             | CLI, K8s operator, Slack/Teams, HTTP  | Incident investigation across 70+ toolsets                     | Operator mode: monitors, investigates, opens fix PRs unprompted |
| [[hermes-agent]]                          | Self-hosted, always-on                | General-purpose personal agent, not SRE-specific               | Learns skills from its own completed tasks                      |
| h-aiops `04-sre-assistant-v1` (this repo) | FastAPI + Streamlit, k3d, MCP sidecar | SRE assistant with Azure AD RBAC + validator-gate architecture | Human-in-the-loop by design (validator gate)                    |

**Why it's on the backlog:** this is the closest open-source, CNCF-legitimized analog to the
`h-aiops` SRE-agent line already in this repo — worth a direct read of its toolset abstraction and
operator-mode design before the next iteration of `04-sre-assistant-v1`, particularly the
read-only-RBAC-plus-validator-gate combination as a pattern for letting an agent act on production
data without a human approving every step.
