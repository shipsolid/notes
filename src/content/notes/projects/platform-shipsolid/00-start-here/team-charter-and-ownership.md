---
title: "Team Charter & Ownership Model"
description: "Who owns the platform, how decisions get made, and what teams can expect from us."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-5"
---

## Team Charter & Ownership Model

## Purpose

Who owns the platform, how decisions get made, and what teams can expect from us.

## Mission statement

> `[stub: charter-mission]` — fill this in. Greppable doc-debt marker.

## Team

| Person            | Role                    | Area                             |
| ----------------- | ----------------------- | -------------------------------- |
| Amit Singh        | Observability Architect | Platform direction, architecture |
| Platform SRE      | Engineer                | `[stub]`                         |
| Service Team Lead | Engineer                | `[stub]`                         |
| On-call Engineer  | Engineer                | `[stub]`                         |

## Ownership model

- **Platform team owns:** the data plane (Grafana Cloud stacks), the collector fleet (Alloy), shared
  dashboards/alert libraries, onboarding paved roads, and cost governance.
- **Service teams own:** their own instrumentation, SLOs, alert routing, and runbooks.
- **Shared responsibility:** label schema, retention/sampling policy, incident response.

## RACI

> `[stub: raci-matrix]` — fill this in. Greppable doc-debt marker.

## Decision-making

Architecture decisions are captured as ADRs under 01-platform-architecture/adrs/ (global numbering,
`scope: platform`, `-shipsolid` suffix).

## Related

- [[vision-and-mission|Vision & Mission]]
- [[engagement-model|Engagement Model]]
