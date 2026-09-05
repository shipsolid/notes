---
title: "The Pillar Model"
description: "The monorepo is organized into nine alphabetically-prefixed pillars, each representing a distinct"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022-5"
relations:
  - slug: projects/platform-shipsolid/06-build-release/naming-conventions
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/architecture-overview
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/observability-overview
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/platform-overview-lab
    kind: related
---

## The Pillar Model

## Why Nine Pillars?

The monorepo is organized into nine alphabetically-prefixed pillars, each representing a distinct
operational domain:

| Code | Pillar        | Domain                                                                   | Owner          |
| ---- | ------------- | ------------------------------------------------------------------------ | -------------- |
| a    | governance    | Governance & standards                                                   | Platform leads |
| b    | services      | Application code                                                         | App teams      |
| c    | platform      | Infrastructure as Code                                                   | Platform team  |
| d    | delivery      | CI/CD & orchestration                                                    | Platform team  |
| e    | observability | Monitoring-as-code                                                       | SRE team       |
| f    | tooling       | Developer utilities                                                      | SRE team       |
| g    | docs          | Documentation                                                            | Platform leads |
| h    | labs          | R&D sandbox                                                              | All teams      |
| i    | aiops         | Experimental AIOps workflows, isolated from the production control plane | SRE + Platform |

## Coupling Rules

1. Pillars should not import code from other pillars
2. Cross-pillar dependencies are managed through contracts (see `a-governance/contracts/`)
3. Services (b) consume infrastructure (c) and observability (e) through configuration, not code
   imports
4. Delivery (d) orchestrates services (b) through metadata-driven workflows and GitOps manifests,
   not library calls

## Current Control Planes

- Service ownership and baseline CI are generated from `d-apps/*/component.yaml`
- Alert naming and labels are governed centrally in [[naming-conventions|naming-conventions.md]] and
  `a-governance/contracts/`
- Grafana Cloud v2 promotion is environment-scoped under `f-observability/06-grafana-cloud-v2/envs/`
- The observability (e) and platform (c) pillars are detailed further in
  [[projects/platform-shipsolid/01-platform-architecture/observability-overview|Observability Overview]]
  and
  [[projects/platform-shipsolid/01-platform-architecture/platform-overview-lab|Platform Overview]]

## Evolution Path

This monorepo is designed to be decomposable. Each pillar can become its own repository when team
scale demands it. See [[adr-monorepo-structure|ADR-001]] for the rationale behind the current pillar
model, and
[[projects/platform-shipsolid/01-platform-architecture/architecture-overview|Architecture Overview]]
for the concrete component map across pillars.
