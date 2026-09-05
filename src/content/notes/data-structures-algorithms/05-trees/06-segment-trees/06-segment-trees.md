---
title: "6 — Segment Trees"
description: "Binary tree over array ranges trading prefix sum's O(1) query for O(log n) — in exchange for O(log n) point updates with no rebuild, ever."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-34"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/05-prefix-sum-and-difference-arrays/05-prefix-sum-and-difference-arrays
    kind: related
---

# 6 — Segment Trees

The prefix-sum chapter closed on an unresolved debt. It built an array where every range-sum query
resolves in `O(1)` after one `O(n)` pass — and then named the exact condition that bet depends on:
the array has to hold still. Change a single element and every prefix downstream of that index is
instantly wrong, and there is no partial fix; the only way back to a trustworthy answer is
recomputing the whole array from that point forward, `O(n)`, no matter how small the change was.
That chapter called this "the boundary a Binary Indexed Tree or Segment Tree removes." This chapter
is the payoff, and the trade is worth stating in one sentence before anything else: **a segment tree
gives up prefix sum's `O(1)` query, accepting `O(log n)` instead, in exchange for a point update
that also costs `O(log n)` — with no rebuild, ever, no matter how many updates land between
queries.** Everything below is how the structure actually earns that trade.

---

## The Gap Prefix Sums Leave Open

Recall the shape of the problem from [[05-prefix-sum-and-difference-arrays|Part 02, Chapter 5]]:
`prefix[i]` holds the sum of everything in `arr` before index `i`, and a range sum `arr[l..r]` falls
out of `prefix[r+1] - prefix[l]` in `O(1)`. That works precisely because every `prefix[i]` is a
running total that depends on every element at or before `i`. That dependency is also the failure
mode: if `arr[3]` changes, `prefix[4]`, `prefix[5]`, ..., `prefix[n]` are all stale simultaneously —
not just the one closest to the change, _every_ prefix entry from that index onward, because each
one was built by adding on top of the one before it. There is no way to patch just the affected
entries without also walking every entry after them; the dependency chain is the entire rest of the
array. Fixing it costs `O(n)`, whether one element changed or ten.

