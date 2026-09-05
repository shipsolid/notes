---
title: "5 — Fractional Knapsack"
description: "Sorting items by value-to-weight ratio and greedily taking the highest-ratio items first, proven optimal by an exchange argument that only holds because items can be split into arbitrary fractions, and a concrete capacity-50 counter-example where that identical ratio-greedy strategy provably loses to 0/1 knapsack's DP the instant items become indivisible."
tags: ["data-structures-algorithms","greedy","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-74"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/04-knapsack-problems/04-knapsack-problems
    kind: compared_to
  - slug: data-structures-algorithms/09-greedy-algorithms/01-greedy-strategy/01-greedy-strategy
    kind: related
---

# 5 — Fractional Knapsack

[[04-knapsack-problems|Part 08, Chapter 4]] spent an entire chapter establishing why 0/1 knapsack
needs a two-dimensional DP state and a table that explores taking versus skipping every item, item
by item, capacity by capacity. This chapter starts from the same setup — items with a weight and a
value, a knapsack with a fixed capacity, maximize total value — and changes exactly one rule: items
can be split. Take any fraction of an item, from 0% to 100%, and its value scales linearly with the
fraction taken. That single relaxation is enough to collapse the entire two-dimensional search from
that chapter into a single sort: no table, no recurrence, no item-index dimension, just sort by
value density and take greedily. What makes fractional knapsack worth a full chapter isn't the
algorithm, which is short — it's that the identical greedy strategy, applied to the identical items
with the fraction rule removed, produces a demonstrably wrong answer. That gap is this book's
clearest illustration of a problem having optimal substructure without having the greedy-choice
property.

---

## The Problem: What "Fractional" Actually Changes

`n` items, each with a weight `w_i > 0` and a value `v_i > 0`, and a knapsack capacity `W`. Choose a
fraction `f_i ∈ [0, 1]` for every item to maximize `Σ f_i · v_i` subject to `Σ f_i · w_i ≤ W`. 0/1
knapsack is the same objective with `f_i` restricted to `{0, 1}` — take the whole item or none of
it. Fractional knapsack allows any real value in between, and that continuity is not a minor
relaxation; it removes the exact thing that made 0/1 knapsack hard.

[[04-knapsack-problems|Part 08, Chapter 4]] built its state around a decision boundary — `dp[i][w]`
tracks the best achievable value given the first `i` items have each been either taken or skipped,
because once an item is skipped under one capacity path, a different capacity path might still need
to ask "what if it had been taken instead." The DP table's whole job is carrying every one of those
unresolved boundaries forward simultaneously. Fractional knapsack has no such boundary to carry.
There is no moment where an item becomes permanently unavailable — any amount of any item, up to
whatever fraction of it and whatever capacity remain, is always still purchasable. With no discrete
commitment to track, there is nothing for a second state dimension to encode, and the problem
reduces to a question a single number answers on its own: given a fixed amount of capacity, which
item is worth the most per unit of it?

---

## The Greedy Algorithm: Sort by Ratio, Fill Greedily

That per-unit question is the item's **value density**, `v_i / w_i`. The greedy algorithm computes
it once per item, sorts items by it in descending order, and then walks the sorted list taking as
much of each item as capacity allows: the whole item if it fits, whatever fraction of it fits
otherwise, and nothing at all once capacity hits zero.

```python
from dataclasses import dataclass


@dataclass
class Item:
    name: str
    weight: float
    value: float

    @property
    def ratio(self) -> float:
        return self.value / self.weight


def fractional_knapsack(
    items: list[Item], capacity: float
) -> tuple[float, list[tuple[str, float]]]:
    """Greedy fractional knapsack: sort by value/weight ratio descending, fill greedily.

    Returns (total_value, [(item_name, fraction_taken), ...]).
    """
    order = sorted(items, key=lambda it: it.ratio, reverse=True)
    remaining = capacity
    total_value = 0.0
    taken: list[tuple[str, float]] = []

    for item in order:
        if remaining <= 0:
            break
        take_weight = min(item.weight, remaining)
        fraction = take_weight / item.weight
        total_value += fraction * item.value
        taken.append((item.name, fraction))
        remaining -= take_weight

    return total_value, taken
```

Every item is visited exactly once after the sort, in ratio order, and the decision at each item is
a single comparison against remaining capacity — no backtracking, no revisiting an earlier item once
its fraction has been fixed.

### Worked Example

Three items, capacity 50:

| Item | Weight | Value | Ratio (value/weight) |
| ---- | ------ | ----- | -------------------- |
| A    | 10     | 60    | 6.0                  |
| B    | 20     | 100   | 5.0                  |
| C    | 30     | 120   | 4.0                  |

Ratios are already in descending order by coincidence of labeling — A (6.0), then B (5.0), then C
(4.0) — so the sort changes nothing about the input order here, only confirms it. Filling greedily:

| Step | Item | Weight taken | Fraction | Value added | Capacity remaining |
| ---- | ---- | ------------ | -------- | ----------- | ------------------ |
| 1    | A    | 10           | 1.0      | 60          | 40                 |
| 2    | B    | 20           | 1.0      | 100         | 20                 |
| 3    | C    | 20 of 30     | 2/3      | 80          | 0                  |

A and B fit whole; C only has room for 20 of its 30 units of weight, so two-thirds of it comes
along, contributing two-thirds of its value. Total weight used is exactly `10 + 20 + 20 = 50`,
filling the knapsack precisely, and total value is `60 + 100 + 80 = 240`.

```python
>>> items = [Item("A", 10, 60), Item("B", 20, 100), Item("C", 30, 120)]
>>> fractional_knapsack(items, 50)
(240.0, [('A', 1.0), ('B', 1.0), ('C', 0.6666666666666666)])
```

**Complexity:** O(n log n), entirely dominated by the sort on ratio. The fill pass afterward is a
single O(n) linear scan with O(1) work per item — no capacity dimension enters the running time at
all, which is the single biggest practical difference from
[[04-knapsack-problems|Part 08, Chapter 4]]'s O(n × W) pseudo-polynomial DP: fractional knapsack's
cost doesn't care how large the capacity number is, only how many items there are.

---

## Why Greedy Is Optimal Here: The Exchange Argument

The claim to prove: no feasible fractional allocation beats the greedy one. The standard tool is an
**exchange argument** — take an arbitrary optimal (or merely different) solution and show it can be
transformed into the greedy solution through a sequence of local swaps that never decrease total
value. If that's possible, greedy's value is at least as good as every other feasible solution's,
and since greedy is itself feasible, it must be optimal.

Suppose some solution `S` allocates capacity to a lower-ratio item `j` while a higher-ratio item `i`
still has unused weight sitting outside `S`'s allocation — either `i` isn't in `S` at all, or `S`
only took part of it. Shift an arbitrarily small amount of weight `ε` out of `j`'s allocation and
into `i`'s: this is legal as long as `j` currently holds at least `ε` and `i` has at least `ε` of
unused weight remaining, which fractional allocation always permits down to any granularity. The
shift leaves total weight used unchanged — `ε` added to `i`, `ε` removed from `j` — but changes
total value by `ε · (ratio_i − ratio_j)`, which is `≥ 0` precisely because `i` has the higher ratio.
Value never drops, and it strictly increases whenever the ratios differ.

Repeating that shift drains `j`'s allocation into `i` until either `i` is maxed out or `j`'s
allocation reaches zero, and applying the same argument down the full ratio-sorted order — fully
exhaust the top-ratio item before touching the second, fully exhaust the second before touching the
third, and so on — converts any feasible solution into the greedy one without ever lowering its
value. Greedy is therefore an upper bound on every feasible solution's value, and being feasible
itself, it achieves that bound.

The argument leans on one structural fact that's easy to state and easy to walk past: the swap has
to be legal at **any** granularity, right down to an infinitesimally small `ε`. That's only
guaranteed because items are divisible. The moment `ε` has to be an entire item or nothing at all,
there is no guarantee a swap of that size is even available — `j`'s full allocation might be worth
more whole than any partial exchange with `i` could recover in smaller pieces, because there are no
smaller pieces. The next section makes that collapse concrete instead of asserting it.

---

## Why Greedy Fails the Moment Items Become Indivisible

Two items, capacity 50:

| Item | Weight | Value | Ratio |
| ---- | ------ | ----- | ----- |
| X    | 10     | 60    | 6.0   |
| Y    | 50     | 100   | 2.0   |

Run the identical ratio-sort-and-fill strategy, with the only change being that fractions are no
longer legal — each item is taken whole or not at all. Sorted by ratio, X comes first. X fits
(weight 10 ≤ capacity 50), so greedy takes it: value 60, capacity remaining 40. Y is next, but Y's
weight (50) exceeds the remaining capacity (40), and there is no fractional Y available to fill the
gap the way there was in the divisible case — so greedy skips Y entirely. No items remain.
**Greedy's total: 60**, with 40 units of capacity going permanently unused.

The optimal 0/1 answer skips X and takes Y alone: weight 50 fills the capacity exactly, value 100.
**Optimal total: 100** — greedy achieves only 60% of it, and not because of a rounding error or an
edge case. It's a structurally wrong first move: greedy commits to X the instant it sees X has the
higher ratio, and that commitment is irreversible under 0/1 rules in a way it was never irreversible
under fractional rules. The exchange argument's `ε`-shift needed the ability to claw back part of an
allocation and hand it to a higher-ratio item; indivisibility removes exactly that ability.

[[04-knapsack-problems|Part 08, Chapter 4]]'s DP recurrence doesn't have this problem, because it
never commits to either branch — `dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight_i] + value_i)`
computes **both** "skip item `i`" and "take item `i`" at every cell and keeps whichever is larger,
for every capacity, not just the one greedy happens to walk down. Tracing it on these two items:
`dp[0][w] = 0` everywhere. After X (`i = 1`): `dp[1][w] = 60` for every `w ≥ 10`, `0` otherwise.
After Y (`i = 2`), at `w = 50`:
`dp[2][50] = max(dp[1][50], dp[1][50 - 50] + 100) = max(60, dp[1][0] + 100) = max(60, 0 + 100) = 100`.
The DP wins because `dp[1][0]` — the "capacity already exhausted before Y is even considered"
branch, exactly the branch greedy discarded the moment it took X — is still sitting in the table,
available to be compared against directly, instead of having been thrown away by an earlier,
irrevocable choice.

[[01-dp-fundamentals|Part 08, Chapter 1]] separated overlapping subproblems from optimal
substructure as two independent properties a problem needs before DP applies, and 0/1 knapsack has
both — an optimal solution genuinely is assembled from optimal solutions to smaller subproblems,
which is exactly what licenses that `max(...)` recurrence in the first place. What this
counter-example adds is a third, separate axis: **the greedy-choice property**, which
[[01-greedy-strategy|Chapter 1]] names in the abstract as the condition that a sequence of
irrevocable, locally-best choices assembles into a globally optimal answer without ever needing to
be revisited. Fractional knapsack has it — the exchange argument above is the proof, and it works
precisely because "irrevocable" isn't really irrevocable when any allocation can be partially undone
down to an infinitesimal grain. 0/1 knapsack does not have it, despite having optimal substructure:
which of `dp[i-1][w]` or `dp[i-1][w - weight_i] + value_i` is the right smaller subproblem to build
on cannot be decided locally, by ratio alone, the moment "take it" and "don't" are the only two
options and neither can be partially reconsidered later. Optimal substructure is necessary for a DP
recurrence to exist at all; it says nothing about whether committing to one locally-best choice,
once, without a table to fall back on, is safe. Fractional knapsack answers yes. The exact same
items, with one rule removed, answer no — and the 40 units of wasted capacity above is what that
"no" costs in practice.

---

## Choosing Between Fractional Greedy and 0/1 DP

The complexity gap mirrors the correctness gap. Fractional greedy is O(n log n) and doesn't care how
large the capacity is; [[04-knapsack-problems|Part 08, Chapter 4]]'s 0/1 DP is O(n × W) and is only
pseudo-polynomial, growing with the numeric size of the capacity rather than the bit-length needed
to represent it. When the domain is genuinely continuous — fuel, currency, cargo measured by weight,
budget split across line items, CPU time-slicing, bandwidth allocation — fractional greedy isn't an
approximation of the right answer; it **is** the right answer, and it's cheaper to compute than the
DP would be even if the DP were legal to apply. When the domain is atomic — hire this candidate or
don't, schedule this job or don't, fill this discrete cargo container or leave it behind — 0/1 DP
(or, past the sizes where O(n × W) is affordable, its approximation schemes) is required, and
reaching for a ratio-sort on an indivisible-resource problem reproduces the exact 60-versus-100 bug
traced above, just without a name attached to it in the code.

That makes "can this item be split?" the single highest-leverage question to ask before writing a
line of either algorithm, and it's the fastest way an interviewer can tell whether a candidate has
internalized the greedy-choice property or is pattern-matching "sort by ratio" onto anything shaped
like a knapsack. Divisible items: sort by ratio, greedy is provably optimal, done in O(n log n).
Indivisible items: the ratio sort is a fine intuition for which items are individually attractive,
and a completely unreliable guide to which subset is jointly optimal — nothing but exploring both
branches, the way [[04-knapsack-problems|Part 08, Chapter 4]]'s DP table does, closes that gap.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
