---
title: "Critical Thinking"
description: "The discipline of evaluating whether a claim is actually well-supported — surfacing assumptions, weighing evidence, and checking logical structure — rather than just having an opinion. Nuanced thinking and tailing are two of its component skills."
tags: ["critical-thinking", "reasoning", "mental-models"]
updated: 2026-08-02
hidden: false
zettelId: "202608021430-4"
relations:
  - slug: productivity/reference/nuanced-thinking
    kind: related
  - slug: productivity/reference/tailing-technique
    kind: related
---

Critical thinking is the discipline of evaluating a claim's actual support — its assumptions, its
evidence, its logical structure — before accepting or rejecting it. It's distinct from just "being
smart" or "having strong opinions": someone can be highly intelligent and still accept a
poorly-supported claim because they never checked what it rested on.

---

## Core components

| Component            | What it means                                                           |
| -------------------- | ----------------------------------------------------------------------- |
| Assumption surfacing | Naming the unstated premises a claim depends on                         |
| Evidence evaluation  | Source quality, sample size, recency, conflicts of interest             |
| Logical structure    | Checking the premises actually support the conclusion — no non-sequitur |
| [[nuanced-thinking]] | Holding multiple valid perspectives instead of collapsing to a binary   |
| Falsifiability       | Naming what evidence would change your mind, before you look for it     |

## Common failure modes (biases that bypass the discipline)

- **Confirmation bias** — noticing evidence that supports what you already believe, discounting what
  doesn't.
- **Anchoring** — the first number or framing you hear shapes every subsequent judgment, even when
  it was arbitrary.
- **Availability heuristic** — treating a vivid, easily-recalled example as representative, ignoring
  base rates.
- **Sunk cost** — continuing a decision because of what's already invested, not because of what the
  decision looks like going forward.

## A worked example

**Claim:** "This alert rule has a 40% false-positive rate, so it should be deleted."

**Uncritical acceptance:** delete it.

**Critical thinking applied:**

- _Assumption surfacing:_ "delete it" assumes the alternative is silence — is there a fix that
  lowers the false-positive rate instead of removing the signal entirely?
- _Evidence evaluation:_ is 40% measured over a representative window, or one noisy week?
- _Logical structure:_ a high false-positive rate is a reason to _tune_ the rule; it's only a reason
  to _delete_ it if the true positives it does catch aren't worth the noise — that's a separate
  claim the 40% number alone doesn't establish.

## Disambiguation: critical thinking vs. adjacent skills

| Skill                 | Distinguishing question it asks                       |
| --------------------- | ----------------------------------------------------- |
| Critical thinking     | "Is this claim actually well-supported?"              |
| [[nuanced-thinking]]  | "Are there other valid framings I'm collapsing past?" |
| [[tailing-technique]] | "What has the other person not yet said?"             |

They compose: tailing surfaces the unstated context, nuanced thinking holds it alongside competing
framings, critical thinking is the check on whether the resulting conclusion is actually earned.

## Practicing it

- Before accepting a claim, ask "what would change my mind?" — if nothing would, it's not a belief
  you arrived at critically.
- Separate the fact from the interpretation layered on top of it.
- Ask "compared to what?" — most claims are implicitly comparative and the comparison is often the
  weakest part.
- Notice when you're reasoning toward a conclusion you already wanted, versus reasoning from the
  evidence to wherever it leads.
