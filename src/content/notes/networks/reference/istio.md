---
title: "What is Istio"
description: "CNCF-graduated (July 2023) service mesh — sidecar model plus the newer sidecar-less ambient mode (stable since 1.24), now extending into AI traffic via the Gateway API Inference Extension and 2026's Ambient Multicluster beta."
tags: ["tech", "networking", "service-mesh", "kubernetes", "cncf"]
updated: 2026-08-02
hidden: false
zettelId: "202608021430"
relations:
  - slug: networks/reference/envoy
    kind: compared_to
  - slug: patterns/09-cloud-native-patterns/01-sidecar/01-sidecar
    kind: related
  - slug: observability/11-visualization/02-golden-signals/02-tail-latency
    kind: related
---

Istio is the reference-implementation service mesh — a CNCF graduated project (July 2023) for
traffic management, security, and observability across service-to-service calls without touching
application code. For years "Istio" meant one specific shape: an [[envoy]] sidecar next to every
pod. That's no longer the only — or even the recommended — deployment model.

---

## Two data planes: sidecar vs ambient

```
Sidecar (classic)                    Ambient (stable since 1.24)
──────────────────                   ───────────────────────────
┌───────────┐                        Node
│ Service A │                        ┌─────────────────────────┐
│ + Envoy   │◀──mTLS──▶┌───────────┐ │  ztunnel (per-node, L4)  │
│ sidecar   │          │ Service B │ │  handles mTLS + routing  │
└───────────┘          │ + Envoy   │ └─────────────────────────┘
                        │ sidecar   │           │
                        └───────────┘           ▼ (only if L7 policy needed)
                                        waypoint proxy (per-workload, L7)
```

Every pod gets its own Envoy proxy in the sidecar model — simple mental model, but real memory/CPU
overhead per pod and a mesh-wide upgrade means restarting every sidecar. **Ambient mode** splits
that into a per-node `ztunnel` handling mTLS and L4 routing for everything, with an optional
per-workload `waypoint` proxy added only where L7 policy (retries, header-based routing, rate
limiting) is actually needed.

| Concern                     | Sidecar                      | Ambient                                    |
| --------------------------- | ---------------------------- | ------------------------------------------ |
| Resource overhead           | Per-pod Envoy, always-on     | Per-node ztunnel; waypoint only where used |
| L7 features (retries, etc.) | Always available             | Requires adding a waypoint proxy           |
| Upgrade blast radius        | Every pod's sidecar          | ztunnel/waypoint upgrade independently     |
| Adoption model              | All-or-nothing per namespace | Incremental — L4 mesh-wide, L7 opt-in      |

## Control plane: istiod

One control plane binary handles what used to be three separate components (Pilot, Citadel, Galley):
pushing xDS config to every Envoy/ztunnel, issuing and rotating workload mTLS certificates, and
validating config before it's applied. This is the same xDS mechanism [[envoy]] itself describes —
Istio is the control plane that decides what to configure; Envoy (or ztunnel/waypoint in ambient
mode) is what actually executes it.

## 2026: ambient multicluster + AI-aware routing

Two developments announced at KubeCon + CloudNativeCon Europe 2026 move Istio further into both
multi-cluster and AI-workload territory:

- **Ambient Multicluster (beta)** — extends ambient mode's ztunnel/waypoint model across clusters
  without requiring a sidecar in any of them, simplifying what used to require a gateway-per-cluster
  topology for cross-cluster traffic.
- **Gateway API Inference Extension** — routes and load-balances LLM inference traffic (model-aware,
  not just host/path-aware) directly through mesh-managed gateways, the mesh-side counterpart to
  what Envoy AI Gateway does at the edge (see [[envoy]]).

## Where it fits next to Envoy AI Gateway

| Concern       | Istio (mesh)                                         | Envoy AI Gateway (edge)                      |
| ------------- | ---------------------------------------------------- | -------------------------------------------- |
| Traffic scope | Service-to-service, now cluster-to-cluster (ambient) | North-south: agents/apps → LLM providers/MCP |
| Config model  | istiod pushing xDS to ztunnel/waypoint/Envoy         | Envoy Gateway CRDs                           |
| AI-specific   | Gateway API Inference Extension (model-aware LB)     | Token-aware traffic mgmt, native MCP Gateway |

**Why it's relevant here:** for a multi-cluster AKS footprint, ambient mode's incremental adoption
path (L4 mesh-wide first, L7 waypoints only where policy is actually needed) is the practical answer
to the usual objection to service mesh — "we don't want sidecar overhead on every pod." Ambient
Multicluster is worth tracking specifically for cross-region/cross-cluster traffic without standing
up a full gateway mesh per cluster pair.
