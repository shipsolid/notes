---
title: "Signal Catalog"
description: "Canonical catalog of the signals the platform supports and the golden signals every service should"
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-13"
---

## Signal Catalog

## Purpose

Canonical catalog of the signals the platform supports and the golden signals every service should
emit.

## Golden signals (per service)

| Signal       | Type   | Example                                  |
| ------------ | ------ | ---------------------------------------- |
| Request rate | metric | `http_server_requests_total`             |
| Error rate   | metric | ratio of 5xx / total                     |
| Latency      | metric | request duration histogram (p50/p95/p99) |
| Saturation   | metric | CPU / memory / queue depth               |
| Logs         | log    | structured, correlated by `trace_id`     |
| Traces       | trace  | end-to-end spans, sampled per policy     |

## Signal inventory

> `[stub: signal-inventory-table]` — fill this in. Greppable doc-debt marker.

## Conventions

- All signals carry the standard resource attributes — see
  [[naming-and-label-schema|Naming & Label Schema]].
- New signal types go through a cardinality review — see
  [[cardinality-governance|Cardinality Governance]].

## Related

- [[metrics-instrumentation-guide|Metrics Instrumentation Guide]]
