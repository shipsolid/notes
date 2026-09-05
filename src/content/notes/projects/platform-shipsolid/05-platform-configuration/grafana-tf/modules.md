---
title: "grafana_tf — Module Reference"
description: "All shared logic lives in `modules/`."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202604280014-5"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf-operations
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/platform-configuration
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/system-design
    kind: related
---

## Module Reference

All shared logic lives in `modules/`. The two root modules (`environments/shipsoliddev/` and
`environments/shipsolid/`) are structurally identical — they differ only in their `terraform.tfvars`
credentials and backend state keys. See
[[projects/platform-shipsolid/05-platform-configuration/grafana-tf/system-design|the technical design]]
for how these modules compose into the overall platform.

---

## Module Dependency Order

```text
stack
  └─ sso, plugins
       └─ datasources
            └─ dashboards
                 └─ rbac
                 └─ alerting
                      └─ irm-oncall
                 └─ slo
                 └─ product-alerts
  └─ synthetic-monitoring
```

---

## `stack`

**Path:** `modules/stack/`

Provisions the Grafana Cloud stack, a Terraform service account (`sa-terraform`), and Cloud Access
Policies:

- `ap-terraform-admin` — full read/write admin, used by this Terraform codebase
- `ap-alloy-writer-<env>` — write-only, one per `stack_environment`, server-side LBAC enforced

**Key outputs:** `prometheus_url`, `loki_url`, `tempo_url`, `stack_id`, `sa_terraform_token`,
`alloy_writer_tokens`

---

## `sso`

**Path:** `modules/sso/`

Configures Azure AD OAuth SSO via `grafana_sso_settings`. Maps Azure AD group memberships to Grafana
roles using JMESPath expressions on the `groups` claim.

**Inputs required:** `azure_ad_tenant_id`, `client_id`, `client_secret`, `admin_group_id`,
`editor_group_id`, `viewer_group_id`

---

## `rbac`

**Path:** `modules/rbac/`

Creates Grafana teams, custom roles (admin/editor/viewer), maps Azure AD groups to teams via
`grafana_team_external_group`, and applies folder-level permissions. Org Admins are always included
to prevent lockout.

**Inputs required:** `sre_azure_ad_group_id`, `additional_teams`, `folder_uids` (from
`module.dashboards`)

---

## `datasources`

**Path:** `modules/datasources/`

Provisions four data sources with full cross-linking:

| Data Source   | Type                         | Cross-links                                                        |
| ------------- | ---------------------------- | ------------------------------------------------------------------ |
| Mimir         | Prometheus-compatible (POST) | Exemplar → Tempo                                                   |
| Loki          | Loki                         | Derived field: trace ID → Tempo                                    |
| Tempo         | Tempo                        | Trace-to-logs → Loki, trace-to-metrics → Mimir, node graph enabled |
| Azure Monitor | Azure Monitor                | Azure AD service principal auth                                    |

**Inputs required:** `mimir_url`, `loki_url`, `tempo_url`, `azure_ad_tenant_id`,
`azure_ad_client_id`, `azure_ad_client_secret`

**Key outputs:** `mimir_uid`, `loki_uid`, `tempo_uid`, `azure_monitor_uid`

---

## `plugins`

**Path:** `modules/plugins/`

Installs Grafana Cloud plugins via `grafana_cloud_plugin_installation`. Each plugin version is
specified as a map entry — pin to a specific version for reproducibility.

**Currently installed plugins:**

| Plugin                             | Current setting |
| ---------------------------------- | --------------- |
| `grafana-azure-monitor-datasource` | `latest`        |
| `grafana-oncall-app`               | `latest`        |
| `grafana-slo-app`                  | `latest`        |
| `grafana-synthetic-monitoring-app` | `latest`        |
| `grafana-k8s-app`                  | `latest`        |

