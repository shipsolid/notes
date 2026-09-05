---
title: "3.6 Multi-Tenancy"
description: "Multi-tenancy isolation layers and quota enforcement points across the telemetry ingestion pipeline, from network inbound to the storage write path."
tags: ["system-design", "observability", "telemetry", "maang-prep", "multi-tenancy"]
hidden: false
zettelId: "202607161614"
relations:
  - slug: observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-25-tenant-identification-and-routing
    kind: depends_on
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-18-authentication
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-35-q10-answer-self-service-tenant-onboarding
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-06-layer-3-processing-enrichment
    kind: related
---

> **Appears in:** [[05-01-telemetry-ingestion-pipeline|Telemetry Ingestion Pipeline]] — §3,
> [[05-01-telemetry-ingestion-pipeline#3.6 Multi-Tenancy|Deep Dives]] — this is §3.6.

## 3.6 Multi-Tenancy

This is the principal-level differentiator question: "how do you add a new tenant without affecting
existing ones?"

**Isolation layers:**

```mermaid
flowchart LR
    NET["Network\nSNI routing\n/v1/{tenant} path prefix"]
    AUTH["Auth\nPer-tenant API key\nor mTLS cert"]
    GW["Gateway\nExtract tenant ID\nadd as label/attribute"]
    BUF["Buffer\nTenant ID in message header\nper-tenant topic or consumer-filtered"]
    PROC["Processing\nPer-tenant cardinality budget\nsampling policy · retention override"]
    STORE["Storage\nMimir: X-Scope-OrgID\nLoki: X-Scope-OrgID"]

    NET --> AUTH --> GW --> BUF --> PROC --> STORE
```

**Quota enforcement points:**

1. **Gateway** — connection-level and request-rate limits (coarse)
2. **Processor** — cardinality budget, series-per-minute cap (fine-grained)
3. **Storage** — Mimir/Loki/Cortex all have per-tenant limits (bytes-per-second, active series cap)
   as a safety net

Always enforce at multiple layers. Never rely on a single enforcement point.