The difference-array half of that chapter looks, at first glance, like it might dodge the problem —
it's already built for cheap updates. But it dodges a _different_ problem. A difference array makes
**range updates** cheap (`O(1)` each) by deferring reconstruction to one final `O(n)` pass — that
trade only pays off when all the updates happen first and the read happens once, at the end. It says
nothing about **interleaving** point updates and range queries, which is the actual shape of a huge
class of real problems: a running leaderboard where scores change and range queries ("sum of scores
ranked 10 through 50") both happen continuously, in no particular order, forever.
Rebuild-after-every- write is exactly what a difference array _avoids_ only because it assumes
writes are batched before the one read. Drop that assumption — read and write arbitrarily
interleaved, indefinitely — and both prefix sums and difference arrays degrade to the same bad
place: whichever operation you didn't optimize for costs `O(n)`.

A segment tree refuses to optimize for either operation at the other's expense. It sits deliberately
in the middle:

|               | Prefix sum                   | Segment tree                                 |
| ------------- | ---------------------------- | -------------------------------------------- |
| Range query   | `O(1)`                       | `O(log n)`                                   |
| Point update  | `O(n)` (full rebuild)        | `O(log n)`                                   |
| Preprocessing | `O(n)`                       | `O(n)`                                       |
| Best when     | Array is fixed, queries only | Queries and updates interleave, indefinitely |

Losing the `O(1)` query is a real cost, not a rounding error — but it buys a point update that never
needs a rebuild, which is the property prefix sum structurally cannot offer at any price. That's the
entire reason this structure exists.

---

## Structure: A Binary Tree Over Ranges

A segment tree is a binary tree where **every node represents a contiguous range of the original
array**, not a single element the way a plain binary search tree's node represents a single key.

- The **root** represents the whole array: range `[0, n-1]`.
- Every **internal node**'s range is split exactly in half between its two children — left child
  gets the first half, right child gets the second half (with the extra element, if the range is
  odd- length, conventionally going to the left half).
- Every **leaf** represents a single index — a range of size one, `[i, i]` — holding that element's
  raw value.
- Every internal node's stored value is the **combination** of its two children's values — sum, min,
  max, gcd, whichever associative operation the tree is built for. The root's value, by induction,
  is the combination over the entire array.

For `arr = [1, 3, 5, 7, 9, 11]` (sum-combining), the range structure looks like this — each node
labeled with its range and, in parentheses, the sum over that range:

```
                         [0,5] (36)
                        /          \
                 [0,2] (9)        [3,5] (27)
                /        \         /        \
          [0,1] (4)   [2,2] (5) [3,4] (16) [5,5] (11)
          /      \                /     \
     [0,0](1)  [1,1](3)      [3,3](7) [4,4](9)
```

Six leaves, five internal nodes — eleven nodes total for six elements. That ratio, roughly `2n - 1`,
is a general property of any binary tree where every internal node has _exactly_ two children: `n`
leaves force exactly `n - 1` internal nodes, no matter how the splits fall. It comes back below, in
the build-complexity argument.

**Storing it: a flat array, same trick as a heap.**
[[01-tree-fundamentals|Chapter 1, Tree Fundamentals]] introduced array-based tree representation —
node `i`'s children live at `2i + 1` and `2i + 2`, with no pointers at all — and noted it stays
compact only when the tree is _complete_, because index arithmetic reserves a slot for every
position the shape implies, whether or not a real node lives there. A segment tree is not complete
in the heap sense (the bottom level doesn't necessarily fill left-to-right with no gaps), but it has
a property just as useful for this purpose: **its shape is a pure function of `n`, never of
insertion order.** Unlike a BST or an AVL tree, where the actual shape depends on what got inserted
when, a segment tree over a fixed `n` always has the same shape — which means the worst-case array
size can be bounded analytically, once, for any `n`, rather than depending on the data.

That bound: the recursion is at most `⌈log₂ n⌉` levels deep. Pessimistically treating that as a
complete binary tree of height `⌈log₂ n⌉` — the exact same worst-case argument Chapter 1 used for a
right-skewed pointer tree crammed into array form — the deepest index the `2i+1` / `2i+2` arithmetic
can reach climbs to roughly `2^(⌈log₂ n⌉ + 1) - 1`, which for an `n` just above a power of two can
approach `4n`. Rather than compute the tight bound for each specific `n`, the standard, always-safe
rule of thumb — used almost universally in competitive-programming and textbook implementations
alike — is to just allocate `4 * n` slots up front and never think about it again:

```python
tree = [identity] * (4 * n)
```

Some of those slots go unused (the same "reserved but empty" waste Chapter 1 flagged for an
incomplete heap-array tree); the difference here is that the waste is capped and known in advance,
which is exactly what makes the array representation safe to use for this structure and not for a
general BST.

---

## Build: O(n)

Building the tree is a recursive descent that mirrors the range-splitting definition directly: give
each leaf its one element, give each internal node the combination of its two children.

```python
from typing import Callable


class SegmentTree:
    """Range-query segment tree over a fixed-size array, 0-indexed.

    Stored flat, sized 4n — the same index arithmetic as a heap (Chapter 1,
    this Part): node i's children live at 2i + 1 and 2i + 2. `combine` and
    `identity` are what make this general-purpose: sum uses (+, 0), min uses
    (min, +inf), max uses (max, -inf), gcd uses (gcd, 0) — any associative
    operation with an identity element plugs in unchanged.
    """

    def __init__(
        self,
        arr: list[int],
        combine: Callable[[int, int], int] = lambda a, b: a + b,
        identity: int = 0,
    ):
        self.n = len(arr)
        self.combine = combine
        self.identity = identity
        self.tree = [identity] * (4 * self.n)
        if self.n:
            self._build(arr, node=0, lo=0, hi=self.n - 1)

    def _build(self, arr: list[int], node: int, lo: int, hi: int) -> None:
        if lo == hi:                                # base case: a single element
            self.tree[node] = arr[lo]
            return
        mid = (lo + hi) // 2
        left, right = 2 * node + 1, 2 * node + 2
        self._build(arr, left, lo, mid)              # left half
        self._build(arr, right, mid + 1, hi)          # right half
        self.tree[node] = self.combine(self.tree[left], self.tree[right])
```

`SegmentTree([1, 3, 5, 7, 9, 11])` reproduces the range diagram above exactly, node for node.

**Why this is `O(n)` and not `O(n log n)`.** It's tempting to see `O(log n)` recursion depth and
assume the total cost must multiply out to `O(n log n)`, the way an unmemoized divide-and-conquer
sometimes does. That's not what happens here, and the reason is structural, not a happy accident:
every internal node in this recursion produces _exactly_ two children, never a variable number, and
the base case is a single index — so the total node count across the _entire_ tree, summed over
every level, is bounded by `2n - 1` (the same full-binary-tree fact noted above: `n` leaves force at
most `n - 1` internal nodes). Build does `O(1)` work per node — one combine call — so total build
cost is `O(n)` exactly. The `⌈log₂ n⌉` figure describes the recursion's _depth_ — how far down any
one call chain goes — not the total work summed across the whole call tree. Those are two different
numbers, and conflating them is the single most common complexity mistake with this structure.

---

## Query: O(log n)

A range query `[l, r]` walks the same tree, but at every node it has exactly one of three answers
about how that node's range relates to `[l, r]`:

1. **Fully outside** — the node's range and `[l, r]` don't overlap at all. Return the **identity**
   element (`0` for sum, `+∞` for min, `-∞` for max) and stop descending; nothing under this node
   can contribute.
2. **Fully inside** — `[l, r]` completely contains the node's range. Return this node's
   **precomputed** value and stop descending — this is the entire reason the query is `O(log n)`
   instead of `O(n)`: once a node's whole range is known to be inside the query, there's no need to
   look at a single element beneath it, because the combine was already done once, at build time.
3. **Partial overlap** — the node's range and `[l, r]` intersect but neither contains the other.
   Recurse into both children and combine their answers.

```python
    def query(self, l: int, r: int) -> int:
        """Combine over arr[l..r] inclusive."""
        return self._query(node=0, lo=0, hi=self.n - 1, l=l, r=r)

    def _query(self, node: int, lo: int, hi: int, l: int, r: int) -> int:
        if r < lo or hi < l:                        # case 1: fully outside
            return self.identity
        if l <= lo and hi <= r:                      # case 2: fully inside
            return self.tree[node]
        mid = (lo + hi) // 2                          # case 3: partial overlap
        left, right = 2 * node + 1, 2 * node + 2
        return self.combine(
            self._query(left, lo, mid, l, r),
            self._query(right, mid + 1, hi, l, r),
        )
```

**Why this is `O(log n)`, precisely.** At any single level of the recursion, at most a small
constant number of nodes can be "partial overlap" and need to keep splitting further — specifically,
at most one node whose range straddles the left boundary `l` without also covering `r`, and at most
one whose range straddles the right boundary `r` without also covering `l`. Every other node visited
at that level resolves immediately, in `O(1)`, as fully outside or fully inside. Since there are
only `⌈log₂ n⌉` levels to descend through, and only a constant number of "still partial" nodes
carried forward from each level into the next, the **total** number of nodes visited across the
whole query — summed over the entire call tree, not per level — is `O(log n)`.

**Worked trace: `query(1, 4)` on the tree above** — expected answer `3 + 5 + 7 + 9 = 24`.

```
_query(node=0, [0,5], l=1, r=4)
  [0,5] vs [1,4]: neither fully outside nor fully inside -> partial, recurse both children

  LEFT  _query(node=1, [0,2], l=1, r=4)
    [0,2] vs [1,4]: partial (0 < 1) -> recurse both children
    LEFT   _query(node=3, [0,1], l=1, r=4)
      [0,1] vs [1,4]: partial (0 < 1, but 1 <= 1) -> recurse both children
      LEFT    _query(node=7, [0,0], l=1, r=4) -> hi=0 < l=1: FULLY OUTSIDE -> 0
      RIGHT   _query(node=8, [1,1], l=1, r=4) -> l<=1 and 1<=r: FULLY INSIDE -> tree[8] = 3
      combine(0, 3) = 3
    RIGHT  _query(node=4, [2,2], l=1, r=4) -> l<=2 and 2<=r: FULLY INSIDE -> tree[4] = 5
    combine(3, 5) = 8

  RIGHT _query(node=2, [3,5], l=1, r=4)
    [3,5] vs [1,4]: partial (hi=5 > r=4) -> recurse both children
    LEFT   _query(node=5, [3,4], l=1, r=4) -> l<=3 and 4<=r: FULLY INSIDE -> tree[5] = 16
    RIGHT  _query(node=6, [5,5], l=1, r=4) -> lo=5 > r=4: FULLY OUTSIDE -> 0
    combine(16, 0) = 16

  combine(8, 16) = 24
```

Nine nodes visited total for a six-element array (`⌈log₂ 6⌉ = 3` levels) — only two of them
(`node 7` and `node 8`) sit at the deepest level, and both resolve in `O(1)` the instant they're
reached, exactly as the argument above predicts. Compare that to summing `arr[1..4]` directly: four
additions, fine for six elements, but the segment tree's cost barely grows as `n` scales into the
millions — `⌈log₂ n⌉` levels, not `n` additions.

---

## Update: O(log n)

A point update — `arr[idx] = val` — has to do two things: reach the one leaf that represents `idx`,
and then repair every ancestor's precomputed value on the way back, because every one of them
included the old value in its combine.

**Descent:** exactly one path from root to leaf, deciding left or right by comparing `idx` to the
current node's midpoint — no branching into both children the way query sometimes does, because a
single index belongs to exactly one half at every split. That's the `O(log n)` half of the cost: one
root-to-leaf path, length `⌈log₂ n⌉`.

**Unwind:** after the leaf is set, every stack frame between it and the root recomputes its own
value as `combine(left_child, right_child)` on the way back up. This is the identical shape to
[[04-avl-trees|Chapter 4, AVL Trees]]'s insert — descend inertly to find the spot, do the actual
structural work only as the recursion unwinds, one frame at a time, each frame only able to see and
fix the node it's currently standing on. AVL insert fixes a **balance factor** on the way up; a
segment tree update fixes a **combined value** on the way up. Same recursive shape, different
payload.

```python
    def update(self, idx: int, val: int) -> None:
        """Set arr[idx] = val."""
        self._update(node=0, lo=0, hi=self.n - 1, idx=idx, val=val)

    def _update(self, node: int, lo: int, hi: int, idx: int, val: int) -> None:
        if lo == hi:                                 # reached the leaf for idx
            self.tree[node] = val
            return
        mid = (lo + hi) // 2
        left, right = 2 * node + 1, 2 * node + 2
        if idx <= mid:
            self._update(left, lo, mid, idx, val)
        else:
            self._update(right, mid + 1, hi, idx, val)
        # fix on the way back up — same shape as AVL insert's unwind
        self.tree[node] = self.combine(self.tree[left], self.tree[right])
```

**Worked trace, continuing the same tree: `update(0, 10)`** — change `arr[0]` from `1` to `10`.
Expected new total: `36 - 1 + 10 = 45`.

```
_update(node=0, [0,5], idx=0, val=10)
  mid=2, idx=0 <= 2 -> descend left

  _update(node=1, [0,2], idx=0, val=10)
    mid=1, idx=0 <= 1 -> descend left

    _update(node=3, [0,1], idx=0, val=10)
      mid=0, idx=0 <= 0 -> descend left

      _update(node=7, [0,0], idx=0, val=10)
        lo == hi == 0 -> LEAF: tree[7] = 10

      -- unwind: node 3 --
      tree[3] = combine(tree[7], tree[8]) = combine(10, 3) = 13

    -- unwind: node 1 --
    tree[1] = combine(tree[3], tree[4]) = combine(13, 5) = 18

  -- unwind: node 0 --
  tree[0] = combine(tree[1], tree[2]) = combine(18, 27) = 45
```

One root-to-leaf descent (three hops: node 0 -> node 1 -> node 3 -> node 7), then three ancestor
recomputations on the way back (`node 3`, `node 1`, `node 0`). `node 2`, `node 4`, `node 5`,
`node 6`, `node 8` — everything off that single path — is untouched, because the change to `arr[0]`
cannot have affected any range that doesn't include index `0`. That locality is exactly what a
prefix array cannot offer: there, changing `arr[0]` invalidates `prefix[1]` through `prefix[6]`,
every single entry, because each one accumulated everything before it.

A follow-up `tree.query(1, 4)` after this update still returns `24` — the updated element sits
outside that range, so nothing on its path overlaps the query's path, and both queries above remain
valid without touching each other.

---

## Complexity Summary

| Operation      | Cost                      | Why                                                                                                                                          |
| -------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Build          | `O(n)`                    | `2n - 1` total nodes, `O(1)` combine work each — depth is `O(log n)`, but total node count across the whole tree is `O(n)`, not `O(n log n)` |
| Query `[l, r]` | `O(log n)`                | At most a constant number of "partial overlap" nodes carried per level, across `O(log n)` levels                                             |
| Update (point) | `O(log n)`                | One root-to-leaf descent, plus `O(1)` recompute at each of `O(log n)` ancestors on the way back up                                           |
| Space          | `O(n)`, `~4n` in practice | Flat array sized to safely cover every level's index arithmetic, including non-power-of-two `n`                                              |

Set beside prefix sum's `O(1)` query / `O(n)` update, the segment tree's row is strictly worse on
query and strictly better on update — by design. Neither structure dominates the other; which one is
correct is entirely a question of whether updates and queries interleave (segment tree) or the array
is fixed and only queried (prefix sum).

---

## What's Next: A More Specialized Alternative

Nothing about the segment tree above assumes sum specifically — `combine` and `identity` are
parameters. Swap `combine=lambda a, b: a + b, identity=0` for `combine=min, identity=float("inf")`
and the exact same `build` / `query` / `update` code answers "minimum over `[l, r]`" with a point
update instead of "sum over `[l, r]`," with zero other changes. That generality — any associative
operation with an identity element, sum, min, max, gcd, all fit — is the segment tree's actual
selling point, and it's also where its cost is paid: a `4n`-sized array, a recursive tree walk for
every operation, and noticeably more code than the prefix-sum array from the previous chapter
needed.

If the only operation that will ever be asked for is **sum**, that generality is bought and never
spent — and there's a structure that gives up the "any associative operation" flexibility
specifically to shrink the constant factor and the code for that one case back down.
[[07-fenwick-trees-bit|Chapter 7, Fenwick Trees (BIT)]] is next: the same `O(log n)` query and
`O(log n)` update this chapter earned, but specialized to prefix-sum-shaped queries, with roughly a
quarter of the memory and a much smaller constant per operation — the mirror-image trade of this
chapter's own opening line, made one level more specific.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
