---
title: "1 — OpenTelemetry SDKs & Semantic Conventions"
description: "OpenTelemetry is a specification and an API/SDK, not a backend — the pieces that make it up, and the semantic-convention vocabulary that lets two unrelated teams' telemetry be queried the same way."
tags: ["observability", "instrumentation", "opentelemetry", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607161840"
relations:
  - slug: observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline
    kind: related
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: related
  - slug: observability/06-opentelemetry/04-auto-instrumentation/04-auto-vs-manual-instrumentation
    kind: related
  - slug: observability/06-opentelemetry/08-context-propagation/08-deadline-propagation
    kind: related
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
---

# 1 — OpenTelemetry SDKs & Semantic Conventions

The single most common confusion about OpenTelemetry is treating it as a backend, the way Prometheus
or Jaeger are. It isn't one. OTel is a vendor-neutral **specification** for how telemetry gets
created, shaped, and exported — the API application code calls, the SDK that implements that API,
and a shared attribute vocabulary — with the actual storage and querying left entirely to whatever
backend you export to ([[prometheus|Prometheus]]/Mimir for metrics, [[tempo|Tempo]]/Jaeger for
traces, [[loki|Loki]] for logs).

---

## The pieces, and where each one runs

```
Application code
      │
      ▼
  OTel API        ← what your code calls: tracer.start_span(), meter.create_counter()
      │
      ▼
  OTel SDK        ← the implementation: samplers, processors, exporters (runs in-process)
      │
      ▼
  OTLP export
      │
      ▼
OTel Collector    ← a separate process: receives, transforms, routes (out of scope here)
      │
      ▼
   Backend        ← Mimir / Tempo / Loki / vendor platform
```

This chapter is about the top two boxes — what happens inside the application process, before a
single byte leaves it. What the Collector does with that data next is a pipeline-design question,
covered in
[[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|OTel Collector Pipeline Design]].

**API vs. SDK** is a deliberate split, not an implementation detail: application code and
instrumented libraries depend only on the API. If no SDK is registered, every API call is a
documented no-op — a library can call `tracer.start_span()` unconditionally, and it costs nothing in
a process that never configured OpenTelemetry at all. This is why third-party libraries can ship
OTel instrumentation built in without forcing every consumer to take on tracing as a hard
dependency.

---

## The three signal APIs, and how they map to what you already know

| OTel API | Core type                                                     | Maps to                                                                    |
| -------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Tracing  | `Tracer` → `Span`                                             | [[09-trace-shape\|Trace]] — one span per unit of work                      |
| Metrics  | `Meter` → `Counter` / `Gauge` / `Histogram` / `UpDownCounter` | [[02-the-signals\|Metric]] — the instrument kind decides how it aggregates |
| Logging  | `Logger` → `LogRecord`                                        | [[02-the-signals\|Log]] — structured, with the same Resource attached      |

The instrument kind matters more than it looks: a `Counter` only ever goes up (requests served, so
it composes with a plain sum); a `Histogram` buckets observations so a percentile can be computed
correctly after merging across instances — see [[03-aggregation-composability]] for exactly why that
distinction exists and what breaks if you fake a percentile with a `Gauge` instead.

---

## Resource: identifying who is talking

Every span, metric, and log point gets stamped with a **Resource** — a fixed set of attributes
identifying the process/host/pod that produced it (`service.name`, `service.version`,
`k8s.pod.name`, `cloud.region`, ...), set once at SDK startup and attached to everything that SDK
emits. This is the attribute set every dashboard and alert filters or groups by, and it's the reason
`service.name` is the one label that's never optional — everything downstream (routing, dashboards,
cost attribution) assumes it's there and correctly set.

---

## Semantic conventions: a shared vocabulary, not a suggestion

Two services, two teams, both instrumenting an HTTP call. Without a shared standard, one emits
`http_method` and the other emits `httpVerb`, and no dashboard, alert, or vendor tool can query both
the same way. **Semantic conventions** are OTel's namespaced, versioned specification for exactly
this — `http.request.method`, `db.system.name`, `k8s.pod.name` — so that any two conformant
instrumentations produce attributes a query or a Grafana panel can rely on by name, regardless of
which team or which language wrote the code.

This is also the mechanism that makes [[05-label-schema-design|Label & Attribute Schema Design]]
tractable: semantic conventions cover the well-known dimensions (HTTP, database, messaging, k8s);
that chapter is about the naming discipline for everything semconv doesn't already define for you —
your own business/domain attributes.

Semantic conventions are versioned and evolve — an attribute can move from experimental to stable,
get renamed, or get deprecated between spec releases. Pinning a specific semconv version as a
platform baseline, and treating an upgrade as a deliberate, reviewed change rather than something
that happens silently on the next SDK bump, is a real governance decision — see
[[adr-pin-otel-semconv-126-shipsolid|ADR-006: Pin OpenTelemetry Semantic Conventions to a Platform Baseline]]
for what that looks like as an actual platform decision, not just a specification detail.

---

## Manual vs. automatic: who writes the spans

The SDK gives you the primitives; it doesn't decide whether a human writes `tracer.start_span(...)`
by hand or whether an auto-instrumentation agent generates it for you at the framework boundary.
That trade-off — and the eBPF and service-mesh alternatives that need no SDK in the application at
all — is its own chapter: [[04-auto-vs-manual-instrumentation|Auto vs. Manual Instrumentation]].

---

## Context propagation, briefly

Every span carries a `trace_id`/`span_id` pair that has to survive every hop across process
boundaries for a trace to hold together at all — the W3C Trace Context (`traceparent` header) is the
wire format OTel uses to carry it. This chapter's sibling note, [[08-deadline-propagation]], covers
the same propagation problem for a different value (a request's remaining time budget, not its
identity); [[03-cross-signal-correlation]] covers why that identity is what makes metrics, logs, and
traces usable together at all, rather than three siloed tools.

---

## What this looks like in a real service

SignalForge's [Instrumentation Reference](https://shipsolid.github.io/signal-forge/otel-patterns/) and
[OTel Signal Contracts](https://shipsolid.github.io/signal-forge/observability/otel-contracts/) document every instrumentation decision for a real (lab)
service end to end — Resource attributes, span naming, which attributes are custom vs.
semconv-standard.

---

## Why this matters for an Observability Architect

Semantic-convention discipline is what turns "everyone uses OpenTelemetry" into "every team's
telemetry is actually interoperable." Two teams can both be fully OTel-compliant and still produce
data a shared dashboard can't cleanly query, if one used a custom attribute where a semconv one
already existed. Reviewing a new service's instrumentation for semconv adherence — not just "does it
emit spans" — is what keeps the platform's tooling generic instead of accumulating a per-service
dashboard for every service that rolled its own attribute names.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
