---
title: "5 — Continuous Profiling"
description: "What makes always-on, sampling-based profiling cheap enough to run in production continuously, why it earns that cost mainly for hot or expensive services, and how a profile correlates back to the one trace that was running during the sample."
tags: ["observability", "aiops", "profiling", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-16"
relations:
  - slug: observability/00-foundations-of-observability/02-pillars-of-observability/02-the-signals
    kind: depends_on
  - slug: observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend
    kind: compared_to
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
  - slug: observability/02-metrics-engineering/03-histograms-deep-dive/03-aggregation-composability
    kind: depends_on
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-30-q5-answer-add-continuous-profiling-signal
    kind: related
---

# 5 — Continuous Profiling

[[02-the-signals|The Signals]] leaves this question open: a profile answers "which function is
actually burning the CPU," a question none of the other four signals answer — but that chapter
defers _when the ingest cost is worth paying_ to here.

---

## Continuous vs. on-demand

Classic profiling is triggered manually, for a short window, during an investigation: attach a
profiler, reproduce the problem, detach, read the output. Useful, but only if the problem can be
reproduced on demand and someone already suspects where to look before attaching anything.

**Continuous profiling** runs always-on, low-overhead sampling in production, so a profile already
exists for whatever time window an incident happened in — no reproduction required, because the data
was being collected the whole time, the same bet
[[observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend|distributed tracing's object-storage model]]
makes for traces: pay a small continuous cost so the thing you'd want during an incident is already
there when you need it, rather than having to be recreated under pressure.

---

## Why it's cheap enough to run continuously

Two things keep the overhead low enough to leave on by default:

- **Sampling, not instrumentation.** A profiler periodically samples the call stack rather than
  instrumenting every function call — overhead scales with sample _rate_, not with how much code
  runs, which is why continuous profiling can run at well under 1% CPU overhead where per-call
  instrumentation would be far more expensive.
- **eBPF makes it zero-code-change.** [[ebpf|eBPF]]-based profilers (Grafana Beyla, Pyroscope) can
  sample a process's stack from the kernel with no code changes and no language-specific agent —
  arguably the clearest case in [[04-auto-vs-manual-instrumentation]]'s whole spectrum: nobody
  hand-instruments every function for profiling: continuous profiling is inherently the automatic
  end of that spectrum, by construction, not by choice among alternatives.

---

## Why it stores and compresses well

A flame graph is a merged, aggregated view of many stack samples — stack-sample counts compose by
plain summation, the same composable-primitive property [[03-aggregation-composability]] requires
for any signal that needs to be correctly mergeable across instances or time windows. This is
exactly why profiles compress well relative to a signal that couldn't be losslessly merged the same
way.

---

## When it actually earns its cost

Always-on isn't the automatically-correct default everywhere it's technically cheap to enable — it's
a genuine cost/benefit call:

- **Worth it:** hot paths and cost-sensitive services at real scale, where "which function" is a
  question that comes up often enough — and where a small CPU-cost reduction, multiplied across the
  fleet, is worth more than the profiling overhead itself.
- **Often not worth it:** a low-traffic service where the rare investigation that needs a profile
  can attach one on demand, at zero ongoing cost the rest of the time.

---

## The frontier move: correlating a profile to one trace

The most useful version of this signal doesn't stop at "here's a flame graph for this time window" —
it links a specific stack sample to the specific trace/span that was executing during it, the same
[[03-cross-signal-correlation]] mechanism applied to a fourth signal: not just "this function was
hot sometime in this hour," but "this function was hot during _this specific slow request_."

[[05-30-q5-answer-add-continuous-profiling-signal|Adding Continuous Profiling as a Signal]] walks
through what adding this to an existing pipeline looks like end to end.

---

## Why this matters for an Observability Architect

Profiling is the signal most likely to get adopted for the wrong reason — "we should have this
because it's the new fourth pillar" — rather than the right one: a specific, recurring class of
"which function is actually expensive" question that traces and metrics can't answer on their own.
Turning it on everywhere by default, rather than where the cost/benefit case is real, is how a
genuinely useful signal turns into ingest spend nobody ever queries.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
