---
title: "8 — Matrix Chain Multiplication"
description: "Matrix chain multiplication's split-point recurrence derived from a hand-computed cost blowup across three parenthesizations of the same product, dp[i][j] defined over a RANGE for the first time in this book, the fill-by-increasing-interval-length rule a row-major sweep can't satisfy, and the O(n³) table traced end to end as the template this book's interval DP chapter generalizes."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-68"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/03-tabulation/03-tabulation
    kind: depends_on
  - slug: data-structures-algorithms/08-dynamic-programming/12-interval-dp/12-interval-dp
    kind: related
---

# 8 — Matrix Chain Multiplication

[[07-edit-distance|Part 08, Chapter 7]] closed out this book's run of DP problems whose state is a
pair of indices into two linear sequences, each transition trimming one or both forward. Every
chapter since [[01-dp-fundamentals|Part 08, Chapter 1]] has kept that same shape: state is a
position, or a pair of positions, and the table fills left to right or row by row, because every
dependency an entry has always sits at a strictly smaller index along at least one axis. Matrix
chain multiplication breaks that shape on purpose. Its state isn't a position at all — it's a
**range**, a contiguous stretch `[i, j]` of a chain, and an entry's dependencies aren't "one row up"
or "one column left," they're every possible way to split that range into two smaller ranges.
[[03-tabulation|Part 08, Chapter 3]] flagged exactly this possibility in passing, noting that a
subproblem defined over an interval can depend on every split point strictly inside it, "which means
the fill order has to go by increasing interval length... just flagged as the point where
'left-to-right is obviously enough' stops holding." This chapter is where it stops holding — the
smallest, cleanest problem that forces a genuinely different fill order, and the template
[[12-interval-dp|Part 08, Chapter 12]] generalizes once this shape has a name: **interval DP**.

---

## The Problem: Order Changes Cost, Not Correctness

Multiplying a `p x q` matrix by a `q x r` matrix takes `p * q * r` scalar multiplications and
produces a `p x r` result — the inner dimensions have to agree, and the outer dimensions survive
into the answer. Chain more than two matrices together — `A0 * A1 * A2 * ... * A(n-1)` — and matrix
multiplication's associativity guarantees the final product is identical no matter how the
multiplications are grouped: `(A0 A1) A2` and `A0 (A1 A2)` land on the exact same matrix, entry for
entry. That's not the question this problem asks. What varies enormously between groupings is the
**number of scalar multiplications spent getting there** — every parenthesization performs the same
final multiplication, but the intermediate matrices it builds along the way, and their sizes, depend
entirely on which pair gets multiplied first.

This makes matrix chain multiplication a different kind of DP target than anything earlier in this
Part. LCS's DP output was the answer — a length. Edit distance's DP output was the answer — an
operation count. Here, the DP output isn't the object being computed at all; the product matrix is
fixed regardless of what the DP decides. The output is a **strategy**: which order of
multiplications achieves that fixed, unavoidable answer for the least work. Optimal substructure
still has to hold for DP to apply — and it does, for a reason the next section makes precise — but
what's being optimized is execution cost, not correctness.

A chain of `n` matrices is described compactly by a single dimension array `dims` of length `n + 1`:
matrix `Ai` has shape `dims[i] x dims[i+1]`, so consecutive matrices automatically share the
`dims[i+1]` that makes them compatible. That's the only input this problem needs — no matrix
entries, just shapes.

---

## Worked Example: Same Product, Wildly Different Costs

Four matrices, `dims = [10, 30, 5, 60, 10]`:

- `A0`: 10 x 30
- `A1`: 30 x 5
- `A2`: 5 x 60
- `A3`: 60 x 10

There are five distinct ways to fully parenthesize a chain of four matrices. Working three of them
out by hand, tracking each intermediate product's shape and cost:

**`((A0 A1) A2) A3`**

| Step            | Cost               | Result shape |
| --------------- | ------------------ | ------------ |
| `A0 A1`         | `10*30*5 = 1,500`  | 10 x 5       |
| `(A0A1) A2`     | `10*5*60 = 3,000`  | 10 x 60      |
| `((A0A1)A2) A3` | `10*60*10 = 6,000` | 10 x 10      |
| **Total**       | **10,500**         |              |

**`A0 (A1 (A2 A3))`**

