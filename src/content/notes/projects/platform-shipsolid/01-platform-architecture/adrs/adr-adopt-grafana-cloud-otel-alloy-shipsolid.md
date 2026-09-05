---
title: "ADR-008: Adopt Grafana Cloud + OpenTelemetry + Alloy as the ShipSolid Observability Standard"
description: "- **Status**: Accepted - **Date**: 2026-06-09"
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202606092223"
---

## ADR-008: Adopt Grafana Cloud + OpenTelemetry + Alloy as the ShipSolid Observability Standard

<!-- Proposed | Accepted | Rejected | Superseded -->

- **Status**: Accepted
- **Date**: 2026-06-09
- **Authors**: [Amit Singh, Observability Architect](mailto:amit.singh@shipsolid.example)
- **Deciders**: Amit Singh (Observability Architect), Platform SRE, Service Team Lead
- **Supersedes**: N/A
- **Related RFC**: [stub: rfc-adopt-grafana-cloud-shipsolid]
- **Project/Context**: ShipSolid platform — all services, all environments

---

## 1. Context

ShipSolid is a B2B SaaS platform running **~40 services across 3 AKS clusters (dev / qa / prod) on
Azure**. Representative services include `api-gateway`, `auth-service`, `billing-service`,
`notification-service`, and `tenant-service`.

Today, observability is fragmented: each service team reaches for whatever it knows, there is no
shared instrumentation contract, and there is no single place to query metrics, logs, and traces
together. This is the **Reactive** stage of our maturity arc (Reactive → Resilient → Autonomous),
and it blocks the platform-wide goals we need to hit:

- Centralized visibility across all ~40 services and all three clusters
- Collection and correlation of **metrics, logs, and traces** with shared trace/log linkage
- A **vendor-neutral** instrumentation contract every team can adopt once and reuse
- Enterprise-grade features — **RBAC, SSO, dashboards, alerting, cost attribution**
- **Scalable ingestion** with minimal platform-team operational overhead
- Integration with our **incident response** tooling

Constraints and assumptions:

- The platform team is small and cannot absorb the operational burden of running a
  metrics/logs/traces backend at scale.
- All infrastructure change goes through **Helm + Terraform** — no `kubectl apply` for permanent
  resources.
- We want one instrumentation standard that survives a future backend swap.

We evaluated four options: self-hosted LGTM (Loki/Grafana/Tempo/Mimir), Datadog, Azure Monitor, and
**Grafana Cloud**. After analysis and a proof-of-concept, Grafana Cloud with an OpenTelemetry +
Alloy collection layer emerged as the best fit.

---

## 2. Decision

We will **adopt Grafana Cloud + OpenTelemetry + Grafana Alloy as the ShipSolid observability
standard** for all services across all environments.

The standard has three layers:

- **Managed data plane — Grafana Cloud.** Hosted **Mimir (metrics)**, **Loki (logs)**, and **Tempo
  (traces)** are the system of record for telemetry. The platform team operates no storage backend.
- **Instrumentation contract — OpenTelemetry.** Every service instruments with the **OTel SDK +
  auto-instrumentation**. OTel is the contract teams code against; the backend behind it is an
  implementation detail they never bind to.
- **Single collector — Grafana Alloy.** One collector technology — Alloy — runs per AKS cluster to
  receive, process, batch, and route telemetry. No per-team collector zoo.

Implementation aspects:

- **IaC-first.** Grafana Cloud stacks, alert rules, dashboards, and access policies via
  **Terraform**; Alloy via **Helm** with per-cluster/per-env values. No `kubectl apply` for
  permanent resources.
- **Write auth.** Data-plane writes use **`glc_`-prefixed access-policy tokens**; `glsa_`
  service-account tokens are reserved for API/management.
- **Incident layer.** Alerts route to **Grafana IRM** for on-call and correlation.
- **Tenancy & cost attribution.** Folders, teams, and usage labels scope access and enable
  per-service / per-team chargeback.

---

## 3. Rationale

