---
title: "9. Practice Interview Questions"
description: "Twelve full-length practice prompts for the telemetry ingestion pipeline design, each linked to its own worked, principal-level answer."
tags: ["system-design", "observability", "telemetry", "maang-prep", "practice-questions"]
hidden: false
zettelId: "202607161608"
relations:
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-26-q1-answer-500m-ingest-zero-drop-rolling-deploy
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-27-q2-answer-cardinality-storm-detection-mitigation
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-32-q7-answer-regional-gateway-outage-blast-radius
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-33-q8-answer-delta-cumulative-counter-reset-bug
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-36-q11-answer-compromised-agent-threat-model
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — this is §9
> of the full design, split into its own file so the root stays a table of contents.

## 9. Practice Interview Questions

1. [[05-26-q1-answer-500m-ingest-zero-drop-rolling-deploy|Design a telemetry ingestion pipeline that can ingest 500M metric]]
   samples/sec from 100K services globally. The system must never drop data during a rolling
   deployment of the ingestion tier.

2. [[05-27-q2-answer-cardinality-storm-detection-mitigation|A tenant is sending 50M unique label combinations per minute and causing TSDB compaction storms. How does your pipeline detect and mitigate this without affecting other tenants?]]

3. [[05-28-q3-answer-trace-sampling-incident-peak-redesign|Your trace sampling pipeline is losing spans during incident peaks — exactly when you need traces most. How do you redesign it?]]

4. [[05-29-q4-answer-metric-point-journey-failure-points|Walk me through how a single metric data point travels from a Kubernetes pod to being queryable in a dashboard. Identify every failure point and how you'd detect it.]]

5. [[05-30-q5-answer-add-continuous-profiling-signal|How would you add a new signal type (continuous profiling) to an existing metrics + logs + traces pipeline without a full redesign?]]

6. [[05-31-q6-answer-compactor-storm-diagnosis|The compactor queue is backing up and query latency is spiking during a large multi-tenant flush. Diagnose the failure mode and describe how you'd mitigate it without pausing ingestion.]]

7. [[05-32-q7-answer-regional-gateway-outage-blast-radius|One region's ingestion gateway just went dark for 10 minutes. Walk through what happens to agents, to buffered data, and to dashboards during that window — then explain what you'd change in the design to shrink the blast radius.]]

8. [[05-33-q8-answer-delta-cumulative-counter-reset-bug|A tenant upgraded their OTel SDK and now every counter in their dashboard resets to zero every few minutes. Diagnose the root cause and fix it without asking the tenant to change their instrumentation.]]

9. [[05-34-q9-answer-cost-reduction-40-percent|You're asked to cut ingestion infrastructure cost by 40% without violating any SLOs. Where do you look first, and what are you willing to trade away?]]

10. [[05-35-q10-answer-self-service-tenant-onboarding|Design self-service tenant onboarding: a new tenant should be able to start sending telemetry via an API call with zero platform-team involvement, while the platform still protects itself from a misbehaving or malicious new tenant on day one.]]

11. [[05-36-q11-answer-compromised-agent-threat-model|Assume a compromised agent is sending malformed and adversarial payloads — oversized batches, spoofed tenant IDs, garbage label values. Redesign the ingestion frontier for this threat model.]]

12. [[05-37-q12-answer-mixed-exactly-once-billing-tenant|You must support exactly-once ingestion for one tenant because their metric samples drive billing, while every other tenant stays at-least-once. Where in the pipeline does that requirement have to be enforced, and what does it cost you?]]
