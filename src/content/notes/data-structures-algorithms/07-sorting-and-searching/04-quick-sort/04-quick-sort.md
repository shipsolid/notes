---
title: "4 — Quick Sort"
description: "Lomuto partitioning traced step by step, a precise derivation of the O(n log n) average case and the O(n²) worst case, randomized and median-of-three pivot mitigations, and why quicksort is in-place but not stable."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-52"
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/03-sorting-fundamentals/03-sorting-fundamentals
    kind: related
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
---

# 4 — Quick Sort

Every sort you've seen so far decides where the split falls before it looks at a single element: cut
the array at the midpoint, recurse, done — the split is fixed by the index, not the data. Quicksort
inverts that. It picks one element — the **pivot** — and uses it to ask a data-dependent question of
everything else: are you smaller than the pivot, or bigger? Only after that question has been
answered for every element does quicksort know where the split actually falls, and the answer isn't
a fixed n/2 — it depends entirely on how good a pivot happened to be. That one design choice is the
source of everything interesting here: quicksort's typical speed, its embarrassing worst case, and
why, despite that worst case, it's still the algorithm production sorts reach for first.

---

## The Core Idea: Partition, Then Recurse

Quicksort is divide and conquer in the same shape
[[05-algorithm-design-principles|Part 01, Chapter 5]] described in the abstract: split the problem
into independent subproblems, solve each recursively, done. But quicksort inverts _where the work
happens_ relative to the other divide-and-conquer sort this book covers, and that inversion is worth
flagging before any code, not after:

- **Quicksort does the hard work before recursing.** The **partition** step rearranges the array in
  place around a chosen pivot so that every element less than the pivot ends up to its left, every
  element greater ends up to its right, and the pivot itself lands in its final, correct sorted
  index — not just "somewhere near the middle," its actual resting place in the fully sorted array.
  That's real, nontrivial work: every element has to be inspected and possibly moved. Once it's
  done, quicksort recurses on the left and right partitions independently — and needs **no combining
  step afterward**, because the pivot is already exactly where it belongs and both sides, once
  individually sorted, are already correctly positioned relative to it and to each other.
- **Merge sort — next chapter — does the opposite.** It splits the array at the midpoint, which
  costs nothing to compute and requires no inspection of the data at all, recurses on both trivially
  formed halves, and only then does the nontrivial work: merging two already-sorted halves back
  together in one linear pass.

|                           | Split                                                | Combine                                                                                    |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Quicksort                 | Hard — partitioning inspects and moves every element | None — pivot is already final, halves are already correctly ordered relative to each other |
| Merge sort (next chapter) | Trivial — just an index midpoint                     | Hard — merging two sorted halves                                                           |

Same paradigm, same recurrence shape, opposite half of the work moved to the other side of the
recursive call. Keep that contrast in mind through both chapters — it's the cleanest way to remember
which algorithm does what, and it's exactly the difference that explains the space and stability
contrasts later in this chapter.

The overall recursive skeleton, before pinning down exactly how partitioning works:

```
quicksort(arr, lo, hi):
    if lo < hi:
        p = partition(arr, lo, hi)      # rearranges arr[lo..hi], returns pivot's final index
        quicksort(arr, lo, p - 1)       # left partition, sorted independently
        quicksort(arr, p + 1, hi)       # right partition, sorted independently
    # no merge step — arr[lo..hi] is now fully sorted
```

Everything below is about what `partition` actually does, how well it splits the array, and what
happens when it splits badly.

---

## Lomuto Partition: Full Implementation

The **Lomuto partition scheme** is the simpler of the two standard partitioning schemes to explain
(the other, Hoare's original scheme, uses two inward-moving pointers and is slightly more efficient
— fewer swaps on average — but trickier to reason about correctly). Lomuto always picks the **last
element** of the current range as the pivot, then makes a single left-to-right pass maintaining one
invariant: everything at or before a boundary index `i` is confirmed less than the pivot; everything
between `i` and the current scan index `j` has been checked and found _not_ less than the pivot;
everything after `j` hasn't been examined yet.

```python
def lomuto_partition(arr, lo, hi):
    pivot = arr[hi]          # last element is the pivot
    i = lo - 1                # boundary: index of the last element known to be < pivot

    for j in range(lo, hi):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i + 1], arr[hi] = arr[hi], arr[i + 1]   # swap pivot into its final position
    return i + 1


def quicksort(arr, lo=0, hi=None):
    if hi is None:
        hi = len(arr) - 1
    if lo < hi:
        p = lomuto_partition(arr, lo, hi)
        quicksort(arr, lo, p - 1)
        quicksort(arr, p + 1, hi)
    return arr
```

