---
title: "Visualization, Alerting & SLOs"
description: "An effective observability system translates raw telemetry into actionable insights through"
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-12"
relations:
  - slug: projects/platform-shipsolid/04-operations-incident-response/notification-strategy
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/incident-notification
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/sre-toolkit
    kind: related
---

## Visualization, Alerting & SLOs

An effective observability system translates raw telemetry into actionable insights through
intuitive dashboards and targeted alerting. Visualization and alerting are tailored to the needs of
different stakeholders, aligned with SLOs, and tightly integrated into incident response workflows.

## **1. Dashboard Templates for Key Personas**

**Scope:**

- Persona-based dashboards are designed to surface relevant insights to each stakeholder group,
  balancing depth, usability, and business context.

**Dashboards include:**

| Persona            | Focus Areas                                                                |
| ------------------ | -------------------------------------------------------------------------- |
| **SREs**           | Infra health, service uptime, latency, error rates, golden signals         |
| **Developers**     | Application-level logs, traces, exception heatmaps, deploy impact analysis |
| **Product Teams**  | Feature adoption, usage funnels, business SLIs                             |
| **Business Users** | KPIs, high-level SLAs, system availability, geographic breakdowns          |

**Design Principles:**

- Unified theme and consistent panel layouts
- Linked time ranges and template variables (e.g., `env`, `service`, `region`)
- Use of shared Grafana folders and access roles to control visibility

### 1.1 Developers Persona

**Main Concern**: Debugging application-level issues, exception heatmaps, deployment impact.

#### SLO-centric KPI's

| Section | Panel                       | Purpose            | Data Source                             | Panel Type              |
| ------- | --------------------------- | ------------------ | --------------------------------------- | ----------------------- |
| KPIs    | Availability (success rate) | SLO health         | Prometheus                              | **Gauge / Stat**        |
| KPIs    | p95 Latency                 | User performance   | Prometheus (histogram), Tempo exemplars | **Time series**         |
| KPIs    | Traffic (RPS)               | Request volume     | Prometheus                              | **Time series**         |
| KPIs    | 5xx Error Rate              | Reliability        | Prometheus                              | **Time series / Stat**  |
| KPIs    | Retry Rate                  | Resiliency check   | Prometheus                              | **Time series**         |
| KPIs    | DB CPU %                    | Data tier load     | Azure Monitor (MI)                      | **Gauge / Time series** |
| KPIs    | Top DB Wait Type            | Bottleneck insight | SQL DMVs                                | **Table / Pie**         |
| KPIs    | Active Incidents            | Current alerts     | Grafana Alerting                        | **Stat / Table**        |

#### Application (ACA + .NET)

| Section             | Panel                          | Purpose                | Data Source                | Panel Type                           |
| ------------------- | ------------------------------ | ---------------------- | -------------------------- | ------------------------------------ |
| A1 – Requests       | Success vs 4xx/5xx             | Error trends           | Prometheus                 | **Time series / Bar**                |
|                     | Latency (p50/p90/p95)          | Performance baseline   | Prometheus                 | **Time series**                      |
|                     | RPS by route/method            | Hot endpoints          | Prometheus                 | **Time series / Table**              |
| A2 – Errors         | Top error routes               | Debug failing APIs     | Prometheus + Loki          | **Table / Bar**                      |
|                     | Top exception types            | See failure patterns   | Loki                       | **Table / Pie**                      |
|                     | Failed dependency calls        | Downstream reliability | Prometheus                 | **Table**                            |
| A3 – Resources      | CPU% / Memory% per revision    | App health             | Azure Monitor / Prometheus | **Time series**                      |
|                     | Container restarts             | Crash loops            | Azure Monitor              | **Stat / Time series**               |
|                     | Replica count                  | Autoscaling check      | Azure Monitor              | **Time series**                      |
| A4 – Deploy Overlay | Errors/latency vs deploys      | Correlate regressions  | Prometheus + Annotations   | **Time series + Annotation markers** |
| A5 – Traces         | Service map                    | Topology view          | Tempo                      | **Node graph**                       |
|                     | Slowest traces                 | Root cause triage      | Tempo                      | **Table**                            |
|                     | N+1 calls detector             | Chatty call detection  | Tempo                      | **Table**                            |
| A6 – Async / Queues | Queue depth                    | Backlog risk           | Azure Monitor / Custom     | **Gauge / Time series**              |
|                     | Dequeue rate & handler latency | Throughput analysis    | Prometheus                 | **Time series**                      |
|                     | DLQ count                      | Poison messages        | Azure Monitor              | **Stat**                             |

#### Data Tier (Azure SQL MI)

