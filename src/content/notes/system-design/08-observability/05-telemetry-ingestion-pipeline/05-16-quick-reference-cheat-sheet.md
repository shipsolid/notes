---
title: "8. Quick-Reference Cheat Sheet"
description: "One-line answers for every load-bearing design decision in the telemetry ingestion pipeline — the last thing to review before an interview."
tags: ["system-design", "observability", "telemetry", "maang-prep", "cheat-sheet"]
hidden: false
zettelId: "202607161607"
relations:
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-04-layer-1-ingestion-frontier
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-05-layer-2-durable-buffer-kafka
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-06-layer-3-processing-enrichment
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-10-data-tiering-and-compaction
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-11-global-deployment-topology
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — this is §8
> of the full design, split into its own file so the root stays a table of contents.

## 8. Quick-Reference Cheat Sheet

```
Fan-in at scale          → stateless gateway + persistent gRPC connections + connection pooling
Backpressure             → gRPC RESOURCE_EXHAUSTED (429) → agent WAL absorbs burst
Burst absorption         → Kafka between gateway and processor; 2-4h retention
Cardinality enforcement  → approximate counting (HyperLogLog) at processor; reject early
Tail sampling            → hash-partition by trace_id in Kafka; assemble per-partition
Multi-tenancy            → enforce at: network / auth / gateway / processor / storage (all layers)
Deduplication            → at-least-once + TSDB fingerprint dedup (metrics), hash dedup (logs)
Out-of-order samples     → Mimir out-of-order ingestion window (up to 1h)
End-to-end SLO           → synthetic canary batch every 60s through the full pipeline
Self-observability       → consumer lag (Kafka) is the single most important operational metric
Delta vs cumulative      → enforce cumulative at agent SDK; deltaToCumulative processor = stateful + restarts cause counter resets
k8s enrichment           → enrich at agent (DaemonSet downward API); avoid per-span k8s API calls
Data tiering             → ingester (hot, 2h) → object store (cold) → compactor (merge + dedup RF=3 blocks)
Global topology          → regional writes + async replication → global query tier; never single global cluster at 10M agents
Kafka producer gotcha    → max.message.bytes=1MB default; split large trace batches at gateway before produce
```
