---
title: "Severity Definitions"
description: "Severity definitions so everyone agrees on what SEV-n means."
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-37"
---

## Severity Definitions

## Purpose

Severity definitions so everyone agrees on what SEV-n means.

| Severity | Definition                               | Example                              | Response                       |
| -------- | ---------------------------------------- | ------------------------------------ | ------------------------------ |
| SEV1     | Critical, broad customer/business impact | Total ingest loss; prod down         | Page IC immediately, all-hands |
| SEV2     | Significant impact, degraded             | Major dashboard/alerting outage      | Page on-call                   |
| SEV3     | Minor / contained                        | Single non-critical service degraded | Ticket, business hours         |
| SEV4     | Negligible / informational               | Cosmetic, no user impact             | Backlog                        |

> `[stub: severity-thresholds-detail]` — fill this in. Greppable doc-debt marker.

## Related

- [[incident-response-playbook|Incident Response Playbook]]
