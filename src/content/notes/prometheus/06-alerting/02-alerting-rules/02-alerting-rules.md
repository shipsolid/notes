---
title: "2 — Alerting Rules"
description: "The alert state lifecycle — inactive, pending, firing — built from Prometheus's scrape and evaluation clocks, plus a line-by-line walk through a real alert rule's for:, labels:, and annotation templating."
tags: ["prometheus", "alerting", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-21"
relations:
  - slug: prometheus/06-alerting/01-recording-rules/01-recording-rules
    kind: related
  - slug: prometheus/06-alerting/03-alertmanager/03-alertmanager
    kind: related
  - slug: prometheus/05-promql-masterclass/02-promql-functions/02-promql-functions
    kind: depends_on
  - slug: prometheus/05-promql-masterclass/03-aggregation-operators/03-aggregation-operators
    kind: depends_on
---

# 2 — Alerting Rules

A recording rule stores a number. An alerting rule watches a number and decides whether someone
should be paged about it. That decision isn't a single yes/no flip — it moves through a small state
machine, and understanding that state machine is what makes the `for:` field in an alert rule make
sense instead of looking like an arbitrary knob.

## The Alert Lifecycle: Inactive, Pending, Firing

Every time a rule group is evaluated, each alert rule's condition is checked, and the rule's state
is set to one of three values: **inactive**, **pending**, or **firing**. Whatever that state
resolves to is what gets sent onward to the connected [[03-alertmanager|Alertmanager]], which is
what actually decides whether a notification goes out.

- **Inactive** — the alert expression is not currently true. Nothing is wrong, as far as this rule
  is concerned.
- **Pending** — the expression has become true, but not for long enough yet to be trusted. The rule
  has crossed its threshold within the current evaluation, but is still inside its `for:` window.
- **Firing** — the expression has remained true continuously for at least the `for:` duration. This
  is the state that actually triggers a notification through Alertmanager.

The reason **pending** exists as a distinct state, rather than firing immediately the moment the
expression crosses the threshold, is to avoid paging on noise. A single evaluation cycle where an
error rate spikes for one sample and drops back down is usually not worth waking anyone up for.
`for:` forces the condition to hold across multiple consecutive evaluations — spaced by the rule
group's `evaluation_interval` — before the rule is trusted enough to page. A `for: 1m` alert on a
rule group evaluating every 15s needs the condition to survive roughly four consecutive evaluations
before it flips to firing.

One honest caveat: the source material behind this chapter documents inactive, pending, and firing
explicitly as the three rule states. It does not name a formal fourth "resolved" state — it only
mentions, in the context of Alertmanager grouping, that a notification batch can include "alerts
firing (and any resolved alerts)" together. In practice, an alert that was firing and whose
condition subsequently goes false returns to inactive, and that transition is what a receiver
interprets as "resolved." That behavior is real and observable in Prometheus, but it isn't spelled
out as a named lifecycle state in the notes this chapter is built from, so it's presented here as an
inference rather than a documented fact.

## A Real Alert Rule, Line by Line

Here is a concrete alert rule for an error-rate SLO breach:

```yaml
- alert: requestratetns
  expr: sum by (method)
    (rate(tns_request_duration_seconds_count{job="tns-app",
    status_code!~"2.."}[1h]))
    / sum by (method)
    (rate(tns_request_duration_seconds_count{job="tns-app"}[1h])) > 0.1
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "SLO breach (job {{ $labels.method }})"
    description: ">10% of requests are failing \n VALUE = {{ $value }}\n LABELS: {{ $labels }}"
```

Working through each part:

- **`alert: requestratetns`** — the alert's name. This is what shows up in Alertmanager and in
  `group_by` matching, so it should be specific enough to identify the condition without reading the
  expression.
- **`expr:`** — the condition itself, evaluated as an instant vector. Here it's a ratio: the
  per-`method` rate of non-2xx responses divided by the per-`method` rate of all responses, over a
  1-hour window. `> 0.1` means the rule only produces output (and therefore only has a chance to
  fire) for method values where the error ratio currently exceeds 10%. Because the aggregation is
  `sum by (method)`, the result is a separate series — and therefore a separate potential alert
  instance — per HTTP method.
- **`for: 1m`** — the pending window described above. The error ratio has to stay above 10%
  continuously for a full minute of evaluations before this instance transitions from pending to
  firing.
- **`labels: severity: critical`** — a label attached to the alert itself (distinct from the labels
  on the underlying metric). This is what Alertmanager's routing tree and `group_by` match against
  to decide who gets notified and how alerts are grouped together.
- **`annotations:`** — human-readable content attached to the notification, not used for routing.
  Both fields use Go templating, and both draw on the two implicit variables available inside an
  alert template:
  - **`{{ $labels.method }}`** — pulls the value of the `method` label from _this specific_ result
    series. Since the `expr` aggregated `by (method)`, each firing instance carries its own `method`
    value, so the summary text is filled in per-instance rather than being a generic string. A
    method value of `GET` produces `"SLO breach (job GET)"`.
  - **`{{ $value }}`** — substitutes the actual numeric result of the expression for that series —
    the error ratio itself, e.g. `0.14` — so the notification tells the receiver not just that the
    rule fired, but by how much it breached the threshold.

Nothing about this rule references a recording rule — it recomputes the ratio directly from raw
counters every evaluation. If this same ratio were needed by more than one alert or a dashboard,
that's exactly the case described in [[01-recording-rules|Recording Rules]] for pulling it out into
a precomputed series instead.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
