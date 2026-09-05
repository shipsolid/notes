---
title: "Runbook — ShipSolidApiGateway5xxHigh"
description: "- **Service:** api-gateway - **Owner Team:** Platform SRE"
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-06-09
hidden: false
zettelId: "202606092223-4"
relations:
  - slug: projects/platform-shipsolid/03-reliability-engineering/slo-registry
    kind: depends_on
  - slug: projects/platform-shipsolid/04-operations-incident-response/post-mortems/2026-05-21-billing-service-latency-postmortem
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/incident-response-playbook
    kind: depends_on
  - slug: projects/platform-shipsolid/04-operations-incident-response/severity-definitions
    kind: depends_on
---

## Runbook — ShipSolidApiGateway5xxHigh

<!-- Review cadence: 90 days. If the alert fires and the runbook is wrong, fix it before closing the incident. -->

- **Service:** api-gateway
- **Owner Team:** Platform SRE
- **Grafana dashboard:** `ShipSolid / api-gateway / Overview` (env=prod)
- **SLO document:** [[slo-registry|slo-registry.md]] — api-gateway availability

## Alert

- **Name:** `ShipSolidApiGateway5xxHigh`
- **Fires when:** the api-gateway 5xx ratio exceeds **2% for 5m** (per-cluster, prod).

  ```promql
  (
    sum(rate(http_server_request_duration_seconds_count{service="api-gateway", http_response_status_code=~"5..", env="prod"}[5m]))
    /
    sum(rate(http_server_request_duration_seconds_count{service="api-gateway", env="prod"}[5m]))
  ) > 0.02
  ```

- **Severity:** SEV2

## Impact

api-gateway fronts all external traffic for ~40 services across 3 AKS clusters (dev/qa/prod). A
sustained 5xx ratio above 2% in prod means a meaningful share of **every tenant's** API calls are
failing at the edge — checkout, auth, billing reads, and webhooks all degrade together. Customers
see failed requests and retries; the availability error budget for api-gateway burns fast. Left
unaddressed this can escalate to SEV1 if the ratio climbs or the gateway begins shedding load.

## Diagnose (non-destructive first)

OBSERVE before you ACT. Do not restart or roll anything back until steps 1–5 are done.

### Step 1 — Confirm the alert is real

- Open the `ShipSolid / api-gateway / Overview` dashboard, env=prod, last 30m.
- Is the 5xx ratio genuinely above 2% in the last 5 minutes, or is this a flap that is already
  recovering?

  ```promql
  sum(rate(http_server_request_duration_seconds_count{service="api-gateway", http_response_status_code=~"5..", env="prod"}[5m]))
  / sum(rate(http_server_request_duration_seconds_count{service="api-gateway", env="prod"}[5m]))
  ```

  > If the spike was <2 min and is already dropping, monitor for 5 minutes before escalating. Log
  > the observation time and outcome.

### Step 2 — Scope the blast radius

- Break the error ratio down by route and upstream to find where the 5xx are concentrated:

  ```promql
  topk(10,
    sum by (http_route, upstream) (
      rate(http_server_request_duration_seconds_count{service="api-gateway", http_response_status_code=~"5..", env="prod"}[5m])
    )
  )
  ```

- Is it one route/upstream (likely a single backend) or broad (likely the gateway itself)?
- Confirm which cluster: filter `cluster=~"prod-.*"` and check whether one cluster dominates.

### Step 3 — Inspect logs (LogQL on api-gateway)

- Loki, error logs for the gateway in the incident window:

  ```logql
  {service="api-gateway", env="prod"} | json | status >= 500
    | line_format "{{.status}} {{.http_route}} -> {{.upstream}} {{.message}}"
  ```

- Look for the dominant failure mode: upstream timeouts (504), upstream connection refused/reset
  (502), gateway-internal errors (500), or upstream 503 passed through.

### Step 4 — Check for recent changes

- Deploys to api-gateway or its upstreams in the last 2 hours:

  - Argo Rollouts history: `kubectl argo rollouts get rollout api-gateway -n prod`
  - Helm release history: `helm history api-gateway -n prod`
  - GitHub Actions deploy log for the api-gateway repo.

  > If a deploy correlates with the alert start time, jump to [Remediate → rollback](#remediate).

### Step 5 — Check upstream service health (auth-service, billing-service)

- The most common cause of gateway 5xx is a degraded upstream, not the gateway itself.
- auth-service (every request is authenticated through it):

  ```promql
  sum(rate(http_server_request_duration_seconds_count{service="auth-service", http_response_status_code=~"5..", env="prod"}[5m]))
  / sum(rate(http_server_request_duration_seconds_count{service="auth-service", env="prod"}[5m]))
  ```

- billing-service (fronts checkout/billing routes):

  ```promql
  histogram_quantile(0.99,
    sum by (le) (rate(http_server_request_duration_seconds_bucket{service="billing-service", env="prod"}[5m]))
  )
  ```

  > If an upstream is the source, escalate to that service's on-call and treat this as an upstream
  > incident. Do not restart api-gateway while a backend is the actual fault.

### Step 6 — Trace the failures in Tempo

- In Tempo, search traces from `service.name=api-gateway` with `status=error` over the incident
  window. Follow the span tree to the failing upstream and read the error tag.
- Confirms which hop fails and whether it's a timeout (latency upstream) vs a hard error.

## Remediate

Only act once the source is confirmed. **Name the rollback path before any change.**

| Confirmed cause                                      | Action                                                                    | Rollback path                                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bad api-gateway deploy (correlates with alert start) | Roll back the rollout                                                     | **Argo:** `kubectl argo rollouts undo api-gateway -n prod` (reverts to previous ReplicaSet). Verify with `kubectl argo rollouts get rollout api-gateway -n prod`. |
| Bad api-gateway config / Helm values                 | Roll back the release                                                     | **Helm:** `helm rollback api-gateway <PREVIOUS_REVISION> -n prod` (use `helm history api-gateway -n prod` to pick the last-good revision).                        |
| Degraded upstream (auth-service / billing-service)   | Hand off to upstream on-call; do **not** restart the gateway              | Upstream owns rollback of their change.                                                                                                                           |
| Gateway resource saturation (CPU/mem, conn pool)     | Scale out: `kubectl scale deployment/api-gateway -n prod --replicas=<N+>` | Scale back to prior replica count once 5xx clears.                                                                                                                |

After remediating, confirm recovery: the 5xx ratio (Step 1 query) drops back below 2% and stays
there for at least 10 minutes, with no new error spikes in the LogQL stream (Step 3).

## Escalate

If the 5xx ratio is not trending down within **15 minutes** of beginning remediation, escalate to
the **Service Team Lead** for api-gateway (via Grafana IRM). If blast radius is expanding across
clusters or the ratio crosses 10%, escalate severity to SEV1 and open an IC war room.

## Related

- [[slo-registry|SLO Registry]] — api-gateway availability SLO and burn-rate policy.
- [[2026-05-21-billing-service-latency-postmortem|Post-mortem: 2026-05-21 — billing-service elevated latency]]
  — a related upstream-latency incident that surfaced via gateway burn-rate.
- [[platform-overview|Platform Overview]] — api-gateway's place in the estate and its upstreams.
- [[incident-response-playbook|Incident Response Playbook]] ·
  [[severity-definitions|Severity Definitions]]
- [[projects/platform-shipsolid/04-operations-incident-response/alert-runbooks/_template|Alert Runbook Template]]
  — the structure this runbook follows.
