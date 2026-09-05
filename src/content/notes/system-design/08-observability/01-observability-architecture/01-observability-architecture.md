---
title: "Chapter 1 — Observability Architecture"
description: "Metrics, logs, traces, and profiles as the four correlated signal types every observability platform is built around."
tags: ["system-design", "observability", "book"]
updated: 2026-07-18
hidden: false
zettelId: "202607181257-30"
relations:
  - slug: observability/00-foundations-of-observability/01-what-is-observability/01-what-observability-means
    kind: depends_on
  - slug: observability/00-foundations-of-observability/02-pillars-of-observability/02-the-signals
    kind: depends_on
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
  - slug: system-design/08-observability/04-alerting-systems/04-alerting-systems
    kind: related
  - slug: system-design/07-reliability-engineering/01-reliability-sli-slo-sla/01-reliability-sli-slo-sla
    kind: related
---

## Chapter 1 — Observability Architecture

> Part 08 of the [[system-design/readme|System Design]] curriculum. The full treatment lives in the
> [[observability/readme|Observability]] book's Foundations part — this chapter is the
> curriculum-level summary and the interview framing on top of it.

An observability architecture is built around one property, not a shopping list of tools: can an
engineer explain why a system behaved a certain way using only telemetry it already emits — without
shipping a code change first and waiting to find out. That distinction —
[[01-what-observability-means|monitoring vs. observability]] — is one an L6/L7 candidate should be
able to state precisely, not just gesture at "we have Grafana."

## The four correlated signals

Four signal types cover almost every telemetry question, and each earns its cost by deliberately
discarding a different dimension of information:

| Signal  | Answers                                        | Discards                        |
| ------- | ---------------------------------------------- | ------------------------------- |
| Metric  | "Is this getting worse, and since when?"       | Per-request identity            |
| Log     | "What did this one component actually say?"    | Aggregate/trend view            |
| Trace   | "Which hop in this request was slow?"          | Cheap, complete (100%) coverage |
| Profile | "Which function is burning the CPU right now?" | Request-level narrative         |

See [[02-the-signals|The Signals]] for the full five-signal treatment (metrics, logs, traces,
profiles, and events) and what each is built to capture.

## Why "three pillars" is the wrong frame for an interview answer

Naming metrics/logs/traces as three separate tools is a monitoring answer, not an architecture
answer. The signals have to share a correlation key — a trace ID propagated across every hop, an
[[exemplars|exemplar]] linking a metric spike back to one representative trace — or three
well-instrumented pillars are still three disconnected monitoring tools bolted together. This is the
single most common gap between a senior-level and a principal-level design: a senior candidate lists
the three pillars; a principal candidate explains how a metric spike gets a responder to the one
trace and log line that explains it, in under a minute.

## What this means for a system design interview

When a design calls for "add observability," the L6/L7 answer names the specific signal for the
specific question at hand, states the correlation mechanism tying signals together, and is explicit
about what gets sampled or dropped and why.
[[01-reliability-sli-slo-sla|Reliability: SLI, SLO, SLA & Error Budgets]] covers the number this
architecture ultimately feeds; [[04-alerting-systems|Alerting Systems]] covers what happens once
that number crosses a threshold.

## Where to go deeper

- [[01-what-observability-means|What Observability Actually Means]]
- [[02-the-signals|The Signals]]
- [[03-cross-signal-correlation|Cross-Signal Correlation]]

## Metadata

|        |               |
| ------ | ------------- |
| Author | Amit Singh    |
| Scope  | system-design |
