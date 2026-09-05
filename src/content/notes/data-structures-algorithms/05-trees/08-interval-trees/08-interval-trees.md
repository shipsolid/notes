---
title: "8 — Interval Trees"
description: "Augmented BST ordered by interval low-endpoint, storing each subtree's max high-endpoint (max_end) to prune subtrees that provably can't overlap a query — cutting overlap search from O(n) brute force to O(log n + k), and why max_end is the one field that makes the pruning possible."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-36"
relations:
  - slug: data-structures-algorithms/05-trees/03-binary-search-trees/03-binary-search-trees
    kind: related
---

# 8 — Interval Trees

Every augmented structure in this Part has followed the same shape: take the plain BST from Chapter
3, leave its ordering and its O(h) walk completely untouched, and bolt one extra field onto each
node that answers a question the ordering alone can't. AVL trees (Chapter 4) bolted on a height, so
a single per-node check could answer "is this subtree lopsided?" without walking it. Segment trees
(Chapter 6) bolt on a range aggregate, so a query can answer "what's the sum, min, or max over this
window?" without touching most of the nodes underneath it. This chapter's question is a different
shape from either of those: given a query interval, which of the intervals already stored here
overlaps it? The one extra field that turns an ordinary BST into a structure that can answer that in
O(log n) is called `max_end`, and the rest of this chapter is really just working out the
consequences of adding it.

A calendar app checking whether a proposed 2pm–3pm meeting collides with anything already booked is
asking exactly this question. So is a genome browser asked which annotated genes fall inside a
requested chromosome region, a rendering engine asked which objects' bounding boxes might intersect
before running expensive exact collision checks on them, and a memory allocator refusing to hand out
a block that overlaps one already claimed. All four are the same query on different data: _does
anything in this collection of intervals overlap the one I'm holding?_

---

## The Problem: Efficient Overlap Queries

**Setup.** You have a set of `n` intervals — each one a `(low, high)` pair with `low <= high`. Given
a query interval `Q`, find some or all of the stored intervals that overlap `Q`.

**Overlap, defined precisely.** Two intervals `I` and `J` overlap unless one of them ends before the
other begins — that's the only way two ranges on a line can fail to share a point. Restated as a
positive condition instead of a negation: `I` and `J` overlap iff neither one's low endpoint exceeds
the other's high endpoint:

```
overlap(I, J)  iff  I.low <= J.high  and  J.low <= I.high
```

Two comparisons, but each one checks a different pair of the four endpoint values (`I.low`,
`I.high`, `J.low`, `J.high`) against each other — get a direction backwards and the test silently
returns the wrong answer, usually on the touching-endpoint edge case. This book's convention treats
intervals as closed, so touching counts as overlapping: `[1, 5]` and `[5, 10]` overlap at the single
point `5`. If your problem wants half-open, back-to-back-meetings-don't-collide semantics instead,
swap `<=` for `<` in both comparisons above and nowhere else — the rest of this chapter is
unaffected by that choice.

**The brute-force answer** is a linear scan: check every one of the `n` stored intervals against `Q`
using the test above, keep the ones that pass. That's correct and it's O(n) per query, full stop —
no shortcuts, because nothing about an unordered (or even a low-to-high sorted) list of intervals
tells you in advance which ones are worth checking. A calendar with ten thousand recurring meetings
re-scanning all ten thousand on every conflict check is exactly this brute force, paying full price
every single time.

**The target** is O(log n) to find one overlap (or prove none exists), and O(log n + k) to find all
`k` of them — you cannot do better than O(k) just to _report_ k results, so O(log n + k) is
effectively optimal: O(log n) to locate the neighborhood, O(k) to walk out the answers actually
sitting there. Getting there needs a structure that can rule out entire groups of intervals without
inspecting each one individually — which is exactly what a tree buys you, provided it's augmented
with the right piece of information.

---

## Structure: A BST Ordered by Low Endpoint, Augmented With max_end

An interval tree is a BST where every node stores one interval, and the tree is ordered by that
interval's **low endpoint** — exactly the Chapter 3 invariant, with `node.low` standing in for "the
value." Search and insert, as far as _placement_ is concerned, are the unmodified Chapter 3
algorithms: compare the incoming low endpoint against the current node's low endpoint, go left if
smaller, right otherwise. Nothing about that part changes.

