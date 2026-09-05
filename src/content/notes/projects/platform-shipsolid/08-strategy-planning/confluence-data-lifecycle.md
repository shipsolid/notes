---
title: "Confluence Data Lifecycle & Governance — SRE / Observability / Platform"
description: "The initiative passes through four phases."
tags: ["ShipSolid", "Strategy"]
hidden: false
zettelId: "202606091939-4"
relations:
  - slug: projects/platform-shipsolid/08-strategy-planning/confluence-space-structure
    kind: related
  - slug: projects/platform-shipsolid/08-strategy-planning/confluence-content-templates
    kind: related
---

## Confluence Data Lifecycle & Governance — SRE / Observability / Platform

> **Lens:** Solution Architect  
> **Purpose:** Define what content gets created, by whom, and when — across the initiative's
> maturity phases.  
> A Confluence space is only as useful as its signal-to-noise ratio. Treat documentation debt the
> same way you treat technical debt: it compounds.

---

## 1. Maturity Model Overview

The initiative passes through four phases. Content obligations differ at each phase.  
Track current phase in each Space's home page.

| Phase  | Name            | Trigger                                         | Duration    |
| ------ | --------------- | ----------------------------------------------- | ----------- |
| **P0** | Foundation      | Initiative kickoff                              | Weeks 0–4   |
| **P1** | First Consumers | First 3 teams onboarded                         | Months 1–3  |
| **P2** | Steady State    | 10+ teams onboarded                             | Months 3–12 |
| **P3** | Self-Service    | Teams onboard without platform team involvement | Month 12+   |

---

## 2. Phase 0 — Foundation (Weeks 0–4)

**Goal:** Create the skeleton. No empty pages — each page must have at least a stub with owner and
status.

### Content that MUST exist before P1

| Space | Page                          | Minimum content                                |
| ----- | ----------------------------- | ---------------------------------------------- |
| `OBS` | Platform Overview (C4 L1)     | Architecture diagram + one-paragraph narrative |
| `OBS` | Quickstart                    | First working end-to-end steps                 |
| `OBS` | Naming & Label Schema         | Mandatory label list + cardinality policy      |
| `OBS` | Signal Catalog                | Table: signal type / backend / retention       |
| `SRE` | SRE Charter                   | Scope, engagement model, tier definitions      |
| `SRE` | Severity Definitions          | SEV1–SEV4 criteria with response SLAs          |
| `SRE` | Incident Response Playbook    | Phases: detect / triage / resolve / postmortem |
| `PLT` | Team Charter                  | Team scope, OKRs for Q1                        |
| `PLT` | Development Environment Setup | Enough for a new joiner to get running         |
| `PLT` | Release Process               | Versioning convention + deployment gates       |

### ADRs to write in P0

Decisions made during foundation must be captured as ADRs before first consumer onboards.  
Minimum set:

- ADR-001: Collector technology choice (e.g. OTel Collector vs Alloy vs Fluent Bit)
- ADR-002: Signal backend selection (e.g. Grafana Cloud Mimir/Loki/Tempo)
- ADR-003: Tenancy model (shared cluster vs namespace isolation vs per-team)
- ADR-004: Label schema and cardinality governance policy
- ADR-005: Instrumentation approach (OTel-native vs auto-instrumentation vs vendor SDK)
- `[FILL: add ADRs for major architectural choices specific to your org]`

### DRI assignments (fill before P1)

Every top-level Confluence section must have a named DRI. Document them here:

| Section          | DRI    | Backup |
| ---------------- | ------ | ------ |
| OBS Architecture | [FILL] | [FILL] |
| OBS Onboarding   | [FILL] | [FILL] |
| OBS FinOps       | [FILL] | [FILL] |
| SRE Practice     | [FILL] | [FILL] |
| SRE Runbooks     | [FILL] | [FILL] |
| PLT Design Docs  | [FILL] | [FILL] |
| PLT CI/CD        | [FILL] | [FILL] |

---

## 3. Phase 1 — First Consumers (Months 1–3)

**Goal:** Prove the docs work. If a team can't onboard using only what's in Confluence, fix the
docs.

### Content created in P1 (per onboarded team)

For each team onboarded, the following pages must be created and completed:

```
OBS / Onboarding / [Team Name]
├── Onboarding Tracker       ← instantiate from template
└── [Service Name] Signal Audit   ← fill after first 2 weeks of data

SRE / Services & SLOs / [Service Name]
├── SLO Document             ← draft during onboarding, finalize within 30 days
└── [Alert Name] Runbook     ← one per configured alert
```

