---
title: "Data Source Strategy"
description: "To ensure comprehensive observability across infrastructure, applications, and business workflows,"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-3"
relations:
  - slug: prometheus/08-operating-prometheus/02-security/02-security
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/architectural-design
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/deployment-strategy
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/telemetry-schema-design
    kind: related
---

## Data Source Strategy

To ensure comprehensive observability across infrastructure, applications, and business workflows,
the following data types are strategically collected and instrumented. Once collected, these signals
are shaped by the
[[projects/platform-shipsolid/01-platform-architecture/designs/telemetry-schema-design|Telemetry Schema Design]]
into the platform's canonical attribute set:

## Metrics

**Purpose**: Quantitative measurement of system and application behavior over time. Ideal for
real-time monitoring, capacity planning, and triggering alerts.

**Scope**:

- **Infrastructure Metrics**:
  - _Azure/OnPrem VMs_: CPU, memory, disk I/O via Node Exporter or Azure Monitor agent
  - _AKS (Kubernetes)_: Pod/container metrics, resource usage via kubelet, cAdvisor, and
    kube-state-metrics
  - _App Gateway & Load Balancers_: Connection counts, throughput, error rates via Azure Metrics
- **Application Metrics**:
  - Collected via Prometheus or OpenTelemetry SDKs (custom counters, histograms)
  - Examples: request latency, response codes, API call durations
- **Custom Business Metrics**:
  - Metrics tied to business logic (e.g., `orders_processed`, `failed_transactions`)
  - Enable tracking of SLIs and SLOs

## Logs

**Purpose**: Detailed, timestamped event records used for debugging, audit trails, and post-incident
analysis.

**Scope**:

- **Application Logs**:
  - Structured logs in JSON using frameworks like Serilog, NLog, etc.
  - Captures trace IDs, exceptions, user activity, and transaction paths
- **Platform Logs**:
  - Azure Monitor diagnostic logs from services like App Service, API Gateway, Azure SQL
  - Linux Syslog/Windows Event Logs from VMs or on-prem servers
- **[[prometheus/08-operating-prometheus/02-security/02-security|Security]] Logs**:
  - Firewall events, AD authentication logs, audit trails from critical systems
  - Forwarded to centralized logging via Loki or Azure Sentinel

## Traces

**Purpose**: Distributed tracing enables tracking the journey of a request across multiple services
or microservices.

**Scope**:

- **Application/API-Level Tracing**:
  - Implemented via OpenTelemetry SDK (`ActivitySource` in .NET)
  - Traces link spans across services with context propagation
  - Critical for latency analysis, root cause of errors, and dependency mapping
- **Integration**:
  - OTLP traces sent to Grafana Tempo or Azure Monitor Distributed Tracing
  - Linked with logs and metrics via trace IDs

## Profiling

**Purpose**: Deep-dive diagnostics into application performance at the code level, identifying
bottlenecks in CPU, memory, GC, or I/O.

**Scope**:

- **Runtime Profiling**:
  - .NET: `dotnet-trace`, `dotnet-counters`
  - Python/Go: Pyroscope, pprof
- **Use Cases**:
  - Memory leaks, slow method calls, thread contention
  - Executed periodically or on-demand in staging/prod under load
- **Integration with Traces**:
  - Profile data annotated with trace context when possible

## Synthetics

**Purpose**: Proactively simulate user interactions and test system uptime, latency, and core
business flows.

**Scope**:

- **Availability Monitoring**:
  - Azure Application Insights availability tests (ping/web tests)
  - Grafana Cloud synthetic monitoring (HTTP/HTTPS probes, DNS, SSL)
- **Custom Checks**:
  - Synthetic transactions mimicking real business flows (e.g., login → search → checkout)
- **SLI Integration**:
  - Synthetic success rates and latency feeding into SLO dashboards
