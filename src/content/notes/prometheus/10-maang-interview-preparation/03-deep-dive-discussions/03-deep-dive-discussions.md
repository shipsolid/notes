---
title: "3 — Deep Dive Discussions"
description: "Interview-framed answers to the 'why' questions candidates get asked about Prometheus — why pull, why not SQL, why labels — honestly scoped to what this book actually has source material for."
tags: ["prometheus", "interview-prep", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-34"
relations:
  - slug: prometheus/01-prometheus-architecture/02-pull-model-deep-dive/02-pull-model-deep-dive
    kind: related
  - slug: prometheus/05-promql-masterclass/01-promql-fundamentals/01-promql-fundamentals
    kind: related
  - slug: prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality
    kind: depends_on
  - slug: observability/reference/cardinality
    kind: depends_on
---

# 3 — Deep Dive Discussions

## Overview

Interviewers rarely stop at "what does Prometheus do." Once a candidate demonstrates mechanical
familiarity, the follow-up is almost always a "why" question — why did this system make the design
choice it made, and what would break if it hadn't? This chapter collects the "why" questions most
likely to come up about Prometheus and answers them the way you'd want to answer them live: as a
reasoned argument, not a feature list.

Being asked to reason about a design decision is different from being asked to explain how the
decision plays out mechanically. The same underlying material can serve both purposes, but the
framing changes what's being tested — an architecture chapter wants you to understand the mechanism;
an interview wants you to defend the mechanism's reason for existing under follow-up pressure. Where
this chapter's source material overlaps with an architecture chapter elsewhere in this book, that's
intentional and called out explicitly below, not accidental duplication.

This chapter is honest about its own gaps. Ten "why" questions worth knowing are named here; only
some of them have real source material behind them in this book. The rest are listed plainly as open
— no invented answers.

## Why Pull, Not Push?

**The question:** "Prometheus chose a pull-based scrape model. Why not push, like Graphite or
Logstash? Isn't push more natural for metrics — the source knows when it has data, why should the
monitoring system have to go ask for it?"

This is a fair challenge, and the honest answer has three parts.

**First, observability of the monitoring system itself.** In a push-based model, silence from a
target is ambiguous: did it crash, did it get decommissioned on purpose, or is the network just
slow? A pull-based scraper avoids that ambiguity because it holds the authoritative list of what's
supposed to be there — a failed scrape against a target on that list is a clean, unambiguous signal,
not something that has to be inferred from absence.

**Second, load control sits with the side that can actually reason about capacity.** A push-based
collector has no control over how many targets decide to send data at the same moment; a thundering
herd of pushes can overwhelm it. A pull-based scraper paces itself against its own scrape interval
and concurrency settings, so the system doing the collecting is also the system setting the pace.

**Third, a single source of truth for what's monitored.** Because Prometheus (via static config or
service discovery) owns the target list, there's one place to answer "what is this server supposed
to be watching" — rather than that answer being scattered across every target's own push
configuration.

**Where push still wins, and why Prometheus doesn't pretend otherwise:** short-lived batch jobs —
cron jobs, one-off scripts, CI steps — finish and exit before a scrape interval could ever reach
them. Prometheus's answer isn't to abandon the pull model for these; it's the **Pushgateway**, a
buffer the job pushes to right before exiting, which Prometheus then scrapes on its normal schedule.
The system stays pull-only from Prometheus's own point of view; the push only happens on the one hop
where pull genuinely can't reach.

A candidate who can name that trade-off — and volunteer the Pushgateway as the escape hatch rather
than waiting to be asked about it — is demonstrating exactly the kind of "I know why, not just what"
depth this question is probing for.

**Cross-link:** [[02-pull-model-deep-dive|Pull Model Deep Dive]] covers this at the architecture
level — the mechanism, its limitations, and the Pushgateway flow in more detail. Some overlap with
the argument above is expected and fine: that chapter is teaching the mechanism, this one is
teaching the defense of the mechanism under interview follow-up. If you're prepping for a
system-design or "explain the internals" conversation, read that chapter. If you're prepping to
defend a design choice out loud, this section is the one to rehearse.

## Why Not Just Use SQL?

**The question:** "You've got numeric time-stamped data with labels. Why does that need its own
query language at all? A relational database already has aggregation functions, joins, and a query
optimizer — why not just store metrics as rows and query them with SQL?"

This chapter is the primary home for this argument in the book — if you've read the PromQL basics
chapter first, note that
[[01-promql-fundamentals|05-promql-masterclass/1-promql-fundamentals/promql-fundamentals.md]] only
forward-points here for the full case rather than repeating it. This is where the argument actually
lives.

**The core problem is shape, not capability.** SQL is not incapable of aggregation — `SUM`, `AVG`,
and friends exist in every relational engine. The mismatch is that a relational engine is built
around rows that represent discrete, individually meaningful records, while a metric is a stream of
samples that only means something as a time series: the same metric name and label set, sampled over
and over, forever. Modeling that stream as relational rows works in principle and falls over in
practice, because the volume of samples a monitoring system generates is orders of magnitude beyond
what a general-purpose relational schema is built to index and scan efficiently. Prometheus's
response is a purpose-built time series database and a query language, PromQL, shaped around exactly
one kind of data — timestamped samples keyed by a metric name and label set — rather than a
general-purpose language trying to be efficient at everything.

