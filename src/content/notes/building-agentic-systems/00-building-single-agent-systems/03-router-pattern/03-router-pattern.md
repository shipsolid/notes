---
title: "3. Router Pattern"
description: "Shows what the router pattern looks like wired into a single agent process -- one classification call that picks a specialized system prompt and tool set, with no sub-agent spawned and no service boundary crossed."
tags: ["building-agentic-systems", "building-single-agent-systems", "book"]
hidden: false
zettelId: "202608101824-04"
relations:
  - slug: ai-architecture-and-system-design/00-ai-architecture-patterns/05-router-pattern/05-router-pattern
    kind: related
  - slug: building-agentic-systems/00-building-single-agent-systems/01-agent-architecture/01-agent-architecture
    kind: related
  - slug: agentic-ai-engineering/04-tools-and-environment-interaction/11-tool-selection-strategies/11-tool-selection-strategies
    kind: related
  - slug: ai-foundations/01-language-models-in-practice/03-structured-outputs/03-structured-outputs
    kind: related
---

## Router Pattern

> Chapter of
> [[building-agentic-systems/readme#00 — Building Single-Agent Systems|Building Single-Agent Systems]],
> part of [[building-agentic-systems/readme|Building & Evaluating Agents]].

This chapter stays deliberately narrow: what routing looks like **inside one agent process**, no
sub-agent spawned, no service boundary crossed. For the full pattern — intent classification
approaches, confidence-based fallback design, and the trade-off against the supervisor pattern — see
the canonical treatment in
[[ai-architecture-and-system-design/00-ai-architecture-patterns/05-router-pattern/05-router-pattern|Router Pattern (Part 00 of AI Architecture & System Design)]].

## The mechanism: two calls, one process

A single-agent router is almost always two LLM calls back to back, not one: a cheap classification
call reads the request and returns a category, then a second call does the actual work with a system
prompt and tool set narrowed to that category.

```python
CLASSIFY_SYSTEM = (
    "Classify the user's request into exactly one category: "
    "billing, technical, account, other. Respond with only the category name."
)

def classify(user_message: str) -> str:
    resp = llm.call(model="claude-haiku-4-5", system=CLASSIFY_SYSTEM,
                     messages=[{"role": "user", "content": user_message}])
    return resp.text.strip().lower()

HANDLERS = {
    "billing":   {"system": BILLING_SYSTEM,   "tools": [refund_lookup, invoice_fetch]},
    "technical": {"system": TECHNICAL_SYSTEM, "tools": [log_search, restart_service]},
    "account":   {"system": ACCOUNT_SYSTEM,   "tools": [update_profile, reset_password]},
}

route = HANDLERS.get(classify(user_message), HANDLERS["other"])
response = llm.call(model="claude-sonnet-4-6", system=route["system"],
                     tools=route["tools"], messages=messages)
```

Nothing here spawns a second agent — `HANDLERS` is a plain dict, "dispatch" is a dict lookup, and
both calls run in the same execution loop from
[[building-agentic-systems/00-building-single-agent-systems/01-agent-architecture/01-agent-architecture|Agent Architecture]].
That's the whole distinction from the multi-agent router: here, routing picks a _prompt and tool
set_; there, it picks a _destination agent_.

## Why narrow the tool set at all

The classification call earns its cost back at the second call: instead of exposing every tool the
agent owns to one LLM call and hoping it picks correctly, each branch only sees the two or three
tools relevant to that category. That's the same tool-choice degradation problem covered in
[[agentic-ai-engineering/04-tools-and-environment-interaction/11-tool-selection-strategies/11-tool-selection-strategies|Tool Selection Strategies]]
— accuracy drops as candidate tool count grows past what one call reliably discriminates —
sidestepped structurally instead of fixed with a better prompt. Using a cheap model for the
classification step and reserving the capable model for the handler call is the same cost lever as
the model-selection table in
[[building-agentic-systems/00-building-single-agent-systems/01-agent-architecture/01-agent-architecture|Agent Architecture]]:
you don't pay Sonnet/Opus prices to decide which of four buckets a one-line request belongs in.

## Where this breaks down

`HANDLERS.get(category, HANDLERS["other"])` is a silent default, not a real fallback policy — it
routes a low-confidence guess into a bucket exactly as confidently as it routes a clear one, and
gives no signal that the classification was shaky. Designing that properly — confidence thresholds,
a clarifying-question loop, escalation to a human or a general-purpose handler — plus how the
classification step itself should be built once "respond with only the category name" stops being
reliable (keyword rules vs. embedding similarity vs. LLM-as-classifier) is exactly what
[[ai-architecture-and-system-design/00-ai-architecture-patterns/05-router-pattern/05-router-pattern|Router Pattern (Part 00 of AI Architecture & System Design)]]
covers. The classification output is its own failure surface too — schema drift, an invented
category outside your list — covered generally in
[[ai-foundations/01-language-models-in-practice/03-structured-outputs/03-structured-outputs|Structured Outputs]].
