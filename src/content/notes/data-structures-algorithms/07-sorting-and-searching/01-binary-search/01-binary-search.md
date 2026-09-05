---
title: "1 — Binary Search"
description: "The iterative implementation worth having cold, the three classic bugs (overflow, boundary-convention mixing, non-shrinking updates), the leftmost/rightmost/rotated-array variants, and why Python's bisect module usually beats hand-rolling it."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-48"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/01-what-is-an-algorithm/01-what-is-an-algorithm
    kind: related
---

# 1 — Binary Search

[[01-what-is-an-algorithm|Part 01, Chapter 1]] worked binary search as its running example of what a
_precise_ algorithm looks like — a stated precondition, an invariant, and a postcondition that
covers the not-found case explicitly. That's the algorithm. This chapter is the rest of it: the
actual implementation worth having cold, the three bugs that show up in almost every binary search
written under interview pressure, and the variants — leftmost/rightmost insertion points and
searching a rotated array — that get asked far more often than the textbook "find the exact index"
version. If you haven't read that chapter's precise-version walkthrough, it's the five-minute
prerequisite this one assumes.

---

## The Implementation

The invariant from [[01-what-is-an-algorithm|Part 01, Chapter 1]] committed to a specific convention
without spelling out why it's the one worth defaulting to: a **closed interval** `[lo, hi]`, where
both endpoints are still valid candidates, and a loop that runs `while lo <= hi`. Here's that
algorithm as code, with nothing left implicit:

```python
def binary_search(arr: list[int], target: int) -> int:
    """Return the index of target in arr, or -1 if not present.

    Precondition: arr is sorted in non-decreasing order.
    """
    lo, hi = 0, len(arr) - 1  # closed interval [lo, hi] — both ends still candidates

    while lo <= hi:
        mid = lo + (hi - lo) // 2  # see "Classic Bugs" below for why not (lo + hi) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1   # target, if present, is strictly right of mid
        else:
            hi = mid - 1   # target, if present, is strictly left of mid

    return -1  # lo > hi: the invariant guarantees target isn't in arr
```

This is the version worth having cold — every update in it is defensible by the invariant, and it
recovers immediately if you forget a line mid-interview: recompute `mid`, ask which half, shrink the
boundary that's no longer a candidate.

### The recursive version exists — don't reach for it

Binary search has an equally correct recursive formulation:

```python
def binary_search_recursive(
    arr: list[int], target: int, lo: int = 0, hi: int | None = None
) -> int:
    if hi is None:
        hi = len(arr) - 1
    if lo > hi:
        return -1

    mid = lo + (hi - lo) // 2
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search_recursive(arr, target, mid + 1, hi)
    else:
        return binary_search_recursive(arr, target, lo, mid - 1)
```

