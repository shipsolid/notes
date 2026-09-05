---
title: "1 — Graph Representation"
description: "Adjacency matrix, adjacency list, and edge list — what a graph adds back once trees drop the acyclic, single-parent, single-root constraints, and why every graph algorithm in this Part needs a visited set that tree traversal never did."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-38"
relations:
  - slug: data-structures-algorithms/05-trees/01-tree-fundamentals/01-tree-fundamentals
    kind: related
---

# 1 — Graph Representation

A tree is a graph — specifically, a **connected, acyclic graph** with a single designated root and
exactly one path between any two nodes. Nothing in the definition of "graph" requires any of that.
Drop the acyclic constraint and cycles become legal. Drop the "exactly one path between any two
nodes" guarantee and a node can be reached by more than one route, which means a node can have more
than one incoming edge — more than one "parent," a structural impossibility in a tree. Drop the
single-root requirement and there may be no natural starting point at all, or several equally valid
ones. What's left after dropping all three is the general graph this Part spends ten chapters on —
and before any traversal or shortest-path or spanning-tree algorithm makes sense, it's worth being
precise about exactly what got added back, because one of those additions (cycles) is the reason
every algorithm from here forward carries a piece of bookkeeping — a `visited` set — that
[[01-tree-fundamentals|Part 05, Trees]] never needed once.

---

## Graphs vs. Trees: What Cycles Change

Formally, a graph is a pair `(V, E)` — a set of **vertices** (nodes) and a set of **edges**
(connections between pairs of vertices). A tree is the special case where `|E| = |V| - 1`, the graph
is connected, and there are no cycles. That single constraint — acyclic — is doing more work than it
looks like. Two consequences follow from it that the tree chapters leaned on without ever having to
state them, because in a tree they're just always true:

- **Exactly one path between any two nodes.** In a tree, there is never more than one route from the
  root to a given node — that's what let [[01-tree-fundamentals|Chapter 1, Trees]] talk
  unambiguously about "the path from the root to `G`." A general graph offers no such guarantee: two
  different routes to the same node are not just possible, they're the normal case in anything that
  models real dependencies — a build graph where two upstream packages both feed the same downstream
  package, a road network where two different streets both lead to the same intersection.
- **Every non-root node has exactly one parent.** This isn't a separate rule from the one above —
  it's the same fact seen from the arriving node's side. If node `D` is reachable by two distinct
  routes — say through `B` and, separately, through `C` — then `D` has two incoming edges, i.e. two
  "parents." And tracing those two routes back to a common ancestor and treating the connections as
  undirected reveals exactly what that convergence is: a **cycle** — `A → B → D`, `A → C → D`, and
  the undirected path `A - B - D - C - A` closes the loop. A tree's "one path to every node"
  property and "at most one parent per node" property are the same guarantee stated twice; a general
  graph drops both at once, because allowing multiple parents at a node **is** what a cycle looks
  like from that node's point of view.

```
Tree (Part 05):                    Graph (this Part):

        A                                  A
      /   \                              /   \
     B     C                            B     C
      \   /                              \   /
    (not allowed —                        v v
     two parents                          D
     for one node)                  (D has two parents:
                                     B and C — legal here,
                                     and this convergence
                                     IS a cycle once the
                                     edges are read as
                                     undirected: A-B-D-C-A)
```

Cycles are also legal on their own, without any convergence — `A → B → C → A` is a perfectly
ordinary directed cycle, and it's the more dangerous shape in practice because it's the one that
actually causes an unguarded traversal to run forever. Contrast the two:

```python
# Tree traversal (Part 05) — no visited set anywhere. It cannot loop:
# there are no cycles to loop on, so recursion always terminates at
# a None child, in at most `height` levels of depth.
def dfs_tree(node):
    if node is None:
        return
    print(node.value)
    dfs_tree(node.left)
    dfs_tree(node.right)

# Graph traversal (this Part) — the same shape, on a cyclic graph,
# with no visited set:
def dfs_graph_BROKEN(node, adjacency):
    print(node)
    for neighbor in adjacency[node]:
        dfs_graph_BROKEN(neighbor, adjacency)   # A -> B -> C -> A -> B -> C -> ... forever
```

