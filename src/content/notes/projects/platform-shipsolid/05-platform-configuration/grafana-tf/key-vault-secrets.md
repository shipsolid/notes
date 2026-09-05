---
title: "Azure Key Vault Secrets — Reference"
description: "All secrets live in `mf-cc-dt-azrsrp-prd-kv`."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202604280014-3"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/modules
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/lbac
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/system-design
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/cicd
    kind: related
---

## Azure Key Vault Secrets — Reference

All secrets live in `mf-cc-dt-azrsrp-prd-kv`. The secret name pattern is:

```
grafana-<stack_slug>-<purpose>
```

The `stack_slug` is the Grafana Cloud stack identifier — `shipsoliddev` for the dev/staging stack or
`shipsolid` for the prod stack.

---

## Secrets Written by Terraform

These secrets are created or updated on every `terraform apply`. Do not edit them manually.

| Secret name (pattern)                      | `content_type` | Tags `description`                                                              | Source value                                                                           | Used by                                                                                                   |
| ------------------------------------------ | -------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `grafana-{stack}-sa-terraform-token`       | `text/plain`   | `Grafana sa-terraform service account token (Admin role)`                       | `module.stack.sa_terraform_token`                                                      | CI/CD, any automation that calls the Grafana HTTP API as an admin                                         |
| `grafana-{stack}-sa-cloud-api-key`         | `text/plain`   | `Grafana admin SA token (GRAFANA_CLOUD_API_KEY)`                                | `module.stack.sa_terraform_token` (same value as above, aliased for env-var consumers) | Automation expecting `GRAFANA_CLOUD_API_KEY`; maps to `ap-terraform-admin` full-access policy             |
| `grafana-{stack}-alloy-writer-{env}-token` | `text/plain`   | `Grafana ap-alloy-writer-{env} token — metrics:write, logs:write, traces:write` | `module.stack.alloy_writer_tokens[env]`                                                | Alloy DaemonSet for the matching environment — LBAC-restricted write-only token                           |
| `grafana-{stack}-cloud-prom-username`      | `text/plain`   | `Prometheus remote-write numeric user ID (GRAFANA_CLOUD_PROM_USERNAME)`         | `module.stack.prometheus_user_id`                                                      | Alloy `prometheus.remote_write` basic-auth username                                                       |
| `grafana-{stack}-cloud-prom-endpoint`      | `text/plain`   | `Prometheus remote-write base URL (GRAFANA_CLOUD_PROM_ENDPOINT)`                | `module.stack.prometheus_url`                                                          | Alloy `prometheus.remote_write` endpoint                                                                  |
| `grafana-{stack}-cloud-mimir-endpoint`     | `text/plain`   | `Mimir remote write URL (GRAFANA_CLOUD_MIMIR_URL)`                              | `module.stack.prometheus_url` (same URL as prom)                                       | Alloy [[mimir]] remote-write endpoint; alias used by consumers that distinguish Mimir from raw Prometheus |
| `grafana-{stack}-cloud-mimir-username`     | `text/plain`   | `Mimir numeric user ID (GRAFANA_CLOUD_MIMIR_USERNAME)`                          | `module.stack.prometheus_user_id` (same value as prom)                                 | Alloy Mimir basic-auth username                                                                           |
| `grafana-{stack}-cloud-loki-endpoint`      | `text/plain`   | `Loki push URL (GRAFANA_CLOUD_LOKI_URL)`                                        | `module.stack.loki_url`                                                                | Alloy `loki.write` endpoint                                                                               |
| `grafana-{stack}-cloud-loki-username`      | `text/plain`   | `Loki numeric user ID (GRAFANA_CLOUD_LOKI_USERNAME)`                            | `module.stack.loki_user_id`                                                            | Alloy `loki.write` basic-auth username                                                                    |
| `grafana-{stack}-cloud-tempo-endpoint`     | `text/plain`   | `Tempo ingest URL (GRAFANA_CLOUD_TEMPO_URL)`                                    | `module.stack.tempo_url`                                                               | Alloy `otelcol.exporter.otlp` endpoint                                                                    |
| `grafana-{stack}-cloud-tempo-username`     | `text/plain`   | `Tempo numeric user ID (GRAFANA_CLOUD_TEMPO_USERNAME)`                          | `module.stack.tempo_user_id`                                                           | Alloy OTLP basic-auth username                                                                            |
| `grafana-{stack}-cloud-otlp-endpoint`      | `text/plain`   | `OTLP gateway URL (GRAFANA_CLOUD_OTLP_URL)`                                     | `module.stack.otlp_url`                                                                | OTel collectors / Alloy unified OTLP ingestion for metrics+logs+traces                                    |
| `grafana-{stack}-cloud-otlp-username`      | `text/plain`   | `OTLP basic-auth username (GRAFANA_CLOUD_OTLP_USERNAME)`                        | `module.stack.stack_id` (Grafana Cloud stack numeric ID)                               | OTLP basic-auth username paired with a CAP token as password                                              |
| `grafana-{stack}-faro-api-endpoint`        | `text/plain`   | `Faro REST API endpoint (stack-level — used for sourcemap uploads)`             | Stack-level Faro API base URL                                                          | CI/CD sourcemap upload scripts                                                                            |
| `grafana-{stack}-faro-sourcemap-token`     | `text/plain`   | `Grafana Cloud access policy token for Faro sourcemap uploads`                  | `grafana_cloud_access_policy_token.ap_faro_sourcemap_upload_token.token`               | CI/CD pipeline — authenticates sourcemap `POST` requests against the Faro REST API                        |

