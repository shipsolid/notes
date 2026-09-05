---
title: "7 — Distributed Tracing Backend"
description: "How spans that arrive out of order, from different services, get assembled into one trace — and the two competing storage models (indexed search vs. object storage plus a trace-ID lookup) that trade query flexibility for cost."
tags: ["observability", "storage", "query", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-6"
relations:
  - slug: observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline
    kind: depends_on
  - slug: observability/reference/tempo
    kind: compared_to
  - slug: observability/reference/jaeger
    kind: compared_to
---

# 7 — Distributed Tracing Backend

A trace is never produced in one place. Its spans arrive from N different services, at different
times, out of order, each one only knowing its own `trace_id` and its parent `span_id` — not the
shape of the tree it belongs to. Everything a tracing backend does starts from that one fact: it has
to assemble a tree from parts that show up piecemeal, before it can be queried, rendered, or (per
[[01-opentelemetry-sdks-and-semantic-conventions|the Collector chapter]]) even sampled.

---

## Assembly: waiting for a trace to be "done"

Spans for the same `trace_id` land at the backend independently and asynchronously. Before a trace
can be considered complete, the backend has to buffer incoming spans under that `trace_id` and wait
out a completion window — long enough that a slow downstream span reasonably has time to arrive, but
not so long that memory holds open traces indefinitely. This is the same completeness problem
[[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|tail sampling]]
solves at the collector layer, one stage earlier: a gateway collector has to see every span before
deciding whether to keep the trace at all, and a storage backend has to see every span before it can
present the trace as one coherent tree rather than a handful of orphaned fragments.

---

## Two storage models, one trade-off

**The indexed model** (Jaeger's original architecture, in the Dapper/Zipkin lineage) writes every
span into a search-optimized index — by `trace_id`, service, operation name, tags — backed by a
store like Cassandra or Elasticsearch. This buys rich ad-hoc query: "find traces where
`service=checkout` and `http.status_code=500` and `duration>1s`," with no prior knowledge of which
trace you're looking for. The cost is the index itself — built and stored for every span, at full
span volume, whether or not that span is ever searched by tag.

**The radical simplification** ([[tempo|Tempo]]) drops the secondary index entirely: spans are
grouped by `trace_id` and written straight to object storage, with no way to query by tag at all.
You can only retrieve a trace if you already know its `trace_id` — from an exemplar, a correlated
log line, or a link from another trace. This is dramatically cheaper to store, but it's a direct bet
on [[03-cross-signal-correlation]] actually being wired up everywhere: it only works if something
else (a metric's exemplar, a log's `trace_id` field) always hands you the identifier, because the
backend itself has given up the ability to help you find one by content.

| Model                  | Query by tag, no known trace_id | Storage cost             | What it's betting on                              |
| ---------------------- | ------------------------------- | ------------------------ | ------------------------------------------------- |
| Indexed (Jaeger-style) | Yes — that's the point          | High — full span index   | You'll sometimes need to search, not just look up |
| Object storage (Tempo) | No — `trace_id` lookup only     | Low — no secondary index | Correlation always hands you a `trace_id` first   |

Neither model is wrong in isolation; each is correct for a different assumption about how traces
actually get found in practice. A platform betting on the object-storage model without
[[03-cross-signal-correlation|correlation]] actually working everywhere has quietly removed its own
ability to find a trace when correlation fails — which is precisely when someone would need to
search for one.

---

## What the backend hands back is a query-time concern

Once a trace is assembled, [[09-trace-shape|Trace Shape]] covers what that call tree should look
like in the rendered waterfall so a slow branch is visible; this chapter has been about how the
backend gets from a pile of independently-arriving spans to that tree in the first place — the
storage-side half of the same problem.

---

## What sampling upstream already decided for you

By the time a span reaches this backend,
[[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|the collector pipeline]]
and whatever [[05-19-head-vs-tail-sampling|head-vs-tail sampling]] policy it enforced have already
decided which traces exist to be stored at all. A tracing backend's storage model and its upstream
sampling policy are not independent decisions — an indexed backend that expects to answer "show me
every slow checkout trace" needs a sampling policy biased toward keeping the traces that question
needs, not a uniform random sample that keeps 1% of everything indiscriminately.

Tooling: [[tempo|Tempo]] is the object-storage-only model above; [[jaeger|Jaeger]] is the classic
indexed model, now (as of Jaeger v2) rebuilt on the OpenTelemetry Collector for ingestion rather
than bespoke code, even though its storage model remains the indexed one.

---

## Why this matters for an Observability Architect

Choosing a tracing backend is choosing which question you're allowed to ask without already knowing
the answer. An object-storage backend is the cheaper, and usually correct, choice for a platform
where correlation is genuinely solid everywhere — but adopting one is also a bet that nobody will
need "search by tag with no starting trace_id" often enough to matter. That's a real product
decision about how engineers are expected to start an investigation, not just a storage-cost
optimization.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
