---
title: "2 — Graph Traversal"
description: "DFS and BFS generalized from trees to graphs via one addition — a visited set — plus recursive and iterative DFS, BFS's third appearance of the same queue skeleton, connected components, and multi-source BFS as single-source BFS from an imaginary super-source."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-40"
relations:
  - slug: data-structures-algorithms/06-graphs/01-graph-representation/01-graph-representation
    kind: related
  - slug: data-structures-algorithms/04-stack-queue-and-deque/01-stack/01-stack
    kind: related
  - slug: data-structures-algorithms/04-stack-queue-and-deque/02-queue/02-queue
    kind: related
---

# 2 — Graph Traversal

Every traversal in Part 05 walked into a binary tree and never had to worry about walking back into
itself. That wasn't a design choice in the traversal code — `preorder`, `inorder`, `postorder`, and
`level_order` never checked whether a node had already been seen, because a tree's own definition
rules the question out: exactly one path exists from the root to any node, so nothing can be reached
twice, and there's no cycle for a traversal to loop around forever.
[[01-graph-representation|Chapter 1]]'s adjacency list drops both guarantees the moment an edge
points back at an already-visited node, or two different paths lead into the same neighbor.
Everything in this chapter — and every DFS/BFS for the rest of this Part — is Part 05's traversal
code plus exactly one addition to compensate for what the data structure no longer promises: a
`visited` set.

---

## The One Addition Every Graph Traversal Needs: `visited`

A tree traversal's base case is structural: `if node is None: return` works because a finite tree
run out of children eventually, on every branch, with no way back up. Nothing about a graph gives
you that for free. Two failure modes show up the moment a traversal is ported over unchanged, and
it's worth seeing both concretely before trusting the fix.

**A cycle means a naive traversal never terminates.** Take a small cyclic graph:

```python
graph = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "D"],
    "D": ["B", "C"],
}
```

`A → B → D → C → A → B → D → C → ...` is a valid path through this graph that never runs out of
edges to follow. A direct port of `preorder`'s shape —

```python
def dfs_naive(graph, node, visit):
    visit(node)
    for neighbor in graph[node]:
        dfs_naive(graph, neighbor, visit)
```

— called as `dfs_naive(graph, "A", print)` recurses forever along that cycle and eventually blows
the call stack (`RecursionError: maximum recursion depth exceeded`), having printed
`A B A B A B ...` thousands of times before it dies. Nothing about the code is wrong in the way it
would be wrong for a tree; the graph simply doesn't offer the "eventually the children run out"
guarantee the recursion is implicitly leaning on.

**Even without a cycle, multiple paths mean redundant revisits.** Drop the back-edges and this is a
plain DAG — a diamond, no cycle anywhere:

```python
graph = {
    "A": ["B", "C"],
    "B": ["D"],
    "C": ["D"],
    "D": [],
}
```

`dfs_naive` _terminates_ on this one — there's no infinite path — but it still visits `D` twice,
once by way of `B` and once by way of `C`, because both are legitimate routes from `A` and nothing
tells the traversal it already handled `D` the first time. For a `visit` that just prints, that's
wasted work. For a `visit` that increments a counter, sums a value, or marks a node "done" with a
side-effecting action that shouldn't happen twice, it's an outright wrong answer — not merely
slower.

The fix is the same one line in every traversal in this chapter: a `set()` that records which nodes
have already been fully handled, checked _before_ recursing or enqueuing into a neighbor, and
updated the moment a node is committed to. Structurally, `if node in visited: return` is playing the
exact role `if node is None: return` played in Part 05 — both are the base case that stops the
recursion — except a tree's base case falls out of the shape of the data, and a graph's has to be
maintained by hand, because the graph itself keeps no memory of where the traversal has already
been.

---

## DFS: Recursive and Iterative

### Recursive DFS

Generalizing Part 05's recursive DFS is almost mechanical: `node.left` / `node.right` — two named,
fixed slots — becomes `for neighbor in graph[node]` — an unbounded list read from the adjacency
structure — and the tree's `if node is None: return` becomes the graph's
`if node in visited: return`.

```python
def dfs_recursive(graph, node, visited, visit):
    if node in visited:
        return
    visited.add(node)
    visit(node)
    for neighbor in graph[node]:
        dfs_recursive(graph, neighbor, visited, visit)
```

The `visited` set has to be the _same_ object across the whole call chain — passed down by
reference, never recreated per call — or every recursive call would start from "nothing seen yet"
and the cycle problem from the previous section comes right back. A thin wrapper keeps the entry
point clean and avoids the classic Python trap of defaulting a mutable argument in the signature
itself:

