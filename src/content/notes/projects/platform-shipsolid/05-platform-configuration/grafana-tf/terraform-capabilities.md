---
title: "Grafana Terraform Provider — Capability Audit"
description: "Audit of [grafana/grafana](https://registry."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202604280014-8"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/lbac
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/key-vault-secrets
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/products
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/system-design
    kind: related
---

## Grafana Terraform Provider — Capability Audit

Audit of [grafana/grafana](https://registry.terraform.io/providers/grafana/grafana/latest/docs)
provider capabilities against what is implemented in this repository.

---

## Fully Implemented

| Domain                            | What's done                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloud Stack & Access Policies** | Stack provisioning, Terraform admin SA, Alloy writer policies (per environment), Mimir/Loki LBAC reader tokens, Faro sourcemap upload policy                                                                                                                                                                      |
| **SSO / Authentication**          | Azure AD OAuth with JMESPath role mapping, PKCE enabled, `allowed_domains` / `allowed_groups` parameterised                                                                                                                                                                                                       |
| **Teams & RBAC**                  | SRE + product teams with Azure AD group mappings, 3 custom roles (admin/editor/viewer), explicit folder-level permissions per team                                                                                                                                                                                |
| **Data Sources**                  | Mimir (with exemplar linking), Loki (TraceID extraction via regex), Tempo (full cross-linking: logs↔traces↔metrics), Azure Monitor, explicit data source permissions, LBAC rules via `grafana_data_source_config_lbac_rules`                                                                                    |
| **Folders & Dashboards**          | Hierarchical folder structure (root → platform → leaf), product folders auto-derived from `products.yml`, JSON dashboard provisioning with per-product flavours                                                                                                                                                   |
| **Alerting**                      | Contact points (Teams / webhook / email) driven by `contact_points.yml` + `products.yml`, ShipSolid standard message template, notification policy with per-team OnCall routes (`continue=true`), mute timings, alert rule groups (hardcoded SRE infra rules + JSON-driven product rules with token substitution) |
| **OnCall / IRM**                  | Alertmanager integrations per product/team, escalation chains (5-step notify→wait→notify), weekly rotation schedules with per-member shifts, configurable timezone and wait times per team                                                                                                                        |
| **SLOs**                          | API Gateway availability (99.9%), latency p99 (< 500 ms), error rate (< 0.1%) — all with fastburn/slowburn alerts linked to Mimir                                                                                                                                                                                 |
| **Frontend Observability (Faro)** | Sourcemap upload access policy + token written to Key Vault; `app_id`, `collection_url`, `api_endpoint` stored in `products.yml` (app registration is manual — no provider resource exists to automate it)                                                                                                        |

---

## Partially Implemented

| Domain                   | What's done                                                                                  | What's missing                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Synthetic Monitoring** | Module written, product-level checks defined in `products.yml`, active in `shipsolid` (prod) | Commented out in `shipsoliddev` — requires a valid `sm_access_token` from the Grafana Cloud UI before it can be activated |

---

## Not Implemented

| Domain                           | Provider resources available                               | Notes                                                                                                  |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Recording Rules**              | `grafana_recording_rule`                                   | Not defined — would pre-compute expensive PromQL into new metrics, reducing dashboard/alert query load |
| **Annotations**                  | `grafana_annotation`                                       | Not used                                                                                               |
| **Incident Management**          | `grafana_incident_*`                                       | OnCall only; no incident declaration, timeline, or retrospective automation                            |
| **Fleet Management**             | `grafana_fleet_management_*`                               | Marked PLANNED in codebase but not implemented                                                         |
| **Machine Learning**             | `grafana_ml_job`, `grafana_ml_alert`                       | No anomaly detection or forecast-based alerting                                                        |
| **Library Panels**               | `grafana_library_panel`                                    | Dashboards use standalone JSON; no shared panel components                                             |
| **Playlist**                     | `grafana_playlist`                                         | Not used                                                                                               |
| **Report**                       | `grafana_report`                                           | No scheduled PDF / email dashboard reports                                                             |
| **Stack-level Service Accounts** | `grafana_service_account`, `grafana_service_account_token` | Only the cloud-level Terraform admin SA is managed; no stack-level SAs                                 |

---

## Known Constraints

- **LBAC on Terraform-managed data sources** — see
  [[projects/platform-shipsolid/05-platform-configuration/grafana-tf/lbac|LBAC architecture]]:
  `grafana_data_source_config_lbac_rules` only works on manually-created basic-auth data sources.
  Terraform-managed sources return 403 from the Grafana Cloud API when LBAC rules are applied.
- **SLO data source** — The SLO plugin uses the built-in Mimir data source only; custom data source
  UIDs are not supported.
- **Faro app registration** — No `grafana_frontend_observability_app` resource exists in the
  provider (as of v4.69). Apps must be registered manually in the Grafana Cloud UI.
