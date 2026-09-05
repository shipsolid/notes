---
title: "Telemetry Schema Design — Azure Container Apps on Grafana Cloud"
description: "This schema is optimised for: - 50+ Azure Container Apps"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-07
hidden: false
zettelId: "202605071859"
relations:
  - slug: projects/platform-shipsolid/07-cost-governance/metric-label-standards
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/observability-overview
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/kpis-slis-slos-slas
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/security-access-compliance
    kind: related
---

## Telemetry Schema Design

## Azure Container Apps (.NET + Python) — Grafana Cloud + OpenTelemetry Reference Architecture

> Companion to [[metric-label-standards|metric-label-standards.md]] (cost-attribution labels),
> [[observability-overview|observability-overview.md]],
> [[kpis-slis-slos-slas|kpis-slis-slos-slas.md]], and
> [[security-access-compliance|security-access-compliance.md]]. This document owns the **schema
> contract**; the metric-label doc owns the **billing/attribution contract**. Read both before
> changing labels.

---

## 1. Design Goals

This schema is optimised for:

- 50+ Azure Container Apps
- 12+ engineering teams
- Multi-region deployments
- Mixed runtime (.NET 8 + Python 3.11+)
- Grafana Cloud (Mimir + Loki + Tempo)
- OTel-native instrumentation
- High-scale cardinality governance
- SLO-driven operations
- Cross-service distributed tracing
- Federated governance model

Priorities, in order:

1. Query consistency
2. Controlled cardinality
3. Cross-language interoperability
4. Cost-efficient aggregation
5. Incident debugging velocity
6. Async trace continuity
7. Platform-wide observability contracts

---

## 2. Core Principles

### Principle 1 — Telemetry Is a Platform API

Telemetry attributes are versioned contracts, query interfaces, aggregation keys, and operational
dependencies. Teams MUST NOT emit arbitrary labels without governance review (§20).

### Principle 2 — Resource Attributes Must Be Stable

Resource attributes define identity. They:

- SHOULD be low cardinality
- MUST remain stable for the process lifetime
- MUST exist on metrics, logs, and traces alike

| Good                     | Bad          |
| ------------------------ | ------------ |
| `service.name`           | `request.id` |
| `deployment.environment` | `user.id`    |
| `cloud.region`           | `session.id` |

### Principle 3 — Business Dimensions Belong in Span/Log Attributes

Dynamic business metadata (`tenant.id`, `workflow.name`, `feature.flag`, `order.id`) MUST NOT appear
as metric labels unless explicitly approved through the schema-change process (§20).

### Principle 4 — Metrics Are Aggregation Signals

Metrics optimise for alerting, SLOs, trend analysis, and low query cost. **Metrics are not forensic
storage.**

### Principle 5 — Logs Carry Forensic Detail

Logs are the primary location for exception context, payload metadata, business identifiers, and
debugging breadcrumbs.

### Principle 6 — Traces Are the Connective Tissue

Traces link metrics (via exemplars) and logs (via `trace_id`/`span_id`). Any high-cardinality
dimension dropped from metrics MUST be discoverable through a trace or log (§6.3, §7.3).

---

## 3. High-Level Architecture

```text
Azure Container Apps (.NET / Python)
    |
    | OTel SDK (OTLP/gRPC, batch)
    v
[Agent Tier] OTel Collector / Alloy DaemonSet      <-- per-region, in-cluster
    |
    | OTLP/gRPC (mTLS, compressed)
    v
[Gateway Tier] Alloy stateful gateway              <-- tail sampling, redaction, schema enforcement
    |
    +--- remote_write (Mimir)
    +--- loki.write   (Loki)
    +--- otlphttp     (Tempo)
```

Two-tier topology rationale: tail sampling and PII redaction need full-trace visibility, which a
per-pod agent cannot guarantee. See §13 Collector Topology.

---

## 4. Canonical Resource Schema

### 4.1 Required attributes (all signals)

