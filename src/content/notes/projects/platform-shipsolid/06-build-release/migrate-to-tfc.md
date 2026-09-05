---
title: "Migrating to Terraform Cloud (TFC / HCP Terraform)"
description: "Migrating to Terraform Cloud (TFC / HCP Terraform) is mostly mechanical, but there's one"
tags: ["ShipSolid", "CI/CD"]
updated: 2026-05-01
hidden: false
zettelId: "202604280014-9"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/cicd
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/key-vault-secrets
    kind: related
  - slug: projects/platform-shipsolid/06-build-release/central-pipeline
    kind: related
---

## Migrating to Terraform Cloud (TFC / HCP Terraform)

> **Status (2026-04-28):** Migration done. The fork below recommended CLI-driven; the project
> ultimately ran into the monorepo + sibling-modules limitation of CLI-driven uploads (TFC packages
> only the working directory's descendants, so `../../modules` is unreachable on TFC's runner) and
> switched to **VCS-driven** workspaces. Current state of CI/CD, TFC workspace settings, variable
> sets, and pending follow-ups lives in [[cicd|docs/cicd.md]]. The rest of this document remains as
> historical context for the decision and the lift-and-shift plan that was originally drafted. The
> follow-on effort layered on top of this migration is tracked in
> [[projects/platform-shipsolid/06-build-release/central-pipeline|adopting the central CI/CD pipeline]].

Migrating to Terraform Cloud (TFC / HCP Terraform) is mostly mechanical, but there's one
architectural fork that should be decided first since it changes the size of the work.

## Scope: what changes, what stays

**Changing:** Terraform state backend (Azure blob → TFC) and where `plan` / `apply` execute
(local/CI runner → TFC remote runners).

**Staying — Azure Key Vault is retained as-is:**

- KV (`mf-cc-dt-azrsrp-prd-kv`) remains the consumer-facing secret store for Alloy tokens, LBAC
  reader tokens, OTLP credentials, Faro endpoints, etc. The full catalogue in
  [[key-vault-secrets|docs/key-vault-secrets.md]] is unchanged.
- The `azurerm` provider continues to write those secrets after every apply — KV is still write-only
  from Terraform's perspective and read-only from consumers (Alloy pods, k8s manifests, dashboards).
- All KV writes that exist today (SA token, Alloy writer/LBAC reader tokens, Mimir/Loki/Tempo/OTLP
  endpoints, Faro endpoint/sourcemap token) keep happening from inside TFC remote runs.
- No KV resources, no KV secret names, and no consumer wiring need to change.
- The only Azure blob that's being retired is the **state** blob
  (`shipsolidgrafanatfstate/grafana-cloud/*`). Nothing else in the Azure footprint moves.

What this means in practice: the TFC migration is a state-backend swap, not an Azure exit. The
`azurerm` provider config in each environment stays, the SP credentials still need to reach the
runner (now via TFC variable sets), and Azure remains in the apply path.

## The fork: CLI-driven vs VCS-driven workspaces

| Mode                            | What changes                                                                                                                                                                       | Effort                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **CLI-driven (lift-and-shift)** | TFC stores state and runs plan/apply remotely. `tf.sh` and CI keep their current shape — they trigger TFC runs instead of running Terraform locally. Most workflows are preserved. | Small                                                 |
| **VCS-driven**                  | TFC watches the repo, auto-plans on PR, auto-applies on merge. Replaces most of `plan.yml` / `apply.yml`. Approval gates move from GitHub Environments to TFC run approvals.       | Medium-Large — touches CI/CD shape and reviewer model |

Pick **CLI-driven** unless you also want to retire half the GitHub Actions surface. Recommend that
for this migration.

### Why CLI-driven for this repo specifically

- **Lift-and-shift, not rebuild.** `tf.sh` and the existing GitHub Actions workflows (`plan.yml`,
  `apply.yml`) keep their current shape — they just route runs through TFC instead of executing
  locally.
- **The Jinja2 generator step.** `./tf.sh generate` must run before `terraform plan` (CI enforces
  this with `git diff --exit-code` on `generated/`). With VCS-driven, TFC auto-plans on PR push and
  won't run the generator — you'd either rely entirely on committed artifacts or wire a pre-plan
  hook. CLI-driven sidesteps this; CI runs `generate` then triggers the remote plan.
- **Approval gates stay put.** GitHub Environments (`shipsolid-prod`) keep gating apply. VCS-driven
  would push toward TFC run approvals + Sentinel — a separate surface to learn.
- **`shipsoliddev` → `shipsolid` promotion stays explicit.** CLI-driven preserves the
  `./tf.sh apply shipsoliddev` then `./tf.sh apply shipsolid` sequencing. VCS-driven workspaces tied
  to branches/dirs make that promotion model awkward.