### Per-environment alloy-writer token instances

`{env}` expands based on `var.stack_environments`:

| Environment (`stack_slug`) | `stack_environments`         | Alloy-writer secrets created                                                                                                            |
| -------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `shipsoliddev`             | `["shipsoliddev"]`           | `grafana-shipsoliddev-alloy-writer-shipsoliddev-token`                                                                                  |
| `shipsolid`                | `["dev", "staging", "prod"]` | `grafana-shipsolid-alloy-writer-dev-token`, `grafana-shipsolid-alloy-writer-staging-token`, `grafana-shipsolid-alloy-writer-prod-token` |

Each alloy-writer token is backed by a Cloud Access Policy (`ap-alloy-writer-{env}`) that carries a
`label_policy` LBAC rule. The Grafana Cloud API rejects writes where the `deployment_environment`
label does not match the policy's `{env}` value — regardless of what the Alloy pipeline
configuration sends.

---

## Secrets Pre-populated Externally (Read by Terraform)

These secrets must exist in Key Vault **before** running `terraform apply`. Terraform reads them as
`data` sources; it does not create or overwrite them. Store an empty string `""` for optional
product webhooks that are not yet configured.

| Secret name (pattern)                            | Used by                               | Notes                                                                        |
| ------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------- |
| `grafana-{stack}-azure-ad-client-secret`         | `module.sso` and `module.datasources` | Azure AD app client secret for Grafana SSO and the Azure Monitor data source |
| `grafana-{stack}-teams-webhook-sre-critical`     | `module.alerting`                     | Teams incoming webhook for SRE critical contact point                        |
| `grafana-{stack}-webhook-sre-generic`            | `module.alerting`                     | Generic webhook URL for SRE fallback/catch-all contact point                 |
| `grafana-{stack}-teams-webhook-mdixai-nonprod`   | `module.alerting`                     | Teams webhook for MDIxAI non-prod alerts contact point                       |
| `grafana-{stack}-teams-webhook-daia-nonprod`     | `module.alerting`                     | Teams webhook for AKS-DAIA non-prod alerts contact point                     |
| `grafana-{stack}-teams-webhook-hwa-nonprod`      | `module.alerting`                     | Teams webhook for HWA non-prod alerts contact point                          |
| `grafana-{stack}-teams-webhook-ieo-nonprod`      | `module.alerting`                     | Teams webhook for AKS-IEO non-prod alerts contact point                      |
| `grafana-{stack}-teams-webhook-passport-nonprod` | `module.alerting`                     | Teams webhook for Passport non-prod alerts contact point                     |
| `grafana-{stack}-bigpanda-webhook`               | `module.alerting`                     | BigPanda webhook URL for production alert routing                            |

---

## Common Tags

All Terraform-managed secrets carry these tags:

| Tag           | Value                             |
| ------------- | --------------------------------- |
| `managed-by`  | `terraform`                       |
| `team`        | `sre`                             |
| `description` | Secret-specific (see table above) |

---

## Secret Lifecycle

| Category                   | How the value is rotated                                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SA / alloy-writer tokens   | Run `terraform apply` — Terraform recreates the Grafana Cloud token and overwrites the KV secret. Roll-restart Alloy DaemonSets after apply so pods re-read the new value from KV. |
| Faro sourcemap token       | Same as above — `terraform apply` regenerates the `ap-faro-sourcemap-{stack}` policy token.                                                                                        |
| Externally managed secrets | Rotate directly in Key Vault (out-of-band). Terraform only reads these; `terraform apply` picks up the new value on the next run.                                                  |

All tokens have a TTL of 90 days (`token_ttl_seconds`, default `7776000 s` in
`modules/stack/variables.tf`). The Faro sourcemap token uses a hardcoded `8760h` (1 year) with
`lifecycle { ignore_changes = [expires_at] }` to avoid forced replacement on each plan. The
token-expiry workflow alerts 30 days before expiry.
