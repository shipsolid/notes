---
title: "2 — Binary Trees"
description: "Binary tree node structure and traversal: preorder, inorder, and postorder — each recursive and iterative (postorder's two-stack trick for the trickiest case) — plus level-order BFS via a queue, recursive height/depth, and when each traversal order actually matters in practice."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-30"
relations:
  - slug: data-structures-algorithms/05-trees/01-tree-fundamentals/01-tree-fundamentals
    kind: related
  - slug: data-structures-algorithms/04-stack-queue-and-deque/01-stack/01-stack
    kind: related
  - slug: data-structures-algorithms/04-stack-queue-and-deque/02-queue/02-queue
    kind: related
---

# 2 — Binary Trees

[[01-tree-fundamentals|Chapter 1]] defined a tree recursively — a node holding a value plus
references to its children — and walked through four traversal orders as an idea: visit a node
before its children, between them, after them, or level by level. None of that is code yet. A
**binary tree** narrows the general definition to exactly two children, named `left` and `right`
instead of an unbounded list, and that narrowing is what turns every traversal in this chapter into
a five-line function instead of a loop over a variable-length children array. This chapter builds
those functions twice each — recursive first, because the recursive definition all but writes it for
you, then iterative, because an interviewer will eventually ask for the version that doesn't lean on
the call stack.

---

## Node Structure

A binary tree node is the general tree node from Chapter 1 with its `children` list narrowed to two
named, fixed slots:

```python
class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right
```

Three fields, always exactly three — no `children` array to loop over, no count to track. A leaf is
a node whose `left` and `right` are both `None`; asking "does this node have a left child" is just
`node.left is not None`. Every example below reuses the same small tree:

```
        1
      /   \
     2     3
    / \
   4   5
```

```python
root = Node(1,
             Node(2, Node(4), Node(5)),
             Node(3))
```

---

## Depth-First Traversal: Preorder, Inorder, Postorder

Chapter 1 defined the three DFS orders by _when_ a node's own value is visited relative to its two
subtrees. That definition is already the recursive case — the base case is just "an empty subtree
does nothing," the same `if node is None: return` shape as any other recursion whose input has
shrunk to nothing left to process.

### Preorder — Root, Left, Right

Visit the node first, then recurse left, then recurse right:

```python
def preorder(node, visit):
    if node is None:
        return
    visit(node.value)
    preorder(node.left, visit)
    preorder(node.right, visit)
```

```python
>>> preorder(root, print)
1
2
4
5
3
```

### Inorder — Left, Root, Right

Recurse left first, visit in the middle, then recurse right:

```python
def inorder(node, visit):
    if node is None:
        return
    inorder(node.left, visit)
    visit(node.value)
    inorder(node.right, visit)
```

```python
>>> inorder(root, print)
4
2
5
1
3
```

### Postorder — Left, Right, Root

Recurse both children fully before visiting the node itself:

```python
def postorder(node, visit):
    if node is None:
        return
    postorder(node.left, visit)
    postorder(node.right, visit)
    visit(node.value)
```

```python
>>> postorder(root, print)
4
5
2
3
1
```

All three are **O(n) time** — every node is visited exactly once, no matter which order — and **O(h)
space**, where `h` is the tree's height: that's the depth of the call stack at its deepest point,
one frame per ancestor of whichever leaf is currently being processed. `h` is `O(log n)` for a
balanced tree and degrades to `O(n)` for a skewed one (Chapter 1's balance discussion, made
concrete: a tree that's really a linked list in disguise pays for it here as linear stack depth, the
same way it paid for it in search cost).

---

## Iterative DFS With an Explicit Stack

[[01-stack|Part 04, Chapter 1]] showed the general mechanical conversion: `dfs_iterative` replaced
the interpreter's call stack with an explicit Python list, popping a node and pushing its children
in reversed order so they come back out left-to-right. [[03-recursion|Part 01, Chapter 3]] is the
same technique stated generally — any recursion can be rewritten with an explicit stack standing in
for the frames the interpreter would otherwise manage. A binary tree has exactly two named children
instead of a list, so "push children in reversed order" becomes concrete: push `right` then `left`,
so `left` pops first.

### Preorder, Iteratively

Preorder is the direct specialization of `stack.md`'s `dfs_iterative` — visit on the way _in_, which
is exactly what a single stack does naturally: pop, visit, push children for later.

```python
def preorder_iterative(root, visit):
    if root is None:
        return
    stack = [root]
    while stack:
        node = stack.pop()
        visit(node.value)
        if node.right:
            stack.append(node.right)      # pushed first...
        if node.left:
            stack.append(node.left)       # ...so this pops first
```

