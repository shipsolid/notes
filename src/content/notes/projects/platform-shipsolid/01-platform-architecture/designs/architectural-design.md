---
title: "Architectural Design"
description: "This document outlines the architectural design of a scalable, modular observability framework"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-2"
relations:
  - slug: prometheus/03-instrumentation/02-exporters/02-exporters
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/data-source-strategy
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/deployment-strategy
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/telemetry-schema-design
    kind: related
---

## Architectural Design

This document outlines the architectural design of a scalable, modular observability framework
leveraging Grafana Cloud to monitor and analyze workloads across Microsoft Azure and on-prem
Operational Technology (OT) environments. The architecture supports:

- Multi-environment deployment (dev, QA, prod).
- Multi-tenant isolation (plants, regions, business units).
- Hybrid infrastructure (cloud + OT).
- Organization-wide visibility through a unified Grafana Cloud instance.

## Design Objectives

- Build a modular, extensible observability platform with support for metrics, logs, traces, and
  synthetic monitoring.
- Expand observability across all Azure resources and on-prem OT systems (FactoryTalk, COLOS,
  Infrastructure).
- Ensure data pipeline standardization using Prometheus, OpenTelemetry, Loki.
- Enable central visibility and regional ownership using a structured Grafana Cloud hierarchy
  (folders, teams, dashboards, labels).
- Empower teams with proactive alerts, SLO tracking, and AIOps-ready signals.
- Facilitate secure, automated deployment using Terraform (Azure) and Ansible (on-prem).

## Scope Expansion – Organizational View

To support observability at an enterprise scale, the framework extends beyond isolated workloads to
encompass a wide range of cloud-native and on-premises infrastructure components across all business
units, regions, and operational sites.

### Azure Cloud Coverage

The observability design includes core Azure services across compute, application, and data
platforms:

- Azure Virtual Machines (Linux/Windows)
- Azure Kubernetes Service (AKS)
- Azure Functions, Logic Apps, and Container Apps
- Data Services: Azure SQL Managed Instance, Cosmos DB
- DevOps Tooling: Azure Pipelines and GitHub Actions

### On-Premises & Operational Technology (OT)

The framework also extends into industrial and legacy infrastructure environments critical to
manufacturing and operations:

- Bare-metal servers and virtualized infrastructure in plants or data centers
- Industrial Windows/Linux hosts used in OT environments
- Mission-critical services like FactoryTalk, COLOS, etc.

> This broad scope ensures unified observability across IT and OT domains, enabling full-stack
> visibility, cross-environment correlation, and centralized governance.

## Architecture Patterns

This observability framework adopts a segregated Grafana Cloud architecture to unify telemetry data
(metrics, logs, traces, synthetics) across Azure and on-prem environments, while maintaining strong
environment boundaries. The design supports enterprise-wide observability with scalability,
governance, and regional autonomy through the following patterns:

### Environment-Specific Grafana Cloud Stacks

- Separate Grafana Cloud stacks are provisioned per environment (e.g., dev, qa, prod) to enforce:
  - Strict RBAC boundaries
  - API key isolation
  - Cost segmentation
- This enables independent lifecycle management (e.g., agent rollout, dashboard testing) per
  environment without impacting production observability.

### Folder & Label Segregation Within Each Stack

- Within each environment-specific stack:
  - Folders are structured by region, plant, business unit, or team.
  - Grafana labels are applied to dashboards, alerts, and telemetry to support:
    - Dynamic filtering and dashboard templating
    - Cost attribution by service/team/region
    - Tag-based alert routing and reporting

### Regional Collector Deployment with Central Routing

- Collectors (Grafana Alloy Agent, OpenTelemetry Collector,
  [[prometheus/03-instrumentation/02-exporters/02-exporters|exporters]]) are deployed per plant,
  data center, or Azure region — see
  [[projects/platform-shipsolid/01-platform-architecture/designs/deployment-strategy|Collector Deployment Strategy]]
  for the rollout mechanics.
- Data is streamed securely to the correct environment-specific Grafana Cloud stack using:
  - Scoped API keys
  - Region- and environment-specific configurations
  - Secure network tunnels or private endpoints for OT/Factory environments

### Standardized Data Pipeline Patterns

