---
title: "7 — Strongly Connected Components"
description: "Kosaraju's two-pass DFS algorithm for finding maximal strongly connected components in a directed graph, the finish-time argument for why it works, and Tarjan's single-pass low-link alternative."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-45"
relations:
  - slug: data-structures-algorithms/06-graphs/03-topological-sorting/03-topological-sorting
    kind: related
  - slug: data-structures-algorithms/06-graphs/08-bridges-and-articulation-points/08-bridges-and-articulation-points
    kind: related
---

# 7 — Strongly Connected Components

[[03-topological-sorting|Chapter 3]] only worked because the graph had no cycles — that was the
load-bearing assumption behind every claim it made about finish order. This chapter asks what
happens the moment that assumption is dropped. Real directed graphs are full of cycles: a web crawl
has pages linking back to pages that link to them; a call graph has mutual recursion; a dependency
graph that's supposed to be acyclic sometimes isn't, and the bug report is "why does installing
package A eventually try to reinstall package A." None of chapter 3's machinery survives contact
with a cycle unmodified. What this chapter builds instead is a way to find exactly where the cycles
are — not as individual loops, but as the largest possible clumps of mutual reachability — and, once
found, to collapse each clump down to a single node and get a DAG back. Topological sort's world,
recovered from a graph that didn't start out obeying its rules.

---

## The Definition: Mutual Reachability

A **strongly connected component (SCC)** of a directed graph is a maximal set of vertices such that,
for every pair of vertices `u` and `v` in the set, there is a directed path from `u` to `v` **and**
a directed path from `v` to `u`. Both directions, both times, using only edges followed in their
actual pointed direction — walking an edge backwards doesn't count.

Two words in that definition carry all the weight, and it's worth separating them cleanly:

- **Mutual reachability.** Not "connected" in the loose sense of "you can get from one to the other
  somehow." Specifically: `u` can reach `v`, and, independently, `v` can reach `u`. A one-way path
  is not enough. If `u -> v` exists but nothing gets you back from `v` to `u`, the two vertices are
  **not** in the same SCC no matter how directly connected they look on a diagram.
- **Maximal.** Not just any set with the mutual-reachability property — the _largest_ such set that
  can't be extended by adding one more vertex without breaking the property. `{A, B}` might satisfy
  mutual reachability, but if some third vertex `C` is also mutually reachable with both `A` and
  `B`, then `{A, B}` was never an SCC — it was a subset of one. An SCC is the property pushed as far
  as it will go.

That maximality clause is what makes SCCs a genuine _partition_ of the vertex set rather than an
overlapping mess of candidate cliques. Mutual reachability is an **equivalence relation**: it's
reflexive (a zero-length path from any vertex to itself trivially exists), symmetric by definition
(the "mutual" requirement builds symmetry in directly), and transitive (if `u` and `v` are mutually
reachable, and `v` and `w` are mutually reachable, then `u` can reach `w` by walking
`u -> ... -> v -> ... -> w`, and `w` can reach `u` by the mirror path — so `u` and `w` are mutually
reachable too). Any equivalence relation partitions its domain into disjoint equivalence classes,
and that's exactly what SCCs are: every vertex belongs to **exactly one** SCC, the SCCs never
overlap, and together they cover every vertex in the graph — including a vertex with no cycle
through it at all, which simply forms an SCC of size one, containing just itself.

A directed cycle is the basic building block of any _nontrivial_ SCC (size greater than one):
`A -> B -> C -> A` makes `{A, B, C}` mutually reachable, because walking forward around the cycle
gets you from any one of them to any other. But a nontrivial SCC doesn't have to be a single clean
cycle — it can be a tangle of several overlapping cycles sharing vertices, extra chords cutting
across, vertices with multiple ways in and out — as long as the _net effect_ is that every vertex in
the tangle can still reach every other vertex in it and get back. The definition only cares about
the end result, mutual reachability, not the shape that produced it.

---

## Contrast With Plain Connectivity

[[02-graph-traversal|Chapter 2]]'s connected components were built on an undirected graph, where
every edge already runs both ways by definition — an edge `{u, v}` means `u` and `v` can reach each
other directly, full stop, because there's no such thing as direction to disagree about. Two
vertices land in the same connected component the moment **some** path connects them, in either
sense of "either sense," because there's only one sense.

A directed graph removes that free symmetry. An edge `u -> v` says nothing at all about whether `v`
can get back to `u` — that has to be established independently, by finding an actual path (possibly
a long, indirect one) running the other way. This is why SCCs need their own definition instead of
inheriting chapter 2's: "some path connects them" is the wrong bar for a directed graph. The right
bar is "a path exists in each direction," and those are two separate claims that can each
independently be true or false.

