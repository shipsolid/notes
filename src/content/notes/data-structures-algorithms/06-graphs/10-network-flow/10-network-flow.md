---
title: "10 — Network Flow"
description: "Ford-Fulkerson, the residual graph's backward edges, and Edmonds-Karp's BFS-driven augmenting paths for computing maximum flow through a capacitated graph — plus the max-flow min-cut theorem and why greedy augmentation needs a way to undo itself."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-39"
relations:
  - slug: data-structures-algorithms/06-graphs/02-graph-traversal/02-graph-traversal
    kind: related
---

# 10 — Network Flow

Ask someone to eyeball a small network of pipes and guess the maximum water flow from a reservoir to
a city, and they'll usually get it right by inspection — trace the pipes, spot the narrowest one,
done. Ask them to prove it, or to write code that computes it for a network too large to eyeball,
and the intuition stops helping. Worse: the first algorithm anyone reaches for — greedily push as
much flow as possible down whichever path is still open, and repeat until none is — isn't just slow.
It is not even correct. It can get stuck below the true maximum flow and have no way of telling that
anything went wrong, because pushing flow forward along an edge is a decision the algorithm, as
stated so far, has no mechanism to undo. Giving it that mechanism — a way to take back a bad
decision without literally deleting flow it already committed — is the one idea this entire chapter
is built around. It closes Part 06 the same way [[02-graph-traversal|Chapter 2]] opened it: one
precisely specified algorithm, built directly on top of BFS, with a small hand-traceable network
that proves the algorithm does what it claims and nothing less.

---

## The Problem: Maximum Flow Through a Capacitated Network

A **flow network** is a directed graph where every edge carries a **capacity** — a maximum amount of
"flow" the edge can carry, however that flow is meaningfully modeled: gallons of water per second
through a pipe, megabits per second through a network link, units of a physical good moving along a
shipping lane. Two nodes are singled out by role, not by any structural difference from the rest of
the graph: a **source** `s`, where flow originates, and a **sink** `t`, where flow is ultimately
absorbed. Every other node is just a waypoint.

A **flow** is an assignment of a non-negative number `f(u, v)` to every edge `(u, v)`, subject to
exactly two rules — and the entire rest of the chapter is about respecting both of them
simultaneously, everywhere, at once:

1. **Capacity constraint.** `f(u, v) <= c(u, v)` for every edge — no pipe carries more than it can
   physically hold.
2. **Flow conservation.** For every node `v` other than `s` and `t`: total flow in equals total flow
   out. Nothing is created, destroyed, or stored at an intermediate node — whatever arrives has to
   leave again, by some combination of outgoing edges.

That second rule does more work than it looks like. It's the same invariant a ledger enforces — what
comes in must go out — applied node by node, and it's the reason a flow can't be assembled edge by
edge in isolation: assigning a value to one edge constrains every other edge touching the same node.

**The goal:** find the flow that maximizes the **value** of the flow — the total amount leaving `s`,
which turns out to always equal the total amount arriving at `t` — without violating either rule on
any edge.

**Why "flow out of s" always equals "flow into t."** Sum the conservation equation over every
intermediate node — every node except `s` and `t`. Every edge between two intermediate nodes
contributes `+f(u, v)` once, as `u`'s outflow, and `-f(u, v)` once, as `v`'s inflow, to that sum, so
it cancels out exactly. What's left, after all the internal cancellation, is:
`(flow leaving s) − (flow arriving at s) + (flow leaving t) − (flow arriving at t) = 0`. Rearranged,
that's `(flow leaving s) − (flow arriving at s) = (flow arriving at t) − (flow leaving t)` — the net
flow produced at the source exactly equals the net flow absorbed at the sink, for _any_ valid flow,
not just the maximum one. That single number is "the value of the flow," and it's the one number
this whole chapter is optimizing.

This is deliberately abstract, and that's the point: the same three ingredients — capacitated edges,
one source, one sink, conservation everywhere in between — model wildly different concrete problems.
Water through a pipe network. Packets through bandwidth-limited network links. Units of a good
moving through a distribution network from a factory to a warehouse. The algorithm doesn't know or
care which one it's running on.

