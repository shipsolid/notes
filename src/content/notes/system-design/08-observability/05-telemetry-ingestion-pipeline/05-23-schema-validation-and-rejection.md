---
title: "Schema Validation and Rejection at the Ingestion Frontier"
description: "What the gateway actually checks before accepting a payload — structural validation vs semantic cardinality checks, why rejection has to happen before the buffer, OTLP PartialSuccess as an alternative to whole-batch rejection, and the forward-compatibility trap of validating too strictly."
tags: ["system-design", "observability", "telemetry", "maang-prep", "validation"]
hidden: false
zettelId: "202607161515"
relations:
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-20-protocol-termination
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-36-q11-answer-compromised-agent-threat-model
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-27-q2-answer-cardinality-storm-detection-mitigation
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-18-authentication
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-06-layer-3-processing-enrichment
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] §3.1
> (ingestion frontier — schema validation and rejection).

The Layer 1 bullet says "fail fast before the buffer" for a concrete reason: rejecting a bad payload
at the gateway costs one request and gives the agent immediate, synchronous feedback. Rejecting it
after it's already in Kafka means the bad data consumed buffer disk and consumer throughput, and by
the time a downstream processor notices something is wrong, the agent that sent it has long since
moved on with no idea anything failed. Every design choice below follows from that asymmetry.

---

## Structural validation vs. semantic validation — two different layers

It's worth being precise about which check happens where, because they get conflated easily:

| Check                                                          | Layer             | What it's really asking                                                                                    |
| -------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Schema validation (this note)                                  | Layer 1 — gateway | "Is this a well-formed message at all?" — required fields present, correct types, valid protobuf structure |
| Cardinality enforcement ([[05-06-layer-3-processing-enrichment | §3.3]])           | Layer 3 — processor                                                                                        | "Is this well-formed message within the tenant's budget?" — a semantic, stateful question that requires tracking active series over time |

A payload can be perfectly well-formed (valid schema) and still get rejected two layers later for
blowing a cardinality budget. Conflating the two in an interview answer is a common mistake — schema
validation is stateless and can run per-request at the gateway; cardinality enforcement is
inherently stateful and has to run where that state lives (the processor, per §3.3).

---

## What actually gets checked

- **Required fields present** — e.g. a metric point needs a name, a value, a timestamp; a span needs
  a trace ID and span ID
- **Type correctness** — a field declared as an integer isn't a string, a timestamp is parseable
- **Structural conformance to the wire schema** — valid OTLP protobuf per the
  [[05-20-protocol-termination|protocol termination]] decode step, not a truncated or corrupted
  message
- **Size limits** — an individual field (e.g. a label value) or the whole batch isn't unreasonably
  large — checked **before** full deserialization completes, not after, which is the specific
  hardening detail covered in
  [[05-36-q11-answer-compromised-agent-threat-model#Defense 2: Size and schema validation before full deserialization|Q11's Defense 2]]:
  validating size and basic structure on a byte-limited prefix first means a maliciously oversized
  or deeply-nested payload gets rejected before the gateway spends CPU/memory fully decoding it.
- **Schema version compatibility** — is this a wire format version the gateway understands at all

---

## Reject the whole batch, or reject items individually? OTLP PartialSuccess

The main design's [[05-04-layer-1-ingestion-frontier|protocol negotiation section]] already shows
the sequence diagram for this; the design point worth stating explicitly here is _why_ item-level
rejection is the better default. A single OTLP export call is usually a **batch** — hundreds of
metric points or spans in one request. Two ways to handle a batch where 3 out of 500 items fail
validation:

```
Whole-batch rejection:  1 bad item → all 500 rejected → agent must figure out which one was bad and retry everything
Partial acceptance:     1 bad item → 497 accepted, 3 rejected with reasons → agent retries/logs only the 3
```

**Whole-batch rejection wastes 497 valid data points and forces the agent into a guessing retry
loop.** OTLP's `PartialSuccess` response solves this by returning counts and reasons for what was
dropped, alongside accepting everything else — the agent can log or alert on the 3 rejected items
without needing to resubmit anything. This is the same mechanism referenced in
[[05-06-layer-3-processing-enrichment|§3.3's cardinality enforcement]] and reused in
[[05-27-q2-answer-cardinality-storm-detection-mitigation|Q2's cardinality storm response]] — one
protocol feature serving both a structural-validation rejection and a semantic budget-enforcement
rejection.

---

## The forward-compatibility trap

Validating "too strictly" is a real failure mode, not just a hypothetical: if the gateway rejects
any field it doesn't explicitly recognize, then rolling out a new agent SDK version that adds one
new optional resource attribute breaks ingestion for every agent on the new version, at the gateway,
before anyone even looks at the data. The correct posture, and the one protobuf's wire format is
designed around:

- **Unknown fields are ignored, not rejected** — an older gateway seeing a newer, additive field it
  doesn't understand should pass the message through, not fail it
- **Only explicitly required fields are enforced** — validation checks for what must be present, not
  for the absence of anything unexpected
- **Schema version negotiation, if used at all, should be additive** — reject on missing required
  structure, never on the presence of something new

Getting this backwards turns every agent SDK upgrade into a coordinated flag-day rollout across the
entire fleet — exactly the kind of fragility the rest of this design (stateless gateways,
independent agent retries, PartialSuccess) is built to avoid.

---

## Rejection reasons and observability

Every rejection should be attributable to a specific, labeled reason — an aggregate "400 count"
tells you nothing actionable during an incident:

| Rejection reason           | Example                                                   | What a spike in this specific reason tells you                                |
| -------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Missing required field     | Metric point with no timestamp                            | A specific agent version/config is misconfigured                              |
| Malformed structure        | Truncated or corrupted protobuf                           | Network issue, or a genuinely broken/adversarial client (see Q11)             |
| Oversized payload/field    | A label value exceeding the configured max length         | Either a runaway high-cardinality label or a misbehaving instrumentation lib  |
| Unsupported schema version | An agent speaking a protocol version older than supported | A fleet-wide upgrade is overdue, or a legacy agent needs a compatibility shim |

This feeds the `telemetry_gateway_requests_total{status_code, ...}` metric from
[[05-12-observability-of-the-pipeline|§4 (Observability of the Pipeline Itself)]] — break it down by
rejection reason, not just success/failure, so a bad agent rollout shows up as a spike in one
specific reason rather than a generic error-rate blip.

---

## Related

- [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline (full design)]] — §3.1 (fail
  fast before the buffer), §3.3 (cardinality enforcement — the semantic sibling of this check), §4
  (gateway observability metrics)
- [[05-20-protocol-termination|Protocol Termination]] — the decode step schema validation runs
  immediately after
- [[05-36-q11-answer-compromised-agent-threat-model|Q11: Compromised Agent Threat Model]] —
  validating size/structure before full deserialization, as a defense against adversarial payloads
- [[05-27-q2-answer-cardinality-storm-detection-mitigation|Q2: Cardinality Storm Detection & Mitigation]]
  — PartialSuccess reused for budget-enforcement rejections, not just structural ones
- [[system-design/08-observability/05-telemetry-ingestion-pipeline/05-18-authentication|Authentication]]
  — the check that runs immediately before this one in the Layer 1 responsibility order