### Trace: `[10, 80, 30, 90, 40]`

Call `lomuto_partition(arr, 0, 4)`. Pivot is `arr[4] = 40`. Start `i = -1`.

| `j` | `arr[j]` | `< 40`? | Action                                 | Array after this step  |
| --- | -------- | ------- | -------------------------------------- | ---------------------- |
| 0   | 10       | yes     | `i` → 0, swap `arr[0], arr[0]` (no-op) | `[10, 80, 30, 90, 40]` |
| 1   | 80       | no      | nothing                                | `[10, 80, 30, 90, 40]` |
| 2   | 30       | yes     | `i` → 1, swap `arr[1], arr[2]`         | `[10, 30, 80, 90, 40]` |
| 3   | 90       | no      | nothing                                | `[10, 30, 80, 90, 40]` |

Loop ends. Final step: swap `arr[i + 1] = arr[2]` with `arr[hi] = arr[4]` → `[10, 30, 40, 90, 80]`.
Return `i + 1 = 2`. The pivot `40` has landed at index 2 — its correct final position — with
`[10, 30]` (everything less than 40) to its left and `[90, 80]` (everything greater) to its right.

Recursion continues on both sides independently, with **no merge step**:

- `quicksort(arr, 0, 1)` on `[10, 30]`: pivot `30`, nothing is less than it, one no-op swap, already
  in place.
- `quicksort(arr, 3, 4)` on `[90, 80]`: pivot `80` (last element), `90 < 80` is false, so the loop
  does nothing, then the final swap puts `80` at index 3 and `90` at index 4 → `[80, 90]`.

Final array: `[10, 30, 40, 80, 90]` — sorted, with every element having moved exactly as many times
as the partition calls required and not one merge pass run afterward.

---

## Average Case: O(n log n)

If the pivot happens to land near the middle of the current range — not exactly at the midpoint,
just "roughly balanced" — each partition call splits the current subarray into two pieces that are
both meaningfully smaller than the whole, and the recursion depth stays O(log n): the same argument
[[02-asymptotic-analysis|Part 01, Chapter 2]] used for merge sort's recursion depth, because halving
(even roughly) a quantity n takes log₂ n halvings to reach 1 regardless of which algorithm is doing
the halving.

At each level of that recursion, the partition calls active at that level collectively touch every
element of the original array exactly once — the subarrays at a given level don't overlap, and
partitioning a subarray of size `k` costs O(k) — so the total work summed across all the partition
calls at one level is O(n), same as one merge pass at one level of merge sort's recursion. That
gives the identical recurrence shape:

```
T(n) = 2·T(n/2) + O(n)   →   O(log n) levels × O(n) work per level   →   O(n log n)
```

This is what "quicksort is O(n log n)" means with no qualifier attached: not that every input
produces an exactly-balanced split (it doesn't), but that across random or typical inputs, pivots
land "good enough" often enough — say, anywhere in the middle half of the current range — that the
_expected_ recursion depth stays O(log n). A pivot doesn't need to be the exact median to keep the
recursion shallow; it just needs to avoid being consistently the extreme value, which is precisely
the condition the worst case below violates.

O(n log n) is also the tightest bound possible for any comparison-based sort — the Ω(n log n) lower
bound [[03-sorting-fundamentals|the previous chapter]] derives from the decision-tree argument.
Quicksort's average case doesn't beat that floor; it meets it, with a smaller constant factor than
merge sort in practice, which is the whole reason it's worth the worst case explored next.

---

## Worst Case: O(n²), and Why

Lomuto's pivot rule — always the last element — is deterministic, and deterministic pivot rules can
be defeated by deterministic input. Consider an **already ascending-sorted array**,
`[1, 2, 3, 4, 5]`, run through the exact `lomuto_partition` above.

The pivot is always `arr[hi]`, and on a sorted array, the last element of any remaining range is
always the **maximum** of that range. Every other element is therefore less than it, so the
partition's inner loop increments `i` on every single iteration — every element before the pivot
gets classified into the "less than" side. The result: a split of size `(n - 1, 0)` — one full
subarray containing everything except the pivot, and one empty subarray. (A reverse-sorted,
descending array produces the mirror image: the last element of any remaining range is always the
**minimum**, nothing passes the `< pivot` test, and the split comes out `(0, n - 1)` instead — same
degenerate shape, flipped.)

This is exactly the worst-case example [[02-asymptotic-analysis|Part 01, Chapter 2]] used when it
first distinguished worst, average, and best case: "the pivot is always the smallest or largest
remaining element... Every partition splits n elements into a group of 1 and a group of n−1. That's
n levels instead of log n, each doing O(n) work — O(n²)." This chapter is where that claim gets its
actual derivation, not just its assertion.

Because one side of every split is empty, the recursion doesn't halve — it only shrinks by one pivot
per call. That's `n` levels of recursion instead of `log n`. Write it as a recurrence and solve it
exactly rather than waving at the shape:

```
T(n) = T(n - 1) + O(n)
     = O(n) + O(n - 1) + O(n - 2) + ... + O(1)
     = O(n + (n-1) + (n-2) + ... + 1)
     = O(n(n+1)/2)
     = O(n²)
```

Each level partitions one fewer element than the level above it — n, then n−1, then n−2, and so on
down to 1 — and that arithmetic series sums to n(n+1)/2, which is Θ(n²). The "n levels, each doing
O(n) work" framing is the fast intuitive version of the same result; the summation above is the
version that survives a follow-up question about where the extra factor of n actually comes from.

The practical sting: "already sorted" isn't a pathological edge case dreamed up for an interview —
it's an extremely common shape for real data (timestamps, auto-incrementing IDs, log lines already
in arrival order), which means naive last-element-pivot quicksort can hit its worst case on
completely ordinary production input, not just adversarially constructed ones.

