---
title: "G. OpenAI, Anthropic & Google API Comparison"
description: "A reference comparison of the OpenAI, Anthropic, and Google model APIs - tool-calling formats, context window and pricing tiers, and streaming semantics - for choosing a provider without re-reading three sets of docs."
tags: ["agentic-ai-projects-and-mastery", "appendices", "book"]
hidden: false
zettelId: "202607191037-199"
---

## OpenAI, Anthropic & Google API Comparison

### Provider tiers at a glance

Every major lab ships a small/cheap, medium, and large/strongest model — the names differ, the shape
is identical. Exact version numbers go stale within weeks; the 3-tier shape is the durable fact.

| Provider      | Small (cheapest, fastest) | Medium        | Large (strongest)    | Naming logic                                                       |
| ------------- | ------------------------- | ------------- | -------------------- | ------------------------------------------------------------------ |
| **OpenAI**    | GPT Nano                  | GPT Mini      | GPT (flagship)       | Literal size suffix (Nano → Mini → unsuffixed)                     |
| **Anthropic** | Claude Haiku              | Claude Sonnet | Claude Opus          | Poetic-forms theme — haiku/sonnet/opus = increasingly larger forms |
| **Google**    | Gemini Flash-Lite         | Gemini Flash  | Gemini Pro (Preview) | Descriptive (Lite → Flash → Pro)                                   |

Mnemonic: **"3×3"** — 3 major labs, 3 tiers each, cheap/fast → balanced → most-capable in every
family.

**DeepSeek** — Chinese AI startup, among the first to open-source a genuinely large, high-quality
model. "Open source" doesn't mean "runs on your laptop": the full-size flagship still needs
cloud-scale compute; only distilled variants are practical to self-host.

### LLM provider vs. inference provider

| Term                   | Definition                                                                           | Example                                  |
| ---------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| **LLM provider**       | Trains and owns a foundation model                                                   | OpenAI, Anthropic, Google, DeepSeek, xAI |
| **Inference provider** | Runs _other_ companies' open-source models fast in the cloud, trains none of its own | Groq                                     |

An inference provider's model name typically encodes both facts — e.g. `openai/gpt-oss-120b`
**through Groq** means OpenAI's open-source GPT-OSS-120B, served on Groq's hardware.

**Groq (Q) vs. Grok (K)** — a classic mix-up, one letter apart:

|               | **Groq** (inference provider)                                                                                                                    | **Grok** (LLM, xAI)                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| What it is    | Runs open-source models (e.g. GPT-OSS-120B) fast on custom hardware                                                                              | Generates answers directly, branded "truth-seeking"        |
| Founded       | **2016**, Jonathan Ross & Douglas Wightman (ex-Google TPU team) — **predates** xAI (Mar 2023) / Grok (Nov 2023)                                  | Named later, spelled the way you'd expect a play on "grok" |
| NVIDIA tie-in | Dec 2025: non-exclusive inference-tech licensing deal, ~$20B ("acqui-hire"-flavored) — Groq stays an independent company under CEO Simon Edwards | N/A                                                        |

Mnemonic: **Q**uick chip → Gro**q** is the fast hardware/inference company. **K**ingdom of Musk →
Gro**k** is Elon's model. The "obvious"-looking name (Grok) is actually the later, imitating one —
Groq came first.

### OpenRouter — the API aggregator

