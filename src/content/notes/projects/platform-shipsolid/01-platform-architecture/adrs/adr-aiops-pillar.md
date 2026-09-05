---
title: "ADR-005: Adopt AIOps Pillar for Intelligent Operations"
description: "Accepted 2026-03-26 The Architect Learning Lab has mature observability (f-observability), tooling (i-tooling/srekit),"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022-2"
relations:
  - slug: prometheus/08-operating-prometheus/02-security/02-security
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-monorepo-structure
    kind: depends_on
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-adopt-grafana-cloud
    kind: depends_on
  - slug: building-agentic-systems/00-building-single-agent-systems/01-agent-architecture/01-agent-architecture
    kind: related
---

## ADR-005: Adopt AIOps Pillar for Intelligent Operations

## Status

Accepted

## Date

2026-03-26

## Context

The Architect Learning Lab has mature observability (f-observability), tooling (i-tooling/srekit),
and delivery automation (e-gitops) pillars. However, operational workflows — root cause analysis,
incident triage, infrastructure maintenance — remain manual and require significant toil from the
SRE and platform teams.

Key drivers:

- **Operational toil**: RCA, triage, and maintenance follow repeatable patterns that can be
  augmented with AI reasoning.
- **MCP ecosystem maturity**: The Model Context Protocol provides a standardized way to connect AI
  agents to operational systems (Grafana, ServiceNow, Kubernetes) without building custom
  integrations.
- **Cross-pillar orchestration**: An
  [[building-agentic-systems/00-building-single-agent-systems/01-agent-architecture/01-agent-architecture|SRE agent]]
  needs to pull signals from observability, act on infrastructure, and update ITSM systems — cutting
  across multiple existing pillars.
- **Knowledge decay**: Runbooks and postmortems exist but are rarely consulted during incidents. An
  agent can surface relevant knowledge automatically.

The question is whether AIOps capabilities belong in an existing pillar or warrant a new one.

## Decision

We create a **ninth pillar**, `h-aiops/`, dedicated to AIOps and intelligent operations.

### Scope

The pillar owns:

| Component             | Description                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **01-sre-agent**      | Core AI agent built on the Claude Agent SDK, connecting to external systems via MCP servers |
| **02-playbooks**      | Declarative YAML workflows for RCA, incident triage, infrastructure maintenance             |
| **03-knowledge-base** | Runbooks, architecture docs, and postmortems used as RAG context for the agent              |

### Architecture

```
┌─────────────────────────────────┐
│          SRE Agent              │
│  (Claude Agent SDK + MCP)       │
│                                 │
│  Playbook Engine → Agent Core   │
│                    ↕             │
│              MCP Transport      │
└────────┬───────┬───────┬────────┘
         │       │       │
    Grafana  ServiceNow  K8s/Infra
```

### Design Principles

1. **MCP-first**: All external system access through MCP servers. No direct API calls.
2. **Playbook-driven**: Complex workflows declared in YAML, not hardcoded.
3. **Human-in-the-loop**: Destructive actions require explicit approval by default.
4. **Observable**: Agent actions emit OpenTelemetry telemetry to the same
   [[projects/platform-shipsolid/01-platform-architecture/adrs/adr-adopt-grafana-cloud|Grafana Cloud stack]].
5. **Knowledge-grounded**: Agent uses curated knowledge base for context-aware reasoning.

### Why a Separate Pillar

- **Cross-cutting concern**: The agent orchestrates across observability, infrastructure,
  automation, and ITSM. Placing it in any single pillar creates awkward dependency inversions.
- **Distinct lifecycle**: Agent development (prompt engineering, playbook authoring, MCP
  integration) follows different cadences than infrastructure or application code.
- **Team ownership**: AIOps will likely be co-owned by SRE and platform teams, with a different
  review and release process than application services.
- **Conceptual clarity**: The
  [[projects/platform-shipsolid/01-platform-architecture/adrs/adr-monorepo-structure|eight-pillar model]]
  explicitly scopes each pillar to one operational domain. Intelligent operations is a new domain,
  not a feature of monitoring or tooling.

## Consequences

### Positive

- **Clear ownership**: AIOps capabilities have a dedicated home with explicit boundaries.
- **Composable**: MCP-first design means the agent can integrate new systems by adding a JSON
  config, not writing code.
- **Incremental adoption**: Teams can start with one playbook (e.g., RCA) and expand gradually.
- **Knowledge compounding**: Postmortems and runbooks become machine-readable context, increasing
  their value over time.
- **Teaching value**: Demonstrates enterprise AIOps patterns — agent architecture, MCP integration,
  playbook-driven operations.

### Negative

- **Pillar sprawl**: Nine pillars is more to maintain. Mitigation: the pillar starts lean with clear
  scope boundaries.
- **AI dependency**: Agent reasoning depends on Claude API availability. Mitigation: playbooks can
  be executed manually as standard runbooks when the API is unavailable.
- **Prompt brittleness**: Agent behavior depends on prompt quality. Mitigation: playbooks are
  version-controlled and tested; prompts are structured and template-driven.
- **Security surface**: MCP servers expose operational systems to the agent. Mitigation:
  human-in-the-loop approval for destructive actions; principle of least privilege for service
  accounts.

## Alternatives Considered

### Extend i-tooling/srekit with AI capabilities

Add an `ai` subcommand to the existing SRE toolkit.

**Rejected because:**

- srekit is a CLI utility library; an autonomous agent with MCP connections, playbooks, and a
  knowledge base is architecturally different.
- Would overload i-tooling's scope and blur its boundary.

### Place in f-observability

Treat AIOps as an extension of monitoring.

**Rejected because:**

- The agent acts on infrastructure and ITSM systems, not just observability data.
- Would create a dependency inversion where the observability pillar depends on infrastructure and
  automation pillars.

### Place in l-labs as an experiment

Keep it in the R&D sandbox until proven.

**Rejected because:**

- The intent is production use (in-house SRE agent), not experimentation.
- Labs don't have the structure (CI, testing, documentation) needed for a production agent.
