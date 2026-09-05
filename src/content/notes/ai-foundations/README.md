---
title: "AI & LLM Foundations"
description: "A book-shaped table of contents for AI & LLM Foundations: the pre-agentic substrate — symbolic AI through transformers, tokens, embeddings, attention, foundation models, and turning a raw LLM API into a dependable application component. Book 1 of the AI Systems Engineering series."
tags: ["ai-foundations", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202608101902-4"
noteType: moc
---

# Recommended Reading Order

This book is the first of six that used to be one large "Agentic AI Engineering" book. Each is now
self-contained and cross-links to its siblings instead of duplicating them — read in this order for
the full learning journey, or jump straight to whichever book matches what you need right now:

1. **[[ai-foundations/readme|AI & LLM Foundations]]** (this book) — the pre-agentic substrate and
   turning a raw model API into a dependable component.
2. **[[agentic-ai-engineering/readme|Agentic AI Engineering]]** — agent cognition, memory, planning,
   tools, retrieval, and context engineering.
3. **[[building-agentic-systems/readme|Building & Evaluating Agents]]** — single- and multi-agent
   systems, evaluation, and the framework landscape.
4. **[[production-agent-systems/readme|Production Agent Systems]]** — infrastructure, observability,
   reliability/security, performance/cost, and platform engineering.
5. **[[ai-architecture-and-system-design/readme|AI Architecture & System Design]]** — the
   cross-cutting pattern catalog and enterprise system-design case studies.
6. **[[agentic-ai-projects-and-mastery/readme|Agentic AI: Projects & Engineering Mastery]]** —
   hands-on builds, Principal/Staff-level judgment, and the reference appendices.

## AI & LLM Foundations

> _The pre-agentic substrate for Principal & Staff Engineers (L6/L7)_
>
> If this were a book, this page is the table of contents. The pre-agentic substrate: how we got
> from symbolic AI to transformers, and the vocabulary (tokens, embeddings, attention, foundation
> models) every later book assumes without re-explaining — then turning a raw model API into a
> dependable application component. Each chapter links out to the framework, platform, and SRE notes
> that already exist elsewhere in this wiki instead of duplicating them. Unwritten chapters are
> listed as **stub** rows, not empty files.

## Parts

### 00 — Foundations of Modern AI

The pre-agentic substrate: how we got from symbolic AI to transformers, and the vocabulary (tokens,
embeddings, attention, foundation models) every later Part assumes without re-explaining. Closes
with the mathematical intuition — probability, sampling, and vector geometry — engineers use every
day without necessarily having derived.

- **Chapter 1.**
  [[01-the-evolution-of-artificial-intelligence|The Evolution of Artificial Intelligence]] — Traces
  the arc from symbolic AI and expert systems through statistical ML, deep learning, and the
  scaling-law-driven emergence of foundation models, framing why agentic AI is the current
  inflection point rather than a fresh discipline.
- **Chapter 2.** [[02-machine-learning-fundamentals|Machine Learning Fundamentals]] — Covers
  supervised vs. unsupervised vs. reinforcement learning, the bias-variance tradeoff, loss
  functions, and gradient descent as the fundamentals that still govern how modern LLMs are trained
  and fine-tuned.
- **Chapter 3.** [[03-deep-learning-essentials|Deep Learning Essentials]] — Covers neural network
  building blocks — layers, activation functions, backpropagation, regularization, and optimizers —
  as the substrate transformers are built on.
- **Chapter 4.** [[04-transformer-architecture|Transformer Architecture]] — Breaks down the
  encoder-decoder transformer — self-attention, multi-head attention, positional encoding, and
  feed-forward blocks — and why this architecture displaced RNNs and LSTMs.
- **Chapter 5.** [[05-tokens-embeddings-and-attention|Tokens, Embeddings & Attention]] — Explains
  how raw text becomes tokens, how tokens become dense embedding vectors, and how attention computes
  contextual relevance between them.
- **Chapter 6.** [[06-context-windows-and-tokenization|Context Windows & Tokenization]] — Covers
  tokenizer algorithms (BPE, WordPiece, SentencePiece), context window sizing and its quadratic
  attention-cost tradeoff, and practical strategies for working within a fixed context budget.
- **Chapter 7.** [[07-foundation-models|Foundation Models]] — Defines what makes a model
  foundational — pretraining scale, transfer learning, and emergent capabilities — and surveys major
  foundation model families.
- **Chapter 8.** [[08-large-language-models|Large Language Models]] — Covers the LLM training
  pipeline end to end — pretraining, supervised fine-tuning, and RLHF/DPO alignment — and the
  resulting capability, cost, and latency tradeoffs.
- **Chapter 9.** [[09-reasoning-models|Reasoning Models]] — Covers chain-of-thought and
  inference-time compute scaling in reasoning models, and when the added latency and cost is
  actually justified.
- **Chapter 10.** [[10-the-ai-ecosystem|The AI Ecosystem]] — Maps the current AI ecosystem — model
  providers, orchestration frameworks, vector databases, evaluation tooling, and inference
  infrastructure.
- **Chapter 11.** [[11-probability-sampling-and-decoding|Probability, Sampling & Decoding]] — The
  math underneath every model call: output probability distributions, temperature and top-p/top-k
  sampling, why beam search lost to sampling for chat models, entropy as a live uncertainty signal,
  and KL divergence as the distance metric behind RLHF/DPO alignment.
- **Chapter 12.** [[12-vector-geometry-and-similarity|Vector Geometry & Similarity]] — The geometric
  intuition behind embeddings — cosine similarity vs. Euclidean distance, why high- dimensional
  vector spaces behave counter-intuitively, and how this underlies every retrieval and memory
  chapter in this book.

### 01 — Language Models in Practice

Turning a raw model API into a dependable application component. See
`3-references/AI/llm-engineering-layers.md` for a working harness/context/prompt three-layer model
with real code — this Part covers the same ground at book depth.

- **Chapter 1.** [[01-prompt-engineering-fundamentals|Prompt Engineering Fundamentals]] — Covers the
  core levers of prompt construction — instruction clarity, few-shot exemplars, system vs. user role
  separation, and sampling controls.
- **Chapter 2.** [[02-prompt-design-patterns|Prompt Design Patterns]] — Catalogs reusable prompt
  patterns — chain-of-thought, ReAct, self-consistency, and role/persona framing.
- **Chapter 3.** [[03-structured-outputs|Structured Outputs]] — Covers forcing an LLM into a
  validated schema and the failure modes, like schema drift, that break naive implementations.
- **Chapter 4.** [[04-function-calling|Function Calling]] — Covers how models select and populate
  function signatures from natural language, and pitfalls like parameter hallucination.
- **Chapter 5.** [[05-tool-calling|Tool Calling]] — Extends function calling into multi-tool agent
  design — tool registries, tool-choice strategies, parallel vs. sequential invocation.
- **Chapter 6.** [[06-streaming-responses|Streaming Responses]] — Covers server-sent events and
  token-streaming architectures, and how streaming interacts with structured-output validation.
- **Chapter 7.** [[07-model-selection-and-routing|Model Selection & Routing]] — Covers building a
  model router that picks among providers and tiers by task complexity, latency SLA, and cost.
- **Chapter 8.** [[08-hallucination-management|Hallucination Management]] — Covers the mechanisms
  behind LLM hallucination and mitigation strategies like grounding via RAG and
  confidence-calibrated refusal.
- **Chapter 9.** [[09-ai-failure-modes|AI Failure Modes]] — Surveys production failure modes beyond
  hallucination — prompt injection, context poisoning, tool-call loops, cascading errors in
  multi-agent chains.
- **Chapter 10.** [[10-building-reliable-llm-applications|Building Reliable LLM Applications]] —
  Covers the engineering practices that turn a probabilistic model call into a reliable system
  component.

## Metadata

|        |                |
| ------ | -------------- |
| Author | Amit Singh     |
| Scope  | ai-foundations |