```python
class IntervalNode:
    def __init__(self, low, high, left=None, right=None):
        self.low = low
        self.high = high
        self.left = left
        self.right = right
        self.max_end = high   # augmentation: largest high-endpoint anywhere in this subtree, self included
```

`max_end` is the one addition, and it exists to answer a question that ordering-by-low simply cannot
answer on its own: _could anything in this subtree possibly overlap my query, or is the whole
subtree safe to skip?_

Here's why that question is hard without it. The tree is ordered by low endpoint only — nothing
constrains where a node's _high_ endpoint sits relative to its ancestors or its siblings. A single
early-starting, very long meeting — say `(9, 23)`, a nine-to-eleven-PM block booked as one entry —
can sit anywhere a low-endpoint-only BST insert happens to place it, arbitrarily deep in a left
subtree, buried under nodes whose own intervals are short and unremarkable. If all you know is "this
subtree contains intervals with low endpoints in such-and-such range," you learn nothing about
whether one of them reaches far enough right to overlap a query interval sitting well past every low
endpoint in that subtree. The only honest way to answer that with ordering-by-low alone is to walk
every node in the subtree and check — which throws away the entire point of having a tree.

`max_end` closes that gap by pre-computing, at every node, the answer to "what's the single farthest
extent — the maximum high endpoint — reachable anywhere below me, including myself?" That's a
whole-subtree aggregate, not a per-node fact, which is exactly why it needs the same "compute it on
the way back up" treatment as an AVL height or a segment tree node's aggregated value — a node can't
know its own `max_end` until it knows what its children's subtrees are hiding.

---

## Maintaining max_end on Insert

The recompute happens in the same place AVL recomputes height and a segment tree recomputes a
parent's aggregate: on the unwind, after the recursive call into a child returns. There's no way to
compute it on the way _down_, because descending into `insert(node.left, ...)` doesn't yet know what
that call is going to do to the subtree below — only once it returns, with the subtree finalized,
can the current node correctly fold that result into its own `max_end`.

```python
def insert(node, low, high):
    if node is None:
        return IntervalNode(low, high)
    if low < node.low:
        node.left = insert(node.left, low, high)
    else:                                    # low >= node.low: duplicates go right, same convention as Ch.3
        node.right = insert(node.right, low, high)

    # fix on the unwind — identical shape to AVL's height recompute and a segment
    # tree's parent-aggregate recompute: fold in whatever the subtree below just became
    node.max_end = node.high
    if node.left is not None:
        node.max_end = max(node.max_end, node.left.max_end)
    if node.right is not None:
        node.max_end = max(node.max_end, node.right.max_end)
    return node
```

**Worked trace.** Build a small tree by inserting `(20,25)`, `(10,30)`, `(30,40)`, `(5,15)`,
`(17,19)`, `(12,15)`, in that order. Walking each one through the code above (compare low endpoints,
descend, recompute `max_end` on the way back up at every ancestor) produces:

```
                         (20,25)  max_end=40
                        /        \
                  (10,30)        (30,40)  max_end=40
                max_end=30
                 /      \
             (5,15)   (17,19)
           max_end=15  max_end=19
                          /
                     (12,15)
                    max_end=15
```

Notice `(20,25)`'s own high endpoint is `25`, but its `max_end` is `40` — inherited from `(30,40)`
two levels down on the right. That gap between "this node's own high" and "this node's `max_end`" is
the entire reason the field exists: no local fact about `(20,25)` tells you a `40`-reaching interval
lives underneath it; only the aggregate does.

Now insert a seventh interval, `(3,8)`, which lands as `(5,15)`'s new left child:

- Descend `(20,25) → (10,30) → (5,15) → None`, create `IntervalNode(3, 8)` with `max_end = 8`.
- Unwind into `(5,15)`: recompute `max_end = max(15, left=8, right=None) = 15`. **Unchanged** — `15`
  already dominated `8` before this insert, so nothing here needed to move.
- Unwind into `(10,30)`: recompute `max_end = max(30, left=15, right=19) = 30`. **Unchanged.**
- Unwind into `(20,25)`: recompute `max_end = max(25, left=30, right=40) = 40`. **Unchanged.**

