---
title: "Technical Design — grafana_tf Platform"
description: "`grafana_tf/` is the Terraform-based control plane for ShipSolid Foods' Grafana Cloud observability"
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202604280014-7"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/lbac
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/key-vault-secrets
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/cicd
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf-how-to
    kind: related
---

## Technical Design — `grafana_tf` Platform

> **Status:** Documenting existing system as of 2026-04-27. **Audience:** ShipSolid SRE engineers,
> observability platform contributors. **Scope:** The `grafana_tf/` Terraform platform that manages
> ShipSolid Foods' Grafana Cloud observability stacks. **Owner:** SRE / Observability.

---

## 1. Context

### 1.1 What this is

`grafana_tf/` is the Terraform-based control plane for ShipSolid Foods' Grafana Cloud observability
footprint. It manages two Grafana Cloud tenants — `shipsoliddev` and `shipsolid` — and provisions,
configures, and reconciles every resource that lives inside them: stacks, access policies, service
accounts, data sources, dashboards, alert rules, contact points, notification routing, RBAC, LBAC,
SLOs, OnCall schedules, and synthetic checks.

It is the **deployment layer**. The agent layer (Alloy on AKS via `grafana_k8s/`) and the
application instrumentation layer (OTel SDKs in product code) are separate and out of scope here,
except where this platform produces credentials or endpoints they consume.

### 1.2 Why this design exists

ShipSolid's observability footprint expanded from a single demo tenant to:

- Two production-grade Grafana Cloud stacks segregated by environment risk (dev vs prod).
- 7+ onboarded products (DAIA, IEO, MDIxAI, HWA, Passport, Signal Forge, OT plants).
- Three application environments per product (`dev`, `qa`/`staging`, `prod`).
- Hybrid telemetry sources — AKS clusters, Azure Container Apps, on-prem OT plants, SAP HWA.
- Enterprise concerns: per-team data isolation, drift detection, audited promotion, secret hygiene.

Click-ops in the Grafana UI does not survive that scale. The platform exists to make every change
reviewable, reproducible, and reversible.

### 1.3 Where it sits

```
                ┌────────────────────────────────────────────────┐
                │              products.yml (SoT)                 │
                │   meta + products + per-stack LBAC + Faro       │
                └─────────────────────┬───────────────────────────┘
                                      │
                ┌─────────────────────┴───────────────────────────┐
                │     tools/generate.py  (Jinja2 generator)        │
                │   templates → alert_rules/generated/<stack>/     │
                │              dashboards/generated/<stack>/       │
                └─────────────────────┬───────────────────────────┘
                                      │
        ┌─────────────────────────────┴────────────────────────────┐
        │              environments/{shipsoliddev,shipsolid}/             │
        │      Terraform root modules — wiring + KV writes          │
        └──────┬─────────────────────┬─────────────────────┬───────┘
               │                     │                     │
        ┌──────▼──────┐       ┌──────▼──────┐       ┌─────▼─────┐
        │  Grafana    │       │  Grafana    │       │   Azure    │
        │  Cloud API  │       │  Instance   │       │  Key Vault │
        │ (stacks,APs)│       │ (DS, dash., │       │ (tokens,   │
        │             │       │ alerts,RBAC)│       │ endpoints) │
        └─────────────┘       └─────────────┘       └────────────┘
```

The platform consumes one source of truth (`products.yml`), produces deterministic artifacts
(generated JSON), and applies them through Terraform to two destinations (Grafana Cloud and Azure
Key Vault).

---

## 2. Goals

### 2.1 Functional

| #   | Goal                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------- |
| F1  | Manage two Grafana Cloud stacks (`shipsoliddev`, `shipsolid`) from one codebase with structurally identical wiring.   |
| F2  | Onboard a new product by editing `products.yml` only — no `.tf` changes for routine onboarding.                       |
| F3  | Generate dashboards and alert rules from per-platform Jinja2 templates (AKS, ACA, on-prem OT, SAP HWA).               |
| F4  | Enforce per-team Label-Based Access Control on Mimir and Loki, scoped by `deployment_environment`.                    |
| F5  | Provision Azure AD SSO with JMESPath role mapping (Admin / Editor / Viewer).                                          |
| F6  | Provision contact points (Teams, email, BigPanda webhook), notification routing, mute timings, and OnCall escalation. |
| F7  | Write all Terraform-generated tokens and stack endpoints to Azure Key Vault for downstream Alloy and CI/CD consumers. |
| F8  | Detect drift on a daily cadence per stack and fail loudly.                                                            |
| F9  | Gate `shipsolid` (production) applies behind reviewer approval; allow `shipsoliddev` to flow with lighter checks.     |

### 2.2 Non-functional

