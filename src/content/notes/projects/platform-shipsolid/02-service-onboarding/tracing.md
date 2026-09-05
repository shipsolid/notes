---
title: "Tracing Contract"
description: "**Applies to:** Application teams implementing distributed tracing on the ShipSolid SRE Observability"
tags: ["ShipSolid", "Onboarding"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-9"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/traces-instrumentation-guide
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/logging
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/metrics
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema
    kind: related
---

## Tracing Contract

**Applies to:** Application teams implementing distributed tracing on the ShipSolid SRE
Observability platform.

## How Traces Reach Grafana Cloud

The `alloy-receiver` DaemonSet (one pod per node) listens for telemetry pushed by applications:

| Protocol  | Port   | Use When                                                     |
| --------- | ------ | ------------------------------------------------------------ |
| OTLP gRPC | `4317` | Default for most OpenTelemetry SDKs (lowest overhead)        |
| OTLP HTTP | `4318` | Browser apps, SDKs that prefer HTTP, or when gRPC is blocked |
| Zipkin    | `9411` | Legacy applications already using Zipkin                     |

The endpoint is the node's IP address — use the Kubernetes Downward API to inject `status.hostIP`
into your pod as an environment variable.

---

## Requirements

### 1. Use the OpenTelemetry SDK

All new applications must use the [OpenTelemetry SDK](https://opentelemetry.io/docs/). Do not
introduce new Zipkin or Jaeger instrumentation — those exist only for legacy compatibility.

### 2. Set Required Resource Attributes

Every application must configure the following OTel resource attributes. These are mandatory for
Grafana to correlate traces with logs and metrics:

| Attribute                | Description                  | Example                        |
| ------------------------ | ---------------------------- | ------------------------------ |
| `service.name`           | Unique name for this service | `mdixai-api`, `daia-processor` |
| `service.version`        | Deployed version             | `1.4.2`                        |
| `deployment.environment` | Deployment environment       | `dev`, `qa`, `train`, `prod`   |

> **Important:** `service.name` must be consistent across all telemetry signals from the same
> service. The same value must appear in your structured logs as the `service` field.

### 3. Use Semantic Conventions for Span Names

Follow [OTel Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/). Span names must be
human-readable and templated (not contain raw IDs or values).

```
# Good
GET /orders/{order_id}
db.query orders SELECT
messaging.receive order-events

# Bad
GET /orders/98765          (contains raw value — creates high-cardinality traces)
query                      (too vague)
DoSomethingImportant       (internal code name, not meaningful)
```

### 4. Propagate Context Across Service Boundaries

Use the W3C TraceContext propagation format (`traceparent` header). This is the default in all
OpenTelemetry SDKs. Do not use Zipkin B3 headers for new services.

### 5. No Sensitive Data in Span Attributes

Do not set span attributes containing passwords, tokens, PII, or full request/response bodies. Query
parameters containing sensitive data must be redacted before adding to a span.

---

## Endpoint Configuration

Inject the node IP via the Kubernetes Downward API in your pod spec:

```yaml
env:
  - name: NODE_IP
    valueFrom:
      fieldRef:
        fieldPath: status.hostIP
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://$(NODE_IP):4318"          # OTLP HTTP
  # Or for gRPC:
  # value: "http://$(NODE_IP):4317"
```

---

## Python Implementation

### Recommended: OpenTelemetry SDK + Auto-Instrumentation

```bash
pip install \
  opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-grpc \
  opentelemetry-instrumentation-fastapi \
  opentelemetry-instrumentation-httpx \
  opentelemetry-instrumentation-sqlalchemy
```

```python
import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

def configure_tracing(service_name: str, service_version: str, environment: str) -> None:
    resource = Resource.create({
        "service.name": service_name,
        "service.version": service_version,
        "deployment.environment": environment,
    })

    node_ip = os.environ.get("NODE_IP", "localhost")
    exporter = OTLPSpanExporter(
        endpoint=f"http://{node_ip}:4317",
        insecure=True,
    )

    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

# Call once at startup
configure_tracing(
    service_name="mdixai-api",
    service_version=os.environ.get("APP_VERSION", "0.0.0"),
    environment=os.environ.get("DEPLOYMENT_ENVIRONMENT", "dev"),
)

# Auto-instrument libraries
FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()
SQLAlchemyInstrumentor().instrument(engine=engine)
```

**Manual spans for business operations:**

```python
tracer = trace.get_tracer("mdixai.orders")

async def process_order(order_id: str) -> None:
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)
        span.set_attribute("order.type", "standard")
        # ... business logic
```

### Correlating Traces with Logs

Inject the current trace and span ID into your structured logs:

```python
import logging
from opentelemetry import trace

class TraceContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        ctx = trace.get_current_span().get_span_context()
        if ctx.is_valid:
            record.trace_id = format(ctx.trace_id, "032x")
            record.span_id = format(ctx.span_id, "016x")
        else:
            record.trace_id = ""
            record.span_id = ""
        return True

logging.getLogger().addFilter(TraceContextFilter())
```

This enables the "Logs → Traces" correlation button in Grafana.

---

## .NET Implementation

### Recommended: OpenTelemetry .NET SDK

```bash
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
dotnet add package OpenTelemetry.Instrumentation.SqlClient
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol
```

**`Program.cs`:**

```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(
            serviceName: "mdixai-api",
            serviceVersion: Environment.GetEnvironmentVariable("APP_VERSION") ?? "0.0.0"
        )
        .AddAttributes(new Dictionary<string, object>
        {
            ["deployment.environment"] = Environment.GetEnvironmentVariable("DEPLOYMENT_ENVIRONMENT") ?? "dev"
        }))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation(options =>
        {
            options.RecordException = true;
        })
        .AddHttpClientInstrumentation()
        .AddSqlClientInstrumentation(options =>
        {
            options.SetDbStatementForText = true;  // Include query text in span (no sensitive data)
        })
        .AddOtlpExporter(otlp =>
        {
            var nodeIp = Environment.GetEnvironmentVariable("NODE_IP") ?? "localhost";
            otlp.Endpoint = new Uri($"http://{nodeIp}:4317");
        }));
```

**Manual spans:**

```csharp
private static readonly ActivitySource _tracer = new ActivitySource("ShipSolidFoods.MDIxAI");

public async Task ProcessOrderAsync(string orderId)
{
    using var activity = _tracer.StartActivity("ProcessOrder");
    activity?.SetTag("order.id", orderId);
    activity?.SetTag("order.type", "standard");

    // ... business logic
}
```

**Correlate traces with Serilog:**

```csharp
using Serilog.Context;

// In middleware or a filter:
using (LogContext.PushProperty("trace_id", Activity.Current?.TraceId.ToString()))
using (LogContext.PushProperty("span_id", Activity.Current?.SpanId.ToString()))
{
    await next(context);
}
```

---

## Validation Checklist

- [ ] `service.name`, `service.version`, and `deployment.environment` are set on the OTel resource
- [ ] `NODE_IP` is injected via the Downward API and used as the OTLP endpoint host
- [ ] OTLP exporter targets port `4317` (gRPC) or `4318` (HTTP) — not `9411` (Zipkin) for new
      services
- [ ] `service.name` matches the `service` field in structured logs
- [ ] Span names use templated routes, not raw IDs
- [ ] `trace_id` and `span_id` are injected into log records
- [ ] No passwords, tokens, or PII appear in span attributes
- [ ] W3C TraceContext (`traceparent`) is used for context propagation

---

## Related

- [[projects/platform-shipsolid/02-service-onboarding/traces-instrumentation-guide|Traces Instrumentation Guide]]
  — application-side code snippets implementing this contract.
- [[projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema|Naming & Label Schema]]
  — the canonical resource-attribute schema (`service.name`, `deployment.environment`, etc.) this
  contract relies on.
- [[projects/platform-shipsolid/02-service-onboarding/logging|Logging Contract]] and
  [[projects/platform-shipsolid/02-service-onboarding/metrics|Metrics Contract]] — the companion
  signal contracts every service must also satisfy.
