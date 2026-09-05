---
title: "Projects"
description: "Applied documentation for real, running systems — SignalForge (an OTel validation lab) and the ShipSolid observability platform — as opposed to the cross-linked reference books in the rest of this wiki."
tags: ["projects", "reference", "index"]
hidden: false
zettelId: "202608021500-2"
noteType: moc
---

# Projects

> Every other top-level folder in this wiki is a reference book — concept notes cross-linked into a
> table of contents, with no single deployed system behind any one chapter. **Projects** is the
> opposite: each entry below documents one real (or lab-run) system end to end — architecture,
> services, deployment, operations — as it actually exists, not as a general pattern.

## [[projects/app-signal-forge/readme|SignalForge]]

The OTel Microservices Validation Lab — a multi-service reference application (.NET 8 gRPC/API
services, a Python FastAPI consumer, an Angular 17 SPA) built specifically to validate an
OpenTelemetry pipeline end to end. Covers architecture and service topology, the Grafana Alloy
collector pipeline, tail-based sampling, log-to-trace correlation, exemplars, SLO/burn-rate
alerting, and the Kubernetes/Helm/Kustomize infrastructure it runs on.

## [[projects/platform-shipsolid/readme|ShipSolid Observability Platform]]

Documentation hub for the ShipSolid observability platform itself — Grafana Cloud (Mimir/Loki/Tempo)
as the data plane, OpenTelemetry as the instrumentation standard, Grafana Alloy as the universal
collector, all driven by Helm + Terraform. Covers platform architecture, service onboarding,
reliability engineering (SLOs, error budgets, PRRs), incident response, platform configuration,
build/release, cost governance, and strategy/planning — the full operating lifecycle of the
platform, not just its initial build.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | projects   |
