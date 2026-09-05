---
title: "1 — Tree Fundamentals"
description: "Root, parent, child, leaf, depth vs. height, and the recursively-defined structure — general vs. binary trees, the four traversal orders, and pointer- vs. array-based representation — that every later tree chapter assumes without re-explaining."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-26"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/03-recursion/03-recursion
    kind: related
---

# 1 — Tree Fundamentals

Ask someone to define a tree and the answer is usually "a hierarchy" or "like a family tree" — true,
and too vague to write an algorithm against. Every tree algorithm in this Part — search, insert,
delete, balance, serialize — rests on a small, precise vocabulary and one structural fact: a tree
isn't a special kind of graph you memorize a list of rules for, it's a **recursively defined
structure**, and once that's actually internalized, most of what looks like a brand-new algorithm
each chapter turns out to be the same recursive shape wearing a different base case and a different
combine step. This chapter builds that vocabulary and that shape before every later chapter leans on
them without re-explaining.

---

## Core Terminology

A tree is built from **nodes** connected by **edges**, with no cycles and exactly one path from the
root to any other node. Every definition below refers back to one example tree:

```
              A                  <- root, depth 0
            /   \
           B     C               <- depth 1
          / \     \
         D   E     F             <- depth 2
        /
       G                         <- depth 3
```

- **Root** — the one node with no parent; the top of the tree and the conventional entry point for
  every algorithm. `A` is the root above.
- **Parent** — the node directly above a given node, connected to it by a single edge. `B`'s parent
  is `A`; `D`'s parent is `B`.
- **Child** — the inverse relationship. `B` and `C` are `A`'s children; `D` and `E` are `B`'s
  children.
- **Sibling** — nodes that share the same parent. `D` and `E` are siblings (both children of `B`);
  `B` and `C` are siblings (both children of `A`).
- **Edge** — the connection between a parent and a child. The diagram above has six: `A-B`, `A-C`,
  `B-D`, `B-E`, `C-F`, `D-G`.
- **Leaf** — a node with no children. `G`, `E`, and `F` are leaves.
- **Internal node** — any node with at least one child: everything that isn't a leaf, including the
  root if it has children. `A`, `B`, `C`, and `D` are internal nodes here.
- **Subtree** — a node plus everything descending from it, which is itself a complete, valid tree.
  The subtree rooted at `B` is `{B, D, E, G}` — it obeys exactly the same rules as the whole tree,
  just at a smaller scope. That's not a minor observation: it's the property that makes recursion
  the natural tool for tree algorithms, which is the whole subject of the next section.

Depth and height are the pair almost everyone mixes up on first contact, because both are "distance
measured in edges" — just from opposite reference points:

- **Depth** — the distance from the root down to a given node. The root's own depth is always `0`.
  `B` and `C` sit at depth `1`; `G` sits at depth `3` — three edges (`A-B`, `B-D`, `D-G`) separate
  it from the root.
- **Height** — the distance from a given node down to its _deepest_ leaf descendant. A leaf's height
  is `0` by definition — zero edges to its deepest leaf, because it _is_ the leaf. `D`'s height is
  `1` (one edge down to `G`). The **height of the tree** is the height of the root — here, `3`,
  since the longest downward path is `A → B → D → G`.

> **The confusion this trips almost everyone up on:** `G` is a leaf, so its height is `0` — but its
> depth is `3`, because it's three edges away from the root. Depth counts _down from the root to the
> node_; height counts _down from the node to its deepest leaf_. They're only ever equal by
> coincidence of shape, never by definition. If a problem statement says "height," it's asking about
> a node's own subtree, measured from that node; if it says "depth" or "level," it's asking about
> the node's position relative to the root.

---

## Trees Are Recursively Defined

Formally: **a tree is either empty, or it is a root node together with a set of child trees** — and
each of those child trees is, again, either empty or a root plus its own children. There's no
separate definition for "the top level" versus "some node three levels down": the subtree rooted at
`B` above satisfies exactly the same definition as the whole tree rooted at `A`. That's what "every
node is the root of its own subtree" meant in the terminology section — not a turn of phrase, the
actual recursive grammar the structure is built from.

This is precisely the base case / recursive case shape from [[03-recursion|Chapter 3, Recursion]]:
the **base case** is an empty subtree (commonly represented as `None`), and the **recursive case**
is "do something with this node, then recurse into its child subtrees and combine the results."
Nearly every algorithm in this Part — height, size, search, insert, delete, serialize, balance-check
— is a variation on that same shape:

```python
def solve(node):
    if node is None:                      # base case
        return <identity for this problem>
    left_result  = solve(node.left)       # recursive case
    right_result = solve(node.right)
    return <combine node.value, left_result, right_result>
```

Computed this way, `height` turns the depth/height distinction from the previous section from an
abstract definition into a running program:

```python
def height(node):
    if node is None:
        return -1                # empty subtree: one below a leaf's height of 0
    return 1 + max(height(node.left), height(node.right))
```

A leaf has `None` for both children, so `height(leaf) = 1 + max(-1, -1) = 0` — matching the
definition exactly. Walk this up the example tree and `height(A) = 1 + max(height(B), height(C))`,
which only resolves once `height(B)` has resolved, which only resolves once `height(D)` and
`height(E)` have resolved, down to the `None` children at the very bottom. That resolution order —
answers flow back up only after the deepest calls return — is the same call-stack unwinding
[[03-recursion|the recursion chapter]] walked through with `factorial`; the difference is that a
tree's recursion tree literally _is_ the tree's own shape, not a separate diagram drawn to reason
about it after the fact. A skewed tree — one leaning entirely to one side, like the `A-B-D-G` chain
in the running example — produces recursion depth equal to its height: `n` stack frames in the worst
case for `n` nodes. That's the direct link to the `RecursionError` ceiling from the recursion
chapter, and it's exactly the failure mode that motivates keeping trees _balanced_ — its own topic,
starting a few chapters from now.

---

## General Trees vs. Binary Trees

A **general tree** (also called an **n-ary tree**) places no limit on how many children a node may
have: a file-system directory can contain any number of subdirectories, an org-chart node can have
any number of direct reports, a DOM element can have any number of child elements. A **binary tree**
restricts every node to **at most two children**, conventionally named **left** and **right** — not
"child 1" and "child 2," but two distinct, ordered positions, so a node with only one child still
has to say which side that child occupies.

That framing matters: **binary is a restriction of general, not a generalization built on top of
it.** It's tempting to assume binary trees are the simple starter case and general trees are the
more advanced structure you build up to — but the naming actually has it right, and it's worth
stating plainly so it never gets inverted: the n-ary tree is the broad category; the binary tree is
a deliberately narrowed member of it, chosen because the narrowing buys something concrete.

What it buys: with at most two, _ordered_ children, a node's recursive case always has exactly two
sub-calls (`solve(node.left)`, `solve(node.right)`) — no loop over a variable-length children list,
no question of how many there might be. That fixed shape is what makes the "combine node,
left-result, right-result" pattern from the previous section so mechanical, and it's what makes an
**ordering** possible at all: a binary tree can encode "left subtree comes before this node, this
node comes before right subtree" as a total, consistent rule — the inorder traversal below, and the
entire reason a _binary search tree_ can stay sorted (previewed here, actually explained in
[[03-binary-search-trees|Chapter 3, Binary Search Trees]]). A general tree node with, say, five
children has no equivalent built-in notion of "the third child is greater than this node but less
than the fourth" — the structure alone doesn't supply an ordering; you'd have to invent one on top
of it.

That's the actual reason this Part spends one chapter on general trees (this one, briefly) and every
other chapter — binary trees, BSTs, AVL trees, red-black trees, heaps, tries — on structures that
are binary, or that impose their own strict shape for the same reason binary trees do. Most
interview problems are binary-tree problems, and most of the efficient tree structures used in real
systems (search trees, heaps, priority queues) are binary specifically because two ordered children
is the minimum structure needed to reason cleanly about ordering, balance, and recursive combination
— more children would add complexity without buying back enough expressiveness for what these
structures need to do.

General trees don't disappear from practice — a directory tree or an org chart is still modeled as
one, and traversing it still recurses as "for each child, recurse" instead of "recurse left, recurse
right" — they just don't get a dedicated chapter here, because their algorithms don't compress into
a reusable, recurring pattern the way binary-tree algorithms do; each n-ary structure tends to be
bespoke to its own domain rather than a general-purpose interview pattern the way a BST or a heap
is.

---

## The Four Traversal Orders, Conceptually

A traversal decides the order in which a tree's nodes get visited. What changes between orders is
_when_, relative to a node's children, that node itself gets processed — and that timing decision is
what makes each order suited to a different job. (How to actually implement each one — recursively,
or with an explicit stack or queue — is the next chapter's job; this section is only about what each
order means and why it exists.)

