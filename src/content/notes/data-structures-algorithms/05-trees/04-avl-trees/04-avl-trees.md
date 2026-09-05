---
title: "4 — AVL Trees"
description: "Height-balanced BST with rotation-based rebalancing that guarantees O(log n) operations."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-32"
relations:
  - slug: data-structures-algorithms/05-trees/03-binary-search-trees/03-binary-search-trees
    kind: related
---

# 4 — AVL Trees

The previous chapter ended on a specific, uncomfortable fact: a plain BST's O(log n) claim is
conditional. Insert `1, 2, 3, 4, 5` in that order and the "tree" is a right-leaning chain — every
node has exactly one child, search is a linear scan wearing a tree's clothing, and the O(log n) you
were promised quietly becomes O(n). Nothing in the BST ordering invariant prevents this; the
invariant only constrains _where_ a value goes relative to its ancestors, never how tall the
resulting shape is allowed to get. AVL trees are the fix: a second invariant, layered on top of the
BST invariant, that makes the degenerate shape structurally impossible. Named for Adelson-Velsky and
Landis, who published it in 1962 as the first self-balancing BST, AVL is less "a new data structure"
and more "a BST that never lets itself get away with a bad shape."

---

## The Height-Balance Invariant

Define `height(node)` as the number of edges on the longest path from `node` down to a leaf
(`height(None) = -1` by convention, so a single-leaf node has height 0). The **balance factor** of a
node is:

```
balance_factor(node) = height(node.left) - height(node.right)
```

The AVL invariant: **every node's balance factor must be in `{-1, 0, 1}`.** Not "roughly balanced,"
not "balanced on average" — every single node, all the time, after every insert and every delete. A
balance factor of `+2` or `-2` anywhere in the tree is a violation that must be repaired before the
operation that caused it is considered complete.

This is a strictly local, per-node constraint, but it has a global consequence: it bounds the height
of the _whole_ tree to O(log n) regardless of insertion order. The proof sketch is worth
internalizing because it's the whole payoff of the chapter — it's the thing that makes the
degenerate case from Chapter 3 unreachable:

Let `N(h)` be the minimum number of nodes an AVL tree of height `h` can have. To keep height `h`
with the smallest possible node count, one subtree should be as sparse as legally possible — height
`h-1` — and the other pushed to the balance-factor limit, height `h-2` (a balance factor of exactly
1, the loosest the invariant allows). That gives the recurrence:

```
N(h) = 1 + N(h-1) + N(h-2)
```

That's the Fibonacci recurrence, shifted by a constant. Its solution grows as `N(h) ≈ φ^h` for the
golden ratio `φ ≈ 1.618`, which inverts to `h ≈ log_φ(n) ≈ 1.44 · log₂(n)`. So even in the _worst
legally-permitted_ case — the sparsest AVL tree that can still exist at a given height — height only
grows as `O(log n)`. Compare that to a plain BST, where the worst case is a straight chain and
height grows as `O(n)`. The balance-factor rule isn't a heuristic that usually keeps the tree short;
it's a hard mathematical ceiling, about 44% taller than a perfectly complete binary tree in the
worst case, and never worse than that no matter what order the keys arrive in.

The engineering question is: how do you _keep_ that invariant true across inserts and deletes, when
inserting a single node can change the height of an entire subtree underneath an ancestor three
levels up? The answer is rotations — targeted, O(1) pointer surgery that restores a violated balance
factor without disturbing the BST ordering invariant underneath it.

---

## The Four Rotation Cases

A rotation happens at the **first node walking up from the inserted node** whose balance factor has
gone out of `{-1, 0, 1}` — call it `z`. Once you've found `z`, which of the four cases applies
depends on two things: which child of `z` is taller (`y`, the "heavy" side), and which child of `y`
is taller (`x`, the side the extra height actually came from). The name of the case is just that
path spelled out: `z`'s heavy side, then `y`'s heavy side.

