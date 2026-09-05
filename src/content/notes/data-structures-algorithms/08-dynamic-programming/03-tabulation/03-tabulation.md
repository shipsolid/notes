---
title: "3 — Tabulation"
description: "Bottom-up tabulation on Fibonacci and 2D Unique Paths, the dependency-order rule that makes a fill loop valid, the rolling-array space optimization it enables, and where it beats memoization."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-63"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/01-dp-fundamentals/01-dp-fundamentals
    kind: depends_on
  - slug: data-structures-algorithms/08-dynamic-programming/02-memoization/02-memoization
    kind: compared_to
---

# 3 — Tabulation

[[02-memoization|Part 08, Chapter 2]] fixed naive recursive Fibonacci's exponential blowup by
caching answers lazily: the recursion still runs top-down, from `fib(n)` down toward the base cases,
but the first time any state is asked for a second time, the cache answers instead of the call tree
re-deriving it from scratch. That's a fix layered on top of recursion — the call stack is still
there, still built from the top call downward, just no longer wasteful.

Tabulation fixes the identical problem by inverting the direction entirely. Instead of starting at
`fib(n)` and recursing down to discover what the base cases are, it starts _at_ the base cases and
builds an explicit table upward, one cell at a time, in a plain loop, until the table contains the
answer being asked for. No recursion, no call stack, no function calls re-entering with arguments
already seen. Just an array and a `for` loop, filling cells in an order that guarantees every cell's
dependencies are already sitting in the table by the time that cell is computed.

---

## Fibonacci, Tabulated

The state and recurrence are unchanged from [[01-dp-fundamentals|Part 08, Chapter 1]] and
[[02-memoization|Part 08, Chapter 2]] — `fib(i) = fib(i-1) + fib(i-2)`, base cases `fib(0) = 0` and
`fib(1) = 1`. What changes is which direction fills in the blanks. Allocate a table sized for every
state from `0` to `n`, write the two base cases directly into it, and then run a single forward loop
that computes each remaining cell from the two cells immediately behind it:

```python
def fib_tabulated(n: int) -> int:
    """Bottom-up tabulated Fibonacci. O(n) time, O(n) space."""
    if n == 0:
        return 0

    dp = [0] * (n + 1)
    dp[0] = 0
    dp[1] = 1

    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]

    return dp[n]
```

(The `n == 0` guard exists only because `dp = [0] * (n + 1)` would allocate a single-cell table when
`n` is `0`, and the very next line, `dp[1] = 1`, would then index past the end of it. It's a
one-line edge case, not a change to the pattern.)

Running it for `n = 10` and comparing against Chapter 2's memoized version confirms the two
strategies agree, as they must — same recurrence, same base cases, same answer, only the fill
direction differs:

```python
>>> fib_tabulated(10)
55
>>> fib_memo(10)   # Chapter 2's top-down cached version
55
```

### Trace: filling the table for `n = 10`

The loop runs `i` from `2` to `10`, and at every step `dp[i]` is computed from two cells that were
written on an earlier iteration (or are one of the two base cases):

| `i` | `dp[i-1]` | `dp[i-2]` | `dp[i] = dp[i-1] + dp[i-2]` |
| --- | --------- | --------- | --------------------------- |
| 2   | 1         | 0         | 1                           |
| 3   | 1         | 1         | 2                           |
| 4   | 2         | 1         | 3                           |
| 5   | 3         | 2         | 5                           |
| 6   | 5         | 3         | 8                           |
| 7   | 8         | 5         | 13                          |
| 8   | 13        | 8         | 21                          |
| 9   | 21        | 13        | 34                          |
| 10  | 34        | 21        | 55                          |

After the loop exits, the full table reads `dp = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55]`, and
`dp[10] = 55` — the same answer memoized Fibonacci produces, computed by ten straight-line array
writes instead of a recursive call tree.

---

## Why the Fill Order Matters — Dependency Order, Made Explicit

That loop isn't just a stylistic alternative to recursion; it works _because_ of a specific property
of the recurrence, and it's worth naming precisely rather than waving at. `dp[i]` depends on exactly
two other cells, `dp[i-1]` and `dp[i-2]`, and both of those indices are strictly smaller than `i`. A
left-to-right pass over `i = 2, 3, 4, ..., n` visits indices in increasing order, so by the time the
loop reaches any given `i`, every index smaller than `i` — in particular `i-1` and `i-2` — has
already been written. Nothing is ever read before it's produced. That's the whole correctness
argument, and it holds regardless of what `n` is.

Generalize the statement and it becomes the actual rule tabulation runs on: **the iteration order
has to be consistent with the recurrence's dependency structure** — every cell must be visited only
after every cell it depends on has already been filled. For a 1D recurrence where `dp[i]` depends
only on strictly smaller indices, a single left-to-right pass automatically satisfies that
constraint, which is why Fibonacci's loop looks almost too simple to be the whole algorithm. It is
the whole algorithm; the recurrence just happens to make the correct order trivial to find.

