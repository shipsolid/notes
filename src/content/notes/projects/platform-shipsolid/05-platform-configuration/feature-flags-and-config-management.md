---
title: "Feature Flags & Config Management"
description: "How platform feature flags and configuration are managed and rolled out."
tags: ["ShipSolid", "Configuration"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-41"
---

## Feature Flags & Config Management

## Purpose

How platform feature flags and configuration are managed and rolled out.

## Principles

- Config is **IaC** (Terraform/Helm); flags are versioned, not clicked.
- Changes promote dev → qa → prod with gates.

> `[stub: feature-flags-inventory]` — fill this in. Greppable doc-debt marker.

## Related

- [[control-plane-architecture|Control Plane Architecture]]
- [[cicd-pipeline-guide|CI/CD Pipeline Guide]]
