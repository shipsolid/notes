---
title: "2026-05-21 — billing-service elevated latency"
description: "- **Incident Commander:** On-call Engineer (Platform SRE)"
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-06-09
hidden: false
zettelId: "202606092223-5"
relations:
  - slug: projects/platform-shipsolid/04-operations-incident-response/alert-runbooks/api-gateway-5xx-high
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/slo-registry
    kind: depends_on
  - slug: projects/platform-shipsolid/01-platform-architecture/platform-overview
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/post-mortems/_template
    kind: related
---

<!-- Immutable record. Lock as read-only after 30 days. Action items tracked in SNOW. -->

## 2026-05-21 — billing-service elevated latency

- **Incident Commander:** On-call Engineer (Platform SRE)
- **Severity:** SEV2
- **Status:** published
- **Incident Start:** 2026-05-21 14:02 UTC
- **Incident End:** 2026-05-21 14:55 UTC
- **MTTR:** 00:53
- **Impacted:** billing-service (prod), api-gateway billing/checkout routes, all tenants

## Summary

On 2026-05-21 at 14:02 UTC, a routine billing-service deploy lowered the database connection-pool
maximum from 50 to 10 connections via a Helm values change. Under normal prod load the pool was
immediately exhausted; requests queued waiting for a free connection, driving billing-service p99
latency from ~180 ms to >8 s. The latency propagated to api-gateway, which began returning 504s on
billing and checkout routes. The incident was detected at 14:09 UTC by the api-gateway latency
burn-rate alert and mitigated by an Argo rollback at 14:48 UTC; full recovery was confirmed at 14:55
UTC.

## Impact

| Dimension                | Value                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| User-facing impact       | ~9% of all prod API requests timed out or were slow (billing + checkout routes); other routes unaffected |
| Duration                 | 00:53 (14:02–14:55 UTC)                                                                                  |
| Services affected        | billing-service (direct), api-gateway (propagated 504s on billing/checkout)                              |
| Clusters affected        | prod (all 3 AZs); dev/qa unaffected                                                                      |
| SLO impact               | billing-service latency SLO: ~38% of the 30-day error budget consumed in 53 min                          |
| Estimated revenue impact | Not quantified — checkout retries largely succeeded post-recovery                                        |

## Timeline

_All times UTC._

| Time (UTC) | Event                                                                                                                                                | Who                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 14:02      | billing-service v2.41.0 deployed to prod via Argo Rollouts; `db.pool.max` lowered 50 → 10 in Helm values                                             | Service Team          |
| 14:04      | billing-service p99 latency begins climbing; DB connection-wait time rises in metrics                                                                | —                     |
| 14:09      | `ShipSolidApiGatewayLatencyBurnRate` fires (api-gateway p99 on billing routes > SLO threshold, 14.4× burn)                                           | Alerting system       |
| 14:10      | On-call paged via Grafana IRM; incident declared SEV2 in IRM                                                                                         | On-call Engineer      |
| 14:14      | OBSERVE — gateway 504s scoped to billing/checkout routes; upstream confirmed as billing-service (Tempo traces show queueing in billing, not gateway) | On-call Engineer      |
| 14:22      | Hypothesis: billing-service latency, not gateway. billing-service dashboard shows DB connection-pool saturation at 100%, wait-time p99 > 7s          | On-call Engineer      |
| 14:31      | Recent-change check: billing-service v2.41.0 deployed at 14:02 correlates with onset; diff shows `db.pool.max` reduced 50 → 10                       | On-call Engineer      |
| 14:36      | Root cause identified: pool max too low for prod concurrency → pool exhaustion → request queueing                                                    | On-call Engineer      |
| 14:48      | Mitigation: `kubectl argo rollouts undo billing-service -n prod` (revert to v2.40.3)                                                                 | On-call Engineer      |
| 14:52      | Pool saturation drops; billing-service p99 returns toward baseline; gateway 504s clear                                                               | —                     |
| 14:55      | Recovery confirmed against SLIs for 10 min stable window; all-clear declared                                                                         | On-call Engineer (IC) |

## Root cause

**Signal → Symptom → Root Cause**

- **Signal:** `ShipSolidApiGatewayLatencyBurnRate` fired at 14:09 — api-gateway p99 on
  billing/checkout routes breaching the latency SLO.
- **Symptom:** billing-service p99 latency spiked from ~180 ms to >8 s; the api-gateway returned
  504s on the routes that proxy to billing-service. Tempo traces showed time spent **waiting for a
  DB connection**, not in query execution.
