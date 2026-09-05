---
title: "Alert Runbooks"
description: "Runbooks invoked directly from paging alerts."
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-27"
---

## Alert Runbooks

## Purpose

Runbooks invoked directly from paging alerts. One file per alert: `{alert-name}.md`. Each paging
alert **must** link to a runbook here (PRR gate).

## Template

Copy
[[projects/platform-shipsolid/04-operations-incident-response/alert-runbooks/_template|_template.md]]
(mirrors the repo runbook-template.md).

## Runbooks

- [[api-gateway-5xx-high|api-gateway 5xx high]] — `ShipSolidApiGateway5xxHigh` (SEV2)

> `[stub: alert-runbook-list]` — fill this in. Greppable doc-debt marker.
