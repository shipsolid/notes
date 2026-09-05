---
title: "1 — Sunk Cost Fallacy"
description: "Why continuing a doomed course of action because of what's already been spent is irrational, and the marginal-cost reframe that fixes it."
tags: ["philosophy", "decision-making", "cognitive-bias"]
hidden: false
zettelId: "202607141951"
relations:
  - slug: productivity/08-decision-making/04-decision-journals-in-practice/04-decision-journal-template
    kind: related
---

## Sunk Cost Fallacy

## Definition

The sunk cost fallacy is the tendency to keep investing time, money, or effort into a decision
because of what has _already_ been spent, rather than what the decision will cost or return _from
here_. The money, months, or political capital already spent are gone regardless of what you do next
— they are not a legitimate input to the forward-looking decision, but they feel like one.

## Why It Happens

Two biases compound to produce it:

- **Loss aversion** (Kahneman & Tversky) — abandoning a project registers as a _realized_ loss,
  while continuing lets the loss stay theoretical. People will take on more risk to avoid a certain
  loss than the expected value justifies.
- **Consistency / commitment bias** — having publicly backed a decision (a migration, a hire, a
  vendor) creates pressure to justify the original call rather than reassess it on new evidence.

Together they produce **escalation of commitment**: the more has been spent, the harder it becomes
to stop, exactly backwards from what the math says should happen.

## Where It Shows Up in Engineering

- Continuing a multi-quarter platform migration after the original justification (cost, latency,
  vendor lock-in) has been invalidated by new information, because "we're 80% through."
- Keeping a bespoke in-house tool alive — and staffed — long after a mature open-source or vendor
  alternative would be cheaper, because of the multi-year build investment behind it.
- An on-call engineer spending three more hours on a failing hypothesis before escalating, because
  of the hour already sunk chasing it.
- Refusing to roll back a risky rollout mid-incident because of the effort invested in shipping it,
  instead of evaluating current blast radius against current risk.

## The Fix: Marginal Cost, Not Total Cost

The corrective reframe is to evaluate only the **future** cost and benefit of each option, treating
past spend as zero — economists call this **ignoring sunk costs** and evaluating on marginal
cost/benefit alone. A useful forcing question:

> "If I were deciding today, with zero already spent, would I still choose to start this?"

If the answer is no, the prior spend is not a reason to continue — it's the reason the decision
feels hard, which is a different thing. This is also the discipline behind Bayesian updating: revise
the plan when new evidence arrives, and don't let the size of the prior bet anchor the posterior
belief.

## Interview Framing

This is a strong frame for "tell me about a time you changed direction" behavioral questions and for
system-design tradeoff discussions ("would you keep scaling this architecture or replace it"): name
the sunk cost explicitly, show the marginal-cost reasoning that overrode it, and quantify the blast
radius avoided by stopping early. Interviewers are listening for whether you can kill your own prior
decision when the evidence turns against it — not whether the original decision was right.

## Related

- [[04-decision-journal-template|Decision Journal Template]] — separates process quality from
  outcome quality; the "before" section forces the marginal-cost question above _before_ commitment
  bias can take hold.
- Cognitive Biases Catalog — _(planned)_ — loss aversion, anchoring, and the frequency illusion as a
  broader catalog this fallacy belongs to.
- Decision Frameworks — _(planned)_ — regret minimization and Bayesian updating as the constructive
  counterparts to this failure mode.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | philosophy |
