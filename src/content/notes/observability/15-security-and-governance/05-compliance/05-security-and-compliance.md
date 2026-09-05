---
title: "5 — Security & Compliance"
description: "Why PII ends up in telemetry by accident rather than by design, the pipeline-layer scrubbing that catches what application discipline misses, tenant-scoped access control, and why the query audit log is itself security-relevant telemetry."
tags: ["observability", "multi-tenancy", "finops", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-13"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/logging-guidelines
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/logging
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf/lbac
    kind: depends_on
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-36-q11-answer-compromised-agent-threat-model
    kind: related
  - slug: observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy
    kind: related
---

# 5 — Security & Compliance

Nobody deliberately designs a system to store a customer's email address in a log line. It happens
anyway, constantly, because logging a whole request object is one line of code and reviewing every
field of every object anyone ever logs is not. Telemetry is a data-exfiltration surface precisely
_because_ it's exempt from the scrutiny a database schema gets — nobody added a column for it, so
nobody's data-classification review ever looked at it.

---

## Where PII actually gets in

[[02-the-signals|Logs]]' whole value is that they carry arbitrary developer-written content — that
same flexibility is the exact mechanism PII leaks in through: a debug log that prints a full request
body, an error message that interpolates a user object, a custom span attribute that captures a
query parameter with a session token in it. None of these are semconv-standard attributes with a
known shape a scanner could anticipate — they're free text, by the same property that makes logs
useful for debugging in the first place.

---

## Pipeline-layer scrubbing is a backstop, not the fix

[[observability/06-opentelemetry/09-collector-architecture/09-otel-collector-pipeline|A processor in the collector chain]]
can redact or hash known-sensitive field patterns before export — a real, worthwhile backstop. But
it's a backstop specifically because a pattern-based scrubber can only catch content shaped the way
it expects; it can't recognize a customer's email address embedded in a free-text sentence it wasn't
written to match. Pipeline scrubbing catches the mistakes discipline missed; it doesn't substitute
for not logging PII in the first place, and treating it as a substitute is how a platform ends up
"protected" against exactly the leaks it already knows about and blind to the ones it doesn't.

For what disciplined logging actually looks like as platform policy, see
[[logging-guidelines|Logging Guidelines]] and
[[projects/platform-shipsolid/02-service-onboarding/logging|Logging]].

---

## Access control: scoped by tenant, not just by login

Authentication answers "who is this." **Label-based access control (LBAC)** answers the question
that actually matters for a multi-tenant observability platform: which tenant's data — which label
scope — is this authenticated user's query allowed to touch at all. A query that's technically
authenticated but scoped to the wrong tenant is exactly the isolation failure
[[observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy]] is
about, just surfaced through the access-control layer instead of a storage bug. See
[[lbac|Label-Based Access Control]] for what this looks like as a real, enforced policy layer rather
than a convention someone has to remember.

---

## The audit trail is itself security-relevant telemetry

Who queried which tenant's data, and when, is usually the fastest way to reconstruct what an
engineer actually saw during a security review — which makes the observability platform's own query
log a security artifact in its own right, not just an operational nice-to-have. That query audit log
has to survive independently of whatever it's auditing, which is the same bootstrapping problem
[[08-self-observability|Self-Observability]] covers for the platform's health signals in general,
applied here to its access records specifically.

For a worked example of the threat model on the other side of this — what happens if the collector
or agent producing telemetry is itself compromised, rather than the query layer — see
[[05-36-q11-answer-compromised-agent-threat-model|Compromised Agent Threat Model]].

---

## Why this matters for an Observability Architect

Reviewing a new service's instrumentation for security means asking "what happens when someone logs
a full object here" as a certainty, not a hypothetical — it will happen, usually without malice,
usually from someone debugging under pressure who didn't stop to think about what was in the object.
The platform's job is to have a backstop in place before that happens, not to rely on every engineer
remembering PII discipline on the day the discipline mattered most.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
