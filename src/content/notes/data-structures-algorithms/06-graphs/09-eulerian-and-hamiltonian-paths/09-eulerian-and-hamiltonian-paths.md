---
title: "9 — Eulerian & Hamiltonian Paths"
description: "Why an Eulerian path (every edge once) is checkable in O(V) by counting degrees while a Hamiltonian path (every vertex once) is NP-complete with no known shortcut — Hierholzer's algorithm, backtracking search, and why identical phrasing hides opposite tractability."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-47"
relations:
  - slug: data-structures-algorithms/10-backtracking-and-search/01-backtracking/01-backtracking
    kind: related
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
---

# 9 — Eulerian & Hamiltonian Paths

"Visits every X exactly once" is one problem description wearing two hats. Ask for a walk that
visits every **edge** exactly once, and the answer is computable by hand in the time it takes to
count: look at each vertex's degree, note how many are odd, and you have your answer before you've
traced a single step. Ask for a walk that visits every **vertex** exactly once instead, and you've
asked a question that has resisted every attempt at a fast general algorithm for as long as
"NP-complete" has existed as a label to pin on it. Same sentence shape, same "exactly once"
constraint, same graph — and the two problems land on opposite ends of what's computationally
possible. This chapter draws the line between them, shows the linear-time trick that solves one and
the exhaustive search that's the only known way to approach the other, and uses the contrast to make
a point that outlives this specific pair of problems: a problem's English description is not a
reliable guide to its tractability.

---

## The Distinction: Every Edge vs. Every Vertex

**Eulerian path** — a walk that traverses every **edge** of the graph exactly once. Vertices can,
and often must, be revisited: a vertex of degree 4 has to be passed through more than once, because
a single pass-through only consumes two of its edges — one to arrive, one to leave — leaving the
other two for a later pass.

**Hamiltonian path** — a walk that visits every **vertex** of the graph exactly once. Edges are
incidental to the definition: you don't care how many edges the walk used, and you don't care
whether some potential edges went untouched. The only requirements are that consecutive vertices in
the sequence are joined by an actual edge, and that every vertex appears exactly once.

**Circuit** (of either flavor) — a path that starts and ends at the same vertex. An **Eulerian
circuit** and a **Hamiltonian circuit** (also called a Hamiltonian cycle) are just the respective
path with its two endpoints forced to coincide.

These two definitions get swapped constantly under interview pressure, precisely because "visits
every X exactly once" does all the talking and X is the only word that changes. The reliable
tie-breaker, slightly silly but genuinely useful at 2am the night before a loop: **"Euler" and
"edge" both start with vowels.** Eulerian → edges. Whatever's left — vertices — belongs to
Hamiltonian.

The two problems don't just differ in definition; they differ in how hard they are to answer, which
is the part that actually matters once you're past reciting the vocabulary:

|                               | Eulerian                         | Hamiltonian                                                     |
| ----------------------------- | -------------------------------- | --------------------------------------------------------------- |
| Visits every... exactly once  | **edge**                         | **vertex**                                                      |
| What's incidental             | vertices may repeat              | which edges go unused is irrelevant                             |
| Existence check               | O(V) — count odd-degree vertices | no known polynomial-time check                                  |
| Construction                  | Hierholzer's algorithm, O(E)     | exhaustive backtracking, worst case O(n!) (or O(2ⁿ·n²) with DP) |
| Complexity class              | solvable in linear time          | NP-complete                                                     |
| Canonical real-world instance | Seven Bridges of Königsberg      | Traveling Salesman Problem                                      |

Everything below is the justification for that table, row by row.

---

## Eulerian Paths: Existence Conditions

Assume the graph is **connected** for everything in this section — a graph split into disjoint
pieces trivially has no Eulerian path spanning all of it, since a single walk can never cross
between components with no edge joining them. (Isolated, degree-0 vertices don't affect anything
below; only the connected component containing the edges matters.)

**An Eulerian circuit exists if and only if every vertex has even degree.**