It's correct, and in a language with tail-call optimization it would cost nothing extra. Python
doesn't optimize tail calls, so this version pays for `O(log n)` stack frames — one call per halving
— to express exactly the same logic the iterative loop expresses in `O(1)` space. There's no
compensating benefit: it's not clearer, it's not shorter in any way that matters, and it introduces
a recursion-depth ceiling (Python's default is 1000) that the iterative version never approaches for
any array size you'd plausibly binary search. Default to iterative; know the recursive form exists
because interviewers sometimes ask for it specifically, usually to see whether you can articulate
exactly this trade-off rather than to see the recursive code itself.

---

## Classic Bugs

Three bugs account for the overwhelming majority of broken binary search implementations. Each is
precise enough to name, not just list.

### 1. Integer overflow in the midpoint calculation

`mid = (lo + hi) // 2` computes `lo + hi` before dividing. In a language with fixed-width integers —
Java's `int`, C++'s 32-bit `int` — if `lo` and `hi` are both close to the type's maximum
representable value, `lo + hi` overflows: it wraps to a negative number (or triggers undefined
behavior in C++), and the resulting `mid` is garbage — a negative index or one far outside the
intended range. This is not hypothetical: it was a real bug in the JDK's `Arrays.binarySearch` for
roughly a decade before being fixed (documented in Joshua Bloch's "Nearly All Binary Searches and
Mergesorts Are Broken").

The fix, independent of language: `mid = lo + (hi - lo) // 2`. Since `hi >= lo` throughout the
search, `hi - lo` is bounded by the array's length and can't overflow; adding it to `lo` never
produces a sum larger than `hi` itself. The unsafe version's failure mode is computing a _sum_ that
can exceed the type's range; the safe version never computes that sum at all.

In Python, this specific bug can't occur — `int` is arbitrary-precision and grows as needed, so
`lo + hi` never overflows regardless of array size. That's a property of the language runtime, not
of the algorithm. It's worth using the safe idiom anyway: it costs nothing, it's the version that's
actually correct in Java, C++, Go, and Rust, and an interviewer who asks "does this overflow?" is
testing whether you understand _why_ the bug exists, not whether Python happens to be immune to it
this particular week.

### 2. Off-by-one errors from inconsistent boundary conventions

There are two equally valid ways to represent "the range still worth searching":

- **Closed interval `[lo, hi]`** — both `lo` and `hi` are valid candidate indices. Initialize
  `hi = len(arr) - 1`; loop `while lo <= hi`; narrow with `lo = mid + 1` or `hi = mid - 1`. This is
  the convention used throughout this chapter.
- **Half-open interval `[lo, hi)`** — `lo` is a candidate, `hi` is one past the last candidate.
  Initialize `hi = len(arr)`; loop `while lo < hi`; narrow with `lo = mid + 1` or `hi = mid` (no
  `-1`, because `hi` was never itself a candidate).

Both conventions are correct in isolation, and both appear constantly in real codebases — half-open
is what you'll see in most standard-library implementations (including Python's own `bisect`,
below), because it represents "insert at the end" (`hi == len(arr)`) without needing an out-of-range
sentinel. The bug isn't picking one; it's **starting to write one and drifting into the other
mid-implementation** — initializing `hi = len(arr) - 1` (closed-style) but then writing `hi = mid`
on the "go left" branch (half-open-style narrowing), or looping `while lo < hi` (half-open-style)
while still doing `hi = mid - 1` narrowing (closed-style). Every combination of "wrong-convention
initialization + wrong-convention loop test + wrong-convention narrowing" produces either a range
that's off by one element at the boundary, or the infinite loop covered next. The fix is procedural,
not clever: state which convention you're using in one sentence before writing the first line, then
apply it consistently everywhere convention shows up — initialization, loop condition, and both
narrowing branches.

### 3. Infinite loops from an update that doesn't shrink the search space

Under the closed-interval convention (`hi = len(arr) - 1`, `while lo <= hi`), the narrowing step
_must_ strictly shrink `hi - lo` every iteration, or the loop never terminates. Consider what
happens if the "go left" branch is written as `hi = mid` instead of `hi = mid - 1`:

Suppose at some point `lo == hi == mid` (a single-element range). `arr[mid] != target`, and the
target is smaller, so the code takes the "go left" branch: `hi = mid`. But `mid` already equaled
`hi` — so `hi` is unchanged, `lo` is unchanged, the loop condition `lo <= hi` is still true, and the
next iteration recomputes the _identical_ `mid`. Nothing about the state has moved. This is an
infinite loop, not a slow one — it hangs on any input that reaches a single-element range without
finding the target on the left side, which is a completely ordinary case, not a rare edge case
that's easy to avoid triggering.

The rule this bug violates: given the closed-interval convention, `hi = mid - 1` is the only
narrowing step guaranteed to exclude `mid` (already ruled out by `arr[mid] != target`) from the next
range. `hi = mid` only strictly shrinks the range under the half-open convention, where `mid < hi`
is guaranteed by construction — mixing that update into a closed-interval implementation is bug #2
and bug #3 wearing the same trigger.

---

## Variants: Leftmost, Rightmost, and Rotated

The "find the exact index or -1" version above is the textbook case; three variants come up far more
often once you're past the first interview question about binary search.

The insertion-point variants below deliberately switch to the **half-open** convention
(`hi = len(arr)`, `while lo < hi`, `hi = mid` on the "go left" branch). This isn't a slip back into
the mixing bug from the previous section — the reason is structural: the answer to "where would this
insert?" is legitimately `len(arr)` (insert at the very end), a value the closed-interval
convention's `hi = len(arr) - 1` can't represent as a valid index. Each function below picks one
convention and holds it for its own entire body; nothing crosses between functions.

### Leftmost insertion point (`bisect_left`)

The first index `i` such that `arr[i] >= target` — equivalently, the leftmost position `target`
could be inserted at without disturbing sort order. If `target` isn't present, this is exactly where
it would go; if it is present (possibly more than once), this is the index of its first occurrence.

```python
def leftmost(arr: list[int], target: int) -> int:
    """First index i with arr[i] >= target (== len(arr) if none)."""
    lo, hi = 0, len(arr)  # half-open [lo, hi)

    while lo < hi:
        mid = lo + (hi - lo) // 2
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid

    return lo
```

### Rightmost insertion point (`bisect_right` / `bisect`)

The first index `i` such that `arr[i] > target` — the rightmost position `target` could be inserted
at. If `target` is present, this is one past the index of its _last_ occurrence.

```python
def rightmost(arr: list[int], target: int) -> int:
    """First index i with arr[i] > target (== len(arr) if none)."""
    lo, hi = 0, len(arr)

    while lo < hi:
        mid = lo + (hi - lo) // 2
        if arr[mid] <= target:
            lo = mid + 1
        else:
            hi = mid

    return lo
```

The entire difference between `leftmost` and `rightmost` is one character: `<` versus `<=` in the
comparison that decides whether `mid` still belongs on the left. That's the whole variant — worth
noticing precisely because it means getting it backwards is a one-character bug that silently
returns the wrong occurrence rather than crashing.

Existence-check and count-of-occurrences both fall out of these two directly:

```python
def contains(arr: list[int], target: int) -> bool:
    i = leftmost(arr, target)
    return i < len(arr) and arr[i] == target

def count_occurrences(arr: list[int], target: int) -> int:
    return rightmost(arr, target) - leftmost(arr, target)
```

### Search in a rotated sorted array

A sorted array that's been rotated at an unknown pivot — e.g. `[4, 5, 6, 7, 0, 1, 2]`, originally
`[0, 1, 2, 4, 5, 6, 7]` rotated left by four — is no longer globally sorted, so the original "which
half is the target in" logic doesn't directly apply. But it isn't unordered either: **at any
midpoint split, at least one of the two halves is guaranteed to still be sorted** (the rotation
point can only fall in one of them). That's the entire trick — determine which half is sorted by a
plain comparison, then check whether the target falls within that sorted half's range; if it does,
recurse into it, and if it doesn't, the target must be in the other half (whether or not that half
is itself sorted).

