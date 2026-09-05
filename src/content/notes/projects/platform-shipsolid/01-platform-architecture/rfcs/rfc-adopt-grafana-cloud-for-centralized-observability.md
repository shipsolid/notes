---
title: "RFC-001: Adopt Grafana Cloud for Centralized Observability"
description: "- **RFC ID**: rfc-001-adopt-grafana-cloud-for-centralized-observability"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-6"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/architectural-design
    kind: depends_on
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/deployment-strategy
    kind: depends_on
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/data-source-strategy
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/security-access-compliance
    kind: depends_on
---

## RFC: Adopt Grafana Cloud for Centralized Observability

- **RFC ID**: rfc-001-adopt-grafana-cloud-for-centralized-observability
- **Authors**: [Amit Singh](mailto:amit.singh@shipsolid.com)
- **Status**: Proposed
- **Created**: 2025-05-13
- **Last Updated**: 2026-03-24
- **Target Release**: N/A
- **Supersedes**: N/A
- **Related Docs**: ADR-003: Adopt Grafana Cloud for Centralized Observability,
[[architectural-design|Observability Platform Design Overview]]
<!--
  [Terraform Grafana Cloud Modules],
  [On-Prem Agent Ansible Roles] -->

---

## Overview

As part of our organization-wide initiative to improve operational visibility, this RFC proposes
adopting **Grafana Cloud** as the centralized observability backend for all environments. The
decision is motivated by our growing need for consistent, scalable, and low-overhead monitoring
across **Azure cloud services, on-prem infrastructure**, and future hybrid workloads.

Grafana Cloud offers a managed observability stack built on open standards—Prometheus for metrics,
Loki for logs, and Tempo for traces—delivered as a SaaS solution with enterprise-ready features such
as
**[[observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy|multi-tenancy]],
RBAC, cost attribution, and SSO integration**. This platform would become the foundation for
proactive monitoring, unified dashboarding, traceability, and ultimately **AI/ML-powered incident
intelligence**.

This RFC proposes onboarding **Grafana Cloud** as the unified observability backend for metrics,
logs, and traces across Azure, On-Prem, and hybrid workloads. The solution aims to enable scalable,
modular, and cost-efficient observability with centralized governance and federated operational
control.

---

## Problem Statement

Our current observability landscape is fragmented and largely reactive:

- **Azure-native tooling (Monitor, Application Insights)** does not provide cohesive observability
  across multi-region services or support our evolving on-prem workloads.
- **On-prem OT systems (legacy VMs)** are either blind spots or manually monitored with ad-hoc
  scripts.
- **Tooling inconsistency** leads to alert fatigue, poor root cause analysis (RCA), and duplication
  of effort across teams.
- There is no central governance or reporting on observability usage, quality, or coverage.

With increasing reliance on real-time telemetry, a centralized solution is necessary to align
operations, DevOps, platform teams, and stakeholders on one source of truth.

### Strategic Drivers

- Need for **production-grade observability** for upcoming platform launches
- **Greenfield opportunity** to build standards-driven observability from the start
- Business push for **AIOps-readiness**, faster root cause analysis, and resilience
- **Cost and maintenance** concerns around self-hosted Prometheus and Grafana

---

## Goals & Non-Goals

**Goals:**

- Centralize observability across cloud and on-prem
- Enable correlation of metrics, logs, and traces using open standards
- Use managed infrastructure to reduce operational overhead
- Integrate with existing SSO, RBAC, CI/CD, and AIOps stack
- Support multi-tenancy, cost attribution, and federated access

**Non-Goals:**

- Replacing Azure-native tooling like Azure Monitor
- Observability for SAP RISE workloads (handled separately)
- Supporting legacy tooling not compatible with Prometheus/OpenTelemetry

---

## Scope

**Included:**

The Grafana Cloud platform will serve as the central observability backend for the following
components:

- **Azure Cloud**: Container Apps, Functions, AKS, Cosmos DB, SQL MI
- **On-Prem Infrastructure**: Windows/Linux VMs, OT workloads (FactoryTalk, COLOS)
- **Telemetry Sources**:
  - Metrics: Prometheus exporters via Grafana Alloy and OpenTelemetry Collector
  - Logs: Fluent Bit or Promtail → Grafana Alloy → Loki
  - Traces: OpenTelemetry SDKs or Collector → Tempo
- **Visualization**: Shared dashboards for SREs, factory operators, and business teams
- **Alerting**: Centralized routing to MS Teams, escalation workflows integrated with BigPanda
- **Automation**:
  - Terraform modules for Azure deployments
  - Ansible playbooks for agent rollout to on-prem nodes

**Excluded:**

- SAP RISE workloads
<!-- - Application-level error tracking (handled via Sentry/New Relic) -->

