---
title: "Logs Instrumentation Guide"
description: "How to instrument a service for **logs** on the ShipSolid observability platform."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-14"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/logging-guidelines
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/retention-policy
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/logging
    kind: related
---

## Logs Instrumentation Guide

How to instrument a service for **logs** on the ShipSolid observability platform. Full platform-side
detail: [[logging-guidelines|Logging Implementation Guidelines]].

---

## How Logs Reach Loki

```
Application (stdout/stderr)
    → Kubelet log files (/var/log/pods/...)
        → Grafana Alloy DaemonSet (log collection + filter pipeline)
            → Grafana Cloud Loki
```

The Alloy DaemonSet tails all pod logs automatically. It applies a level-based filter before
forwarding:

| Namespace type            | Levels forwarded | Levels dropped                   |
| ------------------------- | ---------------- | -------------------------------- |
| Application namespaces    | `warn`, `error`  | `trace`, `debug`, `info`         |
| Infrastructure namespaces | `error` only     | `trace`, `debug`, `info`, `warn` |

**No code change is needed to enable log collection.** Write valid JSON to stdout and Alloy picks it
up automatically.

---

## Standard: Structured JSON Logs

One JSON object per line. Required fields:

| Field       | Type   | Example                                      |
| ----------- | ------ | -------------------------------------------- |
| `level`     | string | `warn`, `error` — standard casing only       |
| `message`   | string | `"payment gateway timeout"`                  |
| `timestamp` | string | ISO-8601 UTC                                 |
| `trace_id`  | string | OTel trace ID — inject when a span is active |
| `span_id`   | string | OTel span ID — inject when a span is active  |

Keep high-cardinality detail (`request_id`, `user_id`, query parameters) in the log **body** only —
never in Loki stream labels.

### .NET 8 / Serilog

```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Warning()   // only warn+ reaches Loki in prod
    .WriteTo.Console(new JsonFormatter())
    .Enrich.WithProperty("service.name", "billing-service")
    .CreateLogger();

// Inject trace context (requires OpenTelemetry Serilog sink)
Log.Warning("Downstream timeout {@Details}", new { url, statusCode, latency_ms });
```

### Python

```python
import logging, json, sys
from opentelemetry import trace

def json_log(level, message, **kwargs):
    span = trace.get_current_span().get_span_context()
    payload = {
        "level": level,
        "message": message,
        "trace_id": format(span.trace_id, "032x") if span.is_valid else None,
        "span_id":  format(span.span_id,  "016x") if span.is_valid else None,
        **kwargs,
    }
    print(json.dumps(payload), file=sys.stdout)
```

### Node.js / pino

```js
const pino = require('pino');
const logger = pino({ level: 'warn', formatters: { level: l => ({ level: l }) } });

// trace_id / span_id injected via pino-opentelemetry or manual enrichment
logger.error({ trace_id, span_id, url, status }, 'Upstream error');
```

---

## AKS — Default Setup (No Configuration Required)

For services in standard application namespaces (`*-app`, `*-api`, `*-svc`), collection is
automatic.

**Verify logs are reaching Loki:**

```logql
{namespace="your-namespace"} | json
```

If logs appear, nothing else is needed. If missing:

- Confirm the app writes to `stdout`, not a file.
- Confirm valid JSON: `kubectl logs <pod> | jq .`
- Confirm `level` is present and uses a standard value.

**Debug logs in dev namespaces:** Contact the SRE team to add a namespace override in the Alloy
config. Debug logs are only permitted in `dev` — never `qa` or `prod`.

---

## Azure Container Apps (ACA)

Logs are collected via the Grafana Alloy
[[patterns/09-cloud-native-patterns/01-sidecar/01-sidecar|sidecar]]. Follow the ACA Implementation
Guidelines.

Required env vars on your container:

```yaml
OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4317"   # sidecar
OTEL_SERVICE_NAME: "billing-service"
```

---

## Labels Alloy Injects Automatically (AKS)

You do not need to add these as fields in your application logs:

| Label       | Source                | Example                    |
| ----------- | --------------------- | -------------------------- |
| `namespace` | Pod metadata          | `billing-prod`             |
| `pod`       | Pod metadata          | `billing-api-7d9f8c-xk2lp` |
| `container` | Pod metadata          | `billing-api`              |
| `node`      | Node metadata         | `aks-nodepool1-12345-0`    |
| `env`       | Alloy pipeline config | `prod`                     |
| `cluster`   | Alloy pipeline config | `ss-aks-prod-eastus`       |

---

## LogQL Examples

```logql
# All logs for a namespace
{namespace="billing-prod"} | json

# Filter by level
{namespace="billing-prod"} | json | level = "error"

# Correlate with a trace
{namespace="billing-prod"} | json | trace_id = "4bf92f3577b34da6..."

# Error rate by container
sum by (container) (
  rate({namespace="billing-prod"} | json | level = "error" [5m])
)
```

---

## Retention Policy

| Environment | Retention |
| ----------- | --------- |
| `dev`       | 7 days    |
| `qa`        | 14 days   |
| `prod`      | 90 days   |

For compliance-driven longer retention, contact the SRE team.

---

## Troubleshooting

| Symptom                              | Likely cause                          | Fix                                                        |
| ------------------------------------ | ------------------------------------- | ---------------------------------------------------------- |
| No logs in Loki                      | App writing to a file, not stdout     | Update logging config to use stdout handler                |
| Logs appear but level filter ignored | Missing or non-standard `level` field | Ensure `"level": "warn"` — not `"lvl"`, `"severity"`       |
| `INFO` in prod unexpectedly          | Namespace miscategorised in Alloy     | Raise with SRE team to fix namespace label                 |
| Structured fields not searchable     | Plain text, not JSON                  | Switch to JSON formatter                                   |
| Log volume spike causing cost alert  | `INFO`/`DEBUG` enabled in prod        | Check `MinimumLevel` in app config and framework overrides |

---

## Validation Checklist

- [ ] `kubectl logs <pod>` output is valid JSON (one object per line)
- [ ] Logs appear in Grafana Loki under the correct namespace
- [ ] `level` field is present and uses a standard value
- [ ] `trace_id` and `span_id` are injected when a trace context is active
- [ ] No `INFO` or lower logs appear in Loki for `qa`/`prod` namespaces
- [ ] No PII is present in any log field

---

## Related

- [[naming-and-label-schema|Naming & Label Schema]]
- [[logging-guidelines|Logging Implementation Guidelines]]
- [[retention-policy|Retention Policy]]
- [[projects/platform-shipsolid/02-service-onboarding/logging|Logging Contract]] — the mandatory log
  format this guide implements.
