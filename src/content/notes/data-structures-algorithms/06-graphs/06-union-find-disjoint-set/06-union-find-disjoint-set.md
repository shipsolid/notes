---
title: "6 — Union Find (Disjoint Set)"
description: "Path compression and union by rank turn find and union into O(α(n)) amortized operations — the inverse Ackermann bound stated precisely, dynamic connectivity as edges arrive one at a time, and cycle detection as a direct byproduct of union itself."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-44"
relations:
  - slug: data-structures-algorithms/06-graphs/05-minimum-spanning-tree/05-minimum-spanning-tree
    kind: related
  - slug: data-structures-algorithms/06-graphs/02-graph-traversal/02-graph-traversal
    kind: related
---

# 6 — Union Find (Disjoint Set)

[[05-minimum-spanning-tree|Chapter 5]] needed one piece of machinery to make Kruskal's work — a fast
answer to "are `u` and `v` already connected?" — and it reached for `SimpleUnionFind` to get it,
with a docstring that flagged, twice, that the structure was deliberately incomplete: path
compression, yes; union by rank, and the complexity argument behind combining the two, "belongs
entirely to the next chapter." This is that chapter. [[02-graph-traversal|Chapter 2]]'s
`count_connected_components` answered "how many groups does this graph split into" by traversing the
whole thing, which requires the whole graph to already exist in memory before the question can be
asked at all. Union-Find answers the identical question incrementally, one edge at a time, as edges
arrive — which is the shape almost every real system actually hands you data in: friendships forming
over time in a social graph, servers joining a cluster one at a time, two previously separate
replica sets discovering each other and merging. Nothing about the interface below sounds impressive
on paper — two operations, `find` and `union`, full stop. What earns this an entire chapter is how
much engineering effort goes into making those two operations fast, and how astonishingly tight the
final bound turns out to be once that effort is spent.

---

## The Interface: find and union

A **Union-Find** (also called a **Disjoint Set Union**, or **DSU** — both names are standard
industry vocabulary for the identical structure) maintains a collection of **disjoint sets** —
groups of elements where every element belongs to exactly one group, no element belongs to two
groups at once, and every possible element belongs to _some_ group. On top of that collection, it
supports exactly two operations:

```python
class DisjointSet:
    def find(self, x):
        """Which set does x belong to? Returns a representative ("root") of that set — some
        fixed element that stands in for the whole group, chosen so that any two elements in
        the same set always return the same representative."""

    def union(self, x, y):
        """Merge the sets containing x and y into a single set."""
```

That's the whole contract. Every element starts in a singleton set containing only itself — before
any `union` call, `find(x) == x` for every `x`. After `union(x, y)` runs, `find(x) == find(y)` holds
forever after (until, if the structure supported it, a hypothetical split — which classical
Union-Find does not support; sets only ever merge, never divide). Two elements are in the same set
if and only if their `find` calls return the same representative — that single equality check is the
entire mechanism this whole chapter builds toward making fast: `find(u) == find(v)` answers "are `u`
and `v` connected" in whatever amount of time it takes to compute two `find` calls.

The representative itself is arbitrary — nothing about the interface promises `find(x)` returns
`x`'s smallest neighbor, or its original insertion value, or anything meaningful beyond "the same
answer every time for every element in the same set." Callers should never depend on which specific
element gets chosen as root; they should only depend on the equality relationship it induces.

Everything from here forward is the same two operations, reimplemented against progressively better
internal representations, each one addressing a specific way the previous version's performance
falls apart.

---

## The Basic Version, and Why It Can Degrade

The standard representation is a **parent-pointer forest**: a dict (or array) `parent` where
`parent[x]` points at `x`'s parent in an implicit tree, and a **root** is any element that points at
itself (`parent[root] == root`). Every disjoint set is one tree in this forest; the tree's root is
the set's representative. `find` walks up parent pointers until it reaches a root. `union` finds
both roots and points one root at the other, fusing the two trees into one.

```python
class QuickUnionBasic:
    """Bare parent-pointer forest. No path compression, no union by rank — exists only to show
    exactly how badly this can go if the tree shape is left to chance."""

    def __init__(self, elements):
        self.parent = {e: e for e in elements}

    def find(self, x):
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, x, y):
        root_x, root_y = self.find(x), self.find(y)
        if root_x != root_y:
            self.parent[root_x] = root_y   # always attach x's root under y's root — no care taken
```

