---
title: "Metric Label Standards for Cost Attribution"
description: "**Goal:** Attribute Grafana Cloud metrics ingestion cost to business unit, product, and environment."
tags: ["ShipSolid", "FinOps"]
updated: 2026-05-01
hidden: false
zettelId: "202603301546"
relations:
  - slug: prometheus/03-instrumentation/02-exporters/02-exporters
    kind: related
  - slug: projects/platform-shipsolid/07-cost-governance/business-alignment
    kind: related
  - slug: observability/reference/prometheus
    kind: depends_on
  - slug: kubernetes/readme
    kind: related
---

## Metric Label Standards for Cost Attribution

**Goal:** Attribute Grafana Cloud metrics ingestion cost to business unit, product, and environment.
Infra vs app metric separation is handled via metric name prefix — no label required for that split.

## **1. Infra vs App Metric Separation (Common to All Approaches)**

[[kubernetes/readme|Kubernetes]] and Windows
[[prometheus/03-instrumentation/02-exporters/02-exporters|exporters]] expose well-known metric
prefixes that identify infra metrics without any custom label. ACA and Azure PaaS metrics arrive via
Azure Monitor — a separate data source — so they are already isolated at the source level.

| Metric Prefix   | Source                     | Classification        |
| --------------- | -------------------------- | --------------------- |
| `kube_*`        | kube-state-metrics         | AKS infra             |
| `node_*`        | node-exporter              | AKS node (host)       |
| `container_*`   | cAdvisor                   | AKS container runtime |
| `windows_*`     | windows-exporter           | AKS Windows nodes     |
| Everything else | App instrumentation / OTel | App workload          |

**Cost attribution split query (Grafana Cloud):**

```promql
# Infra series count
count({__name__=~"kube_.+|node_.+|container_.+|windows_.+"})

# App series count — attributed by platform + BU + product + env
count by (deployment_environment) ({__name__!~"kube_.+|node_.+|container_.+|windows_.+"})
```

---

## **2. Approach A — 4-Segment Compound Label**

A single label encodes platform, business unit, product, and environment.

**Format:**

```text
<infra_type>-<business_unit>-<app>-<env>
```

**Allowed values:**

| Segment         | Allowed Values                 | Count |
| --------------- | ------------------------------ | ----- |
| `infra_type`    | `aks`, `aca`                   | 2     |
| `business_unit` | `dgeg`, `dgag`, `ieo`          | 3     |
| `app`           | `mdixai`, `passport`, `infra`  | 3     |
| `env`           | `dev`, `qa`, `prod`, `sandbox` | 4     |

**Max combinations:** 2 × 3 × 3 × 4 = **72**

**Note on migration:** `infra_type` reflects where the backend is currently deployed. Since only one
platform emits metrics at a time, the label value changes once during a migration cutover (e.g.,
`aca-dgeg-mdixai-prod` → `aks-dgeg-mdixai-prod`). Dashboards and alert rules must be updated at that
point.

**Examples:**

| `deployment_environment` | Meaning                                 |
| ------------------------ | --------------------------------------- |
| `aks-dgeg-mdixai-prod`   | MDIxAI on AKS in DGEG, production       |
| `aca-dgeg-mdixai-dev`    | MDIxAI on ACA in DGEG, dev              |
| `aks-dgag-passport-prod` | Passport on AKS in DGAG, production     |
| `aca-dgag-passport-qa`   | Passport on ACA in DGAG, QA             |
| `aks-ieo-infra-prod`     | Infra product on AKS in IEO, production |
| `aca-ieo-infra-sandbox`  | Infra product on ACA in IEO, sandbox    |

**Prometheus scrape config:**

```yaml
scrape_configs:
  - job_name: aks-dgeg-mdixai-prod
    static_configs:
      - targets: ["mdixai-api.internal:8080"]
        labels:
          deployment_environment: "aks-dgeg-mdixai-prod"
```

**OTel Collector resource processor:**

