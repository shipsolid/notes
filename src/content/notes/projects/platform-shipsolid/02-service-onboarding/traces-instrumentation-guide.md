---
title: "Traces Instrumentation Guide"
description: "How to instrument a service for **distributed traces** on the ShipSolid observability platform (OTel"
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-20"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/sampling-policy
    kind: depends_on
  - slug: projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/signal-catalog
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/aks-helm-impl-guidelines
    kind: related
---

## Traces Instrumentation Guide

How to instrument a service for **distributed traces** on the ShipSolid observability platform (OTel
→ Alloy → Tempo).

---

## Standard

- OpenTelemetry tracing; propagate **W3C `traceparent`** across service boundaries.
- Export OTLP → Alloy DaemonSet → Tempo.
- Emit **exemplars** from latency histograms to enable metrics → traces drill-down.
- Sampling is governed centrally — see [[sampling-policy|Sampling Policy]]. Do not hard-code head
  sampling rates in the SDK without SRE review.

---

## OTLP Endpoint via Downward API

The Alloy DaemonSet receives OTLP on each node. Inject the node IP so the app reaches its local
sidecar without a service hop:

```yaml
# helm/templates/deployment.yaml
env:
  - name: NODE_IP
    valueFrom:
      fieldRef:
        fieldPath: status.hostIP
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://$(NODE_IP):4317"
  - name: OTEL_SERVICE_NAME
    value: "{{ .Values.service.name }}"
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: "deployment.environment={{ .Values.environment }},service.version={{ .Chart.AppVersion }}"
```

For ACA, point `OTEL_EXPORTER_OTLP_ENDPOINT` to the Alloy
[[patterns/09-cloud-native-patterns/01-sidecar/01-sidecar|sidecar]] at `http://127.0.0.1:4317`.

---

## Language Snippets

### .NET 8

```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSqlClientInstrumentation()
        .AddOtlpExporter());   // reads OTEL_EXPORTER_OTLP_ENDPOINT

// Propagation is W3C by default in the .NET OTel SDK — no extra config needed.
```

### Python

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.b3 import B3MultiFormat
# W3C is the default propagator; B3 only if interoperating with older services

provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
trace.set_tracer_provider(provider)
```

### Node.js

```js
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter()));
provider.register();   // W3C propagator registered by default
```

---

## W3C `traceparent` Propagation

Always pass the `traceparent` header on outbound HTTP calls. Most OTel auto- instrumentation
libraries inject it automatically. Verify end-to-end correlation in Tempo after deployment.

For message-queue producers/consumers (e.g. Service Bus, Kafka), inject the `traceparent` as a
message property and extract it on the consumer side via the messaging instrumentation library.

---

## Exemplars: Linking Metrics → Traces

Exemplars embed a `trace_id` + `span_id` inside a histogram bucket, enabling a direct jump from a
metric data point in Grafana to the matching Tempo trace.

### .NET 8

```csharp
// Exemplar recording is automatic when OTel metrics and tracing are both enabled
// and a span is active during the histogram observation.
```

### Python

```python
from opentelemetry import trace, metrics
from opentelemetry.sdk.metrics._internal.exemplar import AlwaysOnExemplarFilter

# Set exemplar filter to capture trace context inside histogram recordings
provider = MeterProvider(
    exemplar_filter=AlwaysOnExemplarFilter(),
    metric_readers=[reader],
)
```

Verify exemplars appear in Grafana by clicking a histogram data point in Explore and checking for
the "Query with exemplars" option.

---

## Sampling Policy

Tail-based sampling runs centrally in Alloy — the collector decides after seeing the full trace
whether to retain it. The SDK should export **all spans** (100% head sampling) unless explicitly
told otherwise by the SRE team for very high-volume services.

Do not set `OTEL_TRACES_SAMPLER=parentbased_traceidratio` or similar without first reviewing with
the SRE team; silent head-dropping causes gaps in traces that are invisible to the platform.

Current policy: [[sampling-policy|Sampling Policy]].

---

## Validation Checklist

- [ ] Traces appear in Grafana Tempo for your `service.name`
- [ ] `traceparent` is propagated through all outbound HTTP calls
- [ ] Log lines include `trace_id` and `span_id` when a span is active (correlation)
- [ ] Exemplars are visible on latency histograms in Grafana Explore
- [ ] Sampling is not hard-coded to a rate below 100% without SRE approval
- [ ] `deployment.environment` and `service.version` appear as resource attributes

---

## Related

- [[signal-catalog|Signal Catalog]]
- [[sampling-policy|Sampling Policy]]
- [[naming-and-label-schema|Naming & Label Schema]]
- [[aks-helm-impl-guidelines|AKS Helm Implementation Guidelines]]
