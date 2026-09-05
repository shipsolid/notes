---
title: "12 — Priority Queue"
description: "Priority queue as an abstract interface — insert with a priority, extract the highest-priority item — and why a binary heap, not a sorted list or a balanced BST, is usually the implementation of choice; includes full top-K and k-way merge worked examples."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-29"
relations:
  - slug: data-structures-algorithms/05-trees/11-heap/11-heap
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/07-top-k-elements/07-top-k-elements
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/08-k-way-merge/08-k-way-merge
    kind: related
---

# 12 — Priority Queue

Ask "what's the fastest way to always grab the smallest remaining element?" and almost everyone
answers "a heap" — and the answer is usually right, but it's answering a question that wasn't quite
asked. The question was about a _contract_: insert an item with a priority, and be able to pull out
the highest-priority one whenever asked. "Heap" is the name of one very good way to honor that
contract, not the name of the contract itself. The gap between the two is small enough to ignore
until an interviewer asks "could you use something other than a heap here, and what would you give
up?" — at which point the candidates who only ever learned "priority queue = heap" have nothing to
say, because they never learned there was a question underneath the answer.

---

## Priority Queue Is an Interface; Heap Is One Implementation

A **priority queue** is an abstract data type — a contract, not a structure. It specifies exactly
two operations:

- **insert(item, priority)** — add an item, tagged with a priority.
- **extract-highest()** — remove and return the item with the highest priority currently in the
  queue (or, symmetrically, `extract-min` if the queue is ordered so "lowest value wins," which is
  the convention this chapter uses throughout, matching [[11-heap]] and Python's `heapq`).

That's the whole interface. It says nothing about arrays, trees, pointers, or sift-up/sift-down —
those are implementation choices, not part of the contract. Compare this to a plain **queue**, which
promises FIFO order regardless of whether it's backed by a linked list, a circular buffer, or two
stacks — the interface is the promise, and multiple structures can honor the same promise with
different performance trade-offs.

[[11-heap]] — the previous chapter — is a **binary heap**: a complete binary tree, array-backed,
with the heap invariant (every parent at least as extreme as its children) maintained through
sift-up on insert and sift-down on extract. It is _an_ implementation of the priority-queue
interface. It is not the only one, and it is not what the term "priority queue" _means_. Every heap
can serve as a priority queue — insert is push, extract-highest is pop, done. But a priority queue
does not have to be built on a heap. This distinction is worth stating this bluntly because the two
terms get used interchangeably so often in casual conversation that the interface/implementation
line disappears entirely, and once it disappears, so does the ability to answer "why a heap, though,
and not something else?" — which is exactly the question the rest of this chapter answers.

---

## Other Implementations, and Why Heap Usually Wins

If a priority queue is just a contract, anything that honors the contract qualifies — with very
different performance depending on what's underneath. Four candidates, in increasing order of
sophistication:

**Unsorted list.** Insert is `append` — O(1), no work at all. Extract-min has to scan every element
to find the smallest, remove it — O(n). This implementation defers _all_ the cost to extraction and
pays nothing up front. Fine if you insert far more often than you extract; disastrous otherwise.

**Sorted list (kept sorted at all times).** Insert has to find the correct position and shift
everything after it over to make room — O(n). Extract-min is free in the sense that the minimum is
always sitting at the front — O(1), just pop index 0. The exact mirror image of the unsorted list:
all the cost moved from extraction to insertion.

**Balanced BST — AVL or Red-Black ([[04-avl-trees]] / [[05-red-black-trees]], earlier in this
Part).** Insert is O(log n): descend to a leaf, insert, rebalance. Extract-min is O(log n): the
minimum in a BST is always the leftmost node, so extract-min is "descend all the way left, remove
that node, rebalance" — no scan required. A balanced BST matches the heap's O(log n) on both core
operations, _and_ it can do things a heap fundamentally cannot: find the k-th smallest element in
O(log n) (with subtree-size augmentation at each node), or answer arbitrary range queries
("everything between these two priorities") efficiently. A heap's array only guarantees the root is
extreme — it says nothing about where the 2nd-smallest or the 50th-smallest element lives, so "give
me everything in this range" degenerates to scanning the whole structure. The BST's extra power
costs real code: pointer rebalancing logic (rotations, color-fixing), more edge cases, and a
meaningfully higher constant factor than a heap for the exact same O(log n) bound.

**Binary heap ([[11-heap]]).** Insert is O(log n) via sift-up. Extract-min is O(log n) via
sift-down. No pointers — a flat array, index arithmetic instead of node traversal, cache-friendlier
and simpler to implement correctly than a rebalancing tree. It does not support k-th-smallest or
range queries efficiently; it wasn't built to. It supports exactly the two operations the
priority-queue contract asks for, at the same asymptotic cost as a balanced BST, with a simpler
implementation and a smaller constant factor.

| Implementation                 | Insert                        | Extract-min                            | Extra capability beyond the PQ contract            | Cost of that capability                                |
| ------------------------------ | ----------------------------- | -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Unsorted list                  | O(1) — append                 | O(n) — scan for minimum                | —                                                  | —                                                      |
| Sorted list                    | O(n) — find position, shift   | O(1) — pop the front                   | —                                                  | —                                                      |
| Balanced BST (AVL / Red-Black) | O(log n) — insert + rebalance | O(log n) — descend to leftmost, remove | k-th smallest in O(log n); arbitrary range queries | Pointer rebalancing, more code, higher constant factor |
| Binary heap                    | O(log n) — sift-up            | O(log n) — sift-down                   | —                                                  | —                                                      |

Read down that last column: the BST earns its extra power honestly, but it's power a plain priority
queue never asked for. When the problem is _only_ ever "give me the next highest/lowest priority
item, repeatedly," reaching for a balanced BST is paying rotation logic and a larger constant factor
for capabilities that will never get used. That's precisely why the binary heap is the default,
textbook, ship-it choice for "I need a priority queue" — not because it's the only valid
implementation, but because it's the simplest structure that pays for exactly the two operations the
contract requires and not one operation more.

---

## Worked Example: Top-K Elements

**Problem:** given a list (or a stream too large to sort in one shot) of n elements, find the K
largest.

The brute-force instinct is to sort everything and slice the top K — O(n log n) — which does far
more work than the problem asked for: sorting establishes a total order over _all n_ elements, when
the problem only cares about a threshold that separates the top K from everything else.

The heap-based fix keeps a **min-heap of a fixed size K** — not a max-heap, and that reversal is the
part worth pausing on. The root of a min-heap of the current top K is the _smallest of the K largest
elements seen so far_ — exactly the threshold a new candidate needs to beat to earn a spot. Scan the
input once: if the heap has fewer than K elements, the new element automatically belongs (there's no
threshold yet to fail); once the heap is full at size K, compare the new element against the root —
if it's larger, it displaces the current minimum of the top K (push the new element, pop the old
minimum, one balanced O(log k) step); if it's smaller than or equal to the root, it can't possibly
be in the top K, so discard it without ever growing the heap past size K.

