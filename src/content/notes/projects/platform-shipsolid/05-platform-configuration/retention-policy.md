---
title: "Retention Policy"
description: "Retention windows per signal type and tier."
tags: ["ShipSolid", "Configuration"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-43"
---

## Retention Policy

## Purpose

Retention windows per signal type and tier.

| Signal  | Tier     | Retention        | Backend |
| ------- | -------- | ---------------- | ------- |
| Metrics | standard | _e.g. 13 months_ | Mimir   |
| Logs    | standard | _e.g. 30 days_   | Loki    |
| Traces  | standard | _e.g. 7 days_    | Tempo   |

> `[stub: retention-windows]` — fill this in. Greppable doc-debt marker.

## Related

- [[logs-instrumentation-guide|Logs Instrumentation Guide]]
- [[monthly-cost-reports|Monthly Cost Reports]]
