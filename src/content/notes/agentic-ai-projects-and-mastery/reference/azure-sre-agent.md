---
title: "What is Azure SRE Agent (Microsoft)"
description: "Microsoft's AI agent embedded in Azure for autonomous incident response — acknowledges alerts from PagerDuty/ServiceNow/Azure Monitor, investigates via Azure Monitor/App Insights/Kusto, executes configurable Incident Response Plans with tunable autonomy, and learns across incidents via Session Insights."
tags: ["tech", "ai-agents", "observability", "incident-response", "azure"]
updated: 2026-08-09
hidden: false
zettelId: "202608021430-6"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/holmesgpt
    kind: compared_to
  - slug: observability/17-ai-and-intelligent-observability/01-aiops/01-aiops-agentic-rca
    kind: related
---

Azure SRE Agent is Microsoft's AI-driven incident-response agent, built into Azure rather than
deployed as a separate open-source project. Where [[holmesgpt]] is a bring-your-own-infra CNCF
Sandbox project you wire into whatever platform you already run, Azure SRE Agent is Azure-native by
design — it starts investigating the moment an alert fires, without a human triggering it.

---

## Architecture: alert-triggered agentic loop

```
Alert fires (PagerDuty / ServiceNow / Azure Monitor)
        │
        ▼
SRE Agent acknowledges the alert
        │
        ▼
Queries Azure Monitor, App Insights, Kusto, connected 3rd-party tools
        │
        ▼
Hypothesis-driven investigation (extended reasoning for complex incidents)
        │
        ▼
Root cause + proposed fix ──▶ executes or waits for approval, per configured autonomy
```

## Incident Response Plans — routing and autonomy control

Response plans route an incoming incident to the right custom agent, at the right autonomy level,
based on rules you define — filterable by severity, service, title, and type. This is the
configuration surface: instead of one agent handling every incident the same way, different incident
shapes get routed to different plans.

## Run modes

| Mode       | Behavior                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------- |
| Assisted   | Investigates and proposes a fix; a human approves before anything executes                    |
| Autonomous | For scenarios trusted and well-tested enough to skip approval — the agent remediates directly |

## Learning loop: Session Insights

Unlike a static runbook, the agent generates a **Session Insight** after every incident — a
structured summary of what happened, what worked, and what to improve — and that record feeds
forward into how future incidents of the same shape get handled. The "learns and remembers" framing
is the same design goal [[holmesgpt]] and other agentic-RCA tools are converging on; the difference
is where that memory lives and who controls it.

## Where it sits next to HolmesGPT

| Concern             | Azure SRE Agent                                                                               | [[holmesgpt]]                                                     |
| ------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Vendor / openness   | Microsoft, Azure-native, closed                                                               | Robusta.dev, Apache 2.0, CNCF Sandbox                             |
| Integration surface | Azure-first: Azure Monitor, App Insights, Kusto, PagerDuty/ServiceNow/Azure Monitor incidents | 70+ toolsets across Kubernetes, VMs, cloud, databases, any infra  |
| Autonomy control    | Per Incident Response Plan — Assisted vs. Autonomous                                          | "Operator mode" — continuous background monitoring, opens fix PRs |
| Memory              | Session Insights per incident                                                                 | No equivalent persistent per-incident memory layer documented     |

**Why it's relevant here:** the per-plan, configurable autonomy model (route by severity/service,
choose assisted vs. autonomous per route) is a cleaner articulation of the same
human-in-the-loop-by-design tension that
[[07-1-connecting-agents-to-grafana|Build an AI SRE Assistant]] (Part 00) works through with its own
approval-gate design — worth comparing Microsoft's routing-based autonomy control directly against
that pattern, alongside HolmesGPT's read-only-RBAC approach to the same problem, before extending
that hands-on build further.