| #   | Goal                                                                                                                   | How it's measured / met                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| N1  | **Idempotency** — re-running apply on unchanged inputs produces zero changes.                                          | `tf.sh drift` daily across both stacks.                                             |
| N2  | **Reproducibility** — checking out any commit and applying to a fresh stack reproduces the same config.                | Pre-generated artifacts committed; CI re-runs generator and `git diff --exit-code`. |
| N3  | **Reviewability** — every change shows up as a `terraform plan` diff readable by an SRE peer.                          | PR template requires plan output.                                                   |
| N4  | **Blast radius containment** — bad change in `shipsoliddev` cannot affect `shipsolid`.                                 | Separate state files, separate provider tokens, separate apply workflows.           |
| N5  | **Secret hygiene** — no secret committed to git; runtime credentials live in Key Vault or `.env` (gitignored).         | Pre-commit `checkov`; `.gitignore` covers `.env` and `terraform.tfvars`.            |
| N6  | **Plan-time independence** — Terraform plan must not require KV reads (KV is write-only from TF's view).               | Reviewed in §4.9.                                                                   |
| N7  | **Module reusability** — every reusable concern is a module under `modules/` with `variables.tf`, `outputs.tf`, tests. | 14 modules, all with `tests/*.tftest.hcl`.                                          |

---

## 3. Non-Goals

| #   | Non-goal                                                                                    | Why                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| NG1 | Manage Alloy agent deployment from this codebase.                                           | Alloy lives in `grafana_k8s/` (AKS Helm) and is owned by the agent layer. `grafana_tf/k8s/` is a discoverability mirror only.                                                                                                                                    |
| NG2 | Provision the Mimir or Loki LBAC data sources via Terraform.                                | Grafana Cloud silently ignores `grafana_data_source_permission` and `grafana_data_source_config_lbac_rules` on TF-provisioned sources (Gaps 1 & 3, confirmed by Grafana support 2026-04). Created manually in the UI; UID captured in `products.yml`. See [[lbac | docs/lbac.md]]. |
| NG3 | Manage application-level OTel instrumentation, OTel Collector configs, or per-app sampling. | Owned by product teams.                                                                                                                                                                                                                                          |
| NG4 | Provision Azure Key Vault itself or its access policies.                                    | Pre-existing infra (`mf-cc-dt-azrsrp-prd-kv`). TF only writes secrets.                                                                                                                                                                                           |
| NG5 | Bidirectional sync with the Grafana UI.                                                     | One-way: code is the source of truth. UI changes are drift and must be re-imported or reverted.                                                                                                                                                                  |
| NG6 | Manage frontend Faro app `app_id` / `collection_url`.                                       | Configured per app in Grafana Cloud UI → Frontend Observability. Terraform only manages the stack-level Faro API endpoint and the sourcemap upload token.                                                                                                        |
| NG7 | Multi-region.                                                                               | Both stacks are `prod-us-central-0`. Multi-region failover is not a current requirement.                                                                                                                                                                         |

---

## 4. Design

### 4.1 Repository topology

```
grafana_tf/
├── products.yml                  # Single source of truth
├── tools/                        # Jinja2 generator + stack registry
├── alert_rules/
│   ├── templates/                # Jinja2 sources ([[ ]] delimiters)
│   ├── generated/<stack>/        # Committed output of generate.py
│   └── products/<prod>/          # Hand-crafted JSON (not generated)
├── dashboards/
│   ├── templates/                # Jinja2 sources
│   └── generated/<stack>/        # Committed output
├── alloy-configs/templates/      # Alloy pipelines (consumed by Fleet Management — planned)
├── synthetics/                   # k6 browser scripts (consumed by SM module — planned)
├── environments/
│   ├── shipsoliddev/                # Root module — dev stack
│   └── shipsolid/                   # Root module — prod stack
├── modules/                      # 14 reusable modules
├── k8s/                          # Mirror of grafana_k8s/ (discoverability only)
├── scripts/                      # bootstrap, import, export, get-lbac-uids
├── docs/                         # 8 specialised reference docs (this is the 9th)
├── tf.sh                         # Primary CLI wrapper
└── Makefile                      # tf.sh equivalent for make muscle-memory
```

The shape is deliberate: **one source of truth, one generator, two roots, many modules,
deterministic artifacts**.

### 4.2 Two-stack codebase

`environments/shipsoliddev/` and `environments/shipsolid/` are two root modules that are
**structurally identical** — same modules called in the same order with the same wiring. They differ
only in:

- `terraform.tfvars` — credentials, tenant IDs, stack slug.
- `backend.tf` — Azure blob state key (`shipsoliddev/terraform.tfstate` vs
  `shipsolid/terraform.tfstate`).
- Display names in `module.stack` (e.g. `"ShipSolid Foods Observability (Dev)"` vs
  `"ShipSolid Foods Observability"`).

**Rationale.** Terraform workspaces were rejected because:

1. Workspaces share a backend file path prefix — a misconfigured CLI could cross-apply.
2. Provider aliases need different tokens per stack; passing them through workspace conditionals is
   brittle.
3. State locking and concurrency are clearer with fully separated state files.
4. CI workflow gating (different approvers for dev vs prod) maps to separate working directories
   naturally.

**Promotion rule.** Every change lands in `shipsoliddev` first, gets validated, then is applied to
`shipsolid`. With VCS-driven TFC workspaces, the rule is enforced by humans confirming applies in
order in the TFC UI — `grafana-tf-shipsoliddev` first, validate behaviour, then
`grafana-tf-shipsolid`. Peer review enforces the same rule at the PR level.

**Drift between stacks** is acceptable when intentional — e.g. `signal_forge` is
`shipsoliddev`-only, gated via `terraform_envs: [shipsoliddev]` in `products.yml`. The
`module.computed.products` filter handles this transparently.

### 4.3 Provider aliases

Each root configures four (currently three active) Grafana provider aliases. Each module declares
which alias it needs in its `providers = {}` block:

| Alias                                                           | Auth                          | Resources                                                                                                        |
| --------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `grafana.cloud`                                                 | `cloud_access_policy_token`   | `grafana_cloud_stack`, `grafana_cloud_access_policy`, `grafana_cloud_access_policy_token`, plugin installations. |
| `grafana.instance`                                              | `grafana_sa_token` (Admin SA) | Dashboards, data sources, alerting, RBAC, LBAC, SLOs, SSO.                                                       |
| `grafana.oncall`                                                | SA token + `oncall_url`       | OnCall schedules, escalation chains, integrations.                                                               |
| `grafana.sm` _(unused)_ / `grafana.sm_with_cloud` _(commented)_ | SA + SM token + cloud token   | Synthetic Monitoring — blocked on a valid `sm_access_token` from the Cloud UI.                                   |

**Why split.** The Grafana provider's API surface is heterogeneous: Cloud-level resources need a
Cloud Access Policy token; instance-level resources need a stack-scoped Service Account token;
OnCall needs a separate base URL; Synthetic Monitoring needs a third token type plus the cloud token
for the installation resource. Collapsing them into one provider config means smuggling unused
credentials into modules that don't need them — a needless secret-handling surface.

Bootstrap variables (`cloud_access_policy_token`, `grafana_sa_token`, `sm_access_token`) live in
`terraform.tfvars` rather than Key Vault because Terraform resolves provider configurations
**before** any data sources can be read. They cannot be deferred. This is documented and accepted
(see §4.9).

### 4.4 `products.yml` — the single source of truth

`products.yml` has two top-level keys:

- **`meta:`** — shared/admin entries (`sre`, `visitors`). Not "products" but participate in teams
  and contact points. `meta.sre.<stack>.lbac_datasources` carries the per-stack LBAC DS metadata;
  `meta.sre.<stack>.faro_api_endpoint` carries the Faro REST URL.
- **`products:`** — every onboarded product. Each entry drives:

| Field                                       | Drives                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `terraform_envs`                            | Which stacks render this product. Filtering happens in `module.computed`.                                |
| `platform`                                  | `aks` / `aca` / `onprem` / `sap` — picks the default `alert_flavours` and influences template selection. |
| `environments.<env>`                        | One environment per active deployment. `status: active` gates inclusion.                                 |
| `environments.<env>.deployment_environment` | The label value emitted on every signal — drives LBAC scoping and dashboard filters.                     |
| `environments.<env>.alert_flavours`         | Override for default platform alerts; values like `aks/standard`, `products/ot`, `sap/hwa`.              |
| `dashboard_flavours`                        | Which template directories to render against this product.                                               |
| `contact_points`                            | Definitions per type (`teams`, `webhook`, `email`, `bigpanda`). Webhook URLs are inline (no KV).         |
| `use_contact_points`                        | Per-environment routing list — index 0 wins as primary, rest get extra notification routes.              |
| `team`                                      | Grafana team membership and dashboard role.                                                              |
| `oncall`                                    | Schedule, escalation timing, members.                                                                    |
| `synthetics`                                | Per-environment SM checks.                                                                               |

**Constraint: snake_case keys.** Contact point map keys must use underscores (`teams_sre_critical`,
not `teams-sre-critical`). Terraform's `for_each` map iteration handles hyphens poorly when the key
is referenced downstream. This is enforced by convention — there is no validator yet.

**Why YAML.** Equivalent to JSON for the data model, but supports comments, anchors, and is far more
forgiving to hand-edit. Product onboarders rarely need to look at `.tf` — they edit YAML.

### 4.5 `observability-stack` — the data hub

modules/observability-stack/main.tf is a **pure data module**: no resources, no providers, just
locals. Both root modules call it as `module.computed`, passing only `terraform_env` and
`stack_slug`.

It reads `products.yml` once via `yamldecode(file(...))` and exposes:

| Output                          | Purpose                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `products`                      | `products:` filtered to current `terraform_env`.                                         |
| `teams`                         | All teams from `meta:` ∪ `products:` (unfiltered — `sre` and `visitors` always present). |
| `product_folders`               | Map for `module.dashboards`.                                                             |
| `product_dashboards`            | Auto-scanned from `dashboards/generated/<terraform_env>/`.                               |
| `standard_alert_groups_flat`    | Auto-scanned from `alert_rules/generated/<terraform_env>/`.                              |
| `product_explicit_alert_groups` | Auto-scanned from `alert_rules/products/<name>/`.                                        |
| `contact_points`                | Merged from all entries (so SRE shared contacts are available product-side).             |
| `extra_notification_routes`     | Per-product extra routes for `use_contact_points[1+]`.                                   |
| `product_oncall_configs`        | OnCall configs filtered to `oncall.enabled = true`.                                      |
| `lbac_datasources`              | Per-stack LBAC DS metadata (Mimir + Loki).                                               |
| `faro_api_endpoint`             | Stack-level Faro REST URL.                                                               |

**Why a pure-data module.** Three benefits:

1. **DRY across roots** — both `shipsoliddev` and `shipsolid` call the same module; the wiring
   becomes "wire `module.computed.X` into `module.Y`".
2. **No provider lock-in** — because it has no resources, it doesn't need a provider; root modules
   don't have to thread provider aliases through it.
3. **Easy to test in isolation** — the locals can be inspected via `terraform console` without
   applying anything.

The module deliberately does not own any side effects. Adding resources to it is a code smell — they
belong in a domain module.

### 4.6 Jinja2 generation pipeline

tools/generate.py renders `*.json.j2` templates from `alert_rules/templates/` and
`dashboards/templates/` into JSON files under `alert_rules/generated/<stack>/` and
`dashboards/generated/<stack>/`. Output is **committed**, not gitignored.

#### Why pre-generate (not render at apply time)

| Option                                       | Why rejected / accepted                                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Render in Terraform via `templatefile()`** | Jinja2 has loops, conditionals, filters that HCL's `templatefile()` doesn't. Equivalent rewrites would be ugly and error-prone.                               |
| **Render at apply time via local-exec**      | Plan would be misleading — JSON wouldn't exist until apply. CI plan-on-PR would lie.                                                                          |
| **Pre-generate in CI, don't commit**         | First-time contributors couldn't see what TF actually applies. Diff review would be impossible.                                                               |
| **Pre-generate and commit** ✅               | Plan reflects exactly what apply will do. PR review shows JSON diff alongside template diff. CI sync check (`git diff --exit-code`) catches stale generated/. |

#### Delimiter choice

Templates use `[[ ]]` instead of Jinja2's default `{{ }}`. This avoids collisions with Grafana
annotation syntax (`{{ $labels.foo }}`) inside the rendered JSON.

#### Variables

| Variable                                                                     | Source                                                                                                           |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `[[ uid_prefix ]]`                                                           | `tools/stacks.yml` (per-stack registry: `shipsoliddev`, `shipsolid`).                                            |
| `[[ deployment_environment ]]`                                               | `products.yml` `environments.<env>.deployment_environment`.                                                      |
| `[[ deployment_env_regex ]]`                                                 | `products.yml` `grafana.dashboard_env_regex`.                                                                    |
| `[[ contact_point ]]`                                                        | First entry in `environments.<env>.use_contact_points`.                                                          |
| `[[ datasource_uid ]]`                                                       | Default `mimir-<uid_prefix>`; overridden by `meta.sre.<stack>.lbac_datasources.mimir.uid` if set. Same for Loki. |
| `[[ env_short ]]`, `[[ prod_key ]]`, `[[ plant_name ]]`, `[[ plant_label ]]` | Derived from `products.yml` keys.                                                                                |

#### CI sync enforcement

The pre-flight workflows (`plan.yml` / `plan-shipsolid.yml`) run the generator and fail the PR with
`git diff --exit-code generated/` if `generated/` is stale relative to templates + `products.yml`.
This makes "forgot to run generate" a fail-fast condition before TFC ever sees the change.

### 4.7 LBAC architecture

LBAC enforces per-team label-based read access on Mimir and Loki. The full architecture is in
[[lbac|docs/lbac.md]]; summarised here.

#### Two enforcement boundaries

| Boundary       | Mechanism                                                                                            | Managed where                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Write path** | Cloud Access Policies with label policies pinning each Alloy writer to its `deployment_environment`. | `module.stack` → `grafana_cloud_access_policy` per env.                       |
| **Read path**  | `grafana_data_source_config_lbac_rules` per (team, datasource) pair.                                 | `module.lbac` → bound to `module.computed.lbac_datasources.{mimir,loki}.uid`. |

#### Gap 1 / Gap 3 (manual data source workaround)

Confirmed by Grafana support, 2026-04: Grafana Cloud silently ignores both
`grafana_data_source_permission` and `grafana_data_source_config_lbac_rules` on
Terraform-provisioned data sources. The TF apply succeeds; the rules are never written.

**Resolution.** The Mimir and Loki data sources used for LBAC are created **manually** in the
Grafana UI with basic auth. The platform handles this with:

1. A read-only `module.datasources` that provisions Tempo + Azure Monitor only, exposing
   `local.uid_mimir` / `local.uid_loki` as string outputs derived from
   `meta.sre.<stack>.lbac_datasources.{mimir,loki}.uid` (or empty until set).
2. A `lbac_datasources_setup` output that returns a JSON checklist after first apply (`name`, `uid`,
   `type`, `default`, `url`, `basic_user`, `password_kv`).
3. A bootstrap sequence per stack:
   - Apply once → tokens written to KV, LBAC bindings no-op (gated by `count = uid != "" ? 1 : 0`).
   - Operator creates Mimir + Loki DS in UI using the checklist + KV password.
   - Operator captures the auto-assigned UIDs back into `products.yml`.
   - Run `./tf.sh generate` so dashboards/alerts pick up the new UIDs.
   - Apply again → LBAC rules bind to the manual sources; everything resolves.

#### Token rotation impact

`ap_mimir_lbac_reader_token` and `ap_loki_lbac_reader_token` are TF-managed. Any apply that
recreates them (e.g. destroy-apply cycle) requires the operator to re-paste the new token into the
manual DS basic-auth password field in the UI. UIDs survive. This is documented in operations.md and
is the main reason `prevent_destroy` is currently `true` on the relevant `module.stack` resources.

#### Auto-provisioned Cloud data sources

Every stack ships with ten `grafanacloud-<stack>-*` data sources that Grafana Cloud Integrations
reconciles. The platform exposes them as deterministic UIDs via `local.cloud_ds_uids` in
`modules/datasources/main.tf` — **never** managed as resources (writes get silently reverted) and
**never** read via `data "grafana_data_source"` (an earlier attempt failed when the API returned 404
for 9/10 UIDs at plan time). They are outside LBAC enforcement, so dashboards prefer
`module.datasources.mimir_uid` / `.loki_uid` over `cloud_datasource_uids.*` unless unscoped Admin
access is intended.

### 4.8 Azure Key Vault integration

Terraform's view of KV is **write-only**: it writes ~14 secrets per stack after apply and reads zero
at plan time.

#### What gets written

Categorised in [[key-vault-secrets|docs/key-vault-secrets.md]]. High-level:

| Category                            | Secrets                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Service-account / API keys          | `grafana-<stack>-sa-terraform-token`, `grafana-<stack>-sa-cloud-api-key`.                                                                        |
| Per-environment Alloy writers       | `grafana-<stack>-alloy-writer-<env>-token` (one per `stack_environments`).                                                                       |
| Stack endpoints + numeric usernames | Mimir, Loki, Tempo, OTLP — endpoint + username pair each. The Mimir endpoint is suffixed with `/api/prom` so consumers use it directly.          |
| LBAC reader tokens                  | `grafana-<stack>-mimir-lbac-reader-token`, `grafana-<stack>-loki-lbac-reader-token` — the basic-auth passwords for the manually-created LBAC DS. |
| Faro                                | `grafana-<stack>-faro-api-endpoint`, `grafana-<stack>-faro-sourcemap-token`.                                                                     |

#### Why write-only

| Option                                      | Why rejected / accepted                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Read all secrets from KV at plan time**   | Breaks plan-time independence. A KV outage would block every plan. KV soft-delete + RBAC adds latency to every plan.          |
| **Read provider-bootstrap secrets from KV** | Impossible — Terraform resolves provider configurations before data sources can be read.                                      |
| **Read contact-point webhook URLs from KV** | Adds an indirection that gives no value: the URLs are not rotated frequently and changing them is a `products.yml` PR anyway. |
| **Write-only + tfvars for bootstrap** ✅    | Plan is fast and deterministic; rotation is explicit and visible in PR diffs.                                                 |

#### Provider-bootstrap exception

`cloud_access_policy_token`, `grafana_sa_token`, and `sm_access_token` live in `terraform.tfvars`
(gitignored). In CI they come from GitHub Actions secrets. They cannot be deferred to KV. This is a
known surface; the mitigation is short-lived rotation via the Cloud UI and TF reapply.

### 4.9 RBAC and SSO

**SSO** (modules/sso/) — Azure AD OAuth2 with JMESPath role mapping. Three Azure AD groups map to
Admin / Editor / Viewer at login. `azure_ad_client_secret` flows in via
`TF_VAR_azure_ad_client_secret` (from `.env` locally, GitHub secret in CI).

**RBAC** (modules/rbac/) —

- One Grafana team per product (sourced from `products.yml`).
- The `sre` team is treated as the admin team — receives a wildcard LBAC rule
  (`{deployment_environment=~".+"}`) for explicit, documented unrestricted access.
- The `visitors` team is created via an explicit merge (it lives in `meta:` and is not in
  `module.computed.products`); receives an empty LBAC scope by default — no data access until
  granted.
- Per-product folder permissions wire `module.dashboards.folder_uids` to `module.rbac` through
  `product_folder_mapping` for each product that declares `grafana.folder_key`.

**Why explicit rules everywhere.** Grafana's default behaviour ("no rules = query all data") is a
fail-open posture. Every team that touches a data source gets an explicit rule — including SRE
(wildcard) and visitors (empty list). This is verified in `module.lbac` by the structure of
`lbac_teams`.

### 4.10 Alerting and OnCall

**Contact points** are merged from `meta:` (shared SRE channels) and `products:` (per-product
channels) by `module.computed.contact_points`. Webhook URLs are inline in `products.yml` — no KV
indirection.

**Notification policy** is single-rooted, with a primary route per product environment derived from
`use_contact_points[0]` (rendered into the alert rule JSON by `tools/generate.py` as
`[[ contact_point ]]`). Indices 1+ produce extra notification routes via
`module.computed.extra_notification_routes` matched on `deployment_environment`.

**Mute timings**, **inhibition**, and **per-tier escalation** are owned by `module.alerting`.

**OnCall** is provider-aliased separately. `module.irm_oncall` reads
`module.computed.product_oncall_configs` (filtered to `oncall.enabled = true`) and creates
schedule + escalation chain + integration. The integration URL is fed back into
`module.alerting.oncall_contact_points`, completing the loop alert-rule → contact-point → OnCall
integration → schedule → escalation.

**Destroy hazard.** The Grafana provider cannot truly delete `grafana_notification_policy`; its
destroy action PUTs TF-state values back, which re-pins the root receiver and causes 409s on
contact-point deletion. `tf.sh destroy` works around this with five pre-destroy steps (reset policy
via API, delete pinned alert rules, remove policy from state, reset again before apply-destroy). See
tf.sh and CLAUDE.md §destroy workflow.

### 4.11 SLOs and Synthetic Monitoring

**SLOs** (modules/slo/) — bound to the built-in `grafanacloud-prom` data source (the SLO plugin
doesn't accept custom DS UIDs). Three baseline SLOs: API availability 99.9%, p99 latency < 500ms,
error rate < 0.1%, with fast/slow burn alerting.

**Synthetic Monitoring** (modules/synthetic-monitoring/) — currently **commented out** in both root
modules. Blocked on `sm_access_token` retrieval from the Cloud UI. The module code is complete and
ready; product checks (`module.computed.product_synthetic_checks`) are wired and waiting. k6 browser
scripts under `synthetics/<product>/<env>.js` are committed.

### 4.12 Fleet Management (planned)

modules/fleet-management/ is scaffolded but inactive. The intended architecture is **one Alloy
pipeline per (stack_environment × signal_type)** — six pipelines total per stack (dev/staging/prod ×
metrics/logs/traces). Templates live in alloy-configs/templates/ and consume KV-stored writer tokens
at agent startup. Activation is gated on Fleet Management API stability and the
`connections_api_access_token` flow.

### 4.13 CI/CD shape

Plan and apply now run in **HCP Terraform** via VCS-driven workspaces — see [[cicd|docs/cicd.md]]
for the full flow. GitHub Actions handles only what TFC does not (pre-flight checks, module-level
testing, lint, security scan). Workflows under `.github/workflows/`:

| Workflow                        | Trigger                                  | Purpose                                                                      |
| ------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `plan.yml`                      | PR on `environments/shipsoliddev/**` etc | Pre-flight only: generator-in-sync + `terraform fmt`. Plan runs in TFC.      |
| `plan-shipsolid.yml`            | PR on `environments/shipsolid/**` etc    | Same pre-flight, scoped to prod paths.                                       |
| `drift.yml`                     | Daily cron                               | Drift detect on `shipsoliddev`. Pending migration to TFC Health Assessments. |
| `drift-shipsolid.yml`           | Daily cron                               | Drift detect on `shipsolid`. Pending migration.                              |
| `test.yml`                      | PR                                       | `terraform test` per module + tflint + checkov.                              |
| `token-expiry.yml`              | Weekly cron                              | Inspects CAP token expiries; warns < 30 days.                                |
| `deploy-grafana-alerts-v1.yml`  | Manual                                   | Legacy alert push (being deprecated by `module.product_alerts`).             |
| `deploy-grafana-k8s.yml`        | Manual / push to `grafana_k8s/**`        | Helm deploy of Alloy to AKS clusters.                                        |
| `deploy-grafana-synthetics.yml` | Manual                                   | Synthetic check deploy (paired with SM activation).                          |
| `deploy-sm-probe.yml`           | Manual                                   | Private probe deploy.                                                        |

**Gating model.** Apply approval lives in TFC: each workspace has its own approver list and
Auto-apply is off for `grafana-tf-shipsolid`. Branch protection on `main` requires `test.yml` +
`plan.yml` (pre-flight) to pass before merge.

### 4.14 Companion tooling — `k8s/` mirror

`grafana_tf/k8s/` is an exact mirror of the repo-root `grafana_k8s/`. The deploy workflow uses
`grafana_k8s/` directly — `grafana_tf/k8s/` exists for discoverability. **Both directories must be
edited together.** This is fragile; see §6 risks.

---

## 5. Alternatives Considered

| Alternative                                                                 | Why rejected                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single root module with Terraform workspaces**                            | Shared backend prefix increases risk of cross-apply; provider tokens differ per stack and don't map cleanly to workspaces; CI gating maps better to separate working dirs.                                                                |
| **Generate JSON at apply time via `local-exec`**                            | `terraform plan` becomes misleading — diff doesn't reflect what apply will do. PR review value drops to zero.                                                                                                                             |
| **Don't commit `generated/`**                                               | First-time contributors can't see what TF actually applies; diff review of dashboard/alert changes becomes impossible.                                                                                                                    |
| **Manage Mimir + Loki LBAC DS via Terraform**                               | Attempted; Grafana Cloud silently no-ops on `grafana_data_source_permission` and `grafana_data_source_config_lbac_rules` for TF-provisioned sources (Gap 1/3). Manual UI creation is the only working path.                               |
| **Read all secrets from KV at plan time**                                   | Breaks plan-time independence; KV outage = global plan outage. Provider-bootstrap secrets cannot be deferred to KV anyway.                                                                                                                |
| **Use `data "grafana_data_source"` for auto-provisioned Cloud DS UIDs**     | Grafana Cloud API returns 404 for 9/10 of these UIDs at plan time. Static map (`local.cloud_ds_uids`) is the working approach.                                                                                                            |
| **Manage the auto-provisioned `grafanacloud-<stack>-*` DS as TF resources** | Grafana Cloud Integrations reconciles them and silently reverts writes. Pure-output static map is the only stable representation.                                                                                                         |
| **One JSON file per alert rule (not per group)**                            | Grafana provisioning API v1 is group-scoped; one-rule-per-file would mean fragmenting groups. Current `<prod_key>-<env_key>.json` per group matches the API's natural unit.                                                               |
| **`prevent_destroy = true` on all stacks/data sources today**               | Currently `false` until GitHub Actions CI/CD is fully wired. With manual destroy-and-rebuild still in the workflow, `prevent_destroy = true` would block legitimate operator actions. Will flip to `true` once CI is the only apply path. |

---

## 6. Risks and Mitigations

| #   | Risk                                                                                                        | Likelihood          | Impact                                                                                                                    | Mitigation                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Manual LBAC DS in Grafana UI drifts (someone edits basic-auth, URL, or default flag).                       | Medium              | LBAC silently fails open or DS auth breaks.                                                                               | Read-only `scripts/get-lbac-uids.sh` for verification; runbook for re-paste after token rotation; future: nightly verification job.                                     |
| R2  | LBAC reader token rotated by TF (destroy-apply cycle), not re-pasted into UI.                               | Medium              | "Authentication to data source failed" on Mimir/Loki dashboards.                                                          | `prevent_destroy = true` on token resources today; `lbac_datasources_setup` output advertises `password_kv`; operations.md has the runbook.                             |
| R3  | Generator drift — `products.yml` changed but `generated/` not regenerated and committed.                    | Medium              | Stale dashboards/alerts; CI catches but only after PR.                                                                    | CI `git diff --exit-code` after `generate.py`; pre-commit hook (planned) would catch locally.                                                                           |
| R4  | `prevent_destroy = false` on `grafana_cloud_stack` allows accidental stack destroy.                         | Low                 | Catastrophic — full stack rebuild + LBAC re-bootstrap.                                                                    | `tf.sh destroy` requires typing the stack name as confirmation; will flip to `prevent_destroy = true` once CI is the only apply path.                                   |
| R5  | Provider-bootstrap secrets in `terraform.tfvars`.                                                           | Low                 | Token leakage if `.tfvars` accidentally committed.                                                                        | `.gitignore` covers `*.tfvars`; pre-commit `checkov`; short rotation cadence; CI uses GitHub secrets, not files.                                                        |
| R6  | `k8s/` and `grafana_k8s/` drift apart.                                                                      | Medium              | Silent — workflows use `grafana_k8s/`, edits to `grafana_tf/k8s/` have no runtime effect; reverse is missed in PR review. | Convention only today. Future: pre-commit hook to enforce identity, or symlink.                                                                                         |
| R7  | Snake_case-only contact-point keys silently violated.                                                       | Low                 | `for_each` map references resolve incorrectly; runtime breakage.                                                          | Convention; future: schema validator on `products.yml` in CI.                                                                                                           |
| R8  | Notification-policy destroy cannot fully delete (Grafana provider limitation).                              | High during destroy | 409s on contact-point deletion mid-apply.                                                                                 | `tf.sh destroy` runs five-step pre-destroy reset; documented in CLAUDE.md and operations.md.                                                                            |
| R9  | Auto-provisioned `grafanacloud-<stack>-*` DS UIDs change between Grafana Cloud releases.                    | Very low            | Static map in `modules/datasources/main.tf` becomes wrong; dashboards using `cloud_datasource_uids.*` break.              | Annual review during provider bumps. Most dashboards use `module.datasources.mimir_uid` / `.loki_uid` instead.                                                          |
| R10 | Two stacks share one Key Vault — wrong stack slug overwrites another stack's secrets.                       | Very low            | Cross-stack credential corruption.                                                                                        | Naming convention `grafana-<stack_slug>-*` enforced in resource definitions; stack slug comes from `var.stack_slug` (per-root); no manual concatenation in module code. |
| R11 | `shipsoliddev`-only products (`signal_forge`) accidentally get `terraform_envs: [shipsoliddev, shipsolid]`. | Low                 | Premature prod onboarding without validation.                                                                             | PR review; `plan-shipsolid.yml` would surface in plan.                                                                                                                  |

---

## 7. Rollout / Operational Model

### 7.1 Stack bootstrap (greenfield)

Per stack, one-time:

1. Create the Grafana Cloud stack manually (Cloud UI → Stacks → New). Capture `stack_slug` and
   obtain a Cloud Access Policy admin token.
2. Populate `environments/<stack>/terraform.tfvars` from `.example` and `.env` from `.env.example`.
3. `./tf.sh init <stack>`.
4. `./tf.sh apply <stack>` — first apply: stack resources, SSO, RBAC, dashboards, alerts, KV writes.
   LBAC bindings no-op.
5. Pull the LBAC checklist: `./tf.sh output lbac_datasources_setup <stack>`.
6. In Grafana UI, create Mimir + Loki data sources using the checklist values + KV-fetched
   basic-auth passwords. Capture the auto-assigned UIDs.
7. Update `products.yml` `meta.sre.<stack>.lbac_datasources.{mimir,loki}.uid` with the captured
   UIDs.
8. `./tf.sh generate` → commit regenerated `dashboards/generated/<stack>/` and
   `alert_rules/generated/<stack>/`.
9. `./tf.sh apply <stack>` — second apply: LBAC bindings activate; dashboards and alerts resolve.

### 7.2 Product onboarding

Per [[grafana-tf-how-to|docs/how-to.md]]:

1. Add the product entry to `products.yml`: `terraform_envs`, `platform`, `environments`, `team`,
   `contact_points`, `dashboard_flavours`, `alert_flavours`, optional `oncall`.
2. If a dashboard or alert template is needed, add or modify under `dashboards/templates/` or
   `alert_rules/templates/`.
3. `./tf.sh generate` → commit updated `generated/` files.
4. Open PR → TFC posts a speculative plan as a status check on the PR; review it there.
5. Merge → TFC creates a non-speculative plan on `grafana-tf-shipsoliddev`; confirm in TFC UI to
   apply.
6. After validation in `shipsoliddev`, open the `grafana-tf-shipsolid` workspace in TFC and confirm
   the prod apply.

**No `.tf` changes** are needed for routine onboarding. New custom modules need the full
module-onboarding sequence in CLAUDE.md.

### 7.3 Promotion (`shipsoliddev` → `shipsolid`)

- Same commit applies to both stacks; the codebase is identical.
- After merge to `main`, TFC queues a plan on each workspace whose trigger paths matched. A reviewer
  confirms `grafana-tf-shipsoliddev` first.
- `grafana-tf-shipsolid` apply requires a separate explicit confirm in the TFC UI by an authorised
  approver. Workspace **Auto-apply** must remain off for prod.
- Drift detection runs daily on both stacks independently.

### 7.4 Token rotation

- **Cloud Access Policy tokens (TF-managed):** rotation = `terraform apply` after editing the
  resource (or recreating). Triggers re-write to KV; consumers pick up new tokens at next pod
  restart.
- **`grafana_sa_token` (provider bootstrap):** rotated in Cloud UI → update `terraform.tfvars` (or
  GitHub secret) → next apply.
- **LBAC reader tokens:** rotated by destroy-apply only; re-paste into the UI is required
  afterwards. Avoid unless intentional.
- **Faro sourcemap token:** 1-year `expires_at`, `lifecycle.ignore_changes = [expires_at]` so it
  doesn't churn the plan; explicit rotation = taint and reapply.

### 7.5 Drift detection

- Daily workflows run `terraform plan -detailed-exitcode` per stack.
- Non-zero exit code = drift. Job fails, posts to Teams via the SRE notification channel.
- Common drift sources: someone edited a dashboard in the UI, contact point modified, plugin
  auto-updated. Resolution: import or revert.

---

## 8. Open Questions / Future Work

| #   | Item                                                                                     | Notes                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ1 | Activate Synthetic Monitoring.                                                           | Blocked on `sm_access_token` retrieval from Cloud UI. Module code complete.                                                                                                       |
| OQ2 | Activate Fleet Management.                                                               | Blocked on Fleet Management API stability + `connections_api_access_token` flow. Templates ready in `alloy-configs/`.                                                             |
| OQ3 | Flip `prevent_destroy = true` on `grafana_cloud_stack` and data sources.                 | Once GitHub Actions is the only apply path.                                                                                                                                       |
| OQ4 | Replace `terraform.tfvars` provider-bootstrap secrets with GitHub Actions secrets fully. | Local development still needs `.env`; CI already uses secrets. Cleanup = removing `terraform.tfvars` from `environments/` and documenting the local `.env` flow as the only path. |
| OQ5 | Schema-validate `products.yml`.                                                          | Catches snake_case violations, missing required fields, invalid `alert_flavours`. JSON Schema + pre-commit hook.                                                                  |
| OQ6 | De-duplicate `k8s/` and `grafana_k8s/`.                                                  | Either symlink or pre-commit hook to enforce identity. Symlink breaks Windows checkouts; pre-commit is safer.                                                                     |
| OQ7 | Nightly LBAC verification job.                                                           | Query Mimir + Loki DS via API, compare basic-auth user / URL / default flag against `lbac_datasources_setup` checklist; alert on drift.                                           |
| OQ8 | Per-team folder permissions are coarse (Editor / Viewer at folder root).                 | Sub-folder ACLs are not modelled. Add when a product needs to gate "ops" vs "developer" sub-views.                                                                                |
| OQ9 | Multi-region failover.                                                                   | Not in scope; would require duplicating stacks per region and routing telemetry.                                                                                                  |

---

## 9. Glossary

| Term                                                                                | Meaning                                                                                                                                                |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stack** (Grafana Cloud)                                                           | A tenant — `shipsoliddev` or `shipsolid`. Each is a separate Grafana Cloud stack with its own URL, API, data sources, and state file.                  |
| **Environment** (application)                                                       | A `deployment_environment` label value — `dev`, `staging`, `qa`, `prod`. Both stacks receive telemetry from all environments; LBAC enforces isolation. |
| **Product**                                                                         | A `products.yml` entry. Owns a folder, team, environments, dashboards, alerts, contact points, optional OnCall and synthetics.                         |
| **Flavour**                                                                         | A template directory key — `aks/standard`, `aca/standard`, `onprem/ot`, `sap/hwa`, `products/<name>`. Determines which JSON files are rendered.        |
| **[[projects/platform-shipsolid/05-platform-configuration/grafana-tf/lbac\|LBAC]]** | Label-Based Access Control. Per-team rules on Mimir/Loki data sources scoped by `deployment_environment`.                                              |
| **CAP**                                                                             | Cloud Access Policy. Grafana Cloud's IAM primitive; scopes (`metrics:write`, `logs:read`, etc.) + label policies + realm.                              |
| **SoT**                                                                             | Source of truth — `products.yml` for product config; `tools/stacks.yml` for stack registry.                                                            |

---

## 10. References

| Document                 | Topic                              |
| ------------------------ | ---------------------------------- | -------------------------------------------- |
| [[modules                | docs/modules.md]]                  | Module reference, naming, inputs/outputs.    |
| [[grafana-tf-how-to      | docs/how-to.md]]                   | Product, dashboard, alert onboarding.        |
| [[products               | docs/products.md]]                 | `products.yml` schema and flavour system.    |
| [[lbac                   | docs/lbac.md]]                     | LBAC architecture, gaps, troubleshooting.    |
| [[grafana-tf-operations  | docs/operations.md]]               | Token rotation, runbooks, cadences.          |
| [[cicd                   | docs/cicd.md]]                     | CI workflows, secrets, environments, drift.  |
| [[key-vault-secrets      | docs/key-vault-secrets.md]]        | Full KV catalogue.                           |
| [[terraform-capabilities | docs/terraform-capabilities.md]]   | Provider capabilities and known limitations. |
| [[platform-configuration | alloy-configs/README.md]]          | Fleet Management Alloy templates.            |
| [[platform-configuration | README.md]]                        | Quickstart, prereqs, repo layout.            |
| CLAUDE.md                | Conventions and contributor guide. |
