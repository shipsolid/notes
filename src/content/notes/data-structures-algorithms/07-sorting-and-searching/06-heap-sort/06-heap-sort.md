---
title: "6 — Heap Sort"
description: "In-place heap sort derived from the heap chapter's heapify and sift-down — a guaranteed O(n log n) worst case with O(1) auxiliary space, and why giving up stability and cache locality is the price of both."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-54"
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/03-sorting-fundamentals/03-sorting-fundamentals
    kind: related
  - slug: data-structures-algorithms/05-trees/11-heap/11-heap
    kind: depends_on
  - slug: data-structures-algorithms/07-sorting-and-searching/05-merge-sort/05-merge-sort
    kind: related
---

# 6 — Heap Sort

[[05-merge-sort|Part 07, Chapter 5]] answered "can I guarantee O(n log n) no matter what the input
looks like" — yes, but the price was an O(n) buffer, because merging two sorted halves back together
needs somewhere to write the result while it's still reading from both. That leaves one obvious
follow-up, the exact question [[03-sorting-fundamentals|Part 07, Chapter 3]]'s roadmap table poses
for this chapter: **can I keep merge sort's worst-case guarantee but pay for it in-place — O(1)
auxiliary space — instead of an O(n) buffer?** Heap sort is yes, and the mechanism is almost
embarrassingly direct once [[11-heap|Part 05, Chapter 11]]'s heap machinery is already in hand: it
doesn't invent a new data structure or a new invariant, it just runs `heapify` once and
`pop`-the-max repeatedly, using the same array as both the heap and the output buffer. Guaranteed
worst case _and_ in-place — but, as the roadmap table already flagged, that combination isn't free
either. Heap sort gives up stability to get both, and — as this chapter gets to near the end — it
gives up something the asymptotic bound doesn't even measure: cache locality, which is exactly why
it isn't production sorts' first choice despite the guarantee.

---

## The Core Idea: Heapify Once, Then Repeatedly Extract the Max Into Place

[[11-heap|Part 05, Chapter 11]] built a min-heap throughout — root is the minimum, `_sift_down`
picks the **smaller** of two children to swap toward. Heap sort wants the array in **ascending**
order at the end, and the cleanest way to get there with the heap machinery unchanged in spirit is
to flip the whole thing to a **max-heap**: root is the maximum, sift-down picks the **larger**
child. Every piece of reasoning from that chapter — completeness, why array representation wastes
nothing, why build-heap is O(n) not O(n log n) — carries over with every comparison reversed; none
of it gets re-derived here.

The algorithm is two phases over the _same_ array, no second array ever allocated:

1. **Build a max-heap in place, over the whole array.** After this phase, `arr[0]` is the maximum of
   the entire array — not sorted, just heap-ordered, exactly the distinction
   [[11-heap|Part 05, Chapter 11]] drew between "heap-ordered" and "fully sorted."
2. **Repeatedly swap the root with the last element of the current unsorted prefix, shrink the heap
   by one, and sift the new root down to restore the invariant.** Each swap places the current
   maximum into its final sorted position — the very last slot of the array on the first iteration,
   one slot earlier each time after that — and because everything already placed is `>=` everything
   still in the heap, it never has to be touched again.

That second phase is the entire "sort" in heap sort: it's [[11-heap|Part 05, Chapter 11]]'s `pop`
operation, called `n - 1` times, except instead of allocating a fresh min-heap and discarding popped
values, heap sort recycles the _same array_ — the slot a value pops out of becomes the exact slot it
belongs in for the final sorted output. The sorted region and the heap region are two ends of one
array, growing and shrinking toward each other:

```
[            max-heap over arr[0 .. end]            | sorted, ascending, arr[end+1 ..] ]
```

Each iteration moves the boundary (`end`) left by one. When `end` reaches `0`, the heap region is a
single element — trivially in its correct place — and the whole array is sorted.

---

## Full Implementation

