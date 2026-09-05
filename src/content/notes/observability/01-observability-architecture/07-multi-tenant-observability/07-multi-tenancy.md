---
title: "7 — Multi-Tenancy"
description: "Two separate guarantees hiding under one name — data isolation and performance fairness — and the tenant identification, quota enforcement, and selective backpressure that make both hold under shared infrastructure."
tags: ["observability", "multi-tenancy", "finops", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-12"
relations:
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-25-tenant-identification-and-routing
    kind: depends_on
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-21-rate-limiting-architecture
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-09-multi-tenancy
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-27-q2-answer-cardinality-storm-detection-mitigation
    kind: related
---

# 7 — Multi-Tenancy

"Multi-tenant" gets used as if it's one property. It's actually two, and conflating them hides real
gaps: **isolation** (tenant A can never see tenant B's data) and **fairness** (tenant A's traffic
spike can never degrade tenant B's experience). A platform can have airtight isolation and terrible
fairness, or vice versa — they fail independently, and get diagnosed and fixed differently.

---

## Tenant identification: stamped as early as possible

Every downstream partitioning decision — which tenant's storage this belongs to, which tenant's
quota this counts against, which tenant's query is allowed to read it — depends on a tenant
identifier being attached at the earliest possible point, usually at the ingestion edge before
[[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|the collector pipeline]]
does anything else. See [[05-25-tenant-identification-and-routing|Tenant Identification & Routing]]
for the concrete mechanics — header-based, mTLS-cert-based, or token-based identification, and how
routing keys off it once assigned. Get this wrong at the edge, and every guarantee downstream is
built on a value that was never reliably there.

---

## Isolation: a spectrum, not a binary

- **Logical isolation** — one shared binary, tenants isolated by the tenant ID as a partition key.
  [[mimir|Mimir]], [[loki|Loki]], and [[tempo|Tempo]] are all natively multi-tenant this way: cheap
  (one fleet serves everyone), but a bug in the isolation logic is a cross-tenant data leak, not a
  degraded-performance incident.
- **Physical isolation** — dedicated infrastructure per tenant (or per regulated tenant class).
  Expensive, but the isolation guarantee no longer depends on partitioning logic being bug-free —
  there's no shared process for a bug to leak across.

Most real platforms land somewhere on this spectrum deliberately: logical isolation as the default,
physical isolation reserved for tenants whose compliance requirements make a shared-process
guarantee insufficient regardless of how well-tested the partitioning logic is.

---

## Fairness: the noisy-neighbor problem

Logical isolation solves _visibility_ but does nothing about _impact_. One tenant's cardinality
mistake — see [[cardinality]] and [[05-label-schema-design]] — or traffic spike can exhaust shared
ingester memory or query concurrency, degrading every other tenant on the same infrastructure, even
though none of their data was ever exposed. This is a fairness failure wearing an isolation
incident's symptoms, and it needs a different fix.

**Quota enforcement** is that fix: per-tenant ceilings on ingest rate, active series, and query
concurrency, applied at the edge before one tenant's traffic can consume a shared resource pool
meant for everyone. This is the same rate-limiting mechanic
[[05-21-rate-limiting-architecture|Rate-Limiting Architecture]] covers in general, applied
per-tenant rather than globally — and [[05-backpressure]] applied _selectively_: the well-designed
response to a noisy tenant throttles that tenant specifically, not the whole platform, which is the
entire difference between a contained incident and a platform-wide outage caused by one tenant's
mistake. [[05-09-multi-tenancy|Pipeline Multi-Tenancy]] walks through this at the ingestion-pipeline
layer specifically.

---

## Why this matters for an Observability Architect

A platform that only tested isolation (can tenant A read tenant B's data — no) and never load-tested
fairness (can tenant A's mistake slow down tenant B's queries — untested) has a gap that won't show
up until a real tenant hits it in production, usually via a cardinality mistake nobody caught in
review. Reviewing multi-tenant readiness means testing both properties separately, with separate
scenarios — a permissions test for isolation, a noisy-neighbor load test for fairness — not assuming
one implies the other.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
