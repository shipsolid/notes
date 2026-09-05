---
title: "Confluence Content Templates — SRE / Observability / Platform"
description: "**Space:** `OBS` or `PLT` **Parent page:** `Decision Log (ADRs)`"
tags: ["ShipSolid", "Strategy"]
hidden: false
zettelId: "202606091939-3"
relations:
  - slug: projects/platform-shipsolid/08-strategy-planning/confluence-space-structure
    kind: depends_on
  - slug: projects/platform-shipsolid/08-strategy-planning/confluence-data-lifecycle
    kind: related
---

## Confluence Content Templates — SRE / Observability / Platform

> **Lens:** Solution Architect  
> **Usage:** Copy each section into a new Confluence page. Fill `[FILL: ...]` blocks.  
> Apply the `[TEMPLATE]` label so these scaffold pages are excluded from navigation.  
> Delete this header comment when instantiating a real page.

---

## Template 1 — Architecture Decision Record (ADR)

**Space:** `OBS` or `PLT`  
**Parent page:** `Decision Log (ADRs)`  
**Naming:** `ADR-{NNN}: {Short title}` — e.g.
`ADR-007: Adopt OTel-native instrumentation over vendor SDKs`

```markdown
---
Owner:          [FILL: name / team]
Status:         proposed | accepted | superseded
Created:        YYYY-MM-DD
Superseded by:  [FILL: ADR-NNN, or N/A]
Last reviewed:  YYYY-MM-DD
---

## Context

[FILL: 2–4 sentences. What problem are we solving? What is the forcing function?
Include scale, constraints, and what happens if we do nothing.]

## Decision

[FILL: One clear statement of what we decided. No hedging.
Example: "We will use OpenTelemetry SDKs for all new service instrumentation.
Vendor SDK adoption is blocked pending migration to OTel."]

## Alternatives Considered

| Option | Why rejected |
|---|---|
| [FILL: Option A] | [FILL: reason] |
| [FILL: Option B] | [FILL: reason] |

## Consequences

**Positive:**
- [FILL]

**Negative / tradeoffs:**
- [FILL]

**Open questions (resolve before implementation):**
- [FILL, or "None"]

## Links

- Related ADRs: [FILL: ADR-NNN links]
- Implementation PR / Jira: [FILL]
- Design doc / RFC: [FILL]
```

---

## Template 2 — Request for Comments (RFC)

**Space:** `PLT`  
**Parent page:** `RFCs (proposals)`  
**Naming:** `RFC-{NNN}: {Short title}`  
**Lifecycle:** `draft` → `in-review` → `accepted` | `rejected` | `withdrawn`

```markdown
---
Owner:        [FILL: author name]
Status:       draft | in-review | accepted | rejected | withdrawn
Created:      YYYY-MM-DD
Comment by:   YYYY-MM-DD   ← hard deadline for async review
Reviewers:    [FILL: list names]
---

## Problem Statement

[FILL: What breaks, costs too much, or is missing? Anchor to a real incident,
a capacity ceiling, or a user pain point. Include metrics where available.]

## Proposal

[FILL: What are you proposing to build or change? Keep this to 3–5 paragraphs.
Diagrams strongly preferred over prose for system changes.]

### Scope

**In scope:**
- [FILL]

**Out of scope:**
- [FILL]

## Design

[FILL: Technical detail — API contracts, data flow, component interactions.
For infra changes: include IaC approach (Helm/Terraform), rollout strategy,
and rollback path. Embed diagrams here, not at the bottom.]

## Alternatives

| Alternative | Tradeoff |
|---|---|
| [FILL] | [FILL] |

## Migration / Rollout Plan

[FILL: Phases. Include: how existing users are migrated, any flag-gate strategy,
expected downtime window (or confirm zero-downtime), canary criteria.]

## Operational Impact

- Monitoring / alerting changes: [FILL]
- On-call runbook changes: [FILL]
- FinOps impact (ingest / compute): [FILL]
- Cardinality delta: [FILL: +N series / -N series]

## Open Questions

| Question | Owner | Resolve by |
|---|---|---|
| [FILL] | [FILL] | [FILL] |

## Decision

> **[Complete after review period]**
> Accepted / Rejected / Withdrawn on YYYY-MM-DD.
> Summary of changes from original proposal: [FILL]
```

---

## Template 3 — Service SLO Document

**Space:** `SRE`  
**Parent page:** `Services & SLOs → SLO Registry`  
**Naming:** `[Service Name] — SLO Document`  
**Review cadence:** 90 days or after any SLO miss event

