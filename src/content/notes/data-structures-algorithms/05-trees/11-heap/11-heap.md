---
title: "11 — Heap"
description: "Binary heap structure (array-backed complete tree) and the sift-up/sift-down operations behind heapify — the weaker parent-children invariant that makes find-min cheap, why completeness makes array representation waste nothing, and heapq's push/pop/heapify/heappushpop/heapreplace in practice."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-28"
relations:
  - slug: data-structures-algorithms/05-trees/01-tree-fundamentals/01-tree-fundamentals
    kind: related
---

# 11 — Heap

[[03-binary-search-trees|The BST chapter]] built a structure around one rule — _everything left is
smaller, everything right is bigger_ — strong enough to keep an entire tree sorted, walkable inorder
into ascending order for free. A heap throws almost all of that away. It keeps exactly one rule,
checked only one level at a time, and in exchange for giving up "sorted" it gets something a BST
can't offer as cheaply: guaranteed O(1) access to the minimum (or maximum) and guaranteed O(log n)
insert/remove, with no rebalancing logic, no rotations, and no tree object at all — just an array
and two small loops. This chapter is about why the weaker rule is the _point_, not a compromise, and
why that same rule is what lets a heap live in a flat array without wasting a single slot — the
completeness guarantee [[01-tree-fundamentals|Chapter 1]] flagged and deferred to here.

---

## The Heap Invariant: Weaker Than a BST's, On Purpose

**The min-heap invariant:** for every node, that node's value is less than or equal to the value of
both its children. (A **max-heap** is the mirror image — every node's value is greater than or equal
to both children's — obtained by flipping every comparison; everything else in this chapter is
written for a min-heap and carries over unchanged.)

Read that invariant against the BST invariant from the previous chapter, because the difference is
the whole design:

- **BST:** every node in the left subtree is less than the node; every node in the right subtree is
  greater. That constraint reaches _arbitrarily far down_ — a node 10 levels below the root still
  has to respect its relationship to an ancestor 10 levels up.
- **Heap:** a node's value is `<=` its **immediate children only**. Nothing is said about:
  - **siblings** — a node's left child and right child have no required relationship to each other;
    either can be smaller,
  - **a node and its grandchildren, or any deeper descendant** — only the parent-child edge is
    constrained, not the whole subtree,
  - **a node and anything that isn't its ancestor or descendant** — two nodes in different branches
    are completely unordered relative to each other.

Concretely, both of these are valid min-heaps on the same five values:

```
        1                    1
       / \                  / \
      3   2        and     2   3
     /                        /
    5                        5
```

Swapping the `2` and `3` didn't break anything, because siblings were never ordered relative to each
other in the first place — only `1 <= 3`, `1 <= 2`, `2 <= 5` (or `3 <= 5`) are actually required. A
BST has no equivalent freedom: swap two nodes in a valid BST and the ordering constraint almost
always breaks.

