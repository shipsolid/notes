---
title: "Architecture Overview"
description: "The ShipSolid Platform Engineering Lab demonstrates enterprise-grade cloud-native patterns through a"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022-4"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/pillar-model
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/observability-overview
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/platform-overview-lab
    kind: related
  - slug: prometheus/08-operating-prometheus/02-security/02-security
    kind: related
---

## Architecture Overview

The ShipSolid Platform Engineering Lab demonstrates enterprise-grade cloud-native patterns through a
[[projects/platform-shipsolid/01-platform-architecture/pillar-model|nine-pillar monorepo structure]].
See also the
[[projects/platform-shipsolid/01-platform-architecture/platform-overview-lab|Platform Overview]] for
the C4-level view.

## Design Principles

1. **Domain-oriented decomposition** - Each pillar maps to a distinct operational concern
2. **Generated control planes** - ownership, catalog entries, and baseline CI are derived from
   service metadata
3. **Golden paths** - opinionated templates and contracts guide teams toward the platform standard
4. **Observability-first** - services are expected to emit metrics, logs, and traces with standard
   labels
5. **Infrastructure as Code** - platform and observability resources are intended to be Git-managed
6. **Explicit experimental boundaries** - unfinished control planes stay isolated until ownership,
   security, and rollout paths are defined

## Dependency Graph

```text
a-governance (standards)
  |
  v
d-services (apps) ---> c-platform (infra) ---> Azure Cloud
  |                        |
  v                        v
e-delivery (CI/CD)     f-observability (monitoring) ---> Grafana Cloud
  |                        |
  v                        v
i-tooling (SRE kit)    k-docs (documentation)
  |
  v
h-aiops (experimental, not on the production control plane)
```

## Key Patterns

### Platform Engineering

- **Service metadata** in `component.yaml` defines ownership, CI commands, deployment hints, and
  catalog registration
- **Generated governance artifacts** turn that metadata into CODEOWNERS and Backstage catalog
  entries
- **Copier templates** scaffold new services with metadata and observability assets built in
- **[[sre-toolkit|SRE toolkit]]** automates onboarding, SLO management, and cost analysis

### Observability-as-Code

- Grafana dashboards, alerts, and SLOs are managed via Terraform environment wrappers
- Schema validation and OPA policies enforce alert hygiene and promotion checks
- Service ownership and telemetry expectations are generated from `component.yaml` into
  `f-observability/generated/service-observability.json`
- Environment tfvars still provide the active Grafana routing and pack inputs; federated packs
  remain a draft pattern

### Infrastructure Modules

- Composable Terraform modules for Azure (networking, compute, ingress)
- Workload roots with `vars/<env>.tfvars`
- Policy-as-code for [[prometheus/08-operating-prometheus/02-security/02-security|security]]
  guardrails and compliance scans