```python
def dfs(graph, start, visit):
    dfs_recursive(graph, start, set(), visit)
```

Run against the cyclic graph from the previous section:

```python
>>> graph = {
...     "A": ["B", "C"],
...     "B": ["A", "D"],
...     "C": ["A", "D"],
...     "D": ["B", "C"],
... }
>>> dfs(graph, "A", print)
A
B
D
C
```

Trace it by hand and the `visited` check is doing all the work a tree got for free: `A` visits, then
`B`; `B`'s first neighbor `A` is already visited, so that branch returns immediately without
recursing; `B`'s second neighbor `D` visits; `D`'s neighbors are `B` (visited, return) and `C` (not
yet — visits); `C`'s neighbors are `A` and `D`, both already visited, both return. The whole call
chain unwinds cleanly. Nothing about the _shape_ of the recursion changed from Part 05 — it's still
"do work, then recurse into whatever's next" — but without that one check, the cycle `A-B-D-C-A`
would have kept the recursion running until the stack gave out.

### Iterative DFS With an Explicit Stack

[[01-stack|Part 04, Chapter 1]]'s mechanical conversion — replace the call stack with an explicit
Python list, pop a node, push what's next — carries over the same way, with the same addition: check
`visited` before doing the work, and only push a neighbor that isn't already accounted for.

```python
def dfs_iterative(graph, start, visit):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        visit(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                stack.append(neighbor)
```

```python
>>> dfs_iterative(graph, "A", print)
A
C
D
B
```

Notice the order differs from the recursive version — `A C D B` here versus `A B D C` above — and
both are correct. A recursive DFS fully finishes one neighbor's entire subtree before starting the
next; an explicit stack processes whatever was pushed _last_, so pushing `["B", "C"]` in that order
means `C` pops and gets explored first. There's a subtler reason the check has to happen on **pop**,
not only on push: a node can end up in the stack more than once before it's ever processed. Trace
`D`'s turn above — by the time `D` is popped, `B` hasn't been marked visited yet (it's still sitting
lower in the stack), so `D` pushes `B` onto the stack a second time. That's harmless — the second
copy of `B` gets skipped by the `if node in visited: continue` guard when it's eventually popped —
but it's exactly why the guard has to run on every pop, not just once at push time. Skipping it
would silently reprocess nodes and undo the whole point of tracking `visited` in the first place.

Both versions are **O(V + E) time** — every node is committed to `visited` exactly once (the check
guarantees that), and every edge is examined at most once from each endpoint, which sums to O(E)
across the whole traversal. **Space is O(V)** for the `visited` set plus whatever the stack
(explicit or call stack) is holding — and unlike Part 05's binary tree, where the call stack was
bounded by height `h` and `h` could be as small as `O(log n)` for a balanced tree, a graph offers no
such guarantee. A star graph with one hub and many spokes pushes every spoke before popping any of
them; a long path graph recurses one frame per node. Both DFS versions can hit **O(V)** stack depth
in the worst case, not the tighter bound a balanced tree enjoyed.

---

## BFS: The Same Skeleton, a Third Time

[[02-queue|Part 04, Chapter 2]] introduced `bfs_levels` on a small graph as a preview, explicitly
promising "Part 06 (Graphs) covers BFS in full." [[02-binary-trees|Part 05, Chapter 2]] then
specialized that same skeleton to `level_order`, narrowing "neighbors" to two named fields and
dropping the `visited` set entirely, because a tree's structure ruled out ever reaching the same
node twice. This is that promise, delivered — and the function below is, line for line, the one
`queue.md` already showed:

```python
from collections import deque

def bfs_levels(graph, start):
    """Level-by-level traversal of a graph. Returns a list of levels."""
    visited = {start}
    queue = deque([start])
    levels = []

    while queue:
        level_size = len(queue)              # freeze this level's boundary
        level_nodes = []
        for _ in range(level_size):
            node = queue.popleft()            # FIFO: process in discovery order
            level_nodes.append(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)     # enqueue for the *next* level
        levels.append(level_nodes)

    return levels
```

```python
>>> bfs_levels(graph, "A")
[['A'], ['B', 'C'], ['D']]
```

Same graph as the DFS section, cycle included — `A-B-D-C-A` — and BFS handles it exactly as cleanly
as DFS did, because it's the identical fix: `visited` gets checked _and set_ the moment a neighbor
is discovered, not when it's dequeued, which is what stops `D` from being enqueued twice (once from
`B`, once from `C`) the same way it stopped the DAG diamond from double-visiting earlier. That
timing detail — mark-on-enqueue rather than mark-on-dequeue — matters more for BFS than it did for
the DFS stack: because many neighbors get discovered in the same level-processing pass, marking late
would let the same node get queued from two different level-mates before either one dequeues,
silently duplicating work across the level.

