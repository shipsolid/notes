---
title: "Incident Notification & Response"
description: "**Owner:** SRE Team **Last Updated:** 2025-05-01 **Applies to:** All production alerts routed"
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-05-01
hidden: false
zettelId: "202510130815-3"
relations:
  - slug: projects/platform-shipsolid/04-operations-incident-response/incident-response-playbook
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/notification-strategy
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/visualization-alerts
    kind: related
---

## Runbook: Incident Notification and Response

**Owner:** SRE Team **Last Updated:** 2025-05-01 **Applies to:** All production alerts routed
through BigPanda from the Grafana Cloud observability platform.

---

## Alert-to-Incident Flow

```
Grafana Alert fires
    → BigPanda (incident aggregation & deduplication)
        → MS Teams notification (channel per severity)
            → On-call engineer acknowledges
                → Triage → Resolve → Post-mortem (P1/P2 only)
```

---

## Priority Definitions and Response SLAs

| Priority | Severity   | Meaning                                                | Acknowledge | Resolve    |
| -------- | ---------- | ------------------------------------------------------ | ----------- | ---------- |
| **P1**   | `critical` | Service down or data loss — business impact now        | < 15 min    | < 4 hours  |
| **P2**   | `warning`  | Significant degradation, approaching failure threshold | < 1 hour    | < 8 hours  |
| **P3**   | `warning`  | Non-critical issue, investigate during business hours  | < 4 hours   | Next day   |
| **P4**   | `info`     | Informational, no immediate action required            | Next day    | As planned |

---

## Step 1: Receive the Notification

Alerts are delivered to MS Teams channels based on priority:

| Priority | MS Teams Channel   |
| -------- | ------------------ |
| P1       | `#alerts-critical` |
| P2       | `#alerts-warning`  |
| P3/P4    | `#alerts-info`     |

Each notification includes:

- Alert title (format: `[env] [product] [resource] [metric] [condition] [priority] [team]`)
- Summary of the condition
- Link to the firing alert in Grafana
- BigPanda incident ID

**Action:** Acknowledge the BigPanda incident within the SLA window by clicking **Acknowledge** in
the Teams notification or directly in BigPanda.

---

## Step 2: Triage in Grafana

Open the Grafana link from the alert notification. Use the following sequence:

### 2a. Confirm the alert is genuine

- Check the alert rule's query in Grafana → Alerting → Alert rules
- Verify the metric is actually breaching the threshold (not a scrape gap or stale data)
- If `noDataState: KeepLast` is the cause of a ghost alert, silence the alert and notify SRE

### 2b. Assess scope and impact

| Question                        | Where to look                                                       |
| ------------------------------- | ------------------------------------------------------------------- |
| Which pods/nodes are affected?  | Kubernetes dashboard → `{namespace}` pod list                       |
| Is error rate elevated?         | Service dashboard → error rate panel                                |
| Are traces showing errors?      | Grafana → Explore → Tempo → service errors                          |
| Are logs showing exceptions?    | Grafana → Explore → Loki → `{namespace}` \| json \| level = "error" |
| Is this isolated to one region? | Regional dashboard → compare regions                                |

### 2c. Classify the incident

Based on your findings:

- **Transient spike** (already recovered): Resolve in BigPanda with root cause note
- **Ongoing degradation**: Proceed to Step 3
- **Full outage**: Escalate immediately (P1 procedure below)

---

## Step 3: Investigate and Mitigate

### Common investigation paths

**CPU/Memory saturation:**

```logql
# Check recent restarts (OOMKill)
{namespace="{product}-prod"} | json | message =~ "OOMKilled|CrashLoopBackOff"
```

- Scale the deployment: `kubectl scale deploy/{name} -n {namespace} --replicas=N`
- Or adjust resource limits if consistently hitting ceiling

**High error rate:**

```logql
{namespace="{product}-prod"} | json | level = "error"
```

- Look for repeated error messages
- Check upstream dependencies (database, external API) via trace waterfall in Tempo
- Check if a recent deployment coincides with the spike (`kubectl rollout history`)

