---
title: "Resource Label & Tag Naming Convention"
description: "**Status:** Active **Last Updated:** 2026-03-24 **Applies To:** Grafana Cloud (cost attribution),"
tags: ["ShipSolid", "Onboarding"]
updated: 2026-05-01
hidden: false
zettelId: "202603241603"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/metrics-instrumentation-guide
    kind: related
---

## Resource Label & Tag Naming Convention

**Status:** Active **Last Updated:** 2026-03-24 **Applies To:** Grafana Cloud (cost attribution),
Kubernetes Objects (labels), Azure Resources (tags)

---

## Problem Statement

As the platform scales to serve multiple business units, a single `deployment_environment` label can
only attribute Grafana Cloud costs to one dimension (environment). With no `bu` or `product` labels,
it is impossible to answer:

- Which BU is driving the most observability spend?
- Which product's metrics volume is growing fastest?
- What does prod cost across all teams vs dev?

A compound string like `dgag-passport-dev` stuffed into `deployment_environment` appears to solve
this but breaks native cost grouping — Grafana Cloud's attribution UI filters on exact label values,
not substrings.

---

## Convention: Discrete Labels, Shared Schema

Each cost dimension is a **separate label key**. This enables native grouping in Grafana Cloud cost
attribution, clean PromQL selectors, and consistent RBAC scoping — without any regex parsing.

### Required Labels

| Dimension          | Label Key                | Example Values                | Notes                                     |
| ------------------ | ------------------------ | ----------------------------- | ----------------------------------------- |
| Environment        | `deployment_environment` | `dev`, `qa`, `prod`           | Grafana Cloud native cost attribution key |
| Business Unit      | `bu`                     | `dgag`, `daia`                | Lowercase, no spaces                      |
| Product / Workload | `product`                | `passport`, `mdixai`, `infra` | Lowercase, hyphen-separated               |

### Approved `deployment_environment` Values

| Value  | Description                 |
| ------ | --------------------------- |
| `dev`  | Development                 |
| `qa`   | Quality assurance / staging |
| `prod` | Production                  |

Do not invent environment names (e.g. no `uat`, `sandbox`, `test`). Open a platform request to add
new values.

---

## Grafana Cloud Cost Attribution

Grafana Cloud's native cost attribution groups usage by label value. With three discrete labels,
every cost view becomes composable:

| Question                        | How to query                                            |
| ------------------------------- | ------------------------------------------------------- |
| Cost by environment             | Group by `deployment_environment`                       |
| Cost by BU                      | Group by `bu`                                           |
| Cost by product                 | Group by `product`                                      |
| Cost for dgag in prod           | Filter `bu=dgag` + `deployment_environment=prod`        |
| Which product costs most in dev | Filter `deployment_environment=dev`, group by `product` |

### What a single label cannot do

If only `deployment_environment` is present, the only available grouping is env tier. Adding `bu`
and `product` unlocks all the above without changing `deployment_environment` or its values.

### Do attribution labels increase cost?

No. `deployment_environment`, `bu`, and `product` are **constant external labels** — set once in the
Alloy config and stamped uniformly onto every series from that agent. They do not multiply series
count.

1,000 existing series with `bu=dgag` added = still 1,000 series.

This is distinct from **high-cardinality per-series labels** (e.g. `user_id`, `request_id`) which
create a new series per unique value and are the actual cost driver. Dropping attribution labels
saves effectively nothing.

**If cost reduction is a goal, these levers have real impact:**

1. **Drop unused metrics** at the Alloy layer using `metric_relabel_config` drop rules before remote
   write
2. **Increase scrape interval** for non-critical metrics (60s instead of 15s reduces volume 4×)
3. **Use recording rules** to pre-aggregate high-cardinality metrics; store the rollup, not the raw
   series
4. **Set retention policies** — avoid retaining high-resolution raw data longer than operationally
   needed

---

## Grafana Alloy Configuration

Set the three labels in your Alloy pipeline so they are applied uniformly to all telemetry from a
given workload. Do not rely on application code to set these.

```alloy
// metrics pipeline example
prometheus.remote_write "grafana_cloud" {
  endpoint {
    url = env("GRAFANA_CLOUD_METRICS_URL")

    write_relabel_config {
      action       = "replace"
      target_label = "deployment_environment"
      replacement  = env("DEPLOY_ENV")           // "dev" | "qa" | "prod"
    }

    write_relabel_config {
      action       = "replace"
      target_label = "bu"
      replacement  = env("BU")                   // e.g. "dgag"
    }

    write_relabel_config {
      action       = "replace"
      target_label = "product"
      replacement  = env("PRODUCT")              // e.g. "passport"
    }
  }
}
```

