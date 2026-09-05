---
title: "Managing, Monitoring, and Securing Azure AI Services"
description: "Operational reference for running Azure AI Services in production — activity logs vs. diagnostic logs vs. metrics, cost model and budgets, key rotation and Key Vault, Entra ID auth, network isolation (service vs. private endpoints), Responsible AI principles, CI/CD and IaC for AI resources, and container deployment."
tags: ["tech", "azure", "observability", "finops", "security"]
updated: 2026-08-09
hidden: false
zettelId: "202608091200-3"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/azure-ai-services
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/azure-sre-agent
    kind: related
---

Every Azure AI Services resource is, operationally, just an Azure resource — it gets the same
monitoring, cost-management, identity, and network-isolation controls as any other PaaS service,
plus a handful of AI-specific wrinkles (token-based metrics, Azure OpenAI's separate quota model, an
Azure-only pricing exception for AI Search). This note covers that operational surface: what's on by
default, what has to be turned on, and the security model layered on top.

---

## Monitoring: three signal types

| Signal              | Scope                                                                                      | Default    | Retention                     |
| ------------------- | ------------------------------------------------------------------------------------------ | ---------- | ----------------------------- |
| **Activity logs**   | Control plane (create/update/delete, key regeneration, config changes, role assignment)    | Enabled    | 90 days                       |
| **Metrics**         | Platform time-series (request count, latency, errors, token usage, feature-specific usage) | Enabled    | 93 days, free                 |
| **Diagnostic logs** | Resource-level runtime detail (audit / request-response / trace)                           | **Opt-in** | Until routed to a destination |

Activity logs answer "who changed what configuration, when" — not runtime usage. Metrics support
dimension-based splitting (API name, feature, region, model deployment, operation type), which for
Azure OpenAI means slicing request volume by deployment name, model version, and
prompt-vs-completion token type — the basis for both performance triage and cost attribution.
Metrics are also queryable outside the portal via the Azure Monitor Metrics Data Plane API (up to 50
resources per call, same subscription and region).

**Alerting** (Azure Monitor Alerts) fires on a metric threshold, an activity-log event, or a Log
Analytics query — static or ML-based dynamic thresholds. Alerts notify; **Action Groups** attached
to an alert define what happens next (email/SMS/voice, or an automated Function/Logic
App/webhook/ITSM ticket).

## Diagnostic logging

Diagnostic logs are the one signal that isn't on by default — they require a **diagnostic setting**
per resource (multiple settings can coexist, each routing a different log category to a different
destination). Categories are typically audit / request-response / trace, roughly mapping to
security-and-access, API payload metadata, and deep operational detail respectively.

| Destination             | Cost                            | Best for                                                 |
| ----------------------- | ------------------------------- | -------------------------------------------------------- |
| Storage Account         | Lowest                          | Cheap long-term archival, limited querying               |
| Event Hub               | Moderate                        | Streaming ingestion, SIEM integration                    |
| Log Analytics Workspace | Highest (ingestion + retention) | KQL querying, correlation, alerting, long-term analytics |

A common split: audit logs → Event Hub (security tooling), everything → Log Analytics (analysis),
metrics → Storage (cheap archive). Activity logs can also be exported at the subscription level to
the same three destinations.

## Cost management

Most Azure AI services are **usage-based** (per API call / transaction / token); **Azure AI Search
is the exception** — provisioned, billed by SKU and scale unit per hour regardless of query volume.

Azure OpenAI cost is driven by prompt and completion tokens, priced separately, varying by model
(GPT-4 vs. an embedding model). Practical cost-control surface:

- **Cost Analysis** — subscription/resource-group/resource-level spend trends, with **Smart Views**
  breaking Azure OpenAI cost down by prompt tokens, completion tokens, and embedding usage per
  model.
- **Budgets** — actual or forecasted spend thresholds, scoped to subscription/resource
  group/resource type, notifying via email or Action Groups. Budgets alert; they don't cap spend.
- **Azure OpenAI quotas** — model-specific usage caps per deployment, the actual hard limit;
  increases go through an Azure Support ticket.
- **Azure Policy** — a preventive control (restrict which SKUs/services can be created) versus
  Budgets' detective one.

## Authentication & secrets

Every Azure AI resource exposes **two account keys**, specifically to enable zero-downtime rotation:
switch traffic to Key 2, regenerate Key 1, optionally switch back, repeat. Hardcoded keys in source
or config carry the usual risks (repo leaks, debug-output disclosure) plus one AI-specific one — the
key grants full, ungated access to the resource.

**Azure Key Vault** is the standard mitigation: store the AI service key as a Key Vault **Secret**
(retrievable value) — not a Key Vault **Key** (non-exportable, cryptographic-operations-only). The
integration pattern: app authenticates via Managed Identity/Service Principal → RBAC-granted
`Key Vault Secrets User` → retrieves the secret at runtime → key rotation just updates the secret
version, no app redeploy. `DefaultAzureCredential` chains Managed Identity, Azure CLI, and
environment-based credentials so the same code authenticates the same way locally and in Azure with
zero embedded secrets.

