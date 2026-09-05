---
title: "What is FluxCD"
description: "CNCF-graduated GitOps toolkit for Kubernetes, built as a set of composable controllers (source, kustomize, helm, notification, image-automation) rather than one monolithic app — Flagger is its progressive-delivery counterpart to Argo Rollouts."
tags: ["tech", "gitops", "kubernetes", "fluxcd", "cncf"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-16"
relations:
  - slug: ci-cd/reference/gitops
    kind: depends_on
  - slug: ci-cd/reference/argocd
    kind: compared_to
  - slug: networks/reference/envoy
    kind: related
---

FluxCD is the other CNCF-graduated implementation of the [[gitops]] model. Where [[argocd]] ships as
one application with a built-in UI, Flux ships as the **GitOps Toolkit** — a set of small,
composable controllers that each own one concern, with no built-in UI of its own (Weave GitOps is a
separate, optional UI layer on top).

---

## The GitOps Toolkit controllers

| Controller                      | Owns                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| **source-controller**           | Pulls from Git/Helm repos/S3 buckets/OCI registries, exposes them as artifacts       |
| **kustomize-controller**        | Applies Kustomize overlays from a source, reconciles the result into the cluster     |
| **helm-controller**             | Reconciles `HelmRelease` resources — install/upgrade/rollback of Helm charts         |
| **notification-controller**     | Fans out reconciliation events to Slack/Teams/webhooks                               |
| **image-reflector-controller**  | Scans container registries for new tags                                              |
| **image-automation-controller** | Auto-commits new image tags back into Git — the auto-update half of image automation |

```
Git repo / Helm repo / OCI registry
              │
              ▼
      source-controller  ──▶  produces a versioned Artifact
              │
   ┌──────────┴───────────┐
   ▼                      ▼
kustomize-controller   helm-controller
   │                      │
   ▼                      ▼
        Kubernetes API (reconciled)
              │
              ▼
     notification-controller ──▶ Slack/Teams
```

## The core CRDs

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: platform-repo
spec:
  url: https://github.com/org/repo.git
  ref:
    branch: main
  interval: 1m
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: signal-forge
spec:
  sourceRef:
    kind: GitRepository
    name: platform-repo
  path: d-apps/11-signal-forge/k8s
  prune: true
  interval: 5m
  dependsOn:
    - name: cert-manager   # explicit ordering between Kustomizations
```

Fleet/dependency ordering in Flux is expressed as a **dependency graph** between `Kustomization`
resources (`dependsOn`) rather than a nested tree of Applications — same underlying need as
[[argocd]]'s App-of-Apps, different shape: a DAG instead of a parent-child tree.

## Flagger: Flux's progressive delivery layer

Flagger is to Flux what Argo Rollouts is to ArgoCD — automates canary/blue-green/A-B rollouts driven
by live metrics:

```
Canary CRD (wraps a Deployment)
        │
        ▼
Flagger controller
   ├── shift traffic in steps (via a mesh/ingress — Istio, Linkerd, Envoy, Gateway API, or Contour)
   ├── query a metrics provider (Prometheus/Mimir) after each step
   ├── promote on success
   └── auto-rollback on threshold breach
```

Flagger leans more explicitly on a **service mesh or ingress controller** for the actual traffic
split — the same [[envoy]] data-plane mechanics ("retries, circuit breaking, mTLS" described there)
are frequently what's doing the traffic shifting underneath Flagger's canary steps, whereas Argo
Rollouts can drive traffic splits via a mesh too but also supports simpler ReplicaSet-weighting for
meshless setups.

## FluxCD vs. ArgoCD — picking one

| Axis                 | FluxCD                                                                | [[argocd]]                                                 |
| -------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Operating model      | Composable controllers, each single-purpose                           | One application, multiple internal components              |
| UI                   | None built-in (Weave GitOps is separate/optional)                     | Built-in web UI + CLI, widely used for visibility          |
| Fleet structure      | Dependency graph (`Kustomization.dependsOn`)                          | App-of-Apps tree                                           |
| Progressive delivery | Flagger                                                               | Argo Rollouts                                              |
| Multi-tenancy fit    | Tends to map cleanly onto Kubernetes RBAC per-namespace               | Projects abstraction on top of Applications                |
| Best fit             | Teams that want minimal surface area and tight Kubernetes-native RBAC | Teams that want a UI-first operational view out of the box |

Both are CNCF graduated, both satisfy the same four [[gitops]] principles — the choice is mostly
about operating model preference and how much value the built-in UI provides for the team actually
running it.

**Why it matters here:** FluxCD isn't what's deployed in this repo's `e-gitops/` pillar today — see
[[argocd]] for the tool actually in use — but it's the comparison point worth knowing if the
UI-first ArgoCD tradeoff is ever revisited, particularly given Flux's tighter fit with Kubernetes-
native RBAC for multi-tenant clusters.
