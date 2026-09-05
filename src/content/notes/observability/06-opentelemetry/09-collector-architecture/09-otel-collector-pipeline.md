---
title: "9 — OTel Collector Pipeline Design"
description: "Receivers, processors, and exporters chained into a pipeline; why a platform runs more than one; and the agent/gateway topology that tail sampling specifically forces on that design."
tags: ["observability", "pipeline", "opentelemetry", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-5"
relations:
  - slug: observability/06-opentelemetry/01-opentelemetry-architecture/01-opentelemetry-sdks-and-semantic-conventions
    kind: depends_on
  - slug: patterns/04-microservice-patterns/05-backpressure/05-backpressure
    kind: related
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: related
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
  - slug: observability/00-foundations-of-observability/02-pillars-of-observability/02-the-signals
    kind: related
---

# 9 — OTel Collector Pipeline Design

[[01-opentelemetry-sdks-and-semantic-conventions|The SDK chapter]] drew the line between what
happens inside the application process and what the **Collector** — a separate process — does with
telemetry after it leaves. This chapter is what happens inside that separate process: how a
receiver, a chain of processors, and an exporter compose into a pipeline, and why a real deployment
runs more than one.

---

## The three building blocks

```
Receiver → Processor → Processor → ... → Exporter
```

- **Receiver** — how telemetry gets _into_ the collector: an OTLP gRPC/HTTP listener (the common
  case, fed by application SDKs), a Prometheus-style scrape endpoint, a filelog receiver tailing
  container stdout, a hostmetrics receiver reading `/proc`. Each receiver is specific to a protocol
  and, usually, a signal type.
- **Processor** — transforms, filters, or enriches data already inside the pipeline, in order:
  - `batch` — groups individual spans/metrics/logs into fewer, larger export requests. This is
    almost always present and almost always last, because a processor that inspects or drops data
    should run _before_ batching, not after, or it's inspecting batches instead of records.
  - `memory_limiter` — the collector's own backpressure valve: sheds or refuses load before the
    process OOMs under a traffic spike, rather than crashing and dropping everything. This is
    [[05-backpressure]] applied to the collector itself, not just the services it observes.
  - `resource`/`attributes` — add, rename, or drop attributes in flight (e.g. stamping
    `k8s.pod.name` via the `k8sattributes` processor). This is where a [[05-label-schema-design]]
    naming mistake either gets fixed in transit or gets baked in — the last point where a fix
    doesn't require redeploying every instrumented service.
  - `filter` — drops telemetry matching a rule before it's exported at all, the mechanism behind
    most head-based sampling and noisy-signal suppression.
  - `tail_sampling` — the sampling _decision_ itself, made after seeing a request's full trace (see
    [[05-19-head-vs-tail-sampling|Head vs. Tail Sampling]] for head vs. tail as a design choice —
    this processor is what makes the tail option possible).
- **Exporter** — how telemetry gets _out_: OTLP to a backend ([[tempo|Tempo]], Mimir,
  [[loki|Loki]]), or OTLP to a second, downstream Collector — pipelines chain across processes just
  as easily as they chain within one.

---

## A pipeline is one ordered chain, per signal

A collector config declares pipelines under `service.pipelines.<traces|metrics|logs>`, each one an
explicit list: `receivers: [...]`, `processors: [...]`, `exporters: [...]`. Processor order inside
that list is not cosmetic — a `filter` before `batch` drops records before they're bundled; the same
`filter` after `batch` would have to inspect and partially rewrite batches instead, if it could even
run there at all. Most processors are explicitly documented as position-sensitive for exactly this
reason.

---

## Why one pipeline usually isn't enough

A single pipeline processes one signal type one way, for one destination. Real platforms need more
than one, for reasons that show up almost immediately at any scale:

- **Different destinations, same signal** — dual-writing traces to two backends during a migration,
  or splitting "hot" recent data to a fast store and a downsampled copy to cheap long-term storage.
- **Different tenants, different treatment** — a noisy tenant's pipeline can carry a stricter
  `filter`/rate-limit than everyone else's, without throttling tenants who didn't cause the problem
  — see [[05-21-rate-limiting-architecture|Rate-Limiting Architecture]].
- **Deriving a new signal from an existing one** — a **connector** (a newer OTel construct) can sit
  between two pipelines, so one pipeline's output becomes another's input inside the same process.
  The canonical example is a spanmetrics connector: it consumes the traces pipeline's spans and
  emits RED metrics (request rate, error rate, duration) derived from them — one signal type
  produced entirely from another, without touching application code. [[02-the-signals]] covers
  metrics and traces as separate signal types; a connector is the pipeline-level mechanism that
  turns one into the other after the fact.

---

## Topology: agent tier and gateway tier

Most production deployments split the Collector into two tiers rather than running one flat fleet:

```
Service pod ──► Agent collector (sidecar/DaemonSet)
                     │  resource enrichment, batching, minimal filtering
                     ▼
              Gateway collector (centralized tier)
                     │  tail sampling, tenant routing, heavy processing
                     ▼
                  Backend
```

The **agent** tier runs close to the workload (sidecar or per-node DaemonSet), keeping its job cheap
and local: attach `k8s.pod.name`-style Resource attributes while they're still available, batch, and
forward. The **gateway** tier is centralized and does the processing that genuinely needs a wider
view — most importantly, tail sampling, which can only decide "keep or drop this trace" after seeing
_every_ span of it. That forces a specific routing requirement: every span belonging to the same
`trace_id` has to land on the _same_ gateway instance, or the instance making the sampling decision
never sees the whole trace to decide on. This is usually solved with a load-balancing exporter at
the agent tier that routes by `trace_id` hash rather than round-robin — a direct, mechanical
consequence of [[03-cross-signal-correlation]]'s shared-identifier requirement, applied to the
pipeline itself rather than to storage or dashboards.

---

## Why this matters for an Observability Architect

Every processor added to every pipeline runs on the platform's full production volume, not a sample
— a processor that's cheap in isolation is not cheap multiplied across every span the fleet emits.
The same discipline [[05-label-schema-design]] applies to reviewing a metric's label _combination_
rather than each label alone applies here to reviewing a pipeline's full processor _chain_ rather
than each processor alone. And because the gateway tier is where tail sampling, tenant isolation,
and cross-cutting enrichment all live, it tends to become the platform's single most
failure-critical process — its own [[05-backpressure]] and retry behavior under load (see
[[05-22-retry-policies|Retry Policies]]) deserves the same production-readiness scrutiny as any
service it's observing, not less.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
