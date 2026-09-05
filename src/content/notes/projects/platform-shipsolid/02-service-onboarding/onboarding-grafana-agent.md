---
title: "Onboarding a New Service to the Observability Platform"
description: "**Owner:** SRE Team **Last Updated:** 2025-05-01 **Applies to:** Any new service being deployed to"
tags: ["ShipSolid", "Onboarding"]
updated: 2026-05-01
hidden: false
zettelId: "202510130815-2"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/logging
    kind: depends_on
  - slug: projects/platform-shipsolid/02-service-onboarding/metrics
    kind: depends_on
  - slug: projects/platform-shipsolid/02-service-onboarding/tracing
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/alerting
    kind: depends_on
---

## Playbook: Onboarding a New Service to the Observability Platform

**Owner:** SRE Team **Last Updated:** 2025-05-01 **Applies to:** Any new service being deployed to
AKS, Azure Container Apps, or on-premises infrastructure monitored by the ShipSolid Grafana Cloud
platform.

---

## Overview

This playbook walks through the end-to-end steps to onboard a new service into the observability
platform. Complete all steps in order. Steps marked **[Team]** are the responsibility of the service
team; steps marked **[SRE]** require SRE involvement.

**Estimated time:** 2–4 hours for a standard AKS service with no custom requirements.

---

## Prerequisites

Before starting, confirm the following:

- [ ] Service is deploying to a supported environment (AKS, ACA, or on-prem VM)
- [ ] The service has a unique `service.name` agreed upon with the SRE team (e.g., `mdixai-api`)
- [ ] The deployment namespace follows the naming convention: `{product}-{env}` (e.g.,
      `mdixai-prod`)
- [ ] The team has read the contracts:
      [[projects/platform-shipsolid/02-service-onboarding/logging|Logging]],
      [[projects/platform-shipsolid/02-service-onboarding/metrics|Metrics]],
      [[projects/platform-shipsolid/02-service-onboarding/tracing|Tracing]],
      [[projects/platform-shipsolid/05-platform-configuration/alerting|Alerting]]

---

## Step 1: Instrument the Application [Team]

### 1a. Logging

Configure structured JSON logging per the
[[projects/platform-shipsolid/02-service-onboarding/logging|Logging Contract]].

- .NET: Use Serilog with `CompactJsonFormatter`, minimum level `Warning` in non-dev environments
- Python: Use `python-json-logger` or `structlog`, configured to emit JSON to stdout
- All other runtimes: Emit one JSON object per line to stdout with `timestamp`, `level`, `service`,
  `message` fields

### 1b. Metrics

Expose a `/metrics` endpoint per the
[[projects/platform-shipsolid/02-service-onboarding/metrics|Metrics Contract]].

- .NET: Add `prometheus-net.AspNetCore`, call `app.UseHttpMetrics()` and
  `app.MapMetrics("/metrics")`
- Python: Add `prometheus-client`, expose via `make_asgi_app()` mounted at `/metrics`
- Add the pod annotation: `k8s.grafana.com/scrape: "true"` with the correct port

### 1c. Tracing

Configure OpenTelemetry tracing per the
[[projects/platform-shipsolid/02-service-onboarding/tracing|Tracing Contract]].

- Add the Kubernetes Downward API env var `NODE_IP` pointing to `status.hostIP`
- Set `OTEL_EXPORTER_OTLP_ENDPOINT` to `http://$(NODE_IP):4317`
- Configure resource attributes: `service.name`, `service.version`, `deployment.environment`
- Inject `trace_id` and `span_id` into structured log records

---

## Step 2: Deploy to AKS and Verify Telemetry [Team]

Deploy to the `dev` namespace first.

### Verify logs

```bash
kubectl logs -n {product}-dev -l app={service-name} | head -20 | jq .
```

Confirm output is valid JSON with `timestamp`, `level`, `service`, `message` fields.

Then check Grafana Loki:

- Grafana → Explore → Loki
- Query: `{namespace="{product}-dev"} | json | level = "error"`

### Verify metrics

```bash
kubectl port-forward -n {product}-dev svc/{service-name} 9090:9090
curl http://localhost:9090/metrics | head -30
```

Check Grafana → Explore → Metrics:

- Query: `{__name__=~"{service_prefix}.*"}`

### Verify traces

Run a few requests through the service, then check:

- Grafana → Explore → Tempo
- Search by `service.name = "{service-name}"`
- Confirm spans appear with correct resource attributes

---

## Step 3: Request SRE Setup [Team → SRE]

Open a ticket or Slack the SRE team with the following information:

```
Service name:        <service.name value>
Namespace:           <product>-<env>
Environment(s):      dev / qa / prod
Metrics port:        <port number>
Team/product label:  <team name for RBAC and alerting>
Grafana folder:      <existing folder or request new one>
Alert contact:       <MS Teams channel or BigPanda assignment group>
```

### SRE will provision

- [ ] Grafana folder for the team/product (if not already exists)
- [ ] RBAC assignment: team members added to the correct Grafana team
- [ ] ServiceMonitor or annotation verification in the Alloy scrape config
- [ ] Loki label override if namespace naming differs from convention
- [ ] Synthetic monitor (if requested)

---

## Step 4: Author Initial Alerts [Team + SRE]

Per the [[projects/platform-shipsolid/05-platform-configuration/alerting|Alerting Contract]]:

1. Identify the top 3–5 alert conditions for your service (CPU, memory, error rate, latency, custom
   SLIs)
2. Create alert JSON files in `grafana_alerts/payload/{product}/tmp/dev/`
3. Set `isPaused: true` initially
4. Deploy to dev/qa via the `alerts-grafana.yml` GitHub Actions workflow
5. Observe and calibrate thresholds over 1–2 weeks
6. Move finalized alerts to `{product}.{env}.json` and set `isPaused: false`
7. Open a PR for SRE review before promoting to prod

---

## Step 5: Create a Service Dashboard [Team]

Create a basic service dashboard in Grafana under your team folder with:

- **Golden signals panel:** request rate, error rate, latency (p50/p95/p99)
- **Resource panel:** CPU and memory usage vs. limits
- **Log panel:** Loki log stream for `level = "error"` or `level = "warn"`
- **Trace panel:** Top slow traces from Tempo

Export as JSON and commit to `f-observability/` under your team folder.

---

## Step 6: Validate in Production [Team + SRE]

Before go-live:

- [ ] All telemetry (logs, metrics, traces) confirmed in `prod` namespace
- [ ] At least one P2 or P3 alert is active (not paused) and routing to BigPanda
- [ ] Dashboard is accessible by the team in Grafana
- [ ] SRE team has reviewed and signed off on alert thresholds
- [ ] Runbook link is set in at least one alert annotation (`runbook_url`)

---

## Rollback / Offboarding

If a service is decommissioned:

1. Pause all alerts (`isPaused: true`) and remove from production alert file via PR
2. Notify SRE to remove the ServiceMonitor or annotation-based scrape config
3. Archive the dashboard (do not delete — retain for audit trail)
4. SRE removes the Grafana team RBAC assignment for the decommissioned service

---

## Contacts

| Role                     | Contact                         |
| ------------------------ | ------------------------------- |
| SRE Platform team        | `#sre-observability` (MS Teams) |
| Grafana Cloud admin      | SRE team Slack/Teams channel    |
| Alert routing (BigPanda) | SRE team                        |