This is correct — every set membership question it answers is right. It just isn't fast, and the
failure mode is concrete rather than theoretical. Call `union` on a chain of consecutive elements,
in order:

```python
elements = [1, 2, 3, 4, 5, 6, 7, 8]
qu = QuickUnionBasic(elements)
for i in range(1, 8):
    qu.union(i, i + 1)   # union(1,2), union(2,3), union(3,4), ..., union(7,8)
```

Trace what `parent` looks like after each call: `union(1, 2)` finds `root_x = 1`, `root_y = 2`, and
sets `parent[1] = 2`. `union(2, 3)` finds `root_x = find(2) = 2` (2 is still its own root at this
point), `root_y = 3`, and sets `parent[2] = 3`. `union(3, 4)` sets `parent[3] = 4`. Continue the
pattern and the final forest is a straight line:

```
parent = {1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 8}

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8   (8 points at itself — the root)
```

`find(1)` now has to walk all 7 hops to reach the root. For `n` elements unioned in this ascending
chain order, `find` on the oldest element costs **O(n)** — a parent-pointer forest with no
safeguards degrades into exactly the shape of a linked list, and pays exactly a linked list's price
for the one operation (find-the-end) that a tree structure was supposed to make cheap. The data
structure's name promises a tree; nothing in the code above actually enforces that the tree stays
anything but a chain. Both optimizations below exist purely to close that gap — one attacks the
chain after the fact, the other prevents it from forming in the first place.

---

## Path Compression

**Path compression** attacks the chain after the fact: every time `find` walks from some node up to
the root, re-point every node visited along the way **directly at the root** — not just at its
immediate parent — before returning. The insight is that once `find` has already paid the cost of
discovering the root for a given node, there's no reason any future `find` call on that same node
(or any node on the same path) should ever have to re-walk the same chain again.

This is exactly what [[05-minimum-spanning-tree|Chapter 5]]'s `SimpleUnionFind` already did, shown
again here as the starting point this chapter builds on:

```python
class SimpleUnionFind:
    """Path compression only — the version Chapter 5 used for Kruskal's, and the exact starting
    point this chapter adds union by rank on top of."""

    def __init__(self, elements):
        self.parent = {e: e for e in elements}

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])   # path compression, on the way back out
        return self.parent[x]

    def union(self, a, b):
        root_a, root_b = self.find(a), self.find(b)
        if root_a == root_b:
            return False   # already the same set
        self.parent[root_a] = root_b
        return True
```

`find` recurses all the way to the root first, then — on the way back **out** of the recursion, as
the call stack unwinds — assigns `self.parent[x] = self.find(...)`, which overwrites `x`'s parent
pointer with the root itself, no matter how many intermediate nodes originally sat between them. Run
the identical chain-building unions from the previous section through `SimpleUnionFind` and the
forest still degenerates into the same straight line — path compression only fires during `find`,
and nothing has called `find` yet:

```python
suf = SimpleUnionFind(elements)
for i in range(1, 8):
    suf.union(i, i + 1)
# suf.parent == {1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 8}  — identical chain, so far
```

The payoff shows up the moment `find` actually runs. Call `find(1)` once against that chain:

```python
>>> suf.find(1)
8
>>> suf.parent
{1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8}
```

One `find` call walked the entire 7-hop chain to discover the root, and — because every node on that
path gets re-pointed directly at the root during the unwind — every one of those nodes, not just
node 1, now costs O(1) to `find` from now on. The very traversal that paid the O(n) cost once is
also the mechanism that guarantees no future call ever pays it again for any node on that particular
path. Path compression alone already keeps a Union-Find fast in practice; formally, it gives an
amortized **O(log n)** per operation over a long sequence of calls — the chain can never fully
reform, because every `find` that walks it also flattens it. That's a real, useful improvement, and
it's why `SimpleUnionFind` was "good enough for now" back in Chapter 5. It is not, however, the
whole story: path compression only fixes a bad tree shape after the damage of an unlucky `union`
order has already been done once. The second optimization prevents that damage from happening in the
first place.

---

## Union by Rank

