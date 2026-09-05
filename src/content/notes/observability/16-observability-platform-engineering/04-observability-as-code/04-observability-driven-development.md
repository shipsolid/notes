---
title: "4 — Observability-Driven Development"
description: "The TDD analogy taken seriously: SLOs and instrumentation defined at design time as acceptance criteria, not retrofitted after an incident — and why this only sticks as a launch gate, not a guideline."
tags: ["observability", "aiops", "profiling", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-17"
relations:
  - slug: observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets
    kind: depends_on
  - slug: observability/00-foundations-of-observability/01-what-is-observability/01-what-observability-means
    kind: depends_on
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: related
  - slug: projects/platform-shipsolid/03-reliability-engineering/prr-template
    kind: related
---

# 4 — Observability-Driven Development

The name is a deliberate echo of test-driven development, and the analogy is meant to be taken
literally, not just as branding. TDD says write the test before the code. **Observability-driven
development** says define what "working correctly" measurably means, and what telemetry would prove
it, before the feature ships — not "we'll add monitoring once it's live," which is the exact same
anti-pattern as "we'll add tests later" wearing a different label.

---

## What actually shifts left

- **SLI/SLO definition moves into the design doc.** A new service or major feature's design should
  state what "working correctly" means in measurable terms — see [[02-slos-and-error-budgets]] —
  before implementation starts, rather than being reverse-engineered later from whatever metrics
  happened to get added along the way.
- **Instrumentation becomes part of "done."** The same way test coverage is often a merge
  requirement, "can we tell whether this is working correctly in production" is a legitimate
  acceptance criterion a feature can fail — not a nice-to-have bolted on after the fact.
- **Failure modes get instrumented deliberately, before they're needed.**
  [[01-what-observability-means]] frames monitoring as covering known unknowns and observability as
  being equipped for unknown unknowns. ODD is the design-time practice of deliberately converting as
  many plausible failure modes as possible from "unknown unknown we'll discover during an incident"
  into "known unknown, instrumented from day one" — while accepting that some genuinely novel
  failure will always remain in the unknown-unknown category no matter how much gets shifted left.

---

## Retrofitting instrumentation after an incident is the worst possible timing

The cost of skipping this isn't abstract: the exact telemetry that would explain an incident is
usually the telemetry that didn't exist when the incident happened, discovered only in the
post-mortem's "what should we add so this doesn't happen again" section — which is
[[01-what-observability-means]]'s practical test failing in the most expensive way it can fail, at
exactly the moment understanding mattered most.

---

## The mechanism that actually makes this stick: a launch gate, not a guideline

A design principle that only lives as advice gets skipped under deadline pressure, for the same
reason [[05-label-schema-design]] discipline needs a governance backstop rather than a style guide
nobody reads under a deadline. What operationalizes observability-driven development in practice is
a **Production Readiness Review (PRR)** — a checklist gate that explicitly blocks launch until SLOs
are defined and the instrumentation to evaluate them actually exists, the same way a CI gate blocks
a merge without passing tests. See [[prr-template|PRR Template]] for what that gate looks like as an
actual, enforced checklist rather than an aspiration.

---

## Why this matters for an Observability Architect

"We'll instrument it once we see how it behaves in production" sounds pragmatic and is exactly
backwards — it guarantees the system is least observable during the period right after launch, when
unexpected behavior is most likely and most costly to have blind. Treating instrumentation and SLO
definition as launch-blocking, the same way a broken test suite is, is what actually gets this done
before the deadline pressure that would otherwise skip it.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
