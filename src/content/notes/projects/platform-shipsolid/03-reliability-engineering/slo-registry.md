---
title: "SLO Registry"
description: "Registry of all SLOs across ShipSolid platform services."
tags: ["ShipSolid", "SRE", "Reliability"]
updated: 2026-06-09
hidden: false
zettelId: "202606092223-3"
relations:
  - slug: projects/platform-shipsolid/03-reliability-engineering/error-budget-policy
    kind: depends_on
  - slug: projects/platform-shipsolid/03-reliability-engineering/production-readiness-review
    kind: depends_on
  - slug: projects/platform-shipsolid/03-reliability-engineering/slo-template
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/alert-rules-catalog
    kind: related
---

## SLO Registry

## Purpose

Registry of all SLOs across ShipSolid platform services. This is the single source of truth for what
each service promises, how it is measured, and who owns the budget. Estate: ~40 services across 3
AKS clusters (dev/qa/prod) on Azure; signals flow through OpenTelemetry → Grafana Alloy → Grafana
Cloud ([[tech/mimir|Mimir]]/[[tech/loki|Loki]]/[[tech/tempo|Tempo]]).

## Canonical template

New SLOs use [[slo-template|slo-template.md]].

## Registry

| Service              | SLI                                | Objective | Window      | Owner             | Status |
| -------------------- | ---------------------------------- | --------- | ----------- | ----------------- | ------ |
| api-gateway          | availability (success ratio)       | 99.9%     | 30d rolling | Platform SRE      | active |
| api-gateway          | latency (p99 < 300ms)              | 99.0%     | 30d rolling | Platform SRE      | active |
| auth-service         | availability (success ratio)       | 99.95%    | 30d rolling | Service Team Lead | active |
| billing-service      | correctness (charge success ratio) | 99.99%    | 30d rolling | Service Team Lead | active |
| notification-service | freshness (dispatch < 60s)         | 99.0%     | 30d rolling | Service Team Lead | draft  |
| tenant-service       | availability (success ratio)       | 99.9%     | 30d rolling | Service Team Lead | active |

> Tiering: api-gateway, auth-service and billing-service are Tier 1 (customer-facing, on the
> synchronous critical path). tenant-service is Tier 1 control-plane. notification-service is Tier 2
> (async, degrades gracefully).

---

## Worked example — api-gateway

`api-gateway` is the single ingress for all north-south traffic into the ShipSolid platform. Every
authenticated customer request transits it before fan-out to `auth-service`, `billing-service`,
`tenant-service`, and downstream. It is the highest-blast-radius service in the estate, so it gets
the most scrutiny here.

- **Service**: api-gateway
- **Owner**: Platform SRE
- **Service Tier**: Tier 1
- **Status**: active
- **Window**: 30-day rolling
- **Error Budget Dashboard**:
  `[FILL: Grafana Cloud dashboard URL — folder /reliability/api-gateway]`

### 1. SLIs (Service Level Indicators)

Request-based SLIs measured at the gateway boundary. The metric `http_server_requests_total` is
emitted by the OTel HTTP instrumentation and carries a `status` label normalized to status class
(`2xx`/`3xx`/`4xx`/`5xx`) at the Alloy processor to keep cardinality bounded.

**Availability — success ratio of `http_server_requests_total` by status class:**

```promql
sum(rate(http_server_requests_total{service="api-gateway", status=~"2..|3.."}[5m]))
/
sum(rate(http_server_requests_total{service="api-gateway"}[5m]))
```

- **Good event**: HTTP 2xx + 3xx responses.
- 4xx responses are **client errors** and excluded from the bad-event count (the gateway did its
  job). 5xx responses are bad events.
- **Excluded traffic**: `/healthz`, `/readyz`, synthetic probes (`user_agent="grafana-synthetic"`),
  and internal admin endpoints under `/admin/*`.

**Latency — p99 of the request-duration histogram below 300ms:**

```promql
histogram_quantile(
  0.99,
  sum(rate(http_server_request_duration_seconds_bucket{service="api-gateway"}[5m])) by (le)
) < 0.3
```

