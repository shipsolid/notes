---
title: "Cardinality Governance"
description: "How the platform governs cardinality — the primary cost and stability risk."
tags: ["ShipSolid", "FinOps"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-52"
---

## Cardinality Governance

## Purpose

How the platform governs cardinality — the primary cost and stability risk.

## Rules

- Any new metric/label/trace attribute ships with a **cardinality estimate** in the PR.
- Default to **drop/hash before keep** when source cardinality is unbounded.
- High-churn values (IDs, raw timestamps) are an automatic stop → logs/traces/exemplars.

## Gate

Reach for the **Cardinality Budget Calculator** skill before adding labels to any production-bound
Alloy/Prometheus/OTel config.

## Top contributors (rolling)

> `[stub: cardinality-top-contributors]` — fill this in. Greppable doc-debt marker.

## Related

- [[naming-and-label-schema|Naming & Label Schema]]
- [[ingest-budget-by-team|Ingest Budget by Team]]
