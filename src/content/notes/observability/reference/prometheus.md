---
title: "What is Prometheus"
description: "CNCF's second graduated project (2018) — the pull-based metrics monitoring system and query language (PromQL) that defined the exposition format nearly every metrics tool now speaks, and the API that Grafana Mimir scales out horizontally."
tags: ["tech", "observability", "metrics", "cncf"]
updated: 2026-07-12
hidden: false
zettelId: "202607121601-6"
relations:
  - slug: observability/reference/mimir
    kind: related
  - slug: observability/reference/cardinality
    kind: related
  - slug: prometheus/00-monitoring-foundations/03-prometheus-in-the-observability-ecosystem/03-prometheus-in-the-observability-ecosystem
    kind: related
  - slug: prometheus/06-alerting/03-alertmanager/03-alertmanager
    kind: related
  - slug: observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb
    kind: related
---

Prometheus is a metrics monitoring system built at SoundCloud in 2012, modeled on Google's internal
Borgmon, and donated to the CNCF in 2016 — the second project accepted after Kubernetes itself, and
the first to graduate alongside it in 2018. Its exposition format and query model (PromQL) are now
the de facto standard: OTel metrics, cloud-provider exporters, and most vendor agents either speak
Prometheus format natively or convert to/from it at the boundary.

---

## Core model: pull, not push

```
Prometheus server
     │
     │  scrape (HTTP GET) on interval, via service discovery
     ▼
target:9090/metrics  ──▶  text exposition format
     │
http_requests_total{method="GET",status="200"} 84213
http_request_duration_seconds_bucket{le="0.1"}  71200
node_memory_available_bytes                     3.4e9
```

Prometheus reaches out to targets rather than waiting for them to push — service discovery (k8s SD,
file SD, Consul, EC2, ...) tells it what to scrape, and a missed scrape is itself an observable
signal (`up == 0`), which a push model doesn't get for free.

## Four metric types

| Type          | Client-side semantics                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| **Counter**   | Monotonically increasing — use `rate()`/`increase()` in PromQL, never read raw |
| **Gauge**     | Point-in-time value that can go up or down                                     |
| **Histogram** | Pre-defined buckets, server-side percentile math via `histogram_quantile()`    |
| **Summary**   | Client-side quantiles — cheaper to query, can't be aggregated across instances |

Histograms are almost always preferred over summaries in a multi-instance deployment specifically
_because_ they aggregate correctly across replicas — a summary's client-computed p99 across 20 pods
isn't mathematically a real p99 of anything.

## What Prometheus alone doesn't do

| Limitation                                                                                                           | Why it matters                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [[observability/02-metrics-engineering/07-metrics-storage-engines/07-metrics-storage-tsdb\|Local, single-node TSDB]] | No built-in HA or horizontal scale-out — one server, one disk, one blast radius |
| No long-term retention by design                                                                                     | Local storage is meant to be a buffer, not a durable multi-year store           |
| No native multi-tenancy                                                                                              | One Prometheus = one tenant; multi-team isolation needs external tooling        |

This is precisely the gap [[mimir]] fills: Mimir implements the Prometheus remote-write _receive_
API and the PromQL _query_ API at horizontal, multi-tenant scale, so a Prometheus server (or Alloy's
scrape component, which increasingly replaces standalone Prometheus for this role) becomes the local
scraper that ships data onward via `remote_write`, while Mimir is the system of record.

```
Alloy/Prometheus (scrape + remote_write)  ──▶  Mimir (store + serve PromQL)  ──▶  Grafana
```

## [[prometheus/06-alerting/03-alertmanager/03-alertmanager|Alertmanager]]

Alerting is deliberately a separate component: Prometheus evaluates alerting rules and fires alerts,
Alertmanager deduplicates, groups, silences, and routes them to receivers (PagerDuty, Slack,
webhook). Keeping rule evaluation and routing decoupled is why the same Alertmanager deployment can
sit downstream of many Prometheus/Mimir rulers without duplicating routing logic per source.

**Why it matters here:** Prometheus's exposition format and query semantics are the contract every
ShipSolid service's `/metrics` endpoint and every Grafana dashboard PromQL query is written against
— Mimir is the horizontally-scaled implementation of that same API, not a different query language
to learn. Every label added to a scrape target is subject to the same [[cardinality]] budget as if
it were being written straight into a single-node Prometheus, just distributed across Mimir's
ingesters instead of one disk.
