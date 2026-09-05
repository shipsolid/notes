---
title: "What is gcx"
description: "Grafana's official CLI for managing Grafana Cloud/Enterprise/OSS resources, optimized for agentic usage — dashboards, alerts, SLOs, metrics/logs/traces/profiles queries, and every major Cloud product, plus a bundled Agent Skills set for Claude Code and other .agents-compatible harnesses."
tags: ["tech", "grafana", "observability", "cli", "ai-agents"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-17"
relations:
  - slug: grafana-cloud/reference/grafana-mcp
    kind: compared_to
  - slug: grafana-cloud/reference/grafana-skills
    kind: related
  - slug: ci-cd/reference/gitops
    kind: related
---

`gcx` (`grafana/gcx`) is Grafana's official command-line tool for Grafana Cloud, Enterprise, and OSS
(Grafana 12+). It's explicitly built "optimized for agentic usage" — the same access [[grafana-mcp]]
gives an agent over MCP, but as a CLI binary a coding agent can shell out to directly, with
human-usable output alongside it. Currently public preview, Apache 2.0, ~420 stars.

---

## What it actually covers

`gcx` isn't just dashboards-and-alerts — it's the single CLI surface for nearly every Grafana Cloud
product:

| Domain                                  | Command prefix                                          |
| --------------------------------------- | ------------------------------------------------------- |
| Dashboards / folders (resources)        | `gcx resources`                                         |
| Alert rules                             | `gcx alert`                                             |
| Metrics / logs / traces / profiles      | `gcx metrics`, `gcx logs`, `gcx traces`, `gcx profiles` |
| SLOs                                    | `gcx slo`                                               |
| Synthetic Monitoring                    | `gcx synthetic-monitoring`                              |
| IRM (on-call, incidents)                | `gcx irm`                                               |
| k6 Cloud (load testing)                 | `gcx k6`                                                |
| Fleet Management (collectors)           | `gcx fleet`                                             |
| Knowledge Graph                         | `gcx kg`                                                |
| Adaptive Metrics / Logs / Traces        | `gcx metrics adaptive`, etc.                            |
| Grafana Assistant                       | `gcx assistant`                                         |
| Raw API passthrough                     | `gcx api`                                               |
| Observability as Code (scaffold/import) | `gcx dev`                                               |

```
$ gcx metrics query 'sum by (handler)(rate(grafana_http_request_duration_seconds_count[5m]))' --since 1h
┌──────────────┬───────────────────────┬─────────┐
│ INSTANCE     │ TIMESTAMP             │ VALUE   │
├──────────────┼───────────────────────┼─────────┤
│ localhost... │ 2026-04-28T11:59:00.. │ 0.00730 │
└──────────────┴───────────────────────┴─────────┘

$ gcx alert rules list --state firing
$ gcx slo definitions list
```

## Compatibility matrix — not everything works everywhere

Feature availability is gated by deployment type, which matters if this ever gets pointed at
self-hosted vs. Cloud:

| Feature                                                | OSS (12+) | Enterprise (12+) | Cloud | BYOC |
| ------------------------------------------------------ | :-------: | :--------------: | :---: | :--: |
| Resource management, alert rules, raw API, Obs-as-Code |     ✓     |        ✓         |   ✓   |  ✓   |
| Signal queries (metrics/logs/traces/profiles)†         |     ✓     |        ✓         |   ✓   |  ✓   |
| SLO / Synthetic Monitoring / IRM / k6 / Fleet          |     ✗     |        ✗         |   ✓   |  ◐   |
| Adaptive Metrics / Logs / Traces                       |     ✗     |        ✗         |   ✓   |  ◐   |
| Grafana Assistant                                      |     ✗     |        ✗         |   ✓   |  ✗   |

† Self-hosted signal queries work against Prometheus/Loki/Tempo/Pyroscope directly, but endpoints
must be configured manually — Cloud auto-discovers them from the stack.

## Resource GitOps: the piece worth calling out

`gcx resources pull` / `gcx resources push` turn dashboards and folders into local files an agent
(or a human) can edit and diff, then push back — the same [[gitops]] pull/reconcile shape applied to
Grafana configuration instead of Kubernetes manifests:

```bash
gcx resources pull dashboards -p ./resources -o yaml
gcx resources validate -p ./resources
gcx resources push -p ./resources --dry-run   # preview
gcx resources push -p ./resources             # apply
```

This is a direct, practical answer to "how do dashboards get version-controlled and reviewed like
code" without hand-rolling a Terraform provider or a custom export script.

## Auth: two token types, and it matters which one

- **Grafana service account token** (`glsa_…`, Editor/Admin role) — required for all deployment
  types, authenticates against the Grafana HTTP API itself. Same token type [[grafana-mcp]] uses.
- **Cloud Access Policy token** (`glc_…`) — required _in addition_ for Cloud product commands
  (`slo`, `irm`, `synthetic-monitoring`, Adaptive \*, `assistant`). This is the same
  `glc_`-vs-`glsa_` distinction that trips up Alloy remote-write auth — `gcx` just makes both tokens
  explicit inputs to `gcx login` rather than one implicit config value.

## gcx vs. grafana-mcp — different transport, overlapping intent

| Axis            | `gcx`                                                                   | [[grafana-mcp]]                                             |
| --------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| Transport       | CLI binary, shell-invoked                                               | MCP server, protocol-invoked (stdio or remote HTTP)         |
| Best fit        | An agent that can execute shell commands (Claude Code, Codex, OpenCode) | An MCP-native client/agent without shell access             |
| Product surface | Broader — every Cloud product, plus Adaptive \*/Assistant               | Query + dashboards + alerting + Incident/Sift               |
| Ships with      | 22 bundled Agent Skills (Claude Code plugin + `.agents` bundle)         | No bundled skills — pair with [[grafana-skills]] separately |

They're not mutually exclusive — a Claude Code session could use `gcx` for CLI-driven investigation
and resource GitOps while still relying on `grafana-mcp` (or the hosted MCP endpoint) for a
protocol-level integration elsewhere in the same pipeline.

## Bundled Agent Skills

`gcx agent skills list` ships 22 skills covering setup, dashboard creation/GitOps, datasource
exploration, alert investigation, structured debugging, SLO management, Synthetic Monitoring,
Knowledge Graph diagnosis, project scaffolding, and end-to-end observability rollout. Install via
the Claude Code plugin (`/plugin marketplace add grafana/gcx`) or, for any other
`.agents`-compatible harness, `gcx agent skills install --all`. This is the same layering
[[grafana-skills]] describes — `gcx` is the distribution mechanism, not a separate skills concept.

**Why it matters here:** this is the most direct current path to giving the h-aiops SRE-agent line
(or Claude Code itself) shell-level, agent-first access to the same Grafana Cloud stack this repo's
observability pillar already runs — worth evaluating against `grafana-mcp` for any workflow where
shelling out is acceptable and the broader Cloud-product surface (SLO, IRM, Adaptive \*) is actually
needed.
