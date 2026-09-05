---
title: "Platform Overview (C4 L1-L2)"
description: "The platform at a glance — C4 Level 1 (System Context) and Level 2 (Containers)."
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-11"
---

## Platform Overview (C4 L1-L2)

## Purpose

The platform at a glance — C4 Level 1 (System Context) and Level 2 (Containers).

## C4 L1 — System Context

```text
[ Service teams ] --OTLP--> [ ShipSolid Observability Platform ] --query--> [ Grafana UI ]
                                     |
        AKS / Synthetics -----------+------- Grafana Cloud (Mimir/Loki/Tempo)
                                     |
                              Grafana IRM (incident routing + on-call)
```

> `[stub: c4-l1-diagram]` — fill this in. Greppable doc-debt marker.

## C4 L2 — Containers

| Container       | Role                                | Tech          |
| --------------- | ----------------------------------- | ------------- |
| Collector fleet | Receive + process + route telemetry | Grafana Alloy |
| Metrics backend | Store/query metrics                 | Mimir         |
| Logs backend    | Store/query logs                    | Loki          |
| Traces backend  | Store/query traces                  | Tempo         |
| Visualization   | Dashboards, Explore, alerting       | Grafana Cloud |
| Incident layer  | Routing, on-call, correlation       | Grafana IRM   |

> `[stub: c4-l2-diagram]` — fill this in. Greppable doc-debt marker.

## Related

- [[data-plane-architecture|Data Plane Architecture]]
- [[control-plane-architecture|Control Plane Architecture]]
- [[dependency-map|Dependency Map]]
