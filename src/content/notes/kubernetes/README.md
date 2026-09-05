---
title: "Kubernetes"
description: "A book-shaped table of contents for Kubernetes: cloud-native foundations, the CKAD/CKA/CKS certification tracks, control-plane internals, platform tooling, multi-cluster architecture, and MAANG-level system design and interview prep — cross-linking the existing Prometheus, Observability, and Platform Engineering chapters instead of duplicating them."
tags: ["kubernetes", "book", "reference", "maang-prep", "ckad", "cka", "cks"]
hidden: false
zettelId: "202607140342"
noteType: moc
---

# Kubernetes

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to the concepts, designs, and platform notes that already exist elsewhere in
> this wiki instead of duplicating them. Unwritten chapters are listed as **stub** entries, not
> empty files.

## Parts

### 00 — Cloud Native Foundations

The container and OCI fundamentals underneath every later Part — why Kubernetes exists as a reaction
to the operational pain of running containers at scale, and the control-plane/API object model
everything else in this book builds on.

- [[01-why-kubernetes-exists|1 — Why Kubernetes Exists]] — _(stub)_
- [[02-linux-fundamentals|2 — Linux Fundamentals]] — _(stub)_
- [[03-containers-and-oci|3 — Containers & OCI]] — _(stub)_
- [[04-kubernetes-architecture|4 — Kubernetes Architecture]] — _(stub)_
- [[05-installing-kubernetes|5 — Installing Kubernetes]] — _(stub)_
- [[06-kubernetes-api-and-object-model|6 — Kubernetes API & Object Model]] — _(stub)_

### 01 — Kubernetes Core Objects

The primitives every workload is built from — Pods up through Deployments, StatefulSets, DaemonSets,
and the namespace/resource boundaries that scope them. See
[[02-kubernetes-patterns|Patterns → Kubernetes Patterns]] for the design patterns layered on top of
these objects rather than re-deriving them here.

- [[01-pods|1 — Pods]] — _(stub)_
- [[02-labels-selectors-and-annotations|2 — Labels, Selectors & Annotations]] — _(stub)_
- [[03-replicasets|3 — ReplicaSets]] — _(stub)_
- [[04-deployments|4 — Deployments]] — _(stub)_
- [[05-statefulsets|5 — StatefulSets]] — _(stub)_
- [[06-daemonsets|6 — DaemonSets]] — _(stub)_
- [[07-jobs-and-cronjobs|7 — Jobs & CronJobs]] — _(stub)_
- [[08-namespaces|8 — Namespaces]] — _(stub)_
- [[09-resource-management-requests-limits-qos|9 — Resource Management (Requests, Limits, QoS)]] —
  _(stub)_

### 02 — Configuration & Application Development (CKAD)

Application-facing configuration and health-signaling — ConfigMaps/Secrets, the Downward API,
probes, and multi-container composition patterns. See [[01-sidecar|Patterns → Sidecar]] for the
sidecar pattern in depth rather than re-deriving it here.

- [[01-configmaps|1 — ConfigMaps]] — _(stub)_
- [[02-secrets|2 — Secrets]] — _(stub)_
- [[03-downward-api|3 — Downward API]] — _(stub)_
- [[04-environment-variables|4 — Environment Variables]] — _(stub)_
- [[05-probes-liveness-readiness-startup|5 — Probes (Liveness, Readiness, Startup)]] — _(stub)_
- [[06-init-containers|6 — Init Containers]] — _(stub)_
- [[07-sidecars|7 — Sidecars]] — _(stub)_
- [[08-multi-container-pods|8 — Multi-Container Pods]] — _(stub)_
- [[09-application-health-patterns|9 — Application Health Patterns]] — _(stub)_
- [[10-resourcequota-and-limitrange|10 — ResourceQuota & LimitRange]] — _(stub)_

### 03 — Scheduling & Cluster Management (CKA)

How the scheduler places Pods and how cluster operators steer that placement — affinity,
taints/tolerations, priority, and the lifecycle operations (maintenance, upgrades) that keep a
cluster healthy.

