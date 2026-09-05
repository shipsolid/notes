---
title: "What is Azure AI Services"
description: "Microsoft's Azure AI service catalog — account models (single- vs multi-service), Azure OpenAI's deployment-based access pattern, Azure AI Search as the RAG grounding layer, and the single-service capability catalog (Vision, Language, Speech, Document Intelligence)."
tags: ["tech", "azure", "ai-agents", "mlops"]
updated: 2026-08-09
hidden: false
zettelId: "202608091200-1"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/vertex-ai
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/azure-ai-content-safety
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/azure-ai-service-management
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/azure-sre-agent
    kind: related
---

Azure AI Services (formerly Cognitive Services) is Microsoft's catalog of managed AI capabilities —
vision, language, speech, document understanding, content safety, and generative AI — each exposed
as a provisionable Azure resource rather than a model you train yourself. It's the Azure counterpart
to [[vertex-ai|Vertex AI]]'s Agent Builder/model catalog, with a materially different shape: instead
of one consolidated "agent platform" umbrella, Azure keeps generative AI (Azure OpenAI), retrieval
(Azure AI Search), and perception/language capabilities as distinct service categories with
different account models and billing.

---

## The lifecycle lens

Selecting and operating an Azure AI service is a five-stage loop, and most real decisions live in
stage 2 — picking the narrowest service that satisfies the requirement instead of defaulting to the
most capable (and most expensive) one:

```
Understand requirements  →  Select the service  →  Provision & configure  →  Integrate  →  Operate & optimize
(functional + non-func)     (narrowest fit)         (keys/endpoints/RBAC)     (SDK/REST)    (monitor, cost, tune)
```

Operating and securing a provisioned service is covered separately in
[[azure-ai-service-management|Managing, Monitoring, and Securing Azure AI Services]].

## Account models: single-service vs. multi-service

|               | Single-service account                                         | Multi-service account                                      |
| ------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Scope         | One capability (Vision, Speech, Language, Anomaly Detector, …) | Most/all capabilities behind one endpoint                  |
| Endpoint/keys | Dedicated per service                                          | Shared across capabilities                                 |
| Billing       | Isolated per service                                           | Consolidated                                               |
| Free tier     | Often available                                                | Paid SKU only (still consumption-based)                    |
| Best for      | Experimentation, granular cost tracking, scope isolation       | Apps using several capabilities, less operational overhead |

Azure OpenAI and Azure AI Search sit outside this model entirely — both are provisioned as their own
service category with separate billing, covered below.

## Azure OpenAI

Azure OpenAI hosts Microsoft-managed OpenAI models (GPT for text generation/reasoning, DALL·E for
image generation, and Ada/text-embedding models for semantic vectors) inside Azure's compliance and
networking boundary. It is not part of the multi-service account — it has its own resource,
provisioning flow, and pricing.

**Deployment flow:** create the Azure OpenAI resource → pick a region (affects model availability,
latency, and data residency) → deploy specific models in Azure OpenAI Studio → consume via an
endpoint that is deployment-scoped, not just resource-scoped:

```
{endpoint}/openai/deployments/{deployment-name}/{action}
```

Unlike other Azure AI services, one Azure OpenAI resource can host multiple model deployments
simultaneously, and each deployment supports a different set of actions (completions, chat, etc.) —
the deployment name has to be specified on every call.

**Pricing shape:**

| Model                               | Billing                                          | Behavior under load                                                   |
| ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Standard (consumption)              | Per prompt + completion token, priced separately | Shared capacity → variable latency                                    |
| Provisioned Throughput Units (PTUs) | Reserved compute capacity                        | Stable latency, predictable cost; exceeding capacity returns HTTP 429 |

PTU overflow needs retry logic or a fallback path to a standard deployment — the same
shared-capacity-vs-reserved-capacity tradeoff shows up across every managed LLM API, not just
Azure's.

## Azure AI Search — the RAG grounding layer