Three appearances of the identical shape — `queue`, `level_size = len(queue)` freezing a boundary,
enqueue whatever's unvisited — on a small hand-drawn graph as a preview, on a binary tree with
`left` and `right` standing in for neighbors, and now on an arbitrary graph delivering what the
first two promised. None of the mechanism ever cared what "neighbors of this node" actually meant; a
linked `next` pointer, two named child fields, and an adjacency-list lookup are all just different
answers to the same question the skeleton asks. The only thing that changes crossing from the tree
case back to the general graph case is that `visited` comes back — a tree could skip it because its
own shape guaranteed no double-reach; a graph can't make that promise, so the skeleton has to
enforce it by hand again.

**Time is O(V + E)** — the same accounting as DFS: every node dequeued once, every edge examined
once from each endpoint. **Space is O(V)** in the worst case for the `visited` set plus whatever the
queue is holding at its widest point — a graph gives no "balanced width" guarantee the way a perfect
binary tree at least bounded its widest level to roughly `n/2`; a densely connected graph can have
an entire frontier of size `O(V)` in flight at once.

A small but useful variant swaps "which level is this" for "how far is this from the start," folding
the `visited` set and the answer into one dict:

```python
from collections import deque

def bfs_shortest_distances(graph, start):
    """Fewest-edges distance from start to every reachable node."""
    distance = {start: 0}
    queue = deque([start])

    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in distance:
                distance[neighbor] = distance[node] + 1
                queue.append(neighbor)

    return distance
```

```python
>>> bfs_shortest_distances(graph, "A")
{'A': 0, 'B': 1, 'C': 1, 'D': 2}
```

`distance` is doing double duty here — it's the answer _and_ the visited set, since "already has a
recorded distance" and "already visited" are the same fact. That merge is worth keeping in mind:
it's exactly the shape the multi-source worked example below builds on directly.

---

## Worked Example: Counting Connected Components

An undirected graph splits into **connected components** — maximal groups of nodes where every node
can reach every other node in the same group, and no node in one group can reach any node in
another. The traversal-level idea: run a DFS or BFS from any node that hasn't been visited yet, let
it claim every node it can reach as belonging to that component, and count how many times a _fresh_
traversal had to start.

```python
def count_connected_components(graph):
    visited = set()
    components = 0

    def dfs(start):
        stack = [start]
        while stack:
            node = stack.pop()
            if node in visited:
                continue
            visited.add(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    stack.append(neighbor)

    for node in graph:
        if node not in visited:
            dfs(node)
            components += 1

    return components
```

```python
>>> graph = {
...     "A": ["B"], "B": ["A", "C"], "C": ["B"],
...     "D": ["E"], "E": ["D"],
...     "F": [],
... }
>>> count_connected_components(graph)
3
```

Three components: `{A, B, C}`, `{D, E}`, and `{F}` sitting alone with no edges at all. The outer
`for node in graph` loop is the only new idea here — everything inside `dfs` is the same iterative
traversal from the DFS section, unmodified. The loop's job is just to notice when the traversal
_can't_ reach a node from wherever it last started, because that's precisely the signal that a new
component begins there.

This is also the cleanest illustration of a claim the comparison section below makes formally: this
particular question doesn't care whether `dfs` above is depth-first or breadth-first. Swap the stack
for a `deque` and `.pop()`/`.append()` for `.popleft()`/`.append()` and `count_connected_components`
returns the identical answer, because all that matters is _which_ nodes get marked visited by the
time a traversal from a given start exhausts itself — not the order they're marked in.

**Complexity:** every node is pushed and popped at most once across the _entire_ outer loop — not
per call to `dfs`, but in total — and every edge is examined at most once from each endpoint, so the
whole function (all calls to `dfs` combined) is **O(V + E) time, O(V) space**, the same bound as a
single traversal, because the work really is just one traversal's worth of work, restarted from
scratch each time the frontier runs dry. (For graphs where edges arrive one at a time rather than
being known upfront, a Union-Find/DSU structure answers "how many components right now"
incrementally without a full re-traversal — worth knowing exists, out of scope for this chapter.)

---

## Worked Example: Multi-Source BFS

Ordinary BFS seeds the queue with one starting node at level 0. **Multi-source BFS** seeds it with
_several_ nodes simultaneously, all at level 0 together — the pattern behind problems like "how many
minutes until every fresh orange is adjacent to a rotten one" or "distance from the nearest exit" in
a grid of rooms and walls.

