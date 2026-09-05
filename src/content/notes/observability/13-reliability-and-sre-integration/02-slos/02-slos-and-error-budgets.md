---
title: "2 — SLOs & Error Budgets"
description: "SLI/SLO/SLA, the error budget as a spendable resource rather than a compliance number, burn rate as the mechanism connecting the two, and why multi-window multi-burn-rate alerting exists at all."
tags: ["observability", "slo", "alerting", "incident-response", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-11"
relations:
  - slug: observability/12-alert-engineering/01-alert-philosophy/01-alerting-and-routing
    kind: related
  - slug: sre/04-reliability-engineering/04-error-budgets/04-error-budgets
    kind: depends_on
  - slug: observability/02-metrics-engineering/03-histograms-deep-dive/03-aggregation-composability
    kind: depends_on
  - slug: sre/04-reliability-engineering/02-service-level-indicators-slis/02-service-level-indicators-slis
    kind: depends_on
---

# 2 — SLOs & Error Budgets

Everything earlier in this book — instrumentation, pipeline, storage — exists to produce a number.
This chapter is about the specific number that turns telemetry into a decision: are we meeting the
reliability target we agreed to, and if not, how urgently does that matter right now.

---

## SLI, SLO, SLA — three different things wearing similar names

- **SLI (Service Level Indicator)** — the measurement itself: the fraction of requests served under
  300ms, the fraction of requests that didn't 5xx. An SLI is a number; picking a good one is its own
  discipline.
- **SLO (Service Level Objective)** — the internal target for that measurement: "99.9% of requests
  under 300ms, over a rolling 28 days." An SLO is a goal the team holds itself to.
- **SLA (Service Level Agreement)** — an SLO with a contractual consequence attached, usually to an
  external party: miss it, and something happens — a credit, a penalty, a breach. Not every SLO is
  an SLA; most internal reliability targets never need to be.

Conflating these is common and costly: treating every internal SLO as if it carries SLA-grade
consequences turns every minor miss into a crisis, and drives exactly the kind of alert fatigue
[[01-alerting-and-routing|Alerting & Alert Routing]] is about avoiding.

---

## The error budget: a resource to spend, not a compliance score

If the SLO is 99.9%, the **error budget** is the remaining 0.1% — the amount of "bad" the system is
allowed over the window before the SLO is breached. Framed as a compliance number, an error budget
just measures how much trouble you're in. Framed as a _resource_, it becomes something to spend
deliberately: a risky migration, an aggressive canary rollout, a chaos experiment all cost budget
the same way a slow dependency does. A team with budget to spare can afford to take a calculated
risk; a team that's already burned most of its budget for the window should be freezing exactly that
kind of risk, not taking on more of it. This reframing — from "how much are we failing" to "how much
risk can we still afford this window" — is what makes an error budget a governance tool instead of
just a retrospective grade. See [[04-error-budgets|Error Budgets]] for what turning that reframing
into an actual organizational policy looks like.

---

## Burn rate: how fast the budget is being spent

**Burn rate** is the speed at which the error budget is being consumed, relative to how fast it
_should_ be consumed to exactly exhaust it right at the end of the window. A burn rate of 1x means
"on pace to use exactly 100% of the budget by the end of the window" — which is, by construction,
just barely meeting the SLO. A burn rate of 10x means the budget will be fully exhausted in a tenth
of the window's remaining time — a much more urgent situation than "the SLO is currently being met"
would suggest if you only looked at the raw SLI.

```
Burn rate 1x:  ██████████████████████████████  (budget exhausted exactly at window end)
Burn rate 10x: ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (budget exhausted 1/10 of the way through)
```

Burn rate, not the raw SLI, is what alerting should actually key off — it answers "how urgent is
this," not just "is something currently wrong."

---

## Why one window isn't enough: multi-window, multi-burn-rate alerting

A single short window (say, 5 minutes) reacts fast to a severe outage but flaps constantly on brief
blips that self-resolve before anyone could act. A single long window (say, 6 hours) smooths out
those blips but is far too slow to catch a genuinely severe outage before it's already blown a large
share of the budget. The standard fix is to require **both** a short window and a long window to
agree before paging, at more than one severity tier:

| Severity | Burn rate | Short window | Long window | What it catches                                                                       |
| -------- | --------- | ------------ | ----------- | ------------------------------------------------------------------------------------- |
| Page     | 14.4x     | 1h           | 5m          | A severe outage, confirmed fast without flapping on noise                             |
| Page     | 6x        | 6h           | 30m         | A sustained, moderate-severity degradation                                            |
| Ticket   | 1x        | 3d           | 6h          | A slow leak that would exhaust the budget by window end, with no urgency to page over |

Requiring agreement between a short and a long window at the same burn-rate threshold is what
prevents a single self-resolving blip from paging anyone, while still catching a real outage inside
minutes rather than hours.

---

## The percentile trap, again

An SLO defined on p99 latency inherits every problem [[03-aggregation-composability]] already
covers: the burn-rate calculation has to run against the merged-histogram percentile across the
whole service, never an average of per-instance p99s. An SLO with a mathematically wrong SLI is
worse than no SLO — it produces a number confident enough to make decisions from, that doesn't
correspond to what any real user experienced.

---

## What this looks like in practice

[SignalForge's SLOs & burn-rate alerts](https://shipsolid.github.io/signal-forge/observability/slos/) is a real, complete worked example — published SLOs,
SLIs computed from span metrics, and the actual multi-window burn-rate alert structure behind them.
For the platform-scale version — a registry tracking SLOs across every service rather than one — see
[[slo-registry|SLO Registry]]. [[02-service-level-indicators-slis|Service Level Indicators (SLIs)]]
covers the harder problem this chapter assumes is already solved: picking a good SLI in the first
place, and choosing a window length that matches how the team actually wants to react. The **SLO
Designer** skill generates the burn-rate alert YAML directly from a target and window, once those
two questions are answered.

---

## Why this matters for an Observability Architect

An SLO is only as good as the SLI underneath it and the burn-rate math applied on top of it — both
are places where an architecturally correct-looking dashboard number can be quietly wrong. Reviewing
a new SLO means checking both ends: is the SLI actually derived from a composable aggregate (not an
averaged percentile), and does the alerting policy behind it use multi-window agreement rather than
a single threshold that will either flap or arrive too late.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
