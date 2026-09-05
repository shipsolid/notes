---
title: "1 — Alerting & Alert Routing"
description: "Symptom-based vs. cause-based alerting, the noise-reduction problem (dedup, grouping, correlation), and routing/escalation — the design discipline standing between a real page and a bad one."
tags: ["observability", "slo", "alerting", "incident-response", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-9"
relations:
  - slug: observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets
    kind: depends_on
  - slug: observability/11-visualization/01-dashboard-design/01-dashboard-design
    kind: related
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
  - slug: sre/06-incident-management/04-on-call-engineering/04-on-call-engineering
    kind: depends_on
---

# 1 — Alerting & Alert Routing

An alert is a claim that a human needs to act _now_. Almost every alerting failure — the noisy
system nobody trusts, the page that turns out to be nothing, the real outage buried under forty
identical notifications — comes from violating that one requirement somewhere upstream of the page
itself.

---

## Alert on symptoms, not causes

A **cause-based** alert fires on an internal condition: CPU above 80%, disk 90% full, a queue depth
past some threshold. A **symptom-based** alert fires on user-visible impact: error rate above the
SLO's error budget burn rate, latency past the SLO target — see [[02-slos-and-error-budgets]] for
what that threshold should actually be built from.

The problem with cause-based paging isn't that causes don't matter — it's that a cause doesn't
reliably imply a symptom. CPU at 85% might mean nothing (the service autoscales and absorbs it fine)
or might mean an imminent outage, and a threshold can't tell the difference. Paging on the cause
pages on both cases identically; paging on the symptom pages only when it actually matters, and the
cause becomes something to _investigate_, once paged, not something to alert on independently.
Cause-level signals still belong on a dashboard — see [[01-dashboard-design|Dashboard Design]] — as
the diagnostic detail a responder drills into after a symptom-based page, not as a second, parallel
source of pages.

---

## Two different things called "correlation" here

Alert-routing "correlation" — bundling twenty alerts that are all downstream symptoms of the same
root cause into one notification instead of twenty separate pages — is not the same mechanism as
[[03-cross-signal-correlation]], which ties a metric, a log, and a trace to the _same request_.
Alert correlation groups multiple _alerts_ firing across a fleet or a dependency graph into one
incident; signal correlation ties multiple _signal types_ to one event. Both fight the same
underlying problem — too many disconnected data points for a human to manually stitch together — at
two different layers.

---

## Noise reduction: dedup and grouping

- **Deduplication** — the same underlying condition firing identically across many instances (the
  same alert on 50 pods behind a deployment) should produce one notification, not 50. This is
  usually solved by aggregating the alerting rule itself across the label that varies (pod name)
  rather than deduplicating after the fact.
- **Grouping/correlation** — several _different_ alerts that are all consequences of one root cause
  (a downstream dependency's outage triggering alerts on every service that calls it) should arrive
  as one bundled incident, not as independent, seemingly-unrelated pages that a human has to
  manually realize are the same event.

Both failure modes produce the same symptom if left unsolved: a responder who has learned that a
page usually means "twenty near-identical notifications to wade through," which trains exactly the
kind of alert-skimming behavior that causes a real, different alert to get missed in the noise.

---

## Routing and escalation

Once an alert fires, two separate questions decide what happens next:

- **Who owns this?** — routing by clear service/team ownership (the same idea a generated CODEOWNERS
  file solves for code review) beats routing everything to a single generalist on-call rotation that
  has to guess who actually owns the failing component.
- **What happens if nobody acknowledges it?** — an escalation policy: page the primary, and if
  unacknowledged within N minutes, escalate to a secondary or a wider group. Without one, a single
  missed page (phone on silent, no signal) can silently become an unaddressed outage instead of a
  handled one.

Severity should also decide the _channel_, not just the recipient: a page-worthy symptom interrupts
someone's sleep; a slow-burn budget concern (see [[02-slos-and-error-budgets]]'s ticket-severity
row) belongs in a ticket queue someone triages during business hours, not a 3 a.m. phone call.

---

## Alert fatigue is the failure mode this all exists to prevent

[[04-on-call-engineering|On-call Engineering]] covers the human/organizational side directly: every
one of the mechanisms above — symptom-based alerting, dedup, grouping, correct routing — exists
because an over-alerting system doesn't fail by paging too much in the abstract, it fails by
teaching responders that pages are often noise, which is a worse failure than under-alerting because
it erodes trust in the entire alerting system, not just the one noisy rule.

For what this looks like as an actual platform policy, see
[[notification-strategy|Notification & Alerting Strategy]] and [[alerts-standards|Alert Standards]]
for the concrete rule-group conventions behind it.

---

## Why this matters for an Observability Architect

The question to ask about any alerting rule before it ships isn't "could this condition ever matter"
— almost anything could, in principle. It's "if this fires at 3 a.m., is there a specific action the
on-call engineer should take right now, and would they thank the system for waking them up for it."
A rule that fails that test belongs on a dashboard, not in the paging path.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
