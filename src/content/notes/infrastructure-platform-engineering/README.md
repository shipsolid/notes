---
title: "Infrastructure Platform Engineering"
description: "A book-shaped table of contents for infrastructure platform engineering: from infrastructure operations to self-service platforms, IaC foundations, Terraform/OpenTofu, cloud platform design, networking, identity, compute, storage, golden images, automation, governance, observability, reliability, enterprise platforms, anti-patterns, and MAANG interview prep — cross-linking existing sre/networks/kubernetes/patterns/internal-developer-platforms notes instead of duplicating them."
tags: ["infrastructure-platform-engineering", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607241409-84"
noteType: moc
---

# Infrastructure Platform Engineering

## _Building Self-Service Cloud Infrastructure Platforms_

> **Goal:** Learn how to design and operate an infrastructure platform that enables developers to
> provision secure, compliant, and standardized infrastructure through self-service. This book
> focuses on **platform architecture, Infrastructure as Code (IaC), cloud provisioning, governance,
> and automation**, rather than learning a single IaC tool. Terraform/OpenTofu are used as primary
> examples, but the concepts apply broadly. See
> [[platform-engineering-fundamentals/readme|Platform Engineering Fundamentals]] for the general
> platform-as-a-product mental model this book applies specifically to infrastructure.

If this were a book, this page is the table of contents. Each Part below is a chapter; each chapter
links out to the concepts, designs, and platform notes that already exist elsewhere in this wiki
instead of duplicating them. Unwritten chapters are listed with a `— _(stub)_` marker, not empty
files.

## Parts

### 00 — Introduction to Infrastructure Platform Engineering

The mental models that separate a self-service infrastructure platform from traditional
infrastructure operations: what a platform actually is, how its control-plane/execution-plane split
works, and the maturity stages an organization moves through. See
[[platform-engineering-fundamentals/readme|Platform Engineering Fundamentals]] for the general
platform-as-a-product theory this Part applies specifically to infrastructure.

- [[01-from-infrastructure-operations-to-infrastructure-platforms|1 — From Infrastructure Operations to Infrastructure Platforms]]
  — _(stub)_
- [[02-what-is-an-infrastructure-platform|2 — What Is an Infrastructure Platform?]] — _(stub)_
- [[03-infrastructure-platform-architecture|3 — Infrastructure Platform Architecture]] — _(stub)_
- [[04-infrastructure-maturity-model|4 — Infrastructure Maturity Model]] — _(stub)_

### 01 — Infrastructure as Code Foundations

The IaC fundamentals underneath every tool-specific chapter later in this book — declarative desired
state, idempotency, drift, lifecycle, state, and versioning. See
[[11-infrastructure-as-code|Infrastructure as Code]] in the SRE book for the general-practitioner
treatment; this book goes deeper on the platform-engineering angle.

- [[01-infrastructure-as-code-principles|1 — Infrastructure as Code Principles]] — _(stub)_
- [[02-infrastructure-lifecycle|2 — Infrastructure Lifecycle]] — _(stub)_
- [[03-state-management|3 — State Management]] — _(stub)_
- [[04-infrastructure-versioning|4 — Infrastructure Versioning]] — _(stub)_

### 02 — Terraform & OpenTofu Platform Engineering

Terraform/OpenTofu used as the concrete example of the IaC principles above — architecture, reusable
and enterprise-grade module design, pipelines, and policy gates. The narrower Terraform-provider
chapters in [[03-terraform-provider|Grafana Cloud]] and [[06-terraform|Observability]] cover only
their own backend-as-code scope — this Part owns the general depth.

- [[01-terraform-opentofu-architecture|1 — Terraform/OpenTofu Architecture]] — _(stub)_
- [[02-designing-reusable-modules|2 — Designing Reusable Modules]] — _(stub)_
- [[03-enterprise-module-design|3 — Enterprise Module Design]] — _(stub)_
- [[04-infrastructure-pipelines|4 — Infrastructure Pipelines]] — _(stub)_
- [[05-policy-and-validation|5 — Policy & Validation]] — _(stub)_

### 03 — Cloud Platform Design

Architecture principles, landing zones, multi-cloud, and hybrid cloud as the platform's foundational
boundary decisions. See [[03-cloud-infrastructure-patterns|Cloud Infrastructure Patterns]] and
[[04-multi-region-patterns|Multi-Region Patterns]] in the Patterns book, and
[[system-design/readme|System Design]]'s Cloud Architecture Part, for the pattern- and
system-design-level treatment of the same decisions.

- [[01-cloud-architecture-principles|1 — Cloud Architecture Principles]] — _(stub)_
- [[02-landing-zones|2 — Landing Zones]] — _(stub)_
- [[infrastructure-platform-engineering/03-cloud-platform-design/03-multi-cloud-architecture/03-multi-cloud-architecture|3 — Multi-Cloud Architecture]]
  — _(stub)_
- [[infrastructure-platform-engineering/03-cloud-platform-design/04-hybrid-cloud-platforms/04-hybrid-cloud-platforms|4 — Hybrid Cloud Platforms]]
  — _(stub)_

### 04 — Networking Platform

Networking as a platform capability: fundamentals, enterprise topology, cross-cloud connectivity,
and security. See [[01-virtual-networking|Virtual Networking]] in the Computer Networks book for the
general cloud-networking primitives; hub-spoke topology and platform-scale network governance are
new ground covered only here.

- [[01-networking-fundamentals|1 — Networking Fundamentals]] — _(stub)_
- [[02-enterprise-network-architecture|2 — Enterprise Network Architecture]] — _(stub)_
- [[03-connectivity|3 — Connectivity]] — _(stub)_
- [[infrastructure-platform-engineering/04-networking-platform/04-network-security/04-network-security|4 — Network Security]]
  — _(stub)_

### 05 — Identity & Access Platform

Identity and access as a platform concern, distinct from application-level auth: federation, IAM for
provisioning automation, secrets, and identity lifecycle automation. See
[[sre/09-security-for-sre/01-identity-and-access-management/01-identity-and-access-management|Identity and Access Management]]
and [[sre/09-security-for-sre/02-secrets-management/02-secrets-management|Secrets Management]] in
the SRE book for the general security treatment,
[[internal-developer-platforms/09-platform-governance/01-identity-and-access-management/01-identity-and-access-management|Identity and Access Management]]
in the Internal Developer Platforms book for control-plane IAM, and
[[kubernetes/06-authentication-and-authorization/03-rbac/03-rbac|RBAC]] in the Kubernetes book for
cluster-level authorization — this Part covers IAM for the infrastructure-provisioning layer itself.

- [[01-identity-architecture|1 — Identity Architecture]] — _(stub)_
- [[02-infrastructure-iam|2 — Infrastructure IAM]] — _(stub)_
- [[infrastructure-platform-engineering/05-identity-and-access-platform/03-secrets-management/03-secrets-management|3 — Secrets Management]]
  — _(stub)_
- [[04-identity-automation|4 — Identity Automation]] — _(stub)_

### 06 — Compute Platform

Compute as a platform catalog: VMs, containers, serverless, and standardized service offerings. See
[[01-compute-platforms|Compute Platforms]] in System Design for general compute trade-offs;
container-platform depth belongs to [[kubernetes/readme|Kubernetes]] and
[[kubernetes-platform-engineering/readme|Kubernetes Platform Engineering]] — this Part only covers
where compute fits in the infrastructure platform's catalog.

- [[infrastructure-platform-engineering/06-compute-platform/01-virtual-machines/01-virtual-machines|1 — Virtual Machines]]
  — _(stub)_
- [[infrastructure-platform-engineering/06-compute-platform/02-containers/02-containers|2 — Containers]]
  — _(stub)_
- [[03-serverless-infrastructure|3 — Serverless Infrastructure]] — _(stub)_
- [[04-platform-service-offerings|4 — Platform Service Offerings]] — _(stub)_

### 07 — Storage & Data Platform

Storage and managed data services as platform offerings, plus the backup/governance policy that
wraps them. See [[02-cloud-storage-services|Cloud Storage Services]] in System Design and
[[04-storage-classes|Storage Classes]] in the Kubernetes book for the storage-provisioning
primitives this Part builds a platform catalog around.

- [[01-storage-services|1 — Storage Services]] — _(stub)_
- [[02-managed-databases|2 — Managed Databases]] — _(stub)_
- [[03-backup-and-recovery|3 — Backup & Recovery]] — _(stub)_
- [[04-data-governance|4 — Data Governance]] — _(stub)_

### 08 — Image & Environment Platform

Golden images, immutability, and environment provisioning/lifecycle. No existing note in this wiki
covers golden image pipelines or immutable-image deployment strategy — this Part is genuinely new
ground, not a duplicate of anything else here.

- [[01-golden-images|1 — Golden Images]] — _(stub)_
- [[infrastructure-platform-engineering/08-image-and-environment-platform/02-immutable-infrastructure/02-immutable-infrastructure|2 — Immutable Infrastructure]]
  — _(stub)_
- [[03-environment-provisioning|3 — Environment Provisioning]] — _(stub)_
- [[04-environment-lifecycle-management|4 — Environment Lifecycle Management]] — _(stub)_

### 09 — Platform Automation

The automation layer that turns the platform's capabilities into self-service: APIs, request
workflows, event-driven triggers, and orchestration. See
[[internal-developer-platforms/readme|Internal Developer Platforms]] — its Platform APIs &
Automation Part covers the same automation layer at the IDP/developer-portal level; this Part covers
it at the infrastructure-provisioning layer underneath.

- [[01-infrastructure-apis|1 — Infrastructure APIs]] — _(stub)_
- [[infrastructure-platform-engineering/09-platform-automation/02-self-service-infrastructure/02-self-service-infrastructure|2 — Self-Service Infrastructure]]
  — _(stub)_
- [[03-workflow-automation|3 — Workflow Automation]] — _(stub)_
- [[04-event-driven-infrastructure|4 — Event-Driven Infrastructure]] — _(stub)_
- [[infrastructure-platform-engineering/09-platform-automation/05-platform-orchestration/05-platform-orchestration|5 — Platform Orchestration]]
  — _(stub)_

### 10 — Governance & Compliance

Standards, policy as code, compliance automation, tagging, cost governance, and auditing. See
[[kubernetes-platform-engineering/09-platform-security/03-policy-as-code/03-policy-as-code|Policy as Code]]
in Kubernetes Platform Engineering and [[06-policy-automation|Policy Automation]] in Internal
Developer Platforms for adjacent policy-enforcement layers. Cost governance has real, non-stub
precedent at [[projects/platform-shipsolid/07-cost-governance/cost-governance|Cost Governance]] —
read that before writing this chapter's prose.

- [[01-infrastructure-standards|1 — Infrastructure Standards]] — _(stub)_
- [[infrastructure-platform-engineering/10-governance-and-compliance/02-policy-as-code/02-policy-as-code|2 — Policy as Code]]
  — _(stub)_
- [[infrastructure-platform-engineering/10-governance-and-compliance/03-compliance-automation/03-compliance-automation|3 — Compliance Automation]]
  — _(stub)_
- [[04-tagging-and-metadata|4 — Tagging & Metadata]] — _(stub)_
- [[infrastructure-platform-engineering/10-governance-and-compliance/05-cost-governance/05-cost-governance|5 — Cost Governance]]
  — _(stub)_
- [[06-infrastructure-auditing|6 — Infrastructure Auditing]] — _(stub)_

### 11 — Infrastructure Observability

Observability scoped specifically to the infrastructure platform's own components and provisioning
operations — not application observability. See [[observability/readme|Observability]] for the full
observability book, [[sre/readme|SRE]]'s Observability Engineering Part for the practitioner
treatment, and [[kubernetes-platform-engineering/readme|Kubernetes Platform Engineering]]'s
Observability for Kubernetes Platforms Part for the K8s-platform-scoped angle — this Part only
covers what's specific to infrastructure-platform components themselves.

- [[01-infrastructure-monitoring|1 — Infrastructure Monitoring]] — _(stub)_
- [[02-logging-infrastructure|2 — Logging Infrastructure]] — _(stub)_
- [[03-infrastructure-tracing|3 — Infrastructure Tracing]] — _(stub)_
- [[infrastructure-platform-engineering/11-infrastructure-observability/04-capacity-planning/04-capacity-planning|4 — Capacity Planning]]
  — _(stub)_
- [[05-infrastructure-slos|5 — Infrastructure SLOs]] — _(stub)_

### 12 — Infrastructure Reliability

Reliability scoped to the infrastructure platform itself: HA, DR, scaling, resilience, and incident
response for platform components and the workloads they provision. See [[sre/readme|SRE]]'s
Reliability Engineering, Incident Management, and Large Scale Architecture Parts, and
[[kubernetes/readme|Kubernetes]]'s Production Architecture Part, for the general reliability depth
this Part applies specifically to the infrastructure-provisioning layer.

- [[infrastructure-platform-engineering/12-infrastructure-reliability/01-high-availability/01-high-availability|1 — High Availability]]
  — _(stub)_
- [[infrastructure-platform-engineering/12-infrastructure-reliability/02-disaster-recovery/02-disaster-recovery|2 — Disaster Recovery]]
  — _(stub)_
- [[03-infrastructure-scaling|3 — Infrastructure Scaling]] — _(stub)_
- [[04-infrastructure-resilience|4 — Infrastructure Resilience]] — _(stub)_
- [[05-infrastructure-incident-response|5 — Infrastructure Incident Response]] — _(stub)_

### 13 — Enterprise Infrastructure Platforms

Running the platform at enterprise scale: multi-account structure, enterprise landing zones, the
platform team's own operating model, and product-management discipline applied to infrastructure.
See [[patterns/15-organizational-patterns/01-team-topologies/01-team-topologies|Team Topologies]]
and [[patterns/15-organizational-patterns/02-conways-law/02-conways-law|Conway's Law]] in the
Patterns book for the organizational theory the operating-model chapter draws on.

- [[01-multi-account-platforms|1 — Multi-Account Platforms]] — _(stub)_
- [[02-enterprise-landing-zones|2 — Enterprise Landing Zones]] — _(stub)_
- [[03-platform-team-operating-model|3 — Platform Team Operating Model]] — _(stub)_
- [[04-infrastructure-product-management|4 — Infrastructure Product Management]] — _(stub)_
- [[05-infrastructure-platform-evolution|5 — Infrastructure Platform Evolution]] — _(stub)_

### 14 — Infrastructure Anti-Patterns

The failure modes of everything covered so far: ClickOps, copy-paste config, module sprawl, drift,
shared accounts, poor IAM, and manual provisioning. See
[[platform-engineering-fundamentals/readme|Platform Engineering Fundamentals]]'s Platform
Anti-Patterns Part for the general platform-engineering failure modes this Part specializes to
infrastructure specifically.

- [[01-clickops|1 — ClickOps]] — _(stub)_
- [[02-copy-paste-infrastructure|2 — Copy-Paste Infrastructure]] — _(stub)_
- [[03-module-sprawl|3 — Module Sprawl]] — _(stub)_
- [[04-infrastructure-drift|4 — Infrastructure Drift]] — _(stub)_
- [[05-shared-cloud-accounts|5 — Shared Cloud Accounts]] — _(stub)_
- [[06-poor-iam-design|6 — Poor IAM Design]] — _(stub)_
- [[07-manual-environment-provisioning|7 — Manual Environment Provisioning]] — _(stub)_

### 15 — MAANG Interview Preparation

System design and case-study practice at the Staff/Principal bar, applied specifically to
infrastructure platforms — control plane design, self-service infrastructure, Terraform/OpenTofu
architecture discussions, landing zone exercises, and governance case studies.

- [[01-infrastructure-platform-system-design|1 — Infrastructure Platform System Design]] — _(stub)_
- [[02-designing-self-service-infrastructure|2 — Designing Self-Service Infrastructure]] — _(stub)_
- [[03-terraform-opentofu-architecture-discussions|3 — Terraform/OpenTofu Architecture Discussions]]
  — _(stub)_
- [[04-landing-zone-design-exercises|4 — Landing Zone Design Exercises]] — _(stub)_
- [[05-infrastructure-governance-case-studies|5 — Infrastructure Governance Case Studies]] —
  _(stub)_
- [[06-staff-principal-infrastructure-scenarios|6 — Staff/Principal Infrastructure Scenarios]] —
  _(stub)_

### 16 — Appendices

Reference architecture, project structures, landing zone models, module best practices, a maturity
self-assessment, ADR templates, and a consolidated pattern/checklist reference.

- [[01-infrastructure-platform-reference-architecture|1 — Infrastructure Platform Reference Architecture]]
  — _(stub)_
- [[02-terraform-opentofu-project-structures|2 — Terraform/OpenTofu Project Structures]] — _(stub)_
- [[03-enterprise-landing-zone-reference-models|3 — Enterprise Landing Zone Reference Models]] —
  _(stub)_
- [[04-module-design-best-practices|4 — Module Design Best Practices]] — _(stub)_
- [[05-infrastructure-maturity-assessment|5 — Infrastructure Maturity Assessment]] — _(stub)_
- [[06-cloud-architecture-decision-records-adrs|6 — Cloud Architecture Decision Records (ADRs)]] —
  _(stub)_
- [[07-infrastructure-platform-patterns-and-checklists|7 — Infrastructure Platform Patterns & Checklists]]
  — _(stub)_

## Learning Outcomes

After completing this book, you will be able to:

- Design an **Infrastructure Platform** that provides secure, standardized, and self-service cloud
  capabilities.
- Build reusable infrastructure products using **Infrastructure as Code**, with
  **Terraform/OpenTofu** as primary implementation examples.
- Create enterprise-scale **landing zones**, networking, IAM, compute, storage, and environment
  provisioning architectures.
- Develop reusable infrastructure modules, automated pipelines, and policy-driven governance.
- Implement immutable infrastructure, image pipelines, and lifecycle management for consistent
  deployments.
- Operate infrastructure platforms with integrated observability, reliability engineering,
  compliance automation, and cost governance.
- Evaluate architectural trade-offs and discuss infrastructure platform designs expected in **MAANG
  Staff/Principal (L6/L7)** platform engineering and system design interviews.

## Metadata

|        |                                     |
| ------ | ----------------------------------- |
| Author | Amit Singh                          |
| Scope  | infrastructure-platform-engineering |