---

## Mitigations: Randomized Pivot and Median-of-Three

Both mitigations attack the same root cause — a pivot rule whose bad case is a predictable function
of input order — but from different angles.

### Randomized pivot selection

Before partitioning, swap a **uniformly random element** from the current range into the pivot
position, then run the exact same Lomuto partition unchanged:

```python
import random

def randomized_partition(arr, lo, hi):
    rand_idx = random.randint(lo, hi)
    arr[rand_idx], arr[hi] = arr[hi], arr[rand_idx]
    return lomuto_partition(arr, lo, hi)


def quicksort_randomized(arr, lo=0, hi=None):
    if hi is None:
        hi = len(arr) - 1
    if lo < hi:
        p = randomized_partition(arr, lo, hi)
        quicksort_randomized(arr, lo, p - 1)
        quicksort_randomized(arr, p + 1, hi)
    return arr
```

The key effect: the worst case no longer depends on what the _input_ looks like, only on what the
_random number generator_ produces. An already-sorted array is no longer reliably adversarial,
because "always pick the last element" is no longer the rule — which specific element acts as pivot
on a given call is now a coin flip independent of input order. That flips the worst case from
"guaranteed by a predictable input pattern" to "an event whose probability shrinks so fast with `n`
that it's not worth worrying about" — the **expected** running time, averaged over the algorithm's
own random choices, is O(n log n) **regardless of input order**, including on inputs an adversary
constructed specifically to attack the non-randomized version. The worst case technically still
exists — an extraordinarily unlucky sequence of random picks can still produce a bad split every
time — but "extraordinarily unlucky" here means a probability that vanishes exponentially in `n`,
not a pattern any specific input can force.

### Median-of-three

A cheaper, non-randomized heuristic: before partitioning, look at `arr[lo]`, `arr[(lo+hi)//2]`, and
`arr[hi]`, take their median value, and swap it into the pivot position.

```python
def median_of_three_pivot(arr, lo, hi):
    mid = (lo + hi) // 2
    candidates = [(arr[lo], lo), (arr[mid], mid), (arr[hi], hi)]
    candidates.sort(key=lambda pair: pair[0])
    _, median_idx = candidates[1]        # the middle of the three, by value
    arr[median_idx], arr[hi] = arr[hi], arr[median_idx]


def quicksort_median_of_three(arr, lo=0, hi=None):
    if hi is None:
        hi = len(arr) - 1
    if lo < hi:
        median_of_three_pivot(arr, lo, hi)
        p = lomuto_partition(arr, lo, hi)
        quicksort_median_of_three(arr, lo, p - 1)
        quicksort_median_of_three(arr, p + 1, hi)
    return arr
```

On an already-sorted or reverse-sorted array, the first, middle, and last elements are spread across
the value range rather than clustered at one extreme, so their median is a genuinely reasonable
pivot — this specifically neutralizes the exact inputs that break the plain last-element rule, at
the cost of only two extra comparisons per partition call. But it's still **deterministic**: the
rule "take the median of first, middle, last" is fixed and inspectable, so an adversary who knows
that's the exact heuristic in use can construct an input engineered to make _that_ rule degenerate
too (this is a real, documented attack against naive median-of-three implementations, not a
theoretical curiosity). Randomization closes that hole because there's no fixed rule left to
reverse-engineer; median-of-three only closes the specific holes its author anticipated.

