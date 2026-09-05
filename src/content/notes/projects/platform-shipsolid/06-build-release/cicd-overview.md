---
title: "CI/CD Overview"
description: "The repo currently uses three CI/CD layers:"
tags: ["ShipSolid", "CI/CD"]
updated: 2026-05-01
hidden: false
zettelId: "202603261321-3"
relations:
  - slug: ci-cd/reference/gitops
    kind: related
  - slug: ci-cd/reference/argocd
    kind: related
  - slug: projects/platform-shipsolid/06-build-release/terraform-driver-styles
    kind: related
---

## CI/CD

The repo currently uses three CI/CD layers:

## 1. Repository Sanity

`.github/workflows/main.yml` runs:

- repository-wide change-graph discovery across services, delivery, platform, and observability
- service metadata validation
- generated-artifact drift checks
- repo path sanity checks
- alert contract validation

## 2. Service CI

`.github/workflows/services-from-metadata.yml` now consumes the shared change graph from
`a-governance/scripts/component_registry.py` and selects services based on:

- direct service path changes
- generated-control-plane changes
- inferred delivery impact for GitOps-managed services
- inferred platform impact for services with infra dependencies or required secrets
- inferred observability impact for instrumented services

It then runs a runtime-aware matrix for:

- .NET
- Java
- Python
- Docker-based services

`.github/workflows/services-integration-from-metadata.yml` uses the same change graph for
metadata-declared integration profiles, including the FakeStore + MySQL + mock-upstream flow. The
remaining service-specific workflows are now publication workflows only, used to push immutable
images on `main`.

Remote caches are enabled where the stack supports them:

- NuGet via `actions/cache`
- Maven via `actions/setup-java`
- pip via `actions/setup-python`
- Docker layer caching via `docker/build-push-action` with `type=gha`

## 3. Deployment and Promotion

- `e-gitops/argocd/` contains [[tech/gitops|GitOps]] manifests and [[tech/argocd|Argo]] application
  definitions
- `p00-production-validation.yml` aggregates the current production-validation blockers across
  Terraform, GitOps rollout readiness, and observability proof prerequisites
- `e00-gitops-rollout-readiness.yml` checks whether GitOps-managed services are still in
  bootstrap-zero state and whether required smoke-test variables are configured
- `deploy-with-gates.yml` promotes immutable image references into env-specific GitOps overlays and
  opens a PR after GitHub Environment approval
- `deploy-with-gates.yml` requires a change record for `qa` and `prod` promotions
- `verify-gitops-promotion.yml` smoke-tests merged GitOps promotions and proposes rollback PRs when
  checks fail
- `c05-terraform-apply-with-change-record.yml` adds a governed Terraform apply path with repo-side
  approval records

The delivery path now distinguishes between:

- shared base manifests under `e-gitops/argocd/manifests/fakestore-api/base/`
- shared base manifests under `e-gitops/argocd/manifests/weather-forecast/base/`
- immutable environment overlays under
  `e-gitops/argocd/manifests/fakestore-api/overlays/{dev,qa,prod}/`
- immutable environment overlays under
  `e-gitops/argocd/manifests/weather-forecast/overlays/{dev,qa,prod}/`

That means artifact promotion now happens by changing GitOps state to a digest reference, not by
pointing an environment at a mutable tag. The Argo applications live at
`e-gitops/argocd/apps/fakestore-api-{dev,qa,prod}.yaml`; the shared root manifest tree is for
composition and local rendering, not a standalone environment target. The same pattern now applies
to `weather-forecast` via `e-gitops/argocd/apps/weather-forecast-{dev,qa,prod}.yaml`. The env
overlays begin with a zero digest placeholder, and the promotion workflow replaces that placeholder
with the real image digest when opening the promotion PR. Post-merge verification expects
repo/environment variables derived from `component.yaml`, such as `FAKESTORE_API_BASE_URL_DEV` or
`WEATHER_FORECAST_BASE_URL_PROD`, so the smoke-test workflow can reach the deployed service.

For cluster bootstrap, `e-gitops/scripts/bootstrap-argocd.sh` applies both
`e-gitops/argocd/install/` and `e-gitops/argocd/apps/`. Repo-side topology enforcement now runs
through `e-gitops/scripts/validate-gitops-topology.py`, which is also called by the repo sanity
workflow so a GitOps-managed service cannot drift away from the expected
`apps + overlays + manifest root` shape. `e-gitops/scripts/gitops_rollout_readiness.py` and
`e00-gitops-rollout-readiness.yml` add the next operational layer: they report which overlays still
carry the zero digest placeholder and whether each environment has the expected smoke-test variable
configured before you attempt a live promotion. The image publication workflows now also generate
SPDX SBOM artifacts and GitHub build provenance attestations. `deploy-with-gates.yml` verifies that
an attestation exists for the promoted image digest before it opens the GitOps promotion PR.
`p00-production-validation.yml` is the best current operator entrypoint for the backlog in
`REMAINING_TASKS.md`: it pulls together Terraform preflight, GitOps readiness, and
observability-proof prerequisites into one report.

## 5. Governance Trail

- Policy exceptions live under `a-governance/governance/policy-exceptions/`.
- Change approval records live under `a-governance/governance/change-records/`.
- `deploy-with-gates.yml` validates change records for `qa` and `prod`.
- `c05-terraform-apply-with-change-record.yml` validates change records for Terraform apply.
- `a-governance/scripts/repo-sanity.sh` validates both record sets on every repo-wide sanity run.

## 4. Owner-Routed Reporting

- Terraform drift, cost, and policy workflows resolve workload owners from
  `c-platform/01-terraform-samples/workloads/registry.json`.
- Terraform compliance also resolves a workload-specific policy profile from that registry, so Azure
  and Grafana roots are evaluated with different Rego packs — see
  [[projects/platform-shipsolid/06-build-release/terraform-driver-styles|Terraform Driver Styles]]
  for why those two roots are driven differently in the first place.
- Promotion and rollback reporting resolve service owners from `d-apps/*/component.yaml`.
- Workflow summaries, PR comments, and auto-created issues now identify the owning team instead of
  publishing anonymous platform-wide notifications.
