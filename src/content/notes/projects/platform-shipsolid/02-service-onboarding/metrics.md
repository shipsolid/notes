---
title: "Metrics Contract"
description: "**Applies to:** Application teams exposing custom business or application metrics on the ShipSolid SRE"
tags: ["ShipSolid", "Onboarding"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-8"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/metrics-instrumentation-guide
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/logging
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/tracing
    kind: related
---

## Metrics Contract

**Applies to:** Application teams exposing custom business or application metrics on the ShipSolid
SRE Observability platform.

## How Metrics Reach Grafana Cloud

The platform supports two paths for application metrics:

| Path                            | When to Use                                                            | How                                                                     |
| ------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Annotation autodiscovery**    | Simplest option — no CRD required                                      | Add `k8s.grafana.com/scrape: "true"` annotation to your pod             |
| **ServiceMonitor / PodMonitor** | Fine-grained scrape configuration (custom port, path, interval, TLS)   | Create a `ServiceMonitor` or `PodMonitor` CRD in your namespace         |
| **OTLP push**                   | Apps that cannot expose a `/metrics` endpoint (serverless, batch jobs) | Push metrics to `alloy-receiver` on port `4318` (HTTP) or `4317` (gRPC) |

---

## Requirements

### 1. Expose a `/metrics` Endpoint

Your application must expose Prometheus-format metrics at `/metrics` on a stable HTTP port (default:
`9090` or alongside your app port).

### 2. Add the Scrape Annotation (Annotation Autodiscovery Path)

Add the following annotations to your pod spec:

```yaml
metadata:
  annotations:
    k8s.grafana.com/scrape: "true"
    k8s.grafana.com/metrics.portNumber: "9090"   # port your /metrics is on
    k8s.grafana.com/metrics.path: "/metrics"      # optional, default is /metrics
```

### 3. Metric Naming Conventions

Follow [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/) for metric
names. Use dot-separated names in OTLP; Prometheus format uses underscores.

| Signal Type           | OTLP Name                        | Prometheus Name                        |
| --------------------- | -------------------------------- | -------------------------------------- |
| HTTP request duration | `http.server.request.duration`   | `http_server_request_duration_seconds` |
| HTTP client call      | `http.client.request.duration`   | `http_client_request_duration_seconds` |
| DB query duration     | `db.client.operation.duration`   | `db_client_operation_duration_seconds` |
| Messaging sent        | `messaging.client.sent.messages` | `messaging_client_sent_messages_total` |

For custom business metrics, use a consistent prefix matching your service name:

```
# Good
mdixai_orders_processed_total
mdixai_order_processing_duration_seconds
mdixai_inventory_items_low_stock

# Bad
orders_total           (no service prefix — collides with other teams)
OrdersProcessed        (wrong case)
mdixai_orders         (ambiguous — counter or gauge?)
```

### 4. No High-Cardinality Labels

**Never** use values that are unbounded or unique-per-request as Prometheus labels:

```python
# BAD — blows up the cardinality
Counter("http_requests_total", labels=["url", "user_id", "request_id", "trace_id"])

# GOOD — bounded, meaningful dimensions
Counter("http_requests_total", labels=["method", "route", "status_code"])
```

Forbidden label values:

- User IDs, session IDs, request IDs, trace IDs
- Free-form URLs (use templated routes: `/orders/{id}` not `/orders/12345`)
- Timestamps or sequential numbers
- Any value with more than ~50 distinct values

> **Why:** Each unique label combination creates a new time series. 1,000 users × 50 routes × 10
> status codes = 500,000 series from a single metric. This causes cost overruns and query timeouts
> across the entire platform.

### 5. Use Appropriate Metric Types

| Type        | Use For                                                             |
| ----------- | ------------------------------------------------------------------- |
| `Counter`   | Things that only increase: requests, errors, bytes sent             |
| `Gauge`     | Values that go up and down: queue depth, active connections, memory |
| `Histogram` | Latency and size distributions (use for SLOs)                       |
| `Summary`   | Pre-calculated percentiles (avoid in favor of Histogram)            |

---

## Python Implementation

### Recommended: `prometheus-client`

```bash
pip install prometheus-client
```

```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Counters — always increasing
REQUEST_COUNT = Counter(
    "mdixai_http_requests_total",
    "Total HTTP requests",
    ["method", "route", "status_code"],
)

ERROR_COUNT = Counter(
    "mdixai_errors_total",
    "Total application errors",
    ["error_type"],
)

# Histograms — latency with SLO-aligned buckets
REQUEST_DURATION = Histogram(
    "mdixai_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "route"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# Gauges — current state
ACTIVE_CONNECTIONS = Gauge(
    "mdixai_active_connections",
    "Number of active database connections",
)

# Start the /metrics server (separate port)
start_http_server(9090)
```

**FastAPI integration:**

```python
from prometheus_client import make_asgi_app
from fastapi import FastAPI

app = FastAPI()
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

### OTLP Push (for apps without a scrape endpoint)

```bash
pip install opentelemetry-sdk opentelemetry-exporter-otlp-proto-http
```

```python
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.resources import Resource

resource = Resource.create({
    "service.name": "mdixai-batch-job",
    "service.version": "1.0.0",
    "deployment.environment": "prod",
})

exporter = OTLPMetricExporter(
    endpoint="http://<node-ip>:4318/v1/metrics",  # alloy-receiver on the same node
)

reader = PeriodicExportingMetricReader(exporter, export_interval_millis=30_000)
provider = MeterProvider(resource=resource, metric_readers=[reader])
metrics.set_meter_provider(provider)

meter = metrics.get_meter("mdixai-batch-job")
jobs_processed = meter.create_counter("mdixai.jobs.processed.total")
```

---

## .NET Implementation

### Recommended: `prometheus-net`

```bash
dotnet add package prometheus-net
dotnet add package prometheus-net.AspNetCore
```

```csharp
using Prometheus;

// In Program.cs
app.UseHttpMetrics(options =>
{
    options.AddCustomLabel("service", _ => "mdixai-api");
});
app.MapMetrics("/metrics");  // Exposes /metrics endpoint

// Custom metrics
private static readonly Counter OrdersProcessed = Metrics.CreateCounter(
    "mdixai_orders_processed_total",
    "Total orders processed",
    new CounterConfiguration
    {
        LabelNames = new[] { "status" }
    });

private static readonly Histogram OrderDuration = Metrics.CreateHistogram(
    "mdixai_order_processing_duration_seconds",
    "Order processing duration",
    new HistogramConfiguration
    {
        LabelNames = new[] { "order_type" },
        Buckets = Histogram.LinearBuckets(0.1, 0.1, 10)
    });

// Usage
OrdersProcessed.WithLabels("success").Inc();
using (OrderDuration.WithLabels("standard").NewTimer()) {
    await ProcessOrderAsync(order);
}
```

### OTLP Push (.NET)

```bash
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol
dotnet add package OpenTelemetry.Extensions.Hosting
```

```csharp
builder.Services.AddOpenTelemetry()
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddMeter("ShipSolidFoods.MDIxAI")
        .AddOtlpExporter(otlp =>
        {
            otlp.Endpoint = new Uri("http://<node-ip>:4318");
            otlp.Protocol = OtlpExportProtocol.HttpProtobinary;
        }));
```

---

## Validation Checklist

- [ ] `/metrics` endpoint is accessible and returns valid Prometheus text format
- [ ] Pod has `k8s.grafana.com/scrape: "true"` annotation (or a ServiceMonitor exists)
- [ ] Metric names are prefixed with the service name
- [ ] No label uses unbounded values (user IDs, request IDs, raw URLs)
- [ ] Counters use `_total` suffix
- [ ] Histograms use `_seconds` or `_bytes` suffix
- [ ] `deployment_environment` label is NOT manually added (platform injects it automatically)

---

## Related

- [[projects/platform-shipsolid/02-service-onboarding/metrics-instrumentation-guide|Metrics Instrumentation Guide]]
  — application-side code snippets implementing this contract.
- [[projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema|Naming & Label Schema]]
  — the canonical label schema this contract's metric labels must follow.
- [[projects/platform-shipsolid/02-service-onboarding/logging|Logging Contract]] and
  [[projects/platform-shipsolid/02-service-onboarding/tracing|Tracing Contract]] — the companion
  signal contracts every service must also satisfy.
