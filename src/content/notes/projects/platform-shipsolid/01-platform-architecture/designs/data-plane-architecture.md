---
title: "Data Plane Architecture"
description: "How telemetry flows from source to storage — the data plane."
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-9"
---

## Data Plane Architecture

## Purpose

How telemetry flows from source to storage — the data plane.

## Flow

```text
source -> OTel SDK / auto-instrumentation -> Alloy (collect/process/batch)
       -> OTLP/remote_write -> Grafana Cloud (Mimir | Loki | Tempo)
```

## Components

| Stage           | Component     | Notes                                                |
| --------------- | ------------- | ---------------------------------------------------- |
| Instrumentation | OpenTelemetry | SDK + auto-instrumentation, vendor-neutral           |
| Collection      | Grafana Alloy | Per-cluster DaemonSet + gateway; `glc_` write tokens |
| Metrics         | Mimir         | Prometheus remote_write                              |
| Logs            | Loki          | Alloy → Loki push                                    |
| Traces          | Tempo         | OTLP → Tempo                                         |

## Write auth

Data-plane writes use **`glc_`-prefixed access-policy tokens**. The `glsa_` service-account tokens
are for API/management, not ingest — mixing them surfaces as 401s at the Mimir/Loki/Tempo write
endpoints.

## Processing & enrichment

> `[stub: dataplane-processing]` — fill this in. Greppable doc-debt marker.

## Related

- [[control-plane-architecture|Control Plane Architecture]]
- Collector Config Templates
- [[sampling-policy|Sampling Policy]]
