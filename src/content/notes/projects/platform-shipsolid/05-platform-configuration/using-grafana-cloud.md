---
title: "Grafana Cloud Usage Guide"
description: "1."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-14
hidden: false
zettelId: "202605082026"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/alerting
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/alerts-standards
    kind: related
  - slug: observability/reference/cardinality
    kind: related
---

## Grafana Cloud Usage Guide

### Metrics, Logs, and Traces for Developers

---

## Table of Contents

1. Overview
2. Grafana Cloud Architecture Concepts
3. Accessing Grafana Cloud
4. Understanding the UI Layout
5. Working with Metrics
6. Working with Logs
7. Working with Traces
8. Correlating Metrics, Logs, and Traces
9. Dashboards
10. Alerting Basics
11. Common PromQL Queries
12. Common LogQL Queries
13. Trace Investigation Workflow
14. Troubleshooting Patterns
15. Best Practices for Developers
16. Recommended Instrumentation Standards

---

## 1. Overview

Grafana Cloud provides a unified observability platform for:

- **Metrics** → Time-series telemetry
- **Logs** → Structured and unstructured application/system logs
- **Traces** → Distributed request tracing

Typical telemetry flow:

```text
Application
   ↓
OpenTelemetry SDK / Agent
   ↓
Grafana Alloy / OTEL Collector
   ↓
Grafana Cloud
   ├── Mimir (Metrics)
   ├── Loki (Logs)
   └── Tempo (Traces)
```

---

## 2. Grafana Cloud Architecture Concepts

| Signal  | Backend | Query Language |
| ------- | ------- | -------------- |
| Metrics | Mimir   | PromQL         |
| Logs    | Loki    | LogQL          |
| Traces  | Tempo   | TraceQL        |

---

## 3. Accessing Grafana Cloud

### Login

Navigate to your Grafana Cloud instance:

```text
https://<stack-name>.grafana.net
```

Authenticate using:

- SSO
- Grafana credentials
- Azure Entra ID / Okta / SAML (organization dependent)

---

## 4. Understanding the UI Layout

### Left Navigation Menu

| Section     | Purpose                |
| ----------- | ---------------------- |
| Home        | Landing page           |
| Dashboards  | View/create dashboards |
| Explore     | Ad-hoc querying        |
| Alerting    | Alert rules            |
| Connections | Data sources           |
| Drilldown   | Logs/traces workflows  |

---

## 5. Working with Metrics

### Opening Metrics Explorer

Navigate:

```text
Explore → Select Metrics data source
```

Usually:

```text
grafanacloud-<stack>-prom
```

---

### Metrics Concepts

| Concept                           | Description                         |
| --------------------------------- | ----------------------------------- |
| Metric                            | Numeric time-series                 |
| Label                             | Metadata dimension                  |
| Time Series                       | Sequence of metric points           |
| [[tech/cardinality\|Cardinality]] | Number of unique label combinations |

Example metric:

```promql
http_server_request_duration_seconds_count
```

Example labels:

```text
service="payment-api"
environment="prod"
status_code="500"
```

---

### Basic PromQL Queries

#### CPU Usage

```promql
rate(process_cpu_seconds_total[5m])
```

---

#### Request Rate

```promql
sum(rate(http_server_requests_seconds_count[5m]))
```

---

#### Error Rate

```promql
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_server_requests_seconds_count[5m]))
```

---

#### P95 Latency

```promql
histogram_quantile(
  0.95,
  sum(rate(http_server_request_duration_seconds_bucket[5m]))
  by (le)
)
```

---

### Using Labels

Filter metrics:

```promql
http_server_requests_seconds_count{
  service_name="orders-api",
  deployment_environment="prod"
}
```

---

### Time Range Selection

Top-right controls:

- Last 5 minutes
- Last 1 hour
- Last 24 hours
- Custom range

Useful during incident analysis.

---

### Query Inspector

Use:

```text
Query → Inspect → Data
```

Useful for:

- Debugging missing metrics
- Understanding returned labels
- Query optimization

---

## 6. Working with Logs

