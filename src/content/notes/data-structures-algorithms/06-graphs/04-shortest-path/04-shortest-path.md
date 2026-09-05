---
title: "4 — Shortest Path"
description: "Shortest path is four different problems wearing one name: BFS already solves the unweighted case, Dijkstra's min-heap relaxation handles non-negative weights, Bellman-Ford and its negative-cycle check handle any sign, and Floyd-Warshall answers all-pairs — plus an honestly-scoped worked example showing exactly what Dijkstra does and doesn't solve for a k-cheapest-routes problem."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-42"
relations:
  - slug: data-structures-algorithms/05-trees/12-priority-queue/12-priority-queue
    kind: related
  - slug: data-structures-algorithms/06-graphs/02-graph-traversal/02-graph-traversal
    kind: related
---

# 4 — Shortest Path

Ask "what's the shortest path?" and the honest answer is "it depends which of four different
problems you're actually asking." Unweighted graphs turn the question into "fewest edges," which
plain traversal already answers without a single new line of algorithm. Weighted graphs where every
edge is non-negative turn it into a greedy, priority-queue-driven climb — Dijkstra's algorithm, and
the direct payoff of having built a priority queue in the previous Part. Let one edge go negative
and that greedy climb quietly produces wrong answers, because its entire correctness argument rests
on an assumption negative weights violate — which is what Bellman-Ford exists to repair, at a real
cost in complexity. And "shortest path between every pair of nodes, not just from one source" is a
different question altogether, answered by a different tool, Floyd-Warshall. This chapter works
through that ladder in order, because each algorithm is easiest to understand as _what breaks in the
previous one, and what it costs to fix_.

---

## Unweighted: Plain BFS Already Solves It

No new algorithm belongs here — this section exists to name something
[[02-graph-traversal|Chapter 2]] already did. Plain **breadth-first search**, run from a source
node, produces the shortest path **in number of edges** to every node reachable from it, as a free
side effect of how BFS explores rather than as a separately-earned result.

The reason is the ordering guarantee BFS makes and nothing else provides: BFS explores strictly in
increasing distance order. It visits every node at distance 0 (just the source), then every node at
distance 1, then every node at distance 2, and so on — never touching a node at distance _d + 1_
before every node at distance _d_ has already been discovered. That ordering is exactly what makes
the shortest-path claim fall out for free: a node is marked visited (and its distance recorded) the
_first_ time BFS reaches it. Could a shorter route to that same node exist, one BFS hasn't found
yet? It can't — any route of length _d_ would have to pass through some node at distance _d − 1_ or
less, and BFS has already fully explored every node at every distance less than _d_ by the time it
starts discovering nodes at distance _d_. There is no shorter route left unexplored by the time BFS
finds the one it reports. The first arrival _is_ the shortest arrival, by construction, not by luck.

```python
from collections import deque
from typing import Hashable


def bfs_shortest_edge_counts(graph: dict[str, list[str]], source: str) -> dict[str, int]:
    """Fewest-edges distance from `source` to every node reachable from it.

    Correct because BFS explores in strictly increasing distance order: every node at
    distance d is fully discovered before any node at distance d + 1 is examined. The
    first time a node is reached is therefore necessarily via a shortest path to it.
    """
    distances = {source: 0}
    queue = deque([source])

    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in distances:
                distances[neighbor] = distances[node] + 1
                queue.append(neighbor)

    return distances


def reconstruct_path(parents: dict[Hashable, Hashable], source: Hashable, target: Hashable) -> list:
    """Walk predecessor pointers backward from target to source, then reverse."""
    if target != source and target not in parents:
        return []  # target unreachable

    path = [target]
    while path[-1] != source:
        path.append(parents[path[-1]])
    path.reverse()
    return path
```

To recover the actual path, not just its length, track a `parents` dict alongside `distances`,
setting `parents[neighbor] = node` at the exact moment `distances[neighbor]` is first set, then walk
that chain backward from any target to the source with `reconstruct_path`. That helper reappears
unchanged later in this chapter — it only ever compares and looks up dictionary keys, so it works
identically whether nodes are strings, integers, or anything else hashable.

