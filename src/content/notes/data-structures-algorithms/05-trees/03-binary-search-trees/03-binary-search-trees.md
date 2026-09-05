---
title: "3 — Binary Search Trees"
description: "The BST ordering invariant and its duplicates-go-right convention, why search/insert/delete are O(h) rather than unconditionally O(log n), why inorder traversal always yields sorted order, the three delete cases including the inorder-successor splice, why sorted-input insertion degenerates a BST into a linked list, and the range-bound fix for the classic buggy Validate BST check."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-31"
relations:
  - slug: data-structures-algorithms/05-trees/02-binary-trees/02-binary-trees
    kind: related
---

# 3 — Binary Search Trees

[[02-binary-trees|The previous chapter]] gave you four ways to walk a binary tree — preorder,
inorder, postorder, level-order — and none of them cared what values lived where. A binary tree is
just nodes and pointers; the traversals work identically whether the values are sorted, random, or
all the same. A binary search tree adds exactly one rule about _where values are allowed to go_, and
that single rule is enough to turn "container with pointers" into a structure that searches,
inserts, and deletes in a walk down instead of a scan across — and makes one of last chapter's four
traversals start producing sorted output for free. Everything in this chapter is a consequence of
that one rule, including the failure mode that motivates the next two chapters.

---

## The BST Invariant

**The invariant:** for every node in the tree, every value in that node's left subtree is strictly
less than the node's value, and every value in that node's right subtree is strictly greater.

Two words in that sentence matter more than they look. First, **every node** — not just the root,
not just direct parent-child pairs, but every single node treated as if it were the root of its own
BST. Second, **subtree**, not "child": the constraint applies to _everything_ underneath, no matter
how many levels down.

**Duplicates.** Strict "less than everywhere / greater than everywhere" has no room for equal
values, so a convention is required the moment duplicates are possible. This book routes them right:
if a value being inserted already exists somewhere in the tree, treat it as "greater than or equal
to" at every comparison, which sends it into the right subtree. Restated precisely so the code below
has no ambiguity to fall back on:

- Left subtree: every value strictly **less than** the node's value.
- Right subtree: every value **greater than or equal to** the node's value.

Any consistent convention works — some implementations reject duplicates outright, some route them
left instead — but _pick one and encode it in every operation_. A search, insert, and delete that
each guess differently about where a duplicate lives is how a "valid" BST silently stops being
searchable.

### Why "every node," not just the root's children

Here is a tree that looks fine if you only check direct parent-child pairs:

```
        10
       /  \
      5    15
       \
        20
```

Check root-to-child: is `5 < 10`? Yes. Is `15 > 10`? Yes. Check the next pair down: is `20 > 5`? Yes
— 20 is the right child of 5, and 20 is indeed greater than 5. Every _local_, one-hop comparison
passes. And yet this is not a valid BST: node 20 sits in the **left subtree of the root**, where the
invariant demands every value be strictly less than 10. It is 20. The violation is real, and no
comparison that only looks at immediate neighbors will ever see it, because the node that 20
violates against — 10 — is two hops away, not one.

This is the single most common BST bug: implementing the invariant as "check my two children," when
the invariant actually means "check every ancestor's bound, at every depth." Hold onto this exact
tree — the worked example at the end of this chapter builds the fix for it directly.

---

## Search and Insert

Both operations are the same walk: compare the target against the current node, and let that single
comparison decide which subtree could possibly contain what you're looking for — there's no reason
to ever look at the other one, the invariant already ruled it out.

```python
class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right
```

**Search** — no backtracking is ever needed, so an iterative walk is enough:

```python
def search(root, target):
    node = root
    while node is not None:
        if target == node.value:
            return node
        elif target < node.value:
            node = node.left
        else:
            node = node.right
    return None
```

**Insert** — the same walk, except running out of tree (hitting `None`) is where the new node
belongs, not a failure:

```python
def insert(node, value):
    if node is None:
        return Node(value)
    if value < node.value:
        node.left = insert(node.left, value)
    else:                        # value >= node.value: duplicates go right, by this book's convention
        node.right = insert(node.right, value)
    return node
```

