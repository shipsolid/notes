---
title: "7. Component Map (What Exists in the Wild)"
description: "OSS and managed-SaaS options for every layer of the telemetry ingestion pipeline, mapped against ShipSolid's own production experience."
tags: ["system-design", "observability", "telemetry", "maang-prep", "component-map"]
hidden: false
zettelId: "202607161606"
relations:
  - slug: observability/reference/mimir
    kind: related
  - slug: observability/reference/loki
    kind: related
  - slug: observability/reference/tempo
    kind: related
  - slug: observability/reference/prometheus
    kind: related
  - slug: observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — this is §7
> of the full design, split into its own file so the root stays a table of contents.

## 7. Component Map (What Exists in the Wild)

| Layer             | OSS option                                                                                                             | Managed/SaaS option          | Your experience                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------- |
| Agent             | [[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline\|OTel Collector]], Grafana Alloy | Datadog Agent, New Relic     | Alloy at ShipSolid (production) |
| Ingestion gateway | OTel Collector (gateway mode)                                                                                          | Grafana Cloud ingest         | Alloy gateway mode              |
| Buffer            | Kafka (Apache), Pulsar, Kinesis                                                                                        | Confluent Cloud, MSK         | —                               |
| Metric processor  | OTel Collector processors                                                                                              | Custom Flink/Spark job       | Alloy pipelines                 |
| Trace processor   | OTel Collector (tail sampler)                                                                                          | Jaeger, Tempo with tail samp | Tempo at ShipSolid              |
| Metric store      | [[prometheus\|Prometheus]], [[mimir\|Mimir]], Thanos, Cortex                                                           | Grafana Cloud Mimir          | Mimir (production)              |
| Log store         | [[loki\|Loki]], Elasticsearch, ClickHouse                                                                              | Grafana Cloud Loki           | Loki (production)               |
| Trace store       | [[tempo\|Tempo]], Jaeger, Zipkin                                                                                       | Grafana Cloud Tempo          | Tempo (production)              |
