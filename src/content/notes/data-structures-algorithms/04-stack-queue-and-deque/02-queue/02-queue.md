---
title: "2 — Queue"
description: "FIFO fundamentals: enqueue/dequeue, why list.pop(0) is a silent O(n) trap, collections.deque as the fix, the two-stack amortized-O(1) implementation, and BFS as the queue's signature use case."
tags: ["data-structures-algorithms","stacks-queues","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-20"
relations:
  - slug: data-structures-algorithms/04-stack-queue-and-deque/01-stack/01-stack
    kind: related
---

# 2 — Queue

A line at a coffee shop is a queue, not a stack — the first person to join is the first person
served, no matter how many people join behind them. The previous chapter's stack restricted you to
one end of the structure for both operations; a queue restricts you to _opposite_ ends — one for
adding, the other for removing. That change in geometry is what turns LIFO into FIFO, and it's also
what turns a naive Python implementation from fine into silently quadratic — the trap this chapter
is mostly about defusing.

---

## FIFO: Opposite Ends for In and Out

A **queue** supports two core operations: **enqueue** (add to the back) and **dequeue** (remove from
the front). Whatever goes in first comes out first — **First In, First Out**, the mirror image of
the stack's Last In, First Out.

A stack picks _one_ end and does everything there — `push` and `pop` both touch the same end, which
is exactly why a Python `list` with `append()`/`pop()` (no index, defaulting to the last element) is
a perfect O(1) stack. A queue picks _two_ ends and splits the operations between them. That split is
trivial to state and, as the next section shows, not trivial to implement efficiently on top of a
structure built around one end.

| Operation | Stack (Ch. 1)          | Queue                            |
| --------- | ---------------------- | -------------------------------- |
| Insert    | `push` — top           | `enqueue` — back                 |
| Remove    | `pop` — top (same end) | `dequeue` — front (opposite end) |
| Order out | Most recently added    | Least recently added             |

---

## The list.pop(0) Trap — and Why deque Fixes It

The obvious-looking Python queue is wrong:

```python
queue = []
queue.append("a")
queue.append("b")
queue.append("c")

front = queue.pop(0)   # "a" -- looks right, IS right... and is O(n)
```

`queue.pop(0)` returns the correct element, but the cost is the problem. This is the exact
"insert/delete at beginning" row from the arrays chapter's complexity table ([[01-arrays]], Part 02
Chapter 1): a `list` is a contiguous, index-addressed buffer, so removing element 0 leaves a gap at
the front that must be closed by shifting every remaining element left one slot — O(n). Not
carelessness; contiguity is the same property that makes indexing O(1), and you don't get one
without paying for the other.

A single `pop(0)` is cheap to overlook. The trap is that a queue calls it _every time an item
leaves_ — `queue = []; ... ; while queue: queue.pop(0)` over 100,000 items does 100,000 shifts of
O(n) average size, for O(n²) overall. Nothing in the code looks wrong; it just gets quietly slower
as the queue grows.

The fix is **`collections.deque`**, a double-ended queue backed by a doubly linked list of
fixed-size blocks ([[02-doubly-linked-list]], Part 03 Chapter 2): each block already knows its
neighbor in both directions, so removing from either end is a constant number of relinks, never a
shift. `deque` gives O(1) at **both** ends — more than a plain queue needs, but exactly what it
should cost:

```python
from collections import deque

queue = deque()
queue.append("a")       # enqueue -- O(1)
queue.append("b")
queue.append("c")

front = queue.popleft()  # dequeue -- O(1), not O(n)
```

`append()` / `popleft()` is the FIFO pairing. (`deque` also supports `appendleft()` / `pop()` for
the other direction — that generality is its own chapter, [[04-deque]], Part 04 Chapter 4.) The rule
for this chapter is short: if you're about to write `list.pop(0)` in a loop, stop and reach for
`deque` instead — there's no scenario where the list version is the right call.

---

## The Two-Stack Queue: Amortized O(1) From Scratch

`deque` is the practical answer, but interviews sometimes ask for a queue built only from stacks —
"implement a queue using two stacks" — and it's worth knowing because the _argument_ for why it's
efficient, not just the mechanism, reappears elsewhere in this book.

The idea: keep two stacks, `in_stack` and `out_stack`. Enqueue always pushes onto `in_stack` — O(1).
Dequeue is where the trick lives: if `out_stack` is empty, dump the _entire_ contents of `in_stack`
onto `out_stack` via repeated pop/push, which reverses their order — the oldest element (bottom of
`in_stack`) ends up on _top_ of `out_stack`, exactly where a FIFO dequeue needs it. Then pop from
`out_stack`.