```python
root = None
for value in [5, 3, 8, 1, 4, 7, 9]:
    root = insert(root, value)
```

That produces:

```
        5
       / \
      3   8
     / \ / \
    1  4 7  9
```

Each `insert` call returns the (possibly unchanged) subtree root, which is what lets the parent's
`node.left = insert(...)` / `node.right = insert(...)` line rewire itself correctly whether it just
created a new node or is simply re-attaching an existing one — the same "return the new root, let
the caller relink" pattern the delete section below leans on heavily.

**Complexity: O(h), not O(log n).** Both operations touch exactly one node per level and stop at
depth `h` at the deepest — so the honest bound is O(h), where `h` is the height of _this particular
tree_. The O(log n) figure everyone quotes for BSTs is shorthand for "h happens to be ~log2(n)" —
true only when the tree is reasonably balanced. Nothing in `search` or `insert` above makes that
true. They walk whatever shape the tree already has; neither one rebalances anything. Whether `h`
ends up close to log2(n) or close to n is decided entirely by _insertion order_, which is exactly
the subject of this chapter's next-to-last section.

---

## Inorder Traversal Gives Sorted Order

Last chapter defined inorder as "left subtree, node, right subtree" for an arbitrary binary tree,
with no claim about what order the values come out in — on a generic binary tree, there isn't one.
On a BST, there is, and it falls straight out of the invariant.

Take the tree built above:

```python
def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.value)
    inorder(node.right, out)

result = []
inorder(root, result)
# result == [1, 3, 4, 5, 7, 8, 9]
```

Sorted, ascending, every time — not a property of this particular tree, a property of _any_ BST.

**Why.** "Left, node, right" means: fully exhaust the left subtree before touching the node, then
visit the node, then fully exhaust the right subtree. The BST invariant guarantees, at that same
node, that every value in the left subtree is less than the node's value and every value in the
right subtree is greater-or-equal. So the traversal visits "everything less than this node" (in some
order, recursively), then "this node," then "everything greater-or-equal than this node" (in some
order, recursively) — and it does that at _every_ node, because every subtree is itself a valid BST
with the same guarantee holding recursively all the way down. Walk the example: at node 3, inorder
visits its left subtree (just `1`), then `3` itself, then its right subtree (just `4`) —
`[1, 3, 4]`, already sorted for that subtree alone. One level up, node 5 does the same thing with
"everything from node 3's subtree" on the left and "everything from node 8's subtree" on the right:
`[1, 3, 4]` + `[5]` + `[7, 8, 9]` = `[1, 3, 4, 5, 7, 8, 9]`. The recursion doesn't need to know it's
producing sorted output — the invariant makes it structurally impossible to produce anything else.

This is the payoff promised at the end of the traversal chapter: inorder traversal is how you get a
sorted list out of a BST in O(n) time, no separate sort step required, because the sort is already
encoded in where the invariant put every value.

---

## Delete: The Three Cases

Search and insert only ever add a leaf or walk past existing nodes — they never have to remove a
node from the middle of the structure without breaking the invariant for whatever's left. Delete is
the operation that actually has to reason about structure, and it splits cleanly into three cases
based on how many children the node being deleted has.

```python
def delete(node, value):
    if node is None:
        return None                          # value not found — nothing to delete
    if value < node.value:
        node.left = delete(node.left, value)
    elif value > node.value:
        node.right = delete(node.right, value)
    else:
        # this is the node to delete
        if node.left is None and node.right is None:
            return None                       # Case 1: leaf — just remove it
        if node.left is None:
            return node.right                 # Case 2: only a right child — splice it up
        if node.right is None:
            return node.left                  # Case 2: only a left child — splice it up
        # Case 3: two children — steal the inorder successor's value, then delete the successor
        successor = node.right
        while successor.left is not None:
            successor = successor.left        # leftmost node in the right subtree = smallest value > node.value
        node.value = successor.value          # overwrite this node's value with the successor's
        node.right = delete(node.right, successor.value)   # remove the successor from where it actually lived
    return node
```

