---
title: "Metrics Instrumentation Guide"
description: "How to instrument a service for **metrics** on the ShipSolid observability platform."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-15"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/aks-helm-impl-guidelines
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/signal-catalog
    kind: related
  - slug: projects/platform-shipsolid/07-cost-governance/cardinality-governance
    kind: related
---

## Metrics Instrumentation Guide

How to instrument a service for **metrics** on the ShipSolid observability platform. Full Helm chart
guidance: [[aks-helm-impl-guidelines|AKS Helm Implementation Guidelines]].

---

## Standard

- OpenTelemetry SDK or auto-instrumentation; export via OTLP to the Alloy DaemonSet.
- Use **histograms** for latency (not gauges); **counters** for rates.
- Apply standard resource attributes (see [[naming-and-label-schema|Naming & Label Schema]]).
- Never put unbounded values in labels — see cardinality rules below.

---

## Minimal Metric Set (Golden Signals)

```promql
# Counter — total requests; slice by route + status class
http_server_requests_total{service_name, http_route, http_status_class}

# Histogram — request latency; slice by route
http_server_request_duration_seconds_bucket{service_name, http_route}

# Gauge — active DB connections (bounded label only)
db_connections_active{service_name, db_name}
```

---

## AKS: Enable Metric Scraping via Pod Annotations

Add these annotations to your pod template in `helm/templates/deployment.yaml`:

```yaml
spec:
  template:
    metadata:
      annotations:
        k8s.grafana.com/scrape: "true"
        k8s.grafana.com/metrics.portNumber: "{{ .Values.metrics.port }}"
        k8s.grafana.com/metrics.path: "/metrics"
```

`values.yaml` default:

```yaml
metrics:
  port: 9090
```

If the app exposes metrics on the main app port (e.g. `8080`), override `metrics.port` accordingly.

---

## Required OTel Environment Variables

Inject via Helm so Alloy can correlate metrics with the correct service:

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

`values.yaml`:

```yaml
service:
  name: api-gateway
environment: dev   # override per env: dev, qa, prod
```

---

## Language Snippets

### .NET 8

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetry()
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddOtlpExporter());   // reads OTEL_EXPORTER_OTLP_ENDPOINT from env
```

### Python (opentelemetry-sdk)

```python
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader

exporter = OTLPMetricExporter()  # reads OTEL_EXPORTER_OTLP_ENDPOINT
reader = PeriodicExportingMetricReader(exporter, export_interval_millis=15_000)
provider = MeterProvider(metric_readers=[reader])
metrics.set_meter_provider(provider)

meter = metrics.get_meter("api-gateway")
request_counter = meter.create_counter("http_server_requests_total")
```

### Node.js

```js
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');

const provider = new MeterProvider();
provider.addMetricReader(new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter(),   // reads OTEL_EXPORTER_OTLP_ENDPOINT
  exportIntervalMillis: 15_000,
}));
```

---

## ServiceMonitor (Fine-Grained Scrape Control)

Use a `ServiceMonitor` instead of pod annotations when you need a custom scrape interval, TLS on the
metrics endpoint, or multiple endpoints per pod:

```yaml
# helm/templates/servicemonitor.yaml
{{- if .Values.metrics.serviceMonitor.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ .Chart.Name }}
  namespace: {{ .Release.Namespace }}
  labels:
    app.kubernetes.io/name: {{ .Chart.Name }}
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Chart.Name }}
  endpoints:
    - port: metrics
      path: /metrics
      interval: {{ .Values.metrics.serviceMonitor.interval | default "30s" }}
{{- end }}
```

`values.yaml`:

```yaml
metrics:
  serviceMonitor:
    enabled: false
    interval: 30s
```

---

## Cardinality Rules

High-churn values — request IDs, user IDs, raw timestamps — are an **automatic stop**. Push them to
logs/traces/exemplars. Run the **Cardinality Budget Calculator** skill before adding any label bound
for production.

Practical limits:

| Context | Max series per service            |
| ------- | --------------------------------- |
| `dev`   | 50k                               |
| `qa`    | 50k                               |
| `prod`  | 200k (platform-set ingest budget) |

---

## Helm Observability Checklist

- [ ] Pod annotations include `k8s.grafana.com/scrape: "true"` and correct port
- [ ] `NODE_IP` injected via Downward API
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES` set
- [ ] Standard labels on Deployment and pod template (see
      [[naming-and-label-schema|Naming & Label Schema]])
- [ ] `resources.requests` and `resources.limits` set on all containers
- [ ] ServiceMonitor enabled if fine-grained scrape control is needed
- [ ] Telemetry verified in Grafana before promoting from dev to prod

---

## Related

- [[naming-and-label-schema|Naming & Label Schema]]
- [[signal-catalog|Signal Catalog]]
- [[cardinality-governance|Cardinality Governance]]
- [[aks-helm-impl-guidelines|AKS Helm Implementation Guidelines]]