On `A → B → C → A`, `dfs_graph_BROKEN` visits `A`, then `B`, then `C`, then `A` again, and never
stops — there is no `None` child to hit, because a graph has no structural notion of "the bottom."
[[02-graph-traversal|Chapter 2, Graph Traversal]] is the fix, and it's a small one: a `visited` set,
checked before recursing and populated before the recursive call, so a node already on the path (or
already fully explored) is never processed a second time. That one addition is not a stylistic
preference carried over from trees — it's the structural minimum required for _any_ graph traversal
to be guaranteed to terminate, and it's why every algorithm in this Part — BFS, DFS, topological
sort, the shortest-path family, cycle detection itself — opens with `visited = set()` before it does
anything else. Even on a graph with no true cycles at all — a DAG with a convergence point like `D`
above — skipping the visited set doesn't cause an infinite loop, but it does cause redundant work
that compounds fast: `D` gets fully re-explored once for every path that reaches it, and a chain of
several such diamonds turns a linear amount of work into an exponential amount, for exactly the same
reason naive recursive Fibonacci re-does the same subproblem repeatedly. A `visited` set — or, in
that specific DP-flavored context, a memo — is the fix either way.

---

## Directed vs. Undirected, Weighted vs. Unweighted

Every graph in this Part varies along two independent axes before any algorithm is chosen. Neither
axis is about traversal order the way the tree chapters' four orders were — both are properties of
the edges themselves, decided when the graph is built, and they constrain which algorithms are even
applicable.

**Directed vs. undirected** — does an edge have a direction?

- A **directed** edge `A -> B` is one-way: it says you can travel from `A` to `B`, and says nothing
  about the reverse. A one-way street is directed. A "follows" relationship on social media is
  directed — you can follow someone who doesn't follow you back. Reachability is not symmetric: `B`
  reachable from `A` does not imply `A` reachable from `B`.
- An **undirected** edge `A -- B` is symmetric by definition: it asserts both directions at once. A
  friendship (on a platform where following is mutual) is undirected. A physical two-way road is
  undirected — if you can drive from the intersection at `A` to the one at `B`, you can drive back.

The distinction matters beyond bookkeeping: a cycle in an undirected sense (as in the `D`
convergence above) requires only that the _undirected_ version of the edges close a loop, whereas a
directed cycle requires the _arrows themselves_ to trace a closed loop. `A -> B`, `A -> C`,
`B -> D`, `C -> D` has no directed cycle — you can never return to `A` by following arrows — even
though its undirected skeleton does. That graph is a **DAG** (directed acyclic graph), and DAGs get
their own chapter precisely because "acyclic in the directed sense, but not in the undirected sense"
is a distinct, useful category — see [[03-topological-sorting|Chapter 3, Topological Sorting]],
which only exists because DAGs (build dependencies, task scheduling, course prerequisites) are
directed and acyclic at once.

Implementation-wise, an undirected edge is usually just **two directed edges stored back to back**:
adding `A -- B` means inserting `B` into `A`'s neighbor list _and_ `A` into `B`'s neighbor list, in
whichever representation is in use. None of the three representations below need a separate code
path for "undirected" — they need exactly one extra line that inserts the mirror edge, and that line
is skipped entirely for a directed graph.

**Weighted vs. unweighted** — does an edge carry a cost?

- An **unweighted** edge asserts only that a connection exists — no cost, no distance, no capacity
  attached. Every edge is implicitly worth the same "1 hop."
- A **weighted** edge carries a number beyond mere existence — distance in kilometers, latency in
  milliseconds, a dollar cost, a pipe's flow capacity. Two edges between the same pair of nodes can
  have wildly different costs, and "shortest" stops meaning "fewest edges" and starts meaning
  "lowest total weight."

That distinction picks the algorithm family for a question as simple as "what's the shortest route
from `A` to `Z`":

- **Unweighted** — "fewest edges" is answered by a plain **BFS**, because BFS explores in expanding
  rings of hop-count by construction: the first time BFS reaches a node is guaranteed to be via a
  shortest (fewest-edges) path. See [[02-graph-traversal|Chapter 2, Graph Traversal]] for why that
  guarantee holds.
- **Weighted** — fewest edges is no longer the right question; lowest total weight is, and BFS's
  ring-by-ring guarantee no longer applies, because a path with more edges can still have lower
  total weight than a path with fewer, heavier ones. That's what **Dijkstra's algorithm**
  (non-negative weights) and **Bellman-Ford** (weights that may be negative) exist to compute — both
  covered in [[04-shortest-path|Chapter 4, Shortest Path]].

Every representation below can express weighted or unweighted, directed or undirected — the four
combinations aren't four different data structures, they're the same three representations with one
detail (is there a mirror edge? does a slot hold a weight or just a boolean?) filled in differently.

---

## Adjacency Matrix

A `V x V` 2D array where `matrix[u][v]` holds the weight of the edge from `u` to `v` — or a sentinel
(`0`, `None`, or `float('inf')`, depending on convention) meaning "no edge." Vertices are addressed
by integer index `0` through `V - 1`; a graph whose nodes are labeled with something else (strings,
objects) needs a separate `node -> index` map built alongside the matrix, which is itself a small,
easy-to-forget cost this representation carries that the other two don't — a `dict` key can be any
hashable value, but a 2D array index can't.

