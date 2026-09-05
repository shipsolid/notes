---
title: "Data Engineering"
description: "A book-shaped table of contents for data engineering: foundations and lifecycle, data modeling, storage systems, ingestion and CDC, distributed processing (Spark/Flink), SQL mastery, workflow orchestration, data quality, platform and cloud architecture, pipeline observability, security and governance, performance engineering, system design, and MAANG interview preparation through capstone builds — cross-linking the existing observability book instead of duplicating it."
tags: ["data-engineering", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607150122-7"
noteType: moc
---

# Data Engineering

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to the concepts, designs, and platform notes that already exist elsewhere in
> this wiki instead of duplicating them. Unwritten chapters are listed as **Planned** rows, not
> empty files.

## Parts

### 00 — Foundations of Data Engineering

The mental models and vocabulary that frame everything else in this book — what data engineering
actually is, the end-to-end lifecycle data moves through, and the cross-cutting principles
(scalability, reliability, cost, security) every later Part assumes.

- [[01-what-is-data-engineering|1 — What is Data Engineering?]] — _(stub)_
- [[data-engineering/00-foundations-of-data-engineering/02-data-lifecycle/02-data-lifecycle|2 — Data Lifecycle]]
  — _(stub)_
- [[03-data-engineering-principles|3 — Data Engineering Principles]] — _(stub)_

### 01 — Data Modeling

How data is shaped for different consumption patterns — relational modeling for OLTP systems,
dimensional modeling for analytics, and event/temporal modeling for immutable, time-ordered data.
See also [[08-log-aggregation|Log Aggregation]] for the schema-on-read vs. schema-on-write tradeoff
applied to the logs-specific case.

- [[01-relational-data-modeling|1 — Relational Data Modeling]] — _(stub)_
- [[02-analytical-data-modeling|2 — Analytical Data Modeling]] — _(stub)_
- [[03-time-series-and-event-modeling|3 — Time-Series and Event Modeling]] — _(stub)_

### 02 — Storage Systems

The physical and logical layers data lives in — file formats, storage engines (row vs. column, LSM
tree vs. B+ tree), and the lake/warehouse/lakehouse architectures built on top of them.

- [[01-files-and-storage-formats|1 — Files and Storage Formats]] — _(stub)_ — the partitioning and
  bucketing covered here is distinct from the query-time fan-out sharding in
  [[08-query-sharding|Scatter-Gather & Sharding]]; this chapter is about how data sits on disk, not
  how a single query is split across workers.
- [[data-engineering/02-storage-systems/02-storage-engines/02-storage-engines|2 — Storage Engines]]
  — _(stub)_
- [[03-data-lake-warehouse-and-lakehouse|3 — Data Lake, Warehouse & Lakehouse]] — _(stub)_ — see
  [[11-observability-data-lake|Observability Data Lake]] for a worked cold/warm/hot tiering instance
  of this pattern.

### 03 — Data Ingestion

Getting data into the platform — batch loads, streaming ingestion, and change data capture as the
bridge between operational databases and analytical systems.

- [[01-batch-ingestion|1 — Batch Ingestion]] — _(stub)_
- [[02-streaming-ingestion|2 — Streaming Ingestion]] — _(stub)_ — see also
  [[04-distributed-message-queue|Distributed Message Queue]] for a full Kafka-like system design
  case study.
- [[03-change-data-capture|3 — Change Data Capture]] — _(stub)_ — see the
  [[14-outbox|Outbox Pattern]] for the standard mechanism that makes CDC emission reliable without
  dual writes.

### 04 — Distributed Data Processing

Compute over ingested data at scale — distributed systems fundamentals, Apache Spark in depth, batch
processing frameworks, and stream processing engines.

- [[01-distributed-computing-fundamentals|1 — Distributed Computing Fundamentals]] — _(stub)_
- [[02-apache-spark|2 — Apache Spark]] — _(stub)_
- [[03-batch-processing-frameworks|3 — Batch Processing Frameworks]] — _(stub)_
- [[04-stream-processing|4 — Stream Processing]] — _(stub)_ — see also
  [[05-stream-processing-system|Stream Processing System]] for a full Flink-like system design case
  study, and
  [[05-37-q12-answer-mixed-exactly-once-billing-tenant|Q12: Mixed Exactly-Once Billing Tenant]] for
  a worked exactly-once delivery scenario.

### 05 — SQL Mastery

The query layer every data engineer is judged on in interviews — foundational SQL, advanced
analytical SQL (windows, recursion), and how a query planner turns SQL into an execution plan.

- [[01-sql-foundations|1 — SQL Foundations]] — _(stub)_
- [[data-engineering/05-sql-mastery/02-advanced-sql/02-advanced-sql|2 — Advanced SQL]] — _(stub)_
- [[data-engineering/05-sql-mastery/03-query-optimization/03-query-optimization|3 — Query Optimization]]
  — _(stub)_

### 06 — Workflow Orchestration

Coordinating pipelines as dependency graphs — scheduling fundamentals, Apache Airflow in depth, and
the modern orchestrator landscape (Dagster, Prefect, Temporal).

- [[01-workflow-fundamentals|1 — Workflow Fundamentals]] — _(stub)_
- [[02-apache-airflow|2 — Apache Airflow]] — _(stub)_
- [[03-modern-orchestrators|3 — Modern Orchestrators]] — _(stub)_

### 07 — Data Quality

Trusting the data once it's moving — validation and assertion frameworks, testing pipelines like
software, and the metadata layer (catalog, lineage, schema registry) that makes data discoverable.

- [[01-data-validation|1 — Data Validation]] — _(stub)_
- [[02-data-testing|2 — Data Testing]] — _(stub)_
- [[03-metadata-management|3 — Metadata Management]] — _(stub)_

### 08 — Data Platform Architecture

Zooming out from individual pipelines to the platform that hosts them — architecture patterns (data
mesh vs. centralized), storage architecture, and compute architecture.

- [[01-building-a-data-platform|1 — Building a Data Platform]] — _(stub)_
- [[02-storage-architecture|2 — Storage Architecture]] — _(stub)_
- [[03-compute-architecture|3 — Compute Architecture]] — _(stub)_

### 09 — Cloud Data Engineering

The managed-service equivalents of every Part above, per hyperscaler — AWS, Azure, and Google
Cloud's respective data stacks.

- [[01-aws-data-stack|1 — AWS Data Stack]] — _(stub)_
- [[02-azure-data-stack|2 — Azure Data Stack]] — _(stub)_
- [[03-google-cloud-data-stack|3 — Google Cloud Data Stack]] — _(stub)_

### 10 — Observability for Data Pipelines

Applying observability practice to pipelines specifically — monitoring, alerting, and reliability
engineering for data systems. This is observability applied to datasets, not services; see
[[observability/readme|Observability]] for the systems-telemetry sense of the word and the
underlying metrics/logs/traces/SLO fundamentals this Part builds on.

- [[01-monitoring-pipelines|1 — Monitoring Pipelines]] — _(stub)_
- [[data-engineering/10-observability-for-data-pipelines/02-alerting/02-alerting|2 — Alerting]] —
  _(stub)_
- [[data-engineering/10-observability-for-data-pipelines/03-data-reliability/03-data-reliability|3 — Data Reliability]]
  — _(stub)_

### 11 — Security & Governance

Protecting and governing data at rest and in motion — IAM/RBAC/encryption fundamentals, governance
and compliance, and privacy engineering techniques (masking, anonymization, differential privacy).

- [[01-security-fundamentals|1 — Security Fundamentals]] — _(stub)_
- [[02-governance|2 — Governance]] — _(stub)_ — grounded in the `m-data-platform` charter's
  `schemas/`, `lineage/`, and `governance/` sub-areas in the parent monorepo.
- [[03-privacy-engineering|3 — Privacy Engineering]] — _(stub)_

### 12 — Performance Engineering

Making pipelines fast and cheap — performance optimization, cost optimization, and capacity
planning.

- [[data-engineering/12-performance-engineering/01-performance-optimization/01-performance-optimization|1 — Performance Optimization]]
  — _(stub)_
- [[data-engineering/12-performance-engineering/02-cost-optimization/02-cost-optimization|2 — Cost Optimization]]
  — _(stub)_
- [[data-engineering/12-performance-engineering/03-capacity-planning/03-capacity-planning|3 — Capacity Planning]]
  — _(stub)_

### 13 — Data Engineering System Design

Applying everything above to open-ended system design problems — batch and streaming system design,
lakehouse design, and ML data platform design (feature stores). Follows the same five-step format
used throughout [[system-design/readme|System Design]]: requirements, high-level design, deep dive,
self-observability, trade-offs at 10x scale.

- [[01-batch-processing-system-design|1 — Batch Processing System Design]] — _(stub)_
- [[02-streaming-system-design|2 — Streaming System Design]] — _(stub)_
- [[03-data-lakehouse-design|3 — Data Lakehouse Design]] — _(stub)_
- [[04-ml-data-platform-design|4 — ML Data Platform Design]] — _(stub)_

### 14 — MAANG Interview Preparation

Interview-specific drilling — SQL problems by difficulty, Spark interview questions, open-ended data
engineering system design interviews, and behavioral interviews framed around ownership and
reliability.

- [[01-sql-interview-problems|1 — SQL Interview Problems]] — _(stub)_
- [[02-spark-interview-questions|2 — Spark Interview Questions]] — _(stub)_
- [[03-data-engineering-system-design-interviews|3 — Data Engineering System Design Interviews]] —
  _(stub)_
- [[04-behavioral-interviews|4 — Behavioral Interviews]] — _(stub)_

### 15 — Capstone Projects

End-to-end builds that integrate the whole book — a full data platform, a streaming analytics
platform, a lakehouse on Kubernetes, and staff-level architecture case studies from Netflix, Uber,
Airbnb, LinkedIn, Meta, and Google.

- [[01-build-an-end-to-end-data-platform|1 — Build an End-to-End Data Platform]] — _(stub)_
- [[02-build-a-streaming-analytics-platform|2 — Build a Streaming Analytics Platform]] — _(stub)_
- [[03-build-a-lakehouse-on-kubernetes|3 — Build a Lakehouse on Kubernetes]] — _(stub)_
- [[04-staff-level-architecture-case-studies|4 — Staff-Level Architecture Case Studies]] — _(stub)_

### 16 — Appendices

Quick-reference material — cheat sheets, checklists, and comparison tables — for use alongside the
chapters above.

- [[01-data-engineering-cheat-sheets|1 — Data Engineering Cheat Sheets]] — _(stub)_
- [[data-engineering/16-appendices/02-sql-cheat-sheet/02-sql-cheat-sheet|2 — SQL Cheat Sheet]] —
  _(stub)_
- [[03-spark-optimization-checklist|3 — Spark Optimization Checklist]] — _(stub)_
- [[04-kafka-cheat-sheet|4 — Kafka Cheat Sheet]] — _(stub)_
- [[05-airflow-best-practices|5 — Airflow Best Practices]] — _(stub)_
- [[06-data-modeling-patterns|6 — Data Modeling Patterns]] — _(stub)_
- [[07-lakehouse-comparison|7 — Lakehouse Comparison (Delta vs Iceberg vs Hudi)]] — _(stub)_
- [[08-cloud-data-services-comparison|8 — Cloud Data Services Comparison (AWS vs Azure vs GCP)]] —
  _(stub)_
- [[data-engineering/16-appendices/09-common-interview-pitfalls/09-common-interview-pitfalls|9 — Common Interview Pitfalls]]
  — _(stub)_
- [[data-engineering/16-appendices/10-maang-interview-questions/10-maang-interview-questions|10 — 100 MAANG Data Engineering Interview Questions]]
  — _(stub)_

## Metadata

|        |                  |
| ------ | ---------------- |
| Author | Amit Singh       |
| Scope  | data-engineering |
