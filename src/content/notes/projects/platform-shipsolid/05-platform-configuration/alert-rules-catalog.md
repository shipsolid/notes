---
title: "Alert Rules Catalog"
description: "Catalog of alert rules managed by the platform (Terraform/config-driven)."
tags: ["ShipSolid", "Configuration"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-38"
---

## Alert Rules Catalog

## Purpose

Catalog of alert rules managed by the platform (Terraform/config-driven).

| Alert     | Signal      | Condition   | Severity | Runbook          |
| --------- | ----------- | ----------- | -------- | ---------------- | ----------------- |
| _example_ | error ratio | > 1% for 5m | SEV2     | [[alert-runbooks | alert-runbooks/]] |

> `[stub: alert-rules-rows]` — fill this in. Greppable doc-debt marker.

## Conventions

Every paging alert links to a runbook. Burn-rate alerts derive from the
[[error-budget-policy|Error Budget Policy]]. Validate Prometheus rules with `promtool check rules`.
