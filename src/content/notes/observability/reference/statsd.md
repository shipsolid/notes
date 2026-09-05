---
title: "What is StatsD"
description: "Etsy's 2011 UDP-based metrics protocol and daemon — the simplest possible fire-and-forget instrumentation format, superseded as a client API by OTel/Prometheus but still alive everywhere as a compatibility ingestion shim."
tags: ["tech", "observability", "metrics", "protocol"]
updated: 2026-07-12
hidden: false
zettelId: "202607121601-7"
relations:
  - slug: observability/reference/telegraf
    kind: related
  - slug: observability/reference/prometheus
    kind: related
  - slug: observability/reference/cardinality
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-24-telemetry-gateways
    kind: related
---

StatsD is a plaintext, line-based protocol for emitting counters, gauges, and timers over UDP — plus
the original Node.js daemon (built at Etsy in 2011) that aggregates those lines and flushes them to
a backend on an interval. It predates Prometheus and OpenTelemetry by years, and its design choices
(push, UDP, no schema, no delivery guarantee) read as primitive next to either — but the wire format
outlived the original daemon and shows up as a compatibility input on nearly every modern collector.

---

## The protocol

```
<bucket_name>:<value>|<type>[|@<sample_rate>]

app.requests:1|c              counter, increment by 1
app.queue_size:42|g           gauge, set to 42
app.request.latency:320|ms    timer, one observation of 320ms
app.active_users:1|s          set, add 1 to the unique-member set
app.requests:1|c|@0.1         counter, but only 1-in-10 calls sampled — daemon multiplies back up
```

| Type | Semantics                                                            |
| ---- | -------------------------------------------------------------------- |
| `c`  | Counter — daemon sums values since last flush                        |
| `g`  | Gauge — daemon keeps the last value (or applies `+`/`-` deltas)      |
| `ms` | Timer — daemon computes percentiles/mean/count over the flush window |
| `s`  | Set — daemon counts unique values seen in the flush window           |

## Push, UDP, fire-and-forget — on purpose

```
App process
    │  UDP send (no ack, no retry, no blocking)
    ▼
StatsD daemon (local or sidecar)
    │  aggregates for flush_interval (default 10s)
    ▼
Backend (originally Graphite; now anything with an exporter)
```

The entire design optimizes for one property: **instrumenting a hot code path must never be able to
slow it down or crash it**. UDP has no handshake and no retransmission, so a dropped packet is a
silently lost data point, never a blocked request thread. That tradeoff — correctness for safety —
is the opposite of what a metrics pipeline built on gRPC/OTLP over TCP assumes, and it's worth
naming explicitly when comparing the two models.

## Where it fits today: an ingestion shim, not an API choice

StatsD's client libraries have been superseded — new instrumentation reaches for an OTel SDK or a
Prometheus client library, both of which give richer metadata (labels/attributes, structured
histograms, service.name-style resource context) that a StatsD line format has no room for. But the
protocol itself persists as a **least-common-denominator ingestion input** almost every modern
collector still accepts:

| Collector               | StatsD support                                                                   |
| ----------------------- | -------------------------------------------------------------------------------- |
| [[telegraf]]            | `inputs.statsd` — one of 300+ input plugins                                      |
| Grafana Alloy           | `prometheus.exporter.statsd` / `otelcol.receiver.statsd`                         |
| OpenTelemetry Collector | `statsdreceiver` (contrib)                                                       |
| [[prometheus]]          | Via the separate `statsd_exporter` bridge (Prometheus itself never accepts push) |
| Datadog Agent           | `dogstatsd` — StatsD with tags bolted on, the most common extension              |

The practical upshot: if a legacy service already emits StatsD and rewriting its instrumentation
isn't in scope, the fix isn't "stand up a StatsD daemon and Graphite" — it's pointing that traffic
at whichever collector's StatsD receiver is already running, and letting it re-export as
Prometheus/OTLP from there.

**Why it matters here:** any older Node/Python service in the ShipSolid estate that still fires
`dogstatsd`-style lines doesn't need re-instrumentation to land in Mimir — Alloy's StatsD receiver
is the on-ramp, converting it to remote-write without touching application code. The cost is on the
label side: StatsD/DogStatsD tags map directly to Prometheus labels, so the same [[cardinality]]
discipline (bounded values, no request IDs) applies at the receiver, not just at native OTel
instrumentation.
