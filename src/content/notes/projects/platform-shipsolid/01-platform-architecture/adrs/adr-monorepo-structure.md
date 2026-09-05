---
title: "ADR-001: Adopt Eight-Pillar Monorepo Structure"
description: "Accepted — pillar table amended (see [Amendments](#amendments) below)."
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022-3"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-aiops-pillar
    kind: related
---

## ADR-001: Adopt Eight-Pillar Monorepo Structure

## Status

Accepted — pillar table amended (see [Amendments](#amendments) below).

## Date

2024-01-15

## Context

We need an enterprise-grade learning lab that demonstrates real-world platform engineering practices
across multiple domains: application development, infrastructure provisioning, CI/CD automation,
observability, and governance. The repository must support multiple technology stacks (.NET, Spring
Cloud, Python, Terraform) while maintaining clear domain boundaries, team ownership, and
discoverability.

Key requirements:

- Multiple teams must be able to work independently on different domains.
- Changes to infrastructure should not require navigating through application code and vice versa.
- The structure must be intuitive for onboarding new engineers.
- CI/CD must support per-domain triggers to avoid unnecessary builds.
- Governance and standards must be co-located with the code they govern.

## Decision

We adopt an **eight-pillar monorepo structure** where each pillar represents a distinct operational
domain. Pillars are alphabetically prefixed with a single letter to enforce a consistent ordering:

| Pillar             | Domain                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `a-governance/`    | Governance machinery (schemas, scripts, generated outputs, change records, policy exceptions) |
| `d-apps/`          | Application code                                                                              |
| `c-platform/`      | Infrastructure as Code                                                                        |
| `e-gitops/`        | CI/CD and orchestration                                                                       |
| `f-observability/` | Monitoring and alerting                                                                       |
| `i-tooling/`       | Developer utilities                                                                           |
| `k-docs/`          | Documentation, ADRs, and engineering standards (rendered via MkDocs)                          |
| `l-labs/`          | R&D sandbox                                                                                   |
| `h-aiops/`         | AIOps & intelligent operations                                                                |

Within each pillar, sub-directories use a two-digit numeric prefix (e.g., `01-python-samples/`,
`02-dotnet-FakeStoreIngestor/`) for ordering and disambiguation.

Team ownership is enforced through GitHub CODEOWNERS, with each pillar or sub-path assigned to a
specific team.

## Consequences

### Positive

- **Clear domain boundaries.** Each pillar has a well-defined scope, reducing the cognitive load of
  navigating the repository.
- **Independent team ownership.** CODEOWNERS and path-based CI triggers allow teams to work
  autonomously within their pillar.
- **Discoverability.** Alphabetical prefixes create a natural reading order. New contributors can
  quickly understand the repository layout.
- **Monorepo benefits.** Atomic cross-pillar changes are possible when needed (e.g., an application
  change paired with its Terraform module and CI workflow).
- **Path-based CI.** GitHub Actions path filters ensure that changes to one pillar do not trigger
  unrelated workflows, keeping CI fast.

### Negative

- **Risk of pillar sprawl.** Without governance, teams may propose new pillars for every concern.
  Mitigation: new pillars require an ADR and platform-leads approval.
- **Governance overhead.** Maintaining CODEOWNERS, naming conventions, and standards across eight
  pillars requires ongoing effort. Mitigation: the `a-governance/` pillar centralizes governance.
- **Repository size.** Over time, the monorepo may grow large. Mitigation: use `.gitattributes` and
  sparse checkout for teams that only need specific pillars.
- **Cross-pillar dependencies.** Changes that span multiple pillars require coordination between
  teams. Mitigation: prefer separate PRs per pillar; use cross-pillar PRs only when atomicity is
  required.

## Alternatives Considered

### Multi-Repository Architecture

Each pillar would be its own GitHub repository (e.g., `archlab-services`, `archlab-platform`,
`archlab-observability`).

**Rejected because:**

- Cross-repo coordination overhead is significant for a learning lab where patterns must be
  demonstrated end-to-end.
- Atomic changes across repos require complex tooling (e.g., multi-repo PRs).
- Onboarding is harder when code is scattered across multiple repositories.
- Shared CI/CD patterns are difficult to maintain consistently.

### Flat Monorepo (No Pillar Structure)

All code in a single repository without domain-based top-level directories.

**Rejected because:**

- No domain boundaries leads to a sprawling, unorganized structure.
- CODEOWNERS assignments become difficult without clear path patterns.
- CI path filters are harder to define.
- New contributors have no mental model for navigating the repository.

### Domain-Driven Directories Without Alphabetical Prefixes

Use descriptive names without letter prefixes (e.g., `_meta/`, `services/`, `platform/`).

**Rejected because:**

- File explorers and directory listings would display pillars in unpredictable order.
- The alphabetical prefix provides a stable, predictable ordering that aligns with operational
  dependency (governance before services, services before platform, etc.).

## Amendments

- **2026-03-26 — ADR-005 added the `h-aiops/` pillar** as a ninth pillar dedicated to AIOps and
  intelligent operations. See [[adr-aiops-pillar|ADR-005]].
- **2026-04-29 — ADRs and engineering standards relocated.** ADR markdown files and the `standards/`
  collection moved from `a-governance/` into `k-docs/docs/` so they render through the MkDocs site
  alongside the rest of the documentation. The `a-governance/` pillar is now scoped to _governance
  machinery_ — JSON Schemas, the component registry script, generated outputs (CODEOWNERS, Backstage
  catalog, components index), change records, and policy exceptions. The original spirit of the
  decision (centralized governance, single source of truth, CODEOWNERS routing) is unchanged; only
  the content map was redrawn.
