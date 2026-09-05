---
title: "Service Onboarding Checklist Template"
description: "- **Team**: [FILL] - **Service(s)**: [FILL: comma-separated if multiple]"
tags: ["ShipSolid", "Templates"]
hidden: false
zettelId: "202606091939-7"
relations:
  - slug: projects/platform-shipsolid/10-templates/confluence-content-templates
    kind: related
  - slug: projects/platform-shipsolid/10-templates/alert-runbooks-template
    kind: related
  - slug: observability/reference/cardinality
    kind: related
---

<!-- [team-name]-[service-name]-onboarding.md -->

## [Team Name] — [Service Name] Onboarding Tracker

- **Team**: [FILL]
- **Service(s)**: [FILL: comma-separated if multiple]
- **Service Tier**: Tier 1 | Tier 2 | Tier 3
- **Platform Shepherd**: [FILL: platform team contact]
- **Started**: YYYY-MM-DD
- **Target Completion**: YYYY-MM-DD
- **Status**: in-progress | complete | blocked

---

## Pre-Onboarding

_Complete before any instrumentation work begins._

- [ ] Service tier confirmed with SRE team (see: Tier Definitions)
- [ ] Service owner named and registered
- [ ] On-call rotation registered in [PagerDuty / Grafana IRM]
- [ ] Service dependency map reviewed and documented: [FILL: link]
- [ ] Environment targets confirmed: dev / staging / prod

---

## Instrumentation

_All instrumentation must use OTel-native SDKs. Proprietary vendor SDKs are not permitted for new
services._

### Metrics

- [ ] RED signals instrumented (Rate, Errors, Duration)
- [ ] Mandatory labels present (see: Label Schema)
  - `service_name`
  - `environment`
  - `version`
  - [FILL: org-specific required labels]
- [ ] [[tech/cardinality|Cardinality]] estimate reviewed and approved by platform team
  - Estimate: [FILL: N active series]
  - Approved by: [FILL: name]

### Logs

- [ ] Structured JSON logging enabled (no unstructured log lines)
- [ ] Required fields present: `timestamp`, `level`, `service`, `trace_id`, `span_id`
- [ ] No PII in log lines (confirmed by: [FILL: name])
- [ ] Log level policy confirmed: DEBUG off in prod, INFO default

### Traces

- [ ] Distributed tracing enabled via OTel SDK
- [ ] Sampling strategy confirmed:
  - Dev: [FILL: e.g. 100%]
  - Prod: [FILL: e.g. 10% tail sampling / 1% head sampling]
- [ ] Trace context propagated to all downstream calls (W3C TraceContext)
- [ ] `trace_id` present in logs for correlation

---

## Platform Configuration

- [ ] Collector pipeline configured for this service (Alloy / OTel Collector)
  - Config PR: [FILL: link]
- [ ] Data routed to correct backend:
  - Metrics → [FILL: Mimir stack / org]
  - Logs → [FILL: Loki stack / org]
  - Traces → [FILL: Tempo stack / org]
- [ ] Retention policy confirmed (see: Retention Policy)
- [ ] Service dashboard created and linked:
  - Dev: [FILL: Grafana URL]
  - Prod: [FILL: Grafana URL]
- [ ] Dashboard uses org-standard template (not a blank canvas)

---

## Alerting

- [ ] Availability alert configured
- [ ] Latency alert configured (P99 threshold: [FILL: N]ms)
- [ ] [FILL: any service-specific alert] configured
- [ ] All alerts have runbooks linked (see:
      [[projects/platform-shipsolid/10-templates/alert-runbooks-template|Alert Runbook Template]])
- [ ] Alerts tested and validated in dev/staging

---

## SLO Setup

- [ ] SLI definitions agreed with service team
- [ ] SLO targets set — see: [[Service Name] SLO Document](FILL: link)
- [ ] Error budget policy acknowledged by team lead (name: [FILL])
- [ ] Burn-rate alerts wired and tested

---

## Production Readiness Review (PRR)

_Required for all Tier 1 and Tier 2 services before production launch._

- [ ] PRR completed: [FILL: Confluence PRR link]
- [ ] PRR decision: approved | approved-with-conditions | n/a (Tier 3)
- [ ] Any PRR conditions resolved: [FILL: Jira links, or "N/A"]

---

## Validation

_This section is completed by the platform shepherd, not the service team._

- [ ] Signal quality confirmed in dev (query: [FILL])
- [ ] Cardinality budget within approved limits (verified: YYYY-MM-DD)
- [ ] On-call engineer dry-run of runbooks completed
  - Runthrough by: [FILL: name]
  - Date: YYYY-MM-DD
- [ ] Dashboard reviewed and signed off
- [ ] SLO burn-rate alert test fired in staging
- [ ] **Onboarding sign-off by Observability Architect**: [FILL: name] on YYYY-MM-DD

---

## Notes & Exceptions

_Document any deviations from standard process, exceptions granted, or follow-up items._

| Item   | Exception / Note | Owner  | Resolve by |
| ------ | ---------------- | ------ | ---------- |
| [FILL] | [FILL]           | [FILL] | YYYY-MM-DD |

---

## Related Documents

- Service SLO Document: [FILL: link]
- Runbook Index: [FILL: link]
- Signal Catalog: [FILL: link]
- Label Schema: [FILL: link]
- PRR: [FILL: link, or N/A]
- Condensed Confluence version of this checklist (Template 5):
  [[projects/platform-shipsolid/10-templates/confluence-content-templates|Confluence Content Templates]]

---