Reusing [[11-heap|Part 05, Chapter 11]]'s `left_child`/`right_child` index arithmetic and its
`_sift_down` shape directly — with two adaptations forced by what heap sort actually needs. First,
every comparison flips from "smaller child wins" to "larger child wins," because this is a max-heap.
Second, `_sift_down` here takes an explicit heap-size boundary `n` as a parameter, rather than
always using `len(arr)` the way the heap chapter's version did — heap sort's heap _shrinks_ by one
after every extraction while the underlying array stays the same length, so "how much of the array
is still heap" has to be a variable, not an assumption baked into the function.

```python
def left_child(i: int) -> int:
    return 2 * i + 1

def right_child(i: int) -> int:
    return 2 * i + 2


def _sift_down_max(arr: list, i: int, n: int) -> None:
    """Sift arr[i] down within arr[0:n] — n is the current heap boundary, not len(arr)."""
    while True:
        l, r, largest = left_child(i), right_child(i), i
        if l < n and arr[l] > arr[largest]:
            largest = l
        if r < n and arr[r] > arr[largest]:
            largest = r
        if largest == i:
            break                       # both children already <= this node: invariant holds, stop
        arr[i], arr[largest] = arr[largest], arr[i]
        i = largest


def heapify_max(arr: list, n: int) -> None:
    """Build a max-heap over arr[0:n] in place — O(n). Same bottom-up sweep as the heap chapter."""
    last_non_leaf = n // 2 - 1          # every index after this one is a leaf: nothing to sift against
    for i in range(last_non_leaf, -1, -1):
        _sift_down_max(arr, i, n)


def heap_sort(arr: list) -> list:
    """Sort arr in place, ascending. O(n log n) worst case, guaranteed. O(1) auxiliary space."""
    n = len(arr)
    heapify_max(arr, n)                        # phase 1: build-heap, O(n)

    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]    # move current max into its final sorted slot
        _sift_down_max(arr, 0, end)            # restore heap property over the shrunken heap, O(log n)

    return arr
```

No `Tagged` needed yet — plain integers are enough to see the mechanics. Every step below was
actually run, not hand-waved.

### Trace: build-heap on `[4, 10, 3, 5, 1]`

`n = 5`, so `last_non_leaf = 5 // 2 - 1 = 1`. The loop runs `i = 1`, then `i = 0`.

| `i`                   | Children checked                          | Largest found                        | Action                                | Array after        |
| --------------------- | ----------------------------------------- | ------------------------------------ | ------------------------------------- | ------------------ |
| 1                     | `l=3` (`5`), `r=4` (`1`)                  | `1` (itself — `10 > 5` and `10 > 1`) | no swap                               | `[4, 10, 3, 5, 1]` |
| 0                     | `l=1` (`10`), `r=2` (`3`)                 | `1` (`10 > 4`)                       | swap `arr[0], arr[1]`                 | `[10, 4, 3, 5, 1]` |
| 0 → continue at `i=1` | `l=3` (`5`), `r=4` (`1`)                  | `3` (`5 > 4`)                        | swap `arr[1], arr[3]`                 | `[10, 5, 3, 4, 1]` |
| 0 → continue at `i=3` | `l=7`, `r=8` — both `>= n=5`, no children | `3` (itself)                         | no swap, sift-down for this call ends | `[10, 5, 3, 4, 1]` |

Build-heap is done in exactly two top-level `_sift_down_max` calls (`i=1`, `i=0`), the second of
which cascades one level further (`i=0` → `i=1` → `i=3`). Final heap-ordered array:
`[10, 5, 3, 4, 1]` — not sorted (`5` and `3` are siblings with no required order between them,
exactly the looseness [[11-heap|Part 05, Chapter 11]] flagged as the whole point of a heap's weaker
invariant), but every parent is now `>=` both its children.

### Trace: extraction phase, continuing from `[10, 5, 3, 4, 1]`