> See [[grafana-tf-operations#Plugin Upgrade Cadence|Operations — Plugin Upgrade Cadence]] for the
> decision on pinning.

---

## `dashboards`

**Path:** `modules/dashboards/`

Creates the folder hierarchy (root → mid → leaf, ordered to avoid parallel API failures), provisions
dashboards from JSON files, and defines shared library panels.

**Folder structure managed by this module:**

```text
SRE (sre-root)
├── Platform (sre-platform)
│   ├── Infrastructure
│   ├── Application
│   ├── Logs
│   ├── Traces
│   ├── SLO
│   └── Synthetic Monitoring
├── Golden-MDIxAI
├── Golden-AKS-DAIA
├── Golden-HWA
├── Golden-AKS-IEO
├── Golden-OT-Global
└── Golden-Passport
```

**Key output:** `folder_uids` — a map of folder key → UID, used by `rbac`, `alerting`, `slo`, and
`product-alerts`.

---

## `alerting`

**Path:** `modules/alerting/`

Wires up the full alerting stack: contact points, a shared message template, notification policy
routing tree, mute timings, and PromQL + LogQL alert rule groups.

### SRE contact points

| Contact Point         | Channel         | Used for                 |
| --------------------- | --------------- | ------------------------ |
| `teams-sre-critical`  | Microsoft Teams | SRE critical alerts      |
| `email-sre-warning`   | Email           | Warning-severity alerts  |
| `webhook-sre-generic` | Webhook         | Default/fallback routing |

### Product contact points

| Contact Point                      | Channel          | Products                              |
| ---------------------------------- | ---------------- | ------------------------------------- |
| `Teams_MDIxAI_NonProd`             | Microsoft Teams  | MDIxAI dev/qa/train                   |
| `Teams_AKS-DAIA_NonProd`           | Microsoft Teams  | AKS-DAIA dev/qa                       |
| `Teams_HWA_Infrastructure_NonProd` | Microsoft Teams  | HWA dev                               |
| `Teams_AKS-IEO_NonProd`            | Microsoft Teams  | AKS-IEO dev                           |
| `Teams_Passport_NonProd`           | Microsoft Teams  | Passport dev/qa                       |
| `BigPanda`                         | BigPanda webhook | MDIxAI prod, HWA prod, OT-Global prod |

Product contact point names must exactly match the `notification_settings.receiver` field in the
alert JSON files under `grafana_alerts_v1/payload/`.

---

## `irm-oncall`

**Path:** `modules/irm-oncall/`

Sets up Grafana OnCall with a 4-person SRE weekly rotation, escalation chain (notify → wait →
re-notify → broadcast), and Alertmanager integration.

**Escalation timing:** `escalation_wait_1_minutes = 5`, `escalation_wait_2_minutes = 10`

**Rotation start:** `2024-01-01T03:30:00` (IST-aligned, adjust when adding members)

---

## `slo`

**Path:** `modules/slo/`

Defines three Grafana SLOs using the `grafana-slo-app` plugin:

| SLO              | Target   | Alerting                                   |
| ---------------- | -------- | ------------------------------------------ |
| API availability | 99.9%    | Fast-burn (critical) + slow-burn (warning) |
| API p99 latency  | < 500 ms | Fast-burn (critical) + slow-burn (warning) |
| Error rate       | < 0.1%   | Fast-burn (critical) + slow-burn (warning) |

---

## `synthetic-monitoring`

**Path:** `modules/synthetic-monitoring/`

Configures three Synthetic Monitoring checks using the `grafana-synthetic-monitoring-app` plugin:

| Check                   | Type | Probes      |
| ----------------------- | ---- | ----------- |
| API health endpoint     | HTTP | 5 US probes |
| Database connectivity   | TCP  | 2 probes    |
| Grafana UI availability | HTTP | 3 probes    |

---

## `product-alerts`

**Path:** `modules/product-alerts/`

Loads Grafana alert rule groups from Grafana provisioning JSON files (apiVersion: 1 format) and
creates `grafana_rule_group` resources. Each JSON file must contain exactly one group. The
`folder_uid` passed in the `alert_groups` map overrides the folder field in the JSON — no edits to
the JSON files are required.

**Alert groups currently provisioned:**

| Key            | Product   | Environment | Contact Point                      |
| -------------- | --------- | ----------- | ---------------------------------- |
| `mdixai-dev`   | MDIxAI    | dev         | `Teams_MDIxAI_NonProd`             |
| `mdixai-qa`    | MDIxAI    | qa          | `Teams_MDIxAI_NonProd`             |
| `mdixai-train` | MDIxAI    | train       | `Teams_MDIxAI_NonProd`             |
| `mdixai-prod`  | MDIxAI    | prod        | BigPanda                           |
| `daia-dev`     | AKS-DAIA  | dev         | `Teams_AKS-DAIA_NonProd`           |
| `daia-qa`      | AKS-DAIA  | qa          | `Teams_AKS-DAIA_NonProd`           |
| `hwa-dev`      | HWA       | dev         | `Teams_HWA_Infrastructure_NonProd` |
| `hwa-prod`     | HWA       | prod        | BigPanda                           |
| `ieo-dev`      | AKS-IEO   | dev         | `Teams_AKS-IEO_NonProd`            |
| `ot-global`    | OT-Global | prod        | BigPanda                           |
| `passport-dev` | Passport  | dev         | `Teams_Passport_NonProd`           |
| `passport-qa`  | Passport  | qa          | `Teams_Passport_NonProd`           |

Alert JSON files live outside `grafana_tf/` at `grafana_alerts_v1/payload/<product>/alerts/`.

**Key output:** `rule_group_ids` — map of alert_groups key → `grafana_rule_group` ID.

---

## `fleet-management` _(PLANNED)_

**Path:** `modules/fleet-management/`

Currently commented out in both root modules. Strategy: one Alloy pipeline per
`(stack_environment × signal_type)` — nine pipelines total (dev/staging/prod × logs/metrics/traces).
See [[platform-configuration|alloy-configs/README.md]].

---

## Naming Conventions

| Resource                | Pattern                     | Example                          |
| ----------------------- | --------------------------- | -------------------------------- |
| Cloud Access Policy     | `ap-{purpose}-{env}`        | `ap-alloy-writer-dev`            |
| Service Account         | `sa-{purpose}`              | `sa-terraform`                   |
| Contact Point (SRE)     | `{channel}-sre-{severity}`  | `teams-sre-critical`             |
| Contact Point (product) | `Teams_{Product}_{Tier}`    | `Teams_MDIxAI_NonProd`           |
| Alert Rule Group        | `sre-{severity}-{domain}`   | `sre-critical-infrastructure`    |
| Folder                  | `sre-platform-{domain}`     | `sre-platform-infrastructure`    |
| Product Folder          | `golden-{product}`          | `golden-mdixai`                  |
| OnCall Schedule         | `oncall-sre-{rotation}`     | `oncall-sre-primary`             |
| SLO                     | `slo-{service}-{indicator}` | `slo-api-gateway-availability`   |
| Key Vault Secret        | `grafana-{purpose}-token`   | `grafana-alloy-writer-dev-token` |
