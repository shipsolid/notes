---
title: "Chapter 4 — Alerting Systems"
description: "Multi-window burn-rate alerts, recording rules, routing, and deduplication as the difference between an actionable page and noise."
tags: ["system-design", "observability", "book"]
updated: 2026-07-18
hidden: false
zettelId: "202607181257-28"
relations:
  - slug: observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets
    kind: depends_on
  - slug: observability/12-alert-engineering/01-alert-philosophy/01-alerting-and-routing
    kind: related
  - slug: observability/11-visualization/01-dashboard-design/01-dashboard-design
    kind: related
---

## Chapter 4 — Alerting Systems

> Part 08 of the [[system-design/readme|System Design]] curriculum. Full treatment:
> [SLOs, Alerting & Incident Response](../../../observability/README.md#04--slos-alerting--incident-response)
> in the Observability book.

An alert is a claim that a human needs to act _now_. Almost every alerting failure — the noisy
system nobody trusts, the page that turns out to be nothing, the real outage buried under forty
identical notifications — comes from violating that one requirement somewhere upstream of the page
itself.

## Burn rate: the number alerting should actually key off

If an SLO is 99.9%, the error budget is the remaining 0.1% — the amount of "bad" allowed over the
window before the SLO is breached. **Burn rate** is how fast that budget is being consumed relative
to how fast it should be consumed to exactly exhaust it at the window's end: 1x means "on pace to
just meet the SLO," 10x means the budget will be gone in a tenth of the remaining window. A single
short window reacts fast but flaps on blips that self-resolve; a single long window smooths out
blips but reacts too slowly to a genuinely severe outage. The standard fix is **multi-window,
multi-burn-rate alerting** — requiring a short window and a long window to agree before paging, at
more than one severity tier (e.g. 14.4x burn rate over 1h+5m pages immediately; 1x burn rate over
3d+6h opens a ticket instead). Full treatment: [[02-slos-and-error-budgets|SLOs & Error Budgets]].

## Symptom-based, not cause-based

A cause-based alert fires on an internal condition (CPU at 80%); a symptom-based alert fires on
user-visible impact (error rate burning the SLO's budget). The problem with cause-based paging isn't
that causes don't matter — it's that a cause doesn't reliably imply a symptom, so a threshold pages
identically whether the system is fine or about to fall over. Cause-level signals still belong on a
[[01-dashboard-design|dashboard]] as the diagnostic detail a responder drills into _after_ a
symptom-based page, not as a second, parallel source of pages.

## Noise reduction: dedup, grouping, and routing

- **Deduplication** — the same condition firing identically across many instances (50 pods behind a
  deployment) should produce one notification, not 50 — usually solved by aggregating the alerting
  rule across the varying label, not deduplicating after the fact.
- **Grouping/correlation** — several different alerts that are all downstream consequences of one
  root cause should arrive as one bundled incident, not as independent pages a human has to manually
  realize are the same event.
- **Routing and escalation** — route by clear service/team ownership rather than a single generalist
  on-call guessing who owns the failing component, and define what happens if the primary doesn't
  acknowledge within N minutes.

Full treatment: [[01-alerting-and-routing|Alerting & Alert Routing]].

## What this means for a system design interview

"We'll page on error rate > X%" doesn't survive a follow-up. The interview-worthy answer names the
burn-rate window pair (fast confirmation without flapping, slow confirmation for a sustained leak),
distinguishes what pages a human from what only needs a dashboard, and states the dedup/grouping
mechanism that keeps one root cause from becoming forty pages.

## Where to go deeper

- [[02-slos-and-error-budgets|SLOs & Error Budgets]]
- [[01-alerting-and-routing|Alerting & Alert Routing]]
- [[05-slo-error-budget-tracking-system|SLO / Error Budget Tracking System]] — the applied case
  study, Part 07 Chapter 5 (stub)
- [[01-reliability-sli-slo-sla|Reliability: SLI, SLO, SLA & Error Budgets]] (Part 07)

## Metadata

|        |               |
| ------ | ------------- |
| Author | Amit Singh    |
| Scope  | system-design |
