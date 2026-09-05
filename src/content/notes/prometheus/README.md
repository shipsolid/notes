---
title: "Prometheus"
description: "A book-shaped table of contents for Prometheus: monitoring foundations through architecture, data model, instrumentation, service discovery, PromQL, alerting, production operation, PCA certification, and MAANG interview prep — cross-linking existing notes instead of duplicating them."
tags: ["prometheus", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607181229-46"
noteType: moc
---

# Prometheus

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to the concepts, designs, and platform notes that already exist elsewhere in
> this wiki instead of duplicating them. This book is intentionally deeper than the PCA syllabus —
> several Parts (production internals, PCA prep, MAANG interview banks) are scaffolded ahead of
> their source material and marked `(stub)` below; they'll fill in as that material gets written.

## Parts

### 00 — Monitoring Foundations

The vocabulary this whole book assumes: what a time series actually is, and where Prometheus sits
relative to the rest of the observability landscape.

- [[01-why-monitoring-exists|1 — Why Monitoring Exists]] — _(stub)_ — see
  [[01-what-observability-means|What Observability Actually Means]] and
  [[02-slos-and-error-budgets|SLOs & Error Budgets]] for the 3-pillars/SLI-SLO-SLA material this
  chapter would otherwise duplicate
- [[prometheus/00-monitoring-foundations/02-time-series-fundamentals/02-time-series-fundamentals|2 — Time Series Fundamentals]]
  — samples, labels, dimensions, and metadata as Prometheus's on-the-wire data model
- [[03-prometheus-in-the-observability-ecosystem|3 — Prometheus in the Observability Ecosystem]] —
  architecture flow, CNCF history, and where Mimir/Cortex/Thanos/VictoriaMetrics fit

### 01 — Prometheus Architecture

The server itself: how it's installed and run, why it pulls instead of accepting pushes, and how a
metric moves from a target to a dashboard.

- [[01-prometheus-components|1 — Prometheus Components]] — Server/TSDB/Scrape Manager/Rule Engine,
  plus real bare-metal, systemd, and Docker install steps
- [[02-pull-model-deep-dive|2 — Pull Model Deep Dive]] — why pull, the Pushgateway escape hatch for
  batch jobs; see [[03-push-vs-pull-ingestion|Push vs. Pull Ingestion]] for the general architecture
  treatment
- [[03-data-flow|3 — Data Flow]] — instrumentation through dashboards, tying every later Part
  together

### 02 — Prometheus Data Model

Counters, gauges, histograms, summaries, labels, and the on-disk storage engine underneath them.

- [[01-metrics-deep-dive|1 — Metrics Deep Dive]] — the four metric types via a real hands-on lab
  (this is the canonical home for this book's demo environment — other chapters link here rather
  than re-embedding it)
- [[02-labels-and-cardinality|2 — Labels and Cardinality]] — label mechanics, relabeling, and the
  storage/performance cost of cardinality; see [[cardinality|Cardinality]] and
  [[05-label-schema-design|Label & Attribute Schema Design]] for budget/governance depth
- [[03-tsdb-internals|3 — TSDB Internals]] — _(stub)_ — see
  [[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb|Metrics Storage (TSDB)]]
  for the WAL/compaction internals this chapter doesn't cover yet

### 03 — Instrumentation

Getting metrics out of a system in the first place — client libraries, exporters, and writing your
own instrumentation.

- [[01-client-libraries|1 — Client Libraries]] — _(stub)_
- [[02-exporters|2 — Exporters]] — Node Exporter and Windows Exporter install, plus Docker/cAdvisor
  container monitoring
- [[03-custom-instrumentation|3 — Custom Instrumentation]] — _(stub)_

### 04 — Service Discovery

Finding what to scrape without hand-maintaining a static target list.

- [[01-discovery-mechanisms|1 — Discovery Mechanisms]] — static configs, file-based SD, and DNS SD
- [[02-kubernetes-discovery|2 — Kubernetes Discovery]] — _(stub)_
- [[03-cloud-discovery|3 — Cloud Discovery]] — _(stub)_

### 05 — PromQL Masterclass

The query language in full — this Part is the deepest and most complete in the book.

- [[01-promql-fundamentals|1 — PromQL Fundamentals]] — data types, selectors, matchers, and running
  queries outside the Prometheus UI
- [[02-promql-functions|2 — PromQL Functions]] — the rate family, math/date-time/sorting functions,
  and `histogram_quantile()` mechanics
- [[03-aggregation-operators|3 — Aggregation Operators]] —
  `sum`/`avg`/`count`/`topk`/`bottomk`/`quantile`/`stddev`/`stdvar`, `by`/`without`
- [[04-vector-matching|4 — Vector Matching]] — `on`/`ignoring`, one-to-one vs. many-to-one, and
  operator precedence
- [[05-advanced-promql|5 — Advanced PromQL]] — offset/`@` modifiers, subqueries, and this book's
  canonical recording-rule syntax reference

### 06 — Alerting

Turning PromQL expressions into pages — recording rules, alert rules, and Alertmanager.

- [[01-recording-rules|1 — Recording Rules]] — why and when, cross-linking Advanced PromQL for the
  syntax itself
- [[02-alerting-rules|2 — Alerting Rules]] — the pending → firing lifecycle and a real templated
  alert
- [[03-alertmanager|3 — Alertmanager]] — `group_wait`/`group_interval`/ `repeat_interval` grouping
  and dedup mechanics; see [[01-alerting-and-routing|Alerting & Alert Routing]] for
  routing/escalation depth

### 07 — Production Prometheus

Running Prometheus past the point where one server on one disk is enough.

- [[01-scaling-prometheus|1 — Scaling Prometheus]] — _(stub)_
- [[02-long-term-storage|2 — Long-Term Storage]] — why Thanos/Cortex/Mimir/VictoriaMetrics exist;
  see [[mimir|Mimir]] and [[05-07-scaling-each-layer|Scaling Each Layer]]
- [[03-performance-tuning|3 — Performance Tuning]] — _(stub)_
- [[prometheus/07-production-prometheus/04-high-availability/04-high-availability|4 — High Availability]]
  — _(stub)_

### 08 — Operating Prometheus

Day-2 operations: Kubernetes deployment patterns, hardening, and troubleshooting.

- [[01-kubernetes-best-practices|1 — Kubernetes Best Practices]] — _(stub)_
- [[prometheus/08-operating-prometheus/02-security/02-security|2 — Security]] — a full TLS +
  basic-auth walkthrough (self-signed certs, `htpasswd`, `tls_server_config`)
- [[03-troubleshooting|3 — Troubleshooting]] — _(stub)_

### 09 — Prometheus Certified Associate (PCA)

Certification-specific prep, built on top of the material already covered above.

- [[01-pca-exam-objectives|1 — PCA Exam Objectives]] — _(stub)_
- [[02-hands-on-labs|2 — Hands-on Labs]] — an ordered lab path through this book's existing chapters
- [[03-practice-exams|3 — Practice Exams]] — _(stub)_

### 10 — MAANG Interview Preparation

System-design framing and the "why," not just the "how."

- [[01-prometheus-system-design|1 — Prometheus System Design]] — _(stub)_
- [[02-interview-questions|2 — Interview Questions]] — _(stub)_
- [[03-deep-dive-discussions|3 — Deep Dive Discussions]] — why pull instead of push, why not SQL
- [[04-real-production-architectures|4 — Real Production Architectures]] — _(stub)_

### 11 — Appendices

Quick-reference material distilled from the chapters above.

- [[prometheus/11-appendices/01-promql-cheat-sheet/01-promql-cheat-sheet|1 — PromQL Cheat Sheet]] —
  grouped CPU/memory/disk/network/swap/inode/TCP query reference
- [[02-recording-rule-cookbook|2 — Recording Rule Cookbook]] — _(stub — this book's only
  recording-rule worked examples already live in Advanced PromQL)_
- [[03-alert-rule-cookbook|3 — Alert Rule Cookbook]] — _(stub — only one worked alert example exists
  in this book so far)_
- [[04-exporter-catalog|4 — Exporter Catalog]] — Node/Windows Exporter metric lookup table
- [[05-prometheus-configuration-reference|5 — Prometheus Configuration Reference]] — field-by-field
  `prometheus.yml` reference
- [[06-common-anti-patterns|6 — Common Anti-Patterns]] — three traced-to-source mistakes:
  high-cardinality labels, metric-naming violations, misaligned histogram buckets
- [[07-pca-exam-cheat-sheet|7 — PCA Exam Cheat Sheet]] — _(stub)_
- [[prometheus/11-appendices/08-interview-cheat-sheet/08-interview-cheat-sheet|8 — Interview Cheat Sheet]]
  — _(stub)_

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
