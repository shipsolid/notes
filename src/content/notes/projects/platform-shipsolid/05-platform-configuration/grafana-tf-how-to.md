---
title: "grafana_tf — How-To Guides"
description: "Dashboards are auto-discovered from the `grafana_tf/dashboards/` directory — no changes to any `."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202604280014"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/cicd
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf-operations
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/alerting
    kind: supersedes
  - slug: projects/platform-shipsolid/05-platform-configuration/alerts-standards
    kind: related
---

## How-To Guides

---

## Add a Dashboard

Dashboards are auto-discovered from the `grafana_tf/dashboards/` directory — no changes to any `.tf`
file are needed.

### Standard flavour dashboard (shared across products)

1. Export the dashboard JSON from Grafana.
2. Drop it into `grafana_tf/dashboards/flavors/<flavour>/` (e.g.
   `dashboards/flavors/aks/standard/`).
3. Run `terraform plan` — the new dashboard will appear for every product using that flavour.

### Product-specific dashboard

1. Export the dashboard JSON from Grafana.
2. Drop it into `grafana_tf/dashboards/products/<product-key>/` (e.g.
   `dashboards/products/mdixai/`).
3. Ensure the product's `dashboard_flavours` in `products.yml` includes `products/<product-key>`.
4. Run `terraform plan` and `terraform apply` in `environments/shipsoliddev/`.
5. After validating in the UI, apply to `environments/shipsolid/` if the product is in that env.

**Dashboard key** (Terraform state key): `<product-key>-<filename-stem>`, where the stem is the JSON
filename lowercased with spaces replaced by hyphens. Renaming a file will destroy and recreate the
dashboard resource.

---

## Add an Alert Rule (SRE infrastructure rules)

These rules live directly in `modules/alerting/main.tf` and cover infrastructure-level concerns.

Add a new `rule {}` block inside the appropriate `grafana_rule_group` resource. Every rule must
include:

```hcl
rule {
  name      = "HighCPUUsage"
  condition = "C"

  labels = {
    team     = "sre"
    severity = "critical"
  }

  annotations = {
    runbook_url = "https://wiki.shipsolid.com/runbooks/high-cpu"
    summary     = "CPU usage above threshold"
  }

  # ... data blocks ...
}
```

- `labels.team` must be `"sre"`.
- `labels.severity` drives notification routing.
- `annotations.runbook_url` is required — point to the team runbook.
- Do **not** set a `stack_environment` label on the rule — it propagates automatically from the
  metric's own labels at evaluation time.

