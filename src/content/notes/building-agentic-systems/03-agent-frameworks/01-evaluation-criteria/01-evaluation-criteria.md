---
title: "1. Evaluation Criteria"
description: "Covers the axes, including orchestration model, state management, observability, and ecosystem maturity, used to evaluate and compare agent frameworks before adopting one."
tags: ["building-agentic-systems", "agent-frameworks", "book"]
hidden: false
zettelId: "202607191037-102"
relations:
  - slug: building-agentic-systems/02-evaluation/01-ai-evaluation-frameworks/01-ai-evaluation-frameworks
    kind: depends_on
  - slug: building-agentic-systems/03-agent-frameworks/10-choosing-the-right-framework/10-choosing-the-right-framework
    kind: related
  - slug: production-agent-systems/00-production-infrastructure/06-workflow-engines/06-workflow-engines
    kind: related
  - slug: production-agent-systems/04-ai-platform-engineering/02-agent-sdks/02-agent-sdks
    kind: related
---

## Evaluation Criteria

> Chapter of [[building-agentic-systems/readme#03 — Agent Frameworks|Agent Frameworks]], part of
> [[building-agentic-systems/readme|Building & Evaluating Agents]].

## Decide "good agent" before "good framework"

Before you put LangGraph, the OpenAI Agents SDK, and CrewAI in a spreadsheet, answer a prior
question: what does "the agent works" mean for your workload — success rate against what ground
truth, at what latency budget, at what cost per run? That's
[[building-agentic-systems/02-evaluation/01-ai-evaluation-frameworks/01-ai-evaluation-frameworks|AI Evaluation Frameworks (Part 00 of Agentic AI Engineering)]],
and it isn't optional groundwork you can skip to get to the fun part. Every axis below only matters
in relation to a workload you can already score. A framework with best-in-class tracing is wasted
effort if you don't yet have a golden dataset to trace against; a framework with a rigid graph model
is a non-issue if your evaluation already told you the workload is a strict five-step pipeline with
no branching. Framework selection is a much smaller decision once the evaluation question has an
answer — that's the order this book covers them in, and it should be the order you decide them in
too.

With that settled, here are the five axes that actually differentiate frameworks in production, not
in a keynote demo.

## 1. Orchestration model

The core design choice a framework makes is how it represents control flow, and it constrains every
agent you build on it whether you notice or not.

| Model               | How it represents control flow                                        | Reference implementation       |
| ------------------- | --------------------------------------------------------------------- | ------------------------------ |
| Graph-based         | Explicit nodes and edges, including cycles, as a state machine        | LangGraph's `StateGraph`       |
| Conversational      | Agents coordinate by exchanging messages in a shared group chat       | AutoGen                        |
| Pipeline / workflow | A DAG of components or event-driven steps, largely acyclic by default | Haystack, LlamaIndex Workflows |
| Role-based crew     | Agents as roles with assigned tasks under a process manager           | CrewAI                         |

The failure mode that actually bites: a pipeline framework's abstraction assumes a DAG. Bolting
[[agentic-ai-engineering/03-planning-and-reasoning-algorithms/02-react/02-react|ReAct]]-style
unbounded iteration onto it means hand-rolling a loop _around_ the pipeline invocation, outside the
framework's own primitives — which means the framework's tracing, checkpointing, and retry logic
don't see that outer loop either. A graph-based framework makes the loop a first-class edge back to
an earlier node, so the state machine sees the whole thing — at the cost of forcing your team to
think in nodes/edges/state schemas even for a workflow that's conceptually linear. Match the model
to how much your control flow actually branches and cycles, not to which framework has the most
GitHub stars this quarter.

## 2. State management approach

Three genuinely different postures, not three flavors of the same thing:

- **Framework owns persistence.** LangGraph's checkpointer plugs into a durable backend and gives
  you resume-from-checkpoint for free — the same partial-completion checkpointing discipline covered
  in
  [[production-agent-systems/02-reliability-security-and-governance/11-failure-recovery/11-failure-recovery|Failure Recovery]],
  supplied as a platform primitive instead of something you hand-roll.
- **Framework provides the shape, you provide the store.** The OpenAI Agents SDK's session objects
  give you a conversation-state abstraction, but wiring it to a durable backend for crash recovery
  is still your job.
- **No opinion at all.** A raw tool-use loop against a provider SDK gives you a `messages` list and
  nothing else — full control, and full responsibility for
  [[production-agent-systems/00-production-infrastructure/03-state-persistence/03-state-persistence|State Persistence]].

None of these is "correct" in the abstract. The question to ask against your own workload: does this
framework's state model compose with the durable-execution substrate
([[production-agent-systems/00-production-infrastructure/06-workflow-engines/06-workflow-engines|Workflow Engines]]
— Temporal, Step Functions, or the framework's own persistence layer) you're already committed to,
or does adopting it mean running two competing ideas of "what is the state of this run" side by
side?

## 3. Observability hooks

Does the framework emit anything you can act on when a run goes wrong at 2am? Three tiers, in
increasing order of how much you'll have to build yourself: native callback/tracing hooks that feed
a vendor's own dashboard (LangChain/LangGraph callbacks into LangSmith), OTel-native span emission
that plugs into infrastructure you already run, or nothing — you instrument the loop by hand. The
gap that actually matters in an incident: does the framework treat token counts, tool-call latency,
and step boundaries as first-class emitted attributes, or as something you have to reconstruct from
logs after the fact? See
[[production-agent-systems/01-observability/01-ai-observability-fundamentals/01-ai-observability-fundamentals|AI Observability Fundamentals]]
for what "good enough to debug a production incident" actually requires — score each candidate
framework against that bar, not against whether it has _a_ dashboard.

## 4. Ecosystem maturity

Maturity is not download count or star count — it's how often the abstraction wrapping your business
logic breaks under you. Three signals worth checking before you commit, and none of them are things
I'll assign a specific number to here without a source in front of me — verify current state
directly against each project's own changelog before using it in a decision:

- **Breaking-change cadence.** How often has the core API reshaped across minor versions? A
  framework mid-rewrite is a moving target for anything you build today.
- **Governance.** Is it a single-vendor product (Semantic Kernel, Google ADK) with a roadmap you
  don't control, or a broader open-source project with multiple maintainers and a public RFC
  process?
- **Integration depth vs. integration count.** A long list of "supported tools" is marketing copy.
  What matters is whether the three or four integrations your workload actually needs are
  maintained, not merely present.

## 5. Lock-in risk

The concrete test: if you deleted the framework's import today, how much of the logic that encodes
_your_ agent's actual decisions — prompts, tool JSON schemas, business rules — still runs, versus
how much only exists as configuration inside the framework's own DSL? Prompts and tool schemas are
close to portable across any framework by construction — they're just text and JSON. A LangGraph
`StateGraph` wiring, an AutoGen group-chat configuration, or a CrewAI crew/task graph is not; it's
an investment in that framework's vocabulary specifically, and migrating it later is a rewrite, not
a `pip install` swap.

The mitigation isn't "avoid frameworks" — it's keeping the framework as a thin orchestration shell
around framework-agnostic core logic, so a future framework migration touches the wiring layer and
leaves the prompts, schemas, and business rules untouched. This is the same build-vs- adopt tradeoff
[[production-agent-systems/04-ai-platform-engineering/02-agent-sdks/02-agent-sdks|Agent SDKs]]
covers at platform scale — the sunk cost of a framework-specific abstraction compounds across every
team that builds on top of it, not just the first agent that adopted it.

---

None of these five axes is individually decisive — a framework that wins on orchestration model and
loses on lock-in risk is a legitimate choice if your workload is short-lived and unlikely to outlive
the framework's own next major version. What they give you is a shared vocabulary for the actual
decision, made in
[[building-agentic-systems/03-agent-frameworks/10-choosing-the-right-framework/10-choosing-the-right-framework|Choosing the Right Framework]]:
score each real candidate against these five axes for _your_ workload's shape, not a generic "best
agent framework 2026" ranking.
