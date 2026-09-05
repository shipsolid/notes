---
title: "ADR-006: Pin OpenTelemetry Semantic Conventions to v1.26 as Platform Baseline"
description: "- **Status**: Proposed - **Date**: 2026-05-07"
tags: ["ShipSolid", "Architecture"]
updated: 2026-06-09
hidden: false
zettelId: "202605072121"
kind: adr
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-adopt-grafana-cloud
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/designs/telemetry-schema-design
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/adrs/adr-adopt-grafana-cloud-otel-alloy-shipsolid
    kind: related
  - slug: observability/06-opentelemetry/01-opentelemetry-architecture/01-opentelemetry-sdks-and-semantic-conventions
    kind: related
---

## ADR-006: Pin OpenTelemetry Semantic Conventions to v1.26 as Platform Baseline

- **Status**: Proposed
- **Date**: 2026-05-07
- **Authors**: [Amit Singh](mailto:amit.singh@shipsolid.com)
- **Deciders**: [Amit Singh](mailto:amit.singh@shipsolid.com) — pending platform team review
- **Supersedes**: N/A
- **Related RFC**: N/A
- **Project/Context**: ShipSolid observability platform — Azure Container Apps (.NET + Python) on
  Grafana Cloud (Mimir + Loki + Tempo)

---

## 1. Context

The ShipSolid observability platform serves 50+ Azure Container Apps across 12+ engineering teams in
two SDK languages (.NET 8 and Python 3.11+), exporting to Grafana Cloud.
[[observability/06-opentelemetry/01-opentelemetry-architecture/01-opentelemetry-sdks-and-semantic-conventions|OpenTelemetry semantic conventions (semconv)]]
define the canonical names and shapes of metrics, span attributes, and resource attributes — they
are the schema contract that dashboards, alerts, and SLOs query against.

Three forces make an explicit version pin necessary:

1. **Breaking renames in upstream semconv.** Between semconv 1.21 and 1.23, `http.server.duration`
   was renamed to `http.server.request.duration`, status code attribute moved from
   `http.status_code` to `http.response.status_code`, and several queue / messaging attributes were
   renamed. SDK auto-instrumentation libraries follow these renames on their own release cadence.
2. **Heterogeneous SDK upgrade cadence across teams.** With 12+ teams owning their own service
   templates and dependency upgrades, two services in the same regional fleet can emit
   differently-named telemetry for the same operation if no platform pin is enforced. Dashboards
   built against one name silently lose half their data.
3. **Alert / dashboard contract.** Recording rules, SLO definitions, and Grafana panels reference
   attribute names directly. Any silent rename invalidates the alerting layer without producing a
   "config error" — it produces missing data and false-quiet alerts.

The [[telemetry-schema-design|telemetry-schema-design.md]] document references semconv 1.26 as its
baseline (§15) but no standalone ADR captures the decision, the rejected alternatives, or the
upgrade process. Without a load-bearing ADR, a future SDK bump in any one service's `Dockerfile`
could unilaterally break the platform's observability contract.

---

## 2. Decision

Pin OpenTelemetry **semantic conventions to v1.26** as the platform baseline for all ShipSolid Azure
Container Apps services and the Grafana Alloy gateway tier, as established in
[[projects/platform-shipsolid/01-platform-architecture/adrs/adr-adopt-grafana-cloud-otel-alloy-shipsolid|ADR-008]].

The pin is enforced at three layers:

- **Service template** (a-governance/service-template/) pins SDK package versions whose
  semconv-version metadata corresponds to 1.26.
- **Alloy gateway** runs the matching processor pipeline (e.g., `transform` rules expecting 1.26
  attribute names).
- **Schema registry / dashboards** reference attribute names from 1.26 only.

Bumping the platform-wide pin requires:

1. A new ADR superseding this one.
2. A cardinality and query-impact assessment against the dashboard inventory.
3. A **six-week dual-emission window** (`emit_old: true` on the SDK exporter where the upstream
   library supports it, otherwise an Alloy `transform` processor that re-asserts old attribute names
   alongside new) before any dashboard or alert is migrated.
4. Dashboard and alert rule update PRs landing **before** the pin flips.
5. Registry update with the new version.

---

## 3. Rationale

### Why pin, and why 1.26?

Pinning is the only mechanism that prevents silent observability regression when a team upgrades an
unrelated dependency. v1.26 is selected because:

- It is the most recent semconv release where the **HTTP, queue, messaging, and database** attribute
  groups have all reached `stable` status. Earlier (1.21) still had `http.server.duration` as the
  canonical name; later "latest" trains still have `experimental` flux in the database group.
- Both `OpenTelemetry-DotNet` and `opentelemetry-python` ship contract-compatible releases that
  adopt 1.26 naming under their stable channels.
