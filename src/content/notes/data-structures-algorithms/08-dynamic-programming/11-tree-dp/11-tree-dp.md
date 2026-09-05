---
title: "11 — Tree DP"
description: "DP where the state is anchored to a tree node instead of an index, the recurrence combines children's answers in a single postorder pass, and the tree's own shape — not an explicit table — supplies the fill order, worked through diameter of a binary tree and maximum independent set on a tree, both O(n), with re-rooting named as the harder next step."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-60"
relations:
  - slug: data-structures-algorithms/05-trees/01-tree-fundamentals/01-tree-fundamentals
    kind: depends_on
  - slug: data-structures-algorithms/08-dynamic-programming/01-dp-fundamentals/01-dp-fundamentals
    kind: depends_on
---

# 11 — Tree DP

[[01-dp-fundamentals|Part 08, Chapter 1]] built its vocabulary — state, transition, base case —
against single-dimension examples: Fibonacci's `n`, a coin amount, later a pair of string indices.
Every one of those states was an index or a pair of indices, and the transition moved between them
by shrinking a range. [[01-tree-fundamentals|Part 05, Chapter 1]] built a different vocabulary —
root, leaf, subtree, postorder — around a different structural fact: a tree is recursively defined,
and that chapter's `solve(node)` pattern — recurse into both children, then combine their results
with the node's own value — already had the right shape for combining child answers at a parent.
Tree DP is what happens when those two chapters get pointed at each other: the DP state stops being
an index into an array and becomes a node in a tree, the transition stops being "look at state minus
one" and becomes "look at this node's children," and postorder — the traversal order
[[01-tree-fundamentals|Chapter 1]] already had a name for — turns out to already be the correct DP
evaluation order, with nothing extra to build on top of it.

---

## The Tree's Own Shape Is the Fill Order

[[03-tabulation|Chapter 3]] had to think explicitly about fill order: an index-based table fills
from small indices to large, because a cell's recurrence reads cells that must already be sitting in
the table by the time that cell is computed. Tree DP never has to ask that question. A postorder
traversal visits a node's children before the node itself by construction — that is _what postorder
means_ — so for any DP whose recurrence at `node` only needs `node.left`'s and `node.right`'s
answers, the traversal order and the dependency order are the same order, automatically, for every
tree shape. There is no separate act of "deciding the fill order" the way
[[06-longest-common-subsequence|Chapter 6]] had to decide row-major versus diagonal — the tree
decides it.

That has a sharper consequence worth stating plainly, because it changes what "DP" is actually
buying here relative to the two-pillar test [[01-dp-fundamentals|Part 08, Chapter 1]] built.
Overlapping subproblems — the same state reached by two different call paths — is the property that
made naive Fibonacci recursion exponential and made memoization or tabulation necessary. Trees don't
have that problem at all, structurally: [[01-tree-fundamentals|Chapter 1]] defined a tree as having
no cycles and exactly one path from the root to any other node, so every subtree has exactly one
parent and is reachable by exactly one downward path. Naive recursion on a tree — no cache, no table
— already visits each node exactly once, because there's no second route to the same node for it to
be re-derived from. Tree DP's payoff isn't "avoid recomputing a state visited twice"; by the strict
version of the test, it's closer to merge sort's shape from
[[01-dp-fundamentals|Part 08, Chapter 1]] — optimal substructure without overlap — than to
Fibonacci's. What survives, and what earns the name _tree DP_ anyway, is the design discipline: a
state defined per node and a recurrence expressed purely in terms of children's states — sometimes,
as in the second worked example below, a genuine small table attached to each node rather than a
single scalar. The caching machinery from [[02-memoization|Chapter 2]] and
[[03-tabulation|Chapter 3]] mostly goes unused here; the state-and-recurrence methodology from
[[01-dp-fundamentals|Part 08, Chapter 1]] does the remaining work.

---

## Worked Example: Diameter of a Binary Tree

**Diameter** is the number of edges on the longest path between _any_ two nodes in the tree — not
necessarily through the root, and not necessarily a root-to-leaf path. That "any two nodes" phrasing
is what makes it a tree-DP problem rather than a one-line traversal: the answer has to consider
every node as a candidate turning point, not just the root.

The insight that makes it tractable: any path in a tree has a unique highest point — the node where
the path stops going down one side and starts going down the other (or, for a straight downward run,
the higher endpoint itself). Call that node `v`. The path's length is entirely determined by how far
it can descend into `v`'s left subtree plus how far into `v`'s right subtree — `height(v.left) + 1`
plus `height(v.right) + 1`, using [[01-tree-fundamentals|Chapter 1]]'s convention that an empty
subtree has height `-1` so a leaf comes out to height `0`. The tree's diameter is the maximum of
that quantity over every node, since every path has exactly one such highest point and every node is
a candidate one for some path.

