---
title: "2 — Hands-On Labs"
description: "A sequenced, hands-on path through the practical material already covered elsewhere in this book, arranged as a lab progression for PCA readiness."
tags: ["prometheus", "pca", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-31"
relations:
  - slug: prometheus/01-prometheus-architecture/01-prometheus-components/01-prometheus-components
    kind: depends_on
  - slug: prometheus/04-service-discovery/01-discovery-mechanisms/01-discovery-mechanisms
    kind: depends_on
  - slug: prometheus/02-prometheus-data-model/01-metrics-deep-dive/01-metrics-deep-dive
    kind: depends_on
  - slug: prometheus/06-alerting/02-alerting-rules/02-alerting-rules
    kind: depends_on
---

# 2 — Hands-On Labs

## Overview

This chapter is not a new tutorial. Everything a PCA candidate needs to touch with their hands —
installing Prometheus, wiring up scraping, instrumenting an app, and writing alert rules — is
already written elsewhere in this book, with real commands and real output. What's missing is a
single ordered path through it that mirrors how the exam actually exercises the material: set up the
server, get it scraping something, look at the metric types it produces, then react to them with
alerts.

Treat this chapter as the index for a lab session, not as content in its own right. Each step below
links to the chapter that carries the actual walkthrough — don't duplicate those commands here;
follow the link and run them there.

## Lab 1 — Install Prometheus

Start with the server itself: what the binary actually contains (scrape manager, TSDB, rule engine,
query engine) and the real deployment shapes — systemd unit, Docker container, or bare binary on a
VM.

→ [[01-prometheus-components|Prometheus Components]]

## Lab 2 — Configure Scraping

Once the server is running, point it at something. This is where target discovery lives — static
configs as the baseline, then the dynamic mechanisms (Kubernetes, cloud APIs, DNS, file-based SD)
that replace hand-maintained target lists in anything beyond a single-host demo.

→ [[01-discovery-mechanisms|Discovery Mechanisms]]

## Lab 3 — Instrument & Observe Metric Types

This is the lab with the most hands-on surface area, and it's covered in full elsewhere — the actual
demo commands (running exporters, hitting `/metrics` endpoints, telling a counter from a gauge from
a histogram in live output) live in the metrics deep-dive chapter, not here. Follow the link and run
the demo there rather than expecting a second copy of the same steps in this chapter.

→ [[01-metrics-deep-dive|Metrics Deep Dive]]

## Lab 4 — Configure Alerts

With real metrics flowing, close the loop: write an alerting rule against them, understand how it
evaluates, and see it reach Alertmanager.

→ [[02-alerting-rules|Alerting Rules]]

## Not Yet Covered

Two labs that a complete PCA hands-on path would normally include have no source material anywhere
in this book yet:

- **Build Dashboards** — no Grafana dashboard-building content exists in this book at this time.
- **Debug Failures** — no troubleshooting/failure-injection content exists in this book at this
  time.

Rather than fabricate steps for either, they're listed here as open gaps. Fill them in as their own
chapters first, then extend this lab index to point at them.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
