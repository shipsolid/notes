---
title: "Collector Config Templates"
description: "Reusable Alloy / OTel collector configuration templates by workload class."
tags: ["ShipSolid", "Configuration"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-39"
---

## Collector Config Templates

## Purpose

Reusable Alloy / OTel collector configuration templates by workload class.

## Templates

| Template        | Workload | Notes                   |
| --------------- | -------- | ----------------------- |
| _aks-daemonset_ | AKS pods | metrics + logs + traces |
| _gateway_       | central  | tail sampling, batching |

> `[stub: collector-config-templates]` — fill this in. Greppable doc-debt marker.

## Conventions

- `glc_` access-policy tokens for writes (never `glsa_`).
- Validate with `alloy fmt` before commit.
- Surface the cardinality implication in the same PR as the config.

## Related

- [[data-plane-architecture|Data Plane Architecture]]
- [[sampling-policy|Sampling Policy]]
