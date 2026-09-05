---
title: "10 — Selection Algorithms"
description: "Quickselect finds the k-th smallest element in expected O(n) by reusing quicksort's Lomuto partition and discarding, rather than recursing into, the side that can't contain the answer — plus median-of-medians, k-th-largest and top-k-as-a-set variants, and the heap-based streaming alternative."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-49"
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/04-quick-sort/04-quick-sort
    kind: depends_on
---

# 10 — Selection Algorithms

Ask for "the k-th smallest element" and the reflexive answer is `sorted(arr)[k]` — sort everything,
O(n log n), done. It isn't wrong, but it's answering a bigger question than the one that got asked.
Fully sorting the array doesn't just locate the k-th smallest value; it also pins down the exact
relative order of every other element — where the 1st smallest sits versus the 2nd, where the 47th
sits versus the 48th, all of it — and none of that was requested. "What's the k-th smallest element"
is a question about one position in the final order, not about all the pairwise relationships a full
sort settles as a side effect of answering it. A **selection algorithm** answers exactly the
question asked and stops there: find the k-th order statistic — or the k smallest elements as a set
— without ever fully sorting anything, in expected linear time. That's strictly less work than a
full sort is able to offer, because a full sort is solving a strictly harder problem than the one
actually in front of it.

---

## The Core Idea: Quickselect Reuses Partition, Discards a Side

Quickselect's engine is the exact Lomuto partition [[04-quick-sort|Part 07, Chapter 4]] built and
traced in full: pick the last element as the pivot, make one left-to-right pass, and end with the
pivot sitting at its final, correct sorted-order index — everything less than it to the left,
everything greater to the right. Quicksort uses that guarantee to recurse on _both_ sides, because
it wants the entire array sorted. Quickselect wants exactly one value at exactly one position, and
that difference in goal changes the recursion completely:

- Partition the current range exactly as quicksort does. The call returns `p`, the pivot's final,
  correct index in the array.
- Compare `p` to the target index `k` directly — the partition just told you the pivot's exact rank,
  so this comparison is the entire remaining logic:
  - **`k == p`** — the pivot itself _is_ the answer. Return it. No further recursion at all.
  - **`k < p`** — the k-th smallest lives strictly to the left of the pivot. Recurse into
    `[lo, p - 1]` only. Everything to the right of the pivot is provably greater than the answer —
    partitioning already guaranteed that — so there is nothing to gain by ever looking there.
    **Discard it outright. Don't recurse into it at all.**
  - **`k > p`** — the mirror image: recurse into `[p + 1, hi]` only, and discard `[lo, p - 1]`
    outright, for the same reason.

That "discard, don't recurse" move — throwing an entire side away rather than solving it too — is
the one thing quickselect does that quicksort never does, and it's worth naming precisely what it
generalizes. [[02-binary-search-on-answer|Part 07, Chapter 2]] generalized ordinary binary search by
swapping "compare `array[mid]` to the target" for "evaluate a monotonic predicate at `mid`" — the
same halving mechanism, applied to a different kind of space, but still only ever certifying that
one half can be discarded because a value comparison (sortedness) or a predicate (monotonicity) said
so. Quickselect generalizes that same discard-one-side mechanism one step further: instead of a
value comparison against an already-sorted array, or a predicate evaluated against an implicit
answer range, it's a **position comparison against a pivot's just-computed rank**. The partition
step manufactures the "this side is safe to discard" guarantee on the spot, for this one array,
rather than relying on it already being true or asking a function to confirm it. Same shape
throughout this Part — halve, test, throw away the half that's certified wrong, repeat — a third
kind of "the thing that tells you which half to keep."

---

## Full Implementation: The K-th Smallest Element

This chapter uses **0-indexed `k`** throughout, matching the convention array indices already use
everywhere else in this book: `k = 0` asks for the smallest element, `k = n - 1` asks for the
largest. `lomuto_partition` below is copied unchanged from [[04-quick-sort|Part 07, Chapter 4]] —
same variable names, same invariant, same final swap — because quickselect's entire contribution is
the recursion around it, not a new partitioning scheme:

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


def quickselect(arr, k, lo=0, hi=None):
    if hi is None:
        hi = len(arr) - 1

    p = lomuto_partition(arr, lo, hi)

    if k == p:
        return arr[p]
    elif k < p:
        return quickselect(arr, k, lo, p - 1)      # answer is left of the pivot — discard the right
    else:
        return quickselect(arr, k, p + 1, hi)       # answer is right of the pivot — discard the left