---

## The Residual Graph

Every algorithm in this chapter works by repeatedly finding a path from `s` to `t` along which more
flow can still be pushed, and pushing it. The **residual graph** is the data structure that makes
"can still be pushed" a well-defined, checkable question — and it's the single most important idea
in this chapter, because it encodes something a plain capacity check can't: not just how much _more_
flow an edge can carry, but how much of the flow already _on_ an edge can be taken back.

For every edge `(u, v)` in the original graph, with capacity `c` and current flow `f`, the residual
graph carries **two** edges, not one:

- A **forward residual edge** `(u, v)` with residual capacity `c − f` — how much additional flow
  could still be pushed in the original direction before the edge is fully saturated.
- A **backward residual edge** `(v, u)` with residual capacity `f` — how much flow is currently
  committed on the original edge, and therefore how much of it could be _undone_ by pushing flow the
  opposite way.

Both exist in the residual graph regardless of which one currently has positive capacity. A residual
edge sitting at capacity 0 simply isn't usable as part of a path right now; nothing about the
algorithm needs to treat it specially beyond checking `capacity > 0` before stepping onto it.

### Why the Backward Edge Isn't Optional

It's tempting to read the backward edge as bookkeeping — a way to remember how much flow is on an
edge, nothing more. It is not optional bookkeeping. Without it, an augmenting-path algorithm can get
permanently stuck below the true maximum flow, with no signal that anything went wrong, because
forward-only edges give it no way to correct an earlier choice once it's been made.

Here's a minimal network where that failure is concrete, not hypothetical. Four nodes — source `S`,
sink `T`, two intermediates `A` and `B` — and five unit-capacity edges:

| Edge  | Capacity |
| ----- | -------- |
| S → A | 1        |
| S → B | 1        |
| A → B | 1        |
| A → T | 1        |
| B → T | 1        |

The true maximum flow here is 2 — send 1 unit down `S → A → T` and 1 unit down `S → B → T`. Those
two paths share no edge, so both fit at full capacity simultaneously, and no cut in this graph has
capacity below 2 (cutting `S` off entirely costs `c(S→A) + c(S→B) = 2`, and that's the smallest cut
available).

Now suppose a path-finding step — a plain DFS that doesn't care whether it finds the _shortest_
path, only _some_ path — happens to explore `A`'s neighbors in the order `[B, T]`, and so commits to
`S → A → B → T` before ever trying `S → A → T`. It pushes that path's bottleneck, 1 unit, and moves
on. Read the graph forward-only after that: `S → A` is fully used, `A → B` is fully used, `B → T` is
fully used. The only capacity left untouched is `S → B` and `A → T` — but there's no forward-only
way to connect them, because the only edge leaving `B` was `B → T`, and it's saturated.

A forward-only algorithm stops here, having found a flow of value 1, with no way to tell that 2 was
achievable. The backward residual edge is exactly the fix. Because `A → B` carried 1 unit of flow,
the residual graph also contains a backward edge `B → A` with residual capacity 1 — "1 unit of the
flow on `A → B` can be taken back." Follow it: `S → B` (untouched, capacity 1) → `B → A` (the
backward edge, capacity 1) → `A → T` (untouched, capacity 1). That's a legal augmenting path in the
residual graph, and pushing 1 unit along it does something subtle but exactly correct: it doesn't
literally move flow backward through the network. It **cancels 1 unit of the flow previously
assigned to `A → B`** — dropping it from 1 to 0 — while **adding 1 unit to `S → B` and `A → T`**.
Net effect at `A`: 1 unit still arrives, from `S`, but now leaves via `A → T` instead of `A → B` — a
strictly better routing, discovered _after_ the fact, made possible only because the backward edge
gave the algorithm a way to reroute a decision it had already made. Final flow:
`S→A=1, S→B=1, A→B=0, A→T=1, B→T=1`, value 2 — the true maximum.

Nothing about the first path was a bug. `S → A → B → T` was a perfectly legal augmenting path when
the algorithm chose it; there was no way to know, locally, that it would box in the rest of the
flow. That's precisely the situation the backward edge exists for: not to fix mistakes, but to make
sure the algorithm's _reachable_ set of outcomes still includes the optimum even when its earliest
choices weren't optimal in hindsight.

