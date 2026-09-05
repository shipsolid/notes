---
title: "What is Grafana Skills"
description: "Grafana's take on reusable agent skills — captures a team's troubleshooting expertise as standardized, shareable procedures that can trigger MCP actions, plus gcx: a Grafana Cloud CLI shipping 22 bundled skills for Claude Code and other .agents-compatible harnesses."
tags: ["tech", "grafana", "observability", "ai-agents", "mcp"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-5"
relations:
  - slug: grafana-cloud/reference/grafana-mcp
    kind: related
  - slug: grafana-cloud/reference/gcx
    kind: related
---

Skills, in Grafana's Assistant feature set, are a way to capture your team's operational know-how —
"how we actually troubleshoot this service" — as a standardized, shareable document an AI agent can
follow, instead of that knowledge living only in one senior engineer's head.

---

## What a Skill actually is

A concrete example: a "Service Troubleshooting" skill that lists the critical services and the
canonical diagnostic steps for each — the same content that would otherwise live in a runbook, but
written so an agent can execute it, not just a human read it.

```
Skill document
  ├── When to use this skill (trigger conditions)
  ├── Canonical steps (query X, check Y, escalate if Z)
  └── Optional: MCP actions to trigger in external systems
              (open a GitHub issue, page via Slack, create a Linear ticket)
```

Skills can be **private** (yours only) or shared with your team, and they can be configured to
trigger [[grafana-mcp]] tool calls directly — with explicit instructions in the skill content about
when and how the agent should use those tools, rather than leaving that judgment implicit.

## How this differs from [[grafana-mcp]]

MCP is the _transport_ — it's what lets an agent call `query_prometheus` or `create_alert_rule` at
all. Skills are the _procedure_ layer on top — they tell the agent which sequence of MCP calls
constitutes "how we troubleshoot a checkout latency spike" so every invocation follows the same
playbook instead of the agent reinventing an investigation path each time.

```
Skill: "Checkout latency triage"
   │
   ▼
1. Query p99 latency for checkout-service (via grafana-mcp)
2. If p99 > SLO threshold → pull traces for the slowest 1% (Tempo)
3. Check for a recent deploy correlated with the spike
4. If found → open a GitHub issue with the trace links (MCP action)
5. Else → escalate via Slack (MCP action)
```

## gcx: agentic-first Grafana Cloud CLI

Alongside Skills, Grafana shipped [[gcx]] — a CLI built specifically for agentic usage rather than
interactive human use. It comes with 22 bundled skills for Claude Code and other
`.agents`-compatible harnesses out of the box, covering:

- Querying PromQL, LogQL, and traces directly from a terminal/agent context
- Managing dashboards, SLOs, alerting, and Synthetic Monitoring without leaving the CLI

This effectively packages the "how a competent SRE uses Grafana" knowledge as install-and-go skills,
rather than requiring every team to author their own from scratch. See [[gcx]] for the full command
surface and how it compares to [[grafana-mcp]].

## Where it fits

| Layer              | Role                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------ |
| [[grafana-mcp]]    | Transport — exposes Grafana as callable tools                                        |
| **Grafana Skills** | Procedure — standardizes _which_ tools, _in what order_, for a given investigation   |
| [[gcx]]            | Distribution — ships a starter set of skills pre-bundled, plus its own CLI transport |

**Why it's on the backlog:** this is the mechanism to encode existing runbooks/playbooks (the kind
already tracked under `g-reliability/`) as agent-executable procedures, rather than leaving an SRE
agent to reason from first principles on every incident.
