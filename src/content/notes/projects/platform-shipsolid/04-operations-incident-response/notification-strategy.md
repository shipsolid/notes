---
title: "Notification & Alerting Strategy"
description: "A unified approach to delivering actionable alerts, minimizing noise, and ensuring timely"
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-11"
relations:
  - slug: projects/platform-shipsolid/04-operations-incident-response/incident-notification
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/incident-response-playbook
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/visualization-alerts
    kind: related
---

## **Notification & Alerting Strategy**

A unified approach to delivering actionable alerts, minimizing noise, and ensuring timely
responseacross engineering functions.

---

## **Priority Matrix & Notification Flow**

| **Priority**           | **Definition**                                                              | **Target Teams**                                 | **Channels**                                           | **Escalation Policy**                                     | **Response SLA**            |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------- | --------------------------- |
| **P1 – Critical**      | Full service outage or critical functionality down affecting users/business | SRE (Primary), DevOps, Dev, Platform (Secondary) | BigPanda, SMS, Phone, MS Teams `#🚨incidents`          | Auto-escalation every 15 min (SRE → DevOps → Eng Manager) | **5–15 min**                |
| **P2 – High**          | Major service degradation or significant customer impact                    | SRE, Dev, Platform (as applicable)               | BigPanda (work hours), MS Teams (on-call), Email (FYI) | Escalate if not acknowledged in 30 min                    | **30 min**                  |
| **P3 – Moderate**      | Minor degradation with workarounds available                                | DevOps, SRE, Dev (service owner)                 | MS Teams (team channels), Email                        | Escalate only if unresolved for hours                     | **4–8 hrs acknowledgement** |
| **P4 – Low**           | Non-critical issues, logs, or minor anomalies                               | Dev or Platform                                  | Email digest, Jira                                     | Escalate only if recurring or unaddressed for days        | **Within sprint cycle**     |
| **P5 – Informational** | FYIs, threshold warnings, successful deploy logs                            | Relevant Teams (optional)                        | Email, dashboards, daily summaries                     | None                                                      | **Optional**                |

---

## **Strategic Principles**

### **Routing**

- **SRE/DevOps**: Infra/network/CI-related issues.
- **Dev Teams**: Application or business logic issues.
- **Platform Teams**: Cluster, mesh, or shared platform issues.

### **Noise Reduction**

- Suppress flapping alerts (Grafana IRM, BigPanda rules).
- Auto-remediate known transient alerts before notifying.
- Route non-actionable alerts (P4/P5) to dashboards/email only.

### **Contextual Alerting**

- Enrich alerts with **runbooks, logs, graphs**.
- Tag with service, severity, and deployment metadata.

### **Time-Based Policies**

- **P1/P2** alerts trigger 24x7; always routed to on-call.
- **P3–P5** alerts paused after hours unless explicitly tagged for escalation.

---

## **Escalation Matrix**

| **Level** | **Escalation Role**                      | **Time Delay**        |
| --------- | ---------------------------------------- | --------------------- |
| L1        | On-Call SRE                              | Immediate             |
| L2        | Dev/Platform Owner (Service-Specific)    | +15 mins              |
| L3        | Engineering Manager / Incident Commander | +30 mins              |
| L4        | Director/VP of Engineering               | +1 hour (for P1 only) |

---

## **Examples by Scenario**

| **Scenario**                      | **Priority** | **Teams Notified** |
| --------------------------------- | ------------ | ------------------ |
| API Gateway Down                  | P1           | SRE, Dev, Platform |
| CrashLoop in Core Service Pod     | P2           | SRE, Dev           |
| Redis Latency Spike (self-healed) | P3           | DevOps, Dev        |
| Repeated 5xx in logs              | P4           | Dev                |
| Successful Deployment Log         | P5           | Dev (email only)   |

---

## **Channel Structure in Microsoft Teams**

### **Cross-Team Channels**

