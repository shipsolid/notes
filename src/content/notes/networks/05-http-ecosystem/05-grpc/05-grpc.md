---
title: "gRPC"
description: "What gRPC actually is underneath the shorthand this design uses it for — call shapes, status-code backpressure, deadline propagation, and the connection-level load-balancing gotcha at 100K+ agent fan-in."
tags: ["system-design", "observability", "telemetry", "maang-prep", "networking"]
hidden: false
zettelId: "202607131600"
relations:
  - slug: networks/05-http-ecosystem/02-http-versions/02-http1-vs-http2
    kind: depends_on
  - slug: networks/00-networking-fundamentals/03-network-models/03-2-protocol-inventory
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-21-rate-limiting-architecture
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-01-telemetry-ingestion-pipeline
    kind: related
---

> **Appears in:** > [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] §3.1 (fan-in
> problem, backpressure flow), §5 (OTLP gRPC vs. Prometheus remote-write), §6 (interview anchor
> points), §8 (cheat sheet).

The main design uses "gRPC" as shorthand for "the fast, binary, HTTP/2 option" in half a dozen
places — persistent connections, `RESOURCE_EXHAUSTED` backpressure, deadline-based fast failure.
Worth unpacking what's actually doing the work in each of those mentions, because two of them get
oversimplified in a live interview if you haven't taken gRPC apart before.

---

## What it is

gRPC is an RPC framework layered on top of HTTP/2. Two things it adds beyond "HTTP/2 with JSON":

- **Protocol Buffers** — a `.proto` contract defines the service methods and message schemas;
  codegen produces client/server stubs in whatever language. Binary wire format, no field names
  repeated on the wire (unlike JSON) — part of why OTLP-over-gRPC is more compact than
  OTLP-over-HTTP with JSON.
- **A call abstraction over HTTP/2 streams** — a gRPC "call" is a request message + response message
  (or streams of either) mapped onto one HTTP/2 stream, with gRPC-specific trailing headers
  (`grpc-status`, `grpc-message`) carrying the outcome after the HTTP-level response.

[[02-http1-vs-http2|HTTP/2 vs HTTP/1.1]] covers why the underlying transport wins at fan-in; this
note is about what gRPC bolts on top of that transport.

## The four call shapes — and which one OTLP actually uses

| Shape                   | Client sends | Server sends | Used for                               |
| ----------------------- | ------------ | ------------ | -------------------------------------- |
| Unary                   | 1 message    | 1 message    | `Export()` — one batch in, one ack out |
| Server streaming        | 1 message    | N messages   | Not used in OTLP export                |
| Client streaming        | N messages   | 1 message    | Not used in OTLP export                |
| Bidirectional streaming | N messages   | N messages   | Not used in OTLP export                |

This is worth stating explicitly because §3.1's "each agent maintains a **persistent gRPC
connection**" is easy to mishear as "a persistent gRPC _stream_." It isn't. The
`MetricsService.Export` / `LogsService.Export` / `TraceService.Export` RPCs in the OTLP spec are
**unary** — one `ExportRequest` batch per call, one `ExportResponse` (carrying `PartialSuccess`)
back. What's persistent is the underlying HTTP/2 **connection**, which the agent reuses across many
sequential unary calls instead of reopening a TCP+TLS handshake per batch. The fan-in math in §3.1
(N agents × 1 connection each) is about that connection reuse, not about holding a stream open.

## Status codes carry the backpressure signal

gRPC has its own status code space (`grpc-status` trailer), distinct from HTTP status codes, though
several map cleanly onto HTTP semantics when gRPC-over-HTTP/2 is in play:

| gRPC status          | Rough HTTP equivalent | Where it shows up in this design                                                                                                    |
| -------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `OK`                 | 200                   | Normal `ExportResponse`, possibly with partial rejects                                                                              |
| `RESOURCE_EXHAUSTED` | 429                   | §3.1 backpressure flow, §8 cheat sheet — Kafka consumer lag → gateway signals this → agent backs off with jitter into its local WAL |
| `DEADLINE_EXCEEDED`  | 504                   | §3.5 failure modes — "gRPC deadline ensures fast failure" on a crashed/slow gateway pod                                             |
| `UNAVAILABLE`        | 503                   | Gateway pod not accepting connections (rolling restart, health check failing)                                                       |
| `INVALID_ARGUMENT`   | 400                   | Schema validation reject at §3.1 ("fail fast before the buffer")                                                                    |

The reason this matters beyond trivia: `RESOURCE_EXHAUSTED` and `UNAVAILABLE` are both gRPC's
built-in, standardized way of telling a well-behaved client "back off," which is exactly why the
design can lean on client-side retry-with-jitter (§3.1, §6) instead of inventing a custom
backpressure header — every gRPC client library already knows how to interpret these codes.

## Deadlines propagate; timeouts don't

A gRPC **deadline** is an absolute point in time attached to the call, not a client-local timeout —
it propagates through any downstream calls the server makes on the agent's behalf, so a chain of
services all agree on "this must finish by T" rather than each hop restarting its own clock. That's
the mechanism behind §3.5's claim that a crashed gateway pod fails fast instead of hanging: the
agent's deadline expires and returns `DEADLINE_EXCEEDED` locally, it doesn't wait on a TCP-level
timeout that could be tens of seconds.

## The gotcha worth naming: gRPC connections and load balancer blind spots

Because a gRPC client holds one long-lived HTTP/2 connection and multiplexes every subsequent unary
call over it, an **L4 (TCP/connection-level) load balancer** only makes a placement decision once —
at connection establishment — and then has no visibility into the individual RPCs flowing over that
connection afterward. If connections are long-lived and agent population is uneven (some agents
reconnect often, others hold a connection for days), the gateway fleet can end up meaningfully
unbalanced even though the LB "did its job" at connect time.

This directly compounds the "connection establishment storms" problem in §3.1 — it's not just that
50K simultaneous reconnects are expensive, it's that whatever distribution they land in at that
moment is roughly the distribution the fleet is stuck with until the next round of reconnects. Two
standard mitigations, worth having ready if asked "how would you keep the gateway fleet balanced":

- **Client-side / lookaside load balancing** (gRPC's own `xds` resolver via [[envoy|Envoy]], or a
  simple DNS-based resolver with short TTLs) — the agent picks a target from a list the control
  plane keeps fresh, instead of relying on an L4 LB in front of a VIP.
- **Forced connection recycling** — cap connection lifetime server-side (`MAX_CONNECTION_AGE` /
  `MAX_CONNECTION_AGE_GRACE` in gRPC server options) so every connection eventually reconnects and
  gets a chance to redistribute, trading a small trickle of reconnects for avoiding permanent skew.

## The one thing worth saying out loud in an interview

"gRPC over HTTP/2 buys us connection reuse and binary framing, but the fan-in design has to account
for the fact that an L4 load balancer can't rebalance a connection mid-life — that's why I'd force
connection recycling or move to client-side load balancing rather than assuming the LB keeps the
fleet even over time."

---

## Related

- [[02-http1-vs-http2|HTTP/2 vs HTTP/1.1]] — the transport gRPC is built on; connection-scaling
  argument at 100K+ agent fan-in
- [[03-2-protocol-inventory|Protocol Inventory]] — where gRPC sits relative to every other protocol
  in the pipeline
- [[05-21-rate-limiting-architecture|Rate Limiting Architecture]] — the Envoy/xDS global rate-limit
  option also calls out a gRPC interceptor path
- [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline (full design)]] — §3.1 (fan-in,
  backpressure), §5 (OTLP gRPC vs. Prometheus remote-write)
