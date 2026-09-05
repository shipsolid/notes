---
title: "1 — Recording Rules"
description: "Why recording rules exist in an alerting pipeline: pre-computing expensive or frequently-evaluated expressions so alert rules stay cheap, and how that ties to rule-group evaluation cadence."
tags: ["prometheus", "alerting", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-23"
relations:
  - slug: prometheus/05-promql-masterclass/05-advanced-promql/05-advanced-promql
    kind: depends_on
  - slug: prometheus/06-alerting/02-alerting-rules/02-alerting-rules
    kind: related
  - slug: prometheus/11-appendices/05-prometheus-configuration-reference/05-prometheus-configuration-reference
    kind: related
---

# 1 — Recording Rules

This chapter is deliberately short. The full recording-rule YAML — the `record:` field, naming
conventions, how a recorded expression becomes a new time series — is covered in
[[05-advanced-promql|Advanced PromQL]], and this chapter does not repeat it. What belongs here
instead is the narrower question of _why_ recording rules exist at all inside an alerting pipeline,
and how their timing fits into Prometheus's evaluation model.

## Why Precompute Anything

An alert rule's `expr` is not evaluated once — it is re-run on every rule-group evaluation, forever,
for as long as the rule file is loaded. If that expression is cheap (a single metric selector, a
simple threshold), re-running it constantly costs nothing worth worrying about. But some expressions
are not cheap: heavy aggregations across many series, joins between app metrics and metadata, or
anything with a wide range-vector window. Paying that cost once is fine. Paying it every evaluation
cycle, forever, and potentially from multiple alert rules that each need the same underlying number,
is waste.

A recording rule exists to break that repetition. It computes an expensive or frequently-needed
expression once per evaluation cycle and stores the result as its own named time series. Alert rules
— and dashboards, and anyone querying by hand — can then reference that precomputed series directly
instead of re-deriving it. The expensive work happens once; everything downstream of it is a cheap
lookup.

## How This Ties Into Evaluation Cadence

Prometheus runs on two independent global clocks: `scrape_interval`, which governs how often targets
are polled for fresh samples, and `evaluation_interval`, which governs how often rule groups —
recording rules and alerting rules alike — are re-evaluated against whatever data is currently in
the TSDB. These are not the same clock, and recording rules only make sense once that distinction is
clear: a recording rule doesn't fetch new data any faster than a scrape provides it, it just decides
how often the _derived_ number gets recomputed from whatever data already exists.

Recording rules and alerting rules that live in the same rule group evaluate together, on the same
cadence, in the order they're defined. That matters in one practical way: if an alert rule depends
on a recorded series, the recording rule computing it must run — and be visible in the TSDB — before
the alert rule's own evaluation reads it. Getting the ordering or grouping wrong is a common source
of "the alert never fires" bugs that have nothing to do with the alert's threshold being wrong.

## When It's Actually Worth Reaching For

The honest signal for "this should be a recording rule" is repetition, not complexity for its own
sake: the same non-trivial expression is needed by more than one alert rule, or by a dashboard that
would otherwise re-run the expensive query on every page load, or by an expression slow enough that
you want to inspect its output as a stored series rather than re-running it ad hoc every time you
debug it. If an expression is only ever used once and is cheap, a recording rule adds a layer of
indirection for no benefit.

For the actual syntax — how to name a recorded series, how the `record:` and `expr:` fields are
structured, and the naming convention that keeps recorded metrics distinguishable from raw ones —
see [[05-advanced-promql|Advanced PromQL]].

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
