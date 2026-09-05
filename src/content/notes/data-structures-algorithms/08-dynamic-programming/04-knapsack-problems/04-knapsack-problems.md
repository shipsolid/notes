---
title: "4 — Knapsack Problems"
description: "0/1 knapsack's two-dimensional state and transition, derived and traced on a worked table with item reconstruction, the 1D rolling-array collapse where iteration direction over capacity is the entire difference between 0/1 and unbounded knapsack, and the subset-sum / partition-equal-subset-sum problems that specialize the same transition."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-64"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/03-tabulation/03-tabulation
    kind: depends_on
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
---

# 4 — Knapsack Problems

Every DP problem this Part has covered so far tracks one thing per state: how much of the input has
been consumed, or how much of some running quantity remains. 0/1 knapsack is the first problem where
a single number stops being enough. Given a set of items — each with a weight and a value — and a
capacity limit, choose a subset that maximizes total value without exceeding the capacity, using
each item at most once. The tempting first guess at a state is "how much capacity is left." It's
wrong, and it's wrong in exactly the shape [[01-dp-fundamentals|Part 08, Chapter 1]] warned about:
state definition is the hard part, and the warning example there was needing an extra dimension — a
`(X, K)` state instead of just `X` — the instant a constraint like "at most K coins" enters the
picture. Knapsack is that warning's actual payoff, not a hypothetical. "Capacity remaining" alone
can't answer "is item 7 still available to take," because that depends on whether item 7 has already
been decided on — a fact capacity alone doesn't encode. The state has to carry both: capacity
remaining, **given** a decision boundary over which items have already been considered. Drop that
second dimension and, as this chapter shows concretely rather than just asserts, the DP silently
starts solving a different problem than the one that was asked.

---

## 0/1 Knapsack: State, Transition, Base Case

