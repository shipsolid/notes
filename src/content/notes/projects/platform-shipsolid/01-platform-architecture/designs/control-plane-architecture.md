---
title: "Control Plane Architecture"
description: "How the platform is configured, governed, and changed — the control plane."
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-8"
---

## Control Plane Architecture

## Purpose

How the platform is configured, governed, and changed — the control plane.

## Principle

Everything is **IaC**. Grafana Cloud stacks, alert rules, dashboards, and access policies are
managed via Terraform; collectors via Helm. No `kubectl apply` for permanent resources.

## Surfaces

| Surface                  | Managed by               | Source                      |
| ------------------------ | ------------------------ | --------------------------- | --------------------- |
| Grafana Cloud stacks     | Terraform                | `f-observability/` TF roots |
| Alloy collectors         | Helm                     | values per cluster/env      |
| Alert rules / SLOs       | Terraform / config       | [[alert-rules-catalog       | Alert Rules Catalog]] |
| Dashboards               | Terraform / provisioning | [[dashboard-catalog         | Dashboard Catalog]]   |
| Access policies / tokens | Terraform                | access-policy (`glc_`)      |

## Promotion

Dev → QA → Prod via PR plan + GitHub Environment gates.

> `[stub: controlplane-promotion-detail]` — fill this in. Greppable doc-debt marker.

## Related

- [[data-plane-architecture|Data Plane Architecture]]
- [[cicd-pipeline-guide|CI/CD Pipeline Guide]]
- [[feature-flags-and-config-management|Feature Flags & Config Management]]