Same output as the recursive version: `1 2 4 5 3`. Time and space are unchanged from the recursive
form — O(n) time, and the stack never holds more than O(h) nodes at once, because at any moment it
contains only the unexplored right-siblings of the path currently being walked.

### Inorder, Iteratively

Inorder can't reuse that "pop, visit, push children" shape, because the node has to be visited
_between_ its two subtrees, not before either of them. The standard pattern instead keeps a current
pointer and a stack: walk all the way left, pushing every node passed along the way, and only visit
a node once there's nothing further left to explore from it.

```python
def inorder_iterative(root, visit):
    stack = []
    node = root
    while stack or node is not None:
        while node is not None:            # walk left, pushing every node passed
            stack.append(node)
            node = node.left
        node = stack.pop()                  # deepest node with no more left to explore
        visit(node.value)
        node = node.right                    # then explore its right subtree the same way
```

Same output as the recursive version: `4 2 5 1 3`. Still O(n) time; the stack again holds at most
O(h) nodes — the left-spine currently being walked — so space is unchanged from the recursive form
too.

### Postorder, Iteratively — the Trickiest of the Three

Postorder is the one where the naive translation breaks. Preorder's "pop, visit, push children"
works because the node is visited on the very first encounter. Postorder needs a node visited only
after **both** children are fully processed — which means a plain stack has no way to tell "I'm
seeing this node for the first time" from "I'm back at this node after finishing its subtrees," and
those two cases need to do completely different things.

The cleanest fix doesn't try to disambiguate on one stack at all — it uses two. Run a _modified_
preorder that visits **root, right, left** instead of root, left, right (swap which child is pushed
first), and instead of visiting immediately, push each node onto a second stack. Reversing
root-right-left produces left-right-root — postorder, exactly:

```python
def postorder_iterative(root, visit):
    if root is None:
        return
    to_visit = [root]
    reversed_order = []
    while to_visit:
        node = to_visit.pop()
        reversed_order.append(node)          # collect in root, right, left order
        if node.left:
            to_visit.append(node.left)       # pushed first...
        if node.right:
            to_visit.append(node.right)      # ...so right pops before left
    while reversed_order:
        visit(reversed_order.pop().value)     # popping reverses root-right-left to left-right-root
```

Same output as the recursive version: `4 5 2 3 1`. The trick costs something, though, and it's worth
naming rather than glossing over: `to_visit` and `reversed_order` between them hold every node at
some point, so this version is **O(n) space**, not O(h) — the price of not needing a
first-visit/return-visit distinction is giving up the tighter stack-depth bound preorder and inorder
kept.

The alternative that _does_ keep O(h) space uses one stack plus a `last_visited` pointer: before
popping the stack's top node, check whether it has an unvisited right child — if so, descend into
that child instead of popping; only pop and visit once both children are `None` or already visited.
That single extra pointer is exactly the "first visit vs. return visit" distinction the naive
one-stack version was missing. It's more state to track correctly under pressure, which is why the
two-stack version above is usually the one worth reaching for first, and the one-stack-plus-pointer
version worth knowing exists for when an interviewer explicitly rules out the second stack.

| Traversal | Recursive space | Iterative space  | Iterative shape                                 |
| --------- | --------------- | ---------------- | ----------------------------------------------- |
| Preorder  | O(h)            | O(h)             | pop → visit → push right, left                  |
| Inorder   | O(h)            | O(h)             | walk left pushing → pop → visit → move right    |
| Postorder | O(h)            | O(n) (two-stack) | modified preorder (root, right, left), reversed |

---

## Level-Order Traversal (BFS)

[[02-queue|Part 04, Chapter 2]]'s `bfs_levels` skeleton is generic — any structure exposing
"neighbors of this node" plugs in. A binary tree is the narrowest possible case of that skeleton:
`left` and `right` stand in for the neighbor list, and there's no `visited` set to maintain, because
a tree has no cycles and no node has more than one parent — the pointer structure itself already
guarantees nothing gets enqueued twice.

```python
from collections import deque

def level_order(root):
    """Level-by-level traversal of a binary tree. Returns a list of levels."""
    if root is None:
        return []
    levels = []
    queue = deque([root])
    while queue:
        level_size = len(queue)              # freeze this level's boundary
        level_nodes = []
        for _ in range(level_size):
            node = queue.popleft()            # FIFO: process in discovery order
            level_nodes.append(node.value)
            if node.left:
                queue.append(node.left)        # enqueue for the *next* level
            if node.right:
                queue.append(node.right)
        levels.append(level_nodes)
    return levels
```

```python
>>> level_order(root)
[[1], [2, 3], [4, 5]]
```

