---
title: "2. High-Level Architecture"
description: "The producers → ingestion gateway → Kafka → processors → storage diagram for the telemetry ingestion pipeline, plus the push-over-pull key insight to state early in the interview."
tags: ["system-design", "observability", "telemetry", "maang-prep", "architecture"]
hidden: false
zettelId: "202607161601"
relations:
  - slug: observability/01-observability-architecture/03-push-vs-pull-architectures/03-push-vs-pull-ingestion
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-24-telemetry-gateways
    kind: depends_on
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-04-layer-1-ingestion-frontier
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-05-layer-2-durable-buffer-kafka
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-06-layer-3-processing-enrichment
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — this is §2
> of the full design, split into its own file so the root stays a table of contents.

## 2. High-Level Architecture

```mermaid
flowchart TD
    subgraph Producers["Data Producers"]
        P["[ OTel SDK ] · [ Prometheus ] \n [ Fluent Bit ] · [ eBPF Agent ] \n [ StatsD ]"]
    end

    subgraph L1["Ingestion Frontier — Layer 1"]
        GW1["1️⃣ OTLP Gateway\n(gRPC / HTTP)"]
        GW2["2️⃣ RW Gateway\n(prom-rw)"]
        GW3["3️⃣ Syslog / HTTP\n(Gateway)"]
        AUTH["Auth · Rate-limit · Schema validation"]
    end

    subgraph L2["Durable Buffer — Layer 2"]
        KAFKA["Kafka / Pulsar / Kinesis\nmetrics-raw · logs-raw · traces-raw · per-tenant shards"]
    end

    subgraph L3["Processing / Enrichment — Layer 3"]
        MP["Metric Processor\n· relabeling \n· aggregation \n· cardinality enforcement"]
        LP["Log Processor\n· parsing \n· dedup \n· enrichment \n· schema coerce"]
        TP["Trace Processor\n· span assembly \n· tail sampling \n· service graph"]
    end

    MIMIR[("Mimir / Thanos\n(TSDB blocks)")]
    LOKI[("Loki\n(Log Store)")]
    TEMPO[("Tempo\n(Trace Store)")]

    P -->|"OTLP / gRPC"| GW1
    P -->|"Prometheus remote-write"| GW2
    P -->|"Syslog / HTTP"| GW3
    GW1 & GW2 & GW3 --> AUTH --> KAFKA
    KAFKA --> MP --> MIMIR
    KAFKA --> LP --> LOKI
    KAFKA --> TP --> TEMPO
```

1️⃣ [[05-24-telemetry-gateways#1. OTLP Gateway|OTLP Gateway]]

2️⃣ [[05-24-telemetry-gateways#2. Prometheus Remote Write Gateway|Prometheus Remote Write Gateway]]

3️⃣ [[05-24-telemetry-gateways#3. Syslog Gateway|Syslog Gateway]]

## Key insight to state early

"I'm designing for [[03-push-vs-pull-ingestion|push-based ingestion rather than pull]], because at
10M agents, a central scraper creates a fan-out coordination problem. Agents push over
[[02-otlp-protocol|OTLP]]/gRPC. The gateway is stateless and scales horizontally. The buffer (Kafka)
decouples ingestion rate from processing rate."