That won't always be true. A 2D table (this chapter's next section, and the shape
[[04-knapsack-problems|Part 08, Chapter 4]] reuses) needs its two loop nests ordered so that a
cell's row-above and column-before neighbors are filled first — usually rows outer, columns inner,
but the requirement is about dependency order, not row-major convention specifically. Some
recurrences depend on cells that aren't simply "smaller index" in an obvious axis-aligned sense at
all — a subproblem defined over an _interval_ `(i, j)` can depend on every split point strictly
inside that interval, which means the fill order has to go by increasing interval length or a
specific diagonal sweep rather than by row or column. [[12-interval-dp|Part 08, Chapter 12]] is the
case where getting that order right stops being a one-line detail and becomes the entire chapter —
not derived here, just flagged as the point where "left-to-right is obviously enough" stops holding.

---

## Space Optimization: Rolling Variables

The dependency-order argument above reveals something the full `dp` array doesn't need: `dp[i]` only
ever reads `dp[i-1]` and `dp[i-2]`. Once `dp[i]` has been computed, nothing later in the loop will
ever look at `dp[i-3]` or anything before it again. Keeping the entire `O(n)`-sized array around is
correct but wasteful — every cell more than two steps behind the current one is dead weight,
occupying memory it will never be read from again.

Tabulation makes that waste easy to eliminate in a way memoization can't as naturally, because
tabulation's cells are just local variables assigned in a loop, not entries in a cache keyed by
recursive call arguments. Replace the array with two scalars, `prev2` and `prev1`, holding only the
two most recent values, and update both every iteration:

```python
def fib_rolling(n: int) -> int:
    """Space-optimized tabulation: O(n) time, O(1) space."""
    if n == 0:
        return 0

    prev2, prev1 = 0, 1
    for i in range(2, n + 1):
        prev2, prev1 = prev1, prev2 + prev1

    return prev1
```

Running it for `n = 10` and checking it against both the array-tabulated version and Chapter 2's
memoized version:

```python
>>> fib_rolling(10)
55
>>> fib_tabulated(10)
55
```

### Trace: rolling `prev2, prev1` for `n = 10`

| `i` | before: `prev2, prev1` | `curr = prev1 + prev2` | after: `prev2, prev1` |
| --- | ---------------------- | ---------------------- | --------------------- |
| —   | `0, 1`                 | —                      | (initial)             |
| 2   | 0, 1                   | 1 + 0 = 1              | 1, 1                  |
| 3   | 1, 1                   | 1 + 1 = 2              | 1, 2                  |
| 4   | 1, 2                   | 2 + 1 = 3              | 2, 3                  |
| 5   | 2, 3                   | 3 + 2 = 5              | 3, 5                  |
| 6   | 3, 5                   | 5 + 3 = 8              | 5, 8                  |
| 7   | 5, 8                   | 8 + 5 = 13             | 8, 13                 |
| 8   | 8, 13                  | 13 + 8 = 21            | 13, 21                |
| 9   | 13, 21                 | 21 + 13 = 34           | 21, 34                |
| 10  | 21, 34                 | 34 + 21 = 55           | 34, 55                |

`prev1` after the last iteration is `55`, matching `dp[10]` from the full-array version — same
answer, but memory use has dropped from an `n+1`-element array to two integers. `O(n)` space has
collapsed to `O(1)`.

This pattern — keeping only the handful of most-recent table entries a recurrence actually reads
from, instead of the full history — is called **rolling array** (or **rolling variables**, for the
scalar case above), and it recurs constantly in DP: any time a recurrence's dependencies are bounded
to a fixed, small window of recent states rather than the entire table, the same trick applies.
Watch for that shape in the chapters ahead — it isn't unique to Fibonacci.

---

## A 2D Worked Example: Unique Paths in a Grid

Every example so far has been a 1D table indexed by a single integer. The next few chapters — 0/1
knapsack, longest common subsequence, edit distance — all use a **2D table**, so it's worth
establishing that shape now, on a problem simple enough that the state and transition are almost
visual.

**Problem:** given an `m x n` grid, starting at the top-left corner and allowed to move only right
or down at each step, count the number of distinct paths to the bottom-right corner.

**State:** `dp[row][col]` = the number of distinct ways to reach cell `(row, col)` from `(0, 0)`.

**Base case:** the entire first row and the entire first column are `1`. There's exactly one way to
reach any cell in the first row — move right every time, since moving down isn't possible yet — and
symmetrically exactly one way to reach any cell in the first column.

**Transition:** for any cell not in the first row or first column, the only two ways to arrive are
from directly above (`dp[row-1][col]`, having just moved down) or directly to the left
(`dp[row][col-1]`, having just moved right), and every path falls into exactly one of those two
cases:

```
dp[row][col] = dp[row-1][col] + dp[row][col-1]
```

```python
def unique_paths(m: int, n: int) -> int:
    """Count paths from (0, 0) to (m-1, n-1), moving only right or down."""
    dp = [[0] * n for _ in range(m)]

    for row in range(m):
        for col in range(n):
            if row == 0 or col == 0:
                dp[row][col] = 1
            else:
                dp[row][col] = dp[row - 1][col] + dp[row][col - 1]

    return dp[m - 1][n - 1]
```

Running it on a 3-row, 4-column grid:

```python
>>> unique_paths(3, 4)
10
```

### Trace: filling a 3x4 grid

The nested loop fills `row` outer, `col` inner — row 0 left to right, then row 1 left to right, and
so on — which satisfies the dependency order for exactly the same reason the 1D Fibonacci loop did:
every cell's two dependencies (the cell above, the cell to the left) have strictly smaller `row` or
were already filled earlier in the _same_ row, so both are always already in the table by the time
that cell is reached.

| row \ col | 0   | 1   | 2   | 3   |
| --------- | --- | --- | --- | --- |
| **0**     | 1   | 1   | 1   | 1   |
| **1**     | 1   | 2   | 3   | 4   |
| **2**     | 1   | 3   | 6   | 10  |

Each interior cell checks out against the transition: `dp[1][1] = dp[0][1] + dp[1][0] = 1 + 1 = 2`;
`dp[2][3] = dp[1][3] + dp[2][2] = 4 + 6 = 10`, matching `unique_paths(3, 4) = 10` from the run
above.

### The Same Rolling-Array Trick Applies Here Too

Look at the transition again: `dp[row][col]` only ever reads from `dp[row-1][col]` (the row directly
above) and `dp[row][col-1]` (the same row, one column back). No cell ever reads two rows back. That
means the full `m x n` table isn't necessary either — one row can be reused in place for every
subsequent row, since `row[col-1]` (already updated this pass) plays the role of `dp[row][col-1]`,
and `row[col]` (not yet overwritten this pass) still holds last row's value, playing the role of
`dp[row-1][col]`, right up until the moment it's overwritten:

```python
def unique_paths_rolling(m: int, n: int) -> int:
    """Space-optimized: one row reused in place. O(m*n) time, O(n) space."""
    row = [1] * n   # row 0: every cell is 1, matching the base case
    for r in range(1, m):
        for c in range(1, n):
            row[c] = row[c] + row[c - 1]
    return row[-1]
```

```python
>>> unique_paths_rolling(3, 4)
10
```

`O(m * n)` space has dropped to `O(n)` — one row instead of the whole grid — for the same reason
Fibonacci's array collapsed to two scalars: the recurrence's dependencies never reach further back
than the rolling window being kept.

---

## Resolving the Memoization-vs-Tabulation Trade-off

[[02-memoization|Part 08, Chapter 2]] flagged, without settling, the question of which approach to
reach for. Having now seen tabulation end to end — the loop, the dependency-order requirement, and
the space optimization it enables — the trade-off has enough on the table to resolve directly:

| Dimension                            | Memoization (top-down)                                                         | Tabulation (bottom-up)                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Mechanism                            | Recursion + cache                                                              | Explicit table + loop                                                      |
| Overhead per state                   | Function call / recursion overhead                                             | Loop iteration overhead only — no call stack                               |
| Which states get computed            | Only states actually reachable from the top-level call                         | Every cell in the table, whether or not it's on a path to the final answer |
| Fits irregular / sparse state spaces | Naturally — unreached states are simply never visited                          | Awkwardly — the table is usually shaped for the dense case                 |
| Space optimization                   | Hard to do safely — cache entries can be needed by calls arbitrarily far later | Natural — rolling array/variables, once the dependency window is known     |
| Stack-depth risk (Python)            | Real — deep recursion can hit the recursion limit                              | None — no recursion at all                                                 |
| Correctness burden                   | Usually easier — the recursive formulation mirrors the recurrence directly     | Requires working out a fill order consistent with the dependency structure |

Stated plainly: **reach for tabulation when the full table needs filling anyway and space
optimization matters** — dense state spaces where nearly every state is visited regardless, and
where collapsing the table to a rolling window meaningfully reduces memory. **Reach for memoization
when large parts of the state space are never actually touched from the top-level call, or when the
recursive formulation is dramatically easier to state correctly than working out a safe fill order**
— sparse or irregular state spaces, or recurrences (interval DP, tree DP, bitmask DP, all later in
this Part) where the dependency order isn't obvious and getting it wrong silently reads an
uncomputed cell.

Neither direction is a universal upgrade over the other; they're the same recurrence, computed in
opposite directions, and the right one depends on whether the state space is dense and space-bound,
or sparse and correctness-bound.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
