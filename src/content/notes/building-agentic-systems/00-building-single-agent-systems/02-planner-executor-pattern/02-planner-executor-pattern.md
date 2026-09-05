---
title: "2. Planner–Executor Pattern"
description: "How to wire a planner role and an executor role as two distinct LLM-call shapes inside a single agent process, and when that in-process split stops being the right call."
tags: ["building-agentic-systems", "building-single-agent-systems", "book"]
hidden: false
zettelId: "202608101824-03"
relations:
  - slug: ai-architecture-and-system-design/00-ai-architecture-patterns/02-planner-executor-pattern/02-planner-executor-pattern
    kind: related
  - slug: building-agentic-systems/00-building-single-agent-systems/01-agent-architecture/01-agent-architecture
    kind: depends_on
  - slug: agentic-ai-engineering/03-planning-and-reasoning-algorithms/07-plan-and-execute/07-plan-and-execute
    kind: related
  - slug: building-agentic-systems/00-building-single-agent-systems/03-router-pattern/03-router-pattern
    kind: related
---

## Planner–Executor Pattern

> Chapter of
> [[building-agentic-systems/readme#00 — Building Single-Agent Systems|Building Single-Agent Systems]],
> part of [[building-agentic-systems/readme|Building & Evaluating Agents]].

This chapter stays narrow: what "planner" and "executor" mean when both live inside **one agent
process**. For the pattern's formal definition, applicability criteria, and its trade-off table
against Router, Supervisor, and Orchestrator-Worker, go to
[[ai-architecture-and-system-design/00-ai-architecture-patterns/02-planner-executor-pattern/02-planner-executor-pattern|Planner–Executor Pattern (Part 00 of AI Architecture & System Design)]]
— that's the canonical treatment. This chapter answers a narrower question: inside a single agent,
is the split two prompts, or two processes?

## Two roles, one process

The [[01-agent-architecture|five-component agent runtime]] already has a Planning component and an
Execution Loop. Wired single-agent-style, planner–executor just means those two components become
two distinct **LLM call shapes**, run back-to-back by the same code, sharing one memory object — not
two agents talking over a queue.

```python
# One process. Two system prompts. Two call shapes.
plan = llm.call(system=PLANNER_PROMPT, user=goal)      # -> structured step list, no tools bound
# plan.steps = [{"step": 1, "action": "search_docs", ...}, {"step": 2, ...}, ...]

for step in plan.steps:
    result = llm.call(system=EXECUTOR_PROMPT, user=step, tools=tool_schemas)
    memory.write(step, result)
    if result.needs_replan:
        plan = llm.call(system=PLANNER_PROMPT, user=memory.summarize())  # re-plan, same process

```

The planner call never sees tool schemas — it only ever produces a step list. The executor call
never sees the planner's reasoning trace — it only sees the current step plus whatever memory that
step needs. That prompt isolation is the actual engineering decision here, not the diagram: leak the
planner's scratchpad into every executor call and you pay for it in tokens on every step, and the
executor starts hedging its tool choices against speculative reasoning that was never a commitment.

## Not the same thing as ReAct in one process

[[agentic-ai-engineering/03-planning-and-reasoning-algorithms/07-plan-and-execute/07-plan-and-execute|Plan-and-Execute]]
(the reasoning algorithm) and this pattern (the wiring) get conflated because they share a name.
ReAct, run single-agent, interleaves reasoning and action inside **one call shape** — every turn
re-derives "what next" from the full history. Planner–executor front-loads that decision into a
separate call with its own prompt, then holds the executor to the plan until a step signals failure.
Net effect: ReAct re-plans every turn by default; planner–executor re-plans only on explicit signal
— cheaper per step, worse at absorbing a surprise mid-plan that the original plan didn't anticipate.

## Single process vs. two agents

The same planner/executor split can also be wired as two separate agents — a Planner Agent that
emits a plan artifact and hands it to a standalone Executor Agent over a queue or API call. Same
logical roles, very different blast radius:

|                        | Single agent, two LLM calls                                            | Two agents, message-passed                                                            |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| State hand-off         | In-process object — free, synchronous                                  | Serialized plan artifact over a transport — needs a schema, adds latency              |
| Failure isolation      | None — a bad executor turn can corrupt the next planner call's context | Executor crash doesn't touch the planner process                                      |
| Tool/security boundary | Shared — planner technically runs with whatever access the process has | Can be genuinely separated — executor holds scoped credentials the planner never sees |
| Debugging              | One trace, one log stream                                              | Two traces to correlate by run ID                                                     |
| Right call when        | Planning is cheap, steps are homogeneous, no independent scaling need  | Executor needs sandboxed/elevated access, or step volume dwarfs plan volume           |

Default to single-process until there's a concrete reason to cross the boundary — a real security
separation requirement, or executor throughput that needs to scale independently of planning volume.
Splitting for its own sake just buys a serialization format and a new failure mode.

For the applicability decision itself, and how this pattern compares against Router
([[03-router-pattern|Chapter 3]]) and the multi-agent variants, see Part 00 of AI Architecture &
System Design above.