```python
class GraphMatrix:
    def __init__(self, num_vertices, directed=False):
        self.n = num_vertices
        self.directed = directed
        # 0 means "no edge"; any nonzero value is that edge's weight
        self.matrix = [[0] * num_vertices for _ in range(num_vertices)]

    def add_edge(self, u, v, weight=1):
        self.matrix[u][v] = weight
        if not self.directed:
            self.matrix[v][u] = weight          # the "mirror edge" for undirected

    def has_edge(self, u, v):
        return self.matrix[u][v] != 0            # O(1) — direct index into the array

    def neighbors(self, u):
        # O(V) — every one of the V possible neighbors has to be checked,
        # even if u only has 2 real edges out of V possible slots
        return [v for v in range(self.n) if self.matrix[u][v] != 0]
```

```python
g = GraphMatrix(4, directed=True)   # vertices 0=A, 1=B, 2=C, 3=D
g.add_edge(0, 1)   # A -> B
g.add_edge(0, 2)   # A -> C
g.add_edge(1, 3)   # B -> D
g.add_edge(2, 3)   # C -> D
g.has_edge(0, 1)   # True, O(1)
g.neighbors(0)     # [1, 2] — but computed by scanning all 4 columns, O(V)
```

The honest trade-off: **space is `O(V^2)` regardless of how many edges actually exist.** A graph
with 10,000 vertices and only 15,000 real edges (a very ordinary sparse graph — a social network, a
road map, a dependency graph) still allocates a matrix with `100,000,000` cells, the overwhelming
majority holding "no edge." That's the matrix's core weakness: it charges for every _possible_ edge,
not every _actual_ one. Where it wins is **`O(1)` edge-existence lookup** — asking "is there an edge
from `u` to `v`" is a single array index, no scanning required — and it's the natural fit for
**Floyd-Warshall** (all-pairs shortest path, [[04-shortest-path|Chapter 4, Shortest Path]]), which
already thinks in terms of a `V x V` distance table and updates it in place. A matrix earns its
`O(V^2)` cost when the graph really is dense (edges close to `V^2` in count) or when the algorithm's
natural data shape is already a `V x V` table — otherwise the wasted space is a real practical cost,
not a theoretical one.

---

## Adjacency List

A dictionary (or, with pre-numbered integer vertices, an array of lists) mapping each node to the
list of its neighbors — paired with a weight, if the graph is weighted.

```python
from collections import defaultdict

class GraphList:
    def __init__(self, directed=False):
        self.directed = directed
        self.adj = defaultdict(list)   # node -> list of (neighbor, weight)

    def add_edge(self, u, v, weight=1):
        self.adj[u].append((v, weight))
        if not self.directed:
            self.adj[v].append((u, weight))     # the mirror edge, same as the matrix
        else:
            self.adj.setdefault(v, [])           # register v even if it has no outgoing edges yet

    def has_edge(self, u, v):
        # O(degree(u)) — must scan u's neighbor list; this IS the cost traded
        # away for the matrix's O(1) lookup
        return any(neighbor == v for neighbor, _weight in self.adj[u])

    def neighbors(self, u):
        return self.adj[u]      # O(degree(u)) to produce — only the real neighbors, nothing wasted
```

```python
g = GraphList(directed=True)
g.add_edge("A", "B")
g.add_edge("A", "C")
g.add_edge("B", "D")
g.add_edge("C", "D")
g.neighbors("A")     # [("B", 1), ("C", 1)] — only A's actual edges, no scan of unrelated nodes
g.has_edge("A", "D") # False — found by scanning A's short neighbor list, not a 4x4 grid
```

Space is **`O(V + E)`** — proportional to what's actually in the graph, not to what could
theoretically be there. Enumerating a node's neighbors costs **`O(degree(u))`**: exactly as much
work as there are real edges to report, which is why this is the efficient choice for a sparse graph
and the representation nearly every traversal and shortest-path algorithm in this Part is written
against. The cost it pays in exchange, and it's worth naming plainly rather than glossing over: an
edge-existence check is **`O(degree(u))`**, not `O(1)` — there's no direct index to jump to, so
confirming "is `v` in `u`'s list" means walking that list. For a node with a huge fan-out (a
celebrity account with a million followers, a hub node in a dependency graph) that scan is not free,
and it's the one scenario where a matrix's `O(1)` lookup can outweigh a list's space savings. For
everything else — and "everything else" is most real graphs, which are sparse — the list wins on
both space and the operation (neighbor enumeration) that traversal algorithms actually spend their
time doing.

---

## Edge List

A flat list of `(u, v, weight)` tuples — no per-node structure at all, just every edge, once, in
whatever order they were added.

