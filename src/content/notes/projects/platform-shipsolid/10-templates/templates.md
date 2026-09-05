---
title: "10 — Templates"
description: "Reusable authoring templates for ADRs, RFCs, runbooks, post-mortems, and Confluence pages across the ShipSolid platform."
tags: ["ShipSolid", "Templates"]
updated: 2026-07-07
hidden: false
zettelId: "202606092046-77"
---

## 10 — Templates

Reusable authoring templates for the recurring document types across this platform workspace. Each
template here is a flat, easy-to-find copy; canonical originals for some of these live alongside the
document type they template (e.g. `adrs/_template.md`) — both copies are kept in sync intentionally
so authors can start from either the section they're working in or this single index.

## Contents

- [[adr-template|ADR Template]]
- [[rfc-template|RFC Template]]
- [[alert-runbooks-template|Alert Runbook Template]]
- [[post-mortems-template|Incident Post-Mortem Template]]
- [[projects/platform-shipsolid/10-templates/communication-templates|Communication Templates]]
- [[projects/platform-shipsolid/10-templates/confluence-content-templates|Confluence Content Templates]]
- [[onboarding-checklist-template|Onboarding Checklist Template]]

## Canonical originals

- `adr-template.md` mirrors the template at `01-platform-architecture/adrs/_template.md`
- `rfc-template.md` mirrors the RFCs sub-index template at
  `01-platform-architecture/rfcs/_template.md`
- `alert-runbooks-template.md` mirrors `04-operations-incident-response/alert-runbooks/_template.md`
- `post-mortems-template.md` mirrors `04-operations-incident-response/post-mortems/_template.md`
- `communication-templates.md` mirrors
  [[projects/platform-shipsolid/04-operations-incident-response/communication-templates|Communication Templates]]
  in Operations & Incident Response
- `confluence-content-templates.md` mirrors
  [[projects/platform-shipsolid/08-strategy-planning/confluence-content-templates|Confluence Content Templates]]
  in Strategy & Planning

## Conventions

- kebab-case filenames; human-readable name in each page's `title:` / H1.
- `scope: platform` — ShipSolid platform content.
- Stubs are greppable: `[stub: <name>]`.
