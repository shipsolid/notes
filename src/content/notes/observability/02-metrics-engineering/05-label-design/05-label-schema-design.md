---
title: "5 — Label & Attribute Schema Design"
description: "Cardinality budget, naming conventions, and the high-churn label traps that turn a cheap metric into a production incident — the design discipline for the labels semantic conventions don't already cover for you."
tags: ["observability", "instrumentation", "opentelemetry", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-4"
relations:
  - slug: observability/reference/cardinality
    kind: depends_on
  - slug: observability/06-opentelemetry/01-opentelemetry-architecture/01-opentelemetry-sdks-and-semantic-conventions
    kind: related
  - slug: observability/00-foundations-of-observability/02-pillars-of-observability/02-the-signals
    kind: related
  - slug: observability/03-logging-engineering/03-correlation-ids/03-cross-signal-correlation
    kind: related
  - slug: projects/platform-shipsolid/07-cost-governance/cardinality-governance
    kind: related
---

# 5 — Label & Attribute Schema Design

[[cardinality|Cardinality]] explains _why_ an unbounded label is expensive. This chapter is the
design discipline for not shipping one in the first place — what to name a label, which values are
safe to put on a metric at all, and the handful of specific traps that account for most real
cardinality incidents.

---

## What a label actually costs

Every unique combination of label values on a metric creates a new time series. A metric with three
labels of cardinality 10, 5, and 4 doesn't cost 10+5+4 — it costs up to 10×5×4 = 200 series, because
the cost is the _combination_, not any single label in isolation. See [[cardinality]] for the full
mechanics of why this multiplies rather than adds, and how it shows up as storage and query cost
downstream.

This chapter assumes that mechanic and focuses on the decisions that keep the multiplication bounded
in the first place.

---

## Naming: let semantic conventions decide first

[[01-opentelemetry-sdks-and-semantic-conventions|OpenTelemetry's semantic conventions]] already
define the namespaced attribute name for anything common — `http.request.method`, `db.system.name`,
`k8s.pod.name`. If a semconv attribute already exists for what you're about to name, use it; don't
invent `httpMethod` or `db_type` next to it. The design decision this chapter is actually about is
everything semconv _doesn't_ cover: your own business and domain attributes — `tenant.tier`,
`order.fulfillment_type`, `checkout.payment_provider`.

For those, the same discipline semconv applies to itself works for a custom namespace too:

- **Namespace by domain, dot-separated** — `checkout.payment_provider`, not `payment_provider` bare,
  so two unrelated teams' attributes don't collide and a reader can tell where an attribute came
  from without checking the emitting service.
- **Name the dimension, not the instance** — `region` is a label; a raw region string that happens
  to be one of ten fixed values is fine, but if "region" is actually free text a user typed, it's a
  different, unbounded dimension wearing the same name.
- **Prefer enums over free text** — a label whose legal values are a small, known, stable set (an
  enum, a status code, a boolean) is what makes a label safe. The moment a label's value comes from
  anything a user, a request, or an external system can generate arbitrarily, it stops being a label
  candidate.

---

## The cardinality budget

A **cardinality budget** is a ceiling — active series per metric, per service, or per tenant —
treated as a resource to spend deliberately, the same way a latency or error-rate budget is spent
deliberately in an SLO. Two labels that are individually "only 20 values each" can still blow a
budget once combined with three other labels already on the same metric; the budget has to account
for the full combination a metric actually ships with, not each label reviewed in isolation.

Getting the actual number — active series, ingest rate, and monthly cost for a specific label set —
is a mechanical calculation, not a design judgment call. Run it through the **Cardinality Budget
Calculator** skill before any new label ships into a production-bound config; this chapter is about
the judgment calls that decide what to feed that calculator in the first place.

---

## The high-churn label traps

These five show up in almost every real cardinality incident, because each one looks like a
reasonable label until you notice its value is different on every single request:

| Trap                        | Why it looks reasonable                   | Why it explodes                                            | Where it belongs instead                                      |
| --------------------------- | ----------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Request ID / correlation ID | "I want to find this exact request later" | Unique per request, by construction — infinite cardinality | A log field, or a metric exemplar's `trace_id`                |
| User ID / session ID        | "I want to see this user's error rate"    | Cardinality scales with active user count, unbounded       | A log field; aggregate the metric by cohort/tier instead      |
| Raw timestamp               | "I want to know exactly when"             | The metric's own time series index already carries this    | Nowhere — it's redundant with the sample's own timestamp      |
| Client/source IP address    | "I want to see traffic by origin"         | One series per distinct IP, unbounded at any real scale    | A log field, or bucket to a coarse dimension (ASN, region)    |
| Full URL / query string     | "I want per-endpoint latency"             | Query params and path variables make every URL near-unique | A normalized route template (`/users/{id}`), not the raw path |

The fix in every row is the same shape: the information isn't wrong to want, it's on the wrong
signal. [[02-the-signals|The Signals]] covers why — a log or a trace span can carry a value that's
unique per request at no extra cardinality cost, because neither is indexed by label combination the
way a metric is. An exemplar is the specific mechanism that lets a metric point at one such trace
without ever putting `trace_id` on the metric itself — see [[03-cross-signal-correlation]].

---

## Where this gets enforced, not just designed

Naming and cardinality discipline decays without something checking it. Two different mechanisms,
usually both needed:

- **A canonical schema teams are onboarded against** — see
  [[naming-and-label-schema|Naming & Label Schema]] for what this looks like as an actual onboarding
  contract, not just a convention doc nobody reads.
- **A governance backstop that catches drift after onboarding** — see
  [[cardinality-governance|Cardinality Governance]] for the FinOps side: budgets, alerting on
  unexpected series growth, and what happens when a team exceeds its allocation.

---

## Why this matters for an Observability Architect

A cardinality incident is almost never one obviously-bad label — it's several individually
defensible labels combining on a metric nobody reviewed as a whole. Reviewing a new metric means
asking about the _combination_ ("what's the cross-product of every label on this one metric"), not
just auditing each label name against the trap list above. The trap list catches the obvious cases;
the combination question catches the ones that pass every individual review and still explode.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
