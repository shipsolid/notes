---
title: "Ingest Budget by Team"
description: "Ingest budget allocation per team and current consumption."
tags: ["ShipSolid", "FinOps"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-53"
---

## Ingest Budget by Team

## Purpose

Ingest budget allocation per team and current consumption.

| Team           | Metrics budget | Logs budget | Traces budget | Status |
| -------------- | -------------- | ----------- | ------------- | ------ |
| _example-team_ |                |             |               | within |

> `[stub: ingest-budget-rows]` — fill this in. Greppable doc-debt marker.

## Policy

Budgets are set per team; breaches trigger a review, not an instant block. Telemetry cost is a
first-class signal.

## Related

- [[cardinality-governance|Cardinality Governance]]
- [[monthly-cost-reports|Monthly Cost Reports]]
