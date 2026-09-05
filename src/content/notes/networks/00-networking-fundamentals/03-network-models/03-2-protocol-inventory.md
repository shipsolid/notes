---
title: "Protocol Inventory"
description: "Every protocol referenced across the telemetry ingestion pipeline design, plus a general L7-termination reference table for the broader 'design an API gateway / load balancer' interview question."
tags: ["system-design", "observability", "telemetry", "maang-prep", "networking"]
hidden: false
zettelId: "202607130900"
relations:
  - slug: networks/00-networking-fundamentals/03-network-models/03-1-osi-layer-model
    kind: depends_on
  - slug: networks/05-http-ecosystem/05-grpc/05-grpc
    kind: related
  - slug: networks/05-http-ecosystem/02-http-versions/02-http1-vs-http2
    kind: related
  - slug: networks/06-security/02-tls/02-tls-offload
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-01-telemetry-ingestion-pipeline
    kind: related
---

> **Appears in:** > [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] §3.1
> (ingestion frontier — protocol termination), §5 (OTLP gRPC vs. Prometheus remote-write).

The main design mentions a lot of protocols across a lot of layers — easy to lose track of which one
does what. This is the flat reference: every protocol that shows up in the pipeline, grouped by the
layer it operates at, with a pointer back to where it's discussed in context.

---

## Ingestion / wire protocols (data plane)

These are the application-layer protocols agents actually speak to push telemetry in.

| Protocol                                           | Role                                                                                              | Discussed in                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| \*\*OTLP ([[networks/05-http-ecosystem/5-grpc/grpc | gRPC]])\*\*                                                                                       | Primary push protocol — binary, HTTP/2 multiplexed, carries all three signal types (metrics, logs, traces) | §1 Protocol, §2 architecture, §3.1 protocol negotiation, §5 OTLP gRPC vs. remote-write |
| **OTLP (HTTP)**                                    | Fallback transport for OTLP when gRPC is blocked by proxies or firewalls                          | §5 trade-off table                                                                                         |
| **Prometheus remote-write**                        | Legacy/compatibility push protocol — metrics only, snappy+protobuf, no native HTTP/2 multiplexing | §1 Protocol, §2 architecture, §3.1 negotiation, §5 trade-off table                                         |
| **Syslog**                                         | Legacy log ingestion path — Gateway 3 in the L1 architecture                                      | §2 architecture diagram                                                                                    |
| **StatsD**                                         | Legacy metrics agent protocol on the producer side                                                | §2 architecture diagram                                                                                    |
| **Datadog agent wire format**                      | Named as a possible brownfield compatibility requirement, not adopted in the reference design     | §1 Protocol                                                                                                |

## Transport layer

What the wire protocols above actually ride on, and why the choice matters at 100K+ agent fan-in.

| Protocol                                     | Role                                                                                                                                   | Discussed in                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| \*\*[[networks/05-http-ecosystem/5-grpc/grpc | gRPC]]\*\*                                                                                                                             | Transport for OTLP; also the channel for the backpressure signal (`RESOURCE_EXHAUSTED` status code)                 | §3.1 fan-in problem, §3.1 backpressure flow |
| **HTTP/2**                                   | Preferred transport — one connection, multiplexed streams, binary framing, HPACK header compression                                    | §3.1 protocol negotiation — see [[02-http1-vs-http2\| HTTP/2 vs HTTP/1.1]] for the full connection-scaling argument |
| **HTTP/1.1**                                 | Fallback transport for agents without HTTP/2 support — explicitly a compatibility shim, never the primary path for high-volume traffic | §3.1 protocol negotiation, §5 — see [[02-http1-vs-http2\| HTTP/2 vs HTTP/1.1]]                                      |

## Security / auth protocols

| Protocol                   | Role                                                                                                                                | Discussed in                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **TLS**                    | Transport encryption, terminated at the gateway (Layer 1) rather than per-backend-pod                                               | §3.1 responsibilities — see [[02-tls-offload\| TLS Offload]] |
| **mTLS**                   | Mutual auth — per-tenant certificate identity, also used for re-encryption past the offload point and as an isolation-layer control | §3.1 auth, §3.6 multi-tenancy isolation layers               |
| **Bearer token / API key** | Alternative per-tenant auth method, coarser-grained than mTLS                                                                       | §3.1 auth, §3.6 multi-tenancy isolation layers               |

## Routing / failover protocols

| Protocol               | Role                                                                                    | Discussed in                        |
| ---------------------- | --------------------------------------------------------------------------------------- | ----------------------------------- |
| **DNS-based failover** | Low-TTL DNS record swap; agent retries resolve to a healthy region                      | §3.8 agent failover options         |
| **Anycast routing**    | Agent always targets one IP; the network layer redirects to whichever region is healthy | §3.8 agent failover options         |
| **SNI routing**        | TLS ServerNameIndication used for tenant identification at the network edge             | §3.6 multi-tenancy isolation layers |

## Query-side (adjacent, not ingestion)

Not ingestion protocols, but they show up in the same design and are easy to conflate with the wire
protocols above.

| Protocol / mechanism                            | Role                                                                         | Discussed in                                              |
| ----------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| **LogQL**                                       | Loki's query language — the "read" half of the schema-on-read model          | §3.3 log processor, §5 schema-on-read vs. schema-on-write |
| **X-Scope-OrgID** (header, not a full protocol) | Tenant-scoping header enforced at the Mimir/Loki storage read and write path | §3.6 multi-tenancy isolation layers                       |