| `end` | Swap root ↔ `end` | Array after swap   | Sift-down(0, `end`) result                       | Sorted suffix so far |
| ----- | ------------------ | ------------------ | ------------------------------------------------ | -------------------- |
| 4     | `arr[0] ↔ arr[4]` | `[1, 5, 3, 4, 10]` | `[5, 4, 3, 1, 10]`                               | `[10]`               |
| 3     | `arr[0] ↔ arr[3]` | `[1, 4, 3, 5, 10]` | `[4, 1, 3, 5, 10]`                               | `[5, 10]`            |
| 2     | `arr[0] ↔ arr[2]` | `[3, 1, 4, 5, 10]` | `[3, 1, 4, 5, 10]` (no swap — `1 > 3` is false)  | `[4, 5, 10]`         |
| 1     | `arr[0] ↔ arr[1]` | `[1, 3, 4, 5, 10]` | `[1, 3, 4, 5, 10]` (single element, no children) | `[3, 4, 5, 10]`      |

Loop ends when `end` reaches `0` — one element left in the heap region is trivially sorted. Final
array: `[1, 3, 4, 5, 10]`. Every extraction step did exactly one swap (root with the current last
unsorted slot) followed by one bounded sift-down; nothing outside `arr[0:end]` was ever touched
again once it crossed into the sorted suffix.

```python
>>> heap_sort([4, 10, 3, 5, 1])
[1, 3, 4, 5, 10]
```

---

## Why It's Guaranteed O(n log n) — No Data-Dependent Escape Hatch

Both phases have a fixed, input-independent cost, and that's the whole argument.

**Phase 1, build-heap, is O(n).** This isn't re-derived here — [[11-heap|Part 05, Chapter 11]]
already proved it in detail: the naive "n nodes × O(log n) sift each" bound overcharges every node,
because `_sift_down`'s actual cost is bounded by the height of the _subtree rooted at that node_,
not the height of the whole tree, and most nodes sit near the bottom where that subtree is shallow
or empty. Summing `(nodes at height h) × (work at height h)` across all `h` gives a series that
converges to a constant multiple of `n`, not `n log n`. That proof didn't assume a min-heap or a
max-heap — it's pure tree-shape arithmetic, so it applies to `heapify_max` above unchanged.

**Phase 2 is exactly `n - 1` extractions, each costing at most O(log n).** Every single iteration of
the extraction loop does one swap (O(1)) and one `_sift_down_max` call bounded by the height of a
heap of size at most `n` — O(log n), by the identical bound [[11-heap|Part 05, Chapter 11]]
established for `pop`. There is no iteration that can cost more than that, and no iteration that can
cost less in a way that changes the asymptotic total (even a heap that needs zero swaps at a given
step still pays for the comparisons that establish that). Summed across all `n - 1` iterations:
`O(n log n)`.

Total: `O(n) + O(n log n) = O(n log n)` — and critically, **every input pays this**, not just an
unlucky one. Contrast that directly with [[04-quick-sort|Part 07, Chapter 4]]'s worst case:
quicksort's O(n²) blowup has an actual _cause_ — a pivot rule that a specific input shape
(already-sorted data against a last-element pivot) can defeat, turning a balanced recursion into a
degenerate one-sided chain. Heap sort has no equivalent lever for an adversary to pull.
`heapify_max`'s cost is a function of the tree's _shape_ — which is always the same complete-tree
shape for a given `n`, regardless of what values are in it — and the extraction loop always runs
exactly `n - 1` times no matter how the values are arranged, each one bounded by the same height
argument. There's no "already-sorted array" equivalent that breaks heap sort's assumptions, because
heap sort's cost bound was never resting on an assumption about input arrangement in the first place
— only about tree shape, which array length alone fully determines. This is the same "guaranteed,
not average" framing [[05-merge-sort|Part 07, Chapter 5]] used for its own worst case, arrived at by
a completely different mechanism: merge sort guarantees it by making the _split_ always even; heap
sort guarantees it by making every operation's cost bounded by _tree height_, which is a property of
`n` alone, never of the data.

---

## In-Place: O(1) Auxiliary Space

Every step in both phases mutates `arr` itself — `heapify_max` swaps within the array it was handed,
and the extraction loop's `arr[0], arr[end] = arr[end], arr[0]` is a swap between two indices of the
_same_ array, not a write into a second one. No second array is ever allocated at any point, at any
size. The only extra variables in play are a handful of index integers (`i`, `l`, `r`, `largest`,
`end`, `n`) — genuinely O(1), not O(1) as a euphemism for "small but growing."

