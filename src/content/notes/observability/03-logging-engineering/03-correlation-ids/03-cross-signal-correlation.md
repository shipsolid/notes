---
title: "3 — Cross-Signal Correlation"
description: "Metrics, logs, and traces are only more useful together than apart if something ties a specific instance of each of them back to the same event. The shared identifier that makes that jump possible — and what breaks when a hop in the call chain doesn't carry it."
tags: ["concepts", "distributed-systems", "observability", "tracing", "maang-prep"]
updated: 2026-07-16
hidden: false
zettelId: "202607161816-2"
relations:
  - slug: observability/02-metrics-engineering/03-histograms-deep-dive/03-aggregation-composability
    kind: related
  - slug: observability/06-opentelemetry/08-context-propagation/08-deadline-propagation
    kind: related
  - slug: observability/00-foundations-of-observability/01-what-is-observability/01-what-observability-means
    kind: related
  - slug: observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend
    kind: related
  - slug: observability/11-visualization/01-dashboard-design/01-dashboard-design
    kind: related
---

# 3 — Cross-Signal Correlation

Three dashboards open side by side — one for metrics, one for logs, one for traces — eyeballed
against a shared timestamp is not observability. It's three monitoring tools open at once. What
turns them into one system is a value that shows up in all three: a **trace ID**.

---

## The problem each signal alone can't solve

| Signal | Tells you...                                | Doesn't tell you...                         |
| ------ | ------------------------------------------- | ------------------------------------------- |
| Metric | _that_ p99 latency spiked at 14:02          | _which_ request, _why_                      |
| Log    | one service logged an error at 14:02:03     | what else happened across the other 11 hops |
| Trace  | the full call tree for one specific request | whether this request is representative      |

A metric is cheap because it's pre-aggregated — and that aggregation is exactly what throws away the
"which one" information (see [[03-aggregation-composability]] for why that aggregation itself has
sharp edges). A trace has the "which one" detail but only for the one request it happened to
capture. Neither signal, alone, answers "the metric spiked — show me a request that caused it."
Correlation is the mechanism that answers that question.

---

## The mechanism: a shared identifier, stamped at emission time

```
Request enters the system
        │
        ▼
  trace_id = 7a3f...  ◄── generated once, at the edge
        │
        ├──► Service A span (trace_id: 7a3f...)
        │        └──► log line: {"trace_id": "7a3f...", "msg": "cache miss"}
        │
        ├──► Service B span (trace_id: 7a3f...)
        │        └──► log line: {"trace_id": "7a3f...", "msg": "retrying upstream"}
        │
        └──► histogram observation, tagged with
             exemplar → trace_id: 7a3f...
```

The **W3C Trace Context** standard (the `traceparent` header) is what makes this possible across
process boundaries — every hop propagates the same `trace_id` (and its own `span_id`) to the next.
This is the same propagation problem [[08-deadline-propagation]] describes for deadlines: a value
generated once at the edge has to survive every hop, or it's useless past the first one.

Once every span of a request carries the same `trace_id`:

- **Logs** emitted during that span can be structured to include the `trace_id` field, so a log line
  can be traced back to the exact request (and trace) it happened during.
- **Metrics** can attach an **exemplar** — a sampled data point on a histogram observation that
  carries a `trace_id` — turning one bucket of an aggregate metric into a doorway straight into one
  concrete trace that landed in that bucket.

---

## What this buys you

```
Alert fires: p99 latency > 500ms
        │
        ▼
Metric panel → click the exemplar dot on the spike
        │
        ▼
Land on one specific trace with trace_id 7a3f...
        │
        ▼
"Logs for this span" — query logs filtered to {trace_id="7a3f..."}
        │
        ▼
See the exact log line that explains the 500ms: "retrying upstream, attempt 3/3"
```

Three signals, three different cost/detail trade-offs, one identifier connecting them. This is the
concrete mechanism behind the abstract claim in the observability-vs-monitoring debate — see
[[01-what-observability-means]] — that observability is a _property of the system as instrumented_,
not a feature of any one tool. Without a shared correlation key stamped at emission time, no amount
of tooling bolted on afterward reconstructs it; correlation has to be designed in, not queried in.

---

## Where correlation silently breaks

The chain only holds as long as every hop propagates context. Common breakpoints:

- **Async boundaries** — a request enqueues a job onto a message queue or a background worker; if
  the producer doesn't inject `traceparent` into the message and the consumer doesn't extract it,
  the trace goes cold at the queue and a brand-new trace starts on the other side.
- **Batch and cron jobs** — work that isn't triggered by a single inbound request often has no trace
  context to inherit at all, and needs its own deliberately-created root span.
- **Third-party or legacy services that strip unknown headers** — a proxy, gateway, or
  not-yet-instrumented service in the middle of the call chain can drop `traceparent` even when
  every service around it propagates correctly.
- **Log lines written before the span starts** — anything logged during startup, health checks, or
  outside request scope has no `trace_id` to attach, by construction, not by bug.

Each of these produces the same symptom: a trace with a gap, or a log line that can't be pivoted to
from anywhere. Diagnosing "why did correlation break here" is almost always "find the hop that
didn't propagate or didn't attach context," not a data-loss problem in the backend.

---

## Where this recurs across the rest of this book

- **Pipeline** — an OTel Collector processor that rewrites or drops span/log attributes can strip
  the very field correlation depends on; correlation has to be an explicit invariant of pipeline
  design, not an assumption.
- **Storage & query** —
  [[observability/04-distributed-tracing/07-trace-storage/07-distributed-tracing-backend|Distributed Tracing Backend]]
  assembles a trace by joining spans on `trace_id`; [[08-log-aggregation|Log Aggregation]] joins
  logs to traces the same way. Both depend on the identifier surviving everything upstream of them.
- **Dashboards & alerting** — "jump from this alert to a representative trace" is only possible
  because of exemplars; see [[01-dashboard-design]].
- **Frontier** — [[01-aiops-agentic-rca|AIOps / Agentic RCA]] automating root-cause analysis is, in
  effect, automating the same jump a human makes by clicking an exemplar — it depends on the same
  correlation identifier being present and unbroken.

---

## Why this matters for an Observability Architect

Correlation is a design decision made at instrumentation time, and it is one of the most expensive
things to retrofit — it requires every service in the request path to agree on propagation, which
usually means touching every service at once rather than one team incrementally opting in. When
reviewing a new service's instrumentation, "does this propagate trace context through every outbound
call, queue, and background job it makes" is a harder and more valuable question than "does it emit
metrics" — a service with great metrics and broken correlation still leaves an on-call engineer
manually eyeballing timestamps across three tools during an incident.
