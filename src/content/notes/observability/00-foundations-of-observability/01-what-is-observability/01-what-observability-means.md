---
title: "1 — What Observability Actually Means"
description: "Observability vs. monitoring, the three-pillars critique, and why observability is a property of how a system was instrumented — not a tool you bought or a dashboard you built."
tags: ["observability", "foundations", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-2"
relations:
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
  - slug: observability/00-foundations-of-observability/02-pillars-of-observability/02-the-signals
    kind: related
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: related
  - slug: observability/06-opentelemetry/04-auto-instrumentation/04-auto-vs-manual-instrumentation
    kind: related
  - slug: observability/reference/cardinality
    kind: related
---

# 1 — What Observability Actually Means

"We have Grafana, so we're observable" is the single most common misuse of the word. Observability
isn't a tool, a dashboard, or a signal type — it's a property of whether a system's existing
telemetry can answer a question nobody thought to ask in advance. Everything else in this chapter is
a consequence of that one distinction.

---

## The control-theory definition

**Observability** is a term borrowed from control theory: a system is observable if its internal
state can be inferred entirely from its external outputs. Applied to software, that becomes: can you
determine _why_ a system is behaving a certain way, using only the telemetry it already produces —
without shipping new code, adding a log line, and waiting for a redeploy to find out.

That last clause is the practical test. If answering a new question about production requires a code
change first, the system wasn't observable for that question — it was, at best, monitored for the
questions someone already anticipated.

---

## Monitoring answers known unknowns; observability covers unknown unknowns

**Monitoring** is watching for failure modes you already know about: a dashboard for CPU
utilization, an alert on error rate, a check on disk space. It's built by someone who sat down and
enumerated, in advance, the ways the system might fail. This works well for exactly the failure
modes on that list — a **known unknown**: you don't know _when_ disk will fill up, but you knew
disk-filling-up was worth watching for.

**Observability** is what you need for an **unknown unknown** — the failure mode nobody wrote a
check for, because nobody anticipated it, precisely because it's novel. You can't pre-build a
dashboard for a question you don't know you'll need to ask. What you can do instead is capture rich
enough, high-cardinality enough telemetry up front that _any_ question — including ones invented
during the incident itself — can be answered by slicing and correlating data you already have.

```
Monitoring:      failure mode → predefined check → alert
Observability:    (any behavior) → rich telemetry → arbitrary question, asked after the fact
```

This is why "we have dashboards for everything that's ever gone wrong before" is a monitoring
achievement, not an observability one — it says nothing about the failure mode that hasn't happened
yet.

---

## The three-pillars critique

Metrics, logs, and traces are commonly sold as "the three pillars of observability" — implying that
owning all three tools makes a system observable. This framing gets the causality backwards. Having
three separate telemetry types, each queried in its own tool, describes what you _collect_, not
whether you can actually _answer_ something with it. Three pillars that don't share a correlation
key are three separate monitoring tools bolted together, not one observable system — see
[[03-cross-signal-correlation]] for the mechanism (a shared trace ID and exemplars) that's actually
doing the work of turning three signal types into one investigable system.

[[02-the-signals|The Signals]] covers what each of the five signal types (the "three pillars" plus
profiles and events) is and isn't good for in isolation. This chapter is the argument for why none
of that matters on its own — the pillars are necessary, not sufficient. A team with beautiful
per-pillar dashboards and no way to pivot from a metric spike to the one trace and log line that
explains it has bought the tools without the property the tools were supposed to deliver.

---

## Observability is a property of the instrumentation, not the tooling

Two teams can run the identical observability _stack_ — same Grafana, same Prometheus, same Tempo —
and land on opposite sides of "observable." The difference is upstream of the tooling, in what gets
captured at emission time:

- **High-cardinality, high-dimensionality context.** Answering an unanticipated question usually
  means slicing by a dimension nobody thought to pre-aggregate — which build version, which customer
  tier, which specific pod. If that context was discarded before storage (or never captured at all)
  because it looked like a cardinality risk, no query written afterward can recover it. See
  [[cardinality]] and [[05-label-schema-design]] for where that trade-off actually gets made, one
  label at a time, long before anyone asks the question that needed it.
- **Correlation designed in, not queried in.** [[03-cross-signal-correlation]] makes the same point
  from the wire-format side: a shared identifier has to be stamped at emission time across every
  signal, or there's no way to reconstruct it retroactively once an incident is already underway.
- **Wide, structured events over narrow pre-aggregated ones.** A single wide event per request — one
  structured record carrying dozens of fields (route, tenant, cache outcome, retry count, feature
  flags in effect) — preserves the ability to group by any combination of them later. A metric
  pre-decides its grouping dimensions at instrumentation time; if the dimension the incident needs
  wasn't one of them, the metric can't retroactively grow it.

None of this is purchasable after the fact. A vendor migration doesn't make a system observable if
the underlying services still only emit four pre-aggregated counters and an unindexed text log.

---

## The practical test

Before calling anything "observable," ask: _the last time production did something nobody predicted,
could an engineer explain why using only telemetry that already existed — or did someone have to add
a log line, ship it, and wait?_ The former is observability doing its job. The latter is monitoring
with an observability-shaped marketing budget.

For a much longer, Socratic version of this same question — working through it across business
context, multi-tenancy, SLOs, and platform validation —
[[observability-architecture-qna|Observability Architecture: Questions to Ask]] is a
200-plus-question sequence built for exactly that kind of drilling.

---

## Why this matters for an Observability Architect

Every instrumentation decision in this book is really a bet about which unknown unknowns are worth
paying for in advance. [[05-label-schema-design]] is about not discarding a dimension you'll need
later; [[04-auto-vs-manual-instrumentation]] is about not leaving whole services uninstrumented
until someone happens to notice; [[03-cross-signal-correlation]] is about not losing the thread
between signals once an investigation starts. None of those chapters matter if the underlying belief
is "we bought the three pillars, we're covered" — that belief is exactly the gap this chapter exists
to close before it costs an incident to discover.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
