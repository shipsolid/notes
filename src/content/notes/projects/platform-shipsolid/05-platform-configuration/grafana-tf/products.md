---
title: "grafana_tf — Products Registry"
description: "[`products."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202604280014-6"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/lbac
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/key-vault-secrets
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/modules
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/cicd
    kind: depends_on
---

## Products Registry

`products.yml` is the single source of truth for all product observability configuration in this
repository. It drives Grafana dashboards, alert rules, contact routing, team membership, and
synthetic monitoring checks across all Terraform environments.

---

## Table of Contents

- [File structure](#file-structure)
- [Field reference](#field-reference)
- [Platform types](#platform-types)
- [Flavour system](#flavour-system)
- [Synthetics](#synthetics)
- [Terraform environments](#terraform-environments)
- [Team membership](#team-membership)
- [Frontend Observability (Faro)](#frontend-observability-faro)
- [How to: add a new environment to an existing product](#how-to-add-a-new-environment-to-an-existing-product)
- [How to: onboard a new product](#how-to-onboard-a-new-product)
- [Current product status](#current-product-status)

---

## File structure

Each product is a top-level key under `products:`. The structure is:

```yaml
products:
  <product-key>:
    platform: aks | aca | onprem
    team:
      name: <display name>
      email: <team email>
      dashboardRole: Editor | Viewer  # Grafana folder permission for this team
      members: []                     # Grafana login emails (Azure AD UPN)
    terraform_envs: [shipsoliddev, shipsolid]
    oncall:                           # optional
      enabled: true | false
      schedule:
        timezone: "Asia/Kolkata"
      escalation:
        wait_1_minutes: 5
        wait_2_minutes: 10
    contact_points:                   # optional — contact point definitions owned by this product
      teams:
        <cp-key>:
          name: <grafana-cp-name>
          section_title: <teams-card-title>
          kv_secret_slug: <kv-secret-name-suffix>
      webhook:
        <cp-key>:
          name: <grafana-cp-name>
          kv_secret_slug: <kv-secret-name-suffix>
      email:
        <cp-key>:
          name: <grafana-cp-name>
          addresses: [user@shipsolid.com]
    faro:                             # optional — products using Grafana Faro for browser telemetry
      <terraform_env>:
        app_id: <numeric-app-id>
        collection_url: https://faro-collector-<region>.grafana.net/collect/<token>
        api_endpoint: https://faro-api-<region>.grafana.net/faro/api/v1
    grafana:
      folder_key: <folder-key>        # e.g. golden-aks-daia
      folder_title: <display name>
      dashboard_flavours:
        - <flavour-path>              # see Flavour system section
      alert_flavours:
        - <flavour-path>
    environments:
      <env>:
        status: active | planned
        deployment_environment: <env-label>
        use_contact_points:
          - <primary-cp-name>         # index 0 → contact point in generated alert JSON
          - <extra-cp-name>           # index 1+ → additional continue=true notification routes
        synthetics:                   # optional — list of synthetic monitoring checks for this env
          - key: <check-key>
            type: browser | http | tcp
            job: <job-name>
            target: <url-or-host:port>
            frequency: <milliseconds>
            timeout: <milliseconds>
            probes: [<probe-id>, ...]
            # http-only options:
            method: GET | POST                    # optional, default GET
            bearer_token_kv_slug: <kv-slug>       # optional, KV secret suffix for bearer auth
            tls_insecure_skip_verify: false        # optional
        clusters: [...]               # AKS products only — reserved for future Alloy deployment
        azure: {...}                  # ACA products only — ARM resource identifiers for alert tokens
```

---

## Field reference

### Product-level fields

| Field                | Description                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform`           | Infrastructure type: `aks`, `aca`, or `onprem`. Drives default dashboard and alert flavours when not explicitly set.                                                                                |
| `team.name`          | Display name shown in Grafana for this team.                                                                                                                                                        |
| `team.email`         | Team contact email.                                                                                                                                                                                 |
| `team.dashboardRole` | Grafana folder permission for this team: `Editor` or `Viewer`. SRE always gets Admin.                                                                                                               |
| `team.members`       | List of Grafana login emails (Azure AD UPN). User must have logged in via SSO at least once before Terraform can add them.                                                                          |
| `terraform_envs`     | Which Terraform stacks deploy this product: `shipsoliddev` (nonprod), `shipsolid` (prod). Removing an env from this list automatically destroys its resources on next apply.                        |
| `contact_points`     | Contact point definitions owned by this product, grouped by type: `teams`, `webhook`, or `email`. All products' contact_points are merged into a single flat map by the observability-stack module. |
| `faro`               | Optional. Per-stack Faro frontend observability config, keyed by terraform_env. Terraform writes the values to Azure Key Vault.                                                                     |

### `grafana` block

| Field                | Description                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `folder_key`         | Key identifying this product's Grafana folder (e.g. `golden-aks-daia`). Used as both the Terraform resource key and Grafana folder UID. Auto-creates the folder under `sre-root`. |
| `folder_title`       | Human-readable folder name shown in the Grafana UI.                                                                                                                               |
| `dashboard_flavours` | List of dashboard flavour paths to deploy. If omitted, the platform default is used. See [Flavour system](#flavour-system).                                                       |
| `alert_flavours`     | List of alert flavour paths to deploy. If omitted, the platform default is used.                                                                                                  |

### `environments.<env>` block

| Field                    | Description                                                                                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`                 | `active` — deployed and actively evaluated. `planned` — entry exists in YAML but Terraform skips it.                                                                                                                                                      |
| `deployment_environment` | Value of the `deployment_environment` Prometheus/Loki label (e.g. `daia-dev`, `aca-dgeg-mdixai-dev`). Used in PromQL selectors, [[projects/platform-shipsolid/05-platform-configuration/grafana-tf/lbac\|LBAC rules]], and alert rule token substitution. |
| `use_contact_points`     | List of contact point names. Index 0 → primary contact point in generated alert JSON. Indexes 1+ → additional `continue=true` notification policy routes for this environment.                                                                            |
| `synthetics`             | Optional list of synthetic monitoring checks for this environment. See [Synthetics](#synthetics).                                                                                                                                                         |

### `clusters` block (AKS products only)

| Field                | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `cluster_name`       | AKS cluster name.                                                      |
| `subscription_id`    | Azure subscription containing the cluster.                             |
| `resource_group`     | Resource group containing the cluster.                                 |
| `namespace`          | Kubernetes namespace where the monitoring agent is deployed.           |
| `credentials_secret` | GitHub Actions secret name holding Azure credentials for this cluster. |

### `azure` block (ACA products only)

| Field             | Description                                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subscription_id` | Azure subscription for this environment.                                                                                                                    |
| `resource_groups` | List of resource groups, each with a `name` and a `resources` list of `{name, type}` entries. Types: `container_app`, `app_gateway`, `key_vault`, `sql_mi`. |

---

## Platform types

| Platform | Metrics source                                     | Azure Monitor | Default dashboard flavour | Default alert flavour |
| -------- | -------------------------------------------------- | ------------- | ------------------------- | --------------------- |
| `aks`    | Prometheus (`node_exporter`, `kube-state-metrics`) | No            | `aks/standard`            | `aks/standard`        |
| `aca`    | Azure Monitor + Faro OTEL                          | Yes           | `aca/standard`            | `aca/standard`        |
| `onprem` | Prometheus                                         | No            | `onprem/standard`         | _(none)_              |
| `sap`    | SAP-native metrics                                 | No            | _(planned)_               | _(planned)_           |

Platform defaults apply only when `dashboard_flavours` / `alert_flavours` are omitted from the
product's `grafana` block. Explicit flavour lists override the defaults entirely.

---

## Flavour system

Dashboard and alert JSON files are **pre-generated** by `grafana_tf/tools/generate.py` and committed
to the repository. Terraform consumes them as-is — no token substitution at apply time.

### Generator

```bash
# Generate all stacks
python grafana_tf/tools/generate.py

# Generate a single stack
python grafana_tf/tools/generate.py --stack shipsoliddev
```

Run the generator after any change to `products.yml` and commit the updated files under
`grafana_tf/alert_rules/generated/` and `grafana_tf/dashboards/generated/`. The
[[projects/platform-shipsolid/05-platform-configuration/grafana-tf/cicd|CI pipeline]] enforces that
committed files match the generator output.

**Templates** (Jinja2, `[[ ]]` variable delimiters to avoid conflict with Grafana's `{{ $labels }}`
syntax):

| Directory                                                   | Purpose                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `grafana_tf/alert_rules/templates/aks/standard.json.j2`     | AKS alert rules template                                                 |
| `grafana_tf/alert_rules/templates/aca/standard.json.j2`     | ACA alert rules template — loops over `azure.container_apps` dynamically |
| `grafana_tf/dashboards/templates/aks/standard/*.json.j2`    | AKS dashboard templates                                                  |
| `grafana_tf/dashboards/templates/aca/standard/*.json.j2`    | ACA dashboard templates                                                  |
| `grafana_tf/dashboards/templates/onprem/standard/*.json.j2` | On-prem dashboard templates                                              |
| `grafana_tf/dashboards/templates/products/mdixai/*.json.j2` | Bespoke MDIxAI dashboards                                                |

**Generated output** (committed, one subdirectory per stack):

| Directory                                   | Contents                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `grafana_tf/alert_rules/generated/<stack>/` | `<prod_key>-<env_key>.json` — one file per active product environment  |
| `grafana_tf/dashboards/generated/<stack>/`  | `<prod_key>-<stem>.json` — one file per product per dashboard template |

### Alert flavours

`alert_flavours` in each environment selects which template set to use. Standard flavours
(`aks/standard`, `aca/standard`) are rendered by the generator. Product flavours (`products/<name>`)
point to hand-crafted JSON files in `grafana_tf/alert_rules/products/<name>/` — these are used as-is
and are not rendered by the generator.

Available standard flavours:

| Path           | Rules                                                                                                                               | Platform |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `aks/standard` | Cluster CPU/mem, node CPU/mem, OOM, container restarts                                                                              | AKS      |
| `aca/standard` | Container CPU/mem (dynamic per container app count), ACA metrics, restarts, failed requests, latency, APPGW, KV, SQL MI, synthetics | ACA      |

### Dashboard flavours

`dashboard_flavours` selects which template directory to render. The generator produces one output
file per `.json.j2` template per product.

Available standard flavours:

| Path              | Dashboards included                                           |
| ----------------- | ------------------------------------------------------------- |
| `aks/standard`    | Global, Namespaces, Nodes, Pods                               |
| `aca/standard`    | Landing page, SRE persona, Developer persona, Product persona |
| `onprem/standard` | Landing page, SRE persona, Developer persona, Product persona |
| `products/mdixai` | Bespoke MDIxAI dashboards                                     |

Dashboard key format: `<product-key>-<filename-stem>` (filename lowercased, spaces → hyphens). This
is the Terraform state key — renaming a template file will destroy and recreate the dashboard
resource.

Alert rule key format (state key): `<prod_key>-<env_key>` for standard flavours, `<filename-stem>`
for product flavours (e.g. `hwa-dev.json` → key `hwa-dev`).

---

## Synthetics

Synthetic monitoring checks are defined per-environment under `environments.<env>.synthetics`.
Terraform auto-derives the `product_synthetic_checks` local from this structure and passes it to
`module "synthetic_monitoring"`.

### Check types

| Type      | Description                                                                     | Required extra fields                                |
| --------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `browser` | K6 browser script — file resolved at `grafana_tf/synthetics/<product>/<env>.js` | —                                                    |
| `http`    | HTTP probe with optional auth and TLS options                                   | `method`, `bearer_token`, `tls_insecure_skip_verify` |
| `tcp`     | TCP connectivity probe                                                          | —                                                    |

### Bearer tokens

For HTTP checks requiring authentication, set `bearer_token_kv_slug` to the Azure Key Vault secret
name suffix:

```yaml
synthetics:
  - key: master-api
    type: http
    bearer_token_kv_slug: hwa-master-api-bearer-token  # KV secret: grafana-{stack}-hwa-master-api-bearer-token
```

Terraform reads the secret via a `for_each` data source in `shipsolid/main.tf` — no code changes
needed. The full KV secret name is `grafana-<stack_slug>-<bearer_token_kv_slug>`. Pre-populate the
secret in AKV before applying.

### Probe IDs

| ID  | Region                       |
| --- | ---------------------------- |
| 44  | `grafana-prod-44` (EU)       |
| 45  | `grafana-prod-45` (US East)  |
| 106 | `grafana-prod-106` (US West) |

---

## Terraform environments

`terraform_envs` controls which Terraform stacks deploy a product. Products are filtered at plan
time:

```hcl
# In environments/shipsoliddev/main.tf
local.products = { for k, v in yamldecode(...).products : k => v if contains(v.terraform_envs, "shipsoliddev") }
```

| Environment    | Directory                    | Grafana stack  | Scope                                                      |
| -------------- | ---------------------------- | -------------- | ---------------------------------------------------------- |
| `shipsoliddev` | `environments/shipsoliddev/` | Non-prod stack | dev, qa, train environments                                |
| `shipsolid`    | `environments/shipsolid/`    | Prod stack     | prod environments (and any envs needing prod-level access) |

Validate all changes in `shipsoliddev` before promoting to `shipsolid`.

---

## Team membership

Each product defines its team inline in `products.yml` under `team:`. There is no separate teams
file.

`team.members` is a list of individual Grafana login emails (Azure AD UPN format). Users must have
logged into the Grafana instance via SSO at least once before Terraform can add them.

The SRE team always receives Admin on every folder regardless of product team role.

---

## Frontend Observability (Faro)

Products using Grafana Faro for browser/frontend telemetry include a `faro` block at the product
level:

```yaml
faro:
  app_id: <numeric-app-id>          # assigned in Grafana Cloud UI → Frontend Observability → Apps
  collection_url: https://faro-collector-<region>.grafana.net/collect/<token>
  api_endpoint: https://faro-api-<region>.grafana.net/faro/api/v1
```

The Faro app is registered manually in the Grafana Cloud UI. Terraform then writes `collection_url`,
`api_endpoint`, `app_id`, and a sourcemap token into Azure Key Vault for CI/CD and frontend team
consumption.

KV secret naming (all prefixed `grafana-{stack_slug}-faro-{product}-`):

| Suffix            | Purpose                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| `collection-url`  | Faro SDK collector endpoint — injected into the frontend app at build time |
| `api-endpoint`    | Faro REST API base URL — used for sourcemap uploads                        |
| `app-id`          | Numeric app ID within Frontend Observability                               |
| `sourcemap-token` | Cloud Access Policy token with `sourcemaps:read/write/delete` scopes       |

Currently `signal-forge` has a fully populated `faro` block (app ID 128, `shipsoliddev` stack).
`mdixai` has a placeholder block for future onboarding — populate `app_id` and `collection_url`
after registering the app in the Grafana Cloud UI.

---

## How to: add a new environment to an existing product

**Example:** adding `ieo-qa` (IEO on AKS, qa environment).

**1. Update `products.yml`** — set `status: active` and fill in the environment block:

```yaml
ieo:
  environments:
    qa:
      status: active
      deployment_environment: ieo-qa
      use_contact_points:
        - teams-aks-ieo-nonprod
      clusters:
        - cluster_name: <qa-cluster-name>
          subscription_id: <subscription-id>
          resource_group: <resource-group>
          namespace: ieo-sre-monitoring-ns-qa
          credentials_secret: AZURE_CREDENTIALS_IEO_QA
```

**2. Add a synthetic check** (optional) — add a `synthetics:` block under the environment and place
the K6 script at `grafana_tf/synthetics/ieo/qa.js` for browser checks.

**3. Run the generator** — regenerate and commit the updated JSON files:

```bash
python grafana_tf/tools/generate.py
git add grafana_tf/alert_rules/generated/ grafana_tf/dashboards/generated/
```

**4. Run `terraform plan` on `shipsoliddev`** — verify the expected alert rules and dashboards
appear, then apply.

**5. Promote to `shipsolid`** when the environment targets the prod stack.

No changes to any `.tf` file are needed. Alert groups, dashboards, LBAC rules, and notification
routes are all auto-derived from `products.yml`.

---

## How to: onboard a new product

**1. Determine the platform** (`aks`, `aca`, or `onprem`) — platform drives default flavours.
Explicit `dashboard_flavours` / `alert_flavours` override the default.

**2. Add the product block to `products.yml`** — use an existing product of the same platform as a
template. Set `status: planned` for environments not yet wired.

```yaml
my-product:
  platform: aks
  team:
    name: "My Product Team"
    email: "myteam@shipsolid.com"
    dashboardRole: Editor
    members: []
  terraform_envs: [shipsoliddev]   # add shipsolid when prod environments are ready
  grafana:
    folder_key: golden-aks-my-product
    folder_title: Golden-AKS-MyProduct
    # dashboard_flavours and alert_flavours are optional — platform defaults apply
  environments:
    dev:
      status: active
      deployment_environment: my-product-dev
      use_contact_points:
        - teams-my-product-nonprod
```

**3. Run the generator** — regenerate and commit the updated JSON files:

```bash
python grafana_tf/tools/generate.py
git add grafana_tf/alert_rules/generated/ grafana_tf/dashboards/generated/
```

**4. Add product alert JSON files** (for `products/<name>` flavour) — place files in
`grafana_tf/alert_rules/products/my-product/`. Use dash-separated filenames (`my-product-dev.json`).
They are auto-scanned and used as-is (not rendered by the generator).

**5. Run `terraform plan` on `shipsoliddev` first** — verify dashboards, alert groups, folder, team,
and LBAC rules are as expected. Apply, then validate in the UI.

**6. Add to `shipsolid`** — change `terraform_envs` to `[shipsoliddev, shipsolid]`, run the
generator again, and apply to shipsolid when prod environments are onboarded.

---

## Current product status

| Product      | Platform | dev    | qa      | train   | prod    | Synthetics                  | Faro                  |
| ------------ | -------- | ------ | ------- | ------- | ------- | --------------------------- | --------------------- |
| daia         | aks      | active | active  | —       | planned | —                           | —                     |
| ieo          | aks      | active | planned | —       | planned | —                           | —                     |
| mdixai       | aca      | active | active  | active  | active  | browser (all envs)          | placeholder           |
| passport     | aca      | active | active  | planned | planned | —                           | —                     |
| hwa          | onprem   | active | —       | —       | active  | browser + http + tcp (prod) | —                     |
| ot           | onprem   | global | —       | —       | —       | —                           | —                     |
| signal-forge | aks      | active | —       | —       | —       | —                           | active (shipsoliddev) |