---

## In-Place, Not Stable

**In-place:** partitioning rearranges elements by swapping them within the original array — no
second array is ever allocated. The only auxiliary memory is the recursion call stack, and its depth
tracks the same split quality as the running time: O(log n) stack depth when splits stay balanced,
degrading to O(n) in the worst case, exactly mirroring the O(n log n) → O(n²) time degradation
above. That's a direct contrast with merge sort, next chapter: merge sort needs an O(n) auxiliary
buffer to merge two sorted halves back together, full stop, regardless of how the input is arranged
— its space cost is fixed, quicksort's is data-dependent. (Production implementations often harden
the stack-depth side of this by recursing on the smaller partition and looping on the larger one —
an iterative tail-call-elimination trick that caps stack depth at O(log n) even when the _time_
complexity is having a bad day. Worth knowing the technique exists; it doesn't change the time
bound, only the space one.)

**Not stable:** partitioning swaps elements based purely on comparison against the pivot value, with
no awareness of — or protection for — the relative order of elements that compare equal. Two equal
values can and do cross each other during the swaps. Concretely, using tagged values to make
identity visible:

```python
class Tagged:
    def __init__(self, key, tag):
        self.key, self.tag = key, tag
    def __repr__(self):
        return f"{self.key}{self.tag}"

def lomuto_partition_tagged(arr, lo, hi):
    pivot = arr[hi].key
    i = lo - 1
    for j in range(lo, hi):
        if arr[j].key < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[hi] = arr[hi], arr[i + 1]
    return i + 1

arr = [Tagged(3, "a"), Tagged(1, "b"), Tagged(3, "c")]
lomuto_partition_tagged(arr, 0, 2)
print(arr)   # [1b, 3c, 3a]
```

Two elements share key `3`: `3a` starts at index 0, `3c` starts at index 2 — `3a` before `3c` in the
original array. Trace it: pivot is `3c` (key 3). `j = 0`: `3a`'s key, `3 < 3`, is false — no swap.
`j = 1`: `1b`'s key, `1 < 3`, is true — `i` becomes 0, and `arr[0]` swaps with `arr[1]`, giving
`[1b, 3a, 3c]`. Loop ends; the final step swaps `arr[i+1] = arr[1]` with `arr[hi] = arr[2]`, giving
`[1b, 3c, 3a]`. The two key-3 elements are now `3c` then `3a` — their relative order has
**flipped**, even though every individual comparison the algorithm made (`< pivot` or not) was
answered correctly. That's instability made concrete rather than asserted: nothing went wrong, and
the order still changed, because the algorithm was never designed to preserve it in the first place.
Contrast with [[03-sorting-fundamentals|the previous chapter]]'s definition of stability — quicksort
simply doesn't meet it, by construction, not by bug.

---

## Why Production Sorts Still Reach for Quicksort

Given a guaranteed-O(n log n) alternative sitting one chapter over, quicksort's O(n²) worst case
looks like it should have lost this competition decades ago. In practice it usually wins anyway, for
two reasons that don't show up in the asymptotic bound at all: a smaller constant factor per
comparison (in-place swaps rather than writes into a second buffer), and much better cache locality,
because the whole algorithm operates on contiguous memory it already owns instead of repeatedly
allocating and copying into fresh buffers the way merge sort's merge step does. Same O(n log n)
headline in the common case, meaningfully less real work per element underneath it.

Rather than pick a side, production general-purpose sorts hedge. **Introsort** ("introspective
sort") — the algorithm behind C++'s `std::sort` — runs ordinary quicksort by default but tracks
recursion depth as it goes. If depth exceeds a safe threshold (roughly `2·log₂ n`) — a direct signal
that partitions are behaving close to the degenerate worst case rather than the well-behaved average
one — it abandons quicksort on that subarray and falls back to [[06-heap-sort|Heap Sort]], two
chapters ahead, whose worst case is a guaranteed O(n log n) with no data-dependent escape hatch
needed. The fallback only fires when the depth signal says trouble is already happening, so the
common case pays none of heap sort's usually-worse constant factor, and the rare adversarial case
still gets a hard ceiling on how bad things are allowed to get. (Most introsort implementations also
drop down to insertion sort below some small size threshold, since its low overhead beats any O(n
log n) algorithm's setup cost on tiny arrays — a detail worth knowing about, not worth deriving
here.)

That's the actual industry answer to "quicksort or merge sort": not a permanent choice of one over
the other, but quicksort's speed with heap sort standing behind it as an escape hatch for exactly
the inputs this chapter spent its worst-case section deriving.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