See [[grafana-tf-operations#Alert Rule Review Cadence|Alert Rule Review Cadence]] for quarterly
maintenance.

---

## Add Product Alert Rules (JSON-provisioned)

Product alert rules are loaded from Grafana provisioning JSON files (apiVersion: 1 format). No
changes to any `.tf` file are needed — files are auto-scanned.

1. Export or author a Grafana provisioning JSON file with exactly one group. Use `ALERT_*` tokens
   where values vary by environment:

   ```json
   {
     "apiVersion": 1,
     "groups": [
       {
         "name": "ALERT_GROUP_NAME",
         "interval": "15m",
         "rules": [...]
       }
     ]
   }
   ```

2. Save the file to `grafana_tf/alert_rules/products/<product-key>/<state-key>.json`. The filename
   stem becomes the Terraform state key — use dash-separated names (e.g. `my-product-dev.json`).
3. Ensure `alert_flavours` in `products.yml` includes `products/<product-key>`:

   ```yaml
   grafana:
     alert_flavours:
       - products/my-product
   ```

4. Ensure the `notification_settings.receiver` field in each rule matches a contact point name
   defined in `products.yml` (use `ALERT_CONTACT_POINT` for the environment's primary contact
   point).
5. Run `terraform plan` in `environments/shipsoliddev/`, validate, then apply. Promote to
   `shipsolid` when ready.

---

## Add a New Product

All product resources — Grafana folder, team, dashboards, alert groups, LBAC rules, and notification
routes — are driven entirely by `products.yml`. No `.tf` files need to change for a standard
onboarding.

### 1. Add the product block to `products.yml`

Use an existing product of the same platform as a template (see `docs/products.md`). Set
`status: planned` for environments not yet wired.

```yaml
my-product:
  platform: aks          # drives default flavours; override with explicit dashboard/alert_flavours
  team:
    name: "My Product Team"
    email: "myteam@shipsolid.com"
    dashboardRole: Editor
    members: []
  terraform_envs: [shipsoliddev]
  contact_points:
    teams:
      teams_my_product_nonprod:
        name: "teams-my-product-nonprod"
        section_title: "My Product NonProd Alert"
        kv_secret_slug: "teams-webhook-my-product-nonprod"
  grafana:
    folder_key: golden-aks-my-product
    folder_title: Golden-AKS-MyProduct
  environments:
    dev:
      status: active
      deployment_environment: my-product-dev
      use_contact_points:
        - teams-my-product-nonprod
```

### 2. Add product alert JSON files (if using `products/<name>` flavour)

Place files in `grafana_tf/alert_rules/products/my-product/`. See
[Add Product Alert Rules](#add-product-alert-rules-json-provisioned).

### 3. Pre-populate Key Vault secrets

Store the Teams webhook URL in AKV as `grafana-<stack_slug>-teams-webhook-my-product-nonprod` before
applying.

### 4. Validate and promote

Run `terraform plan` in `environments/shipsoliddev/` — the plan should show a new folder, team,
dashboards, alert groups, and LBAC rules. Apply, then validate in the Grafana UI.

When prod environments are ready, add `shipsolid` to `terraform_envs` and apply to
`environments/shipsolid/`.

---

## Environment Segregation (LBAC)

### Label naming convention

Two label names serve distinct purposes and must not be confused:

| Label                    | Where it lives                                   | What it identifies                                                                   |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `deployment_environment` | On every metric, log, and trace shipped by Alloy | Which **application** environment the telemetry came from (`dev`, `staging`, `prod`) |
| `stack_environment`      | Terraform variable (`var.stack_environment`)     | Which **Grafana Cloud stack** is being managed (`shipsoliddev` or `shipsolid`)       |

LBAC operates on `deployment_environment`. The `stack_environment` variable is a Terraform construct
used to name and iterate over policies — it never appears as a label on telemetry.

### How it works

Both Grafana stacks receive telemetry from all three application environments (`dev`, `staging`,
`prod`). Isolation is enforced through Label-Based Access Control (LBAC) on the
`deployment_environment` label — not through separate stacks.

Every metric, log, and trace shipped by Alloy carries:

```yaml
deployment_environment = "dev" | "staging" | "prod"
```

Alloy stamps this label using signal-specific mechanisms:

| Signal  | In-pipeline                                                                             | Write-time override                                                       |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Metrics | `prometheus.relabel` rule sets `target_label = "deployment_environment"`                | `write_relabel_config` and `external_labels` on `prometheus.remote_write` |
| Logs    | `stage.static_labels` in `loki.process`                                                 | `external_labels` on `loki.write`                                         |
| Traces  | `otelcol.processor.attributes` inserts `deployment_environment` as a resource attribute | _(OTLP carries attributes end-to-end; no separate override needed)_       |

For metrics and logs the label is set at two points for resilience so it cannot be stripped by
app-level relabelling. For traces, `action = "insert"` is used so spans that already carry the
attribute are not silently overwritten, but the value is hard-coded at render time and cannot be
spoofed by a misconfigured upstream exporter.

Grafana Cloud enforces this at the **Cloud Access Policy** level. Each policy has a
`realm.label_policy` selector that restricts what data the token bearer can write:

| Access Policy           | Token used by           | Label selector                     | Allowed operations                 |
| ----------------------- | ----------------------- | ---------------------------------- | ---------------------------------- |
| `ap-terraform-admin`    | This Terraform codebase | _(none — admin)_                   | Read + write all signals           |
| `ap-alloy-writer-<env>` | Alloy agents (per env)  | `{deployment_environment="<env>"}` | Write only — metrics, logs, traces |

Enforcement is **server-side**. An Alloy agent holding the `dev` token is rejected by the Grafana
Cloud API if it attempts to write data tagged as `deployment_environment="staging"` or
`deployment_environment="prod"`, regardless of pipeline configuration.

### Label enforcement in alert rules

The `deployment_environment` label is **not** set statically on alert rules — it propagates at
evaluation time from the metric's own labels, which Alloy injects when shipping telemetry.

### Add a new application environment

1. Add the new value to `var.stack_environments` in both `environments/shipsoliddev/variables.tf`
   and `environments/shipsolid/variables.tf`.
2. The `for_each = toset(var.stack_environments)` in `modules/stack/main.tf` automatically creates a
   new `ap-alloy-writer-<env>` access policy and token on the next apply.
3. After apply, the new token appears in Key Vault under `grafana-alloy-writer-<env>-token`. Wire it
   into the Alloy deployment for that environment.

---

## Migrate `shipsolid` to IaC

Run these steps once IaC development is complete and validated on `shipsoliddev`.

### Step 1 — Populate shipsolid credentials

```bash
cp environments/shipsolid/terraform.tfvars.example environments/shipsolid/terraform.tfvars
# Edit with shipsolid stack credentials (grafana_url, stack_slug = "shipsolid", etc.)
```

### Step 2 — Initialise the shipsolid state

```bash
cd environments/shipsolid
export ARM_ACCESS_KEY=<your-storage-key>
terraform init
```

This creates a fresh state file at `shipsolid/terraform.tfstate` in the Azure blob container. It
does not touch any Grafana resources yet.

### Step 3 — Import existing shipsolid resources

Use `scripts/import-existing.sh` with `STACK=shipsolid` to pull existing Grafana resources into the
new state file:

```bash
# Import the stack itself
STACK=shipsolid ./scripts/import-existing.sh stack \
  "module.stack.grafana_cloud_stack.main" \
  "shipsolid"

# Import each folder (root → mid → leaf order)
STACK=shipsolid ./scripts/import-existing.sh folder \
  'module.dashboards.grafana_folder.root["sre-root"]' \
  "sre-root"

# Import data sources
STACK=shipsolid ./scripts/import-existing.sh datasource \
  "module.datasources.grafana_data_source.mimir" \
  "mimir-shipsolid"

# Continue for all resource types listed in scripts/import-existing.sh
```

### Step 4 — Verify zero unexpected changes

```bash
terraform plan   # Must show 0 to add, 0 to change, 0 to destroy
```

If the plan shows changes, reconcile them: either update the Terraform code to match the existing
config, or accept the change as an intentional drift correction.

### Step 5 — Activate CI for shipsolid

Plan and apply for `shipsolid` run in TFC's `grafana-tf-shipsolid` workspace via the VCS hookup —
see [[cicd|docs/cicd.md]]. To activate:

- Confirm the workspace is connected to the GitHub repo with **Terraform Working Directory** set to
  `environments/shipsolid` and trigger paths matching `environments/shipsolid/**`, `modules/**`,
  `dashboards/generated/shipsolid/**`, `alert_rules/generated/shipsolid/**`, `products.yml`, and
  `tools/stacks.yml`.
- Confirm the TFC workspace's Variable Set carries the production credentials
  (`SHIPSOLID_*`-prefixed values from your secret store, mapped to the same Terraform variable /
  env-var names as `shipsoliddev` — only the _values_ differ).
- `.github/workflows/plan-shipsolid.yml` — uncomment the `pull_request` trigger so the pre-flight
  (generator-in-sync + `terraform fmt`) runs on prod-touching PRs.
- `.github/workflows/drift-shipsolid.yml` — see drift section in [[cicd|docs/cicd.md]]; pending
  migration to TFC Health Assessments.

Workspace Auto-apply must remain off for `shipsolid`. Apply runs are confirmed manually in the TFC
UI after merge to `main`.

### Step 6 — Add GitHub labels

```bash
gh label create "shipsoliddev" --color "0075ca" --description "shipsoliddev stack drift/issues"
gh label create "shipsolid"    --color "e4e669" --description "shipsolid production stack drift/issues"
```
