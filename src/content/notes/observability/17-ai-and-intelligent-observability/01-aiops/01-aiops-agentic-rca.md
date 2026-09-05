---
title: "1 — AIOps / Agentic RCA"
description: "What's actually new versus a static runbook — an investigation loop, not a fixed trigger-action mapping — why it depends on everything earlier in this book already being solid, and the read-vs-write safety line most real deployments draw."
tags: ["observability", "aiops", "profiling", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-15"
relations:
  - slug: agentic-ai-projects-and-mastery/reference/holmesgpt
    kind: related
  - slug: agentic-ai-projects-and-mastery/00-hands-on-engineering-projects/07-build-an-ai-sre-assistant/07-4-automated-root-cause-analysis
    kind: related
  - slug: building-agentic-systems/01-multi-agent-systems/09-supervisor-architectures/09-supervisor-architectures
    kind: related
  - slug: production-agent-systems/02-reliability-security-and-governance/02-prompt-injection/02-prompt-injection
    kind: related
---

# 1 — AIOps / Agentic RCA

A static runbook has always been "if condition X, run script Y" — a fixed, human-authored mapping,
brittle the moment a failure doesn't match the exact condition someone anticipated. What's actually
new about agentic RCA isn't "AI is now involved in ops" — it's replacing that fixed mapping with an
investigation _loop_: an agent that can query metrics, pull the trace an exemplar points at, read
the log line that trace's span produced, form a hypothesis, and query again to test it — the same
drill-down [[02-the-signals|The Signals]] describes a human doing, run by something that can do it
in seconds and never gets tired of checking one more dashboard.

---

## This depends on everything earlier in this book already being true

An agent doing this well isn't doing anything a human couldn't do with the same access — it's doing
it faster, and only as well as the telemetry underneath it actually supports:

- It needs [[03-cross-signal-correlation]] genuinely wired up, the same way a human does, to pivot
  from a metric spike to the one trace and log line that explain it — an agent facing three
  disconnected signal types is stuck exactly where an untrained human is.
- It needs consistent [[01-opentelemetry-sdks-and-semantic-conventions|semantic conventions]] and
  [[05-label-schema-design|label discipline]] across services, so a tool call that works against one
  service's telemetry generalizes to the next one instead of needing bespoke prompting per service.
- It's automating the same top-down, symptom-to-cause drill path
  [[01-dashboard-design|Dashboard Design]] lays a human dashboard out for — a badly-instrumented
  system gives the agent the same blind spots it gives a human, just delivered with more
  confident-sounding wrong answers.

Agentic RCA is best understood as automating a _well-instrumented human investigation_, not as a
substitute for one. It doesn't route around bad instrumentation — it inherits every blind spot bad
instrumentation already has.

---

## Trigger-action mappings, redefined

The trigger-action idea survives, but the "action" changes shape. A static runbook's action is a
fixed script; an agentic system's action is "invoke an agent, with a bounded toolset, inside
explicit guardrails" — the actual remediation, if any, is delegated to a scoped investigation loop
rather than hard-coded in advance. This is more flexible than a static mapping and correspondingly
harder to reason about in advance, which is exactly why the guardrails matter more, not less.

---

## Safety guardrails: read access first, write access is a different risk class entirely

Two separate lines matter:

- **Investigation vs. remediation.** An agent scoped to _read_ telemetry and propose a hypothesis is
  a fundamentally lower-risk category than one authorized to _act_ — restart a pod, roll back a
  deploy, scale a service. Most production deployments today are investigation-only: the agent
  surfaces a diagnosis for a human to approve, rather than acting autonomously.
- **Blast-radius discipline for anything that does act.** A remediation-capable agent should get the
  same discipline any automation gets before it's trusted with production: a dry-run mode, a staged
  or canary rollout of its own fix, and a human approval gate before anything irreversible. An agent
  that can act autonomously without those guardrails isn't a faster on-call engineer — it's a new,
  less-tested failure mode with write access.

[[holmesgpt|HolmesGPT]] is a concrete real-world example of the investigation-only end of this
spectrum: an open-source, tool-calling agent over 70+ toolsets, with a proactive "operator mode"
that opens fix PRs for a human to review rather than applying fixes itself. The closest lived
version of this work outside this site's own content is the SRE agent scaffold in the main
learning-lab monorepo (`h-aiops/`) — mentioned here in prose since it lives outside this site's
content collection, not as something to link to.

---

## Where to go for the hands-on build

This chapter is the conceptual frame; the AI Systems Engineering series' own progression is where
the build-it-yourself depth is scoped to live — from a first tool-using agent through a dedicated
Automated Root-Cause Analysis chapter and log/trace investigation tools in
[[agentic-ai-projects-and-mastery/readme|Agentic AI: Projects & Engineering Mastery]], to a
multi-agent Supervisor Architectures chapter in
[[building-agentic-systems/readme|Building & Evaluating Agents]] and the reliability concerns in
Prompt Injection for agentic systems specifically in
[[production-agent-systems/readme|Production Agent Systems]]. That series owns the "how do you
actually build one" ground this chapter deliberately doesn't retread.

---

## Why this matters for an Observability Architect

The question worth asking about any agentic RCA proposal isn't "can the model do this" — for a
well-instrumented system, often yes. It's "what's the blast radius if it's confidently wrong," and
"where exactly is the read/write line drawn." An investigation agent that's wrong wastes an on-call
engineer's time double-checking a bad hypothesis; a remediation agent that's wrong, without a
dry-run and an approval gate in between, can turn a contained incident into a self-inflicted one.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
