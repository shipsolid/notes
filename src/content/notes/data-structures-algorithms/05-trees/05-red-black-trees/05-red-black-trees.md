---
title: "5 — Red-Black Trees"
description: "Color-based self-balancing BST used by most production ordered-map implementations, and how it trades stricter balance for cheaper rebalancing."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-33"
relations:
  - slug: data-structures-algorithms/05-trees/04-avl-trees/04-avl-trees
    kind: related
  - slug: data-structures-algorithms/03-linked-data-structures/04-skip-lists/04-skip-lists
    kind: related
---

# 5 — Red-Black Trees

[[04-avl-trees|AVL Trees]] guarantees a height-balance factor of at most 1 at every node, checked
and restored after every insert and delete. That guarantee is expensive to maintain: a single insert
can require rotations cascading toward the root every time the balance factor tips past its limit.
Red-black trees ask a cheaper question. Instead of tracking an exact height difference at every
node, a red-black tree tags each node with one bit — red or black — and enforces a small set of
coloring rules that, _together_, bound the height at O(log n) without ever computing a height at
all. The tree ends up somewhat taller than an AVL tree in the worst case, but the average insert or
delete touches far fewer nodes to fix. That single trade is the reason C++'s `std::map`, Java's
`TreeMap`, and the Linux kernel's process scheduler all reach for a red-black tree instead of an AVL
tree, and it's the thread this whole chapter follows.

---

## The Five Red-Black Invariants

A red-black tree is a binary search tree — the ordering invariant from
[[03-binary-search-trees|Binary Search Trees]] still applies unchanged — with exactly five
additional rules layered on top. Every one of them must hold at every node, at all times, once an
insert or delete's fix-up work is complete:

1. **Every node is colored either red or black.** This is the one bit of extra state a red-black
   tree carries per node, beyond the usual key/value/left/right/parent fields.
2. **The root is always black.** If an insert or a fix-up step ever colors the root red, it gets
   recolored black immediately afterward — this rule is always trivially restorable, so it never
   drives any of the interesting fix-up logic below.
3. **Every leaf is black.** "Leaf" here means the conventional **NIL sentinel** — a black, valueless
   placeholder node standing in for every null child pointer, not the bottom-most key-bearing node.
   Using a real sentinel object (rather than treating `None`/`null` as an implicit black leaf) is
   what makes invariant 5 well-defined and the fix-up code's boundary conditions uniform instead of
   special-cased.
4. **A red node never has a red child.** Equivalently: no two reds appear consecutively on any
   root-to-leaf path. This is the invariant that gives the structure its name and its central fix-up
   trigger — a newly inserted red node whose parent is also red is a **red-red violation**, and
   resolving it is the entire content of insert-fixup, covered below.
5. **Every path from a given node to any of its descendant NIL leaves contains the same number of
   black nodes.** This count — not including the starting node itself — is that node's
   **black-height**. Black-height is defined per-node (the root's black-height is the black-height
   of the whole tree), and invariant 5 says it must be _path-independent_: it doesn't matter which
   of a node's descendant leaves you count down to, the number of black nodes passed through is
   identical.

None of these five rules individually bounds height. Take invariant 5 alone: a tree could satisfy
"every path has the same black-height" while being enormously tall, so long as it stacked reds
without limit between each pair of blacks — except invariant 4 forbids exactly that, capping the run
length between any two black nodes on a path at one red. That's the mechanism: invariant 4 caps how
much _red_ padding can inflate any path beyond its black-height, and invariant 5 caps how much the
_black_ skeleton can vary between paths. Combined, they produce a hard bound on the ratio between
the longest and shortest root-to-leaf path.

**The bound, made concrete.** Let `bh` be the root's black-height. Invariant 5 says _every_
root-to-leaf path contains exactly `bh` black nodes. Invariant 4 says no path can have two reds in a
row, so between consecutive black nodes there is at most one red — meaning the longest possible path
alternates black-red-black-red as much as it can, giving a length of at most `2 * bh`. The shortest
possible path is the one with no red nodes inflating it at all — pure black, length exactly `bh`.
So:

```
shortest root-to-leaf path  >=  bh
longest  root-to-leaf path  <=  2 * bh
=> longest path <= 2 * shortest path
```

The longest path is never more than twice the shortest. A tree with n internal nodes has at least
`2^bh - 1` nodes (the same counting argument as a perfect binary tree of height `bh`), so
`bh <= log2(n + 1)`, and since the longest path is at most `2 * bh`, overall height is bounded at
`O(log n)`. That's the whole proof: five simple, locally-checkable coloring rules, combined, produce
a global logarithmic height bound — without any node ever storing or comparing a height value.

