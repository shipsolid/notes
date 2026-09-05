---
title: "Grafana Cloud"
description: "A book-shaped table of contents for Grafana Cloud: platform foundations through telemetry collection, Mimir/Loki/Tempo/Pyroscope, visualization, application observability, reliability tooling, developer experience, governance, and enterprise reference architectures — cross-linking existing notes instead of duplicating them."
tags: ["grafana-cloud", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607221744-54"
noteType: moc
---

## Grafana Cloud

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to Grafana product notes and this wiki's existing concept treatments — PromQL,
> Mimir, Loki, Tempo, cardinality, SLOs — instead of duplicating them. Chapters are numbered per
> Part and restart at 1 in every Part. Chapters not yet written are marked `— _(stub)_`.

## Parts

### 00 — Platform Foundations

The product surface every later Part assumes: what Grafana Cloud is versus OSS/Enterprise, how an
organization's stacks/users/RBAC are structured, and how to navigate the UI day to day.

- [[01-introduction-to-grafana-cloud|Chapter 1 — Introduction to Grafana Cloud]] — _(stub)_
- [[02-organizations-and-stack-management|Chapter 2 — Organizations & Stack Management]] — _(stub)_
- [[03-grafana-user-interface|Chapter 3 — Grafana User Interface]] — _(stub)_

### 01 — Telemetry Collection

How telemetry actually gets into Grafana Cloud. Alloy is genuinely new ground for this wiki — every
existing mention of it elsewhere is a passing reference, not a treatment — while the OpenTelemetry
data model itself is already covered in depth in
[Instrumentation](../observability/README.md#01--instrumentation).

- [[01-grafana-alloy|Chapter 1 — Grafana Alloy]] — _(stub)_
- [[02-opentelemetry-integration|Chapter 2 — OpenTelemetry Integration]] — _(stub)_ — see
  [[01-opentelemetry-sdks-and-semantic-conventions|OpenTelemetry SDKs & Semantic Conventions]] and
  [[04-auto-vs-manual-instrumentation|Auto vs. Manual Instrumentation]] for the vendor-neutral depth
  this chapter builds on
- [[03-integrations|Chapter 3 — Integrations]] — _(stub)_

### 02 — Metrics (Grafana Mimir)

Grafana Cloud's hosted metrics backend and the language for querying it. PromQL is already a full,
deep Part elsewhere in this wiki — this Part links into it rather than re-teaching the language, and
owns the Mimir-as-a-product and cost/cardinality layers instead.

- [[01-grafana-mimir|Chapter 1 — Grafana Mimir]] — _(stub)_ — see [[mimir|Mimir]] for the
  architecture, multi-tenancy, and limits already written up
- [[02-promql|Chapter 2 — PromQL]] — _(stub)_ — see
  [[prometheus/readme#05 — PromQL Masterclass|PromQL Masterclass]] for the full query-language
  treatment this chapter should not duplicate
- [[03-metrics-management|Chapter 3 — Metrics Management]] — _(stub)_ — see
  [[cardinality|Cardinality]] for the cardinality math and mitigation hierarchy

### 03 — Logs (Grafana Loki)

Grafana Cloud's log aggregation backend and its query language, building on the architecture already
written up in [[loki|Loki]].

- [[01-grafana-loki|Chapter 1 — Grafana Loki]] — _(stub)_ — see [[loki|Loki]] for the
  streams-not-documents model and ingestion-agent landscape
- [[02-logql|Chapter 2 — LogQL]] — _(stub)_
- [[03-log-management|Chapter 3 — Log Management]] — _(stub)_ — see
  [[08-log-aggregation|Log Aggregation]] for the vendor-neutral schema-on-read framing

### 04 — Traces & Continuous Profiling

Distributed tracing and continuous profiling as Grafana Cloud products, and the cross-signal
navigation that ties metrics, logs, traces, and profiles into one investigation flow.

- [[01-grafana-tempo|Chapter 1 — Grafana Tempo]] — _(stub)_ — see [[tempo|Tempo]] for the no-index
  architecture and a worked TraceQL example
- [[02-grafana-pyroscope|Chapter 2 — Grafana Pyroscope]] — _(stub)_ — see
  [[05-continuous-profiling|Continuous Profiling]] for the vendor-neutral concept this chapter adds
  the Pyroscope product layer to
- [[03-correlations|Chapter 3 — Correlations]] — _(stub)_

### 05 — Visualization & Alerting

The day-to-day surface for looking at and reacting to telemetry — dashboards, ad hoc exploration,
unified alerting, and sharing. Alerting concept and routing depth already lives in
[`observability/`](../observability/README.md#04--slos-alerting--incident-response); this Part owns
the Grafana-specific mechanics (contact points, notification policies, panel/variable design).

- [[01-dashboards|Chapter 1 — Dashboards]] — _(stub)_ — see [[01-dashboard-design|Dashboard Design]]
  for the vendor-neutral design principles this chapter adds Grafana panels/variables/provisioning
  to
- [[02-explore-and-drilldowns|Chapter 2 — Explore & Drilldowns]] — _(stub)_
- [[grafana-cloud/05-visualization-and-alerting/03-alerting/03-alerting|Chapter 3 — Alerting]] —
  _(stub)_ — see [[01-alerting-and-routing|Alerting & Alert Routing]] for the concept, and
  [[prometheus/readme#06 — Alerting|Alertmanager]] for the grouping/dedup mechanics unified alerting
  descends from
- [[04-reporting-and-sharing|Chapter 4 — Reporting & Sharing]] — _(stub)_

### 06 — Application Observability

Grafana Cloud's Application Performance Monitoring layer — automatic service discovery, RED metrics,
and the entity/service graph underneath it. Genuinely new product surface, not covered elsewhere in
this wiki.

- [[01-application-observability|Chapter 1 — Application Observability]] — _(stub)_
- [[02-entity-catalog|Chapter 2 — Entity Catalog]] — _(stub)_
- [[03-entity-graph|Chapter 3 — Entity Graph]] — _(stub)_
- [[04-service-graph|Chapter 4 — Service Graph]] — _(stub)_ — see
  [[observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend|Distributed Tracing Backend]]
  for the trace-assembly mechanics a service graph is built from

### 07 — Specialized Monitoring

Monitoring domains that each get their own dedicated Grafana Cloud product: Kubernetes, the browser,
synthetic checks, and load testing.

- [[01-kubernetes-monitoring|Chapter 1 — Kubernetes Monitoring]] — _(stub)_ — see
  [[kubernetes/readme#10 — Observability|Kubernetes → Observability]] for the cluster-native
  metrics/logging/tracing chapters this Part adds the Grafana Cloud product layer to (both currently
  stubs — there's no written depth to link into on either side yet)
- [[02-frontend-observability|Chapter 2 — Frontend Observability]] — _(stub)_
- [[03-synthetic-monitoring|Chapter 3 — Synthetic Monitoring]] — _(stub)_
- [[04-k6-performance-testing|Chapter 4 — k6 Performance Testing]] — _(stub)_

### 08 — Reliability Engineering

Grafana's SRE product suite — SLO tracking, incident management, on-call scheduling, and IRM —
layered on top of the SLI/SLO/error-budget theory already written up in
[`observability/`](../observability/README.md#04--slos-alerting--incident-response).

- [[01-grafana-slo|Chapter 1 — Grafana SLO]] — _(stub)_ — see
  [[02-slos-and-error-budgets|SLOs & Error Budgets]] for the SLI/SLO/error-budget/burn-rate concepts
  this chapter adds the Grafana Cloud SLO app to
- [[02-grafana-incident|Chapter 2 — Grafana Incident]] — _(stub)_
- [[03-grafana-oncall|Chapter 3 — Grafana OnCall]] — _(stub)_
- [[04-incident-response-and-management-irm|Chapter 4 — Incident Response & Management (IRM)]] —
  _(stub)_

### 09 — Developer Experience & Platform Engineering

Treating Grafana Cloud itself as code: the `gcx` CLI, the REST APIs underneath it, the Terraform
provider, and GitOps for dashboards/alerting. [[gcx|gcx]] already covers the CLI command surface and
token model in depth — this Part's GCX chapter should extend that note rather than restate it.

- [[01-gcx-cli|Chapter 1 — GCX CLI]] — _(stub)_ — see [[gcx|gcx]] for the full command-surface
  reference, OSS/Enterprise/Cloud/BYOC matrix, and token model already written up
- [[02-grafana-cloud-apis|Chapter 2 — Grafana Cloud APIs]] — _(stub)_
- [[03-terraform-provider|Chapter 3 — Terraform Provider]] — _(stub)_
- [[04-observability-driven-development|Chapter 4 — Observability as Code]] — _(stub)_ — see
  [[gcx|gcx]]'s Resource GitOps section and [[gitops|GitOps]] for the pattern this chapter applies
  to Grafana Cloud resources specifically

### 10 — Administration & Governance

The governance layer: security and access, cost control, agent fleet management, AI-assisted
operations, and the naming/folder standards that keep a shared Grafana Cloud org from decaying into
chaos.

- [[grafana-cloud/10-administration-and-governance/01-security/01-security|Chapter 1 — Security]] —
  _(stub)_
- [[02-billing-and-cost-management|Chapter 2 — Billing & Cost Management]] — _(stub)_ — see
  [[cardinality|Cardinality]] for the active-series/samples-per-second billing model already written
  up
- [[03-adaptive-telemetry|Chapter 3 — Adaptive Telemetry]] — _(stub)_ — see
  [[cardinality|Cardinality]] for the mitigation hierarchy (drop, aggregate, sample) Adaptive
  Telemetry automates
- [[04-fleet-management|Chapter 4 — Fleet Management]] — _(stub)_
- [[05-grafana-assistant|Chapter 5 — Grafana Assistant]] — _(stub)_ — see [[gcx|gcx]],
  [[grafana-skills|Grafana Skills]], and [[grafana-mcp|Grafana MCP]] for the three existing notes
  this chapter should tie together rather than duplicate
- [[grafana-cloud/10-administration-and-governance/06-platform-governance/06-platform-governance|Chapter 6 — Platform Governance]]
  — _(stub)_ — see
  [[observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy|Multi-tenancy]]
  for the isolation-vs-fairness framing underneath naming/folder/tenancy standards

### 11 — Enterprise Architectures

Full reference architectures for running Grafana Cloud alongside the major clouds and Kubernetes,
plus the production and troubleshooting playbooks a Principal/Staff candidate is expected to reason
from.

- [[01-azure-reference-architecture|Chapter 1 — Azure Reference Architecture]] — _(stub)_
- [[02-aws-reference-architecture|Chapter 2 — AWS Reference Architecture]] — _(stub)_
- [[grafana-cloud/11-enterprise-architectures/03-kubernetes-platform-architecture/03-kubernetes-platform-architecture|Chapter 3 — Kubernetes Platform Architecture]]
  — _(stub)_
- [[04-hybrid-and-multi-cloud|Chapter 4 — Hybrid & Multi-Cloud]] — _(stub)_
- [[05-production-best-practices|Chapter 5 — Production Best Practices]] — _(stub)_
- [[06-troubleshooting-playbook|Chapter 6 — Troubleshooting Playbook]] — _(stub)_

### 12 — Appendices

Quick-reference material — CLI/API/query-language cheat sheets, pattern catalogs, and
certification/interview prep — mirroring how [[prometheus/readme#11 — Appendices|prometheus/]]
represents its own appendices as a trailing Part rather than a separate construct.

- [[01-cli-and-utilities-reference|Chapter 1 — CLI & Utilities Reference]] — _(stub)_ — see
  [[gcx|gcx]] for the gcx portion of this table already written up
- [[02-query-language-cheat-sheets|Chapter 2 — Query Language Cheat Sheets]] — _(stub)_ — see
  [[prometheus/11-appendices/01-promql-cheat-sheet/01-promql-cheat-sheet|PromQL Cheat Sheet]] for
  the PromQL half of this table already written up
- [[03-grafana-cloud-apis-reference|Chapter 3 — Grafana Cloud APIs Reference]] — _(stub)_
- [[04-observability-patterns|Chapter 4 — Observability Patterns]] — _(stub)_
- [[05-reference-architectures|Chapter 5 — Reference Architectures]] — _(stub)_
- [[06-certification-and-interview-preparation|Chapter 6 — Certification & Interview Preparation]] —
  _(stub)_

## Metadata

|        |               |
| ------ | ------------- |
| Author | Amit Singh    |
| Scope  | grafana-cloud |
