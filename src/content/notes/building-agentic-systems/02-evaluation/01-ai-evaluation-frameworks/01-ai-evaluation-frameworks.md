---
title: "1. AI Evaluation Frameworks"
description: "The metrics that actually define a good agent -- task success rate, cost per successful task, groundedness, and tool-call correctness -- why generic LLM benchmarks don't transfer to agent evaluation, and the LLM-as-judge pattern's known failure modes."
tags: ["building-agentic-systems", "evaluation", "book"]
hidden: false
zettelId: "202608101824-12"
relations:
  - slug: production-agent-systems/01-observability/02-agent-tracing/02-agent-tracing
    kind: depends_on
  - slug: agentic-ai-engineering/04-tools-and-environment-interaction/01-tool-calling-architecture/01-tool-calling-architecture
    kind: related
  - slug: ai-foundations/01-language-models-in-practice/08-hallucination-management/08-hallucination-management
    kind: related
  - slug: ai-foundations/00-foundations-of-modern-ai/09-reasoning-models/09-reasoning-models
    kind: related
---

## AI Evaluation Frameworks

> Chapter of [[building-agentic-systems/readme#02 — Evaluation|Evaluation]], part of
> [[building-agentic-systems/readme|Building & Evaluating Agents]].

## What you will understand at the end

- Why this Part sits before Agent Frameworks (Part 03) rather than after it, and what breaks if you
  get the ordering backwards
- The four metrics that actually define a good agent, and why each one is harder to compute than it
  sounds — most notably why "cost per call" and "cost per successful task" are different numbers
  that can move in opposite directions
- Why a generic LLM benchmark score tells you almost nothing about whether your agent will complete
  its task
- The LLM-as-judge pattern, mechanically, and its two dominant failure modes — judge bias and
  run-to-run inconsistency — with the mitigations that actually reduce them versus the ones that
  just make you feel better
- How this chapter's metrics split into two different measurement disciplines —
  [[03-online-evaluation|Online Evaluation]] and [[04-offline-evaluation|Offline Evaluation]] — and
  why the same metric name means a structurally different measurement in each

---

## Why this Part moved before Agent Frameworks

The original draft of this book's table of contents put Evaluation after Agent Frameworks — learn
LangGraph, CrewAI, the Anthropic SDK, then figure out how to tell if what you built is any good.
That ordering is backwards, and it's backwards in a way that costs real engineering time, not just
pedagogical tidiness.

Here's the failure mode it produces: a team picks LangGraph because it has the most GitHub stars,
builds a multi-step research agent on it, ships it, and three weeks later gets asked "is this thing
actually working?" — and has no answer, because nobody defined what "working" means before the
framework decision consumed the first month. The framework choice didn't cause the problem, but it
absorbed the attention that should have gone to defining success first. Worse, some of that
framework's defaults — how it truncates history, how it retries a failed step, whether it exposes a
built-in tracing hook — quietly become your evaluation infrastructure's constraints, because nobody
was holding a metrics spec against which to evaluate the framework's fit before the sunk cost set
in.

The corrected ordering: decide what "good" means for your agent — the metrics in this chapter — then
compare frameworks (Part 03) against how well each one lets you _measure_ those metrics, not just
how well each one lets you _build_. A framework that makes step-level tracing an afterthought is a
worse fit for a high-stakes agent than one with a slightly clunkier planning API, and you can't make
that tradeoff call without the metrics defined first. This is the same "define the contract before
you fill in the internals" discipline applied one level up — it's the reason
[[building-agentic-systems/00-building-single-agent-systems/09-production-ready-agent-design|Production-Ready Agent Design]]
(Part 00) treats observability hooks as a first-class item in the production checklist, not
something bolted on after ship.

---

## The metrics that actually define a good agent

"Did it respond?" is not a success metric. An agent that returns a fluent, well-formatted,
completely wrong answer passes every naive check — valid JSON, no exception thrown, response latency
under budget — while failing the only thing that matters: did it do the thing the user asked for.
The metrics below are the ones that survive contact with a real production agent.

### Task success rate

The core metric, and the hardest one to get right, because "success" has to be defined per task
family before you can measure it at all. Three sub-questions collapse into this one number and each
one is a real design decision:

| Question                   | Why it's hard                                                                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| What counts as "the task"? | A multi-step agent run might partially succeed — 4 of 5 sub-tasks completed. Is that a success, a partial credit, or a failure? Pick one and be consistent, because it changes every downstream trend line.                                                         |
| Who judges success?        | Exact-match against a golden answer works for narrow tasks (SQL generation, structured extraction). Open-ended tasks (research summaries, code review) need either human labeling or LLM-as-judge — see below — and each carries a different cost and bias profile. |
| Over what population?      | Success rate on your curated golden set and success rate on live traffic diverge, often sharply, because live traffic contains inputs your golden set never anticipated. This is exactly the gap [[04-offline-evaluation                                            | Offline Evaluation]] and [[03-online-evaluation | Online Evaluation]] each measure — from opposite ends. |

The trap: teams report a single success-rate number and treat it as stable. It isn't. Success rate
is a function of task-family mix, and if the mix of incoming requests shifts — more edge cases, a
new user segment, a product feature that routes harder queries to the agent — the number moves for
reasons that have nothing to do with a regression in the agent itself. Segment the metric by task
family from day one, or you will spend an incident chasing a "regression" that's actually a traffic
mix shift.

### Latency

Standard p50/p95/p99, but with an agent-specific wrinkle: total latency for a multi-step agent run
is the sum of every LLM call and every tool call in the trajectory, and a single slow tool call
three steps into a plan a user is waiting on synchronously degrades the experience identically to a
slow first-token response — but shows up nowhere in a naive "response time" dashboard that only
measures the outer request. Break latency down by phase (planning, per-tool-call, generation) or
you'll optimize the wrong 20% of the critical path.
[[production-agent-systems/01-observability/02-agent-tracing|Agent Tracing]] (Part 01 of Production
Agent Systems) is the instrumentation layer that makes this breakdown possible — you can't compute
per-phase latency from a metric that only ever sees the outer span.

### Cost per successful task, not cost per call

This is the metric most teams get structurally wrong, and it's worth stating the failure mode
explicitly because the naive version actively points you in the wrong direction.

Cost per LLM call is cheap to compute and easy to put on a dashboard — sum the token spend, divide
by call count. But it rewards exactly the wrong behavior: an agent that gives up after one cheap,
low-effort attempt looks _better_ on cost-per-call than one that retries with a stronger model,
replans after a failed step, or does the extra tool call that actually grounds the answer. The agent
that tries harder and succeeds costs more per call and less per outcome — and cost-per-call cannot
see that difference, because it has no concept of outcome in the denominator.

```txt
Agent A: 1 call,  $0.02,  fails the task           → cost/call: $0.02   cost/success: undefined (∞)
Agent B: 4 calls, $0.11,  succeeds (replan + retry) → cost/call: $0.0275 cost/success: $0.11
```

Agent A wins on cost-per-call and is worthless. The metric that matters divides total spend by
_successful_ task completions, not by call count — which means cost per successful task is not
computable without task success rate already being tracked, and the two metrics have to be reported
together or the cost number is actively misleading on its own. This is also the metric that connects
straight into
[[production-agent-systems/03-performance-and-cost-engineering/08-cost-engineering|Cost Engineering]]
(Part 03 of Production Agent Systems) and the executive framing in
[[08-ai-economics-and-roi|AI Economics & ROI]] (Part 01 of Agentic AI: Projects & Engineering
Mastery) — "the agent costs $0.11 per call" is not a number a VP can act on; "the agent costs $0.11
per successfully completed ticket, versus $4.50 for a human agent" is.

### Groundedness / hallucination rate

What fraction of the agent's claims are actually supported by retrieved context, tool output, or
verifiable fact, versus fabricated. This overlaps with but is narrower than the mitigation
strategies in
[[ai-foundations/01-language-models-in-practice/08-hallucination-management|Hallucination Management]]
(Part 01 of AI & LLM Foundations) — that chapter covers _why_ hallucination happens and how to
suppress it at the model and retrieval layer; this metric is the measurement you'd use to know
whether those mitigations are actually working in production, and to catch regression when a prompt
change or model swap quietly degrades groundedness without moving task success rate at all (a
plausible-sounding wrong answer can still "succeed" against a loose success-rate rubric).

Computing this at scale is itself an LLM-as-judge problem in most pipelines — a human can't
fact-check every production trace — which is exactly why the failure modes in the next section
matter here specifically.

### Tool-call correctness rate

For a tool-using agent, this decomposes into at least three separately-trackable sub-metrics,
because they fail independently and point at different root causes:

| Sub-metric              | What it catches                                                                                | Typical root cause when it's low                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Tool selection accuracy | Did the agent call the right tool for the situation?                                           | Ambiguous or overlapping tool descriptions — see the description-quality point in [[building-agentic-systems/00-building-single-agent-systems/01-agent-architecture | Agent Architecture]] Component 2                       |
| Argument correctness    | Did it populate the right parameters, correctly typed and scoped?                              | Schema too permissive, or the model hallucinating a plausible-but-wrong parameter value                                                                             |
| Result utilization      | Did the agent actually use the tool's output correctly in its next step, or ignore/misread it? | Context assembly dropping or truncating the tool result before the next LLM call — see [[agentic-ai-engineering/06-context-engineering/01-context-assembly          | Context Assembly]] (Part 06 of Agentic AI Engineering) |

[[agentic-ai-engineering/04-tools-and-environment-interaction/01-tool-calling-architecture|Tool Calling Architecture]]
(Part 04 of Agentic AI Engineering) covers the mechanics these metrics are scored against — you need
the schema and the structured call/result shape defined before "was this call correct" is even a
well-formed question.

---

## Why generic LLM benchmarks don't transfer

MMLU, HellaSwag, HumanEval, GSM8K — the benchmark suite every model card publishes — measure a
model's standalone capability on a fixed, single-turn task with no tools, no memory, and no
environment. That's a real and useful signal for _model selection_: it tells you whether Model A
reasons better than Model B in isolation. It tells you almost nothing about whether an _agent_ built
on Model A will complete a real task, for three structural reasons:

1. **Benchmarks are single-turn; agents are trajectories.** A model that scores well on GSM8K
   answers one math problem correctly in one shot. An agent task requires the model to make a
   _correct decision at every step of a multi-step trajectory_, where an early wrong turn (a bad
   tool call, a plan that doesn't account for a missing precondition) compounds instead of averaging
   out. High single-turn accuracy does not imply low compounding-error risk across ten sequential
   decisions — these are different statistical objects.
2. **Benchmarks have no tools or environment.** Nothing in MMLU tests whether a model correctly
   selects between fifteen overlapping internal tools, correctly parses a malformed API response, or
   recovers gracefully when a tool call times out. Those are exactly the failure modes
   [[ai-foundations/01-language-models-in-practice/09-ai-failure-modes|AI Failure Modes]] (Part 01
   of AI & LLM Foundations) catalogs, and none of them are exercised by a static benchmark question.
3. **Benchmarks measure the model, not your system.** Your prompt, your tool descriptions, your
   context assembly, your retry policy — all of it sits between "the model" the benchmark scored and
   "the agent" your users interact with. A benchmark regression tells you the provider changed
   something; it says nothing about whether _your_ agent's task success rate moved, because your
   agent's behavior is a function of the whole system, not the model in isolation.

This is the direct motivation for [[02-benchmarks|Benchmarks]] (Chapter 2) — a _standing_ benchmark
suite built from your own task distribution, re-run against every model or prompt change,
specifically so you can separate "the provider silently changed model behavior underneath me" from
"my own prompt or tool change caused a regression." Generic public benchmarks can't do that
separation for you because they were never measuring your system to begin with. See also
[[ai-foundations/00-foundations-of-modern-ai/09-reasoning-models|Reasoning Models]] (Part 00 of AI &
LLM Foundations) for the adjacent point that a reasoning model's benchmark gains often come from
inference-time compute the benchmark doesn't price — the same disconnect between "benchmark score"
and "cost/latency the agent actually pays," approached from the model-architecture side instead of
the agent-evaluation side.

---

## The LLM-as-judge pattern

For open-ended outputs — a research summary, a customer support response, a code review comment —
there's usually no exact-match ground truth to compare against. The dominant workaround is
**LLM-as-judge**: use a second LLM call, given the task, the agent's output, and a rubric, to score
the response.

```txt
Judge prompt (conceptual):
  Task: {original task description}
  Agent output: {response to evaluate}
  Rubric: score 1-5 on groundedness, completeness, and tone.
  Cite the specific span of the output that supports each score.

Judge output:
  { "groundedness": 4, "completeness": 3, "tone": 5, "rationale": "..." }
```

This is the same LLM-as-judge mechanic
[[production-agent-systems/02-reliability-security-and-governance/12-rollback-strategies|Rollback Strategies]]
(Part 02 of Production Agent Systems) uses to gate a canary rollout on evaluation regression, and
the one [[03-online-evaluation|Online Evaluation]] (Chapter 3) applies continuously to live traffic.
It's powerful because it scales to open-ended output where exact-match can't reach — but it inherits
real, well-documented failure modes that a naive implementation will not catch on its own.

### Failure mode 1 — judge model bias

The judge is itself an LLM, with the same systematic biases research on LLM evaluation has
repeatedly surfaced:

- **Self-preference bias** — a judge model tends to score outputs from its own model family higher
  than functionally equivalent outputs from a different provider, which is a serious confound if
  you're using an LLM-as-judge to _compare_ candidate models across providers.
- **Verbosity bias** — longer, more elaborately hedged answers tend to score higher independent of
  actual correctness, because the judge is pattern-matching on the surface features of a "thorough"
  answer.
- **Position bias** — in pairwise comparison setups ("which of these two responses is better"), the
  judge shows a measurable preference for whichever response is presented first (or, less commonly,
  second), independent of content.

Mitigations that actually move the needle: use a judge model from a _different_ family than the one
being evaluated where cross-provider comparison matters; randomize response order in pairwise setups
and average both orderings; and — the highest-leverage single fix — anchor the rubric with a small
set of human-labeled reference examples the judge can be calibrated against, rather than trusting a
bare rubric description to produce a stable scoring distribution on its own.

### Failure mode 2 — inconsistency across runs

LLM-as-judge scoring is not deterministic even at temperature 0 in practice, and re-scoring the
identical (task, output) pair can produce a materially different score on a second pass. This
matters concretely: if your regression gate is "block deploy if the average judge score drops by
more than 0.2," and judge-scoring noise on an unchanged system is itself ±0.3, that gate will fire
on noise as often as it fires on real regressions — which is exactly the
false-positive-alert-fatigue problem familiar from any paging system, just relocated into a CI gate
instead of an on-call rotation.

Mitigations: score each output multiple times and report the distribution, not a single value; treat
judge score movement as signal only above a threshold calibrated against the _measured_ noise floor
of your specific judge setup, not a value picked because it looked reasonable; and where the
decision is high-stakes (a production rollback gate, not a dashboard trend line), keep a
human-labeled sample running in parallel as ground truth the judge's drift can be checked against
periodically — an LLM judge that's never re-validated against a human baseline can drift silently
for months.

**The honest bottom line:** LLM-as-judge is the only practical way to score open-ended agent output
at production scale, and it is also a noisy, biased instrument that needs the same skepticism you'd
apply to any single, uncalibrated sensor. Use it, but never make it the sole gate on a decision
you'd regret getting wrong, and always know its noise floor before you set a threshold against it.

---

## How these metrics feed Online vs. Offline Evaluation

The four metrics above aren't measured the same way twice — they split into two different
measurement disciplines that this Part treats as separate chapters precisely because the engineering
problem each one solves is different, not because the metrics themselves change name.

|                                          | [[03-online-evaluation                                                                                                                | Online Evaluation]] (Ch. 3)                                                                                     | [[04-offline-evaluation | Offline Evaluation]] (Ch. 4) |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------- |
| **What it measures against**             | Live production traffic, real user inputs                                                                                             | A held-out golden dataset, curated and versioned                                                                |
| **When it runs**                         | Continuously, in production                                                                                                           | Before deploy, in CI, on a candidate change                                                                     |
| **Task success rate becomes**            | An implicit-feedback proxy — retries, thumbs-down, session abandonment — since there's rarely a ground-truth label for a live request | A hard pass/fail against a known-correct golden answer, since the dataset was built with ground truth in mind   |
| **Cost per successful task becomes**     | A real, billable production number, tracked as an SLI over time                                                                       | A projected cost from a fixed-size eval run — directional, not your actual production spend                     |
| **Groundedness / judge scoring becomes** | Sampled — you can't judge-score every production trace at the volumes agents run at, so you score a statistically meaningful sample   | Exhaustive over the golden set, since it's small and fixed by design                                            |
| **What a regression means**              | Something changed in the live environment or user population — or a real bug shipped and is actively affecting users right now        | A candidate change (prompt, model, tool) is worse than baseline _before_ it reaches a single real user          |
| **Primary failure it catches**           | Silent production drift nothing in CI could have predicted — a provider model update, a data distribution shift                       | A regression a code/prompt review would miss, caught before it costs a single dollar of production blast radius |

Neither replaces the other. Offline evaluation is a regression gate — it tells you a candidate
change didn't get worse against known cases, but golden sets go stale and can't anticipate every
input shape live traffic will throw at the agent. Online evaluation is a production sensor — it sees
real traffic but by the time it detects a regression, real users already hit it. The standing
benchmark suite from Chapter 2 sits alongside both: it isolates provider-caused drift from
your-own-change-caused drift, a distinction neither online nor offline evaluation gives you on its
own since both would just show "scores got worse" without telling you _why_.

**The telemetry substrate underneath all three:** none of task success rate, cost per successful
task, groundedness, or tool-call correctness is computable without instrumentation that captures the
full trajectory — every LLM call, every tool call, every intermediate result — as it happens.
[[production-agent-systems/01-observability/02-agent-tracing|Agent Tracing]] and
[[production-agent-systems/01-observability/03-token-metrics|Token Metrics]] (Part 01 of Production
Agent Systems) are where that capture actually gets built; this chapter defines the scores, Part 01
of Production Agent Systems is the plumbing those scores are computed _from_. Get the ordering
backwards — try to bolt evaluation onto an agent with no tracing — and you'll find yourself unable
to compute even task success rate at the step level, only at the final-answer level, which throws
away exactly the trajectory detail that made agent evaluation harder than benchmark evaluation in
the first place.

---

## Concept check

| Question                                                                                                                     | Answer hint                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Why does Evaluation sit before Agent Frameworks in this book's ordering?                                                     | You need a definition of "good" before you can meaningfully compare frameworks against how well each one lets you measure it — otherwise the framework choice consumes the attention that should define success first |
| Why is cost per successful task a different number from cost per call, and why does it matter which one you optimize?        | Cost-per-call rewards an agent that gives up cheaply; cost-per-successful-task is the number that reflects real production economics, and the two can move in opposite directions                                     |
| Why don't MMLU/HumanEval-style benchmarks transfer to agent evaluation?                                                      | They're single-turn, tool-free, and measure the model in isolation — not the compounding, multi-step, tool-using trajectory an agent actually executes                                                                |
| What are the two dominant LLM-as-judge failure modes?                                                                        | Judge model bias (self-preference, verbosity, position bias) and run-to-run scoring inconsistency even at temperature 0                                                                                               |
| What's the single highest-leverage mitigation for judge bias?                                                                | Anchor the rubric with human-labeled reference examples rather than trusting a bare rubric description                                                                                                                |
| How does "task success rate" differ structurally between online and offline evaluation?                                      | Offline: hard pass/fail against a known golden answer. Online: an implicit-feedback proxy, since live requests rarely carry a ground-truth label                                                                      |
| What does Part 01 of Production Agent Systems (Observability) provide that this chapter's metrics can't be computed without? | Trajectory-level tracing — every LLM and tool call captured as it happens — without which you can only score the final answer, not the steps that produced it                                                         |

---

## Vocabulary glossary

| Term                       | Definition                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Task success rate          | The fraction of agent runs that achieve the defined goal, scoped per task family and judged consistently (exact-match, human, or LLM-as-judge) |
| Cost per successful task   | Total spend divided by successful completions, not by call count — the metric that doesn't reward giving up cheaply                            |
| Groundedness               | The fraction of an agent's claims actually supported by retrieved context or tool output, as opposed to fabricated                             |
| Tool-call correctness rate | The composite of tool selection accuracy, argument correctness, and result utilization for a tool-using agent                                  |
| LLM-as-judge               | Using a second LLM call, given a rubric, to score an agent's open-ended output where no exact-match ground truth exists                        |
| Self-preference bias       | A judge model's tendency to score outputs from its own model family more favorably                                                             |
| Position bias              | A judge's measurable preference for whichever response is presented first (or second) in a pairwise comparison, independent of content         |
| Golden dataset             | A curated, versioned, held-out set of tasks with known-correct answers, used for offline evaluation and regression gating                      |
| Standing benchmark suite   | A benchmark built from your own task distribution, re-run on every model/prompt change to separate provider drift from your own regressions    |

## Metadata

|        |                          |
| ------ | ------------------------ |
| Author | Amit Singh               |
| Scope  | building-agentic-systems |
