---
title: "Chapter 2 — Telemetry Pipelines"
description: "OpenTelemetry, OTLP, collectors, sampling, and aggregation as the pipeline that gets a signal from emission to storage without becoming the outage itself."
tags: ["system-design", "observability", "book"]
updated: 2026-07-18
hidden: false
zettelId: "202607181257-31"
relations:
  - slug: observability/06-opentelemetry/01-opentelemetry-architecture/01-opentelemetry-sdks-and-semantic-conventions
    kind: depends_on
  - slug: observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline
    kind: depends_on
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-19-head-vs-tail-sampling
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-01-telemetry-ingestion-pipeline
    kind: related
---

## Chapter 2 — Telemetry Pipelines

> Part 08 of the [[system-design/readme|System Design]] curriculum. Full treatment:
> [Instrumentation](../../../observability/README.md#01--instrumentation) and
> [Pipeline](../../../observability/README.md#02--pipeline) in the Observability book.

Getting a signal from emission to storage without the pipeline becoming the outage itself is a
layered problem: what the SDK does inside the application process, and what happens after in a
separate Collector process.

## Inside the process: OTel API vs. SDK

OpenTelemetry is a specification, not a backend — the API application code calls
(`tracer.start_span()`, `meter.create_counter()`), the SDK that implements it in-process (samplers,
processors, exporters), and OTLP as the wire format that gets telemetry out. The API/SDK split is
deliberate: if no SDK is registered, every API call is a documented no-op, so a library can ship
OTel instrumentation without forcing every consumer to take on tracing as a hard dependency.
Semantic conventions are the other half of interoperability — a shared, versioned attribute
vocabulary (`http.request.method`, `k8s.pod.name`) so two teams' telemetry can be queried the same
way instead of each inventing its own naming. Full treatment:
[[01-opentelemetry-sdks-and-semantic-conventions|OpenTelemetry SDKs & Semantic Conventions]].

## Outside the process: the Collector pipeline

A Collector pipeline is `Receiver → Processor → Processor → ... → Exporter`, and processor order is
load-bearing — a `filter` before `batch` drops records before they're bundled; the same filter after
`batch` has to inspect already-bundled batches instead. Most real deployments split the Collector
into two tiers: an **agent** tier (sidecar/DaemonSet, cheap local enrichment and batching) and a
**gateway** tier (centralized, where tail sampling and tenant-aware routing live, because both need
a wider view than one instance can see). Tail sampling in particular forces every span belonging to
one trace onto the same gateway instance — routed by `trace_id` hash rather than round-robin. Full
treatment:
[[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|OTel Collector Pipeline Design]].

## Sampling and aggregation

Capturing and storing a full trace for 100% of traffic is expensive enough that most systems sample.
Head-based sampling decides per-request before the outcome is known; tail-based sampling decides
after seeing the whole trace, which is exactly why it needs the gateway-tier "same trace, same
instance" routing above. See [[05-19-head-vs-tail-sampling|Head vs. Tail Sampling]] for that
trade-off worked through as a full design decision. A **connector** — a newer OTel construct — can
derive one signal from another inside the same pipeline (e.g. a spanmetrics connector emitting
request-rate/error-rate/duration metrics straight from the traces pipeline), without touching
application code at all.

## What this means for a system design interview

"We'll add OpenTelemetry" is not a complete answer — the interview-worthy version names the
agent/gateway topology, states what tail sampling costs (it needs the whole trace before deciding,
which forces trace-affinity routing), and is explicit about what the `batch` and `memory_limiter`
processors are protecting the pipeline against under load.

## Where to go deeper

- [[01-opentelemetry-sdks-and-semantic-conventions|OpenTelemetry SDKs & Semantic Conventions]]
- [[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|OTel Collector Pipeline Design]]
- [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — the full end-to-end case
  study, Chapter 5 of this Part

## Metadata

|        |               |
| ------ | ------------- |
| Author | Amit Singh    |
| Scope  | system-design |
