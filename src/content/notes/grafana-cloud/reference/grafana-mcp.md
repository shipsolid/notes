---
title: "What is Grafana MCP"
description: "Grafana's official open-source MCP server (mcp-grafana) — gives AI agents tool access to query metrics/logs/traces, manage dashboards and alert rules, and work with Incident and Sift; also available as a hosted OAuth 2.1 remote server with 50+ tools."
tags: ["tech", "mcp", "grafana", "observability", "ai-agents"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-4"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/mcp-toolbox
    kind: compared_to
  - slug: grafana-cloud/reference/grafana-skills
    kind: related
  - slug: grafana-cloud/reference/gcx
    kind: related
---

Grafana MCP (`grafana/mcp-grafana`) is Grafana Labs' official Model Context Protocol server. It
gives any MCP-aware agent (Claude, an ADK agent, an IDE assistant) tool access to a live Grafana
instance — the same category of thing as [[mcp-toolbox]], but for observability data instead of
databases.

---

## What it exposes

| Capability      | Concretely                                                         |
| --------------- | ------------------------------------------------------------------ |
| Metrics & logs  | Query Prometheus/Mimir and Loki through Grafana's datasource layer |
| Dashboards      | Search, read, and manage dashboards                                |
| Alert rules     | Create, read, and manage alerting                                  |
| Incident & Sift | Work with Grafana Incident and Sift investigations directly        |
| Deeplinks       | Generate links back into Grafana for a human to open the same view |

```
Agent (Claude / ADK / IDE)
        │
        ▼
   mcp-grafana server  ──▶  Grafana instance
                                 ├── Mimir  (metrics)
                                 ├── Loki   (logs)
                                 ├── Tempo  (traces, via a dedicated tracing MCP server)
                                 ├── Alerting
                                 └── Incident / Sift
```

## Two deployment shapes

**Self-hosted (open source)** — run it yourself via `uvx mcp-grafana`, pointed at your instance:

```bash
GRAFANA_URL=https://your-stack.grafana.net \
GRAFANA_SERVICE_ACCOUNT_TOKEN=glsa_xxxxxxxx \
uvx mcp-grafana
```

**Hosted (public preview, 2026)** — Grafana now runs a remote MCP server at `mcp.grafana.com/mcp`,
authenticated with OAuth 2.1 over Streamable HTTP, exposing 50+ tools: everything in the open-source
server plus Grafana Assistant capabilities. No self-hosting required, at the cost of routing your
observability queries through Grafana's hosted endpoint rather than your own process.

## Token type: don't reach for the wrong one

The MCP server authenticates to the **Grafana HTTP API** with a service-account token (`glsa_…`) —
this is a different credential and a different code path from the `glc_`-prefixed access-policy
tokens used for Alloy's remote-write into Mimir/Loki/Tempo. Mixing those up is a known 401 trap on
the write path; for the MCP server specifically, `glsa_` is correct because you're calling the
Grafana API, not writing metrics/logs directly to the data plane.

## Cardinality/blast-radius note

Because `execute_sql`-style generic tools are risky in [[mcp-toolbox]], the equivalent consideration
here is **scope of the service account token**. A token with dashboard-edit and alert-rule-write
permissions handed to an agent means the agent can modify production alerting — scope the service
account to the minimum the agent actually needs (read-only for query/triage agents; write scope only
for agents explicitly meant to remediate).

**Why it's on the backlog:** it's the direct enabler for extending the h-aiops SRE-agent line beyond
read-only dashboards into agent-driven triage — pair with [[grafana-skills]] to standardize _how_
the agent uses these tools, not just that it can.