This is worth contrasting against both algorithms already covered in this Part, because heap sort
lands in a different spot on the space axis from each of them:

| Algorithm  | Auxiliary space                         | Where it goes                                                 |
| ---------- | --------------------------------------- | ------------------------------------------------------------- |
| Quicksort  | O(log n) (balanced) → O(n) (worst case) | Recursion call stack — data-dependent, tracks split quality   |
| Merge sort | O(n), always                            | Temporary arrays allocated at every merge call                |
| Heap sort  | **O(1), always**                        | A fixed handful of loop/index variables — no stack, no buffer |

Merge sort's O(n) buffer is fixed regardless of input, for the reason
[[05-merge-sort|Part 07, Chapter 5]] already derived — merging two sorted ranges without a second
array requires a substantially more complex in-place merge with much worse constants, so the
standard implementation just pays for the buffer outright. Quicksort's recursion stack is
data-dependent, shrinking to O(log n) on balanced splits and growing to O(n) on the exact
adversarial inputs that produce its O(n²) time blowup — space and time degrade together, for the
same reason.

Heap sort needs **neither** a second array **nor** meaningful recursion. `_sift_down_max` above is
written as a `while True` loop, not a recursive call — there's no call stack to grow at all, bounded
or otherwise. (A recursive sift-down is possible to write and would still only recurse to a depth
bounded by the tree's height, O(log n) worst case — but the iterative form costs nothing extra to
write and avoids even that bounded stack, which is why virtually every real implementation,
including the one above, writes it iteratively.) That's the direct payoff of the guarantee from the
previous section: merge sort bought its worst-case guarantee with an O(n) buffer; heap sort buys the
_identical_ worst-case guarantee with **zero** auxiliary space beyond a few integers, because the
guarantee comes from tree height rather than from a merge buffer, and tree height doesn't need
anywhere to write anything — it's a bound on _comparisons and swaps_, not on _storage_.

---

## Not Stable, and Why

**Stability**, as [[03-sorting-fundamentals|Part 07, Chapter 3]] defined it: elements that compare
equal keep their original relative order in the output. Heap sort routinely violates this, and the
violation traces to one specific mechanic: **the swap-root-with-last-element step has no way to
prefer one equal-valued element over another** — it always evicts whatever happens to be occupying
the root at that heap size, with no memory of which equal-keyed element was closer to the front of
the original array.

Make identity visible with tagged values, the same technique [[04-quick-sort|Part 07, Chapter 4]]
used for its own counterexample:

```python
class Tagged:
    def __init__(self, key, tag):
        self.key, self.tag = key, tag
    def __repr__(self):
        return f"{self.key}{self.tag}"
    def __gt__(self, other):
        return self.key > other.key
    def __lt__(self, other):
        return self.key < other.key

arr = [Tagged(3, "a"), Tagged(1, "b"), Tagged(3, "c")]
heap_sort(arr)
print(arr)   # [1b, 3c, 3a]
```

Two elements share key `3`: `3a` at index 0, `3c` at index 2 — `3a` before `3c` in the original
array. Trace it against the actual algorithm:

**Build-heap** (`n=3`, `last_non_leaf = 0`): only `i=0` runs. Children are `1b` (index 1) and `3c`
(index 2). Neither beats `3a`'s key of `3` — `1b`'s key (`1`) isn't greater, and `3c`'s key (`3`) is
equal, not _greater_, so `largest` stays `0`. No swap. The array `[3a, 1b, 3c]` is already a valid
max-heap, tie and all — the invariant only requires `>=`, and `3a >= 3c` holds without anyone
moving.

**Extraction, `end=2`:** swap root with the last element — `arr[0]` (`3a`) swaps with `arr[2]`
(`3c`) → `[3c, 1b, 3a]`. This is the moment instability enters: `3a`, which started at index 0, just
got placed into index 2 — its final sorted position — while `3c`, which started at index 2, becomes
the new root. Sift-down over `arr[0:2]` finds `1b`'s key isn't greater than `3c`'s, so nothing
moves. Sorted suffix so far: `[3a]`.

