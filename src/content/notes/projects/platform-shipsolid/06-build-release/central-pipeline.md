---
title: "Adopting the ShipSolid Central Terraform CI/CD Pipeline"
description: "- Org consistency across all ShipSolid Terraform repos (Grafana Cloud IaC, SDLC Portal infra,"
tags: ["ShipSolid", "CI/CD"]
updated: 2026-05-01
hidden: false
zettelId: "202604291907"
relations:
  - slug: projects/platform-shipsolid/06-build-release/migrate-to-tfc
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/cicd
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/system-design
    kind: related
---

## Adopting the ShipSolid Central Terraform CI/CD Pipeline

> **Provenance:** Originally authored in the ShipSolid `sre-grafana-cloud-tf` repository. "This
> repo" in the prose below refers to that repository. Sibling-file references that exist in k-docs
> have been rewritten to their new locations; references that exist only in the source repo are
> flagged inline with `(source-repo only)`.
>
> **Status (2026-04-28):** Implementation in progress on the `sec-test` branch. Consumer workflows +
> `checkov_skips.cfg` files added. Activation blocked on:
>
> 1. Platform-team review/merge of the parameterisation PR drafted on
>    `feat/parameterise-iac-terraform-workflows` in `ShipSolidFoods/mf-core-pipelines` (4 of 5
>    blockers).
> 2. Confirmation that `MY_GITHUB_TOKEN`, `TF_API_TOKEN`, `AZURE_CREDENTIALS` are accessible
>    org-level (5th blocker — provisioning, not code).
> 3. Creation of GitHub Environments `shipsolid-dev` and `shipsolid-prod` in this repo with reviewer
>    rules.
>
> **Pull-request triggers in the new consumer workflows stay commented out** until items 1-3 are
> resolved. `workflow_dispatch` only — manual trigger for testing.
>
> **Reference consumer studied:** `ShipSolidFoods/mf-dt-azrsda-SDLCPortal-infra-repo` (single-stack
> Azure Terraform repo using the central pipeline). **Source of truth:** >
> `ShipSolidFoods/mf-core-pipelines` at `@main` (post-merge of our PR). **Audience:** SRE engineers
> planning the post-TFC consolidation onto ShipSolid's standard IaC pipeline. **Scope:** Replace
> this repo's bespoke `plan.yml` / `apply.yml` workflows with the org-standard
> `iac-terraform-pr-create.yaml` / `iac-terraform-pr-merge.yaml` reusable workflows from
> `mf-core-pipelines`.

---

## Why adopt this

- Org consistency across all ShipSolid Terraform repos (Grafana Cloud IaC, SDLC Portal infra,
  foundation repos, application landing zones).
- Centralised guardrails (Checkov, tfsec, terraform-docs, terraform-compliance, terratest)
  maintained once in `mf-core-pipelines`, inherited by every consumer.
- Less custom CI per repo. Reduces the surface area we own.

> **Note on Azure OIDC:** an earlier version of this doc claimed the central pipeline uses OIDC for
> Azure auth. **It does not** — the apply step uses `azure/login@v2` with
> `creds: ${{ secrets.AZURE_CREDENTIALS }}` (a JSON-format SP credential), and the plan/apply jobs
> export `ARM_CLIENT_ID` / `ARM_CLIENT_SECRET` / `ARM_TENANT_ID` from secrets. The `id-token: write`
> permission is set but currently unused. Static SP creds are still the auth model.

This change layers **on top of** the TFC migration ([[migrate-to-tfc|migrate-to-tfc.md]]). The TFC
`cloud {}` backend stays as we set it up; only the GitHub Actions workflows change.

**Sequence:** finish the TFC migration first (Phases 3-7 in [[migrate-to-tfc|migrate-to-tfc.md]]),
validate one apply through the current `apply.yml`, then adopt the central pipeline on a separate
branch — _only_ after the compatibility issues below are resolved.

---

## System design

### Components