- Mimir / Loki / Tempo in Grafana Cloud all accept 1.26-named attributes natively without bridge
  configuration.

### Why not "track latest"?

Auto-tracking upstream means a 1.27 release in upstream OTel auto-propagates to whichever team
upgrades first. That team's services emit new names; every other team continues emitting old names;
every dashboard breaks for a subset of services. The whole platform's observability quality becomes
a function of who ran `dotnet outdated` last.

### Why a dual-emission window?

Cutover-without-overlap means dashboards and alerts go dark between the SDK rollout and the
dashboard migration. Dual-emission keeps the old name flowing alongside the new for the duration of
the migration, removing the all-or-nothing failure mode.

---

## 4. Alternatives Considered

| Alternative                                                             | Reason for Rejection                                                                                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Track upstream "latest" semconv                                         | Silent platform-wide regression risk on every minor upstream release; no central control over upgrade timing                                           |
| Pin per-team (no platform-wide baseline)                                | Same data shape diverges across services; cross-team dashboards become unreliable; recording rules cannot be authored once                             |
| Pin to v1.21 (pre-rename, fewer changes)                                | Forecloses access to stable HTTP/messaging conventions; locks the platform into an end-of-life version with no upstream patching                       |
| Use only `stable` attributes, no version pin                            | Underspecified — "stable" is a per-version flag and changes between releases; doesn't fix the silent-rename failure mode                               |
| Author ShipSolid-internal attribute schema and translate at the gateway | Maximum control but maximum work — duplicates upstream's effort, adds a translation processor on every signal, alienates teams from the OTel ecosystem |

---

## 5. Consequences

### Positive

- Single attribute schema across all services, all teams, both SDK languages.
- Recording rules and SLO definitions can be authored once and reused.
- Dashboard library (k-docs/technical-designs/grafana-tf/) can be templated against a known
  attribute set.
- Upgrades are deliberate, observable, and reversible (dual-emission window).

### Negative / accepted costs

- **Drift cost as upstream advances.** v1.26 will eventually be N versions behind. The platform team
  accepts the cost of curating an upgrade ADR roughly every 12–18 months.
- **Lock-out of newer SDK features tied to newer semconv.** Teams cannot opportunistically adopt a
  1.28-only feature without going through the upgrade ADR. The platform accepts this friction as the
  price of consistency.
- **Service-template version pinning becomes a maintenance surface.** The platform team owns keeping
  the template's pinned SDK versions current with security patches without crossing the semconv
  boundary.

### Follow-ups required

- Update a-governance/service-template/ (.NET and Python variants) to pin SDK package versions whose
  semconv metadata = 1.26. Document the pin alongside each pinned package.
- Add CI check in service templates that fails if `OpenTelemetry.SemanticConventions` (or equivalent
  Python `opentelemetry-semantic-conventions`) resolves to a version outside the approved range.
- Build the Alloy `transform` dual-emission profile as a reusable module so the next ADR upgrade has
  plumbing already in place.
- Update [[telemetry-schema-design|k-docs/system-designs/telemetry-schema-design.md]] §15 to
  reference this ADR by number.
- Author a runbook for the upgrade process (cardinality review → dual-emission → flip → tear-down).

---

## 6. Reconsideration Criteria

This decision should be revisited if any of the following occur:

1. **Upstream stabilises a new semconv major** (e.g., v2.x) with non-cosmetic improvements — log
   conventions, GenAI, profiling — that the ShipSolid platform wants to adopt.
2. **Security or compliance vulnerability** in a SDK version covered by the v1.26-compatible range,
   where the patched release also bumps semconv.
3. **Vendor (Grafana Cloud) deprecates support** for v1.26-named attributes in Mimir / Loki / Tempo.
4. **Two or more ShipSolid services need an attribute that does not exist in v1.26**, and the cost
   of waiting outweighs the upgrade cost.
5. **Recording-rule maintenance burden** from the version lag becomes structurally larger than a
   planned upgrade would cost.

When triggered, author a new ADR proposing the new pinned version, the dual-emission timeline, and
the dashboard migration plan. Mark this ADR as `Superseded` and reference the new ADR.

---

## 7. References

- [[telemetry-schema-design|k-docs/system-designs/telemetry-schema-design.md §15 — Semantic Conventions Versioning]]
- [OpenTelemetry semantic conventions repository](https://github.com/open-telemetry/semantic-conventions)
- [OTel HTTP semconv stability statement (v1.23 stable promotion)](https://opentelemetry.io/docs/specs/semconv/http/)
- [[adr-adopt-grafana-cloud|ADR-002: Adopt Grafana Cloud for Unified Observability]] (lab)
- ADR-003: Adopt Grafana Cloud for Centralized Observability (ShipSolid platform)

---
