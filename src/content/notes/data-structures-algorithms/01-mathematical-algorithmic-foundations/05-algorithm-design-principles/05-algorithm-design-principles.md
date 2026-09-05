---
title: "5 — Algorithm Design Principles"
description: "A field guide to recognizing which of the five recurring design paradigms — brute force, divide and conquer, greedy, dynamic programming, backtracking — a new problem is calling for, before you write a line of implementation."
tags: ["data-structures-algorithms","foundations","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-5"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/01-dp-fundamentals/01-dp-fundamentals
    kind: related
  - slug: data-structures-algorithms/09-greedy-algorithms/01-greedy-strategy/01-greedy-strategy
    kind: related
  - slug: data-structures-algorithms/10-backtracking-and-search/01-backtracking/01-backtracking
    kind: related
---

# 5 — Algorithm Design Principles

Parts 07 through 09 of this book teach dynamic programming, greedy algorithms, and backtracking in
real depth — recurrences, exchange-argument proofs, pruning strategies, the works. This chapter
teaches none of that on purpose. Its job is the layer that has to happen _before_ any of it: given a
problem you've never seen, in the first minute of reading it, which of five recurring paradigms
should you even be reaching for. Miscount that step and you can execute the wrong paradigm
flawlessly and still walk out with a solution that's confidently, cleanly wrong — or confidently,
cleanly too slow.

---

## Brute Force: Always the First Question

Brute force means trying every possibility the problem statement admits and checking each one —
correctness by exhaustion, no insight required. Treat it as the first legitimate question on every
problem, not an embarrassing fallback you reach for only after failing to be clever. The question is
mechanical: given the constraints on `N`, does the brute-force complexity actually survive the time
limit? Chapter 2's complexity-ladder rule of thumb answers that in one lookup:

| Constraint on `N` | Complexity that survives  |
| ----------------- | ------------------------- |
| `N` ≤ ~20         | `O(2^N)`, `O(N!)`         |
| `N` ≤ ~500        | `O(N^3)`                  |
| `N` ≤ ~5,000      | `O(N^2)`                  |
| `N` ≤ ~10^6       | `O(N log N)`              |
| `N` ≤ ~10^8       | `O(N)`, tightly           |
| `N` > ~10^8       | `O(log N)` or `O(1)` only |

If `N ≤ 20` and the problem is "does some subset satisfy X," a `2^N` enumeration of every subset is
about a million operations — trivially fast. Ship it. Reaching for dynamic programming here isn't
rigor, it's wasted setup on a problem that was already solved. The same subset-sum shape with `N` in
the thousands makes `2^N` impossible outright, and _that's_ the actual trigger to look for something
smarter — not a stylistic preference for elegant code.

Brute force earns its keep even when it doesn't survive the time limit: it's the reference
implementation every cleverer solution gets checked against on small inputs, and its recursion tree
is diagnostic. Look at the shape of that tree before picking a paradigm:

- Independent branches that never touch each other's work, combined by a cheap final step → **divide
  and conquer**.
- The identical subproblem recomputed across many different branches → **dynamic programming**.
- A step where one choice is provably at least as good as every alternative, with no need to look
  ahead → **greedy**.
- Branches that have to be explored and explicitly abandoned the moment a constraint breaks →
  **backtracking**.

The rest of this chapter is those four bullets, expanded one at a time.

---

## Divide and Conquer

Split the problem into subproblems that are genuinely independent — solving one doesn't require
knowing anything about the other — solve each recursively, and combine the results with a step
that's cheap relative to solving the union from scratch. The recognition signal has two parts, and
both have to hold: the input naturally splits into halves or independent chunks, _and_ the combine
step is cheap. A split with an expensive combine buys nothing — you've just relocated the cost.

Merge sort is the canonical example precisely because both conditions are so clean. Split the array
in half, recursively sort each half (neither half needs to know what the other contains), then merge
two sorted halves in one linear pass:

```
T(n) = 2·T(n/2) + O(n)   →   O(n log n)
```

against insertion sort's brute-force `O(n²)`. The recurrence is the formal signature of "cheap
combine" — the `O(n)` term is the merge step, and it stays linear regardless of how deep the
recursion goes. Full recurrence-solving technique (recursion trees, the master theorem) belongs to
the sorting-and-searching part of this book, where merge sort gets a chapter of its own; the
recognition test here is deliberately just the two conditions above.

---

## Greedy

Make the locally optimal choice at each step and never revisit it — no backtracking over past
decisions, no recomputation, typically one pass after a sort. The recognition signal: sorting the
input by some criterion and scanning it once _looks_ like it produces the right answer, and — this
second half is the one people skip — you can at least informally argue that no other choice at that
step could have led to a strictly better outcome.

That second half is not optional, and skipping it is exactly why **greedy is the paradigm most
likely to produce a plausible-looking wrong answer.** The code is short enough — sort, then one loop
— that it's tempting to trust it the moment it passes your three test cases, and plenty of problems
that look identical in shape to a correct greedy one are actually dynamic programming problems
wearing a greedy disguise.

Interval scheduling is the trap's control group: given a set of intervals, pick the maximum number
that don't overlap. Sort by end time, greedily take the earliest-ending interval that doesn't
conflict with what you've already picked. This is correct, and the argument is short — swapping the
greedy pick for any interval that ends later can only shrink or preserve the room left for the rest
of the schedule, never grow it.

Now change one word: instead of intervals, it's items with weight and value, and instead of "pick as
many as fit," it's "maximize total value in a knapsack of fixed capacity." Sorting by
value-to-weight ratio and greedily taking the best ratio first looks like the exact same move — and
it's provably wrong the instant items are indivisible. It's only correct for the _fractional_
version, where you're allowed to take part of an item. One word in the problem statement — "whole
items only" — flips the correct paradigm from greedy to dynamic programming, and nothing about the
code you'd write for the wrong version signals that it's wrong.

[[01-greedy-strategy|Greedy Strategy]] (Part 09) carries the actual proof obligation this chapter is
flagging but not discharging — the exchange argument, or matroid structure where one applies — for
every greedy claim used later in the book. Until that proof has been done, treat "I sorted it and it
worked on my test cases" as unproven, not as done.

---

## Dynamic Programming

The recognition signal is two properties together: **overlapping subproblems** and **optimal
substructure**. In practice it surfaces one of two ways. Either the brute-force recursion from the
first section recomputes the identical subproblem across many different call paths — the same
`(index, remaining_capacity)` pair reached by several different sequences of choices — or the
problem statement itself is phrased as an aggregation over an exponential decision space: "count the
number of ways to ..." (sum over choices) or "minimum/maximum ... given you must choose at each
step" (min-max over choices). Both phrasings are asking you to fold an exponential tree down to one
answer per distinct state, and memoizing that state is precisely what turns the exponential brute
force into something polynomial.

A minimal example carries the whole idea. Counting the ways to climb `n` stairs taking 1 or 2 steps
at a time recurses as `ways(n) = ways(n-1) + ways(n-2)` — branching exponentially on the surface,
but only `n` distinct states actually exist. Cache each one by its index the first time it's
computed, and every later branch that reaches the same index returns instantly instead of
re-deriving it. That single move — noticing the brute-force tree keeps landing on states it's
already solved, and caching them — is dynamic programming in miniature.

[[01-dp-fundamentals|DP Fundamentals]] (Part 08) is where state definition, recurrence derivation,
and space optimization get the depth this survey deliberately skips.

---

## Backtracking

The recognition signal is phrasing like "generate all ..." or "find whether there exists an
arrangement/assignment satisfying these constraints." Build a candidate incrementally — choose a
next piece, recurse into the rest of the decision, and the moment a partial candidate violates a
constraint, abandon that branch immediately rather than continuing to build on top of a prefix
that's already dead. That early abandonment (pruning) is the entire difference between backtracking
and pure brute force: brute force would generate every complete candidate and check validity only at
the end; backtracking checks validity at every partial prefix and stops extending the instant it's
provably doomed, which prunes enormous swaths of the search tree in practice even though the
worst-case bound doesn't change.

N-Queens is the standard illustration: place queens row by row, and before recursing into the next
row, check the new queen against every column and diagonal already occupied. A conflicting placement
is abandoned right there — it never gets filled out into a complete board first, the way an unpruned
brute-force enumeration would.

[[01-backtracking|Backtracking]] (Part 10) covers the choose-explore-unchoose template and the
pruning strategies that make this tractable on real constraint sizes.

---

## Recognizing Which Paradigm a Problem Wants

The single most useful artifact in this chapter, practically speaking, is mapping the phrasing of a
problem statement to the paradigm(s) it's most likely calling for. Use this as a first hypothesis,
not a verdict — confirm it by tracing the brute-force recursion on a small input before committing
to a full implementation.

| Problem statement phrasing                                          | Likely paradigm                                          | Watch for                                                                                               |
| ------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| "count the number of ways to ..."                                   | Dynamic Programming                                      | overlapping subproblems — trace brute force on a small case first                                       |
| "minimum / maximum number of ways / steps ..."                      | Dynamic Programming                                      | same as above; state definition is the real work                                                        |
| "is it possible to partition into groups satisfying ..."            | Backtracking, sometimes DP                               | small, fixed group count → DP; open-ended groupings → backtracking                                      |
| "return all valid arrangements / combinations / subsets"            | Backtracking                                             | "all" is the tell — DP counts a total, backtracking enumerates each one                                 |
| "maximize/minimize value, choosing a subset under a constraint"     | Dynamic Programming (usually), Greedy (only if provable) | don't default to greedy because sorting looks tempting — prove the exchange argument or fall back to DP |
| "schedule / select non-overlapping intervals to maximize count"     | Greedy                                                   | a genuinely provable greedy — sort by end time                                                          |
| "split the input in half/parts and combine results"                 | Divide and Conquer                                       | only holds if the combine step is cheap relative to solving from scratch                                |
| constraints show `N` is small enough for exponential/factorial work | Brute Force                                              | check this before anything else, regardless of how the phrasing reads                                   |
| "shortest/longest arrangement with heavy per-choice state"          | DP or Backtracking + memo                                | check the complexity ladder against the state space size before assuming it's cheap enough              |

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
