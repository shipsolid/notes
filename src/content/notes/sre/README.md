---
title: "Site Reliability Engineering: From Foundations to Internet-Scale Systems"
description: "The complete 184-chapter, 15-part Site Reliability Engineering curriculum — from Linux internals and distributed-systems theory through reliability engineering, observability, incident response, platform engineering, and Staff/Principal-level MAANG interview preparation, ordered the way SRE expertise actually develops rather than as a topic index."
tags: ["sre", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607141855-25"
noteType: moc
---

## SRE

> If this were a book, this page is the table of contents. This isn't a copy of Google's _Site
> Reliability Engineering_ book — it teaches SRE in the order real expertise actually develops: from
> operating a single service to running thousands of services globally. Unwritten chapters are
> listed as **stub** rows, not empty files.
>
> The sequence also mirrors how MAANG SRE interview loops actually progress: infrastructure
> fundamentals (Linux, networking, distributed systems) → cloud-native platforms (Kubernetes, IaC,
> GitOps) → reliability engineering (SLIs, SLOs, error budgets, resiliency) → observability
> (OpenTelemetry, Prometheus, Grafana, logs, tracing) → operations (incident response, on-call,
> postmortems) → performance and scalability → platform engineering and large-scale architecture →
> leadership and interview preparation. For Staff/Principal-level prep, this builds technical depth
> first, then expands into organizational design and architectural judgment — the areas L6/L7 loops
> actually evaluate.

## Parts

### 00 — Foundations of Site Reliability Engineering

What SRE actually is, how it diverged from DevOps and Platform Engineering, and the ownership and
lifecycle mechanics — production readiness, shared ownership, cost/reliability/velocity trade-offs —
that everything later in this book assumes.

- [[01-what-is-site-reliability-engineering|1 — What is Site Reliability Engineering?]] — _(stub)_
- [[02-history-of-sre-google-and-beyond|2 — History of SRE (Google and Beyond)]] — _(stub)_
- [[03-devops-vs-sre-vs-platform-engineering|3 — DevOps vs SRE vs Platform Engineering]] — _(stub)_
- [[04-reliability-as-an-engineering-discipline|4 — Reliability as an Engineering Discipline]] —
  _(stub)_
- [[05-service-lifecycle|5 — Service Lifecycle]] — _(stub)_
- [[06-production-readiness-reviews|6 — Production Readiness Reviews]] — _(stub)_
- [[07-reliability-engineering-mindset|7 — Reliability Engineering Mindset]] — _(stub)_
- [[08-shared-ownership-model|8 — Shared Ownership Model]] — _(stub)_
- [[09-cost-reliability-and-velocity-trade-offs|9 — Cost, Reliability and Velocity Trade-offs]] —
  _(stub)_

### 01 — Linux, Networking and Operating Systems

The operating-system and network-stack fundamentals underneath every production incident — Linux
internals, TCP/IP, DNS, HTTP, TLS, and the edge layer (load balancers, proxies, CDNs) a service
actually runs on.

- [[01-linux-internals-every-sre-must-know|1 — Linux Internals Every SRE Must Know]] — _(stub)_
- [[02-processes-threads-and-scheduling|2 — Processes, Threads and Scheduling]] — _(stub)_
- [[03-memory-management|3 — Memory Management]] — _(stub)_
- [[04-filesystems-and-storage|4 — Filesystems and Storage]] — _(stub)_
- [[05-tcp-ip-deep-dive|5 — TCP/IP Deep Dive]] — _(stub)_
- [[06-dns|6 — DNS]] — _(stub)_
- [[07-http-1-1|7 — HTTP/1.1]] — _(stub)_
- [[08-http-2|8 — HTTP/2]] — _(stub)_
- [[09-http-3|9 — HTTP/3]] — _(stub)_
- [[sre/01-linux-networking-and-operating-systems/10-grpc/10-grpc|10 — gRPC]] — _(stub)_
- [[11-tls-and-certificates|11 — TLS and Certificates]] — _(stub)_
- [[12-load-balancers|12 — Load Balancers]] — _(stub)_
- [[13-reverse-proxies|13 — Reverse Proxies]] — _(stub)_
- [[14-cdns|14 — CDNs]] — _(stub)_
- [[15-linux-troubleshooting|15 — Linux Troubleshooting]] — _(stub)_

### 02 — Distributed Systems for SRE

The theory an SRE must apply, not design, under incident pressure — CAP, consensus, distributed
transactions, and the coordination primitives (locks, leader election, service discovery) that fail
in specific, learnable ways.

- [[sre/02-distributed-systems-for-sre/01-cap-theorem/01-cap-theorem|1 — CAP Theorem]] — _(stub)_
- [[sre/02-distributed-systems-for-sre/02-consensus-algorithms/02-consensus-algorithms|2 — Consensus Algorithms]]
  — _(stub)_
- [[03-raft|3 — Raft]] — _(stub)_
- [[04-paxos|4 — Paxos]] — _(stub)_
- [[sre/02-distributed-systems-for-sre/05-distributed-transactions/05-distributed-transactions|5 — Distributed Transactions]]
  — _(stub)_
- [[06-eventual-consistency|6 — Eventual Consistency]] — _(stub)_
- [[07-leader-election|7 — Leader Election]] — _(stub)_
- [[08-distributed-locks|8 — Distributed Locks]] — _(stub)_
- [[09-time-synchronization|9 — Time Synchronization]] — _(stub)_
- [[10-distributed-caching|10 — Distributed Caching]] — _(stub)_
- [[sre/02-distributed-systems-for-sre/11-service-discovery/11-service-discovery|11 — Service Discovery]]
  — _(stub)_
- [[12-api-gateways|12 — API Gateways]] — _(stub)_
- [[sre/02-distributed-systems-for-sre/13-message-brokers/13-message-brokers|13 — Message Brokers]]
  — _(stub)_
- [[14-event-driven-architectures|14 — Event-Driven Architectures]] — _(stub)_

### 03 — Cloud and Infrastructure

The cloud-native infrastructure layer — VMs, containers, Kubernetes, multi-region topology, and the
IaC/GitOps discipline that keeps that infrastructure reproducible instead of hand-tuned.

- [[sre/03-cloud-and-infrastructure/01-virtual-machines/01-virtual-machines|1 — Virtual Machines]] —
  _(stub)_
- [[sre/03-cloud-and-infrastructure/02-containers/02-containers|2 — Containers]] — _(stub)_
- [[03-kubernetes-fundamentals|3 — Kubernetes Fundamentals]] — _(stub)_
- [[04-kubernetes-scheduling|4 — Kubernetes Scheduling]] — _(stub)_
- [[05-networking-in-kubernetes|5 — Networking in Kubernetes]] — _(stub)_
- [[06-storage-in-kubernetes|6 — Storage in Kubernetes]] — _(stub)_
- [[07-high-availability-clusters|7 — High Availability Clusters]] — _(stub)_
- [[sre/03-cloud-and-infrastructure/08-autoscaling/08-autoscaling|8 — Autoscaling]] — _(stub)_
- [[09-multi-cluster-architectures|9 — Multi-Cluster Architectures]] — _(stub)_
- [[sre/03-cloud-and-infrastructure/10-multi-region-deployments/10-multi-region-deployments|10 — Multi-Region Deployments]]
  — _(stub)_
- [[11-infrastructure-as-code|11 — Infrastructure as Code]] — _(stub)_
- [[sre/03-cloud-and-infrastructure/12-immutable-infrastructure/12-immutable-infrastructure|12 — Immutable Infrastructure]]
  — _(stub)_
- [[13-gitops-in-sre|13 — GitOps]] — _(stub)_
- [[14-configuration-management|14 — Configuration Management]] — _(stub)_

### 04 — Reliability Engineering

The reliability-target mechanics — SLIs, SLOs, error budgets — and the resiliency patterns (circuit
breakers, backpressure, bulkheads, idempotency) that make a system actually hit those targets under
real failure.

- [[01-reliability-principles|1 — Reliability Principles]] — _(stub)_
- [[02-service-level-indicators-slis|2 — Service Level Indicators (SLIs)]] — _(stub)_
- [[03-service-level-objectives-slos|3 — Service Level Objectives (SLOs)]] — _(stub)_
- [[04-error-budgets|4 — Error Budgets]] — _(stub)_
- [[05-availability-engineering|5 — Availability Engineering]] — _(stub)_
- [[06-latency-engineering|6 — Latency Engineering]] — _(stub)_
- [[sre/04-reliability-engineering/07-capacity-planning/07-capacity-planning|7 — Capacity Planning]]
  — _(stub)_
- [[08-scalability-engineering|8 — Scalability Engineering]] — _(stub)_
- [[09-reliability-modeling|9 — Reliability Modeling]] — _(stub)_
- [[10-failure-domains|10 — Failure Domains]] — _(stub)_
- [[11-redundancy-patterns|11 — Redundancy Patterns]] — _(stub)_
- [[12-graceful-degradation|12 — Graceful Degradation]] — _(stub)_
- [[13-backpressure-in-sre|13 — Backpressure]] — _(stub)_
- [[14-queue-management|14 — Queue Management]] — _(stub)_
- [[15-load-shedding|15 — Load Shedding]] — _(stub)_
- [[16-circuit-breakers|16 — Circuit Breakers]] — _(stub)_
- [[17-retry-strategies|17 — Retry Strategies]] — _(stub)_
- [[18-timeouts|18 — Timeouts]] — _(stub)_
- [[19-bulkheads|19 — Bulkheads]] — _(stub)_
- [[20-idempotency|20 — Idempotency]] — _(stub)_

### 05 — Observability Engineering

Metrics, logs, and traces as the three signals that turn 'is this healthy' from a guess into an
answerable question, and the Prometheus/Grafana/Loki/Tempo stack most teams answer it with.

- [[01-observability-foundations|1 — Observability Foundations]] — _(stub)_
- [[02-telemetry-signals|2 — Telemetry Signals]] — _(stub)_
- [[sre/05-observability-engineering/03-metrics/03-metrics|3 — Metrics]] — _(stub)_
- [[04-logs|4 — Logs]] — _(stub)_
- [[05-distributed-tracing|5 — Distributed Tracing]] — _(stub)_
- [[06-opentelemetry|6 — OpenTelemetry]] — _(stub)_
- [[sre/05-observability-engineering/07-context-propagation/07-context-propagation|7 — Context Propagation]]
  — _(stub)_
- [[08-instrumentation-strategies|8 — Instrumentation Strategies]] — _(stub)_
- [[09-prometheus-in-sre|9 — Prometheus]] — _(stub)_
- [[10-grafana|10 — Grafana]] — _(stub)_
- [[11-loki-in-sre|11 — Loki]] — _(stub)_
- [[12-tempo-in-sre|12 — Tempo]] — _(stub)_
- [[13-alerting-philosophy|13 — Alerting Philosophy]] — _(stub)_
- [[sre/05-observability-engineering/14-alert-fatigue/14-alert-fatigue|14 — Alert Fatigue]] —
  _(stub)_
- [[15-dashboard-design-in-sre|15 — Dashboard Design]] — _(stub)_
- [[16-high-cardinality-metrics|16 — High-Cardinality Metrics]] — _(stub)_
- [[17-sampling-strategies|17 — Sampling Strategies]] — _(stub)_
- [[sre/05-observability-engineering/18-cost-optimization/18-cost-optimization|18 — Cost Optimization]]
  — _(stub)_

### 06 — Incident Management

The response structure — command system, on-call design, escalation — and the review discipline —
RCA, Five Whys, blameless postmortems — that turns an incident into a system that fails the same way
at most once.

- [[01-incident-response-lifecycle|1 — Incident Response Lifecycle]] — _(stub)_
- [[02-severity-classification|2 — Severity Classification]] — _(stub)_
- [[03-incident-command-system|3 — Incident Command System]] — _(stub)_
- [[04-on-call-engineering|4 — On-call Engineering]] — _(stub)_
- [[05-escalation-policies|5 — Escalation Policies]] — _(stub)_
- [[sre/06-incident-management/06-runbooks/06-runbooks|6 — Runbooks]] — _(stub)_
- [[07-playbooks|7 — Playbooks]] — _(stub)_
- [[sre/06-incident-management/08-root-cause-analysis/08-root-cause-analysis|8 — Root Cause Analysis]]
  — _(stub)_
- [[09-five-whys|9 — Five Whys]] — _(stub)_
- [[10-blameless-postmortems|10 — Blameless Postmortems]] — _(stub)_
- [[11-communication-during-incidents|11 — Communication During Incidents]] — _(stub)_
- [[sre/06-incident-management/12-chaos-engineering/12-chaos-engineering|12 — Chaos Engineering]] —
  _(stub)_
- [[13-game-days|13 — Game Days]] — _(stub)_

### 07 — Performance Engineering

Profiling, load/stress/soak testing, and the systematic method for finding and removing a system's
actual bottleneck instead of the one that's easiest to see.

- [[sre/07-performance-engineering/01-performance-fundamentals/01-performance-fundamentals|1 — Performance Fundamentals]]
  — _(stub)_
- [[sre/07-performance-engineering/02-cpu-profiling/02-cpu-profiling|2 — CPU Profiling]] — _(stub)_
- [[sre/07-performance-engineering/03-memory-profiling/03-memory-profiling|3 — Memory Profiling]] —
  _(stub)_
- [[04-disk-performance|4 — Disk Performance]] — _(stub)_
- [[sre/07-performance-engineering/05-network-performance/05-network-performance|5 — Network Performance]]
  — _(stub)_
- [[06-benchmarking|6 — Benchmarking]] — _(stub)_
- [[07-load-testing|7 — Load Testing]] — _(stub)_
- [[08-stress-testing|8 — Stress Testing]] — _(stub)_
- [[09-spike-testing|9 — Spike Testing]] — _(stub)_
- [[10-soak-testing|10 — Soak Testing]] — _(stub)_
- [[11-capacity-testing|11 — Capacity Testing]] — _(stub)_
- [[12-performance-bottlenecks|12 — Performance Bottlenecks]] — _(stub)_
- [[sre/07-performance-engineering/13-performance-optimization/13-performance-optimization|13 — Performance Optimization]]
  — _(stub)_

### 08 — CI/CD and Release Engineering

Shipping changes safely at speed — progressive delivery, canaries, feature flags, and the rollback
discipline that makes 'ship fast' and 'stay reliable' the same goal instead of a trade-off.

- [[01-continuous-integration|1 — Continuous Integration]] — _(stub)_
- [[02-continuous-delivery|2 — Continuous Delivery]] — _(stub)_
- [[sre/08-cicd-and-release-engineering/03-deployment-strategies/03-deployment-strategies|3 — Deployment Strategies]]
  — _(stub)_
- [[04-blue-green-deployments|4 — Blue-Green Deployments]] — _(stub)_
- [[05-canary-releases|5 — Canary Releases]] — _(stub)_
- [[06-feature-flags|6 — Feature Flags]] — _(stub)_
- [[sre/08-cicd-and-release-engineering/07-progressive-delivery/07-progressive-delivery|7 — Progressive Delivery]]
  — _(stub)_
- [[08-rollbacks|8 — Rollbacks]] — _(stub)_
- [[sre/08-cicd-and-release-engineering/09-release-automation/09-release-automation|9 — Release Automation]]
  — _(stub)_
- [[sre/08-cicd-and-release-engineering/10-supply-chain-security/10-supply-chain-security|10 — Supply Chain Security]]
  — _(stub)_

### 09 — Security for SRE

Where security and reliability overlap for an SRE — identity, secrets, zero trust, and the
incident-response and DR practices that both disciplines depend on.

- [[sre/09-security-for-sre/01-identity-and-access-management/01-identity-and-access-management|1 — Identity and Access Management]]
  — _(stub)_
- [[sre/09-security-for-sre/02-secrets-management/02-secrets-management|2 — Secrets Management]] —
  _(stub)_
- [[03-zero-trust|3 — Zero Trust]] — _(stub)_
- [[sre/09-security-for-sre/04-network-security/04-network-security|4 — Network Security]] —
  _(stub)_
- [[05-kubernetes-security|5 — Kubernetes Security]] — _(stub)_
- [[sre/09-security-for-sre/06-runtime-security/06-runtime-security|6 — Runtime Security]] —
  _(stub)_
- [[07-incident-response-for-security|7 — Incident Response for Security]] — _(stub)_
- [[08-compliance|8 — Compliance]] — _(stub)_
- [[sre/09-security-for-sre/09-disaster-recovery/09-disaster-recovery|9 — Disaster Recovery]] —
  _(stub)_
- [[10-business-continuity|10 — Business Continuity]] — _(stub)_

### 10 — Data Systems

The reliability characteristics of the data layer specifically — replication, sharding, backup and
recovery — as a discipline distinct from, but foundational to, service-level SLOs.

- [[01-relational-databases|1 — Relational Databases]] — _(stub)_
- [[02-nosql-systems|2 — NoSQL Systems]] — _(stub)_
- [[sre/10-data-systems/03-distributed-databases/03-distributed-databases|3 — Distributed Databases]]
  — _(stub)_
- [[sre/10-data-systems/04-replication/04-replication|4 — Replication]] — _(stub)_
- [[05-sharding|5 — Sharding]] — _(stub)_
- [[06-backup-strategies|6 — Backup Strategies]] — _(stub)_
- [[07-recovery-strategies|7 — Recovery Strategies]] — _(stub)_
- [[sre/10-data-systems/08-data-reliability/08-data-reliability|8 — Data Reliability]] — _(stub)_

### 11 — Platform Engineering

Reliability economics once you're not running one service but the platform every other team's
services run on — self-service, golden paths, multi-tenancy, and platform-level SLOs.

- [[01-platform-engineering-fundamentals|1 — Platform Engineering Fundamentals]] — _(stub)_
- [[02-internal-developer-platforms|2 — Internal Developer Platforms]] — _(stub)_
- [[sre/11-platform-engineering/03-self-service-infrastructure/03-self-service-infrastructure|3 — Self-Service Infrastructure]]
  — _(stub)_
- [[sre/11-platform-engineering/04-golden-paths/04-golden-paths|4 — Golden Paths]] — _(stub)_
- [[05-kubernetes-platforms|5 — Kubernetes Platforms]] — _(stub)_
- [[sre/11-platform-engineering/06-developer-experience/06-developer-experience|6 — Developer Experience]]
  — _(stub)_
- [[07-multi-tenant-platforms|7 — Multi-Tenant Platforms]] — _(stub)_
- [[sre/11-platform-engineering/08-platform-reliability/08-platform-reliability|8 — Platform Reliability]]
  — _(stub)_

### 12 — Large Scale Architecture

What changes architecturally at planet scale — global traffic management, multi-region and
multi-cloud topology, and the cost-vs-reliability math that gets harder, not easier, at that scale.

- [[01-designing-planet-scale-systems|1 — Designing Planet-Scale Systems]] — _(stub)_
- [[02-global-traffic-management|2 — Global Traffic Management]] — _(stub)_
- [[03-edge-computing|3 — Edge Computing]] — _(stub)_
- [[04-multi-cloud-reliability|4 — Multi-Cloud Reliability]] — _(stub)_
- [[05-active-active-systems|5 — Active-Active Systems]] — _(stub)_
- [[06-active-passive-systems|6 — Active-Passive Systems]] — _(stub)_
- [[07-disaster-recovery-patterns|7 — Disaster Recovery Patterns]] — _(stub)_
- [[08-cost-vs-reliability|8 — Cost vs Reliability]] — _(stub)_
- [[09-sustainability-engineering|9 — Sustainability Engineering]] — _(stub)_

### 13 — Leadership and Organizational SRE

Structuring an SRE practice, earning its adoption beyond the team that started it, and the
influence-without-authority skills that define the Staff/Principal level of the role.

- [[01-building-an-sre-organization|1 — Building an SRE Organization]] — _(stub)_
- [[02-defining-reliability-strategy|2 — Defining Reliability Strategy]] — _(stub)_
- [[03-reliability-reviews|3 — Reliability Reviews]] — _(stub)_
- [[04-executive-reliability-metrics|4 — Executive Reliability Metrics]] — _(stub)_
- [[05-engineering-culture|5 — Engineering Culture]] — _(stub)_
- [[06-hiring-sres|6 — Hiring SREs]] — _(stub)_
- [[07-mentoring-engineers|7 — Mentoring Engineers]] — _(stub)_
- [[08-technical-leadership|8 — Technical Leadership]] — _(stub)_
- [[09-organizational-scaling|9 — Organizational Scaling]] — _(stub)_

### 14 — MAANG SRE Interview Preparation

Loop-by-loop preparation for the SRE interview formats at Google, Meta, Amazon, Microsoft, Apple,
and Netflix — Linux/networking/Kubernetes depth, live troubleshooting, reliability system design,
and the Staff/Principal bar specifically.

- [[sre/14-maang-sre-interview-preparation/01-linux-interview-questions/01-linux-interview-questions|1 — Linux Interview Questions]]
  — _(stub)_
- [[02-networking-interview-questions|2 — Networking Interview Questions]] — _(stub)_
- [[03-kubernetes-interview-questions|3 — Kubernetes Interview Questions]] — _(stub)_
- [[04-cloud-architecture-interview-questions|4 — Cloud Architecture Interview Questions]] —
  _(stub)_
- [[05-distributed-systems-interview-questions|5 — Distributed Systems Interview Questions]] —
  _(stub)_
- [[06-observability-interview-questions|6 — Observability Interview Questions]] — _(stub)_
- [[07-incident-response-scenarios|7 — Incident Response Scenarios]] — _(stub)_
- [[08-performance-debugging-interviews|8 — Performance Debugging Interviews]] — _(stub)_
- [[09-reliability-design-interviews|9 — Reliability Design Interviews]] — _(stub)_
- [[10-system-design-for-sre|10 — System Design for SRE]] — _(stub)_
- [[11-troubleshooting-interviews|11 — Troubleshooting Interviews]] — _(stub)_
- [[12-behavioral-interviews-for-sre|12 — Behavioral Interviews for SRE]] — _(stub)_
- [[13-staff-principal-sre-interviews|13 — Staff/Principal SRE Interviews]] — _(stub)_
- [[14-end-to-end-production-case-studies|14 — End-to-End Production Case Studies]] — _(stub)_

## Appendices

- Appendix A — Linux Command Cheat Sheet
- Appendix B — Networking Cheat Sheet
- Appendix C — Kubernetes Cheat Sheet
- Appendix D — PromQL Cheat Sheet
- Appendix E — OpenTelemetry Cheat Sheet
- Appendix F — Incident Response Templates
- Appendix G — Postmortem Templates
- Appendix H — Capacity Planning Worksheets
- Appendix I — SRE Design Patterns
- Appendix J — Reliability Anti-Patterns

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | sre        |
