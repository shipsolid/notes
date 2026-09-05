---
title: "5 — Minimum Spanning Tree"
description: "Kruskal's and Prim's algorithms for the minimum-weight edge set connecting every node — why MST is a fundamentally different problem from shortest path, and how the same greedy framing from Part 01 produces two structurally different, equally correct algorithms."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-43"
relations:
  - slug: data-structures-algorithms/06-graphs/06-union-find-disjoint-set/06-union-find-disjoint-set
    kind: related
  - slug: data-structures-algorithms/05-trees/12-priority-queue/12-priority-queue
    kind: related
---

# 5 — Minimum Spanning Tree

Every algorithm in the previous chapter answered some version of "what's the cheapest way to get
from here to there?" That question has a source in mind — even Floyd-Warshall, which answers it for
every pair at once, is still fundamentally about _pairs_. This chapter throws the source away
entirely and asks a structurally different question: forget getting from any particular node to any
other particular node — what's the cheapest way to make sure _every_ node can reach _every_ other
node at all, using as few edges as the graph will allow? Same weighted graph, same word "cheapest"
in the problem statement, and yet the answer to this question is, in general, a completely different
set of edges than the answer to any shortest-path query run against the same graph. That gap — same
input, same vocabulary, different tree — is the entire reason this problem gets its own chapter
instead of a paragraph in the last one.

---

## The Problem: Cheapest Way to Connect Everything

Given a connected, undirected, weighted graph with V vertices, a **spanning tree** is a subset of
edges that satisfies two structural conditions simultaneously:

- **Spanning** — every vertex is reachable from every other vertex using only the chosen edges. No
  node is left stranded.
- **Tree** — the chosen edges contain no cycle. A tree on V vertices has exactly **V − 1 edges**;
  this isn't a design choice, it's a forced consequence — add a V-th edge to a tree and it either
  reconnects two already-connected vertices (creating a cycle) or the graph wasn't connected to
  begin with.

A single graph can have many different spanning trees — pick any V − 1 edges that happen to connect
everything without a cycle, and that's a valid one. The **minimum spanning tree (MST)** is whichever
spanning tree has the lowest possible sum of edge weights among all of them.

**Real-world framing:** a telecom company needs to lay cable connecting a set of cities. Every pair
of cities _could_ be connected directly, at a cost proportional to distance (or terrain, or existing
right-of-way — whatever the edge weight encodes). The company doesn't need every city connected to
every other city by a direct cable — it needs every city to be _reachable_ from every other city,
possibly by routing through intermediate cities. A cable between two cities that are already
connected via some other path adds cost without adding reachability — it's a cycle, and cycles are
pure waste in this framing. The MST is the answer to "what is the absolute cheapest set of cables
that leaves no city stranded and contains not one redundant link?" The same shape shows up anywhere
physical or logical infrastructure needs universal connectivity at minimum cost: power grid
transmission lines, pipeline networks, road networks connecting towns, even clustering algorithms
that use MST edge weights as a similarity threshold for cutting a dataset into groups.

### Why this is NOT the shortest-path problem

It's worth being explicit about this, because the vocabulary overlap ("weighted graph," "minimize
cost," "cheapest") makes it tempting to assume [[04-shortest-path|Chapter 4]]'s tools just carry
over. They don't, because the two problems are optimizing genuinely different objectives:

- **Shortest path** (Dijkstra, Bellman-Ford, Floyd-Warshall) minimizes the cost of getting from
  **one specific source** to **one specific destination** (or to every destination, in Dijkstra's
  single-source case, or every pair, in Floyd-Warshall's case) — but it always optimizes _from the
  point of view of a source_. The output is a set of paths, each one individually cheapest for its
  own source-destination pair.
- **MST** minimizes the **total** cost of one edge set that connects _everything to everything_,
  with no source in mind at all. There is no "from" node anywhere in the MST problem statement.

Because the objectives differ, the answers differ. Take a star-shaped graph — one central hub
connected to five other nodes, plus a few expensive direct edges between those outer nodes. Run
Dijkstra from the hub: the shortest-path tree is exactly the five hub-to-outer edges, because that's
already the cheapest way to reach each outer node from the hub. Now suppose the outer nodes also
happen to have very cheap edges directly connecting each one to its neighbor in a ring, cheaper than
routing through the hub twice — an MST computed over the _whole graph_ might prefer some of those
ring edges over some of the hub edges, if that lowers the _total_ weight summed across all V − 1
edges, even though it makes hub-to-outer-node travel for a couple of nodes slightly longer than the
direct hub edge would have been. The MST doesn't care that a specific node is now two hops from the
hub instead of one — it was never optimizing for the hub's point of view. It only cares that the sum
of all edges in the tree is as small as it can possibly be, globally. A tree that is optimal for
minimizing distance from one source is, in general, not the same tree as the one that is globally
cheapest to connect every node to every other node — two different objective functions over the same
graph, two different correct answers, neither one wrong for what it's actually optimizing.

There are two classical algorithms for MST, and they arrive at the (guaranteed-identical-weight)
answer via genuinely different greedy strategies: **Kruskal's** greedily processes edges in weight
order regardless of where in the graph they sit; **Prim's** greedily grows outward from a single
starting point. Both are direct descendants of the greedy paradigm previewed all the way back in
[[05-algorithm-design-principles|Part 01, Chapter 5]] — "a step where one choice is provably at
least as good as every alternative, with no need to look ahead." MST is one of the cleanest, most
honestly provable greedy problems in this entire book — no knapsack-style trap lurking underneath
it.

---

## Kruskal's Algorithm: Greedy Over Sorted Edges

**Kruskal's algorithm** is greedy over the _edge list_, independent of graph structure: sort every
edge in the graph by weight, ascending, then walk through that sorted list once, greedily adding
each edge to the growing MST **unless** it would create a cycle with edges already chosen — in which
case, skip it and move to the next edge. Stop once V − 1 edges have been accepted (equivalently,
once every vertex is connected).

```
sort all edges by weight, ascending
mst = empty set
for each edge (u, v, weight) in sorted order:
    if u and v are NOT already connected by edges in mst:
        add (u, v, weight) to mst
        union the components containing u and v
    # else: adding this edge would close a cycle — skip it
    if mst has V - 1 edges: stop early, done
```

### Why greedy works here (the exchange-argument intuition)

The claim that needs justifying: **the single cheapest edge in the entire graph can always safely be
part of _some_ minimum spanning tree.** Here's the informal argument. Suppose, for contradiction,
that the cheapest edge in the graph, call it `e = (u, v)`, is _not_ in some particular MST `T`.
Since `T` is a spanning tree, there's already some path between `u` and `v` inside `T` (spanning
trees connect everything). Adding `e` to `T` creates exactly one cycle — walk from `u` to `v` along
`T`'s existing path, then close the loop with `e`. Now remove any _other_ edge on that cycle (any
edge that isn't `e`) — removing one edge from a cycle can't disconnect anything, because the cycle
itself provided a redundant second route between the two halves it would otherwise split. The result
is still a spanning tree, still V − 1 edges, and its total weight changed by exactly
`weight(e) − weight(removed edge)`. Since `e` was chosen as the single cheapest edge in the _entire
graph_, `weight(e) ≤ weight(removed edge)` no matter which edge on the cycle got removed — so this
swap can only decrease the total weight, or leave it unchanged if there's a tie. It can never make
the tree more expensive. That means `T` either wasn't minimum to begin with, or `e` could be swapped
in for free — either way, there exists an MST containing `e`.

The same argument applies again at every subsequent step, just relative to what's already been
locked in: among all edges that don't close a cycle with the edges already accepted, the cheapest
one remaining can always be safely added, by the identical swap logic. That's the whole proof sketch
— Kruskal's never has to reconsider a decision once made, because no future information can ever
make an already-accepted edge look like a mistake in hindsight.

### The one piece of machinery this needs: "would this create a cycle?"

Checking whether adding edge `(u, v)` would create a cycle is exactly the question "are `u` and `v`
already connected by edges already accepted into the MST?" Answering that question efficiently, at
scale, across thousands of union operations, is the entire subject of
[[06-union-find-disjoint-set|Chapter 6, this Part]] — a structure purpose-built to answer "same
component?" in near-constant amortized time. This chapter doesn't need that theory yet. What follows
is a plain, un-optimized version of the same idea: a dict-based parent-pointer structure with basic
path compression, just enough to make Kruskal's correct and reasonably fast, without yet explaining
_why_ it's fast (that amortized-complexity argument — union by rank, path compression working
together — belongs entirely to the next chapter).