```markdown
---
Owner:            [FILL: team name]
Service tier:     Tier 1 | Tier 2 | Tier 3
Status:           active | proposed | deprecated
Created:          YYYY-MM-DD
Last reviewed:    YYYY-MM-DD
Error budget link: [FILL: Grafana dashboard URL]
---

## Service Overview

[FILL: 2 sentences. What does this service do and who depends on it?]

## SLIs (Service Level Indicators)

| SLI Name | Metric Query | Good event definition |
|---|---|---|
| Availability | [FILL: promQL] | HTTP 2xx + 3xx responses |
| Latency P99 | [FILL: promQL] | < [N]ms |
| [FILL: custom SLI] | [FILL] | [FILL] |

## SLOs (Service Level Objectives)

| SLI | Target | Window | Error Budget |
|---|---|---|---|
| Availability | [FILL: e.g. 99.9%] | 30-day rolling | [FILL: e.g. 43.8 min/month] |
| Latency P99 | [FILL: e.g. 99%] | 30-day rolling | [FILL] |

## Alerting Policy

| Alert name | Burn rate | Window | Severity |
|---|---|---|---|
| [FILL] | [FILL: e.g. 14.4×] | 1h | SEV1 |
| [FILL] | [FILL: e.g. 6×] | 6h | SEV2 |
| [FILL] | [FILL: e.g. 1×] | 3d (ticket) | SEV3 |

## Error Budget Policy

- **>50% budget remaining:** Normal release velocity
- **25–50% remaining:** Release freeze for non-critical changes
- **<25% remaining:** Full feature freeze; reliability work only
- **Budget exhausted:** [FILL: escalation path — who approves exception releases?]

## Dependencies

| Dependency | Type | SLA provided | Impact if down |
|---|---|---|---|
| [FILL: upstream service] | synchronous | [FILL] | [FILL] |
| [FILL: data store] | synchronous | [FILL] | [FILL] |

## Runbook Links

| Alert | Runbook |
|---|---|
| [FILL: alert name] | [FILL: Confluence runbook link] |

## SLO History

| Quarter | Met? | Notes |
|---|---|---|
| [FILL: Q1 YYYY] | Yes / No | [FILL: any notable misses] |
```

---

## Template 4 — Incident Post-Mortem

**Space:** `SRE`  
**Parent page:** `Incident Management → Post-Mortems`  
**Naming:** `YYYY-MM-DD — [Incident Title]`  
**Lock:** Read-only after 30 days. Post-mortems are immutable records.

```markdown
---
Owner:          [FILL: incident commander]
Severity:       SEV1 | SEV2 | SEV3
Status:         draft | published | closed
Incident start: YYYY-MM-DD HH:MM UTC
Incident end:   YYYY-MM-DD HH:MM UTC
MTTR:           [FILL: HH:MM]
Impacted:       [FILL: services / customers / regions]
---

## Executive Summary

[FILL: 3–5 sentences. What broke, why, how long, what was the blast radius.
Readable by a VP who wasn't there. No jargon without definition.]

## Impact

| Dimension | Value |
|---|---|
| User-facing impact | [FILL: % of requests affected / error rate] |
| Duration | [FILL: minutes / hours] |
| Regions affected | [FILL] |
| Estimated revenue / SLO impact | [FILL] |

## Timeline

| Time (UTC) | Event |
|---|---|
| HH:MM | [FILL: first alert fired / anomaly detected] |
| HH:MM | [FILL: on-call paged] |
| HH:MM | [FILL: war room opened] |
| HH:MM | [FILL: root cause identified] |
| HH:MM | [FILL: mitigation applied] |
| HH:MM | [FILL: incident resolved / all-clear] |

## Root Cause Analysis

**What happened:**
[FILL: technical sequence of events. Start from the triggering condition, not the alert.]

**Why it happened (5 Whys):**
1. [FILL]
2. [FILL]
3. [FILL]
4. [FILL]
5. [FILL: systemic root cause]

**Contributing factors:**
- [FILL]

## What Went Well

- [FILL: detection time, alert fidelity, response clarity, tooling that helped]

## What Went Poorly

- [FILL: gaps in observability, unclear runbooks, slow escalation, missing automation]

## Action Items

| Item | Owner | Jira ticket | Due date | Status |
|---|---|---|---|---|
| [FILL] | [FILL] | [FILL] | YYYY-MM-DD | open |

## Lessons Learned

[FILL: 2–3 sentences. What systemic lesson does this incident surface?
Link to any RFC or ADR that should be created as a result.]
```

---

## Template 5 — Onboarding Checklist (per team)

**Space:** `OBS`  
**Parent page:** `Onboarding → [Team Name]`  
**Naming:** `[Team Name] — Onboarding Tracker`

