---
title: "8 — Bridges & Articulation Points"
description: "Deriving DFS discovery time and low-link values from scratch to find, in one O(V + E) pass, every edge and every vertex whose removal would disconnect an undirected graph."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-46"
relations:
  - slug: data-structures-algorithms/06-graphs/07-strongly-connected-components/07-strongly-connected-components
    kind: related
---

# 8 — Bridges & Articulation Points

Every network design review eventually asks some version of the same question: if this one link goes
down, does the network split in two, or is there another way around? And a step past that: if this
one router dies, taking every link through it down with it, what actually gets cut off?
[[07-strongly-connected-components|Chapter 7]] built the low-link machinery to answer a related but
different question — which vertices in a _directed_ graph can all reach each other — and named
Tarjan's technique as a faster alternative to Kosaraju's two-pass approach without deriving it. This
chapter derives it, from scratch, in the simpler _undirected_ setting, where the payoff is sharper
and more literal: a single DFS pass identifies every edge and every vertex that is a genuine single
point of failure for the whole graph — a **bridge** if it's an edge, an **articulation point** if
it's a vertex — all at once, in O(V + E), without simulating a single failure by hand.

---

## Definitions: Bridges and Articulation Points

Start from **connected components**: a maximal set of vertices where every pair has some path
between them. A connected graph has exactly one component. Both definitions in this chapter are
stated in terms of what removal does to that count.

A **bridge** (also called a **cut edge**) is an edge whose removal increases the number of connected
components. In a connected graph, removing a bridge splits it into exactly two pieces — one on each
side of the cut. In a graph that already has several components, a bridge is defined relative to the
piece it sits in: removing it splits _that piece_ into two, increasing the overall component count
by one.

An **articulation point** (also called a **cut vertex**) is a vertex whose removal — along with
every edge incident to it — increases the number of connected components. Removing a single
articulation point can fragment its surrounding neighborhood into more than two pieces at once, not
just two, if enough separate subgraphs were only connected to each other through that one vertex.
The worked example later in this chapter has exactly this case.

Both concepts are formal names for the same practical concern: **redundancy, or the lack of it.**

- A bridge is a connection with no alternate route. Every other edge in the graph lies on at least
  one cycle — meaning if you delete it, some other path still gets you from one side to the other. A
  bridge lies on no cycle at all; it is the only way across.
- An articulation point is a node whose failure fragments the network around it. Every other vertex
  can be removed and the rest of the graph closes around the gap through some other route. An
  articulation point is the one seam holding two or more otherwise-unconnected regions together.

Two immediate consequences worth naming before the algorithm, because they'll resurface in the
implementation:

- A **self-loop** (an edge from a vertex to itself) can never be a bridge — removing it changes
  nothing about which vertices can reach which other vertices.
- A **parallel edge** (two distinct edges between the same pair of vertices) can never make either
  copy a bridge — the other copy is, by itself, a complete alternate route between those two
  vertices. This matters later: an implementation that isn't careful about how it skips the "edge
  back to the parent" during DFS can miscount a parallel edge as if it were the same edge twice, and
  wrongly conclude a genuine alternate route doesn't exist.

---

## The Core Technique: Discovery Time and Low-Link

Run a DFS from an arbitrary starting vertex. As the traversal proceeds, maintain two values for
every vertex:

- **`disc[v]`** — the **discovery time**: the order in which `v` was first visited. This is nothing
  more than a counter, starting at 0, incremented every time DFS visits a brand-new vertex. It's a
  timestamp with no other meaning attached — but it gives every vertex a fixed position in the
  traversal order that never changes once assigned.
- **`low[v]`** — the **low-link value**: the lowest discovery time reachable from anywhere in `v`'s
  DFS subtree (`v` itself, plus every descendant DFS eventually visits through `v`) by using **at
  most one back-edge** — an edge, found in the graph but not part of the DFS tree, connecting some
  node in that subtree to one of `v`'s ancestors.

