---
title: "1 — Greedy Strategy"
description: "The greedy-choice property proven by exchange argument instead of assumed on faith, optimal substructure named as the property greedy shares with DP but resolves differently, a canonical coin system proven correct and an adversarial one shown to break the same proof, and 0/1 knapsack as the case where greedy must yield to DP."
tags: ["data-structures-algorithms","greedy","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-70"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/04-knapsack-problems/04-knapsack-problems
    kind: related
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/05-algorithm-design-principles/05-algorithm-design-principles
    kind: related
---

# 1 — Greedy Strategy

[[05-algorithm-design-principles|Part 01, Chapter 5]] named greedy as one of five recognizable
paradigms, gave it the interval-scheduling example where it clearly works and the 0/1-knapsack
example where one word quietly breaks it, and then handed off the actual homework:
"[[01-greedy-strategy|Greedy Strategy]] (Part 09) carries the actual proof obligation this chapter
is flagging but not discharging — the exchange argument, or matroid structure where one applies."
This is that chapter. Everything below answers one question honestly, for any greedy-looking
algorithm: not "does this pass my test cases," but "is there a proof that the locally optimal choice
at each step can never be beaten by looking further ahead" — and what it looks like when that proof
cannot be constructed, because the algorithm you'd get by trying anyway will still compile, still
run, and still be wrong.

---

## What Makes an Algorithm "Greedy"

A **greedy algorithm** builds a solution one decision at a time, and at each step it commits to
whichever available choice looks best _right now_, by some simple local criterion — cheapest edge,
earliest deadline, highest value-to-weight ratio. Once made, that choice is never revisited: no step
later in the algorithm goes back and asks "was that actually the right call, given what I know now."
No backtracking, no exploration of the alternatives passed over, no recomputation. In this respect
greedy is the most modest of this book's paradigms —
[[05-algorithm-design-principles|Part 01, Chapter 5]]'s survey chapter already put it this way:
"typically one pass after a sort."

That modesty is also what separates greedy from its two closest relatives:

- **Dynamic programming** faces the same kind of subproblem at each step, but it doesn't commit — it
  explores _every_ available choice, caches the answer to each resulting subproblem, and only at the
  end picks the combination that turns out best. [[01-dp-fundamentals|Part 08, Chapter 1]] is
  entirely built around that exhaustive-but-memoized shape.
- **Backtracking** commits provisionally, the way greedy does, but keeps the option to undo: the
  moment a partial choice is discovered wrong, it's unwound and a different branch is tried. Greedy
  has no undo at all — by construction, it can't, since revisiting a choice is precisely what greedy
  is defined not to do.

Greedy is therefore the cheapest of the three when it works — one pass, no exploration, no
branching, usually dominated by the cost of an initial sort — and the riskiest to trust blindly,
because nothing about the code distinguishes a greedy algorithm that happens to be correct from one
that is confidently, silently wrong. That distinction lives entirely outside the code, in a proof.

---

## The Greedy-Choice Property: A Claim That Has to Be Proven

A problem has the **greedy-choice property** when a globally optimal solution can be reached by
making a sequence of locally optimal choices — when the choice that looks best at each individual
step is always part of _some_ solution that turns out to be best overall, not merely a
reasonable-looking step that might get overtaken later by a smarter combination the greedy algorithm
never considers.

Read that sentence again with emphasis on "when": the greedy-choice property is a factual claim
about a specific problem, true of some problems and false of others, and writing the greedy loop
doesn't settle which. [[05-algorithm-design-principles|Part 01, Chapter 5]] named exactly this trap:
greedy code is short enough — sort, then one loop — that it's tempting to trust the moment it
survives a few hand-picked test cases, and "plenty of problems that look identical in shape to a
correct greedy one are actually dynamic programming problems wearing a greedy disguise." Passing
three test cases is evidence, not proof. The property has to be established the way any other claim
about a problem's structure gets established: by argument, before the algorithm ships.

### The Exchange Argument

The standard technique for proving the greedy-choice property is the **exchange argument**, and its
shape is the same every time it's used in this book:

1. Suppose, for contradiction (or just for the sake of comparison), that some optimal solution `OPT`
   to the problem does _not_ start with the greedy choice — it makes some other choice at the first
   step instead.
2. Construct a new solution `OPT'` by taking `OPT` and swapping in the greedy choice wherever `OPT`
   made a different one, patching up whatever else needs to change to keep the rest of the solution
   valid.
3. Show that `OPT'` is at least as good as `OPT` — same total cost, or better, never worse.
4. Conclude: since `OPT` was assumed optimal and `OPT'` is at least as good, `OPT'` is also optimal
   — and `OPT'` does start with the greedy choice. So _some_ optimal solution starts with the greedy
   choice, which is exactly the claim.

[[05-minimum-spanning-tree|Part 06, Chapter 5]] already ran this exact pattern for Kruskal's
algorithm: assume the cheapest edge `e` isn't in some minimum spanning tree `T`, note that adding
`e` to `T` creates exactly one cycle, remove any other edge on that cycle instead, and observe the
swap can only decrease the tree's weight because `e` was the single cheapest edge available. That's
steps 1 through 4, verbatim, with "cheapest edge" standing in for "greedy choice." Every exchange
argument in this book, including the coin-change one below, is the same four steps wearing different
variable names.

---

## Optimal Substructure: The Property Greedy Borrows From DP

The exchange argument alone only proves that the greedy choice belongs to _some_ optimal solution —
it says nothing yet about the rest of that solution, the part covering whatever remains after the
greedy choice is fixed. That's where **optimal substructure** does its work, and it's the identical
property [[01-dp-fundamentals|Part 08, Chapter 1]] built its entire chapter around: an optimal
solution to the whole problem can be assembled from an optimal solution to the subproblem left
behind, not just some solution stitched together from some sub-answer.

Greedy and dynamic programming lean on exactly the same structural fact about the problem — optimal
solutions compose from optimal solutions to smaller instances — and differ only in how much of the
choice space they're willing to explore to exploit it. DP, having no exchange argument available (or
not trusting one), keeps every choice's subproblem alive and memoized, and lets the final
combination decide which wins. Greedy, having proven via the exchange argument that one particular
choice can never lose, skips the exploration entirely: it fixes that choice, recurses into the one
remaining subproblem it created, and never looks at the others again. The proof obligation for any
greedy algorithm is therefore always the same pair: (1) the exchange argument, showing the greedy
choice is safe, and (2) optimal substructure, showing that solving what's left optimally really does
combine with the greedy choice into a global optimum. Skip either half and "greedy" stops being a
proof-backed algorithm and becomes a guess with good production values.

