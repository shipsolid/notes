---
title: "What is GitOps"
description: "A declarative delivery model where Git is the single source of truth for desired system state, and an in-cluster controller continuously reconciles live state to match it — the operating model behind ArgoCD and FluxCD."
tags: ["tech", "gitops", "kubernetes", "ci-cd", "cncf"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-14"
relations:
  - slug: ci-cd/reference/argocd
    kind: related
  - slug: ci-cd/reference/fluxcd
    kind: related
---

GitOps is a delivery model, not a tool: desired system state lives declaratively in a Git
repository, and a controller running **inside** the target environment continuously reconciles live
state toward whatever's in Git. The two dominant Kubernetes implementations of this model are
[[argocd]] and [[fluxcd]].

---

## The four principles (OpenGitOps)

The CNCF OpenGitOps working group codifies GitOps as four properties a system must have:

| Principle                   | Meaning                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Declarative**             | The system's desired state is expressed declaratively (YAML manifests, Helm values, Kustomize overlays) — not a sequence of imperative steps |
| **Versioned & immutable**   | Desired state is stored in Git, giving a full history, diff, and rollback path for free                                                      |
| **Pulled automatically**    | Software agents (controllers) **pull** the desired state — nothing outside the cluster pushes into it                                        |
| **Continuously reconciled** | Agents continuously compare live state to desired state and correct drift, not just on deploy                                                |

## Pull vs. push: the actual architectural shift

```
Traditional CD (push)                GitOps (pull)

CI pipeline                          CI pipeline
   │                                    │
   ▼                                    ▼
kubectl apply / helm upgrade         Push new manifest/image tag to Git
   │  (pipeline holds cluster           │
   │   credentials)                     ▼
   ▼                              Controller INSIDE cluster
Cluster                           watches Git, pulls, applies
                                        │
                                        ▼
                                     Cluster
```

The pipeline never touches cluster credentials in the pull model — it only ever writes to Git. The
in-cluster controller holds the only credentials that can mutate the cluster, and it's the same
controller doing the pulling and the reconciling.

## Why continuous reconciliation matters more than the initial deploy

A one-time `kubectl apply` gets you to desired state once. A GitOps controller keeps checking:

```
Every reconciliation interval (e.g. every 1-3 min):
  live state == desired state (Git)?
       │                    │
      YES                   NO
       │                    │
   no-op                 auto-heal:
                          revert the drift
                          (someone ran a manual
                           kubectl edit — it gets
                           reverted automatically)
```

This closes the classic "someone hotfixed prod by hand and nobody knows" failure mode — any manual
change to a GitOps-managed resource gets reconciled away on the next loop, which is a feature, not a
bug, as long as the actual fix also lands in Git.

## Where it sits relative to CI

| Stage                          | Owns                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------- |
| CI (GitHub Actions, etc.)      | Build, test, produce an artifact/image, bump the manifest/tag in Git         |
| GitOps controller (in-cluster) | Everything after the Git commit — diff, sync, health check, drift correction |

This split is why GitOps pairs naturally with progressive delivery (canary, blue-green): the
controller is already the thing watching cluster health, so it's a small step from "apply the whole
change" to "apply a slice, watch metrics, promote or roll back" — see [[argocd]]'s Argo Rollouts and
[[fluxcd]]'s Flagger integration.

**Why it matters here:** this is the operating model behind the `e-gitops/` pillar (ArgoCD + Argo
Rollouts canary deployments) — see [[argocd]] for the concrete implementation in use, and [[fluxcd]]
for the comparison point if that choice is ever revisited.