**Union by rank** attacks the problem from the other direction: instead of fixing a lopsided tree
after the fact, never let a lopsided tree get built to begin with. Every root tracks a **rank** — an
upper bound on the height of the tree rooted there (not an exact height once path compression starts
short-circuiting paths, which is precisely why it's called rank and not height once both
optimizations are combined) — and every `union` attaches the **shorter** (lower-rank) tree
underneath the root of the **taller** (higher-rank) tree, never the reverse. When the two trees tie
in rank, either one can become the new root, but the winning root's rank increases by exactly one —
that's the only situation in which rank ever grows.

```python
class UnionFind:
    """Disjoint-set union with path compression AND union by rank — the full version Chapter 5
    promised. Same interface as SimpleUnionFind, plus the rank bookkeeping that keeps the tree
    provably shallow even before any find() call gets a chance to compress it."""

    def __init__(self, elements):
        self.parent = {e: e for e in elements}
        self.rank = {e: 0 for e in elements}   # upper bound on this root's subtree height
        self.components = len(elements)        # how many disjoint sets currently exist

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])   # path compression
        return self.parent[x]

    def union(self, x, y):
        """Merge the sets containing x and y. Returns False if they were already the same set
        (a no-op union — and, in a graph context, exactly the signal that adding this edge
        would close a cycle)."""
        root_x, root_y = self.find(x), self.find(y)
        if root_x == root_y:
            return False

        # union by rank: attach the shorter tree under the taller tree's root
        if self.rank[root_x] < self.rank[root_y]:
            root_x, root_y = root_y, root_x
        self.parent[root_y] = root_x
        if self.rank[root_x] == self.rank[root_y]:
            self.rank[root_x] += 1   # rank only grows when two equal-rank trees merge

        self.components -= 1
        return True
```

Run the exact same chain-building sequence — `union(1,2), union(2,3), ..., union(7,8)` — through
this version, with **no `find` calls at all** yet to help it along:

```python
>>> uf = UnionFind([1, 2, 3, 4, 5, 6, 7, 8])
>>> for i in range(1, 8):
...     uf.union(i, i + 1)
>>> uf.parent
{1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1}
```

Every one of the seven unions attaches a brand-new singleton (rank 0) underneath the existing,
already-larger tree's root — because a rank-0 newcomer is never taller than a tree that already
absorbed previous merges, union by rank always keeps the growing tree as the new root and the
newcomer as its direct child. The result is a flat star of height 1, not a chain of length 7, for
the identical sequence of operations that degenerated into a straight line under `QuickUnionBasic`.
Union by rank didn't need path compression's after-the-fact cleanup here at all — it simply never
allowed the bad shape to form.

### Why the height bound holds: the same argument shape as an AVL tree

The claim worth justifying precisely: with union by rank alone (ignore path compression for a
moment), the height of any tree in the forest is bounded by **O(log n)**, no matter what order the
unions arrive in or how adversarially they're chosen.

The key structural fact: **a tree of rank `r` can only come into existence by merging two trees that
were each already rank `r − 1`** — rank only increments in the tie-breaking branch, and a tie
requires both sides to already be at the rank one below what the merged result becomes. That means
the minimum number of elements a rank-`r` tree can possibly contain, call it `N(r)`, obeys
`N(r) ≥ 2 · N(r − 1)`: it takes at least two subtrees, each with at least `N(r − 1)` elements, to
produce one tree of rank `r`. Unrolling that recurrence from `N(0) = 1` (a single element is
trivially a rank-0 tree) gives `N(r) ≥ 2^r`.

Since the total number of elements `n` is at least as large as the size of any one tree in the
forest, `n ≥ N(r) ≥ 2^r` for whatever rank `r` any root happens to reach — which rearranges to
`r ≤ log₂ n`. Rank is an upper bound on height, so **height is bounded by O(log n)**, full stop,
regardless of union order.

This is the identical proof shape [[04-avl-trees|Part 05, Chapter 4]] used to bound a self-balancing
BST's height: there, the argument ran "the minimum node count of a height-`h` AVL tree grows at
least exponentially in `h` (a Fibonacci-like recurrence), so height is bounded logarithmically in
node count." Here it's "the minimum element count of a rank-`r` Union-Find tree grows as `2^r`, so
rank — and therefore height — is bounded logarithmically in element count." Different data
structure, different recurrence, same underlying move: show that reaching a given height requires
the total size to have grown at least geometrically to get there, then invert the exponential to get
a logarithmic bound on height as a function of size.

