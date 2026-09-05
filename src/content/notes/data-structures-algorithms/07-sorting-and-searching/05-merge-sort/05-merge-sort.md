---
title: "5 — Merge Sort"
description: "Divide-and-conquer sort with guaranteed O(n log n) and stability, at the cost of O(n) auxiliary space."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-53"
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/04-quick-sort/04-quick-sort
    kind: related
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/05-algorithm-design-principles/05-algorithm-design-principles
    kind: related
---

# 5 — Merge Sort

[[04-quick-sort|Part 07, Chapter 4]] built an entire algorithm around doing the hard work early:
partition first, so that by the time you recurse, the two halves are already correctly positioned
relative to each other and there's nothing left to do when they return. Merge sort takes the
identical divide-and-conquer skeleton — split, recurse, combine — and inverts which half carries the
cost. The split is free. The combine does all the work. Same paradigm, opposite half doing it, and
that one inversion is responsible for every property that distinguishes the two algorithms: merge
sort's ironclad worst-case guarantee, its stability, and the auxiliary memory it spends to get both.

---

## The Core Idea: Trivial Split, Hard Merge

Quicksort's partition step decides, by inspecting values, where the split falls — and that decision
is O(n) work performed _before_ either recursive call, using a pivot chosen from the data itself.
Get a bad pivot on adversarial input and the split lands at 1 and n−1 instead of roughly n/2 and
n/2. The split step is where quicksort's risk lives.

Merge sort's split step asks no such question. Given an array of length `n`, the midpoint is
`n // 2` — an index computed from the _length_, not the _values_. No comparisons, no data movement,
no dependency on what's actually in the array. It is, structurally, impossible for the split to come
out uneven by more than one element, because nothing about the input can influence where it falls.
All the real work — every comparison that actually determines final sorted order — happens _after_
both halves come back from recursion, in the merge step.

```
Quicksort:   partition (O(n), data-dependent) → recurse → recurse            [combine: none, already sorted]
Merge Sort:  split (O(1), index-only)         → recurse → recurse → merge    [combine: O(n), does all the work]
```

|                                | Quicksort                                              | Merge Sort                                  |
| ------------------------------ | ------------------------------------------------------ | ------------------------------------------- |
| Split step                     | Partition around a pivot — O(n) work, value-dependent  | Cut at the midpoint — O(1) work, index-only |
| What determines split balance  | The data (pivot choice can go arbitrarily wrong)       | Nothing — always ⌊n/2⌋ and ⌈n/2⌉            |
| Combine step                   | None — array is already sorted once partition finishes | Merge — O(n) work, this _is_ the sort       |
| Where the cost is front-loaded | Into the split                                         | Into the combine                            |

Both are legitimate divide-and-conquer algorithms by
[[05-algorithm-design-principles|Part 01, Chapter 5]]'s definition — subproblems solved
independently, combined by a step that's cheap relative to solving the union from scratch. Merge
sort is simply the version where "cheap" for the split means _free_, and the entire combine-step
cost gets paid at merge time instead.

---

## The Merge Step

The merge step solves a narrower problem than "sort an array": given **two already-sorted**
sequences, produce **one sorted sequence** containing all of their elements, in time linear in their
combined length. This is the entire engine of merge sort — get this right and the recursive
algorithm is almost an afterthought.

