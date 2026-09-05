---
title: "Onboarding Checklist"
description: "The definitive checklist for taking a service from zero to fully observable."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092046-18"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/naming-and-label-schema
    kind: depends_on
  - slug: projects/platform-shipsolid/10-templates/onboarding-checklist-template
    kind: depends_on
  - slug: projects/platform-shipsolid/00-start-here/quickstart-onboard-in-30-min
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/service-catalog
    kind: depends_on
---

## Onboarding Checklist

## Purpose

The definitive checklist for taking a service from zero to fully observable.

## Canonical template

This page tracks live onboardings; the reusable checklist skeleton is
[[onboarding-checklist-template|onboarding-checklist-template.md]].

## Checklist

- [ ] Service registered in [[service-catalog|Service Catalog]] with owner + on-call.
- [ ] OTel instrumentation: metrics, logs, traces emitting.
- [ ] Standard resource attributes applied ([[naming-and-label-schema|Naming & Label Schema]]).
- [ ] Collector path deployed (Alloy via Helm), `glc_` token wired.
- [ ] Golden-signal dashboard imported.
- [ ] At least one SLO defined ([[slo-registry|SLO Registry]]).
- [ ] Alert rules + routing configured (IRM).
- [ ] Runbook(s) linked ([[runbook-index|Runbook Index]]).
- [ ] Cardinality reviewed ([[cardinality-governance|Cardinality Governance]]).
- [ ] Ingest budget assigned ([[ingest-budget-by-team|Ingest Budget by Team]]).
- [ ] Entry added to [[onboarded-teams-registry|Onboarded Teams Registry]].

## Related

- [[quickstart-onboard-in-30-min|Quickstart: Onboard in 30 Minutes]]
