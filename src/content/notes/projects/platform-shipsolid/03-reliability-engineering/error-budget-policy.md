---
title: "Error Budget Policy"
description: "How error budgets are calculated, consumed, and enforced."
tags: ["ShipSolid", "SRE", "Reliability"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-21"
---

## Error Budget Policy

## Purpose

How error budgets are calculated, consumed, and enforced.

## Policy

- **Budget = 1 − SLO**, measured over the SLO window.
- When budget is **healthy**: ship freely.
- When budget is **exhausted**: feature freeze; reliability work takes priority until recovered.

## Burn-rate alerts

| Severity | Burn rate               | Meaning               |
| -------- | ----------------------- | --------------------- |
| Page     | fast (e.g., 14.4x / 1h) | Budget gone in hours  |
| Ticket   | slow (e.g., 1x / 6h)    | Sustained degradation |

> `[stub: error-budget-thresholds]` — fill this in. Greppable doc-debt marker.

## Related

- [[slo-registry|SLO Registry]]
- [[alert-rules-catalog|Alert Rules Catalog]]
