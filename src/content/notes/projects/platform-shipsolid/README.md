---
title: "ShipSolid Observability Platform"
description: "Documentation hub for the **ShipSolid observability platform** — Grafana Cloud (Mimir / Loki /"
tags: ["ShipSolid"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-71"
noteType: moc
---

## ShipSolid Observability Platform

Documentation hub for the **ShipSolid observability platform** — Grafana Cloud (Mimir / Loki /
Tempo) as the data plane, OpenTelemetry as the instrumentation standard, Grafana Alloy as the
universal collector, all driven by Helm + Terraform.

This is the `scope: platform` project workspace. Curated, schema-governed artifacts (ADRs, RFCs,
TDDs, runbooks) still live in the repo's top-level curated surfaces; sections here either hold
platform-local working docs or **index** the canonical surfaces filtered to ShipSolid scope.

## Sections

| #   | Section                                                                          | What lives here                  |
| --- | -------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| 00  | [[start-here                                                                     | Start Here]]                     | Vision, charter, 30-minute onboard, glossary                      |
| 01  | [[platform-architecture                                                          | Platform Architecture]]          | C4 views, data/control plane, signal catalog, ADR/RFC/TDD indexes |
| 02  | [[service-onboarding                                                             | Service Onboarding]]             | Instrumentation guides, label schema, service catalog             |
| 03  | [[projects/platform-shipsolid/03-reliability-engineering/reliability-engineering | Reliability Engineering]]        | SRE charter, SLOs, error budgets, PRR                             |
| 04  | [[operations-incident-response                                                   | Operations & Incident Response]] | On-call, IR playbook, runbooks, post-mortems                      |
| 05  | [[platform-configuration                                                         | Platform Configuration]]         | Collector configs, alert/dashboard catalogs, sampling/retention   |
| 06  | [[build-release                                                                  | Build & Release]]                | Dev setup, CI/CD, release, rollback                               |
| 07  | [[projects/platform-shipsolid/07-cost-governance/cost-governance                 | Cost & Governance]]              | Ingest budgets, cardinality governance, vendor registry           |
| 08  | [[strategy-planning                                                              | Strategy & Planning]]            | Roadmap, OKRs, portfolio initiatives                              |
| 09  | [[archive                                                                        | Archive]]                        | Historical releases, deprecated designs, retired services         |
| 10  | [[templates                                                                      | Templates]]                      | ADR/RFC/runbook/post-mortem/Confluence authoring templates        |

## Applications

Per-app documentation for individual ShipSolid apps — bounded to one service/repo, not a
cross-cutting platform phase like the sections above.

| Application                        | What lives here |
| ---------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [signal-forge](https://shipsolid.github.io/signal-forge/) | Full docs for the signal-forge OTel microservices validation lab — architecture, services, API, deployment, observability, ops runbooks, ADRs |

## Conventions

- All filenames **kebab-case** (no spaces, `&`, or parentheses) per
  [[naming-conventions|_meta/naming-conventions.md]]. The human-readable name is preserved in each
  page's `title:` frontmatter and H1.
- `scope: platform` across this hub — it is all ShipSolid-origin content.
- ADR/RFC numbering follows the repo's **global sequence** with a `-shipsolid` suffix on
  ShipSolid-scoped slugs; those pages index the canonical top-level adrs/, rfcs/, and
  technical-designs/ surfaces.
- Most pages are **boilerplate stubs** — search doc-debt with
  `grep -rn '\[stub' 1-projects/shipsolid/`.