```python
def search_rotated(arr: list[int], target: int) -> int:
    lo, hi = 0, len(arr) - 1  # closed interval — back to the original convention

    while lo <= hi:
        mid = lo + (hi - lo) // 2

        if arr[mid] == target:
            return mid

        if arr[lo] <= arr[mid]:
            # left half [lo, mid] is sorted
            if arr[lo] <= target < arr[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            # right half [mid, hi] is sorted
            if arr[mid] < target <= arr[hi]:
                lo = mid + 1
            else:
                hi = mid - 1

    return -1
```

`arr[lo] <= arr[mid]` is the test that identifies which half is sorted: if the left endpoint isn't
greater than the midpoint, nothing between them could have wrapped around, so `[lo, mid]` is sorted
(the `<=` rather than `<` matters here — it keeps single- and two-element ranges, where `lo == mid`,
correctly classified as sorted). Once you know which half is sorted, checking
`arr[lo] <= target < arr[mid]` (or the mirror on the right) is an ordinary range check against a
genuinely sorted slice — the same comparison the classic algorithm makes, just against a half
instead of the whole array.

Duplicates break the sortedness test's precision: if `arr[lo] == arr[mid] == arr[hi]`, equality
alone can't tell you which half wrapped — `[1, 3, 1, 1, 1]` and `[1, 1, 1, 3, 1]` produce the
identical `arr[lo], arr[mid], arr[hi]` triple at some split despite the pivot being in different
places. The usual fix when duplicates are allowed (LeetCode's "Search in Rotated Sorted Array II")
is to shrink the ambiguous boundary by one (`lo += 1` or `hi -= 1`) and retry, which resolves the
ambiguity but degrades the worst case to `O(n)` — a direct consequence of losing the property the
whole algorithm depends on.

---

## Python's `bisect` Module

Everything in the "Variants" section above is already implemented, correctly and efficiently, in
Python's standard library. `bisect` (technically `bisect_right`) matches `rightmost` above;
`bisect_left` matches `leftmost`; both run in `O(log n)`:

```python
import bisect

arr = [1, 3, 5, 7, 9]

bisect.bisect_left(arr, 5)    # 2 — leftmost valid slot for 5 (arr[2] == 5)
bisect.bisect_right(arr, 5)   # 3 — rightmost valid slot for 5
bisect.bisect(arr, 5)         # 3 — bisect is an alias for bisect_right
```

`insort_left` / `insort_right` (and the bare `insort`, an alias for `insort_right`) combine the
search with the insertion, keeping a list sorted in place:

```python
bisect.insort_left(arr, 4)    # arr -> [1, 3, 4, 5, 7, 9]
```

The existence check from the hand-rolled `contains` above is the idiomatic way to use `bisect` for
membership testing — there's no `bisect_contains`, because the module's job is finding the position,
not the boolean:

```python
def contains(arr: list[int], target: int) -> bool:
    i = bisect.bisect_left(arr, target)
    return i < len(arr) and arr[i] == target
```

Two details worth having, because they change which tool is actually correct for a given problem:

- **`insort`'s cost is not `O(log n)` end to end.** Finding the position is `O(log n)`; inserting
  into a Python `list` at that position is `O(n)`, because everything after it has to shift over one
  slot — lists are contiguous arrays under the hood, not linked structures. Calling `insort` in a
  loop to build up a large sorted collection is `O(n²)` overall, same as any other repeated
  shift-insert. If the access pattern is genuinely "insert into a large collection repeatedly, in
  sorted order, many times," a structure built for that — a balanced BST, a skip list, or the
  third-party `sortedcontainers.SortedList` (`O(log n)` insert) — is the right tool, not
  `bisect.insort` on a plain list.
- **The `key` parameter** (Python 3.10+) lets `bisect_left` / `bisect_right` / `insort_left` /
  `insort_right` search a list of objects by a derived value, without pre-building a parallel list
  of keys: `bisect.bisect_left(people, 30, key=lambda p: p.age)` finds the insertion point for age
  30 directly against a list of `Person` objects sorted by age.

Given all of this, reaching for `bisect` directly is the right default any time the problem is
really "leftmost/rightmost position in a sorted sequence" — it's tested, it's fast, and hand-rolling
it adds risk (the bugs above) for no benefit. The exception is the interview room itself: if the
question is explicitly "implement binary search" or a variant, the interviewer wants the hand-rolled
version on the whiteboard — which is exactly why the manual implementations above are worth keeping
cold even though `bisect` would make them unnecessary in production code.

---

## Complexity and the Precondition That's Easy to Forget

**Time: `O(log n)`.** Each iteration discards half of the remaining candidates, so the number of
iterations to shrink an `n`-element range down to zero is `⌈log₂(n + 1)⌉` — the same bound whether
you're finding an exact match or an insertion point.

**Space: `O(1)` for the iterative version** — two integer pointers (`lo`, `hi`) and no other state
that grows with input size. The recursive version costs `O(log n)` stack frames for the exact same
logic, which is the whole argument from "The Implementation" for defaulting to iterative.

**The precondition that's easy to forget:** binary search requires the array to already be sorted —
or more precisely, to have the monotonic structure the search's "which half do I discard" logic
depends on: a point past which a predicate flips from false to true (or a value crosses from
less-than-target to greater-than-target) and never flips back. Sortedness is the common instance of
that structure; a later chapter's "binary search on answer" generalizes it to predicates that aren't
about array order at all.

This precondition is dangerous specifically _because_ it fails silently. Running binary search on
unsorted data doesn't throw an exception or crash — it just returns a wrong answer, or a false "not
found," because the halving logic assumes an ordering that isn't actually there. Take
`arr = [5, 1, 4, 2, 8]` and search for `2`: `lo=0, hi=4, mid=2`, `arr[2] = 4`. Since `4 > 2`, the
algorithm concludes the target must be in the left half and sets `hi = mid - 1 = 1` — discarding
indices `2, 3, 4`, which is exactly where `2` actually lives (`arr[3] == 2`). The search proceeds
confidently through a range that no longer contains the answer and returns `-1`. Nothing about that
run looked wrong from the inside; the bug is entirely in the input violating a precondition the
algorithm never checks and has no way to check in `O(log n)` — verifying sortedness is itself an
`O(n)` operation, which would defeat the entire point of running a logarithmic search in the first
place.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