Environment variables `DEPLOY_ENV`, `BU`, and `PRODUCT` should be injected via Helm chart values or
the AKS/ACA deployment manifest — not hardcoded in the Alloy config.

---

## Kubernetes Labels

Pod labels are the source of truth for `bu` and `product` values. Alloy should read these from the
pod's metadata rather than requiring separate env vars where possible.

Use a namespaced prefix (`platform.io/`) for platform-defined labels to avoid collisions with
Kubernetes-native labels and third-party operators.

### Example

```yaml
metadata:
  labels:
    # Platform labels — consumed by Alloy for cost attribution
    platform.io/bu: dgag
    platform.io/product: passport
    platform.io/deployment_environment: dev

    # Kubernetes standard labels
    app.kubernetes.io/name: passport-api
    app.kubernetes.io/part-of: passport
    app.kubernetes.io/managed-by: helm
```

### Alloy reading labels from pod metadata

```alloy
discovery.kubernetes "pods" {
  role = "pod"
}

discovery.relabel "platform_labels" {
  targets = discovery.kubernetes.pods.targets

  // Promote pod labels into metric labels
  rule {
    source_labels = ["__meta_kubernetes_pod_label_platform_io_bu"]
    target_label  = "bu"
  }
  rule {
    source_labels = ["__meta_kubernetes_pod_label_platform_io_product"]
    target_label  = "product"
  }
  rule {
    source_labels = ["__meta_kubernetes_pod_label_platform_io_deployment_environment"]
    target_label  = "deployment_environment"
  }
}
```

### PromQL selectors

```promql
# All prod metrics across all BUs
{deployment_environment="prod"}

# Passport workload cost in dev
{bu="dgag", product="passport", deployment_environment="dev"}

# All dgag workloads in prod
{bu="dgag", deployment_environment="prod"}
```

### Kyverno / OPA Enforcement

A `ClusterPolicy` should validate that all `Deployment`, `StatefulSet`, and `DaemonSet` resources
carry the three required `platform.io/` labels at admission time.

---

## Azure Tags

Apply tags to **resource groups** as the primary unit. Mirror the same dimensions used in Grafana
Cloud for consistent cross-tool cost attribution.

```hcl
tags = {
  deployment_environment = "dev"
  bu                     = "dgag"
  product                = "passport"
  infra-type             = "aks"      // Azure-specific, not in Grafana Cloud
  platform               = "true"
}
```

An `audit` or `deny` Azure Policy should be applied at the subscription level to reject resource
groups missing required tags.

---

## What Not to Do

| Anti-pattern                                         | Why                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `deployment_environment = dgag-passport-dev`         | Single compound string — Grafana Cloud can't group on substrings |
| `deployment_environment = DEV`                       | Uppercase breaks label selectors and native attribution filters  |
| Encoding BU or product into `deployment_environment` | Loses the ability to pivot cost independently on each dimension  |
| Setting labels in app code                           | Creates inconsistency; set at the platform layer (Alloy/Helm)    |
| Creating new env values ad hoc                       | Fragments cost reports and alert routing rules                   |
| Dropping `bu` or `product` to reduce cost            | Constant external labels; no series count increase               |

---

## Migration Path

1. **Audit** — identify all Alloy/Agent configs and Helm charts currently setting
   `deployment_environment`
2. **Add labels** — add `bu` and `product` to those same configs; do not change existing
   `deployment_environment` values
3. **Validate** — confirm the three labels appear in Grafana Cloud Explore before enabling cost
   attribution dashboards
4. **Backfill Azure** — update Terraform modules to include matching tags on resource groups
5. **Enforce** — enable Kyverno admission policy for K8s and Azure Policy deny-mode for Azure once
   coverage reaches >95%

---

## Governance

| Role                 | Responsibility                                             |
| -------------------- | ---------------------------------------------------------- |
| Platform Engineering | Maintains this standard, owns Alloy config templates       |
| Application Teams    | Set correct `bu` and `product` values in Helm chart values |
| FinOps               | Validates cost attribution completeness quarterly          |
| Security             | Validates RBAC policy alignment with label schema          |

To propose a new required label or approved value, open a platform RFC.

---

## Related

- [[projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema|Naming & Label Schema]]
  — the canonical resource-attribute and label schema this convention specializes for cost
  attribution.
- [[projects/platform-shipsolid/02-service-onboarding/metrics-instrumentation-guide|Metrics Instrumentation Guide]]
  — shares the same "inject via Helm values, never hardcode" governance pattern for platform labels.
