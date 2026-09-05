---
title: "Incident Response Playbook"
description: "The step-by-step incident response flow for platform-impacting incidents."
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-29"
relations:
  - slug: projects/platform-shipsolid/04-operations-incident-response/post-mortems/post-mortems
    kind: depends_on
  - slug: projects/platform-shipsolid/04-operations-incident-response/severity-definitions
    kind: depends_on
  - slug: projects/platform-shipsolid/04-operations-incident-response/communication-templates
    kind: depends_on
  - slug: projects/platform-shipsolid/04-operations-incident-response/on-call-handbook
    kind: related
---

## Incident Response Playbook

## Purpose

The step-by-step incident response flow for platform-impacting incidents.

## Flow

1. **OBSERVE** — confirm scope: what's broken, who's impacted, when it started, what changed.
2. **DECIDE** — set severity ([[severity-definitions|Severity Definitions]]); declare in IRM.
3. **ACT** — stop the bleed with non-destructive steps first; name rollback paths before destructive
   ones.
4. **COMMUNICATE** — use
   [[projects/platform-shipsolid/04-operations-incident-response/communication-templates|Communication Templates]];
   update stakeholders.
5. **RESOLVE** — confirm recovery against SLIs.
6. **LEARN** — write a [[post-mortems|Post-Mortem]] (do not write it live).

## Roles

| Role               | Responsibility                   |
| ------------------ | -------------------------------- |
| Incident Commander | Owns the incident, makes calls   |
| Comms lead         | Stakeholder updates              |
| Ops/SME            | Hands-on diagnosis & remediation |

## Tooling

Grafana IRM (routing/on-call), BigPanda (correlation), SNOW (tickets), Grafana Explore
(metrics/logs/traces).

## Related

- [[on-call-handbook|On-Call Handbook]]
- [[post-mortems|Post-Mortems]]
