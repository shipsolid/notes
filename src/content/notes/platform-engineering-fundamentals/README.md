---
title: "Platform Engineering Fundamentals"
description: "A book-shaped table of contents for platform engineering fundamentals: evolution and organizational foundations, platform-as-a-product thinking, core principles (self-service, golden paths, automation, APIs), design principles, the platform lifecycle, DORA/SPACE metrics, anti-patterns, enterprise governance, and MAANG interview prep — cross-linking existing sre/patterns/observability/projects notes instead of duplicating them."
tags: ["platform-engineering-fundamentals", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607241311-59"
noteType: moc
---

# Recommended Reading Order

Instead of reading all 12 books sequentially, I'd recommend this path:

### Foundation

1. Platform Engineering Fundamentals
2. Infrastructure Platform Engineering
3. Kubernetes Platform Engineering
4. CI/CD Platform Engineering

### Core Platform

5. Internal Developer Platforms
6. Observability Platform Engineering
7. Platform Security Engineering
8. Reliability Engineering

### Senior/Staff Level

9. Platform Architecture
10. Platform Operations
11. Platform Product Management
12. Advanced Platform Engineering

# Platform Engineering Fundamentals

## _Building the Mental Model for Modern Platform Engineering_

> **Goal:** Build a strong conceptual foundation in Platform Engineering before learning Internal
> Developer Platforms (IDPs), Kubernetes platforms, Infrastructure Platforms, and Platform
> Operations. This book focuses on the _why_, _what_, and _principles_ of Platform Engineering
> rather than implementation details. See [[sre/readme|SRE]] for the build-it-and-operate-it layer
> this book is the conceptual prerequisite to.

If this were a book, this page is the table of contents. Each Part below is a chapter; each chapter
links out to the concepts, designs, and platform notes that already exist elsewhere in this wiki
instead of duplicating them. Unwritten chapters are listed with a `— _(stub)_` marker, not empty
files.

## Parts

### 00 — The Evolution of Platform Engineering

The mental models that separate platform engineering from what came before it: the infrastructure
eras that preceded it, the SysAdmin → DevOps → Platform Engineering lineage, and the forces (org
scale, cognitive load, velocity) that made a dedicated platform team a good bet. See also
[[03-devops-vs-sre-vs-platform-engineering|DevOps vs. SRE vs. Platform Engineering]] in the SRE book
for that book's treatment of the same boundary question.

- [[01-evolution-of-infrastructure-engineering|1 — The Evolution of Infrastructure Engineering]] —
  _(stub)_
- [[02-system-administration-to-platform-engineering|2 — From System Administration to Platform Engineering]]
  — _(stub)_
- [[03-devops-sre-platform-engineering|3 — DevOps, SRE, and Platform Engineering]] — _(stub)_
- [[04-why-platform-engineering-exists|4 — Why Platform Engineering Exists]] — _(stub)_
- [[05-evolution-of-developer-experience|5 — The Evolution of Developer Experience (DevEx)]] —
  _(stub)_

### 01 — Organizational Foundations

The organizational theory a platform team's shape has to answer to — Conway's Law, Team Topologies,
and cognitive load — before any platform capability gets designed. See also
[[patterns/15-organizational-patterns/02-conways-law/02-conways-law|Conway's Law]] and
[[patterns/15-organizational-patterns/01-team-topologies/01-team-topologies|Team Topologies]] in the
Patterns book for the pattern-level treatment of the same organizational theory.

- [[platform-engineering-fundamentals/01-organizational-foundations/01-conways-law/01-conways-law|1 — Conway's Law]]
  — _(stub)_
- [[platform-engineering-fundamentals/01-organizational-foundations/02-team-topologies/02-team-topologies|2 — Team Topologies]]
  — _(stub)_
- [[03-cognitive-load|3 — Cognitive Load]] — _(stub)_
- [[04-platform-teams|4 — Platform Teams]] — _(stub)_

### 02 — Platform as a Product

Treats the internal platform as a product with real users — product thinking, user research,
roadmaps, and adoption strategy — rather than a shared-infrastructure team with a mandate.

- [[01-platform-as-a-product|1 — Platform as a Product]] — _(stub)_
- [[02-product-management-for-platforms|2 — Product Management for Platforms]] — _(stub)_
- [[platform-engineering-fundamentals/02-platform-as-a-product/03-developer-experience/03-developer-experience|3 — Developer Experience (DevEx)]]
  — _(stub)_
- [[04-platform-adoption|4 — Platform Adoption]] — _(stub)_

### 03 — Core Platform Principles

The recurring principles a platform is built around: self-service, golden paths, the Internal
Developer Platform shape, API-first design, automation, standardization, and opinionation. See also
the SRE book's own [[sre/readme|Platform Engineering]] section —
[[sre/11-platform-engineering/03-self-service-infrastructure/03-self-service-infrastructure|Self-Service Infrastructure]],
[[sre/11-platform-engineering/04-golden-paths/04-golden-paths|Golden Paths]], and
[[02-internal-developer-platforms|Internal Developer Platforms]] — for the build-it-and-run-it layer
these principles inform.

- [[01-self-service-platforms|1 — Self-Service Platforms]] — _(stub)_
- [[platform-engineering-fundamentals/03-core-platform-principles/02-golden-paths/02-golden-paths|2 — Golden Paths]]
  — _(stub)_
- [[03-internal-developer-platforms-introduction|3 — Internal Developer Platforms (Introduction)]] —
  _(stub)_
- [[04-apis-everywhere|4 — APIs Everywhere]] — _(stub)_
- [[05-automation-first|5 — Automation First]] — _(stub)_
- [[06-standardization|6 — Standardization]] — _(stub)_
- [[07-opinionated-platforms|7 — Opinionated Platforms]] — _(stub)_

### 04 — Platform Design Principles

The cross-cutting design principles — abstraction, composability, scalability, reliability, security
— that every platform capability gets evaluated against before it ships.

- [[platform-engineering-fundamentals/04-platform-design-principles/01-abstraction/01-abstraction|1 — Abstraction]]
  — _(stub)_
- [[02-composability|2 — Composability]] — _(stub)_
- [[platform-engineering-fundamentals/04-platform-design-principles/03-scalability/03-scalability|3 — Scalability]]
  — _(stub)_
- [[04-reliability-by-design|4 — Reliability by Design]] — _(stub)_. See also
  [[02-slos-and-error-budgets|SLOs and Error Budgets]] for the operational mechanics behind
  reliability targets.
- [[05-security-by-default|5 — Security by Default]] — _(stub)_

### 05 — The Platform Engineering Lifecycle

The full platform lifecycle a capability moves through: Discover, Design, Build, Operate, Measure,
Improve.

- [[01-discover|1 — Discover]] — _(stub)_
- [[02-design|2 — Design]] — _(stub)_
- [[03-build|3 — Build]] — _(stub)_
- [[04-operate|4 — Operate]] — _(stub)_
- [[05-measure|5 — Measure]] — _(stub)_
- [[06-improve|6 — Improve]] — _(stub)_

### 06 — Measuring Platform Success

How platform success gets measured — developer productivity signals, the DORA metrics, the SPACE
framework, and platform-specific KPIs. No existing note in this wiki covers DORA or SPACE yet — this
Part is their canonical home.

- [[01-developer-productivity|1 — Developer Productivity]] — _(stub)_
- [[02-dora-metrics|2 — DORA Metrics]] — _(stub)_
- [[03-space-framework|3 — SPACE Framework]] — _(stub)_
- [[04-platform-kpis|4 — Platform KPIs]] — _(stub)_

### 07 — Platform Anti-Patterns

The recurring ways a platform initiative fails even with real investment behind it — patterns worth
recognizing early, not fixing after adoption has already stalled.

- [[01-ticket-driven-platforms|1 — Ticket-Driven Platforms]] — _(stub)_
- [[02-platform-as-an-operations-team|2 — Platform as an Operations Team]] — _(stub)_
- [[03-building-technology-instead-of-products|3 — Building Technology Instead of Products]] —
  _(stub)_
- [[04-excessive-standardization|4 — Excessive Standardization]] — _(stub)_
- [[05-platform-monoliths|5 — Platform Monoliths]] — _(stub)_
- [[platform-engineering-fundamentals/07-platform-anti-patterns/06-ignoring-developer-experience/06-ignoring-developer-experience|6 — Ignoring Developer Experience]]
  — _(stub)_
- [[07-low-platform-adoption|7 — Low Platform Adoption]] — _(stub)_

### 08 — Enterprise Platform Engineering

Platform engineering at enterprise scale: scaling the team itself, governance, maturity models, and
the culture that sustains a platform practice long-term. See also the ShipSolid platform project's
[[maturity-model|Platform & Cloud Maturity Model]] for a concrete, real-world maturity assessment.

- [[01-scaling-platform-teams|1 — Scaling Platform Teams]] — _(stub)_
- [[platform-engineering-fundamentals/08-enterprise-platform-engineering/02-platform-governance/02-platform-governance|2 — Platform Governance]]
  — _(stub)_
- [[03-platform-maturity-models|3 — Platform Maturity Models]] — _(stub)_
- [[04-building-a-platform-engineering-culture|4 — Building a Platform Engineering Culture]] —
  _(stub)_

### 09 — Platform Engineering Interview Preparation (MAANG)

Interview preparation specific to platform engineering roles at the Staff/Principal (L6/L7) level —
fundamentals questions, trade-off discussions, design case studies, and whiteboard practice.

- [[01-fundamentals-interview-questions|1 — Platform Engineering Fundamentals Interview Questions]]
  — _(stub)_
- [[02-architecture-trade-off-discussions|2 — Architecture Trade-Off Discussions]] — _(stub)_
- [[03-platform-design-case-studies|3 — Platform Design Case Studies]] — _(stub)_
- [[04-staff-principal-interview-questions|4 — Common Staff/Principal Platform Engineering Questions]]
  — _(stub)_
- [[platform-engineering-fundamentals/09-platform-engineering-interview-preparation/05-whiteboard-exercises/05-whiteboard-exercises|5 — Whiteboard Exercises]]
  — _(stub)_
- [[platform-engineering-fundamentals/09-platform-engineering-interview-preparation/06-interview-cheat-sheet/06-interview-cheat-sheet|6 — Platform Engineering Interview Cheat Sheet]]
  — _(stub)_

### 10 — Appendices

Reference material — glossary, cheat sheets, and further reading — for quick lookup after working
through the book.

- [[01-platform-engineering-glossary|1 — Platform Engineering Glossary]] — _(stub)_
- [[02-team-topologies-reference|2 — Team Topologies Reference]] — _(stub)_
- [[03-platform-principles-cheat-sheet|3 — Platform Principles Cheat Sheet]] — _(stub)_
- [[04-dora-space-metrics-quick-reference|4 — DORA & SPACE Metrics Quick Reference]] — _(stub)_
- [[05-platform-maturity-assessment|5 — Platform Maturity Assessment]] — _(stub)_
- [[06-recommended-reading-and-research-papers|6 — Recommended Reading & Research Papers]] —
  _(stub)_

## Learning Outcomes

After completing this book, you will be able to:

- Explain the evolution from **SysAdmin → DevOps → SRE → Platform Engineering**.
- Distinguish the responsibilities and interactions of **Platform Engineering, DevOps, and SRE**.
- Apply **Team Topologies**, **Conway's Law**, and **Cognitive Load Theory** to platform
  organization design.
- Think of an internal platform as a **product** with users, roadmaps, metrics, and adoption
  strategies.
- Design platforms around **self-service**, **golden paths**, **automation**, **APIs**, and
  **standardization**.
- Understand the complete **platform lifecycle**: Discover → Design → Build → Operate → Measure →
  Improve.
- Evaluate platform success using **DORA**, **SPACE**, platform KPIs, and adoption metrics.
- Identify common platform engineering anti-patterns and avoid them.
- Build the conceptual foundation required for the remaining books in the Platform Engineering
  series and for **MAANG Staff/Principal (L6/L7)** platform engineering interviews.

## Metadata

|        |                                   |
| ------ | --------------------------------- |
| Author | Amit Singh                        |
| Scope  | platform-engineering-fundamentals |
