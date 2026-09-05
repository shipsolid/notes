---
title: "4. Observability of the Pipeline Itself"
description: "What to instrument at every layer of the telemetry ingestion pipeline, the pipeline's own SLOs, distributed tracing of the pipeline itself, and the synthetic canary that catches stalls no component metric surfaces."
tags: ["system-design", "observability", "telemetry", "maang-prep", "slo"]
hidden: false
zettelId: "202607161603"
relations:
  - slug: observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets
    kind: related
  - slug: observability/01-observability-architecture/08-high-availability-architecture/08-self-observability
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-05-layer-2-durable-buffer-kafka
    kind: related
  - slug: observability/12-alert-engineering/01-alert-philosophy/01-alerting-and-routing
    kind: related
  - slug: system-design/08-observability/03-monitoring-at-scale/03-monitoring-at-scale
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — this is §4
> of the full design, split into its own file so the root stays a table of contents.

## 4. Observability of the Pipeline Itself

This is your unfair advantage. State this unprompted.

## What to instrument

**Gateway:**

- `telemetry_gateway_requests_total{protocol, signal_type, tenant, status_code}` — request rate by
  outcome
- `telemetry_gateway_request_duration_seconds` — p50/p95/p99 per protocol
- `telemetry_gateway_active_connections` — fan-in health
- `telemetry_gateway_backpressure_429_total` — upstream congestion signal

**Kafka:**

- [[05-05-layer-2-durable-buffer-kafka|Consumer group lag]] per topic+partition (the primary health
  signal)
- Producer send latency
- Broker disk utilization
- Under-replicated partitions (leading indicator of broker issues)

**Processors:**

- `telemetry_processor_spans_dropped_total{reason}` — sampling decisions
- `telemetry_processor_cardinality_limit_exceeded_total{tenant}` — tenant abuse
- `telemetry_processor_processing_latency_seconds` — pipeline throughput
- `telemetry_processor_kafka_consumer_lag` — restate lag at the processor level for easy alerting

**Storage:**

- Mimir/Loki write latency and error rate
- Active series per tenant
- Chunk compression ratio (degradation means label churn)
- WAL replay time (recovery latency signal)

## SLOs for the pipeline

| SLO                            | Objective | Measurement                                               |
| ------------------------------ | --------- | --------------------------------------------------------- |
| Ingestion success rate         | 99.9%     | `1 - (errors / total_requests)` at gateway                |
| End-to-end latency (metric)    | P99 < 60s | Time from agent send to Mimir queryable (timestamp delta) |
| End-to-end latency (trace)     | P99 < 5m  | Time from first span received to trace queryable in Tempo |
| Tail sampling decision latency | P99 < 30s | Time from root span arrival to sampling decision          |
| Cardinality budget breach rate | < 0.1%    | Tenants hitting cardinality limits per day                |

## Distributed tracing of the pipeline itself

Instrument the pipeline with OTel traces that follow a telemetry batch through each layer. A trace
that starts at the gateway and ends at the storage write gives you end-to-end visibility. At MAANG
scale, sample these at 1% (head-based is fine here — you're tracing the pipeline, not the business
traces).

## Synthetic canary — end-to-end SLO verification

The canary is the most important operational signal: it catches pipeline stalls that no individual
component metric will surface (e.g., a processor consuming from Kafka but writing to a dead Mimir
ingester). Run it as a sidecar or scheduled job in each region:

```python
# Canary pseudocode — one cycle every 60 seconds
canary_id = str(uuid4())
t0 = time.monotonic()

# 1. Emit a canary metric with a unique trace label
push_otlp_metric(
    name="telemetry_canary_probe",
    value=1,
    labels={"canary_id": canary_id, "region": REGION},
)

# 2. Poll query endpoint until the metric appears or SLO window expires
while time.monotonic() - t0 < SLO_WINDOW_SECONDS:
    result = query_mimir(f'telemetry_canary_probe{{canary_id="{canary_id}"}}')
    if result:
        latency = time.monotonic() - t0
        push_metric("telemetry_canary_e2e_latency_seconds", latency)
        break
    sleep(2)
else:
    fire_alert("TelemetryPipelineSLOBreach", region=REGION)
```

The canary exercises: gateway → Kafka produce → consumer lag → processor → Mimir write → Mimir query
path. It does **not** cover the agent-to-gateway path — test that separately with a synthetic agent.

Alert: `telemetry_canary_e2e_latency_seconds > 60` for 2 consecutive windows →
[[01-alerting-and-routing|page on-call]]. At MAANG scale, run one canary per region per signal type
(metrics / logs / traces).
