---
title: "Confluence Space Structure — SRE / Observability / Platform Initiative"
description: "Use **three dedicated Confluence spaces**, not one."
tags: ["ShipSolid", "Strategy"]
hidden: false
zettelId: "202606091939-5"
relations:
  - slug: projects/platform-shipsolid/08-strategy-planning/confluence-content-templates
    kind: related
  - slug: projects/platform-shipsolid/08-strategy-planning/confluence-data-lifecycle
    kind: related
---

## Confluence Space Structure — SRE / Observability / Platform Initiative

> **Lens:** Solution Architect  
> **Scale:** MAANG-grade organization (multi-team, multi-cluster, multi-region)  
> **Principle:** Confluence is a _living operational contract_, not a document dump.  
> Fill sections marked `[FILL]` as the initiative matures. Never leave a page without an owner.

---

## 1. Space Taxonomy

Use **three dedicated Confluence spaces**, not one. Sharing a space across SRE, Observability, and
Platform conflates audiences and makes access control unmanageable.

| Space Key | Space Name             | Primary Audience                     | Owner Role              |
| --------- | ---------------------- | ------------------------------------ | ----------------------- |
| `OBS`     | Observability Platform | Platform consumers, App teams        | Observability Architect |
| `SRE`     | SRE Practice           | On-call engineers, Incident managers | Staff SRE / TL          |
| `PLT`     | Platform Engineering   | Internal platform team               | Platform TL             |

**Why three:**

- `OBS` is _outward-facing_ — it's what 200 teams read to onboard.
- `SRE` is _operational_ — it governs live incidents, SLOs, error budgets.
- `PLT` is _inward-facing_ — it governs how the platform itself is built.

Cross-linking is expected and encouraged. Avoid duplicating content across spaces — canonical lives
in one space, others link to it.

```
Unified Home
│
├── 00 — Start Here
│   ├── Vision & Mission
│   ├── Team Charter & Ownership Model
│   ├── Quickstart: Onboard in 30 Minutes
│   ├── Engagement Model
│   └── Glossary
│
├── 01 — Platform Architecture
│   ├── Platform Overview (C4 L1-L2)
│   ├── Data Plane Architecture
│   ├── Control Plane Architecture
│   ├── Signal Catalog
│   ├── Dependency Map
│   ├── RFCs
│   ├── Technical Design Documents
│   └── Architecture Decision Records (ADRs)
│
├── 02 — Service Onboarding
│   ├── Onboarding Checklist
│   ├── Metrics Instrumentation Guide
│   ├── Logs Instrumentation Guide
│   ├── Traces Instrumentation Guide
│   ├── Naming & Label Schema
│   ├── Service Catalog
│   └── Onboarded Teams Registry
│
├── 03 — Reliability Engineering
│   ├── SRE Charter
│   ├── SLO Registry
│   ├── Error Budget Policy
│   ├── Production Readiness Review (PRR)
│   └── Reliability Review Archive
│
├── 04 — Operations & Incident Response
│   ├── On-Call Handbook
│   ├── Rotation Schedule
│   ├── Incident Response Playbook
│   ├── Severity Definitions
│   ├── Communication Templates
│   ├── Runbook Index
│   ├── Alert Runbooks
│   ├── Post-Mortems
│   └── Incident Trends & Themes
│
├── 05 — Platform Configuration
│   ├── Collector Config Templates
│   ├── Alert Rules Catalog
│   ├── Dashboard Catalog
│   ├── Sampling Policy
│   ├── Retention Policy
│   └── Feature Flags & Config Management
│
├── 06 — Build & Release
│   ├── Development Environment Setup
│   ├── CI/CD Pipeline Guide
│   ├── Release Process
│   ├── Deployment Runbooks
│   ├── Rollback Procedures
│   └── Release Notes
│
├── 07 — Cost & Governance
│   ├── Ingest Budget by Team
│   ├── Cardinality Governance
│   ├── Toil Budget Policy
│   ├── Vendor Registry
│   ├── Integration Specifications
│   └── Monthly Cost Reports
│
├── 08 — Strategy & Planning
│   ├── Roadmap
│   ├── Quarterly OKRs
│   └── Portfolio Initiatives
│
└── 09 — Archive
    ├── Historical Releases
    ├── Deprecated Designs
    ├── Retired Services
    └── Breaking Changes Register
```

