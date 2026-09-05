---
title: "Glossary"
description: "Shared vocabulary for the platform."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-2"
---

## Glossary

## Purpose

Shared vocabulary for the platform. Keep terms here so docs can link instead of redefining.

| Term              | Definition                                                                         |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Alloy**         | Grafana's OpenTelemetry-native collector/agent; the universal collection layer.    |
| **Mimir**         | Grafana Cloud's horizontally scalable Prometheus-compatible metrics backend.       |
| **Loki**          | Grafana Cloud's log aggregation backend.                                           |
| **Tempo**         | Grafana Cloud's distributed tracing backend.                                       |
| **OTLP**          | OpenTelemetry Protocol — the wire format for telemetry export.                     |
| **Cardinality**   | Count of unique label-value combinations (active series); the primary cost driver. |
| **Active series** | A unique metric + label set currently receiving samples.                           |
| **SLI / SLO**     | Service Level Indicator / Objective — measured reliability and its target.         |
| **Error budget**  | Allowed unreliability = 1 − SLO, over a window.                                    |
| **IRM**           | Grafana Incident & Response Management.                                            |
| **Tenant**        | An isolated customer namespace on the multi-tenant SaaS platform.                  |
| **`glc_` token**  | Grafana Cloud access-policy token used for Alloy data-plane writes.                |
| **`glsa_` token** | Grafana Cloud service-account token — **not** for data-plane writes.               |
| **PRR**           | Production Readiness Review.                                                       |

> `[stub: glossary-additions]` — fill this in. Greppable doc-debt marker.