That means computing the diameter needs `height(v)` at every node anyway — so compute it once, with
a single postorder pass, and use the same pass to track the best diameter seen so far as a side
effect:

```python
class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right


def diameter(root: "Node | None") -> int:
    best = 0

    def height(node: "Node | None") -> int:
        nonlocal best
        if node is None:
            return -1                                  # empty subtree — one below a leaf's height of 0
        left_height = height(node.left)
        right_height = height(node.right)
        best = max(best, left_height + right_height + 2)  # longest path turning at this node
        return 1 + max(left_height, right_height)

    height(root)
    return best
```

Run it on [[01-tree-fundamentals|Chapter 1]]'s own example tree, reused here rather than invented
fresh:

```
              A
            /   \
           B     C
          / \     \
         D   E     F
        /
       G
```

Postorder visits `G, D, E, B, F, C, A` — leaves first, root last — and at each node `height` returns
while `best` updates:

| node | left height | right height | `best` after this node | returned height |
| ---- | ----------- | ------------ | ---------------------- | --------------- |
| `G`  | -1          | -1           | 0                      | 0               |
| `D`  | 0 (`G`)     | -1           | 1                      | 1               |
| `E`  | -1          | -1           | 1 (unchanged)          | 0               |
| `B`  | 1 (`D`)     | 0 (`E`)      | 3                      | 2               |
| `F`  | -1          | -1           | 3 (unchanged)          | 0               |
| `C`  | -1          | 0 (`F`)      | 3 (unchanged)          | 1               |
| `A`  | 2 (`B`)     | 1 (`C`)      | **5**                  | 3               |

`diameter` returns `5`, achieved by the path `G → D → B → A → C → F` — six nodes, five edges,
turning at the root but discovered without ever special-casing the root: the same `left_height +
right_height

- 2`computation ran at`D`,`B`, and`C`too, and simply lost to the one at`A`.

`height` is genuinely a **two-value recurrence**, even though its signature returns only one thing.
The value flowing back up the call stack — height — is what the _parent_ needs to compute its own
height and its own candidate diameter. The value accumulating in `best` is the _global_ answer, and
no parent ever needs to read a child's `best` to do its own job — `A` doesn't care what diameter `B`
found, only what `B`'s height was. That asymmetry is why a closure variable is the right tool here
rather than a `(height, best_so_far)` pair: one value has to flow up through the return value to be
useful to a parent, the other only needs to flow sideways into one shared accumulator, never back
up. The next example is the case where both values genuinely have to flow up — why it returns a
tuple instead.

---

## Worked Example: Maximum Independent Set on a Tree

**Maximum independent set** on a tree: choose a subset of nodes, no two directly connected by an
edge, maximizing the count selected (or, with weighted nodes, the sum of selected weights). Whether
a node's own children are eligible depends on whether the node itself got picked — exactly the kind
of dependency that forces two states per node instead of one.

Define, for the subtree rooted at `node`:

- `dp0(node)` — the best answer for this subtree if `node` is **excluded**. Each child is then free
  to be included or excluded, whichever is better for that child's own subtree.
- `dp1(node)` — the best answer for this subtree if `node` is **included**. Including `node` forbids
  including either direct child — the adjacency constraint applies one edge at a time — so every
  direct child is forced into its own `dp0` state.

```python
def max_independent_set(root: "Node | None") -> int:
    def solve(node: "Node | None") -> tuple[int, int]:
        if node is None:
            return 0, 0                       # excl, incl — an empty subtree contributes nothing either way

        left_excl, left_incl = solve(node.left)
        right_excl, right_incl = solve(node.right)

        excl = max(left_excl, left_incl) + max(right_excl, right_incl)
        incl = 1 + left_excl + right_excl     # including node forces both children into their excl state

        return excl, incl

    total_excl, total_incl = solve(root)
    return max(total_excl, total_incl)
```

The recurrence is the same "include this element or don't" shape [[04-knapsack-problems|Chapter 4]]
built around item indices — but here the two states live **per node** instead of per array position,
and combining them means merging every direct child's pair into the parent's pair, not just stepping
to `index - 1`.