This is worth deriving once rather than memorizing, because the derivation is the same
arrive/leave-pairing argument that reappears in the path case, in Hierholzer's splicing step, and in
the directed-graph variant below. Picture walking the circuit. Every time the walk passes _through_
a vertex — arrives via one edge, later leaves via a different edge — it consumes exactly two of that
vertex's incident edges, and because the circuit is Eulerian, no edge is ever reused, so those two
edges form a genuine pair with nothing left over. A circuit starts and ends at the same vertex, so
even the very first departure and the very last arrival form a matching pair once you look at the
circuit as a closed loop with no true beginning or end. So every occurrence of every vertex
contributes an even number of edge-uses — one pair per pass-through — and because an _Eulerian_
circuit uses **every** edge in the graph, all of a vertex's incident edges must get partitioned
entirely into these pairs. A quantity split entirely into pairs, with nothing left over, is even.
Hence every vertex's degree must be even. The converse also holds — any connected graph where every
vertex has even degree admits an Eulerian circuit — and Hierholzer's algorithm in the next section
is the constructive proof of that direction: it doesn't just claim a circuit exists, it builds one.

**An Eulerian path (start and end different vertices) exists if and only if exactly 0 or 2 vertices
have odd degree.**

- **0 odd-degree vertices** means the even-degree condition above already holds everywhere, so a
  full Eulerian circuit exists — and a circuit is trivially also a valid Eulerian path, just one
  that happens to return to where it started.
- **Exactly 2 odd-degree vertices** means the path must start at one of them and end at the other,
  and it's forced, not a choice. Every vertex other than the two endpoints is a pure pass-through
  vertex on this walk — the walk enters and leaves it some number of times but never starts or stops
  there — so the arrive/leave pairing argument above still applies and forces even degree on every
  one of them. The two endpoints are structurally different: the start vertex has one _unmatched_
  "leave" — the very first move of the whole walk, with no preceding "arrive" to pair it with — and
  the end vertex has one unmatched "arrive" — the very last move, with no following "leave." An
  unmatched edge stacked on top of however many fully-matched pairs makes the total degree odd. So
  the _only_ vertices allowed to have odd degree are exactly the two endpoints of the path. If a
  graph has 4, 6, or any other count of odd-degree vertices greater than 2, at least one of them
  would have to sit somewhere in the _middle_ of any candidate walk — and middle vertices are
  provably even. That contradiction is what rules out an Eulerian path existing at all once the
  odd-degree count exceeds 2.

**The O(V) check.** None of this requires simulating a walk to find out whether one exists. Compute
the degree of every vertex — one pass over the adjacency list, O(V + E) — and count how many come
out odd:

- **0 odd** → an Eulerian circuit exists; start anywhere with nonzero degree.
- **2 odd** → an Eulerian path exists; it must start at one of the two odd-degree vertices and end
  at the other.
- **anything else** → no Eulerian path or circuit exists, full stop — no search required to know
  that.

Pair this with a connectivity check (a single BFS or DFS over the vertices with nonzero degree, also
O(V + E)) and the entire existence question — for a graph with a million edges — is answered in
linear time, without ever attempting to construct the walk.

**Directed graphs, briefly** — this matters later, since the DNA-assembly example further down uses
directed multigraphs. An Eulerian circuit exists in a directed graph iff in-degree(v) =
out-degree(v) for every vertex and the graph is strongly connected (restricted to vertices with
nonzero degree). An Eulerian path exists iff at most one vertex has out-degree exactly one greater
than in-degree (the forced start), at most one vertex has in-degree exactly one greater than
out-degree (the forced end), every other vertex has in-degree equal to out-degree, and the graph is
connected in the appropriate directed sense. It's the same pairing argument, just directional:
in-edges and out-edges have to balance at every vertex except the two endpoints, instead of
undirected edges pairing up into arrive/leave.

---

## Hierholzer's Algorithm