- [[01-scheduler-internals|1 — Scheduler Internals]] — _(stub)_
- [[02-nodeselector|2 — nodeSelector]] — _(stub)_
- [[03-node-affinity|3 — Node Affinity]] — _(stub)_
- [[04-pod-affinity-and-anti-affinity|4 — Pod Affinity & Anti-Affinity]] — _(stub)_
- [[05-taints-and-tolerations|5 — Taints & Tolerations]] — _(stub)_
- [[06-priority-classes|6 — Priority Classes]] — _(stub)_
- [[07-topology-spread-constraints|7 — Topology Spread Constraints]] — _(stub)_
- [[08-node-maintenance|8 — Node Maintenance]] — _(stub)_
- [[09-cluster-lifecycle|9 — Cluster Lifecycle]] — _(stub)_
- [[10-upgrades-and-version-skew|10 — Upgrades & Version Skew]] — _(stub)_

### 04 — Kubernetes Networking

The network model from CNI up through Services, Ingress, Gateway API, and NetworkPolicy. See
[[system-design/12-architecture-patterns/05-service-mesh/05-service-mesh|System Design → Service Mesh]]
for the general mesh pattern; this Part's Service Mesh chapter covers running one operationally
inside a cluster instead of re-deriving the pattern.

- [[01-kubernetes-networking-model|1 — Kubernetes Networking Model]] — _(stub)_
- [[02-cni-architecture|2 — CNI Architecture]] — _(stub)_
- [[03-services|3 — Services]] — _(stub)_
- [[04-kube-proxy|4 — kube-proxy]] — _(stub)_
- [[05-coredns|5 — CoreDNS]] — _(stub)_
- [[06-ingress|6 — Ingress]] — _(stub)_
- [[kubernetes/04-kubernetes-networking/07-gateway-api/07-gateway-api|7 — Gateway API]] — _(stub)_
- [[08-network-policies|8 — Network Policies]] — _(stub)_
- [[09-service-mesh-overview|9 — Service Mesh Overview]] — _(stub)_

### 05 — Storage

Persistent storage — Volumes, PVs/PVCs, StorageClasses, and the CSI driver model that backs stateful
workloads.

- [[01-volumes|1 — Volumes]] — _(stub)_
- [[02-persistent-volumes|2 — Persistent Volumes]] — _(stub)_
- [[03-persistent-volume-claims|3 — Persistent Volume Claims]] — _(stub)_
- [[04-storage-classes|4 — Storage Classes]] — _(stub)_
- [[05-csi-drivers|5 — CSI Drivers]] — _(stub)_
- [[06-stateful-storage-design|6 — Stateful Storage Design]] — _(stub)_

### 06 — Authentication & Authorization (CKA + CKS)

Who can talk to the API server and what they're allowed to do — authentication, RBAC, service
accounts, and admission control as the first security boundary.

- [[kubernetes/06-authentication-and-authorization/01-authentication/01-authentication|1 — Authentication]]
  — _(stub)_
- [[02-authorization|2 — Authorization]] — _(stub)_
- [[kubernetes/06-authentication-and-authorization/03-rbac/03-rbac|3 — RBAC]] — _(stub)_
- [[04-service-accounts|4 — Service Accounts]] — _(stub)_
- [[05-kubeconfig|5 — kubeconfig]] — _(stub)_
- [[kubernetes/06-authentication-and-authorization/06-admission-controllers/06-admission-controllers|6 — Admission Controllers]]
  — _(stub)_
- [[07-api-server-security|7 — API Server Security]] — _(stub)_
- [[08-secret-encryption|8 — Secret Encryption]] — _(stub)_

### 07 — Kubernetes Security (CKS Core)

Node- and pod-level isolation mechanisms — Pod Security Standards, security contexts,
seccomp/AppArmor/SELinux, Linux capabilities, and sandboxed runtimes (gVisor, Kata) for stronger
tenant isolation.

