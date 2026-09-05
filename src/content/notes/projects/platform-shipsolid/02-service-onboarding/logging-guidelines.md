---
title: "Logging Implementation Guidelines"
description: "**Applies to:** All teams deploying services to the ShipSolid SRE Observability platform (AKS, Azure"
tags: ["ShipSolid", "Onboarding"]
updated: 2026-05-01
hidden: false
zettelId: "202510130815"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/logging
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/logs-instrumentation-guide
    kind: related
---

## Logging Implementation Guidelines

**Applies to:** All teams deploying services to the ShipSolid SRE Observability platform (AKS, Azure
Container Apps, on-premises VMs).

> **Related:** See the
> [[projects/platform-shipsolid/02-service-onboarding/logging|Logging Contract]] for the mandatory
> log format and field requirements. These guidelines cover the platform-level setup — how logs flow
> from your pod to Loki and how to configure that pipeline correctly. See also the
> [[projects/platform-shipsolid/02-service-onboarding/logs-instrumentation-guide|Logs Instrumentation Guide]]
> for the application-side code snippets.

---

## How Logs Flow to Loki

```
Application (stdout/stderr)
    → Kubelet log files (/var/log/pods/...)
        → Grafana Alloy DaemonSet (log collection + filter pipeline)
            → Grafana Cloud Loki
```

The Alloy DaemonSet runs one pod per AKS node and tails all pod logs automatically. It applies a
**level-based filter** before forwarding to Loki:

| Namespace type            | Levels forwarded | Levels dropped                   |
| ------------------------- | ---------------- | -------------------------------- |
| Application namespaces    | `warn`, `error`  | `trace`, `debug`, `info`         |
| Infrastructure namespaces | `error` only     | `trace`, `debug`, `info`, `warn` |

**No action is needed to enable log collection.** If your pod writes valid JSON logs to stdout,
Alloy will pick them up automatically. The only requirements are:

1. Your log lines are valid JSON (one object per line)
2. The JSON contains a recognizable level field (see
   [[projects/platform-shipsolid/02-service-onboarding/logging|Logging Contract]])

---

## AKS: Default Setup (No Configuration Required)

For services running in standard application namespaces (`*-app`, `*-api`, `*-svc`), log collection
is automatic.

**Verify your logs are reaching Loki:**

1. Open Grafana → Explore → Loki
2. Run: `{namespace="your-namespace"} | json`
3. If logs appear, no further setup is needed

**If logs are missing:**

- Confirm your app writes to `stdout` (not a file)
- Confirm the JSON is valid — use `kubectl logs <pod>` and pipe through `jq .` to check
- Confirm the `level` field is present and uses a standard value (`warn`, `warning`, `error`, etc.)

---

## AKS: Opting Into DEBUG Logs (Development Namespaces Only)

By default, `debug` and `info` logs are dropped. If you need them in a development namespace,
contact the SRE team to add a namespace override to the Alloy config. This is only permitted in
`dev` namespaces — never in `qa` or `prod`.

---

## Azure Container Apps (ACA)

Container Apps logs are collected via the Grafana Alloy
[[patterns/09-cloud-native-patterns/01-sidecar/01-sidecar|sidecar]] pattern. Follow the ACA
Implementation Guidelines for the sidecar setup.

The Alloy sidecar receives logs over OTLP and forwards them to Loki. Ensure:

- `OTEL_EXPORTER_OTLP_ENDPOINT` points to the sidecar (`http://127.0.0.1:4317`)
- Your app enriches logs with `loki.resource.labels` set to your service identifier
- The `OTEL_SERVICE_NAME` environment variable is set (used as the Loki stream label)

---

## On-Premises VMs

On-prem log collection is handled by Grafana Alloy deployed via Ansible. Alloy is configured to:

- Tail log files from known locations (configurable per host)
- Accept OTLP push from apps on port `4317`/`4318`

For new on-prem services, open a request with the SRE team to add your log file path to the
Ansible-managed Alloy config. Provide:

- File path(s) to tail (e.g., `C:\Logs\MyService\*.log`)
- Log format: JSON (preferred) or regex pattern for level extraction
- Target environment label (`dev`, `qa`, `prod`)

---

## Log Labels and Searchability

Alloy automatically injects the following labels on every log stream in AKS:

| Label       | Source                | Example                   |
| ----------- | --------------------- | ------------------------- |
| `namespace` | Pod metadata          | `mdixai-prod`             |
| `pod`       | Pod metadata          | `mdixai-api-7d9f8c-xk2lp` |
| `container` | Pod metadata          | `mdixai-api`              |
| `node`      | Node metadata         | `aks-nodepool1-12345-0`   |
| `env`       | Alloy pipeline config | `prod`                    |
| `cluster`   | Alloy pipeline config | `mf-aks-prod-ca-east`     |

You do not need to add these as fields in your application logs — Alloy injects them as stream
labels automatically.

**What to put in the log body (not labels):** `trace_id`, `span_id`, `request_id`, business context
fields. These are indexed as structured metadata in Loki and searchable via
`| json | field = "value"`.

---

## Querying Logs in Grafana

### Basic namespace query

```logql
{namespace="mdixai-prod"} | json
```

### Filter by level

```logql
{namespace="mdixai-prod"} | json | level = "error"
```

### Correlate with a trace

```logql
{namespace="mdixai-prod"} | json | trace_id = "4bf92f3577b34da6..."
```

### Aggregate error rate over time

```logql
sum by (container) (
  rate({namespace="mdixai-prod"} | json | level = "error" [5m])
)
```

---

## Retention Policy

| Environment | Retention |
| ----------- | --------- |
| `dev`       | 7 days    |
| `qa`        | 14 days   |
| `prod`      | 90 days   |

Logs older than the retention window are automatically deleted. For longer retention due to
compliance requirements, contact the SRE team.

---

## Common Issues

| Symptom                                    | Likely Cause                                | Fix                                                                                       |
| ------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------- |
| No logs in Loki for my service             | App writing to a file, not stdout           | Update logging config to use stdout handler                                               |
| Logs appear but level filter ignores level | Missing or non-standard `level` field       | Ensure JSON has `"level": "warn"` — not `"lvl"`, `"severity"`, etc.                       |
| `INFO` logs appearing in prod unexpectedly | Namespace miscategorized as dev in Alloy    | Raise with SRE team to fix namespace label in Alloy config                                |
| Structured fields not searchable           | Logs are plain text, not JSON               | Switch to JSON formatter (see [[projects/platform-shipsolid/02-service-onboarding/logging | Logging Contract]]) |
| Log volume spike causing cost alert        | `INFO`/`DEBUG` accidentally enabled in prod | Check `MinimumLevel` in app config and framework logger overrides                         |

---

## Validation Checklist

- [ ] `kubectl logs <pod>` output is valid JSON (one object per line)
- [ ] Logs appear in Grafana Loki under the correct namespace
- [ ] `level` field is present and uses a standard value
- [ ] `trace_id` and `span_id` are injected when a trace context is active
- [ ] No `INFO` or lower logs appear in Loki for `qa`/`prod` namespaces
- [ ] No PII is present in any log field
