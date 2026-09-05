---
title: "What is OpenClaw"
description: "Self-hosted, model-agnostic personal AI agent (by Peter Steinberger) that gets full computer access — browser, filesystem, shell — and is reachable from 29+ chat platforms, positioned against SaaS agent walled gardens."
tags: ["tech", "ai-agents", "agent-frameworks", "open-source"]
updated: 2026-07-09
hidden: false
zettelId: "202607081949-9"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/hermes-agent
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/google-adk
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: related
---

OpenClaw is an open-source personal AI agent created by Peter Steinberger that runs **locally on
your own machine** (macOS, Linux, Windows) rather than in a vendor's cloud. It's pitched as "a 24/7
assistant with access to its own computer" — the emphasis is on doing real things (sending emails,
filling forms, running scripts), not just chatting.

---

## Core design choices

| Choice                     | What it buys you                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| **Runs locally**           | State (memory, credentials, task history) stays on your machine, not a SaaS vendor's servers   |
| **Model-agnostic gateway** | Swap Claude, GPT, or a local model behind the same agent without rewriting anything            |
| **Multi-channel**          | One agent, reachable from 29+ platforms — WhatsApp, Telegram, Discord, Slack, Signal, iMessage |
| **Skills framework**       | Community-contributed or self-authored plugins via ClawHub; the agent can write its own skills |

```
You (WhatsApp / Slack / Discord / ...)
          │
          ▼
   OpenClaw gateway  ──▶  Model of your choice (Claude / GPT / local)
          │
          ├── Browser control (fill forms, extract data)
          ├── Filesystem read/write
          ├── Shell / script execution
          └── Cron jobs (proactive, unattended tasks)
```

## What people actually use it for

Reported use cases skew toward personal ops automation: inbox triage, calendar coordination, flight
check-ins, expense reporting and tax prep, website building, code review, test automation, and
orchestrating multiple agents across a Discord server.

## The positioning: self-hosted vs. SaaS agent

OpenClaw's pitch is explicitly a reaction against cloud agent platforms: "your context and skills
live on YOUR computer, not a walled garden." That's the same self-hosting argument [[hermes-agent]]
makes, and both projects compete on the same axis — control and data locality — rather than raw
capability.

| Axis                  | OpenClaw                            | [[hermes-agent]]                                                                   |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| Origin                | Peter Steinberger (indie)           | Nous Research (lab, tied to Hermes models)                                         |
| Memory model          | Persistent, skills-framework driven | "Holographic" fact memory (SQLite/FTS5) with a closed-loop skill-distillation step |
| Distribution channels | 29+ chat platforms                  | Telegram, Discord, Slack, WhatsApp, Signal, CLI                                    |
| Extension model       | ClawHub community skills/plugins    | Auto-distilled skills from its own task history                                    |

> **Note on claims:** OpenClaw's own marketing cites very large adoption numbers (GitHub stars in
> the hundreds of thousands) for a project this young. Treat vendor-reported growth figures for any
> fast-moving open-source AI project as directional, not verified, until you've checked the repo
> yourself.

**Why it's on the backlog:** it's the most "consumer-facing" entry in this list — useful as a
reference point for how far a self-hosted agent can reach into personal systems (browser + shell

- filesystem) before you even get to enterprise frameworks like [[tech/google-adk]] or
  [[tech/crewai]].