---

## Proposed Solution

### Design Considerations

Before proposing the solution, the following principles guided architectural decisions:

- **Cloud-native first**: Leverage managed services to minimize ops overhead.
- **Open standards**: Use Prometheus, OpenTelemetry, and vendor-neutral tooling.
- **Hybrid observability**: Support Azure cloud and on-prem OT workloads equally.
- **Self Serviced/Automated everything**: Use IaC and CI/CD for reproducible deployments.
- **Modularity**: Each component (metrics, logs, traces) should be independently deployable and
  replaceable.
- **Security by default**: Data obfuscation, RBAC, and SSO are non-negotiable.
- **Federated access with centralized governance**: Regional autonomy within a central Grafana Cloud
  instance.

### Architecture Overview

The proposed observability solution adopts a scalable and secure Grafana Cloud architecture with the
following key characteristics:

- **Central Observability Platform**
  - **Grafana Cloud** serves as the central hub for:
    - Receiving **metrics, logs, and traces** from cloud and on-prem systems.
    - Routing alerts to **AIOps**, **MS Teams**, and **ServiceNow** for incident response.
- **Telemetry Ingestion**
  - **On-Prem:**
    - Uses **Windows Exporter** and **OnPrem Agent** to collect and forward telemetry.
  - **Azure Cloud:**
    - Services like **AKS**, **Functions**, and **Cosmos DB** emit telemetry.
    - **Alloy Agents** and **OTEL Collectors** are used for data forwarding.
- **Deployment & Management**
  - All telemetry and agent deployments are automated and tracked under the **“Deployments
    Managed”** workflow.
    - Workflows manage agent rollout, configuration updates, and lifecycle actions.
  - Grafana Cloud is centrally managed but supports **environment and region-specific segregation**.
  - **Terraform Cloud** and **GitHub Actions**, managed from **ShipSolid GitHub**, provision
    observability infrastructure.
  - Ansible agents deploy agent on OT infrastructure.
- **Identity & Access Management**
  - Users and SREs authenticate via **Azure AD**, which integrates with Grafana Cloud to enforce
    **SSO and RBAC**.

For a detailed breakdown of design patterns, deployment strategy, and environment segregation, refer
to the [[architectural-design|Architectural Design]] document.

### Instrumentation & Pipelines

Automation ensures consistent, scalable, and auditable observability deployment across environments:

- **Agent Deployment**
  - Agents (Alloy, OTel Collector, exporters) deployed via Terraform + GitHub Actions.
  - Helm + FluxCD used for AKS rollouts; Ansible for on-prem.
  - Pipelines include validation, approval gates, and rollback support.
- **Config as Code**
  - Dashboards, alerts, and synthetics stored in version control.
  - Linted and auto-deployed via CI (e.g., JSON, YAML config files).
  - Enables peer review, traceability, and reproducibility.
- **Environment-Specific Logic**
  - CI/CD uses branch-based or matrix-based workflows to deploy to dev, staging, prod.
  - Tags and folders in Grafana separate environments and RBAC scopes.
  - Production dashboards locked down; lower envs allow experimentation.

Refer to [[deployment-strategy|Deployment Strategy]] for examples and tooling details.

### Data Source Integration

The observability platform ingests multiple telemetry types for complete visibility:

- **Metrics**: Infra and app performance via Prometheus/OpenTelemetry.
- **Logs**: Structured and platform logs centralized in Loki.
- **Traces**: Distributed tracing with OpenTelemetry and Tempo.
- **Profiling**: Code-level insights using runtime profilers (e.g., `dotnet-trace`, pprof).
- **Synthetics**: Uptime and flow checks via Azure and Grafana synthetic probes.

Full details in [[data-source-strategy|Data Source Strategy]].

### Dashboards & Alerts

Observability insights are delivered through intuitive dashboards and smart alerts, tailored to user
roles and aligned with service objectives:

- **Persona-Based Dashboards**
  - **SREs**: Infra health, uptime, golden signals
  - **Developers**: Logs, traces, deployment impact
  - **Product Teams**: Feature usage, SLIs
  - **Business Users**: KPIs, SLAs, availability by region
  - Consistent theming, templating (`env`, `service`, `region`), and RBAC folders.
- **Standardized Alerts**
  - Multi-condition rules (e.g., high latency + errors), SLO thresholds, anomaly detection.
  - Covers infrastructure, app-level, and business-level events.
  - Includes metadata: severity, runbook links, owner tags.
- **Routing & Escalation**
  - Alerts routed via **BigPanda**, **MS Teams**, and **ServiceNow** (or equivalent).
  - P1 → on-call + senior leads; P2/P3 → incident tools; P4/P5 → dashboards/chat.
  - Includes alert deduplication, suppression windows, and auto-escalation logic.

