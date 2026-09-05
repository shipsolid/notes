---
title: "8 — Case Study: Reactive → Resilient → Autonomous"
description: "An illustrative three-act arc — built on the ShipSolid platform maturity model, not any single real deployment — showing why the disciplined middle act is what actually earns the reliability, and why the autonomous act doesn't work without it."
tags: ["observability", "platform-team", "narrative", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-19"
relations:
  - slug: projects/platform-shipsolid/08-strategy-planning/maturity-model
    kind: depends_on
  - slug: projects/platform-shipsolid/00-start-here/vision-and-mission
    kind: related
  - slug: observability/17-ai-and-intelligent-observability/01-aiops/01-aiops-agentic-rca
    kind: related
  - slug: observability/16-observability-platform-engineering/01-internal-developer-platforms/01-building-a-platform-team
    kind: related
---

# 8 — Case Study: Reactive → Resilient → Autonomous

> This is an **illustrative composite**, built to show how the concepts in this book compound into a
> platform's maturity arc — not a report on any single real deployment, and not audited figures.
> Round, generic numbers stand in for what a transformation like this typically looks like in shape,
> not in precision. The underlying framework is [[maturity-model|Platform & Cloud Maturity Model]]
> (L1 Ad Hoc through L5 Optimized); the vision it's narrating is
> [[vision-and-mission|Vision & Mission]]'s own stated arc, **Reactive → Resilient → Autonomous.**

A platform's maturity story is usually told as a feature list — "we added tracing, then SLOs, then
an AI layer." The more useful version tells it as three acts, because the order matters and the
dependencies between acts are the actual lesson: the third act simply does not work without the
second one already being true, no matter how capable the technology in the third act is.

---

## Act 1 — Reactive

The starting state has a recognizable shape: alerts fire on internal causes (CPU, disk) rather than
user-visible symptoms — see [[01-alerting-and-routing]] — so a meaningful fraction of pages turn out
to be nothing, and the team has quietly learned to skim rather than trust them. Dashboards exist,
but several of them are wrong in ways nobody's caught — an averaged percentile panel here, a vanity
metric there (see [[03-aggregation-composability]] and [[01-dashboard-design]]) — so during a real
incident, nobody fully trusts what they're looking at. Every new service is onboarded by hand,
because there is no paved road, only whoever on the platform team has time this week — see
[[01-building-a-platform-team]]. Mapped to the maturity model, this is **L1–L2: Ad Hoc / Defined** —
fragmented, tool-driven, inconsistent even where standards nominally exist.

---

## Act 2 — Resilient

This is the unglamorous middle act, and it's the one that actually earns the reliability the later
act gets credit for. What changes here is discipline, not novelty:

- Instrumentation standardizes on OTel semantic conventions — see
  [[01-opentelemetry-sdks-and-semantic-conventions]] — so telemetry from different teams is finally
  comparable by name, not just by convention someone remembers.
- Cardinality comes under an actual budget — see [[05-label-schema-design]] — instead of every team
  discovering the hard way which labels were expensive.
- Alerting moves to symptom-based, multi-window burn-rate rules — see [[02-slos-and-error-budgets]]
  and [[01-alerting-and-routing]] — so a page reliably means something worth waking up for.
- Correlation gets wired in end to end — see [[03-cross-signal-correlation]] — so an on-call
  engineer can pivot from a metric spike to the exact trace and log line that explain it, in one
  motion, instead of manually cross-referencing three tools by timestamp.
- Dashboards get rebuilt audience-first — see [[01-dashboard-design]] — and the ones with the
  averaged- percentile bug get found and fixed, which is usually the moment trust in the dashboards
  actually returns.

This is **L3–L4: Standardized / Measured** — and it's worth naming plainly that none of this act is
exciting. It's exactly the kind of work that's easy to deprioritize in favor of something with a
better demo, which is precisely why platforms that skip straight from Reactive to buying an AI layer
tend to be disappointed by what that layer actually delivers.

---

## Act 3 — Autonomous

Everything in this act _compounds on_ Act 2 rather than replacing it. Self-service onboarding — see
[[02-driving-adoption]] — collapses time-to-first-signal for a new service from days to well under
an hour, but only because the paved road it's onboarding _onto_ already has standardized
instrumentation and working defaults to onboard into. Agentic RCA — see [[01-aiops-agentic-rca]] —
can genuinely investigate an incident, rather than confidently producing a wrong hypothesis, because
the correlation and semantic-convention consistency from Act 2 are exactly what let a tool-calling
agent generalize across services instead of needing bespoke prompting for each one. The platform
starts monitoring itself — see [[08-self-observability]] — closing the last "who watches the
watchers" gap. This is **L5: Optimized** — autonomous and predictive, in the maturity model's own
words.

The dependency runs one direction only: an agentic layer bolted onto a still-Reactive platform
doesn't produce an Autonomous platform — it produces automated confusion, delivered faster and with
more confidence than a human would have had. [[01-aiops-agentic-rca]] makes the same point from the
technical side; this case study is the organizational version of it.

---

## Why tell it as three acts, not a feature list

A feature list answers "what did the platform team build." A three-act arc answers the more useful
question: "in what order, and why couldn't it have gone faster." That second question is what an
architect actually gets asked — by a skeptical stakeholder wondering why the AI layer wasn't the
first investment, or by an engineer on a different platform trying to figure out what to prioritize
first.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
