---
title: "ADR-007: Adopt Two-Tier Grafana Alloy Collector Topology"
description: "- **Status**: Proposed - **Date**: 2026-05-07"
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202605072121-2"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/telemetry-schema-design
    kind: depends_on
  - slug: patterns/09-cloud-native-patterns/01-sidecar/01-sidecar
    kind: compared_to
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-pin-otel-semconv-126-shipsolid
    kind: related
  - slug: observability/reference/cardinality
    kind: related
---

## ADR-007: Adopt Two-Tier Grafana Alloy Collector Topology (Agent + Gateway)

- **Status**: Proposed
- **Date**: 2026-05-07
- **Authors**: [Amit Singh](mailto:amit.singh@shipsolid.com)
- **Deciders**: [Amit Singh](mailto:amit.singh@shipsolid.com) — pending platform team review
- **Supersedes**: N/A
- **Related RFC**: N/A
- **Project/Context**: ShipSolid observability platform — Azure Container Apps fleet, Grafana Cloud
  (Mimir + Loki + Tempo)

---

## 1. Context

The ShipSolid observability platform exports OpenTelemetry signals from 50+ Azure Container Apps
services to Grafana Cloud. Three concrete requirements shape the collector architecture:

1. **Tail-based sampling on traces.** Production trace volume is too large to ingest at 100%, but
   head-only sampling drops errors and slow requests proportionally to fast ones — the worst
   possible failure mode for incident response. Tail sampling (decide-after-the-trace-completes)
   requires the collector to see all spans of a trace before making the keep/drop decision. Per-pod
   agents do not have full-trace visibility because spans of a single trace can originate from
   multiple replicas / multiple services / multiple regions.
2. **Centralised PII redaction and schema enforcement.** The platform's PII contract
   ([[telemetry-schema-design|telemetry-schema-design.md]] §10) and cardinality registry (§9.2)
   cannot be enforced reliably if redaction logic is distributed across every replica's sidecar.
   Configuration drift between agents becomes inevitable; the audit story collapses.
3. **Egress cost and connection efficiency.** Direct SDK-to-Grafana-Cloud export at this scale
   produces N replicas × M services worth of TLS connections, each batching independently and
   inefficiently. A consolidation layer reduces network overhead and enables compression across
   services.

Three topologies are feasible:

- **Agent-only** — each pod / replica runs an Alloy agent (DaemonSet or sidecar) that exports
  directly to Grafana Cloud.
- **Gateway-only** — services export OTLP directly to a regional Alloy gateway, no in-cluster agent.
- **Two-tier (agent + gateway)** — DaemonSet agents in-cluster, regional StatefulSet gateways
  downstream of the agents.

This ADR captures the choice referenced in [[telemetry-schema-design|telemetry-schema-design.md]]
§13 but not previously formalised.

---

## 2. Decision

Adopt a **two-tier Grafana Alloy topology**:

- **Agent tier** — Alloy DaemonSet, one pod per ACA environment node-pool worker, performing
  per-replica resource detection, OTLP receive, batching, and OTLP/gRPC export to the gateway tier.
- **Gateway tier** — Alloy StatefulSet, one cluster of ≥ 3 replicas per Azure region with
  anti-affinity across availability zones, performing tail sampling, PII redaction, schema
  enforcement, and final export to Mimir / Loki / Tempo via `remote_write`, `loki.write`, and
  `otlphttp` respectively.

Per-region: one gateway cluster, sized for that region's signal volume. Cross-region traces stitch
at Tempo (no need for a global gateway buffer).

Persistence and resilience baseline:

- Gateway uses Alloy's `file_storage` extension for persistent buffer to survive backend stalls.
- Gateway `shutdown_timeout` is set to **60 seconds** (default 5s is too low and causes
  tail-sampling decisions to be lost on rolling restart).
- Gateway is deployed via Helm with anti-affinity, PDB (`maxUnavailable: 1`), and HPA bounded at
  `minReplicas: 3`.

