---
title: "Security, Access & Compliance"
description: "Observability data often contains sensitive operational, business, or user-level insights."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-14"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/alerting
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/alerts-standards
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf-operations
    kind: related
---

## Security, Access & Compliance

Observability data often contains sensitive operational, business, or user-level insights.
Therefore, it is critical to implement robust security, fine-grained access controls, and maintain
compliance with organizational and regulatory standards.

## Secrets Management and Secure Access

**Scope**:

- All sensitive credentials, including API keys, database connection strings, and telemetry
  exporters’ tokens, are centrally managed using **Azure Key Vault**.
- For GitHub-based CI/CD workflows, secrets are securely injected using **GitHub Actions OIDC trust
  relationship** with Azure, eliminating the need for long-lived secrets.
- Access to secrets is governed by **Azure RBAC**, ensuring only required service principals,
  agents, or pipelines can access them.

**Best Practices**:

- Enable automatic rotation of secrets where supported (e.g., for storage keys, SAS tokens) — see
  [[projects/platform-shipsolid/05-platform-configuration/grafana-tf-operations|token rotation cadences]]
  for the Grafana Cloud token rotation runbook.
- Audit access logs from Key Vault for any unauthorized access attempts.

## Role-Based Access Control (RBAC)

**Scope**:

- **Grafana Cloud RBAC** is implemented to restrict access based on user roles:
  - **Viewer** – read-only access to shared dashboards
  - **Editor** – modify dashboards, no admin privileges
  - **Admin** – manage users, data sources, alert rules
- Separate folders and teams in Grafana ensure isolation between environments (e.g., dev vs prod) or
  business units (e.g., manufacturing vs IT ops).

**Design Considerations**:

- Dashboards exposing sensitive or business-critical metrics are access-controlled.
- API tokens with minimal scopes are used for automated dashboard creation or alerting integrations.

## Audit Logging & Data Retention Policies

**Scope**:

- **Audit Logs**:
  - Grafana access logs (via cloud audit logs or OSS plugins) are enabled for user activity
    tracking.
  - Azure Monitor Logs are retained to capture resource changes, access events, and data pipeline
    activity.
- **Compliance Alignment**:
  - Log and metric data is retained based on policy (e.g., 30 days for debug logs, 1 year for
    compliance logs).
  - Region-based data residency is ensured (e.g., EU logs stored in EU region).
  - Export policies are enforced to avoid sensitive data leaving allowed environments.

**Examples**:

- SOC2 or ISO 27001 requirements may mandate minimum 90-day log retention.
- Alerting on unusual access patterns (e.g., access outside business hours) from Grafana or Azure.

## Incident Response Procedures

**Scope**:

- Observability data is used as the **first line of detection** for security or operational
  anomalies.
- Alerts are configured to trigger incident workflows for scenarios such as:
  - Authentication failures or suspicious access patterns
  - Error rate anomalies or SLI breaches
  - Data pipeline integrity failures or missing telemetry
- Integration with incident management tool (**ServiceNow**) ensures swift escalation and
  accountability.

**Design Considerations**:

- All critical alerts are mapped to **on-call rotations** and include severity tags (P1–P5), per the
  [[projects/platform-shipsolid/05-platform-configuration/alerting|Alerting Contract]] and
  [[projects/platform-shipsolid/05-platform-configuration/alerts-standards|Alerts Standards]].
- Observability platform logs (e.g., Grafana, Azure Monitor) are included in incident
  retrospectives.
- Playbooks are defined for common failure scenarios (e.g., missing metrics, token expiration, DDoS
  patterns).

**Compliance Linkage**:

- Incident detection and response procedures support regulatory frameworks requiring:
  - Breach notification timelines (e.g., GDPR: 72 hours)
  - Documentation of incident history and RCA (Root Cause Analysis)
  - Secure log handling during forensics