That looseness is not a missed opportunity to make the structure stronger — it's the entire reason a
heap is fast at the one thing it exists to do. A heap makes exactly one promise: **the minimum is
always at the root**, because "parent `<=` children" applied recursively down every path means no
node anywhere can be smaller than the root — if one were, the chain of parent-child comparisons from
that node back up to the root would have to be violated somewhere, which the invariant forbids. That
promise is all a priority queue needs. It says nothing about where the _second_ smallest value lives
(it's one of the root's children, but which one, or how deep the search would have to go among
near-ties, is unspecified beyond "somewhere in the tree"), and it doesn't need to — a heap is never
asked "what's the second smallest," only "what's the smallest, repeatedly, as the collection
changes." Every enforcement a BST does that a heap skips — keeping siblings ordered, keeping
non-adjacent ancestors and descendants ordered — was overhead a heap never had to pay, because
nothing built on top of a heap (priority queues, `heapsort`, Dijkstra's algorithm, "top-K") ever
asks a question that overhead would have answered.

---

## Why Array Representation Is a Perfect Fit

[[01-tree-fundamentals|Chapter 1]] introduced array-based tree representation and immediately
flagged its cost: it only stays compact when the tree is **complete** — every level full except
possibly the last, and the last level filled strictly left to right with no gaps — because a missing
child anywhere still reserves its `2i+1`/`2i+2` slot to keep the index arithmetic consistent for
every other node. A general binary tree has no way to guarantee that, which is why pointer-based
stays the default for BSTs, AVL trees, and red-black trees. A heap is the exception, and it's worth
being precise about _why_, because it isn't an accident of typical usage — it's designed in.

A heap's two mutating operations are defined to touch exactly one position in level order:

- **`push` always inserts at the next open slot after the last node in level order** — never in the
  middle, never creating a hole.
- **`pop` always removes the last node in level order** (after first copying its value into the root
  — the mechanics are in the next section) — again never leaving a hole anywhere except the very
  end, where a hole is invisible because it's simply where the array now stops.

Both operations only ever grow or shrink the structure from the _one place completeness allows
growth_: the end of the last level, or the start of a new one. There is no heap operation that
removes an arbitrary internal node and no heap operation that inserts into the middle of a level —
if there were, completeness could break, and the array form would start wasting slots exactly the
way a skewed BST does. Because every operation is constrained this way, completeness isn't something
a heap happens to have most of the time — it's an invariant maintained by construction after every
single call, which means:

- **`children(i) = 2i + 1, 2i + 2`** and **`parent(i) = (i - 1) // 2`** always land on the correct
  relatives, for every index that holds a real node — never off into an empty gap, and never past
  the end of the array (the same arithmetic works out to the last valid index or beyond it exactly
  when a node has no such child).
- The array never needs resizing logic beyond ordinary dynamic-array growth (Python's `list` already
  amortizes `append` to O(1)) — no rebalancing pass, no gap-filling, ever.
- No `Node` object, no `left`/`right` pointers, no `None` sentinels for absent children — the array
  positions _are_ the whole structure, and every one of them holds a real value.

This is the direct payoff of deferring the array-representation discussion to "this same Part,
Chapter 11" back in Chapter 1: a heap isn't a binary tree that happens to fit well in an array, it's
a structure whose insert/remove rules were chosen specifically so that array form never has a reason
to waste a slot.

```python
def parent(i: int) -> int:
    return (i - 1) // 2

def left_child(i: int) -> int:
    return 2 * i + 1

def right_child(i: int) -> int:
    return 2 * i + 2
```

---

## Core Operations: peek, push, pop

The whole heap lives in one Python list, `heap`, with `heap[0]` always the minimum when the
invariant holds. Every operation below either reads that fact directly or does the minimum work
needed to restore the invariant after a single change — never a full re-sort.

### `peek` — O(1)

The invariant guarantees the minimum is the root, so reading it is just an index:

```python
def peek(heap: list) -> int:
    if not heap:
        raise IndexError("peek from an empty heap")
    return heap[0]
```

No comparisons, no traversal — this is the entire reason a heap exists rather than, say, a plain
sorted list re-sorted on every mutation. **O(1).**

### `push` — append, then sift up — O(log n)

Inserting has to do two things: land the new value in the one slot completeness allows (the next
open position in level order — for a Python list, that's just `append`), and then repair whatever
invariant violation that placement might have caused.

```python
def push(heap: list, value) -> None:
    heap.append(value)                 # step 1: land at the next open slot (completeness-preserving)
    _sift_up(heap, len(heap) - 1)       # step 2: restore the invariant

def _sift_up(heap: list, i: int) -> None:
    while i > 0:
        p = parent(i)
        if heap[p] <= heap[i]:
            break                       # parent already <= child: invariant holds, stop
        heap[p], heap[i] = heap[i], heap[p]
        i = p
```

The new value can only ever violate the invariant against its own chain of ancestors — it was just
appended as a leaf, so it has no children yet to violate anything against. `_sift_up` walks that one
ancestor chain, swapping upward exactly as long as the parent is bigger, and stops the instant it
finds a parent that's already smaller or equal (at that point every ancestor above is guaranteed
`<=` the parent, by the invariant already holding before this insert, so no further comparison is
needed). That chain has length equal to the tree's height, which for a complete tree of `n` nodes is
`floor(log2(n))` — hence **O(log n)**, bounded by height exactly the way
[[01-tree-fundamentals|Chapter 1]]'s recursion-depth argument was bounded by height.

### `pop` — swap root with last, remove last, sift down — O(log n)

Removing the minimum can't just delete index `0` — that would shift every other index and destroy
the `2i+1`/`2i+2` arithmetic for the entire rest of the array. Instead:

```python
def pop(heap: list) -> int:
    if not heap:
        raise IndexError("pop from an empty heap")
    minimum = heap[0]
    last = heap.pop()                  # remove the last element (completeness-preserving)
    if heap:                           # if anything's left, the last value becomes the new root...
        heap[0] = last
        _sift_down(heap, 0)            # ...and gets sifted down to a valid resting place
    return minimum

def _sift_down(heap: list, i: int) -> None:
    n = len(heap)
    while True:
        l, r, smallest = left_child(i), right_child(i), i
        if l < n and heap[l] < heap[smallest]:
            smallest = l
        if r < n and heap[r] < heap[smallest]:
            smallest = r
        if smallest == i:
            break                       # both children already >= this node: invariant holds, stop
        heap[i], heap[smallest] = heap[smallest], heap[i]
        i = smallest
```

The move that makes this work: the value being removed (the old root) is gone for good, and the
_last_ value in level order is exactly the one value that can be relocated to the root without
touching completeness — removing it from the end took nothing away from any other node's
`2i+1`/`2i+2` relationships, and dropping it in at the root is a placeholder that `_sift_down` then
walks down to wherever it actually belongs. `_sift_down` compares the out-of-place node against
_both_ children (not just one, the way `_sift_up` only ever had one parent to check) and swaps with
whichever child is smaller — swapping with the larger child could leave that child violating the
invariant against its own sibling's subtree. Like `_sift_up`, the walk is bounded by the tree's
height, so **O(log n)**.

---

## Build-Heap: Why O(n), Not O(n log n)

Given a plain, unordered array of `n` values, there are two ways to turn it into a valid heap.

**The naive way:** start with an empty heap and `push` each of the `n` values one at a time. Each
`push` is O(log n) (from the previous section), and there are `n` of them, so the total is **O(n log
n)** — the same order as sorting, which should already feel like it's leaving something on the
table, since a heap is a much weaker structure than a fully sorted array.

**The better way — `heapify`:** treat the existing array as an already-shaped (if not yet
correctly-ordered) complete binary tree, and repair the invariant bottom-up: starting from the
**last non-leaf node** and walking backward to index `0`, call `_sift_down` at each position.

```python
def heapify(arr: list) -> None:
    n = len(arr)
    last_non_leaf = n // 2 - 1          # every index after this one is a leaf: no children to sift against
    for i in range(last_non_leaf, -1, -1):
        _sift_down(arr, i)
```

Leaves need no work at all — a leaf has no children to compare against, so `last_non_leaf` is
exactly the cutoff below which every index is already trivially "correct" (a single node with no
children can't violate a parent-children invariant). Everything from `last_non_leaf` down to the
root gets a `_sift_down` call, each of which walks down from its own position to wherever the
invariant needs it — but not _up_, which is the detail that makes the complexity argument work: a
node only ever has to sift down through its own subtree, and by the time index `i` is processed,
every subtree below `i` has already been heapified by an earlier iteration (this is a postorder-ish
bottom-up sweep — small subtrees are fixed first, so a parent's `_sift_down` can rely on both of its
children already being valid sub-heaps before it runs).

**Why this is O(n), not O(n log n) — worth deriving, not just asserting.** The naive analysis — "n
nodes, each costs up to O(log n) to sift" — is the same mistake as assuming every node in a
recursive tree computation costs the same: it isn't true, because `_sift_down`'s cost is bounded by
the **height of the subtree rooted at that node**, not by the height of the whole tree, and _most
nodes in a heap sit near the bottom_, where their subtrees are shallow:

- **Half the nodes are leaves** (height `0`) — `_sift_down` does zero work on them; they're already
  correct.
- **A quarter of the nodes are at height `1`** — `_sift_down` does at most 1 swap-and-descend.
- **An eighth are at height `2`** — at most 2 levels of work.
- In general, the number of nodes at height `h` is roughly `n / 2^(h+1)`, and the work `_sift_down`
  does at height `h` is at most `h` swaps.

Summing `(work at height h) × (number of nodes at height h)` across every level gives:

```
Total work  ≈  Σ  h · (n / 2^(h+1))     for h = 0 up to log2(n)
            =  (n / 2) · Σ  h / 2^h
```

The series `Σ h / 2^h` (for `h = 0, 1, 2, ...`) is a standard convergent series whose sum approaches
a constant (`2`, in the limit as the number of terms grows) — it does **not** grow with `n`. That's
the crux: the total work is `n` times a _constant_, not `n` times `log n`. The naive bound
overcharges every node the full O(log n) worst case, but the overwhelming majority of nodes are
leaves or near-leaves where that worst case never comes close to being paid — and there's exactly
one node (the root) that could actually cost the full O(log n), so the sum is dominated by the huge
number of cheap nodes near the bottom, not the few expensive ones near the top.

**The upshot:** `heapify` on an existing array of `n` elements is **O(n)**. Building a heap by
pushing elements one at a time is **O(n log n)**. Same end result — a valid heap — very different
cost to get there, and the gap is exactly why `heapq.heapify` exists as its own function instead of
a loop over `heappush`.

---

## Python's heapq in Practice

Python's [`heapq`](https://docs.python.org/3/library/heapq.html) module implements everything above,
but with two deliberate simplifications worth noting up front: it only ever gives you a **min-heap**
(no max-heap mode, no comparator argument to flip the ordering), and there's no heap _class_ at all
— every function takes a plain Python `list` as its first argument and mutates it in place. The list
_is_ the heap; `heapq` is just the set of functions that keep the invariant true as you push and
pop.

```python
import heapq

arr = [5, 3, 8, 1, 2]
heapq.heapify(arr)          # in-place, O(n) — the algorithm derived above
print(arr)                  # [1, 2, 8, 3, 5] — heap-ordered, NOT fully sorted
                             # (only "parent <= children" holds — e.g. index 1 (value 2) and
                             #  index 2 (value 8) are siblings with no ordering between them)
```

- **`heapq.heapify(arr)`** — converts a list into a valid heap **in place**, in **O(n)**, using the
  bottom-up sift-down just derived. It reorders `arr` itself; there's no return value to capture.

- **`heapq.heappush(heap, item)`** — append `item`, then sift up. **O(log n)**.

  ```python
  heapq.heappush(arr, 0)
  print(arr)                 # 0 is now the new minimum, bubbled to the root
  ```

- **`heapq.heappop(heap)`** — swap root with last, remove and return the old root, sift down.
  **O(log n)**. Raises `IndexError` on an empty heap.

  ```python
  smallest = heapq.heappop(arr)
  print(smallest)            # the minimum that was just removed
  ```

- **`heapq.heappushpop(heap, item)`** — push `item`, then immediately pop and return the minimum,
  **in a single call**. This is more efficient than calling `heappush` followed by `heappop`
  separately: if `item` is already `>=` the current root, it can be returned immediately without
  ever being inserted into the heap at all, saving a full sift-up/sift-down round trip. Use it when
  you know in advance that a push will be immediately followed by a pop — the classic case is
  maintaining a fixed-size "top-K smallest seen so far" window.

  ```python
  result = heapq.heappushpop(arr, 4)   # push 4, then pop+return the minimum — one call
  ```

- **`heapq.heapreplace(heap, item)`** — the _other_ order: pop and discard the current minimum
  **first**, then push `item`. Requires the heap to be **non-empty** (unlike `heappushpop`, which
  tolerates an empty heap by just returning `item` straight back). Use `heapreplace` when the value
  being popped needs to be discarded rather than compared against, or when you specifically need
  "remove-then-insert" semantics rather than "insert-then-remove."

  ```python
  old_min = heapq.heapreplace(arr, 5)  # pop the current minimum, then push 5
  ```

  `heappushpop` and `heapreplace` return different things for the same two inputs whenever `item` is
  smaller than the current root: `heappushpop` would hand `item` straight back (it never even
  entered the heap, since it's already the smallest), while `heapreplace` always evicts whatever was
  at the root _before_ the push happened. Picking the wrong one silently changes which value
  survives in the heap — worth checking explicitly whenever both are candidates for the same call
  site.

- **Peek** has no dedicated function — for a min-heap backed by a plain list, the minimum is just
  `heap[0]`, exactly as derived above. **O(1)**, no function call needed.

### The max-heap workaround

`heapq` has no max-heap mode, so the standard trick is to **negate every value on the way in and on
the way out** — a max-heap on the original values is exactly a min-heap on their negatives, since
flipping every sign flips every comparison:

```python
import heapq

max_heap = []
for val in [3, 1, 4, 1, 5]:
    heapq.heappush(max_heap, -val)     # store the negation

largest = -heapq.heappop(max_heap)     # negate again on the way out
print(largest)                          # 5 — the true maximum
```

This works because negation is order-reversing: if `a <= b` then `-a >= -b`. Whatever `heapq` finds
to be the "minimum" among the negated values is, after negating back, the true maximum of the
original values. The discipline this demands: **every** value has to go in negated and come out
negated, consistently — mixing a negated push with a non-negated read (or vice versa) silently
corrupts the ordering, and nothing in `heapq` will warn you, since a list of mixed-sign floats is
just as valid a "heap" by the invariant as any other.

> **Note on the source material.** The practice file this section is adapted from
> (`09-py-core-data-structures.py`, `print_heapq()`) had all of this logic correct and covers the
> same ground — `heapify`, `heappush`, `heappop`, the max-heap negation trick, and a "quick
> reference" block showing `heappushpop`/`heapreplace` calls back to back. Two things are cleaned up
> here versus that version: first, the original interleaves every call with a `print(...)` inside a
> demo function (`print_heapq()`), which is fine for an ad-hoc script but obscures which lines are
> the actual API calls versus which are just narration — this chapter separates each operation into
> its own runnable snippet with the complexity noted alongside it. Second, the original's "quick
> reference" block calls `heappushpop` and `heapreplace` back to back on the same `h` without
> explaining _why_ you'd reach for one over the other; that distinction (insert-then- remove vs.
> remove-then-insert, and what happens differently when the pushed value is smaller than the current
> root) is spelled out explicitly above, since it's the actual decision point between the two
> functions, not just a syntax difference.

---

## Complexity Summary

| Operation                            | Complexity     | Why                                                                                                       |
| ------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------- |
| `peek` (read minimum)                | **O(1)**       | Invariant guarantees the minimum is always at index `0`                                                   |
| `push` (insert)                      | **O(log n)**   | Append (completeness-preserving), then sift up — bounded by height                                        |
| `pop` (remove minimum)               | **O(log n)**   | Swap root/last, remove last, sift down from root — bounded by height                                      |
| Build-heap via `heapify` (bottom-up) | **O(n)**       | Sift-down cost is bounded by _subtree_ height; most nodes are near the bottom, where that's cheap or free |
| Build-heap via `n` naive pushes      | **O(n log n)** | Each of `n` pushes individually costs up to O(log n), with no benefit from bottom-up ordering             |

The last two rows are the same end state — a valid heap over the same `n` values — reached by two
different paths with a real asymptotic gap between them. That gap is exactly why `heapq.heapify`
exists as a dedicated function rather than a documented idiom of looping over `heappush`.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