Single API key/account routes requests to any other provider (OpenAI, Anthropic, Gemini, Groq, Grok,
open-source models). Value: no minimum balances across N provider accounts, unified rate-limit
management, access to models without a direct key. Fee structure (verified against OpenRouter's own
docs): **5.5% ($0.80 min)** on Stripe credit purchases, **5%** on crypto top-ups, **5% BYOK fee** on
usage beyond the monthly free allowance — no separate markup on the underlying token price itself.
([OpenRouter FAQ](https://openrouter.ai/docs/faq))

### Ollama — running models locally

Software that runs on your own machine and exposes an **OpenAI-compatible endpoint** for
locally-hosted open-source models, on port **11434** (`http://localhost:11434/v1/models` lists
what's pulled).

| Command               | Purpose                   |
| --------------------- | ------------------------- |
| `ollama serve`        | Start the local daemon    |
| `ollama pull <model>` | Download a model          |
| `ollama ls`           | List downloaded models    |
| `ollama rm <model>`   | Delete a downloaded model |

Sizing rule of thumb: safe on most laptops at **~3 GB or smaller** (Llama 3.2 1B, small Qwen/Gemma
variants); avoid 70B-class models (Llama 3.3 = 43 GB, same for Llama 4) without a large machine.
Model names ending in **`-cloud`** on ollama.com are _not_ local — they proxy to remote compute.

### The OpenAI-compatible API convention

Most providers — Anthropic included — expose the same `chat.completions.create` request/response
shape OpenAI defined. One client class covers every provider by swapping only `base_url` +
`api_key`:

```python
from openai import OpenAI

# "anthropic" here is still an instance of the OpenAI client class —
# only the base_url and api_key differ.
anthropic = OpenAI(base_url=ANTHROPIC_BASE_URL, api_key=anthropic_api_key)

response = anthropic.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": "..."}],
)
answer = response.choices[0].message.content
```

**Caveat:** Anthropic documents its OpenAI-compat layer (`base_url=https://api.anthropic.com/v1/`)
as a **testing/comparison convenience, not a production-recommended path** — it doesn't expose
Claude-specific features (extended thinking, prompt caching, citations, PDF input). Claude's native
endpoint is `/v1/messages`, not `/v1/chat/completions`.
([Claude Platform Docs — OpenAI SDK compatibility](https://platform.claude.com/docs/en/api/openai-sdk))

**`reasoning_effort`** values: `none` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`
(exact set is model/provider-dependent — the top OpenAI tier's literal API value is `xhigh`, not
"extra high").
([OpenAI — Reasoning models](https://developers.openai.com/api/docs/guides/reasoning))

### OpenAI API pricing (current tiers)

| Model                 | Input ($/1M tokens) | Output ($/1M tokens) | Typical use case                             |
| --------------------- | ------------------: | -------------------: | -------------------------------------------- |
| **gpt-5-nano**        |            **0.05** |             **0.40** | Classification, extraction, simple chat, RAG |
| **gpt-5-mini**        |            **0.25** |             **2.00** | General-purpose assistants, coding, agents   |
| **gpt-5**             |            **1.25** |            **10.00** | High-quality coding, reasoning, writing      |
| **gpt-5-chat-latest** |            **1.25** |            **10.00** | ChatGPT-like conversational behavior         |
| **o4-mini**           |            **1.10** |             **4.40** | Fast reasoning and tool use                  |
| **o3**                |            **2.00** |             **8.00** | Advanced reasoning and planning              |
| **gpt-5.5**           |            **5.00** |            **30.00** | State-of-the-art coding and reasoning        |
| **gpt-5.5-pro**       |           **30.00** |           **180.00** | Highest-quality reasoning, expensive         |

Legacy (being phased out in favor of the GPT-5 family): gpt-4o-mini ($0.15 / $0.60), gpt-4o ($2.50 /
$10.00), gpt-4.1-nano ($0.10 / $0.40), gpt-4.1-mini ($0.40 / $1.60), gpt-4.1 ($2.00 / $8.00).

Practical allocation pattern for agentic/RAG workloads: **80%** of requests on `gpt-5-nano`,
escalate to `gpt-5-mini` for difficult coding/tool-calling, reserve `gpt-5` / `gpt-5.5` only when
needed.
([OpenAI — Introducing GPT-5 for developers](https://openai.com/index/introducing-gpt-5-for-developers/))

### Benchmarking

[artificialanalysis.ai](https://artificialanalysis.ai) compares models on intelligence, speed, and
cost — a useful starting point for choosing a model, but treat rankings as directional, not gospel.

### Sources

- Anthropic,
  ["Building Effective Agents"](https://www.anthropic.com/engineering/building-effective-agents)
- Claude Platform Docs,
  ["OpenAI SDK compatibility"](https://platform.claude.com/docs/en/api/openai-sdk)
- OpenAI, ["Reasoning models"](https://developers.openai.com/api/docs/guides/reasoning)
- OpenAI,
  ["Introducing GPT-5 for developers"](https://openai.com/index/introducing-gpt-5-for-developers/)
- OpenRouter, [FAQ / pricing docs](https://openrouter.ai/docs/faq)
- CNBC,
  ["Nvidia buying AI chip startup Groq's assets for about $20 billion..."](https://www.cnbc.com/2025/12/24/nvidia-buying-ai-chip-startup-groq-for-about-20-billion-biggest-deal.html)
  and Groq Newsroom,
  [licensing agreement announcement](https://groq.com/newsroom/groq-and-nvidia-enter-non-exclusive-inference-technology-licensing-agreement-to-accelerate-ai-inference-at-global-scale)
- Wikipedia, ["Groq"](https://en.wikipedia.org/wiki/Groq)

## Metadata

|        |                                 |
| ------ | ------------------------------- |
| Author | Amit Singh                      |
| Scope  | agentic-ai-projects-and-mastery |