It's worth naming the undirected fallback explicitly, because it's a common (and legitimate) point
of confusion: if you strip the direction off every edge in a directed graph and then run chapter 2's
ordinary connected-components algorithm, you get what's usually called the graph's **weakly
connected components** — groups of vertices connected by _some_ path if direction didn't matter.
Weakly connected components are always at least as large as (never smaller than) the strongly
connected components they contain, because dropping the direction requirement can only make more
pairs of vertices count as connected, never fewer. A single weakly connected component can — and
usually does — contain several distinct SCCs stitched together by one-way edges.

This gives a clean, sharp fact about DAGs specifically: **a DAG has no nontrivial SCCs.** Every SCC
in a DAG is a single vertex, alone. The reasoning is immediate from the definition of "acyclic": if
some SCC in a DAG contained two or more vertices, those vertices would be mutually reachable —
meaning a path exists from `u` to `v` _and_ a path from `v` to `u` — and concatenating those two
paths produces a cycle running through both of them. A DAG has no cycles, by definition, so no such
SCC can exist. Every DAG vertex is therefore its own trivial, size-one SCC.

That fact quietly reframes what this chapter is really for. Topological sort assumed the input was
already a DAG and would either produce an ordering or (in the safe version) detect the cycle and
refuse. This chapter's algorithms don't require that assumption — they work on **any** directed
graph, cyclic or not, and they tell you exactly which vertices form the cyclic tangles standing in
the way of a topological order. Chapter 3 said what to do once the graph is a DAG; this chapter is
how to get a DAG out of a graph that isn't one yet — collapse every SCC down to a single super-node,
and (as the worked example below shows concretely) what's left over is guaranteed to be acyclic.

---

## Kosaraju's Algorithm

**Kosaraju's algorithm** finds every SCC in a directed graph in three steps, and the first of those
three steps is not new — it's chapter 3's postorder finish-time mechanism, reused without
modification.