---

## 3. Rationale

### Concern matrix

| Concern                               | Agent-only  | Gateway-only  | Two-tier (chosen) |
| ------------------------------------- | ----------- | ------------- | ----------------- |
| Tail sampling correctness             | ✗           | ✓             | ✓                 |
| Per-replica resource detection        | ✓           | ✗             | ✓                 |
| Schema enforcement chokepoint         | ✗           | ✓             | ✓                 |
| Centralised PII redaction             | ✗           | ✓             | ✓                 |
| Network egress reduction (batching)   | ✗           | ✓             | ✓                 |
| Failure blast radius                  | per-replica | platform-wide | scoped to region  |
| Operational complexity                | Low         | Medium        | High              |
| TLS connection count to Grafana Cloud | O(replicas) | O(regions)    | O(regions)        |

### Why two-tier wins despite the operational complexity

Each of "tail sampling correctness", "schema enforcement", and "PII redaction" is independently
load-bearing. None of the three can be solved by an agent-only topology — agent-only forces the
platform back to head sampling, distributed redaction config, and per-replica enforcement of
cardinality rules. The only topology that satisfies all three is one where signals pass through a
known chokepoint after leaving the pod.

Gateway-only solves those three but forfeits per-replica resource detection (`service.instance.id`,
KEDA replica name, container metadata) which the SDK's resource detector populates before the signal
leaves the pod. Without the agent tier, those attributes have to be re-derived from headers or
Kubernetes API joins on the gateway — expensive, error-prone, and brittle on ACA where the
underlying host is platform-managed.

Two-tier accepts higher operational complexity in exchange for solving all four concerns. The
complexity is bounded — Alloy is deployed via Helm in both tiers, configuration is GitOps-managed,
and the failure modes are well-understood.

### Why one gateway cluster per region

Cross-region tail sampling is not required: a trace that crosses regions is reassembled at Tempo
from independently-sampled regional segments. Per-region isolation also matches Azure's regional
failure domains — a region outage takes its own gateway down without affecting siblings.

---

## 4. Alternatives Considered

| Alternative                                               | Reason for Rejection                                                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent-only with head-only sampling                        | Forfeits tail sampling; drops errors and slow requests proportionally — unacceptable for an SLO-driven platform                                                                       |
| Gateway-only, direct SDK → gateway                        | Loses per-replica resource detection; gateway becomes responsible for attributes the SDK should set; brittle on ACA where host metadata is platform-managed                           |
| Three-tier (agent → regional aggregator → global gateway) | Adds a tier of complexity for a problem not present at ShipSolid's scale; a global tier fails as a single point of failure with no observability benefit over per-region gateways     |
| Direct SDK → Grafana Cloud, no in-house collector         | No tail sampling, no PII chokepoint, no schema enforcement, O(replicas) TLS connections, no buffer for backend stalls — fails on every concern in the matrix                          |
| OpenTelemetry Collector instead of Alloy                  | Functionally equivalent for these concerns; Alloy chosen for parity with the rest of the ShipSolid Grafana Cloud stack (single binary across log shipping, metrics scraping, tracing) |
| Sidecar agents (one per service pod) instead of DaemonSet | Sidecars duplicate per-replica resource detection but multiply compute overhead by replica count — at 50+ services with KEDA scaling this adds non-trivial CPU cost without benefit   |

---

## 5. Consequences

### Positive

- Tail sampling preserves errors, slow requests, retries, and high-value traces with bounded ingest
  volume (§12 of telemetry-schema-design).
- PII redaction enforced at a single chokepoint with a single audit trail.
- Schema and cardinality enforcement at the gateway provides observable rejection metrics
  (`alloy_processor_dropped_total{reason=...}`) that turn governance violations into alertable
  signals.
- Network egress to Grafana Cloud is consolidated across all services in a region, reducing TLS
  handshake count and improving compression efficiency.
- Per-region failure isolation matches Azure's regional fault domains.