Existence is a yes/no question answered by counting. Hierholzer's algorithm answers the harder
question — _construct_ the walk — in O(E), by exploiting the same pairing structure the existence
proof relies on.

**The procedure, conceptually:**

1. **Pick a valid start vertex.** If there are 2 odd-degree vertices, start at one of them — the
   walk is forced to end at the other. If there are 0 odd-degree vertices, start anywhere with
   nonzero degree.
2. **Walk forward greedily.** From the current vertex, take any edge that hasn't been used yet, mark
   it used, and move to the other endpoint. Keep going until stuck — no unused edge remains at the
   current vertex.
3. **Stuck only happens at a "special" vertex.** This is the arrive/leave pairing argument again,
   now running forward instead of backward: every vertex other than the start (or the two path
   endpoints) has even degree, so its edges are all pre-partitioned into arrive/leave pairs — as
   long as the walk arrives at such a vertex, an unused "leave" edge is guaranteed to still be
   available, because arriving used one edge of some pair and the matching edge of that same pair
   hasn't been touched yet. The one place this guarantee breaks is the start vertex, whose very
   first move is an unmatched "leave" with no corresponding "arrive" — so the walk can run out of
   options only back at the start (circuit case) or at the other odd-degree vertex (path case). It
   cannot get stuck anywhere in the middle.
4. **The forward walk produces a circuit, but maybe not a complete one.** Because the walk picks
   _any_ unused edge greedily at each step, it may leave a vertex's other edges unused the first
   time it passes through — those edges are just "banked" for later, not lost. The result of step 2
   is a closed sub-tour that may not cover every edge in the graph yet.
5. **Splice in the leftover edges.** Scan the vertices already on the current circuit for one that
   still has unused incident edges. Removing a closed sub-circuit from a graph preserves the
   even-degree property on whatever edges remain — every vertex the sub-circuit passed through lost
   exactly one fully-matched arrive/leave pair, and even minus even is still even — so the leftover
   edges, considered as their own sub-graph, again satisfy the Eulerian circuit condition at that
   vertex. Run the same forward-walk-until-stuck process starting and ending at that vertex, using
   only unused edges, to build a new sub-circuit.
6. **Merge the sub-circuit into the main one** at the vertex where they meet, producing a longer
   combined circuit.
7. **Repeat steps 5–6** until no unused edges remain anywhere. The final circuit (or, if the start
   was one of two odd-degree vertices, the final _open_ walk) is Eulerian.

**Complexity: O(E).** Every edge is used exactly once across the entire procedure — the initial walk
plus every splice, combined, touch each edge a single time. The one implementation detail that
actually earns that bound: don't literally re-scan the accumulated circuit looking for a splice
point each time, and don't re-scan a vertex's whole adjacency list looking for an unused edge each
time you visit it — either of those degrades the algorithm to O(E²) on a graph shaped like a long
chain of splices. The fix is to keep a per-vertex pointer into its adjacency list that only ever
moves forward, so each edge is inspected a bounded number of times in total, and to do the "walk,
get stuck, backtrack, splice" dance with an explicit stack instead of graph surgery. The stack-based
version below is exactly that: every time the vertex on top of the stack has no unused edges left,
that's the algorithm discovering it has just closed a sub-circuit at that vertex, so it pops the
vertex onto the answer and backtracks to whichever vertex still has unused edges — which is
precisely the splice point from the conceptual description, just discovered by backtracking instead
of by re-scanning.

