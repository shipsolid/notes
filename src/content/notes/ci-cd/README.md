---
title: "CI/CD Platform Engineering"
description: "A book-shaped table of contents for CI/CD platform engineering: pipeline foundations, build/artifact/delivery platforms, GitHub Actions end to end (workflow mechanics through enterprise governance), Argo Workflows, Tekton, Jenkins, release engineering, platform security, observability, reliability, enterprise governance, and MAANG interview preparation — cross-linking existing tech/kubernetes/platform-engineering-fundamentals/system-design notes instead of duplicating them."
tags: ["ci-cd", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607241426-79"
noteType: moc
---

# CI/CD Platform Engineering

## _Designing and Operating Enterprise Build, Release, and Deployment Platforms_

> **Goal:** Learn how to build a **CI/CD Platform** that enables engineering teams through
> standardized, secure, scalable, and self-service software delivery. This book focuses on
> **platform architecture**, **release engineering**, **pipeline governance**, **progressive
> delivery**, and **developer experience**, rather than a single CI/CD product. GitHub Actions, Argo
> Workflows, Tekton, Jenkins, and other tools are presented as implementations of common platform
> patterns.

If this were a book, this page is the table of contents. Each Part below is a chapter; each chapter
links out to the concepts, designs, and platform notes that already exist elsewhere in this wiki
instead of duplicating them. Unwritten chapters are listed with a `— _(stub)_` marker, not empty
files.

## Parts

### 00 — Introduction to CI/CD Platform Engineering

Frames CI/CD as a platform product rather than a pipeline tool, lays out the seven-layer reference
architecture used throughout the book, and introduces the five-stage delivery maturity model.

- [[01-the-evolution-of-software-delivery|1 — The Evolution of Software Delivery]] — _(stub)_
- [[02-what-is-a-cicd-platform|2 — What Is a CI/CD Platform?]] — _(stub)_
- [[03-cicd-platform-architecture|3 — CI/CD Platform Architecture]] — _(stub)_
- [[04-platform-maturity-model|4 — Platform Maturity Model]] — _(stub)_

### 01 — Source Control & Pipeline Foundations

Covers Git as the platform backbone and the architectural and design principles pipelines are built
on before any specific tool enters the picture. See [[gitops|What is GitOps]] for the pattern
underlying build-once-deploy-many referenced from the GitHub Actions design-patterns chapter below.

- [[01-git-as-the-platform-backbone|1 — Git as the Platform Backbone]] — _(stub)_
- [[02-pipeline-architecture|2 — Pipeline Architecture]] — _(stub)_
- [[03-pipeline-design-principles|3 — Pipeline Design Principles]] — _(stub)_
- [[04-pipeline-lifecycle|4 — Pipeline Lifecycle]] — _(stub)_
- [[05-github-actions-design-patterns|5 — GitHub Actions: CI/CD Design Patterns]] — _(stub)_

### 02 — Build Platform

Covers the architecture, optimization, standardization, and reliability of the build layer — where
source becomes a testable, deployable unit.

- [[01-build-platform-architecture|1 — Build Platform Architecture]] — _(stub)_
- [[02-build-optimization|2 — Build Optimization]] — _(stub)_
- [[03-build-standardization|3 — Build Standardization]] — _(stub)_
- [[04-build-reliability|4 — Build Reliability]] — _(stub)_
- [[05-github-actions-cache-optimization|5 — GitHub Actions: Cache Optimization]] — _(stub)_
- [[06-github-actions-pipeline-performance|6 — GitHub Actions: Pipeline Performance]] — _(stub)_

### 03 — Continuous Integration Platform

Covers CI orchestration patterns, the automated testing platform, code quality gates, and security
scanning built into the CI stage. Grounded partly in this repo's own
[[code-standards|Code Standards]].

- [[01-ci-architecture|1 — CI Architecture]] — _(stub)_
- [[02-automated-testing-platform|2 — Automated Testing Platform]] — _(stub)_
- [[03-code-quality-platform|3 — Code Quality Platform]] — _(stub)_
- [[04-security-in-ci|4 — Security in CI]] — _(stub)_
- [[05-github-actions-performance-engineering|5 — GitHub Actions: Performance Engineering]] —
  _(stub)_

### 04 — Artifact Platform

Covers artifact management, lifecycle, and dependency governance. See
[[kubernetes/08-supply-chain-security/08-software-supply-chain-security/08-software-supply-chain-security|Software Supply Chain Security]]
for the Sigstore/cosign/SLSA implementation detail behind the Software Supply Chain chapter below.

- [[01-artifact-management|1 — Artifact Management]] — _(stub)_
- [[02-artifact-lifecycle|2 — Artifact Lifecycle]] — _(stub)_
- [[03-software-supply-chain|3 — Software Supply Chain]] — _(stub)_
- [[ci-cd/04-artifact-platform/04-dependency-management/04-dependency-management|4 — Dependency Management]]
  — _(stub)_
- [[05-github-actions-artifacts|5 — GitHub Actions: Artifacts]] — _(stub)_

### 05 — Continuous Delivery Platform

Covers deployment architecture, environment management, and deployment/progressive-delivery
strategies. See [[gitops|GitOps]], [[argocd|ArgoCD]], and [[fluxcd|FluxCD]] for GitOps tool
mechanics referenced from the Deployment Architecture chapter below.

- [[01-deployment-architecture|1 — Deployment Architecture]] — _(stub)_
- [[02-environment-management|2 — Environment Management]] — _(stub)_
- [[ci-cd/05-continuous-delivery-platform/03-deployment-strategies/03-deployment-strategies|3 — Deployment Strategies]]
  — _(stub)_
- [[ci-cd/05-continuous-delivery-platform/04-progressive-delivery/04-progressive-delivery|4 — Progressive Delivery]]
  — _(stub)_

### 06 — GitHub Actions Platform

The deepest Part in this book — GitHub Actions examined end to end as one concrete implementation of
the platform patterns from Parts 00–05: workflow syntax and execution model, building and composing
pipelines, reusable automation, self-hosted runner infrastructure, monorepo/enterprise- scale
automation, and integration with each major cloud. This repo's own
`.github/workflows/reusable-docker.yml`, `reusable-dotnet.yml`, `reusable-python.yml`, and
`reusable-terraform.yml` are working `workflow_call` examples behind the Reusable Workflows /
Composite Actions / Workflow Templates chapters; `deploy-with-gates.yml` and
`services-from-metadata.yml` / `services-integration-from-metadata.yml` ground the Monorepo
Pipelines and Large-Scale Repository Automation chapters. See [[01-aks|AKS]] for the runner-hosting
fleet architecture behind the Runners chapters, and [[01-aks|AKS]], [[02-eks|EKS]], [[03-gke|GKE]],
[[kubernetes/12-platform-engineering/01-helm/01-helm|Helm]],
[[kubernetes/12-platform-engineering/02-kustomize/02-kustomize|Kustomize]], [[03-argo-cd|Argo CD]],
and [[04-flux|Flux]] for the deploy-target tradeoffs behind the Cloud Integrations chapters.
GitHub-Actions-specific authentication, secrets, and secure-pipeline mechanics live in Part 09
rather than being duplicated here; GH-200 certification prep and quick-reference material live in
Part 15.

- [[01-why-github-actions|1 — Why GitHub Actions]] — _(stub)_
- [[02-github-actions-architecture|2 — GitHub Actions Architecture]] — _(stub)_
- [[03-yaml-essentials|3 — YAML Essentials]] — _(stub)_
- [[04-workflow-syntax|4 — Workflow Syntax]] — _(stub)_
- [[05-events-and-triggers|5 — Events & Triggers]] — _(stub)_
- [[06-expressions-and-contexts|6 — Expressions & Contexts]] — _(stub)_
- [[07-running-jobs|7 — Running Jobs]] — _(stub)_
- [[08-matrix-builds|8 — Matrix Builds]] — _(stub)_
- [[09-workflow-outputs|9 — Workflow Outputs]] — _(stub)_
- [[10-reusable-workflows|10 — Reusable Workflows]] — _(stub)_
- [[11-composite-actions|11 — Composite Actions]] — _(stub)_
- [[12-workflow-templates|12 — Workflow Templates]] — _(stub)_
- [[13-github-hosted-runners|13 — GitHub-Hosted Runners]] — _(stub)_
- [[14-self-hosted-runners|14 — Self-Hosted Runners]] — _(stub)_
- [[15-actions-runner-controller|15 — Actions Runner Controller (ARC)]] — _(stub)_
- [[16-monorepo-pipelines|16 — Monorepo Pipelines]] — _(stub)_
- [[17-large-scale-repository-automation|17 — Large-Scale Repository Automation]] — _(stub)_
- [[ci-cd/06-github-actions-platform/18-azure/18-azure|18 — Azure]] — _(stub)_
- [[ci-cd/06-github-actions-platform/19-aws/19-aws|19 — AWS]] — _(stub)_
- [[ci-cd/06-github-actions-platform/20-google-cloud/20-google-cloud|20 — Google Cloud]] — _(stub)_
- [[ci-cd/06-github-actions-platform/21-containers/21-containers|21 — Containers]] — _(stub)_
- [[22-kubernetes-deployments|22 — Kubernetes]] — _(stub)_

### 07 — Workflow Orchestration Platforms

Covers Argo Workflows, Tekton, and Jenkins as Kubernetes-native and classic orchestration engines,
and how to choose among them. (Argo Workflows here is examined as CI/CD build orchestration — see
`data-engineering/06-workflow-orchestration` for orchestrators used in data-pipeline contexts.)

- [[01-argo-workflows|1 — Argo Workflows]] — _(stub)_
- [[02-tekton|2 — Tekton]] — _(stub)_
- [[03-jenkins-platform|3 — Jenkins Platform]] — _(stub)_
- [[04-choosing-the-right-platform|4 — Choosing the Right Platform]] — _(stub)_

### 08 — Release Engineering

Covers release lifecycle, automation, governance, and observability. See
[[02-dora-metrics|platform-engineering-fundamentals' DORA metrics chapter]] for the KPI definitions
behind the Release Observability chapter below.

- [[01-release-engineering-fundamentals|1 — Release Engineering Fundamentals]] — _(stub)_
- [[ci-cd/08-release-engineering/02-release-automation/02-release-automation|2 — Release Automation]]
  — _(stub)_
- [[03-deployment-governance|3 — Deployment Governance]] — _(stub)_
- [[04-release-observability|4 — Release Observability]] — _(stub)_

### 09 — Platform Security

Covers identity, secrets, policy-as-code, secure pipeline design, supply chain security, and
compliance automation as the security layer spanning every earlier Part. GitHub-Actions-specific
authentication (OIDC to cloud), secrets management, and secure-pipeline mechanics (chapters 7–9)
implement these generic controls concretely — see
[[01-identity-oauth-oidc-jwt-mtls|Identity: OAuth, OIDC, JWT, SPIFFE, mTLS]],
[[01-authentication-patterns|Authentication Patterns]],
[[03-secure-communication-patterns|Secure Communication Patterns]], and
[[kubernetes/08-supply-chain-security/08-software-supply-chain-security/08-software-supply-chain-security|Software Supply Chain Security]]
for the underlying identity/pattern/supply-chain foundations these three chapters build on rather
than re-derive.

- [[ci-cd/09-platform-security/01-identity-and-access-management/01-identity-and-access-management|1 — Identity & Access Management]]
  — _(stub)_
- [[ci-cd/09-platform-security/02-secret-management/02-secret-management|2 — Secret Management]] —
  _(stub)_
- [[ci-cd/09-platform-security/03-policy-as-code/03-policy-as-code|3 — Policy as Code]] — _(stub)_
- [[04-secure-pipeline-design|4 — Secure Pipeline Design]] — _(stub)_
- [[ci-cd/09-platform-security/05-software-supply-chain-security/05-software-supply-chain-security|5 — Software Supply Chain Security]]
  — _(stub)_
- [[ci-cd/09-platform-security/06-compliance-automation/06-compliance-automation|6 — Compliance Automation]]
  — _(stub)_
- [[07-github-actions-authentication|7 — GitHub Actions: Authentication]] — _(stub)_
- [[08-github-actions-secrets-management|8 — GitHub Actions: Secrets Management]] — _(stub)_
- [[09-github-actions-secure-pipelines|9 — GitHub Actions: Secure Pipelines]] — _(stub)_

### 10 — Platform Observability

Covers pipeline metrics, logging, tracing, dashboards, and delivery SLOs — treating the CI/CD
platform itself as a system worth observing. GitHub-Actions-specific notification routing and
failure analysis (chapters 6–7) apply the general alert-routing model in
[[01-alerting-and-routing|Alerting & Routing]] to workflow run events specifically.

- [[01-pipeline-metrics|1 — Pipeline Metrics]] — _(stub)_
- [[02-cicd-logging|2 — CI/CD Logging]] — _(stub)_
- [[03-pipeline-tracing|3 — Pipeline Tracing]] — _(stub)_
- [[04-cicd-dashboards|4 — CI/CD Dashboards]] — _(stub)_
- [[05-delivery-slos|5 — Delivery SLOs]] — _(stub)_
- [[06-github-actions-notifications|6 — GitHub Actions: Notifications]] — _(stub)_
- [[07-github-actions-failure-analysis|7 — GitHub Actions: Failure Analysis]] — _(stub)_

### 11 — Reliability Engineering for CI/CD

Covers high availability, scaling, disaster recovery, capacity planning, and incident response for
the CI/CD control plane itself.

- [[ci-cd/11-reliability-engineering-for-cicd/01-high-availability/01-high-availability|1 — High Availability]]
  — _(stub)_
- [[02-scaling-pipeline-platforms|2 — Scaling Pipeline Platforms]] — _(stub)_
- [[ci-cd/11-reliability-engineering-for-cicd/03-disaster-recovery/03-disaster-recovery|3 — Disaster Recovery]]
  — _(stub)_
- [[04-platform-capacity-planning|4 — Platform Capacity Planning]] — _(stub)_
- [[ci-cd/11-reliability-engineering-for-cicd/05-incident-response/05-incident-response|5 — Incident Response]]
  — _(stub)_

### 12 — Enterprise CI/CD Platforms

Covers multi-cloud, multi-region, and multi-tenant delivery, plus the governance, cost, and
developer-experience concerns that show up only at enterprise scale. GitHub-Actions-specific cost
optimization (chapter 7) is the tool-level counterpart to the Platform Cost Engineering chapter
above.

- [[01-multi-cloud-delivery|1 — Multi-Cloud Delivery]] — _(stub)_
- [[ci-cd/12-enterprise-cicd-platforms/02-multi-region-deployments/02-multi-region-deployments|2 — Multi-Region Deployments]]
  — _(stub)_
- [[03-multi-tenant-pipeline-platforms|3 — Multi-Tenant Pipeline Platforms]] — _(stub)_
- [[ci-cd/12-enterprise-cicd-platforms/04-platform-governance/04-platform-governance|4 — Platform Governance]]
  — _(stub)_
- [[05-platform-cost-engineering|5 — Platform Cost Engineering]] — _(stub)_
- [[ci-cd/12-enterprise-cicd-platforms/06-developer-experience/06-developer-experience|6 — Developer Experience]]
  — _(stub)_
- [[07-github-actions-cost-optimization|7 — GitHub Actions: Cost Optimization]] — _(stub)_

### 13 — CI/CD Platform Anti-Patterns

Catalogs the failure modes a platform team runs into repeatedly — sprawl, copy-paste pipelines,
manual releases, shared credentials, unbounded pipeline growth, missing standards, and missing
observability.

- [[01-pipeline-sprawl|1 — Pipeline Sprawl]] — _(stub)_
- [[02-copy-paste-pipelines|2 — Copy-Paste Pipelines]] — _(stub)_
- [[03-manual-releases|3 — Manual Releases]] — _(stub)_
- [[04-shared-credentials|4 — Shared Credentials]] — _(stub)_
- [[05-long-running-pipelines|5 — Long-Running Pipelines]] — _(stub)_
- [[06-lack-of-standardization|6 — Lack of Standardization]] — _(stub)_
- [[07-ignoring-pipeline-observability|7 — Ignoring Pipeline Observability]] — _(stub)_

### 14 — MAANG Interview Preparation

Applies the whole book to Staff/Principal (L6/L7) platform engineering interviews — including
GitHub-Actions-specific interview questions and enterprise scenarios (chapters 4, 7–8). See
[[08-ci-cd-platform|system-design's CI/CD platform case study]] referenced from the first chapter
below, plus [[03-secrets-manager|Secrets Manager]] and
[[system-design/16-principal-engineer-topics/03-build-vs-buy/03-build-vs-buy|Build vs. Buy]] for the
case studies the GitHub Actions interview chapters frame follow-ups around.

- [[01-cicd-platform-system-design|1 — CI/CD Platform System Design]] — _(stub)_
- [[02-designing-enterprise-build-platforms|2 — Designing Enterprise Build Platforms]] — _(stub)_
- [[03-progressive-delivery-design|3 — Progressive Delivery Design]] — _(stub)_
- [[04-github-actions-interview-questions|4 — GitHub Actions Interview Questions]] — _(stub)_
- [[05-release-engineering-case-studies|5 — Release Engineering Case Studies]] — _(stub)_
- [[ci-cd/14-maang-interview-preparation/06-staff-principal-platform-engineering-scenarios/06-staff-principal-platform-engineering-scenarios|6 — Staff/Principal Platform Engineering Scenarios]]
  — _(stub)_
- [[07-github-actions-enterprise-scenarios|7 — GitHub Actions: Enterprise Scenarios]] — _(stub)_
- [[08-github-actions-case-studies|8 — GitHub Actions: Case Studies]] — _(stub)_

### 15 — Appendices

Quick-reference material — reference architecture, tool comparison matrices, decision matrices, a
supply-chain security checklist, DORA metrics, the maturity model recap, and a full set of
GitHub-Actions-specific references and certification-prep material (chapters 8–19) — for lookup
after working through the chapters above.

- [[01-cicd-platform-reference-architecture|1 — CI/CD Platform Reference Architecture]] — _(stub)_
- [[02-github-actions-migration-guide|2 — GitHub Actions: Migration Guide]] — _(stub)_
- [[03-argo-workflows-and-tekton-comparison-matrix|3 — Argo Workflows & Tekton Comparison Matrix]] —
  _(stub)_
- [[04-progressive-delivery-decision-matrix|4 — Progressive Delivery Decision Matrix]] — _(stub)_
- [[05-software-supply-chain-security-checklist|5 — Software Supply Chain Security Checklist (SLSA, SBOM, Sigstore)]]
  — _(stub)_
- [[06-dora-metrics-and-delivery-kpis|6 — DORA Metrics & Delivery KPIs]] — _(stub)_
- [[07-cicd-platform-maturity-model|7 — CI/CD Platform Maturity Model]] — _(stub)_
- [[08-gh-200-exam-objectives|8 — GH-200 Exam Objectives]] — _(stub)_
- [[09-github-actions-hands-on-labs|9 — GitHub Actions: Hands-on Labs]] — _(stub)_
- [[10-gh-200-practice-exams|10 — GH-200 Practice Exams]] — _(stub)_
- [[11-github-actions-troubleshooting-playbook|11 — GitHub Actions: Troubleshooting Playbook]] —
  _(stub)_
- [[12-github-actions-yaml-reference|12 — GitHub Actions: YAML Reference]] — _(stub)_
- [[13-github-actions-expression-cheat-sheet|13 — GitHub Actions Expression Cheat Sheet]] — _(stub)_
- [[14-github-actions-context-reference|14 — GitHub Actions: Context Reference]] — _(stub)_
- [[15-marketplace-best-practices|15 — Marketplace Best Practices]] — _(stub)_
- [[16-github-cli-reference|16 — GitHub CLI (gh) Reference]] — _(stub)_
- [[17-github-actions-common-error-messages|17 — GitHub Actions: Common Error Messages]] — _(stub)_
- [[18-gh-200-exam-checklist|18 — GH-200 Exam Checklist]] — _(stub)_
- [[19-github-actions-maang-interview-checklist|19 — GitHub Actions: MAANG Interview Checklist]] —
  _(stub)_

## Learning Outcomes

After completing this book, you will be able to:

- Design a **CI/CD Platform** that supports self-service software delivery at enterprise scale.
- Build standardized **Pipeline-as-Code** frameworks with reusable templates, workflow libraries,
  and governance controls.
- Architect resilient build systems, artifact repositories, deployment pipelines, and progressive
  delivery mechanisms.
- Operate enterprise-grade **GitHub Actions**, **Argo Workflows**, **Tekton**, and **Jenkins**
  platforms, selecting the appropriate tool based on organizational requirements.
- Implement secure software supply chains using **SBOMs**, **artifact signing**, **SLSA**, **OIDC**,
  and policy-driven controls.
- Measure and optimize delivery performance using **DORA metrics**, pipeline observability, release
  engineering metrics, and developer experience indicators.
- Evaluate architectural trade-offs and confidently discuss enterprise CI/CD platform designs in
  **MAANG Staff/Principal (L6/L7)** platform engineering and system design interviews.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | ci-cd      |
