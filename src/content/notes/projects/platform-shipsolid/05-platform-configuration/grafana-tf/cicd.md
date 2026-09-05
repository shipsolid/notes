---
title: "grafana_tf — CI/CD Workflows"
description: "The platform runs on **HCP Terraform (TFC) with VCS-driven workspaces**."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202604282354"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/system-design
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/key-vault-secrets
    kind: related
---

## CI/CD Workflows

The platform runs on **HCP Terraform (TFC) with VCS-driven workspaces**. TFC clones the repo, runs
`terraform plan` / `apply` on its own runners, and posts results as GitHub status checks. GitHub
Actions handles the things TFC does not — generator-in-sync guard, `terraform fmt`, module unit
tests, lint, security scan.

## Promotion Flow

```text
feature branch
    │
    ├─ PR opened against main
    │    ├─ GH Actions: pre-flight checks (generator + fmt + module tests)
    │    └─ TFC speculative plans (shipsoliddev + shipsolid) → posted as status checks
    │
    ▼
merge to main
    │
    ├─ TFC plan (non-speculative) on grafana-tf-shipsoliddev → manual confirm in TFC UI → apply
    │
    ▼
validate in shipsoliddev UI
(dashboards render, alerts fire, SLOs appear, OnCall routing works)
    │
    ▼
TFC plan on grafana-tf-shipsolid → manual confirm in TFC UI → apply
```

`shipsoliddev` → `shipsolid` promotion is enforced by humans confirming in the TFC UI in that order.

## TFC workspaces

| Workspace                 | Stack                    | Working Directory           | Execution    | Apply mode     |
| ------------------------- | ------------------------ | --------------------------- | ------------ | -------------- |
| `grafana-tf-shipsoliddev` | `shipsoliddev`           | `environments/shipsoliddev` | Remote (TFC) | Manual confirm |
| `grafana-tf-shipsolid`    | `shipsolid` (production) | `environments/shipsolid`    | Remote (TFC) | Manual confirm |

Both are **VCS-connected** to `ShipSolidFoods/sre-grafana-cloud-tf` on the `main` branch.
Speculative plans on PRs are enabled. Trigger paths (TFC UI → Workspace → Settings → Version
Control) should include:

```text
environments/<stack>/**
modules/**
dashboards/generated/<stack>/**
alert_rules/generated/<stack>/**
products.yml
tools/stacks.yml
```

The two stacks have disjoint trigger paths so a `shipsoliddev`-only change doesn't auto-plan
`shipsolid`.

## Variables in TFC

TFC's runner runs Terraform — GitHub Actions secrets do not reach it. `terraform.tfvars` is
gitignored, so it isn't cloned by TFC either. **Every variable consumed by `terraform plan` /
`apply` must be set in TFC.** If you skip this, plan runs fail with
`Error: No value for required variable` for each unbound input.

### Two distinctions that matter

|                       | What it means                                                                                                                                                                 | Where Terraform looks                                                                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Variable category** | Each TFC variable is either **Terraform** or **Environment**.                                                                                                                 | Terraform-category vars bind to `variable "X" {}` blocks. Environment-category vars become shell `$X` on the runner — these are for provider auth (e.g. `ARM_*` for `azurerm`), not Terraform inputs.                             |
| **Scope**             | A variable lives at **workspace** scope or in a **Variable Set** attached to one or more workspaces. Variable Sets save you from typing the same secret into every workspace. | Workspace-scoped values override Variable Set values for that key. Use workspace scope for values that differ per stack (`stack_slug`, `grafana_url`); use a Variable Set for values shared across both stacks (everything else). |

A Variable Set is **inert until attached** — creating it isn't enough. Open the Variable Set →
**Workspaces** tab → confirm both `grafana-tf-shipsoliddev` and `grafana-tf-shipsolid` are listed.

### Setup checklist (one-time, per org)