```python
from collections import defaultdict


def eulerian_path_or_circuit(n, edges):
    """
    Find an Eulerian path or circuit in an undirected graph using
    Hierholzer's algorithm.

    n: number of vertices, labeled 0..n-1.
    edges: list of (u, v) tuples -- undirected edges. Parallel edges and
           self-loops are both fine.

    Returns the walk as a list of vertices (e.g. [0, 1, 2, 0] for a
    circuit that returns to its start). Raises ValueError if no Eulerian
    path or circuit exists.
    """
    degree = [0] * n
    adj = defaultdict(list)  # vertex -> list of (neighbor, edge_id)
    for edge_id, (u, v) in enumerate(edges):
        adj[u].append((v, edge_id))
        adj[v].append((u, edge_id))
        degree[u] += 1
        degree[v] += 1

    # --- existence check: 0 or 2 odd-degree vertices, O(V) ---
    odd_vertices = [v for v in range(n) if degree[v] % 2 == 1]
    if len(odd_vertices) not in (0, 2):
        raise ValueError(
            f"No Eulerian path: {len(odd_vertices)} vertices have odd "
            "degree (must be 0 or 2)."
        )

    # --- connectivity check, restricted to vertices with edges, O(V+E) ---
    nonzero = [v for v in range(n) if degree[v] > 0]
    if nonzero:
        seen = {nonzero[0]}
        stack = [nonzero[0]]
        while stack:
            u = stack.pop()
            for v, _ in adj[u]:
                if v not in seen:
                    seen.add(v)
                    stack.append(v)
        if any(v not in seen for v in nonzero):
            raise ValueError("No Eulerian path: graph is disconnected.")

    start = odd_vertices[0] if odd_vertices else nonzero[0]

    # --- Hierholzer's, stack-based, O(E) ---
    used_edge = [False] * len(edges)
    # A per-vertex pointer into its own adjacency list. It only ever moves
    # forward, so no edge is rescanned once it's been passed over -- this
    # is what keeps the algorithm O(E) instead of O(E^2).
    iter_ptr = {v: 0 for v in range(n)}

    circuit = []
    walk_stack = [start]
    while walk_stack:
        v = walk_stack[-1]
        ptr = iter_ptr[v]
        adv = adj[v]
        while ptr < len(adv) and used_edge[adv[ptr][1]]:
            ptr += 1
        iter_ptr[v] = ptr
        if ptr == len(adv):
            # No unused edges left at v: this vertex's local sub-circuit
            # just closed. Emit it and backtrack to the splice point.
            circuit.append(walk_stack.pop())
        else:
            nxt, edge_id = adv[ptr]
            used_edge[edge_id] = True
            iter_ptr[v] = ptr + 1
            walk_stack.append(nxt)

    circuit.reverse()

    if len(circuit) != len(edges) + 1:
        raise ValueError("No Eulerian path: not all edges reachable from start.")

    return circuit
```

A worked, step-by-step trace of exactly this code — including where the "splice" conceptually
happens — is in the Worked Examples section below.

---

## Hamiltonian Paths: NP-Complete, No Known Shortcut

Everything in the previous two sections rests on a fact worth stating plainly: **no known
polynomial-time algorithm exists to determine whether a Hamiltonian path exists, let alone construct
one.** This isn't "nobody's found a clever trick yet, keep looking" in the way an unsolved but
probably-tractable problem might be. The Hamiltonian Path problem (and its close cousin, Hamiltonian
Cycle) is **NP-complete** — provably, formally, as hard as anything in the class NP gets.

At a practical level, without a full complexity-theory digression, NP-complete means two things at
once:

- **No polynomial-time algorithm is known** for this problem, despite over fifty years of people
  trying, which is itself strong (though not proof-level) evidence none exists.
- **If anyone ever found one**, it would imply — via a chain of polynomial-time reductions — that
  _every_ problem in NP has a polynomial-time solution too, because NP-complete problems are, by
  definition, at least as hard as every other problem in the class. That implication is the famous
  open question **P vs. NP**, and most computer scientists believe it resolves to "no polynomial
  algorithm exists for any of them" — meaning a fast Hamiltonian Path algorithm isn't just unlikely
  to exist, finding one would be one of the most significant results in the history of computer
  science, not a routine interview optimization.

