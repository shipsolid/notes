---
title: "3.5 Failure Modes and Mitigations"
description: "Failure modes and mitigations across the telemetry ingestion pipeline — gateway crashes, broker failure, processor crashes, span explosion, cardinality rejection, storage saturation, and clock skew."
tags: ["system-design", "observability", "telemetry", "maang-prep", "failure-modes"]
hidden: false
zettelId: "202607161613"
relations:
  - slug: patterns/04-microservice-patterns/08-retry-with-jitter/08-retry-with-jitter
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-04-layer-1-ingestion-frontier
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-05-layer-2-durable-buffer-kafka
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-06-layer-3-processing-enrichment
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-10-data-tiering-and-compaction
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — §3,
> [[05-01-telemetry-ingestion-pipeline#3.5 Failure Modes and Mitigations|Deep Dives]] — this is
> §3.5.

## 3.5 Failure Modes and Mitigations

| Failure                              | Impact                                 | Mitigation                                                                                                         |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Gateway pod crash                    | In-flight requests lost (small window) | Agents [[08-retry-with-jitter\|retry with backoff]]; gRPC deadline ensures fast failure; stateless so restart fast |
| Kafka broker failure                 | Partition leaders re-elected (10–30s)  | RF=3, unclean.leader.election=false; producers retry; consumer lag grows briefly                                   |
| Processor crash mid-batch            | Messages re-consumed from Kafka offset | At-least-once; downstream TSDB deduplicates                                                                        |
| Trace assembler OOM (span explosion) | Incomplete traces flushed or dropped   | Hard memory limit + backpressure to Kafka; alert on orphan span rate                                               |
| TSDB write rejection (cardinality)   | Metric data loss for offending tenant  | Cardinality check upstream (processor) to reject early; platform alert to tenant                                   |
| Storage tier full                    | Write rejection cascade                | Backpressure to Kafka → gateway 429 → agent backoff; auto-scale storage (object store)                             |
| Clock skew between agents            | Out-of-order samples rejected by TSDB  | Mimir/Prometheus accept samples up to 1h out of order with out-of-order ingestion enabled                          |
