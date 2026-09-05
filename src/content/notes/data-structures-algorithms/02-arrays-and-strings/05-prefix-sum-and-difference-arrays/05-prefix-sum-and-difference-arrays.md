---
title: "5 — Prefix Sum & Difference Arrays"
description: "Precomputed running sums and difference arrays for O(1) range-sum queries and range-update problems."
tags: ["data-structures-algorithms","arrays-strings","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-10"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/04-mathematical-foundations/04-mathematical-foundations
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/16-prefix-sum-pattern/16-prefix-sum-pattern
    kind: related
---

# 5 — Prefix Sum & Difference Arrays

Given a fixed array, "what's the sum from index 3 to index 700?" should never cost a 700-element
loop — especially not if a thousand more queries just like it are coming. Prefix sums pay one `O(n)`
pass up front so every query after costs `O(1)`. Difference arrays run the same idea backwards: pay
`O(1)` per update, and defer the `O(n)` reconstruction to the one moment you actually read the
result. Same precompute-once trick, opposite ends of the query/update trade-off.

---

## Prefix Sum: O(1) Range Queries After O(n) Preprocessing

Build one array where `prefix[i]` holds the sum of everything in `arr` before index `i`:

```python
def build_prefix(arr: list[int]) -> list[int]:
    """prefix[i] = sum(arr[0:i]); prefix has length len(arr) + 1."""
    prefix = [0] * (len(arr) + 1)
    for i, val in enumerate(arr):
        prefix[i + 1] = prefix[i] + val
    return prefix
```

The leading `0` and off-by-one sizing aren't decoration — they make every range query, including one
starting at index `0`, work with the same formula and no special case:

```python
def range_sum(prefix: list[int], l: int, r: int) -> int:
    """Sum of arr[l..r] inclusive, in O(1)."""
    return prefix[r + 1] - prefix[l]
```

`prefix[r + 1]` is everything up to and including `r`; `prefix[l]` is everything strictly before
`l`. Subtract, and what's left is exactly the window `[l, r]` — no re-walking the array, regardless
of how wide the window is.

This is the same shape as the prime-sieve trade-off from
[[04-mathematical-foundations|Part 01, Chapter 4]]: trial division answers one "is it prime" query
in `O(√n)`; a sieve answers `q` of them in `O(n log log n + q)` by paying the precompute once.
Summing a range directly costs `O(n)` per query — `O(q·n)` for `q` queries; prefix sum turns that
into `O(n)` once plus `O(1)` per query. Same bet: batch the work the first query would have redone
anyway.

The bet only pays off if `arr` doesn't change — a mutation goes stale and forces a rebuild. That
boundary is exactly what a Binary Indexed Tree or Segment Tree (Part 12) removes, trading the `O(1)`
query for `O(log n)` in exchange for supporting updates.

---

## Worked Example: Subarray Sum Equals K

**Problem:** count contiguous subarrays of `nums` summing to exactly `k`. Negatives are allowed, so
a sliding window — which shrinks when the sum gets too big — doesn't apply; sums aren't monotonic.
Brute force checks every `(l, r)` pair: `O(n²)`.

Let `P[i]` be the running prefix sum through index `i`. Subarray `arr[l+1..r]` sums to `k` exactly
when:

```
P[r] - P[l] = k   =>   P[l] = P[r] - k
```

At each index `r`, the question becomes _how many earlier indices `l` had prefix sum `P[r] - k`?_
Track every prefix sum seen so far in a `sum -> frequency` map, turning that into an `O(1)` lookup:

```python
from collections import defaultdict

def subarray_sum_equals_k(nums: list[int], k: int) -> int:
    """Count of contiguous subarrays summing to k. O(n) time, O(n) space."""
    seen = defaultdict(int)
    seen[0] = 1          # empty prefix — handles subarrays starting at index 0
    running_sum = 0
    count = 0

    for num in nums:
        running_sum += num
        count += seen[running_sum - k]   # how many earlier prefixes make this a hit
        seen[running_sum] += 1
    return count
```

`seen[0] = 1` is the same "empty prefix" `build_prefix` encodes as `prefix[0] = 0` — without it, a
subarray starting at index `0` that itself sums to `k` would never register.

**Why the collision logic works:** if indices `i < j` share a prefix sum, `arr[i+1..j]` sums to zero
— the range-sum formula applied to a difference of zero. Shift the target by `k` instead of `0`, and
"two prefixes differ by `k`" becomes "the subarray between them sums to `k`." The map just counts,
at each step, how many earlier points make that shifted equality true.

---

## Difference Arrays: The Inverse Trick

Prefix sum answers "what's the total over this range?" in `O(1)` after paying `O(n)` once.
Difference arrays answer the mirror question — "add `val` to every element in this range" — in
`O(1)` per update, deferring the `O(n)` cost to one reconstruction pass at the end.

```python
def build_diff(arr: list[int]) -> list[int]:
    """diff has one extra slot so range updates never index out of bounds."""
    diff = [0] * (len(arr) + 1)
    diff[0] = arr[0]
    for i in range(1, len(arr)):
        diff[i] = arr[i] - arr[i - 1]
    return diff

def range_update(diff: list[int], l: int, r: int, val: int) -> None:
    """Add val to every element in [l, r], in O(1)."""
    diff[l] += val
    if r + 1 < len(diff):
        diff[r + 1] -= val

def reconstruct(diff: list[int]) -> list[int]:
    """One prefix-sum pass materializes every pending update at once."""
    arr = [0] * (len(diff) - 1)
    running = 0
    for i in range(len(arr)):
        running += diff[i]
        arr[i] = running
    return arr
```

`diff[l] += val` means "from `l` onward, every running sum is `val` higher." `diff[r + 1] -= val`
cancels that boost the instant the range ends, so indices past `r` are untouched — nothing inside
`[l, r]` was written directly, only its two boundaries were.

**Worked example — range increment, many updates, one final read** (Range Addition, LC 370). Given
`length = 5` and `updates = [[1, 3, 2], [0, 2, 3], [2, 4, -1]]` (`[l, r, val]` triples):

```python
def get_modified_array(length: int, updates: list[list[int]]) -> list[int]:
    diff = [0] * (length + 1)
    for l, r, val in updates:
        diff[l] += val
        diff[r + 1] -= val

    result = [0] * length
    running = 0
    for i in range(length):
        running += diff[i]
        result[i] = running
    return result

get_modified_array(5, [[1, 3, 2], [0, 2, 3], [2, 4, -1]])
# [3, 5, 4, 1, -1]
```

Applying each update directly costs `O(r - l + 1)` — `O(u·n)` worst case for `u` updates. The
difference array makes every update `O(1)` regardless of range width and pays the `O(n)`
reconstruction exactly once. It's the prefix-sum trade-off mirrored: pay once at read time instead
of preprocess time, because here writes are frequent and reads are rare.

---

## 2D Prefix Sums

The same idea extends to a grid: answer "what's the sum of this rectangle?" in `O(1)` after one
`O(m·n)` pass. `prefix[i][j]` holds the sum of the rectangle from `(0, 0)` to `(i-1, j-1)` — padded
by one row and column, same reason as the 1D version. Inclusion-exclusion builds it in `O(1)` per
cell by reusing overlapping rectangles already computed, instead of re-summing each one from scratch
(`O(m²n²)`):

```python
def build_2d_prefix(matrix: list[list[int]]) -> list[list[int]]:
    m, n = len(matrix), len(matrix[0])
    prefix = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            prefix[i][j] = (
                prefix[i - 1][j]        # rectangle above
                + prefix[i][j - 1]      # rectangle to the left
                - prefix[i - 1][j - 1]  # subtract — counted in both of the above
                + matrix[i - 1][j - 1]  # this cell itself
            )
    return prefix

def rectangle_sum(prefix: list[list[int]], r1: int, c1: int, r2: int, c2: int) -> int:
    """Sum of matrix[r1..r2][c1..c2] inclusive, in O(1)."""
    return (
        prefix[r2 + 1][c2 + 1]
        - prefix[r1][c2 + 1]
        - prefix[r2 + 1][c1]
        + prefix[r1][c1]
    )
```

"Above" and "left" both include the top-left rectangle `prefix[i-1][j-1]`, so adding both
double-counts it — subtract it back out once: `|A ∪ B| = |A| + |B| - |A ∩ B|` in its most literal
form. `rectangle_sum` is four lookups and three arithmetic ops regardless of rectangle size — this
is Range Sum Query 2D — Immutable (LC 304); "Immutable" is the tell that the matrix can't change
between queries without invalidating `prefix`.

---

## Prefix Sum vs. Sliding Window: When to Reach for Which

Both replace an `O(n²)` nested loop with something linear, and it's easy to reach for the wrong one.
The distinguishing question: **is the array fixed and are you answering many questions about it, or
making a single pass computing one running aggregate?**

|                    | Prefix sum / difference array                          | Sliding window                                          |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------- |
| Array              | Fixed between queries, or many updates before one read | Traversed once, left-to-right                           |
| Good for           | Many range-sum queries; many range-updates             | One pass tracking a contiguous window's aggregate       |
| Handles negatives? | Yes — subtraction doesn't care about sign              | Often no — shrinking assumes the aggregate is monotonic |
| Precompute         | `O(n)` once (`O(m·n)` for 2D)                          | None — window state updates incrementally               |
| Per-step cost      | `O(1)` per query/update                                | `O(1)` amortized per element                            |

The negatives row is the fastest tell in an interview: **Subarray Sum Equals K** looks like a
sliding-window problem until negative numbers break the "shrink when too big" logic a window depends
on — that's the signal to reach for prefix sum plus a hash map instead. If the array is non-negative
and the ask is one pass over it, a window is the cheaper tool: no auxiliary map, no precomputed
table.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