| Attribute                | Required | Cardinality | Notes                                                              |
| ------------------------ | -------- | ----------- | ------------------------------------------------------------------ |
| `service.name`           | Yes      | Low         | Logical service name (§5.1)                                        |
| `service.namespace`      | Yes      | Low         | Business/domain grouping (§5.2)                                    |
| `service.version`        | Yes      | Medium      | Semantic version or image SHA prefix; see §14 retention warning    |
| `service.instance.id`    | Yes      | High        | Per-replica UUID; **never** a metric label, exposed on traces/logs |
| `deployment.environment` | Yes      | Low         | `dev`/`qa`/`train`/`prod`                                          |
| `cloud.provider`         | Yes      | Low         | `azure`                                                            |
| `cloud.region`           | Yes      | Low         | Azure region                                                       |
| `cloud.platform`         | Yes      | Low         | `azure_container_apps`                                             |
| `aca.revision.name`      | Yes      | Medium      | ACA revision (rolls forward on every deploy) — drop from metrics   |
| `aca.replica.name`       | Yes      | High        | KEDA-driven, churns on scale events — traces/logs only             |
| `container.name`         | Yes      | Medium      | ACA container name                                                 |
| `k8s.namespace.name`     | Yes      | Low         | ACA managed namespace                                              |
| `telemetry.sdk.language` | Yes      | Low         | `dotnet` / `python`                                                |
| `telemetry.sdk.version`  | Yes      | Low         | Set automatically by SDK; useful for upgrade tracking              |
| `team.name`              | Yes      | Low         | Owning team — joins cost-attribution (see §25)                     |
| `business.unit`          | Optional | Low         | Domain ownership; see cost-attribution doc                         |

`host.name` is intentionally absent: on ACA the underlying host is platform-managed and changes
frequently. Use `service.instance.id` for replica identity.

### 4.2 Azure Container Apps specifics

- **`service.instance.id` SHOULD be set from `CONTAINER_APP_REPLICA_NAME`** (env var injected by
  ACA). Resource Detector for ACA does not yet land this attribute consistently in the OTel SDK —
  set it manually in startup until upstream parity exists.
- **KEDA scale events cause replica churn**, which inflates `service.instance.id` cardinality. This
  is acceptable on traces/logs but is the strongest reason to keep `service.instance.id` off every
  metric.
- **ACA built-in logs (Container Apps environment logs)** are written to Log Analytics by the
  platform; do not duplicate them through OTel. Application logs and access logs SHOULD flow through
  OTel only.
- **Cold starts** (replica count 0 → 1) produce a one-off bimodal latency distribution. Histogram
  buckets in §6.2 cover this; alerts SHOULD use p95 over a window long enough to absorb cold-start
  tails.

---

## 5. Naming Standards

### 5.1 Service Naming

```text
<domain>-<capability>-<service>
```

| Good                    | Bad        |
| ----------------------- | ---------- |
| `payments-checkout-api` | `api`      |
| `catalog-search-worker` | `backend`  |
| `identity-auth-service` | `service1` |
|                         | `prod-api` |

Environment MUST NOT appear in `service.name` — it lives in `deployment.environment`.

### 5.2 Namespace Naming

```text
<business-domain>
```

Examples: `payments`, `identity`, `recommendations`, `supplychain`.

---

## 6. Metrics Schema

### 6.1 Golden Signals

#### HTTP Server Metrics

OTel-native names (semconv 1.26 baseline — see §15):

| Metric                         | Type      | Allowed labels                                                                                             |
| ------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------- |
| `http.server.request.duration` | Histogram | `service.name`, `http.route`, `http.request.method`, `http.response.status_code`, `deployment.environment` |
| `http.server.request.count`    | Counter   | same                                                                                                       |
| `http.server.active_requests`  | Gauge     | `service.name`, `deployment.environment`                                                                   |

**`http.route` MUST be the templated route** (`/orders/{id}`), not the raw URL. Both .NET
(`AspNetCore.Routing`) and Python (FastAPI/Flask) auto-instrumentations supply this. The collector
MUST drop the metric outright if `http.route` is unset or contains numeric path segments — see §9.2.

Forbidden as labels: `user.id`, `session.id`, `request.id`, raw URL, email, query string.

#### Queue / Messaging Metrics

| Metric                       | Type      |
| ---------------------------- | --------- |
| `messaging.queue.depth`      | Gauge     |
| `messaging.consumer.lag`     | Gauge     |
| `messaging.process.duration` | Histogram |
| `messaging.retry.count`      | Counter   |
| `messaging.dlq.count`        | Counter   |

Allowed labels: `messaging.system` (`servicebus`/`kafka`/`eventgrid`), `messaging.destination.name`,
`messaging.consumer.group`, `messaging.operation` (`publish`/`receive`/`process`),
`deployment.environment`.

DLQ count is mandatory — it is the canary metric for poison-message storms and is silently absent
from most teams' first-pass instrumentation.

#### Workflow Metrics

| Metric                        | Type      |
| ----------------------------- | --------- |
| `workflow.execution.duration` | Histogram |
| `workflow.execution.success`  | Counter   |
| `workflow.execution.failure`  | Counter   |

Allowed labels: `workflow.name` (medium-cardinality, requires registry approval), `workflow.type`,
`deployment.environment`.

### 6.2 Histogram Bucket Standards

**HTTP latency** — aligned to OTel semconv 1.26 default explicit bucket boundaries (do not deviate
without ADR):

```text
0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10
```

