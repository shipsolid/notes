---
title: "Production Readiness Review Template"
description: "- **Service**: [FILL] - **Service Team TL**: [FILL]"
tags: ["ShipSolid", "SRE", "Reliability"]
hidden: false
zettelId: "202606091939"
relations:
  - slug: prometheus/08-operating-prometheus/02-security/02-security
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/slo-registry
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/slo-template
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/kpis-slis-slos-slas
    kind: related
---

<!-- [service-name]-prr-YYYY-MM-DD.md -->
<!-- PRR pages are immutable after sign-off. Re-run as a new page if the service undergoes major redesign. -->

## [Service Name] — Production Readiness Review

- **Service**: [FILL]
- **Service Team TL**: [FILL]
- **SRE Reviewer**: [FILL]
- **Observability Reviewer**: [FILL]
- **Review Date**: YYYY-MM-DD
- **Target Launch Date**: YYYY-MM-DD
- **Decision**: approved | approved-with-conditions | blocked

---

## 1. Service Summary

_What does this service do, what is its expected scale at launch, and what's the production
timeline?_

[FILL: 3–5 sentences. Include: primary function, expected RPS / data volume at launch,
tier assignment, and launch date. Flag any known scale spikes (e.g. promotional events, scheduled
batch loads).]

---

## 2. Architecture

- Architecture diagram: [FILL: embed or link]
- Dependency map: [FILL: link]
- Key data stores: [FILL]
- Async queues / event streams: [FILL]
- External vendor integrations: [FILL]

---

## 3. Observability Checklist

### Metrics

- [ ] RED signals instrumented: Rate, Errors, Duration
- [ ] Mandatory org labels present (see: Label Schema)
- [ ] [[tech/cardinality|Cardinality]] estimate reviewed and within budget
  - Estimate: [FILL: N active series]
  - Budget approval: [FILL: name] on YYYY-MM-DD
- [ ] No high-churn labels (request IDs, user IDs, raw timestamps)

### Logs

- [ ] Structured JSON logging (no unstructured log lines)
- [ ] Required fields present: `timestamp`, `level`, `service`, `trace_id`, `span_id`
- [ ] No PII in log lines — confirmed by: [FILL: name]
- [ ] Log volume estimate reviewed: [FILL: GB/day]

### Traces

- [ ] Distributed tracing enabled (OTel SDK)
- [ ] Trace context propagated via W3C TraceContext header
- [ ] Sampling strategy confirmed:
  - Non-prod: [FILL: e.g. 100%]
  - Prod: [FILL: e.g. 10% tail-sampling]
- [ ] `trace_id` correlated in logs

### Dashboards

- [ ] Service dashboard exists: [FILL: Grafana URL]
- [ ] Dashboard built from org-standard template
- [ ] Dashboard reviewed and sign-off: [FILL: name] on YYYY-MM-DD

---

## 4. Alerting Checklist

- [ ] Availability alert configured and tested
- [ ] Latency P99 alert configured and tested (threshold: [FILL: N]ms)
- [ ] All alerts have linked runbooks (see: Runbook Index)
- [ ] Alerts validated in staging/dev — no spurious fires in the last 7 days
- [ ] Alert notification routing confirmed: [FILL: PagerDuty policy / rotation name]

---

## 5. Reliability Checklist

### SLO

_Definitions follow the platform's
[[projects/platform-shipsolid/03-reliability-engineering/kpis-slis-slos-slas|KPI → SLI → SLO → SLA framework]]._

- [ ] SLI/SLO defined and documented: [FILL: SLO doc link]
- [ ] Error budget policy acknowledged by team TL: [FILL: name]
- [ ] Burn-rate alerts configured and tested

### Failure Mode Analysis

- [ ] Dependency failure modes documented
  - What happens if [dependency A] is down? [FILL: graceful degradation / fallback / fail-open or fail-closed]
  - What happens if [dependency B] is slow? [FILL]
- [ ] Graceful degradation strategy defined and implemented
- [ ] Circuit breaker or retry logic in place for synchronous dependencies

### Chaos / Fault Injection (Tier 1 only)

- [ ] At least one failure scenario tested in staging: [FILL: scenario name and result]

---

## 6. Operational Checklist

- [ ] On-call rotation registered: [FILL: rotation name in IRM]
- [ ] Deployment runbook exists: [FILL: link]
- [ ] Rollback procedure documented, tested, and timed
  - Rollback method: [FILL: Argo rollback / Helm rollback / feature flag]
  - Tested rollback time: [FILL: N minutes]
  - Rollback time target: < [FILL: N minutes] (per tier SLA)
- [ ] Deployment pipeline gated on tests (unit + integration)
- [ ] Secrets managed via Vault / Sealed Secrets (no plaintext secrets in repo)

---

## 7. Capacity Checklist

- [ ] Load test completed — results: [FILL: link]
  - Peak RPS tested: [FILL]
  - P99 latency at peak: [FILL: N]ms
  - Error rate at peak: [FILL: %]
- [ ] Auto-scaling configured and validated:
  - Min replicas: [FILL]
  - Max replicas: [FILL]
  - Scale-out trigger: [FILL: CPU% / RPS / custom metric]
- [ ] Resource limits set (Kubernetes):
  - CPU request / limit: [FILL]
  - Memory request / limit: [FILL]
- [ ] Scale-to-zero strategy (if applicable): [FILL, or "N/A"]

---

## 8. Security Checklist

- [ ] No secrets or credentials in source control
- [ ] Network policies defined (ingress / egress controls)
- [ ] Service account with least-privilege RBAC
- [ ] Container image scanned (no critical CVEs): [FILL: scan tool and result]
- [ ] PII / sensitive data handling reviewed: [FILL: outcome]

---

## 9. Open Conditions

_Items that were not complete at review time. Each must have an owner and due date. The service may
launch with conditions only if the reviewer explicitly accepts the risk in section 10._

| Condition | Owner  | Jira Ticket  | Due        | Risk Level          |
| --------- | ------ | ------------ | ---------- | ------------------- |
| [FILL]    | [FILL] | [FILL: link] | YYYY-MM-DD | low / medium / high |

---

## 10. Decision & Rationale

**Decision:** approved | approved-with-conditions | blocked

**Rationale:** [FILL: 2–3 sentences. For "approved-with-conditions": name the accepted risks and why
they're acceptable at launch. For "blocked": state the specific blockers and what must change
before re-review.]

**Approved by:**

| Role                   | Name   | Date       |
| ---------------------- | ------ | ---------- |
| SRE Reviewer           | [FILL] | YYYY-MM-DD |
| Observability Reviewer | [FILL] | YYYY-MM-DD |
| Service Team TL        | [FILL] | YYYY-MM-DD |

---

## 11. References

- SLO Document: [FILL: link] (see [[projects/platform-shipsolid/03-reliability-engineering/slo-template|SLO Document Template]])
- Service Architecture: [FILL: link]
- Load Test Results: [FILL: link]
- Runbook Index: [FILL: link]
- Onboarding Tracker: [FILL: link]

---

<!-- Immutable after sign-off. If the service undergoes major redesign, run a new PRR — do not edit this page. -->
