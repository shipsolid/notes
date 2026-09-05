---
title: "What is ArgoCD"
description: "CNCF-graduated declarative GitOps continuous delivery tool for Kubernetes — pull-based reconciliation from Git via an Application CRD, the App-of-Apps pattern for fleet management, and Argo Rollouts for canary/blue-green progressive delivery."
tags: ["tech", "gitops", "kubernetes", "argocd", "cncf"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-15"
relations:
  - slug: ci-cd/reference/gitops
    kind: depends_on
  - slug: ci-cd/reference/fluxcd
    kind: compared_to
  - slug: observability/reference/cardinality
    kind: related
  - slug: observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets
    kind: related
---

ArgoCD is a CNCF-graduated GitOps continuous delivery tool for Kubernetes. It's the concrete
implementation of the [[gitops]] model that's actually in use in this repo's `e-gitops/` pillar,
paired with Argo Rollouts for canary rollouts.

---

## Core components

| Component                  | Job                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **API server**             | gRPC/REST + web UI + CLI entry point; auth and RBAC live here                            |
| **Repository server**      | Clones Git repos, renders manifests (raw YAML, Helm, Kustomize, Jsonnet)                 |
| **Application controller** | The reconciliation loop — diffs live cluster state vs. rendered manifests, triggers sync |
| **Redis**                  | Caches rendered manifests and cluster state to keep the controller loop fast             |

```
Git repo (manifests/Helm/Kustomize)
        │
        ▼
  Repository server  ──▶  renders manifests
        │
        ▼
Application controller  ──▶  diffs against live cluster state
        │
        ▼
   Kubernetes API  ──▶  applies drift correction
```

## The Application CRD

Everything ArgoCD manages is expressed as an `Application` custom resource — this is the unit of
sync, health, and RBAC:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: signal-forge
spec:
  source:
    repoURL: https://github.com/org/repo.git
    path: d-apps/11-signal-forge/k8s
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: signal-forge
  syncPolicy:
    automated:
      prune: true      # delete resources removed from Git
      selfHeal: true    # revert manual cluster drift
```

## App-of-Apps: managing a fleet declaratively

Rather than hand-creating N `Application` resources, one root `Application` points at a directory of
other `Application` manifests — the fleet itself becomes GitOps-managed:

```
Root Application
      │
      ├── Application: signal-forge (dev)
      ├── Application: signal-forge (qa)
      ├── Application: runway-backstage
      └── Application: runway-argocd (bootstrapping itself)
```

This is the pattern for onboarding a new service or a new environment without touching the ArgoCD
install itself — add a manifest to the app-of-apps directory in Git, and the root Application picks
it up on the next sync.

## Sync policy: manual vs. automated

| Mode             | Behavior                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| **Manual**       | Drift is detected and shown (`OutOfSync`), but a human clicks/`argocd app sync`   |
| **Automated**    | Drift auto-corrects on the next reconciliation loop, no human step                |
| `prune: true`    | Resources removed from Git get deleted from the cluster, not just left orphaned   |
| `selfHeal: true` | Manual `kubectl edit` drift gets reverted automatically — the full GitOps promise |

Automated + prune + selfHeal together is "true" GitOps; leaving any of them off is a deliberate
looser mode, usually chosen early in adopting ArgoCD before trusting the automation on prod.

## Argo Rollouts: progressive delivery

The companion project that turns a plain sync into a controlled rollout — this is the piece this
repo's `e-gitops/` pillar uses canary deployments through:

```
Rollout CRD (replaces Deployment)
        │
        ▼
  Canary steps: 20% traffic ──▶ pause ──▶ analysis ──▶ 50% ──▶ analysis ──▶ 100%
                                              │
                                              ▼
                                   AnalysisRun queries a metrics
                                   provider (Prometheus/Mimir) —
                                   auto-promote or auto-rollback
                                   based on error rate / latency
```

Automated analysis is what makes this more than a slow manual rollout — Argo Rollouts queries
Mimir/Prometheus directly and can abort a canary before it reaches full traffic, tying deployment
safety directly to the same series that back
[[observability/13-reliability-and-sre-integration/02-slos/02-slos-and-error-budgets|SLO burn-rate alerting]]
— see [[cardinality]] for why those series need to stay bounded in the first place.

## ArgoCD vs. FluxCD, at a glance

| Axis                 | ArgoCD                                       | [[fluxcd]]                                                |
| -------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Shape                | One application with a built-in UI           | A toolkit of composable controllers, no built-in UI       |
| Fleet management     | App-of-Apps pattern                          | Kustomization dependency graph (`dependsOn`)              |
| Progressive delivery | Argo Rollouts (canary/blue-green + analysis) | Flagger (same categories, different CRDs)                 |
| Multi-tenancy model  | Projects + RBAC on Applications              | Namespace-scoped controllers, tighter Kubernetes RBAC fit |

**Why it's in use here:** this is the GitOps engine for the `e-gitops/` pillar — reusable GitHub
Actions push manifest/tag changes to Git, ArgoCD's Application controller reconciles them into the
k3d/AKS clusters, and Argo Rollouts governs the canary step for anything with an SLO to protect.