**Queue/messaging processing** — diverges from OTel default because tail latency for async work is
measured in seconds, not ms:

```text
0.01, 0.05, 0.1, 0.25, 0.5, 1, 5, 10, 30, 60, 300
```

Native histograms (Mimir): teams MAY emit in addition to explicit buckets, but SHOULD NOT replace
them yet — alerting tooling parity is incomplete (revisit on next `last_reviewed`).

### 6.3 Exemplars (mandatory on histograms)

Every histogram metric MUST carry exemplars when a sampled trace is in scope. This is the only
mechanism that lets a Mimir SLO drilldown reach the originating Tempo trace, and it is free at
emission time.

```yaml
# OTel SDK config (.NET / Python — both default-on once TracerProvider is registered)
metrics:
  exemplar_filter: trace_based
```

Mimir-side: `--ingester.native-histograms-ingestion-enabled` and
`--query-frontend.exemplars-enabled` MUST be on. Confirm via Grafana Cloud account settings.

### 6.4 OTel → Prometheus Name Translation

Prometheus rejects dots, so the OTel `http.server.request.duration` becomes
`http_server_request_duration_seconds_bucket` after the Prometheus exporter rewrites. Resource
attributes do NOT auto-promote to labels: configure the OTel Prometheus exporter / Alloy
`otelcol.exporter.prometheus` with an explicit `add_metric_suffixes: true` and the
resource-attributes-to-labels list in §4.1 (low and medium only).

Document in dashboards using **the rewritten Prometheus name** but reference **the OTel name** in
this schema. PromQL example uses `http_server_request_duration_seconds_bucket`; Tempo and Loki
queries use `service.name` (dotted) — see §17.

---

## 7. Logging Schema

### 7.1 Log Shape

```json
{
  "timestamp": "2026-05-07T12:00:00Z",
  "severity": "ERROR",
  "message": "Payment authorization failed",
  "service.name": "payments-checkout-api",
  "deployment.environment": "prod",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "tenant.id": "tenant-001",
  "workflow.name": "checkout",
  "operation.name": "authorize-payment",
  "error.type": "TimeoutException",
  "http.response.status_code": 504,
  "feature.flag": "new-gateway-enabled"
}
```

### 7.2 Required Fields

| Field                    | Required                    |
| ------------------------ | --------------------------- |
| `timestamp`              | Yes                         |
| `severity`               | Yes                         |
| `message`                | Yes                         |
| `service.name`           | Yes                         |
| `deployment.environment` | Yes                         |
| `trace_id`               | Yes (when in trace context) |
| `span_id`                | Yes (when in trace context) |

### 7.3 Loki Stream Labels vs Structured Metadata vs Body

Loki 3.x introduced **structured metadata** — high-cardinality fields that are queryable via `|=`
and `| <field>=` without contributing to stream cardinality. This is the single most important
change to internalise; pre-3.x guidance forced everything onto labels or body, and that is no longer
correct.

| Field                    | Stream label | Structured metadata | Body |
| ------------------------ | :----------: | :-----------------: | :--: |
| `service.name`           |      ✓       |                     |      |
| `deployment.environment` |      ✓       |                     |      |
| `cloud.region`           |      ✓       |                     |      |
| `severity`               |      ✓       |                     |      |
| `team.name`              |      ✓       |                     |      |
| `workflow.name`          |              |          ✓          |      |
| `tenant.id`              |              |          ✓          |      |
| `trace_id` / `span_id`   |              |          ✓          |      |
| `operation.name`         |              |          ✓          |      |
| `request.id`             |              |          ✓          |      |
| `user.id`, `order.id`    |              |                     |  ✓   |
| Stack traces, payloads   |              |                     |  ✓   |

Stream-label budget: **≤ 6 labels per stream**. Adding any new label requires registry review.
`workflow.name` was misclassified as a stream label in earlier drafts — at 12 teams × ~5 workflows ×
env × region × service.name the cross-product blows past Loki's `max_streams_per_user` default.

### 7.4 High-Cardinality Identifiers

Allowed in **structured metadata** or **body** only — never as Loki stream labels and never as
metric labels:

`user.id`, `session.id`, `order.id`, `request.id`, `correlation.id`, payload identifiers.

---

## 8. Trace Schema

### 8.1 Span Naming

```text
<operation> <resource>
```

| Good                           | Bad             |
| ------------------------------ | --------------- |
| `GET /orders/{id}`             | `HandleRequest` |
| `POST /payments`               | `Execute`       |
| `consume kafka.payment-events` | `Process`       |
| `process checkout-workflow`    |                 |

The resource part MUST be templated, mirroring §6.1's `http.route` rule.

### 8.2 Required Span Attributes