| Section           | Panel                                  | Purpose                   | Data Source            | Panel Type              |
| ----------------- | -------------------------------------- | ------------------------- | ---------------------- | ----------------------- |
| B1 – Health       | CPU %, IO %, Log Write %               | DB saturation             | Azure Monitor (MI)     | **Time series / Gauge** |
|                   | Storage used / free                    | Capacity planning         | Azure Monitor          | **Time series / Gauge** |
|                   | Sessions / connections                 | Pool stress               | Azure Monitor          | **Time series**         |
| B2 – Waits        | Top wait types                         | “Why slow”                | SQL DMVs / Query Store | **Table / Bar**         |
|                   | Waits trend timeline                   | Spike correlation         | SQL                    | **Time series**         |
| B3 – Queries      | Expensive queries (duration/reads/CPU) | Tuning                    | SQL DMVs               | **Table**               |
|                   | Query text + plan handle               | Developer actionable      | SQL DMVs               | **Table**               |
|                   | Last 10 executions                     | Variability check         | Query Store            | **Table**               |
| B4 – Contention   | Blocking tree                          | Concurrency diagnosis     | SQL DMVs               | **Node graph / Table**  |
|                   | Deadlocks count                        | Detect correctness issues | SQL DMVs / Events      | **Stat / Time series**  |
| B5 – App Symptoms | SQL timeouts                           | App-side visibility       | Loki logs              | **Table / Stat**        |
|                   | Transient retries                      | Resiliency                | Prometheus             | **Time series**         |

#### Alerts (Mapped to Panels)

| Alert             | Trigger Example     | Purpose                   | Source        | Panel Type |
| ----------------- | ------------------- | ------------------------- | ------------- | ---------- |
| HighErrorRate     | 5xx% > 2% for 5m    | Catch breakages           | Prometheus    | **Alert**  |
| LatencyP95High    | p95 > 500ms for 10m | Performance guardrail     | Prometheus    | **Alert**  |
| ContainerRestarts | >3 restarts / 15m   | Detect crash loops        | Azure Monitor | **Alert**  |
| Ingress4xxSpike   | 4xx% > 8%           | Detect bad config/clients | Prometheus    | **Alert**  |
| MI_CPUHigh        | CPU > 80%           | DB saturation             | Azure Monitor | **Alert**  |
| MI_WriteLogHigh   | Log write % > 80%   | Log bottleneck            | Azure Monitor | **Alert**  |
| DeadlocksDetected | Deadlocks > 0       | Data correctness          | SQL DMVs      | **Alert**  |
| BlockingSessions  | >5 blocked sessions | Contention                | SQL DMVs      | **Alert**  |
| ErrorBudgetBurn   | Multi-window burn   | Protect SLO               | Prometheus    | **Alert**  |

### 1.2 SRE Persona

**Main concern:** Service uptime, reliability, resource utilization, golden signals.

#### Executive Overview

| Panel                         | Purpose                                        | Data Source                                   | Type            |
| ----------------------------- | ---------------------------------------------- | --------------------------------------------- | --------------- |
| Fleet Health (mdixai & OT)    | Red/Amber/Green view of service & plant health | Prometheus (SLO rules) + Grafana Alerting API | **Stat**        |
| Error Budget Burn (1h/24h/7d) | Early warning for reliability                  | Prometheus burn rate rules                    | **Time series** |
| Incidents & MTTR (7/30d)      | Track MTTA/MTTR trends                         | Loki (incident logs) + Alertmanager metrics   | **Bar gauge**   |
| Deployments Today             | # of prod deploys + failures                   | GitHub Actions exporter/API → Prom            | **Stat**        |
| Top 3 Risk Hotspots           | Show highest-risk services/plants              | Prom + Loki join                              | **Table**       |

---

#### Golden Signals (User Journey)

| Panel                      | Purpose                 | Data Source                     | Type               |
| -------------------------- | ----------------------- | ------------------------------- | ------------------ |
| Global Availability        | End-user uptime         | Synthetic Monitoring / Blackbox | **State timeline** |
| P95/P99 Latency (key APIs) | Performance regressions | App Insights / OTel → Prom      | **Time series**    |
| Error Rate by Endpoint     | Reliability issues      | App Insights                    | **Time series**    |
| Failing Checks             | Quick triage drill-down | Synthetic Monitoring            | **Links**          |

---

#### MDIxAI Services (Azure Container Apps & Web Apps)