```markdown
---
Team:           [FILL]
Service(s):     [FILL]
Owner:          [FILL: platform contact / shepherd]
Started:        YYYY-MM-DD
Target complete: YYYY-MM-DD
Status:         in-progress | complete
---

## Pre-onboarding

- [ ] Service tier confirmed with SRE team (Tier 1 / 2 / 3)
- [ ] Service owner and on-call rotation registered
- [ ] Service dependency map reviewed

## Instrumentation

- [ ] Metrics emitted via OTel SDK (not proprietary)
- [ ] Mandatory labels present: `[FILL: list from label schema]`
- [ ] Log format validated (structured JSON, required fields)
- [ ] Distributed tracing enabled; sampling rate confirmed
- [ ] Cardinality estimate reviewed and approved

## Platform Config

- [ ] Collector pipeline configured for this service
- [ ] Dashboard created (use org template as base)
- [ ] Alerts configured (minimum: availability + latency)
- [ ] Runbooks linked to each alert

## SLO Setup

- [ ] SLI definitions agreed with service team
- [ ] SLO targets set and documented
- [ ] Error budget policy acknowledged by team lead
- [ ] Burn-rate alerts wired

## Validation

- [ ] Load test run; signal quality confirmed
- [ ] On-call engineer run through runbooks in dry-run
- [ ] Onboarding sign-off by Observability Architect

## Notes

[FILL: any deviations, exceptions, or follow-up items]
```

---

## Template 6 — Runbook (per alert)

**Space:** `SRE`  
**Parent page:** `Runbooks → [Alert category]`  
**Naming:** `Runbook — [AlertName]`  
**Review cadence:** 90 days

```markdown
---
Alert name:     [FILL: exact alert name from alerting system]
Severity:       SEV1 | SEV2 | SEV3
Owner:          [FILL: team]
Last reviewed:  YYYY-MM-DD
Dashboard:      [FILL: Grafana URL]
---

## Alert Meaning

[FILL: 1–2 sentences. What condition triggers this? What does it indicate is wrong?]

## Impact if unaddressed

[FILL: What degrades, breaks, or impacts users if this fires and is ignored?]

## Triage Steps

1. **Confirm the alert is real** (not a flap / stale data)
   - Check: [FILL: specific query / dashboard panel]

2. **Scope the blast radius**
   - Check: [FILL: which services / regions / users affected]

3. **Look for recent changes**
   - Check deploys in the last 2 hours: [FILL: link to deploy history]
   - Check config changes: [FILL: link]

4. **[FILL: domain-specific diagnostic step]**
   - [FILL: exact query or command]

5. **[FILL: domain-specific diagnostic step]**

## Common Causes

| Cause | Indicator | Resolution |
|---|---|---|
| [FILL] | [FILL] | [FILL] |
| [FILL] | [FILL] | [FILL] |

## Escalation

- **Not resolved in 30 min:** Page [FILL: next escalation name / role]
- **Blast radius expanding:** Open SEV1 war room, notify [FILL]
- **Needs vendor support:** [FILL: support portal / contact]

## Resolution Verification

[FILL: specific metric query or dashboard state that confirms the issue is resolved]

## Related Runbooks

- [FILL: link to related runbooks]

## Post-incident

If this alert triggered a SEV1/SEV2, open a post-mortem within 24 hours.
Link: [FILL: post-mortem template]
```

---

## Template 7 — Production Readiness Review (PRR)

**Space:** `SRE`  
**Parent page:** `Reliability Reviews → PRR Archive`  
**Naming:** `[Service Name] PRR — YYYY-MM-DD`

```markdown
---
Service:          [FILL]
Owner:            [FILL: service team TL]
SRE reviewer:     [FILL]
Review date:      YYYY-MM-DD
Decision:         approved | approved-with-conditions | blocked
---

## Service Summary

[FILL: what the service does, scale expectations, launch target date]

## Checklist

### Observability
- [ ] Metrics: RED signals instrumented (Rate, Errors, Duration)
- [ ] Logs: structured, searchable, no PII in log lines
- [ ] Traces: distributed tracing enabled, sampling configured
- [ ] Dashboards: service dashboard exists, linked here: [FILL]

### Alerting
- [ ] At least one availability alert configured
- [ ] At least one latency alert configured
- [ ] All alerts have runbooks linked
- [ ] Alerts validated in non-prod before this review

### Reliability
- [ ] SLI/SLO defined and documented: [FILL: link]
- [ ] Error budget policy acknowledged
- [ ] Dependency failure modes documented
- [ ] Graceful degradation strategy defined

### Operational
- [ ] On-call rotation registered
- [ ] Deployment runbook exists
- [ ] Rollback procedure documented and tested
- [ ] Rollback time target: < [FILL: N minutes]

### Capacity
- [ ] Load test results reviewed: [FILL: link]
- [ ] Auto-scaling configured and tested
- [ ] Resource limits set (CPU, memory, ingest)

## Conditions (if any)

[FILL: any items that must be resolved post-launch, with owner and due date]

| Condition | Owner | Due |
|---|---|---|
| [FILL] | [FILL] | YYYY-MM-DD |

## Decision Rationale

[FILL: 2–3 sentences explaining the approval or block decision]
```

---

## Related

- [[confluence-space-structure|Confluence Space Structure]] — where these templates get filed
- [[confluence-data-lifecycle|Confluence Data Lifecycle & Governance]] — when a page built from a
  template goes stale

---

_Templates version: 1.0 — add new templates here as recurring page types emerge._