---

## Why This Balance Is Looser Than AVL's

AVL's invariant is a _hard equality-adjacent_ constraint checked at every single node:
`|height(left) - height(right)| <= 1`, recomputed and reverified after every mutation. It leaves
almost no slack — a subtree that's two levels heavier on one side is an immediate violation, full
stop, regardless of where in the tree it happens.

Red-black's invariants are checked locally too (each of the five rules is a statement about a node
and its immediate neighborhood — color, children, or paths to descendant leaves), but what they
_permit_ is looser. The `longest <= 2 * shortest` bound derived above is a strictly weaker guarantee
than AVL's per-node height-difference-of-1: a red-black tree can legally contain a path like **black
→ red → black → red → black**, alternating maximally, right alongside a sibling path that's pure
black and half the length — a height differential that AVL's balance factor would never tolerate at
the node where those two subtrees join. AVL would have already forced a rotation there; red-black
just shrugs, because invariants 4 and 5 are both still satisfied.

That slack is the entire point. Fewer configurations count as "unbalanced" under red-black's rules
than under AVL's, so fewer inserts and deletes require a rotation to restore compliance at all — and
the ones that do require rotation typically need fewer of them, because a local recolor is often
sufficient on its own (more on this in the next section). The direct trade: red-black trees end up
somewhat taller in the worst case (bounded by `2 * log2(n+1)` rather than AVL's tighter
`~1.44 * log2(n+1)`), in exchange for doing measurably less structural work — fewer rotations — per
write. Both are still O(log n); the difference is in the constant factor on writes, not the
asymptotic class on either operation.

---

## Insert: Recoloring and Rotation

### Why the new node is always red

A freshly inserted node is colored **red**, never black. The reasoning is forced by invariant 5: if
a new node were inserted black, it would add one to the black-height of every path running through
it — but every _other_ path in the tree keeps its old black-height, instantly breaking invariant 5's
path-independence everywhere the new node isn't. Coloring it red sidesteps that entirely, because
red nodes don't count toward black-height at all. The cost of that choice is that invariant 5 is
preserved for free, but invariant 4 might now be broken — if the new red node's parent is also red,
that's a **red-red violation**, and it's the only problem insert-fixup ever has to solve.

If the parent is black, nothing else is required — the tree is already valid, and insert is done in
O(log n) with zero rotations. The interesting path is the parent-is-red case.

### The uncle test

When node `z`'s parent `p` is red, look at `z`'s **uncle** — `p`'s sibling, i.e., the other child of
`z`'s grandparent `g`. (`g` must exist and must be black: `p` is red, and invariant 4 forbids a red
node's parent from also being red, so `g` was black before this insert.) The uncle's color
determines which of two very differently-shaped fixes applies:

- **Uncle is red.** Recolor: flip `p` and the uncle both to black, flip `g` to red, then treat `g`
  as the new `z` and repeat the check one level up. This is a pure recolor — no rotation — and it's
  cheap, but it doesn't necessarily terminate locally: pushing the red up to `g` may create a fresh
  red-red violation between `g` and _its_ parent, so the loop can walk all the way to the root.
  Worst case this is O(log n) recolors and no rotations at all — the case where red-black's "just
  recolor and move up" option undercuts AVL's rotation-every-time approach most clearly.
- **Uncle is black (or a NIL sentinel, which invariant 3 colors black).** A recolor alone can't fix
  this — pushing red upward would just relocate the violation rather than resolve it, since there's
  no red uncle to absorb the shift. This is where rotation enters, and the shape of the fix mirrors
  AVL's LL/RR/LR/RL split from the previous chapter exactly: if `z`, `p`, and `g` form a straight
  **line** (`z` is a left child of `p` and `p` is a left child of `g`, or the mirrored all-right
  case), a single rotation at `g` plus a recolor of `p` and `g` fixes it. If they form a **zig-zag**
  (`z` is a right child of a left-child `p`, or the mirrored case), a first rotation at `p`
  straightens the zig-zag into a line, and then the line case's rotation-plus-recolor finishes it —
  the same "straighten, then resolve" two-step AVL uses for its LR/RL cases. Either way, once the
  local rotation and recolor are done, the fix-up **terminates immediately** — no violation is
  pushed further up the tree, unlike the red-uncle case above.

