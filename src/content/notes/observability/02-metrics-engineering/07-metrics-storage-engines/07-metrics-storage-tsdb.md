---
title: "7 — Metrics Storage (TSDB)"
description: "Chunk/block encoding, the write-ahead log, compaction and the write amplification it trades for query speed, and why a cardinality spike is a storage-engine problem, not just a cost line item."
tags: ["observability", "storage", "query", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-8"
relations:
  - slug: data-engineering/02-storage-systems/02-storage-engines/02-storage-engines
    kind: depends_on
  - slug: observability/reference/cardinality
    kind: depends_on
  - slug: observability/02-metrics-engineering/08-query-optimization/08-query-sharding
    kind: related
---

# 7 — Metrics Storage (TSDB)

A time-series database optimizes for one access pattern almost every other datastore doesn't: an
enormous, constant write rate (one sample per series per scrape interval, forever) against queries
that are almost always a range-scan over time for a known set of series — never a point lookup by an
arbitrary key. Every design choice below follows from that one asymmetry.

---

## The head block, chunks, and the WAL

A TSDB doesn't write each incoming sample straight to a durable file — it appends it to an in-memory
**head block**, one append-only chunk per series, and mirrors that write to a **write-ahead log
(WAL)** on disk so a crash doesn't lose data that was only ever in memory. Samples for the same
series land in the same chunk, compressed with delta/XOR-style encoding that exploits how little a
metric usually changes from one sample to the next — this is why time-series-specific storage beats
a generic row store here: the encoding is built around the specific shape of "mostly-similar numbers
sampled at a regular interval."

Once the head block reaches a size or time threshold, it's flushed to disk as an immutable block and
a new head block starts. Everything before that flush is append-only and cheap; everything after is
read-only and gets compacted.

---

## Compaction, and the write amplification it costs

Freshly flushed blocks are small and numerous — a query spanning a day might have to open dozens of
them. **Compaction** merges adjacent blocks into fewer, larger ones, which both shrinks total
storage (better compression on denser data) and speeds up queries (fewer blocks to open per query).
The cost is **write amplification**: the same sample gets physically rewritten to disk every time a
block containing it is compacted into a larger one, so total bytes written over a sample's lifetime
is a multiple of its original size, not just that size once. This is the same trade-off
[[data-engineering/02-storage-systems/02-storage-engines/02-storage-engines|LSM-tree compaction]]
makes in general-purpose storage engines, applied to a domain where the access pattern makes it an
even more clearly good deal — range-scan-heavy, append-only, rarely-updated data is exactly what
compaction-based storage is built for.

---

## Cardinality explosion is a storage-engine problem, not just a bill

[[cardinality|Cardinality]] and [[05-label-schema-design]] cover why an unbounded label is expensive
in general. At the storage layer specifically, that cost shows up as more than dollars: every new
label combination is a brand-new series, which means a brand-new chunk stream in the head block. A
sudden cardinality spike — a bad deploy that starts stamping a request ID as a label, say — doesn't
just bloat storage over time, it inflates the _live, in-memory_ head block right now, which can slow
ingestion and compaction for every other series sharing that same tenant or instance. A cardinality
incident is a head-block memory-pressure incident before it's ever a storage-cost incident.

---

## Downsampling and retention tiers

Keeping every raw sample forever is rarely worth its cost — most queries against data older than a
few weeks want a trend, not per-scrape-interval precision. **Downsampling** aggregates older data
into coarser resolution (5-minute rollups instead of 15-second samples) for long-term retention,
freeing raw-resolution storage for only the recent window queries actually need.

Downsampling is itself an aggregation, which means [[03-aggregation-composability]]'s rules apply
directly: a downsampled rollup has to be built from composable primitives (sum, count, min, max) or
merged histogram buckets — never from an already-computed percentile — or the rollup silently
encodes a wrong number that can never be corrected later, because the raw data it would need to
recompute from is exactly what downsampling discarded.

---

## From one node to a fleet

A single Prometheus instance's TSDB is local to that instance — durable and fast, but not
horizontally scalable and not multi-tenant. Scaling that model out (Mimir, Cortex, Thanos) means
splitting both storage and query across many nodes: samples get sharded by tenant and series across
ingesters, and a query that spans that sharding has to be scattered out to every relevant node and
gathered back — the exact mechanics [[08-query-sharding]] and [[02-shards-workers]] cover in
general, applied here to "the shards are TSDB blocks, the workers are store-gateways." Tooling:
[[prometheus|Prometheus]] is the single-node TSDB and query engine; [[mimir|Mimir]] is the
horizontally-scalable, multi-tenant long-term store built around the same block format.

---

## Why this matters for an Observability Architect

Most metrics-storage incidents are cardinality incidents wearing a different name — a slow query, an
OOMing ingester, a blown storage budget all frequently trace back to the same root cause: a label
combination nobody bounded. Reviewing a new metric's expected cardinality _before_ it ships, rather
than diagnosing which label caused the incident after the head block is already under pressure, is
the entire practical payoff of [[05-label-schema-design]] — this chapter is why that discipline
matters at the storage layer specifically, not just as a cost-governance abstraction.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