---

## Worked Example: Proving Greedy Correct for US Coins

**Problem:** given unlimited coins of denominations `{25, 10, 5, 1}` (quarters, dimes, nickels,
pennies) — US currency — find the fewest coins that sum to a target amount `X`. Greedy's rule:
repeatedly take the largest denomination that doesn't exceed the amount remaining.

```python
def greedy_change(coins: list[int], amount: int) -> list[int]:
    """Fewest-coins-by-construction: always take the largest coin that still fits."""
    coins_desc = sorted(coins, reverse=True)
    used = []
    remaining = amount
    for c in coins_desc:
        count, remaining = divmod(remaining, c)
        used.extend([c] * count)
    return used
```

```python
>>> greedy_change([1, 5, 10, 25], 41)
[25, 10, 5, 1]
```

Four coins for 41 cents — a quarter, a dime, a nickel, a penny. The question this chapter exists to
ask is whether that's actually the fewest possible, not whether it merely looks plausible.

### The Exchange Argument, Applied

Three swaps are available on any collection of dimes, nickels, and pennies, and each one is
individually easy to check: it preserves the total value exactly, and it strictly reduces how many
coins are used.

| Swap                           | Before → After           | Value preserved | Coins saved |
| ------------------------------ | ------------------------ | --------------- | ----------- |
| 5 pennies → 1 nickel           | `1+1+1+1+1 = 5` → `5`    | yes             | 4           |
| 2 nickels → 1 dime             | `5+5 = 10` → `10`        | yes             | 1           |
| 3 dimes → 1 quarter + 1 nickel | `10+10+10 = 30` → `25+5` | yes             | 1           |

Take any solution and apply whichever swap applies, repeatedly. Each application strictly reduces
the total coin count, and coin count is a non-negative integer, so this cannot run forever — it
terminates at a solution no swap can improve: fewer than 5 pennies, fewer than 2 nickels, fewer than
3 dimes — exactly the shape `greedy_change` produces directly, without ever constructing the "bad"
solution first. This is the exchange argument from the previous section, run three times over, once
at each denomination boundary: any solution that disagrees with greedy's choice at some step can be
swapped, without ever making the coin count worse, into one that agrees — so an optimal solution
exists that matches greedy step for step. Combined with optimal substructure — the amount remaining
after taking a coin is itself a smaller instance of the identical problem — induction on the amount
finishes the argument: greedy is optimal for every `X`, not just the ones checked by hand.

**Complexity:** `greedy_change` is `O(k log k)` for the initial sort of `k` denominations (a
constant here, since the coin set is fixed) plus `O(k)` for the pass over denominations —
effectively `O(1)` per call for a fixed currency, independent of the amount `X`. Compare that to the
DP formulation of the same problem in [[04-knapsack-problems|Part 08, Chapter 4]], which costs
`O(k · X)` because it can't assume anything about which coin system it's given — the entire value of
proving the greedy-choice property up front is that it buys back exactly that gap.

### Why Canonical Coin Systems Aren't All Coin Systems: `{1, 3, 4}`

The swaps above are specific to `{1, 5, 10, 25}` — they exist because 5 pennies happen to equal a
nickel, 2 nickels happen to equal a dime, and so on. Nothing in the definition of "greedy coin
change" guarantees a coin system has swaps like that available, and `{1, 3, 4}` making change for
`6` is the standard demonstration that it can fail outright, not just get slower.

