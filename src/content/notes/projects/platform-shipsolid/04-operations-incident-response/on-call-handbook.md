---
title: "On-Call Handbook"
description: "Everything an on-call engineer needs for a shift on the observability platform."
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-31"
---

## On-Call Handbook

## Purpose

Everything an on-call engineer needs for a shift on the observability platform.

## Before your shift

- [ ] Access to Grafana Cloud, IRM, BigPanda, SNOW confirmed.
- [ ] Paging device tested.
- [ ] Reviewed open incidents and recent changes.

## During an incident

Follow the [[incident-response-playbook|Incident Response Playbook]]. Default to **non-destructive
diagnosis first** (read metrics/logs/traces) before any restart/rollback/config change. If a
destructive action is needed, name the rollback path first.

## Escalation

> `[stub: oncall-escalation-path]` — fill this in. Greppable doc-debt marker.

## Handoff

> `[stub: oncall-handoff-template]` — fill this in. Greppable doc-debt marker.

## Related

- [[rotation-schedule|Rotation Schedule]]
- [[severity-definitions|Severity Definitions]]
- [[runbook-index|Runbook Index]]
