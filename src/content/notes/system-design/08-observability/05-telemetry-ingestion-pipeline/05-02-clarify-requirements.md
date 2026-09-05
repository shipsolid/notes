---
title: "1. Clarify Requirements First"
description: "The first-5-minutes clarifying questions for the telemetry ingestion pipeline design — signal types, scale envelope, consistency/durability, multi-tenancy, and protocol — whose answers change the entire architecture."
tags: ["system-design", "observability", "telemetry", "maang-prep", "requirements"]
hidden: false
zettelId: "202607161600"
relations:
  - slug: observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy
    kind: related
  - slug: observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — this is §1
> of the full design, split into its own file so the root stays a table of contents.

## 1. Clarify Requirements First

The first 5 minutes of the interview is yours to steer. Ask these; the answers change the entire
architecture.

## Signal types

- Metrics only, or metrics + logs + traces (unified MELT pipeline)?
- Are traces sampled at [[05-19-head-vs-tail-sampling|head or tail]]?
  > This determines whether spans need to be held in memory for assembly.
- Any profiling signals (continuous profiling, eBPF)?

## Scale envelope

| Dimension              | Small (startup) | Mid (Netflix-class) | Large (hyper-scale) |
| ---------------------- | --------------- | ------------------- | ------------------- |
| Agent count            | ~1K             | ~100K               | ~10M+               |
| Metric series (active) | ~10M            | ~1B                 | ~100B+              |
| Ingest rate            | ~1M pts/sec     | ~500M pts/sec       | ~50B pts/sec        |
| Trace spans/sec        | ~100K           | ~10M                | ~1B                 |
| Log lines/sec          | ~1M             | ~500M               | ~50B                |

At MAANG interviews, assume Netflix/Google scale unless told otherwise.

## Consistency and durability

- Can we drop data during a rolling restart? (Usually: yes for metrics, no for billing traces.)
- What is the maximum acceptable ingestion lag before data lands queryable? (SLO: typically < 60s
  for metrics, < 5 min for traces.)
- [[05-22-retry-policies|Retry policy: at-least-once or exactly-once]]? Exactly-once is expensive —
  push back unless there is a billing requirement.

## Multi-tenancy

- Single tenant (internal platform) or multi-tenant SaaS?
- Per-tenant quota enforcement? Isolation at the storage layer or earlier?

## Protocol

- Must support OTLP? Prometheus remote-write? Both? Datadog agent wire format?
- Is the interviewer implying a greenfield (pick the best protocol) or a brownfield (must accept
  legacy agents)?