Pick **API-Driven** only if building a custom orchestrator on top of TFC — not the case here.

## Concrete checklist (CLI-driven path)

### 1. TFC org + workspaces (one-time, manual)

- Create org (or use existing — e.g. `ShipSolid`).
- Create two workspaces — both via the **CLI-Driven Workflow** option in the "Choose your workflow"
  picker:
  - `grafana-tf-shipsoliddev`
  - `grafana-tf-shipsolid`
- Workspace settings for each:
  - **Execution mode:** Remote (default)
  - **Working directory:** `grafana_tf/environments/shipsoliddev/` (or `…/shipsolid/`) — required,
    otherwise TFC runs from repo root and won't find the backend / provider configuration.
  - **Terraform version:** pin to the version in `grafana_tf/.terraform-version` (or `versions.tf`).
- Workspace variable sets — move into TFC:
  - Sensitive Terraform vars: `cloud_access_policy_token`, `grafana_sa_token`, `sm_access_token`,
    `azure_ad_client_secret`.
  - Sensitive env vars (for the `azurerm` provider that still writes to Key Vault — KV is being
    retained, see "Scope" above): `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `ARM_TENANT_ID`,
    `ARM_SUBSCRIPTION_ID`. Or use TFC's dynamic Azure provider credentials (workload-identity flow)
    — better long-term, eliminates the static SP secret.

### 2. Backend swap (`environments/shipsoliddev/backend.tf`, `environments/shipsolid/backend.tf`)

Replace the `terraform { backend "azurerm" {} }` block with:

```hcl
terraform {
  required_version = "1.14.9"

  cloud {

    organization = "ShipSolid"

    workspaces {
      name = "grafana-tf-shipsoliddev"   # or grafana-tf-shipsolid
    }
  }
}
```

### 3. State migration (per stack, one-time)

- `terraform init -migrate-state` — copies blob state into TFC. Confirm prompts.
- Verify `terraform plan` shows zero diff after migration.
- Keep the Azure blob read-only for ~30 days as rollback, then delete container.

### 4. `tf.sh`

- Drop the `ARM_ACCESS_KEY` fetch from `az storage account keys list` — no longer needed for state
  (the storage account is being retired; KV is not).
- Add `TF_TOKEN_app_terraform_io` (TFC API token) export, sourced from `.env`.
- `terraform login` flow documented as one-time setup.
- The `az login` check stays — KV is retained, so `azurerm` provider auth is still required at
  runtime. Azure SP credentials are passed into the remote run via the TFC variable set (step 1).

### 5. `scripts/bootstrap.sh`

Replace the storage account verification with a TFC org + workspace check (or a `terraform login`
reminder).

### 6. CI/CD (`.github/workflows/*.yml`)

- Replace `ARM_ACCESS_KEY` step with `TF_API_TOKEN` env (GitHub Actions secret).
- Plan/apply still run from CI — just routed through TFC remote execution.
- Drift workflows: same; TFC handles state, runs are still triggered by cron.
- Optional: enable TFC run notifications → Slack/Teams (replaces some bespoke notification code if
  you have it).

### 7. Approval gates — decide

- Keep GitHub Environments (`shipsolid-prod` etc.) — works, since GH triggers the TFC run.
- Or move to TFC run approvals + Sentinel policies. More expressive (e.g. "deny if plan touches
  `module.stack` without label"), but new surface to learn.

### 8. Docs to update

- `README.md` — backend bootstrap section, prerequisites table.
- `CLAUDE.md` — commands section, `.env` content.
- `docs/cicd.md` — secrets table, workflow descriptions.
- `docs/operations.md` — token rotation runbook (TFC token now in scope).
- `docs/system-design.md` — §4.13 CI/CD shape, R5 risk row, §7.1 bootstrap sequence.
- `.env.example` and `terraform.tfvars.example`.

## Risks to flag

- **Locking semantics differ.** Azure blob lease vs TFC's run queue. TFC serialises runs per
  workspace — if a CI apply is running, a manual `tf.sh plan` will queue, not race. Generally an
  improvement, but operators should know.
- **Provider-bootstrap secrets in TFC variable sets** — same surface as `terraform.tfvars`, just a
  different vault. The plan-time independence (N6 in the TDD) is preserved.
- **Egress / network** — TFC runs from HCP cloud; if Grafana Cloud or KV had IP allowlists keyed to
  GitHub Actions runner ranges, those need updating. Currently neither does, so likely a non-issue.
  Worth re-checking the KV firewall rules before the first remote apply since KV is staying in the
  loop.
- **Cost** — Free tier covers up to 5 users, 500 managed resources/month. Both stacks combined are
  likely well under, but worth confirming the org's plan tier.

---

## Implementation plan

Phased plan with explicit go/no-go gates. Each gate must pass before moving to the next phase.

### Phase 0: Prerequisites (~30 min)

**Owner:** SRE lead. **Reversible:** N/A.

- [ ] TFC org `ShipSolid` exists, admin access confirmed.
- [ ] Both workspaces created (`grafana-tf-shipsoliddev`, `grafana-tf-shipsolid`) with **CLI-Driven
      Workflow**, Working directory = `environments/shipsoliddev/` and `environments/shipsolid/`.
- [ ] Generate a TFC user API token (User Settings → Tokens → Create).
- [ ] Confirm the org's TFC plan tier covers expected resource count (~500 limit on free tier).
- [ ] Confirm no active `terraform apply` running locally or in CI for either stack.
- [ ] Tag current `main` with `pre-tfc-migration` for easy rollback reference:
      `git tag pre-tfc-migration && git push origin pre-tfc-migration`.

**Gate:** all checked, no in-flight applies.

### Phase 1: Workspace variable sets (~20 min)

**Owner:** SRE lead. **Reversible:** yes (delete variable values).

For **each** workspace, add via Variables tab:

| Variable                    | Category  | Sensitive | Source                                  |
| --------------------------- | --------- | --------- | --------------------------------------- |
| `cloud_access_policy_token` | Terraform | ✓         | `environments/<stack>/terraform.tfvars` |
| `grafana_sa_token`          | Terraform | ✓         | same                                    |
| `sm_access_token`           | Terraform | ✓         | same                                    |
| `azure_ad_client_secret`    | Terraform | ✓         | `.env` `TF_VAR_azure_ad_client_secret`  |
| `ARM_CLIENT_ID`             | Env       | ✓         | Azure SP                                |
| `ARM_CLIENT_SECRET`         | Env       | ✓         | Azure SP                                |
| `ARM_TENANT_ID`             | Env       | —         | `59fa7797-abec-4505-81e6-8ce092642190`  |
| `ARM_SUBSCRIPTION_ID`       | Env       | —         | Azure SP scope                          |

Same values per workspace. Don't share variable sets between dev and prod yet — keep blast radius
small.

**Gate:** both workspaces show all 8 vars, sensitive ones masked.

### Phase 2: Branch + backend swap (shipsoliddev only) (~15 min)

**Owner:** SRE lead. **Reversible:** yes (revert branch).

```bash
git checkout -b chore/migrate-to-tfc
```

Edit only `environments/shipsoliddev/backend.tf` — replace the `backend "azurerm"` block with the
`cloud { … }` block from §2 above. Leave `environments/shipsolid/backend.tf` untouched.

Add `TF_TOKEN_app_terraform_io=<token>` to local `.env`.

**Don't push this branch yet** — CI would fail because the workspaces aren't fully wired.

**Gate:** `git diff` shows only the one `backend.tf` change.

### Phase 3: State migration shipsoliddev (~10 min, IRREVERSIBLE-ish)

**Owner:** SRE lead. **Reversible:** yes within ~30 days (Azure blob still has the state). After the
blob is deleted in Phase 10, irreversible.

```bash
cd environments/shipsoliddev
unset ARM_ACCESS_KEY  # ensure we're not using old auth
terraform init -migrate-state
# When prompted: "yes" to copy existing state to TFC
terraform plan
```

**Gate:** `terraform plan` shows **zero changes**. If non-zero diff, **stop** — do not apply.
Investigate the drift (likely a provider version mismatch or workspace working-directory
misconfiguration).

If the gate fails and can't be resolved within 30 min, roll back: revert the `backend.tf` change,
run `terraform init -migrate-state` again to copy state back to Azure blob.

### Phase 4: `tf.sh` + `bootstrap.sh` updates (~45 min)

**Owner:** SRE lead.

Edits to `tf.sh`:

- Remove `KV_RG`/`STORAGE_ACCT` constants (lines 35-36).
- Remove `fetch_access_key()` function (lines 78-94).
- Remove all six `fetch_access_key` callsites in `cmd_init`, `cmd_plan`, `cmd_apply`, `cmd_destroy`,
  `cmd_drift`, `cmd_validate`.
- Update header comment block (the saved-tfplan flow won't work with TFC remote runs — drop
  `-out=tfplan` and the apply-from-saved-plan logic in `cmd_apply` and `cmd_destroy`; remote runs
  re-plan inside TFC).
- Update `cmd_clean` to drop the `tfplan` / `tfplan-destroy` removals.
- `load_env` already picks up `TF_TOKEN_app_terraform_io` from `.env` — no code change needed there.

Edits to `scripts/bootstrap.sh`:

- Replace storage-account verification with a check that `terraform login app.terraform.io` has been
  run (look for `~/.terraform.d/credentials.tfrc.json` containing the token), or that
  `TF_TOKEN_app_terraform_io` is set.

**Gate:** `./tf.sh plan shipsoliddev` runs end-to-end and triggers a TFC remote run that completes
with zero diff. View the run in the TFC UI to confirm.

### Phase 5: Local apply shipsoliddev (~20 min)

**Owner:** SRE lead. **Reversible:** yes (TFC keeps state versions).

```bash
./tf.sh apply shipsoliddev
```

This is the first **real** apply through TFC. It should be a no-op (state matches reality). Watch
the TFC run logs for:

- `azurerm` provider auth succeeded (KV writes still working).
- Grafana provider auth succeeded.
- `apply complete: 0 added, 0 changed, 0 destroyed`.

After apply, verify a sample KV secret to confirm Phase 4 didn't break the KV write path:

```bash
az keyvault secret show --vault-name mf-cc-dt-azrsrp-prd-kv \
  --name grafana-shipsoliddev-cloud-mimir-endpoint --query value -o tsv
```

**Gate:** zero-change apply succeeds, KV secret reads OK, no provider errors.

### Phase 6: CI workflow updates (~1 hour)

**Owner:** SRE lead.

Touch all 8 files in `.github/workflows/`:

- `plan.yml` / `plan-shipsolid.yml`
- `apply.yml` / `apply-shipsolid.yml`
- `drift.yml` / `drift-shipsolid.yml`
- `test.yml` (likely no change — pytest only)
- `token-expiry.yml` (verify what it checks; if it checks SA key expiry, repurpose for TFC token)

Per file:

- Drop `az storage account keys list` step.
- Drop `ARM_ACCESS_KEY` env exports.
- Add `TF_TOKEN_app_terraform_io: ${{ secrets.TF_API_TOKEN }}` to env.
- Keep `az login` step (still needed for KV).

Add `TF_API_TOKEN` to repo secrets in GitHub.

**Gate:** PR opens, CI plan job succeeds for shipsoliddev, shows zero diff in the TFC remote run.

### Phase 7: PR review + merge (~1 day for review)

**Owner:** team.

PR includes:

- `environments/shipsoliddev/backend.tf` change
- `tf.sh`, `scripts/bootstrap.sh` changes
- All 8 workflow file changes
- Doc updates: `README.md`, `CLAUDE.md` Commands section, `.env.example`

**Gate:** PR approved, CI green, merged. First post-merge CI run on `main` shows zero diff for
shipsoliddev.

### Phase 8: ShipSolid (production) cutover (~1 hour, after shipsoliddev stable for ≥3 days)

**Owner:** SRE lead. **Reversible:** yes within 30 days.

Repeat phases 2-7 for shipsolid on a fresh branch. Same steps, same gates. **Don't skip the soak
period** — let shipsoliddev run through ≥3 plan/apply cycles in CI to surface anything
provider-version or KV-related.

### Phase 9: Docs cleanup (~30 min)

**Owner:** SRE lead.

- `README.md` — backend bootstrap section, prerequisites table.
- `CLAUDE.md` — Commands section, Azure Key Vault integration section gets a "TFC remote runner"
  footnote, `.env` content.
- `docs/key-vault-secrets.md` — sanity-check, likely fine.
- New section in `docs/operations.md` for TFC token rotation.
- `docs/system-design.md` §4.13 + §7.1 + R5 risk row.

### Phase 10: Storage retirement (~30 days post Phase 8, IRREVERSIBLE)

**Owner:** SRE lead. **Irreversible.**

- [ ] Confirm both workspaces have ≥30 days of TFC state version history.
- [ ] Set Azure blob container `grafana-cloud` to read-only for 7 days.
- [ ] Delete the `grafana-cloud` blob container.
- [ ] If nothing else uses `shipsolidgrafanatfstate`, delete the storage account.
- [ ] Remove `ARM_ACCESS_KEY` from any GitHub Actions secrets list.

### Total estimate

| Phase                      | Time                      | Cumulative |
| -------------------------- | ------------------------- | ---------- |
| 0-2                        | ~1h                       | 1h         |
| 3-5 (shipsoliddev cutover) | ~1.5h                     | 2.5h       |
| 6-7 (CI + PR)              | ~1 day (review wait)      | day 1      |
| 8 (shipsolid cutover)      | ~1h after 3-day soak      | day 4      |
| 9 (docs)                   | ~30 min                   | day 4      |
| 10 (cleanup)               | ~30 min after 30-day soak | day 34     |

**Active hands-on time:** ~5 hours. **Calendar time:** ~5 weeks (driven by soak periods).
