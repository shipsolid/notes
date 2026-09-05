---
title: "SLO Document Template"
description: "- **Service**: [Full service name] - **Owner**: [Team name]"
tags: ["ShipSolid", "SRE", "Reliability"]
hidden: false
zettelId: "202606091939-2"
relations:
  - slug: projects/platform-shipsolid/03-reliability-engineering/slo-registry
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/kpis-slis-slos-slas
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/prr-template
    kind: related
---

<!-- [service-name]-slo.md -->

> This is the canonical per-service template referenced by the
> [[projects/platform-shipsolid/03-reliability-engineering/slo-registry|SLO Registry]] — every row
> in the registry links back to a filled-in copy of this document.

## [Service Name] — SLO Document

- **Service**: [Full service name]
- **Owner**: [Team name]
- **Service Tier**: Tier 1 | Tier 2 | Tier 3
- **Status**: active | proposed | deprecated
- **Created**: YYYY-MM-DD
- **Last Reviewed**: YYYY-MM-DD
- **Review Cadence**: 90 days (or after any SLO miss event)
- **Error Budget Dashboard**: [FILL: Grafana dashboard URL]

---

## 1. Service Overview

_2 sentences: what does this service do and who depends on it?_

> Example: `order-fulfillment-api` processes checkout and payment events for the e-commerce
> platform. It is a synchronous dependency for the checkout service and an async dependency for the
> inventory service.

---

## 2. SLIs (Service Level Indicators)

_Define the measurable signals that represent the service's reliability. Prefer request-based SLIs
over resource-based — see the
[[projects/platform-shipsolid/03-reliability-engineering/kpis-slis-slos-slas|KPI → SLI → SLO → SLA framework]]
for how these terms relate._

| SLI Name           | PromQL / Query                                                                          | Good Event Definition                             | Notes                            |
| ------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------- | ------------------------------- |
| Availability       | `sum(rate(http_requests_total{status=~"2..                                              | 3.."}[5m])) / sum(rate(http_requests_total[5m]))` | HTTP 2xx + 3xx responses         | Excludes health check endpoints |
| Latency P99        | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | < [N]ms                                           | Measured at the service boundary |
| [FILL: custom SLI] | [FILL: query]                                                                           | [FILL: good event definition]                     | [FILL: notes]                    |

**Excluded traffic:**

- [FILL: health check paths, synthetic monitors, internal admin endpoints]

---

## 3. SLOs (Service Level Objectives)

| SLI          | Target                            | Measurement Window | Error Budget                             |
| ------------ | --------------------------------- | ------------------ | ---------------------------------------- |
| Availability | [FILL: e.g. 99.9%]                | 30-day rolling     | [FILL: e.g. 43.8 min/month]              |
| Latency P99  | [FILL: e.g. 99%] requests < [N]ms | 30-day rolling     | [FILL: e.g. ~7.2 hr/month of violations] |

**Rationale for targets:**

- [FILL: why 99.9% and not 99.95%? Reference user impact data or dependency SLAs.]

---

## 4. Alerting Policy

_Multi-window, multi-burn-rate alerts. Short windows catch fast burns; long windows catch slow
burns._

| Alert Name                        | Burn Rate | Window | Severity | Response           |
| --------------------------------- | --------- | ------ | -------- | ------------------ |
| [ServiceName]AvailabilityCritical | 14.4×     | 1h     | SEV1     | Page immediately   |
| [ServiceName]AvailabilityHigh     | 6×        | 6h     | SEV2     | Page within 30 min |
| [ServiceName]AvailabilityWarning  | 1×        | 3d     | SEV3     | Ticket (no page)   |
| [ServiceName]LatencyCritical      | [FILL]    | 1h     | SEV1     | Page immediately   |

> **Burn rate reference:** 14.4× = exhausts 1-month budget in 50 hours. 6× = exhausts in ~5 days. 1×
> = exactly on track to exhaust in 30 days.

---

## 5. Error Budget Policy

| Budget Remaining | Release Policy                        | Who Decides Exceptions  |
| ---------------- | ------------------------------------- | ----------------------- |
| > 50%            | Normal velocity                       | —                       |
| 25–50%           | Non-critical changes on hold          | Engineering TL          |
| < 25%            | Feature freeze; reliability work only | Engineering TL + SRE TL |
| Exhausted        | No changes except incident fixes      | VP Engineering + SRE    |

**Exception release process:** [FILL: who approves an exception, what documentation is required,
SLA for the exception decision]

---

## 6. Dependencies

_Services or infrastructure this SLO depends on. If a dependency degrades, note whether it excludes
from SLO or causes an SLO miss._

| Dependency               | Type        | SLA Provided | Impact if Down              | Excluded from SLO? |
| ------------------------ | ----------- | ------------ | --------------------------- | ------------------ |
| [FILL: upstream service] | synchronous | [FILL]       | [FILL: availability impact] | No                 |
| [FILL: data store]       | synchronous | [FILL]       | [FILL: full outage]         | No                 |
| [FILL: async queue]      | async       | [FILL]       | [FILL: latency degraded]    | Partial            |

---

## 7. Runbook Links

| Alert              | Runbook                        | Last Verified |
| ------------------ | ------------------------------ | ------------- |
| [FILL: alert name] | [FILL: Confluence runbook URL] | YYYY-MM-DD    |
| [FILL: alert name] | [FILL: Confluence runbook URL] | YYYY-MM-DD    |

---

## 8. SLO History

_Track quarterly performance. Add rows at the end of each quarter._

| Quarter         | Availability Met? | Latency Met? | Error Budget Used | Notes                                   |
| --------------- | ----------------- | ------------ | ----------------- | --------------------------------------- |
| [FILL: Q1 YYYY] | Yes / No          | Yes / No     | [FILL: e.g. 23%]  | [FILL: any notable misses or incidents] |

---

## 9. Related Documents

- SLO Dashboard: [FILL: Grafana URL]
- Error Budget Burn Dashboard: [FILL: Grafana URL]
- Service Runbook Index: [FILL: Confluence link]
- Service Architecture Doc: [FILL: link]
- Post-mortems: [FILL: link to post-mortem folder]

---
