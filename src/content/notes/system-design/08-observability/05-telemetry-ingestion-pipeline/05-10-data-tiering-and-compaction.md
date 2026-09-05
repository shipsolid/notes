---
title: "3.7 Data Tiering and Compaction (Mimir/Thanos)"
description: "Data tiering and compaction in Mimir/Thanos — the ingester-to-object-store journey, compaction levels, vertical compaction/dedup, compaction storms, and the config knobs that control them."
tags: ["system-design", "observability", "telemetry", "maang-prep", "storage"]
hidden: false
zettelId: "202607161615"
relations:
  - slug: prometheus/07-production-prometheus/02-long-term-storage/02-long-term-storage
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-31-q6-answer-compactor-storm-diagnosis
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-07-scaling-each-layer
    kind: related
  - slug: observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb
    kind: related
  - slug: observability/reference/mimir
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — §3,
> [[05-01-telemetry-ingestion-pipeline#3.7 Data Tiering and Compaction (Mimir/Thanos)|Deep Dives]] —
> this is §3.7.

## 3.7 Data Tiering and Compaction (Mimir/Thanos)

This section is commonly missing from candidate answers. The architecture diagram shows
[[mimir|Mimir]] as a black box, but the ingester → blocks → object store journey matters for
durability, query latency, and cost.

```mermaid
flowchart TD
    PROC["Processor"] -->|write| ING["Mimir Ingester\nhot tier — in-memory block\nlast 2h"]
    ING -->|"flush every 2h"| OBJ[("Object Store\ncold tier\n/tenant_id/blocks/")]
    OBJ -.->|"async reads"| COMP["Compactor\nmerge overlapping ranges\ndeduplicate RF=3 replicas"]
    COMP -->|"compacted blocks"| OBJ

    QR["Querier"] -->|"recent 2h from memory"| ING
    QR --> SG["Store-gateway\nblock index from object store"]
    SG -->|"block reads"| OBJ
    ING & SG --> MERGE["Merge + sort results"]

    style PROC fill:#4a9eff,color:#fff
    style QR fill:#4a9eff,color:#fff
```

**Compaction levels:**

| Level | Time range | Produced from  | Purpose                           |
| ----- | ---------- | -------------- | --------------------------------- |
| L1    | 2h         | Ingester flush | Raw blocks; many small files      |
| L2    | 12h        | Compact L1 × 6 | Fewer files; faster range queries |
| L3    | 24h        | Compact L2 × 2 |                                   |
| L4    | 7d         | Compact L3 × 7 | Long-range scan efficiency        |

**Vertical compaction (deduplication):** With RF=3 ingesters, each series is written to three
ingesters simultaneously. After flush, the compactor deduplicates overlapping blocks by label
fingerprint + timestamp. Without vertical compaction, storage cost is 3×.

**Compaction storms:** When many tenants flush large volumes simultaneously, the compactor queue
backs up. Symptoms: query latency spikes as the store-gateway must scan un-compacted L1 blocks.
Mitigation: rate-limit ingester flushes per tenant, or run compactors per-tenant shard.

**Key config knobs to know:**

- `max-block-duration`: longer = fewer files per query; shorter = faster flush cycle (2h is the
  Mimir default)
- Compaction concurrency: limits CPU spike on the compactor
- Store-gateway lazy loading: don't load all block indices into memory at startup (critical at
  millions of blocks)
