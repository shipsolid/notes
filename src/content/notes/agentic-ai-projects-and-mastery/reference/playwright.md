---
title: "What is Playwright"
description: "Microsoft's cross-browser end-to-end testing/automation framework — and, via Playwright MCP, the standard way AI agents get safe, deterministic control of a real browser."
tags: ["tech", "testing", "browser-automation", "ai-agents", "mcp"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-10"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/hermes-agent
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: related
---

Playwright is Microsoft's open-source framework for browser automation and end-to-end testing. On
its own it's a testing tool; paired with **Playwright MCP**, it's also become the default way an AI
agent gets hands on a real web browser.

---

## As a testing framework

| Feature               | What it means in practice                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-browser**     | One API drives Chromium, Firefox, and WebKit — cross-browser coverage without three separate test suites                         |
| **Auto-wait**         | Actions wait for elements to be actionable (visible, enabled, stable) before firing — eliminates most flaky-test `sleep()` hacks |
| **Trace viewer**      | Records a full timeline (DOM snapshots, network, console) for any test run — post-mortem debugging without re-running            |
| **Codegen**           | Records your manual clicks/typing and emits the equivalent test script                                                           |
| **Isolated contexts** | Each test gets its own browser context (cookies, storage) — no cross-test state leakage                                          |

```bash
npx playwright test              # run the suite
npx playwright test --trace on   # capture full trace for debugging
npx playwright codegen <url>     # record actions → generate script
```

## As an agent tool: Playwright MCP

The reason Playwright shows up on an AI-agent pipeline backlog rather than just a QA backlog:
[microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) exposes Playwright as an MCP
server, so any MCP-aware agent (Claude, an ADK agent, a CrewAI tool) can drive a real browser.

The key design choice is **accessibility snapshots, not screenshots**:

```
Traditional "computer use":  screenshot → vision model guesses coordinates → click(x, y)
Playwright MCP:              accessibility tree → deterministic element refs → click(ref)
```

That difference matters operationally:

- No vision model required — works with any text-only LLM
- Actions target a stable element reference, not a pixel coordinate — far less brittle when layout
  shifts
- Every action is inspectable/auditable against the accessibility tree, which is what makes this
  safe enough to hand to an autonomous agent in the first place

```
LLM ──▶ Playwright MCP server ──▶ real browser (Chromium/Firefox/WebKit)
                │
                └─ navigate / click / type / fill form / screenshot / read accessibility tree
```

By 2026 this pattern has effectively become the standard: several competing Playwright-based MCP
servers exist, but Microsoft's reference implementation is the default most agent frameworks wire up
first, with alternatives differentiating mainly on token efficiency.

**Why it's on the backlog:** it's the concrete answer to "how does my agent actually interact with a
UI that has no API" — relevant both for browser-based tool use in [[hermes-agent]] /
[[tech/crewai]]-style pipelines, and for testing whatever agent pipeline gets built.
