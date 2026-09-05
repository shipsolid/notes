---
title: "Dependency Map"
description: "Map of platform dependencies — what the platform relies on, and what relies on it."
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-7"
---

## Dependency Map

## Purpose

Map of platform dependencies — what the platform relies on, and what relies on it.

## Upstream (platform depends on)

| Dependency             | Used for                      | Failure impact          |
| ---------------------- | ----------------------------- | ----------------------- |
| Grafana Cloud          | Data plane (Mimir/Loki/Tempo) | Total ingest/query loss |
| Azure / AKS            | Compute for collectors        | Collection gaps         |
| `glc_` access policies | Write auth                    | 401s, dropped data      |

## Downstream (depends on platform)

| Consumer         | Depends on         | Failure impact            |
| ---------------- | ------------------ | ------------------------- |
| Service teams    | Dashboards, alerts | Blind to their own health |
| Grafana IRM      | Alert events       | No incident routing       |
| On-call rotation | Paging signals     | Missed escalations        |

## Diagram

> `[stub: dependency-map-diagram]` — fill this in. Greppable doc-debt marker.