More examples and practices in [[visualization-alerts|Visualization & Alerts]].

### User Onboarding, Security & Compliance

Robust security and compliance measures protect sensitive observability data across all
environments:

- **Secrets Management**
  - API keys and tokens stored in **Azure Key Vault**.
  - GitHub Actions use **OIDC** for secure, short-lived access.
  - Governed by **Azure RBAC**; supports auto-rotation and access auditing.
- **Role-Based Access Control**
  - **Grafana RBAC**: Viewer, Editor, Admin roles scoped per team/environment.
  - Sensitive dashboards and API tokens are access-restricted.
  - Folder-based isolation for prod vs. non-prod and domain-specific teams.
- **Audit Logging & Retention**
  - Grafana access logs and Azure Monitor logs track all activity.
  - Retention policies enforced (e.g., 30–90 days for logs, regional storage compliance).
  - Alerts on anomalous access patterns.
- **Incident Response Integration**
  - Observability alerts drive incident workflows (e.g., SLI breaches, auth failures).
  - Integrated with **ServiceNow** and on-call tools.
  - Retrospectives use Grafana/Azure logs; supports GDPR & ISO 27001 requirements.

See [[security-access-compliance|Security, Access & Compliance]] for secure deployment patterns.

### Business Alignment & Cost Transparency

The solution directly supports key business goals by aligning observability with operational
outcomes and financial accountability:

- **Business Goal Alignment**
  - Improves **service uptime** through proactive alerting and SLO tracking.
  - Reduces **MTTR** by enabling full-stack visibility and faster root cause analysis.
  - Empowers **regional autonomy** with decentralized dashboards, RBAC, and localized alert routing.
- **Cost Visibility & Control**
  - Powered by **Grafana Cloud’s usage-based billing**, offering real-time insights into telemetry
    consumption.
  - Enables **budget-conscious observability** through:
    - Soft quotas on metrics/logs/traces per team or region.
    - Dashboards labeled by `env`, `plant`, `team`, and `service` for precise usage tracking.
    - Custom retention policies aligned with business criticality.
- **Chargeback/Showback Support**
  - Logical isolation via **Grafana folders, labels, and API keys** allows:
    - Internal **chargeback** for cost attribution across business units.
    - **Showback** reporting to inform non-technical stakeholders of telemetry cost impact.
    - Monthly usage summaries per environment/team for financial planning.

For full implementation details, refer to the
[[business-alignment|Business Alignment & Cost Transparency]] document.

### Platform Evolution & Readiness

The observability framework is designed for long-term sustainability, supporting growth,
modernization, and innovation across platforms and teams:

- **Scalable, Modular Onboarding**
  - Templated dashboards, alerts, and agents for easy service/team onboarding.
  - Shared SDKs and CI/CD automation reduce onboarding time and ensure telemetry consistency.
  - Labels and naming conventions enable auto-discovery and structured insights.
- **Cloud-Agnostic Architecture**
  - Built on open standards (OpenTelemetry, Prometheus, Grafana Cloud).
  - No hard dependency on Azure-specific tooling.
  - Easily extendable to AWS, GCP, or hybrid/on-prem environments.
- **Grafana Cloud Feature Compatibility**
  - Ready for upcoming capabilities: IRM, Adaptive Alerts, and Signal Correlations.
  - Uses structured labels and trace IDs to support future ML-driven features.
  - Native use of Mimir, Tempo, and Loki ensures seamless platform upgrades.
- **Strategic Benefits**
  - Future-proofed for cloud migrations and tech stack evolution.
  - Enables continuous innovation without major refactors.
  - Aligns with Grafana Cloud’s roadmap for long-term observability maturity.

For readiness criteria and status, refer to the [[future-readiness|Future Readiness]].

---

## Success Criteria

We propose to measure success using the following KPIs:

| Metric             | Target               |
| ------------------ | -------------------- |
| Trace coverage     | %+ of key services   |
| MTTR               | % reduction          |
| Dashboard adoption | %+ of teams          |
| Alert noise        | <10% false positives |
| Collector uptime   | >99.5%               |

Regular reviews with stakeholders will validate qualitative benefits such as ease of debugging, team
satisfaction, and cost transparency.

---

## Alternatives Considered

- **Self-hosted Prometheus + Grafana**
  - Rejected: High ops burden, HA complexity, poor scalability
- **Azure Monitor + Azure Dashboards**
  - Rejected: Proprietary, weaker support for OT + hybrid + traces
- **Grafana Enterprise**
  - Rejected: Higher licensing cost, self-managed backend needed

---

## Risks & Mitigations