| **Channel**                 | **Purpose**                                 |
| --------------------------- | ------------------------------------------- |
| `#🚨incidents`              | Central war room for P1–P2 issues           |
| `#🔧on-call-handovers`      | Daily shifts, context passing, learnings    |
| `#📊observability-insights` | Dashboards, alert summaries, trend analysis |
| `#📣announcements`          | Policy updates, infra changes               |
| `#🧭runbooks-and-SOPs`      | Escalation paths, operational playbooks     |

### **Team-Specific Channels**

#### SRE

- `#sre-alerts`
- `#sre-automation`
- `#sre-architecture`
- `#sre-weekly-sync`

#### DevOps

- `#devops-ci-cd`
- `#devops-terraform`
- `#devops-secrets-and-vaults`

#### Development Squads

- `#dev-service-x`
- `#dev-ui-team`
- `#dev-retrospectives`

#### Platform

- `#platform-k8s`
- `#platform-helm`
- `#platform-service-mesh`

---

## **Tab Layout for Contextual Awareness**

| **Tab**                                  | **Use**                      |
| ---------------------------------------- | ---------------------------- |
| **Wiki**                                 | SOPs, postmortems, templates |
| **Planner / Tasks**                      | RCA backlog, action items    |
| **Grafana/Dashboard**                    | Realtime metrics             |
| **OneNote/Notion**                       | Linked documentation         |
| **On-Call Schedule (BigPanda/Opsgenie)** | Visibility into duty rosters |

---

## **Severity-to-Channel Mapping**

| **Severity** | **Primary Channel**             | **Backup Channels**                              | **Mentions**        | **Alert Behavior**                            |
| ------------ | ------------------------------- | ------------------------------------------------ | ------------------- | --------------------------------------------- |
| P1           | `#🚨incidents`                  | `#sre-alerts`, `#dev-service-x`, `#platform-k8s` | `@on-call`, `@team` | Immediate via BigPanda + @mention             |
| P2           | `#🚨incidents`                  | Same as P1                                       | `@channel`, `@team` | MS Teams + BigPanda alert with summary thread |
| P3           | `#sre-alerts`, `#dev-*`         | –                                                | Optional            | Create Jira or post on dashboard              |
| P4           | `#📊observability-insights`     | –                                                | None                | Batched & shared in daily digest              |
| P5           | `#📦deployments`, `#📊insights` | –                                                | None                | Posted via webhook integration                |

---

## **Alert Routing Logic**

Can be implemented via tools like **Grafana Alerting, Prometheus [[03-alertmanager|Alertmanager]],
BigPanda**, integrated with Microsoft Teams using:

- **Incoming Webhooks**
- **Power Automate**
- **Custom Bots**
- **Azure Logic Apps**

> **Example Route:** Prometheus → Alertmanager → BigPanda → Teams Webhook → `#🚨incidents`

---

## **Real-World Alert Examples**

### **P1 Alert**

- **Trigger**: 0% availability for a key service.
- **Action**: Alert with logs & dashboards posted in `#🚨incidents`
- **Escalation**: Auto-escalated if no acknowledgment in 15 minutes.

### **P4 Alert**

- **Trigger**: Memory usage >80%, no impact.
- **Action**: Aggregated to `#📊observability-insights` at EOD.
- **Review**: Triage in weekly sync.

---

## **Quick Channel Usage Summary**

| Channel                     | P1  | P2  | P3  | P4  | P5  |
| --------------------------- | --- | --- | --- | --- | --- |
| `#🚨incidents`              | ✅  | ✅  | ❌  | ❌  | ❌  |
| `#sre-alerts`               | ⚠️  | ✅  | ✅  | ❌  | ❌  |
| `#dev-service-x`            | ⚠️  | ✅  | ✅  | ✅  | ✅  |
| `#📊observability-insights` | ❌  | ❌  | ⚠️  | ✅  | ✅  |
| `#📦deployments`            | ❌  | ❌  | ❌  | ✅  | ✅  |

---
