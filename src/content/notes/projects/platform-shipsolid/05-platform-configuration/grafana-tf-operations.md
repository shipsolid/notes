---
title: "grafana_tf — Operations"
description: "All tokens default to a 90-day TTL (`token_ttl_seconds = 7776000`)."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202604280014-2"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/key-vault-secrets
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf-how-to
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/security-access-compliance
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/cicd
    kind: related
---

## Operations

---

## Token Rotation Procedure

All tokens default to a 90-day TTL (`token_ttl_seconds = 7776000`). The `token-expiry` GitHub
Actions workflow runs every Monday and posts a Teams alert when any token is within 30 days of
expiry.

When you receive the alert, rotate the relevant token using the steps below.

### Cloud Access Policy tokens (Alloy writers, LBAC readers, Terraform admin)

These are `grafana_cloud_access_policy_token` resources. The
`lifecycle { ignore_changes = [expires_at] }` block means Terraform does not auto-replace them on
`plan`. To force rotation, taint the specific resource and apply:

```bash
cd grafana_tf/environments/shipsoliddev  # or shipsolid

# List the resources to find the exact address
terraform state list | grep ap_alloy_writer_token

# Taint the expiring token(s)
terraform taint 'module.stack.grafana_cloud_access_policy_token.ap_alloy_writer_token["dev"]'
terraform taint 'module.stack.grafana_cloud_access_policy_token.ap_terraform_admin_token'

# Plan and apply — new tokens are created and written to Key Vault
terraform plan
terraform apply
```

After apply:

- Alloy writer tokens: rolling-restart Alloy DaemonSets so the Key Vault CSI driver re-reads the new
  tokens.
- Terraform admin token: update the GitHub Secret `GRAFANA_CLOUD_ACCESS_POLICY_TOKEN` (or
  `SHIPSOLID_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN`) with the new value from Key Vault.

### `grafana-{stack}-sa-terraform-token` (Grafana SA token)

The SA token uses `seconds_to_live` and is recreated automatically when it expires:

1. Taint the resource and apply:

   ```bash
   terraform taint 'module.stack.grafana_cloud_stack_service_account_token.sa_terraform_token'
   terraform apply
   ```

2. The new token value is written to Azure Key Vault as `grafana-{stack}-sa-terraform-token` (e.g.
   `grafana-shipsoliddev-sa-terraform-token`).
3. Update the GitHub Secret `GRAFANA_SA_TOKEN` (or `SHIPSOLID_GRAFANA_SA_TOKEN`) with the new value.

### Cloud Access Policy token for CI (manual, not Terraform-managed)

This is the cloud-level token stored as `GRAFANA_CLOUD_ACCESS_POLICY_TOKEN` /
`SHIPSOLID_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN`, used by CI to authenticate to `grafana.com` (not the
Grafana instance). It is **not** managed by Terraform — rotate it manually:

1. In the Grafana Cloud console, navigate to **Security → Access Policies → ap-terraform-admin**.
2. Delete the old token and create a new one with the same scopes.
3. Update the GitHub Secret with the new value.

---

## Incident Runbook: Grafana Stack Unavailable

**Symptoms:** Grafana UI returns 5xx, dashboards fail to load, alerts stop firing.

### Step 1 — Check Grafana Cloud Status

Visit [status.grafana.com](https://status.grafana.com). If an active incident is listed for your
region, monitor the status page — no IaC action required.

### Step 2 — Check for Recent Terraform Changes

```bash
git log --oneline grafana_tf/ | head -10
```

If a recent apply correlates with the outage, check `terraform plan` to identify what changed. A bad
datasource configuration or alert rule can cause Grafana to become unresponsive.

### Step 3 — Rollback via Terraform

If a specific resource is suspect, revert the change in Git and re-apply:

```bash
git revert <commit>
cd grafana_tf/environments/shipsoliddev  # validate first
terraform plan
# if clean, promote to shipsolid
cd ../shipsolid
terraform apply
```

### Step 4 — Emergency Access

If Terraform apply itself is failing (e.g. broken state), the Grafana Cloud console provides direct
access to all resources outside of Terraform. Use the `sa-terraform` service account credentials
stored in Azure Key Vault (`grafana-sa-terraform-token`) to access the Grafana API directly.

### Step 5 — Escalate to Grafana Labs

Open a support ticket at [grafana.com/profile/org](https://grafana.com/profile/org) → **Support**.
Include:

- Stack slug (`shipsolid` or `shipsoliddev`)
- Region
- Approximate time the incident began
- Terraform plan output if applicable

**Incident commander:** SRE on-call (see OnCall schedule in Grafana IRM).

---

## Data Retention

Grafana Cloud retains telemetry data for the following periods (verify against the active plan):

| Signal  | Default Retention |
| ------- | ----------------- |
| Metrics | 13 months         |
| Logs    | 30 days           |
| Traces  | 14 days           |

Retention limits apply to all environments on the stack (dev, staging, prod data written to the same
stack share the same retention policy). If compliance requirements mandate longer retention, contact
Grafana Labs to upgrade the plan.

---

## Operational Cadences

### Plugin Upgrade Cadence

All five plugins (Azure Monitor, OnCall, SLO, Synthetic Monitoring, K8s) are pre-provisioned by the
Grafana Cloud Advanced plan and cannot be managed via `grafana_cloud_plugin_installation`. Plugin
upgrades are applied automatically by Grafana Cloud. If a plugin upgrade causes instability, open a
support ticket with Grafana Labs to roll back.

### Alert Rule Review Cadence

Alert rules are defined in `grafana_tf/alert_rules/templates/` (standard flavours) and
`grafana_tf/alert_rules/products/` (hand-crafted per-product rules). Review them **quarterly**:

- Thresholds are still accurate for current workload profiles.
- Label selectors (`namespace`, `job`, `service`) still match deployed workloads.
- `use_contact_points` entries in `products.yml` point to active contact points.
- `deployment_environment` values in `products.yml` match what Alloy stamps on telemetry.

After any rule change, run `python grafana_tf/tools/generate.py`, commit the updated
`alert_rules/generated/` files, and apply via the normal promotion flow.

Create a quarterly recurring calendar invite: "SRE Alert Rule Review" assigned to the SRE on-call
rotation lead.

---

## Security Notes

- All tokens and secrets are marked `sensitive = true` in Terraform.
- `*.tfvars` files (except `*.tfvars.example`) are gitignored — never commit real credentials.
- `lifecycle { prevent_destroy = true }` is set on the cloud stack and all four data sources.
- Alloy writer tokens use least-privilege scopes (write-only: `metrics:write`, `logs:write`,
  `traces:write`).
- Each Alloy writer token is server-side LBAC-restricted to a single `deployment_environment` —
  cross-environment writes are rejected at the Grafana Cloud API level.
- Terraform-generated tokens are stored in Azure Key Vault (`mf-cc-dt-azrsrp-prd-kv`) immediately
  after apply, named `grafana-{stack}-*` to distinguish secrets from different stacks. Alloy agents
  read their token from Key Vault at pod startup via the Azure Key Vault CSI driver. See
  [[projects/platform-shipsolid/05-platform-configuration/grafana-tf/key-vault-secrets|Key Vault Secrets Reference]]
  for the full catalogue.
- All tokens expire after 90 days. The `token-expiry` workflow alerts 30 days before expiry. See
  [Token Rotation Procedure](#token-rotation-procedure) for renewal steps.