```python
>>> greedy_change([1, 3, 4], 6)
[4, 1, 1]
```

Three coins. But `[3, 3]` also sums to 6, using only two. Greedy's first move — take the largest
coin that fits, 4 — is the entire problem: once 4 is spent, only `{1, 3, 4}` remain to cover the
leftover 2, and no combination reaches 2 in fewer than two coins (`1+1`), because 3 and 4 both
overshoot it. The exchange argument from the coin-change proof above cannot be run here, and it's
worth seeing exactly where it breaks rather than just asserting that it does: step 2 needs a way to
swap the greedy choice into _some_ optimal solution without increasing the coin count. For `X = 6`,
the unique optimal solution is `{3, 3}` — and it contains no 4 at all. There is no rearrangement of
`{3, 3}` that inserts a 4 without changing what it sums to. The greedy-choice property is not merely
hard to prove for `{1, 3, 4}` — it's false: the greedy choice is not part of _any_ optimal solution
for this amount. [[04-knapsack-problems|Part 08, Chapter 4]] solves this exact instance correctly —
`coin_change_fewest([1, 3, 4], 6)`, returning `(2, [3, 3])` — using the DP formulation that explores
every combination instead of committing to one: exhaust the choices when there's no proof that
committing to one is safe.

---

## When Greedy Fails and DP Is Required: 0/1 Knapsack

Coin change failing on an adversarial coin system might look like a contrived edge case built to
make a point. **0/1 knapsack** is the canonical counter-example that shows up unprompted, not
manufactured for the lesson: given items with weights and values and a capacity limit, choose a
subset maximizing total value without exceeding capacity, taking each item whole or not at all.
[[05-algorithm-design-principles|Part 01, Chapter 5]] already flagged the shape of the trap —
interval scheduling is genuinely greedy-correct, and 0/1 knapsack "looks like the exact same move"
but "it's provably wrong the instant items are indivisible."

Concretely, three items and a capacity of 50:

| Item | Weight | Value | Value / Weight |
| ---- | ------ | ----- | -------------- |
| A    | 10     | 60    | 6.0            |
| B    | 20     | 100   | 5.0            |
| C    | 30     | 120   | 4.0            |

Greedy by value-to-weight ratio, descending: take A (weight 10, value 60, capacity left 40), take B
(weight 20, value 100, capacity left 20), C needs 30 and only 20 remains — skip. **Greedy total:
160**, using 30 of the 50 available capacity. But B and C together weigh exactly 50 and are both
individually legal to take whole: **220**. Greedy's ratio-first choice (A) isn't wrong in isolation
— it just occupies capacity that a different, lower-ratio pairing needed more.

This is where the exchange argument's mechanics break, not just its conclusion. The MST and
coin-change proofs both relied on trading a fraction of a resource — one edge off a cycle, some
pennies for a nickel — without disturbing anything else. 0/1 knapsack's "whole items only" rule
removes exactly that lever: there is no way to trade "a little of C" for "a little more room,"
because items can't be split. [[04-knapsack-problems|Part 08, Chapter 4]] works through the full DP
formulation this problem needs — a two-dimensional state over items considered and capacity
remaining — precisely because greedy's local ratio comparison can never see that skipping A entirely
is what makes room for the better pair. **[[05-fractional-knapsack|Chapter 5]]** of this Part covers
the version where items _can_ be split, where the exchange argument goes through cleanly and the
ratio-greedy strategy above is provably optimal. The single word separating a correct greedy
algorithm from a wrong one here is "whole."

---

## Recognizing When Greedy Applies: A Checklist

Three questions, in order, on every problem that looks like it might be greedy:

1. **Can you state the greedy choice precisely?** Not "sort by something reasonable," but the exact
   local criterion — earliest end time, cheapest edge, largest coin — and the exact rule for
   applying it.
2. **Can you run an exchange argument to completion?** Take an arbitrary optimal solution that
   disagrees with the greedy choice, and construct one that agrees without increasing cost. If a
   specific structural feature of the problem — items are indivisible, the coin denominations don't
   nest cleanly — blocks the swap, that block is the proof the greedy-choice property fails, not an
   obstacle to push past.
3. **Does what's left after the greedy choice have optimal substructure?** Confirm the remaining
   subproblem is a smaller instance of the identical problem, so induction on size can close the
   argument the way it did for coins.

Yes to all three, and greedy is provably correct, not just fast — the proof is the only thing
separating it from a plausible-looking guess. A no anywhere, especially at question 2, is the signal
[[05-algorithm-design-principles|Part 01, Chapter 5]] described from the other direction: the
problem is "a dynamic programming problem wearing a greedy disguise," and
[[01-dp-fundamentals|Part 08, Chapter 1]] or [[04-knapsack-problems|Part 08, Chapter 4]]'s
exhaustive, memoized exploration is the fallback that doesn't need the swap to exist at all.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
