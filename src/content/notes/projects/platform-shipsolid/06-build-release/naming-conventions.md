---
title: "Naming Conventions"
description: "This document defines the naming patterns for all resources, files, and artifacts in this monorepo."
tags: ["ShipSolid", "CI/CD"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022-8"
relations:
  - slug: projects/platform-shipsolid/06-build-release/code-standards
    kind: related
  - slug: projects/platform-shipsolid/06-build-release/cicd-overview
    kind: related
  - slug: observability/reference/cardinality
    kind: related
---

## Naming Conventions

This document defines the naming patterns for all resources, files, and artifacts in this monorepo.
Consistent naming reduces cognitive load and simplifies automation.

---

## 1. Azure Resources

**Pattern:** `{project}-{environment}-{resource_type}`

| Resource Type          | Abbreviation | Example                     |
| ---------------------- | ------------ | --------------------------- |
| Resource Group         | `rg`         | `archlab-dev-rg`            |
| Virtual Network        | `vnet`       | `archlab-dev-vnet`          |
| Subnet                 | `snet`       | `archlab-dev-snet-app`      |
| Network Security Group | `nsg`        | `archlab-dev-nsg-app`       |
| AKS Cluster            | `aks`        | `archlab-dev-aks`           |
| Key Vault              | `kv`         | `archlab-dev-kv`            |
| Storage Account        | `st`         | `archlabdevst` (no hyphens) |
| Container Registry     | `cr`         | `archlabdevcr` (no hyphens) |
| Managed Identity       | `id`         | `archlab-dev-id-app`        |
| Log Analytics          | `law`        | `archlab-dev-law`           |
| Application Gateway    | `agw`        | `archlab-dev-agw`           |
| Private Endpoint       | `pe`         | `archlab-dev-pe-kv`         |

Use lowercase with hyphens (except where Azure disallows them). Keep names under 24 characters where
Azure imposes limits. Append a functional suffix for multiple resources of the same type (e.g.,
`-app`, `-db`).

---

## 2. Terraform Modules

**Pattern:** lowercase, hyphen-separated

```
modules/azure/{domain}/{module-name}/
```

Examples:

- `modules/azure/network/vnet-with-subnets/`
- `modules/azure/compute/aks-cluster/`
- `modules/azure/identity_secrets/key-vault/`

Module names describe what they provision. Use underscores for domain groupings (matching existing
structure). Variable names and HCL resource names use `snake_case`.

---

## 3. Docker Images

**Pattern:** `ghcr.io/{org}/{service}:{tag}`

Examples:

- `ghcr.io/shipsolid/fakestore-ingestor:1.2.0`
- `ghcr.io/shipsolid/fastapi-sample:0.3.1`
- `ghcr.io/shipsolid/petclinic-api-gateway:2.0.0`

**Tag formats:**

| Context     | Format           | Example             |
| ----------- | ---------------- | ------------------- |
| Release     | Semantic version | `1.2.0`             |
| CI build    | Git SHA (short)  | `abc1234`           |
| Development | Branch + SHA     | `feat-auth-abc1234` |

Never use `latest` in production. Service name matches the directory name (minus numeric prefix).
Use lowercase throughout.

---

## 4. GitHub Workflows

**Pattern:** `{pillar_code}{sequence}-{service_name}.yml`

Examples:

- `d02-dotnet.FakeStoreIngestor.gc2.yml`
- `d03-fakestore-mock.yml`
- `f01-grafanaCloud.yml`
- `f02-load-test.yml`

Pillar code is the single letter prefix (`a` through `h`). Sequence number is two digits,
zero-padded. Use hyphens in descriptions. Reusable workflows use a `reusable-` prefix. See the
[[projects/platform-shipsolid/06-build-release/cicd-overview|CI/CD Overview]] for live examples
(`p00-production-validation.yml`, `e00-gitops-rollout-readiness.yml`) of this pattern in use.

Standard [[projects/platform-shipsolid/06-build-release/code-standards|Code Standards]] also apply
across languages; naming is one slice of that broader contract.

---

## 5. Alert Names

**Pattern:** `{env}.{service}.{component}.{signal}.{severity}.{team}`

Examples:

- `prod.fakestore-ingestor.database.connection-errors.p1.dotnet-team`
- `dev.petclinic.api-gateway.latency-p99.p3.java-team`
- `prod.platform.aks.node-not-ready.p1.platform-team`

**Severity levels:** `p1`, `p2`, `p3`, `p4`

Use dots as separators between segments, hyphens within values. Team name must match CODEOWNERS.
Alerts must include a runbook link.

---

## 6. Metric Labels

All metrics must include the following standard labels:

| Label       | Description             | Example              |
| ----------- | ----------------------- | -------------------- |
| `env`       | Deployment environment  | `dev`, `qa`, `prod`  |
| `service`   | Service name            | `fakestore-ingestor` |
| `component` | Sub-component or module | `database`, `api`    |
| `team`      | Owning team             | `dotnet-team`        |
| `region`    | Azure region            | `eastus`             |

Label values are lowercase with hyphens. No high-[[tech/cardinality|cardinality]] labels (user IDs,
request IDs). Custom labels require SRE team approval.

---

## 7. Git Branches

**Pattern:** `{type}/{pillar}/{description}`

| Prefix     | Purpose                         |
| ---------- | ------------------------------- |
| `feat/`    | New feature                     |
| `fix/`     | Bug fix                         |
| `chore/`   | Maintenance, dependency updates |
| `release/` | Release preparation             |
| `hotfix/`  | Urgent production fix           |

Examples:

- `feat/d-apps/add-product-search-endpoint`
- `fix/c-platform/correct-subnet-cidr-overlap`
- `chore/f-observability/update-alloy-dashboards`
- `release/v1.2.0`

Use lowercase and hyphens. Keep under 60 characters. Include pillar prefix for pillar-specific
changes; omit for cross-cutting changes.

---

## 8. Monorepo Directory Structure

Pattern: `{letter}-{pillar_name}/{nn}-{description}/`. Pillar letters `a` through `h`,
sub-directories use two-digit numeric prefixes. New pillars require an ADR and platform-leads
approval.