Every ancestor above the new node recomputed its `max_end` and every single one of them landed back
on the same value it already had. That's not the recompute being skipped — it's the recompute
running in full at every level and _discovering_ nothing needed to change, which is a fact you can
only know after doing the work, not before. Contrast: inserting `(11, 50)` at that same low-endpoint
position would force `(5,15)`, `(10,30)`, and `(20,25)` to each raise their `max_end` to `50`,
because `50` genuinely would be the new farthest reach inside every one of those three subtrees.
Same O(h) cost either way — the recompute has no way to know in advance which case it's in.

---

## Search: Pruning With max_end

Finding whether anything overlaps a query interval `Q` starts at the root and, at each node, answers
two questions in order: _does this node's own interval overlap Q?_ and if not, _which side is even
worth looking at?_

```python
def overlaps(node, q_low, q_high):
    return node.low <= q_high and q_low <= node.high

def search_overlap(node, q_low, q_high):
    if node is None:
        return None
    if overlaps(node, q_low, q_high):
        return node
    if node.left is not None and node.left.max_end >= q_low:
        return search_overlap(node.left, q_low, q_high)     # left COULD reach the query — worth checking
    else:
        return search_overlap(node.right, q_low, q_high)    # left provably can't reach — skip it entirely
```

The pruning step is the whole payoff. `node.left.max_end` is the largest high endpoint anywhere in
the left subtree — not just at its root, everywhere underneath it. If that single number is still
less than `q_low`, then _every_ interval in that entire subtree ends before `Q` even begins, and not
one of them can possibly overlap `Q` — no exception, no need to check further down, because
`max_end` already accounts for the farthest-reaching interval that subtree has. The whole subtree,
however many nodes it contains, is ruled out in one comparison.

**Worked example.** Using the seven-node tree built above, query `Q = [35, 38]` — checking whether
anything collides with a 35–38 booking:

```
                         (20,25)  max_end=40
                        /        \
                  (10,30)        (30,40)  max_end=40
                max_end=30
                 /      \
             (5,15)   (17,19)
           max_end=15  max_end=19
                          /
                     (12,15)
```

1. At `(20,25)`: `overlaps`? `20 <= 38` is true, but `35 <= 25` is false → no overlap here.
2. Left child `(10,30)` exists; is `(10,30).max_end (30) >= q_low (35)`? **No.** Prune the entire
   left subtree — `(10,30)`, `(5,15)`, `(17,19)`, `(12,15)`, four nodes — without visiting a single
   one of them. Go right instead.
3. At `(30,40)`: `overlaps`? `30 <= 38` true and `35 <= 40` true → **overlap found**, return
   `(30, 40)`.

Two nodes visited, five nodes pruned, correct answer in two comparisons at the root plus one at the
leaf. Now query `Q = [41, 45]` — nothing in this tree extends that far:

1. At `(20,25)`: no overlap (`41 <= 25` false).
2. `(10,30).max_end (30) >= 41`? No → prune the left subtree again, go right.
3. At `(30,40)`: no overlap (`41 <= 40` false). Right child is `None` → recurse into `None` → base
   case returns `None`.

Result: no overlap exists, correctly determined after visiting only two of the seven nodes — the
"prove nothing overlaps" case costs exactly the same O(h) walk as the "find one" case, because both
are the identical single-path descent; the algorithm doesn't know in advance which outcome it'll
land on.

**Finding all overlaps**, rather than stopping at the first one, means not committing to a single
child at each node — but the pruning logic extends cleanly to both sides. The left-side rule is
unchanged (`left.max_end >= q_low`). The right side gets its own rule, from the same ordering
invariant this whole structure is built on: every interval in a node's right subtree has a low
endpoint `>= node.low` (that's the Chapter 3 ordering, restated). So if `node.low > q_high` already,
every interval to the right — whose low endpoints are all `>= node.low`, hence also `> q_high` — is
disqualified too, and the whole right subtree is safe to skip.

```python
def search_all_overlaps(node, q_low, q_high, results):
    if node is None:
        return
    if overlaps(node, q_low, q_high):
        results.append((node.low, node.high))
    if node.left is not None and node.left.max_end >= q_low:
        search_all_overlaps(node.left, q_low, q_high, results)
    if node.right is not None and node.low <= q_high:
        search_all_overlaps(node.right, q_low, q_high, results)
```

Every recursive call either lands on a real answer (one of the `k` results) or is a branch point the
pruning rules couldn't rule out in advance — which is what keeps the total work down near O(log n +
k) rather than degrading back toward a full scan.