### Left-Left (LL) — single right rotation

The extra height came in on the _left child of the left child_ — a straight line leaning left. `z`'s
left subtree is too tall because _its_ left subtree grew.

```
        z                              y
       / \                            / \
      y   T4      right-rotate(z)   x     z
     / \           ------------->   / \   / \
    x   T3                        T1 T2 T3 T4
   / \
  T1 T2
```

Why a single right rotation fixes it: `y` was already the correctly-balanced root of everything
under `z`'s left side — it just happened to be one level too deep to be `z`'s child anymore.
Rotating `z` down and to the right promotes `y` to take `z`'s old position, `z` becomes `y`'s right
child, and `y`'s former right subtree (`T3`) — which is still between `x`'s keys and `z`'s key in
sort order — slots in as `z`'s new left child. The BST ordering invariant is preserved because
nothing crosses `y`'s or `z`'s key boundary; only the height distribution changes.

```python
def rotate_right(z):
    y = z.left
    t3 = y.right
    y.right = z
    z.left = t3
    update_height(z)   # z's height must be recomputed first — it's now the lower node
    update_height(y)
    return y            # y is the new subtree root
```

### Right-Right (RR) — single left rotation

The mirror image: the extra height came in on the _right child of the right child_, a straight line
leaning right. `z`'s right subtree is too tall because _its_ right subtree grew.

```
    z                                  y
   / \                                / \
  T1   y        left-rotate(z)       z     x
      / \       ------------->      / \   / \
    T2   x                        T1 T2 T3 T4
        / \
      T3  T4
```

Same reasoning, mirrored: `y` is promoted to the root position, `z` drops to become `y`'s left
child, and `y`'s old left subtree (`T2`) moves under `z` as its new right child — it still sits
between `z`'s key and `y`'s key.

```python
def rotate_left(z):
    y = z.right
    t2 = y.left
    y.left = z
    z.right = t2
    update_height(z)
    update_height(y)
    return y
```

### Left-Right (LR) — rotate left on the child, then right on z

The extra height came in on the _right child of the left child_ — a "kink," not a straight line.
`z`'s left subtree is too tall because its **right** subtree grew. A single right rotation on `z`
does _not_ fix this: it would just move the kink from `z` to `y`, still leaving an unbalanced node.
The straight-line rotations above only work on straight lines; a kink has to be straightened into a
line first.

```
      z                      z                           x
     / \                    / \                         / \
    y   T4   left(y)       x   T4    right(z)          y     z
   / \      -------->     / \        -------->        / \   / \
  T1  x                  y  T3                       T1 T2 T3 T4
     / \                / \
    T2 T3              T1 T2
```

The fix is a **double rotation**: first `rotate_left(y)` on `z`'s left child, which turns the kink
into a straight LL line (now `x` is `z`'s left child, and `x`'s _left_ subtree is the tall one) —
then `rotate_right(z)` resolves that line exactly as in the LL case above. `x` — which was the
deepest node on the inserted path — ends up promoted all the way to the subtree root.

```python
def rotate_left_right(z):
    z.left = rotate_left(z.left)
    return rotate_right(z)
```

### Right-Left (RL) — rotate right on the child, then left on z

The mirror of LR: the extra height came in on the _left child of the right child_, a kink leaning
the other way. `z`'s right subtree is too tall because its **left** subtree grew.

```
    z                         z                              x
   / \                       / \                             / \
  T1   y      right(y)      T1   x       left(z)            z     y
      / \    -------->          / \      -------->         / \   / \
     x  T4                    T2   y                     T1 T2 T3 T4
    / \                            / \
   T2 T3                         T3 T4
```

First `rotate_right(y)` on `z`'s right child straightens the kink into an RR line, then
`rotate_left(z)` resolves it.

```python
def rotate_right_left(z):
    z.right = rotate_right(z.right)
    return rotate_left(z)
```

