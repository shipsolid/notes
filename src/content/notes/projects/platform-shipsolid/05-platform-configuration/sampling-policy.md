---
title: "Sampling Policy"
description: "Trace (and log) sampling policy — what we keep, what we drop, and why."
tags: ["ShipSolid", "Configuration"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-44"
---

## Sampling Policy

## Purpose

Trace (and log) sampling policy — what we keep, what we drop, and why.

## Trace sampling

- **Default:** tail-based sampling at the collector.
- **Always keep:** errors, high-latency outliers, sampled baseline.
- Don't hard-code SDK head sampling without review.

## Rationale

Balances trace fidelity against Tempo ingest cost.

> `[stub: sampling-rates]` — fill this in. Greppable doc-debt marker.

## Related

- [[traces-instrumentation-guide|Traces Instrumentation Guide]]
- [[ingest-budget-by-team|Ingest Budget by Team]]