- [[01-pod-security-standards|1 — Pod Security Standards]] — _(stub)_
- [[02-security-contexts|2 — Security Contexts]] — _(stub)_
- [[03-seccomp|3 — Seccomp]] — _(stub)_
- [[04-apparmor|4 — AppArmor]] — _(stub)_
- [[05-selinux|5 — SELinux]] — _(stub)_
- [[06-capabilities|6 — Capabilities]] — _(stub)_
- [[07-linux-kernel-isolation|7 — Linux Kernel Isolation]] — _(stub)_
- [[08-runtimeclass|8 — RuntimeClass]] — _(stub)_
- [[09-sandboxed-containers-gvisor-kata|9 — Sandboxed Containers (gVisor, Kata)]] — _(stub)_
- [[10-protecting-the-control-plane|10 — Protecting the Control Plane]] — _(stub)_

### 08 — Supply Chain Security (CKS)

Everything upstream of runtime — image provenance, signing (Sigstore/Cosign), SBOM and vulnerability
scanning, and policy enforcement at admission time.

- [[01-image-security|1 — Image Security]] — _(stub)_
- [[02-image-signing|2 — Image Signing]] — _(stub)_
- [[03-sigstore-and-cosign|3 — Sigstore & Cosign]] — _(stub)_
- [[04-sbom|4 — SBOM]] — _(stub)_
- [[05-vulnerability-scanning|5 — Vulnerability Scanning]] — _(stub)_
- [[06-trusted-registries|6 — Trusted Registries]] — _(stub)_
- [[07-policy-enforcement-opa-gatekeeper-kyverno|7 — Policy Enforcement (OPA Gatekeeper, Kyverno)]]
  — _(stub)_
- [[kubernetes/08-supply-chain-security/08-software-supply-chain-security/08-software-supply-chain-security|8 — Software Supply Chain Security]]
  — _(stub)_
- [[09-slsa-framework|9 — SLSA Framework]] — _(stub)_

### 09 — Runtime Security (CKS)

Detecting and responding to compromise after a workload is already running — Falco/eBPF-based
detection, audit logging, and the incident-response/forensics workflow specific to a Kubernetes
cluster.

- [[01-falco|1 — Falco]] — _(stub)_
- [[02-ebpf-security|2 — eBPF Security]] — _(stub)_
- [[03-runtime-threat-detection|3 — Runtime Threat Detection]] — _(stub)_
- [[04-audit-logs|4 — Audit Logs]] — _(stub)_
- [[kubernetes/09-runtime-security/05-incident-response/05-incident-response|5 — Incident Response]]
  — _(stub)_
- [[06-forensics|6 — Forensics]] — _(stub)_
- [[07-container-escape-techniques|7 — Container Escape Techniques]] — _(stub)_
- [[08-mitigations|8 — Mitigations]] — _(stub)_
- [[09-security-monitoring|9 — Security Monitoring]] — _(stub)_

### 10 — Observability

Kubernetes-native signals — logging, Events, kubectl-based debugging, and production troubleshooting
workflows.

- [[kubernetes/10-observability/01-logging/01-logging|1 — Logging]] — _(stub)_
- [[kubernetes/10-observability/02-metrics/02-metrics|2 — Metrics]] — _(stub)_
- [[prometheus/readme|Prometheus]] — the dedicated Prometheus book (12 Parts) covers the TSDB,
  PromQL, and operating Prometheus at scale; not duplicated here.
- [[01-opentelemetry-sdks-and-semantic-conventions|OpenTelemetry]] — OTel SDKs and semantic
  conventions are covered in depth in the Observability book; this chapter doesn't re-derive them.
- [[kubernetes/10-observability/03-tracing/03-tracing|3 — Tracing]] — _(stub)_
- [[04-events|4 — Events]] — _(stub)_
- [[05-kubectl-debug|5 — kubectl Debug]] — _(stub)_
- [[06-troubleshooting-production-clusters|6 — Troubleshooting Production Clusters]] — _(stub)_

### 11 — Kubernetes Internals (MAANG)

Control-plane mechanics at the depth MAANG L6/L7 interviews probe — scheduler, controller-manager,
kubelet, etcd, and API server internals, plus admission webhooks and aggregated APIs.

