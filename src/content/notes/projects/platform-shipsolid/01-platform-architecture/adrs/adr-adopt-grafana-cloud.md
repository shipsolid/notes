---
title: "ADR-002: Adopt Grafana Cloud for Unified Observability"
description: "Accepted 2024-02-01 The Architect Learning Lab runs heterogeneous services across multiple technology stacks (."
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-pin-otel-semconv-126-shipsolid
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-two-tier-alloy-collector-topology-shipsolid
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-aiops-pillar
    kind: related
  - slug: observability/reference/cardinality
    kind: related
---

## ADR-002: Adopt Grafana Cloud for Unified Observability

## Status

Accepted

## Date

2024-02-01

## Context

The Architect Learning Lab runs heterogeneous services across multiple technology stacks (.NET 8,
Spring Cloud, Python/FastAPI) deployed on Azure infrastructure (AKS, VMs, PaaS). We need a unified
observability platform that provides:

- **Metrics** collection and querying across all services and infrastructure.
- **Logs** aggregation with structured querying and correlation.
- **Traces** for distributed request tracking across service boundaries.
- **Alerting** with team-scoped ownership and routing.
- **Dashboards** that can be versioned, reviewed, and managed as code.

Key constraints:

- The lab serves as a teaching tool, so the observability stack must demonstrate enterprise patterns
  (team-scoped ownership, monitoring-as-code, SLO-based alerting).
- Operational overhead should be minimized so teams can focus on learning platform engineering, not
  managing monitoring infrastructure.
- The solution must integrate with OpenTelemetry for vendor-neutral instrumentation.
- Configuration must be managed via Terraform and Git for reproducibility.

## Decision

We adopt **Grafana Cloud** as the unified observability platform with the following components:

| Signal     | Backend       | Protocol                      |
| ---------- | ------------- | ----------------------------- |
| Metrics    | Grafana Mimir | Prometheus remote write, OTLP |
| Logs       | Grafana Loki  | Loki API, OTLP                |
| Traces     | Grafana Tempo | OTLP                          |
| Collection | Grafana Alloy | OTLP, Prometheus scrape       |

### Configuration as Code

- **Dashboards, alerts, and recording rules** are stored in the `f-observability/` pillar.
- A **draft-to-promoted workflow** allows teams to iterate on configurations before they are applied
  to production.
- **Terraform** manages Grafana Cloud resources (data sources, folders, service accounts).
- **GitHub Actions** validates and applies observability configuration changes.

### Team-Scoped Ownership

The repo models team ownership in two ways:

- live environment inputs under `f-observability/drafts/grafana-cloud-v2/envs/<env>/*.tfvars`
- draft federated pack structures under `f-observability/drafts/grafana-cloud-v2/packs/federated/`

The current implementation is still environment-centric, with SRE/platform maintaining the shared
environment inputs. The federated pack model remains as a future self-service pattern.

### Instrumentation

- All services instrument with **OpenTelemetry SDK** for traces and metrics.
- **Grafana Alloy** runs as a collector/agent, receiving OTLP data and forwarding to Grafana Cloud
  backends — see
  [[projects/platform-shipsolid/01-platform-architecture/adrs/adr-two-tier-alloy-collector-topology-shipsolid|ADR-007]]
  for the collector topology this implies.
- Standard labels (`env`, `service`, `component`, `team`, `region`) are required on all telemetry.

## Consequences

### Positive

- **Unified platform.** A single pane of glass for metrics, logs, and traces eliminates context
  switching between tools.
- **Team ownership.** Teams manage their own dashboards and alerts, reducing bottlenecks on a
  central SRE team.
- **Monitoring as code.** All configuration is versioned in Git, reviewed via PR, and applied via
  CI. Changes are auditable and reproducible.
- **Reduced operational overhead.** Grafana Cloud is a managed service. No need to operate
  Prometheus, Loki, or Tempo clusters.
- **OpenTelemetry native.** Vendor-neutral instrumentation means services are not locked into
  Grafana-specific SDKs.
- **Teaching value.** Demonstrates enterprise observability patterns: SLOs, team-scoped alerting,
  correlated signals, and config-as-code.

### Negative

- **Vendor dependency.** Grafana Cloud is a commercial SaaS product. If pricing or features change,
  migration requires effort. Mitigation: OpenTelemetry instrumentation is vendor-neutral; only the
  backend would need replacement.
- **Cost at scale.** Grafana Cloud pricing is based on active metrics series, log volume, and trace
  spans. High-cardinality metrics or verbose logging can increase costs. Mitigation: enforce label
  [[tech/cardinality|cardinality]] standards and log level policies.
- **Learning curve.** Teams must learn PromQL (metrics), LogQL (logs), and TraceQL (traces).
  Mitigation: provide starter dashboards and query examples in the `f-observability/` pillar.
- **Internet dependency.** Telemetry data is sent to Grafana Cloud endpoints. Local development
  observability requires either a local Grafana stack or connectivity to the cloud. Mitigation:
  provide a Docker Compose local observability stack for offline development.

## Alternatives Considered

### Self-Hosted Prometheus + Grafana + Loki + Tempo

Run the full LGTM stack on our own AKS cluster.

**Rejected because:**

- Significant operational overhead to manage, scale, and upgrade four separate systems.
- Storage management (disk provisioning, retention policies, compaction) adds complexity.
- High availability and disaster recovery require additional engineering.
- Distracts from the lab's purpose of teaching platform engineering patterns.

### Datadog

Use Datadog as the all-in-one observability platform.

**Rejected because:**

- Per-host pricing model is expensive for a learning lab with variable workloads.
- Proprietary agent and query languages create vendor lock-in at the instrumentation layer.
- Less alignment with the open-source ecosystem (Prometheus, OpenTelemetry) that the lab aims to
  teach.
- Configuration-as-code support is less mature compared to Grafana's Terraform provider.

### Azure Monitor + Application Insights

Use Azure-native monitoring tools.

**Rejected because:**

- Tightly coupled to Azure, limiting portability of patterns to other cloud providers.
- KQL query language is less widely adopted than PromQL for infrastructure monitoring.
- Dashboard-as-code workflows are less mature.
- Distributed tracing correlation across heterogeneous services (.NET, Java, Python) is less
  seamless than OpenTelemetry-native backends.