**State:** `dp[i][w]` = the maximum total value achievable by choosing among the first `i` items
(items indexed `1..i` in whatever fixed order they're listed), given a capacity budget of `w`. Two
independent axes, exactly as the opening argued: `i` is "how far into the decision process am I,"
`w` is "how much room is left."

**Transition:** for item `i`, there are exactly two options, and `dp[i][w]` takes the better of
whichever are legal:

- **Skip item `i`.** The best achievable value is whatever was already achievable using the first
  `i-1` items at the same capacity: `dp[i-1][w]`.
- **Take item `i`** — legal only if `weight[i] <= w`, since the item has to physically fit. The best
  achievable value is item `i`'s own value plus the best achievable value from the first `i-1` items
  at the _reduced_ capacity `w - weight[i]`: `dp[i-1][w - weight[i]] + value[i]`.

```
dp[i][w] = dp[i-1][w]                                            if weight[i] > w
dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight[i]] + value[i])    otherwise
```

**Base case:** `dp[0][w] = 0` for every `w` — with zero items available, no value is achievable, no
matter how much capacity sits unused.

### The Full 2D Table, Traced

Filled in the dependency order [[03-tabulation|Chapter 3]] established: row `i` only ever reads row
`i-1`, so rows fill top to bottom, and within a row, columns can fill in any order — `dp[i][w]`
never depends on `dp[i][w']` for a different `w'`.

```python
def knapsack_01_table(weights: list[int], values: list[int], capacity: int) -> list[list[int]]:
    """Build the full dp[i][w] table: max value using the first i items, capacity w."""
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        wt, val = weights[i - 1], values[i - 1]
        for w in range(capacity + 1):
            dp[i][w] = dp[i - 1][w]                              # skip item i
            if wt <= w:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - wt] + val)  # take item i
    return dp
```

Five items, capacity 10:

| Item | Weight | Value |
| ---- | ------ | ----- |
| A    | 2      | 3     |
| B    | 3      | 4     |
| C    | 4      | 5     |
| D    | 5      | 6     |
| E    | 9      | 10    |

Running `knapsack_01_table([2,3,4,5,9], [3,4,5,6,10], 10)` produces, filled top to bottom:

| `i` (items so far) | w=0 | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  |
| ------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (none)           | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| 1 (+A)             | 0   | 0   | 3   | 3   | 3   | 3   | 3   | 3   | 3   | 3   | 3   |
| 2 (+B)             | 0   | 0   | 3   | 4   | 4   | 7   | 7   | 7   | 7   | 7   | 7   |
| 3 (+C)             | 0   | 0   | 3   | 4   | 5   | 7   | 8   | 9   | 9   | 12  | 12  |
| 4 (+D)             | 0   | 0   | 3   | 4   | 5   | 7   | 8   | 9   | 10  | 12  | 13  |
| 5 (+E)             | 0   | 0   | 3   | 4   | 5   | 7   | 8   | 9   | 10  | 12  | 13  |

`dp[5][10] = 13` is the answer. Notice row 5 is identical to row 4 — adding E to the pool of
available items changed nothing about the best value reachable at any capacity, including 10. E has
the single highest per-item value (10) of anything on the list, and it still isn't part of the
optimal set, which is exactly why reconstruction, not just the max value, is worth walking through.

### Reconstructing the Chosen Items

The number 13 alone doesn't say which items produced it. Reconstruction walks backward through the
table from `dp[n][capacity]` and asks, at each step, the same question the transition asked forward:
did item `i` get taken? The test is `dp[i][w] != dp[i-1][w]` — if adding item `i` to the pool
changed the achievable value at this cell, item `i` must be part of the choice that produced it; if
the value is unchanged, the optimal choice at that cell ignored item `i` and skip is the answer.

```python
def reconstruct_items(dp: list[list[int]], weights: list[int], capacity: int) -> list[int]:
    """Walk backward through the table to recover which item indices were taken."""
    n = len(weights)
    chosen = []
    w = capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:      # value changed => item i-1 was taken
            chosen.append(i - 1)
            w -= weights[i - 1]
    chosen.reverse()
    return chosen
```

Walking it by hand, starting at `i = 5, w = 10`:

| Step | Item (i, weight, value) | `w` | `dp[i][w]` | `dp[i-1][w]` | Changed? | Decision | `w` after |
| ---- | ----------------------- | --- | ---------- | ------------ | -------- | -------- | --------- |
| 1    | E (5, wt 9, val 10)     | 10  | 13         | 13           | no       | skip E   | 10        |
| 2    | D (4, wt 5, val 6)      | 10  | 13         | 12           | yes      | take D   | 5         |
| 3    | C (3, wt 4, val 5)      | 5   | 7          | 7            | no       | skip C   | 5         |
| 4    | B (2, wt 3, val 4)      | 5   | 7          | 3            | yes      | take B   | 2         |
| 5    | A (1, wt 2, val 3)      | 2   | 3          | 0            | yes      | take A   | 0         |

`w` reaches 0 with all items visited — reconstruction stops. Chosen items: **A, B, D** — weights
`2 + 3 + 5 = 10` (exactly fills the capacity), values `3 + 4 + 6 = 13`, matching `dp[5][10]`
exactly. Running `reconstruct_items` on the table above returns `[0, 1, 3]` (0-indexed), i.e. A, B,
D — confirming the hand trace.

---

## Collapsing to 1D: Why 0/1 Knapsack Needs the Item Dimension

The table above costs O(n · W) space — `n+1` rows, `W+1` columns. [[03-tabulation|Chapter 3]]'s
rolling-array trick collapsed a 2D table to O(1) or O(W) by noticing that row `i` only ever reads
row `i-1` — once row `i` is filled, everything above row `i-1` is dead weight. The same observation
applies here: `dp[i][w]` only ever reads `dp[i-1][...]`. A single 1D array of length `W+1`, updated
in place, ought to carry the same information forward one item at a time.

It should. Naively applied, it doesn't.

### The Broken Attempt: Increasing Order Lets an Item Reuse Itself

Collapse to `dp[w]` and update it in increasing `w` order, one item at a time — the iteration order
that felt completely harmless in every prior tabulation example:

```python
def knapsack_01_1d_wrong(weights: list[int], values: list[int], capacity: int) -> list[int]:
    """BROKEN: increasing-order 1D update lets each item be reused within its own pass."""
    dp = [0] * (capacity + 1)
    for wt, val in zip(weights, values):
        for w in range(wt, capacity + 1):        # increasing -- the bug
            dp[w] = max(dp[w], dp[w - wt] + val)
    return dp
```

Trace just the first pass — item A alone, weight 2, value 3, against an all-zero array:

| `w` | `dp[w - 2]` read | Already updated _this_ pass? | `dp[w-2] + 3` | `dp[w]` after |
| --- | ---------------- | ---------------------------- | ------------- | ------------- |
| 2   | `dp[0] = 0`      | no                           | 3             | 3             |
| 3   | `dp[1] = 0`      | no                           | 3             | 3             |
| 4   | `dp[2] = 3`      | **yes** — set two steps ago  | 6             | 6             |
| 5   | `dp[3] = 3`      | **yes**                      | 6             | 6             |
| 6   | `dp[4] = 6`      | **yes**                      | 9             | 9             |
| 7   | `dp[5] = 6`      | **yes**                      | 9             | 9             |
| 8   | `dp[6] = 9`      | **yes**                      | 12            | 12            |
| 9   | `dp[7] = 9`      | **yes**                      | 12            | 12            |
| 10  | `dp[8] = 12`     | **yes**                      | 15            | 15            |

After processing item A **alone**, `dp[10] = 15 = 5 × 3` — item A has been "taken" five times over
(`5 × weight 2 = 10`), because increasing order visits `w = 2` before `w = 4`, and by the time the
loop reaches `w = 4` it reads `dp[2]`, which this very pass already set on the assumption item A was
taken there. Item A gets offered again as if it were a fresh, still-available copy. It isn't —
there's exactly one A. Running the full broken function across all five items:

```python
>>> knapsack_01_1d_wrong([2,3,4,5,9], [3,4,5,6,10], 10)
[0, 0, 3, 4, 6, 7, 9, 10, 12, 13, 15]
```

Final answer: **15**, not 13. Wrong by exactly the amount an extra, illegally-reused copy of A is
worth.

### The Fix: Iterate `w` in Decreasing Order

The fix costs nothing extra and touches only the direction of one loop: process `w` from `capacity`
down to `weight[i]`. Now `dp[w - weight[i]]`, read while computing `dp[w]`, refers to a cell
decreasing order hasn't touched yet this pass — it still holds the value from _before_ item `i` was
considered, exactly the quantity the correct transition calls for.

```python
def knapsack_01_1d(weights: list[int], values: list[int], capacity: int) -> list[int]:
    """Correct 1D rolling-array 0/1 knapsack: decreasing order forbids reuse."""
    dp = [0] * (capacity + 1)
    for wt, val in zip(weights, values):
        for w in range(capacity, wt - 1, -1):     # decreasing -- the fix
            dp[w] = max(dp[w], dp[w - wt] + val)
    return dp
```

Snapshotting `dp` after each item is processed:

| After processing  | `dp[0..10]`                          |
| ----------------- | ------------------------------------ |
| A (wt 2, val 3)   | `0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3`    |
| +B (wt 3, val 4)  | `0, 0, 3, 4, 4, 7, 7, 7, 7, 7, 7`    |
| +C (wt 4, val 5)  | `0, 0, 3, 4, 5, 7, 8, 9, 9, 12, 12`  |
| +D (wt 5, val 6)  | `0, 0, 3, 4, 5, 7, 8, 9, 10, 12, 13` |
| +E (wt 9, val 10) | `0, 0, 3, 4, 5, 7, 8, 9, 10, 12, 13` |

Each snapshot is, cell for cell, identical to the corresponding row of the 2D table two sections
back — this is the rolling array collapsing storage, not changing what gets computed. Final answer:
`dp[10] = 13`, matching `dp[5][10]` from the full 2D table exactly. The item dimension didn't
disappear; it got folded into _when_ each cell is allowed to see the update from the item currently
being processed.

---

## Unbounded Knapsack: The Mirror Case

Unbounded knapsack changes exactly one rule: items can be reused an unlimited number of times. The
coin-change family — "fewest coins to make amount X," "number of ways to make amount X" — is
unbounded knapsack wearing different variable names: weight = coin denomination, value = 1 (or a
running count) instead of an independent number.

Reusability flips what "correct" means for the iteration direction. Run the **exact broken function
from the previous section, unedited**, on a problem where reuse is the actually-intended behavior:

```python
>>> knapsack_01_1d_wrong([2,3,4,5,9], [3,4,5,6,10], 10)
[0, 0, 3, 4, 6, 7, 9, 10, 12, 13, 15]
```

Character for character, that is the same array the broken 0/1 attempt produced. It isn't a
coincidence and it isn't a new derivation — increasing order doesn't compute "a wrong answer" in
some generic sense; it computes **the unbounded knapsack answer**, on the nose, because visiting `w`
in increasing order lets an item just placed at a smaller capacity be picked up again at a larger
one within the same pass. That's exactly the bug for 0/1 (an item reappearing when there's only one
copy) and exactly the correct behavior for unbounded (an item reappearing when there are infinitely
many copies). Once collapsed to 1D, the entire difference between the two problems is which
direction one loop runs:

|                    | Iteration order over `w`       | Effect                                                                                              | Correct for                   |
| ------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------- |
| 0/1 knapsack       | decreasing (capacity → weight) | an item's own update is invisible to itself at a smaller `w` within the same pass — no reuse        | 0/1 (≤ 1 copy per item)       |
| Unbounded knapsack | increasing (weight → capacity) | an item's update at a smaller `w` is immediately visible at a larger `w`, same pass — reuse allowed | unbounded (∞ copies per item) |

Naming the function honestly rather than leaving it labeled "wrong":

```python
def knapsack_unbounded(weights: list[int], values: list[int], capacity: int) -> list[int]:
    """Unbounded knapsack: items reusable unlimited times.
    Identical shape to the 1D 0/1 knapsack -- only the iteration direction over w flips.
    """
    dp = [0] * (capacity + 1)
    for wt, val in zip(weights, values):
        for w in range(wt, capacity + 1):        # increasing -- reuse is now correct, not a bug
            dp[w] = max(dp[w], dp[w - wt] + val)
    return dp
```

### Coin Change: Fewest Coins to Make an Amount

The cost-minimizing variant of the same idea: coins `{1, 3, 4}`, target amount 6, minimize the
_count_ of coins used instead of maximizing value, with unlimited coins of each denomination.