### Opening Logs Explorer

Navigate:

```text
Explore → Select Loki datasource
```

Usually:

```text
grafanacloud-<stack>-logs
```

---

### Log Structure

Recommended structured logging:

```json
{
  "timestamp": "2026-05-08T12:00:00Z",
  "level": "ERROR",
  "service": "orders-api",
  "trace_id": "abc123",
  "message": "Database timeout"
}
```

---

### Basic LogQL Queries

#### Logs from Service

```logql
{service_name="orders-api"}
```

---

#### Error Logs

```logql
{service_name="orders-api"} |= "ERROR"
```

---

#### Regex Search

```logql
{service_name="orders-api"} |~ "timeout|exception"
```

---

#### JSON Parsing

```logql
{service_name="orders-api"}
| json
| level="ERROR"
```

---

#### Extract Fields

```logql
{service_name="orders-api"}
| json
| line_format "{{.message}}"
```

---

### Log Exploration Features

### Live Tail

Useful for:

- Real-time debugging
- Deployment validation
- Incident response

Enable:

```text
Explore → Live
```

---

### Log Labels

Typical labels:

| Label        | Purpose                |
| ------------ | ---------------------- |
| service_name | Service identification |
| environment  | Environment            |
| pod          | Kubernetes pod         |
| container    | Container name         |
| trace_id     | Trace correlation      |

---

### Common Debugging Workflow

1. Find failing request
2. Filter by service
3. Filter by time window
4. Search exception/error
5. Extract trace_id
6. Open trace

---

## 7. Working with Traces

### Opening Traces Explorer

Navigate:

```text
Explore → Tempo datasource
```

Usually:

```text
grafanacloud-<stack>-traces
```

---

### Distributed Tracing Concepts

| Concept     | Description          |
| ----------- | -------------------- |
| Trace       | End-to-end request   |
| Span        | Single operation     |
| Parent Span | Caller operation     |
| Child Span  | Downstream operation |

---

### Typical Trace Flow

```text
Frontend
   ↓
API Gateway
   ↓
Orders API
   ↓
Payment API
   ↓
Database
```

---

### Searching Traces

### By Service

```traceql
{ resource.service.name = "orders-api" }
```

---

### Slow Requests

```traceql
{ duration > 2s }
```

---

### Errors

```traceql
{ status = error }
```

---

### Combine Filters

```traceql
{
  resource.service.name = "orders-api"
  && duration > 1s
}
```

---

### Reading Trace Waterfalls

### Waterfall View

Shows:

- Request timing
- Downstream dependencies
- Bottlenecks
- Parallel execution

---

### What to Look For

| Symptom                   | Likely Cause           |
| ------------------------- | ---------------------- |
| Long DB span              | Slow query             |
| Gap between spans         | Queue/wait             |
| Repeated retries          | Downstream instability |
| High external API latency | Vendor issue           |

---

## 8. Correlating Metrics, Logs, and Traces

This is the most important operational workflow.

---

### Metrics → Logs

Example:

1. High latency alert fires
2. Open related dashboard
3. Identify affected service
4. Open logs for same timeframe

---

### Logs → Traces

Example:

1. Error log contains `trace_id`
2. Click trace link
3. Analyze full request path

---

### Traces → Metrics

Example:

1. Trace shows slow DB
2. Open DB metrics
3. Validate saturation/errors

---

## 9. Dashboards

### Creating Dashboards

Navigate:

```text
Dashboards → New Dashboard
```

---

### Common Panels

| Panel       | Usage           |
| ----------- | --------------- |
| Time Series | Metrics trends  |
| Stat        | Current value   |
| Table       | Structured data |
| Logs        | Embedded logs   |

---

### Recommended Dashboard Structure

### Golden Signals

#### Latency

```promql
histogram_quantile(0.95, ...)
```

#### Traffic

```promql
sum(rate(http_requests_total[5m]))
```