---

## 2. Space: Observability Platform (`OBS`)

```
OBS Home
├── 00 — Start Here
│   ├── What is this platform?             [FILL: 1-para vision + non-goals]
│   ├── Quickstart: Onboard in 30 minutes  [FILL: step-by-step, team-agnostic]
│   └── Glossary                           [FILL: canonical term definitions]
│
├── 01 — Architecture
│   ├── Platform Overview (C4 L1–L2)       [FILL: embed draw.io / mermaid diagram]
│   ├── Data Plane Architecture            [FILL: collector → pipeline → backend]
│   ├── Control Plane Architecture         [FILL: config management, tenancy model]
│   ├── Signal Catalog                     [FILL: metrics / logs / traces / profiles]
│   └── Decision Log (ADRs)
│       ├── ADR-001: [FILL]
│       └── ADR-NNN: [FILL]
│
├── 02 — Onboarding
│   ├── Onboarding Checklist (template)    [FILL: copy per team, track completion]
│   ├── Instrumentation Guide — Metrics    [FILL: SDK, endpoint, label schema]
│   ├── Instrumentation Guide — Logs       [FILL: structured log format, fields]
│   ├── Instrumentation Guide — Traces     [FILL: OTel SDK, sampling strategy]
│   ├── Naming & Label Schema              [FILL: mandatory labels, cardinality rules]
│   └── Onboarded Teams Registry           [FILL: table — team / service / date / owner]
│
├── 03 — Configuration Reference
│   ├── Collector Config Templates         [FILL: link to Git repo paths]
│   ├── Alerting Rules Catalog             [FILL: rule name / signal / threshold / owner]
│   ├── Dashboard Catalog                  [FILL: URL / team / last reviewed]
│   └── Sampling & Retention Policy        [FILL: per-signal, per-environment]
│
├── 04 — Cost & Capacity (FinOps)
│   ├── Ingest Budget by Team              [FILL: table, refresh monthly]
│   ├── Cardinality Governance Policy      [FILL: limits, escalation path]
│   └── Monthly Cost Report               [FILL: auto-link to dashboard]
│
└── 05 — Changelog
    ├── Platform Release Notes             [FILL: semver-style, one entry per release]
    └── Breaking Changes Register          [FILL: migration guides per breaking change]
```

---

## 3. Space: SRE Practice (`SRE`)

```
SRE Home
├── 00 — SRE Charter
│   ├── Mission & Scope                    [FILL: what SRE owns vs app teams]
│   ├── Engagement Model                   [FILL: how teams request SRE support]
│   └── Toil Budget Policy                 [FILL: toil % cap, escalation]
│
├── 01 — Services & SLOs
│   ├── Service Catalog                    [FILL: name / owner / tier / on-call rotation]
│   ├── SLO Registry
│   │   ├── [Service A] SLO Document       [FILL: per service — see template]
│   │   └── [Service N] SLO Document
│   └── Error Budget Policy                [FILL: burn-rate thresholds, freeze criteria]
│
├── 02 — On-Call
│   ├── On-Call Handbook                   [FILL: escalation paths, war-room setup]
│   ├── Rotation Schedule                  [FILL: link to PagerDuty / Grafana IRM]
│   └── On-Call Handoff Template           [FILL: use per shift]
│
├── 03 — Incident Management
│   ├── Incident Response Playbook         [FILL: phases — detect / triage / resolve / postmortem]
│   ├── Severity Definitions               [FILL: SEV1–SEV4 criteria + response SLAs]
│   ├── Communication Templates            [FILL: status page, stakeholder update]
│   └── Post-Mortems
│       ├── [YYYY-MM-DD] Incident Title    [FILL: per incident]
│       └── Themes & Patterns              [FILL: quarterly aggregate]
│
├── 04 — Runbooks
│   ├── Alert Runbook Index                [FILL: alert name → runbook link]
│   ├── [Alert: HighErrorRate]             [FILL: per alert]
│   └── [Alert: SLOBurnRateCritical]       [FILL: per alert]
│
└── 05 — Reliability Reviews
    ├── Production Readiness Review (PRR) Template  [FILL: checklist]
    └── PRR Archive
        └── [Service A] PRR — [YYYY-MM-DD] [FILL: per service per review cycle]
```