**Case 1 — leaf.** No children means nothing downstream depends on this node; the parent's
`node.left = delete(...)` / `node.right = delete(...)` line simply receives `None` and the node is
gone. Nothing else in the tree needs to change.

**Case 2 — one child.** The deleted node is a single link in a chain; splice it out by handing the
parent a direct reference to the one child that remains. Whichever side has content — `node.left` or
`node.right` — becomes what the parent points to instead. The invariant is preserved automatically:
whatever the single child's subtree contained already satisfied the deleted node's ordering
constraints (it was on the correct side already), so promoting it one level up changes nothing about
where those values sit relative to the rest of the tree.

**Case 3 — two children.** This is the case that actually requires a decision, because you can't
just splice — there are two subtrees to reconcile, not one. The fix: you don't need to physically
remove _this_ node at all. You need a _replacement value_ that can sit here and keep the invariant
true — something strictly greater than everything in the left subtree, and less-than-or-equal to
everything remaining in the right subtree. The **inorder successor** — the smallest value in the
right subtree, found by walking `.left` until it runs out — is exactly that value: it's the very
next value in sorted order after the one being deleted (recall the previous section: inorder gives
sorted order, and the successor is what inorder would visit right after this node). Copy that value
up into the node being deleted, then go delete the successor from its _original_ location instead.

The reason this doesn't recurse into an infinite regress of two-children cases: the successor, by
construction, has **no left child** — if it did, that left child would be smaller, and the walk
`while successor.left is not None` would have kept going. So deleting the successor always lands in
Case 1 or Case 2, never back in Case 3. Three cases, and the hardest one guarantees it bottoms out
in one of the easy two.

_(A symmetric alternative — the inorder **predecessor**, the largest value in the left subtree —
works exactly as well. Pick one convention and use it consistently; mixing them per-call doesn't
break correctness but makes the resulting tree shape unpredictable across a run of deletes.)_

