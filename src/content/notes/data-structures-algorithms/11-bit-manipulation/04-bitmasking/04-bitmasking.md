---
title: "4 — Bitmasking"
description: "Representing a subset as bits in a single integer — the trick that turns small-universe subset enumeration and subset-indexed DP into plain integer arithmetic, and stops working the moment the universe passes about 25 elements."
tags: ["data-structures-algorithms","bit-manipulation","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-84"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/10-bitmask-dp/10-bitmask-dp
    kind: related
  - slug: data-structures-algorithms/11-bit-manipulation/01-bitwise-operations/01-bitwise-operations
    kind: depends_on
---

# 4 — Bitmasking

Every subset-enumeration problem has the same brute-force shape: try every possible
inclusion/exclusion choice, evaluate it, keep what's needed. [[05-combinations|Part 10, Chapter 5]]
already solves that with recursion — choose an element or don't, explore, unchoose, repeat.
Bitmasking solves the identical problem with plain integers: once a universe is small enough, every
subset of it fits inside a single machine word, and every operation on it — membership, union,
intersection — becomes one bitwise instruction instead of a data-structure method call. This chapter
covers the specific size where that trade holds, the small vocabulary of operations it costs, and
the DP technique it unlocks once a mask becomes not just a value but a **state**.

---

## Representing a Subset as an Integer

Fix a universe of `n` elements, indexed `0` through `n - 1`. Any subset of that universe is
representable as an `n`-bit integer — a **mask** — where bit `i` is `1` exactly when element `i`
belongs to the subset. Two values anchor the whole scheme:

- The **empty subset** is `mask = 0` — no bits set, nothing included.
- The **full universe** is `mask = (1 << n) - 1` — the low `n` bits all set, everything included.

Every other subset is some integer strictly between those two, and — this is the part worth sitting
with — every integer between `0` and `(1 << n) - 1` corresponds to exactly one subset. There's a
bijection between "subset of an `n`-element universe" and "integer in `[0, 2ⁿ)`," and that bijection
is what the rest of this chapter runs on.

The integer itself is never the constraint — Python `int`s are unbounded, so nothing stops `n` from
being 60 or 600 as far as bit-width goes. What actually caps practical `n` at roughly 20–25 is that
a mask isn't just a value sitting in a variable, it's usually a **state** an algorithm has to visit
or index by: the moment something needs to enumerate every mask, or use a mask as an array index
(the DP worked example below does exactly this), the quantity that matters is the _count_ of
distinct masks — `2ⁿ` — not how many bits an individual one occupies. `2²⁰` is about a million,
comfortably enumerable in well under a second. `2³⁰` is over a billion, and isn't.

---

## The Vocabulary of Mask Operations

A handful of bitwise expressions cover essentially everything a mask-based solution needs to do:

```python
def has(mask: int, i: int) -> bool:
    """Is element i a member of the subset mask represents?"""
    return (mask & (1 << i)) != 0

def add(mask: int, i: int) -> int:
    """The subset with element i included."""
    return mask | (1 << i)

def remove(mask: int, i: int) -> int:
    """The subset with element i excluded (no-op if it wasn't present)."""
    return mask & ~(1 << i)

def union(a: int, b: int) -> int:
    """Every element in a or b."""
    return a | b

def intersection(a: int, b: int) -> int:
    """Every element in both a and b."""
    return a & b

def is_subset(a: int, b: int) -> bool:
    """Is every element of a also in b?"""
    return (a & b) == a
```

Two of these are worth a second look. `is_subset` works because AND can only ever clear bits, never
set them: if `a` has a bit that `b` doesn't, `a & b` loses that bit and the result stops equaling
`a` — so equality after ANDing is exactly the condition "`a` contributed nothing `b` didn't already
have." And `remove`'s `~(1 << i)` looks like it should be dangerous — Python integers are
infinite-precision two's complement, so `~(1 << i)` is a value with infinitely many leading `1` bits
— but ANDing it against `mask` only ever touches bits `mask` actually has set, all of which sit
below its highest bit. The infinite high end of `~(1 << i)` never gets a chance to interact with
anything, because `mask` has nothing there to AND against.

---

## Enumerating the Power Set for Free

This is the payoff of the bijection from the first section: since every integer in `[0, 2ⁿ)` **is**
a distinct subset, looping over that range enumerates the entire power set, with no recursion and no
explicit subset-building logic required at all.

```python
def subsets(nums: list[int]) -> list[list[int]]:
    n = len(nums)
    result: list[list[int]] = []
    for mask in range(1 << n):
        result.append([nums[i] for i in range(n) if mask & (1 << i)])
    return result
```

Compare this directly against the backtracking version [[05-combinations|Part 10, Chapter 5]]
builds:

```python
def subsets_backtracking(nums: list[int]) -> list[list[int]]:
    result: list[list[int]] = []

    def backtrack(index: int, path: list[int]) -> None:
        if index == len(nums):
            result.append(path.copy())
            return
        backtrack(index + 1, path)          # exclude nums[index]
        path.append(nums[index])
        backtrack(index + 1, path)          # include nums[index]
        path.pop()

    backtrack(0, [])
    return result
```

Both are correct, both produce the same `2ⁿ` subsets, and both cost the same O(n · 2ⁿ) — `2ⁿ`
subsets, O(n) to materialize each. What differs is the mechanism, not the result: the backtracking
version spends an explicit call stack and explicit choose/explore/unchoose bookkeeping to walk a
binary decision tree one branch at a time. The bitmask version needs neither — counting from `0` to
`2ⁿ - 1` in binary _is_ a walk of that same tree, because every integer's bit pattern already
encodes one leaf's worth of choices. These are two different techniques for producing the identical
output; which one to reach for is mostly about what else the surrounding algorithm needs — indexable
state (bitmask) versus early pruning of whole branches (backtracking, which can bail out of a
subtree the moment a partial choice is already invalid, something a bare `for mask in range(1 << n)`
loop cannot do).

---

## Worked Example: Traveling Salesman via Bitmask DP (Preview)

A mask earns its own chapter, rather than being folded into
[[01-bitwise-operations|Chapter 1, this same Part]], because it isn't only a value to enumerate —
it's compact enough to be a **DP state**. The canonical example is the Traveling Salesman Problem:
given `n` cities and a cost matrix, find the minimum-cost tour that visits every city exactly once
and returns to the start.

Brute-forcing every ordering costs O(n!), which is worse than exponential. The insight bitmasking
supplies: the DP never needs to remember _which order_ cities were visited in — only _which set_ has
been visited so far, plus where the tour currently stands. That's a `(mask, i)` pair, and `mask`
fits in one integer for any `n` up to the low twenties.

**State:** `dp[mask][i]` = the minimum cost to have visited exactly the cities in `mask`, currently
standing at city `i` (which must itself be a member of `mask`).

**Transition:** from `(mask, i)`, extend the tour to any city `j` not yet visited:

```
dp[mask | (1 << j)][j] = min(dp[mask | (1 << j)][j], dp[mask][i] + cost[i][j])
```

```python
from math import inf

def tsp_min_cost(cost: list[list[int]]) -> int:
    n = len(cost)
    # dp[mask][i]: min cost to have visited exactly the cities in mask,
    # ending at city i. Only masks reachable from {0} ever get filled.
    dp = [[inf] * n for _ in range(1 << n)]
    dp[1][0] = 0  # mask = {0}, standing at city 0, nothing spent yet

    for mask in range(1 << n):
        for i in range(n):
            if dp[mask][i] == inf or not (mask & (1 << i)):
                continue
            for j in range(n):
                if mask & (1 << j):              # j already visited
                    continue
                new_mask = mask | (1 << j)
                new_cost = dp[mask][i] + cost[i][j]
                if new_cost < dp[new_mask][j]:
                    dp[new_mask][j] = new_cost

    full = (1 << n) - 1
    return min(dp[full][i] + cost[i][0] for i in range(n))  # close the tour
```

**Complexity:** O(n² · 2ⁿ) — `2ⁿ` masks, each with up to `n` choices of current city `i` and `n`
choices of next city `j`.

This is a preview, not the full derivation — [[10-bitmask-dp|Part 08, Chapter 10]] is where the
transition gets proved out properly, alongside the 1D space optimization and tour reconstruction.
What matters here is narrower: `mask` is doing the job that a `frozenset` of visited cities, or a
`tuple(sorted(visited))`, would otherwise have to do as a dict key — except as a plain `int` it's
not just hashable, it's usable directly as an array index (`dp[mask][i]`), skipping the hash table
entirely. That substitution — a set-shaped piece of state collapsed into an array index — is the
actual technique this chapter is about; the DP itself belongs to the next Part.

---

## Worked Example: Counting Subsets With a Given Property

**Problem:** given a small array of integers, count how many subsets — including the empty one —
have XOR equal to `0`.

Small `n` plus "count/find subsets satisfying some property" is close to a direct tell for bitmask
enumeration: generate every subset with `for mask in range(1 << n)`, check the property against that
one mask, tally.

```python
def count_zero_xor_subsets(nums: list[int]) -> int:
    n = len(nums)
    count = 0
    for mask in range(1 << n):
        xor_total = 0
        for i in range(n):
            if mask & (1 << i):
                xor_total ^= nums[i]
        if xor_total == 0:
            count += 1
    return count
```

The empty subset (`mask = 0`) always satisfies this particular property — the XOR of nothing is `0`
by definition — so the count is never less than `1`. That isn't a bug to guard against; it's the
same "`0` is a valid mask" fact this chapter opened with, showing up as a real edge case. If a
problem means to exclude the empty subset, that's a `- 1` on the final answer, not a change to the
loop.

The identical skeleton answers a differently-worded question — count subsets whose **sum** equals a
target — by swapping the accumulator from `xor_total ^= nums[i]` to `subset_sum += nums[i]` and the
check from `== 0` to `== target`. The enumeration line never changes; only the per-mask check does.
That's the real shape of the pattern: `for mask in range(1 << n)` is the constant, the body is the
variable.

**Complexity:** O(n · 2ⁿ) — `2ⁿ` masks, and an O(n) inner loop per mask to recompute the property
from scratch. It's worth being explicit about where this stops being viable, because the exponent
makes the failure mode sudden rather than gradual: `n = 20` is `2²⁰ ≈ 1,000,000` masks, a fraction
of a second of real work. `n = 25` is `2²⁵ ≈ 33,000,000`, still comfortably fine. `n = 30` is
roughly a billion, and at that point O(n · 2ⁿ) has crossed from "a for-loop" to "a program that does
not finish." No bit trick closes that gap, because the exponent isn't an implementation detail to be
optimized away — it's a count of how many subsets literally exist. In practice, the high teens to
low twenties is the working range for bitmask enumeration; anything past the mid-twenties needs a
different algorithm, not a faster inner loop.

---

## Where Bitmasking Stops Being the Answer

Bitmasking's ceiling isn't a constant-factor problem that a tighter inner loop or a cleverer bit
trick can push back — it's `n` itself, sitting in the exponent. Doubling `n` from 20 to 40 doesn't
double the work, it squares it (`2⁴⁰ = (2²⁰)²`), and no amount of low-level cleverness — precomputed
popcount tables, hardware bit-counting instructions, vectorization — turns an exponent into a
polynomial. The instant a problem's `n` walks past roughly 25, exhaustive subset enumeration is off
the table regardless of whether it's dressed up as a bitmask loop or as
[[05-combinations|Part 10, Chapter 5]]'s recursion — same asymptotic wall, different syntax — and
the honest move is to stop hunting for a smarter mask and start hunting for a different algorithm
shape:

- **A polynomial DP with a smaller state.** Most bitmask-DP problems are bitmask-DP only because the
  _naive_ state happens to need a subset. The moment a problem's real state compresses to something
  that grows linearly with `n` — a running total, a position, a small fixed number of counters —
  [[01-dp-fundamentals|Part 08, Chapter 1]]'s ordinary tabulation applies, and the exponential
  vanishes entirely.
- **A greedy strategy**, when the problem has the exchange-argument structure
  [[01-greedy-strategy|Part 09, Chapter 1]] uses to justify never backtracking — trading exhaustive
  search for a single linear or `n log n` pass that's provable to land on the optimum anyway.
- **An approximation algorithm**, when neither applies and the problem is provably hard at scale
  (plenty of bitmask-shaped problems, TSP among them, are NP-hard) — trading exact optimality for a
  bounded-error answer that actually terminates.

None of those three is a bitmasking technique — that's the point of listing them here. Bitmasking is
the right tool for a specific, narrow band of `n`; recognizing when a problem has already walked
past that band, instead of reaching for a bigger integer and a cleverer mask out of habit, is the
actual skill this chapter is trying to build.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
