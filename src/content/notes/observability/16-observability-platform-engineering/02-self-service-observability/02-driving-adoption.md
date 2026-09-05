---
title: "2 — Driving Adoption"
description: "A paved road nobody travels on didn't help anyone — onboarding time as the leading indicator, self-service as the mechanism that actually moves it, and why migrating an existing service is a harder adoption problem than a greenfield one."
tags: ["observability", "platform-team", "narrative", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-20"
relations:
  - slug: observability/16-observability-platform-engineering/01-internal-developer-platforms/01-building-a-platform-team
    kind: depends_on
  - slug: projects/platform-shipsolid/08-strategy-planning/maturity-model
    kind: related
  - slug: observability/06-opentelemetry/04-auto-instrumentation/04-auto-vs-manual-instrumentation
    kind: related
  - slug: observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline
    kind: compared_to
---

# 2 — Driving Adoption

[[01-building-a-platform-team]] covers the paved road; this chapter is about the fact that a
genuinely better paved road doesn't get adopted automatically just because it's better. Every team
has switching costs, inertia, and something else on its roadmap this quarter — adoption is a thing
that has to be actively driven, not a natural consequence of shipping good tooling.

---

## Onboarding time as the leading indicator

The single most legible measure of whether the platform is actually easy to adopt is time-to-first-
signal: how long from "this service exists" to "this service has working dashboards, alerts, and
traces." A shrinking number here is usually a leading indicator that self-service is genuinely
working — as opposed to the platform team simply getting personally faster at onboarding people by
hand, which doesn't scale and doesn't show up as adoption in any way that survives the platform team
being busy with something else that week.

---

## Self-service is the mechanism, not the slogan

"Self-service" means a team can adopt the platform without filing a ticket to the platform team at
all — which requires three things to actually be true, not just claimed:

- **A scaffolder or service-catalog entry point** — so starting a new service starts it already
  wired to the paved road, rather than wired to nothing until someone remembers to ask for
  observability separately.
- **Auto-instrumentation defaults that work out of the box** — see
  [[04-auto-vs-manual-instrumentation]] — so "adopt the platform" doesn't itself require writing
  instrumentation code before any benefit shows up.
- **The paved road as the path of least resistance**, not an opt-in extra step competing with
  whatever a team would do by default if they did nothing. If skipping the platform is easier than
  using it, most teams will skip it under any deadline pressure at all, regardless of how good the
  platform actually is.

---

## Migration is a harder adoption problem than onboarding

Driving adoption for a _new_ service is a greenfield problem — there's no existing behavior to
change. Migrating an _existing_, already-instrumented-some-other-way service is fundamentally
harder, because it asks a team to change something that already works for them, for a benefit the
platform team usually perceives more clearly than the team being asked to migrate does. A migration
playbook that works needs three things a greenfield onboarding doesn't:

1. **The "why migrate" case stated in the adopting team's terms** — not "the new platform is
   better," but the specific thing this team will be able to do afterward that they can't do now.
2. **A low-risk incremental path** — dual-write or a shadow period rather than a big-bang cutover,
   the same pattern
   [[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|a collector pipeline]]
   already uses to run two destinations side by side during a transition.
3. **A deprecation deadline for the old path**, set once adoption is high enough that maintaining
   both paths costs more than finishing the last few migrations — open-ended parallel support just
   removes the pressure that would otherwise finish the migration.

---

## What this looks like as a framework

[[maturity-model|Platform & Cloud Maturity Model]] frames adoption progress as levels (ad hoc →
defined → standardized → measured → optimized) rather than a binary adopted/not-adopted — useful
because it gives a team partway through migration a concrete next level to aim at, instead of an
all-or-nothing finish line that's easy to deprioritize indefinitely.

---

## Why this matters for an Observability Architect

Adoption work competes for the same organizational attention as every other roadmap item a service
team has, and it loses that competition by default unless something makes the case in the adopting
team's own terms and lowers the switching cost below "not right now." Treating driving adoption as a
real, ongoing discipline — not a natural side effect of the platform being technically superior — is
what actually determines whether the rest of this book reaches every service, or just the ones the
platform team happened to onboard by hand.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