| Attribute                | Required            |
| ------------------------ | ------------------- |
| `service.name`           | Yes                 |
| `deployment.environment` | Yes                 |
| `operation.name`         | Yes                 |
| `span.kind`              | Yes                 |
| `tenant.id`              | Recommended         |
| `workflow.name`          | Recommended         |
| `error.type`             | When `status=error` |

`trace_id` and `span_id` are managed by the SDK and are not user-set attributes.

### 8.3 Async Messaging Propagation

Mandatory propagators:

- W3C Trace Context (`traceparent`, `tracestate`)
- W3C Baggage (`baggage`)
- Application-level `x-correlation-id` (preserved across async hops)

#### 8.3.1 Azure Service Bus caveat

The `Azure.Messaging.ServiceBus` SDK propagates W3C Trace Context **only when running with
`OpenTelemetry.Instrumentation.AzureMessaging` ≥ 1.0.0-beta.5** and the `ActivitySource` is
registered. Older `Microsoft.Azure.ServiceBus` (v4) does **not** auto-propagate — services still on
it MUST inject `traceparent` into application properties manually until upgrade. There is no
equivalent caveat for Kafka (Confluent .NET / kafka-python instrumentations propagate by default)
but Event Grid event-handlers MUST attach `traceparent` to the custom event payload — Event Grid
does not preserve transport headers across the broker.

#### 8.3.2 Cross-language consistency

.NET defaults to W3C; Python OTel defaults to W3C; legacy Jaeger headers MUST be disabled on
producers to avoid double-context confusion.

### 8.4 Messaging Span Kind

| Operation           | `span.kind` |
| ------------------- | ----------- |
| Kafka producer      | `PRODUCER`  |
| Kafka consumer      | `CONSUMER`  |
| Service Bus send    | `PRODUCER`  |
| Service Bus receive | `CONSUMER`  |
| Event Grid publish  | `PRODUCER`  |
| Workflow execution  | `INTERNAL`  |
| Outbound HTTP       | `CLIENT`    |
| Inbound HTTP        | `SERVER`    |

---

## 9. Cardinality Governance

### 9.1 Cardinality Classes

| Class  | Range   | Allowed in metrics?                 | Examples                                                                                                     |
| ------ | ------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Low    | < 100   | Yes                                 | `deployment.environment`, `cloud.region`, `service.name`, `http.request.method`, `http.response.status_code` |
| Medium | 100–10k | Selectively, with registry approval | `http.route`, `workflow.name`, `messaging.destination.name`, `service.version`                               |
| High   | > 10k   | **Forbidden**                       | `user.id`, `order.id`, `request.id`, `session.id`, raw URL, email, UUID, `service.instance.id`               |

High-cardinality identifiers belong in traces (span attributes) or logs (structured metadata or
body) — not metric labels and not Loki stream labels.

### 9.2 Collector Enforcement Rules

The Alloy gateway tier (§13) MUST:

- Reject metrics whose label set is not in the registry
- Drop `http.server.*` metrics whose `http.route` is unset OR contains numeric path segments (regex:
  `/[0-9a-f]{8,}|/\d{2,}`)
- Hash PII fields per §10
- Truncate spans where any attribute exceeds 4 KB
- Drop unknown resource attributes outside the catalog (fail-safe to bounded set, not unbounded
  passthrough)
- Emit collector-internal metrics so violations are observable
  (`alloy_processor_dropped_total{reason=...}`)

### 9.3 Cardinality Budgets (federated governance)

Hard ceilings, enforced via Mimir usage groups + alerts. Numbers are starting points; calibrate via
Cardinality Budget Calculator before any new label ships.

| Scope           | Active series ceiling | Source of truth                  |
| --------------- | --------------------- | -------------------------------- |
| Per service     | 50,000                | Mimir `usage_group=service.name` |
| Per team        | 250,000               | Mimir `usage_group=team.name`    |
| Per environment | 5,000,000             | Mimir tenant total               |
| Whole platform  | 20,000,000            | Mimir tenant total               |

When a service exceeds 80% of its budget, the platform team raises a ticket against the owning team.
At 100% the gateway begins dropping new series for that service (`accept` → `drop_new_series`) —
existing series continue to flow.

---

## 10. PII Governance

PII MUST NEVER appear in:

- Metric labels
- Span names
- Loki stream labels

PII includes: email, phone number, address, full payment identifiers (PAN, account number), customer
name, government ID.

### 10.1 Collector enforcement primitives

Approved redaction patterns. The platform team owns these processors centrally; teams cannot disable
them per service.