| Risk                      | Mitigation Plan                                   |
| ------------------------- | ------------------------------------------------- |
| Vendor lock-in            | Periodic export snapshots + backup collectors     |
| Cost overruns             | Usage dashboards, team quotas, review checkpoints |
| Security/compliance gaps  | Early infosec involvement, logging guidelines     |
| Team friction in adoption | Enablement sessions, pilot success stories        |

---

## Rollout Plan

### Phases

1. **Phase 0**: PoC validation on Azure + 1 Factory site
2. **Phase 1**: Rollout to all Azure environments
3. **Phase 2**: OT environments & centralized views
4. **Phase 3**: Integrations with ITSM, SLOs, AIOps

Key automation and enablement efforts include:

- CI/CD integrations for telemetry config
- Self-service onboarding playbooks for teams — see
  [[projects/platform-shipsolid/02-service-onboarding/onboarding-grafana-agent|Onboarding a New Service to the Observability Platform]]
- Training sessions

### Rollback Plan

A rollback path includes disabling agent flows and falling back to existing local Prometheus setups
or Azure-native monitoring.

- If Grafana Cloud ingestion fails or cost overruns occur:
  - Pause collector pipelines
  - Revert to existing Grafana/Prometheus self-hosted fallback
  - Use Terraform state rollback and remove team folders

---

## Open Questions

- Finalize billing labels and quota limits per team?
- Confirm compliance approval for EU data residency?
- OT plant firewall changes needed for collector egress?

---

<!--
## Stakeholders & Reviewers

| Name                                                                 | Role                                   |
| -------------------------------------------------------------------- | -------------------------------------- |
| [Prashant Jain](mailto:prashant.jain@shipsolid.ca)                             | VP                                     |
| [Quintin Grant](mailto:QAGRANT@shipsolid.ca)                                   | Sr Manager Architecture and Deployment |
| [Jeff Demerchant](mailto:jeff.demerchant@shipsolid.com)                        | System Architect                       |
| [Rik Sorensen](mailto:Rik.SORENSEN@shipsolid.ca)                               | Information Security Architect         |
| [Maxim Priezjev](mailto:maxim.priezjev@shipsolid.ca)                           | Sr. Director DevOps                    |
| [Blair Henry](mailto:blair.henry@shipsolid.co.uk)                              | Director IT Ops                        |
| [Saurabh Jain](mailto:Saurabh.Jain@shipsolid.ca)                               | Sr. Engg Manager                       |
| [Chandramouleeswaran Ganesan](mailto:chandramouleeswaran.ganesan@shipsolid.ca) | Sr. Manager SRE                        |
| [Amit Singh](mailto:Amit.Singh@shipsolid.com)                                  | Observability Architect                |
| Name                        | Role                                         | Role in RFC Execution                                                                                                   |
| --------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Prashant Jain               | Vice President                               | Executive buy-in, strategic support, and funding approval                                                               |
| Quintin Grant               | Senior Manager, Architecture & Deployment    | Endorsement on architecture fit, help remove blockers for cross-functional work                                         |
| Jeff Demerchant             | System Architect                             | Validate proposed observability architecture and advise on integration patterns                                         |
| Rik Sorensen                | Information Security Architect               | Ensure compliance with security policies and guide secure telemetry pipeline design                                     |
| Maxim Priezjev              | Senior Director, DevOps                      | Align with DevOps tooling roadmap and platform engineering objectives                                                   |
| Blair Henry                 | Director, IT Operations                      | Support onboarding of IT Ops use cases and drive engagement from infra teams                                            |
| Saurabh Jain                | Senior Engineering Manager, Cloud & DevOps   | Ensure engineering alignment across cloud and DevOps team, facilitate resource planning, and support delivery timelines |
| Chandramouleeswaran Ganesan | Senior Manager, Site Reliability Engineering | Champion adoption within SRE team and facilitate rollout across environments                                            |
| Amit Singh                  | Observability Architect                      | Lead design, PoC, and implementation of centralized observability with Grafana Cloud                                    |

This RFC reflects a collaborative effort to build a scalable, future-ready observability platform
while simplifying maintenance and improving system reliability.
Grafana Cloud aligns with our current needs and provides flexibility as we grow into multi-cloud
and multi-region environments.

Pending stakeholder feedback and final compliance clearance. -->

<!-- , we plan to begin implementation in **July 2025**. -->

<!-- Please provide your feedback, to allow time for adjustments before onboarding
the first production workloads.

--- -->

## References

- [Grafana Cloud Docs](https://grafana.com/docs/grafana-cloud/)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/)
- ADR-003: Adopt Grafana Cloud
<!-- - Terraform Observability Modules
- [Runbook: Onboarding Grafana Agent](../../02-service-onboarding/onboarding-grafana-agent.md)
- Diagram: Observability Platform Overview -->