| Method                   | Model                        | Notes                                                               |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------- |
| Account keys             | Full access, simple          | No fine-grained permissions; the thing Key Vault protects           |
| Service-specific tokens  | Derived from the account key | Limited to a few services (Translator, Speech); not Entra ID tokens |
| **Entra ID (preferred)** | RBAC + short-lived JWT       | Managed identity support, least-privilege, no stored secrets        |

Entra ID flow: identity authenticates → requests a token for the Cognitive Services audience →
receives a JWT → sent as `Authorization: Bearer <token>` → service validates token + permissions.

Access itself is via **REST** (language-agnostic, HTTP verbs, `Ocp-Apim-Subscription-Key` header for
key auth) or an **SDK** (C#/Python/JS/Java — abstracts REST, still uses it underneath).

## Network isolation

Resources are publicly reachable by default. Three escalating controls:

| Model                            | Mechanism                                                                                             | Reach                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Public IP firewall rules         | Allow-list specific IPv4/CIDR ranges                                                                  | Brittle at scale; fine for known external integrations                                              |
| Service endpoints                | VNet subnet gets recognized identity against the public endpoint                                      | Subnet-scoped only — not automatic across peered VNets                                              |
| Private endpoints (Private Link) | Private IP from a VNet subnet, mapped to the specific instance, bypasses the public endpoint entirely | Same VNet, peered VNets, on-prem via VPN/ExpressRoute; needs a Private Link DNS zone for resolution |

Full defense-in-depth combines Entra ID auth + managed identity + private endpoints + diagnostic
logging + budgets/alerts — identity and network controls are complementary, not substitutes for each
other.

## Responsible AI principles

Microsoft's six-principle framework, condensed to what carries operational weight:

| Principle                | What it demands                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fairness & Inclusiveness | No disadvantage by protected attribute; bias traced back to training data, not just model output                                                                          |
| Reliability & Safety     | Predictable behavior under normal _and_ adversarial/edge-case input — non-negotiable in safety-critical use                                                               |
| Privacy & Security       | No PII in training data, encryption in transit/at rest, RBAC (AI must not bypass existing access control), full audit trail                                               |
| Transparency             | Explainability at both the global (model behavior) and local (single prediction) level — Azure ML's Responsible AI Dashboard covers feature importance and bias detection |
| Accountability           | Spans engineers through executives — ongoing monitoring, governance review, clear ownership of outcomes                                                                   |

These aren't abstract — they show up as concrete constraints (RBAC design, PII handling, audit
logging, explainability tooling) in the monitoring/security surface above.

## CI/CD and Infrastructure as Code

Azure AI resources get the same DevOps treatment as any other Azure resource — no exemption for
being "AI." Deployed as `Microsoft.CognitiveServices/accounts`, defined in code rather than
provisioned through the portal:

| Option                     | Fit                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **Bicep**                  | Azure-only, declarative, human-readable, transpiles to ARM JSON — the default choice |
| ARM JSON                   | Native but verbose; largely superseded by Bicep for hand-authoring                   |
| Terraform / Ansible / Chef | Multi-cloud, hybrid (cloud + on-prem), or Kubernetes/VMware-integrated scenarios     |

Pipeline shape: deploy infrastructure (AI resources, networking, Key Vault) → package/store the
application artifact → deploy it → automated testing (functional, load, chaos) → approval gate →
promote → continuous monitoring. AI-specific additions can include automated model
training/inference testing, drift detection, and benchmark validation — the pipeline can run any
CLI/SDK/PowerShell step.

## Container deployment

Most non-OpenAI Azure AI services can run in containers, for latency, data-sovereignty, or
privacy-isolation reasons distance-to-region can't solve. **Azure OpenAI and Azure AI Search
cannot** — both need infrastructure (GPU scale, deep cloud integration) too heavy to containerize.

Even fully on-prem, the Azure resource still has to exist in the cloud for
billing/licensing/metering — offline mode needs special approval and a commitment tier. Deployment
flow: create the cloud resource → get endpoint + key → pull the image from `mcr.microsoft.com` → run
it, accepting the EULA and passing the billing endpoint/key/port → secure secrets via env vars or a
vault → consume via the container's local endpoint.

**Containers ship with no built-in authentication** — treat that as the default state, not an edge
case, and put an API gateway, load balancer, or firewall in front before anything touches it.

## Where it fits

Operational counterpart to [[azure-ai-services|Azure AI Services]] (the service catalog) and
[[azure-ai-content-safety|Azure AI Content Safety]] (the moderation layer this monitoring/security
surface wraps). [[azure-sre-agent|Azure SRE Agent]] is the Azure-native option for acting on the
alerts this monitoring setup produces.
