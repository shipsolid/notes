---
title: "Vision & Mission"
description: "Why the ShipSolid observability platform exists and where it is going."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-6"
relations:
  - slug: projects/platform-shipsolid/00-start-here/team-charter-and-ownership
    kind: related
  - slug: projects/platform-shipsolid/00-start-here/engagement-model
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/platform-overview
    kind: related
  - slug: projects/platform-shipsolid/00-start-here/observability-architecture-qna
    kind: related
---

## Vision & Mission

## Purpose

Why the ShipSolid observability platform exists and where it is going.

## Mission

Give every ShipSolid engineering and operations team a single, opinionated, self-service path to
production-grade telemetry — so that detecting, diagnosing, and resolving problems is fast, cheap,
and consistent across the multi-tenant SaaS estate.

## Vision

> Reactive → Resilient → **Autonomous.**

A platform where reliability is engineered in, not bolted on; where onboarding a new service takes
minutes, not days; and where an agentic AI layer carries the first shift of incident response.

## Operating principles

- **OTel-native, vendor-neutral.** Instrument once, route anywhere.
- **IaC or it didn't happen.** No permanent resource exists outside Helm/Terraform.
- **Cost is a first-class signal.** Every label and series carries a
  [[tech/cardinality|cardinality]] and FinOps cost.
- **Self-service over ticket-service.** Teams onboard themselves against paved roads.

## Proof points

| Metric             | Before   | Now                    |
| ------------------ | -------- | ---------------------- |
| Service onboarding | 3 days   | 30 minutes             |
| Alert noise        | baseline | −80%+                  |
| Ticket noise       | baseline | ~−60%                  |
| Services onboarded | n/a      | ~40 across dev/qa/prod |

## Related

- [[team-charter-and-ownership|Team Charter & Ownership Model]]
- [[engagement-model|Engagement Model]]
- [[platform-overview|Platform Overview]]