- [[01-scheduler-deep-dive|1 — Scheduler Deep Dive]] — _(stub)_
- [[02-controller-manager|2 — Controller Manager]] — _(stub)_
- [[03-kubelet-internals|3 — kubelet Internals]] — _(stub)_
- [[04-etcd-internals|4 — etcd Internals]] — _(stub)_
- [[05-api-server-internals|5 — API Server Internals]] — _(stub)_
- [[06-admission-webhooks|6 — Admission Webhooks]] — _(stub)_
- [[07-aggregated-apis|7 — Aggregated APIs]] — _(stub)_

### 12 — Platform Engineering

Kubernetes-native delivery tooling — Helm, Kustomize, Argo CD, Flux, and building your own operator.

- [[kubernetes/12-platform-engineering/01-helm/01-helm|1 — Helm]] — _(stub)_
- [[kubernetes/12-platform-engineering/02-kustomize/02-kustomize|2 — Kustomize]] — _(stub)_
- [[03-argo-cd|3 — Argo CD]] — _(stub)_
- [[04-flux|4 — Flux]] — _(stub)_
- [[05-operator-framework|5 — Operator Framework]] — _(stub)_

### 13 — Multi-Cluster & Cloud

Running Kubernetes across managed providers and multiple clusters — AKS/EKS/GKE trade-offs, Cluster
API, and multi-region/hybrid topologies.

- [[01-aks|1 — AKS]] — _(stub)_
- [[02-eks|2 — EKS]] — _(stub)_
- [[03-gke|3 — GKE]] — _(stub)_
- [[04-cluster-api|4 — Cluster API]] — _(stub)_
- [[05-federation|5 — Federation]] — _(stub)_
- [[06-multi-cluster-networking|6 — Multi-Cluster Networking]] — _(stub)_
- [[07-multi-region-architecture|7 — Multi-Region Architecture]] — _(stub)_
- [[08-hybrid-kubernetes|8 — Hybrid Kubernetes]] — _(stub)_

### 14 — Performance & Scalability

Scaling a cluster and the workloads on it — HPA/VPA/Cluster Autoscaler/Karpenter, scheduler and
network/storage performance, and design considerations at thousands of nodes.

- [[01-resource-optimization|1 — Resource Optimization]] — _(stub)_
- [[02-scheduler-performance|2 — Scheduler Performance]] — _(stub)_
- [[03-cluster-autoscaler|3 — Cluster Autoscaler]] — _(stub)_
- [[04-karpenter|4 — Karpenter]] — _(stub)_
- [[05-vertical-pod-autoscaler|5 — Vertical Pod Autoscaler]] — _(stub)_
- [[06-horizontal-pod-autoscaler|6 — Horizontal Pod Autoscaler]] — _(stub)_
- [[kubernetes/14-performance-and-scalability/07-network-performance/07-network-performance|7 — Network Performance]]
  — _(stub)_
- [[08-storage-performance|8 — Storage Performance]] — _(stub)_
- [[09-large-cluster-design|9 — Large Cluster Design]] — _(stub)_

### 15 — Production Architecture

Running Kubernetes as durable production infrastructure — HA, DR, backup/restore, multi-tenancy,
cost, and the anti-patterns and failure modes that show up at scale. See
[[07-disaster-recovery-patterns|SRE → Disaster Recovery Patterns]] for the cross-system DR framing
this Part applies to Kubernetes specifically.

- [[kubernetes/15-production-architecture/01-high-availability/01-high-availability|1 — High Availability]]
  — _(stub)_
- [[kubernetes/15-production-architecture/02-disaster-recovery/02-disaster-recovery|2 — Disaster Recovery]]
  — _(stub)_
- [[03-backup-and-restore|3 — Backup & Restore]] — _(stub)_
- [[kubernetes/15-production-architecture/04-multi-tenancy/04-multi-tenancy|4 — Multi-Tenancy]] —
  _(stub)_
- [[kubernetes/15-production-architecture/05-cost-optimization/05-cost-optimization|5 — Cost Optimization]]
  — _(stub)_
- [[kubernetes/15-production-architecture/06-reliability-engineering/06-reliability-engineering|6 — Reliability Engineering]]
  — _(stub)_