Union by rank alone, with no path compression, already guarantees **O(log n) worst-case per
operation** — a real, meaningful bound on its own. Combined with path compression, the bound gets
tighter still, and that combination is the subject of the next section.

---

## The Payoff: O(α(n)), Practically O(1)

Path compression alone gives amortized O(log n). Union by rank alone gives worst-case O(log n). Put
both optimizations to work **together** in the same structure — which `UnionFind` above already does
— and the bound drops to something genuinely remarkable: the amortized cost of any sequence of
`find` and `union` operations is **O(α(n))**, where **α is the inverse Ackermann function**.

This deserves being stated precisely rather than either overclaimed or hand-waved, because it's one
of the tightest, most surprising complexity results anywhere in this book. Ackermann's function
`A(m, n)` is a specific, well-studied function that grows faster than any exponential, any tower of
exponentials, any level of iterated exponentiation you can name — it's the textbook example of a
computable function that provably outgrows the entire "elementary function" hierarchy. `α(n)` is its
**functional inverse**: informally, `α(n)` is the smallest `k` for which `A(k, k)` is at least `n`.
Inverting a function that grows _that_ explosively produces a function that grows correspondingly,
almost unimaginably, slowly — slow enough that for every value of `n` that could ever describe an
actual input size on an actual computer (`n` up to numbers vastly larger than the estimated atom
count of the observable universe), `α(n) ≤ 4`. This isn't an approximation or a rule of thumb; it's
a precise, proven mathematical fact about a precisely defined function, established by Robert Tarjan
in his 1975 analysis of union-by-rank-with-path-compression ("Efficiency of a Good But Not Linear
Set Union Algorithm"), and it appears with a full proof in standard algorithms references (Cormen,
Leiserson, Rivest & Stein's _Introduction to Algorithms_ devotes an entire chapter to it). The bound
is tight in both directions — matched by a corresponding lower bound — so O(α(n)) is not merely an
upper bound this chapter is choosing not to improve on; it's the actual answer.

The practical takeaway matters more than the proof, and this chapter deliberately doesn't attempt
the full derivation — it's a genuinely advanced argument, well outside what an interview or a
day-to-day system needs. What's worth carrying forward is the precise claim and its consequence:
**for every purpose an interview whiteboard or a real production system cares about, O(α(n)) is
indistinguishable from O(1).** Not "basically constant" as a hand-wave, and not "some small
function" left vague — a specific, provably bounded-by-4-for-all-practical-inputs function, which is
close enough to a true constant that treating it as one costs nothing in practice. Say it once,
precisely, and treat `find` and `union` as O(1) for every complexity analysis from here forward in
this book — Kruskal's O(E log E), the dynamic connectivity example below, and anything else built on
top of Union-Find never needs to carry an `α(n)` term explicitly; it's there, it's real, and it's
too small to matter next to anything else in the analysis.

---

## Worked Example: Dynamic Connected Components

[[02-graph-traversal|Chapter 2]]'s `count_connected_components` needed the entire graph handed over
up front — the outer loop iterates `for node in graph`, which presupposes every node and edge
already exists in memory before the first traversal can even start. That's a fine assumption for a
graph that's fully known in advance. It's the wrong assumption for a graph that's still being built:
a social network where friendships form one at a time, a distributed system where nodes discover and
merge with previously separate clusters, a set of servers being provisioned that gradually connect
to each other's networks. In all of these, the real question isn't "how many components does this
graph have" as a one-time batch computation — it's "how many components exist **right now**," asked
repeatedly as edges keep arriving.

Union-Find answers exactly that, incrementally, with no re-traversal required: initialize one
singleton set per node (`n` components to start), and every time an edge `(u, v)` arrives, call
`union(u, v)`. If `union` returns `True` — the two endpoints were in different sets — the number of
components just dropped by exactly one, because two previously separate groups just merged into one.
If it returns `False`, the edge connected two nodes already in the same component, and the component
count doesn't change at all. `UnionFind.components` above already tracks this directly: it starts at
`len(elements)` and decrements once per successful (non-redundant) union.

```python
class DynamicComponents:
    """Answers 'how many connected components right now?' as edges arrive one at a time —
    no need for the whole graph to exist up front, unlike a traversal-based approach."""

    def __init__(self, nodes):
        self.uf = UnionFind(nodes)

    def add_edge(self, u, v):
        self.uf.union(u, v)

    def count(self):
        return self.uf.components
```

```python
>>> nodes = ["A", "B", "C", "D", "E", "F", "G"]
>>> dc = DynamicComponents(nodes)
>>> dc.count()
7
>>> edge_stream = [("A", "B"), ("C", "D"), ("A", "C"), ("E", "F"), ("B", "D")]
>>> for u, v in edge_stream:
...     dc.add_edge(u, v)
...     print(f"edge ({u},{v}) arrives -> components now: {dc.count()}")
edge (A,B) arrives -> components now: 6
edge (C,D) arrives -> components now: 5
edge (A,C) arrives -> components now: 4
edge (E,F) arrives -> components now: 3
edge (B,D) arrives -> components now: 3
```

Seven isolated nodes to start. `(A,B)` and `(C,D)` each merge two singletons, dropping the count by
one apiece. `(A,C)` merges `{A,B}` with `{C,D}` into `{A,B,C,D}` — one component in place of two,
count drops again. `(E,F)` merges the last two remaining singletons. The final edge, `(B,D)`, is
where the incremental nature of the question shows up most clearly: `B` and `D` are already both in
`{A,B,C,D}` by that point, so `union` returns `False` and the count correctly stays at 3 — the edge
is real, it gets recorded, but it doesn't merge anything, because the merge already happened two
steps earlier via a different path (`A–C`). `G` never appears in the edge stream at all and stays
its own component the entire time, which is exactly the right answer: nothing ever claimed it was
connected to anything.

**Complexity:** each `add_edge` call is one `union` — O(α(n)), practically O(1), from the previous
section. Processing a stream of `m` edges costs O(m · α(n)), effectively O(m) — no re-traversal of
already-processed edges, no need to hold the whole graph in memory at once, and "how many components
right now" is a single attribute read, O(1), answerable after every single edge without recomputing
anything. This is the direct payoff promised back in Chapter 2's aside: an incremental alternative
to full re-traversal for exactly the graphs that arrive edge by edge rather than all at once.

---

## Worked Example: Cycle Detection

[[05-minimum-spanning-tree|Chapter 5]]'s Kruskal's algorithm already leaned on this mechanism
without naming it as a general-purpose tool: `uf.union(u, v)` returning `False` means `u` and `v`
were already in the same component — which means a path between them already existed using edges
already accepted — which means adding edge `(u, v)` on top of that existing path would close a
cycle. That's not a heuristic or an approximation; it's a precise, efficient proof. Decoupled from
MST entirely, the identical check is a complete, general-purpose **cycle detector for undirected
graphs**:

```python
def has_cycle_undirected(vertices, edges):
    """Returns (True, closing_edge) if adding the edges in order would ever create a cycle,
    else (False, None). Each edge is a (u, v) tuple."""
    uf = UnionFind(vertices)
    for u, v in edges:
        if not uf.union(u, v):
            return True, (u, v)   # u and v were already connected — this edge closes a cycle
    return False, None
```

```python
>>> vertices = ["A", "B", "C", "D"]
>>> tree_edges = [("A", "B"), ("B", "C"), ("C", "D")]
>>> has_cycle_undirected(vertices, tree_edges)
(False, None)

>>> cyclic_edges = [("A", "B"), ("B", "C"), ("C", "D"), ("D", "A")]
>>> has_cycle_undirected(vertices, cyclic_edges)
(True, ('D', 'A'))
```

The first edge set is a straight path `A–B–C–D` — three edges, four vertices, exactly the V − 1
edges a tree needs, and every `union` call along the way merges two previously separate components,
so no cycle is ever reported. The second set adds one more edge, `D–A`, closing the path back into a
loop. By the time that edge is considered, `A` and `D` are already in the same component (both were
absorbed into `{A,B,C,D}` by the first three unions) — `union(D, A)` finds `find(D) == find(A)` and
returns `False`, and the function correctly reports the exact edge responsible.

This is precisely why Kruskal's never needed a separate cycle-detection pass: the
`if uf.union(u, v):` check in its main loop **is** cycle detection, running inline as part of
building the MST. Seeing it here as a standalone utility, with no MST or edge-sorting anywhere
nearby, makes the general applicability explicit — anywhere an undirected graph is being built up
edge by edge and the question "did that last edge just create a cycle" needs an answer, this is the
whole answer, at O(α(n)) per edge.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