```python
def coin_change_fewest(coins: list[int], amount: int) -> tuple[int, list[int]]:
    """Unbounded knapsack, cost-minimizing variant: fewest coins to make amount exactly.
    Weight = coin denomination, "value" = 1 coin spent, minimize instead of maximize.
    """
    INF = float("inf")
    dp = [0] + [INF] * amount
    for c in coins:
        for w in range(c, amount + 1):           # increasing -- unbounded reuse
            if dp[w - c] + 1 < dp[w]:
                dp[w] = dp[w - c] + 1

    used = []
    w = amount
    while w > 0:
        for c in coins:
            if c <= w and dp[w - c] == dp[w] - 1:
                used.append(c)
                w -= c
                break
    return dp[amount], used
```

Run:

```python
>>> coin_change_fewest([1, 3, 4], 6)
(2, [3, 3])
```

`dp` across amounts 0–6 comes out `[0, 1, 2, 1, 1, 2, 2]` — fewest coins for 6 is 2, achieved by
`3 + 3`, and the reused `3`-coin is exactly the behavior increasing order was built to allow.

The counting sibling — number of distinct combinations that sum to the amount, rather than the
fewest coins — swaps the `min`/`+1` transition for a running sum, keeps the same increasing-order
loop and the same reuse logic:

```python
def coin_change_ways(coins: list[int], amount: int) -> int:
    """Unbounded knapsack, counting variant: number of distinct combinations summing to amount."""
    ways = [1] + [0] * amount
    for c in coins:
        for w in range(c, amount + 1):
            ways[w] += ways[w - c]
    return ways[amount]
```