```python
class TwoStackQueue:
    def __init__(self):
        self.in_stack: list = []
        self.out_stack: list = []

    def enqueue(self, value) -> None:
        """O(1) -- push onto the incoming stack."""
        self.in_stack.append(value)

    def dequeue(self):
        """Amortized O(1) -- see analysis below."""
        if not self.out_stack:
            while self.in_stack:
                self.out_stack.append(self.in_stack.pop())
        if not self.out_stack:
            raise IndexError("dequeue from empty queue")
        return self.out_stack.pop()
```

```python
>>> q = TwoStackQueue()
>>> q.enqueue(1); q.enqueue(2); q.enqueue(3)
>>> q.dequeue()   # triggers the transfer: out_stack becomes [3, 2, 1], pops 1
1
>>> q.enqueue(4)              # in_stack: [4] -- out_stack untouched
>>> q.dequeue(), q.dequeue()  # out_stack still has work: pops 2, then 3
(2, 3)
```

**Why this is amortized O(1), not O(n):** a single `dequeue` call _can_ do O(n) work — the one that
finds `out_stack` empty and transfers everything from `in_stack`. That looks like the `list.pop(0)`
trap again. The difference is what happens to each element afterward: once moved from `in_stack` to
`out_stack`, it's popped directly off `out_stack` later and never moved again. Every element crosses
the in-to-out boundary **at most once** in its lifetime. Across n enqueues and n dequeues, total
transfer work over _all_ calls is bounded by O(n) — one push and one pop per element, period —
however unevenly it's spread across individual calls.

Same amortized shape as two other results already in this book: **dynamic array resizing**
([[02-asymptotic-analysis]], Part 01 Ch. 2) — occasional O(n) resizes become exponentially rarer as
fast as they get more expensive — and the **sliding-window two-pointer bound**
([[04-sliding-window]], Part 02 Ch. 4) — `left` advances at most n times _total_ across a scan, not
per outer step. All three bound the _total_ work across the whole sequence of operations and divide
by the operation count, instead of pricing the worst single call.

---

## BFS: The Queue's Signature Use Case

The single most important reason to know a queue cold is **breadth-first search (BFS)** — visiting a
graph or tree level by level, nearest nodes first, which is exactly the FIFO order a queue enforces
for free. Part 06 (Graphs) covers BFS in full — shortest paths, level tracking, multi-source
variants; this is just the skeleton:

```python
from collections import deque

def bfs_levels(graph: dict, start):
    """Generic level-by-level traversal. graph: adjacency dict {node: [neighbors]}."""
    visited = {start}
    queue = deque([start])
    levels = []

    while queue:
        level_size = len(queue)          # freeze this level's boundary
        level_nodes = []
        for _ in range(level_size):
            node = queue.popleft()        # FIFO: process in discovery order
            level_nodes.append(node)
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)  # enqueue for the *next* level
        levels.append(level_nodes)

    return levels
```

```python
>>> graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}
>>> bfs_levels(graph, "A")
[['A'], ['B', 'C'], ['D']]
```

`level_size = len(queue)` is the only non-obvious line: it freezes how many nodes belong to the
_current_ level before next-level nodes get enqueued into the same queue — that's what turns "visit
everyone reachable" into "visit everyone one level at a time." Swap the queue for a stack and the
algorithm still visits every node, but becomes depth-first (the previous chapter's iterative DFS) —
a stack hands back the most recently discovered node, not the earliest. Same skeleton, one structure
swapped, opposite traversal order.

---

## Complexity Summary

| Operation       | `collections.deque`                   | Plain `list` (naive, pop from front)         |
| --------------- | ------------------------------------- | -------------------------------------------- |
| Enqueue (back)  | O(1)                                  | O(1) (`append`)                              |
| Dequeue (front) | O(1)                                  | O(n) (`pop(0)` shifts every element)         |
| Peek front      | O(1)                                  | O(1) (`queue[0]`, no removal)                |
| Two-stack queue | O(1) amortized dequeue / O(1) enqueue | — (alternative construction, not list-based) |

The one line to keep from this chapter: never build a real queue on a plain `list` popping from
index 0. Reach for `collections.deque` by default, and know the two-stack construction for when an
interviewer explicitly forbids it.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