Contrast this directly against the previous two sections, because the contrast is the entire point
of putting these two problems in the same chapter. **Eulerian existence is checkable in O(V) by
counting degrees.** **Hamiltonian existence has no known shortcut whatsoever** — the only
general-purpose, always-correct approach is exhaustive search: try vertex orderings, prune a branch
the moment a partial path can't possibly extend to a full one, and backtrack. This is a direct
application of the general backtracking template — see
[[01-backtracking|Part 10, Backtracking & Search]] for the shape that recurs across every problem in
that family (choose, recurse, undo on failure). There is nothing Hamiltonian-specific about the
_search strategy_; what's specific to this problem is that no better strategy than search is known
to exist.

Name the actual worst-case cost of that search, because it's the number that should change how you
approach the problem the instant you recognize it in an interview: naive permutation enumeration —
try every ordering of the n vertices, check whether consecutive ones are connected — is **O(n!)**. A
smarter formulation, dynamic programming over subsets (Held–Karp style: state = (set of vertices
visited so far, current vertex)), brings that down to **O(2ⁿ · n²)** — still exponential, but a real
improvement over factorial growth for the range of n where either is remotely feasible. Neither is
polynomial, and per the feasibility ladder from [[02-asymptotic-analysis|Part 01, Chapter 2]], both
put a hard ceiling on n somewhere around the low tens before the runtime blows past anything
practical — whereas the Eulerian existence check doesn't even notice n climbing into the millions.

This is the same lesson [[02-asymptotic-analysis|Part 01, Chapter 2]] makes about Big-O and the
feasibility ladder, just delivered by two problems instead of one algorithm: a problem's _phrasing_
alone doesn't tell you its tractability. "Visit every edge exactly once" and "visit every vertex
exactly once" read like two examples of the same question, differing only in which graph element
you're counting — and they turn out to be worlds apart, one solvable in the time it takes to read
the input, the other believed to have no fast solution at all. Recognizing _which_ of the two you're
looking at, in the first ten seconds of reading a problem statement, is the actual skill this
chapter is teaching — the algorithms themselves are secondary to that recognition.

---

## Worked Examples

### Eulerian: tracing Hierholzer's algorithm

Take a small graph shaped like a bowtie — two triangles sharing a single vertex, vertex 2:

```
edges = [(0,1), (1,2), (2,0), (2,3), (3,4), (4,2)]
```

Degrees: vertex 0 → 2, vertex 1 → 2, vertex 2 → 4, vertex 3 → 2, vertex 4 → 2. Every vertex is even,
so an Eulerian **circuit** exists, and per the algorithm it can start anywhere with nonzero degree —
start at vertex 0.

**Conceptual trace (walk, then splice):** walking forward greedily from 0 along edges in the order
they're listed produces 0 → 1 → 2 → 0, using edges (0,1), (1,2), (2,0). That's a closed sub-circuit,
but it only covers 3 of the 6 edges — vertex 2 still has two unused edges, (2,3) and (4,2). Starting
a fresh walk _from vertex 2_, using only unused edges: 2 → 3 → 4 → 2, closing a second sub-circuit
using (2,3), (3,4), (4,2). Splice the second sub-circuit into the first at the point where vertex 2
occurs: `0 → 1 → [2 → 3 → 4 → 2] → 0`, giving the combined circuit **0 → 1 → 2 → 3 → 4 → 2 → 0** — 6
edges, each used exactly once.

**The same result, from the actual stack-based code:** running `eulerian_path_or_circuit(5, edges)`
against the adjacency lists the code builds (in edge-insertion order, so
`adj[2] = [(1, edge 1), (0, edge 2), (3, edge 3), (4, edge 5)]`), the walk stack pushes 0 → 1 → 2 →
0, finds vertex 0's adjacency list exhausted (both its edges used), pops it, finds vertex 2 still
has unused edges at its current pointer position, pushes 2 → 3 → 4 → 2 on top of the existing stack,
then unwinds (popping 2, 4, 3, 2, 1, 0 in that order as each runs out of unused edges) to build
`circuit = [0, 2, 4, 3, 2, 1, 0]`. Reversing that pop order gives the final answer:

```
[0, 1, 2, 3, 4, 2, 0]
```

