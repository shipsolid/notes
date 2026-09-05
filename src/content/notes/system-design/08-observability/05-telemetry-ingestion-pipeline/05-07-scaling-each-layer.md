---
title: "3.4 Scaling Each Layer"
description: "Scaling unit and trigger for every layer of the telemetry ingestion pipeline, from the ingestion gateway through to storage."
tags: ["system-design", "observability", "telemetry", "maang-prep", "scaling"]
hidden: false
zettelId: "202607161612"
relations:
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-04-layer-1-ingestion-frontier
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-05-layer-2-durable-buffer-kafka
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-06-layer-3-processing-enrichment
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-10-data-tiering-and-compaction
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-13-trade-offs-at-10x-scale
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — §3,
> [[05-01-telemetry-ingestion-pipeline#3.4 Scaling Each Layer|Deep Dives]] — this is §3.4.

## 3.4 Scaling Each Layer

| Layer                      | Scaling unit        | Scaling trigger                         | Notes                                                          |
| -------------------------- | ------------------- | --------------------------------------- | -------------------------------------------------------------- |
| Ingestion gateway          | Pod replicas (HPA)  | CPU > 70% OR active connections > 10K   | Stateless; L7 load balancer distributes                        |
| Kafka brokers              | Partition count     | Consumer lag growing + broker CPU > 80% | Increase partitions; re-assign partition leaders               |
| Metric processor           | Consumer group pods | Consumer lag > target (e.g., 60s worth) | Pods = partition count for maximum parallelism                 |
| Trace assembler            | Stateful shard pods | Memory > 70% OR assembly latency rising | Resharding is costly; over-provision or use consistent hashing |
| Log processor              | Consumer group pods | Consumer lag                            | Stateless; easy to scale                                       |
| Storage ([[mimir\|Mimir]]) | Ingester pods       | Series per ingester > target            | Cortex/Mimir uses ring-based consistent hashing for ingesters  |
