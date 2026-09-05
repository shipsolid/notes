---
title: "Incident Post-Mortem Template"
description: "- **Incident Commander**: [FILL: name] - **Severity**: SEV1 | SEV2 | SEV3"
tags: ["ShipSolid", "Templates"]
hidden: false
zettelId: "202606092046-70"
relations:
  - slug: projects/platform-shipsolid/10-templates/rfc-template
    kind: related
  - slug: projects/platform-shipsolid/10-templates/adr-template
    kind: related
  - slug: projects/platform-shipsolid/10-templates/confluence-content-templates
    kind: related
  - slug: projects/platform-shipsolid/10-templates/alert-runbooks-template
    kind: related
---

<!-- YYYY-MM-DD-incident-title-postmortem.md -->
<!-- Lock this page as read-only after 30 days. Post-mortems are immutable records. -->

## YYYY-MM-DD — [Incident Title]

- **Incident Commander**: [FILL: name]
- **Severity**: SEV1 | SEV2 | SEV3
- **Status**: draft | published | closed
- **Incident Start**: YYYY-MM-DD HH:MM UTC
- **Incident End**: YYYY-MM-DD HH:MM UTC
- **MTTR**: [FILL: HH:MM]
- **Impacted**: [FILL: services / customers / regions]
- **Jira Incident Ticket**: [FILL: link]

---

## 1. Executive Summary

_3–5 sentences. What broke, why, how long, what was the blast radius. Written for a VP who wasn't in
the war room — no jargon without definition._

> Example: On 2026-06-08 at 14:32 UTC, the order-fulfillment-api experienced a complete availability
> outage lasting 47 minutes. Root cause was a misconfigured Helm values file deployed in the 14:20
> UTC release that set CPU limits to 10m (vs 500m intended), causing all pods to be CPU-throttled
> into OOMKill loops. ~12,000 checkout requests failed. The outage was detected via SLO burn-rate
> alert at 14:34 UTC; rollback completed at 15:19 UTC.

---

## 2. Impact

| Dimension                | Value                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| User-facing impact       | [FILL: % of requests affected / error rate / affected user count] |
| Duration                 | [FILL: HH:MM]                                                     |
| Services affected        | [FILL]                                                            |
| Regions affected         | [FILL]                                                            |
| SLO impact               | [FILL: % of error budget consumed]                                |
| Estimated revenue impact | [FILL, or "Not quantified"]                                       |

---

## 3. Timeline

_All times in UTC. Include first symptom, first detection, key triage steps, mitigation, and
all-clear._

| Time (UTC) | Event                                              | Who                     |
| ---------- | -------------------------------------------------- | ----------------------- |
| HH:MM      | [FILL: first anomaly / symptom visible in metrics] | —                       |
| HH:MM      | [FILL: first alert fired — name the alert]         | Alerting system         |
| HH:MM      | [FILL: on-call engineer paged]                     | PagerDuty / Grafana IRM |
| HH:MM      | [FILL: war room opened, IC assigned]               | [name]                  |
| HH:MM      | [FILL: hypothesis formed]                          | [name]                  |
| HH:MM      | [FILL: root cause identified]                      | [name]                  |
| HH:MM      | [FILL: mitigation/rollback initiated]              | [name]                  |
| HH:MM      | [FILL: service restored / traffic recovering]      | —                       |
| HH:MM      | [FILL: all-clear declared]                         | [IC name]               |

---

## 4. Root Cause Analysis

### What happened

_Technical sequence of events. Start from the triggering condition, not the first alert. Avoid
passive voice ("a bug was introduced" → "engineer X deployed commit Y which contained...")._

[FILL]

### 5 Whys

1. **Why** did the service fail? → [FILL]
2. **Why** did [answer 1] happen? → [FILL]
3. **Why** did [answer 2] happen? → [FILL]
4. **Why** did [answer 3] happen? → [FILL]
5. **Why** did [answer 4] happen? → [FILL: systemic root cause — process, tooling, or cultural gap]

### Contributing factors

_Conditions that made the impact worse, even if not the root cause._

- [FILL: e.g. no canary rollout meant 100% of traffic was immediately affected]
- [FILL: e.g. alert threshold was too loose — fired 4 minutes after impact began]
- [FILL: e.g. runbook for this alert was stale — resolution step 3 referenced a deprecated endpoint]

---

## 5. What Went Well

_Be specific. "Monitoring caught it quickly" is weak. "SLO burn-rate alert fired within 2 minutes of
impact at 14.4× burn rate" is useful._

- [FILL]
- [FILL]
- [FILL]

---

## 6. What Went Poorly

_Be equally specific. These drive the action items._

- [FILL]
- [FILL]
- [FILL]

---

## 7. Action Items

_Every action item needs an owner and a due date. Track these in Jira, not in this doc._

| Item                                | Owner        | Jira Ticket  | Due        | Status |
| ----------------------------------- | ------------ | ------------ | ---------- | ------ |
| [FILL: specific, measurable action] | [FILL: name] | [FILL: link] | YYYY-MM-DD | open   |
| [FILL]                              | [FILL]       | [FILL]       | YYYY-MM-DD | open   |

**Action item quality check:**

- Each item should be completable and verifiable.
- "Improve monitoring" is not an action item. "Add SLO burn-rate alert for order-fulfillment-api"
  is.

---

## 8. Lessons Learned

_2–3 sentences. What systemic gap does this incident reveal? If this should drive an
[[projects/platform-shipsolid/10-templates/rfc-template|RFC]] or
[[projects/platform-shipsolid/10-templates/adr-template|ADR]], name it here._

[FILL]

> If an RFC / ADR should be opened as a result, link it here once created.

---

## 9. Detection & Response Metrics

| Metric                 | Value                                             | Target               |
| ---------------------- | ------------------------------------------------- | -------------------- |
| Time to detect (TTD)   | [FILL: HH:MM from impact start to first alert]    | < 5 min              |
| Time to engage (TTE)   | [FILL: HH:MM from alert to IC in war room]        | < 15 min             |
| Time to mitigate (TTM) | [FILL: HH:MM from IC engaged to service restored] | < 30 min             |
| MTTR                   | [FILL: HH:MM total]                               | [FILL: per tier SLA] |

---

## 10. References

- Grafana incident dashboard: [FILL: URL]
- Loki logs query (incident window): [FILL: URL]
- Tempo traces: [FILL: URL]
- Deployment that triggered the incident: [FILL: Git SHA / PR link]
- Related post-mortems: [FILL: links to similar past incidents]
- Alert that fired: link its
  [[projects/platform-shipsolid/10-templates/alert-runbooks-template|runbook]] and confirm it was
  accurate during the incident

---

<!-- Lock this page after 30 days: Settings → Page Restrictions → Edit: Restricted. Action items live in Jira. -->
