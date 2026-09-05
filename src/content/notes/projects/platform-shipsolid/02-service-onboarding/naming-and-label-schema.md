---
title: "Naming & Label Schema"
description: "The canonical label and resource-attribute schema every signal must follow."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-16"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/resource-label-naming-convention
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/metrics-instrumentation-guide
    kind: related
  - slug: projects/platform-shipsolid/07-cost-governance/cardinality-governance
    kind: related
  - slug: projects/platform-shipsolid/06-build-release/naming-conventions
    kind: related
---

## Naming & Label Schema

The canonical label and resource-attribute schema every signal must follow. Cross-reference:
[[resource-label-naming-convention|Resource Label & Tag Naming Convention]].

---

## 1. OTel Resource Attributes (SDK / OTLP side)

Set these at instrumentation time via `OTEL_RESOURCE_ATTRIBUTES` or the SDK. They flow from the
application into Alloy over OTLP and are propagated to Mimir, Loki, and Tempo.

| Attribute                | Source  | Example         | Cardinality                                       |
| ------------------------ | ------- | --------------- | ------------------------------------------------- |
| `service.name`           | service | `api-gateway`   | bounded (count of services)                       |
| `service.namespace`      | team    | `platform`      | bounded                                           |
| `deployment.environment` | env     | `prod`          | bounded (`dev` / `qa` / `prod`)                   |
| `k8s.cluster.name`       | infra   | `ss-aks-prod-1` | bounded                                           |
| `service.version`        | build   | `1.4.2`         | bounded-ish — watch churn on noisy release trains |

Helm wiring (via Downward API):

```yaml
env:
  - name: OTEL_SERVICE_NAME
    value: "{{ .Values.service.name }}"
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: "deployment.environment={{ .Values.environment }},service.version={{ .Chart.AppVersion }}"
```

---

## 2. Prometheus / Loki Metric Labels (platform layer)

These labels are **not** set in the application. They are stamped at the platform layer (Alloy
pipeline config or Helm chart metadata) and apply uniformly to all series from a given workload.

### 2a. Cost-attribution labels (required on every Alloy pipeline)

| Label                    | Approved values               | Notes                                     |
| ------------------------ | ----------------------------- | ----------------------------------------- |
| `deployment_environment` | `dev`, `qa`, `prod`           | Grafana Cloud native cost attribution key |
| `bu`                     | `platform`, `commerce`        | Lowercase, no spaces                      |
| `product`                | `gateway`, `billing`, `infra` | Lowercase, hyphen-separated               |

Do not invent new environment names. Open a platform request to add approved values. These are
**constant external labels** — adding them does not increase series count.

### 2b. Standard labels (required on every metric)

| Label       | Description             | Example             |
| ----------- | ----------------------- | ------------------- |
| `env`       | Deployment environment  | `dev`, `qa`, `prod` |
| `service`   | Service name            | `api-gateway`       |
| `component` | Sub-component or module | `database`, `api`   |
| `team`      | Owning team             | `platform-team`     |
| `region`    | Azure region            | `eastus`, `westeu`  |

Label values are lowercase with hyphens. Custom labels require SRE team approval and a cardinality
estimate.

### 2c. Alloy wiring

```alloy
prometheus.remote_write "grafana_cloud" {
  endpoint {
    url = env("GRAFANA_CLOUD_METRICS_URL")

    write_relabel_config {
      action       = "replace"
      target_label = "deployment_environment"
      replacement  = env("DEPLOY_ENV")   // "dev" | "qa" | "prod"
    }

    write_relabel_config {
      action       = "replace"
      target_label = "bu"
      replacement  = env("BU")           // e.g. "platform"
    }

    write_relabel_config {
      action       = "replace"
      target_label = "product"
      replacement  = env("PRODUCT")      // e.g. "gateway"
    }
  }
}
```

Inject `DEPLOY_ENV`, `BU`, and `PRODUCT` via Helm values — never hardcode in the Alloy config.

---

## 3. Kubernetes Pod Labels

Use a `platform.io/` prefix for platform-defined labels to avoid collisions with Kubernetes-native
labels and third-party operators. These are read by Alloy from pod metadata to populate metric and
log stream labels automatically.

```yaml
metadata:
  labels:
    # Platform labels — consumed by Alloy for cost attribution
    platform.io/bu: platform
    platform.io/product: gateway
    platform.io/deployment_environment: dev

    # Kubernetes standard labels
    app.kubernetes.io/name: api-gateway
    app.kubernetes.io/part-of: gateway
    app.kubernetes.io/managed-by: helm

    # ShipSolid custom labels
    shipsolid.com/team: "platform-team"
    shipsolid.com/env: "dev"
    shipsolid.com/region: "eastus"
```

A Kyverno `ClusterPolicy` validates that all `Deployment`, `StatefulSet`, and `DaemonSet` resources
carry the three required `platform.io/` labels at admission time.

---

## 4. Alert Naming Convention

Pattern: `{env}.{service}.{component}.{signal}.{severity}.{team}`

| Segment     | Example values                                       |
| ----------- | ---------------------------------------------------- |
| `env`       | `prod`, `qa`, `dev`                                  |
| `service`   | `api-gateway`, `billing-service`                     |
| `component` | `database`, `api`, `aks`                             |
| `signal`    | `latency-p99`, `connection-errors`, `node-not-ready` |
| `severity`  | `p1`, `p2`, `p3`, `p4`                               |
| `team`      | `sre-team`, `commerce-team`, `platform-team`         |

Use dots as segment separators; hyphens within values.

Examples:

- `prod.billing-service.database.connection-errors.p1.commerce-team`
- `dev.api-gateway.api-gateway.latency-p99.p3.platform-team`

Alerts must include `runbook_url` and `severity` / `team` as rule labels (not only in the title).
See [[alerts-standards|Alert Standards]].

---

## 5. Forbidden in Labels

Never put these in metric labels, Loki stream labels, or trace attributes — they belong in log
bodies, trace spans, or exemplars:

- Request IDs, trace IDs, session IDs
- User IDs, account IDs
- Raw timestamps
- Full URLs containing path parameters
- Error message strings

High-churn values create a new series per unique value and are the primary cost driver.

---

## 6. Governance

Any new label or attribute requires a **cardinality estimate** in the same PR — not a "looks fine".
Reach for the **Cardinality Budget Calculator** skill before adding any label bound for production.

To propose a new required label or approved value, open a platform RFC.

---

## Related

- [[metrics-instrumentation-guide|Metrics Instrumentation Guide]]
- [[cardinality-governance|Cardinality Governance]]
- [[resource-label-naming-convention|Resource Label & Tag Naming Convention]]
- [[naming-conventions|Naming Conventions]]