- **Good event**: a request served in < 300ms at the gateway boundary.
- Measured at the gateway, not at the client, so it excludes network RTT to the customer.

> **[[tech/cardinality|Cardinality]] note**: `status` is collapsed to 4 classes and `le` buckets are
> pinned to the OTel default histogram boundaries. No per-route or per-tenant label on the SLI
> series — route/tenant breakdowns live in exemplars and Tempo traces, not in the SLI metric, to
> keep the active-series budget flat.

### 2. SLO (Service Level Objective)

| SLI                   | Target           | Window         | Error Budget                                         |
| --------------------- | ---------------- | -------------- | ---------------------------------------------------- |
| Availability          | 99.9%            | 30-day rolling | 0.1% = **~43.8 min/month** of allowed unavailability |
| Latency (p99 < 300ms) | 99.0% of windows | 30-day rolling | 1% = **~7.2 hr/month** of windows over 300ms         |

**Rationale for 99.9% (not 99.95%):**

- Customer SLA commits to 99.9% on the API surface; matching the internal SLO to the contract avoids
  burning engineering effort on reliability the contract does not require.
- The synchronous dependency chain (`auth-service` at 99.95%, `tenant-service` at 99.9%) means a
  gateway target above 99.9% would be dominated by dependency budget anyway.
- 43.8 min/month is enough headroom for routine AKS node rotations and Alloy/Helm rollouts without
  freezing the release train.

### 3. Multi-window, multi-burn-rate alert tiers

Short windows catch fast burns (something is on fire now); long windows catch slow burns (a steady
drizzle of errors eating the budget). Burn rate `N×` means the budget is being consumed `N` times
faster than the steady-state rate that would exhaust it exactly at the end of the 30-day window.

| Tier   | Burn rate | Short window | Long window (guard) | Severity | Routing                                  |
| ------ | --------- | ------------ | ------------------- | -------- | ---------------------------------------- |
| Fast   | 14.4×     | 1h           | 5m                  | **SEV1** | Page on-call immediately via Grafana IRM |
| Medium | 6×        | 6h           | 30m                 | **SEV2** | Page within 30 min via Grafana IRM       |
| Slow   | 1×        | 3d           | 6h                  | **SEV3** | Ticket — no page                         |

- **14.4× / 1h (SEV1)** — exhausts the full 30-day budget in ~50 hours. The 5m guard window must
  also be burning before it pages, to suppress single-scrape blips.
- **6× / 6h (SEV2)** — exhausts the budget in ~5 days. Guarded by a 30m window.
- **1× / 3d (SEV3)** — exactly on track to exhaust the budget at the 30-day mark. Guarded by a 6h
  window. Ticket only; sustained-degradation signal, not a fire.

> Alert rule expressions are catalogued in [[alert-rules-catalog|Alert Rules Catalog]]; burn-rate
> mechanics are defined in [[error-budget-policy|Error Budget Policy]].

### 4. Error-budget release gates

Release velocity is gated on remaining 30-day budget. The On-call Engineer reads the budget off the
error-budget dashboard before approving a change to api-gateway.

| Budget remaining | Gate                                                                        | Who decides exceptions            |
| ---------------- | --------------------------------------------------------------------------- | --------------------------------- |
| **> 50%**        | **Normal** — ship freely at full velocity                                   | —                                 |
| **25–50%**       | **Caution** — non-critical changes on hold; risky/large changes need review | Service Team Lead                 |
| **< 25%**        | **Freeze risky changes** — reliability work and incident fixes only         | Service Team Lead + Platform SRE  |
| **Exhausted**    | **Freeze** — no changes except incident fixes until budget recovers         | Platform SRE owner of api-gateway |

Full policy, including the exception-release process and how budget recovery is measured, lives in
[[error-budget-policy|Error Budget Policy]]. New api-gateway changes must clear the
[[production-readiness-review|Production Readiness Review]] gate before first prod deploy regardless
of budget state.

---

## Related

- [[error-budget-policy|Error Budget Policy]]
- [[production-readiness-review|Production Readiness Review]]
