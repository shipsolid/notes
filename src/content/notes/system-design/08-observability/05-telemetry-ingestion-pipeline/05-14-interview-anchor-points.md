---
title: "6. Interview Anchor Points (What to Say Out Loud)"
description: "The sentences that signal principal-level thinking for the telemetry ingestion pipeline design — ready to say unprompted in an interview."
tags: ["system-design", "observability", "telemetry", "maang-prep", "interview-anchors"]
hidden: false
zettelId: "202607161605"
relations:
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-06-layer-3-processing-enrichment
    kind: related
  - slug: patterns/04-microservice-patterns/05-backpressure/05-backpressure
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-09-multi-tenancy
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-12-observability-of-the-pipeline
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-11-global-deployment-topology
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — this is §6
> of the full design, split into its own file so the root stays a table of contents.

## 6. Interview Anchor Points (What to Say Out Loud)

These are the sentences that signal principal-level thinking:

- "The cardinality problem is what kills most ingestion pipelines at scale. I'd enforce a budget at
  the processor layer using approximate counting, not exact, because exact counting at 1B series
  doesn't fit in memory."

- "[[05-backpressure|Backpressure]] is the contract between producers and consumers. If the gateway
  can't propagate 429 back to agents as a first-class signal, you'll eventually drop data silently
  instead of dropping it predictably. I'd surface this as a gRPC status code and make agents
  retry-aware."

- "Tail-based sampling solves the right problem but the span assembler is the hardest operational
  piece. I've seen teams underestimate the memory pressure when trace volumes spike during incidents
  — which is exactly when you most need tail sampling to work. Design the assembler with a hard
  memory cap and graceful degradation to head-based sampling."

- "[[05-09-multi-tenancy|Multi-tenancy]] isn't just namespacing in storage. It needs to be enforced
  at every layer from the network inbound to the storage write path, or one noisy tenant can take
  down the platform."

- "I'd make the pipeline observable from day one with an end-to-end trace of a synthetic batch — a
  [[05-12-observability-of-the-pipeline|canary payload]] that flows from the gateway through Kafka
  through the processor into storage every 60 seconds. If the synthetic trace doesn't show up
  queryable within the SLO window, page the on-call before any user notices."

- "[[05-06-layer-3-processing-enrichment|The delta-to-cumulative temporality mismatch]] is the
  silent killer in OTLP migrations. If agents send delta and storage expects cumulative, every
  counter is wrong. The fix looks simple — a `deltaToCumulative` processor — but it requires
  per-series state that doesn't survive restarts cleanly, which means counter resets appear in every
  dashboard after a deploy. My answer: enforce cumulative at the agent SDK level. One config flag
  eliminates a stateful component from the pipeline entirely."

- "I'd [[05-11-global-deployment-topology|deploy the pipeline regionally, not globally]]. At 10M
  agents across three continents, a single global cluster means 150ms write latency from EU agents
  plus a global failure domain. Regional writes with async replication to a global query tier gives
  you local write latency, regional fault isolation, and still allows cross-region dashboards. This
  is how Grafana Cloud is actually built."