— identical to the conceptual walk-then-splice trace, because the stack-based backtracking _is_ the
splice operation, just discovered by unwinding instead of by explicit graph surgery. Every one of
the 6 edges appears exactly once: (0,1), (1,2), (2,3), (3,4), (4,2), (2,0).

### Hamiltonian: tracing a backtracking search

A graph deliberately small enough to show the exhaustive-search _shape_ without pretending it scales
— five vertices, two of them (D and E) with degree 1:

```
adjacency = {
    "A": ["B", "C"],
    "B": ["A", "C", "E"],
    "C": ["A", "B", "D"],
    "D": ["C"],
    "E": ["B"],
}
```

A useful pruning observation before searching at all: a degree-1 vertex can only ever be a path
_endpoint_, never a pass-through — passing through requires two distinct incident edges (one to
arrive, one to leave), and a degree-1 vertex only has one edge, period. Both D and E have degree 1
here, so if a Hamiltonian path exists in this graph at all, it must run from D to E (or E to D) —
starting anywhere else is doomed before the search even begins. Watch the search rediscover that the
hard way.

```python
def hamiltonian_path(n, adjacency):
    """
    adjacency: dict {vertex: [neighbors]}.
    Returns a Hamiltonian path (list of vertices) if one exists, else None.
    Exhaustive backtracking -- worst case O(n!): every vertex ordering is a
    live candidate until an edge check rules it out.
    """
    def backtrack(path, visited):
        if len(path) == n:
            return list(path)
        current = path[-1]
        for neighbor in adjacency[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                path.append(neighbor)
                result = backtrack(path, visited)
                if result is not None:
                    return result
                path.pop()               # dead end: undo and try the next neighbor
                visited.remove(neighbor)
        return None

    for start in adjacency:
        result = backtrack([start], {start})
        if result is not None:
            return result
    return None
```

**Trace starting from A** (not a forced endpoint — watch it fail exhaustively):

```
[A]                     visit B
[A,B]                   visit C
[A,B,C]                 visit D
[A,B,C,D]               D's only neighbor C is visited, len=4≠5 -- dead end, backtrack
[A,B,C]                 no more unvisited neighbors of C -- backtrack
[A,B]                   visit E
[A,B,E]                 E's only neighbor B is visited, len=3≠5 -- dead end, backtrack
[A,B]                   no more unvisited neighbors of B -- backtrack
[A]                     visit C
[A,C]                   visit B
[A,C,B]                 visit E
[A,C,B,E]               E's only neighbor B is visited, len=4≠5 -- dead end, backtrack
[A,C,B]                 no more unvisited neighbors of B -- backtrack
[A,C]                   visit D
[A,C,D]                 D's only neighbor C is visited, len=3≠5 -- dead end, backtrack
[A,C]                   no more unvisited neighbors of C -- backtrack
[A]                     no more unvisited neighbors of A -- search from A exhausted, no path found
```

Every branch from A dead-ends, exactly as the degree-1 pruning argument predicted: A can never be an
endpoint, because both D and E need to be endpoints and a path only has two of those. The outer loop
in the code moves on to the next starting vertex; skipping ahead to **start = D** (one of the two
vertices the pruning argument says must work):

```
[D]                     visit C
[D,C]                   visit A
[D,C,A]                 visit B
[D,C,A,B]                visit E
[D,C,A,B,E]              len=5=n -- Hamiltonian path found
```

Result: **D → C → A → B → E**. Six failed branches from the wrong start, five clean steps from the
right one — the entire lesson of this section compressed into one ten-vertex-visit search: the
_search strategy_ never changes, only how much of it gets wasted before it finds (or exhausts) the
answer. On a graph with 20 vertices instead of 5, that wasted-branch count is exactly what makes the
difference between milliseconds and longer than the interview has left.

---

## Real-World Framing