Trace it bottom-up on the same tree, with every node weighted `1` (so `dp1` is literally `1 +`
children's `dp0` values — count, not weighted sum):

| node | `dp0` (excl)              | `dp1` (incl)    |
| ---- | ------------------------- | --------------- |
| `G`  | 0                         | 1               |
| `D`  | 1 (`max(0,1) + max(0,0)`) | 1 (`1 + 0`)     |
| `E`  | 0                         | 1               |
| `B`  | 2 (`max(1,1) + max(0,1)`) | 2 (`1 + 1 + 0`) |
| `F`  | 0                         | 1               |
| `C`  | 1 (`max(0,0) + max(0,1)`) | 1 (`1 + 0 + 0`) |
| `A`  | 3 (`max(2,2) + max(1,1)`) | 4 (`1 + 2 + 1`) |

`max_independent_set` returns `max(3, 4) = 4`, achieved by `A`'s `incl` branch: `A` included forces
`B` and `C` excluded, and the best choice within each excluded subtree is `D` and `E` included, `F`
included. That reconstructs to `{A, D, E, F}` — four nodes, none directly connected.

Both `dp0` and `dp1` have to flow back up through the return value here, because the parent's own
`dp0` needs `max(child_dp0, child_dp1)` and the parent's own `dp1` needs `child_dp0` specifically —
neither of the parent's states is computable from just one of a child's two values. That's the
contrast with diameter's `best`: there, the accumulated value never fed into a parent's own
computation, so a side-channel accumulator was the natural fit; here, both values are load-bearing
inputs one level up, so a returned tuple is. Weighting the problem — maximize summed weight instead
of count — is a one-token change: `incl = node.value + ...` instead of `incl = 1 + ...`. The
recurrence's shape doesn't move, which is [[01-dp-fundamentals|Part 08, Chapter 1]]'s "state
definition is the hard part, the transition is mechanical" lesson again — the two-state-per-node
definition already has weight's slot built in; unweighted counting was just the special case where
every node's weight is `1`.

---

## Complexity: One Pass, Constant Work Per Node

Both examples are `O(n)`: a single postorder pass visits every node exactly once, and the work
combining children's results — a handful of additions and comparisons — is `O(1)` per node for a
binary tree, at most two children to merge. Nothing in either recurrence ever revisits a node, for
the structural reason above: a tree has exactly one path to each subtree, so there's no repeated
work to eliminate — the `O(n)` bound comes directly from one postorder call per node, full stop.

The same bound holds without the binary restriction. On a general tree, merging `k` children's
results at a node costs `O(k)` instead of `O(1)`, but summed across the whole tree the total number
of parent-child relationships is exactly `n - 1` — every node but the root is somebody's child once
— so the total merging work across the traversal is `O(n - 1)`, still `O(n)` overall. Bounded
branching factor makes the per-node cost a clean constant; arbitrary branching factor just spreads
the same total cost differently across nodes.

---

## Beyond This Chapter: Re-Rooting

Both worked examples above compute one answer for the tree as rooted wherever the caller passed in
`root`. Some problems ask a sharper question: for **every** node `v`, what would this same tree-DP
quantity be if `v` were treated as the root instead? Diameter doesn't actually care which node is
called root — it's a property of the tree itself — but plenty of tree-DP quantities genuinely do
depend on the choice of root, and "compute this for every possible root" shows up often enough in
harder problems to be worth naming, even without deriving it here.

The naive approach — rerun the whole `O(n)` postorder DP once per candidate root — costs `O(n²)`
total. **Re-rooting** gets the same all-roots answer down to `O(n)`: one ordinary postorder pass
computes each node's answer relative to its actual parent, exactly as above, and a second pass —
root-to-leaves this time, undoing rather than combining — reuses each node's already-computed answer
to derive what its parent's answer would look like with that node removed, letting each node's
"answer as if I were root" be assembled from its ordinary child-based answer plus that one
undone-and-reattached contribution from its actual parent. That's a genuinely different recursion
shape, beyond this chapter's scope to derive in full — worth knowing it exists, and worth reaching
for the moment a problem statement says "for every node" instead of "for the tree."

---

## Back to State-Transition-Base-Case, Forward to Interval DP

Run this chapter's two worked examples back through [[01-dp-fundamentals|Part 08, Chapter 1]]'s
checklist and every piece lines up: **state** is the subtree rooted at a node — already the smallest
self-describing unit a tree has, per [[01-tree-fundamentals|Chapter 1]]'s own definition of subtree;
**transition** is "combine this node's value with its children's already-solved states," just
[[01-tree-fundamentals|Chapter 1]]'s `solve(node)` pattern with a problem-specific combine step
dropped in; **base case** is the empty subtree, `None`, exactly as it was for `height`. Nothing
about the methodology changed. What changed is the axis the state walks along — a tree's
parent-child edges instead of an integer index — and that axis handed the correct evaluation order
to the recursion for free, which an index-based DP never gets to assume.

[[12-interval-dp|Chapter 12]] is the next chapter in this Part, and it makes the same substitution a
third way. There, the state is a pair of boundaries `(i, j)` marking a contiguous interval — of an
array, or a string — and the transition tries every split point `k` strictly between `i` and `j`,
combining the two half-interval answers. Unlike tree DP, that dependency order isn't handed over for
free by any existing structure: interval DP has to earn its fill order explicitly, by making sure
every shorter interval is solved before any longer interval that contains it. Index, tree, and
interval are three different shapes the same three-question discipline can be pinned onto — the
actual point of walking through all three: the checklist doesn't change, only what it applies to.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
