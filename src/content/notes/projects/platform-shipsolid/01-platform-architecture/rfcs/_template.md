---
title: "RFC Template"
description: "- **RFC ID**: rfc-YYYY-MM-<slug> - **Authors**: [Name(s), Role(s)]"
tags: ["ShipSolid", "Architecture"]
hidden: false
zettelId: "202603241245-5"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/rfcs/rfc-adopt-grafana-cloud-for-centralized-observability
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/rfcs/rfc-2026-07-ide-vscode-vs-antigravity
    kind: related
---

<!-- rfc-YYYY-MM-<short-title>.md -->

## RFC: Clear Descriptive Title

- **RFC ID**: rfc-YYYY-MM-<slug>
- **Authors**: [Name(s), Role(s)]
- **Status**: Draft | Proposed | Approved | Implemented | Rejected | Superseded
- **Created**: YYYY-MM-DD
- **Last Updated**: YYYY-MM-DD
- **Target Release**: [Version or Date]
- **Supersedes**: [Link to old RFC, if any]
- **Related Docs**: [ADR links, GitHub issues, diagrams, dashboards, PRDs]

---

## 1. Summary

_A concise, executive overview of the proposal. State what you’re proposing and why it matters._

> Example: This RFC proposes onboarding Grafana Cloud as the unified observability backend for
> metrics, logs, and traces across Azure, On-Prem, and containerized environments.

---

## 2. Background & Motivation

_Explain the current situation, gaps, incidents, pain points, or strategic drivers that led to this
proposal._

- What problems exist today?
- Why is change needed now?
- Which users or systems are impacted?

---

## 3. Goals & Non-Goals

### Goals

- What this RFC aims to accomplish

### Non-Goals

- What this RFC explicitly does not cover

---

## 4. Scope

_What environments, systems, teams, or services are included?_

- Cloud platforms (e.g., Azure Functions, AKS, Cosmos DB)
- On-Prem (e.g., FactoryTalk, VMs)
- SAP RISE (if relevant)
- Tools involved (e.g., Grafana Cloud, Prometheus, Tempo, Loki, FluentBit)

---

## 5. Proposed Solution

### 5.1 Overview

_High-level description of the proposed solution._

### 5.2 Architecture

- System diagrams (link or embed)
- Data flow (metrics/logs/traces)
- Collector design (agent vs sidecar vs daemonset)

### 5.3 Instrumentation & Pipelines

- Tools/SDKs to be used
- Manual vs auto-instrumentation
- Exporters and formats (e.g., OTLP, Prometheus Remote Write)

### 5.4 Dashboards & Alerts

- Which metrics/logs/traces will be visualized?
- Alerting strategy and integrations

---

## 6. Security & Compliance

- PII/PCI/GxP data handling
- Obfuscation, access control, retention
- Regulatory alignment (GDPR, HIPAA, etc.)

---

## 7. Testing & Validation Plan

- How the solution will be validated
- Rollout environments
- Metrics for success/failure

---

## 8. Rollout Plan

### 8.1 Phases

_Phased adoption by teams or environments._

### 8.2 Rollback Plan

_Backout or contingency plan if the rollout fails._

---

## 9. Success Criteria

_Measurable indicators of success:_

- Trace coverage (%)
- Dashboard usage stats
- MTTR reduction
- Alert noise reduction

---

## 10. Alternatives Considered

- Option 1: <summary + why it was rejected>
- Option 2: <summary + why it was rejected>
- Status quo: <why we’re not keeping things as-is>

---

## 11. Risks & Mitigations

- Risk 1: [description] → Mitigation: [strategy]
- Risk 2: ...

---

## 12. Open Questions

- What needs stakeholder alignment?
- What’s still uncertain?

---

## 13. Stakeholders & Reviewers

| Name       | Role                   | Responsibility          |
| ---------- | ---------------------- | ----------------------- |
| Jane Doe   | Platform Lead          | Review & Approval       |
| John Smith | Observability Champion | Technical Validation    |
| Team X     | Service Owner          | Implementation Feedback |

---

## 14. References

- Grafana Cloud Docs
- OpenTelemetry Spec
- Incident Postmortem #123
- Link to Architecture Diagram
- Example RFCs following this template:
  [[projects/platform-shipsolid/01-platform-architecture/rfcs/rfc-adopt-grafana-cloud-for-centralized-observability|RFC-001: Adopt Grafana Cloud]],
  [[projects/platform-shipsolid/01-platform-architecture/rfcs/rfc-2026-07-ide-vscode-vs-antigravity|RFC: Editor & Agentic IDE Selection]]