**Step 1 — DFS over the entire graph, recording finish order.** Run a DFS that visits every vertex
(starting a fresh DFS from any not-yet-visited vertex, exactly like chapter 3's outer loop), and
every time a vertex has no more unvisited neighbors left to explore, append it to a list. This is
_literally_ `topological_sort_dfs`'s inner mechanism from chapter 3, with one difference: chapter 3
reversed the list at the end because it wanted a topological order back. Kosaraju's needs the
**raw**, un-reversed finish order — the reversal happens later, folded into how step 3 walks the
list.

```python
def _dfs_finish_order(graph: dict[str, list[str]]) -> list[str]:
    """
    Exactly chapter 3's DFS postorder mechanism, minus the final
    reversal. graph: adjacency list, node -> list of nodes it points to.
    """
    visited = set()
    finish_order = []  # a node lands here only once every neighbor
                        # reachable from it has already finished

    def dfs(node):
        visited.add(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                dfs(neighbor)
        finish_order.append(node)

    for node in graph:
        if node not in visited:
            dfs(node)

    return finish_order
```

This works completely unchanged even though the graph is no longer assumed acyclic — nothing about
recording a finish time requires the DAG assumption. It's only chapter 3's _interpretation_ of that
finish order (reverse it, get a topological order) that depended on acyclicity. Kosaraju's uses the
same raw numbers for a different purpose.

**Step 2 — build the transpose.** The **transpose** of a directed graph (sometimes written `G^T`) is
the same vertex set with every edge reversed: if the original graph has an edge `u -> v`, the
transpose has `v -> u` instead, and nothing else changes. Building it is one pass over every edge:

```python
def _transpose(graph: dict[str, list[str]]) -> dict[str, list[str]]:
    """Every edge reversed; same vertex set, same edge count."""
    transposed: dict[str, list[str]] = {node: [] for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            transposed[neighbor].append(node)
    return transposed
```

Two structural facts about the transpose matter for everything that follows, and both are worth
stating explicitly rather than left implicit: **reachability flips exactly.** `u` can reach `v` in
the original graph if and only if `v` can reach `u` in the transpose — every step of a path just
runs backwards. And as a direct consequence, **mutual reachability is unchanged.** If `u` and `v`
are mutually reachable in the original graph (a path each way), they're still mutually reachable in
the transpose — the two paths just swap roles. SCCs of a graph and SCCs of its transpose are the
_same sets of vertices_, grouped identically. The transpose doesn't change what "one SCC" means; it
changes what an ordinary single DFS run will do when it hits one.

**Step 3 — DFS on the transpose, in decreasing finish-time order.** Walk the finish-order list from
step 1 **backwards** (highest finish time first — the exact same "reverse the list" move chapter 3
made, just consumed here as an iteration order instead of a return value). For each vertex not yet
visited in this second pass, start a brand-new DFS tree **on the transpose graph**. Every vertex
that DFS tree reaches gets added to the current component. When that DFS call returns, the component
it built is a complete SCC — sealed, no more vertices belong to it — and the loop moves on to the
next unvisited vertex in the decreasing-finish-time list to start the next tree.

```python
def _dfs_collect_component(
    node: str,
    transposed: dict[str, list[str]],
    visited: set[str],
    component: list[str],
) -> None:
    visited.add(node)
    component.append(node)
    for neighbor in transposed[node]:
        if neighbor not in visited:
            _dfs_collect_component(neighbor, transposed, visited, component)


def kosaraju_scc(graph: dict[str, list[str]]) -> list[list[str]]:
    """
    graph: adjacency list, node -> list of nodes it points to.
    Every node must appear as a key, even if its list is empty.
    Works on any directed graph -- cyclic, acyclic, or a mix.

    Returns a list of SCCs (each SCC a list of its member nodes).
    The order of SCCs in the returned list follows decreasing
    finish time of each SCC's first-discovered vertex -- which,
    as the Worked Example below shows, is always a valid
    topological order of the condensation graph. Order *within*
    each SCC is just DFS discovery order in step 3; there's no
    canonical order within a strongly connected set any more than
    there was a canonical topological order in chapter 3.
    """
    finish_order = _dfs_finish_order(graph)
    transposed = _transpose(graph)

    visited: set[str] = set()
    sccs: list[list[str]] = []

    for node in reversed(finish_order):  # decreasing finish time
        if node not in visited:
            component: list[str] = []
            _dfs_collect_component(node, transposed, visited, component)
            sccs.append(component)

    return sccs
```

That's the whole algorithm: one DFS to get finish order, one graph transpose, one more DFS on the
transposed graph seeded in decreasing finish-time order. Each of the three steps is something
chapter 3 (or plain DFS) already taught; Kosaraju's contribution is realizing this particular
sequencing of them extracts SCCs.

Like every recursive DFS since chapter 2, `_dfs_finish_order` and `_dfs_collect_component` inherit
Python's call-stack depth limit — a graph with a dependency chain a few thousand vertices deep needs
the same explicit-stack iterative rewrite chapter 3 gestured at for topological sort. The mechanics
of that rewrite don't change here; only the bookkeeping (finish list vs. component list) differs.

---

## Why It Works

Step 3's rule — start each new tree at the highest-finish-time _unvisited_ vertex, and walk the
**transpose** — isn't an arbitrary recipe. Here's the key insight for why it's guaranteed to carve
out exactly one SCC per tree, stated as intuition rather than a fully formal proof.

Call the vertex that starts a new tree `v` — by construction, the highest finish time among
everything step 3 hasn't visited yet. Claim: the DFS from `v` on the transpose can only ever reach
vertices that are mutually reachable with `v` in the _original_ graph — nothing leaks in from
outside `v`'s actual SCC.

Suppose it did leak. Suppose the transpose DFS starting from `v` reached some vertex `u` that is
**not** mutually reachable with `v`. A transpose edge (or chain of them) from `v` to `u` means the
_original_ graph has that same chain running backwards: a path `u -> ... -> v`. So `u` can reach `v`
in the original graph. For `u` and `v` to still fail mutual reachability despite that path existing,
the return trip has to be missing — `v` cannot reach `u` in the original graph. So `u` reaches `v`,
but not the other way around: exactly the "in, but no way back out" shape.

Now bring in finish time. If `u` can reach `v` but `v` can't reach back, then whatever DFS run
visited both of them in step 1 had to fully finish exploring everything reachable from `u` — which
includes `v` and everything `v` can reach — before `u` itself could close out and get appended to
the finish list. `v` finishes; then, only later, `u` finishes. `u`'s finish time is strictly
**after** `v`'s.

But step 3 chose `v` specifically because `v` holds the highest finish time among everything still
unvisited at that point — ahead of every other candidate, including `u`. If `u` actually finishes
after `v` (a later, higher finish time), `u` would have been step 3's chosen root **before** `v`'s
turn ever came up, and `u`'s entire tree — including `u` itself — would already be marked visited by
the time the algorithm gets around to starting `v`'s tree. The supposed "leak" can't happen for a
structural reason, not a lucky one: the only vertex that could have played the role of `u` was
already vacuumed into an earlier SCC and is no longer available to be freshly reached. Either `u`
really was mutually reachable with `v` all along (nothing to explain), or `u` was claimed earlier
and the transpose DFS simply never gets the chance to touch it.

So every vertex the DFS newly reaches while building `v`'s tree is mutually reachable with `v`. And
because `v`'s SCC is strongly connected by definition, every vertex properly inside it _is_
reachable from `v` — including via the transpose's edges, since mutual reachability (as step 2
established) survives the transpose intact. The tree that results is exactly `v`'s SCC: nothing
outside it gets pulled in, nothing inside it gets missed. Mark it all visited, and the same argument
applies again to whatever's left — the next-highest remaining finish time now belongs to a vertex
whose SCC has no unvisited vertex able to reach into it from outside. Repeat until every vertex has
been claimed, and every tree step 3 ever produces is exactly one complete SCC.

