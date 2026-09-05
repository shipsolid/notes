---
title: "Collector Deployment Strategy"
description: "A key pillar of the observability framework is the standardized and automated deployment of"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-4"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/architectural-design
    kind: depends_on
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/data-source-strategy
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/telemetry-schema-design
    kind: related
---

## Collector Deployment Strategy

A key pillar of the
[[projects/platform-shipsolid/01-platform-architecture/designs/architectural-design|observability framework's architecture]]
is the standardized and automated deployment of telemetry collectors across heterogeneous
infrastructure — cloud-native, on-prem OT systems. This section outlines the collector types and
deployment methods used across the enterprise to ensure complete, consistent, and secure telemetry
ingestion.

To ensure consistency, scalability, and repeatability across environments, observability components
are managed through robust CI/CD pipelines. This eliminates manual intervention, reduces
configuration drift, and enables automated rollout of telemetry infrastructure and configurations.

## Deployment Strategy by Infrastructure Scope

| **Scope**                               | **Collector Type**                                         | **Deployment Method**                             |
| --------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| **Azure Virtual Machines**              | Grafana Alloy (Prometheus mode, Loki logs)                 | Terraform (infra) + GitHub Actions (agent config) |
| **Azure Kubernetes Service**            | Grafana Alloy as DaemonSet/sidecar (metrics/logs/traces)   | Helm Charts + GitHub Actions                      |
| **Azure Functions & Container Apps**    | OpenTelemetry SDK → OTel Collector → Grafana Alloy         | SDK instrumentation + GitHub Actions              |
| **Azure Data Services**                 | Azure Monitor integration (SQL MI, Cosmos DB) + OTel       | Native plugin configuration via Terraform         |
| **DevOps Tooling**                      | Azure Pipelines: Metrics via Azure Monitor                 |                                                   |
| **GitHub Actions: Prometheus Exporter** | Native integrations + GitHub Actions setup                 |                                                   |
| **On-Prem OT Infrastructure**           | Node Exporter, WMI Exporter, OTel Collector, Grafana Alloy | Ansible (agent deployment + secure transport)     |
| **OT Application Services**             | Windows Exporter, Grafana Alloy                            | Ansible + central config management               |

## Deployment Principles

- Environment Segregation: Collectors are deployed separately for dev, qa, and prod stacks, using
  environment-specific API keys and labels.
- Label Metadata Injection: All collectors are configured with metadata such as region, env, plant,
  and team to support cost attribution, RBAC, and dashboard filtering.
- Secure Data Transmission: OT and on-prem collectors route data through VPN or private link
  connections to Grafana Cloud.
- CI/CD Integration: All configuration is version-controlled and promoted through GitHub Actions or
  Terraform pipelines, ensuring reproducibility and auditability.

**Notes:**

> - Grafana Alloy acts as the common ingestion point for
>   [[projects/platform-shipsolid/01-platform-architecture/designs/telemetry-schema-design|logs, metrics, and traces]]
>   where supported.
> - Azure Monitor acts as a native integration layer for PaaS services like SQL MI and Cosmos DB —
>   see
>   [[projects/platform-shipsolid/01-platform-architecture/designs/data-source-strategy|Data Source Strategy]]
>   for the full telemetry-source breakdown.
> - DevOps tools export build/run pipeline telemetry either via direct integration (Azure Pipelines)
>   or third-party exporters (GitHub Actions).
> - Labels and API keys are scoped by environment and region for cost, access, and data control.

## Agent Rollout and Updates via CI/CD

**Scope**:

- Observability agents (e.g., Prometheus exporters, Grafana Agents, OpenTelemetry Collectors) are
  deployed and updated using automated pipelines.
- **Terraform Cloud** and **GitHub Actions** are used to:
  - Deploy agents to Azure VMs, AKS clusters, and on-prem environments
  - Ensure consistent configuration via templated modules or manifests
- Pipelines include **validation**, **approval gates**, and **rollback** mechanisms to support safe
  updates and controlled rollouts.

**Examples**:

- Use of Helm charts and FluxCD or ArgoCD for rolling out collectors to Kubernetes.
- GitHub Actions pipelines that deploy collector config via Terraform apply on PR merge.

## Observability Configurations as Code

**Scope**:

- All observability artifacts — dashboards, alert rules, recording rules, synthetic tests — are
  stored and maintained as code.
- Tools and standards include:
  - `grafana-dashboard-as-code` (JSON)
  - `alerting-rules.yaml` for Prometheus-style alerts
  - `synthetics-config.json` for synthetic checks
- Configurations are automatically linted, validated, and deployed via CI.

**Benefits**:

- Enables peer review through pull requests
- Facilitates reproducibility across staging, UAT, and production
- Version history and change tracking improve auditability and accountability

## Version-Controlled and Environment-Specific Dashboards & Alerts

**Scope**:

- Dashboards and alerting rules are tailored per environment (e.g., dev, staging, production) to
  reflect specific SLOs, data sources, and alert thresholds.
- Separate folders and tagging in Grafana distinguish between environments.
- CI/CD workflows deploy configurations conditionally based on the target environment:
  - e.g., `main` branch → prod; `develop` → staging

**Design Considerations**:

- Sensitive or high-noise alerts are suppressed or throttled in lower environments
- Golden dashboards in prod are locked down for editing; others allow experimentation

**Examples**:

- A Terraform module provisions environment-specific Grafana folders and assigns RBAC accordingly.
- GitHub Actions uses environment matrix to loop through and apply configurations to each target
  workspace.
