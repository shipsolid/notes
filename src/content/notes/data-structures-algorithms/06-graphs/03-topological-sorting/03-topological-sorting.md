---
title: "3 — Topological Sorting"
description: "Ordering a DAG's nodes so every edge points forward — via DFS post-order or Kahn's BFS-based algorithm."
tags: ["data-structures-algorithms","graphs","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-41"
relations:
  - slug: data-structures-algorithms/06-graphs/02-graph-traversal/02-graph-traversal
    kind: related
---

# 3 — Topological Sorting

[[02-graph-traversal|Chapter 2]] gave you two ways to visit every reachable node — DFS's
dive-to-the-bottom-then-backtrack, and BFS's spread-out-one-layer-at-a-time. Both algorithms are
indifferent to the order in which they _finish_ nodes; reaching everything was the entire goal. This
chapter reuses both traversal engines for a problem where finish order is the whole point: not "did
I reach every node" but "in what sequence must these nodes happen, given that some of them can't
start until others are done." That reframing — from reachability to sequencing — is what turns a
plain graph traversal into a scheduling algorithm, and it's why topological sorting is usually the
first graph algorithm that feels like it's solving a real problem instead of just exploring a
structure.

---

## The Problem: Linear Order Respecting Dependencies

A **topological order** (or topological sort) of a directed graph is a linear arrangement of all its
vertices such that for every directed edge `u -> v`, `u` appears somewhere before `v` in the
arrangement. Nothing more is required — the ordering doesn't need to respect any distance, weight,
or alphabetical tiebreak; it only needs to never place a node after something that depends on it.

Three framings make this concrete, and all three are the same problem wearing different clothes:

- **Course prerequisites.** A university's course catalog is a directed graph: an edge from "Data
  Structures" to "Algorithms" means Data Structures must be completed before Algorithms. A
  topological order of that graph is a valid multi-semester plan — a sequence in which every course
  appears after everything it requires.
- **Build systems.** A `Makefile` or a compiler's translation-unit graph has an edge from each
  source file to the object file that depends on it (or, inverted, from each dependency to its
  dependent). Compiling in topological order guarantees every `.o` file is built only after
  everything it `#include`s has already been built.
- **Package installation.** `apt`, `npm`, and every other package manager resolve a dependency graph
  before installing anything. If package `A` depends on package `B`, the installer must unpack and
  configure `B` first — the install order it computes is a topological sort of the dependency graph.

A useful thing to notice immediately: a topological order is almost never unique. If two nodes have
no path between them in either direction — two independent courses with no shared prerequisite
chain, two build targets that don't touch each other — either relative order of the two is valid. A
DAG in general has a whole family of valid topological orders, and both algorithms in this chapter
are allowed to return any member of that family; there's no "the" canonical answer to check against,
only "is this specific ordering consistent with every edge."

---

## Why It Requires a DAG

The name says it: topological sort operates on a **DAG** — a Directed Acyclic Graph — and the
"acyclic" is not a minor restriction, it's the thing that makes the problem solvable at all.

Suppose the dependency graph has a cycle: `A` depends on `B`, and `B` depends on `A`. Any linear
ordering has to place one of them first. If `A` comes first, the edge `B -> A` (read as "`B` must
precede `A`") is violated. If `B` comes first, the edge `A -> B` is violated. There is no third
option in a linear order — one of the two must come first — so **no valid ordering exists**. This
isn't a limitation of any particular algorithm; it's a logical contradiction. You are being asked
for an ordering that simultaneously requires `A` before `B` and `B` before `A`, and no permutation
of a two-element set satisfies both.

The same argument generalizes to a cycle of any length: `A -> B -> C -> A` demands `A` before `B`
before `C` before `A` — a chain of "before" relationships that loops back on itself. Follow it
around once and you've proven `A` must come before itself, which is impossible for a strict linear
order. Every cycle, regardless of size, produces this same contradiction by transitivity.

Flip that observation around and it becomes the most useful fact in this chapter: **a graph has a
valid topological order if and only if it is acyclic.** Every DAG has at least one topological order
(there's always at least one node with no incoming edges to place first, then the same argument
applies to what's left — this is exactly the intuition Kahn's algorithm below turns into code), and
every graph with a cycle has none. That "if and only if" is worth sitting with, because it means the
two directions of this fact are both algorithms:

- Given a DAG, produce a topological order (the obvious direction — the rest of this chapter).
- Given _any_ directed graph, attempting to produce a topological order and **failing to place every
  node** is itself a complete, correct proof that a cycle exists.

That second bullet is the payoff. It means you never have to write separate cycle-detection code and
separate topological-sort code — get topological sort right, and cycle detection for directed graphs
falls out of it for free. Both implementations below make that check explicit.

---

## Approach 1: DFS-Based (Postorder, Reversed)

[[02-binary-trees|Part 05, Chapter 2]] introduced postorder with a specific framing: visit a node
only after both its children — every subtree rooted below it — have been fully processed.
Topological sort generalizes that same idea from trees to graphs: **visit (finish) a node only after
every node it can reach has already been finished.**

The algorithm is almost embarrassingly close to a plain DFS traversal:

1. Maintain a `visited` set and an empty list, `finished_order`.
2. For every node not yet in `visited`, start a DFS from it.
3. Inside the DFS, recurse into every unvisited neighbor first — same as any DFS.
4. Only after every neighbor has been fully recursed into (i.e., right where a postorder traversal
   would "visit" the node), append the current node to `finished_order`.
5. Once every node has been covered by some DFS call, reverse `finished_order`. That reversed list
   is a valid topological order.

```python
def topological_sort_dfs(graph: dict[str, list[str]]) -> list[str]:
    """
    graph: adjacency list, node -> list of nodes it points to.
    Every node must appear as a key, even if its list is empty.
    Assumes graph is a DAG -- see the cycle-detection section for why
    this version will NOT tell you if that assumption is wrong.
    """
    visited = set()
    finished_order = []  # postorder: a node lands here only after
                         # every node it points to already has

    def dfs(node):
        visited.add(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                dfs(neighbor)
        finished_order.append(node)  # "finished" -- nothing left to explore from here

    for node in graph:
        if node not in visited:
            dfs(node)

    return finished_order[::-1]
```

**Why reversing the finish order works** is worth deriving rather than memorizing, because the
derivation is the part that survives a follow-up question. Take any edge `u -> v` in the DAG. There
are exactly two ways DFS can encounter it:

- `v` hasn't been visited yet when the DFS exploring `u` reaches the `u -> v` edge. Then the
  recursive call `dfs(v)` happens _inside_ `dfs(u)`'s call — nested inside it — which means `v`
  finishes and gets appended to `finished_order` before `u` does (the call for `v` has to return
  before `u`'s own DFS call can finish and append itself).
- `v` was already fully visited by some earlier, unrelated DFS call before `u`'s DFS ever reaches
  it. Then `v` was appended to `finished_order` even earlier — before `u`'s DFS call started at all.

Either way, **`v` is appended to `finished_order` before `u` is**, for every edge `u -> v`. (A back
edge — `v` still mid-exploration, on the current call stack, when `u` reaches it — would break this
argument, but a back edge is precisely what a cycle looks like in DFS, and the graph is assumed to
be a DAG, so it can't occur.) So in the raw `finished_order` list, `v` always sits at an earlier
index than `u` for every edge `u -> v` — exactly backwards from what a topological order needs.
Reverse the list once, and every `u` now sits before every `v` it points to. That's the whole proof.

**Trace it through** a small, intuitive dependency graph — the order you get dressed in the morning,
where an edge `X -> Y` means "put on `X` before `Y`":

```python
outfit = {
    "underwear": ["pants"],
    "pants":     ["belt", "shoes"],
    "shirt":     ["jacket"],
    "belt":      ["jacket"],
    "jacket":    [],
    "socks":     ["shoes"],
    "shoes":     [],
}

print(topological_sort_dfs(outfit))
# -> ['socks', 'shirt', 'underwear', 'pants', 'shoes', 'belt', 'jacket']
```

Check it by hand against every edge: `underwear` before `pants` — yes. `pants` before `shoes` and
`belt` — yes to both. `belt` before `jacket` — yes. `socks` before `shoes` — yes. `shirt` before
`jacket` — yes. Every single edge points forward in this list. Note that `shirt` and `underwear`
never got compared to each other at all — there's no path between them — which is exactly why DFS
was free to place `socks` and `shirt` ahead of `underwear`: nothing in the graph says otherwise. A
different starting node, or a different neighbor-visitation order within each adjacency list, would
produce an equally valid but differently-shaped ordering. That's expected, not a bug — recall from
the Problem section that topological order is a family, not a single answer.

This version is recursive, which means it inherits the same call-stack-depth ceiling as every
recursive DFS from Chapter 2 — a dependency chain a few thousand nodes deep (a genuinely long build
pipeline, say) will hit Python's default recursion limit. The iterative rewrite follows the same
explicit-stack-plus-marker trick [[02-binary-trees|Part 05, Chapter 2]] used for iterative
postorder: push a node with a "children not yet queued" marker, and only append it to the result
once you pop it back with the marker flipped to "already queued." The mechanics are identical; only
the notion of "child" widens from "left/right" to "every adjacency-list neighbor."

---

## Approach 2: Kahn's Algorithm (BFS-Based)

Where the DFS approach reasons about _finishing_ nodes, Kahn's algorithm reasons about _starting_
them — specifically, about which nodes have nothing left blocking them.

Define the **in-degree** of a node as the number of edges pointing into it — in the dependency
framing, the number of prerequisites it still has. A node with in-degree 0 has nothing blocking it;
it's safe to place next in the order right now. The algorithm is:

1. Compute the in-degree of every node up front, by scanning every edge once.
2. Seed a queue with every node whose in-degree is already 0.
3. Repeat: pop a node from the queue, append it to the result. For each of its outgoing neighbors,
   decrement that neighbor's in-degree by one (this node's dependency on it is now satisfied). If a
   neighbor's in-degree just dropped to 0, it has no prerequisites left — enqueue it.
4. Stop when the queue is empty.

```python
from collections import deque

def topological_sort_kahn(graph: dict[str, list[str]]) -> list[str]:
    """
    graph: adjacency list, node -> list of nodes it points to.
    Every node must appear as a key, even if its list is empty.
    Raises ValueError if the graph contains a cycle -- see below.
    """
    in_degree = {node: 0 for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            in_degree[neighbor] += 1

    queue = deque(node for node in graph if in_degree[node] == 0)
    result = []

    while queue:
        current = queue.popleft()
        result.append(current)
        for neighbor in graph[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)  # its last prerequisite was just satisfied

    if len(result) != len(graph):
        raise ValueError("cycle detected: no valid topological order exists")

    return result
```

**Trace it through** the same dressing DAG. Initial in-degrees:
`underwear=0, pants=1, shirt=0, belt=1, jacket=2, socks=0, shoes=2`. The queue starts with
everything at in-degree 0: `underwear, shirt, socks` (in whatever order the dict iterates them).

| Step | Pop         | Result so far               | In-degree updates               | Newly enqueued  |
| ---- | ----------- | --------------------------- | ------------------------------- | --------------- |
| 1    | `underwear` | `[underwear]`               | `pants: 1 -> 0`                 | `pants`         |
| 2    | `shirt`     | `[underwear, shirt]`        | `jacket: 2 -> 1`                | —               |
| 3    | `socks`     | `[underwear, shirt, socks]` | `shoes: 2 -> 1`                 | —               |
| 4    | `pants`     | `[..., pants]`              | `belt: 1 -> 0`, `shoes: 1 -> 0` | `belt`, `shoes` |
| 5    | `belt`      | `[..., belt]`               | `jacket: 1 -> 0`                | `jacket`        |
| 6    | `shoes`     | `[..., shoes]`              | —                               | —               |
| 7    | `jacket`    | `[..., jacket]`             | —                               | —               |

Final order: `underwear, shirt, socks, pants, belt, shoes, jacket` — seven nodes, matching
`len(graph)`, and every edge still points forward. Different from the DFS run's ordering, and both
are correct: two members of the same valid-orderings family.

---

## Cycle Detection as a Free Side Effect

Here's the mechanism behind why Kahn's algorithm can prove a cycle exists just by counting. Every
node stuck inside a cycle has at least one incoming edge that originates from _another node in that
same cycle_. That in-cycle prerequisite can only be satisfied by processing the node that's blocking
it — but that node has its own unsatisfied in-cycle prerequisite, and so on, all the way around the
cycle back to the start. No node in the cycle can ever be the _first_ one processed, because "first"
would require an in-degree of 0, and every node in the cycle always has at least that one in-cycle
incoming edge that nothing outside the cycle can clear. The queue never receives any of them — they
simply never get pushed, no matter how long the algorithm runs.

The consequence is visible directly in the result's length: every node reachable from outside the
cycle still gets processed normally, but every node inside (or only reachable through) the cycle
never does. So `len(result) < len(graph)` precisely when a cycle exists, which is exactly the check
the implementation above makes explicit:

```python
if len(result) != len(graph):
    raise ValueError("cycle detected: no valid topological order exists")
```

Nothing about this check is a heuristic — it is a direct restatement of the "if and only if" from
the DAG section: a graph has a complete topological order if and only if it's acyclic, so an
_incomplete_ one is a certificate that a cycle exists.

The DFS-based version from the previous section does **not** get this for free — and demonstrating
that concretely matters more than stating it. Run `topological_sort_dfs` on the three-node cycle
`A -> B -> C -> A` and it doesn't raise anything; it silently returns `['A', 'B', 'C']`, an ordering
that violates the very edge (`C -> A`) that closes the loop. The plain `visited` set can't tell the
difference between "already fully explored, safely revisit-able" and "currently being explored one
level up the call stack, revisiting it means we've looped back on ourselves." Fixing that
distinction — and why it's specifically a DFS problem, not a Kahn's problem — is the subject of the
comparison below.

---

## Comparing the Two Approaches

Both algorithms are **O(V + E)**: every vertex is processed once and every edge is inspected exactly
once, whether that inspection happens as a DFS recursive call or as an in-degree decrement. Space is
O(V) for both — a visited set plus recursion stack for DFS, an in-degree map plus queue for Kahn's.
Neither is asymptotically better than the other; the choice between them is about fit, not speed.

|                                  | DFS-based                                                                                   | Kahn's algorithm                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Mental model                     | Postorder finish, then reverse                                                              | In-degree-zero queue, "ready" set                                    |
| Natural if you already reach for | DFS, recursion, postorder                                                                   | BFS, queues, worklists                                               |
| Cycle detection                  | Requires a third state, tracked separately                                                  | Falls out of `len(result) != len(graph)`                             |
| Maps onto the real-world framing | Less directly — "finish order, reversed" isn't how anyone naturally thinks about scheduling | Very directly — "what can I do right now, given what's already done" |
| Risk on deep graphs              | Recursive call-stack depth                                                                  | None — fully iterative                                               |

**Kahn's is usually the more natural fit in practice**, for a reason that's easy to underrate: the
in-degree-zero queue at every step of the algorithm _literally is_ "the set of things safe to do
right now." That's not an analogy bolted on afterward — it's a one-to-one match to the real-world
question the whole chapter opened with (which courses can I take this semester, given what I've
already completed; which packages can install next, given what's already unpacked). DFS-based
topological sort is also correct, but its core operation — "reverse the order nodes finished
exploring in" — has no equally direct real-world reading. It's a valid proof technique, not a mental
model that matches how anyone naturally reasons about scheduling.

The cycle-detection gap is the sharper practical difference, though, and it deserves the full
explanation rather than a one-line dismissal. A plain DFS `visited` set has exactly two states:
unvisited, and visited. That's insufficient for directed-graph cycle detection, because it can't
distinguish two situations that look identical to a set membership check but mean opposite things:

- **Revisiting a node that's fully finished** — every one of its neighbors already explored, its own
  call already returned. In a DAG, this is completely normal and expected: a "diamond" shape like
  `A -> B`, `A -> C`, `B -> D`, `C -> D` has `D` reachable by two different paths, and a correct DFS
  will attempt to visit `D` twice — once from `B`, once from `C`. The second attempt should simply
  skip it. No cycle here.
- **Revisiting a node that's still on the current call stack** — its DFS call started but hasn't
  returned yet, meaning you're still somewhere inside its own recursive exploration when you loop
  back around to it. That is exactly what a cycle looks like from inside a DFS: you can only
  re-encounter an _unfinished_ ancestor by having followed a path that leads back to it, which is
  the definition of a cycle.

A plain `visited` set collapses both cases into "already seen, skip it" — which is why the naive
version above missed the `A -> B -> C -> A` cycle entirely. The fix is to track **three** states
instead of two, conventionally called white (untouched), gray (on the current call stack —
exploration started, not yet finished), and black (fully finished):

```python
def topological_sort_dfs_safe(graph: dict[str, list[str]]) -> list[str]:
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {node: WHITE for node in graph}
    finished_order = []

    def dfs(node):
        color[node] = GRAY  # exploration in progress -- currently on the call stack
        for neighbor in graph[node]:
            if color[neighbor] == GRAY:
                # neighbor is an ancestor still being explored -- this edge
                # closes a loop back onto the current call stack: a cycle.
                raise ValueError(
                    f"cycle detected: edge back to {neighbor!r}, "
                    f"which is still on the call stack"
                )
            if color[neighbor] == WHITE:
                dfs(neighbor)
            # color[neighbor] == BLACK: already fully finished via another
            # path -- normal in a DAG, nothing to do.

        color[node] = BLACK  # fully finished -- safe to revisit from anywhere
        finished_order.append(node)

    for node in graph:
        if color[node] == WHITE:
            dfs(node)

    return finished_order[::-1]
```

This now raises on the `A -> B -> C -> A` example, with a specific edge implicated, rather than
silently returning a broken order. Kahn's algorithm never needed this extra bookkeeping in the first
place, because its notion of "done" — in-degree reaches 0 — already only ever moves in one direction
and never has to reason about "am I currently in the middle of processing this." That structural
simplicity, not raw performance, is the real argument for defaulting to Kahn's algorithm whenever
the input isn't already guaranteed to be a DAG.

---

## Worked Example: Course Schedule

Put both the sequencing and the cycle-detection pieces together on the motivating example from the
top of the chapter: given a list of courses and a list of `(course, prerequisite)` pairs, produce a
valid order to take every course — or determine that no such order exists.

```python
from collections import deque

def find_course_order(
    courses: list[str],
    prerequisites: list[tuple[str, str]],
) -> list[str]:
    """
    courses: every course that must be scheduled.
    prerequisites: (course, prereq) pairs -- `prereq` must be completed
    before `course` can be taken.

    Returns one valid course order. Raises ValueError if the
    prerequisites form a cycle -- i.e., if no valid schedule exists.
    """
    graph = {course: [] for course in courses}
    in_degree = {course: 0 for course in courses}

    for course, prereq in prerequisites:
        graph[prereq].append(course)  # prereq -> course
        in_degree[course] += 1

    queue = deque(c for c in courses if in_degree[c] == 0)
    order = []

    while queue:
        current = queue.popleft()
        order.append(current)
        for next_course in graph[current]:
            in_degree[next_course] -= 1
            if in_degree[next_course] == 0:
                queue.append(next_course)

    if len(order) != len(courses):
        stuck = [c for c in courses if c not in order]
        raise ValueError(
            f"no valid course order exists -- prerequisite cycle involves: {stuck}"
        )

    return order
```

Run it against a small curriculum:

```python
courses = [
    "Intro to Programming",
    "Data Structures",
    "Algorithms",
    "Operating Systems",
    "Distributed Systems",
    "Databases",
    "Compilers",
]

prerequisites = [
    ("Data Structures", "Intro to Programming"),
    ("Algorithms", "Data Structures"),
    ("Operating Systems", "Data Structures"),
    ("Distributed Systems", "Operating Systems"),
    ("Distributed Systems", "Algorithms"),
    ("Databases", "Data Structures"),
    ("Compilers", "Algorithms"),
]

print(find_course_order(courses, prerequisites))
# -> ['Intro to Programming', 'Data Structures', 'Algorithms',
#     'Operating Systems', 'Databases', 'Compilers', 'Distributed Systems']
```

Every prerequisite pair holds up: `Intro to Programming` precedes `Data Structures`;
`Data Structures` precedes `Algorithms`, `Operating Systems`, and `Databases`; `Algorithms` precedes
`Compilers` and (transitively, through `Operating Systems`) contributes to unlocking
`Distributed Systems`, which correctly lands dead last since it depends on both `Operating Systems`
and `Algorithms` and everything upstream of them.

Now break it. Suppose a curriculum-committee error quietly adds `Intro to Programming` as _also_
requiring `Distributed Systems` — the very last course in the plan now requires, transitively, the
very first one:

```python
bad_prerequisites = prerequisites + [("Intro to Programming", "Distributed Systems")]

find_course_order(courses, bad_prerequisites)
# -> ValueError: no valid course order exists --
#    prerequisite cycle involves: ['Intro to Programming', 'Data Structures',
#    'Algorithms', 'Operating Systems', 'Distributed Systems', 'Databases', 'Compilers']
```

Notice what happened to the in-degree count: `Intro to Programming`'s in-degree jumps from 0 to 1,
so it's no longer eligible to seed the queue. Since every other course in this curriculum depends on
`Intro to Programming` directly or transitively, **nothing** ever reaches in-degree 0, the queue
starts and stays empty, and the entire schedule — all seven courses — is reported stuck. That's the
practical shape cycle detection takes in a real system: not "these two nodes conflict" but "the
whole downstream schedule is unsatisfiable," because a single edge closing a loop back to the root
of the dependency graph poisons every course that depends on it, directly or transitively. Finding
_which_ edge caused it is a separate, harder problem than detecting _that_ one exists — this
implementation reports the stranded set, not the specific back edge, which is exactly the tradeoff
the plain in-degree count makes in exchange for not needing the three-color DFS machinery from the
previous section.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
