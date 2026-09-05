---
title: "Quickstart: Onboard in 30 Minutes"
description: "Get a service emitting metrics, logs, and traces to Grafana Cloud in **30 minutes**."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-3"
---

## Quickstart: Onboard in 30 Minutes

## Purpose

Get a service emitting metrics, logs, and traces to Grafana Cloud in **30 minutes**.

## Before you start

- [ ] Your service runs in AKS (or has an Alloy collection path).
- [ ] You can deploy via Helm.
- [ ] You have a `glc_`-prefixed Grafana Cloud access-policy token (**not** a `glsa_`
      service-account token).

## The 30-minute path

1. **Pick your signals** (5 min) — decide what metrics/logs/traces matter. See
   [[signal-catalog|Signal Catalog]].
2. **Instrument with OTel** (10 min) — add the OpenTelemetry SDK/auto-instrumentation. See the
   [[metrics-instrumentation-guide|Metrics]] / [[logs-instrumentation-guide|Logs]] /
   [[traces-instrumentation-guide|Traces]] guides.
3. **Apply the label schema** (5 min) — `service.name`, `env`, `cluster`, team. See
   [[naming-and-label-schema|Naming & Label Schema]].
4. **Deploy the collector** (5 min) — Helm values snippet routing to the OTLP endpoint via Alloy.
5. **Verify** (5 min) — confirm data lands in Mimir/Loki/Tempo; import the starter dashboard.

## Verify it worked

```bash
# confirm series are arriving (replace with your service.name)
# query Mimir via Grafana Explore: count(up{service_name="my-service"})
```

> `[stub: quickstart-verify-commands]` — fill this in. Greppable doc-debt marker.

## Next steps

- Register in the [[service-catalog|Service Catalog]].
- Define your first SLO: [[slo-registry|SLO Registry]].
- Complete the [[onboarding-checklist|Onboarding Checklist]].
