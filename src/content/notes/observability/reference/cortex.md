---
title: "What is Cortex (cortexproject)"
description: "CNCF Incubating, horizontally-scalable multi-tenant long-term storage for Prometheus — the project Grafana Mimir forked from in 2022, still maintained as the vendor-neutral, community-governed alternative once Grafana Labs redirected engineering effort to Mimir."
tags: ["tech", "observability", "metrics", "cncf"]
updated: 2026-08-02
hidden: false
zettelId: "202608021430-7"
relations:
  - slug: observability/reference/mimir
    kind: compared_to
  - slug: observability/reference/prometheus
    kind: related
  - slug: prometheus/07-production-prometheus/02-long-term-storage/02-long-term-storage
    kind: related
---

Cortex (`cortexproject/cortex`) is a horizontally-scalable, highly-available, multi-tenant long-term
storage backend for [[prometheus]] — accepted into CNCF in September 2018, promoted to **CNCF
Incubating** in August 2020, and still at that maturity level as of 2026 (not graduated). It's the
project [[mimir]] forked from, and the two now sit on opposite sides of a governance split rather
than a technical one.

---

## Same microservice shape Mimir forked

Cortex is the origin of the distributor → ingester → (object storage) → querier / store-gateway /
compactor split described in [[mimir]] — Grafana Labs' engineers built a large share of that
architecture as Cortex contributors before forking their continued work into Mimir in 2022. Anyone
who has operated Mimir is, mechanically, already looking at Cortex's shape.

## Timeline

| Date       | Event                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------- |
| 2018-09-20 | Accepted into CNCF                                                                            |
| 2020-08-20 | Promoted to CNCF Incubating maturity                                                          |
| 2022       | Grafana Labs forks its Cortex contributions into Mimir, steps back from co-maintaining Cortex |
| 2026       | Cortex remains CNCF Incubating (unchanged); Mimir is not itself a CNCF project                |

## Cortex vs. Mimir today

| Concern               | Cortex                                                  | [[mimir]]                                        |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Governance            | Community-governed, CNCF Incubating project             | Single-vendor (Grafana Labs) open-source project |
| CNCF standing         | Formal CNCF project, subject to CNCF graduation process | Not a CNCF project at all                        |
| Feature velocity      | Slower — smaller contributor base post-2022 fork        | Faster — Grafana Labs' primary engineering focus |
| Grafana Cloud backend | Not used — Mimir is the system of record                | The actual metrics backend behind Grafana Cloud  |

The practical differentiator isn't maturity level — neither project has graduated — it's governance:
Cortex stays useful specifically for teams that want a metrics backend answerable to a CNCF
technical oversight committee rather than one company's roadmap, at the cost of a smaller
contributor base and slower feature velocity than Mimir.

## Where it fits next to Mimir and Thanos

| Concern     | Cortex            | Mimir                    | Thanos                                                               |
| ----------- | ----------------- | ------------------------ | -------------------------------------------------------------------- |
| CNCF status | Incubating        | Not a CNCF project       | Incubating                                                           |
| Origin      | Independent, 2018 | Forked from Cortex, 2022 | Independent — Prometheus sidecar + object storage, not a Cortex fork |
| Governance  | Community         | Single-vendor            | Community                                                            |

**Why it's relevant here:** Mimir is already the metrics system of record in the ShipSolid Grafana
Cloud stack (per [[mimir]]) — this isn't a migration candidate. It's background for the one question
that does come up in vendor conversations: "what's the vendor-neutral fallback if we ever needed
one," and the honest answer is Cortex (community-governed CNCF project) or Thanos (independently
built, also CNCF Incubating), not "there isn't one."