```python
>>> coin_change_ways([1, 3, 4], 6)
4
```

Four combinations: `1×6`, `1×2 + 4`, `1×3 + 3`, `3 + 3` — verified by direct enumeration, not just
trusted from the DP.

---

## Subset Sum and Partition Equal Subset Sum

**Subset Sum** asks a yes/no question instead of a maximization one: given an array and a target
`T`, does any subset sum to exactly `T`? It's 0/1 knapsack wearing a disguise — set each item's
value equal to its own weight, and set the capacity to `T`. Under that substitution, "maximize value
without exceeding capacity" and "hit the target exactly" collapse into the same search, and the
table changes shape to match: `dp[i][w]` becomes a boolean — can the first `i` elements combine
(each used at most once) to sum to exactly `w`? — rather than a number.

Transition, same shape as 0/1 knapsack's, translated to booleans:

```
dp[i][w] = dp[i-1][w]  OR  (arr[i] <= w  AND  dp[i-1][w - arr[i]])
```

Base case: `dp[i][0] = True` for every `i` (the empty subset always sums to 0); `dp[0][w] = False`
for `w > 0` (no elements, no way to reach a positive target).

### Subset Sum as 0/1 Knapsack in Disguise

```python
def subset_sum_table(arr: list[int], target: int) -> list[list[bool]]:
    """dp[i][t] = can the first i elements sum to exactly t, using each at most once."""
    n = len(arr)
    dp = [[False] * (target + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = True                      # empty subset always sums to 0
    for i in range(1, n + 1):
        x = arr[i - 1]
        for t in range(1, target + 1):
            dp[i][t] = dp[i - 1][t] or (x <= t and dp[i - 1][t - x])
    return dp
```

`arr = [3, 4, 5, 6, 10]`, target `15`:

| `i` (elements so far) | t=0 | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  | 11  | 12  | 13  | 14  | 15  |
| --------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (none)              | T   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   |
| 1 (+3)                | T   | F   | F   | T   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   |
| 2 (+4)                | T   | F   | F   | T   | T   | F   | F   | T   | F   | F   | F   | F   | F   | F   | F   | F   |
| 3 (+5)                | T   | F   | F   | T   | T   | T   | F   | T   | T   | T   | F   | F   | T   | F   | F   | F   |
| 4 (+6)                | T   | F   | F   | T   | T   | T   | T   | T   | T   | T   | T   | T   | T   | T   | T   | T   |
| 5 (+10)               | T   | F   | F   | T   | T   | T   | T   | T   | T   | T   | T   | T   | T   | T   | T   | T   |

`dp[5][15] = True`. Notice row 4 already reaches `t = 15` — `4 + 5 + 6 = 15` — before item 10 is
even considered, mirroring the earlier 0/1 table where the highest-value item (E) also turned out
irrelevant to the optimal answer. Reconstructing with the identical backward-walk test used for 0/1
knapsack (`dp[i][t] != dp[i-1][t]` ⇒ element `i-1` was used) recovers `{4, 5, 6}`:

```python
def reconstruct_subset(dp: list[list[bool]], arr: list[int], target: int) -> list[int]:
    chosen = []
    i, t = len(arr), target
    while i > 0 and t > 0:
        if dp[i][t] != dp[i - 1][t]:
            chosen.append(arr[i - 1])
            t -= arr[i - 1]
        i -= 1
    chosen.reverse()
    return chosen
```

```python
>>> can_make_sum([3, 4, 5, 6, 10], 15)
True
>>> reconstruct_subset(subset_sum_table([3, 4, 5, 6, 10], 15), [3, 4, 5, 6, 10], 15)
[4, 5, 6]
```