`low[v]` always starts equal to `disc[v]` (with no information yet, the lowest reachable time from
`v`'s subtree is just `v`'s own discovery time) and only ever gets pulled _downward_ as DFS
discovers two kinds of shortcuts:

1. **A direct back-edge from `v` itself.** If `v` has an edge to some already-visited vertex `w`
   that isn't its DFS-tree parent, that's a back-edge, and `low[v] = min(low[v], disc[w])`.
2. **A shortcut surfaced by one of `v`'s own children.** If `c` is a child of `v` in the DFS tree,
   and `c`'s subtree contains a back-edge reaching further up the tree than `v` itself, that
   shortcut is already folded into `low[c]` by the time `c`'s recursive call returns. Pulling
   `low[v] = min(low[v], low[c])` inherits it.

That second rule is what makes "at most one back-edge" not actually a restriction. A shortcut from
deep inside `v`'s subtree, reached by chaining through several nested back-edges, never needs to be
discovered by `v` directly looking several hops away — it arrives pre-folded, one recursive `min` at
a time, because every descendant already computed its own `low[]` the same way before returning
control to its parent. By the time `v`'s loop over its children finishes, `low[v]` already reflects
the single best shortcut available anywhere in the entire subtree, however many edges deep it was
found.

**Why there are only two kinds of non-tree edges to worry about.** In a **directed** graph, DFS can
produce four categories of edge — tree, back, forward, and cross — and telling them apart is real
bookkeeping. An **undirected** graph DFS never produces forward or cross edges. Every edge that
isn't a tree edge is a back-edge to an ancestor, full stop. The reason: an edge is undirected, so it
appears in both endpoints' adjacency lists. If DFS is standing at vertex `u` and sees a neighbor `w`
that's already visited and isn't `u`'s immediate parent, that visit to `w` must have happened either
before `u` started (making `w` an ancestor of `u`, since `u` was reached by extending the very path
DFS was on when it visited `w`) or as part of exploring one of `u`'s own descendants later (which is
impossible, since `u` hasn't finished being processed yet — DFS hasn't returned control past `u`).
There is no way for `w` to sit in some unrelated, already-completed branch the way a cross edge
would require in a directed graph. This is why, in the implementation below,
`low[u] = min(low[u], disc[w])` is always safe to use directly — `w` is guaranteed to be an
ancestor, not some arbitrary already-visited vertex whose relationship to `u` is unclear.

---

## The Bridge Condition

Let `(u, v)` be a tree edge, with `v` discovered as `u`'s child during DFS. That edge is a **bridge
if and only if `low[v] > disc[u]`.**

Read that condition for exactly what it says: `low[v]` is the earliest discovery time reachable from
anywhere in `v`'s subtree using one back-edge. If `low[v] > disc[u]`, that means **nothing** in
`v`'s subtree — not `v` itself, not any child, grandchild, or deeper descendant — has a single
back-edge that reaches `u` or anything discovered before `u`. Every back-edge findable from that
entire subtree lands no higher than somewhere strictly after `u` was discovered — which, given the
undirected-DFS fact above (every non-tree edge is a back-edge to an ancestor), means every such
back-edge either stays inside the subtree or loops back to `v` itself, never escaping past `u`.

If that's true, the **only** way to get from anywhere in `v`'s subtree back to `u`'s side of the
graph is the tree edge `(u, v)` itself. Delete it, and `v`'s entire subtree — cut off from every
other route out — becomes its own disconnected piece. That's exactly the definition of a bridge.

The converse direction is just as direct: if `low[v] <= disc[u]`, some vertex in `v`'s subtree has a
back-edge reaching `u` or an ancestor of `u`. That back-edge is a second, independent route from
`v`'s side to `u`'s side of the graph — one that survives even after `(u, v)` is removed. An edge
with a surviving alternate route is, by definition, not a bridge.