**Latency spike (p95/p99 elevated):**

- Open Tempo → find slow traces → identify the bottleneck span
- Check database query duration: `db_client_operation_duration_seconds` in Grafana Metrics
- Check for resource contention on the node

**Upstream dependency failure:**

- Identify the downstream call from the trace waterfall
- Check if the dependency has its own active alert in BigPanda
- If third-party: check their status page

### Quick mitigation actions

| Situation                     | Action                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Bad deployment causing errors | `kubectl rollout undo deploy/{name} -n {namespace}`                                |
| Pod OOMKilled repeatedly      | Temporarily increase memory limit via patch; raise long-term fix ticket            |
| One pod in bad state          | `kubectl delete pod {pod-name} -n {namespace}` (will respawn)                      |
| Node degraded                 | Cordon and drain the node; AKS node pool will provision replacement                |
| External dependency down      | Activate [[07-circuit-breaker]] / degraded mode if implemented; notify owning team |

---

## Step 4: Escalation (P1)

If the incident is P1 and cannot be resolved within 30 minutes:

1. Post in `#sre-incident-bridge` with:
   - BigPanda incident ID
   - Affected service(s) and environment
   - Current impact (users, data, revenue)
   - Actions taken so far
   - Current hypothesis
2. Page the on-call engineer via BigPanda escalation policy
3. Notify the product team lead (for customer-facing P1s)
4. Create an incident channel: `#incident-YYYY-MM-DD-{service}` for coordination

---

## Step 5: Resolve

Once the service is stable and the alert has cleared in Grafana:

1. Mark the BigPanda incident as **Resolved**
2. Add a resolution note: what was the root cause, what action resolved it
3. Confirm the alert is no longer firing in Grafana (green state)
4. Verify normal metric levels in the service dashboard

---

## Step 6: Post-Mortem (P1 and P2)

All P1 incidents and recurring P2 incidents require a post-mortem within 5 business days.

**Post-mortem template:** (canonical version:
[[projects/platform-shipsolid/04-operations-incident-response/post-mortems/_template|Incident Post-Mortem Template]])

```markdown
## Incident Post-Mortem

**Date:** YYYY-MM-DD
**Severity:** P1 / P2
**BigPanda Incident ID:** <id>
**Duration:** HH:MM (detection → resolution)
**Affected Service(s):** <services>

### Timeline
- HH:MM — Alert fired / first symptom observed
- HH:MM — On-call acknowledged
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — Service restored

### Root Cause
<description>

### Contributing Factors
<list of factors>

### Impact
<users affected, data impact, SLA breach>

### What Went Well
<list>

### Action Items
| Action | Owner | Due Date |
| ------ | ----- | -------- |
| ...    | ...   | ...      |
```

Post the post-mortem in the `#sre-post-mortems` Teams channel and link it from the BigPanda
incident.

---

## Alert Silencing and Maintenance Windows

To silence alerts during planned maintenance:

1. Grafana → Alerting → Silences → New silence
2. Set the label matcher to scope to your namespace or service: `namespace="{product}-prod"`
3. Set start/end time for the maintenance window
4. Add a comment with the change ticket number

**Do not pause alerts in production JSON files** for maintenance — use silences instead. Paused
alerts (`isPaused: true`) require a code change and deployment.

---

## False Positive Handling

If an alert repeatedly fires with no genuine impact:

1. Silence it immediately to reduce noise
2. Open a ticket to recalibrate the threshold
3. SRE team updates the alert JSON with a revised threshold and deploys via PR

> Persistent false positives erode on-call trust. Investigate and fix rather than ignoring.

---

## Contacts

| Role                | Contact                                     |
| ------------------- | ------------------------------------------- |
| SRE on-call         | BigPanda escalation policy / `#sre-on-call` |
| SRE platform team   | `#sre-observability` (MS Teams)             |
| BigPanda admin      | SRE team                                    |
| Grafana Cloud admin | SRE team                                    |
