---
title: "Alert Runbook Template"
description: "- **Alert Name**: [FILL: exact name from alerting system — must match 1:1]"
tags: ["ShipSolid", "Operations", "Incident Response"]
hidden: false
zettelId: "202606092046-26"
relations:
  - slug: projects/platform-shipsolid/04-operations-incident-response/alert-runbooks/api-gateway-5xx-high
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/post-mortems/_template
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/incident-response-playbook
    kind: depends_on
---

<!-- runbook-[alert-name].md -->
<!-- Review cadence: 90 days. If the alert fires and the runbook is wrong, fix it before closing the incident. -->

## Runbook — [AlertName]

- **Alert Name**: [FILL: exact name from alerting system — must match 1:1]
- **Severity**: SEV1 | SEV2 | SEV3
- **Service**: [FILL]
- **Owner Team**: [FILL]
- **Last Reviewed**: YYYY-MM-DD
- **Grafana Dashboard**: [FILL: URL]
- **SLO Document**: [FILL: Confluence link, or N/A]

---

## 1. Alert Meaning

_1–2 sentences. What condition fires this alert? What does it indicate is wrong? Write for an
on-call engineer who may not know this service._

> Example: This alert fires when the 1-hour SLO burn rate for `order-fulfillment-api` exceeds 14.4×
> — meaning the service is consuming its monthly error budget at a rate that would exhaust it in ~50
> hours. This is a SEV1 signal: user-facing requests are failing at a rate that violates the
> availability SLO.

---

## 2. Impact if Unaddressed

_What degrades, breaks, or affects users if this alert fires and no action is taken?_

- [FILL: user-visible impact]
- [FILL: downstream service impact]
- [FILL: SLO / error budget impact — how fast does the budget burn?]

---

## 3. Triage Steps

_Follow in order. OBSERVE before you ACT. Never restart a service without completing steps 1–3._

### Step 1 — Confirm the alert is real

- Open the dashboard: [FILL: Grafana panel URL]
- Check: is the error rate elevated in the last 5 minutes, or is this a stale/flapping alert?
- Query to confirm: `[FILL: PromQL or LogQL]`

> If the alert appears to be a flap (spike <2 min, already recovering): monitor for 5 minutes before
> escalating. Log observation time and outcome.

### Step 2 — Scope the blast radius

- Which endpoints / operations are failing? Check: [FILL: Grafana panel]
- Which environments? (dev / staging / prod): [FILL: how to distinguish]
- Which regions / clusters? [FILL: how to check]
- Approximate % of traffic affected: `[FILL: PromQL]`

### Step 3 — Check for recent changes

- Deployments in the last 2 hours: [FILL: link to deploy history / Argo / GitHub Actions]
- Config changes (Helm, feature flags): [FILL: link]
- Upstream dependency changes: check [FILL: dependency dashboard URL]

> If a deployment correlates with alert start time: jump directly to
> [Step 6 — Rollback](#step-6--rollback).

### Step 4 — Check upstream dependencies

- [FILL: dependency name] status: [FILL: query or dashboard URL]
- [FILL: dependency name] status: [FILL: query or dashboard URL]

> If a dependency is degraded and this service has no fallback: escalate to the dependency's
> on-call. Do not restart this service while the dependency is down.

### Step 5 — Inspect logs and traces

- Loki query (error logs, last 15 min):

  ```logql
  [FILL: LogQL query — e.g. {service="order-fulfillment-api", env="prod"} |= "error" | json | level="error"]
  ```

- [[tempo|Tempo]]: look for high-latency or failed traces on [FILL: affected operation name]

### Step 6 — Rollback

_Only if a recent deployment is the confirmed root cause and the service is actively degrading._

- Rollback command: [FILL: exact command — e.g. `kubectl rollout
  undo deployment/order-fulfillment-api -n prod`]
- Or revert via [Argo / GitHub Actions]: [FILL: link]
- Rollback verification: confirm error rate drops within [FILL: N minutes] using: [FILL:
  dashboard URL]

### Step 7 — Apply known fix (if applicable)

| Cause                  | Fix                 |
| ---------------------- | ------------------- |
| [FILL: common cause 1] | [FILL: exact steps] |
| [FILL: common cause 2] | [FILL: exact steps] |

---

## 4. Resolution Verification

_How do you know the issue is resolved? State the specific signal, not "things look normal"._

- Error rate back below threshold: `[FILL: PromQL showing rate < X]`
- No error spikes in last [FILL: N] minutes
- SLO burn rate returning to baseline: check [FILL: dashboard panel]
- Affected operation latency back to P99 < [FILL: N]ms

---

## 5. Escalation

| Condition                          | Escalate to                         | Method                           |
| ---------------------------------- | ----------------------------------- | -------------------------------- |
| Not resolved within 30 min         | [FILL: next escalation role / name] | PagerDuty escalation / Slack     |
| Root cause is a dependency failure | [FILL: dependency team's on-call]   | [FILL: contact method]           |
| Blast radius expanding             | IC escalation to SEV1 war room      | [FILL: war room channel]         |
| Needs vendor support               | [FILL: vendor support portal]       | [FILL: contract / SLA reference] |

---

## 6. Post-Incident

- If this alert triggered a SEV1 or SEV2: open a post-mortem within 24 hours.
  - Template:
    [[projects/platform-shipsolid/04-operations-incident-response/post-mortems/_template|Incident Post-Mortem Template]]
- Update this runbook if any step was wrong or missing during the incident. Do it before closing the
  incident ticket.
- If this is the third time this alert has fired in 90 days: flag for alert review / root cause
  hardening.

---

## 7. Related Runbooks

- [FILL: related alert name] → [FILL: runbook link]
- [FILL: related alert name] → [FILL: runbook link]

---

## 8. References

- Grafana dashboard: [FILL: URL]
- SLO document: [FILL: Confluence link]
- Service architecture doc: [FILL: link]
- Past post-mortems for this alert: [FILL: links]

---