```python
class SimpleUnionFind:
    """A minimal parent-pointer union-find with path compression, but no union-by-rank.

    Good enough to make Kruskal's correct and reasonably efficient for this chapter. The full
    near-O(1)-amortized version, with union-by-rank and the complexity argument behind it,
    belongs to Chapter 6.
    """

    def __init__(self, vertices):
        self.parent = {v: v for v in vertices}

    def find(self, node):
        """Return the representative ("root") of node's component, compressing the path along the way."""
        if self.parent[node] != node:
            self.parent[node] = self.find(self.parent[node])  # path compression
        return self.parent[node]

    def union(self, a, b):
        """Merge the components containing a and b. Returns False if they were already the same
        component (i.e. merging would close a cycle) so the caller can skip the edge."""
        root_a, root_b = self.find(a), self.find(b)
        if root_a == root_b:
            return False  # already connected — adding this edge would create a cycle
        self.parent[root_a] = root_b
        return True


def kruskal_mst(vertices, edges):
    """Kruskal's minimum spanning tree.

    edges: list of (u, v, weight) tuples, undirected.
    Returns (mst_edges, total_weight).
    """
    uf = SimpleUnionFind(vertices)
    mst_edges = []
    total_weight = 0

    for u, v, weight in sorted(edges, key=lambda e: e[2]):
        if uf.union(u, v):  # True means u, v were in different components — no cycle
            mst_edges.append((u, v, weight))
            total_weight += weight
            if len(mst_edges) == len(vertices) - 1:
                break  # MST is complete — every remaining edge would only close a cycle

    return mst_edges, total_weight


# graph: vertices A-F, edges as (u, v, weight)
vertices = ["A", "B", "C", "D", "E", "F"]
edges = [
    ("A", "B", 4), ("A", "F", 2), ("B", "F", 5), ("B", "C", 6),
    ("F", "E", 3), ("C", "E", 4), ("C", "D", 3), ("E", "D", 7),
]
mst_edges, total_weight = kruskal_mst(vertices, edges)
# mst_edges == [("A", "F", 2), ("F", "E", 3), ("C", "D", 3), ("A", "B", 4), ("C", "E", 4)]
# total_weight == 16
```

`find` recurses up the parent chain and, on the way back out of the recursion, re-points every node
it visited directly at the root — the next `find` on any of those nodes is then O(1) instead of
re-walking the whole chain. This alone (without union-by-rank) already keeps trees fairly flat in
practice, which is why it's a reasonable "good enough for now" choice; the next chapter formalizes
exactly how much better union-by-rank makes it and why.

### Complexity

Sorting the edge list dominates: **O(E log E)**, where E is the number of edges. The main loop then
processes each edge once, and each union-find operation is close to O(1) with path compression (a
looser bound without union-by-rank, but still far cheaper than the sort). Since E is at most V² for
a simple graph, O(E log E) is also sometimes written O(E log V) — `log(V²) = 2 log V`, so the two
bounds differ only by a constant factor. Either notation is standard; the sort is unambiguously the
dominant cost either way.

---

## Prim's Algorithm: Greedy Frontier Growth

**Prim's algorithm** is greedy over the _frontier_, growing outward from a single starting vertex:
pick any vertex to start, and repeatedly extend the current tree by adding the single **cheapest
edge that connects some vertex already in the tree to some vertex not yet in it**. Repeat until
every vertex has been pulled in.

This is the same loop shape as Dijkstra's, and worth stating that explicitly because the code ends
up looking nearly identical, which is exactly what makes the two easy to confuse:

> Both algorithms repeatedly extract the cheapest candidate from a min-heap and expand outward from
> it. [[12-priority-queue|Part 05, Chapter 12]] built this extract-then-expand loop shape twice
> already (top-K, k-way merge) before the previous chapter ran it over a graph for Dijkstra. Prim's
> runs the _identical_ loop shape a fourth time. **The one thing that differs is what the heap entry
> means:** Dijkstra's heap holds `(cumulative distance from the source, node)` — the entry's
> priority is the total cost of the _entire path_ traveled so far to reach that node. Prim's heap
> holds `(weight of one edge, node)` — the entry's priority is the cost of the _single edge_
> crossing from the tree into that node, with zero memory of how far the tree has traveled overall
> to get there. That's the entire distinction: **cumulative path cost vs. single-edge cost.** Get
> this backwards — track cumulative cost in Prim's, or single-edge cost in Dijkstra's — and the code
> still runs and still produces _a_ spanning structure, just not the one the algorithm promises.

```
pick an arbitrary start vertex, mark it visited
push all edges out of the start vertex onto a min-heap, keyed by edge weight
mst = empty set
while heap is not empty and mst has fewer than V - 1 edges:
    (weight, u, v) = pop cheapest edge from heap
    if v is already visited: continue          # both endpoints already in the tree — would close a cycle
    mark v visited
    add (u, v, weight) to mst
    for each edge (v, w, edge_weight) where w is not yet visited:
        push (edge_weight, v, w) onto heap
```