- All environments follow a consistent and modular telemetry ingestion architecture (see
  [[projects/platform-shipsolid/01-platform-architecture/designs/telemetry-schema-design|Telemetry Schema Design]]
  for the schema this ingestion path must satisfy), built on open standards and Grafana's unified
  agent, Grafana Alloy:
  - Metrics: Grafana Alloy (Prom mode) → Grafana Mimir (Collects Prometheus metrics from exporters
    and apps)
  - Logs: Grafana Alloy → Grafana Loki (Processes structured/unstructured logs from journald,
    syslog, etc.)
  - Traces: OpenTelemetry SDK → OTel Collector → Grafana Alloy (OTLP gateway) → Grafana Tempo
    (Handles distributed traces across services, using OTLP protocol)

### Grafana Cloud Stack Segregation – Environment View

| Layer                   | `dev` Stack                                | `qa` Stack                               | `prod` Stack                                  |
| ----------------------- | ------------------------------------------ | ---------------------------------------- | --------------------------------------------- |
| **Grafana Cloud Stack** | `shipsolid-dev`                            | `shipsolid-qa`                           | `shipsolid-prod`                              |
| **Stack Purpose**       | Testing observability agents, dashboards   | Staging dashboards, alert rules, SLOs    | Production-grade observability & alerting     |
| **Folder Structure**    | `/plant1/dev`, `/team-x/dev`, `/infra/dev` | `/plant1/qa`, `/team-x/qa`, `/infra/qa`  | `/plant1/prod`, `/team-x/prod`, `/infra/prod` |
| **Labels Applied**      | `env=dev`, `region=CAN`, `plant=COALDALE`  | `env=qa`, `region=CAN`, `plant=COALDALE` | `env=prod`, `region=CAN`, `plant=COALDALE`    |
| **RBAC Scope**          | Dev/test teams only                        | QA, release, staging users               | Read-only for business users; full for SRE    |
| **API Keys**            | Per-region dev keys                        | Separate QA agent keys                   | Restricted prod keys with rotation policies   |
| **Alert Routing**       | Suppressed or routed to test channels      | Routed to staging incident tools         | Integrated with AIOps & real incident mgmt    |
| **Billing Visibility**  | Low-cost development signals               | Medium-volume pre-prod usage             | Full-stack high-retention metrics/logs        |

<!- -->

> This architectural pattern ensures central governance with decentralized execution, enabling
> secure, scalable, and cost-transparent observability across hybrid infrastructure — without
> compromising isolation or automation maturity.

## Multi-Environment & Tenant Strategy

To support organizational scale, security, and operational clarity, the observability framework
enforces strong logical and access-based isolation across environments (Dev, QA, Prod) and business
domains (teams, plants, regions). This ensures that telemetry data, alerts, and visualizations are
structured, secure, and relevant to the right audience.

### Environment Isolation (Dev / QA / Prod)

- Each environment is logically separated within the same Grafana Cloud stack using dedicated:
  - Folders for dashboards and alerting rules
  - Scoped API keys for telemetry ingestion
  - Collector configurations tagged with env label (dev, qa, prod)
- This enables:
  - Safe testing and staging of dashboards and alert rules in lower environments
  - Controlled rollout of observability features to production
  - Automated promotion of changes through CI/CD pipelines

### Tenant & Persona Segmentation

- Grafana Teams are used to group users by role or domain, such as:
  - Dev Teams, SREs, OT Engineering, Plant Ops, Business Intelligence
- Each team is assigned to specific folders and dashboards using role-based access control (RBAC):
  - Viewer: Read-only access (e.g., business stakeholders)
  - Editor: Dashboard contributors (e.g., developers)
  - Admin: Full control (e.g., platform/SRE teams)

### Scoped API Keys for Agent Access

- API keys are provisioned per environment and region/plant to:
  - Prevent cross-tenant or cross-environment data leakage
  - Enable fine-grained usage tracking and billing visibility
  - Rotate secrets securely through CI/CD automation (e.g., GitHub Actions, Terraform)

### Centralized Identity and SSO

- Azure Active Directory (Azure AD) is integrated as the SSO provider for Grafana Cloud.
- Access is granted through role-based permission templates, ensuring:
  - Least-privilege access for all users
  - Auditability and compliance alignment
  - Fast onboarding/offboarding via AD group membership