---

## Ford-Fulkerson: The Method

**Ford-Fulkerson** is not a single algorithm — it's a _method_, in the sense the word is usually
used in algorithms literature: a template that's correct for any way of filling in one blank. The
blank is _how to find the next augmenting path_; everything else is fixed:

1. While a path exists from `s` to `t` in the current residual graph along which every edge has
   strictly positive residual capacity (an **augmenting path**):
   1. Find one — any one; the method doesn't specify how.
   2. Compute its **bottleneck**: the minimum residual capacity among all edges on the path. This is
      the most that can be pushed along the _entire_ path without violating any single edge's
      capacity.
   3. Push that much flow along the path: decrease every forward residual edge on the path by the
      bottleneck, and increase every backward residual edge on the path by the same amount — the
      exact update worked through by hand in the example above.
2. When no augmenting path exists at all, stop. The current flow is the maximum flow.

Step 2's claim — that running out of augmenting paths _proves_ optimality, not merely "this
particular search gave up" — is the part that needs justifying, and the justification is one of the
load-bearing theorems in this part of the algorithms canon.

### The Max-Flow Min-Cut Theorem

Define an **s-t cut** as a partition of every node in the graph into two sides: a set `S_side`
containing `s`, and its complement `T_side` containing `t`. The **capacity of the cut** is the sum
of the capacities of every edge that crosses _from_ `S_side` _to_ `T_side` — edges crossing the
other direction, from `T_side` back into `S_side`, don't count toward the cut's capacity at all,
regardless of their own capacity.

**Max-flow min-cut theorem:** the maximum value of any `s`-`t` flow in the network is exactly equal
to the minimum capacity of any `s`-`t` cut.

One direction is short enough to see immediately: **the value of any flow is at most the capacity of
any cut.** Every unit of flow that reaches `t` from `s` has to cross from `S_side` to `T_side` at
some point, since `s` starts on one side and `t` ends on the other, and it can only cross along an
edge that physically spans that boundary — so the value of the flow can't exceed the total capacity
available on the forward-crossing edges of _any_ cut, including the smallest one. This half holds
for any flow and any cut; it doesn't need Ford-Fulkerson at all.

The other direction — that some flow actually _achieves_ the minimum cut's capacity — is what
termination of the Ford-Fulkerson method proves constructively. When the loop above stops because no
augmenting path exists, look at the set of nodes still **reachable from `s`** in the final residual
graph. Call that set `S_side`; everything else is `T_side`. Two facts fall out immediately:

- Every edge from `S_side` to `T_side` in the _original_ graph must be fully saturated (`f = c`) —
  if it weren't, its forward residual edge would have positive capacity, and the `T_side` endpoint
  would be reachable from `s`, contradicting that `t` isn't reachable at all.
- Every edge from `T_side` back into `S_side` in the original graph must carry zero flow — if it
  carried any, its _backward_ residual edge (pointing from `T_side` into `S_side`) would have
  positive capacity. That doesn't threaten `T_side`'s unreachability on its own, but it does mean
  that edge contributes nothing to the flow actually crossing `S_side → T_side`, which is what the
  cut capacity counts.

Put together: the value of the current flow equals exactly the sum of capacities on the saturated
`S_side → T_side` edges — which is exactly the capacity of this specific cut. The flow's value
equals _a_ cut's capacity, and by the direction proved above, no flow can ever exceed _any_ cut's
capacity, including this one. A value that both equals one specific cut's capacity and can't exceed
any cut's capacity has to be optimal — and that cut has to be a minimum cut. Max flow and min cut
fall out of the same termination condition, in the same instant.

That reachable-set — computed with the exact same BFS the algorithm just used to confirm no
augmenting path exists — is a genuinely useful byproduct, independent of the flow number itself. It
answers a different, often more actionable question: which specific set of edges is the physical
bottleneck? In a bandwidth-planning context, that's the direct answer to "which links need upgrading
to raise total throughput at all" — not a side note to the flow value, but frequently the more
useful of the two numbers in practice.

---