```alloy
otelcol.processor.transform "redact_pii" {
  log_statements {
    context = "log"
    statements = [
      // hash email
      `set(attributes["user.email"], SHA256(attributes["user.email"])) where attributes["user.email"] != nil`,
      // tokenise PAN-like 13-19 digit runs
      `replace_pattern(body, "\\b[0-9]{13,19}\\b", "[REDACTED-PAN]")`,
      // strip AuthZ headers
      `delete_key(attributes, "http.request.header.authorization")`,
    ]
  }
  trace_statements {
    context = "span"
    statements = [
      `set(attributes["user.email"], SHA256(attributes["user.email"])) where attributes["user.email"] != nil`,
    ]
  }
}
```

Enforcement direction: redact at the **gateway tier**, not the agent. Agent-tier redaction is
best-effort because not every replica routes through the same redaction config; gateway-tier
guarantees a single chokepoint.

### 10.2 What MUST flow through `attributes.processor` deny-list

- `http.request.header.authorization`
- `http.request.header.cookie`
- `http.request.header.x-api-key`
- `db.statement` (sanitise via `db.operation` + parameterised hash, never raw SQL)

---

## 11. Loki Label Strategy

See §7.3 for the full table including structured metadata. Summary:

| Stream label             | Status                                |
| ------------------------ | ------------------------------------- |
| `service.name`           | Required                              |
| `deployment.environment` | Required                              |
| `cloud.region`           | Required                              |
| `severity`               | Required                              |
| `team.name`              | Required                              |
| `cluster`                | Optional (multi-cluster regions only) |

Stream-label budget: **≤ 6 labels per stream** (Loki active-stream cost driver). Anything dynamic
(`workflow.name`, `tenant.id`, `trace_id`, etc.) MUST be structured metadata, not a stream label.

---

## 12. Sampling Strategy

### 12.1 Lower environments (`dev`, `qa`, `train`)

100% trace sampling. Volume is low and debug velocity matters more than ingest cost.

### 12.2 Production — head sampling

Default 10% head sampling at the SDK, set via `TraceIdRatioBased(0.10)`. Configured via env var so
the gateway can override per service:

```bash
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.10
```

`parentbased_traceidratio` — child spans inherit the parent's sample decision, which keeps traces
complete across service boundaries.

### 12.3 Production — tail sampling (gateway only)

Tail sampling runs **only on the gateway tier** (§13). Agents cannot make tail decisions because
they do not see the full trace.

```alloy
otelcol.processor.tail_sampling "policies" {
  decision_wait = "30s"
  num_traces    = 100000
  expected_new_traces_per_sec = 5000

  policy {
    name = "errors"
    type = "status_code"
    status_code { status_codes = ["ERROR"] }
  }
  policy {
    name = "slow_http"
    type = "latency"
    latency { threshold_ms = 1000 }
  }
  policy {
    name = "retries"
    type = "string_attribute"
    string_attribute { key = "messaging.retry", values = ["true"] }
  }
  policy {
    name = "high_value_tenants"
    type = "string_attribute"
    string_attribute { key = "tenant.tier", values = ["gold", "platinum"] }
  }
  policy {
    name = "baseline"
    type = "probabilistic"
    probabilistic { sampling_percentage = 1 }
  }
}
```

`decision_wait = 30s` is a deliberate ceiling — long workflow spans (>30s) MUST emit interim `event`
attributes so the tail decision has signal before the trace closes.

### 12.4 Sampling fallback contract

If the gateway is restarting or `tail_sampling` is OOM-evicting traces, the SDK head sampling rate
(10%) is the floor. **Never disable head sampling expecting tail-only.** Outages of the gateway then
become silent observability outages.

---

## 13. Collector Topology

> Captured as ADR-007: Adopt Two-Tier Grafana Alloy Collector Topology.

Two-tier (agent + gateway) is the default for the stated scale. Justification:

| Concern                             | Agent-only  | Gateway-only  | Two-tier |
| ----------------------------------- | :---------: | :-----------: | :------: |
| Tail sampling correctness           |      ✗      |       ✓       |    ✓     |
| Per-replica resource detection      |      ✓      |       ✗       |    ✓     |
| Schema enforcement chokepoint       |      ✗      |       ✓       |    ✓     |
| Network egress reduction (batching) |      ✗      |       ✓       |    ✓     |
| Failure blast radius                | per-replica | platform-wide |  scoped  |
| Operational complexity              |     Low     |    Medium     |   High   |

Mitigations for the gateway-tier blast radius:

- Run gateway as a stateful set with ≥ 3 replicas, anti-affinity across zones
- Mimir/Loki/Tempo have client-side load balancing in Alloy (`gomemlimit`-aware)
- Gateway restart MUST drain `tail_sampling` decisions via `shutdown_timeout` (default 5s is too
  low; set 60s)
- Persistent buffer (`file_storage` extension) on gateway to survive backend stalls