```python
import heapq


def top_k_largest(nums: list[int], k: int) -> list[int]:
    """Return the k largest elements of nums (order not guaranteed)."""
    if k <= 0:
        return []

    heap: list[int] = []  # min-heap, capped at size k — root is the smallest of the current top k

    for num in nums:
        if len(heap) < k:
            heapq.heappush(heap, num)
        elif num > heap[0]:
            heapq.heappushpop(heap, num)  # push the new element, pop the old minimum, in one step
        # else: num can't beat the weakest member of the current top k — discard, heap untouched

    return heap


# top_k_largest([3, 1, 5, 12, 2, 11], 3) == [5, 11, 12]  (order not guaranteed, membership is)
```

`heapq.heappushpop` matters more than it looks: it pushes the new element and pops the smallest in a
single O(log k) operation without ever letting the heap grow to size k+1 first — `heappush` followed
by a separate `heappop` would work too, but transiently over-grows the heap and costs an extra
comparison. For "K _smallest_" instead of largest, invert the whole approach: maintain a max-heap of
size K instead (Python's `heapq` is min-heap-only, so negate the values on push/pop, or push
`(-value, ...)` tuples), and displace the current maximum instead of the current minimum. Same
shape, opposite comparison.

**Complexity:** O(n log k) time — one scan of n elements, each heap operation bounded by the heap's
fixed size k, not n. **O(k) space** for the heap itself. Against the sort-everything baseline of O(n
log n), this is a real asymptotic win whenever k is small relative to n — finding the top 10 out of
ten million is O(n log 10) here versus O(n log n) sorting all ten million, which is the entire
reason this pattern shows up constantly in "find the top K" interview framing rather than "just sort
it." [[07-top-k-elements|Part 14, Chapter 7]] covers the full pattern — recognizing it from problem
phrasing, its variants (top-K frequent, K closest points, K-th largest via a running heap versus via
quickselect) — in depth; this is the mechanism underneath all of them.

---

## Worked Example: Merge K Sorted Lists

**Problem:** given K sorted lists, merge them into a single sorted output.

Merging two sorted lists is the familiar linear two-pointer walk from [[05-merge-sort]]. Merging K
of them by repeating that pairwise merge K−1 times works, but costs O(n·k) in the worst case (each
of the K−1 merge passes touches up to n elements). The heap-based approach does it in one pass over
all K lists simultaneously: keep a min-heap holding _one candidate element from each list currently
in play_ — whichever of those K candidates is smallest is guaranteed to be the next element of the
fully merged output, because every other element in every other list is either already accounted for
or strictly larger than something already sitting in the heap.

Seed the heap with the first element of every non-empty list. Repeatedly pop the minimum, append it
to the output, and — this is the step that keeps the heap always representing exactly one live
candidate per remaining list — push the _next_ element from whichever list the just-popped element
came from. The heap never holds more than K elements at once, and it always holds exactly one
candidate per list that still has elements left.