```python
class GraphEdgeList:
    def __init__(self, directed=False):
        self.directed = directed
        self.edges = []          # list of (u, v, weight)

    def add_edge(self, u, v, weight=1):
        self.edges.append((u, v, weight))

    def neighbors(self, u):
        # O(E) — there is no per-node index, so answering "who is u connected to"
        # means scanning every edge in the graph, not just u's own
        result = [v for (a, v, _weight) in self.edges if a == u]
        if not self.directed:
            result += [a for (a, b, _weight) in self.edges if b == u]
        return result

    def sorted_by_weight(self):
        # the operation this representation is actually built for: trivial here
        # because every edge already sits at the top level, nothing nested inside
        # per-node lists that would need flattening first
        return sorted(self.edges, key=lambda edge: edge[2])
```

```python
g = GraphEdgeList(directed=True)
g.add_edge("A", "B", weight=4)
g.add_edge("A", "C", weight=1)
g.add_edge("B", "D", weight=2)
g.add_edge("C", "D", weight=7)
g.sorted_by_weight()   # [('A','C',1), ('B','D',2), ('A','B',4), ('C','D',7)]
g.neighbors("A")        # O(E) — scans all four tuples to find the two starting at A
```

An edge list is rarely the representation of choice for traversal — "who are `u`'s neighbors" is an
`O(E)` full scan with no shortcut, strictly worse than either the matrix or the list for that
question, and no algorithm in this Part uses an edge list for BFS or DFS. What it's built for is
**Kruskal's algorithm** for minimum spanning trees
([[05-minimum-spanning-tree|Chapter 5, Minimum Spanning Tree]]), whose very first step is: sort
every edge in the graph by weight, then walk that sorted list from lightest to heaviest, adding an
edge whenever it doesn't create a cycle. That first step — sort all edges by weight — is a single
`sorted()` call on an edge list, because every edge already lives at the same flat level. On an
adjacency matrix, the weights are scattered across `V^2` cells with no ordering and no way to sort
them without first extracting every non-zero cell into a flat list — at which point it's an edge
list anyway. On an adjacency list, the weights are similarly scattered across `V` separate per-node
lists, needing the same flattening step before a global sort is even possible. The edge list isn't a
weaker version of the other two representations — it's the one built for a different question (“give
me every edge, globally ordered”) rather than the question the other two optimize for (“give me this
one node's neighbors”).

---

## Complexity and Trade-off Summary

| Representation       | Space      | Edge lookup `(u, v)` | Enumerate neighbors of `u` | Preferred by                                                        |
| -------------------- | ---------- | -------------------- | -------------------------- | ------------------------------------------------------------------- |
| **Adjacency Matrix** | `O(V^2)`   | `O(1)`               | `O(V)`                     | Dense graphs; Floyd-Warshall (all-pairs shortest path)              |
| **Adjacency List**   | `O(V + E)` | `O(degree(u))`       | `O(degree(u))`             | Sparse graphs; BFS, DFS, Dijkstra, and most algorithms in this Part |
| **Edge List**        | `O(E)`     | `O(E)`               | `O(E)`                     | Kruskal's MST (sort all edges by weight up front)                   |

No single representation dominates on every column — that's the point of laying them out side by
side rather than picking a "best" one. A matrix trades space for `O(1)` lookup; a list trades a
slower lookup for space proportional to what's actually there; an edge list gives up per-node
structure entirely in exchange for making a global operation (sort everything by weight) close to
free. Which trade-off is worth paying is a property of the _graph_ (dense vs. sparse) and the
_algorithm_ (does it ask "are these two connected," "what are this node's neighbors," or "give me
every edge in weight order") — not a property of one representation being objectively superior.

---

## The Default This Book Uses

Unless a specific algorithm's needs say otherwise, this book's worked examples default to the
**adjacency list** — a `dict[node, list[neighbor]]`, or `defaultdict(list)` when neighbors are being
built up incrementally, exactly as shown above. It's the right default because most graphs worth
running an interview-style algorithm on are sparse (`E` closer to `V` than to `V^2`), and because
neighbor enumeration — "what can I reach from here" — is the operation BFS, DFS, and nearly every
traversal-based algorithm in this Part spends the bulk of its time doing, which is exactly the
operation the adjacency list is built to make cheap. Two exceptions get called out explicitly when
they come up rather than silently switching representations:
[[05-minimum-spanning-tree|Chapter 5, Minimum Spanning Tree]] reaches for an edge list because
Kruskal's algorithm needs all edges sorted by weight up front, and any all-pairs shortest-path
treatment in [[04-shortest-path|Chapter 4, Shortest Path]] reaches for an adjacency matrix because
Floyd-Warshall's own recurrence is already shaped as a `V x V` table. Stating the default once here
means later chapters can write `adjacency[node]` and start reasoning about the algorithm
immediately, instead of re-justifying the choice of data structure in every chapter that uses one.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