```text
┌──────────────────────────────────────────────────────────────────────┐
│  CONSUMER REPO  (ShipSolidFoods--sre-grafana-cloud-tf, this repo)       │
│  ────────────────────────────────────────────────────────────────    │
│   .github/workflows/                                                 │
│     pr_creation_central.yml   ── trigger: PR opened/synchronize      │
│     pr_merge_central.yml      ── trigger: PR closed (merged)         │
│   environments/shipsoliddev/                                            │
│     backend.tf            cloud { organization=ShipSolid, ... }   │
│     checkov_skips.cfg     per-stack Checkov skip list                │
│   environments/shipsolid/    (same shape)                               │
│   modules/, tools/, products.yml ...                                 │
└──────────┬───────────────────────────────────────────────────────────┘
           │ uses: ShipSolidFoods/mf-core-pipelines/.github/workflows/
           │       iac-terraform-pr-{create,merge}.yaml@main
           │ with: working_directory, checkov_skip_checks, pr_*, branch
           │ secrets: inherit
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CENTRAL PIPELINE REPO  (ShipSolidFoods/mf-core-pipelines)              │
│  ────────────────────────────────────────────────────────────────    │
│   iac-terraform-pr-create.yaml   plan path                           │
│   iac-terraform-pr-merge.yaml    apply path                          │
│                                                                      │
│   Triggers: workflow_call (what we use) OR repository_dispatch       │
│   Runs on: github-hosted ubuntu-latest                               │
│   Terraform version: 1.11.4 (HARDCODED — see Compatibility issues)   │
└──────────┬───────────────────────────────────────────────────────────┘
           │ Talks to:
           ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  HCP Terraform (TFC)    │    │  Azure                  │
│  ────────────────────   │    │  ────────────────────   │
│  Org: ShipSolid      │    │  Static SP creds:       │
│  Workspaces:            │    │   ARM_CLIENT_ID         │
│    grafana-tf-shipsoliddev │    │   ARM_CLIENT_SECRET     │
│    grafana-tf-shipsolid    │    │   ARM_TENANT_ID         │
│                         │    │   AAD_CLIENT_SECRET     │
│  Auth from runner:      │    │                         │
│    TF_TOKEN_app_         │    │  Plus AZURE_CREDENTIALS │
│    terraform_io          │    │  JSON for azure/login   │
│    (org-level secret)   │    │  (apply job only)       │
│                         │    │                         │
│  - Stores state         │    │  KV writes happen       │
│  - Holds variable set   │    │  during the TFC remote  │
│  - Runs plan/apply      │    │  apply, not on the      │
│    remotely             │    │  GitHub runner.         │
└─────────────────────────┘    └─────────────────────────┘
```

### Confirmed step list (PR create — plan path)

Read directly from iac-terraform-pr-create.yaml. Job dependency graph:

```text
pipeline-trigger-information     (logs trigger metadata to step summary)
        │
        ▼
terraform-init                   (init + list files)
        │
        ├──▶ terraform-format    (terraform fmt -check -recursive)
        ├──▶ terraform-validate  (terraform validate)
        ├──▶ terraform-docs      (auto-generates README sections, GIT-PUSHES)
        ├──▶ terraform-tfsec     (aquasecurity/tfsec-action)
        └──▶ terraform-checkov   (init only — actual scan is commented out here)
                │
                ▼  (all five gates must pass)
       terraform-plan            (terraform plan -out=pr-plan.out)
                │                 uploads artifact "tfplan"
                │                 outputs plan_has_changes (true/false)
                │
                ├──▶ nochanges   (if plan_has_changes=false; just logs)
                │
                ├──▶ checkov     (if plan_has_changes=true)
                │                 downloads artifact, runs Checkov against tfplan.json
                │                 with skip_check from input
                │
                ├──▶ compliance  (if true; downloads artifact, terraform-compliance step
                │                 is currently commented out)
                │
                └──▶ terratest   (if true; init only — Terratest step is commented out)
```

### Confirmed step list (PR merge — apply path)

Same pre-plan jobs as the plan path, plus:

```text
terraform-plan
   ├──▶ checkov      ─┐
   ├──▶ compliance   ─┤
   └──▶ terratest    ─┤  all four gates ─▶  terraform-apply
                     ─┘                       (environment: production)
                                              azure/login + apply plan.out
                                              [optional destroy_after_create flow:
                                               apply → re-plan → destroy → wait → re-plan →
                                               re-apply → destroy. Default: disabled.]
                                              │
                                              ▼
                                     tfcpublish-module
                                     (only if tfcpublish_flag=true; we won't use)
```

### Data flow per PR

**On PR open / push (plan path):**

