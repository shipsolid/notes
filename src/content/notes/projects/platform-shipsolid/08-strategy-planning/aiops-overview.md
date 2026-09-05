---
title: "AIOps Overview"
description: "The **h-aiops** pillar is an experimental sandbox for the in-house SRE Agent and related AIOps"
tags: ["ShipSolid", "Strategy"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022-9"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-aiops-pillar
    kind: depends_on
  - slug: projects/platform-shipsolid/08-strategy-planning/maturity-model
    kind: related
  - slug: projects/platform-shipsolid/08-strategy-planning/future-readiness
    kind: related
---

## AIOps & Intelligent Operations

The **h-aiops** pillar is an experimental sandbox for the in-house SRE Agent and related AIOps
patterns. It is not part of the production control plane.

The current repo state supports interface design, playbook authoring, MCP configuration, and
knowledge-base curation. It does not yet provide a production-ready agent runtime.

## What is AIOps?

AIOps applies AI reasoning to operational workflows — root cause analysis, incident triage,
infrastructure maintenance — that traditionally require significant human effort and
context-switching across multiple tools.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    SRE Agent                         │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Playbook │  │   Agent   │  │  Knowledge Base  │  │
│  │  Engine  │──│   Core    │──│   (RAG Context)  │  │
│  └──────────┘  └─────┬─────┘  └──────────────────┘  │
│                      │                                │
│              ┌───────┴────────┐                       │
│              │  MCP Transport │                       │
│              └───────┬────────┘                       │
└──────────────────────┼──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
  ┌─────┴─────┐ ┌─────┴──────┐ ┌────┴──────┐
  │  Grafana  │ │ ServiceNow │ │   Infra   │
  │MCP Server │ │ MCP Server │ │MCP Server │
  └───────────┘ └────────────┘ └───────────┘
```

## Pillar Contents

| Directory            | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `01-sre-agent/`      | Core agent — Python, Claude Agent SDK, MCP client        |
| `02-playbooks/`      | Declarative YAML workflows for operational tasks         |
| `03-knowledge-base/` | Runbooks, architecture docs, postmortems for RAG context |
| `drafts/`            | Experimental work                                        |

## Design Principles

1. **MCP-first** — External systems accessed via MCP servers only
2. **Playbook-driven** — Workflows declared in YAML, not hardcoded
3. **Human-in-the-loop** — Destructive actions require approval
4. **Observable** — Agent emits OTel traces to Grafana Cloud
5. **Knowledge-grounded** — Curated docs improve agent reasoning

## Related ADR

- [[adr-aiops-pillar|ADR-005: Adopt AIOps Pillar]]
- Experimental Boundary

## Related

- [[projects/platform-shipsolid/08-strategy-planning/maturity-model|Platform & Cloud Maturity Model]]
  — AIOps is one of the twelve scored pillars this sandbox is building toward
- [[projects/platform-shipsolid/08-strategy-planning/future-readiness|Future-Readiness & Extensibility]]
  — the planned IRM / Adaptive Alerts / Correlations capabilities this pillar experiments toward
