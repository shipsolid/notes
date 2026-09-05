---
title: "2 — Array Algorithms"
description: "In-place rotation via the reversal trick, Kadane's maximum subarray, Dutch National Flag partitioning, merging sorted arrays in place, and the sum/XOR tricks for a missing or duplicate number."
tags: ["data-structures-algorithms","arrays-strings","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-7"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/01-arrays/01-arrays
    kind: related
---

# 2 — Array Algorithms

Two pointers, sliding window, prefix sums, and hashing each get their own chapter next, because each
is a _pattern_ — a shape of solution that recurs across dozens of otherwise-unrelated problems. This
chapter is what's left after subtracting the patterns: five specific, load-bearing techniques on the
same [[01-arrays|contiguous, index-addressable]] layout that don't generalize the same way, but show
up often enough — and are elegant enough — that each is worth knowing cold. Reversal-based rotation,
Kadane's algorithm, three-way partitioning, the from-the-back merge, and the sum/XOR family for a
missing or duplicate number all share one property: each trades an obvious O(n·k) or O(n²) approach
for an O(n)-time, O(1)-space one, using a single structural insight instead of a second data
structure.

---

## In-Place Rotation: The Reversal Trick

"Rotate the array right by k" has an obvious naive solution: pop the last element, insert it at the
front, repeat k times.

```python
def rotate_naive(nums, k):
    n = len(nums)
    k %= n
    for _ in range(k):
        nums.insert(0, nums.pop())
    return nums
```

Each `pop()`/`insert(0, ...)` shifts every remaining element by one slot — O(n) — and runs k times:
**O(n·k) time**. For k proportional to n that's O(n²) — it looks like a cheap loop until you notice
what `insert(0, ...)` actually costs.

The fix reuses one O(1)-space primitive — reversing a subrange in place — three times instead of
shifting elements one at a time:

```python
def reverse(nums, lo, hi):
    while lo < hi:
        nums[lo], nums[hi] = nums[hi], nums[lo]
        lo += 1
        hi -= 1

def rotate_reversal(nums, k):
    n = len(nums)
    k %= n
    reverse(nums, 0, n - 1)      # whole array
    reverse(nums, 0, k - 1)      # first k elements
    reverse(nums, k, n - 1)      # remaining n - k elements
    return nums
```

Trace on `[1,2,3,4,5,6,7]`, k=3:

```
reverse(0, 6):  [7,6,5,4,3,2,1]
reverse(0, 2):  [5,6,7,4,3,2,1]
reverse(3, 6):  [5,6,7,1,2,3,4]
```

Reversing the whole array puts every element into its final _relative_ rotated order, but with both
the front block and back block individually backwards. Re-reversing each block independently
un-reverses only within that block, leaving the block-level order intact. Three linear passes sum to
**O(n) time, O(1) auxiliary space** — no second array, no per-element shifting.

## Kadane's Algorithm: Maximum Subarray

The brute-force answer to "find the contiguous subarray with the largest sum" checks every
`(start, end)` pair — O(n²) pairs, O(n²) total with a running sum per start index. Kadane's
algorithm gets there in one pass by treating it as dynamic programming in disguise: define
`best_ending_here[i]` as the max-sum subarray that must end exactly at index i. It has a two-choice
recurrence — extend the best subarray ending at i−1, or start fresh at i:

```
best_ending_here[i] = max(nums[i], best_ending_here[i-1] + nums[i])
```

The answer is `max(best_ending_here[i] for all i)`. The DP table collapses to two scalars because
each state depends only on the one before it:

```python
def max_subarray(nums):
    best_ending_here = best_overall = nums[0]
    for x in nums[1:]:
        best_ending_here = max(x, best_ending_here + x)
        best_overall = max(best_overall, best_ending_here)
    return best_overall
```

Nothing here looks like a DP table — just two variables updated in a single scan — which is exactly
why it's worth naming as DP explicitly: "best answer ending here, extend-or-restart" is the same
shape you'll meet again in longest-increasing-subsequence and house-robber-style problems. **O(n)
time, O(1) space**, one pass — no pair of indices is ever compared, because `best_ending_here`
already encodes every ending-at-i answer.

A common follow-up — return the subarray itself, not just its sum — needs one more piece of state: a
`start` index that resets to the current position whenever the recurrence chooses to restart rather
than extend, plus tracking the `(start, end)` pair that produced `best_overall`.

## Dutch National Flag Partitioning

Given an array of only 0s, 1s, and 2s, sort it in one pass without a general-purpose sort and
without a separate counting pass. Dijkstra's Dutch National Flag algorithm partitions the array into
three regions with three pointers — `low`, `mid`, `high` — maintaining an invariant on each region:

```
[0, low)     — all 0s, settled
[low, mid)   — all 1s, settled
[mid, high]  — unknown, not yet examined
(high, n)    — all 2s, settled
```

```python
def sort_colors(nums):
    low, mid, high = 0, 0, len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:                                   # nums[mid] == 2
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1
            # mid does NOT advance: the value just swapped in from `high`
            # is unexamined and could be another 0, 1, or 2
    return nums
```

The `0` and `1` branches both advance `mid` because the swap either brought in an already-classified
low value or the element was already correctly placed; the `2` branch swaps in an _unexamined_ value
from the high end and must re-check it next iteration. Every element is looked at once and every
pointer only moves inward: **O(n) time, O(1) space**, one pass, no second array. This same three-way
partition is the subroutine inside quicksort variants that split "less than / equal to / greater
than" a pivot instead of the usual two-way split — which is what makes them resistant to the
all-duplicates worst case a naive two-way partition suffers.

## Merging Sorted Arrays In Place

The classic framing: `nums1` has length `m + n`, but only its first `m` slots hold real sorted
values — the trailing `n` slots are unused capacity. `nums2` holds `n` sorted values. Merge `nums2`
into `nums1` in place so all `m + n` values end up sorted.

Merging from the _front_, the way a textbook merge-sort merge does, doesn't work here without a
temporary buffer — writing into `nums1[0]` would overwrite a value from `nums1` not yet compared.
The trick is to merge from the **back**: the trailing empty slots are exactly enough room to place
the largest remaining values first, and every slot written from that point on has already been read.

```python
def merge(nums1, m, nums2, n):
    i, j, write = m - 1, n - 1, m + n - 1
    while j >= 0:                                # nums2 fully placed is the stopping condition
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[write] = nums1[i]
            i -= 1
        else:
            nums1[write] = nums2[j]
            j -= 1
        write -= 1
    return nums1
```

The loop condition is `j >= 0` alone, deliberately. If `nums2` empties first, whatever remains at
the front of `nums1` is already in its final position. If `nums1`'s real values empty first, the
`else` branch keeps firing and drains the rest of `nums2` in — correct, since those are the smallest
values left. One backward pass: **O(m + n) time, O(1) auxiliary space** — the naive alternative
(merge into a new list, copy back) is the same time but spends O(m + n) space, which is the whole
point this problem tests.

## Missing and Duplicate Numbers

Given an array meant to hold each integer in `[1, n]` exactly once, but with one missing, the sum
trick finds it with no extra space: the sum of `1..n` is `n(n+1)/2`; subtract the array's actual sum
and what's left is the number that never got added in.

```python
def find_missing(nums, n):
    """nums holds n - 1 distinct values from 1..n; exactly one is missing."""
    expected = n * (n + 1) // 2
    return expected - sum(nums)
```

The harder variant — exactly `n` values from `[1, n]`, one missing _and_ another duplicated in its
place — needs a second equation, since one sum can't separate two unknowns. Pairing the sum trick
with the sum-of-squares trick (`Σi²` has its own closed form) gives two equations and solves both:

```python
def find_missing_and_duplicate(nums):
    n = len(nums)
    expected_sum = n * (n + 1) // 2
    expected_sq_sum = n * (n + 1) * (2 * n + 1) // 6
    sum_diff = expected_sum - sum(nums)                       # missing - duplicate
    sq_diff = expected_sq_sum - sum(x * x for x in nums)      # missing^2 - duplicate^2
    total = sq_diff // sum_diff                               # missing + duplicate
    missing = (sum_diff + total) // 2
    duplicate = total - missing
    return missing, duplicate
```

Both are **O(n) time, O(1) space** — but the squares version risks overflow in fixed-width languages
at large `n`. The bitwise equivalent — XOR every array value together with every value `1..n`, so
each correctly-present number cancels itself and only the missing/duplicate pair survives — avoids
that entirely and generalizes to a whole family of XOR-based recovery problems; that mechanism gets
full treatment in [[03-xor-problems|XOR Problems]] (Part 11, Bit Manipulation) rather than repeated
here.

A third approach skips arithmetic altogether: **cyclic sort** repeatedly swaps each value to its
"home" index (value `v` belongs at index `v - 1`) in one in-place pass; whichever index doesn't hold
its home value once the pass finishes points at the missing and duplicate numbers directly. That
technique, and the broader pattern of using an array's own index space as a marker, is
[[06-cyclic-sort|Cyclic Sort]] (Part 14, Interview Problem Patterns, Chapter 6).

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