```python
from collections import deque

def distance_from_nearest_source(graph, sources):
    """Fewest-edges distance from ANY node in `sources` to every reachable node."""
    distance = {source: 0 for source in sources}   # every source starts at level 0, together
    queue = deque(sources)

    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in distance:
                distance[neighbor] = distance[node] + 1
                queue.append(neighbor)

    return distance
```

```python
>>> graph = {
...     "A": ["B"], "B": ["A", "C"], "C": ["B", "D"],
...     "D": ["C", "E"], "E": ["D"],
... }
>>> distance_from_nearest_source(graph, ["A", "E"])
{'A': 0, 'E': 0, 'B': 1, 'D': 1, 'C': 2}
```

Two sources, `A` and `E`, sitting at opposite ends of a line graph. `B` and `D` are each one edge
from their nearer source; `C`, sitting exactly in the middle, is two edges from _either_ one — and
the function correctly reports the distance to whichever source is closer, without ever being told
which source a given node "belongs to." That's the entire point of seeding multiple nodes at once:
the queue doesn't track which source discovered a node, only how far it is from _some_ source.

**Why this is still correct — the super-source argument.** Picture one imaginary node `S`, not part
of the real graph, connected by a zero-cost edge to every real source (`A` and `E` above). Ordinary
single-source BFS from `S` would discover `A` and `E` at distance 1, then everything one edge
further out from either at distance 2, and so on. Because the edges from `S` cost nothing, "distance
from `S`" and "distance from the nearest real source" differ by exactly the constant 1 for every
node — so subtracting that constant recovers the real answer. Seeding the queue directly with
`[A, E]` at distance 0, instead of materializing `S` and its zero-cost edges, is exactly that
subtraction done in advance: skip the fictional hop, start the real frontier where it would have
landed one step later. BFS's correctness never depended on the initial frontier containing exactly
one node — the algorithm only needs "when a node is dequeued, its recorded distance is the fewest
edges from _some_ member of the starting frontier," and that invariant holds whether the starting
frontier has one member or many.

**Grounding it in the canonical problem.** "Rotting oranges" is this exact function wearing a grid:
every already-rotten orange is a source at distance 0, every fresh orange is a node waiting to be
reached, and a cell's neighbors are its four grid-adjacent cells (skipping walls or empty cells
instead of looking them up in an adjacency dict). The answer to "how many minutes until all fresh
oranges rot" is `max(distance.values())` restricted to cells that started fresh — and if any fresh
cell never appears in `distance` at all, it was never reachable from any rotten orange, which is
exactly the "-1, impossible" case that problem asks for. Nothing about the traversal changes; only
where "neighbors" comes from does, the same substitution the tree and queue chapters already made
routine.

---

## DFS vs. BFS on a Graph

Part 05 drew this line for trees — preorder/postorder for construction and teardown, level-order for
"nearest first." The same distinction generalizes directly to graphs, because it was never really
about trees specifically:

| Reach for **DFS** when...                                                                                         | Reach for **BFS** when...                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| The question is "does a path exist," not "what's the shortest one"                                                | The question is "shortest path" or "fewest edges" in an **unweighted** graph |
| The problem wants to explore as deep as possible before backtracking (maze solving, backtracking-adjacent search) | The problem wants level-by-level / distance-from-source ordering             |
| Topological sort (needs a DFS finish order — later chapter)                                                       | Multi-source "distance from nearest of several starts" problems              |
| Cycle detection (needs to notice an edge back to an in-progress ancestor)                                         | —                                                                            |
| Connected components — either works                                                                               | Connected components — either works                                          |

The reasoning underneath the table is the same reasoning BFS's correctness argument above already
relied on: BFS explores the entire frontier at distance `k` before touching anything at distance
`k + 1`, which is precisely what guarantees the _first_ time any node is reached, it's been reached
by a shortest path. DFS gives up that guarantee entirely — it commits to one neighbor and chases it
as far as it goes before ever coming back to try a sibling — which is exactly the shape "is there a
path at all," "explore fully before giving up," and "process children before their parent" problems
want, and exactly the shape that makes "shortest path" no longer a meaningful question to ask of a
DFS ordering.

**Complexity is identical on paper, not in practice.** Both traversals are O(V + E) time and O(V)
space in the worst case — neither one enjoys the tighter O(h) stack bound Part 05's _balanced_ tree
case could hope for, because nothing about an arbitrary graph promises anything resembling balance.
The practical choice between them almost never comes down to Big-O; it comes down to which one's
_ordering guarantee_ — depth-first commitment or breadth-first nearest-first — actually matches the
question being asked.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