The one caveat worth stating plainly: "fewest edges" is only "shortest path" when every edge is
worth the same amount. The instant edges carry different costs, a node reached in fewer hops is no
longer guaranteed to be the node reached more cheaply — which is exactly the guarantee the next
section has to rebuild from scratch.

---

## Weighted, Non-Negative: Dijkstra's Algorithm

BFS's guarantee — "first discovered means shortest" — depends entirely on every edge costing exactly
one hop. Replace a plain FIFO queue with a priority queue ordered by _cumulative cost so far_
instead of _arrival order_, and that guarantee can be rebuilt for weighted graphs: this is precisely
the "extract the currently-cheapest candidate, then push cheaper alternatives back in" loop
[[12-priority-queue|Part 05, Chapter 12]] previewed at the end of its own chapter, now running over
a graph's frontier instead of a fixed list of arrays.

The algorithm, in the same shape as that preview:

1. Maintain a `distances` dict, initialized to infinity for every node except the source, which
   starts at 0.
2. Push `(0, source)` onto a min-heap.
3. Repeatedly pop the cheapest-to-reach node that hasn't been finalized yet. The moment it's popped,
   treat its distance as **final** — no future step can ever make it smaller.
4. For every edge out of that node, **relax** the neighbor: if reaching the neighbor through the
   current node is cheaper than the neighbor's currently-known distance, update the neighbor's
   distance and push the improved `(new_distance, neighbor)` onto the heap.

```python
import heapq
from typing import TypeVar

Node = TypeVar("Node")


def dijkstra(
    graph: dict[Node, list[tuple[Node, int]]], source: Node
) -> tuple[dict[Node, float], dict[Node, Node]]:
    """Single-source shortest distances and predecessors. Requires non-negative weights."""
    distances: dict[Node, float] = {node: float("inf") for node in graph}
    distances[source] = 0
    parents: dict[Node, Node] = {}
    visited: set[Node] = set()
    heap: list[tuple[float, Node]] = [(0, source)]

    while heap:
        dist, node = heapq.heappop(heap)

        if node in visited:
            continue  # a cheaper path to `node` was already finalized — this pop is stale

        visited.add(node)  # `dist` is now final: nothing that happens later can shrink it

        for neighbor, weight in graph[node]:
            if neighbor in visited:
                continue  # already finalized — this is the exact assumption negative weights break

            candidate = dist + weight
            if candidate < distances[neighbor]:
                distances[neighbor] = candidate
                parents[neighbor] = node
                heapq.heappush(heap, (candidate, neighbor))

    return distances, parents
```

### Why non-negative weights are load-bearing