```

Run against `arr = [36, 86, 63, 28, 70, 17, 93, 74, 61, 32, 53]` with `k = 3` (the 4th smallest,
0-indexed) — checked against `sorted(arr)[3]` and against a 500-trial randomized sweep across array
sizes 1–12 comparing every possible `k` to `sorted(a)[k]` — both match:

```
sorted(arr)[3] = 36
quickselect(arr, 3) = 36
```

### Trace: Call 1's Partition, in Full

`quickselect(arr, 3)` starts with `lomuto_partition(arr, 0, 10)`. Pivot is `arr[10] = 53`, `i = -1`:

| `j` | `arr[j]` | `< 53`? | Action                         | Array after this step                          |
| --- | -------- | ------- | ------------------------------ | ---------------------------------------------- |
| 0   | 36       | yes     | `i` → 0, swap `arr[0], arr[0]` | `[36, 86, 63, 28, 70, 17, 93, 74, 61, 32, 53]` |
| 1   | 86       | no      | nothing                        | `[36, 86, 63, 28, 70, 17, 93, 74, 61, 32, 53]` |
| 2   | 63       | no      | nothing                        | `[36, 86, 63, 28, 70, 17, 93, 74, 61, 32, 53]` |
| 3   | 28       | yes     | `i` → 1, swap `arr[1], arr[3]` | `[36, 28, 63, 86, 70, 17, 93, 74, 61, 32, 53]` |
| 4   | 70       | no      | nothing                        | `[36, 28, 63, 86, 70, 17, 93, 74, 61, 32, 53]` |
| 5   | 17       | yes     | `i` → 2, swap `arr[2], arr[5]` | `[36, 28, 17, 86, 70, 63, 93, 74, 61, 32, 53]` |
| 6   | 93       | no      | nothing                        | `[36, 28, 17, 86, 70, 63, 93, 74, 61, 32, 53]` |
| 7   | 74       | no      | nothing                        | `[36, 28, 17, 86, 70, 63, 93, 74, 61, 32, 53]` |
| 8   | 61       | no      | nothing                        | `[36, 28, 17, 86, 70, 63, 93, 74, 61, 32, 53]` |
| 9   | 32       | yes     | `i` → 3, swap `arr[3], arr[9]` | `[36, 28, 17, 32, 70, 63, 93, 74, 61, 86, 53]` |

Loop ends. Final swap: `arr[i + 1] = arr[4]` with `arr[hi] = arr[10]` →
`[36, 28, 17, 32, 53, 63, 93, 74, 61, 86, 70]`. Return `p = 4`. Pivot `53` is now at its correct
final index, with `k = 3 < p = 4` — the answer is somewhere in `[0, 3]`.

### Trace: The Recursion Across Calls

| Call | Range     | Size | Pivot | `p` | `k` vs `p` | Decision                                                        |
| ---- | --------- | ---- | ----- | --- | ---------- | --------------------------------------------------------------- |
| 1    | `[0, 10]` | 11   | 53    | 4   | `3 < 4`    | **Discard** `[5, 10]` (size 6) — recurse into `[0, 3]` (size 4) |
| 2    | `[0, 3]`  | 4    | 32    | 2   | `3 > 2`    | **Discard** `[0, 1]` (size 2) — recurse into `[3, 3]` (size 1)  |
| 3    | `[3, 3]`  | 1    | 36    | 3   | `3 == 3`   | **Found** — `arr[3] = 36`                                       |

The six-element block `[5, 10]` discarded at call 1 and the two-element block `[0, 1]` discarded at
call 2 are never touched again — no partition call ever runs on them, no comparison is ever made
against their contents. Total elements actually processed across all three partition calls:
`11 + 4 + 1 = 16`, against `n = 11` — a small constant multiple of `n`, not a multiple of `n log n`.
Compare that with what quicksort would have done on this same first split: it would recurse into
_both_ `[0, 3]` **and** `[5, 10]`, meaning the discarded six-element block gets its own partition
call too, and the sizes at the next level sum back up to roughly `n` again instead of shrinking to
just the 4-element survivor. That's the entire mechanism behind the complexity difference derived
next — not a vague "it's faster because it does less," but a concrete, countable difference in how
many elements get touched at each level of recursion.

---

## Expected O(n), and Why the Worst Case Is Still O(n²)

### The expected-time argument

Write the recurrence the same way [[04-quick-sort|Part 07, Chapter 4]] wrote quicksort's, and the
difference is visible in a single symbol. Quicksort recurses into both children of every partition,
which is why its recurrence carries a factor of 2:

```
T_quicksort(n) = 2·T(n/2) + O(n)   →   O(n) work at every one of O(log n) levels   →   O(n log n)
```

Quickselect recurses into exactly **one** child — the other was discarded, not solved — so the
recurrence drops that factor entirely:

```
T_quickselect(n) = T(n/2) + O(n)
```

assuming the partition splits the current range "reasonably balanced" — not exactly in half, just
not consistently at one extreme, the identical looseness [[04-quick-sort|Part 07, Chapter 4]]'s
average-case argument leaned on. Unroll that recurrence by hand instead of waving at its shape:

```
T(n) = O(n) + O(n/2) + O(n/4) + O(n/8) + ... + O(1)
     = O(n · (1 + 1/2 + 1/4 + 1/8 + ...))
     = O(n · 2)
     = O(n)
