---
title: "3 — Data Flow"
description: "A short connective walk through Prometheus end to end — from an instrumented app exposing a metric, through scraping and storage, to a PromQL query surfaced as an alert or a dashboard panel — with each stage pointing to the chapter that owns it."
tags: ["prometheus", "architecture", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-4"
relations:
  - slug: prometheus/03-instrumentation/02-exporters/02-exporters
    kind: related
  - slug: prometheus/04-service-discovery/01-discovery-mechanisms/01-discovery-mechanisms
    kind: related
  - slug: prometheus/01-prometheus-architecture/01-prometheus-components/01-prometheus-components
    kind: related
  - slug: prometheus/02-prometheus-data-model/01-metrics-deep-dive/01-metrics-deep-dive
    kind: related
  - slug: prometheus/05-promql-masterclass/01-promql-fundamentals/01-promql-fundamentals
    kind: related
---

# 3 — Data Flow

## Overview

Every other chapter in this book zooms into one stage of Prometheus. This one is the map that ties
those stages together — a single pass through the whole pipeline, from a number inside a running
process to a line on a dashboard. What makes Prometheus consistent across wildly different targets
(a web app, a batch processor, a Linux server, a Windows server) is that every one of those targets
ends up going through the same sequence of stages, exposed in the same text format, regardless of
what it actually is underneath.

## The Stages

**1. Instrumentation.** A running system — application code, a language runtime, an OS — exposes its
own internal state as named metrics: request counts, job success/failure totals, CPU time, memory
allocated. For an application this typically means importing a Prometheus client library and adding
a few lines of metrics-collection code; for infrastructure it means running the right exporter
alongside it.

**2. Exporters.** Anything that doesn't natively speak Prometheus's metric format needs an exporter
in front of it — a small process that fetches the underlying state (from the OS, from a database,
from a hardware interface) and re-exposes it on an HTTP endpoint in the format Prometheus expects.
The Node Exporter (Linux) and Windows Exporter are the canonical examples, but the same pattern
extends to nearly 200 official and community exporters covering databases, message queues, hardware,
and more. Full treatment: [[02-exporters|Exporters]].

**3. Service Discovery.** Before Prometheus can scrape anything, it needs to know what exists to
scrape. Service discovery is what keeps that target list current automatically — resolving targets
from Kubernetes, EC2, DNS, Consul, or a handful of other backends — instead of requiring a static,
manually maintained list. Full treatment: [[01-discovery-mechanisms|Discovery Mechanisms]].

**4. Scraping.** On a fixed interval, Prometheus's retrieval worker pulls the current metrics
snapshot from every resolved target's HTTP endpoint — regardless of whether that target is a web
server, a batch process, or a Windows or Linux machine, the pull mechanics are identical. The real
commands and config behind this stage are covered in
[[01-prometheus-components|Prometheus Components]].

**5. TSDB.** Every scraped sample lands in Prometheus's time-series database, keyed by metric name
and label set, with a timestamp attached at scrape time. This uniform storage is what lets metrics
from completely unrelated systems — CPU time from a Linux box, garbage-collection counts from a .NET
app — sit side by side and be queried the same way. Full treatment:
[[01-metrics-deep-dive|Metrics Deep Dive]].

**6. PromQL.** Stored samples are only useful once queried. PromQL is the language for that —
computing rates from counters, aggregating across labels, joining metrics together — and it's the
same query layer whether you're hitting the API directly, using the built-in web UI, or querying
through Grafana. Full treatment: [[01-promql-fundamentals|PromQL Fundamentals]].

**7. Alerting.** The same PromQL expressions that answer ad-hoc questions can also be evaluated
continuously as alerting rules. When an expression's condition holds true for long enough,
Prometheus fires an alert toward [[03-alertmanager|Alertmanager]], which takes care of routing it to
email, Slack, or whatever's configured. Full treatment: [[02-alerting-rules|Alerting Rules]].

**8. Dashboards.** The same queried data gets rendered as graphs, gauges, heatmaps, and bar charts —
typically in Grafana, connected to Prometheus as a data source, rather than in Prometheus's own
minimal web UI. No chapter in this book owns dashboard design specifically, so for that depth see
[[01-dashboard-design|Dashboard Design]].

## Why the Uniformity Matters

The reason this pipeline is worth walking end to end, rather than just reading the individual
chapters in isolation, is that the uniformity is the entire value proposition: a batch job's
`job_success_total` counter and a Linux server's `node_cpu_seconds_total` counter arrive at TSDB
through the identical scrape → store → query path, described in the identical metric text format,
with the identical `TYPE`/`HELP` metadata. Nothing about querying or alerting on one differs
structurally from doing the same on the other. That consistency — one pipeline shape for hardware,
OS, runtime, and application-specific metrics alike — is what lets the rest of this book treat each
stage as a separable, swappable component instead of a special case.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
