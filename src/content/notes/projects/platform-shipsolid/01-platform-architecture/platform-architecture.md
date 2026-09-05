---
title: "01 — Platform Architecture"
description: "How the platform is built — views, planes, signals, and the decision record indexes."
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-12"
---

## 01 — Platform Architecture

How the platform is built — views, planes, signals, and the decision record indexes.

## Contents

- [[architecture-overview|Architecture Overview]]
- [[platform-overview|Platform Overview (C4 L1-L2)]]
- [[data-plane-architecture|Data Plane Architecture]]
- [[control-plane-architecture|Control Plane Architecture]]
- [[signal-catalog|Signal Catalog]]
- [[dependency-map|Dependency Map]]
- [[faro-impl-technical-doc|Faro / RUM Technical Design]]
- **RFCs**
  - [[rfc-adopt-grafana-cloud-for-centralized-observability|RFC-001: Adopt Grafana Cloud for Centralized Observability]]
  - [[rfc-2026-07-ide-vscode-vs-antigravity|RFC: Editor & Agentic IDE Selection — VS Code vs. Google Antigravity]]
- [[technical-design-documents|Technical Design Documents]]
- **Architecture Decision Records (ADRs)**
  - [[adr-monorepo-structure|ADR-001: Adopt Eight-Pillar Monorepo Structure]]
  - [[adr-adopt-grafana-cloud|ADR-002: Adopt Grafana Cloud for Unified Observability]]
  - [[adr-aiops-pillar|ADR-005: Adopt AIOps Pillar for Intelligent Operations]]
  - [[adr-pin-otel-semconv-126-shipsolid|ADR-006: Pin OpenTelemetry Semantic Conventions to v1.26]]
  - [[adr-two-tier-alloy-collector-topology-shipsolid|ADR-007: Adopt Two-Tier Grafana Alloy Collector Topology]]
  - [[adr-adopt-grafana-cloud-otel-alloy-shipsolid|ADR-008: Adopt Grafana Cloud + OpenTelemetry + Alloy as the ShipSolid Observability Standard]]

## Conventions

- kebab-case filenames; human-readable name in each page's `title:` / H1.
- `scope: platform` — ShipSolid platform content.
- Stubs are greppable: `[stub: <name>]`.