### Retrospective trigger

After each of the first 3 team onboardings, run a doc retrospective:

- What page did they not find?
- What was confusing or wrong?
- What took >2 questions to answer?

Update docs before onboarding the next team. Do not let debt accumulate across three onboardings.

### What P1 surfaces (add to Confluence)

| Discovery                                  | Action                                          |
| ------------------------------------------ | ----------------------------------------------- |
| Repeated question about same topic         | Add FAQ section to relevant page                |
| Alert misfires during first incidents      | Update runbook with false-positive diagnostic   |
| Label schema violation in first ingestion  | Update label schema page + add to PRR checklist |
| Missing dependency in architecture diagram | Update C4 L1/L2                                 |

---

## 4. Phase 2 — Steady State (Months 3–12)

**Goal:** Docs are authoritative. Teams trust Confluence over Slack.

### Ongoing content operations

| Cadence   | Activity                                              | Owner                   |
| --------- | ----------------------------------------------------- | ----------------------- |
| Weekly    | Merge any runbook updates from on-call shift handoffs | On-call TL              |
| Monthly   | Review FinOps ingest table; update per-team budget    | FinOps DRI              |
| Monthly   | Review Onboarded Teams Registry for stale entries     | Platform TL             |
| Monthly   | Platform release notes entry                          | Platform TL             |
| Quarterly | SLO document review for all Tier 1 services           | SRE TL                  |
| Quarterly | ADR review — mark superseded ADRs                     | Observability Architect |
| Quarterly | PRR archive review — any services that skipped PRR?   | SRE TL                  |
| 6-monthly | Full space audit (see Section 6)                      | Space DRIs              |

### Content added in P2 (as initiative matures)

| Trigger                           | New page to create                                        |
| --------------------------------- | --------------------------------------------------------- |
| First SEV1 resolved               | Post-mortem + update Incident Themes page                 |
| Platform hits 10 teams            | Capacity / scale analysis doc (PLT space)                 |
| First cardinality incident        | Cardinality incident post-mortem + update governance page |
| First breaking change shipped     | Breaking Changes Register entry + migration guide         |
| First external vendor integration | Vendor Registry entry + integration spec                  |
| On-call rotation exceeds 5 people | On-call handbook update + rotation schedule formalized    |
| Error budget burned once          | Error budget policy review + ADR update if policy changes |

### Doc debt triage (monthly)

Run this search monthly in each space:

- Filter: pages with label `draft` older than 30 days → promote or delete
- Filter: pages with no `Last reviewed` in page properties → assign owner in 1 week
- Filter: `[FILL:` text in page body → open Jira ticket per occurrence, assign to section DRI

---

## 5. Phase 3 — Self-Service (Month 12+)

**Goal:** The platform docs are a product. Measure them like one.

### Self-service indicators

You've reached P3 when:

- Teams submit onboarding tracker PRs themselves (not guided by platform team)
- On-call engineers update runbooks without being asked
- New joiners can complete onboarding with <2 Slack questions

### Content added in P3

| New artifact                    | Trigger                                                | Space         |
| ------------------------------- | ------------------------------------------------------ | ------------- |
| Changelog automation            | Platform CI writes release notes via API               | `OBS`         |
| Grafana dashboard embed         | Embed live cardinality/cost dashboards in Confluence   | `OBS`         |
| Auto-generated SLO status table | CI job refreshes SLO page from Prometheus              | `SRE`         |
| Architecture diagram versioning | C4 diagrams tracked in Git, embedded in Confluence     | `OBS` / `PLT` |
| Contribution guide              | How app teams submit runbook / onboarding improvements | `OBS`         |

### Docs-as-code migrations to consider at P3

When Confluence friction outweighs its benefits, migrate:

| Artifact type         | Migrate to                   | Keep in Confluence  |
| --------------------- | ---------------------------- | ------------------- |
| Runbooks              | Git-backed (e.g. k-docs)     | Summary + link only |
| ADRs / RFCs           | Git-backed                   | Summary + link only |
| Architecture diagrams | Structurizr / Mermaid in Git | Embedded view       |
| SLO definitions       | YAML in Git (slo-generator)  | Link only           |

Confluence stays as the _discovery layer_ and _stakeholder-facing surface_. Git is the _source of
truth_.

---

## 6. Space Audit Protocol

Run a full audit every 6 months per space. Takes ~2 hours with a DRI doing it.

### Audit checklist