Per-region: one gateway per Azure region. Cross-region cross-traces are stitched at Tempo (no need
for cross-region span-buffering).

---

## 14. Retention & Storage Tiering

| Signal  | Hot tier | Warm tier | Drop after | Notes                                                      |
| ------- | -------- | --------- | ---------- | ---------------------------------------------------------- |
| Metrics | 30d      | 13mo      | 13mo       | Aligned to year-over-year capacity planning                |
| Logs    | 7d       | 30d       | 30d        | Audit logs split into separate Loki tenant w/ 1y retention |
| Traces  | 7d       | —         | 30d        | Tempo single-tier in Grafana Cloud; sampled traces only    |

`service.version` cardinality drives metrics cost — releases bump it weekly. Mitigation: drop
`service.version` from non-SLO metrics via OTel `attributes.processor`, keep it on traces and logs
where it has debugging value.

Audit-class logs (security events, AuthZ decisions, admin actions) ship to a separate Loki tenant
with 1y retention. Schema is identical except `audit.actor.id` and `audit.action` are required and
`severity` is always `INFO` or higher.

---

## 15. Semantic Conventions Versioning

> Captured as ADR-006: Pin OpenTelemetry Semantic Conventions to v1.26 as Baseline.

Pin to **OTel semconv 1.26** as the baseline. The 1.21→1.23 rename of `http.server.duration` →
`http.server.request.duration` is the most recent breaking change; alerts and dashboards assume the
post-rename name throughout this doc.

Bumping semconv requires:

1. ADR draft (use `adr-writer` skill)
2. Cardinality / query-impact assessment
3. Six-week dual-emission window (`emit_old: true` on the SDK exporter) before flipping
4. Dashboard / alert rule update PR landing **before** the flip date

SDK upgrades that bump semconv silently are an incident — pin SDK versions in the service template
(a-governance/service-template/).

---

## 16. .NET Instrumentation Standards

### 16.1 Libraries

| Concern     | Library                                                    |
| ----------- | ---------------------------------------------------------- |
| OTel SDK    | `OpenTelemetry.Extensions.Hosting`                         |
| ASP.NET     | `OpenTelemetry.Instrumentation.AspNetCore`                 |
| HttpClient  | `OpenTelemetry.Instrumentation.Http`                       |
| EF Core     | `OpenTelemetry.Instrumentation.EntityFrameworkCore` (beta) |
| Service Bus | `Azure.Messaging.ServiceBus` ≥ 7.17 (W3C-native)           |
| Logs        | `OpenTelemetry.Logs` (built-in `ILogger` integration)      |
| Metrics     | `OpenTelemetry.Metrics`                                    |

### 16.2 Required enrichers

Add `tenant.id`, `workflow.name`, `team.name`, `deployment.environment` via:

- `Activity.AddTag` for spans
- `ILogger.BeginScope` for logs
- ASP.NET middleware, run before routing

### 16.3 Exporter config

```csharp
services.AddOpenTelemetry()
    .ConfigureResource(r => r
        .AddService(serviceName: "payments-checkout-api", serviceVersion: assemblyVersion)
        .AddAttributes(new[] {
            new KeyValuePair<string, object>("service.namespace", "payments"),
            new KeyValuePair<string, object>("team.name", "payments-platform"),
            new KeyValuePair<string, object>(
                "service.instance.id",
                Environment.GetEnvironmentVariable("CONTAINER_APP_REPLICA_NAME") ?? Guid.NewGuid().ToString()),
        }))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(o => {
            o.Endpoint = new Uri("http://otel-agent:4317"); // agent tier
            o.Protocol = OtlpExportProtocol.Grpc;
            o.BatchExportProcessorOptions.MaxQueueSize = 8192;
            o.BatchExportProcessorOptions.MaxExportBatchSize = 1024;
            o.BatchExportProcessorOptions.ScheduledDelayMilliseconds = 5000;
        }))
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter());
```

OTLP/gRPC over HTTP/proto: gRPC for lower CPU + better compression. Switch to HTTP/proto only when
there is a network constraint (e.g., HTTP/2 not available end-to-end).

### 16.4 Logging standard

Structured logging only.

```csharp
// Good
logger.LogInformation("Payment processed for tenant {TenantId}", tenantId);

// Bad — interpolated string, no structure
logger.LogInformation($"Payment processed for tenant {tenantId}");
```

---

## 17. Python Instrumentation Standards

### 17.1 Libraries

