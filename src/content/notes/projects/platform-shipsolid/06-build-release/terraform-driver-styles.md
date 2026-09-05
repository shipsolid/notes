---
title: "Terraform Driver Styles"
description: "The repo runs Terraform two different ways."
tags: ["ShipSolid", "CI/CD"]
updated: 2026-05-01
hidden: false
zettelId: "202604291630"
relations:
  - slug: projects/platform-shipsolid/06-build-release/code-standards
    kind: depends_on
  - slug: projects/platform-shipsolid/06-build-release/pre-commit-hooks
    kind: related
  - slug: projects/platform-shipsolid/06-build-release/cicd-overview
    kind: related
---

## Terraform Driver Styles

The repo runs Terraform two different ways. Both are intentional. This doc codifies which style to
use, so future modules don't pick the wrong driver and end up with mismatched promotion semantics.

## Style A — Makefile + workload/env axes

**Used by:** `c-platform/01-terraform-samples/`

**Shape.** A single Makefile drives every workload across every environment. Workloads live under
`workloads/<workload>/`. Per-env config is selected at invocation time:

- backend config: `backends/<env>.tfbackend`
- variable file: `vars/<env>.tfvars` (auto-included if present)

**How to use:**

```bash
cd c-platform/01-terraform-samples
make plan  WORKLOAD=azure-vm-cluster ENV=dev
make apply WORKLOAD=azure-vm-cluster ENV=dev
```

**When to pick this style:**

- Many workloads share the same env axis (dev/qa/prod) and the same backend layout.
- Promotion is a developer action — apply locally or from a single workflow.
- You want the workload directory to stay clean (no per-env wrappers).

## Style B — Per-env wrapper directories

**Used by:** `f-observability/06-grafana-cloud-v2/`

**Shape.** Each environment is its own root module. `envs/<env>/` contains `main.tf`, `backend.hcl`,
and `<env>.tfvars`. The root modules call into shared modules under `modules/`.

**How to use:**

```bash
cd f-observability/06-grafana-cloud-v2
terraform -chdir=envs/dev init -reconfigure -backend-config=backend.hcl
terraform -chdir=envs/dev plan -var-file=dev.tfvars -out=tfplan.bin
terraform -chdir=envs/dev show -json tfplan.bin > /tmp/tfplan.json
conftest test /tmp/tfplan.json --policy policy/conftest
terraform -chdir=envs/dev apply tfplan.bin
```

Full command cookbook lives at `f-observability/06-grafana-cloud-v2/CLI_REFERENCE.md` in the repo
(outside the docs tree).

**When to pick this style:**

- Environments diverge in non-trivial ways (different providers, different data sources, different
  policy bundles).
- Promotion is gated through GitHub Environments and applies sequentially to dev → qa → prod on
  merge.
- You want a policy gate (conftest, opa, infracost) to run against a saved plan file before apply,
  env by env — see the
  [[projects/platform-shipsolid/06-build-release/cicd-overview|CI/CD Overview]]'s Owner-Routed
  Reporting section for how workload-specific Rego packs get selected per root.
- The project ships its own provider lockfile policy — e.g. `06-grafana-cloud-v2` pins providers in
  `versions.tf` and ignores `.terraform.lock.hcl` rather than committing per-env lockfiles.

## Decision rubric

Use this when starting a new TF root in the repo:

| Question                                                         | Style A | Style B |
| ---------------------------------------------------------------- | ------- | ------- |
| Are envs structurally identical, only varying by tfvars/backend? | yes     | no      |
| Do you need per-env policy gates between plan and apply?         | no      | yes     |
| Do you promote via GitHub Environments with sequential gates?    | no      | yes     |
| Are you treating Terraform as a developer tool, not a pipeline?  | yes     | no      |
| Will more than one workload live under the same root?            | yes     | no      |

If the answers are mixed, pick **Style B** — it scales up cleanly; Style A does not scale down
without churn.

## What both styles share

- Variables must declare `description`, `type`, and `validation` where applicable (per
  [[code-standards|code-standards.md]]).
- Outputs must declare `description`.
- `terraform fmt` is mandatory before commit — enforced locally by the `terraform_fmt`
  [[projects/platform-shipsolid/06-build-release/pre-commit-hooks|pre-commit hook]].
- `terraform validate` and `terraform plan` must be clean in CI.
- Provider versions are pinned in `versions.tf` (or a tracked `.terraform.lock.hcl`, per the
  project's lockfile policy — they are mutually exclusive, pick one).
- Secrets are never written into `*.tfvars` — source them from env, vault, or sealed secrets at
  runtime.

## What you don't do

- Do not introduce a third style. If neither A nor B fits, open an ADR.
- Do not mix the styles inside one project (no `envs/dev/` _and_ a top-level Makefile driver in the
  same root).
- Do not promote across envs by hand-editing tfvars in the dev root and re-running — that's how
  Style A's simplicity rots into Style B's requirements without anyone deciding.
