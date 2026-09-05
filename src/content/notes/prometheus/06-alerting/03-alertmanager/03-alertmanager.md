---
title: "3 — Alertmanager"
description: "How Alertmanager groups and deduplicates alerts in practice — group_wait, group_interval, and repeat_interval — with routing/receiver depth and open gaps called out honestly."
tags: ["prometheus", "alerting", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-22"
relations:
  - slug: prometheus/06-alerting/02-alerting-rules/02-alerting-rules
    kind: related
  - slug: observability/12-alert-engineering/01-alert-philosophy/01-alerting-and-routing
    kind: related
---

# 3 — Alertmanager

Prometheus itself only evaluates rules and decides whether a rule's state is inactive, pending, or
firing, as covered in [[02-alerting-rules|Alerting Rules]]. It does not decide who gets paged, how
often, or whether ten related alerts become ten separate notifications or one. That job belongs to
Alertmanager, which sits downstream of Prometheus and receives a stream of firing (and resolving)
alerts to act on. Three configuration options — `group_wait`, `group_interval`, and
`repeat_interval` — are what actually control that behavior, and they are also the three settings
people confuse most often, because all three are "how long to wait before sending," just at
different points in an alert's life.

## Why Grouping Exists at All

Prometheus alerts fire per time series, not per underlying incident. If a process crashes across ten
instances in the same data center, that's ten separate firing alert instances hitting Alertmanager,
not one. Sending ten separate notifications for what a human recognizes instantly as a single
incident is exactly the kind of pager noise that erodes trust in alerting. Alertmanager's answer is
to group related alerts by shared labels before they ever reach a receiver:

```
group_by: ['alertname', 'job']
```

Every alert instance whose `alertname` and `job` labels match gets folded into the same group and,
from a notification standpoint, treated as one unit. What remains to be decided is _when_ that group
actually sends a notification — and that's where `group_wait` and `group_interval` come in.

## Grouping Mechanics: `group_wait` and `group_interval`

**`group_wait`** governs the very first notification for a brand-new group. Rather than firing a
notification the instant the first alert in a group arrives, Alertmanager waits — buffering — for a
short window, giving other alerts that belong to the same group a chance to arrive and be included
in that same first notification. This is what turns "ten separate pages over the next ninety seconds
as ten instances crash one by one" into "one page covering all ten."

```
group_by: ['alertname', 'job']
group_wait: 45s # Usually set between ~0s to a few minutes.
```

The trade-off is explicit: a longer `group_wait` catches more of the group before the first page
goes out, but it also delays how quickly anyone finds out something is wrong at all. There's no
universally correct value — it's a deliberate trade between completeness of the first notification
and its latency.

**`group_interval`** governs everything after that first notification. A rule group is re-evaluated
on its own cadence (see [[02-alerting-rules|Alerting Rules]] for the pending/firing mechanics behind
that), which means new alert instances can join an already-notified group at any point afterward — a
fourth instance of the same crash, say, discovered on the next evaluation. Without any control here,
each newly joined alert would trigger its own immediate notification, defeating the point of
grouping in the first place. `group_interval` sets how long Alertmanager waits, from the last
notification sent for that group, before sending an update that covers whatever new alerts have
joined it since:

```
group_by: ['instance', 'job']
group_wait: 45s
group_interval: 10m # Usually ~5 mins or more.
```

So `group_wait` is about assembling the _first_ notification for a group; `group_interval` is about
batching _updates_ to a group that's already been notified once.

## Deduplication: `repeat_interval`

Grouping controls how alerts are batched together in a single notification. `repeat_interval`
controls something different: how long Alertmanager will wait before re-sending a notification for
an alert that is still firing and has already been successfully delivered. Without it, a
still-firing alert would either never be re-announced (bad — an unacknowledged page for an ongoing
outage should eventually resurface) or would resend on every group evaluation (bad — that's the
exact noise `group_wait`/`group_interval` exist to prevent). `repeat_interval` is the deliberate
middle ground: a firing alert that's already been sent gets sent again only after this interval has
elapsed, as a reminder that the condition is still active.

The three settings together answer three genuinely different questions: `group_wait` — how long to
buffer a _new_ group before its first notification; `group_interval` — how long to wait before
notifying about _new alerts added_ to a group already notified; `repeat_interval` — how long to wait
before _re-sending_ an alert that's already been sent and is still firing.

## Routing and Receivers Live Elsewhere

Grouping and deduplication decide _when_ a notification goes out. They say nothing about _who_ it
goes to or _how_ escalation works — a routing tree that sends symptom-based alerts to one on-call
rotation and cause-based alerts to a different owning team, or an escalation policy that pages a
secondary responder if the first doesn't acknowledge. That organizational layer is covered in
[[01-alerting-and-routing|Alerting and Routing]], and this chapter doesn't re-derive it. The one
routing fact worth noting here, because it's the reason Alertmanager exists at all in the pipeline:
Prometheus pushes firing alerts to Alertmanager, which is what actually notifies receivers — Slack,
email, PagerDuty-style integrations, and so on.

## What's Not Covered Here

Three pieces of Alertmanager that a complete treatment would include have no source material behind
them in this book yet, and it's more honest to say so than to pad this chapter with generic detail:
**silences** (temporarily muting a known, already-acknowledged alert), **inhibition** (suppressing
lower-priority alerts when a related higher-priority one is already firing), and **Alertmanager HA
clustering** (running multiple Alertmanager replicas without duplicate notifications). These are
real, commonly needed capabilities — they're just gaps in this book's current source material, not
gaps in Alertmanager itself.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