A memory aid that survives interview pressure: **the case name tells you the path from `z` to the
newly-inserted node.** Two letters, two hops. Matching letters (LL, RR) mean a straight line — one
rotation, at `z`, in the opposite direction of the letters. Different letters (LR, RL) mean a kink —
two rotations, first at the child (in the direction of the _first_ letter) to straighten it, then at
`z` (in the direction of the _second_ letter, mirrored) to resolve it.

---

## Full Implementation: Self-Balancing Insert

Every rotation above needs two supporting pieces: a node that tracks its own height (recomputing it
is O(1) if children's heights are already known), and a way to read a possibly-`None` node's height
without a null check at every call site.

```python
class AVLNode:
    def __init__(self, key, value=None):
        self.key = key
        self.value = value
        self.left = None
        self.right = None
        self.height = 0          # height of a fresh leaf


def height(node):
    return node.height if node is not None else -1


def balance_factor(node):
    return height(node.left) - height(node.right) if node is not None else 0


def update_height(node):
    node.height = 1 + max(height(node.left), height(node.right))
```

The rotations from the previous section (`rotate_left`, `rotate_right`, `rotate_left_right`,
`rotate_right_left`) plug in unchanged. Insert is a normal recursive BST insert — walk down
comparing keys, same as Chapter 3 — with one addition: **on the way back up the recursion, after the
recursive call returns, update this node's height and check whether its balance factor has gone out
of range.**

```python
def insert(node, key, value=None):
    # 1. Normal BST descent: find where `key` belongs and recurse into it.
    if node is None:
        return AVLNode(key, value)
    if key < node.key:
        node.left = insert(node.left, key, value)
    elif key > node.key:
        node.right = insert(node.right, key, value)
    else:
        node.value = value        # key already present: update in place, no structural change
        return node

    # 2. Unwind: every ancestor on the path back to the root re-derives its
    #    own height and balance factor from its (possibly just-rotated) children.
    update_height(node)
    bf = balance_factor(node)

    # 3. Left-heavy violation (bf == 2): which of z's children caused it?
    if bf > 1:
        if balance_factor(node.left) < 0:      # kink: left child is right-heavy
            node.left = rotate_left(node.left)  # straighten to LL first
        return rotate_right(node)                # then resolve the LL line

    # 4. Right-heavy violation (bf == -2): mirror of the above.
    if bf < -1:
        if balance_factor(node.right) > 0:      # kink: right child is left-heavy
            node.right = rotate_right(node.right)
        return rotate_left(node)

    # 5. Still balanced — nothing to do, return node as-is.
    return node
```

Two things are worth naming explicitly, because they're both instances of a shape this book keeps
coming back to.

**"Do work on the way back up" is the same recursive shape as the recursive linked-list reversal in
Part 03.** There, `reverse_recursive` walked all the way to the last node before doing any pointer
surgery, then relinked `head.next.next = head` as each stack frame unwound. Here, `insert` walks all
the way to the insertion point before doing any structural surgery, then checks and repairs the
balance factor as each stack frame unwinds. In both cases the _descent_ is inert — it just finds the
place — and all the actual work happens on the way back, one frame at a time, with each frame only
able to see and fix the node it's currently standing on. That's also why the rotation check has to
happen at _every_ ancestor, not just the parent of the inserted node: a single insertion can only
change the height of nodes on its root-to-leaf path, but it can violate the balance factor at any
one of them, and the first violation found walking up is the only one that can exist at that moment
— fixing it restores the subtree's height to what it was before the insert, so no ancestor further
up can have been thrown off by the same insertion once that repair lands.

**This is also postorder-shaped**, in the sense Chapter 2 of this Part introduces for tree
traversal: postorder visits both children before it does anything with the current node, because the
work at a node depends on results already computed at its children. AVL insert's unwind phase has
exactly that dependency — a node's height and balance factor can't be computed until both children's
heights are already correct — which is why the height/balance-factor check has to live _after_ the
recursive calls, not before them.

**Delete follows the identical unwind pattern** — recurse down to find and remove the node (with the
usual BST delete cases: leaf, one child, two children via inorder successor), then on the way back
up recompute heights and rotate at any ancestor whose balance factor breaks. The one wrinkle: a
single deletion can require a rotation at _every_ ancestor up to the root, not just the first one
found — removing a node can shrink a subtree's height, which can under-balance the next ancestor up
even after the first rotation already fixed the one below it. So unlike insert, delete's unwind loop
cannot stop at the first repaired node; it has to keep checking every ancestor all the way to the
root. This is why AVL delete costs up to O(log n) rotations in the worst case, against insert's at
most O(1) — a single insertion can only ever require one rotation (either a single or a double), a
fact worth memorizing for its own sake since it comes up directly in interview follow-ups on AVL
cost analysis.

---

## Complexity: O(log n) Worst Case, Guaranteed

| Operation | Plain BST (Ch. 3)     | AVL Tree                               |
| --------- | --------------------- | -------------------------------------- |
| Search    | O(h), worst case O(n) | O(log n), **always**                   |
| Insert    | O(h), worst case O(n) | O(log n), **always**                   |
| Delete    | O(h), worst case O(n) | O(log n), **always**                   |
| Space     | O(n)                  | O(n), plus one int per node for height |

The word doing all the work in that table is "always." A plain BST's O(log n) is a claim about the
_average_ case over random insertion orders — it degrades to O(n) the moment the input arrives
sorted, reverse-sorted, or in any other adversarial order, because nothing in the BST invariant
constrains shape. An AVL tree's O(log n) is a claim about the _worst_ case, full stop, because the
height bound derived above (`h ≈ 1.44 · log₂ n`) holds for every possible sequence of inserts and
deletes, not just typical ones. Feed an AVL tree the exact sorted sequence that turns a plain BST
into a linked list, and the AVL tree responds with a sequence of rotations that keeps its height
logarithmic the entire time — that's the direct, mechanical answer to the degenerate case Chapter 3
raised.

This matters anywhere a caller needs a _guarantee_, not just a favorable average: a real-time system
that can't tolerate an occasional O(n) tail latency spike, or an interview answer where "average
case O(log n)" invites the immediate follow-up "what about the worst case?" With an AVL tree, there
is no separate worst-case answer to give — it's the same bound.

---

## The Cost of the Guarantee

That guarantee isn't free, and naming the trade explicitly matters as much as the guarantee itself:

- **Extra bookkeeping.** Every node carries a `height` field, updated on every insert and delete.
  It's O(1) to maintain per node, but it's memory and write traffic a plain BST node doesn't pay.
- **Rebalancing work on every mutating operation.** Insert costs at most one rotation (single or
  double) beyond the ordinary O(log n) descent. Delete costs up to O(log n) rotations — one at every
  ancestor on the path back to the root, in the worst case. Rotations are O(1) each, so this doesn't
  change the asymptotic bound, but it's real constant-factor work a plain BST insert/delete never
  does at all.
- **More rigid balancing than the alternative.** The next chapter covers Red-Black trees, which
  relax the balance requirement — they guarantee the tree is never more than roughly _twice_ as tall
  as the shortest possible, rather than AVL's tighter ~1.44x bound. That looser invariant is cheaper
  to restore (fewer rotations per insert/delete, amortized O(1) recolors instead of guaranteed
  rotations) at the cost of slightly taller trees and slightly slower lookups.

The practical consequence, stated briefly here because the full comparison belongs at the end of the
next chapter: AVL trees are the right choice when reads dominate writes and lookup latency is what
gets measured — a database index serving far more queries than mutations is the canonical example,
since the tighter height bound pays for itself on every read and the more expensive rebalancing is
paid rarely, once per write.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
