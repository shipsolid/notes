---
title: "Service Catalog"
description: "Registry of all services emitting to the platform, with owner and on-call."
tags: ["ShipSolid", "Onboarding"]
updated: 2026-06-09
hidden: false
zettelId: "202606092223-2"
---

## Service Catalog

## Purpose

Registry of all services emitting to the platform, with owner and on-call.

| Service              | Team          | Env(s)      | Owner             | On-call           | SLO? | Status    |
| -------------------- | ------------- | ----------- | ----------------- | ----------------- | ---- | --------- |
| api-gateway          | platform-team | dev/qa/prod | Platform SRE      | platform-rotation | yes  | onboarded |
| auth-service         | platform-team | dev/qa/prod | Service Team Lead | platform-rotation | yes  | onboarded |
| billing-service      | commerce-team | dev/qa/prod | Service Team Lead | commerce-rotation | yes  | onboarded |
| notification-service | commerce-team | dev/qa      | Service Team Lead | commerce-rotation | no   | onboarded |
| tenant-service       | platform-team | dev/qa/prod | Platform SRE      | platform-rotation | yes  | onboarded |

> `[stub: service-catalog-rows]` — illustrative seed rows. Fill this in with real services.
> Greppable doc-debt marker.

> Source of truth for code-level service metadata is each service's `component.yaml` in `d-apps/`.
> This catalog is the observability-facing view.