`level_size = len(queue)` is doing the identical job it did in `bfs_levels` — freezing how many
nodes belong to the current level before any next-level node gets enqueued into the same queue. The
only thing that changed crossing from a generic graph to a binary tree is where neighbors come from:
`graph.get(node, [])` became two named field reads. Swap the queue for a stack here and, same as in
the queue chapter, the traversal becomes depth-first instead — a stack hands back the most recently
discovered node, not the earliest, which is preorder's `left`/`right` push order from the previous
section wearing a different name.

Time is O(n) — every node enqueued and dequeued exactly once. Space is O(w), where `w` is the widest
level of the tree; for a perfect binary tree that's the bottom level, which holds roughly `n/2`
nodes, so worst-case space is O(n) even though each individual level is processed one at a time.

---

## Computing Height and Depth

Chapter 1 drew the distinction: **height** is measured from a node down to its deepest leaf;
**depth** is measured from the root down to a given node. That asymmetry shows up directly in how
each is computed — height is naturally bottom-up, depth is naturally top-down.

**Height** recurses into both children first and only then combines their results — structurally
identical to postorder, with `1 + max(...)` standing in for `visit`:

```python
def height(node):
    """Height of the subtree rooted at node. An empty subtree has height -1;
    a single leaf has height 0."""
    if node is None:
        return -1
    return 1 + max(height(node.left), height(node.right))
```

`height(root)` for the sample tree is `2`: two edges from `1` down to either `4` or `5`. Each call
does O(1) work beyond its two recursive calls, so this is O(n) time, O(h) space — one frame per node
on the current root-to-leaf path, same shape as postorder above.

**Depth** answers a different question — how far a _specific_ node is from the root — and that
question can't be answered bottom-up at all: a node has no way of knowing its own distance from the
root without being told, because nothing about a node's own fields says where it sits in the whole
tree. So depth is computed top-down, starting at the root, threading a running count downward:

```python
def depth(node, target, current_depth=0):
    """Depth of target within the subtree rooted at node, or -1 if target isn't found."""
    if node is None:
        return -1
    if node is target:
        return current_depth
    left = depth(node.left, target, current_depth + 1)
    if left != -1:
        return left
    return depth(node.right, target, current_depth + 1)
```

`depth(root, root.left.right, 0)` — asking for node `5`'s depth — returns `2`, the same number
`height` computed for the whole tree, purely because this sample tree happens to be that symmetric.
In general the two numbers have nothing to do with each other: height is a property of a subtree,
depth is a property of one node's position relative to a fixed root, and computing either one
requires walking in the opposite direction from the other.

---

## Why the Traversal Order You Pick Matters

Four orders exist because four different problems each want a different guarantee about _when_ a
node is visited relative to its neighbors — not because it's traditional to list all four.

**Preorder serializes and clones.** A node is written down before either of its children, so
rebuilding the tree from that sequence can create the parent first and attach children as they're
read — top-down reconstruction, matching top-down emission:

```python
def serialize(node, out):
    if node is None:
        out.append("#")
        return
    out.append(node.value)
    serialize(node.left, out)
    serialize(node.right, out)

>>> out = []
>>> serialize(root, out)
>>> out
[1, 2, 4, '#', '#', 5, '#', '#', 3, '#', '#']
```

Try that with postorder instead and reconstruction has no way to know, from the first value read,
which node is the root — it's buried at the end of the sequence instead of the front.

**Postorder is the safe order for deletion.** A node's children have to be detached (or freed)
before the parent that references them, or the parent's last reference to them is gone before
they've been handled — the same "don't lose your only handle" concern the linked-list chapters
raised about pointers, applied to a tree's parent-to-child references instead of a list's `next`.
`postorder`'s shape already visits left, then right, then the node itself, which is exactly "clean
up both children, then clean up the thing that pointed to them."

**Inorder** is being deliberately left alone here. Run it on the sample tree above and the output —
`4 2 5 1 3` — has no obvious structure, because nothing about _this_ tree's values relates to its
shape. The next chapter, Binary Search Trees, adds exactly one invariant (everything in a left
subtree is less than its parent, everything in the right subtree is greater), and inorder traversal
of a tree with that invariant turns out to produce fully sorted output — with the exact same
`inorder` function written above, unchanged. That's worth sitting with as a preview rather than an
explanation: the traversal code never changes, only what the data guarantees does.

**Level-order** is the order to reach for whenever "nearest first" or "level by level" is the actual
requirement rather than an implementation detail — printing a tree level by level for debugging,
finding the widest level (`max(len(level) for level in level_order(root))`, read directly off the
`level_nodes` lists `level_order` already builds), or, once graphs are in scope in Part 06, finding
shortest paths in an unweighted graph — BFS finds them precisely _because_ it explores nearest nodes
before farther ones, the same reason it's the right choice here.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