| Panel                    | Purpose              | Data Source                | Type               |
| ------------------------ | -------------------- | -------------------------- | ------------------ |
| Replicas / Instances     | Desired vs available | Azure Monitor / Prometheus | **State timeline** |
| RPS • Error% • P95       | Golden signals       | App Insights / OTel → Prom | **Time series**    |
| CPU & Memory Utilization | Capacity monitoring  | Azure Monitor / Prom       | **Time series**    |
| Container Restarts       | Stability check      | Prometheus                 | **Bar chart**      |
| Error Logs (Top N)       | Fast triage          | Loki (`service`, `env`)    | **Logs**           |

---

#### OT Plants (Fleet & Host Health)

| Panel                       | Purpose                    | Data Source                    | Type               |
| --------------------------- | -------------------------- | ------------------------------ | ------------------ |
| Plant Availability Map      | Which plants are up/down   | Prom (Alloy agent heartbeat)   | **State timeline** |
| Critical Lines at Risk      | Priority ≤2                | Prometheus rule                | **Table**          |
| CPU/Memory/Disk (Top Hosts) | Capacity hotspots          | node/windows exporter → Prom   | **Time series**    |
| Service/Process Health      | Business-critical services | windows_exporter perf counters | **Table**          |
| OT Error Logs               | Quick triage               | Loki (Event Log/Syslog)        | **Logs**           |

---

#### SLOs & Error Budgets

| Panel                  | Purpose                         | Data Source                | Type            |
| ---------------------- | ------------------------------- | -------------------------- | --------------- |
| SLO Status (30d)       | Pass/Fail view by service/plant | Prometheus (SLO rules)     | **Table**       |
| Burn Rates (1h/6h/24h) | Early warning guardrails        | Prometheus                 | **Time series** |
| Error Budget Remaining | Stakeholder-friendly            | Prometheus                 | **Gauge**       |
| Top Violations (7d)    | Where to focus                  | Prom + LogQL metricization | **Bar chart**   |

---

#### Alerts & On-Call

| Panel                     | Purpose           | Data Source                                | Type                   |
| ------------------------- | ----------------- | ------------------------------------------ | ---------------------- |
| Active Alerts by Severity | Live triage       | Grafana Alerting API / [[03-alertmanager]] | **Table**              |
| Alert Volume Trend        | Noise analysis    | Alertmanager metrics                       | **Time series**        |
| Noisiest Rules (Top N)    | Tuning candidates | [[03-alertmanager]] → Prom                 | **Bar chart**          |
| Paging Effectiveness      | Ack/Resolve times | PagerDuty/BigPanda webhooks                | **Stat + Time series** |

---

## **2. Standardized Alert Rules**

### Scope

To ensure consistency, actionability, and maintainability across environments, alerting rules are
**standardized by taxonomy and scope**:

- **Environment-Specific Thresholds**
  - **Dev/Staging**: Relaxed thresholds to avoid noise.
  - **Prod**: Strict thresholds with high precision and sensitivity.
- **Rule Design Patterns**:
  - **Multi-condition Alerts** Example: `High latency AND high error rate` to reduce false
    positives.
  - **Threshold-Based Alerts**
    - Based on fixed thresholds (e.g., CPU > 90%, error rate > 5%)
    - Used for resource saturation or **SLO violations**
  - **Anomaly Detection**
    - Powered by **Grafana Cloud Machine Learning** or **Azure Monitor Dynamic Thresholds**
    - Detects unusual patterns without manually defined baselines

### Alert Types

| Type               | Description                                   | Examples                                |
| ------------------ | --------------------------------------------- | --------------------------------------- |
| **Infrastructure** | Monitors compute and platform resources       | CPU, memory, disk usage, node readiness |
| **Application**    | Tracks service health and performance metrics | 5xx error rates, dependency latency     |
| **Business**       | Tied to key business outcomes and KPIs        | Drop in order volume, failed checkouts  |

### Key Pillars of Standardized Alerts

| Pillar                      | Description                                                            |
| --------------------------- | ---------------------------------------------------------------------- |
| **Taxonomy**                | Use a consistent classification: `infra`, `app`, `business` alerts     |
| **Severity Levels**         | Standard priority levels (P1–P5) based on impact and urgency           |
| **Structure**               | Standard alert labels (`service`, `team`, `severity`, `env`, `region`) |
| **Message Format**          | Consistent subject line, annotations, and alert body                   |
| **Environment Sensitivity** | Different thresholds for `dev`, `stage`, `prod` environments           |
| **Routing Logic**           | Unified routing based on tags (e.g., `team`, `env`, `severity`)        |
| **Templates**               | Reusable templates for alert rules and notification messages           |
| **Documentation**           | All alerts link to a runbook and contain troubleshooting steps         |

### Naming Pattern