Step 3 above says a popped node's distance is "final — no future step can ever make it smaller."
That one sentence is Dijkstra's entire correctness argument, and it is only true because weights
can't be negative. Here's the assumption spelled out: when node `X` is popped, everything still
sitting in the heap or not yet discovered has a cumulative cost **at least** as large as `X`'s cost
(that's _why_ `X` was the cheapest thing to pop). If every edge weight is non-negative, extending
any of those not-yet-finalized paths can only add cost, never remove it — so nothing still in play
can ever undercut `X`'s already-finalized distance. That guarantee evaporates the instant a negative
edge exists, because now extending a path _can_ subtract cost, and a path that looked more expensive
at pop time can become cheaper than an already-finalized node after the fact.

A small, concrete counterexample makes this precise. Three nodes, `S → A`, `S → B`, `A → B`:

```
S → B  costs  1
S → A  costs  2
A → B  costs -10
```

The true shortest path from `S` to `B` is `S → A → B`, costing `2 + (-10) = -8` — cheaper than the
direct edge's cost of `1`. Trace Dijkstra's pop order: `S` pops first at distance 0, relaxing both
`A` (distance 2) and `B` (distance 1). `B` is cheaper than `A`, so **`B` pops next** and is marked
final — at distance 1, because at that moment nothing better has been discovered. Only after that
does `A` pop, and relaxing `A`'s edge to `B` computes `2 + (-10) = -8`, which is smaller than `B`'s
finalized distance of 1 — but `B` is already marked visited, so that improvement is discarded. The
algorithm reports `distances[B] = 1`. The true answer is `-8`. Dijkstra didn't crash or throw an
error; it silently returned a wrong number, because the one assumption its whole loop depends on —
"a popped node's distance can never improve" — was false the moment a negative edge entered the
picture. Bellman-Ford, next, is what you reach for once that assumption can no longer be trusted.

**Complexity:** O((V + E) log V) with a binary heap — each of the V nodes is popped and finalized
once, and each of the E edges triggers at most one relaxation (and therefore at most one heap push),
with every heap operation costing O(log V).

---

## Weighted, Any Sign: Bellman-Ford

Bellman-Ford drops the greedy "pop the cheapest, trust it forever" shortcut entirely and replaces it
with brute persistence: relax **every edge** in the graph, and repeat that full pass **V − 1**
times. No priority queue, no notion of a node being "finalized" early — just relax everything, over
and over, until the bound below guarantees nothing is left to improve.

```python
def bellman_ford(
    edges: list[tuple[str, str, int]], vertices: list[str], source: str
) -> dict[str, float]:
    """Single-source shortest distances. Correct even with negative edge weights, as
    long as no negative cycle is reachable from `source`."""
    distances: dict[str, float] = {v: float("inf") for v in vertices}
    distances[source] = 0

    for _ in range(len(vertices) - 1):
        changed = False
        for u, v, weight in edges:
            if distances[u] + weight < distances[v]:
                distances[v] = distances[u] + weight
                changed = True
        if not changed:
            break  # a full round relaxed nothing — every distance is already final

    return distances
```

### Why V − 1 rounds is exactly enough

This is the same kind of bound the priority-queue chapter's heap operations lean on, just applied to
"how many times could a single edge relaxation possibly still matter" instead of "how many
comparisons does a sift-down need." A **shortest path**, in a graph with no negative cycle, never
needs to repeat a vertex — repeating a vertex means looping, and a loop with non-negative total cost
only adds distance for free, so it can always be cut out without making the path worse (a loop with
_negative_ total cost is a negative cycle, handled separately below). A path that visits each of the
graph's V vertices at most once uses at most **V − 1 edges**.

Round 1 of relaxing every edge correctly finalizes every shortest path that uses exactly 1 edge.
Round 2 extends that: since round 1 already got every 1-edge path right, relaxing every edge again
correctly finalizes every shortest path using at most 2 edges — because a 2-edge shortest path is a
1-edge shortest path (already correct) plus one more relaxed edge. By induction, after round _k_,
every shortest path using at most _k_ edges is correct. After **V − 1** rounds, every shortest path
using at most V − 1 edges is correct — and, since no simple path needs more edges than that, every
shortest path in the graph is correct, period.

**Complexity:** O(V·E) — V − 1 rounds, each doing O(E) work to relax every edge once. Meaningfully
worse than Dijkstra's O((V + E) log V) for the sparse graphs that show up in most interview
problems, but Dijkstra isn't in the running here at all: it isn't merely slower on graphs with
negative edges — as the counterexample above showed, it's wrong.

---

## Negative Cycle Detection

The V − 1 bound above has a built-in assumption: that a shortest path exists at all, i.e., that
looping never helps. If a **negative cycle** — a cycle whose total edge weight sums to less than
zero — is reachable from the source, that assumption fails, and "shortest path" stops being a
well-defined question for every node reachable from that cycle: you can always loop through it one
more time and get a cheaper number, with no floor to converge to.

Bellman-Ford detects this almost for free. Run **one more relaxation round** after the guaranteed V
− 1 are done. Every legitimate shortest path — anything using at most V − 1 edges — was already
finalized in those rounds. So if the V-th round still finds an edge that relaxes (still improves
some distance), that improvement can't be explained by a legitimate shortest path; it can only be
explained by a path that's exploiting a cycle to keep getting cheaper. That's the negative cycle,
caught in the act:

```python
def bellman_ford_with_cycle_check(
    edges: list[tuple[str, str, int]], vertices: list[str], source: str
) -> dict[str, float]:
    distances: dict[str, float] = {v: float("inf") for v in vertices}
    distances[source] = 0

    for _ in range(len(vertices) - 1):
        for u, v, weight in edges:
            if distances[u] + weight < distances[v]:
                distances[v] = distances[u] + weight

    # One extra round: everything with a genuine shortest path was already finalized
    # above. If anything still improves here, a negative cycle is reachable from `source`.
    for u, v, weight in edges:
        if distances[u] + weight < distances[v]:
            raise ValueError(
                f"negative cycle detected — distance to {v!r} still improves after "
                f"{len(vertices) - 1} rounds"
            )

    return distances
```

This is a genuine bonus of the round-based design, not a bolt-on: Dijkstra has no equivalent check
to add, because its whole loop structure assumes a node's distance is settled the moment it's popped
— there's no natural "one more pass" to run that would surface a problem, since the problem (a
negative edge) breaks Dijkstra long before a cycle would even be relevant.