| Criteria                | Evaluation                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| **Ease of Use**         | Fully managed; no backend to operate or scale                     |
| **Open Standards**      | First-class Prometheus, OpenTelemetry, and Grafana plugin support |
| **Operational Cost**    | Lower TCO than self-hosting four backends at our scale            |
| **Enterprise Features** | RBAC, SSO, alerting, multi-tenant folders built-in                |
| **Scalability**         | Managed ingestion and high-cardinality handling out of the box    |
| **Extensibility**       | Terraform provider + API integrations fit our Helm/TF pipelines   |
| **Vendor Neutrality**   | OTel + Alloy keep instrumentation portable — backend is swappable |

The key strategic point: by making **OpenTelemetry the contract** and **Alloy the single
collector**, the expensive, slow-to-change layer (service instrumentation) is decoupled from the
backend. If Grafana Cloud ever stops being the right answer, teams keep their instrumentation and
only the data plane moves.

---

## 4. Alternatives Considered

### Self-Hosted LGTM (Loki / Grafana / Tempo / Mimir)

Run the full LGTM stack on ShipSolid-managed AKS.

**Rejected because:**

- Significant operational overhead to provision, scale, and maintain four separate systems — storage
  provisioning, retention, compaction, HA, and DR all land on a small platform team.
- High-availability and disaster-recovery engineering delays time-to-value during the formative
  phase of the platform.
- Provides no advantage over Grafana Cloud's managed ingestion other than control we do not
  currently have the headcount to exercise.

### Datadog

Adopt Datadog as the unified observability SaaS.

**Rejected because:**

- **Cost** scales aggressively with host count, custom metrics, and ingested log volume —
  uncomfortable across ~40 services and three clusters.
- **Lock-in** to proprietary agents and query semantics works against our vendor-neutrality goal;
  migrating off later is expensive.
- Pulls us away from the OpenTelemetry + PromQL/LogQL ecosystem we want as the long-term contract.

### Azure Monitor + Azure-Native Tooling

Use Azure Monitor, Log Analytics, and Application Insights as the platform.

**Rejected because:**

- **Weak distributed-trace and exemplar story** relative to a Tempo/OTel-native backend —
  cross-service trace correlation and metric-to-trace exemplars are less seamless.
- **Vendor lock-in** to Azure-native query (KQL) and SDKs; lower portability than an OTel +
  PromQL/LogQL standard.
- Dashboard-as-code via the Terraform provider is less mature than Grafana's.

---

## 5. Consequences

### Positive Outcomes

- A single, vendor-neutral observability standard across all ~40 services and all three AKS
  clusters.
- Faster time-to-value via a fully managed data plane — no backend to operate.
- One instrumentation contract (OTel) that survives a future backend swap.
- One collector technology (Alloy) to learn, template, and govern — no collector zoo.
- Built-in RBAC, SSO, dashboards, alerting, and per-service cost attribution.
- A foundation for the **Resilient → Autonomous** stages (SLOs, alert correlation, IRM-driven
  on-call).

### Accepted Costs / Trade-offs

- **Internet dependency.** Telemetry egress to Grafana Cloud means collection and query depend on
  outbound connectivity; we accept this and design Alloy buffering accordingly.
- **`glc_` token discipline.** Data-plane writes require `glc_` access-policy tokens; using `glsa_`
  tokens surfaces as 401s at the write endpoints. This is an operational invariant teams must
  respect.
- **OTel learning curve.** Teams must adopt OTel SDK/auto-instrumentation and the shared
  resource-attribute schema; we offset this with onboarding guides and templates.
- Ongoing SaaS subscription cost and less control over backend upgrades than self-hosting.

---

## 6. Reconsideration Criteria

We will revisit this decision if:

- Grafana Cloud cost exceeds the planned observability budget by **>25%**.
- Critical enterprise features (SAML SSO, RBAC, high-cardinality handling) regress or are removed.
- Grafana Cloud SLAs for uptime or ingestion are repeatedly not met.
- OpenTelemetry support across our service languages materially regresses.
- Security or compliance raises a blocking concern about telemetry leaving our Azure tenancy.

---

## 7. References

- [[platform-overview|Platform Overview (C4 L1-L2)]]
- [[data-plane-architecture|Data Plane Architecture]]
- [[control-plane-architecture|Control Plane Architecture]]
- ADR Index
- [Grafana Cloud Overview](https://grafana.com/products/cloud/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Grafana Alloy Documentation](https://grafana.com/docs/alloy/)

---