One immediate corollary worth stating explicitly, because the worked example below leans on it: if
`(u, v)` is a bridge, then whichever endpoint has degree greater than 1 (i.e., isn't a lone leaf) is
necessarily an articulation point — removing it strands the leaf, or the whole subtree, on the other
side. A bridge's non-leaf endpoints are always cut vertices. The reverse is not true: a cut vertex
doesn't require an adjacent bridge at all, which is exactly the subtlety the next section — and the
worked example — makes precise.

---

## The Articulation Point Condition

Unlike the bridge condition, the articulation-point condition splits into two cases, because the DFS
**root** has no parent and therefore no ancestor to be cut off from — it needs its own rule.

**Case 1 — the root.** The DFS root is an articulation point if and only if it has **two or more
children** in the DFS tree. Each child's subtree, by construction, has no route back to any other
child's subtree except by passing through the root — if there were such a route, it would show up as
a back-edge connecting the two subtrees directly, but a back-edge in an undirected DFS only ever
connects a vertex to one of _its own_ ancestors, and the root is the only vertex both subtrees share
as an ancestor. Remove the root, and every child subtree that isn't the only one becomes an isolated
island, disconnected from every other child subtree. One child means there's nothing to separate the
root from — removing it just leaves that one subtree as the whole remaining graph, still fully
connected on its own.

**Case 2 — any non-root vertex `u`.** `u` is an articulation point if and only if it has **at least
one child `v` such that `low[v] >= disc[u]`.**

Note the operator: `>=`, not the strict `>` the bridge condition uses. This is a subtle but load-
bearing difference, and it's worth being precise about why. `low[v] >= disc[u]` means the best
shortcut reachable from `v`'s subtree reaches no higher than `u` itself — it might reach exactly `u`
(`low[v] == disc[u]`), or it might not even reach that far (`low[v] > disc[u]`, the same condition
that makes `(u, v)` a bridge). In **either** case, `v`'s subtree cannot survive `u`'s removal:

- If `low[v] > disc[u]` — the bridge case — the only route out of `v`'s subtree was the edge
  `(u, v)`, which vanishes along with `u`. Stranded either way.
- If `low[v] == disc[u]` — the edge `(u, v)` is _not_ a bridge, because some vertex in `v`'s subtree
  does have a back-edge, and that back-edge does reach all the way back to `u`. But that back-edge
  reaches `u` **itself**, not past `u` to one of `u`'s ancestors. The instant `u` is removed, that
  back-edge's destination is gone too — it was never a route to the rest of the graph, only a route
  back to the very vertex now missing. `v`'s subtree is just as stranded as if `(u, v)` had been a
  bridge outright.

Only `low[v] < disc[u]` — strictly less, reaching an actual ancestor of `u` rather than `u` itself —
provides a route that survives `u`'s removal, because that ancestor is still there, connected to the
rest of the graph by whatever path reached it in the first place. This is exactly why the
articulation-point test uses `>=` where the bridge test uses `>`: "reaching `u` exactly" is enough
to save the edge `(u, v)` from being a bridge (there is a cycle, so no single edge is critical), but
it is **not** enough to save vertex `u` from being an articulation point (that one cycle still
routes entirely through `u`, so removing `u` removes the only shared meeting point).

A useful way to hold both conditions in one picture: the bridge condition (`low[v] > disc[u]`) is
the stricter of the two — a single shortcut back to `u` itself is already enough to rule a bridge
out. The articulation-point condition (`low[v] >= disc[u]`) is looser — it still flags `u` even when
that same shortcut-to-`u`-itself is the best `v`'s subtree can do, because reaching `u` doesn't help
once `u` is the vertex being removed. A bridge is ruled out by an escape route to `u` or anywhere
before it; an articulation point is ruled out only by an escape route strictly before `u` — reaching
the doomed vertex itself doesn't count.

---

## Full Implementation

One DFS computes `disc`, `low`, bridges, and articulation points together — there's no reason to run
separate passes for edges and for vertices, since both conditions are checked off the exact same
`low[]` values as they're produced.

```python
from typing import Dict, List, Set, Tuple


def find_bridges_and_articulation_points(
    graph: Dict[int, List[int]],
) -> Tuple[Set[Tuple[int, int]], Set[int]]:
    """Single DFS pass over an undirected graph, O(V + E).

    graph: adjacency list, graph[u] = list of neighbors of u. Assumes no
           parallel edges between the same pair of vertices (see the note
           below on why that assumption matters to the parent-skip logic).

    Returns (bridges, articulation_points):
      bridges              -- set of (u, v) with u < v, each a cut edge
      articulation_points   -- set of vertices, each a cut vertex
    """
    disc: Dict[int, int] = {}
    low: Dict[int, int] = {}
    visited: Set[int] = set()
    bridges: Set[Tuple[int, int]] = set()
    articulation_points: Set[int] = set()
    timer = [0]  # mutable counter closed over by the nested DFS

    def dfs(u: int, parent) -> None:
        visited.add(u)
        disc[u] = low[u] = timer[0]
        timer[0] += 1
        children = 0            # DFS-tree children of u -- feeds the root's rule
        skipped_parent = False  # consume exactly one edge back to the parent

        for v in graph[u]:
            if v == parent and not skipped_parent:
                skipped_parent = True
                continue  # this is the tree edge (parent, u) traversed backward

            if v not in visited:
                children += 1
                dfs(v, u)
                low[u] = min(low[u], low[v])

                # Bridge condition: nothing in v's subtree reaches u or earlier.
                if low[v] > disc[u]:
                    bridges.add((min(u, v), max(u, v)))

                # Articulation point, non-root case. Note >=, not >: reaching
                # u itself doesn't save v's subtree once u is removed.
                if parent is not None and low[v] >= disc[u]:
                    articulation_points.add(u)
            else:
                # Back-edge to an already-visited vertex. In undirected DFS
                # this vertex is guaranteed to be an ancestor of u (no cross
                # edges are possible), so disc[v] is a valid direct shortcut.
                # A genuine parallel edge back to the parent lands here too,
                # correctly counted as a real alternate route rather than
                # silently skipped a second time.
                low[u] = min(low[u], disc[v])

        # Root case: articulation iff it has 2+ DFS-tree children.
        if parent is None and children >= 2:
            articulation_points.add(u)

    for start in graph:
        if start not in visited:
            dfs(start, None)

    return bridges, articulation_points
```

Two implementation details worth calling out explicitly, since they're exactly the kind of thing
that produces a quietly wrong answer instead of a crash:

- **The parent is skipped exactly once, not every time it appears.** `skipped_parent` consumes the
  single tree edge back to the parent the first time it's seen. If `u` and its parent happen to be
  joined by a _second_, parallel edge, that second occurrence falls through to the `else` branch and
  is correctly treated as a genuine back-edge — because it is one: it's real redundancy, and
  treating it as "just the parent again" would wrongly make `(parent, u)` look like a bridge when a
  perfectly good alternate route sits right next to it.
- **Recursion depth.** This implementation uses Python's call stack directly, so a very long DFS
  chain (a graph that's mostly one long path) can hit Python's default recursion limit before it
  hits any algorithmic limit. For graphs where that's a real concern, the same logic converts to an
  explicit-stack iterative DFS that tracks `(vertex, parent, iterator-position)` triples instead of
  relying on the call stack — mechanically more code, no change to the underlying conditions.

---

## Worked Example

Nine vertices, laid out as two triangles joined by a bridge, with a third triangle and a leaf both
hanging off the second triangle's far vertex:

```
edges: 0-1, 1-2, 2-0,              (triangle A: 0, 1, 2)
       2-3,                        (bridge candidate)
       3-4, 4-5, 5-3,              (triangle B: 3, 4, 5)
       5-6, 6-7, 7-5,              (triangle C: 5, 6, 7 -- attached at vertex 5)
       5-8                         (leaf, bridge candidate)
```

```
adj[0] = [1, 2]
adj[1] = [0, 2]
adj[2] = [0, 1, 3]
adj[3] = [2, 4, 5]
adj[4] = [3, 5]
adj[5] = [3, 4, 6, 7, 8]
adj[6] = [5, 7]
adj[7] = [6, 5]
adj[8] = [5]
```

Run DFS from vertex `0`, visiting each vertex's neighbors in the order listed above. Tracing
`disc[]` and `low[]` as the recursion unwinds:

| Vertex | `disc` | Back-edges found from it directly                                                           | Children's `low` folded in | Final `low` |
| ------ | -----: | ------------------------------------------------------------------------------------------- | -------------------------- | ----------: |
| 0      |      0 | (root — none)                                                                               | `low[1] = 0`               |           0 |
| 1      |      1 | (edge to 0 is the tree-parent edge)                                                         | `low[2] = 0`               |           0 |
| 2      |      2 | back-edge to 0 → `disc[0] = 0`                                                              | `low[3] = 3`               |           0 |
| 3      |      3 | back-edge to 5 (revisited) → `disc[5] = 5` (no improvement)                                 | `low[4] = 3`               |           3 |
| 4      |      4 | none new                                                                                    | `low[5] = 3`               |           3 |
| 5      |      5 | back-edge to 3 → `disc[3] = 3`; back-edge to 7 (revisited) → `disc[7] = 7` (no improvement) | `low[6] = 5`, `low[8] = 8` |           3 |
| 6      |      6 | none new                                                                                    | `low[7] = 5`               |           5 |
| 7      |      7 | back-edge to 5 → `disc[5] = 5`                                                              | (leaf in DFS tree)         |           5 |
| 8      |      8 | none new                                                                                    | (leaf in DFS tree)         |           8 |

**Checking the bridge condition, `low[v] > disc[u]`, for every tree edge:**

- `(0, 1)`: `low[1] = 0 > disc[0] = 0`? No. Not a bridge — `0-1-2-0` is a cycle.
- `(1, 2)`: `low[2] = 0 > disc[1] = 1`? No. Not a bridge — same cycle.
- `(2, 3)`: `low[3] = 3 > disc[2] = 2`? **Yes.** `(2, 3)` is a bridge.
- `(3, 4)`: `low[4] = 3 > disc[3] = 3`? No. Not a bridge — `3-4-5-3` is a cycle.
- `(4, 5)`: `low[5] = 3 > disc[4] = 4`? No. Not a bridge — same cycle.
- `(5, 6)`: `low[6] = 5 > disc[5] = 5`? No. Not a bridge — `5-6-7-5` is a cycle.
- `(6, 7)`: `low[7] = 5 > disc[6] = 6`? No. Not a bridge — same cycle.
- `(5, 8)`: `low[8] = 8 > disc[5] = 5`? **Yes.** `(5, 8)` is a bridge.

**Bridges: `{(2, 3), (5, 8)}`** — exactly the two edges that don't sit on any cycle: the join
between the two main triangles, and the lone leaf's only connection.

**Checking the articulation-point condition, `low[v] >= disc[u]`, for every non-root vertex with a
child:**

- `1` (child `2`): `low[2] = 0 >= disc[1] = 1`? No. Not an articulation point via this child.
- `2` (child `3`): `low[3] = 3 >= disc[2] = 2`? **Yes.** `2` is an articulation point.
- `3` (child `4`): `low[4] = 3 >= disc[3] = 3`? **Yes.** `3` is an articulation point.
- `4` (child `5`): `low[5] = 3 >= disc[4] = 4`? No. Not an articulation point.
- `5` (child `6`): `low[6] = 5 >= disc[5] = 5`? **Yes.** `5` is an articulation point (via the
  `{6, 7}` side).
- `5` (child `8`): `low[8] = 8 >= disc[5] = 5`? **Yes.** `5` qualifies a second, independent way.
- `6` (child `7`): `low[7] = 5 >= disc[6] = 6`? No. Not an articulation point.

**Root check:** `0` has exactly one DFS-tree child (`1`) — everything else was reached through `1`'s
subtree, not as a second direct child of `0`. One child means `0` is **not** an articulation point:
deleting it leaves the rest of the graph, minus one vertex, still fully connected through the `1-2`
edge.

**Articulation points: `{2, 3, 5}`.**

This example is deliberately built to separate two things that are easy to conflate. `2` and `3` are
both articulation points **and** both endpoints of a bridge — the expected case, since a bridge's
non-leaf endpoint is always a cut vertex (the corollary from the previous section). Vertex `5` is
the more interesting case: it qualifies as an articulation point **twice, for two unrelated
reasons**. One qualification comes from the bridge `(5, 8)` — the expected mechanism. The other
comes entirely from the `{6, 7}` triangle: none of `5-6`, `6-7`, or `7-5` is individually a bridge
(that triangle is its own little cycle, fully redundant internally), and yet `5` is still the single
shared vertex holding that whole triangle onto the rest of the graph. Delete `5`, and `{6, 7}`
becomes its own island even though no single edge failure could ever have caused that — only the
vertex failure can. Brute-force removal confirms it concretely: deleting vertex `5` alone splits
this nine-vertex graph into **three** separate pieces at once — `{0, 1, 2, 3, 4}`, `{6, 7}`, and
`{8}` — which is exactly the "an articulation point can fragment a neighborhood into more than two
islands" case named in the definitions section, not a two-piece split like every bridge here
produces.

Running the implementation above against this exact adjacency list reproduces every value in the
table and both result sets:

```python
adj = {
    0: [1, 2], 1: [0, 2], 2: [0, 1, 3], 3: [2, 4, 5], 4: [3, 5],
    5: [3, 4, 6, 7, 8], 6: [5, 7], 7: [6, 5], 8: [5],
}
bridges, articulation_points = find_bridges_and_articulation_points(adj)
print(sorted(bridges))              # [(2, 3), (5, 8)]
print(sorted(articulation_points))  # [2, 3, 5]
```

---

## Real-World Framing

**Network reliability.** A bridge in a physical or logical network topology is a link with no
redundant path underneath it — the single fiber run, the single uplink, the single peering
connection whose failure partitions the network rather than just degrading it. Running this
algorithm against a network's topology graph (nodes are devices, edges are physical or logical
links) surfaces every such link before it fails in production, which is a fundamentally different
posture than discovering it during an outage. The distinction from an articulation point matters
operationally, too: a bridge failure is recoverable by adding one redundant link across exactly that
cut; an articulation-point failure (a core router or switch going down) can fragment the network
into several pieces at once — as vertex `5` did in the worked example — and no single new link fixes
that, because the fragility was never in one edge, it was in a shared chokepoint device.

**Critical infrastructure identification.** The same graph shape shows up outside networking
wherever a system is built from nodes and connecting links with finite redundancy. A power grid
modeled as substations (vertices) and transmission lines (edges) has its own bridges — transmission
lines whose failure genuinely islands part of the grid, not just one that trips a breaker with a
backup route standing by — and its own articulation points — substations that, if they go down, take
an entire downstream region with them regardless of which specific line into that substation failed.
A road network has the same structure: a bottleneck bridge or tunnel is a literal graph bridge, and
a single intersection that every route through a region is forced to pass through is an articulation
point, the kind of chokepoint that shows up in evacuation planning and traffic resilience studies
precisely because of this property, not despite it.

**Social network analysis.** Model people as vertices and relationships as edges, and a bridge is
the single connection whose removal splits a community into two groups with no other link between
them — the sociological "weak tie" that, unlike the dense clustering inside each group, is the only
thing keeping the two groups in the same connected network at all. An articulation point is the
person whose departure (not just one relationship ending, but the person themselves leaving) would
fragment the surrounding social structure into multiple disconnected clusters — the broker sitting
at a structural hole between groups that otherwise don't talk to each other directly. Both are
findable with the exact same DFS pass over the exact same kind of graph; the only thing that changes
between "network reliability" and "social network fragility" is what the vertices and edges are
labeled.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
