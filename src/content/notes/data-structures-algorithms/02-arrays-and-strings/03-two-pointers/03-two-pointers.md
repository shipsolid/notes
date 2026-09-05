---
title: "3 — Two Pointers"
description: "Opposite-direction and same-direction pointer techniques for sorted arrays — Two Sum II, Container With Most Water, 3Sum, and in-place duplicate removal — plus how to tell the pattern apart from sliding window."
tags: ["data-structures-algorithms","arrays-strings","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-8"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/01-arrays/01-arrays
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/01-two-pointers-pattern/01-two-pointers-pattern
    kind: related
---

# 3 — Two Pointers

A brute-force pair search checks every `(i, j)` combination — O(n²). Once the array is sorted, that
nested loop is wasted work: sorted order tells you, for free, which direction the answer lies in.
Two pointers spends that information instead of ignoring it, collapsing an O(n²) scan into a single
O(n) pass with no extra memory.

This chapter covers two array-scanning variants: pointers converging from opposite ends, and
pointers moving in the same direction with one trailing the other. A third variant — fast and slow
pointers on a linked structure, for cycle detection — has its own chapter in Part 14
([[03-fast-and-slow-pointer]]); nothing here overlaps with it.

---

## The Core Pattern: Converging From Both Ends

**Recognition signal:** the problem says (or implies) "sorted array" and asks for a pair, triplet,
or region satisfying a condition on a sum, difference, or area.

Setup: `left` at index `0`, `right` at index `n - 1`. At each step, evaluate a **comparison** on
`arr[left]` and `arr[right]` — too big, too small, or just right — and the comparison decides which
pointer moves:

- Pair overshoots the target → move `right` inward (sorted order makes `right - 1` the _only_ way to
  get a smaller value from that side).
- Pair undershoots → move `left` inward, same reasoning in reverse.

Each step permanently eliminates one candidate, and none is ever revisited — that's what makes the
scan O(n) instead of O(n²). The nested loop is gone because sorting already told you which half of
the search space to discard.

---

## Worked Example: Two Sum on a Sorted Array

**Problem (Two Sum II):** given a sorted array, find the indices of two numbers that sum to a
target.

```python
def two_sum_sorted(nums: list[int], target: int) -> tuple[int, int]:
    left, right = 0, len(nums) - 1
    while left < right:
        current = nums[left] + nums[right]
        if current == target:
            return left, right
        if current < target:
            left += 1   # sum too small -> only a larger left value can help
        else:
            right -= 1  # sum too big -> only a smaller right value can help
    raise ValueError("no pair sums to target")
```

**Complexity:** O(n) time, O(1) extra space.

Compare this against the hashing-based Two Sum in the [[06-hashing]] chapter later in this Part:
that version handles an _unsorted_ array in O(n) time by trading space — an O(n) hash map — for not
needing a sort. This version trades the other way: sorted input (or a paid-once `O(n log n)` sort)
buys the same O(n) scan for O(1) extra space. Same problem, opposite resource spent.

---

## Worked Example: Container With Most Water

**Problem:** given `n` vertical lines at each index with height `arr[i]`, find two lines that,
together with the x-axis, form the container holding the most water. Area is
`min(height[left], height[right]) * (right - left)`.

```python
def max_area(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        width = right - left
        current_area = min(height[left], height[right]) * width
        best = max(best, current_area)
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best
```

**Complexity:** O(n) time, O(1) extra space, vs. O(n²) for checking every pair of walls.

**The correctness argument** (not just "it works"): area is capped by the _shorter_ wall, since
water can't rise above it. Say `height[left] < height[right]`. Every container that keeps `left`
fixed and moves `right` inward has smaller-or-equal width, and its cap stays at `height[left]` —
moving `right` can only hold or lower that cap, never raise it. So nothing paired with a fixed
`left` can beat the current area, meaning `left` must move to have any chance of improving. Moving
`right` instead shrinks the width while the cap stays identical — strictly worse. Advancing the
shorter wall's pointer is the only move that preserves a chance of improvement.

---

## Worked Example: 3Sum

**Problem:** find all unique triplets in an array that sum to zero.

The brute-force is O(n³) — three nested loops. Fixing one element turns it into "find two other
elements that sum to `-arr[i]`" — exactly the Two Sum II problem above, solvable in O(n) once the
array is sorted. That's the whole trick: **sort once, then fix + two-pointer**.

```python
def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    n = len(nums)
    triplets = []
    for i in range(n - 2):
        if nums[i] > 0:
            break  # smallest element positive -> no triplet can sum to 0
        if i > 0 and nums[i] == nums[i - 1]:
            continue  # skip duplicate anchors
        left, right = i + 1, n - 1
        target = -nums[i]
        while left < right:
            current = nums[left] + nums[right]
            if current == target:
                triplets.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1  # skip duplicate low value
                while left < right and nums[right] == nums[right + 1]:
                    right -= 1  # skip duplicate high value
            elif current < target:
                left += 1
            else:
                right -= 1
    return triplets
```

**Complexity:** O(n²) — O(n log n) to sort, then O(n) anchors each running an O(n) scan.

Sorting does double duty here: it's what makes the two-pointer scan itself valid (the convergence
argument only holds on a sorted array), _and_ it's what turns duplicate-skipping into a cheap
`arr[i] == arr[i - 1]` neighbor check instead of a separate dedup pass or a `set` of tuples. Both
benefits come from the same one sort — that's why 3Sum always starts with `nums.sort()`.

---

## Same-Direction Variant: Removing Duplicates In Place

Not every two-pointer problem converges from opposite ends. Some move in the **same direction**, one
pointer reading ahead and the other trailing behind, writing only the values worth keeping.

**Problem:** given a sorted array, remove duplicates in place so each unique value appears once, and
return the count of unique elements.

```python
def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    write = 0  # index of the last confirmed-unique value
    for read in range(1, len(nums)):
        if nums[read] != nums[write]:
            write += 1
            nums[write] = nums[read]
    return write + 1  # count of unique elements
```

**Complexity:** O(n) time, O(1) extra space — rewritten in place, no new array allocated.

`read` scans every element once; `write` only advances on a genuinely new value, so it always trails
`read`. Because the array is sorted, "different from `nums[write]`" is equivalent to "not a
duplicate" — which is what makes a single trailing pointer sufficient, with no lookahead buffer.

---

## Two Pointers vs. Sliding Window

Both patterns scan an array with two indices and both cut a nested loop to O(n), which is why they
get confused. The distinguishing question is **what triggers a pointer to move**:

- **Two pointers** reacts to a **comparison** at each step — pair too big or too small, one wall
  shorter than the other. The decision is local: look at the two values under the pointers, move
  one.
- **Sliding window** ([[04-sliding-window]], next chapter) reacts to a **running aggregate** — a
  sum, count, or character set accumulated over the window — crossing a threshold. The decision
  depends on history, not just the two boundary values.

Fast tell: if the decision needs what's accumulated _inside_ the region, it's sliding window. If it
only needs the two boundary elements, it's two pointers.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
