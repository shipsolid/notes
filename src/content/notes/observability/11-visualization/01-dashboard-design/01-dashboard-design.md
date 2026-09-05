---
title: "1 — Dashboard Design"
description: "The three-question test for a vanity panel, why the same underlying data needs a different dashboard for different audiences, and the top-down layout that mirrors how an investigation actually drills down."
tags: ["observability", "slo", "alerting", "incident-response", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-10"
relations:
  - slug: observability/12-alert-engineering/01-alert-philosophy/01-alerting-and-routing
    kind: related
  - slug: observability/00-foundations-of-observability/02-pillars-of-observability/02-the-signals
    kind: depends_on
  - slug: observability/02-metrics-engineering/03-histograms-deep-dive/03-aggregation-composability
    kind: depends_on
  - slug: observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets
    kind: related
  - slug: sre/04-reliability-engineering/07-capacity-planning/07-capacity-planning
    kind: related
---

# 1 — Dashboard Design

A dashboard is built for someone to make a decision or take an action. A panel that doesn't serve
either isn't neutral — it's a **vanity metric**: a number that looks like signal, occupies screen
space, and trains whoever reads the dashboard to skim past panels instead of reading them, the same
failure mode [[01-alerting-and-routing|alert fatigue]] causes for pages.

---

## The three-question test

Before a panel earns a place on a dashboard, it should survive three questions:

1. **What decision or action does this enable?** — "requests per second" with no baseline or
   threshold enables nothing; the same number with an SLO overlay enables "are we inside budget."
2. **For whom?** — a number meaningful to the team that owns the service may be noise to someone
   else looking at the same dashboard for a different reason (see audiences, below).
3. **What would make someone look at it right now?** — if the honest answer is "nothing, it's just
   generally good to know," the panel is decoration, not instrumentation.

A panel that fails all three should be deleted, not deprioritized to the bottom of the dashboard —
dead panels accumulate as services get retired or metrics get renamed, and a dashboard nobody prunes
eventually trains the same skim-past behavior a single vanity panel does, at the scale of the whole
dashboard.

---

## The same data, different dashboards, different audiences

The same underlying telemetry serves three genuinely different questions depending on who's looking
and why — building one dashboard to serve all three usually serves none of them well:

| Audience                         | Question                                                        | What the dashboard should lead with                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| On-call, mid-incident            | "What's broken, right now, and where do I look next?"           | [[02-slos-and-error-budgets\| SLO burn rate]] and RED metrics at the top, deploy/config-change events overlaid — see [[02-the-signals]] for why an event overlay answers "did it start right after that change"        |
| Service owner, capacity planning | "Are we approaching a limit, and when?"                         | Saturation/utilization trends, not point-in-time values — the nonlinear-latency-near-100%-utilization shape [[sre/04-reliability-engineering/07-capacity-planning/07-capacity-planning\| Capacity Planning]] describes |
| Leadership, quarterly review     | "Are we meeting our reliability commitments, and at what cost?" | SLO compliance over the review period, trend over time — not instantaneous values that mean nothing without historical context                                                                                         |

A triage dashboard cluttered with quarterly-trend panels slows down an incident; a leadership
dashboard cluttered with per-pod saturation panels buries the one number that answers the actual
question being asked.

---

## Layout should mirror how an investigation actually drills down

[[02-the-signals|The Signals]] describes an investigation moving from a symptom-level metric to a
cause-level trace, log, or profile. A single dashboard built for the on-call audience should be laid
out to mirror that same path top to bottom, not scattered by which team happened to add which panel:

```
┌─────────────────────────────────────────┐
│ SLO burn rate / RED metrics              │  ← symptom level: is anything wrong right now
├─────────────────────────────────────────┤
│ Per-dependency breakdown                  │  ← cause level: which dependency is the outlier
├─────────────────────────────────────────┤
│ Deploy/config-change event overlay        │  ← did this start right after something changed
├─────────────────────────────────────────┤
│ Deep diagnostics (saturation, profiles)   │  ← only relevant once the above narrowed the search
└─────────────────────────────────────────┘
```

Putting deep-diagnostic panels above the symptom-level summary forces every reader to scroll past
detail they don't need yet to find the one number that tells them whether to keep looking at all.

---

## The most common correctness bug on a dashboard

A percentile panel wired as `avg(p99) by (pod)` is the single most common wrong panel in
observability dashboards, and it looks completely reasonable until
[[03-aggregation-composability]]'s counterexample is worked through: it should be a percentile
computed once from merged histogram buckets, not an average of already-computed per-instance
percentiles. A dashboard's credibility depends on this being correct everywhere, not just on the
panels someone happened to double-check — one wrong percentile panel is enough to make an entire
dashboard untrustworthy during an incident, at exactly the moment trust in the numbers matters most.

---

## What this looks like in practice

[[visualization-alerts|Visualization, Alerting & SLOs]] walks through this as an actual platform
policy — audience-specific dashboard tiers, and the standards behind what gets a panel at all.

---

## Why this matters for an Observability Architect

A dashboard is a claim about what matters, made in advance of the incident that will test it. The
right review question for a new dashboard isn't "does this look complete" — a dashboard can look
thorough and still bury the one panel an on-call engineer actually needs under a dozen that don't
matter for their situation. The right question is "if I were mid-incident and opened this cold,
would the first thing I see tell me where to look next."

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