| Step            | Cost               | Result shape |
| --------------- | ------------------ | ------------ |
| `A2 A3`         | `5*60*10 = 3,000`  | 5 x 10       |
| `A1 (A2A3)`     | `30*5*10 = 1,500`  | 30 x 10      |
| `A0 (A1(A2A3))` | `10*30*10 = 3,000` | 10 x 10      |
| **Total**       | **7,500**          |              |

**`(A0 A1) (A2 A3)`**

| Step            | Cost              | Result shape |
| --------------- | ----------------- | ------------ |
| `A0 A1`         | `10*30*5 = 1,500` | 10 x 5       |
| `A2 A3`         | `5*60*10 = 3,000` | 5 x 10       |
| `(A0A1) (A2A3)` | `10*5*10 = 500`   | 10 x 10      |
| **Total**       | **5,000**         |              |

Same four matrices, same final 10x10 answer, and a **2.1x spread** in scalar-multiplication cost
between the worst and best of just these three groupings (10,500 down to 5,000) — with two more
parenthesizations not even shown. For a chain long enough to matter in practice, guessing a
parenthesization is guessing at a cost that can differ by orders of magnitude, not a rounding error.

One more thing worth noticing before any DP gets introduced: `A0 A1` (cost 1,500) and `A2 A3` (cost
3,000) each got computed **twice** across these three groupings — once for each grouping that
happens to share that split. The same subchain product gets asked for from more than one
parenthesization. That's [[01-dp-fundamentals|Part 08, Chapter 1]]'s overlapping subproblems,
showing up before the recurrence is even written down — and it's the reason caching subchain costs,
rather than re-deriving them inside every candidate parenthesization, pays off.

---

## The Interval DP State: `dp[i][j]` and the Split-Point Recurrence

**State:** `dp[i][j]` = the minimum number of scalar multiplications needed to compute the product
`Ai * A(i+1) * ... * Aj`, for the subchain running from matrix `i` through matrix `j` inclusive.

**Base case:** `dp[i][i] = 0`. A subchain of one matrix requires no multiplication at all — there's
nothing to combine yet.

**Transition:** think about `Ai...Aj` as a single top-level multiplication problem: whatever
parenthesization is chosen, exactly one multiplication happens _last_ — the one that combines
`Ai...Ak` (already reduced to a single matrix) with `A(k+1)...Aj` (also already reduced to a single
matrix), for some split point `k` with `i <= k < j`. The two matrices being combined at that final
step have shapes `dims[i] x dims[k+1]` and `dims[k+1] x dims[j+1]` — the first spans from the start
of the left subchain to the shared boundary, the second from that boundary to the end of the right
subchain — so that final multiplication costs `dims[i] * dims[k+1] * dims[j+1]` scalar
multiplications, on top of whatever it cost to optimally reduce each side to a single matrix in the
first place:

```
dp[i][j] = min over k in [i, j-1] of:
    dp[i][k] + dp[k+1][j] + dims[i] * dims[k+1] * dims[j+1]
```

Nothing in the problem tells you which `k` is best in advance — that's exactly why every split point
has to be tried and the cheapest one kept, the same "try every choice, keep the optimal one" move
every DP transition in this Part has made, just applied to a choice of _where to cut a range_
instead of _which item to take_ or _which character to align_. Optimal substructure holds here for a
clean reason: the cost of the best way to multiply `Ai...Aj` genuinely decomposes into the best way
to multiply `Ai...Ak`, the best way to multiply `A(k+1)...Aj`, and a final combining cost that
depends only on the two subchains' outer dimensions — never on _how_ either subchain arrived at its
optimal internal grouping. A cheaper-than-optimal `Ai...Ak` can never make the overall `Ai...Aj`
worse, so optimizing each side independently and then optimizing the split is safe.

---

## Fill Order: Why Increasing Interval Length, Not Row or Column

Every table this Part has filled so far used an index-based sweep: Fibonacci went left to right over
one axis, Unique Paths and every 2D chapter since went row by row, because each cell's dependencies
always sat at a strictly smaller row or column index than the cell itself. Try the same habit here
and watch it break.