---

## All-Pairs: Floyd-Warshall (Briefly)

Every algorithm so far answers "shortest path **from one source**." Sometimes the actual question is
"shortest path between **every pair** of nodes" — and re-running Dijkstra or Bellman-Ford once per
source (V times) works, but a purpose-built dynamic program does the same job more directly:
**Floyd-Warshall**.

The DP formulation: define `dist[i][j]` as the shortest path from `i` to `j` **using only
intermediate nodes from the set `{0, 1, ..., k}`**, and grow `k` from 0 up to V − 1. At each step,
one question decides whether allowing node `k` as a new intermediate stop helps: is going
`i → k → j` cheaper than the best route found so far without routing through `k`? If so, update. By
the time `k` has grown to include every node, `dist[i][j]` is the true shortest path with no
restriction on which nodes it may pass through.

```python
def floyd_warshall(n: int, edges: list[tuple[int, int, int]]) -> list[list[float]]:
    """All-pairs shortest distances for n nodes labeled 0..n-1. Handles negative edges
    (not negative cycles); O(V^3) regardless of how sparse the edge list is."""
    INF = float("inf")
    dist: list[list[float]] = [[0.0 if i == j else INF for j in range(n)] for i in range(n)]

    for u, v, weight in edges:
        dist[u][v] = min(dist[u][v], weight)  # keep the cheaper of any parallel edges

    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]

    return dist
```

**Complexity:** O(V³) — three nested loops over every node, regardless of how many edges actually
exist. That cost is _independent of E_, which is precisely the trade-off that decides when
Floyd-Warshall is the right tool: on a **dense** graph where E is close to V², O(V³) all-pairs beats
running Dijkstra V times (O(V·(V + E) log V)) or Bellman-Ford V times (O(V²·E)) for the same
all-pairs answer. It's also simple to reach for when V is small enough that a cubic bound is cheap
in absolute terms (low hundreds of nodes), and it needs no priority queue at all. As a side note, it
detects negative cycles the same way Bellman-Ford's extra round does, just read differently: if any
`dist[i][i]` ends up negative, node `i` sits on a negative cycle. This chapter's depth budget goes
to Dijkstra and Bellman-Ford — the two that come up constantly in interviews — so Floyd-Warshall
gets a correct, working implementation and this much explanation, not a full derivation of its DP
recurrence.

---

## Worked Example: Route Finder, Honestly Scoped

This is adapted from a real problem worked through in one of Amit's own practice notebooks —
"Question 24: Route Finder." The actual problem statement:

> Find the _k_ cheapest flight routes from city 1 to city _n_. A route may visit the same city
> several times. Routes are one-way, and routes with equal price are each counted separately. Print
> the _k_ cheapest prices, sorted.

Its own worked example: 4 cities, 6 flights, `k = 3`.

```
flights: 1→2 (1), 1→3 (3), 2→3 (2), 2→4 (6), 3→2 (8), 3→4 (1)
expected output: 4 4 7
```

The explanation given alongside that expected output names the routes: `1 → 3 → 4` costs 4,
`1 → 2 → 3 → 4` costs 4, and `1 → 2 → 4` costs 7. Two _distinct_ routes tie at the same price. That
detail matters — it's the whole reason this problem is not the same problem as this chapter's
single-source shortest path, and it's worth being precise about exactly where the line falls.

### What Dijkstra actually solves here: the single cheapest route

Strip the problem down to "what's the cheapest way from city 1 to city 4" — one number, not a sorted
list of _k_ — and that sub-problem is exactly single-source shortest path on a non-negative-weight
graph, which is exactly what `dijkstra` above already does:

```python
flights_graph: dict[int, list[tuple[int, int]]] = {
    1: [(2, 1), (3, 3)],
    2: [(3, 2), (4, 6)],
    3: [(2, 8), (4, 1)],
    4: [],
}

distances, parents = dijkstra(flights_graph, source=1)
print(distances[4])                          # 4
print(reconstruct_path(parents, 1, 4))       # [1, 3, 4]
```