### Partition Equal Subset Sum: A One-Line Reduction

**Partition Equal Subset Sum** asks whether an array can be split into two subsets with equal sums.
It reduces directly to Subset Sum: if the total is odd, an equal split is impossible immediately —
no need to touch the DP at all. If the total is even, the question becomes "does some subset sum to
exactly half the total?" — precisely Subset Sum with `target = total // 2`.

```python
def can_make_sum(arr: list[int], target: int) -> bool:
    if target < 0:
        return False
    return subset_sum_table(arr, target)[len(arr)][target]


def can_partition(arr: list[int]) -> bool:
    """Partition Equal Subset Sum: reduces directly to Subset Sum with target = total // 2."""
    total = sum(arr)
    if total % 2 != 0:
        return False
    return can_make_sum(arr, total // 2)
```

```python
>>> can_partition([1, 5, 11, 5])
True
```

`sum([1, 5, 11, 5]) = 22`, half is 11, and `11` alone (or `5 + 5 + 1`) reaches it — the array splits
into `{11}` and `{1, 5, 5}`, both summing to 11. Partition Equal Subset Sum earns no new DP; it's
Subset Sum plus one parity check and one division, which is the entire point of calling it a
specialization rather than a separate problem.

---

## Complexity: O(n × W), and the Pseudo-Polynomial Caveat

**Time:** O(n × W) — one cell per `(item, capacity)` pair, O(1) work per cell. **Space:** O(n × W)
for the full 2D table, collapsing to **O(W)** with the rolling-array optimization from this
chapter's middle sections, exactly the space profile [[03-tabulation|Chapter 3]] achieved on its own
2D examples.

That bound has a precondition worth flagging explicitly, tying back to
[[02-asymptotic-analysis|Part 01, Chapter 2]]'s treatment of what a complexity bound is actually a
function of: **O(n × W) is polynomial in the _numeric value_ of `W`, not in the _number of bits_
needed to represent `W`.** A genuinely polynomial-time algorithm's running time is bounded by a
polynomial in the size of its input's _encoding_ — and a capacity of, say, 2⁶³ takes only 63 bits to
write down, while the DP table this chapter builds would need on the order of `2⁶³` columns to match
it. The formula "O(n × W)" doesn't stop being true; it stops being _useful_, because `W` as a raw
number and `W` as a bit-count grow at wildly different rates once `W` gets astronomically large
relative to `n`. This is precisely what **pseudo-polynomial** means: polynomial in the values
involved, not polynomial in the problem's actual input size.

The shape of this caveat isn't new to this chapter — it's the exact same warning
[[07-counting-sort|Part 07, Chapter 7]] raised about its own O(n + k) bound: fast and genuinely
correct for the inputs it was designed around, and quietly impractical the moment the numeric
parameter (`k` there, `W` here) is allowed to dwarf the count of actual items being processed. Same
shape of caveat, different chapter, different numeric parameter playing the same role.

---

## Interview Angle

Knapsack's real signal isn't reciting the recurrence — that part is memorizable. It's two things, in
order:

1. **Recognizing the state needs two dimensions** — items considered, capacity remaining — and being
   able to say _why_ a single-dimension state silently breaks, the way the opening section of this
   chapter argued from [[01-dp-fundamentals|Part 08, Chapter 1]]'s general warning.
2. **Correctly reasoning about the iteration-direction question** when asked to optimize space. "Can
   you do this in O(W) instead of O(n × W)?" is usually the actual follow-up, not a bonus question —
   and answering it well means being able to say, on the spot, which direction the capacity loop has
   to run for the specific variant on the table (decreasing for 0/1, increasing for unbounded) and
   _why_ that direction, not just which one to memorize.

A candidate who derives `dp[i][w]` correctly but can't answer "does the order of your capacity loop
matter here" hasn't actually internalized the state — they've pattern-matched the recurrence. The
direction-of-iteration question is the fastest way an interviewer distinguishes the two.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
