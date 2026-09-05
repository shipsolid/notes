---
title: "Rollback Procedures"
description: "How to roll back each component safely."
tags: ["ShipSolid", "CI/CD"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-51"
---

## Rollback Procedures

## Purpose

How to roll back each component safely. Every deploy must have a named rollback path.

| Component         | Rollback method                 | Verification |
| ----------------- | ------------------------------- | ------------ |
| Terraform-managed | revert + apply previous plan    | plan clean   |
| Helm-managed      | `helm rollback <release> <rev>` | pods healthy |

> `[stub: rollback-detail]` — fill this in. Greppable doc-debt marker.

## Related

- [[deployment-runbooks|Deployment Runbooks]]
- [[incident-response-playbook|Incident Response Playbook]]
