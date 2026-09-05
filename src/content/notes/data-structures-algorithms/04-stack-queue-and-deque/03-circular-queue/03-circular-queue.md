---
title: "3 — Circular Queue"
description: "Fixed-capacity ring-buffer queue that reuses freed slots without shifting elements — modulo-arithmetic wraparound over a plain array, and the full-vs-empty ambiguity every implementation has to resolve."
tags: ["data-structures-algorithms","stacks-queues","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-21"
relations:
  - slug: data-structures-algorithms/04-stack-queue-and-deque/02-queue/02-queue
    kind: related
  - slug: data-structures-algorithms/03-linked-data-structures/03-circular-linked-list/03-circular-linked-list
    kind: related
---

# 3 — Circular Queue

A [[02-queue]] backed by a plain array has one honest move on dequeue: shift every remaining element
left so `front` stays pinned at index 0 — O(n), the same tax as `list.pop(0)`. The tempting fix is
to stop shifting and just advance a `front` index instead. That kills the O(n) cost but hides a
worse waste: the slots behind the new `front` are still allocated, still inside the array, and never
touched again. Enough enqueue/dequeue cycles and an array with plenty of room starts reporting
itself full. A circular queue is the fix: stop treating the backing array as a line with a start and
an end, and treat it as a ring instead.

---

## The Problem: A Plain Array Queue Either Shifts or Wastes Space

**Option 1 — shift on every dequeue.** `front` is always index 0; dequeuing means removing that
element and sliding everything else down one position.

```python
def dequeue_by_shifting(buf: list, size: int) -> tuple[object, int]:
    value = buf[0]
    for i in range(1, size):
        buf[i - 1] = buf[i]      # every remaining element moves — O(n)
    return value, size - 1
```

Correct, never wastes a slot, but O(n) per dequeue regardless of how many elements remain — a
million dequeues pays for a million shifts.

**Option 2 — advance a `front` index, never shift.** Dequeue becomes `front += 1` — O(1) — but the
slots below the new `front` are now dead: still inside the array, still occupied by values nobody
will read again, and never reclaimed.

```python
class LeakyArrayQueue:
    def __init__(self, capacity: int):
        self.buf = [None] * capacity
        self.capacity = capacity
        self.front = 0
        self.rear = 0          # next free slot to write into

    def enqueue(self, value) -> bool:
        if self.rear == self.capacity:
            return False        # "full" — even if front has advanced past 0
        self.buf[self.rear] = value
        self.rear += 1
        return True

    def dequeue(self):
        value = self.buf[self.front]
        self.front += 1          # O(1) — but that slot is gone for good
        return value
```

Walk `capacity=5` through enqueue ×2, dequeue ×2, then enqueue ×3 more: `rear` hits `capacity` after
five total enqueues and `enqueue` starts returning `False` — even though two of those five slots
were freed by the dequeues and sit empty at indices 0 and 1. The array has room; the algorithm can't
see it. That's the trap: O(1) dequeue bought by silently shrinking usable capacity every time the
queue drains and refills.

---

## The Fix: Wraparound via Modulo Arithmetic

The dead space at the front is only dead because `rear` never goes back to look at it. Modulo
arithmetic fixes that: instead of `rear += 1`, advance with `rear = (rear + 1) % capacity`. Once
`rear` runs off the end of the array, it wraps back to index 0 — which, if enough dequeues have
happened, is exactly the reclaimed dead space.

```python
front = (front + 1) % capacity
rear  = (rear  + 1) % capacity
```

Trace `capacity=5`, indices `[_, _, _, _, _]`:

```
enqueue A, B, C   -> [A, B, C, _, _]   front=0 rear=3
dequeue, dequeue  -> [_, _, C, _, _]   front=2 rear=3   (slots 0,1 are dead space so far)
enqueue D, E, F   -> rear: 3->4->0->1  -> [F, _, C, D, E]   front=2 rear=1
```

`F` landed at index 0 — the exact slot `A` vacated two dequeues ago — because `rear` wrapped
`(4 + 1) % 5 == 0` instead of failing at the boundary. No element moved to make room; the ring just
reused the slot. Enqueue and dequeue are both still O(1): one write or read, one modulo increment,
no loop.

---

## The Full-vs-Empty Ambiguity

There's exactly one subtlety, and every implementation has to answer it explicitly:
**`front == rear` is ambiguous.** It's the natural state of a brand-new, empty queue — nothing
written yet, both indices at 0. But after enough wraparounds it's _also_ what a completely full
queue looks like: `rear` has lapped the ring and caught back up to `front` from behind. Same index
relationship, opposite meanings — `if front == rear` alone can't tell them apart.

**Fix 1 — track a `size` (or `count`) counter alongside `front`/`rear`.** Every successful enqueue
increments it, every successful dequeue decrements it. `is_full` is `size == capacity`; `is_empty`
is `size == 0`. The index arithmetic no longer carries that meaning at all — the simplest fix, and
the one least likely to hide an off-by-one bug, which is why it's the primary implementation below.

**Fix 2 — deliberately waste one slot.** Size the backing array `capacity + 1` and define "full" as
`(rear + 1) % (capacity + 1) == front` — stop enqueuing one slot _before_ `rear` would catch
`front`. Empty stays `front == rear`; full becomes a distinct index relationship, so no counter is
needed — at the cost of one permanently unusable slot. Common in textbook/interview implementations
that want to avoid a second piece of mutable state; the counter approach is more common in
production because it's harder to get wrong under concurrent access.

---

## Worked Example: A `CircularQueue` Class

Counter approach, fixed capacity, all operations O(1):

```python
class CircularQueue:
    def __init__(self, capacity: int):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self.buf = [None] * capacity
        self.front = 0
        self.rear = 0
        self.size = 0

    def is_empty(self) -> bool:
        return self.size == 0

    def is_full(self) -> bool:
        return self.size == self.capacity

    def enqueue(self, value) -> None:
        if self.is_full():
            raise OverflowError("circular queue is full")
        self.buf[self.rear] = value
        self.rear = (self.rear + 1) % self.capacity
        self.size += 1

    def dequeue(self):
        if self.is_empty():
            raise IndexError("dequeue from empty circular queue")
        value = self.buf[self.front]
        self.buf[self.front] = None       # drop the reference; avoid a phantom hold
        self.front = (self.front + 1) % self.capacity
        self.size -= 1
        return value
```

| Operation            | Time | Space                       |
| -------------------- | ---- | --------------------------- |
| `enqueue`            | O(1) | O(1)                        |
| `dequeue`            | O(1) | O(1)                        |
| `is_full`/`is_empty` | O(1) | O(1)                        |
| Backing storage      | —    | O(capacity), fixed up front |

No operation touches more than one element, regardless of how many wraparounds have happened —
that's the entire payoff versus the shifting queue.

---

## Circular Queue vs. Circular Linked List

Both solve the same problem — wraparound without shifting elements — by opposite mechanisms, and the
mechanism decides the trade-off. A [[03-circular-linked-list]] gets wraparound as a **structural
property**: the last node's `next` pointer literally _is_ the head, wired once at construction — no
arithmetic involved. A circular queue gets the same behavior from **modulo arithmetic** applied on
every advance: `(index + 1) % capacity`, recomputed on every operation rather than being a fixed
property of any one element. That produces the opposite trade-off:

|                        | Circular Queue (array)                 | Circular Linked List                          |
| ---------------------- | -------------------------------------- | --------------------------------------------- |
| Wraparound source      | `% capacity` on every advance          | one pointer wired at build time               |
| Capacity               | Hard ceiling, fixed at construction    | Grows/shrinks freely, one node at a time      |
| Memory layout          | Contiguous — strong cache locality     | Scattered — pointer chasing, cache-unfriendly |
| Per-element overhead   | None beyond the value itself           | One (or two) pointers per node                |
| Failure mode when full | `enqueue` rejected / raises — explicit | N/A — a new node is just allocated            |

Neither is strictly better: the array version wins when the maximum size is known and throughput
matters (bounded buffers, fixed windows); the linked version wins when the element count is
unpredictable and the pointer overhead is an acceptable price for never having to answer "what
happens when it's full."

---

## Real-World Use Cases

- **Producer-consumer bounded buffer.** A background worker (or an async task queue) writes into a
  fixed-size ring; a consumer drains it from the other end. The fixed capacity is a deliberate
  backpressure signal — rejecting or blocking `enqueue` when `is_full()` is true is what stops a
  fast producer from unbounded memory growth.
- **Fixed-size sliding log / metrics window.** "The last N request latencies" for a rolling p99, or
  "the last N log lines" for a tail view, is exactly a circular queue: new entries overwrite the
  oldest once the window is full, with no resizing or shifting ever needed.
- **OS process ready-queue.** A round-robin scheduler cycles through runnable processes in fixed
  time slices; an array-backed circular queue holds the ready list so "give the next process its
  slice, then re-enqueue it at the back" is two O(1) operations, not a shift or a pointer walk.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