```yaml
processors:
  resource:
    attributes:
      - key: deployment_environment
        value: "aks-dgeg-mdixai-prod"
        action: upsert
```

**Grafana template variable:**

```text
$deployment_environment → label_values(up, deployment_environment)
```

Single dropdown, full context visible at a glance.

**PromQL panel filter:**

```promql
rate(http_requests_total{deployment_environment="$deployment_environment"}[5m])
```

**Alert rule:**

```yaml
- alert: HighErrorRate
  expr: |
    rate(http_requests_total{status=~"5..", deployment_environment="aks-dgeg-mdixai-prod"}[5m])
    / rate(http_requests_total{deployment_environment="aks-dgeg-mdixai-prod"}[5m]) > 0.02
  labels:
    severity: critical
    deployment_environment: "{{ $labels.deployment_environment }}"
```

**Validation regex:**

```text
^(aks|aca)-(dgeg|dgag|ieo)-(mdixai|passport|infra)-(dev|qa|prod|sandbox)$
```

---

## **3. Approach B — 3-Segment Compound Label**

Platform dropped — a single label encodes business unit, product, and environment only. Platform is
identifiable via metric name prefix or scrape job name.

**Format:**

```text
<business_unit>-<app>-<env>
```

**Allowed values:**

| Segment         | Allowed Values                 | Count |
| --------------- | ------------------------------ | ----- |
| `business_unit` | `dgeg`, `dgag`, `ieo`          | 3     |
| `app`           | `mdixai`, `passport`, `infra`  | 3     |
| `env`           | `dev`, `qa`, `prod`, `sandbox` | 4     |

**Max combinations:** 3 × 3 × 4 = **36**

**Examples:**

| `deployment_environment` | Meaning                          |
| ------------------------ | -------------------------------- |
| `dgeg-mdixai-prod`       | MDIxAI in DGEG, production       |
| `dgeg-mdixai-dev`        | MDIxAI in DGEG, dev              |
| `dgag-passport-prod`     | Passport in DGAG, production     |
| `dgag-passport-qa`       | Passport in DGAG, QA             |
| `ieo-infra-prod`         | Infra product in IEO, production |
| `ieo-infra-sandbox`      | Infra product in IEO, sandbox    |

**Prometheus scrape config:**

```yaml
scrape_configs:
  - job_name: dgeg-mdixai-prod
    static_configs:
      - targets: ["mdixai-api.internal:8080"]
        labels:
          deployment_environment: "dgeg-mdixai-prod"
```

**OTel Collector resource processor:**

```yaml
processors:
  resource:
    attributes:
      - key: deployment_environment
        value: "dgeg-mdixai-prod"
        action: upsert
```

**Grafana template variable:**

```text
$deployment_environment → label_values(up, deployment_environment)
```

**PromQL panel filter:**

```promql
rate(http_requests_total{deployment_environment="$deployment_environment"}[5m])
```

**Alert rule:**

```yaml
- alert: HighErrorRate
  expr: |
    rate(http_requests_total{status=~"5..", deployment_environment="dgeg-mdixai-prod"}[5m])
    / rate(http_requests_total{deployment_environment="dgeg-mdixai-prod"}[5m]) > 0.02
  labels:
    severity: critical
    deployment_environment: "{{ $labels.deployment_environment }}"
```

**Validation regex:**

```text
^(dgeg|dgag|ieo)-(mdixai|passport|infra)-(dev|qa|prod|sandbox)$
```

---

## **4. Approach C — Flat Labels**

Three independent labels, each carrying one attribution dimension. Platform identified via metric
name prefix — no label needed.

**Label set:**

| Label           | Allowed Values                 | Count |
| --------------- | ------------------------------ | ----- |
| `business_unit` | `dgeg`, `dgag`, `ieo`          | 3     |
| `app`           | `mdixai`, `passport`, `infra`  | 3     |
| `env`           | `dev`, `qa`, `prod`, `sandbox` | 4     |

**Max combinations:** 3 × 3 × 4 = **36** (identical to Approach B)