### Working implementation

The following is a real, runnable red-black insert with fixup, using an explicit black NIL sentinel
(invariant 3, made literal) so every leaf reference is a real node rather than a `None`
special-cased throughout the fixup logic. It codes the red-uncle recolor case in full, and codes one
concrete line-shape rotation case (left-left) in full; the mirrored right-right case and the two
zig-zag cases follow the identical pattern with left/right swapped, which is why production
implementations (including this one, in the interest of matching the depth an interview needs rather
than a textbook's full six-way case dump) typically factor the line case into one rotate-and-recolor
helper called with the appropriate direction, rather than writing out all four shapes longhand.

```python
RED, BLACK = "RED", "BLACK"


class RBNode:
    def __init__(self, key, color=RED, left=None, right=None, parent=None):
        self.key = key
        self.color = color
        self.left = left
        self.right = right
        self.parent = parent


class RedBlackTree:
    def __init__(self):
        # One shared sentinel stands in for every NIL leaf (invariant 3: leaves are black).
        # Sharing it avoids allocating a fresh black node per null child pointer.
        self.NIL = RBNode(key=None, color=BLACK)
        self.root = self.NIL

    # ---- standard BST rotations, red-black bookkeeping added ----

    def _left_rotate(self, x):
        y = x.right
        x.right = y.left
        if y.left is not self.NIL:
            y.left.parent = x
        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x is x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y

    def _right_rotate(self, x):
        y = x.left
        x.left = y.right
        if y.right is not self.NIL:
            y.right.parent = x
        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x is x.parent.right:
            x.parent.right = y
        else:
            x.parent.left = y
        y.right = x
        x.parent = y

    # ---- insert: plain BST insert, new node red, then fixup ----

    def insert(self, key):
        new_node = RBNode(key, color=RED, left=self.NIL, right=self.NIL)

        parent = None
        current = self.root
        while current is not self.NIL:
            parent = current
            current = current.left if key < current.key else current.right

        new_node.parent = parent
        if parent is None:
            self.root = new_node                 # tree was empty
        elif key < parent.key:
            parent.left = new_node
        else:
            parent.right = new_node

        self._insert_fixup(new_node)

    def _insert_fixup(self, z):
        # Loop invariant on entry: z is red, and the only possible violation
        # is invariant 4 (z's parent may also be red).
        while z.parent is not None and z.parent.color == RED:
            grandparent = z.parent.parent   # exists: red parent can't be root (invariant 2)
            if z.parent is grandparent.left:
                uncle = grandparent.right
                if uncle.color == RED:
                    # --- Case A: red uncle -> recolor and push the check upward ---
                    z.parent.color = BLACK
                    uncle.color = BLACK
                    grandparent.color = RED
                    z = grandparent                      # continue the loop from here
                else:
                    # --- Case B: black uncle -> rotation required ---
                    if z is z.parent.right:
                        # zig-zag (left-right): straighten into a line first
                        z = z.parent
                        self._left_rotate(z)
                    # straight line (left-left): rotate at grandparent, recolor, done
                    z.parent.color = BLACK
                    grandparent.color = RED
                    self._right_rotate(grandparent)
                    # invariant 4 restored locally; loop condition now false, fixup ends
            else:
                # mirror image: grandparent.right is the parent's side
                uncle = grandparent.left
                if uncle.color == RED:
                    z.parent.color = BLACK
                    uncle.color = BLACK
                    grandparent.color = RED
                    z = grandparent
                else:
                    if z is z.parent.left:
                        z = z.parent
                        self._right_rotate(z)
                    z.parent.color = BLACK
                    grandparent.color = RED
                    self._left_rotate(grandparent)

        self.root.color = BLACK   # invariant 2, restorable unconditionally
```

Walk the case-A branch once to see why it can propagate: recoloring `parent` and `uncle` to black
and `grandparent` to red preserves every path's black-height through that subtree (one black node
swapped for another, net black count on every path unchanged), so invariant 5 never breaks — but
`grandparent` is now red, and _its_ parent might be red too, which is exactly the same violation
shape one level up. That's why `z = grandparent` and the `while` loops rather than returning — the
fix genuinely may need to walk to the root. Case B never loops: the rotation plus recolor restores
both invariants 4 and 5 at the local subtree without changing its black-height as seen from above
(the subtree still presents the same black-height to its parent), so nothing above it needs
revisiting.

---

## Complexity

