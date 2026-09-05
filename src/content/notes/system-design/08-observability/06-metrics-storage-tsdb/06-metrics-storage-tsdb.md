---
title: "Chapter 6 — Metrics Storage (TSDB)"
description: "Write amplification, chunk encoding, compaction, cardinality explosion."
tags: ["system-design", "observability", "maang-prep", "book"]
hidden: false
zettelId: "202607132223-3"
---

## Chapter 6 — Metrics Storage (TSDB)

> Chapter of Part 08 — Observability, part of [[system-design/readme|System Design]].

## Purpose

Write amplification, chunk encoding, compaction, cardinality explosion — written up as a conceptual
chapter in the observability book rather than duplicated here; see
[[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb|Metrics Storage (TSDB)]]
for the head block/WAL/compaction model and why a cardinality spike is a storage-engine incident.

> `[stub: metrics-storage-tsdb]` — this chapter is still a placeholder for the
> system-design-specific treatment (capacity numbers, failure-mode walkthroughs, worked practice
> questions). Greppable doc-debt marker.

## Metadata

| Dimension | Detail                                                     |
| --------- | ---------------------------------------------------------- |
| Author    | Amit Singh                                                 |
| Scope     | MAANG interview preparation — not production documentation |