**Extraction, `end=1`:** swap root with last — `arr[0]` (`3c`) swaps with `arr[1]` (`1b`) →
`[1b, 3c, 3a]`. Sift-down over a single-element heap does nothing. Loop ends.

Final: `[1b, 3c, 3a]`. The two key-`3` elements come out as `3c` then `3a` — their relative order
has **flipped** from the original array, even though every comparison the algorithm made was
answered correctly (`1 > 3` is false, `3 > 3` is false — nothing was misjudged). The reordering
happened purely because the very first extraction plucked `3a` off the root — where it happened to
already be sitting after build-heap — and parked it at the _last_ array slot, ahead of `3c` in final
sorted order, with no step anywhere in the algorithm checking "which of these two equal-keyed
elements came first originally." That's instability made concrete rather than asserted, matching
[[03-sorting-fundamentals|Part 07, Chapter 3]]'s framing exactly: it's a fact about heap sort's
mechanics, not a bug, and not something that can be patched in without giving up the in-place
property that's the entire reason to reach for heap sort in the first place.

---

## Why It's Not the Default Choice, Despite the Guarantee

Given a data structure that guarantees O(n log n) worst-case time _and_ O(1) auxiliary space
simultaneously — a combination neither quicksort nor merge sort achieves on its own — heap sort
looks like it should have won outright. It doesn't, in practice, and the reasons don't show up
anywhere in the asymptotic bound.

**Poor cache locality.** `_sift_down_max` jumps between index `i`, `2i+1`, and `2i+2` — for any `i`
past the first few, those three indices are far apart in memory, and they get farther apart as `i`
grows. Every comparison and swap in both build-heap and the extraction loop touches memory
non-sequentially, in a pattern that jumps around the array via index arithmetic rather than sweeping
through it. That's the opposite of merge sort's merge step, which reads `left` and `right` strictly
left to right and writes `result` strictly left to right — three sequential scans, exactly the
access pattern CPU cache prefetching is built to reward. It's also the opposite of quicksort's
partition step, which — even though it swaps elements — does so while scanning the current range
with a single left-to-right pointer `j`, keeping every touched address within one contiguous,
shrinking window rather than leaping across the whole array by a power-of-two-ish stride. Heap sort
has neither property: an operation on index `1` touches indices `3` and `4`; an operation on index
`1000` touches indices `2001` and `2002` — same algorithm, wildly different memory distance, with no
contiguous window at all.

**Worse constant factors than the alternatives, in the cases that actually occur most often.** Real
input is rarely adversarial. Quicksort's _average_ case — which is what almost all real input
actually triggers — does less total comparison-and-swap work per element than heap sort's sift-down,
on top of its better cache behavior. Timsort ([[03-sorting-fundamentals|Part 07, Chapter 3]]) beats
both further still on the extremely common case of partially-ordered real-world data, something heap
sort has no mechanism to detect or exploit at all — heapify and extraction cost exactly the same
whether the input started sorted, reverse-sorted, or shuffled, because nothing about heap sort's
cost bound was ever data-dependent in the first place (the same property that makes the worst case
guaranteed also means there's no _best_ case to speed up into).

This is precisely why [[04-quick-sort|Part 07, Chapter 4]]'s introsort discussion frames heap sort
as a **fallback**, not a default: introsort runs ordinary quicksort — fast in the common case,
better cache behavior, better constants — and only switches to heap sort on the specific subarrays
where recursion depth signals the partitioning is degrading toward its worst case. Heap sort's
guarantee is exactly what's needed the moment that signal fires — a hard ceiling with no further
data-dependent surprises left to spring — but paying its worse constant factor and poor locality on
every input, rather than only the rare degenerate one, would be trading a bound that almost never
binds for a tax that's paid on every single sort. That trade isn't worth it, which is the whole
reason heap sort is the algorithm behind an escape hatch rather than the algorithm behind a
language's default `sort()`.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