Azure AI Search (formerly Azure Cognitive Search) does hybrid retrieval — lexical
(keyword/BM25-style) combined with semantic (vector) search via Reciprocal Rank Fusion — with a 0–4
relevance score per result that lets you filter out low-relevance matches before they ever reach an
LLM prompt, directly reducing token cost. See [[05-hybrid-search|Hybrid Search]] (Part 05 of Agentic
AI Engineering) for the vendor-agnostic version of this pattern.

It indexes metadata and vector representations of source data — it does not duplicate the raw source
— from Blob Storage/ADLS Gen2, Cosmos DB, Azure SQL/MySQL, SharePoint, Azure Files, and partner
connectors.

The billing model is the one real exception to Azure AI's usage-based norm: **provisioned, not
consumption-based** — billed per SKU, replica, and partition, by the hour. The free tier has no
semantic ranking; that requires a paid tier.

> **Azure AI Search + Azure OpenAI is the canonical Azure RAG pattern** — Search retrieves and ranks
> the grounding data, OpenAI generates the answer over it. See
> [[01-retrieval-augmented-generation-rag|Retrieval-Augmented Generation]] (Part 05 of Agentic AI
> Engineering) for the pattern itself.

## The single-service capability catalog

| Capability          | Service                                                   | Notes                                                                                                                                            |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| Content moderation  | Azure AI Content Safety                                   | Successor to the retired Content Moderator. See [[azure-ai-content-safety                                                                        | Azure AI Content Safety]]. |
| Document extraction | Azure AI Document Intelligence (formerly Form Recognizer) | Prebuilt models (receipts, contracts, tax forms) + custom key-value/table/selection-mark extraction                                              |
| Vision              | Azure AI Vision                                           | OCR, classification, object detection, tagging, background removal, video analysis                                                               |
| Custom vision       | Azure AI Custom Vision                                    | Train custom image classifiers from your own labeled images                                                                                      |
| Face                | Face API (restricted access)                              | Detection, identity verification, liveness, similarity matching — age/gender/emotion/hair-color inference were retired on Responsible AI grounds |
| Video               | Azure AI Video Indexer                                    | Transcription, sentiment, scene/content understanding                                                                                            |
| Language            | Azure AI Language (replaced LUIS)                         | Language detection, sentiment, NER, PII/PHI detection, key-phrase extraction, summarization, Q&A, custom models                                  |
| Translation         | Azure AI Translator                                       | Text/document translation, batch processing, custom domain translation                                                                           |
| Speech              | Azure AI Speech                                           | STT (real-time + batch), TTS (neural voices), captioning, dictation, voice assistants                                                            |
| Accessibility       | Azure AI Immersive Reader                                 | Reading comprehension aids — syllable splitting, visual cues, speech highlighting, translation                                                   |

Two retirements worth knowing about specifically because they still show up in older material:
**LUIS → Azure AI Language**, and **Content Moderator → Azure AI Content Safety** — the latter isn't
just a rename, the harm-category model and severity scoring changed shape entirely (see
[[azure-ai-content-safety|Azure AI Content Safety]]).

## Where it fits

| Layer                 | Component                                                                          |
| --------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Generative AI         | Azure OpenAI (GPT, DALL·E, embeddings)                                             |
| Retrieval / grounding | Azure AI Search                                                                    |
| Perception & language | Vision, Language, Speech, Document Intelligence (single- or multi-service account) |
| Safety                | [[azure-ai-content-safety                                                          | Azure AI Content Safety]]                                                                                     |
| Operations            | [[azure-ai-service-management                                                      | Managing, Monitoring, and Securing Azure AI Services]]                                                        |
| Incident response     | [[azure-sre-agent                                                                  | Azure SRE Agent]] — Microsoft's own agent for operating Azure workloads, including ones built on this catalog |

**Why it's on the backlog:** the GCP analog for this whole page is [[vertex-ai|Vertex AI]] / the
Gemini Enterprise Agent Platform — worth comparing account-model and billing philosophy directly
(Azure's per-capability accounts + separate Azure OpenAI billing vs. Vertex AI's single consolidated
metered-compute model) when picking a cloud AI platform to standardize on.