1. Developer pushes a commit on a feature branch and opens a PR to `main`.
2. Consumer's `pr_creation_central.yml` fires.
3. Job 1 (`get_checkov_skips_job_<env>`): reads `environments/<env>/checkov_skips.cfg`, exposes the
   comma-list as a job output.
4. Job 2 (`trigger_central_pr_plan_pipeline_reusable_workflow_<env>`): calls the central reusable
   workflow with `working_directory: environments/<env>`, `checkov_skip_checks: <list>`, plus PR
   metadata. `secrets: inherit` makes the consumer's secrets visible to the central workflow.
5. Central workflow checks out the consumer code (using `secrets.MY_GITHUB_TOKEN`), sets up
   Terraform 1.11.4, runs `terraform init` against TFC, then in parallel: `fmt -check`, `validate`,
   `tfsec`, `terraform-docs` (which **commits back** to the PR branch), and `checkov` init.
6. Once those pass, `terraform plan -out=pr-plan.out` runs. With `cloud {}` backend, this **executes
   inside TFC** as a remote run; the runner waits and downloads the plan reference.
7. Plan is uploaded as an artifact `tfplan`; the JSON form is checked for `applyable` to set
   `plan_has_changes`.
8. If changes detected, `checkov` runs against `tfplan.json` with the consumer's skip list;
   `terraform-compliance` and `terratest` jobs run their setup (the actual scan/test commands are
   commented out in `mf-core-pipelines`, so these are placeholders).

**On PR merge to main (apply path):**

