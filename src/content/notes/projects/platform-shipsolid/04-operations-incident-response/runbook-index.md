---
title: "Runbook Index"
description: "Index of all operational runbooks."
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-36"
---

## Runbook Index

## Purpose

Index of all operational runbooks. Alert-triggered runbooks live in
[[alert-runbooks|alert-runbooks/]]; general procedures live in the repo's top-level runbooks/
surface.

| Runbook                | Trigger                | Location                                             |
| ---------------------- | ---------------------- | ---------------------------------------------------- | ---------------- | ----------------- |
| [[api-gateway-5xx-high | api-gateway 5xx high]] | `ShipSolidApiGateway5xxHigh` — 5xx ratio > 2% for 5m | [[alert-runbooks | alert-runbooks/]] |

> `[stub: runbook-index-rows]` — fill this in. Greppable doc-debt marker.

## Authoring

Use [[alert-runbooks-template|Alert Runbook Template]].