- **Root cause:** billing-service v2.41.0 set `db.pool.max: 10` (down from 50) in its Helm values.
  At normal prod concurrency the 10-connection pool was exhausted within seconds; subsequent
  requests blocked waiting for a free connection, queued, and eventually timed out at the gateway.
  The DB itself was healthy throughout — the bottleneck was entirely client-side pool sizing.

### 5 Whys

1. **Why** did billing-service latency spike? → Requests queued waiting for a free DB connection.
2. **Why** were requests waiting on connections? → The connection pool was exhausted under normal
   prod load.
3. **Why** was the pool exhausted? → The deploy lowered `db.pool.max` from 50 to 10, well below prod
   concurrency needs.
4. **Why** was an undersized pool value deployed to prod? → The change was made for a dev/qa cost
   experiment and merged without prod load validation; it passed CI because no test exercises pool
   saturation.
5. **Why** did nothing catch it before prod? → **Connection-pool sizing is not part of the
   Production Readiness Review (PRR) checklist**, so there was no gate requiring pool capacity to be
   validated against expected prod concurrency before promotion. _(Systemic gap.)_

### Contributing factors

- The Argo rollout used a fast promotion (no extended canary soak on billing-service), so 100% of
  prod billing traffic hit the undersized pool within ~2 minutes.
- The pool-saturation symptom surfaced first as a **gateway** 504 alert, not a billing-service alert
  — there is no direct burn-rate alert on billing-service DB connection-pool utilization, which
  added a triage hop.

## Resolution

Rolled billing-service back to v2.40.3 via `kubectl argo rollouts undo billing-service -n prod`,
restoring `db.pool.max: 50`. Connection-pool saturation cleared within ~4 minutes; billing-service
p99 returned to baseline and api-gateway 504s on billing/checkout routes stopped. Recovery was
confirmed against the billing-service latency SLI over a 10-minute stable window before all-clear.

## What went well / what didn't

**What went well**

- The api-gateway latency burn-rate alert fired within ~7 min of impact onset (14.4× burn), giving
  fast detection.
- Tempo traces immediately disambiguated gateway-vs-upstream — the IC correctly ruled out the
  gateway as the fault within 12 minutes.
- The recent-change check pointed straight at the 14:02 deploy; rollback was unambiguous and clean.

**What didn't**

- The undersized pool value reached prod with no load validation — CI has no test that exercises
  pool saturation.
- Fast (non-soaked) promotion meant 100% of billing traffic was affected almost immediately; a
  canary soak would have caught the saturation at low blast radius.
- Detection came via a gateway alert rather than a billing-service-native signal, adding a triage
  hop. No alert on billing-service DB connection-pool utilization.

## Action items

| Item                                                                                                 | Owner             | Due        | Status |
| ---------------------------------------------------------------------------------------------------- | ----------------- | ---------- | ------ |
| Add a "connection-pool sizing validated against expected prod concurrency" item to the PRR checklist | Platform SRE      | 2026-06-20 | open   |
| Add a Prometheus alert on billing-service DB connection-pool utilization (> 85% for 5m → SEV3)       | Service Team Lead | 2026-06-20 | open   |
| Require a minimum canary soak window for billing-service Argo rollouts before 100% promotion         | Service Team Lead | 2026-06-27 | open   |
| Add a load test that exercises DB pool saturation to billing-service CI                              | On-call Engineer  | 2026-07-04 | open   |

## Detection & response metrics

| Metric                 | Value                  | Target       |
| ---------------------- | ---------------------- | ------------ |
| Time to detect (TTD)   | ~00:07 (14:02 → 14:09) | < 5 min      |
| Time to engage (TTE)   | 00:01 (14:09 → 14:10)  | < 15 min     |
| Time to mitigate (TTM) | 00:38 (14:10 → 14:48)  | < 30 min     |
| MTTR                   | 00:53                  | per-tier SLA |

## References

- Post-mortem template:
  [[projects/platform-shipsolid/04-operations-incident-response/post-mortems/_template|Incident Post-Mortem Template]]
- Alert runbook: [[api-gateway-5xx-high|api-gateway 5xx / latency]]
- SLO: [[slo-registry|slo-registry.md]] — billing-service latency SLO
- Platform context: [[platform-overview|platform-overview.md]]
- Triggering deploy: billing-service v2.41.0 (`db.pool.max` 50 → 10)