**The Seven Bridges of Königsberg.** This is graph theory's origin story, not just an Eulerian
example — Leonhard Euler solved it in 1736, before "graph" was a mathematical term at all. The city
of Königsberg had four landmasses connected by seven bridges, and locals wondered whether a walk
existed that crossed every bridge exactly once. Euler modeled each landmass as a vertex and each
bridge as an edge — reducing a geography puzzle to a pure counting argument — and proved no such
walk exists: every one of the four vertices has odd degree (3, 3, 3, and 5 in the classic layout),
and the existence theorem this chapter derived above requires exactly 0 or 2 odd-degree vertices for
any Eulerian path to exist at all, let alone a circuit. Four odd-degree vertices rules it out
completely, and it was this specific proof — turning a real bridge-crossing question into a
degree-parity check — that founded graph theory as its own field of mathematics.

**Mail delivery, street sweeping, snowplowing — the Route Inspection Problem.** Any service that has
to physically traverse every street segment (every edge) at least once — mail carriers, garbage
trucks, snowplows — wants to minimize total distance traveled, including any segments driven more
than once. If the street network already satisfies the Eulerian conditions, the optimal route _is_
the Eulerian circuit computed above: zero wasted travel, every segment covered exactly once. Real
street networks usually don't satisfy those conditions, though — some intersections have odd degree
— so the actual optimization (known as the Chinese Postman Problem, or Route Inspection Problem) is:
find the cheapest set of edges to _duplicate_ so every vertex's degree becomes even, then run
Hierholzer's algorithm on the resulting (now-Eulerian) multigraph. The Eulerian existence check
isn't just a yes/no gate here — it's the target state the optimization is trying to reach as cheaply
as possible.

**DNA fragment reassembly.** Sequencing machines don't read a genome end to end; they produce a huge
number of short, overlapping fragments (reads) that have to be reassembled computationally. The
modern approach (de Bruijn graph assembly) breaks each read into overlapping _k_-mers and builds a
directed graph where each (k−1)-mer is a vertex and each k-mer is a directed edge between two such
vertices. Reconstructing the original sequence is then exactly an Eulerian path through this graph —
one that uses every k-mer edge exactly once. This is worth sitting with, because assembly wasn't
always framed this way: earlier overlap-layout-consensus approaches modeled assembly as finding a
Hamiltonian path over the reads themselves (visit every read exactly once, ordered by overlap) — NP-
complete, and hopeless at genome scale. The shift to de Bruijn graphs (Pevzner et al.) didn't make
the underlying biology easier; it re-framed what counts as a vertex and what counts as an edge, and
in doing so moved the problem from the intractable side of this chapter to the tractable side. It's
one of the cleanest real examples of why the edge-vs-vertex distinction this chapter opened with
isn't academic trivia — choosing which one your problem actually reduces to can be the entire
difference between "solvable at scale" and "NP-complete."

**Traveling Salesman: Hamiltonian cycle, but find the cheapest one.** The Traveling Salesman
Problem's decision version — "does a tour exist visiting every city exactly once and returning to
the start, with total cost at most K?" — _is_ a Hamiltonian cycle question, with one addition: edges
carry weights, and the tour has to minimize (or bound) their sum. Put plainly, **TSP is "Hamiltonian
cycle, but find the cheapest one"** — an optimization problem sitting directly on top of a problem
(Hamiltonian cycle existence) that's already NP-complete on its own. That makes TSP NP-hard in its
optimization form and NP-complete in its decision form, and it inherits every bit of the
intractability discussed above: no known polynomial algorithm, exhaustive search as the only exact
approach, and a worst case that's exponential in the number of cities. This is precisely why real
routing systems — vehicle routing, PCB drilling paths, warehouse pick-path optimization —
universally reach for heuristics and approximations (nearest-neighbor construction, 2-opt local
search, Lin–Kernighan, Christofides' algorithm for metric TSP with its 1.5× worst-case guarantee)
rather than an exact solver, the moment the instance grows past a few dozen cities. Exact TSP and
exhaustive Hamiltonian search share the same ceiling, for the same reason: they're the same problem,
one with a price tag attached.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
