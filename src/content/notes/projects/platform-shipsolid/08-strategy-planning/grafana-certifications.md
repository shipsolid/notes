---
title: "Grafana Learning Path: From Beginner to Expert in Observability"
description: "Understand Grafana, observability concepts, and basic usage."
tags: ["ShipSolid", "Strategy"]
updated: 2026-05-14
hidden: false
zettelId: "202605082026-2"
relations:
  - slug: observability/11-visualization/01-dashboard-design/01-dashboard-design
    kind: related
  - slug: prometheus/06-alerting/01-recording-rules/01-recording-rules
    kind: related
  - slug: prometheus/06-alerting/02-alerting-rules/02-alerting-rules
    kind: related
---

## Grafana Learning Path: From Beginner to Expert in Observability

> Source: [Grafana Learning Catalog](https://learn.grafana.com/page/course-catalog)

---

### Learning Phases Overview

| Phase   | Level         | Focus                                |
| ------- | ------------- | ------------------------------------ |
| Phase 1 | Beginner      | Grafana basics + observability intro |
| Phase 2 | Beginner+     | Queries, dashboards, alerting        |
| Phase 3 | Intermediate  | Real-world usage (TP101)             |
| Phase 4 | Intermediate+ | Deep specialization                  |
| Phase 5 | Advanced      | Platform-level observability         |
| Phase 6 | Expert        | Architecture & optimization          |
| Phase 7 | Validation    | Assessments & badges                 |

---

## Phase 1 — Beginner (Foundations)

### Objective

Understand Grafana, observability concepts, and basic usage.

### Outcome

#### Understand

- Metrics, Logs, Traces (MLT)
- Basic dashboards and alerting

#### Ability to

- Navigate Grafana
- Build simple dashboards

### Core Learning Path

- [Grafana Fundamentals Path](https://learn.grafana.com/path/grafana-fundamentals)

### Courses

- [Intro to Grafana & Observability](https://learn.grafana.com/intro-to-grafana-observability)
- [Intro to Data Collection](https://learn.grafana.com/intro-to-data-collection)
- [Intro to Data Visualization & Alerting](https://learn.grafana.com/intro-to-data-visualization-alerting)
- [Intro to Leadership Reporting](https://learn.grafana.com/intro-to-leadership-reporting)
- [Hands-on Lab: Grafana Product Exploration](https://learn.grafana.com/hands-on-lab-grafana-product-exploration)

### Optional (Highly Recommended)

- [Video Quick Hits: Grafana for Beginners](https://learn.grafana.com/video-quick-hits-grafana-for-beginners)
- [Video Quick Hits: Grafana Stack](https://learn.grafana.com/video-quick-hits-the-grafana-stack)

---

## Phase 2 — Beginner → Intermediate (Core Observability)

### Objective

Learn how telemetry is collected, queried, and visualized.

### Outcome

#### Ability to

- Query metrics/logs
- Correlate signals
- Build meaningful dashboards
- Create basic alerts

### Core Modules

- [Collection of Metrics, Logs, & Traces](https://learn.grafana.com/collection-of-metrics-logs-traces-module-labs)
- [Using Logs, Metrics, and Traces Together](https://learn.grafana.com/using-logs-metrics-and-traces-together-in-grafana)

### Query Foundations

- [Building Efficient Queries: PromQL](https://learn.grafana.com/building-efficient-queries-promql-1)
- [Building Efficient Queries: LogQL](https://learn.grafana.com/building-efficient-queries-logql)

### Dashboards & Alerting

- [Building Effective Dashboards with the Four Golden Signals](https://learn.grafana.com/building-effective-dashboards-with-the-four-golden-signals-1)
- [Alerting Essentials](https://learn.grafana.com/alerting-essentials)
- [Recording Rules](https://learn.grafana.com/recording-rules)

### Hands-on Labs

- Collect telemetry from Kubernetes labs:
  - [Metrics Lab](https://learn.grafana.com/collect-metrics-from-a-k8s-cluster-running-the-tns-app)
  - [Logs Lab](https://learn.grafana.com/collect-logs-from-a-k8s-cluster-running-the-tns-app)
  - [Traces Lab](https://learn.grafana.com/collect-traces-from-a-k8s-cluster-running-the-tns-app)
- [Building PromQL Queries](https://learn.grafana.com/building-efficient-queries-promql)
- [Building LogQL Queries](https://learn.grafana.com/building-logql-queries)
- [Basic Alerting Rules](https://learn.grafana.com/basic-alerting-rules)
- [Using Logs, Metrics, and Traces Together](https://learn.grafana.com/using-logs-metrics-and-traces-together)

---

## Phase 3 — Intermediate (Practitioner Level)

### Objective

Apply observability in real systems.

### Learning Paths

- [Technical Practitioner 101 (19 courses)](https://learn.grafana.com/path/technical-practitioner-101)

### Key Capabilities

- Advanced querying
- Data source strategies
- Observability workflows

### Supporting Content

- [Grafana APM Migration Guide](https://learn.grafana.com/grafana-apm-migration-guide)
- [Datasource Strategies and Best Practices](https://learn.grafana.com/datasource-strategies-and-best-practices)
- [Dashboarding Best Practices](https://learn.grafana.com/dashboarding-best-practices)

### Outcome

#### Ability to

- Troubleshoot systems using LGTM stack
- Design dashboards for real use cases
- Handle multi-source observability data

---

## Phase 4 — Intermediate → Advanced (Deep Specialization)

### Objective

Gain depth in specific observability domains.

### Specialized Learning Paths

- [PromQL Zero to Hero (5 courses)](https://learn.grafana.com/path/promql-zero-to-hero)
- [LogQL Zero to Hero (5 courses)](https://learn.grafana.com/path/logql-zero-to-hero)
- [Observability Signals Foundations (7 courses)](https://learn.grafana.com/path/observability-signals-foundations-metrics-logs-traces)
- [Dashboard Design & Visual Storytelling (7 courses)](https://learn.grafana.com/path/dashboard-design-visual-storytelling)

### Advanced Labs

- [PromQL Foundations for Practitioners](https://learn.grafana.com/lab-promql-foundations-for-practitioners)
- [LogQL Foundations](https://learn.grafana.com/lab-logql-foundations-for-practitioners)
- [TraceQL Foundations](https://learn.grafana.com/lab-traceql-foundations)
- [Dashboard Customization](https://learn.grafana.com/lab-grafana-dashboard-customization)
- [Synthetic Monitoring](https://learn.grafana.com/lab-synthetic-monitoring)
- [Sharing & Reporting](https://learn.grafana.com/lab-sharing-reporting-with-grafana)

### Outcome

#### Ability to

- Write efficient, production-grade queries
- Design high-signal dashboards
- Correlate traces, logs, and metrics deeply

---

## Phase 5 — Advanced (Platform / System Level)

### Objective

Operate and optimize observability at scale.

### Learning Path

- [Technical Practitioner 201 (16 courses)](https://learn.grafana.com/path/technical-practitioner-201)

### Advanced Topics

- End-to-end monitoring strategies
- Performance optimization
- Cross-signal correlation at scale

### Labs

- [Cost Effective Best Practices for Grafana Cloud](https://learn.grafana.com/lab-cost-effective-best-practices-for-grafana-cloud)
- [Synthetic Monitoring](https://learn.grafana.com/lab-synthetic-monitoring)

### Outcome

#### Ability to

- Optimize telemetry cost
- Design scalable observability systems
- Implement proactive monitoring

---

## Phase 6 — Expert (Architecture & Optimization)

### Objective

Design and govern observability platforms.

### Best Practice Guides

- [Alerting on High-Cardinality](https://learn.grafana.com/alerting-on-high-cardinality)
- [Loki Label Strategies](https://learn.grafana.com/loki-label-strategies)
- [Loki Log Optimizations](https://learn.grafana.com/loki-log-optimizations)
- [Anomaly Detection in PromQL](https://learn.grafana.com/anomaly-detection-in-promql)
- [Grafana Alloy Instrumentation Playbooks](https://learn.grafana.com/grafana-alloy-instrumentation-playbooks)
- [Grafana Application Observability Guide](https://learn.grafana.com/grafana-application-observability-guide)
- [Datasource Strategies](https://learn.grafana.com/datasource-strategies-and-best-practices)
- [Dashboarding Best Practices](https://learn.grafana.com/dashboarding-best-practices)

### Advanced Concepts

- Observability architecture
- Instrumentation standards
- Cost vs signal trade-offs

### Outcome

#### Ability to

- Define observability standards
- Optimize performance and cost
- Build enterprise-grade observability platforms

---

## Phase 7 — Validation & Certification

### Objective

Validate proficiency.

### Assessments

- [Technical Practitioner 101 Assessment](https://learn.grafana.com/technical-practitioner-101-assessment)
- [Technical Practitioner 201 Assessment](https://learn.grafana.com/technical-practitioner-201-assessment)

### Badges

- PromQL Navigator Badge
- LogQL Navigator Badge
- Observability Signals Badge
- Dashboard Design Badge

---

### Suggested Practical Track for Your Environment

Given your Azure + Grafana Cloud observability work:

1. Complete Phases 1–2 quickly.
2. Prioritize:
   - PromQL
   - LogQL
   - Alerting
   - LGTM correlation
3. Focus deeply on:
   - Grafana Alloy
   - Azure Container Apps telemetry
   - Azure Functions tracing
   - Cost optimization
   - Synthetic Monitoring
4. Move early into:
   - High-cardinality management
   - Dashboard standards
   - Multi-environment observability patterns
   - SLO/error-budget alerting

This aligns more closely with enterprise observability architecture work than the default learning
order.

---

## Related

- [[observability/11-visualization/01-dashboard-design/01-dashboard-design|Dashboard Design]] —
  internal deep-dive companion to the Phase 4 Dashboard Design & Visual Storytelling path and the
  Dashboard Design Badge
- [[prometheus/06-alerting/01-recording-rules/01-recording-rules|Recording Rules]] — internal
  deep-dive companion to the Phase 2 Recording Rules course
- [[prometheus/06-alerting/02-alerting-rules/02-alerting-rules|Alerting Rules]] — internal deep-dive
  companion to the Phase 2 Alerting Essentials / Basic Alerting Rules courses