- [[07-production-anti-patterns|7 — Production Anti-Patterns]] — _(stub)_
- [[08-kubernetes-failure-modes|8 — Kubernetes Failure Modes]] — _(stub)_
- [[09-real-production-case-studies|9 — Real Production Case Studies]] — _(stub)_

### 16 — MAANG System Design

Kubernetes as a building block in distributed-systems interviews — running it under thousands of
microservices, AI/ML and event-driven platforms, and designing a control plane at scale. See
[[04-kubernetes-control-plane|System Design → Kubernetes Control Plane]] for a full worked case
study rather than re-deriving one here.

- [[01-kubernetes-in-distributed-systems|1 — Kubernetes in Distributed Systems]] — _(stub)_
- [[02-running-thousands-of-microservices|2 — Running Thousands of Microservices]] — _(stub)_
- [[03-event-driven-platforms|3 — Event-Driven Platforms]] — _(stub)_
- [[04-ai-ml-platforms-on-kubernetes|4 — AI/ML Platforms on Kubernetes]] — _(stub)_
- [[05-platform-engineering-at-scale|5 — Platform Engineering at Scale]] — _(stub)_
- [[06-large-scale-observability|6 — Large-Scale Observability]] — _(stub)_
- [[07-designing-control-planes|7 — Designing Control Planes]] — _(stub)_
- [[08-architecture-interview-case-studies|8 — Architecture Interview Case Studies]] — _(stub)_

### 17 — Certification Preparation

Objectives, hands-on labs, and mock-exam tracking for CKAD, CKA, and CKS — the practice layer over
the knowledge chapters above.

- [[01-ckad-objectives|1 — CKAD Objectives]] — _(stub)_
- [[02-ckad-hands-on-labs|2 — CKAD Hands-on Labs]] — _(stub)_
- [[03-ckad-mock-exams|3 — CKAD Mock Exams]] — _(stub)_
- [[04-cka-objectives|4 — CKA Objectives]] — _(stub)_
- [[05-cluster-administration-labs|5 — Cluster Administration Labs]] — _(stub)_
- [[06-cka-mock-exams|6 — CKA Mock Exams]] — _(stub)_
- [[07-cks-objectives|7 — CKS Objectives]] — _(stub)_
- [[08-cks-security-labs|8 — CKS Security Labs]] — _(stub)_
- [[09-runtime-security-labs|9 — Runtime Security Labs]] — _(stub)_
- [[10-incident-response-exercises|10 — Incident Response Exercises]] — _(stub)_
- [[11-cks-mock-exams|11 — CKS Mock Exams]] — _(stub)_

### 18 — Interview Mastery

Turning the book above into interview performance — design and troubleshooting questions, internals
deep-dives, incident walkthroughs, and a final revision pass.

- [[01-kubernetes-design-questions|1 — Kubernetes Design Questions]] — _(stub)_
- [[02-kubernetes-troubleshooting-interviews|2 — Kubernetes Troubleshooting Interviews]] — _(stub)_
- [[03-kubernetes-internals-interviews|3 — Kubernetes Internals Interviews]] — _(stub)_
- [[04-production-incident-walkthroughs|4 — Production Incident Walkthroughs]] — _(stub)_
- [[05-leadership-and-architecture-discussions|5 — Leadership & Architecture Discussions]] —
  _(stub)_
- [[06-common-maang-kubernetes-questions|6 — Common MAANG Kubernetes Questions]] — _(stub)_
- [[kubernetes/18-interview-mastery/07-whiteboard-exercises/07-whiteboard-exercises|7 — Whiteboard Exercises]]
  — _(stub)_
- [[08-final-revision-checklist|8 — Final Revision Checklist]] — _(stub)_

## Coverage Mapping

| Objective       | Parts (this book)           |
| --------------- | --------------------------- |
| **CKAD**        | 00–05, 17 (CKAD section)    |
| **CKA**         | 00–12, 14, 17 (CKA section) |
| **CKS**         | 06–09, 17 (CKS section)     |
| **MAANG L6/L7** | 11–18                       |

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | kubernetes |