### Negative / accepted costs

- **Operational complexity.** Two tiers means two Helm releases, two upgrade cadences, two failure
  modes to understand. The platform team accepts this in exchange for the correctness wins above.
- **Gateway as critical path.** A regional gateway outage degrades observability for that region.
  Mitigated by ≥ 3 replicas, anti-affinity, persistent buffer, and 60s shutdown timeout — but the
  SLA on the gateway becomes an SRE concern in its own right, with its own SLO.
- **Sampling fallback contract** ([[telemetry-schema-design|telemetry-schema-design.md]] §12.4): if
  the gateway is restarting or OOM-evicting, the SDK head-sampling rate (10%) is the floor.
  Disabling head sampling and relying on tail-only is **explicitly forbidden** because it makes
  gateway outages silent observability outages.
- **Cross-region traces are best-effort.** Spans are tail-sampled per-region, so a cross-region
  trace can have one segment kept and another dropped. The reassembled trace at Tempo will have gaps
  in those cases.
- **Resource cost.** Gateway tier consumes its own compute and memory (sized to peak signal volume +
  buffer). Estimated baseline: ~3 × 4-vCPU / 16-GB nodes per region.

### Follow-ups required

- Author Helm chart for the gateway tier (StatefulSet, anti-affinity, `file_storage` PVC, PDB, HPA).
- Author Helm chart for the agent tier (DaemonSet, OTLP receivers, agent-side attribute enrichment
  only, no sampling decisions).
- Author SLO definitions for the gateway itself: ingest success rate, end-to-end signal latency,
  queue depth.
- Define alerts for gateway saturation: queue depth > 80%, persistent buffer growth rate,
  dropped-signal rate.
- Author a runbook for gateway-tier failover and rolling restart that preserves tail-sampling
  decisions where possible.
- Update [[telemetry-schema-design|k-docs/system-designs/telemetry-schema-design.md]] §13 to
  reference this ADR.
- Cross-link to
  [[projects/platform-shipsolid/01-platform-architecture/adrs/adr-pin-otel-semconv-126-shipsolid|ADR-006]]
  — gateway processors expect attributes named per the pinned semconv version.

---

## 6. Reconsideration Criteria

This decision should be revisited if any of the following occur:

1. **Grafana Cloud introduces a managed tail-sampling capability** that satisfies the concerns
   currently met by the gateway tier.
2. **Service mesh adoption** (Istio / Linkerd / Cilium) provides equivalent tail sampling and PII
   redaction at the mesh layer, making in-house collector logic redundant.
3. **Operational burden of the gateway tier exceeds its value.** Specifically: the gateway becomes
   the dominant source of observability incidents, or its compute cost grows faster than the
   platform.
4. **Scale changes substantially** — drop below ~10 services (gateway becomes overkill) or cross
   ~500 services in a single region (gateway sharding may be needed; revisit topology).
5. **Alloy is sunset by Grafana Labs** in favour of an alternative collector with different
   deployment characteristics.
6. **Regulatory requirement** mandates per-tenant or per-region isolation that the current
   single-gateway-per-region topology cannot satisfy.

---

## 7. References

- [[telemetry-schema-design|k-docs/system-designs/telemetry-schema-design.md §13 — Collector Topology]]
- [[telemetry-schema-design|k-docs/system-designs/telemetry-schema-design.md §12 — Sampling Strategy]]
- [Grafana Alloy documentation](https://grafana.com/docs/alloy/)
- [OTel Collector tail sampling processor reference](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/tailsamplingprocessor)
- [[projects/platform-shipsolid/01-platform-architecture/adrs/adr-pin-otel-semconv-126-shipsolid|ADR-006: Pin OpenTelemetry Semantic Conventions to v1.26]]
- ADR-003: Adopt Grafana Cloud for Centralized Observability (ShipSolid platform)
- ADR-004: Use Ansible for Deploying Grafana Agents Across Infrastructure (ShipSolid platform)

---