```

The geometric series `1 + 1/2 + 1/4 + ...` converges to exactly `2` regardless of how many terms it
has, which is precisely why the work stays bounded by a small constant multiple of `n` no matter how
many recursion levels a large input needs. This is the single precise reason selection beats a full
sort: quicksort's `O(n log n)` comes from doing `O(n)` work at **every** one of its `O(log n)`
levels, because it recurses into both surviving halves and their descendants forever; quickselect
only ever does work in the _one_ partition that survives at each level, so the per-level work
shrinks geometrically instead of staying pinned at `O(n)` the way quicksort's does. Both algorithms
run the identical partition function — the difference in total work is entirely a difference in what
gets recursed into afterward, exactly what the call-by-call trace above counted concretely
(`11 + 4 + 1`, not `11 + 10 + ...`).

This bound is stated as **expected**, not worst-case, for the same reason quicksort's `O(n log n)`
is: it assumes splits stay reasonably balanced, and a fixed last-element pivot rule can't guarantee
that on every input.

### Worst case: O(n²), for the identical reason

Feed quickselect the identical adversarial input [[04-quick-sort|Part 07, Chapter 4]] used to break
plain Lomuto quicksort — an already ascending-sorted array, last-element pivot rule — and every
partition call produces the same degenerate `(n - 1, 0)` split derived there: the last element of
any sorted remaining range is always its maximum, so nothing passes the `< pivot` test, and the
pivot lands at the very end of the current range every single time.

This is not merely _analogous_ to quicksort's worst-case recurrence — for quickselect it's the exact
same recurrence, unmodified, because quicksort's own worst case already discards nothing: it
produces one empty side and one size-`(n - 1)` side, and quickselect was always going to recurse
into only the non-empty side anyway. There's no discard-the-other-half saving left to have, because
the "other half" was already empty:

```
T(n) = T(n - 1) + O(n) = O(n) + O(n - 1) + O(n - 2) + ... + O(1) = O(n(n + 1)/2) = O(n²)
```

The mitigation is the identical one, too — cite it rather than re-derive it: swap a uniformly random
element into the pivot position before every partition call ([[04-quick-sort|Part 07, Chapter 4]]'s
`randomized_partition`), which turns the worst case from "a predictable function of input order"
into "an event whose probability vanishes exponentially in `n`," regardless of whether the array
handed in happens to be sorted, reverse-sorted, or anything else an adversary might construct.

---

## Median of Medians: A Deterministic Worst Case, Rarely Worth Paying For

Randomization makes the worst case _improbable_; it doesn't make it _impossible_. A deterministic
algorithm exists that guarantees `O(n)` worst-case selection on every input, with no randomness and
no unlucky-input escape hatch needed: **median-of-medians**, due to Blum, Floyd, Pratt, Rivest, and
Tarjan (1973) — often just called BFPRT. The core idea is to stop trusting any single element as the
pivot and instead _manufacture_ a provably decent one: split the current range into groups of 5,
find each group's median directly (five elements, a handful of comparisons, cheap), then
**recursively apply the same selection algorithm** to find the median of _those_ group-medians, and
use that value — not any single original element — as the partition pivot. A median of medians
computed this way is provably guaranteed to be better than roughly the 30th and worse than roughly
the 70th percentile of the current range no matter how the input is arranged, which caps the
worst-case split badly enough that the resulting recurrence solves to `O(n)` even in the adversarial
case. The catch is entirely practical: computing that guaranteed-good pivot costs real work of its
own — a full recursive selection call just to find the pivot, on top of the partition it's about to
drive — which multiplies the constant factor by enough that median-of-medians is reliably _slower_
than plain randomized quickselect on typical input. It shows up where a hard worst-case guarantee
actually matters more than average speed — some real-time or adversarial-input-hardened contexts —
and rarely anywhere else; knowing it exists and why it trades a worse constant for a better worst
case is the useful takeaway, not reproducing its recursion by hand.

---

## Variants: K-th Largest, Top-K as a Set, and the Heap Alternative

**K-th largest.** Symmetric to k-th smallest under this chapter's 0-indexed convention: the `j`-th
largest element (1-indexed — `j = 1` is the maximum) is exactly `quickselect(arr, n - j)`, since the
maximum sits at index `n - 1` and each step down in rank moves one index to the left. No new
algorithm is needed — only a different target index into the identical function above.

**The k smallest (or largest) elements, as a set.** Sometimes the actual ask isn't one value at rank
`k`, it's _all_ the elements at rank `≤ k`, order among themselves not required — "give me the 5
smallest," not "give me the 5th smallest." Run `quickselect(arr, k - 1)` exactly once and stop: when
it returns, `arr[0 : k]` **is** the set of `k` smallest elements, unsorted, guaranteed by the same
partition invariant used at every level of the recursion — everything left of a pivot's final index
is provably less than it, at every level that actually ran, not only at the target index itself.
This is precisely the guarantee C++'s `std::nth_element` documents: after
`nth_element(first, nth, last)`, every element before `nth` compares `<=` the element now sitting at
`nth`, and every element after it compares `>=`, even though neither side ends up sorted internally.
One partition-driven pass, still cheaper than sorting all `n` elements to read off the first `k`.

**The heap-based alternative.** Maintain a size-`k` min-heap while streaming through the input once,
discarding the current minimum whenever a larger element arrives and the heap is already full — the
full worked mechanics, including the `heapq.heappushpop` trick that does the push-and-evict in one
step, live in [[12-priority-queue|Part 05, Chapter 12]]'s top-k example rather than being re-derived
here. That approach costs `O(n log k)`, worse in growth rate than quickselect's `O(n)` whenever `k`
grows with `n` — but it wins on a property quickselect cannot match at all: it never needs the whole
array in memory or random access into it. Quickselect's partition step swaps arbitrary pairs of
indices across the full current range, which means it needs the entire array materialized before it
can run. A size-`k` heap only ever needs to look at _one new element at a time_, which is exactly
what a stream that can't be fully buffered requires.

---

## The Interview Angle: Quickselect vs. a Heap

"Find the k-th largest element in an array"
([LeetCode 215](https://leetcode.com/problems/kth-largest-element-in-an-array/) and its many
rephrasings) is the textbook prompt this chapter exists to answer, and "top-k" problems generally
are its next most common home. The follow-up worth being ready for isn't "can you code quickselect"
— it's "why quickselect and not a heap," and the honest answer is a real trade-off, not a default:

- **Reach for quickselect** when the input already fits in memory as an array with random access,
  and the query is one-shot — find rank `k` once and move on. Expected `O(n)` beats `O(n log k)` for
  any `k` that isn't tiny relative to `n`, and no auxiliary structure needs to be built or
  maintained.
- **Reach for a heap** when the input is a stream that can't be fully materialized — logs arriving
  continuously, a socket, anything too large to hold in memory at once — since quickselect's
  in-place partitioning has no equivalent for data it can't randomly index into. Also reach for a
  heap when the top-`k` results are needed **in sorted order** as a side effect — draining a heap
  comes out ordered for free, while quickselect's partition only guarantees the correct _set_,
  unordered, exactly as the variant above described. And when `k` is small enough relative to `n`,
  `O(n log k)`'s tiny `log k` factor with a heap's simple per-element constant can beat `O(n)`'s
  larger constant from recursive partition calls in practice, even though it's the asymptotically
  slower option on paper.

---

That closes this Part's arc. It started with binary search over a sorted array, generalized that to
binary search over an implicit space of candidate answers via a monotonic predicate, then paused on
sorting itself — the vocabulary of stability and in-place-ness, and the Ω(n log n) floor no
comparison sort can beat — before working through quicksort, merge sort, and heap sort as three
different trades against that floor, and counting sort, radix sort, and bucket sort as three ways to
dodge the floor entirely by assuming something concrete about the values themselves. Selection
algorithms are the reminder underneath all of it: the fastest way to answer a question is sometimes
to not solve the more general problem at all. A full sort was never the question — it was always
just the easiest tool lying around that happened to also answer it.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