---

## Complexity

| Operation                               | Cost     | Condition                                                                                   |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| Insert                                  | O(h)     | same as plain BST insert (Ch.3), plus O(1) extra work per level for the `max_end` recompute |
| Find one overlap (or prove none exists) | O(h)     | single-path descent, pruning one side at each node                                          |
| Find all `k` overlaps                   | O(h + k) | `k` result nodes plus the unavoidable branch points along the way                           |

Every one of those collapses to O(log n) for `h` **only if the underlying BST is height-balanced** —
an AVL tree (Chapter 4) or a Red-Black tree (Chapter 5) underneath, not a plain unbalanced BST that
a sorted or adversarial insertion order can degrade to O(n) height (Chapter 3's closing warning
applies here exactly as written). This chapter assumes that balancing is already handled by one of
those two structures and doesn't re-derive their rotation logic — the one thing worth flagging
explicitly rather than silently glossing over is that a rotation, when it re-parents a subtree, must
also recompute `max_end` for every node whose set of descendants just changed, using the exact same
`max(own high, left.max_end, right.max_end)` formula shown above. That's a bookkeeping addition to
the rotation, not a new algorithm — building a fully self-balancing interval tree from scratch is a
combination of Chapter 4 or 5's rotations plus this chapter's `max_end` maintenance, and neither
half needs to be re-explained to understand the other.

One honest caveat on the `O(log n + k)` figure for "find all overlaps": it's the standard bound
quoted for interval trees at interview depth, and it holds for the traversal above under typical
distributions of stored intervals. Some adversarial arrangements of overlapping intervals can push
the constant behind the `log n` term higher than a single clean branch factor would suggest, because
a query can force the traversal down multiple branch points before it starts collecting the `k`
answers. It is not the place this chapter is going to chase down a fully rigorous worst-case proof —
the working mental model of "O(log n) to get to the neighborhood, O(k) to walk the results out" is
the correct one to carry into an interview and the correct one to reach for when reasoning about
production use.

---

## Real-World Use Cases

- **Calendar and meeting-room conflict detection.** The canonical case: given a proposed booking,
  find every existing reservation on that room or calendar that overlaps it. A tree per
  room/resource turns "does this collide with anything" from a scan of every existing booking into a
  logarithmic-depth walk.
- **Computational geometry — bounding-box intersection candidates.** Before running an expensive
  exact collision or intersection test between two shapes, engines typically test their axis-aligned
  bounding boxes first; an interval tree over one axis's intervals (often paired with a sweep-line
  over the other axis) prunes the vast majority of shape pairs that can't possibly intersect,
  without ever computing the expensive exact test on them.
- **Genomic interval overlap queries.** Tools in the `bedtools`/`IGV` family answer "which annotated
  genes, exons, or regulatory regions overlap this chromosome interval" against reference genomes
  with millions of annotated features — brute-force scanning that many intervals per query is not
  viable, and augmented-interval-tree-style structures (or the closely related segment tree /
  interval-list-with-index variants) are exactly why these tools stay fast.
- **Memory-region conflict detection in an allocator.** Before an allocator hands out a new address
  range, it needs to confirm that range doesn't overlap a block already claimed. Tracking live
  allocations as intervals ordered by starting address, augmented with `max_end`, turns that
  conflict check from a walk of every live allocation into a logarithmic lookup — the same shape of
  problem as calendar conflicts, just on memory addresses instead of clock time.

Python's standard library has no built-in interval tree — the community `intervaltree` package
implements this exact augmented-BST design and is worth reaching for directly rather than
reimplementing it for production code; the version in this chapter is for understanding the
mechanism, the same way `search`/`insert`/`delete` in Chapter 3 were never meant to replace
`sortedcontainers` or a language's built-in balanced-tree map.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