A **modular naming pattern** helps organize alerts by **domain, resource, condition, and severity**.

```md
<env> <product> <infra_type> <dimension> <condition> <priority> <team>

[prod] [OT_Lelystad] [vm] [cpu] [gt_90pct_5m] [p1] [OT_Team]

[prod] [MDIxAI] [az_container_apps] [cpu] [gt_90pct_5m] [p1] [SRE_Team]

```

### Alert Name Fields (Breakdown)

| Field        | Purpose                    | Allowed/Recommended Values                                                                                    |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `env`        | Environment                | `dev`, `qa`, `prod`, `sandbox`                                                                                |
| `product`    | Program or business domain | `mdixai`, `ot`, `data`                                                                                        |
| `infra_type` | Platform/infra class       | `az_container_apps`, `aks`, `app_gateway`, `key_vault`, `cosmosdb`, `sql_mi`, `linux_vm`, `win_vm`, `network` |
| `service`    | Logical service/app        | e.g., `api-gateway`, `orders-api`, `billing-worker`                                                           |
| `component`  | Sub-part                   | e.g., `ingress`, `backend`, `db`, `queue`, `os`                                                               |
| `alert_type` | Pattern category           | `slo_burn`, `threshold`, `log_spike`, `synthetic`, `security`, `quota`, `deployment`                          |
| `condition`  | Machine-friendly condition | `error_rate_5m_and_1h`, `p95_latency_gt_500ms_5m`, `cpu_gt_90_for_10m`, `restart_rate_gt_5_5m`                |
| `severity`   | Human severity             | `critical`, `warning`, `info`                                                                                 |
| `team`       | Owning group               | `platform`, `sre`, `infra`, `network`, `data`, `api`, etc.                                                    |

**Priority defaults:**

- severity=critical → priority=P1 (prod) / P2 (non-prod)
- severity=warning → P3
- severity=info → P4/P5

### Priority Defaults

| Severity     | Environment                   | Priority | Typical Use Case                                                                                                                | Escalation Target                                                    |
| ------------ | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **critical** | **prod**                      | **P1**   | Customer-facing outage, SLO burn, synthetic down in ≥2 regions                                                                  | Immediate page to BigPanda → On-call engineer; management visibility |
| **critical** | **non-prod (dev/qa/sandbox)** | **P2**   | Blocking CI/CD pipelines, critical test envs down, widespread developer impact                                                  | MS Teams alert; optional on-call if blocking release                 |
| **warning**  | **prod**                      | **P3**   | Capacity nearing limits, error rate spikes, failed jobs without user impact, Expiring secrets, approaching quotas, config drift | MS Teams notifications; triaged during working hours                 |
| **info**     | **non-prod**                  | **P4**   | Expiring secrets, approaching quotas, config drift                                                                              | Teams/Email DL; backlog item in Jira                                 |
| **info**     | **non-prod**                  | **P5**   | Routine noise, deprecated resource usage, minor anomalies                                                                       | Log only, optional Teams post; no escalation                         |

### Benefits of Standardizing Alerts

- **Reduces Alert Fatigue**: Less noise, more signal
- **Faster Triage**: Clear severity, context, and ownership
- **Improved SLO/SLA Tracking**: Alerts aligned with business impact
- **Better Routing & Escalation**: Alerts reach the right people, in the right way
- **Easier Reporting**: Uniform tags and labels improve dashboards and KPIs

## **3. Alert Routing & Escalation Policies**

### Escalation Targets

- P1 → Page on-call immediately (BigPanda → MS Teams War Room).
- P2 → Notify team leads + MS Teams; escalate if no acknowledgement in 30 min.
- P3 → Team channel notification; captured in weekly ops review.
- P4/P5 → Logged; visible in dashboards and daily digest emails, not actionable in real time.

### Routing Logic (Notification Policy Tree)

- Matchers:
  - severity=critical, env=prod → route to BigPanda contact point.
  - severity=critical, env!=prod → route to MS Teams (with priority=P2 label).
  - severity=warning → route to MS Teams (priority=P3).
  - severity=info → route to MS Teams Digest DL or log_only contact point.

### Time-to-Action Expectations

| Priority | MTTA Target  | MTTR Target        |
| -------- | ------------ | ------------------ |
| **P1**   | ≤ 5 minutes  | ≤ 30 minutes       |
| **P2**   | ≤ 15 minutes | ≤ 2 hours          |
| **P3**   | ≤ 1 hour     | ≤ 4 hours          |
| **P4**   | ≤ 4 hours    | ≤ 24 hours         |
| **P5**   | Best effort  | N/A (backlog only) |