```python
import heapq


def merge_k_sorted_lists(lists: list[list[int]]) -> list[int]:
    """Merge k sorted lists into one sorted list."""
    # heap entries: (value, list_index, element_index)
    heap: list[tuple[int, int, int]] = []

    for list_idx, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], list_idx, 0))

    merged: list[int] = []
    while heap:
        value, list_idx, elem_idx = heapq.heappop(heap)
        merged.append(value)

        next_idx = elem_idx + 1
        if next_idx < len(lists[list_idx]):
            heapq.heappush(heap, (lists[list_idx][next_idx], list_idx, next_idx))

    return merged


# merge_k_sorted_lists([[1, 4, 7], [2, 5, 8], [3, 6, 9]]) == [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

Why the tuple carries `list_index` and `element_index` alongside the value, rather than pushing bare
values: the algorithm needs to know, the instant it pops a value, _which list to advance_ — the
value alone doesn't carry that information, so `list_index` restores it. `element_index` is the
position within that list, needed to find the next element to push. Both happen to be plain
integers, which turns out to matter for a reason covered next.

**Complexity:** O(n log k) time, where n is the total element count across all K lists and k is the
number of lists — each of the n elements is pushed and popped exactly once, each operation bounded
by O(log k) since the heap never holds more than k elements. **O(k) space** for the heap. Against
"concatenate everything and sort," which is O(n log n), this wins whenever k is small relative to n
— the same shape of trade-off as the top-K example, for the same underlying reason: the heap bounds
its own work by k, not by the full input size. [[08-k-way-merge|Part 14, Chapter 8]] covers the full
pattern in depth — merging k sorted arrays, k sorted linked lists, and the variants that show up
across interview problem sets.

---

## The Tie-Breaking Gotcha

Python's `heapq` orders tuples the same way Python compares any tuple: lexicographically, element by
element. The first elements decide the order if they differ; if they're equal, Python moves on to
compare the second elements; if those are also equal, it moves to the third; and so on. This is
exactly why `(value, list_index, element_index)` in the merge-k-lists example above works safely
without any extra thought — `list_index` and `element_index` are both plain integers, and integers
are always comparable to other integers, so even a tie on `value` resolves cleanly by falling
through to compare the indices next.

The gotcha appears the moment the _payload_ riding alongside the priority isn't guaranteed to have a
well-defined ordering — a dict, a custom object with no `__lt__`, or any type Python doesn't know
how to compare with `<`. If two entries tie on priority, `heapq` falls through to compare the next
tuple element exactly as before — except now that element is the payload itself, and Python has no
idea how to order two dicts:

```python
import heapq

heap = []
heapq.heappush(heap, (5, {"task": "a"}))
heapq.heappush(heap, (5, {"task": "b"}))
# TypeError: '<' not supported between instances of 'dict' and 'dict'
```

Both entries tie on priority (5 == 5), so `heapq` tries to break the tie by comparing the second
tuple element — and dicts don't support `<`, so Python raises rather than guessing. Note that this
is a comparison Python only ever attempts _on a tie_; distinct priorities never trigger it, which is
why this bug tends to surface late, in whatever test case or production input first produces two
equal priorities, rather than immediately.

The fix is to insert a component between the priority and the payload that is (a) always unique, so
ties never fall through past it, and (b) always comparable, so it never raises. A monotonically
increasing counter — `itertools.count()`, or a manually incremented integer — does both:

```python
import heapq
import itertools

counter = itertools.count()  # tie-breaker: strictly increasing, always an int, always comparable

heap = []
heapq.heappush(heap, (5, next(counter), {"task": "a"}))
heapq.heappush(heap, (5, next(counter), {"task": "b"}))
# no TypeError — the tie on priority (5 == 5) resolves on the counter (0 < 1)
# before Python ever needs to compare the two dicts
```

Because entries are pushed in increasing counter order, this has the pleasant side effect of making
equal-priority entries come back out in the order they were inserted — first-in-first-out among
ties, essentially free. The rule of thumb: any time a heap's payload isn't a plain,
universally-orderable type (int, float, str), assume two entries could tie on priority and add the
counter defensively — it costs one extra tuple field and removes an entire class of "works in every
test case until it doesn't" bug.

---

## Where This Pattern Reappears: Dijkstra's Algorithm

Both worked examples in this chapter follow the identical loop shape: extract the currently-best
candidate from a priority queue, do something with it, and push more candidates back in based on
what was just extracted. Top-K extracts-and-discards; merge-k-lists
extracts-and-replaces-from-the-same- source. **Dijkstra's shortest-path algorithm**
([[04-shortest-path|Part 06, Chapter 4]]) runs the exact same loop over a graph instead of a list of
arrays: repeatedly extract the unvisited node currently cheapest to reach, then _relax_ its
neighbors — for each edge out of that node, check whether going through it offers a shorter path
than what's currently known, and if so, push the improved distance back onto the queue. Extract
highest priority, process, insert more — the same shape this chapter built twice, now running over a
graph's frontier instead of a fixed list of candidates. It's named here only as a preview of where
this exact pattern shows up next, at real algorithmic scale — the full treatment, including the
wrinkle a graph's varying edge weights introduce that neither worked example above had to deal with,
belongs to that chapter.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
