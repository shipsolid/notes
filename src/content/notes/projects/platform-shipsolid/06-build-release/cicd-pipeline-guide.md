---
title: "CI/CD Pipeline Guide"
description: "How platform changes flow through CI/CD."
tags: ["ShipSolid", "CI/CD"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-45"
---

## CI/CD Pipeline Guide

## Purpose

How platform changes flow through CI/CD.

## Pipeline

1. PR opened → lint + `terraform plan` (dev/qa/prod) + `conftest` policy gate.
2. Review + approve.
3. Merge to `main` → sequential promotion dev → qa → prod with GitHub Environment gates.

## Gates

- Terraform plan must be clean.
- `helm template` must render with in-scope values.
- Conftest/OPA policy must pass.

> `[stub: cicd-workflow-links]` — fill this in. Greppable doc-debt marker.

## Related

- [[release-process|Release Process]]
- [[control-plane-architecture|Control Plane Architecture]]