```
[ ] Every page has an owner (page properties macro)
[ ] Every page has a "Last reviewed" date
[ ] No pages with label "draft" older than 60 days
[ ] No orphaned pages (pages with no parent / not in the tree)
[ ] All runbook links in alert catalog are valid
[ ] All ADRs with status "proposed" have a decision deadline or are closed
[ ] Onboarded Teams Registry matches actual teams using the platform
[ ] FinOps ingest table was updated within the last 30 days
[ ] All post-mortems have action items with owners and due dates
[ ] Breaking Changes Register has entries for all breaking changes in last 6 months
```

### Audit output

After each audit, publish an **Audit Summary** page under `PLT / 00 — Team & Mission`:

```
Audit date: YYYY-MM-DD
Auditor: [name]
Pages reviewed: N
Issues found: N
Resolved in-audit: N
Jira tickets opened: [links]
```

---

## 7. Content Ownership Matrix

DRIs below are roles, not individuals. Fill names at project kickoff.

| Content area                      | Primary DRI                                    | Secondary DRI           | Consumer      |
| --------------------------------- | ---------------------------------------------- | ----------------------- | ------------- |
| Platform architecture docs        | Observability Architect                        | Platform TL             | All engineers |
| Onboarding guides                 | Platform TL                                    | Observability Architect | App teams     |
| Label schema + cardinality policy | Observability Architect                        | FinOps DRI              | App teams     |
| SLO documents                     | Service team TL                                | Staff SRE               | On-call       |
| Runbooks                          | Staff SRE                                      | Service team TL         | On-call       |
| Post-mortems                      | Incident commander                             | SRE TL                  | All engineers |
| ADRs / RFCs                       | Author (Observability Architect / Platform TL) | Reviewer                | All engineers |
| PRR archive                       | SRE TL                                         | Service team TL         | SRE team      |
| FinOps / ingest tables            | FinOps DRI                                     | Platform TL             | Leadership    |
| Platform release notes            | Platform TL                                    | Any platform eng        | App teams     |

---

## 8. Staleness Cadences

Align with git-backed docs where applicable. These are the Confluence-specific rules.

| Content type               | Review cadence           | Action if stale                                                                     |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| Runbooks                   | 90 days                  | Owner reviews and updates `Last reviewed`; if nothing changed, just update the date |
| SLO documents              | 90 days                  | SLI/SLO targets reviewed against actual performance                                 |
| Architecture diagrams (C4) | 180 days                 | Verify reflects current deployed state                                              |
| ADRs (accepted)            | 180 days                 | Mark superseded if replaced; no other change needed                                 |
| Onboarding guides          | 90 days                  | Validate against latest platform release                                            |
| Post-mortems               | Immutable                | Lock after 30 days; action items tracked in Jira, not the post-mortem               |
| FinOps tables              | 30 days                  | Refresh from billing data source                                                    |
| PRR archive                | Immutable after sign-off | Re-run PRR (new page) if service undergoes major redesign                           |

---

## 9. Content Anti-Patterns to Prevent

These degrade signal-to-noise ratio over time. Flag them in audits.

| Anti-pattern                                            | Why it's harmful                            | Prevention                                                                |
| ------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Meeting notes dumped as pages                           | Untitled, unowned, unsearchable             | Route meeting notes to Jira / Notion; link outcomes to Confluence         |
| "Living document" with no structure                     | No one knows what changed                   | Use versioned sections with dates; pin major changes in a changelog table |
| Architecture diagrams in slide decks                    | Stale by next quarter, impossible to search | All arch diagrams must be in the page body (draw.io / mermaid)            |
| Runbook with steps that say "contact [person]"          | Single point of failure; person leaves      | Replace with role name + escalation process                               |
| Duplicate pages across spaces                           | Conflicting information, unclear canonical  | One space owns the page; others link to it                                |
| "TODO" sections left unfilled >30 days                  | Readers can't trust what's there            | Treat `[FILL]` / `TODO` as doc debt with a Jira ticket                    |
| High-cardinality content (e.g. per-incident dashboards) | Space bloat, search pollution               | Archive resolved incidents quarterly under an `Archive/` folder           |

---

## Related

- [[confluence-space-structure|Confluence Space Structure]] — where lifecycle-governed pages live
- [[projects/platform-shipsolid/08-strategy-planning/confluence-content-templates|Confluence Content Templates]]
  — the templates these lifecycle rules apply to

---

_Lifecycle version: 1.0 — review at P1 completion and P2 entry._
