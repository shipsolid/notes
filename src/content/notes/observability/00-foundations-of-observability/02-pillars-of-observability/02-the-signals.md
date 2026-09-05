---
title: "2 — The Signals"
description: "Metrics, logs, traces, profiles, and events — what each is built to capture, what it costs, and which question it actually answers vs. which one people mistakenly ask it."
tags: ["observability", "foundations", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153"
relations:
  - slug: observability/00-foundations-of-observability/01-what-is-observability/01-what-observability-means
    kind: related
  - slug: observability/02-metrics-engineering/03-histograms-deep-dive/03-aggregation-composability
    kind: related
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
  - slug: observability/11-visualization/02-golden-signals/02-tail-latency
    kind: related
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: related
---

# 2 — The Signals

Every observability question is really a question about which signal has the answer. Asking a metric
to explain _why_ one request was slow, or asking a trace to show a week-long trend, is a
signal-selection mistake before it's a tooling problem. Five signal types cover almost everything —
knowing what each is _for_, and what it quietly can't do, is the filter every later part of this
book assumes you already have.

---

## The five signals at a glance

| Signal  | Captures                                                  | Granularity                | Storage cost driver             | Best question it answers                             |
| ------- | --------------------------------------------------------- | -------------------------- | ------------------------------- | ---------------------------------------------------- |
| Metric  | A numeric measurement, aggregated over a time window      | Aggregate, not per-request | Cardinality — [[cardinality]]   | "Is this getting worse, and since when?"             |
| Log     | A discrete, timestamped record of one thing that happened | Per-event                  | Volume × verbosity              | "What exactly did this one component say happened?"  |
| Trace   | The causal call tree of one request across services       | Per-request                | Span count × retention          | "Which hop in this specific request was slow?"       |
| Profile | Where CPU/memory time is spent inside a process, sampled  | Per-process, sub-function  | Sample rate × symbol resolution | "Which function is actually burning the CPU?"        |
| Event   | A discrete, business/operationally-meaningful occurrence  | Per-occurrence, sparse     | Low — inherently infrequent     | "Did this regression start right after that change?" |

No signal is strictly better than another — each one throws away a different dimension of
information to stay cheap enough to run continuously in production. [[03-aggregation-composability]]
covers the mechanics of what a metric specifically throws away; this chapter is about the
higher-level choice of _which_ signal to reach for in the first place.

---

## Metrics

A metric is a number, with labels, sampled or aggregated over a time window. It answers "how much /
how many / how fast," cheaply, at high frequency, for every instance in the fleet — but only because
it has already discarded the identity of any individual request to get there.

**Good for:** dashboards, trend lines, alerting/SLO burn-rate math — anything that needs to run
continuously and cheaply across the whole fleet.

**Bad for:** explaining _why_ one specific request was slow or failed. A metric was never carrying
per-request identity, so there's nothing to drill into. This is exactly the gap [[02-tail-latency]]
opens with — the average hides the one slow request — and the gap [[03-cross-signal-correlation]]
closes, where an exemplar lets a metric point at one representative trace instead of staying silent
about which request caused the spike.

Metric cardinality — how many unique label combinations a metric produces — is the other edge of
this trade-off: more labels means finer-grained answers, at a direct storage and query cost. See
[[cardinality]] for the mechanics and [[05-label-schema-design]] for the design discipline that
keeps it bounded. Tooling: [[prometheus|Prometheus]]/PromQL is the exposition format and query
language most of the ecosystem now speaks; [[statsd|StatsD]] is the older UDP fire-and-forget
alternative, still alive as a compatibility ingestion shim.

---

## Logs

A log is a timestamped record of one specific thing a piece of code decided was worth writing down —
a request came in, a retry fired, a value was out of range. Unlike a metric, a log carries whatever
context the developer put in the message; unlike a trace, it has no built-in notion of which other
logs belong to the same request unless something ties them together (see
[[03-cross-signal-correlation]]).

**Good for:** the exact error message, stack trace, or payload that explains one specific failure —
detail no metric or trace span carries, because neither was designed to hold arbitrary
developer-written context.

**Bad for:** trend or aggregate questions at scale. "How has our error rate changed this month" is a
metric question wearing a log-shaped costume — grepping and aggregating raw log lines to answer it
costs far more at query time than a counter that was designed to answer it directly, once, at write
time.

**Structured vs. unstructured.** A structured log (JSON, key-value fields) is queryable by field
without parsing; an unstructured log (free text) is cheaper to write but forces the query engine to
parse or regex-match every line at read time — the same schema-on-write vs. schema-on-read trade-off
[[08-log-aggregation|Log Aggregation]] covers on the storage side. Tooling: [[loki|Loki]] indexes
only labels and treats log content as an opaque compressed blob until query time;
[[fluent-bit|Fluent Bit]] and [[telegraf|Telegraf]] are two of the common node-level agents that get
logs from a container's stdout to that backend.

---

## Traces

A trace is the causal tree of every span (unit of work) a single request touched, across every
service it hopped through. Where a metric answers "how much, on average," a trace answers "for this
one request, what happened, in what order, and how long did each step take."

**Good for:** finding which specific hop in a fan-out caused a slow or failed request — see
[[09-trace-shape]] for what that call tree should look like in the waterfall, and
[[05-partial-results-vs-fail-fast]] for how a trace should represent a hop that failed outright
rather than merely ran slow.

**Bad for:** cheap, complete coverage of every request. Capturing and storing a full trace for 100%
of traffic at scale is expensive enough that most systems sample
([[05-19-head-vs-tail-sampling|Head vs. Tail Sampling]]), which means the one request an on-call
engineer wants to inspect might simply not have been kept — the central tension of trace-sampling
design.

A trace only holds together across process boundaries because every hop propagates the same
`trace_id` — see [[03-cross-signal-correlation]] and [[08-deadline-propagation]] for the two values
that have to survive that same propagation chain (identity and deadline, respectively). Tooling:
[[tempo|Tempo]] stores spans with no dedicated index at all — just object storage and a trace-ID
lookup, queried with TraceQL.

---

## Profiles

A profile answers a question none of the other three signals above are built to answer: not "is this
slow," not "why did this request fail," but "which function, in which process, is actually spending
the CPU or memory right now." It's produced by periodically sampling a process's call stack
(continuous profiling) rather than instrumenting individual requests.

**Good for:** code-level attribution of resource usage — "why is this pod using two full cores" is a
profiling question; a trace shows _that_ a span took 400ms, a profile shows _what code inside that
span_ burned the CPU.

**Bad for:** request-level causal narrative (that's a trace's job) or free-text business context
(that's a log's job) — a profile has no concept of "this request" at all, only "this process, right
now."

Profiling is the newest of the five signals to become a first-class part of most observability
stacks, largely because continuous, low-overhead sampling only recently became cheap enough to run
in production by default rather than pulled on-demand during an investigation. See
[[05-continuous-profiling|Continuous Profiling]] for when that ingest cost is actually worth paying.

---

## Events

An event is a discrete, structured record of something that changed _about the system_, not
something the system's normal traffic produced — a deploy, a feature-flag flip, a config change, a
scaling action, an incident being declared. It sits closer to an annotation than to telemetry: it
exists to be overlaid on the other four signals, not queried in isolation at volume.

**Good for:** answering "did this regression start right after that change?" — a question a raw
metric graph can't answer on its own no matter how closely you stare at the inflection point,
because the metric has no idea a deploy happened at 14:02.

**Bad for:** anything needing continuous coverage. Events are sparse by design; treating them as a
general-purpose logging channel defeats the reason they're kept separate and low-volume in the first
place.

> Don't confuse this with **event sourcing** ([[13-event-sourcing]]) — that's an architectural
> pattern for deriving application state from a log of state-change events. An observability event
> is read-only telemetry about the system; it is never a source of application state.

---

## Choosing the signal for the question you're actually asking

| The question you're actually asking                           | Reach for                     |
| ------------------------------------------------------------- | ----------------------------- |
| "Is this getting worse, and when did it start?"               | Metric                        |
| "Did it start right after that deploy or config change?"      | Event, overlaid on the metric |
| "Show me the exact request that was slow — which hop was it?" | Trace                         |
| "What did this one component actually say went wrong?"        | Log                           |
| "Which function is burning the CPU in this pod?"              | Profile                       |

In practice an investigation moves left to right across this table: a metric says _something_ is
wrong, an event narrows _when_ it started, a trace finds _which hop_, a log explains _why_ that hop
failed, and a profile explains _why_ that hop was slow rather than merely failing outright. None of
that chain works without a shared identifier tying the steps together — see
[[03-cross-signal-correlation]] for the mechanism, and
[[01-what-observability-means|What Observability Actually Means]] for why treating these as five
siloed tools instead of one system is exactly the failure mode the "three pillars" critique of
observability is about.

---

## Why this matters for an Observability Architect

The most common instrumentation mistake isn't missing a signal — it's reaching for the wrong one
first. Teams that only have metrics try to answer "why" questions by adding more labels to a counter
until it becomes a cardinality incident (see [[cardinality]]); teams that only have logs try to
answer "how much / how often" questions by grepping and counting, at query costs a counter would
have paid once, at write time. Designing a service's observability coverage means deliberately
picking which of these five signals earns its cost for which class of question, rather than
defaulting to whichever one the team already knows how to emit.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
