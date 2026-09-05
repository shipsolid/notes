---
title: "Observability Engineering"
description: "A book-shaped table of contents for observability engineering: foundations through architecture, metrics, logging, tracing, profiling, OpenTelemetry, instrumentation, Kubernetes/cloud, data platforms, visualization, alerting, SRE integration, cost, security, platform engineering, AI-driven operations, and MAANG interview preparation — cross-linking existing prometheus/grafana-cloud/kubernetes/sre/platform-engineering notes instead of duplicating them."
tags: ["observability", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607140325"
noteType: moc
---

# Observability Engineering

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to the concepts, designs, and platform notes that already exist elsewhere in
> this wiki instead of duplicating them. Unwritten chapters are listed as **Planned** rows, not
> empty files.

## Parts

### 00 — Foundations of Observability

The mental models that separate observability from monitoring: control theory, the signal types
available, the lifecycle a signal travels through, and the maturity stages a team or platform
progresses through.

- [[01-what-observability-means|1 — What Observability Actually Means]]
- [[02-the-signals|2 — The Signals]]
- [[03-telemetry-lifecycle|3 — Telemetry Lifecycle]] — _(stub)_
- [[04-observability-maturity-model|4 — Observability Maturity Model]]

### 01 — Observability Architecture

The platform-level architectural decisions that shape everything downstream — how data flows in,
where control decisions live, and how the platform stays available and fair across tenants.

- [[01-designing-an-observability-platform|1 — Designing An Observability Platform]] — _(stub)_
- [[02-data-plane-vs-control-plane|2 — Data Plane vs Control Plane]] — _(stub)_
- [[03-push-vs-pull-ingestion|3 — Push-Based vs Pull-Based Ingestion]]
- [[04-agent-based-vs-agentless-collection|4 — Agent Based vs Agentless Collection]] — _(stub)_
- [[05-edge-aggregation|5 — Edge Aggregation]] — _(stub)_
- [[06-centralized-vs-federated-observability|6 — Centralized vs Federated Observability]] —
  _(stub)_
- [[observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy|7 — Multi-Tenancy]]
- [[08-self-observability|8 — Self-Observability]]

### 02 — Metrics Engineering

The time-series data model in depth — types, histograms, cardinality, storage engines, and query
performance. See also the dedicated [[prometheus/readme|Prometheus]] book for full PromQL and
production-operations depth.

- [[observability/02-metrics-engineering/01-time-series-fundamentals/01-time-series-fundamentals|1 — Time Series Fundamentals]]
  — _(stub)_
- [[02-metric-types|2 — Metric Types]] — _(stub)_
- [[03-aggregation-composability|3 — Aggregation Composability — Why You Can't Average Percentiles]]
- [[04-cardinality-management|4 — Cardinality Management]] — _(stub)_
- [[05-label-schema-design|5 — Label & Attribute Schema Design]]
- [[06-observability-recording-rules|6 — Recording Rules]] — _(stub)_
- [[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb|7 — Metrics Storage (TSDB)]]
- [[08-query-sharding|8 — Query Sharding]]

### 03 — Logging Engineering

Structured logging, schema design, correlation, and the pipeline/cost/search concerns specific to
log data at scale.

- [[01-structured-logging|1 — Structured Logging]] — _(stub)_
- [[02-log-schemas|2 — Log Schemas]] — _(stub)_
- [[03-cross-signal-correlation|3 — Cross-Signal Correlation]]
- [[04-log-pipelines|4 — Log Pipelines]] — _(stub)_
- [[05-log-sampling|5 — Log Sampling]] — _(stub)_
- [[06-log-retention|6 — Log Retention]] — _(stub)_
- [[observability/03-logging-engineering/07-cost-optimization/07-cost-optimization|7 — Cost Optimization]]
  — _(stub)_
- [[08-log-aggregation|8 — Log Aggregation]]

### 04 — Distributed Tracing

Why tracing exists, how a trace is modeled and propagated, sampling-strategy tradeoffs, and how
stored traces support service-graph and critical-path analysis. See also [[tempo|Tempo]] and
[[jaeger|Jaeger]] for backend-specific detail.

- [[01-why-tracing-exists|1 — Why Tracing Exists]] — _(stub)_
- [[02-trace-context|2 — Trace Context]] — _(stub)_
- [[03-span-modeling|3 — Span Modeling]] — _(stub)_
- [[observability/04-distributed-tracing/04-context-propagation/04-context-propagation|4 — Context Propagation]]
  — _(stub)_
- [[05-trace-sampling|5 — Trace Sampling]] — _(stub)_
- [[06-tail-sampling|6 — Tail Sampling]] — _(stub)_
- [[observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend|7 — Distributed Tracing Backend]]
- [[08-service-graphs|8 — Service Graphs]] — _(stub)_
- [[09-trace-shape|9 — Fan-Out Metrics and Trace Shape]]

### 05 — Continuous Profiling

Sampling-based CPU, memory, heap, and concurrency profiling, and what changes when profiling runs
continuously in production rather than on demand.

- [[observability/05-continuous-profiling/01-cpu-profiling/01-cpu-profiling|1 — CPU Profiling]] —
  _(stub)_
- [[observability/05-continuous-profiling/02-memory-profiling/02-memory-profiling|2 — Memory Profiling]]
  — _(stub)_
- [[03-heap-analysis|3 — Heap Analysis]] — _(stub)_
- [[04-goroutines-and-threads|4 — Goroutines and Threads]] — _(stub)_
- [[05-continuous-profiling|5 — Continuous Profiling]]

### 06 — OpenTelemetry

OpenTelemetry's architecture end to end — protocol, SDK internals, instrumentation strategy,
semantic conventions, and Collector pipeline design and scaling.

- [[01-opentelemetry-sdks-and-semantic-conventions|1 — OpenTelemetry SDKs & Semantic Conventions]]
- [[02-otlp-protocol|2 — OTLP Protocol]] — _(stub)_
- [[03-sdk-internals|3 — SDK Internals]] — _(stub)_
- [[04-auto-vs-manual-instrumentation|4 — Auto vs. Manual Instrumentation]]
- [[05-manual-instrumentation|5 — Manual Instrumentation]] — _(stub)_
- [[06-semantic-conventions|6 — Semantic Conventions]] — _(stub)_
- [[07-resources|7 — Resources]] — _(stub)_
- [[08-deadline-propagation|8 — Deadline Propagation]]
- [[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|9 — OTel Collector Pipeline Design]]
- [[10-collector-pipelines|10 — Collector Pipelines]] — _(stub)_
- [[11-processors|11 — Processors]] — _(stub)_
- [[12-otel-exporters|12 — Exporters]] — _(stub)_
- [[13-connectors|13 — Connectors]] — _(stub)_
- [[14-scaling-collectors|14 — Scaling Collectors]] — _(stub)_

### 07 — Instrumentation Patterns

A catalog of instrumentation approaches across common workload shapes — APIs, microservices,
messaging, data stores, Kubernetes, serverless, and batch/background work.

- [[01-instrumenting-web-apis|1 — Instrumenting Web APIs]] — _(stub)_
- [[observability/07-instrumentation-patterns/02-microservices/02-microservices|2 — Microservices]]
  — _(stub)_
- [[03-messaging-systems|3 — Messaging Systems]] — _(stub)_
- [[04-databases|4 — Databases]] — _(stub)_
- [[05-caches|5 — Caches]] — _(stub)_
- [[06-kubernetes-workloads|6 — Kubernetes Workloads]] — _(stub)_
- [[07-serverless|7 — Serverless]] — _(stub)_
- [[08-batch-jobs|8 — Batch Jobs]] — _(stub)_
- [[09-background-workers|9 — Background Workers]] — _(stub)_

### 08 — Kubernetes Observability

Kubernetes-native telemetry sources from control plane to container runtime, plus service-mesh and
eBPF-based collection. See also the [[kubernetes/readme|Kubernetes]] book's Observability Part for
kubectl-level operational detail.

- [[01-kubernetes-metrics|1 — Kubernetes Metrics]] — _(stub)_
- [[02-control-plane-monitoring|2 — Control Plane Monitoring]] — _(stub)_
- [[03-node-monitoring|3 — Node Monitoring]] — _(stub)_
- [[04-pod-monitoring|4 — Pod Monitoring]] — _(stub)_
- [[05-cluster-events|5 — Cluster Events]] — _(stub)_
- [[06-container-runtime|6 — Container Runtime]] — _(stub)_
- [[07-service-mesh-observability|7 — Service Mesh Observability]] — _(stub)_
- [[08-ebpf-based-observability|8 — eBPF Based Observability]] — _(stub)_

### 09 — Cloud Observability

Native telemetry surfaces across AWS, Azure, and Google Cloud, and the added complexity of hybrid
and multi-cloud environments.

- [[observability/09-cloud-observability/01-aws/01-aws|1 — AWS]] — _(stub)_
- [[observability/09-cloud-observability/02-azure/02-azure|2 — Azure]] — _(stub)_
- [[observability/09-cloud-observability/03-google-cloud/03-google-cloud|3 — Google Cloud]] —
  _(stub)_
- [[04-hybrid-cloud|4 — Hybrid Cloud]] — _(stub)_
- [[05-multi-cloud|5 — Multi Cloud]] — _(stub)_

### 10 — Observability Data Platforms

The storage backends underneath the signals covered elsewhere in this book — Prometheus/Mimir for
metrics, Loki for logs, Tempo for traces, Pyroscope for profiles, and the
Elasticsearch/ClickHouse/OpenSearch family for general-purpose event storage. See also
[[grafana-cloud/readme|grafana-cloud/README.md]] for Grafana Cloud-specific operational depth on
Mimir/Loki/Tempo/Pyroscope.

- [[01-prometheus-data-platform|1 — Prometheus]] — _(stub)_
- [[02-shards-workers|2 — Shards vs Workers]]
- [[03-loki-data-platform|3 — Loki]] — _(stub)_
- [[04-tempo-data-platform|4 — Tempo]] — _(stub)_
- [[05-pyroscope|5 — Pyroscope]] — _(stub)_
- [[06-elasticsearch|6 — Elasticsearch]] — _(stub)_
- [[07-clickhouse|7 — Clickhouse]] — _(stub)_
- [[08-opensearch|8 — Opensearch]] — _(stub)_

### 11 — Visualization

Dashboard design principles and the golden-signals/RED/USE framing that keeps a dashboard answering
real questions, across executive, engineering, and business-facing audiences.

- [[01-dashboard-design|1 — Dashboard Design]]
- [[02-tail-latency|2 — Tail Latency]]
- [[03-red-method|3 — RED Method]] — _(stub)_
- [[04-use-method|4 — USE Method]] — _(stub)_
- [[05-executive-dashboards|5 — Executive Dashboards]] — _(stub)_
- [[06-engineering-dashboards|6 — Engineering Dashboards]] — _(stub)_
- [[07-business-observability|7 — Business Observability]] — _(stub)_

### 12 — Alert Engineering

Alert design philosophy — symptom-based alerting, SLO-derived thresholds, deduplication and routing
— and the on-call practice built on top of it.

- [[01-alerting-and-routing|1 — Alerting & Alert Routing]]
- [[02-symptoms-vs-causes|2 — Symptoms vs Causes]] — _(stub)_
- [[03-slo-based-alerts|3 — Slo Based Alerts]] — _(stub)_
- [[04-multi-window-burn-rate-alerts|4 — Multi Window Burn Rate Alerts]] — _(stub)_
- [[05-alert-deduplication|5 — Alert Deduplication]] — _(stub)_
- [[observability/12-alert-engineering/06-routing/06-routing|6 — Routing]] — _(stub)_
- [[observability/12-alert-engineering/07-alert-fatigue/07-alert-fatigue|7 — Alert Fatigue]] —
  _(stub)_
- [[08-observability-on-call-engineering|8 — On Call Engineering]] — _(stub)_

### 13 — Reliability & SRE Integration

SLIs, SLOs, and error budgets as the reliability contract observability serves, plus the incident
detection, response, postmortem, and chaos-engineering practices built on that contract. See also
[[sre/readme|sre/README.md]] for the broader SRE discipline this integrates with.

- [[01-slis|1 — SLIs]] — _(stub)_
- [[02-slos-and-error-budgets|2 — SLOs & Error Budgets]]
- [[03-observability-error-budgets|3 — Error Budgets]] — _(stub)_
- [[04-incident-detection|4 — Incident Detection]] — _(stub)_
- [[05-partial-results-vs-fail-fast|5 — Partial Results vs Fail-Fast]]
- [[06-postmortems|6 — Postmortems]] — _(stub)_
- [[observability/13-reliability-and-sre-integration/07-chaos-engineering/07-chaos-engineering|7 — Chaos Engineering]]
  — _(stub)_

### 14 — Cost Engineering

The cost drivers behind an observability platform's bill, and the sampling, downsampling, retention,
compression, and tiering levers used to control it.

- [[01-cost-drivers|1 — Cost Drivers]] — _(stub)_
- [[02-telemetry-sampling|2 — Telemetry Sampling]] — _(stub)_
- [[03-downsampling|3 — Downsampling]] — _(stub)_
- [[04-retention-policies|4 — Retention Policies]] — _(stub)_
- [[observability/14-cost-engineering/05-compression/05-compression|5 — Compression]] — _(stub)_
- [[06-tiered-storage|6 — Tiered Storage]] — _(stub)_
- [[07-finops-for-observability|7 — FinOps for Observability]] — _(stub)_

### 15 — Security & Governance

Access control, tenancy isolation, and the privacy/compliance/secret-management obligations that
apply specifically to telemetry data.

- [[observability/15-security-and-governance/01-rbac/01-rbac|1 — RBAC]]
- [[observability/15-security-and-governance/02-multi-tenancy/02-multi-tenancy|2 — Multi Tenancy]]
- [[03-data-privacy|3 — Data Privacy]]
- [[04-pii-redaction|4 — PII Redaction]]
- [[05-security-and-compliance|5 — Security & Compliance]]
- [[06-audit-logging|6 — Audit Logging]]
- [[observability/15-security-and-governance/07-secret-management/07-secret-management|7 — Secret Management]]
- [[08-observability-as-policy|8 — Observability as Policy]]

### 16 — Observability Platform Engineering

Building observability as a self-service, paved-road capability on an internal developer platform —
pipelines, observability-as-code, GitOps, and platform APIs.

- [[01-building-a-platform-team|1 — Building a Platform Team]]
- [[02-driving-adoption|2 — Driving Adoption]]
- [[observability/16-observability-platform-engineering/03-telemetry-pipelines/03-telemetry-pipelines|3 — Telemetry Pipelines]]
  — _(stub)_
- [[04-observability-driven-development|4 — Observability-Driven Development]]
- [[05-observability-gitops|5 — GitOps]] — _(stub)_
- [[06-terraform|6 — Terraform]] — _(stub)_
- [[observability/16-observability-platform-engineering/07-platform-apis/07-platform-apis|7 — Platform APIs]]
  — _(stub)_
- [[08-multi-region-design|8 — Multi Region Design]] — _(stub)_
- [[09-policy-as-code|9 — Policy-as-Code Enforcement]]

### 17 — AI & Intelligent Observability

AIOps, automated root-cause analysis, anomaly and event correlation, and the emerging LLM-assisted
and autonomous-remediation layer — with an explicit read/write safety boundary.

- [[01-aiops-agentic-rca|1 — AIOps / Agentic RCA]]
- [[observability/17-ai-and-intelligent-observability/02-root-cause-analysis/02-root-cause-analysis|2 — Root Cause Analysis]]
  — _(stub)_
- [[03-anomaly-detection|3 — Anomaly Detection]] — _(stub)_
- [[04-event-correlation|4 — Event Correlation]] — _(stub)_
- [[05-predictive-alerting|5 — Predictive Alerting]] — _(stub)_
- [[06-llm-assisted-troubleshooting|6 — LLM Assisted Troubleshooting]] — _(stub)_
- [[07-autonomous-remediation|7 — Autonomous Remediation]] — _(stub)_

### 18 — Interview Preparation

A structured question bank for MAANG-level observability and SRE interviews — system design,
troubleshooting, and quantitative capacity-planning formats.

- [[01-observability-system-design-questions|1 — Observability System Design Questions]] — _(stub)_
- [[02-troubleshooting-case-studies|2 — Troubleshooting Case Studies]] — _(stub)_
- [[03-telemetry-design-exercises|3 — Telemetry Design Exercises]] — _(stub)_
- [[04-incident-walkthroughs|4 — Incident Walkthroughs]] — _(stub)_
- [[05-production-debugging|5 — Production Debugging]] — _(stub)_
- [[06-observability-capacity-planning|6 — Capacity Planning]] — _(stub)_
- [[07-scaling-to-millions-of-metrics|7 — Scaling to Millions of Metrics]] — _(stub)_
- [[08-whiteboard-architecture-problems|8 — Whiteboard Architecture Problems]] — _(stub)_
- [[observability/18-interview-preparation/09-maang-interview-questions/09-maang-interview-questions|9 — Maang Interview Questions]]
  — _(stub)_

### 19 — Real-World Case Studies

How major engineering organizations have approached observability at scale, drawn from their public
engineering writing, and the transferable lessons across them.

- [[01-uber|1 — Uber]] — _(stub)_
- [[02-google|2 — Google]] — _(stub)_
- [[03-meta|3 — Meta]] — _(stub)_
- [[04-netflix|4 — Netflix]] — _(stub)_
- [[05-amazon|5 — Amazon]] — _(stub)_
- [[06-microsoft|6 — Microsoft]] — _(stub)_
- [[07-cloud-native-cncf-projects|7 — Cloud Native CNCF Projects]] — _(stub)_
- [[08-case-study-reactive-resilient-autonomous|8 — Case Study: Reactive → Resilient → Autonomous]]

### 20 — Appendices

Quick-reference material — semantic conventions, query-language cheat sheets, and cost/readiness
checklists — for use alongside the chapters above.

- [[01-opentelemetry-semantic-conventions|1 — OpenTelemetry Semantic Conventions]] — _(stub)_
- [[observability/20-appendices/02-promql-cheat-sheet/02-promql-cheat-sheet|2 — Promql Cheat Sheet]]
  — _(stub)_
- [[03-logql-cheat-sheet|3 — Logql Cheat Sheet]] — _(stub)_
- [[04-traceql-cheat-sheet|4 — Traceql Cheat Sheet]] — _(stub)_
- [[05-otlp-reference|5 — OTLP Reference]] — _(stub)_
- [[06-kubernetes-telemetry-reference|6 — Kubernetes Telemetry Reference]] — _(stub)_
- [[07-observability-design-patterns|7 — Observability Design Patterns]] — _(stub)_
- [[08-observability-anti-patterns|8 — Common Anti Patterns]] — _(stub)_
- [[09-telemetry-cost-estimation|9 — Telemetry Cost Estimation]] — _(stub)_
- [[10-production-readiness-checklist|10 — Production Readiness Checklist]] — _(stub)_

## Metadata

|        |               |
| ------ | ------------- |
| Author | Amit Singh    |
| Scope  | observability |