Run by hand: `1` pops first, relaxing `2` (distance 1) and `3` (distance 3). `2` pops next, relaxing
`3` (candidate `1 + 2 = 3`, a tie with `3`'s current distance — not a strict improvement, so it's
discarded and `3`'s predecessor stays `1`) and `4` (distance 7). `3` pops next, relaxing `4` down
from 7 to `3 + 1 = 4`. `4` finally pops at distance 4 and finalizes. **`distances[4] == 4`** —
matching the smallest of the notebook's expected `4 4 7`. But look at the reconstructed path:
`[1, 3, 4]`, the 2-edge route. The _other_ route that also costs 4 — `1 → 2 → 3 → 4` — is real,
correct, and completely invisible to this result. `parents[3]` was set to `1` the first time `3` was
relaxed and was never overwritten, because the later relaxation through `2` tied rather than
strictly improved. Dijkstra's `distances` dict has room for exactly one number per node; it was
never designed to remember that a second, equally-cheap way to arrive exists.

### The notebook's own approach, cleaned up

The notebook doesn't use Dijkstra at all — it solves the problem with an unbounded recursive
depth-first search, exploring every walk (repeats allowed, matching "a route may visit the same city
several times") up to a fixed number of hops, recording the total cost every time the destination is
reached along the way. Cleaned up to remove the original's module-level globals:

```python
def find_route_costs(
    adjacency: dict[int, list[tuple[int, int]]],
    current_city: int,
    end_city: int,
    hops_remaining: int,
    current_cost: int,
    found_costs: list[int],
) -> None:
    """Explore every walk (repeats allowed) of at most `hops_remaining` edges from
    `current_city`, recording the total cost every time `end_city` is reached.

    This is the notebook's original approach with the globals removed. It is
    exponential in the branching factor and the hop depth, and only tractable
    because the sample graph is tiny.
    """
    if current_city == end_city:
        found_costs.append(current_cost)

    if hops_remaining == 0:
        return

    for neighbor, weight in adjacency[current_city]:
        find_route_costs(
            adjacency, neighbor, end_city, hops_remaining - 1, current_cost + weight, found_costs
        )


found_costs: list[int] = []
find_route_costs(flights_graph, current_city=1, end_city=4, hops_remaining=3, current_cost=0,
                  found_costs=found_costs)
found_costs.sort()
print(found_costs[:3])  # [4, 4, 7] — matches the notebook's expected output
```

This produces the right answer on this exact input, and it's worth being honest about _why_, because
the reason is fragile rather than principled. The recursion's depth budget is `hops_remaining`,
seeded from `k = 3` — the same variable the problem uses for "how many cheapest routes to return."
Those are two semantically different quantities (how many results you want vs. how many hops you're
willing to search) that happen to share a value in this one example, because all three cheapest
routes to city 4 happen to use at most 3 edges. Nothing in the algorithm guarantees that
relationship in general: on a graph where the 3 cheapest routes required, say, 6 hops each, a depth
budget of 3 would silently return an incomplete — and wrong — answer with no error raised. It also
explores every walk exhaustively with no pruning, so its cost grows exponentially with branching
factor and depth; the notebook's own stated constraints (up to 10⁵ cities, 2·10⁵ flights) make this
approach intractable at real scale, correct only for exactly the kind of small, hand-built example
it was demonstrated on.

### Why "just run Dijkstra k times" doesn't generalize either

Given that plain Dijkstra only produces one number, it's tempting to reach for "run Dijkstra, remove
the path it found, run it again" as a fix for the real _k_-cheapest-**distinct**-routes question.
That tweak doesn't work, for reasons worth being explicit about:

- **Ties aren't a removal problem.** The example above already shows Dijkstra silently dropping a
  tied-cost route without any error — there's nothing to "remove and re-run" from, because the
  second route was never represented in `distances` or `parents` in the first place.
- **Removing an edge or node is both too aggressive and not aggressive enough.** Banning the exact
  edge the first shortest path used at one point might accidentally block a completely different,
  unrelated route that happens to share that one edge. Banning the whole path's node set might leave
  valid second-best routes unreachable that only shared a _single_ edge with the first, or might
  fail to exclude a route that reuses the same nodes in a different order.
- **The correct second-best path can branch off the first-best path at any point along it**, not
  just at the source. Finding it means, for every node along the already-found shortest path,
  temporarily banning the one edge that path used _at that point_, re-running a shortest-path search
  from that branch point with the rest of the path so far held fixed, and keeping whichever of those
  candidate detours is cheapest.

That branching-and-rerun structure is exactly what **Yen's algorithm** formalizes: it maintains a
growing list of already-found shortest paths and a candidate pool, and to find the (i+1)-th path, it
systematically generates a "spur path" from every node along the i-th path (banning that path's edge
at each spur point, then re-running Dijkstra from the spur node), merging the cheapest surviving
candidate into the result set. It repeats this once per additional path needed. Its complexity is
meaningfully worse than a single Dijkstra run — roughly O(k · V · (E + V log V)), using Dijkstra as
the subroutine it reruns from scratch at every spur point for every one of the _k_ iterations —
which is the honest cost of turning "cheapest path" into "_k_-th cheapest distinct path." It is
named here, not implemented: it's a legitimately harder problem than anything else in this chapter,
and the point of this worked example is to be clear that Dijkstra buys the single-source,
single-answer case cleanly, and stops exactly there.

---

## Complexity and Use-Case Summary

| Algorithm      | Handles                           | Complexity       | Use when                                                                                      |
| -------------- | --------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| BFS            | Unweighted (every edge costs 1)   | O(V + E)         | Fewest hops from one source — free byproduct of [[02-graph-traversal\|Chapter 2]]'s traversal |
| Dijkstra       | Weighted, non-negative            | O((V + E) log V) | Weighted single-source shortest path, no negative edges — the default interview answer        |
| Bellman-Ford   | Weighted, any sign, single-source | O(V·E)           | Negative edges possible; also the only one of the four with a built-in negative-cycle check   |
| Floyd-Warshall | Weighted, any sign, all-pairs     | O(V³)            | Need shortest paths between _every_ pair; dense graph; V small enough for cubic to be cheap   |

_k_-cheapest-**distinct**-routes (Yen's algorithm) sits outside this table entirely — it's a harder
problem than any single-source or all-pairs shortest-path query, and the worked example above exists
precisely so that distinction doesn't get flattened into "just run Dijkstra a few more times."

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