## Edmonds-Karp: Ford-Fulkerson With BFS

Ford-Fulkerson's step 1.1 — "find one augmenting path, any one" — is exactly the blank
**Edmonds-Karp** fills in, and it fills it in with a rule that should look immediately familiar:
**always use BFS to find the shortest augmenting path**, shortest meaning fewest edges, exactly the
traversal [[02-graph-traversal|Chapter 2]] built `bfs_shortest_distances` for. Nothing about the BFS
machinery itself changes — the same queue, the same "mark on discovery, not on dequeue" discipline,
the same parent-pointer path reconstruction. The only thing that's different is what counts as a
"neighbor": instead of an adjacency-list entry, it's any residual edge — forward or backward — with
strictly positive residual capacity.

### Why Shortest, Specifically

This isn't an arbitrary tie-breaker bolted on for style. It's the one choice that turns the _method_
into a **provably terminating algorithm with a polynomial bound**, and the risk it closes off is
real, not theoretical.

Ford-Fulkerson with an _unspecified_ path-finding rule — plain DFS, say, taking whatever path it
stumbles onto first — still terminates on any graph with **integer** capacities, because every
augmentation strictly increases the total flow by at least 1, and the flow value can't exceed the
capacity leaving `s`. But "terminates" is doing very little work in that sentence: the number of
augmentations is bounded by the _numeric value_ of the max flow, not by the _size_ of the graph, and
those two quantities can be wildly different. A capacity of, say, `2^30` costs 30 bits to store but
can force up to a billion single-unit augmentations if the path-finding rule keeps choosing paths
that only free up 1 unit of capacity at a time — a graph with a handful of nodes and edges taking
longer to solve than graphs a thousand times its size. Push further, to capacities that are
**irrational** numbers — a well-known adversarial construction using ratios related to the golden
ratio — and Ford-Fulkerson with a poorly chosen path-finding rule doesn't just run slowly; it can
fail to terminate at all, converging toward a value that never reaches the true maximum, because
there's always another vanishingly small augmentation still available.