Search, insert, and delete are all **O(log n) worst case** — the same asymptotic guarantee AVL trees
provide, following directly from the height bound derived above (`height <= 2 * log2(n + 1)`).
Insert does at most O(log n) recolors (the case-A loop, bounded by tree height) followed by **at
most one rotation event** (a single rotation for the line case, or two rotations for the zig-zag
case) that terminates the fixup — a small, bounded constant, not a value that grows with tree
height. Delete-fixup is more involved than insert-fixup (more cases turn on a sibling's children's
colors, not just the sibling's own color) but is bounded the same way: O(log n) recolors, at most
three rotations.

The practical difference from AVL shows up in the constant factor, not the exponent. AVL's
rebalancing after an insert can require a rotation at multiple ancestors on the path back to the
root whenever the balance factor tips at each of them; red-black's case-A recoloring loop is cheap
pointer-free color flips that often resolve without ever calling a rotation function, and even when
rotation is needed, it's capped at the small constant above rather than potentially cascading.
Fewer, cheaper structural changes per write, for a worst-case height that's a constant factor taller
— the trade the two opening sections set up is exactly what falls out of the fixup code.

---

## AVL vs. Red-Black vs. Skip List: The Real-World Choice

All three structures — [[04-avl-trees|AVL Trees]], red-black trees, and [[04-skip-lists|Skip Lists]]
— solve the same underlying problem: keep ordered data searchable in O(log n)-ish time as it's
mutated. They resolve the balance/cost trade differently enough that picking between them is a real,
answerable engineering decision rather than a coin flip:

|                             | AVL                                                  | Red-Black                                                               | Skip List                                                               |
| --------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Balance invariant           | Height-difference <= 1 at every node                 | 5 coloring rules, `longest <= 2 * shortest`                             | None enforced — probabilistic (coin-flip levels)                        |
| Height bound                | `~1.44 * log2(n+1)` — tighter                        | `2 * log2(n+1)` — looser                                                | O(log n) **expected**, O(n) worst case                                  |
| Search speed                | Marginally faster (shorter paths)                    | Marginally slower (taller paths)                                        | O(log n) expected, no hard floor                                        |
| Rotations per insert/delete | More — can cascade toward the root                   | Fewer — recolor loop often needed alone, rotation capped at O(1) events | None — splice pointers instead                                          |
| Worst-case guarantee        | Yes, hard                                            | Yes, hard                                                               | No — only in expectation                                                |
| Implementation risk         | Moderate — 4 rotation cases                          | Moderate — recolor plus rotation cases                                  | Lower — no case analysis on tree shape                                  |
| Concurrency                 | Hard — rebalancing can touch nodes far from the edit | Hard, same reason                                                       | Easier — per-node pointer splicing lends itself to fine-grained locking |

**AVL wins when reads dominate and writes are rare** — a stricter balance keeps paths closer to the
true `log2(n)` minimum, and the rotation cost of an occasional insert is a reasonable price for
faster lookups on every read afterward. **Red-black wins when writes are frequent** — the marginally
taller tree costs a little on every lookup, but every insert and delete does less rebalancing work
on average, which is why it's the default ordered-map choice across the industry: **C++'s `std::map`
and `std::set`**, and **Java's `TreeMap` and `TreeSet`**, are both red-black trees under the hood,
and the **Linux kernel's Completely Fair Scheduler (CFS)** uses a red-black tree keyed by each
task's virtual runtime specifically because tasks are inserted and removed from the runqueue
constantly — a write-heavy workload where red-black's cheaper rebalancing matters far more than
AVL's marginally shorter paths would.

**Skip lists close the loop this chapter and [[04-skip-lists|Skip Lists]] (Part 03, Chapter 4) have
been building toward.** Both AVL and red-black are _deterministic_ balancing schemes — a rotation is
a piece of code that runs, unconditionally, whenever an invariant check says it must. A skip list
throws the deterministic invariant out entirely and replaces it with a coin flip: no rotation logic
to get wrong, no case analysis on tree shape, at the cost of trading a worst-case guarantee for an
expected one. For a workload where an occasional unlucky O(n) operation is tolerable and
implementation simplicity matters more than a hard bound — Redis's sorted-set (`ZSET`) being the
concrete production example — a skip list is a legitimate, simpler alternative to reaching for
either tree in this chapter or the last one. Where a hard worst-case bound is non-negotiable, the
choice comes back to this chapter's trade: AVL's tighter balance against red-black's cheaper
rebalancing.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