#### Errors

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
```

#### Saturation

```promql
cpu_usage
memory_usage
queue_depth
```

---

## 10. Alerting Basics

> See the [[projects/platform-shipsolid/05-platform-configuration/alerting|Alerting Contract]] and
> [[projects/platform-shipsolid/05-platform-configuration/alerts-standards|Alerts Standards]] for
> the platform's enforced contact-point and severity conventions — this section covers general
> design principles only.

### Alert Lifecycle

```text
Normal → Pending → Firing → Resolved
```

---

### Example Latency Alert

```promql
histogram_quantile(
  0.95,
  sum(rate(http_server_request_duration_seconds_bucket[5m]))
  by (le, service_name)
) > 1
```

---

### Alert Design Guidelines

### Good Alerts

- Actionable
- Low noise
- Service-oriented
- Symptom-focused

---

### Bad Alerts

- Too sensitive
- Infrastructure-only
- High cardinality
- No ownership

---

## 11. Common PromQL Queries

### Pod Restart Count

```promql
increase(kube_pod_container_status_restarts_total[1h])
```

---

### Container Memory Usage

```promql
container_memory_working_set_bytes
```

---

### Request Throughput

```promql
sum(rate(http_requests_total[5m])) by (service_name)
```

---

### Error Percentage

```promql
100 *
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

---

## 12. Common LogQL Queries

### Exception Search

```logql
{service_name="orders-api"} |= "Exception"
```

---

### HTTP 500 Errors

```logql
{service_name="orders-api"}
| json
| status_code=500
```

---

### Count Errors

```logql
count_over_time(
  {service_name="orders-api"} |= "ERROR" [5m]
)
```

---

## 13. Trace Investigation Workflow

### High Latency Incident

#### Step 1 — Alert Fires

Latency exceeds SLO.

---

#### Step 2 — Open Metrics

Check:

- Error spikes
- Throughput
- Saturation

---

#### Step 3 — Open Logs

Search:

```logql
{service_name="orders-api"} |= "timeout"
```

---

#### Step 4 — Open Trace

Analyze:

- Slow spans
- Retries
- Dependency latency

---

#### Step 5 — Root Cause

Examples:

- SQL lock contention
- External API latency
- Thread pool starvation
- GC pause
- Network issues

---

## 14. Troubleshooting Patterns

### Missing Metrics

Check:

- OTEL exporter config
- Scrape targets
- Network/firewall
- Label mismatch

---

### Missing Logs

Check:

- Alloy pipeline
- Loki labels
- Retention
- Parsing stage

---

### Missing Traces

Check:

- Sampling
- OTEL SDK config
- Trace propagation headers

---

## 15. Best Practices for Developers

### Metrics

#### DO

- Use low-cardinality labels
- Instrument RED metrics
- Use histograms for latency

#### DON'T

- Use user IDs as labels
- Create dynamic metric names
- Emit duplicate metrics

---

### Logs

#### DO

- Use structured JSON logs
- Include trace_id/span_id
- Use consistent severity

#### DON'T

- Log secrets
- Log excessive stack traces
- Use inconsistent field names

---

### Traces

#### DO

- Propagate context headers
- Instrument external calls
- Add meaningful span names

#### DON'T

- Create excessive spans
- Trace every loop iteration
- Ignore sampling strategy

---

## 16. Recommended Instrumentation Standards

### Service Naming

```text
orders-api
payments-api
inventory-worker
```

Avoid:

```text
orders-api-dev-01
```

---

### Environment Labels

Recommended:

```text
deployment_environment
service_name
cloud_region
team_name
```

---

### OpenTelemetry Semantic Conventions

Use standard conventions whenever possible:

| Type      | Example          |
| --------- | ---------------- |
| HTTP      | http.method      |
| DB        | db.system        |
| Messaging | messaging.system |
| Cloud     | cloud.region     |

---

### Final Recommendation

For development workflows:

### Primary Workflow

```text
Alert
  ↓
Metrics
  ↓
Logs
  ↓
Traces
  ↓
Root Cause
```

---

### Operational Principle

Metrics tell you:

> "Something is wrong."

Logs tell you:

> "What happened."

Traces tell you:

> "Where and why it happened."