Edmonds-Karp closes off both failure modes at once, and the proof is worth sketching because it's a
clean piece of reasoning, not just an assertion. For any edge `(u, v)`, call it **critical** in a
given augmentation if it's the bottleneck edge on that round's augmenting path — the edge whose
residual capacity gets driven to exactly 0. Every augmentation has at least one critical edge, so
the total number of augmentations is at most the total number of times, across the _entire_ run,
that any edge becomes critical. The claim that bounds this: **a given edge can become critical at
most `O(V)` times over the whole algorithm.** Once `(u, v)` is critical and saturated, it can only
become part of another augmenting path again after flow is pushed _backward_ across it — after
`(v, u)` appears on some later augmenting path — and by the time that happens, BFS's shortest-path
distance from `s` to `u` has strictly increased by at least 2 compared to what it was the first
time. (A short exchange argument: `u` was exactly 1 step closer to `s` than `v` was, at the moment
`(u, v)` was critical, since it sat on a shortest path; for `(v, u)` to later be usable, `v` must
become reachable at a distance at least as large as `u`'s old distance, which forces `u`'s own
distance to have grown by the time it's revisited.) Since BFS distances are bounded between `0` and
`V − 1`, and strictly increase by at least 2 every time an edge cycles from critical back to
critical again, any single edge can be critical at most `O(V)` times. Multiply by `E` edges: **at
most `O(V · E)` augmentations, total, no matter how large the capacities are** — the bound depends
only on the graph's shape, never on the numbers written into it.

### Implementation

The graph representation reuses the same adjacency-list idea [[01-graph-representation|Chapter 1]]
introduced, with one addition: every edge gets registered in _both_ directions up front — the real
direction at its stated capacity, the reverse direction at capacity 0 — so the residual graph never
needs to be rebuilt; it's always just "the capacities as they currently stand."

```python
from collections import deque, defaultdict


class FlowNetwork:
    """A directed, capacitated graph that maintains its own residual edges."""

    def __init__(self):
        self.capacity = defaultdict(int)   # residual capacity, keyed by (u, v)
        self.adj = defaultdict(list)       # neighbors reachable via ANY residual edge

    def add_edge(self, u, v, cap):
        if v not in self.adj[u]:
            self.adj[u].append(v)
        if u not in self.adj[v]:
            self.adj[v].append(u)          # the backward slot — starts at capacity 0
        self.capacity[(u, v)] += cap        # += so parallel edges just sum their capacity

    def bfs_augmenting_path(self, source, sink):
        """Shortest-path search over residual edges — line-for-line the same skeleton
        as bfs_shortest_distances in graph-traversal.md, with 'neighbor' redefined as
        'residual edge with capacity > 0'."""
        parent = {source: None}
        queue = deque([source])
        while queue:
            node = queue.popleft()
            if node == sink:
                break
            for neighbor in self.adj[node]:
                if neighbor not in parent and self.capacity[(node, neighbor)] > 0:
                    parent[neighbor] = node
                    queue.append(neighbor)
        if sink not in parent:
            return None   # no augmenting path — current flow is already maximum
        path = []
        node = sink
        while node is not None:
            path.append(node)
            node = parent[node]
        path.reverse()
        return path

    def max_flow(self, source, sink):
        total_flow = 0
        while True:
            path = self.bfs_augmenting_path(source, sink)
            if path is None:
                break
            bottleneck = min(
                self.capacity[(path[i], path[i + 1])]
                for i in range(len(path) - 1)
            )
            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                self.capacity[(u, v)] -= bottleneck   # forward residual shrinks
                self.capacity[(v, u)] += bottleneck   # backward residual grows
            total_flow += bottleneck
        return total_flow
```

`bfs_augmenting_path` is not a loose analogy to Chapter 2's BFS — it _is_ Chapter 2's BFS, with the
loop body's neighbor check swapped from an adjacency-list membership test to a residual-capacity
check, and the `visited` set renamed `parent` because this call site needs the path reconstructed
afterward, not just the set of reachable nodes. Everything that made BFS correct there — mark on
enqueue, process in FIFO order, the queue always holding the current and next frontier and nothing
else — makes it correct here, for exactly the same reasons.

`max_flow` is the Ford-Fulkerson loop from the previous section, unmodified, with "find any
augmenting path" replaced by a call to that BFS. The residual-graph update — decrement the forward
edge, increment the backward edge, both by the bottleneck — has to happen on _every_ edge of the
path, every round, or the undo mechanism from the previous section silently stops working.

---

## Complexity

Edmonds-Karp's cost is the product of two bounds proved above and one bound BFS has always had:

| Quantity                | Bound           | Where it comes from                                                                                                                                                                                |
| ----------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Number of augmentations | `O(V · E)`      | The critical-edge argument: each of the `E` edges can be the bottleneck at most `O(V)` times before BFS distances run out of room to grow.                                                         |
| Cost per augmentation   | `O(E)`          | One BFS over the residual graph, which has at most `2E` edges — the same `O(V + E)` bound [[02-graph-traversal\| Chapter 2]] proved for plain BFS, dominated by `E` in any connected flow network. |
| **Total**               | **`O(V · E²)`** | `O(V · E)` augmentations, each costing `O(E)`.                                                                                                                                                     |

Two things are worth being precise about. First, this bound depends **only on `V` and `E`** — not on
the magnitude of any capacity, integer or otherwise, which is exactly the guarantee the previous
section's critical-edge argument bought. A network with capacities in the trillions costs no more to
solve than the same network with capacities of 1. Second, `O(V · E²)` is a **worst-case** bound on a
specific, deliberately simple choice of path-finding rule (shortest path via BFS); faster max-flow
algorithms exist — Dinic's algorithm, which batches multiple augmenting paths per phase using a
level graph, runs in `O(V² · E)`; push-relabel variants do better still on dense graphs — but every
one of them still rests on the residual graph and the max-flow min-cut theorem this chapter builds.
Edmonds-Karp is the version worth knowing first because every faster algorithm is a refinement of
_how many augmenting paths get found per unit of work_, not a different idea about what an
augmenting path is.

---

## Worked Example

Six nodes: source `S`, sink `T`, and four intermediates — `A`, `B`, `C`, `D`. Seven directed edges:

| Edge  | Capacity |
| ----- | -------- |
| S → A | 2        |
| S → B | 3        |
| A → D | 2        |
| A → C | 3        |
| B → D | 2        |
| D → T | 2        |
| C → T | 1        |

Built as a `FlowNetwork`:

```python
>>> net = FlowNetwork()
>>> net.add_edge("S", "A", 2)
>>> net.add_edge("S", "B", 3)
>>> net.add_edge("A", "D", 2)
>>> net.add_edge("A", "C", 3)
>>> net.add_edge("B", "D", 2)
>>> net.add_edge("D", "T", 2)
>>> net.add_edge("C", "T", 1)
```

Before running it, look at what bounds the answer from two directions at once. Out of `S`, total
capacity is `2 + 3 = 5`. Into `T`, total capacity is `2 + 1 = 3`. The max flow can't exceed the
_smaller_ of any two such bounds, so it's at most 3 before a single augmenting path is even found —
a preview of the cut `{S, A, B, C, D} | {T}` making its capacity known in advance.

### Round 1

BFS from `S` explores the shortest path available. `S`'s neighbors, `A` and `B`, are both at
distance 1; from `A`, `D` is reached at distance 2 — and `D → T` puts `T` at distance 3, the
shortest possible (no 2-edge path from `S` to `T` exists in this graph at all, since neither `A` nor
`B` connects directly to `T`). The path found: `S → A → D → T`.

Bottleneck: `min(c(S→A)=2, c(A→D)=2, c(D→T)=2) = 2`. Push 2.

```
Augmenting path 1: S -> A -> D -> T   (bottleneck = 2)
```

Residual state after round 1 — flow assigned so far, alongside the capacity still available in each
direction:

| Edge  | Flow | Forward residual | Backward residual |
| ----- | ---- | ---------------- | ----------------- |
| S → A | 2    | 0                | 2                 |
| S → B | 0    | 3                | 0                 |
| A → D | 2    | 0                | 2                 |
| A → C | 0    | 3                | 0                 |
| B → D | 0    | 2                | 0                 |
| D → T | 2    | 0                | 2                 |
| C → T | 0    | 1                | 0                 |

Total flow so far: 2. `S → A`, `A → D`, and `D → T` are all fully saturated — every edge on the path
used in round 1 is now unusable in the forward direction.

### Round 2 — the backward edge earns its keep

BFS runs again, from scratch — a fresh `parent` dict every round, since round 1's reachability tells
the search nothing about round 2. `S → A` is saturated, so `A` is _not_ reachable directly from `S`
this time. `S → B` still has 3 units free, so `B` is reached at distance 1. From `B`, `B → D` still
has capacity — `D` is reached at distance 2. Here's the interesting step: from `D`, the forward edge
`D → T` is fully saturated (skip), but the **backward edge `D → A`** — the undo direction of round
1's `A → D` — has residual capacity 2, because 2 units of flow are sitting on `A → D` waiting to be
reclaimed. BFS takes it, reaching `A` at distance 3. From `A`, `A → C` still has 3 units free — `C`
is reached at distance 4, and `C → T` puts `T` at distance 5.

```
Augmenting path 2: S -> B -> D -> A -> C -> T   (bottleneck = 1)
```

Bottleneck: `min(c(S→B)=3, c(B→D)=2, c(D→A)_backward=2, c(A→C)=3, c(C→T)=1) = 1` — the tightest link
is `C → T`, which only ever had 1 unit of capacity to begin with.

Pushing 1 unit along this path means something different on the backward hop than on the four
forward ones. On `S→B`, `B→D`, `A→C`, and `C→T`, it's the usual update: forward residual drops by 1,
backward residual rises by 1. On the `D → A` hop, pushing flow along the _backward_ residual edge
means **reducing the flow already recorded on the original edge `A → D`** by 1 — from 2 down to 1 —
rerouting 1 unit that `A` had sent to `D` in round 1 so it now leaves via `A → C` instead. `D`'s own
conservation doesn't break: it now receives 1 from `A` (not 2) and 1 from `B` (not 0), still
totaling 2 out through `D → T`.

Final flow, after both rounds:

| Edge  | Flow | Capacity |
| ----- | ---- | -------- |
| S → A | 2    | 2        |
| S → B | 1    | 3        |
| A → D | 1    | 2        |
| A → C | 1    | 3        |
| B → D | 1    | 2        |
| D → T | 2    | 2        |
| C → T | 1    | 1        |

Check conservation by hand at every intermediate node: `A` receives 2 (from `S`), sends `1 + 1 = 2`
(to `D` and `C`) — balanced. `B` receives 1, sends 1 — balanced. `D` receives `1 + 1 = 2` (from `A`
and `B`), sends 2 — balanced. `C` receives 1, sends 1 — balanced. Total value: `2 + 1 = 3` leaving
`S`, `2 + 1 = 3` arriving at `T`.

### Confirming there's nothing left, and reading off the cut

A third BFS from `S` finds nothing: `S → A` and `S → B` are both saturated forward, and neither
`A`'s nor `B`'s remaining residual edges leads anywhere new that eventually reaches `T` without
immediately hitting another saturated forward edge into it. The algorithm terminates. Running the
actual code confirms it end to end:

```python
>>> net.max_flow("S", "T")
3
```

That matches the bound spotted before round 1 even ran. The sink-side cut `{S, A, B, C, D} | {T}`,
capacity `c(D→T) + c(C→T) = 2 + 1 = 3`, was the true ceiling all along, and computing the reachable
set from `S` in the _final_ residual graph confirms it directly: `S`, `A`, `B`, `C`, and `D` are all
still reachable from `S` — via a mix of forward and backward residual edges — and only `T` is cut
off. That reachable set, `{S, A, B, C, D}`, is exactly the min cut's source side, produced as a free
side effect of the same BFS that just proved no augmenting path remains.

---

## Real-World Use Cases

The abstraction — capacitated edges, one source, one sink, conservation everywhere in between —
turns out to model problems that don't look anything like pipes or bandwidth on the surface.

**Bipartite matching.** Assigning workers to jobs, students to schools, or any "pair up the left
side with the right side, respecting eligibility" problem reduces directly to max flow: create a
source connected to every worker with capacity 1, a sink connected from every job with capacity 1,
and an edge of capacity 1 from each worker to each job they're eligible for. Every unit of flow from
source to sink corresponds to exactly one worker-job pairing — capacity-1 edges everywhere force
each worker and each job to be used at most once — and the **maximum flow value equals the maximum
number of pairings achievable**, turning a combinatorial matching problem into an instance of an
algorithm this chapter already built.

**Project selection under dependencies and capacity.** When a set of candidate projects or tasks has
dependency constraints (task B can't run unless task A also runs) alongside resource capacity
limits, the min-cut half of the theorem answers "which subset to select to maximize net value"
through a construction usually called the project-selection or maximum-weight-closure problem:
profits and costs become edge capacities, dependency edges get effectively infinite capacity — never
worth including in a cut — and the resulting min cut directly identifies the optimal selection
boundary.

**Network reliability and bandwidth allocation.** This is the literal, original motivating use case
the terminology comes from: given a physical or logical network of links with bandwidth limits, how
much data can actually be pushed from one point to another, and which specific links form the
bottleneck if more capacity is ever needed? The min-cut byproduct from this chapter's algorithm is
the direct answer to the second question — the set of saturated links separating source from sink
after the algorithm terminates _is_ the capacity-planning answer, not a side note to it. It's the
exact set of links that would need upgrading to raise the ceiling at all, because every other edge
in the network already has room to spare.

Ten chapters into Part 06, the throughline is the same one [[02-graph-traversal|Chapter 2]] opened
with: almost nothing here has been a genuinely new idea so much as the same small set of primitives
— an adjacency structure, a queue, a visited set turned into a distance map, a residual-capacity
check — recombined against a new question. Max flow's actual novelty is narrow and specific: the
residual graph's backward edge, the one piece of machinery with no analog anywhere earlier in this
Part, because it's the first algorithm in the book that needs a way to take back a decision it
already made. Everything else — the search, the termination condition, the complexity accounting —
is BFS, one more time, asked a harder question.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
