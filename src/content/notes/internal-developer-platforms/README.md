---
title: "Internal Developer Platforms"
description: "A book-shaped table of contents for Internal Developer Platforms: IDP fundamentals, architecture, self-service, golden paths, software catalogs, Backstage, templates, platform APIs and automation, developer experience, governance, operations, success metrics, anti-patterns, enterprise scale, and MAANG interview preparation — cross-linking existing platform-engineering-fundamentals/sre/observability notes instead of duplicating them."
tags: ["internal-developer-platforms", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607241330-86"
noteType: moc
---

# Internal Developer Platforms

## _Designing, Building, and Operating Self-Service Developer Platforms_

> **Goal:** Learn how to design, implement, and operate an Internal Developer Platform (IDP) that
> enables engineering teams through self-service, golden paths, automation, and an exceptional
> developer experience. This book is implementation-oriented but remains technology-agnostic where
> possible — specific tools (Backstage, Crossplane, Kubernetes, Terraform, GitHub Actions) are
> explored as platform capabilities rather than as standalone technologies. This book assumes the
> conceptual foundation from
> [[platform-engineering-fundamentals/readme|Platform Engineering Fundamentals]] — read that first
> if the DevOps → SRE → Platform Engineering lineage isn't already familiar.

If this were a book, this page is the table of contents. Each Part below is a chapter; each chapter
links out to the concepts, designs, and platform notes that already exist elsewhere in this wiki
instead of duplicating them. Unwritten chapters are listed as **stub** rows, not empty files.

## Parts

### 00 — Introduction to Internal Developer Platforms

The mental models and vocabulary this entire book builds on: why IDPs emerged, what one actually is,
the goals it optimizes for, and the build-vs-buy decision every organization eventually faces. See
also [[03-internal-developer-platforms-introduction|Internal Developer Platforms (Introduction)]]
and [[02-internal-developer-platforms|Internal Developer Platforms]] for two existing shorter
treatments this Part expands into a full book.

- [[01-the-rise-of-internal-developer-platforms|1 — The Rise of Internal Developer Platforms]] —
  _(stub)_
- [[02-what-is-an-internal-developer-platform|2 — What Is an Internal Developer Platform?]] —
  _(stub)_
- [[03-platform-goals|3 — Platform Goals]] — _(stub)_
- [[internal-developer-platforms/00-introduction-to-internal-developer-platforms/04-build-vs-buy/04-build-vs-buy|4 — Build vs Buy]]
  — _(stub)_

### 01 — Internal Developer Platform Architecture

The architectural decisions every later Part assumes: reference architecture, the building blocks a
platform is assembled from, the control-plane/data-plane split, and how platform scope divides
across domains. See also
[[platform-engineering-fundamentals/04-platform-design-principles/01-abstraction/01-abstraction|Abstraction]]
and [[02-composability|Composability]] in Platform Engineering Fundamentals for the cross-cutting
design principles this architecture is built from.

- [[internal-developer-platforms/01-internal-developer-platform-architecture/01-idp-reference-architecture/01-idp-reference-architecture|1 — IDP Reference Architecture]]
  — _(stub)_
- [[02-platform-building-blocks|2 — Platform Building Blocks]] — _(stub)_
- [[03-control-plane-vs-data-plane|3 — Control Plane vs Data Plane]] — _(stub)_
- [[04-platform-domains|4 — Platform Domains]] — _(stub)_

### 02 — Platform Self-Service

How the platform is actually consumed day to day: the self-service philosophy, the concrete
workflows it exposes, provisioning mechanics, and the APIs that make it programmable. See also
[[01-self-service-platforms|Self-Service Platforms]] and
[[sre/11-platform-engineering/03-self-service-infrastructure/03-self-service-infrastructure|Self-Service Infrastructure]]
for two existing shorter treatments of the same philosophy.

- [[01-self-service-philosophy|1 — Self-Service Philosophy]] — _(stub)_
- [[02-self-service-workflows|2 — Self-Service Workflows]] — _(stub)_
- [[03-service-provisioning|3 — Service Provisioning]] — _(stub)_
- [[internal-developer-platforms/02-platform-self-service/04-platform-apis/04-platform-apis|4 — Platform APIs]]
  — _(stub)_

### 03 — Golden Paths

Golden paths as the opinionated, paved-road layer on top of self-service: what they are, how to
design one, worked examples across common workload shapes, and how a path survives its own
evolution. See also
[[platform-engineering-fundamentals/03-core-platform-principles/02-golden-paths/02-golden-paths|Golden Paths]]
and [[sre/11-platform-engineering/04-golden-paths/04-golden-paths|Golden Paths]] for this wiki's
sibling treatments of the same concept.

- [[01-what-are-golden-paths|1 — What Are Golden Paths?]] — _(stub)_
- [[02-designing-golden-paths|2 — Designing Golden Paths]] — _(stub)_
- [[03-golden-path-examples|3 — Golden Path Examples]] — _(stub)_
- [[04-maintaining-golden-paths|4 — Maintaining Golden Paths]] — _(stub)_

### 04 — Software Catalogs

The software catalog as the platform's map of what exists and who owns it: why it matters, how to
design one, its data model, and the ownership models it has to represent. See also
[[service-catalog|Service Catalog]] for a real, concrete catalog this Part's design chapters can be
checked against.

- [[01-why-software-catalogs-matter|1 — Why Software Catalogs Matter]] — _(stub)_
- [[02-service-catalog-design|2 — Service Catalog Design]] — _(stub)_
- [[03-catalog-data-model|3 — Catalog Data Model]] — _(stub)_
- [[04-ownership-models|4 — Ownership Models]] — _(stub)_

### 05 — Backstage

Backstage as the reference open-source implementation of everything covered so far: catalog,
scaffolder, TechDocs, and a plugin ecosystem that turns individual capabilities into one portal. No
existing note in this wiki covers Backstage yet — this Part is its canonical home.

- [[01-introduction-to-backstage|1 — Introduction to Backstage]] — _(stub)_
- [[02-backstage-software-catalog|2 — Backstage Software Catalog]] — _(stub)_
- [[03-backstage-scaffolder|3 — Backstage Scaffolder]] — _(stub)_
- [[04-backstage-techdocs|4 — Backstage TechDocs]] — _(stub)_
- [[05-backstage-plugins|5 — Backstage Plugins]] — _(stub)_
- [[06-extending-backstage|6 — Extending Backstage]] — _(stub)_

### 06 — Software Templates

Software templates as the mechanism that turns a golden path from documentation into something a
developer actually runs: service and infrastructure templates, the standards they encode, and how
they're versioned and governed over time.

- [[01-why-templates-matter|1 — Why Templates Matter]] — _(stub)_
- [[02-service-templates|2 — Service Templates]] — _(stub)_
- [[03-infrastructure-templates|3 — Infrastructure Templates]] — _(stub)_
- [[04-organization-standards|4 — Organization Standards]] — _(stub)_
- [[05-template-versioning|5 — Template Versioning]] — _(stub)_
- [[06-template-governance|6 — Template Governance]] — _(stub)_

### 07 — Platform APIs & Automation

Making the platform API-first and automated end to end: event-driven automation, workflow engines,
orchestration across capabilities, infrastructure automation, and policy-as-code. See also
[[gitops|GitOps]], [[argocd|Argo CD]], and [[13-gitops-in-sre|GitOps in SRE]] for backend detail
behind the automation layer.

- [[01-api-driven-platforms|1 — API-Driven Platforms]] — _(stub)_
- [[02-event-driven-automation|2 — Event-Driven Automation]] — _(stub)_
- [[03-workflow-engines|3 — Workflow Engines]] — _(stub)_
- [[internal-developer-platforms/07-platform-apis-and-automation/04-platform-orchestration/04-platform-orchestration|4 — Platform Orchestration]]
  — _(stub)_
- [[05-infrastructure-automation|5 — Infrastructure Automation]] — _(stub)_
- [[06-policy-automation|6 — Policy Automation]] — _(stub)_

### 08 — Developer Experience (DevEx)

Developer experience as a measurable, designed-for platform outcome: understanding it, measuring it,
reducing cognitive load, mapping developer journeys, and treating documentation and UX as platform
features. See also
[[sre/11-platform-engineering/06-developer-experience/06-developer-experience|Developer Experience]]
and
[[platform-engineering-fundamentals/02-platform-as-a-product/03-developer-experience/03-developer-experience|Developer Experience (DevEx)]]
for two existing shorter treatments of the same subject.

- [[01-understanding-developer-experience|1 — Understanding Developer Experience]] — _(stub)_
- [[02-measuring-devex|2 — Measuring DevEx]] — _(stub)_
- [[03-reducing-cognitive-load|3 — Reducing Cognitive Load]] — _(stub)_
- [[04-developer-journeys|4 — Developer Journeys]] — _(stub)_
- [[05-documentation-as-a-platform-feature|5 — Documentation as a Platform Feature]] — _(stub)_
- [[06-platform-ux-design|6 — Platform UX Design]] — _(stub)_

### 09 — Platform Governance

Identity, security, policy, guardrails, compliance, and auditability as they apply specifically to a
platform's own control plane and provisioning surface. See also
[[sre/09-security-for-sre/01-identity-and-access-management/01-identity-and-access-management|Identity and Access Management]]
for the broader IAM discipline this Part specializes to a platform context.

- [[internal-developer-platforms/09-platform-governance/01-identity-and-access-management/01-identity-and-access-management|1 — Identity and Access Management]]
  — _(stub)_
- [[02-platform-security|2 — Platform Security]] — _(stub)_
- [[03-platform-policies|3 — Platform Policies]] — _(stub)_
- [[04-platform-guardrails|4 — Platform Guardrails]] — _(stub)_
- [[05-compliance-by-default|5 — Compliance by Default]] — _(stub)_
- [[06-auditability|6 — Auditability]] — _(stub)_

### 10 — Operating an Internal Developer Platform

Running the platform itself as a production system: day-two operations, platform-specific
reliability, observability, support models, incident management, and long-term evolution. See also
[[sre/11-platform-engineering/08-platform-reliability/08-platform-reliability|Platform Reliability]],
[[01-building-a-platform-team|Observability Platform Engineering]], and
[[01-incident-response-lifecycle|Incident Response Lifecycle]].

- [[01-platform-operations|1 — Platform Operations]] — _(stub)_
- [[internal-developer-platforms/10-operating-an-internal-developer-platform/02-platform-reliability/02-platform-reliability|2 — Platform Reliability]]
  — _(stub)_
- [[03-platform-observability|3 — Platform Observability]] — _(stub)_
- [[04-platform-support-models|4 — Platform Support Models]] — _(stub)_
- [[05-incident-management|5 — Incident Management]] — _(stub)_
- [[06-platform-evolution|6 — Platform Evolution]] — _(stub)_

### 11 — Measuring Platform Success

How platform success gets measured from the IDP's own vantage point: adoption, productivity,
platform reliability, and developer satisfaction. See also [[02-dora-metrics|DORA Metrics]] and
[[03-space-framework|SPACE Framework]] for the general productivity-metrics framework this Part's
Productivity Metrics chapter specializes.

- [[01-adoption-metrics|1 — Adoption Metrics]] — _(stub)_
- [[02-productivity-metrics|2 — Productivity Metrics]] — _(stub)_
- [[03-platform-reliability-metrics|3 — Platform Reliability Metrics]] — _(stub)_
- [[04-developer-satisfaction|4 — Developer Satisfaction]] — _(stub)_

### 12 — Platform Anti-Patterns

The recurring ways an IDP initiative fails even with real investment behind it. This Part overlaps
substantially with [[01-ticket-driven-platforms|Platform Anti-Patterns]] in Platform Engineering
Fundamentals — each chapter below links to its closest sibling there rather than restating it.

- [[01-portal-without-automation|1 — Portal Without Automation]] — _(stub)_
- [[02-platform-team-as-ticket-queue|2 — Platform Team as Ticket Queue]] — _(stub)_
- [[03-too-many-golden-paths|3 — Too Many Golden Paths]] — _(stub)_
- [[04-ignoring-developer-feedback|4 — Ignoring Developer Feedback]] — _(stub)_
- [[05-over-engineered-platforms|5 — Over-Engineered Platforms]] — _(stub)_
- [[06-poor-adoption|6 — Poor Adoption]] — _(stub)_

### 13 — Enterprise IDPs

Platform engineering at enterprise scale: multi-team, multi-cloud, and multi-region platforms,
domain-oriented structuring, product management, and what changes structurally as adoption grows.
See also [[01-scaling-platform-teams|Scaling Platform Teams]] and
[[04-multi-cloud-reliability|Multi-Cloud Reliability]].

- [[01-multi-team-platforms|1 — Multi-Team Platforms]] — _(stub)_
- [[02-multi-cloud-idps|2 — Multi-Cloud IDPs]] — _(stub)_
- [[03-multi-region-platforms|3 — Multi-Region Platforms]] — _(stub)_
- [[04-domain-oriented-platforms|4 — Domain-Oriented Platforms]] — _(stub)_
- [[05-platform-product-management|5 — Platform Product Management]] — _(stub)_
- [[06-scaling-an-internal-developer-platform|6 — Scaling an Internal Developer Platform]] —
  _(stub)_

### 14 — MAANG Interview Preparation

Interview preparation specific to IDP and platform-engineering roles at the Staff/Principal (L6/L7)
level: system design, self-service design exercises, Backstage architecture questions, golden path
exercises, and case studies. See also
[[04-staff-principal-interview-questions|Common Staff/Principal Platform Engineering Questions]] and
[[13-staff-principal-sre-interviews|Staff/Principal SRE Interviews]].

- [[01-internal-developer-platform-system-design|1 — Internal Developer Platform System Design]] —
  _(stub)_
- [[02-designing-self-service-platforms|2 — Designing Self-Service Platforms]] — _(stub)_
- [[03-backstage-architecture-interview-questions|3 — Backstage Architecture Interview Questions]] —
  _(stub)_
- [[04-golden-path-design-exercises|4 — Golden Path Design Exercises]] — _(stub)_
- [[05-platform-api-design-interviews|5 — Platform API Design Interviews]] — _(stub)_
- [[06-staff-principal-platform-engineering-case-studies|6 — Staff/Principal Platform Engineering Case Studies]]
  — _(stub)_

### 15 — Appendices

Reference material — architecture quick-reference, Backstage entity reference, catalog schema
examples, API design patterns, journey-mapping templates, a capability maturity model, and a reading
list — for lookup after working through the book. See also
[[01-platform-engineering-glossary|Platform Engineering Glossary]] and
[[07-observability-design-patterns|Observability Appendices]] for this wiki's other
reference-appendix Parts.

- [[internal-developer-platforms/15-appendices/01-idp-reference-architecture/01-idp-reference-architecture|1 — IDP Reference Architecture]]
  — _(stub)_
- [[02-backstage-entity-reference|2 — Backstage Entity Reference]] — _(stub)_
- [[03-software-catalog-schema-examples|3 — Software Catalog Schema Examples]] — _(stub)_
- [[04-platform-api-design-patterns|4 — Platform API Design Patterns]] — _(stub)_
- [[05-developer-journey-mapping-templates|5 — Developer Journey Mapping Templates]] — _(stub)_
- [[06-idp-capability-maturity-model|6 — IDP Capability Maturity Model]] — _(stub)_
- [[07-platform-engineering-reading-list|7 — Platform Engineering Reading List]] — _(stub)_

## Learning Outcomes

After completing this book, you will be able to:

- Explain the architecture and purpose of an **Internal Developer Platform (IDP)**.
- Design a complete IDP using **developer portals, software catalogs, templates, APIs, and
  automation**.
- Implement **self-service infrastructure** and **golden paths** that reduce developer cognitive
  load.
- Model software systems with **service catalogs**, ownership metadata, and dependency
  relationships.
- Use **Backstage** as the foundation for an extensible developer portal, including Catalog,
  Scaffolder, TechDocs, and plugins.
- Design APIs, workflows, and governance mechanisms that balance autonomy with organizational
  standards.
- Measure platform success through adoption, productivity, reliability, and developer experience
  metrics.
- Evaluate trade-offs in IDP architecture and discuss them effectively in **MAANG Staff/Principal
  (L6/L7)** system design and platform engineering interviews.

## Metadata

|        |                              |
| ------ | ---------------------------- |
| Author | Amit Singh                   |
| Scope  | internal-developer-platforms |