Using the same example tree:

```
              A
            /   \
           B     C
          / \     \
         D   E     F
        /
       G
```

- **Preorder — node, then left subtree, then right subtree.** `A B D G E C F`. The node is emitted
  _before_ either child, so a parent always appears in the output before its children do. That's
  exactly what serialization or a deep copy needs: reading the output left to right, by the time any
  node's value is reached, its parent has already been created — a tree can be rebuilt top-down
  while reading, with no need to patch a parent pointer in later.

- **Postorder — left subtree, then right subtree, then node.** `G D E B F C A`. The node is emitted
  _last_, only after both children are fully processed. That ordering is what makes postorder the
  safe order for **deletion or freeing memory**: a node can't be safely discarded while something
  might still need to reach its children through it, so the children have to be dealt with first,
  and the parent only once nothing beneath it remains to visit. Postorder is also the natural order
  for computing anything that depends on a node's children's results before it can compute its own —
  sizes, heights (the `height()` function above _is_ a postorder computation: both recursive calls
  happen first, then their results combine) — for the same reason.

- **Inorder — left subtree, then node, then right subtree.** `G D B E A C F`. On a general binary
  tree this is just one more valid ordering. On a **binary search tree** specifically, it produces
  the tree's values in fully sorted order — a genuinely special property, previewed here and
  actually explained (why the left-less-than-right invariant makes that fall out) in
  [[03-binary-search-trees|Chapter 3, Binary Search Trees]].

- **Level-order (breadth-first) — every node at depth 0, then every node at depth 1, then depth 2,**
  and so on. `A B C D E F G`. This is the odd one out: the other three are depth-first — each
  plunges down one branch before backing out to try the next — while level-order fans out sideways,
  one full depth at a time, which means it needs a queue rather than a stack (or the recursive call
  stack) to track what's next. That structural difference is what makes level-order the right choice
  whenever a problem is about **proximity to the root rather than subtree structure**: the minimum
  depth to any node matching some condition, printing a tree row by row, or any "closest nodes
  first" requirement where a depth-first order would reach a distant node before a nearby one.

---

## Representation: Pointers vs. Arrays

**Pointer-based** is the default representation used throughout this Part: a `Node` (or `TreeNode`)
object holding a value and explicit references to its children.

```python
class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right
```

Every worked example from here through the rest of the Part builds on exactly this shape —
`node.left`, `node.right`, `None` standing in for an empty subtree. It costs a pointer (or two, for
`left`/`right`) per node beyond the value itself, but it places no constraint on the tree's shape:
any node can be missing either child, in any pattern, and the structure stays correct — no space is
ever wasted on nodes that don't exist.

**Array-based** representation drops the pointers entirely and recovers parent/child relationships
from **index arithmetic**: store the tree's nodes in a flat array where the node at index `i` has
its children at indices `2i + 1` and `2i + 2` (and, going the other direction, the node at index
`i`'s parent sits at `(i - 1) // 2`). No `Node` object, no `left`/`right` references — the array's
positions _are_ the structure:

```
index:     0   1   2   3   4   5   6   7
value:     A   B   C   D   E   -   F   G
```

That only stays compact — every slot holding a real node, nothing wasted — when the tree is
**complete**: every level fully filled except possibly the last, and the last level filled strictly
left to right with no gaps. That's a strong shape guarantee, and it's exactly the shape a **heap**
([[11-heap|Chapter 11, Heap]], this same Part) maintains by construction — a heap's insert/remove
operations are specifically designed to always add or remove the last position in level order, so
completeness never breaks, and the array form never wastes a slot.

The running example tree is _not_ complete (`D` has a left child `G` but no right child, and `C` has
no left child at all), and the array above already shows the cost: `C`'s missing left child still
reserves index `5` — empty, because nothing lives there — just to keep the `2i+1`/`2i+2` arithmetic
consistent for every other node. That's a minor waste in a seven-node tree; it compounds fast as
trees grow: a right-skewed tree of height `h` — one real node per level, each with only a right
child — has just `h + 1` actual nodes, but its deepest node's index climbs to roughly `2^(h+1) - 2`,
meaning the array needs on the order of `2^(h+1) - 1` slots to hold those `h + 1` values. That's why
pointer-based stays the default for general binary trees, BSTs, AVL trees, and red-black trees —
where shape isn't guaranteed and can skew arbitrarily — and array-based representation is reserved
specifically for structures, like the heap, that guarantee completeness as an invariant rather than
an accident.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