1. Same triggers; `pr_merge_central.yml` invokes `iac-terraform-pr-merge.yaml`.
2. Same pre-plan gates run, then `terraform-plan` runs again (the create-workflow plan is **not**
   carried forward — there's a fresh plan at merge time).
3. After Checkov + compliance + terratest gates pass, `terraform-apply` job:
   - Sets `environment: production` (GitHub Environment in the consumer repo — see compatibility
     issue 4).
   - Logs into Azure with `azure/login@v2` using `secrets.AZURE_CREDENTIALS`.
   - Downloads the plan artifact from the merge-time plan job.
   - Runs `terraform apply -auto-approve plan.out`, which confirms the TFC remote run.
4. KV writes happen inside the TFC remote run via the `azurerm` provider, using `ARM_*` env vars
   from the workspace variable set.

### Auth / trust boundaries (confirmed)

| Boundary                           | Who authenticates         | How                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub runner → TFC                | Central workflow          | `TF_TOKEN_app_terraform_io: ${{ secrets.TF_API_TOKEN }}` env var, plus `cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}` passed to `hashicorp/setup-terraform@v3`. `TF_API_TOKEN` is **expected as an org-level or consumer-repo secret** propagated via `secrets: inherit`. |
| Central workflow → Consumer code   | `secrets.MY_GITHUB_TOKEN` | A custom-named secret (PAT or GitHub App token) used in `actions/checkout@v4` to clone the consumer repo. **Must exist in the consumer repo's secrets** (or org-level), since `secrets: inherit` passes consumer secrets into the reusable workflow.                                   |
| GitHub runner → Azure (apply only) | `azure/login@v2`          | `creds: ${{ secrets.AZURE_CREDENTIALS }}` — JSON-format SP credential. Static, not OIDC.                                                                                                                                                                                               |
| Plan/apply Terraform → Azure       | Static SP env vars        | `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `ARM_TENANT_ID`, `AAD_CLIENT_SECRET` from secrets, exported into the job env.                                                                                                                                                                    |
| TFC remote run → Azure             | TFC variable set          | Same `ARM_*` vars in the TFC workspace variable set (configured during the TFC migration). KV writes happen here, not on the runner.                                                                                                                                                   |

The `id-token: write` permission on both workflows is currently unused. Likely future-proofing for
an OIDC migration, but as of `@main` it doesn't change the auth model.

---

## Compatibility issues

Five hard blockers between the central pipeline as written and our repo as it stands. **4 of the 5
are addressed by the parameterisation PR drafted on `feat/parameterise-iac-terraform-workflows` in
`ShipSolidFoods/mf-core-pipelines`** (commit `9e005f6`, +142/-77 lines, awaiting push + review). The
5th is a provisioning question.

| #   | Issue                                      | Status                                                                                                                                                                                                                    |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `terraform_version: 1.11.4` hardcoded      | **Fixed in PR** — `terraform_version` input added, default `"1.11.4"`. We pass `"1.14.9"` from the consumer workflow.                                                                                                     |
| 2   | Hardcoded `-var cfg_aad_client_secret=...` | **Fixed in PR** — flag is now conditional on `AAD_CLIENT_SECRET` being non-empty. We leave the secret unset; no flag passed.                                                                                              |
| 3   | `terraform-docs` `git-push: 'true'`        | **Fixed in PR** — `terraform_docs_git_push` input added, default `true` (backwards compat). We pass `false`.                                                                                                              |
| 4   | `environment: production` apply gate       | **Fixed in PR** — `apply_environment` input added, default `"production"`. We pass `"shipsolid-dev"` / `"shipsolid-prod"`. Combined with caller-side `environment:` on the calling jobs, gives two-tier per-stack gating. |
| 5   | `MY_GITHUB_TOKEN` secret name              | **Provisioning question** — confirm with platform team whether org-provisioned or per-repo. No code change.                                                                                                               |

The full text of each blocker, recommended resolution, and patch shape is preserved below for the
platform-team review.

### 1. Hardcoded Terraform version `1.11.4`

The central workflow pins `terraform_version: 1.11.4` in every `setup-terraform` step. Our
_environments/shipsoliddev/backend.tf (source-repo only)_ pins `required_version = "1.14.9"`.
Terraform will refuse to init:
`Terraform 1.11.4 is configured, but configuration requires "1.14.9"`.

**Resolution options:**

- **(a)** Loosen our `required_version` to `>= 1.11.0` (or just remove the pin). Cheapest; loses the
  strict version guarantee.
- **(b)** Ask the platform team to make `terraform_version` an input on the reusable workflow. Most
  correct; depends on platform team timeline.
- **(c)** Fork the central workflow into our repo and bump the version locally. Defeats the
  consistency goal.

**Recommendation:** request (b); use (a) as an interim if (b) is slow.

### 2. Hardcoded `-var cfg_aad_client_secret=...` and `metadata_db_password`

Every `terraform plan` and `terraform apply` step runs:

```bash
terraform plan -out=plan.out -var cfg_aad_client_secret="${{ secrets.AAD_CLIENT_SECRET }}"
```

(With branching on repo name to also pass `metadata_db_password` for `*-foundation-repo` and
`mf-platform-azure-application-landing-zone`.)

Our root modules **don't declare `cfg_aad_client_secret` as a variable**. Terraform will fail with
`Value for undeclared variable: cfg_aad_client_secret`.

**Resolution options:**

- **(a)** Add a no-op `cfg_aad_client_secret` variable to our root modules just to satisfy the
  central workflow. Ugly; pollutes the variable surface with something we don't use.
- **(b)** Ask the platform team to remove the hardcoded `-var` flags or make them conditional on a
  flag/input. Correct fix.
- **(c)** Fork the workflow.

**Recommendation:** (b). This is a clear sign that the central workflow has accreted assumptions
from foundation repos that don't generalise. Worth raising as a structural improvement.

### 3. `terraform-docs` auto-commits to the PR branch

The `terraform-docs` job runs:

```yaml
- uses: terraform-docs/gh-actions@v1.0.0
  with:
    working-dir: "${{ ... working_directory ... }}"
    output-file: README.md
    output-method: inject
    git-push: 'true'
```

(And again at repo root.) `git-push: true` means it commits any README changes back to the PR branch
under the workflow's identity.

**Impact for us:**

- Our READMEs don't have terraform-docs comment markers. The action's `output-method: inject` only
  modifies content between markers, so the no-op case might be safe — but if it inserts the markers
  on first run, our READMEs gain auto-managed sections we didn't ask for, and every PR gets an extra
  auto-commit.
- This breaks branch-protection-required-status-check workflows that expect the PR head SHA to be
  stable.

**Resolution options:**

- **(a)** Add terraform-docs markers to our READMEs and accept the auto-generated sections.
- **(b)** Ask platform team to make `git-push` a configurable input (default false) or make the
  `terraform-docs` job opt-in via a flag.
- **(c)** Fork.

**Recommendation:** (b). Flag-gating intrusive behaviour is a basic platform-team hygiene ask.

### 4. Apply gate uses `environment: production`, not our `shipsolid-dev` / `shipsolid-prod`

The `terraform-apply` job in `iac-terraform-pr-merge.yaml` declares `environment: production`. For
reusable workflows, environment protection rules are enforced in the **calling** repo. So we'd need
to:

- Create a GitHub Environment named `production` in this repo (with required reviewers).
- Stop using `shipsolid-dev` and `shipsolid-prod` (or keep them for legacy/manual workflows).

The bigger gap: the central workflow has **one** environment gate, no separation between dev and
prod. For our two-stack repo (shipsoliddev → shipsolid promotion), this is a regression from our
current per-stack `shipsolid-dev` / `shipsolid-prod` gates. There's no obvious way to make the
central workflow distinguish.

**Resolution options:**

- **(a)** Run shipsoliddev jobs without an environment gate, gate only shipsolid via... but the
  central workflow always sets `environment: production`, so we can't selectively skip it.
- **(b)** Accept one shared `production` environment with reviewers strict enough for prod. Means
  dev applies also wait for approval — slower iteration but safer.
- **(c)** Ask platform team to make the environment name an input (default `production`), so we pass
  `shipsolid-dev` for dev runs and `shipsolid-prod` for prod runs.
- **(d)** Fork.

**Recommendation:** (c). Environment name as an input is a small, low-risk parameterisation.

### 5. `MY_GITHUB_TOKEN` secret must exist

The central workflow checks out the consumer repo with `token: ${{ secrets.MY_GITHUB_TOKEN }}`. This
is a custom secret, not the auto-provided `GITHUB_TOKEN`.

`secrets: inherit` from our consumer workflow passes consumer secrets into the reusable workflow. So
**a secret literally named `MY_GITHUB_TOKEN`** must exist in either:

- This repo's Actions secrets, or
- An org-level secret accessible to this repo.

Likely a ShipSolid platform-team-provisioned PAT or GitHub App token with cross-repo read. Easy to
provision but a one-time setup task; needs platform team coordination.

**Resolution:** confirm with platform team whether `MY_GITHUB_TOKEN` is provisioned org-wide for all
consumers. If yes, we just inherit it. If no, we need our own.

---

## Other findings (worth noting, not blockers)

- **Plan-of-record drift:** `pr_creation_central.yaml` and `iac-terraform-pr-merge.yaml` each run
  their own `terraform plan` independently. The plan reviewed at PR-time is **not** the plan that
  runs at merge-time — the merge workflow re-plans before applying. Acceptable for our low-frequency
  infra changes; same as we documented earlier.
- **Several jobs are placeholders:** `terraform-checkov` (init-only — Checkov-against-directory
  commented out), `compliance` (terraform-compliance install only — actual run commented out),
  `terratest` (init-only — `go test` commented out). The `checkov` job (separate, runs against
  `tfplan.json`) **is active** and uses our skip list.
- **Generator step missing:** confirmed — the central workflow does not run `tools/generate.py`. We
  add a `generator_sync_check` pre-step in our consumer workflow (see [Decisions](#decisions)).
- **`tfcpublish-module` job:** optional, gated by `tfcpublish_flag` input (default `"false"`).
  Publishes the consumer repo as a TFC private module. Not relevant for us.
- **`destroy_after_create` flow:** optional, gated by `destroy_after_create` input (default
  `false`). Used for testing module idempotency by applying, destroying, re-applying. Not relevant
  for us.
- **`workflow_dispatch` works** as a manual trigger on both reusable workflows. Useful for testing
  without opening a PR.

---

## Adoption plan for this repo

### What's missing for this to work

| Need                                                                                      | Status                                                             | Owner                |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------- |
| Compatibility issues 1-5 resolved (see above)                                             | **Blocked** — needs platform team and/or our own variable plumbing | This repo + Platform |
| `pr_creation_central.yml` + `pr_merge_central.yml` (one each, two jobs each for dev+prod) | TODO                                                               | This repo            |
| `environments/shipsoliddev/checkov_skips.cfg`, `environments/shipsolid/checkov_skips.cfg` | TODO                                                               | This repo            |
| Org-level secret `TF_API_TOKEN` accessible to this repo                                   | **Verify**                                                         | Platform team        |
| `MY_GITHUB_TOKEN` (PAT or GitHub App) accessible to this repo                             | **Verify**                                                         | Platform team        |
| `AZURE_CREDENTIALS` JSON SP credential as a secret                                        | **Verify**                                                         | Platform team        |
| `AAD_CLIENT_SECRET` as a secret (mapped to our `azure_ad_client_secret` use case)         | **Verify**                                                         | This repo            |
| GitHub Environment `production` (or whatever resolves issue 4)                            | TODO                                                               | This repo            |
| Generator sync pre-step                                                                   | Designed (see Decisions)                                           | This repo            |
| Delete `plan.yml`, `plan-shipsolid.yml`, `apply.yml`, `apply-shipsolid.yml`               | TODO once central is verified end-to-end                           | This repo            |

### Two stacks → one workflow file or two?

The reference repo has only `dev/`. We have `environments/shipsoliddev/` and
`environments/shipsolid/`. Two equally valid options:

#### Option (a) — one file per phase, two jobs each (recommended)

Closest to the reference pattern; uses `needs:` to enforce the `shipsoliddev` → `shipsolid`
promotion at the job level:

```yaml
jobs:
  generator_sync_check: ...
  get_checkov_skips_job_dev:
    needs: generator_sync_check
    ...
  trigger_central_pr_apply_pipeline_reusable_workflow_dev:
    needs: get_checkov_skips_job_dev
    with:
      working_directory: "environments/shipsoliddev"
      ...
  get_checkov_skips_job_prod:
    needs: generator_sync_check
    ...
  trigger_central_pr_apply_pipeline_reusable_workflow_prod:
    needs:
      - get_checkov_skips_job_prod
      - trigger_central_pr_apply_pipeline_reusable_workflow_dev
    with:
      working_directory: "environments/shipsolid"
      ...
```

#### Option (b) — two file pairs (`pr_merge_central.yml` + `pr_merge_central_shipsolid.yml`)

Closer to the existing `*-shipsolid.yml` split. Easier to gate the prod file behind a label trigger
or `workflow_dispatch`, but duplicates the trigger + checkov-skip-read boilerplate.

Going with **(a)**: single file enforces ordering naturally; less duplication.

### Bugs / gaps to fix in our consumer workflow

- **PR-close-without-merge will trigger apply.** `pull_request: types: [closed]` fires on close, not
  just merge. Add a job-level guard:
  `if: github.event.pull_request.merged == true || github.event_name == 'workflow_dispatch'`.
- **`pr_event_action` is empty on `workflow_dispatch`.** `github.event.action` doesn't exist for
  manual triggers. Defensive default in the inputs:
  `pr_event_action: "${{ github.event.action || 'manual' }}"`.

### Comparison to our current (post-TFC-migration) design

| Aspect                | Current (post-TFC)                                                       | Central pipeline                                                                                     |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Plan trigger          | `plan.yml` on PR                                                         | `pr_creation_central.yml` → reusable                                                                 |
| Apply trigger         | `apply.yml` on push to main + Environment approval                       | `pr_merge_central.yml` on PR close                                                                   |
| State backend         | TFC `cloud {}`                                                           | TFC `cloud {}` (same)                                                                                |
| Execution             | TFC remote                                                               | TFC remote (same)                                                                                    |
| Approval gate         | GitHub Environments (`shipsolid-dev`, `shipsolid-prod`)                  | GitHub Environment `production` (issue 4 — needs parameterisation for per-stack gating)              |
| Generator step        | Inline in workflow (`python tools/generate.py` + `git diff --exit-code`) | Pre-step in our consumer workflow, gates `trigger_central_*` jobs via `needs:` (see Decisions)       |
| Plan-of-record        | Saved tfplan artifact, applied verbatim within apply.yml                 | Re-plan at merge-time apply workflow (drift risk window between PR-time review and merge-time apply) |
| Promotion model       | `apply.yml` → manual `apply-shipsolid.yml`                               | Single workflow file, two jobs, `needs:` ordering                                                    |
| Auth to Azure (apply) | Static SP via `ARM_*` workspace vars in TFC                              | Static SP via `ARM_*` env vars on runner + `azure/login` with `AZURE_CREDENTIALS` JSON               |
| Terraform version     | `1.14.9` (our pin)                                                       | `1.11.4` (central's pin) — **incompatible**                                                          |
| Org consistency       | Repo-specific                                                            | Aligned with all ShipSolid IaC repos                                                                 |

---

## Decisions

Resolved items that constrain the adoption design.

### Generator sync check stays — runs as a consumer-side pre-step

**Decision:** the central reusable workflow does not run `tools/generate.py`. We keep the
generator-sync gate by adding a `generator_sync_check` job in both consumer workflows that runs
_before_ the `trigger_central_*` jobs.

**Rationale:**

- Dropping the gate (option b — trust committed artifacts) silently allows stale `generated/` to
  ship: someone changes a template, forgets to run `./tf.sh generate`, the central workflow plans
  against the stale artifacts and applies stale dashboards/alerts. The whole point of the generator
  is to keep templates and their outputs in sync; trusting humans to remember is exactly what the
  gate prevents.
- Pre-commit hooks (option c) are not authoritative — they run only for developers who installed
  pre-commit, and CI must be the source of truth.
- The pre-step (option a) is cheap (~30-60s for Python setup + generator + `git diff`) and runs only
  on PRs whose `paths:` filter matches Terraform files.

**Shape:**

```yaml
jobs:
  generator_sync_check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r tools/requirements.txt
      - run: python tools/generate.py
      - name: Fail if generated/ is stale
        run: |
          git diff --exit-code alert_rules/generated/ dashboards/generated/ \
            || (echo "ERROR: Generated files are out of sync. Run: python tools/generate.py" && exit 1)

  get_checkov_skips_job_dev:
    needs: generator_sync_check
    runs-on: ubuntu-latest
    steps: ...

  trigger_central_pr_plan_pipeline_reusable_workflow_dev:
    needs: [generator_sync_check, get_checkov_skips_job_dev]
    uses: ShipSolidFoods/mf-core-pipelines/.github/workflows/iac-terraform-pr-create.yaml@main
    ...

  # …shipsolid jobs follow the same needs: chain
```

**Trigger paths to include:**

```yaml
on:
  pull_request:
    paths:
      - "alert_rules/templates/**"
      - "dashboards/templates/**"
      - "tools/**"
      - "products.yml"
      - "environments/**"
      - "modules/**"
      - "alert_rules/generated/**"   # catches manual hand-edits — diff against fresh generation will fail
      - "dashboards/generated/**"    # same
      - "k8s/**"
```

### Workflow layout — one file per phase, two jobs each (option a)

Single file enforces `shipsoliddev` → `shipsolid` ordering naturally via `needs:`; less duplication
than two file pairs. Documented above.

### Auth model — accept static SP credentials for now

The central workflow does not use OIDC despite having the permission set. Adopting the central
pipeline does not bring us closer to OIDC. If OIDC is a goal, it has to be a separate platform-team
initiative, not blocked on this adoption.

---

## Open questions (still unanswered)

### Critical

- [ ] **Will the platform team accept a PR to `mf-core-pipelines`** to fix compatibility issues 1,
      2, 3, 4 (parameterise terraform version, remove hardcoded `-var` flags or gate them, gate
      `terraform-docs` git-push, parameterise environment name)? If yes, what's the timeline?
- [ ] **Are `TF_API_TOKEN`, `MY_GITHUB_TOKEN`, `AZURE_CREDENTIALS` org-level secrets** automatically
      inherited by ShipSolidFoods repos, or do we need to provision per-repo?

### Important

- [ ] **What happens if `terraform-docs` runs without our READMEs having the inject markers?** Read
      the action's source/docs to confirm it no-ops vs auto-inserting markers.
- [ ] **Can the `production` Environment in our repo have approval rules that distinguish dev vs
      prod runs?** Likely no — Environment is set at the central-workflow job level, not by our
      caller. So approval logic moves into TFC (run approvals or Sentinel) for per-stack gating.
- [ ] **Does the consumer workflow need `permissions: id-token: write` set even though OIDC isn't
      used?** Probably yes, to match the reusable workflow's declared permissions; reusable
      workflows can't grant permissions the caller doesn't have.

### Nice to have

- [ ] **Versioning policy for the reusable workflow.** Reference repo uses `@main`. Pinning to
      `@v1.x` or a SHA gives change-management; staying on `@main` gets fixes faster but exposes us
      to breakage.
- [ ] **Step summary / reporting.** Anything queryable for fleet-level CI health across consumer
      repos?
- [ ] **Slack/Teams notifications.** None observed in the central workflow. We'd add our own if
      wanted.

---

## Implementation status (sec-test branch)

| #   | Step                                                                                  | Status                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------- |
| 1   | Drafted `mf-core-pipelines` PR fixing 4 of 5 blockers                                 | ✅ committed locally on `feat/parameterise-iac-terraform-workflows` (`9e005f6`); not yet pushed                                                                                          |
| 2   | Drafted platform-team feedback email                                                  | ✅ _docs/email-platform-team-feedback.md (source-repo only)_                                                                                                                             |
| 3   | Add `environments/shipsoliddev/checkov_skips.cfg`                                     | ✅ Empty with format-rules header. Skips added as Checkov findings surface.                                                                                                              |
| 4   | Add `environments/shipsolid/checkov_skips.cfg`                                        | ✅ Same shape, prod-stricter guidance in the header.                                                                                                                                     |
| 5   | Add `.github/workflows/pr_creation_central.yml`                                       | ✅ Plan path. Two-stack with `needs:` promotion gate. `pull_request` trigger commented; `workflow_dispatch` only for now.                                                                |
| 6   | Add `.github/workflows/pr_merge_central.yml`                                          | ✅ Apply path. Two-tier env gating (caller `shipsolid-dev`/`shipsolid-prod` + central `apply_environment`). `if: pull_request.merged == true \|\| workflow_dispatch` guard on every job. |
| 7   | Confirm `TF_API_TOKEN`, `MY_GITHUB_TOKEN`, `AZURE_CREDENTIALS`, `ARM_*` accessibility | ⏳ Pending platform-team confirmation                                                                                                                                                    |
| 8   | Create GitHub Environments `shipsolid-dev`, `shipsolid-prod` with reviewers           | ⏳ Pending                                                                                                                                                                               |
| 9   | Push `mf-core-pipelines` branch + open PR                                             | ⏳ Pending user confirmation                                                                                                                                                             |
| 10  | After PR merges + Environments exist: uncomment `pull_request` triggers               | ⏳ Pending                                                                                                                                                                               |
| 11  | Soak ≥3 PRs through central pipeline on `shipsoliddev` only                           | ⏳ Pending                                                                                                                                                                               |
| 12  | Delete `plan.yml`, `plan-shipsolid.yml`, `apply.yml`, `apply-shipsolid.yml`           | ✅ Removed on `sec-test`. **Do not merge sec-test to main until items 9-10 are complete** — between branch-merge and trigger-activation there is no active PR plan/apply CI.             |
| 13  | Update [[cicd                                                                         | docs/cicd.md]], [[system-design                                                                                                                                                          | docs/system-design.md]] §4.13 | ⏳ Pending cutover completion |

### What's wired vs what's not

```text
sec-test branch
  ├─ .github/workflows/
  │     pr_creation_central.yml   ← NEW, workflow_dispatch only
  │     pr_merge_central.yml      ← NEW, workflow_dispatch only
  │     drift.yml                 ← stays
  │     drift-shipsolid.yml          ← stays
  │     test.yml                  ← stays
  │     token-expiry.yml          ← stays
  │     [plan.yml, plan-shipsolid.yml, apply.yml, apply-shipsolid.yml]   ← DELETED
  ├─ environments/shipsoliddev/checkov_skips.cfg   ← NEW
  └─ environments/shipsolid/checkov_skips.cfg     ← NEW
```

> **Branch-merge gating:** sec-test must NOT merge to main until items 9-10 in the table above are
> complete. Between branch-merge and trigger-activation, there is no active PR-plan or
> apply-on-merge CI on main — only drift detection and module tests. Sequence is:
>
> 1. Platform-team merges our `mf-core-pipelines` PR.
> 2. Confirm `MY_GITHUB_TOKEN` etc. accessible.
> 3. Create `shipsolid-dev` / `shipsolid-prod` GitHub Environments in this repo with reviewers.
> 4. **Then** uncomment the `pull_request:` triggers in `pr_creation_central.yml` and
>    `pr_merge_central.yml`.
> 5. **Then** merge sec-test to main.
>
> The new workflow files themselves are safe (they fire only on `workflow_dispatch`, and even then
> would fail until the platform-team PR lands because `@main` doesn't recognise the new inputs yet)
> — the operational risk is the gap on `main` while CI sits idle.

---

## Related docs

- [[migrate-to-tfc|migrate-to-tfc.md]] — the prerequisite TFC migration. Must complete first.
- [[cicd|cicd.md]] — current CI/CD shape. Will need a major rewrite once central pipeline is
  adopted.
- [[system-design|system-design.md]] §4.13 — current CI/CD section will need updating.
