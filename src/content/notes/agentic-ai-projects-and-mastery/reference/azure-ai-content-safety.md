---
title: "What is Azure AI Content Safety"
description: "Microsoft's content moderation service — four independent harm categories (Hate, Violence, Sexual, Self-harm) scored 0-7, text/image analysis via REST or SDK, and custom blocklists for context-specific terms. Successor to the deprecated Content Moderator."
tags: ["tech", "azure", "ai-safety", "guardrails"]
updated: 2026-08-09
hidden: false
zettelId: "202608091200-2"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/azure-ai-services
    kind: related
---

Azure AI Content Safety is Microsoft's automated moderation service for user-generated content —
text and images at request-response granularity, scored against four independent harm categories
rather than a single safe/unsafe verdict. It replaced the now-deprecated **Content Moderator**,
which used a different, unrelated classification model; the two aren't interchangeable, and older
material that references Content Moderator's PII detection or single-score output describes a
retired service. See [[01-guardrails|Guardrails]] (Part 02 of Production Agent Systems) for the
vendor-agnostic version of this pattern — input/output validation layers that constrain what an
agent can say or do.

---

## Workflow

```
App sends text/image  →  Content Safety evaluates against its models  →  Returns per-category severity scores
```

Every request needs an endpoint, a subscription key, and the input payload. Optional: restrict to
specific harm categories (default returns all four), and/or cross-reference against a custom
blocklist.

## Harm categories & severity scoring

Four categories, each scored **independently** on a 0–7 scale (0 = safe, 7 = severe) — a request can
score high on one category and zero on the others simultaneously:

| Category               | Example trigger                    |
| ---------------------- | ---------------------------------- |
| Hate (Hate & Fairness) | Discriminatory or hateful language |
| Violence               | Violent content or threats         |
| Sexual                 | Sexual content                     |
| Self-harm              | Content encouraging self-injury    |

```
Hate: 6   Violence: 2   Sexual: 0   Self-harm: 3
```

The severity scale is the tuning knob per application — a children's app might block anything above
1; an adult forum might allow violence up to 4 (news reporting) and block 5+. The REST API exposes
both `FourSeverityLevels` (0/2/4/6) and `EightSeverityLevels` (0–7) granularity.

**Not covered:** PII detection (Content Moderator had this; Content Safety doesn't), and — in scope
generally but not always covered by every AI-102 curriculum — GenAI-specific protections (jailbreak
detection, protected/copyrighted-content detection) alongside the core text/image moderation.

## Implementing it

Every method (REST, Python, C#) needs the same three inputs: input data, endpoint, subscription key.

**REST** — analysis is always POST, text and image endpoints differ only by path segment:

```
POST {endpoint}/contentsafety/text:analyze?api-version=2023-10-01
POST {endpoint}/contentsafety/image:analyze?api-version=2023-10-01
```

The response is a `categoriesAnalysis` list, one entry per category with a `severity` field.

**Python SDK** (`azure-ai-contentsafety`):

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeTextOptions, AnalyzeImageOptions, ImageData
from azure.core.credentials import AzureKeyCredential

client = ContentSafetyClient(endpoint, AzureKeyCredential(key))

# text, with an optional blocklist
request = AnalyzeTextOptions(
    text="Sample text to check",
    blocklist_names=["MyCustomBlocklist"],
    halt_on_blocklist_hit=False,  # False = still return harm-category scores alongside the match
)
response = client.analyze_text(request)

# image — raw bytes, not a path or URL
with open("path/to/image.jpg", "rb") as f:
    request = AnalyzeImageOptions(image=ImageData(content=f.read()))
response = client.analyze_image(request)

for result in response.categories_analysis:
    print(f"{result.category}: {result.severity}")
```

`analyze_text_async` exists for high-throughput scenarios like live chat moderation. The C# SDK
(`Azure.AI.ContentSafety`) mirrors the same class names (`AnalyzeTextOptions`,
`AnalyzeImageOptions`).

**Image constraints:** JPEG/PNG/GIF/BMP/WEBP/TIFF, 50×50 to 2048×2048 px, under 4 MB, sent as raw
bytes wrapped in `ImageData` (the SDK handles base64 encoding).

## Text blocklists

Out-of-the-box moderation covers most cases; blocklists exist for organization-specific terms that
look harmless in isolation but carry contextual meaning the default models won't catch.

| Operation              | Method | Endpoint                                                                     |
| ---------------------- | ------ | ---------------------------------------------------------------------------- |
| Create blocklist       | PATCH  | `{endpoint}/contentsafety/text/blocklists/{name}` (requires a `description`) |
| Add/update terms       | POST   | `{endpoint}/contentsafety/text/blocklists/{name}:addOrUpdateBlocklistItems`  |
| Analyze with blocklist | POST   | `{endpoint}/contentsafety/text:analyze` with `blocklistNames: [...]`         |

`haltOnBlocklistHit`: `true` stops on a match and omits harm-category scores; `false` returns both
the blocklist match and the full category breakdown. A matched term can also independently push up a
harm-category score — a "benign" word used hostilely can raise the Hate severity on its own.
Blocklists are **text-only**; there's no image equivalent.

## Content Safety Studio

A no-code browser GUI (Azure portal, under the Content Safety resource) over the same underlying
resource as the API/SDK — not a separate service. Lets you test samples, set Low/Medium/High
threshold sliders over the 0–7 scale, export a configured test as Python/C#/Java code, and bulk-test
a dataset.

## Where it fits

Content Safety is the concrete Azure implementation of the pre-execution guardrail pattern covered
generally in [[01-guardrails|Guardrails]] (Part 02 of Production Agent Systems) —
schema/content-safety classifiers that gate what a system (agentic or not) is allowed to surface.
Pair it with [[azure-ai-service-management|Managing, Monitoring, and Securing Azure AI Services]]
for the resource security/monitoring layer underneath it, and see
[[azure-ai-services|Azure AI Services]] for where it sits in the broader service catalog.
