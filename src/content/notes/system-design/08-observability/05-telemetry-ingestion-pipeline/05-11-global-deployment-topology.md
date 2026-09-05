---
title: "3.8 Global Deployment Topology"
description: "Global deployment topology for the telemetry ingestion pipeline — regional writes vs. a global cluster, async replication to a global query tier, and agent failover."
tags: ["system-design", "observability", "telemetry", "maang-prep", "global-topology"]
hidden: false
zettelId: "202607161616"
relations:
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-32-q7-answer-regional-gateway-outage-blast-radius
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-14-interview-anchor-points
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-12-observability-of-the-pipeline
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — §3,
> [[05-01-telemetry-ingestion-pipeline#3.8 Global Deployment Topology|Deep Dives]] — this is §3.8.

## 3.8 Global Deployment Topology

At Netflix/Google scale, a single-region ingestion cluster is both a single point of failure and
introduces cross-region write latency for globally distributed agents.

```mermaid
flowchart TD
    subgraph US["US-EAST"]
        A1["Agents"] --> GW1["Regional Ingestion\nGateway"]
        GW1 --> KF1["Regional Kafka\nCluster"]
        KF1 --> PR1["Regional Processor\nFleet"]
        PR1 --> MI1["Regional Mimir\nWrite Path"]
    end

    subgraph EU["EU-WEST"]
        A2["Agents"] --> GW2["Regional Ingestion\nGateway"]
        GW2 --> KF2["Regional Kafka\nCluster"]
        KF2 --> PR2["Regional Processor\nFleet"]
        PR2 --> MI2["Regional Mimir\nWrite Path"]
    end

    MI1 & MI2 -->|"async replication"| GQ["Global Query Tier\nRuler · Querier\nreads from all regional stores + merges"]
```

**Trade-off: regional isolation vs global query:**

| Approach                                         | Write latency           | Query complexity             | Failure blast radius                     |
| ------------------------------------------------ | ----------------------- | ---------------------------- | ---------------------------------------- |
| Regional writes + federated query                | Local (< 10ms)          | Fan-out query across regions | Single region; others unaffected         |
| Global single cluster                            | Cross-region (50–150ms) | Simple                       | Global — one cluster failure affects all |
| Regional writes + async cross-region replication | Local                   | Simple (global store)        | Replication lag window                   |

**Answer:** Regional writes + async replication for global query. Write latency stays local. A
region outage means that region's tenants lose telemetry for the outage duration — acceptable if the
alternative is global blast radius. This matches Mimir's multi-cluster deployment model and how
Grafana Cloud is actually architected.

**Agent failover:** If a region's gateway is unreachable, the agent must reroute. Options:

- DNS-based failover (low TTL, agent retries to secondary endpoint)
- Anycast routing (agent always sends to the same IP; routing layer redirects to healthy region)
- Agent-side fallback list (explicitly configured secondary endpoint in agent config)