**The custom data model earns its keep on storage efficiency.** Every sample in Prometheus is a
timestamp plus a value, stored as part of a time series rather than as an independent row with its
own overhead. That specialization is what keeps per-sample storage cost low even as the sample count
climbs into the billions across a fleet — a relational engine paying full row/index overhead per
sample would not scale the same way at the same hardware cost.

**Histograms make the contrast concrete.** Consider tracking HTTP request duration. A relational
approach would mean logging a row per request — one column for status, one for latency, one for
timestamp — and then querying that table for distribution shape. At any real traffic volume that
table becomes enormous, and computing something like a 90th-percentile latency means scanning and
sorting a huge row set on the fly. Prometheus instead has the client library maintain histogram
buckets as pre-aggregated counters (`≤100ms`, `≤500ms`, `≤1s`, and so on) — every observation just
increments the counter for the bucket it falls into. No per-request table, and the accuracy loss is
bounded by the bucket boundaries you chose, not a limitation of the query layer.

**Percentiles are the sharpest version of this argument.** Computing an exact percentile in SQL over
a large table typically means a window function and a sort over the full result set — expensive, and
it gets worse as the table grows, not better. PromQL's `histogram_quantile()` function computes an
_interpolated_ percentile directly from the pre-aggregated bucket counters in roughly constant work
relative to the number of buckets, regardless of how many raw observations fed into them. The
candidate-worthy way to frame this: SQL asks you to solve percentiles by brute-force scanning after
the fact; Prometheus asks the instrumentation to pre-aggregate at write time, so the read-time query
is compact by construction.

**One paragraph to say out loud in an interview:** "Prometheus doesn't use SQL because the data
doesn't have SQL's shape — it's an ever-growing stream of timestamped samples per label set, not a
table of independent records. A general relational engine can technically model that, but it pays
full per-row overhead at a volume where that overhead compounds badly, and its query patterns
(scan-then-sort for percentiles, for example) get more expensive as data grows rather than staying
bounded. Prometheus's response is a purpose-built time series database with pre-aggregated histogram
buckets and a query language, PromQL, whose primitives — range selectors, `rate()`,
`histogram_quantile()` — are shaped around exactly the queries a monitoring system actually needs to
run, at the volume it actually needs to run them at."

## Why Labels? Why Does High Cardinality Hurt?

Both of these are real, frequently-asked "why" questions, but this book already has a dedicated home
for the reasoning, and repeating it here would just be a worse copy. Rather than re-derive the
argument:

- For **why labels exist at all** — the difference between one metric per dimension (e.g. a separate
  `requests_auth_total`, `requests_cart_total`, ... per API path) versus one metric with a `path`
  label that a single `sum()` can aggregate across — see
  [[02-labels-and-cardinality|Labels and Cardinality]].
- For **why high-cardinality labels are dangerous** — the mechanism by which unbounded label values
  (request IDs, raw user IDs, full URLs) multiply time series counts and blow up memory and storage
  — see the same chapter, and the deeper cross-topic treatment at
  [[cardinality|tech/cardinality.md]].

If asked either question live, the answer is: labels exist so one metric can be sliced along
multiple dimensions without an explosion of separately-named metrics, and cardinality hurts because
each unique label _combination_ is a distinct time series that Prometheus has to track in memory —
so the failure mode isn't "one big label," it's the multiplicative blow-up across all the labels on
a metric at once. The two linked chapters carry the full mechanism and mitigation strategies; this
chapter isn't the place to re-derive them.

## Unanswered "Why" Questions

The following are exactly the kind of "why" or "how does it work internally" questions a
staff/principal-level interviewer would reasonably ask next — and this book, honestly, has no source
material to answer any of them yet. Rather than improvise plausible-sounding internals, they're
listed here as open gaps, consistent with the fact that TSDB internals, scaling, and performance
tuning are all stub chapters elsewhere in this book:

- **Why a custom TSDB instead of an existing time series database?** No source material on the
  specific design trade-offs Prometheus's authors weighed against alternatives.
- **Remote write internals** — the wire protocol, batching/retry behavior, and backpressure handling
  between Prometheus and a remote-write receiver. Not covered anywhere in this book yet.
- **Query engine internals** — how PromQL expressions are parsed, planned, and executed against the
  TSDB, and where the actual cost centers are in a complex query. Not covered.
- **WAL recovery** — what happens to in-flight, unpersisted samples on a crash, and how the
  write-ahead log is replayed on restart. Not covered.
- **TSDB compaction** — how head blocks get compacted into persistent blocks on disk, and what the
  trade-offs are between compaction frequency, query latency, and disk I/O. Not covered.

If one of these comes up in an interview, the calibrated answer is to say plainly that you'd want to
go verify the internals rather than guess — which is a more senior answer than a confident wrong
one, and it's the same posture this book takes toward its own gaps.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
