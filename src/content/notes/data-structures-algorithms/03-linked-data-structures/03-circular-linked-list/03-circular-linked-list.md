---
title: "3 — Circular Linked List"
description: "Circular linked list structure — the tail-to-head wraparound, detecting 'the end' without a None sentinel, round-robin scheduling and circular buffers, the Josephus problem, and telling deliberate circularity apart from an accidental cycle bug."
tags: ["data-structures-algorithms","linked-lists","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-16"
relations:
  - slug: data-structures-algorithms/03-linked-data-structures/01-singly-linked-list/01-singly-linked-list
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/03-fast-and-slow-pointer/03-fast-and-slow-pointer
    kind: related
---

# 3 — Circular Linked List

The [[01-singly-linked-list]] chapter ended every traversal the same way: walk `next` pointers until
one is `None`. That `None` does more work than it looks — it's the only thing telling the loop where
the list stops. A circular linked list removes it: the node whose `next` would otherwise be `None`
points back to the head instead, so "walk until you fall off the end" stops being valid — there is
no end.

---

## The One Structural Change: The Tail Points Back to the Head

A circular linked list isn't a new node type — it's the same `Node` (`value` plus `next`, and `prev`
for a doubly linked variant), wired differently at exactly one point: the last node's `next`
references the head instead of `None`.

```python
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None  # will point to head, not None, once linked circularly


def build_circular(values: list) -> Node | None:
    if not values:
        return None
    head = Node(values[0])
    tail = head
    for v in values[1:]:
        tail.next = Node(v)
        tail = tail.next
    tail.next = head  # the one wire that makes it circular
    return head
```

This builds on either underlying structure. A **circular singly linked list** only wraps `next` —
traversal still moves one direction, just indefinitely. A **circular doubly linked list** wraps
both: the tail's `next` is the head, and the head's `prev` is the tail, giving traversal in either
direction. Either way it's still circular — no `None` anywhere in the ring; circularity and
directionality are independent choices.

---

## Detecting "The End" Without a None Sentinel

Linear traversal stops on `node is None`. A circular list never produces that condition, so a loop
written the linear way spins forever — the question changes from "have I hit the end" to "have I
come back to where I started."

**Technique 1 — compare against the original head**, using a do-while shape: process the node, then
check whether the _next_ one is the one you started from.

```python
def print_circular(head: Node) -> None:
    if head is None:
        return
    node = head
    while True:
        print(node.value)
        node = node.next
        if node is head:  # back where traversal started
            break
```

**Technique 2 — count nodes when the length is known.** A bounded loop needs no pointer comparison:

```python
def print_circular_counted(head: Node, n: int) -> None:
    node = head
    for _ in range(n):
        print(node.value)
        node = node.next
```

**The classic bug: identity vs. value.** `node is head` compares _which object_ this is. Swap it for
`node.value == head.value` and every test with unique values still passes — then it breaks silently
the moment the list holds a duplicate:

```python
# Circle: 5 -> 3 -> 5 -> 8 -> back to first 5
def print_circular_buggy(head: Node) -> None:
    node = head
    while True:
        print(node.value)
        node = node.next
        if node.value == head.value:   # BUG: stops at the SECOND node holding 5 —
            break                       # a lap short of head, no exception raised
```

Value comparison halts at the first node sharing `head`'s value — a different node entirely — one
lap early. `is head` can't fail this way: identity has exactly one match, duplicates or not.

---

## Where Circularity Is the Actual Point

In arrays and singly linked lists, a loop is a bug. Here it's the feature — the algorithm has no
natural termination, by design:

- **Round-robin scheduling.** A CPU time-slicing across processes, or a browser cycling tabs, just
  needs `current = current.next` to always be valid — no end-of-list check, ever, forever.
- **Circular buffers.** A fixed-capacity ring buffer (audio buffer, sliding log window) needs
  wraparound with zero data movement. A plain array used as a queue shifts every remaining element
  on dequeue — O(n) — or fakes wraparound with manual modulo indexing. A circular linked list gets
  wraparound as a structural property: once full, the write pointer advances to `current.next` and
  overwrites that node's value in place — O(1) per write, no shift, no modulo arithmetic.
- **General cyclic iteration** — turn order in a multiplayer game, a rotation of on-call engineers —
  is the same shape: a fixed ring, one pointer, no terminal state to special-case.

---

## Worked Example: The Josephus Problem

**Problem:** `n` people stand in a circle, numbered `1` to `n`. Starting from person `1`, count
around the circle; the `k`-th person counted is eliminated, and counting resumes from the next
survivor. Repeat until one person remains — return their number.

The circle _is_ the problem statement, so building it directly on a circular linked list — rather
than reaching for the closed-form recurrence — is the version worth internalizing first:

```python
class PersonNode:
    def __init__(self, num: int):
        self.num = num
        self.next: "PersonNode | None" = None


def josephus(n: int, k: int) -> int:
    head = PersonNode(1)
    prev = head
    for i in range(2, n + 1):
        prev.next = PersonNode(i)
        prev = prev.next
    prev.next = head  # close the ring

    current, prev = head, None  # prev trails current to unlink the eliminated node
    while current.next is not current:  # one node left -> next points to itself
        for _ in range(k - 1):
            prev = current
            current = current.next
        prev.next = current.next  # current is the k-th person counted -> eliminate
        current = prev.next

    return current.num
```

**Complexity:** O(n·k) time, O(n) space — each of the `n - 1` eliminations walks `k` steps around
the remaining circle. That's worse than the O(n) closed-form recurrence for this exact problem, but
the recurrence answers a math question about positions; this answers the question as stated, and
generalizes to variants (uneven elimination counts, mid-process queries) the recurrence doesn't.

---

## Circular by Design vs. Cyclic by Accident

A circular linked list is circularity _chosen_: every `next` wraps intentionally, and traversal
accounts for it. A **cyclic linked list bug** is the same shape showing up uninvited — a list meant
to be linear, where a corrupted insert or stale reference leaves some node's `next` pointing back to
a node already visited. Traversal written for the linear case (`while node is not None`) never finds
an exit and spins forever.

The check — _does continued traversal ever revisit a node already seen_ — is structurally identical
in both cases; the intent is opposite. One list is built to make that true, the other has it true by
accident and needs it fixed. Detecting an _unexpected_ cycle in a list that's supposed to be linear
— not knowing in advance whether one exists — is a distinct technique, Floyd's tortoise-and-hare,
covered in [[03-fast-and-slow-pointer]] in Part 14. It doesn't belong here: this chapter already
knows the circle exists by construction, so the cheap checks above (identity against head, or a
count) suffice. Part 14's chapter is for when you don't know yet.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