---

## Tarjan's Algorithm (Briefly)

**Tarjan's algorithm** finds the same SCCs in a single DFS pass — no transpose to build, no second
full traversal. It's the more efficient approach in practice, and it's worth knowing by name and
mechanism even though this chapter's implementation depth stays with Kosaraju's.

The mechanism, at a high level: Tarjan's tracks two numbers per vertex instead of one. A **discovery
time** — the order in which DFS first visits the vertex, same idea as any DFS numbering — and a
**low-link value**: the smallest discovery time reachable from that vertex by following zero or more
graph edges forward and then, at most, one back-edge up to an ancestor still on the current
exploration stack. Alongside those two numbers, Tarjan's keeps an explicit stack of "currently being
explored" vertices — everything discovered but not yet fully resolved into a finished SCC.

As the DFS unwinds back up the call stack from a vertex, its low-link value gets propagated to
whichever ancestor called it, in case that ancestor can reach further back through it. The moment a
vertex's low-link value comes back equal to its **own** discovery time, that's the signal: nothing
below it in the current exploration can reach any further back up the stack than that vertex itself
can. It is the root of its own SCC. At that exact point, the algorithm pops vertices off the
explicit stack until it pops that root — everything popped in that batch is one complete SCC,
discovered and finalized in a single motion.

This is the same low-link technique [[08-bridges-and-articulation-points|Chapter 8, this Part]]
builds from scratch for a different question entirely — finding edges and vertices whose removal
disconnects a graph, rather than finding mutual-reachability clusters. The discovery-time/low-link
bookkeeping is identical machinery; only what you do with the resulting numbers differs. Because
chapter 8 derives that machinery in full detail on its own problem, this chapter doesn't duplicate
the derivation — building it twice, once here and once there, wouldn't teach anything a forward
reference doesn't already cover.

The trade-off in one line: Tarjan's is **O(V + E)** with a single DFS pass; Kosaraju's is also
**O(V + E)**, but as two full DFS passes plus a transpose built in between. Same asymptotic bound,
different constants — Tarjan's is the one production SCC-finding code actually reaches for, and
Kosaraju's is the one that's easier to explain and to trust the correctness of on a first pass,
which is exactly why it gets the full implementation in this chapter.

---

## Worked Example: SCCs and the Condensation DAG

Build a small directed graph with three SCCs of different sizes — one triangle-shaped cycle, one
two-vertex cycle, and one lone vertex — chained together by one-way edges so the whole thing is a
single connected structure:

```python
graph = {
    "A": ["B"],
    "B": ["C"],
    "C": ["A", "D"],   # A -> B -> C -> A is a 3-cycle; C also reaches out
    "D": ["E"],
    "E": ["D", "F"],   # D -> E -> D is a 2-cycle; E also reaches out
    "F": [],
}
```

**Step 1 — finish order.** Starting the outer loop at `A` (dict iteration order), the DFS dives all
the way down before anything finishes: `A -> B -> C`, then from `C` into `A` (already on the stack,
skip) and into `D`, then `D -> E`, then from `E` into `D` (already on the stack, skip) and into `F`.
`F` has no neighbors, so it finishes first; unwinding back up finishes `E`, then `D`, then `C`, then
`B`, then finally `A`.

```
finish_order = [F, E, D, C, B, A]
```

**Step 2 — the transpose.** Reverse every edge:

| Original edge | Transpose edge |
| ------------- | -------------- |
| `A -> B`      | `B -> A`       |
| `B -> C`      | `C -> B`       |
| `C -> A`      | `A -> C`       |
| `C -> D`      | `D -> C`       |
| `D -> E`      | `E -> D`       |
| `E -> D`      | `D -> E`       |
| `E -> F`      | `F -> E`       |

```python
transposed = {
    "A": ["C"],
    "B": ["A"],
    "C": ["B"],
    "D": ["C", "E"],
    "E": ["D"],
    "F": ["E"],
}
```

**Step 3 — DFS on the transpose, decreasing finish-time order.** Walking `finish_order` backwards
gives the processing order `A, B, C, D, E, F`:

| Root tried | Already visited?   | Tree built (transpose DFS)                                                      | SCC produced |
| ---------- | ------------------ | ------------------------------------------------------------------------------- | ------------ |
| `A`        | no                 | `A -> C -> B` (`B`'s only edge, back to `A`, is already visited)                | `{A, C, B}`  |
| `B`        | yes (in `{A,C,B}`) | skipped                                                                         | —            |
| `C`        | yes                | skipped                                                                         | —            |
| `D`        | no                 | `D -> C` (visited, skip) `-> E` (`E`'s only edge, back to `D`, already visited) | `{D, E}`     |
| `E`        | yes (in `{D,E}`)   | skipped                                                                         | —            |
| `F`        | no                 | `F -> E` (visited, skip); no new vertices                                       | `{F}`        |

```python
print(kosaraju_scc(graph))
# -> [['A', 'C', 'B'], ['D', 'E'], ['F']]
```

Three SCCs, exactly matching the graph's visible structure: the 3-cycle `{A, B, C}`, the 2-cycle
`{D, E}`, and the lone vertex `{F}` — which counts as its own trivial, size-one SCC precisely
because nothing cycles back through it.

**Condensing the graph.** Collapse each SCC into a single super-node — `S1 = {A, B, C}`,
`S2 = {D, E}`, `S3 = {F}` — and keep only the edges that cross between different SCCs (the edges
internal to a component, like `A -> B` or `D -> E`, disappear into the super-node itself). Only two
original edges cross a component boundary: `C -> D` (from `S1` into `S2`) and `E -> F` (from `S2`
into `S3`). The condensation is:

```
S1 -> S2 -> S3
```

A plain three-node chain, and — notice — **acyclic**. That's not a property of this particular
example; it's always true, for any directed graph whatsoever. If the condensation of some graph had
a cycle — say `S1 -> S2 -> S1` at the super-node level — that would mean some vertex in `S1` can
reach some vertex in `S2`, and some vertex in `S2` can reach back into `S1`. But reachability
doesn't care which specific vertex within a component you enter or leave from, because every vertex
inside an SCC can already reach every other vertex in that same SCC by definition. So a path from
`S1` into `S2` and a path from `S2` back into `S1` combine with the internal mutual reachability of
each component to make **every vertex in `S1` and every vertex in `S2` mutually reachable with each
other** — which means `S1` and `S2` were never two separate SCCs to begin with. They'd have to be
merged into one larger SCC, contradicting the assumption that they were maximal, separate
components. A cyclic condensation is a contradiction in terms; **the condensation of any directed
graph's SCCs is always a DAG.** This is precisely why SCC-finding is the general-purpose tool for
recovering chapter 3's world from a graph that starts out with cycles: find the SCCs, condense, and
a topological sort of the result is always well-defined.

---

## Complexity

Kosaraju's algorithm is **O(V + E)**, and it gets there as the sum of three pieces that are each
individually O(V + E):

- **Step 1** (`_dfs_finish_order`) is a single DFS over the whole graph — every vertex visited once,
  every edge inspected once when scanning its owner's adjacency list. O(V + E).
- **Step 2** (`_transpose`) is one pass over every edge in every adjacency list, appending each one
  to a new list. O(V + E) — no vertex or edge is touched more than once.
- **Step 3** (`_dfs_collect_component`, run across all unvisited starting points) is another single
  DFS, this time over the transpose — which has exactly the same vertex count and exactly the same
  edge count as the original graph, just pointed the other way. O(V + E).

Three O(V + E) passes back to back sum to O(3 · (V + E)), and constant factors drop out of big-O
notation, leaving **O(V + E)** overall — the same asymptotic bound as a single plain DFS, just with
a larger constant than Tarjan's single-pass version. Space is O(V + E): the transpose adjacency list
is a full second copy of the graph's edges, plus the usual O(V) for the visited sets, the
finish-order list, and the recursion stack.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