The mechanism is a two-pointer walk. Keep one pointer into the left sequence (`i`) and one into the
right sequence (`j`). At each step, compare the two elements currently under the pointers, copy the
smaller one into the output, and advance _only_ the pointer whose element was copied. Repeat until
one of the two sequences is exhausted — at which point every remaining element in the _other_
sequence is already known to be `>=` everything placed so far (it lost every comparison it was in,
or it's a later, larger element from an internally sorted sequence), so the rest of it can be copied
across directly, with no more comparisons needed.

```python
def merge(left: list[int], right: list[int]) -> list[int]:
    """Merge two already-sorted lists into one sorted list in O(len(left) + len(right))."""
    result: list[int] = []
    i = j = 0

    while i < len(left) and j < len(right):
        # `<=` here, not `<` — a tie always takes the LEFT element first.
        # This one comparison direction is what makes the whole sort stable.
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    # One side is exhausted. Whatever remains on the other side is already
    # sorted internally and already known to be >= everything placed so far —
    # nothing left to compare against, so copy it wholesale.
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

### Trace: merging `[1, 4, 7, 9]` and `[2, 4, 8]`

| Step | `i` | `j` | `left[i]` | `right[j]`          | Taken                          | Output so far           |
| ---- | --- | --- | --------- | ------------------- | ------------------------------ | ----------------------- |
| 1    | 0   | 0   | 1         | 2                   | `1` (left, smaller)            | `[1]`                   |
| 2    | 1   | 0   | 4         | 2                   | `2` (right, smaller)           | `[1, 2]`                |
| 3    | 1   | 1   | 4         | 4                   | `4` (**left — tie goes left**) | `[1, 2, 4]`             |
| 4    | 2   | 1   | 7         | 4                   | `4` (right, smaller)           | `[1, 2, 4, 4]`          |
| 5    | 2   | 2   | 7         | 8                   | `7` (left, smaller)            | `[1, 2, 4, 4, 7]`       |
| 6    | 3   | 2   | 9         | 8                   | `8` (right, smaller)           | `[1, 2, 4, 4, 7, 8]`    |
| 7    | 3   | 3   | 9         | — (right exhausted) | copy remainder of left: `[9]`  | `[1, 2, 4, 4, 7, 8, 9]` |

Two things worth noticing in that trace. First, step 3 is the tie: both pointers see a `4`, and
because the comparison is `left[i] <= right[j]`, the left `4` is taken first even though it's not
"smaller" — it's equal, and the rule says equal favors the left. Second, step 7 is the exhaustion
case: `j` has run past the end of `right`, so instead of comparing anything, the remaining slice of
`left` (`[9]`) is appended in one shot, because it's already sorted and already known to belong at
the end.

---

## Full Recursive Implementation

The recursion wrapped around `merge` is almost boilerplate once the merge step exists. The base case
is the smallest possible instance of "already sorted": a list of length 0 or 1 has no pair of
elements that could be out of order, so it's returned as-is. The recursive case is exactly the split
described above — cut at the midpoint, recursively sort each half independently, and merge the two
sorted results.

```python
def merge_sort(arr: list[int]) -> list[int]:
    """Sort `arr` and return a new sorted list. Stable. O(n log n) worst case, O(n) auxiliary space."""
    # Base case: 0 or 1 elements is trivially sorted — nothing to do.
    if len(arr) <= 1:
        return arr[:]

    # The split: free, index-only, cannot be unbalanced by more than one element.
    mid = len(arr) // 2
    left_sorted = merge_sort(arr[:mid])
    right_sorted = merge_sort(arr[mid:])

    # The combine: this is where all the actual sorting work happens.
    return merge(left_sorted, right_sorted)
```

```python
>>> merge_sort([5, 2, 9, 1, 5, 6])
[1, 2, 5, 5, 6, 9]
```

This is [[05-algorithm-design-principles|Part 01, Chapter 5]]'s own recurrence,

```
T(n) = 2·T(n/2) + O(n)
```

made concrete: two recursive calls on half the input (`2·T(n/2)`), plus a merge that walks both
halves once (`O(n)`). That chapter already established this recurrence resolves to `O(n log n)`;
this chapter isn't re-deriving that (the recursion-tree / master-theorem mechanics live there) —
it's just cashing the conclusion out as real, runnable code.

---

## Guaranteed O(n log n)

Here is the payoff for back-loading the work into the merge instead of the split: merge sort's
`O(n log n)` is not an average case, not an amortized bound, and not a "with high probability if you
randomize" result. It is the actual worst case, on every input, unconditionally.

The reason traces straight back to the split. Because the split point is `len(arr) // 2` — a
function of length alone — the recursion tree is _always_ perfectly balanced: exactly `⌈log₂ n⌉`
levels, every level doing a total of `O(n)` merge work across all the merges at that level, no
matter what values are in the array or what order they arrived in. There is no input that can push
the tree deeper than `log n`, because nothing about the input has any say in where a split falls.

Quicksort has no equivalent structural guarantee. Its split point is wherever the pivot happens to
land after partitioning, and a pivot strategy that's cheap to compute (first element, last element)
can be defeated by an adversarial input — a already-sorted array against a first-element pivot
produces partitions of size `0` and `n − 1` at _every_ level, turning the balanced `log n`-level
tree into a degenerate `n`-level chain and the total work into `O(n²)`.
[[04-quick-sort|Part 07, Chapter 4]]'s randomized-pivot mitigation pushes that worst case from
"reliably triggered by sorted input" to "astronomically unlikely" — but it's a probabilistic defense
bolted onto a structurally risky split, not a guarantee that the risk is gone.

|                            | Quicksort                                                 | Merge Sort                                                 |
| -------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| Best case                  | `O(n log n)`                                              | `O(n log n)`                                               |
| Average case               | `O(n log n)`                                              | `O(n log n)`                                               |
| Worst case                 | `O(n²)`                                                   | `O(n log n)`                                               |
| What causes the worst case | Pivot repeatedly splits `n` elements into `1` and `n − 1` | Nothing — the split is always `⌊n/2⌋` / `⌈n/2⌉`, full stop |

That last row is the entire argument in one sentence: quicksort's worst case has a _cause_ you can
point to and, with effort, defend against; merge sort's worst-case column is identical to its
best-case column because there is no mechanism by which an input could make the split anything other
than even.

---

## The Cost: O(n) Auxiliary Space

That guarantee isn't free. The merge step needs somewhere to write the merged output while it's
still reading from both halves — you cannot merge two sorted sub-ranges back into their own shared
backing array in place without either a temporary buffer or a substantially more complex in-place
merge algorithm with much worse constants. The standard implementation above allocates a new list at
every merge call, and the peak extra memory in use at any one time is `O(n)` — a small constant
multiple of the input size, not more.

That claim is worth pausing on, because the recursive implementation above _slices_ the array at
every level (`arr[:mid]`, `arr[mid:]`), and it's a common interview trip-up to assume that means
`O(n log n)` total space, one slice per level times `log n` levels. It doesn't, because of _when_
memory becomes garbage. `left_sorted = merge_sort(arr[:mid])` fully completes — recursing all the
way down and back — before `right_sorted = merge_sort(arr[mid:])` is even called. Every temporary
slice created while solving the left half is eligible for collection the moment that half's
recursion returns, except for the one result being held for the pending merge. Walk the call stack
at any single instant and the _only_ things alive are: the current root-to-leaf path's slices, plus
one already-completed sorted half held at each ancestor level waiting to be merged. Those held
halves sum to `n/2 + n/4 + n/8 + ... < n` — a convergent geometric series — so total live memory at
any point in time is `O(n)`, not `O(n log n)`.

Contrast that against quicksort's auxiliary footprint: quicksort partitions in place, so there is no
combine-step buffer at all — the only extra memory it spends is the recursion call stack, `O(log n)`
on balanced input. That's a real, structural difference in resource shape, not just a
constant-factor one:

|                 | Quicksort                                  | Merge Sort                             |
| --------------- | ------------------------------------------ | -------------------------------------- |
| Auxiliary space | `O(log n)` — recursion stack only          | `O(n)` — merge buffer(s)               |
| Where it goes   | Call stack depth                           | Temporary arrays for the merge step    |
| In-place?       | Yes — partitions within the original array | No — needs scratch space to merge into |

That trade-off is the single sentence that decides between the two algorithms: **reach for merge
sort when a hard worst-case time guarantee matters more than memory footprint** — real-time systems
with a hard deadline, or sorting data too large to fit in memory (more on that below) — **and reach
for quicksort when average-case speed and memory footprint matter more and the input isn't
adversarially chosen**, which describes the overwhelming majority of general-purpose, in-memory
sorting.

---

## Stable, Unlike Quicksort

**Stability** means elements that compare equal keep their original relative order after sorting.
Quicksort, in its standard in-place form, does not guarantee this — partitioning swaps elements
based on their position relative to the pivot, and a swap can happily move one equal element past
another, with nothing in the algorithm tracking or preserving which one was "first."

Merge sort _is_ stable, but only because of one specific, easy-to-get-backwards detail in the merge
step: the tie-breaking rule. Look back at the comparison in `merge`:

```python
if left[i] <= right[j]:
    result.append(left[i])
    i += 1
```

Using `<=` — take from the left on a tie, not just on a strict win — is what makes the sort stable.
Every element currently sitting in `left` originated from a position earlier in the original array
than every element in `right` (that's what the split guaranteed). So when two equal elements meet at
the comparison point, one from each half, taking the left one first preserves the order they already
had before the algorithm ever touched them. Flip that comparison to strict `<` — taking from `right`
on ties instead — and the merge is still correct (the output is still sorted), but no longer stable:
an equal pair could come out in the opposite order from how it went in.

This is exactly why **Timsort** — the sorting algorithm behind Python's built-in `sort()` /
`sorted()` (and, in a related form, Java's `Collections.sort` for objects) — is built on merge
sort's merge step rather than on quicksort's partition.
[[03-sorting-fundamentals|Part 07, Chapter 3]] covers stability as a general design axis; the
concrete reason it matters enough to shape a language's _default_ sort is multi-key sorting: sort a
list of records by secondary key, then sort that result by primary key, and the final order is
correct _only_ if the second sort didn't scramble the relative order of records that tie on the
primary key. That pattern — sort by the least significant key first, then progressively more
significant keys, relying on stability at every step — is common enough in real code that a
general-purpose language sort without it would be a footgun. Quicksort's speed and low memory
footprint are real advantages, but they don't matter if the sort silently breaks a multi-key
ordering the caller was depending on; that's the tie stability has to win, and it's why the standard
library reaches for a merge-based sort instead.

---

## External Sorting

One more consequence of back-loading the work into the merge, briefly: when the data to be sorted is
too large to fit in memory at once, merge sort's "split, solve independently, merge" shape
generalizes directly to disk. Split the data into chunks that _do_ fit comfortably in memory, sort
each chunk independently with an in-memory sort (this part can even be quicksort — each chunk is
small enough that quicksort's risk profile doesn't matter), and write each sorted chunk back to disk
as a **run**. Then merge the sorted runs using the same core merge step covered above — generalized
to a **k-way merge** when there are more than two runs: keep one buffered element from each of the
`k` runs, use a small min-heap to repeatedly pick the smallest of the `k` candidates, and advance
only that run's read pointer. The output is built the same way as the two-pointer merge, just fed
from files instead of arrays.

This works because the merge phase only ever needs _sequential_ access to each run — read the next
element off the front, nothing else. That's exactly the access pattern disk I/O tolerates well.
Quicksort's in-place partitioning, by contrast, fundamentally assumes random access to the entire
array so it can swap elements across arbitrary distances — a requirement that simply doesn't hold
once the "array" spans files that can't all be resident in memory together. That's the reason
external sorting — database sort-merge operations on tables larger than RAM, the shuffle-and-sort
phase in distributed systems like Hadoop and Spark, the Unix `sort` command's handling of files too
large to fit in memory — is built on merge sort's structure, not quicksort's. The same split-solve-
merge shape that guarantees `O(n log n)` in memory is what makes it the right shape once "memory"
and "disk" stop being the same thing.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
