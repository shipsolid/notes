---
title: "Platform Overview"
description: "The platform pillar is currently centered on Terraform workload roots under"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603261321-2"
relations:
  - slug: projects/platform-shipsolid/06-build-release/naming-conventions
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/architecture-overview
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/observability-overview
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/pillar-model
    kind: related
---

## Platform

The [[projects/platform-shipsolid/01-platform-architecture/pillar-model|platform pillar]] is
currently centered on Terraform workload roots under `c-platform/01-terraform-samples/`, consumed by
the
[[projects/platform-shipsolid/01-platform-architecture/observability-overview|observability pillar]]
through configuration rather than code imports.

## Layout

- `modules/azure/` for reusable Azure modules
- `modules/grafana/` for shared Grafana-related Terraform modules
- `modules/shared/` for shared naming, tags, and resource-group helpers
- `workloads/<workload>/` for Terraform roots
- `workloads/<workload>/vars/<env>.tfvars` for environment values

## Working Model

Run Terraform through the Makefile:

```bash
cd c-platform/01-terraform-samples
make plan WORKLOAD=azure-vm-cluster ENV=dev
make apply WORKLOAD=azure-vm-cluster ENV=dev
```

Backends are workload-specific, but the contract is standardized: every workload root must carry
`backends/{dev,qa,prod}.tfbackend` plus `vars/{dev,qa,prod}.tfvars`.

For credentialed CI validation, use `.github/workflows/c00-terraform-live-validation.yml`. That
workflow builds a matrix from `workloads/registry.json`, verifies the required secrets for each
workload type, checks that the Terraform Cloud workspace exists, and then runs a real
`init + validate + plan` through the shared reusable Terraform workflow.

## Related Docs

- `c-platform/README.md`
- `c-platform/01-terraform-samples/README.md`
- [[naming-conventions|standards/naming-conventions.md]]