| Concern     | Library                                                       |
| ----------- | ------------------------------------------------------------- |
| FastAPI     | `opentelemetry-instrumentation-fastapi`                       |
| Flask       | `opentelemetry-instrumentation-flask`                         |
| Requests    | `opentelemetry-instrumentation-requests`                      |
| HTTPX       | `opentelemetry-instrumentation-httpx`                         |
| Celery      | `opentelemetry-instrumentation-celery`                        |
| Kafka       | `opentelemetry-instrumentation-confluent-kafka` / `-aiokafka` |
| Service Bus | `opentelemetry-instrumentation-azure-servicebus` (community)  |
| Logging     | `structlog` + `opentelemetry-sdk._logs` for trace correlation |

### 17.2 Logging pattern

```python
logger.info(
    "payment_processed",
    tenant_id=tenant_id,
    workflow_name="checkout",
)
```

`structlog` processors MUST inject `trace_id`/`span_id` from the active span context.

### 17.3 Exporter config

```python
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
import os

resource = Resource.create({
    "service.name": "payments-checkout-api",
    "service.namespace": "payments",
    "service.version": os.environ["IMAGE_TAG"],
    "deployment.environment": os.environ["DEPLOY_ENV"],
    "service.instance.id": os.environ.get("CONTAINER_APP_REPLICA_NAME") or str(uuid.uuid4()),
    "team.name": "payments-platform",
})

provider = TracerProvider(resource=resource)
provider.add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(endpoint="http://otel-agent:4317", insecure=True),
        max_queue_size=8192,
        max_export_batch_size=1024,
        schedule_delay_millis=5000,
    )
)
```

### 17.4 Async workloads

For Celery / Kafka / Service Bus consumers:

- Propagate trace context via the broker headers (the instrumentation handles this when in-process;
  for hand-rolled consumers use `propagate.extract(carrier)`)
- Attach `workflow.name` and `workflow.run.id` as span attributes — `workflow.run.id` is
  high-cardinality and lives only on the span, never as a metric label
- Preserve `x-correlation-id` across hops

---

## 18. SLO-Aligned Telemetry

### 18.1 SLI sources

| SLI                        | Source         | Notes                                                       |
| -------------------------- | -------------- | ----------------------------------------------------------- |
| Latency                    | Histogram      | p95/p99 from `http.server.request.duration`                 |
| Availability               | Counter        | 1 - (5xx / total) from `http.server.request.count`          |
| Errors                     | Counter        | Domain-specific failure counters                            |
| Queue lag                  | Gauge          | `messaging.consumer.lag`                                    |
| Workflow success           | Counter        | `workflow.execution.success` / `(success + failure)`        |
| **Error budget burn rate** | Recording rule | Multi-window multi-burn-rate alert (Google SRE workbook §5) |

The error budget burn rate is the **operationally most important** alert signal; static threshold
alerts on raw error rate are noisy. Recording rule sketch:

```promql
# 1h short window
sum(rate(http_server_request_count_total{status_class="5xx"}[1h]))
  /
sum(rate(http_server_request_count_total[1h]))
```

Pair with a 5m fast-burn alert and a 1h slow-burn alert per the SRE workbook.

### 18.2 SLO catalog (every service)

Each service MUST register:

- One latency SLO (default: p95 < threshold over 30d)
- One availability SLO (default: success ratio over 30d)
- Burn-rate alerts on both (5m fast-burn @ 14.4× exhaust, 1h slow-burn @ 1× exhaust)

SLO definitions live alongside Helm values in `f-observability/<env>/slos/<service>.yaml`. They are
NOT a free-form per-team artefact.

---

## 19. Query Standards

### 19.1 PromQL

Note the underscored names — Prometheus exporter rewrite, see §6.4.

```promql
histogram_quantile(
  0.95,
  sum by (le, service_name, http_route) (
    rate(http_server_request_duration_seconds_bucket{
      service_name="payments-checkout-api",
      deployment_environment="prod"
    }[5m])
  )
)
```

### 19.2 LogQL

Stream labels stay dotted in this schema; Loki accepts both, but for consistency with the OTel
resource attribute, use dots.

```logql
{service_name="payments-checkout-api", severity="ERROR"}
| json
| workflow_name="checkout"
| line_format "{{.message}} (trace_id={{.trace_id}})"
```

`workflow_name` is structured metadata (§7.3), not a stream selector.

### 19.3 Tempo

```text
{ service.name = "payments-checkout-api"
  && deployment.environment = "prod"
  && status = error
}
```

For exemplar-driven drilldowns, link from a Mimir histogram panel using the `{__address__}` exemplar
and Tempo trace ID.

---

## 20. Governance Operating Model

### 20.1 Platform team owns

- Schema standards (this document)
- Collector policies (Alloy gateway config)
- Approved dimension catalog (registry repo)
- Sampling policies
- Dashboards / templates
- Semantic convention version pinning

### 20.2 Application team owns

- Business instrumentation
- Workflow spans
- Service-level metrics inside the registry's allowed set
- Domain-specific alerts (subject to platform review)