**Prometheus scrape config:**

```yaml
scrape_configs:
  - job_name: dgeg-mdixai-prod
    static_configs:
      - targets: ["mdixai-api.internal:8080"]
        labels:
          business_unit: "dgeg"
          app: "mdixai"
          env: "prod"
```

**OTel Collector resource processor:**

```yaml
processors:
  resource:
    attributes:
      - key: business_unit
        value: "dgeg"
        action: upsert
      - key: app
        value: "mdixai"
        action: upsert
      - key: env
        value: "prod"
        action: upsert
```

**Grafana template variables — 3 independent dropdowns:**

| Variable        | Type   | Query                                                   |
| --------------- | ------ | ------------------------------------------------------- |
| `env`           | Custom | `dev,qa,prod,sandbox`                                   |
| `business_unit` | Query  | `label_values(up, business_unit)`                       |
| `app`           | Query  | `label_values(up{business_unit="$business_unit"}, app)` |

**PromQL panel filter:**

```promql
rate(http_requests_total{business_unit="$business_unit", app="$app", env="$env"}[5m])
```

**Alert rule:**

```yaml
- alert: HighErrorRate
  expr: |
    rate(http_requests_total{status=~"5..", business_unit="dgeg", app="mdixai", env="prod"}[5m])
    / rate(http_requests_total{business_unit="dgeg", app="mdixai", env="prod"}[5m]) > 0.02
  labels:
    severity: critical
    business_unit: "{{ $labels.business_unit }}"
    app: "{{ $labels.app }}"
    env: "{{ $labels.env }}"
```

**Cost attribution query by BU:**

```promql
count by (business_unit, app, env) (
  {__name__!~"kube_.+|node_.+|container_.+|windows_.+"}
)
```

---

## **5. Comparison & Decision**

| Criterion                                 | Approach A — 4-Segment Compound                                             | Approach B — 3-Segment Compound | Approach C — Flat Labels           |
| ----------------------------------------- | --------------------------------------------------------------------------- | ------------------------------- | ---------------------------------- |
| **Label structure**                       | `aks/aca-bu-app-env`                                                        | `bu-app-env`                    | `business_unit` + `app` + `env`    |
| **Max combinations**                      | **72**                                                                      | **36**                          | **36**                             |
| **Platform visible in label**             | Yes                                                                         | No                              | No                                 |
| **AKS vs ACA cost split**                 | Native — in label value                                                     | Via metric prefix query         | Via metric prefix query            |
| **Migration impact**                      | Label value changes on cutover — dashboards and alerts need one-time update | No impact                       | No impact                          |
| **PromQL exact filter**                   | Exact match on one label                                                    | Exact match on one label        | Exact match on three labels        |
| **PromQL partial filter** (e.g. all prod) | Regex: `=~".*-prod"`                                                        | Regex: `=~".*-prod"`            | Exact: `env="prod"`                |
| **Grafana variable UX**                   | Single dropdown — full context                                              | Single dropdown                 | Three independent dropdowns        |
| **Alert notification readability**        | One field, platform + context                                               | One field, no platform          | Three fields, requires mental join |
| **OTel semantic conventions**             | Non-standard                                                                | Non-standard                    | Aligned natively                   |
| **Grafana Adaptive Metrics**              | Opaque string                                                               | Opaque string                   | Optimizes each dimension           |
| **Label enforcement**                     | One regex rule                                                              | One regex rule                  | Three validation rules             |
| **Extensibility** (adding a dimension)    | Breaking change                                                             | Breaking change                 | Additive                           |
| **Auto-instrumentation compatibility**    | Custom processor required                                                   | Custom processor required       | OTel SDKs emit natively            |

**Deciding factors:**

- If platform visibility in the label and alert notifications matters → **Approach A**
- If migration simplicity (zero label churn on cutover) is preferred → **Approach B**
- If OTel compatibility, Adaptive Metrics, and PromQL ergonomics are the priority → **Approach C**

> **Decision:** _(to be confirmed)_