1. **Create the shared Variable Set.** Org → Settings → Variable Sets → **Create variable set**.
   Name it something like `grafana-tf-shared`. Apply policy: **Apply to specific workspaces** → tick
   `grafana-tf-shipsoliddev` and `grafana-tf-shipsolid`. Don't pick "Apply globally" — limits blast
   radius if other workspaces show up later.
2. **Add the shared variables** to that Variable Set using the table below. Watch the **Category**
   column carefully — Environment vs Terraform is the most common mis-set.
3. **Add workspace-specific variables** on each workspace's own Variables tab (the second table
   below). These are values that differ per stack.
4. **Smoke-test before relying on the daily flow.** On each workspace: **Actions → Start new run →
   Plan only**. Variable issues fail at plan-init, so any missing or mis-categorised variable shows
   up in the first 30 seconds. Iterate until the plan starts cleanly.

### Reference: shared variables (Variable Set, both workspaces)

| Key                         | Category        | Sensitive | Value                                                                    |
| --------------------------- | --------------- | --------- | ------------------------------------------------------------------------ |
| `cloud_access_policy_token` | Terraform       | Yes       | Grafana Cloud access policy token (provider bootstrap)                   |
| `grafana_sa_token`          | Terraform       | Yes       | Grafana service account token (instance provider)                        |
| `sm_access_token`           | Terraform       | Yes       | Grafana Synthetic Monitoring access token                                |
| `azure_ad_client_secret`    | Terraform       | Yes       | Azure AD app registration client secret                                  |
| `oncall_url`                | Terraform       | No        | `https://oncall-prod-us-central-0.grafana.net/oncall`                    |
| `azure_ad_client_id`        | Terraform       | No        | Azure AD app client ID                                                   |
| `azure_ad_tenant_id`        | Terraform       | No        | Azure AD tenant ID                                                       |
| `sm_url`                    | Terraform       | No        | `https://synthetic-monitoring-api.grafana.net`                           |
| `key_vault_resource_group`  | Terraform       | No        | `mf-cc-dt-azrsrp-foundation-prd-rg`                                      |
| `azure_ad_admin_group_id`   | Terraform       | No        | `c07d35a1-a969-424f-b81d-6ec7895eb158`                                   |
| `azure_ad_editor_group_id`  | Terraform       | No        | `cc539ebe-bd25-4d58-afc4-ebfdc46347ad`                                   |
| `azure_ad_viewer_group_id`  | Terraform       | No        | `b25327e5-4f9e-4bca-b75f-873b52f60497`                                   |
| `ARM_CLIENT_ID`             | **Environment** | No        | Azure SP client ID — for the `azurerm` provider that writes to Key Vault |
| `ARM_CLIENT_SECRET`         | **Environment** | Yes       | Azure SP client secret                                                   |
| `ARM_TENANT_ID`             | **Environment** | No        | Azure SP tenant ID                                                       |
| `ARM_SUBSCRIPTION_ID`       | **Environment** | No        | Azure subscription ID                                                    |

The four `ARM_*` rows are the only Environment-category entries — they're consumed directly by the
`azurerm` provider, not by HCL `variable` blocks, and have no `TF_VAR_` prefix.

These provider-bootstrap and Alloy-writer values are ultimately persisted to Azure Key Vault after
apply — see
[[projects/platform-shipsolid/05-platform-configuration/grafana-tf/key-vault-secrets|Key Vault Secrets Reference]]
for the full catalogue.

### Reference: workspace-scoped variables (per workspace)

`grafana-tf-shipsoliddev` → Variables tab:

| Key           | Category  | Value                              |
| ------------- | --------- | ---------------------------------- |
| `stack_slug`  | Terraform | `shipsoliddev`                     |
| `grafana_url` | Terraform | `https://shipsoliddev.grafana.net` |

`grafana-tf-shipsolid` → Variables tab:

| Key           | Category  | Value                           |
| ------------- | --------- | ------------------------------- |
| `stack_slug`  | Terraform | `shipsolid`                     |
| `grafana_url` | Terraform | `https://shipsolid.grafana.net` |

### Troubleshooting

**`Error: No value for required variable` on `<name>`** — the variable isn't bound. Walk this in
order:

1. The variable doesn't exist in TFC at all → add it per the tables above.
2. It exists in a Variable Set, but the Variable Set isn't attached to the workspace → Variable Set
   → Workspaces tab.
3. It exists but is **Environment** category when it should be **Terraform** (or vice versa) → edit
   the variable, change the category. The most common case is `oncall_url` / `azure_ad_*_id` added
   as Env vars — those are HCL inputs, must be Terraform-category.
4. The name is wrong (typo, or accidentally has `TF_VAR_` prefix on a Terraform-category variable) →
   fix the key.

**A change to a `Sensitive` variable doesn't seem to take effect** — TFC won't display the value
back to you after marking sensitive, and there's no way to read it. Re-enter the value to be sure;
if a run still misbehaves, check workspace-level overrides aren't shadowing the Variable Set entry.

**Both workspaces share the same value but you're tempted to add it to both** — don't. Put it in the
Variable Set. Two copies drift; one canonical source doesn't.

## GitHub Actions workflows

| Workflow              | Trigger                                              | Purpose                                                                                                                                            |
| --------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.yml`            | PR / push to `main` (modules + tools + products.yml) | Module-level `terraform validate` / `terraform test`, tflint, checkov, pytest for `tools/generate.py`                                              |
| `plan.yml`            | PR to `main` (shipsoliddev paths) + manual           | **Pre-flight only:** generator-in-sync guard + `terraform fmt -check`. The actual plan runs in TFC.                                                |
| `plan-shipsolid.yml`  | PR to `main` (shipsolid paths) + manual              | Same pre-flight, scoped to `environments/shipsolid/**` paths.                                                                                      |
| `drift.yml`           | Daily 06:00 UTC                                      | Triggers a plan-only run on `grafana-tf-shipsoliddev` via the TFC API; opens / comments on a GitHub Issue if the plan reports `has-changes: true`. |
| `drift-shipsolid.yml` | Daily 07:00 UTC                                      | Same for `grafana-tf-shipsolid`.                                                                                                                   |
| `token-expiry.yml`    | Scheduled                                            | Audits token expiries; unrelated to TFC.                                                                                                           |

### Why CI no longer runs `terraform plan`

When a CLI-driven `terraform init` runs from `environments/<stack>/`, it packages **only that
directory's contents** for upload to TFC. The repo's relative module paths
(`source = "../../modules/<name>"`) point to a sibling directory that's outside the upload root, so
TFC's runner can't resolve them. VCS-driven workspaces sidestep this — TFC clones the whole repo on
each run.

Local `terraform plan` from `environments/<stack>/` hits the same wall against a VCS-driven
workspace. See "Local development" below.

## Drift detection

`drift.yml` and `drift-shipsolid.yml` run on a daily cron and use the **TFC API** to queue a
plan-only run on the corresponding workspace. The workflow:

1. Resolves the workspace name → ID via `GET /api/v2/organizations/{org}/workspaces/{name}`.
2. Creates a run with `attributes: { plan-only: true, message: "Daily drift check" }`. TFC clones
   the workspace's VCS-tracked branch and plans against it.
3. Polls `GET /api/v2/runs/{run_id}` every 30s (up to 30 min) until the run reaches a terminal
   status (`planned_and_finished`, `errored`, etc.).
4. Reads `data.attributes.has-changes` — if `true`, opens or comments on a GitHub Issue labelled
   `terraform-drift,<stack>,infrastructure` with a link to the TFC run.

The only secret required is `TF_API_TOKEN`. All Grafana / Azure variables consumed by the plan live
in the workspace's TFC Variable Set.

If your TFC plan tier supports it, **TFC Health Assessments** (workspace → Settings → Health → Drift
Detection) is a native alternative — TFC runs the check, surfaces drift in its own UI, and can
email/Slack on detection. The current GitHub Actions implementation works on any tier and preserves
the existing GitHub Issue notification flow.

## Apply workflow

Apply happens in TFC, not in CI. The previous `apply.yml` / `apply-shipsolid.yml` workflows have
been deleted.

1. Merge to `main`.
2. TFC sees the push, queues a plan on each workspace whose trigger paths matched.
3. A reviewer opens the workspace in TFC UI, inspects the plan, clicks **Confirm & Apply**.

For `shipsolid` (prod), keep this manual. For `shipsoliddev`, optionally enable workspace
**Auto-apply** so dev applies happen without manual confirm — accelerates iteration but loses the
gate.

To trigger an apply outside the merge-to-main path (e.g. emergency hotfix), open the workspace in
TFC UI and use **Actions → Start new run** with the desired ref.

## Local development

`./tf.sh plan` / `apply` / `drift` are not supported under VCS-driven TFC and refuse with a clear
message. The CLI bundles only the env subdirectory; TFC's runner can't see `../../modules` and fails
with `Unable to evaluate directory symlink: lstat ../../modules`.

The intended iteration loop:

1. **`./tf.sh validate <stack>`** — primary feedback for HCL syntax, types, module wiring, and
   provider schema mismatches. Runs locally with no TFC round-trip.
2. **`./tf.sh fmt`** — formatting check.
3. **`./tf.sh test`** + **`terraform -chdir=modules/<name> test`** — pytest for the generator,
   `tftest.hcl` for individual modules. Both run locally.
4. **Push your branch** — TFC posts a speculative plan as a status check on the PR. This is the only
   way to see real plan output.

### Decision: no local-backend mode

A local-backend mode (swap `cloud {}` for a local backend, run plan with on-disk state) was
considered and skipped. Reasoning:

- `terraform validate` already catches the bulk of what local plan iteration would catch — syntax,
  type mismatches, undefined references, module input/output shape, provider schema typos.
- A local plan against an empty local state would just propose to create everything, which isn't
  useful drift or change-set feedback.
- The push-branch → speculative-plan loop runs in 1-3 minutes for these workspaces — fast enough for
  normal iteration.
- Maintenance cost of swapping backend.tf in/out, risk of devs accidentally state-changing against
  local state, lock-file invalidation across swaps — not worth paying for the marginal value.

If iteration speed ever becomes a real bottleneck, a more useful direction would be richer
module-level `tftest.hcl` coverage (mock providers, no backend needed) than a local-backend swap.

### `./tf.sh destroy`

`destroy` keeps its Grafana-API pre-cleanup steps (notification policy reset, alert-rule clearing,
`terraform state rm` of the policy resource — state operations work without uploading config) but
stops short of running `terraform apply -destroy`. After the script finishes, queue the destroy run
in TFC UI: workspace → **Settings → Destruction and deletion → Queue destroy plan**.

## Required GitHub Labels

Drift detection workflows (when migrated) create GitHub Issues with these labels:

```bash
gh label create "terraform-drift" --color "D93F0B" --description "Terraform state drift detected"
gh label create "shipsoliddev"       --color "0075CA" --description "shipsoliddev Grafana stack"
gh label create "shipsolid"          --color "E4E669" --description "shipsolid production Grafana stack"
gh label create "infrastructure"  --color "BFD4F2" --description "Infrastructure change"
```

## Migration status

| Item                                                                | Status                                                                 |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| TFC workspaces switched to VCS-driven                               | Done                                                                   |
| `plan.yml` / `plan-shipsolid.yml` slimmed to pre-flight             | Done                                                                   |
| Generator-in-sync guard preserved in CI                             | Done                                                                   |
| TFC Variable Set populated with secrets and shared vars             | Done                                                                   |
| `apply.yml` / `apply-shipsolid.yml` deleted                         | Done                                                                   |
| Drift detection rewritten to use the TFC API on a daily cron        | Done                                                                   |
| Local-backend mode in `tf.sh` for fast iteration                    | Skipped — `validate` covers most needs; push-and-watch covers the rest |
| `tf.sh` plan/apply/destroy/drift updated to refuse with guidance    | Done                                                                   |
| `Makefile` plan/apply/destroy/drift updated to refuse with guidance | Done                                                                   |
