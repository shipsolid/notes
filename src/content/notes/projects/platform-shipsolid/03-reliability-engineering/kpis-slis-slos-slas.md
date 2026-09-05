---
title: "KPIs, SLIs, SLOs & SLAs"
description: "Defines the **metrics hierarchy** used to align technical observability signals with business"
tags: ["ShipSolid", "SRE", "Reliability"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-10"
relations:
  - slug: projects/platform-shipsolid/03-reliability-engineering/slo-registry
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/slo-template
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/prr-template
    kind: related
  - slug: observability/reference/prometheus
    kind: depends_on
---

## KPIs, SLIs, SLOs & SLAs

Defines the **metrics hierarchy** used to align technical observability signals with business
outcomes and customer expectations. It supports **proactive reliability engineering**, **customer
trust**, and **continuous improvement**.

## Definitions

| Term                                | Description                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| **KPI (Key Performance Indicator)** | Business-critical metrics that indicate success (e.g., order success rate, conversion).    |
| **SLI (Service Level Indicator)**   | Quantitative measure of a service’s health (e.g., latency, availability, error rate).      |
| **SLO (Service Level Objective)**   | A target threshold for an SLI over a defined period (e.g., 99.9% uptime in 30 days).       |
| **SLA (Service Level Agreement)**   | Formal, externally agreed commitments based on SLOs, with defined penalties or escalation. |

## Implementation Framework

- **SLIs** are collected using:
  - **[[tech/prometheus|Prometheus]] metrics** for infra/app health
  - **OpenTelemetry** spans for request tracking
  - **Synthetic probes** for uptime and performance
- **SLOs** are tracked in **Grafana dashboards** with:
  - Real-time visualizations
  - Burn rate and error budget consumption
  - Alerting based on fast/slow burn policies
- **SLAs** are mapped to customer-facing services and logged for audit in contracts or ServiceNow

## Example KPI → SLI → SLO → SLA Mapping

| Business KPI        | SLI                                     | SLO Target                 | SLA (if applicable)       |
| ------------------- | --------------------------------------- | -------------------------- | ------------------------- |
| API Availability    | HTTP 2xx success rate                   | ≥ 99.9% uptime per month   | 99.5% in external SLA     |
| Application Latency | `p95_http_duration_seconds`             | ≤ 500ms (p95) over 30 days | SLO-only, not contractual |
| MTTR                | Time from alert → incident closure      | ≤ 30 min (P1)              | Escalation if > SLA       |
| Deployment Health   | Errors post-deploy, latency, trace gaps | 0 critical errors in prod  | SLO-only                  |

<!-- | Order Success Rate  | `orders_success / orders_total`         | ≥ 99.5% over 7 days        | 99.0% monthly, else penalty | -->

## SLO Definition Template (YAML)

The fields below mirror the reusable
[[projects/platform-shipsolid/03-reliability-engineering/slo-template|SLO Document Template]] used
to define individual SLOs before they're added to the
[[projects/platform-shipsolid/03-reliability-engineering/slo-registry|SLO Registry]].

```yaml
service_name: checkout-api
slo_name: Checkout API Availability

description: >
  Ensure the Checkout API responds successfully with 2xx/3xx HTTP codes
  at least 99.9% of the time over a 30-day window.

sli_type: availability

sli_definition: |
  (Successful HTTP requests)
  ÷
  (Total HTTP requests)

data_source:
  - prometheus_query: |
      sum(rate(http_requests_total{status=~"2..|3.."}[1m]))
      /
      sum(rate(http_requests_total[1m]))

target: 99.9%
error_budget: 0.1% (43.2 minutes/month)

burn_alerts:
  - window: 5m
    threshold: 10x
    action: page_oncall
  - window: 1h
    threshold: 2x
    action: slack_notify

dashboard_url: https://grafana.shipsolid.com/d/checkout-api-slo

owner_team: checkout-sre
review_cycle: monthly
```

## Operational Workflow

- **SLIs** are exported via metrics/traces/logs and correlated using trace IDs.
- **SLO Dashboards** are created per service, environment, and team.
- **Alerts** are triggered on:
  - High burn rate (short windows)
  - Sustained SLO breaches (long windows)
- **SLA Reporting** is aligned with monthly service reviews or external reporting tools.

## Benefits

- Enables **data-driven reliability management**
- Tracks **service health trends** and **risk of SLA violations**
- Prioritizes **engineering focus** via error budgets
- Improves **cross-functional accountability** (Engineering ↔ Business ↔ Support)

## **Key Fields Explained**

| Field              | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `service_name`     | The system or component being measured                        |
| `slo_name`         | A friendly, descriptive name for the SLO                      |
| `description`      | The customer-impact-driven reason this SLO exists             |
| `sli_type`         | Type of service level indicator (availability, latency, etc.) |
| `sli_definition`   | Formula and logic used to compute the SLI                     |
| `data_source`      | Source(s) of truth for the metric (e.g., Prometheus, logs)    |
| `target`           | The percentage goal over a specific time window               |
| `budget`           | The acceptable error budget (inverse of the target)           |
| `alerting_policy`  | Burn rate-based policies that trigger escalation              |
| `dashboards`       | URLs or links to monitoring dashboards                        |
| `review_frequency` | How often the SLO is evaluated or revised                     |