---

## 4. Space: Platform Engineering (`PLT`)

```
PLT Home
├── 00 — Team & Mission
│   ├── Team Charter                       [FILL: scope, non-scope, staffing]
│   ├── Roadmap (rolling 6 months)         [FILL: refresh monthly]
│   └── OKRs                               [FILL: per quarter]
│
├── 01 — Design Documents
│   ├── RFCs (proposals)
│   │   ├── RFC-001: [FILL]
│   │   └── RFC-NNN: [FILL]
│   ├── Technical Design Documents
│   │   ├── [Component A] TDD              [FILL]
│   │   └── [Component N] TDD
│   └── Architecture Decision Records
│       └── (mirror or link to OBS/ADRs where shared)
│
├── 02 — Build & Ship
│   ├── Development Environment Setup      [FILL: local cluster, secrets, toolchain]
│   ├── CI/CD Pipeline Guide               [FILL: stages, gates, promotion criteria]
│   ├── Release Process                    [FILL: versioning, changelog, rollout steps]
│   └── Feature Flags & Config Management  [FILL: flag lifecycle, deprecation SLA]
│
├── 03 — Operations
│   ├── Deployment Runbooks                [FILL: per component]
│   ├── Rollback Procedures                [FILL: per component]
│   └── Dependency Map                     [FILL: upstream/downstream, SLA commitments]
│
└── 04 — Vendor & Integration
    ├── Vendor Registry                    [FILL: name / contract expiry / DRI / docs URL]
    └── Integration Specs                  [FILL: API contracts with external systems]
```

---

## 5. Cross-Space Conventions

### Naming

- Page titles: `[Component / Area] — [Specific Topic]` (avoids duplicate titles across spaces)
- Date-stamped entries: `YYYY-MM-DD` prefix always — Confluence search is date-blind without it
- Template pages: prefix with `[TEMPLATE]` so they're greppable and excluded from navigation

### Labels (apply consistently)

| Label                             | Meaning                           |
| --------------------------------- | --------------------------------- |
| `draft`                           | Not yet ready for consumers       |
| `active`                          | Current, maintained               |
| `deprecated`                      | Superseded but kept for history   |
| `template`                        | Not content — structural scaffold |
| `adr` / `rfc` / `runbook` / `slo` | Doc type routing                  |

### Ownership model

Every page must have an **owner** set in the page properties macro:

```
Owner:      [name / team]
Last reviewed: [YYYY-MM-DD]
Review cadence: [90d / 180d / 365d / immutable]
Status:     [draft / active / deprecated]
```

Pages with no owner and no review date in >90 days are **doc debt** — flag in monthly space audit.

### Access Control

| Space | Default viewer      | Editor              | Admin                   |
| ----- | ------------------- | ------------------- | ----------------------- |
| `OBS` | All engineers       | Platform + SRE team | Observability Architect |
| `SRE` | All engineers       | SRE team            | Staff SRE               |
| `PLT` | Platform team + TLs | Platform team       | Platform TL             |

Lock incident post-mortems after 30 days — they are immutable records.

---

## 6. What NOT to put in Confluence

| Don't put here           | Put here instead                                         |
| ------------------------ | -------------------------------------------------------- |
| Live config / YAML       | Git repo (Confluence gets a link)                        |
| Credentials / tokens     | Vault / Secrets Manager                                  |
| One-time meeting notes   | Jira / Slack threads                                     |
| Draft code snippets      | GitHub Gist / repo PR                                    |
| Real-time dashboards     | Grafana (Confluence gets an embed link)                  |
| Incident timeline (live) | Incident war-room doc, then promoted to post-mortem page |

---

## Related

- [[projects/platform-shipsolid/08-strategy-planning/confluence-content-templates|Confluence Content Templates]]
  — page templates filed within this space structure
- [[confluence-data-lifecycle|Confluence Data Lifecycle & Governance]] — governance rules for pages
  living in these spaces

---

_Structure version: 1.0 — revisit at 6-month mark or after first major platform release._
