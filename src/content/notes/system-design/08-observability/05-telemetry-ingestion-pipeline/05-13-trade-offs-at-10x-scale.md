---
title: "5. Trade-offs at 10x Scale"
description: "The 'what would you do differently at 10x' trade-off questions for the telemetry ingestion pipeline: Kafka vs. direct write, trace-assembly sharding, schema-on-read vs. write, sampling strategy, protocol choice, and push vs. pull."
tags: ["system-design", "observability", "telemetry", "maang-prep", "trade-offs"]
hidden: false
zettelId: "202607161604"
relations:
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-19-head-vs-tail-sampling
    kind: related
  - slug: observability/01-observability-architecture/03-push-vs-pull-architectures/03-push-vs-pull-ingestion
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-05-layer-2-durable-buffer-kafka
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-06-layer-3-processing-enrichment
    kind: related
  - slug: networks/05-http-ecosystem/05-grpc/05-grpc
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — this is §5
> of the full design, split into its own file so the root stays a table of contents.

## 5. Trade-offs at 10x Scale

These are the "what would you do differently" questions the interviewer will ask.

## Kafka vs. direct write to storage

| Option       | Pros                                                             | Cons                                                                      |
| ------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Kafka buffer | Absorbs bursts; decouples ingestion from processing rate; replay | Extra hop adds latency; Kafka operational overhead; partition rebalancing |
| Direct write | Lower latency; simpler path; one less component                  | Processor must match ingest rate; burst causes write pressure on storage  |

**Answer:** Kafka at MAANG scale. Direct write only if latency SLO is < 5 seconds and burst ratio is
low (< 2x average). ShipSolid uses Alloy with WAL as the agent-side buffer, which shifts the
buffering left — but a central Kafka tier is still needed between Alloy and Mimir at 10x scale.

## Horizontal sharding vs. vertical scaling for trace assembly

Trace assembly is inherently stateful (all spans of a trace must land on the same node). Two
approaches:

- **Consistent hashing ring** (Cortex/Mimir style): each trace_id maps to a node via the ring.
  Adding nodes triggers rebalancing. Fast at steady state; painful during scale events.
- **Kafka partitioning as the coordinator**: partition by `hash(trace_id) % N` in Kafka. Processors
  are pinned to partitions. Scale by adding partitions + processors. Rebalancing is a Kafka
  partition reassignment, which Kafka handles well.

**Answer:** Kafka-partitioned approach is operationally simpler at scale. The trade-off is that
increasing partition count causes a brief lag spike during reassignment.

## Schema-on-read vs. schema-on-write for logs

| Option          | Write cost | Query cost | Flexibility                         | When to use                               |
| --------------- | ---------- | ---------- | ----------------------------------- | ----------------------------------------- |
| Schema-on-read  | Low        | High       | Very high (log structure evolves)   | Loki model; default for greenfield        |
| Schema-on-write | High       | Low        | Low (schema changes need migration) | When query latency SLO < 1s on full scans |

**Answer:** Schema-on-read (Loki model) for the majority. Add a schema-on-write fast path for
high-frequency structured logs from a small set of known services (e.g., access logs, audit logs).

## [[05-19-head-vs-tail-sampling|Head-based vs. tail-based sampling]]

| Option     | Pros                                          | Cons                                                          |
| ---------- | --------------------------------------------- | ------------------------------------------------------------- |
| Head-based | Simple; no span buffering needed; low latency | Blind to outcomes; can't bias toward error/slow traces        |
| Tail-based | Intelligent; always captures anomalies        | Requires span buffering (memory/storage); assembly complexity |

**Answer:** Tail-based for business-critical services. Head-based (at high rate, e.g., 10%) for
internal infrastructure services where you mostly care about aggregate rates. Never both at the same
layer — it multiplies complexity.

## OTLP gRPC vs. Prometheus remote-write

| Protocol                | Strengths                                                        | Weaknesses                                                        |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| OTLP gRPC               | Binary efficient; HTTP/2 multiplexed; supports all signal types  | Newer; not all agents support it                                  |
| Prometheus remote-write | Ubiquitous; proven at scale; good library support                | Metrics only; snappy+protobuf but no HTTP/2 multiplexing natively |
| OTLP HTTP               | Works through proxies that block gRPC; easier firewall traversal | Less efficient than gRPC                                          |

**Answer:** OTLP [[networks/05-http-ecosystem/05-grpc/05-grpc|gRPC]] as the primary protocol for new
deployments. Prometheus remote-write as a compatibility shim for existing agents. Never negotiate
down to HTTP/1.1 + JSON for high-volume paths — the serialization overhead is prohibitive.

## Push vs. Pull (for metrics)

| Model                      | Pros                                                                                 | Cons                                                                                                                                             | When to choose                                     |
| -------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Pull (Prometheus scrape)   | Service discovery driven; exporter is simple; central control of scrape interval     | Central scraper must reach every target; N targets × scrape interval = N HTTP calls; doesn't scale past ~500K targets without shard coordination | Monolith / VM era; when teams own the collector    |
| Push (OTLP / remote-write) | Agent controls send rate; works through NAT and firewall; no central fan-out problem | Agent must be configured with endpoint; agent failure = data loss unless WAL mitigates                                                           | Microservices at scale; multi-cloud / multi-region |

At 100K+ services, pull-based scraping requires a distributed scraper fleet with shard assignment
and leader election (Prometheus sharding, Alloy cluster mode). Beyond ~500K targets the coordination
overhead becomes the dominant problem. Netflix and Google use
[[03-push-vs-pull-ingestion|push-based pipelines]]. For brownfield Prometheus environments, the
answer is "accept remote-write as the push shim while migrating agents to OTLP."
