---
title: "What is Envoy"
description: "CNCF-graduated L7 proxy built at Lyft — the de facto data plane for service mesh (Istio, Linkerd's predecessor lineage) — now extending into AI traffic via Envoy AI Gateway, which reached v1.0 with a native MCP Gateway in 2026."
tags: ["tech", "networking", "service-mesh", "observability", "cncf"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-2"
relations:
  - slug: observability/11-visualization/02-golden-signals/02-tail-latency
    kind: related
  - slug: patterns/09-cloud-native-patterns/01-sidecar/01-sidecar
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-21-rate-limiting-architecture
    kind: related
  - slug: observability/reference/ebpf
    kind: compared_to
  - slug: grafana-cloud/reference/grafana-mcp
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/mcp-toolbox
    kind: related
---

Envoy is a high-performance L7 (application-layer) proxy originally built at Lyft, now a CNCF
graduated project. It's the piece of infrastructure most service meshes are built _on top of_ —
Istio's data plane is Envoy sidecars; most "service mesh" behavior you observe in practice (retries,
circuit breaking, mTLS) is Envoy doing the work under a mesh control plane's configuration.

---

## Core proxy capabilities

| Capability               | Why it matters                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **xDS APIs**             | Dynamic configuration — routes, clusters, and listeners update without a restart, pushed by a control plane    |
| **Load balancing**       | Round robin, least-request, ring hash, and more — chosen per upstream cluster                                  |
| **Circuit breaking**     | Stops sending requests to an upstream that's already failing, before it cascades                               |
| **Retries / timeouts**   | Bounded retry budgets and deadlines per route — see [[08-deadline-propagation]]                                |
| **HTTP/2 & gRPC native** | First-class support, not bolted on                                                                             |
| **Native observability** | Emits stats (compatible with Prometheus scraping), access logs, and distributed tracing headers out of the box |
| **WASM extensibility**   | Custom filters without recompiling Envoy itself                                                                |

```
Client ──▶ Envoy (sidecar or edge)
              │
              ├── Apply routing rules (xDS-configured)
              ├── Load balance across healthy upstreams
              ├── Enforce timeout / retry policy
              ├── Emit stats + trace spans
              └── Forward to upstream service
```

## [[patterns/09-cloud-native-patterns/01-sidecar/01-sidecar|Sidecar pattern]] (service mesh)

```
        ┌─────────────┐        ┌─────────────┐
        │  Service A  │        │  Service B  │
        │   + Envoy   │◀──────▶│   + Envoy   │
        │   sidecar   │  mTLS  │   sidecar   │
        └─────────────┘        └─────────────┘
```

Every service gets an Envoy sidecar; application code talks to `localhost`, and the sidecar handles
mTLS, retries, and telemetry transparently. This is why Envoy is the concrete implementation behind
a lot of what [[02-tail-latency]] describes in the abstract — hedged requests, retry budgets, and
load shedding are Envoy config, not application code, in a mesh deployment.

## 2026 development: Envoy AI Gateway

The newer, directly relevant piece for an AI-agent pipeline: **Envoy AI Gateway** reached v1.0 in
June 2026 — the first open-source AI gateway built on Envoy Gateway, with production users including
Bloomberg (who initiated the effort), Nutanix, and LY Corporation.

```
Agents / apps
     │
     ▼
Envoy AI Gateway (v1.0)
     ├── Unified API across LLM providers (route by provider, not custom code per SDK)
     ├── Native MCP Gateway          ← governs MCP traffic the way Envoy governs HTTP traffic
     ├── Token-aware traffic management
     ├── Centralized credential management
     └── AI-native observability
     │
     ▼
LLM providers / MCP servers ([[grafana-mcp]], [[mcp-toolbox]], ...)
```

The **native MCP Gateway** is the piece that connects directly back to the rest of this list: if an
agent pipeline is calling multiple MCP servers ([[grafana-mcp]], [[mcp-toolbox]], Playwright MCP),
Envoy AI Gateway is the infrastructure layer for centralizing auth, rate limits, and observability
across all of those calls, rather than each MCP client managing that per-connection. Google has
flagged deeper MCP security and spend-based governance as the next area of focus.

## Where it fits

| Concern              | Classic Envoy (service mesh)              | Envoy AI Gateway                             |
| -------------------- | ----------------------------------------- | -------------------------------------------- |
| What it fronts       | Service-to-service HTTP/gRPC traffic      | LLM provider calls + MCP server traffic      |
| Config model         | xDS from a mesh control plane (Istio)     | Envoy Gateway CRDs, AI-specific extensions   |
| Observability payoff | Uniform stats/tracing across all services | Token-aware, AI-native traffic observability |

**Why it's on the backlog:** it's the traffic-governance layer missing from the rest of this list —
every other tool here is a client or a server for agent/MCP traffic, and Envoy AI Gateway is where
you'd centralize auth, rate limiting, and observability once more than one agent is calling more
than one MCP server.