```python
import heapq


def prim_mst(vertices, adjacency, start=None):
    """Prim's minimum spanning tree.

    adjacency: dict mapping vertex -> list of (neighbor, weight) tuples, undirected
               (each edge must appear on both endpoints' lists).
    Returns (mst_edges, total_weight).
    """
    if start is None:
        start = next(iter(vertices))

    visited = {start}
    mst_edges = []
    total_weight = 0

    # heap entries: (edge_weight, from_node, to_node) — priority is the SINGLE EDGE'S weight,
    # never a cumulative path cost. This is the one line that would make it Dijkstra if changed.
    frontier = [(weight, start, neighbor) for neighbor, weight in adjacency[start]]
    heapq.heapify(frontier)

    while frontier and len(mst_edges) < len(vertices) - 1:
        weight, u, v = heapq.heappop(frontier)
        if v in visited:
            continue  # both endpoints already in the tree — this edge would close a cycle

        visited.add(v)
        mst_edges.append((u, v, weight))
        total_weight += weight

        for neighbor, edge_weight in adjacency[v]:
            if neighbor not in visited:
                heapq.heappush(frontier, (edge_weight, v, neighbor))

    return mst_edges, total_weight


# same graph as the Kruskal's example, as an adjacency list (undirected: both directions listed)
adjacency = {
    "A": [("B", 4), ("F", 2)],
    "B": [("A", 4), ("F", 5), ("C", 6)],
    "C": [("B", 6), ("E", 4), ("D", 3)],
    "D": [("C", 3), ("E", 7)],
    "E": [("F", 3), ("C", 4), ("D", 7)],
    "F": [("A", 2), ("B", 5), ("E", 3)],
}
mst_edges, total_weight = prim_mst(list(adjacency.keys()), adjacency, start="A")
# mst_edges == [("A", "F", 2), ("F", "E", 3), ("A", "B", 4), ("E", "C", 4), ("C", "D", 3)]
# total_weight == 16
```

Note the `if v in visited: continue` check — the heap can and will accumulate stale entries: an edge
to a node that's already been pulled into the tree by some cheaper route in the meantime. Those
entries aren't removed from the heap when they go stale (a binary heap doesn't support efficient
arbitrary-element removal); they're left to be popped later and discarded on sight. This is the
exact same "lazy deletion" pattern Dijkstra's implementation relies on in the previous chapter —
cheaper to let a heap carry a bit of stale weight and filter on pop than to pay for true
decrease-key support.

### Complexity

Every vertex is visited once, and every edge is pushed onto the heap at most once from each of its
two endpoints — so at most O(E) heap pushes and pops, each O(log E) (equivalently O(log V), since E
≤ V², collapsing to the same constant-factor relationship as before). Total: **O(E log V)** with a
binary heap, matching Dijkstra's bound from the previous chapter for exactly the same structural
reason — same loop shape, same heap cost per operation.

---

## Kruskal's vs. Prim's: When to Reach for Which

Both algorithms are correct, both run in roughly O(E log V), and both are provably greedy by the
same exchange argument — this is not a "one is better" comparison. It's a comparison of what each
algorithm naturally _wants as input_, and that's almost always what decides which one to reach for
in practice:

|                         | Kruskal's                                                                                                                    | Prim's                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Natural input shape** | A flat edge list — needs every edge visible up front to sort it                                                              | An adjacency list/matrix — needs to enumerate a node's edges repeatedly as the frontier grows                                                                                                |
| **Greedy unit**         | The single globally cheapest _remaining edge_, anywhere in the graph                                                         | The cheapest edge _crossing the current frontier_ from tree to non-tree                                                                                                                      |
| **Where it shines**     | **Sparse graphs** (E close to V) — sorting a short edge list is cheap, and Union-Find overhead is small relative to the sort | **Dense graphs** (E close to V²) — repeatedly asking "what are this node's edges" is cheap when the graph is already stored that way, and there's no full-edge-list sort to pay for up front |
| **Mental model**        | "Which edge, anywhere, is safest to add next?"                                                                               | "Which node, adjacent to what I already have, is cheapest to pull in next?"                                                                                                                  |
| **Needs**               | Union-Find for the cycle check                                                                                               | A min-heap for the frontier (identical machinery to Dijkstra's)                                                                                                                              |

In practice, the deciding factor is usually **which representation the input already comes in**, not
a meaningful performance gap — both are O(E log V)-ish, and unless E is enormous relative to V (or
vice versa), the difference rounds to noise. If the problem hands over a list of edges (weighted
edge triples, as most textbook and interview problem statements do), Kruskal's needs no conversion.
If the problem hands over an adjacency list or matrix (as most real-world graph representations —
road networks, circuit layouts — naturally are), Prim's needs no conversion either. Choosing the one
that matches the input's native shape avoids paying for a representation conversion neither
algorithm's core logic actually requires.

---

## Worked Example: Both Algorithms, Same Graph

Both implementations above already ran against the same six-vertex graph:

```
        4         6
   A ------- B ------- C
   |         |         |
  2|        5|        4|   3
   |         |         |  /
   F ------- +          D
   |  3               /
   |                 / 7
   E ---------------+
```

Edge list (undirected, weight in parentheses): A–B (4), A–F (2), B–F (5), B–C (6), F–E (3), C–E (4),
C–D (3), E–D (7).

### Kruskal's walk, step by step

Sort all 8 edges by weight ascending: A–F(2), F–E(3), C–D(3), A–B(4), C–E(4), B–F(5), B–C(6),
E–D(7).

| Step | Edge considered | Components before                               | Cycle? | Decision                                                                        |
| ---- | --------------- | ----------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| 1    | A–F (2)         | `{A}` `{F}` — different                         | No     | **Add.** Components merge: `{A,F}`                                              |
| 2    | F–E (3)         | `{A,F}` `{E}` — different                       | No     | **Add.** Components merge: `{A,F,E}`                                            |
| 3    | C–D (3)         | `{C}` `{D}` — different                         | No     | **Add.** Components merge: `{C,D}`                                              |
| 4    | A–B (4)         | `{A,F,E}` `{B}` — different                     | No     | **Add.** Components merge: `{A,F,E,B}`                                          |
| 5    | C–E (4)         | `{C,D}` `{A,F,E,B}` — different                 | No     | **Add.** Components merge: `{A,F,E,B,C,D}` — all 6 vertices, 5 edges. **Stop.** |
| —    | B–F (5)         | never reached — MST already complete at 5 edges |        |                                                                                 |

Kruskal's MST: **A–F(2), F–E(3), C–D(3), A–B(4), C–E(4)** — total weight **16**.

### Prim's walk, step by step (starting from A)

| Step | Tree so far   | Frontier candidates (edge weight) | Cheapest picked                                                                         | New tree                                    |
| ---- | ------------- | --------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1    | `{A}`         | A–B(4), A–F(2)                    | A–F (2)                                                                                 | `{A,F}`                                     |
| 2    | `{A,F}`       | A–B(4), F–B(5), F–E(3)            | F–E (3)                                                                                 | `{A,F,E}`                                   |
| 3    | `{A,F,E}`     | A–B(4), F–B(5), E–C(4), E–D(7)    | A–B (4) _(ties with E–C(4); either valid tie-break order still yields weight-16 total)_ | `{A,F,E,B}`                                 |
| 4    | `{A,F,E,B}`   | B–C(6), E–C(4), E–D(7)            | E–C (4)                                                                                 | `{A,F,E,B,C}`                               |
| 5    | `{A,F,E,B,C}` | C–D(3), E–D(7)                    | C–D (3)                                                                                 | `{A,F,E,B,C,D}` — all 6 vertices. **Done.** |

Prim's MST: **A–F(2), F–E(3), A–B(4), C–E(4), C–D(3)** — total weight **16**.

### Same total, different edge-selection order

Both trees land on **total weight 16**, and in this particular graph both also happen to select the
identical five edges — just in a different order (Kruskal's processes by global weight rank
regardless of position in the graph; Prim's processes by proximity to the growing frontier). That
edge-order difference is the point: Kruskal's step 3 picks C–D purely because it's the
third-cheapest edge _anywhere_, with no regard for whether C or D are anywhere near the tree being
built by steps 1 and 2; Prim's would never consider C–D at all until C or D actually borders the
current tree. Two genuinely different selection philosophies, same final answer.

That final answer being identical is not a coincidence specific to this graph — a graph's **MST
weight is always unique**, even on graphs where it isn't obvious in advance, because any two
minimum-weight spanning trees can be shown (via the same exchange argument used to justify greedy
correctness) to be swappable into each other without changing total weight. What is _not_ always
unique is the **specific set of edges** chosen when weights tie: if two edges shared the exact same
weight and both were valid choices at some step, a different tie-breaking rule (or a different
starting vertex for Prim's) could produce a different — but equally minimum-weight — tree. Step 3 of
the Prim's walk above shows exactly this: A–B(4) and E–C(4) tied, and either order is a legitimate
minimum spanning tree.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