Suppose the fill loop goes row by row, `i` ascending from `0` to `n - 1`, and within each row, `j`
ascending from `i` to `n - 1` — the row-major order [[03-tabulation|Part 08, Chapter 3]] used for
Unique Paths. Consider `dp[1][3]` from the worked example above. Its recurrence needs, among other
terms, `dp[2][3]` (the `k = 1` split). But `dp[2][3]` lives in **row 2**, and a row-major sweep
finishes row `1` before it ever starts row `2` — so `dp[2][3]` is still sitting at its initial,
uncomputed value when `dp[1][3]` needs it. Row-major reads a cell that hasn't been written yet.
Column-major runs into the mirror-image failure. Neither habit from earlier chapters survives
contact with an interval-shaped dependency.

The fix is to stop indexing by row or column and index by **interval length** instead. Every term on
the right-hand side of the recurrence, `dp[i][k]` and `dp[k+1][j]`, spans a strictly shorter range
than `dp[i][j]` does — `[i, k]` has length `k - i + 1`, `[k+1, j]` has length `j - k`, and because
`i <= k < j`, both are strictly less than `j - i + 1`, the length of `[i, j]` itself — regardless of
where `i` and `j` individually fall. So a fill order that processes every interval of length `1`
first (the base cases), then length `2`, then length `3`, and so on up to length `n`, guarantees
that by the time any `dp[i][j]` is computed, every interval it could depend on is already filled.
The loop nest that follows directly:

```
for length in 2 .. n:               # outer: shortest intervals first
    for i in 0 .. n - length:       # every valid starting index for this length
        j = i + length - 1
        for k in i .. j - 1:        # every split point inside [i, j]
            consider dp[i][k] + dp[k+1][j] + dims[i]*dims[k+1]*dims[j+1]
```

Outer loop over length, middle loop over starting index, inner loop over split point — three nested
loops where earlier 2D chapters needed two, because the third loop is what "try every split point"
the recurrence demands actually costs.

---

## Full Worked Code: The O(n³) Table Fill

```python
from typing import List, Tuple

def matrix_chain_order(dims: List[int]) -> Tuple[List[List[int]], List[List[int]]]:
    """
    dims[i] is the row count of matrix A_i and dims[i + 1] its column count,
    for a chain A_0 .. A_(n-1) where n = len(dims) - 1.

    Returns (dp, split):
      dp[i][j]    = minimum scalar multiplications to compute A_i @ ... @ A_j
      split[i][j] = the k achieving that minimum, for reconstructing the
                    optimal parenthesization
    """
    n = len(dims) - 1  # number of matrices in the chain
    dp = [[0] * n for _ in range(n)]
    split = [[0] * n for _ in range(n)]

    for length in range(2, n + 1):            # dp[i][i] = 0 is the implicit base case
        for i in range(0, n - length + 1):
            j = i + length - 1
            dp[i][j] = float("inf")
            for k in range(i, j):
                cost = dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1]
                if cost < dp[i][j]:
                    dp[i][j] = cost
                    split[i][j] = k

    return dp, split


def build_parenthesization(split: List[List[int]], i: int, j: int) -> str:
    """Walk the split table backward to recover the optimal grouping."""
    if i == j:
        return f"A{i}"
    k = split[i][j]
    left = build_parenthesization(split, i, k)
    right = build_parenthesization(split, k + 1, j)
    return f"({left}{right})"
```

Running it against the worked example:

```python
>>> dims = [10, 30, 5, 60, 10]
>>> dp, split = matrix_chain_order(dims)
>>> dp[0][3]
5000
>>> build_parenthesization(split, 0, 3)
'((A0A1)(A2A3))'
```

`5,000` matches the cheapest of the three hand-computed groupings above — `(A0 A1) (A2 A3)` — and
the DP confirms by exhaustive split-point search that no other grouping among all five possible ones
beats it, without ever having to enumerate parenthesizations directly the way the worked example did
by hand.

---

## Trace: Filling the Table for the Worked Example

Reading the fill in the order the code actually computes it — shortest intervals first — makes the
dependency argument concrete:

| length | `[i, j]` | best `k` | recurrence                          | `dp[i][j]` |
| ------ | -------- | -------- | ----------------------------------- | ---------- |
| 2      | `[0, 1]` | 0        | `dims[0]*dims[1]*dims[2] = 10*30*5` | 1,500      |
| 2      | `[1, 2]` | 1        | `dims[1]*dims[2]*dims[3] = 30*5*60` | 9,000      |
| 2      | `[2, 3]` | 2        | `dims[2]*dims[3]*dims[4] = 5*60*10` | 3,000      |
| 3      | `[0, 2]` | 1        | `dp[0][1] + dp[2][2] + 10*5*60`     | 4,500      |
| 3      | `[1, 3]` | 1        | `dp[1][1] + dp[2][3] + 30*5*10`     | 4,500      |
| 4      | `[0, 3]` | 1        | `dp[0][1] + dp[2][3] + 10*5*10`     | **5,000**  |

Every length-3 entry consumes only length-2 and length-1 (base case) entries the previous pass
already filled. The final length-4 entry, `dp[0][3]`, picks `k = 1`: split into `[0, 1]` (cost
1,500) and `[2, 3]` (cost 3,000), then pay `10*5*10 = 500` to combine those two already-optimal
results — 1,500 + 3,000 + 500 = 5,000, exactly the `(A0 A1)(A2 A3)` grouping the hand computation
found, now arrived at by trying every split point rather than guessing which one to check.

---

## Complexity

**Time: O(n³).** There are `O(n²)` distinct intervals `[i, j]` — roughly `n²/2`, since `i <= j` —
and each one tries up to `O(n)` split points before its value is settled, giving
`O(n²) * O(n) = O(n³)` total work.

**Space: O(n²)** for the `dp` table (and, if reconstructing the parenthesization, an equally sized
`split` table). Unlike Fibonacci's rolling pair or Unique Paths' rolling row —
[[03-tabulation|Part 08, Chapter 3]]'s space-optimization section — there's no small fixed window to
collapse into here: `dp[i][j]` for a long interval can depend on entries scattered anywhere along
the diagonal band of shorter intervals nested inside it, not on a fixed number of recent neighbors.
The full `O(n²)` table is what the recurrence needs kept around.

---

## Common Pitfalls

**Off-by-one on `dims`.** The dimension array has `n + 1` entries for `n` matrices, and it's easy to
index it as if it had `n`. `Ai`'s shape is `dims[i] x dims[i+1]` — get that pairing wrong and every
cost computed downstream is wrong, usually silently, since a shape mismatch here doesn't raise an
error; it just multiplies the wrong two numbers.

**Reaching for row-major or column-major out of habit.** As the fill-order section showed, that
reads unfilled cells — and because `dp` is typically initialized to `0`, not an obviously-wrong
sentinel, the bug doesn't crash. It quietly returns a cost that's too low, because a dependency the
recurrence should have added in was actually still zero.

**Dropping either half of the recurrence's three terms.** `dp[i][j]` needs the cost of optimally
solving _both_ subchains plus the _final_ combining multiplication. Forgetting the combining term
undercounts every interval of length 2 or more; forgetting `dp[i][k]` or `dp[k+1][j]` undercounts
every interval of length 3 or more, since those are already-optimized subchain costs, not raw
dimension products.

**Confusing this DP with actually performing the multiplication.** The algorithm never touches a
single matrix entry — it works entirely off the `dims` shape array and produces a _plan_. Executing
that plan against real matrices is a separate, later step that just follows the parenthesization the
DP already worked out.

---

## This Chapter as the Template for Interval DP

Strip away the matrices and what's left is a shape, not a problem: a state `dp[i][j]` over a range,
a recurrence that tries every split point `k` inside that range and combines the two resulting
halves with some combining cost, a base case where the range collapses to nothing meaningful to
split, and a fill order that has to go by increasing range length because that's the only order
guaranteed to respect the dependency structure. Nothing in that skeleton mentions matrix dimensions
specifically.

That's why matrix chain multiplication earns the role of template rather than just being one more
problem in the list. Whenever a problem's natural recursive decomposition is "choose a point inside
a range and combine what happens on each side," this same machinery reappears wearing different
combining rules — palindrome partitioning chooses where to cut a string into palindromic pieces and
minimizes the cut count; burst balloons chooses which balloon to pop _last_ within a range,
mirroring "which multiplication happens last" here almost exactly.
[[12-interval-dp|Part 08, Chapter 12]] is where those variations get worked out individually — but
the mechanical skeleton built here — `dp[i][j]`, try every split, fill shortest intervals first — is
what every one of them starts from.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
