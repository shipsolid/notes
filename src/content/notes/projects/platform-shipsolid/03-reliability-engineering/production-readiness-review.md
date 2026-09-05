---
title: "Production Readiness Review (PRR)"
description: "The Production Readiness Review gate — what a service must satisfy before prod."
tags: ["ShipSolid", "SRE", "Reliability"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-22"
---

## Production Readiness Review (PRR)

## Purpose

The Production Readiness Review gate — what a service must satisfy before prod.

## Canonical template

Use [[prr-template|prr-template.md]] for each review.

## Gate checklist

- [ ] SLOs defined and instrumented.
- [ ] Golden-signal dashboard exists.
- [ ] Alerts wired to on-call (IRM).
- [ ] Runbooks for every paging alert.
- [ ] Rollback procedure documented.
- [ ] Capacity / load expectations stated.
- [ ] Cardinality + ingest budget reviewed.

> `[stub: prr-detail]` — fill this in. Greppable doc-debt marker.

## Related

- [[reliability-review-archive|Reliability Review Archive]]
- [[onboarding-checklist|Onboarding Checklist]]
