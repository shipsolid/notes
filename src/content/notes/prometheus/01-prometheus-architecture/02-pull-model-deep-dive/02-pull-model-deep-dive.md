---
title: "2 — Pull Model Deep Dive"
description: "Why Prometheus chose a pull-based scrape model over pushing metrics, what that trades away, and how the Pushgateway papers over the one workload — short-lived batch jobs — where pull genuinely doesn't fit."
tags: ["prometheus", "architecture", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-6"
relations:
  - slug: observability/01-observability-architecture/03-push-vs-pull-architectures/03-push-vs-pull-ingestion
    kind: compared_to
  - slug: prometheus/04-service-discovery/01-discovery-mechanisms/01-discovery-mechanisms
    kind: related
  - slug: prometheus/01-prometheus-architecture/01-prometheus-components/01-prometheus-components
    kind: related
  - slug: prometheus/01-prometheus-architecture/03-data-flow/03-data-flow
    kind: related
---

# 2 — Pull Model Deep Dive

## Overview

Prometheus is a pull-based system: the server holds the list of targets and reaches out to scrape
them, on a schedule it controls, rather than waiting for targets to send data to it. Prometheus
didn't invent this — Zabbix and Nagios are pull-based too — but it committed to pull as a core
architectural principle rather than offering it as one option among several. This chapter covers the
Prometheus-specific angle on that decision: why it was made, what it costs, and the one mechanism
(the Pushgateway) that exists specifically to handle the workload pull can't reach.

For the fuller, vendor-neutral treatment of push vs. pull as a general ingestion pattern — including
the trade-off table across signal types, network topology, and hybrid architectures — see
[[03-push-vs-pull-ingestion|Push-Based vs Pull-Based Ingestion]]. This chapter does not repeat that
table; it stays narrowly on what the choice means for a Prometheus server specifically.

## Why Pull

Pull-based monitoring means the metrics server keeps an authoritative list of what it should be
scraping and initiates every connection itself. That design choice pays off in three concrete ways:

- **You can tell when a target is actually down.** In a push-based system, silence from a target is
  ambiguous — has it crashed, or was it decommissioned on purpose? A pull-based scraper knows its
  full target list, so a failed scrape against a target that's supposed to be there is an
  unambiguous signal.
- **The server can't be overwhelmed by a flood of unsolicited connections.** A push-based collector
  has no control over how many targets decide to send data at once; a pull-based scraper paces
  itself against its own scrape interval and concurrency settings.
- **The target list is a single source of truth.** Because Prometheus owns the list (static config
  or [[01-discovery-mechanisms|service discovery]]), there's one place to look to answer "what is
  this server supposed to be monitoring," rather than that answer being scattered across every
  target's own push configuration.

Push-based systems — Logstash, Graphite, OpenTSDB among them — invert this: targets are configured
to send metric data outbound to the server, and the server has no independent list to check targets
against.

## Limitations of the Pull Model

Pull is not universally better — it's a trade-off, and it fails specifically where a scraper can't
reach a target on a useful schedule:

- **Event-based systems.** Where the underlying signal isn't cyclical numeric state but discrete
  events, pulling on an interval is the wrong shape entirely — though it's worth noting Prometheus
  itself is scoped to metrics, not event/log monitoring, so this limitation is more about pull's
  general applicability than something Prometheus is trying and failing to do.
- **Short-lived jobs.** A job that starts, runs, and exits before the next scrape interval fires is
  invisible to a pull-based scraper — there's no window in which to reach it. This is the specific
  gap the Pushgateway exists to close (below).

Two other limitations commonly discussed alongside pull-based scraping — traversing NAT/firewall
boundaries to reach a target, and Prometheus's own federation mechanism for scraping across server
boundaries — have no source material behind this book yet. Rather than invent scrape-path or
federation-config mechanics, this chapter leaves them as open gaps to fill in later.

## The Pushgateway

The Pushgateway exists to solve exactly one problem: a short-lived job that would otherwise finish
and exit before Prometheus ever gets a chance to scrape it. Instead of Prometheus pulling directly
from the job, the flow inverts for this one hop only:

1. The short-lived job pushes its metrics to the Pushgateway right before it exits.
2. The Pushgateway holds those metrics.
3. Prometheus scrapes the Pushgateway itself, on its normal pull schedule, and picks up whatever was
   pushed there.

In other words, the Pushgateway is a buffer that lets Prometheus stay pull-only end-to-end from its
own point of view — it never has to open a connection to the ephemeral job directly, because the
job's metrics are waiting at a stable, always-on target instead.

## Batch Jobs

This is the concrete use case the Pushgateway is built for: cron jobs, one-off scripts, CI steps —
anything that runs to completion and terminates rather than sitting around to be scraped. Without
the Pushgateway, metrics from these jobs (success/failure counts, duration, rows processed) would
simply never reach Prometheus, because by the time the next scrape interval rolled around the
process would already be gone.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