**Complexity.** Every branch is a walk down from the root: O(h) to find the node in the first place,
plus — only in Case 3 — another O(h) walk down the right subtree to find the successor, plus one
more O(h) recursive delete to remove it. Three O(h) walks chained together is still O(h) overall,
not O(h²) or O(3h) as a different order class — a constant number of height-bounded passes stays
height-bounded. Same caveat as search and insert: O(h) is not O(log n) unless the tree happens to be
balanced, and the recursive form above also costs O(h) stack frames (see [[03-recursion]] in Part 01
on what an unbounded call depth costs when there's no tail-call collapsing) — which is precisely the
concern the next section makes concrete.

---

## The Degenerate Case: Why Height Isn't Guaranteed

Nothing about `insert` above inspects the tree's shape or tries to keep it short. It just walks down
and attaches. That's fine when the values arrive in a random-enough order — but insertion order is
an input, not a guarantee, and one very ordinary input breaks it completely: **already-sorted
data.**

Insert `1` through `7` in order:

```python
root = None
for value in range(1, 8):      # 1, 2, 3, 4, 5, 6, 7 — already sorted
    root = insert(root, value)
```

Every new value is greater than everything already in the tree, so `insert` sends it right, every
single time, with nothing ever going left:

```
1
 \
  2
   \
    3
     \
      4
       \
        5
         \
          6
           \
            7
```

Same seven values as the earlier `[5, 3, 8, 1, 4, 7, 9]`-style tree — this one has seven values too
— but where that tree had height 2, this one has height 6. This is not a corner case or a pathology
requiring an adversary; it's what happens every time you build a BST from a pre-sorted feed, a
`log.jsonl` already in timestamp order, an already-sorted CSV import — any input where each new key
happens to be larger than all the ones before it. **The tree is still, by every definition above, a
completely valid BST.** The invariant holds at every node. And it now behaves exactly like a singly
linked list wearing a tree's data structure: search, insert, and delete are all O(n), because `h`
_is_ `n` — one node deep for every node in the tree, no shortcuts, no branching to skip past half
the remaining nodes at each step.

This is the gap the _next two chapters_ exist to close. Random insertion order gives an _expected_
height around log2(n) — that's a statement about the average case over many random orderings, not a
guarantee about any specific input, and "already sorted" is neither rare nor adversarial in
practice. **AVL trees** (next chapter) enforce a strict per-node balance factor and rotate on every
insert/delete that would violate it; **Red-Black trees** (the chapter after) enforce a looser,
color-based balance invariant that needs fewer rotations on average, which is why it's the one most
production language standard libraries actually use under the hood (C++'s `std::map`, Java's
`TreeMap`). Both exist for exactly one reason: to guarantee O(log n) height _regardless of insertion
order_, so that O(h) always means what everyone assumes it means. Everything built in this chapter —
search, insert, delete, the sorted-inorder guarantee — carries over to both of them unchanged; what
changes is that `h` stops being able to drift toward `n`.

---

## Worked Example: Validate BST

**Problem:** given the root of a binary tree, determine whether it satisfies the BST invariant.

The tempting first implementation checks each node against its immediate children — the same shape
of bug flagged in the invariant section above:

```python
def is_valid_bst_buggy(node):
    if node is None:
        return True
    if node.left is not None and node.left.value >= node.value:
        return False
    if node.right is not None and node.right.value < node.value:
        return False
    return is_valid_bst_buggy(node.left) and is_valid_bst_buggy(node.right)
```

Run it on the counterexample from the invariant section:

```
        10
       /  \
      5    15
       \
        20
```

At node 10: is `5 >= 10`? No. Is `15 < 10`? No. Both local checks pass, recurse down. At node 5:
there's no left child to check; is `20 < 5`? No — 20 is not less than 5, so this check passes too.
Recurse into 20: no children, trivially fine. **`is_valid_bst_buggy` returns `True` for a tree that
is not a valid BST**, because nothing in it ever compares 20 against 10 — the ancestor two levels up
that 20 actually violates. Checking only direct parent-child pairs can never catch a violation
against a _non-adjacent_ ancestor, and as trees get deeper, that's most of the violations that
matter.

**The fix:** carry down a valid `(low, high)` range as you recurse, and narrow it every time you
move — instead of asking "does this node satisfy its parent," ask "does this node satisfy _every_
constraint accumulated from _every_ ancestor so far." That's the literal difference between a local
check and the global one the invariant actually requires.

```python
def is_valid_bst(node, low=float("-inf"), high=float("inf")):
    if node is None:
        return True
    if not (low <= node.value < high):
        return False
    return (
        is_valid_bst(node.left, low, node.value) and
        is_valid_bst(node.right, node.value, high)
    )
```

The range is half-open, `[low, high)`, to match this book's duplicates-go-right convention exactly:
recursing left tightens the _upper_ bound to the current node's value (exclusive — strictly less,
per the invariant), and recursing right tightens the _lower_ bound to the current node's value
(inclusive — greater-or-equal, per the duplicate convention). Every node is checked against the
accumulated range from _every_ ancestor on the path down, not just its immediate parent.

Trace it on the same counterexample:

1. `is_valid_bst(10, -inf, inf)` — is `-inf <= 10 < inf`? Yes. Recurse left with the upper bound
   tightened to 10.
2. `is_valid_bst(5, -inf, 10)` — is `-inf <= 5 < 10`? Yes. Recurse right with the lower bound
   tightened to 5 (the range from the ancestor, `10`, is still carried through unchanged as the
   upper bound).
3. `is_valid_bst(20, 5, 10)` — is `5 <= 20 < 10`? **No** — 20 is not less than 10. Returns `False`,
   which propagates all the way back up.

The exact violation the buggy version missed — 20 sitting in the left subtree of 10 despite being
greater than 10 — is caught the moment the recursion carries 10's bound down into 5's right subtree,
two levels below where 10 itself lives. That's the whole fix: don't check "my children," check
"everything my ancestors constrained me to be."

**Complexity:** O(n) time — every node is visited exactly once regardless of shape. O(h) space for
the recursion stack, the same height-dependence as every other operation in this chapter — and the
same reason a pathologically skewed tree costs more than just slower comparisons; it costs deeper
recursion too.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
