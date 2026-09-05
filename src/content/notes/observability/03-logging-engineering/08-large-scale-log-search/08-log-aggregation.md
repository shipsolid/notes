---
title: "8 — Log Aggregation"
description: "Schema-on-write vs. schema-on-read as competing bets about when to pay indexing cost, and the two different deduplication problems a log pipeline actually has to solve."
tags: ["observability", "storage", "query", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-7"
relations:
  - slug: observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb
    kind: related
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: depends_on
  - slug: observability/02-metrics-engineering/03-histograms-deep-dive/03-aggregation-composability
    kind: depends_on
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: depends_on
---

# 8 — Log Aggregation

Log volume is enormous, and the overwhelming majority of it is never read. That single fact is
almost the entire explanation for why log storage looks the way it does: every design decision below
is a bet about _when_ to pay the cost of making a log line queryable — at write time, for
everything, whether or not it's ever read, or at query time, only for the fraction that actually
gets searched.

---

## Schema-on-write: index everything, up front

The classic approach (Elasticsearch/ELK-style) parses and indexes every field of every log line at
ingest time — full-text index on the message, indexed fields for every structured attribute. Once
indexed, a query against any field is fast, because the index already did the work.

**The cost is paid on 100% of log volume, whether or not that log line is ever queried.** At the
volume real systems produce logs, that's an enormous amount of indexing work spent on lines nobody
will ever look at — and the index itself, not the raw log content, tends to become the dominant
storage cost.

---

## Schema-on-read: index almost nothing, parse at query time

[[loki|Loki]]'s approach inverts the bet: index only a small, low-cardinality label set (the same
[[05-label-schema-design|label discipline]] a metric needs, applied to logs), and store the log
line's actual content as an opaque, compressed blob. A query first narrows to the right stream using
the cheap label index, then parses or regex-matches the actual content _only for the lines that
survive that filter_ — the same [[02-the-signals|structured vs. unstructured]] distinction from The
Signals, but this is the storage-layer consequence of it: unstructured content defers parsing cost
to query time, structured content lets a query engine skip parsing for fields it can extract
cheaply.

**The cost is paid only on what's actually queried**, at the price of a slower query on the (usually
small) subset of logs a search actually touches. At log volumes where 99% of lines are never read,
that's almost always the better bet — defer the expensive work to the moment something is actually
worth paying for, rather than up front for data that mostly goes unread.

---

## Two different deduplication problems

"Log deduplication" is actually two unrelated problems that get solved differently:

1. **Delivery-side duplicates.** An at-least-once delivery pipeline — a collector retrying after a
   timeout it can't distinguish from a dropped acknowledgment — can deliver the same log line twice.
   The fix is a dedup key derived from the line's content plus its source position (not just a hash
   of the message text alone, or two genuinely identical log lines get incorrectly merged into one).
2. **Collection-side duplicates.** Two collector replicas can momentarily both tail the same file
   offset during a rolling restart or a leader handoff, shipping the same lines twice from the
   _source_ rather than the transport. This is a coordination problem at the collection layer (which
   replica owns which file/offset right now), not a delivery-retry problem, and needs a different
   fix — typically exactly-once ownership handoff between collector replicas, not a dedup key at
   all.

Conflating the two is a common mistake: a content-hash dedup key fixes the first problem and does
nothing for the second, because the second isn't about retries — it's about two collectors that both
correctly believe they own the same file at the same moment.

---

## Retention: deletion, not downsampling

[[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb|Metrics storage]]
ages old data out by downsampling — averaging it down to a coarser resolution, which works because
the composable primitives behind an average survive that compression (see
[[03-aggregation-composability]]). A log line has no such composable primitive; there is no
coarser-resolution version of "cache miss, retrying" that preserves its meaning. Log retention is
therefore just deletion past a cutoff, not compression — which makes the retention window itself the
entire cost-control lever, rather than one lever among several.

---

## Correlation back to traces

A log line's value multiplies enormously once it can be found _from_ a trace, not just searched for
directly — see [[03-cross-signal-correlation]] for the mechanism (a shared `trace_id`, attached to
the log at write time). [[correlation|Log-to-Trace Correlation]] walks through a concrete, real
implementation of exactly that: extracting `trace_id`/`span_id` at the collection layer and
attaching them as Loki structured metadata, purely so "logs for this span" can be a one-click jump
rather than a manual search.

---

## Why this matters for an Observability Architect

Schema-on-write and schema-on-read aren't a strictly-better-or-worse choice — they're a bet about
the ratio of logs written to logs ever read, and that ratio is almost always more lopsided than
intuition suggests. Defaulting a platform to schema-on-write because "queries should be fast" prices
in full indexing cost for the 99% of log volume nobody will read, to save query latency on the 1%
that gets searched — usually the wrong side of that trade at any real production volume.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