### 20.3 Schema change process

1. Cardinality review — pair with Cardinality Budget Calculator
2. Query impact assessment (does it break dashboards / alerts?)
3. Storage cost evaluation (Mimir series count delta, Loki stream delta, Tempo span size delta)
4. ADR — use `adr-writer` skill, file under adrs/
5. Governance approval (platform team async sign-off)
6. Registry PR + dual-emission window where applicable (§15)

---

## 21. Maturity Model

| Level | Description                                                      |
| ----- | ---------------------------------------------------------------- |
| L1    | Unstructured logs, inconsistent labels                           |
| L2    | Basic OTel adoption                                              |
| L3    | Standardised service / resource schema                           |
| L4    | Governance + sampling + collector enforcement                    |
| L5    | SLO-aligned telemetry platform with cost attribution and budgets |

Target state: **L4 → L5** within the 90-day horizon.

---

## 22. Recommended Next Steps

### Immediate (≤ 14 days)

1. Publish the approved label catalog as a registry repo
2. Deploy two-tier collector (agent + gateway) per region (§13)
3. Enable head sampling defaults via service template
4. Standardise service naming (§5)
5. Enforce structured logging in CI (lint rule, .NET analyser + Python `flake8-logging`)

### 30 days

1. Build schema registry with PR-based change flow
2. Introduce gateway-tier validation (drop-on-violation + observability)
3. Remove high-cardinality labels from existing metrics (audit + migrate)
4. Standardise dashboards from registry (`grafana-tf` modules)
5. Define SLO templates per service archetype (sync API, async worker, batch)

### 90 days

1. Cost attribution wired to [[metric-label-standards|metric-label-standards.md]]
2. Implement telemetry budgets (§9.3) with alerting at 80%
3. Add governance CI checks (semconv pin, label allow-list, exporter config)
4. Platform scorecards (per-team telemetry quality)
5. Telemetry quality SLIs (drop rate, schema-violation rate, gateway uptime)

---

## 23. Anti-Patterns (normative)

This list is the single normative source — rules elsewhere in the doc derive from these.

- Raw URLs in metric labels (use `http.route`)
- Request / user / session IDs as labels
- Per-user metrics
- Free-form labels not in the registry
- Logging entire request / response payloads
- Inconsistent service naming
- Direct SDK-to-backend export at scale (skip the agent or gateway)
- Unbounded `workflow.name` cardinality (workflow names must be from a registry)
- Dynamic metric creation (metric names must be statically declarable)
- Disabling head sampling and relying on tail-only
- Stream-label expansion past 6 fields
- Mixing Jaeger + W3C propagation on the same producer

---

## 24. Recommended Reference Stack

| Layer      | Recommendation                                 |
| ---------- | ---------------------------------------------- |
| SDK        | OpenTelemetry (semconv 1.26 pinned)            |
| Agent      | Grafana Alloy (DaemonSet, per-pod sidecar opt) |
| Gateway    | Grafana Alloy (StatefulSet, per region)        |
| Metrics    | Mimir                                          |
| Logs       | Loki 3.x (structured metadata enabled)         |
| Traces     | Tempo                                          |
| Dashboards | Grafana                                        |
| Alerting   | Grafana Alerting + Mimir alertmanager          |
| Governance | GitOps schema registry + Alloy policy          |

---

## 25. See Also

- [[metric-label-standards|metric-label-standards.md]] — billing/cost-attribution label contract;
  this doc and that one MUST agree on `team.name`, `business_unit`, `product`, `env`.
- [[observability-overview|observability-overview.md]] — pillar overview.
- [[kpis-slis-slos-slas|kpis-slis-slos-slas.md]] — SLO definitions and burn-rate methodology.
- [[security-access-compliance|security-access-compliance.md]] — audit log retention, PII redaction
  context.
- ADRs governing this schema: see adrs/ (`telemetry-*`, `observability-*`, semconv-pinning).
- Cardinality Budget Calculator skill — gate before any new label ships.

---

## 26. Final Recommendation

The stated scale profile (50 apps × 12 teams × multi-region × dual runtime) requires:

- Centralised, two-tier collector architecture
- Enforced schema governance with collector-level rejection
- Federated ownership: platform owns the schema, teams own the instrumentation
- Aggressive cardinality controls with per-team budgets
- SLO-driven instrumentation, not vanity dashboards
- Tail-based production sampling on top of a non-zero head sample floor

Without governance, telemetry growth becomes nonlinear:

- Query latency increases
- MTTR rises
- Dashboard trust collapses
- Storage cost accelerates
- Cross-team debugging degrades

The schema itself is part of platform reliability engineering — treat changes to it with the same
rigour as changes to a production API.
