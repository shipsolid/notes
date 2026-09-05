---
title: "Chapter 3 — Monitoring at Scale"
description: "Prometheus, Mimir, Cortex, and Thanos as the horizontally-scaled answer to a single Prometheus instance running out of room."
tags: ["system-design", "observability", "book"]
updated: 2026-07-18
hidden: false
zettelId: "202607181257-29"
relations:
  - slug: observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb
    kind: depends_on
  - slug: prometheus/02-prometheus-data-model/02-labels-and-cardinality/02-labels-and-cardinality
    kind: related
  - slug: prometheus/07-production-prometheus/02-long-term-storage/02-long-term-storage
    kind: related
  - slug: observability/reference/mimir
    kind: related
---

## Chapter 3 — Monitoring at Scale

> Part 08 of the [[system-design/readme|System Design]] curriculum. Full treatment:
> [Storage & Query](../../../observability/README.md#03--storage--query) in the Observability book,
> and the [[prometheus/readme|Prometheus]] book for Prometheus-specific depth.

A metrics time-series database optimizes for one access pattern almost no other datastore does: an
enormous, constant write rate (one sample per series per scrape interval, forever) against queries
that are almost always a range-scan over time for a known set of series, never a point lookup by an
arbitrary key. Every design choice below follows from that one asymmetry.

## Write path: head block, WAL, and compaction

Samples land first in an in-memory **head block** — one append-only chunk per series, compressed
with delta/XOR-style encoding — mirrored to a **write-ahead log (WAL)** on disk so a crash doesn't
lose data that only ever existed in memory. Once the head block hits a size or time threshold, it
flushes to disk as an immutable block. Freshly flushed blocks are small and numerous, so
**compaction** merges them into fewer, larger ones — better compression, faster queries — at the
cost of **write amplification**: the same sample gets physically rewritten every time a block
containing it is compacted into a larger one.

## Cardinality is a storage-engine problem, not just a bill

Every new label combination is a brand-new series, which means a brand-new chunk stream in the head
block. A sudden cardinality spike doesn't just bloat storage over time — it inflates the live,
in-memory head block right now, which can slow ingestion and compaction for every other series
sharing that tenant or instance. A cardinality incident is a memory-pressure incident on the
ingestion path before it's ever a cost-line-item.

## From one node to a fleet: Mimir, Cortex, Thanos

A single Prometheus instance's TSDB is local — durable and fast, but not horizontally scalable and
not multi-tenant. Scaling that model out means sharding both storage and query across many nodes:
samples are sharded by tenant and series across ingesters, and a query spanning that sharding has to
scatter out to every relevant node and gather the results back. [[mimir|Mimir]], Cortex, and Thanos
are three different projects solving that same scale-out problem around the same Prometheus block
format and query language (PromQL), differing mainly in storage backend and operational model. Full
treatment:
[[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb|Metrics Storage (TSDB)]].

## What this means for a system design interview

"We'll use Prometheus" doesn't survive a 10x-scale follow-up. The interview-worthy answer names the
specific bottleneck a single-node TSDB hits first (ingestion memory pressure from cardinality, not
disk space), and states the scatter-gather mechanics of the horizontally-scaled alternative rather
than just naming Mimir/Cortex/Thanos as if they were interchangeable drop-in replacements.

## Where to go deeper

- [[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb|Metrics Storage (TSDB)]]
- [[system-design/08-observability/06-metrics-storage-tsdb/06-metrics-storage-tsdb|Metrics Storage (TSDB) — applied case study]]
  (Chapter 6 of this Part, stub)
- [[prometheus/readme|Prometheus]] book

## Metadata

|        |               |
| ------ | ------------- |
| Author | Amit Singh    |
| Scope  | system-design |