---

## The one thing worth saying out loud in an interview

Everything in the **ingestion / wire protocols** table is an _application_-layer choice about what
shape the telemetry payload takes. Everything in the **transport layer** table is a
_connection_-layer choice about how that payload actually gets from agent to gateway. The design's
answer collapses to one sentence: **OTLP over gRPC (which means HTTP/2) is the default for anything
new; HTTP/1.1 and Prometheus remote-write are compatibility shims for what already exists, not
architecture choices you'd make from scratch.**

---

## General reference: what an L7 gateway can terminate

> "L7" here means OSI Layer 7 — see [[03-1-osi-layer-model|OSI Layer Model]] if you want the L1-L7
> primer, including why this is a different numbering scheme than the pipeline's own Layer 1/2/3
> architecture labels.

Protocol termination as a capability is bigger than this one pipeline — it's a recurring MAANG
question in its own right ("design an API gateway," "design an L7 load balancer"). Everything above
is scoped to what this specific design speaks; this table is the general answer key for "can a
gateway terminate protocol X," independent of the telemetry use case.

| Layer       | Protocol                 | Common use                                           | Can be terminated? |
| ----------- | ------------------------ | ---------------------------------------------------- | ------------------ |
| Application | HTTP/1.0                 | Legacy web                                           | Yes                |
| Application | HTTP/1.1                 | REST APIs, websites                                  | Yes                |
| Application | HTTP/2                   | gRPC, modern APIs                                    | Yes                |
| Application | HTTP/3                   | QUIC-based HTTP                                      | Yes                |
| Application | gRPC                     | RPC framework over HTTP/2 (or HTTP/3 experimentally) | Yes                |
| Application | gRPC-Web                 | Browser gRPC                                         | Yes                |
| Application | WebSocket                | Full-duplex communication                            | Yes                |
| Application | Server-Sent Events (SSE) | Streaming events                                     | Yes                |
| Application | GraphQL over HTTP        | APIs                                                 | Yes                |
| Application | SOAP                     | XML web services                                     | Yes                |
| Application | REST                     | HTTP-based APIs                                      | Yes                |
| Application | MQTT                     | IoT messaging                                        | Yes                |
| Application | AMQP                     | RabbitMQ                                             | Yes                |
| Application | STOMP                    | Messaging                                            | Yes                |
| Application | Kafka Protocol           | Apache Kafka                                         | Yes                |
| Application | Redis RESP               | Redis clients                                        | Yes                |
| Application | PostgreSQL Wire Protocol | PostgreSQL                                           | Yes                |
| Application | MySQL Protocol           | MySQL                                                | Yes                |
| Application | MongoDB Wire Protocol    | MongoDB                                              | Yes                |
| Application | LDAP                     | Directory services                                   | Yes                |
| Application | DNS                      | Name resolution                                      | Yes                |
| Application | SMTP                     | Email                                                | Yes                |
| Application | IMAP                     | Email retrieval                                      | Yes                |
| Application | POP3                     | Email retrieval                                      | Yes                |
| Application | FTP                      | File transfer                                        | Yes                |
| Application | SFTP                     | Secure file transfer                                 | Yes                |
| Application | SSH                      | Remote shell                                         | Yes                |
| Application | Telnet                   | Legacy remote shell                                  | Yes                |
| Application | RTSP                     | Media streaming                                      | Yes                |
| Application | RTP                      | Real-time media                                      | Sometimes          |
| Application | SIP                      | VoIP                                                 | Yes                |

**The nuance behind "Yes" vs. "Sometimes":** most rows in this table are request/response or
session-oriented, so an L7 proxy can fully terminate (decrypt, parse, re-establish downstream)
without losing anything. **RTP is "Sometimes"** because it's a raw real-time media stream, not a
request/response exchange — a generic L7 proxy can't parse it meaningfully. Terminating it requires
a purpose-built media relay (an SBC — Session Border Controller — in the SIP/VoIP world), not just a
smarter reverse proxy. **Kafka/Redis/Postgres/MySQL/MongoDB wire protocols** are the other edge case
worth flagging out loud: they're technically terminable, but only by a protocol-aware proxy built
for that exact wire format (pgbouncer, ProxySQL, twemproxy, an Envoy Kafka filter) — a generic HTTP
gateway can't do it, unlike HTTP/gRPC/WebSocket where one gateway implementation (Envoy, NGINX)
handles all of them.

---

## Related

- [[03-1-osi-layer-model|OSI Layer Model]] — L1-L7 primer behind the "L7 gateway" terminology used
  above
- [[networks/05-http-ecosystem/05-grpc/05-grpc|gRPC]] — call shapes, status-code backpressure,
  deadline propagation, and the connection-level load-balancing gotcha
- [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline (full design)]] — §3.1 (protocol
  termination), §5 (OTLP gRPC vs. Prometheus remote-write)
- [[02-http1-vs-http2|HTTP/2 vs HTTP/1.1]] — why HTTP/2 wins the connection-scaling argument at
  100K+ agent fan-in
- [[02-tls-offload|TLS Offload]] — the other protocol-termination responsibility handled at the same
  L1 gateway
- [[05-21-rate-limiting-architecture|Rate Limiting Architecture]] — enforcement point that sits
  right behind protocol termination in the L1 gateway
