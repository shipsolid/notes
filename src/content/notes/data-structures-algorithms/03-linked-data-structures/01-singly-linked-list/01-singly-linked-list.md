---
title: "1 — Singly Linked List"
description: "Node-and-pointer structure, why there's no O(1) random access without contiguous memory, the head/tail/mid-list complexity trade-offs, and the reverse-a-list and find-the-middle worked examples every interview loop opens with."
tags: ["data-structures-algorithms","linked-lists","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-14"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/01-arrays/01-arrays
    kind: related
---

# 1 — Singly Linked List

[[01-arrays|Arrays]] bought O(1) random access by paying for contiguous memory. A singly linked list
walks away from that trade entirely: no contiguous block, no address formula — just a value and a
pointer to whatever node comes next, wherever it lives in memory. What you get back is O(1)
insertion and deletion anywhere you already hold a reference. The skill this chapter actually builds
is relinking pointers without losing your only handle on the rest of the list.

---

## Node Structure: A Value and a Pointer

A node is two fields: a value, and a reference to the next node — or `None` if it's the last one.
That's the entire structure.

```python
class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next
```

The list itself is nothing more than a `head` reference to the first node. There is no third field
anywhere holding "how many nodes exist" or "where node 3 lives" — the only way to know what comes
after a given node is to already be holding that node and read its `.next`. Chase `.next` pointers
until one is `None` and you've found the end; there's no other way to ask the question. Nodes can be
scattered anywhere in memory the allocator decided to put them — node 0 and node 1 might be
adjacent, or a thousand bytes apart. Nothing about the structure requires or implies contiguity.

---

## No Random Access: Why There's No Address Formula Here

[[01-arrays|The arrays chapter]] derived indexing as arithmetic:

```
address(i) = base_address + i * element_size
```

One multiplication, one addition, computed directly by hardware — no traversal required, because
contiguity guarantees element `i` is a fixed offset from the start.

A linked list has no `base_address` that means anything and no `element_size`-scaled offset that
gets you anywhere, because there is nothing to offset — node `i` isn't a location, it's the result
of a walk. Reaching it means starting at `head` and following `.next` exactly `i` times, one pointer
hop at a time:

```python
def get(head, i):
    curr = head
    for _ in range(i):
        if curr is None:
            raise IndexError("index out of range")
        curr = curr.next
    if curr is None:
        raise IndexError("index out of range")
    return curr.value
```

That's O(i), worst case O(n) — not because linked lists are "slower at math," but because "where is
element i" has no closed-form answer here. Full stop. Binary search, direct-index two pointers,
prefix-sum lookups — all degrade or break on a plain singly linked list, because every one of them
is secretly spending the array's O(1) indexing, and a linked list never had it to spend.

---

## Core Operations and Their Complexity

| Operation                                                              | Complexity | Why                                                                                                                                                 |
| ---------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Insert at head                                                         | O(1)       | New node's `next` = old head; move `head` to the new node. No shifting, ever.                                                                       |
| Delete at head                                                         | O(1)       | `head = head.next`. The old head has no remaining reference and is reclaimed.                                                                       |
| Insert at tail, no tail pointer                                        | O(n)       | Must walk the full list from `head` to find the last node before attaching.                                                                         |
| Insert at tail, with a maintained tail pointer                         | O(1)       | Direct reference to the last node — but every insert/delete anywhere must keep `tail` correct, or it silently rots.                                 |
| Delete at tail, even with a tail pointer                               | O(n)       | The _new_ last node's `.next` must become `None`, and reaching it means walking from `head` — a singly linked list can't step backward from `tail`. |
| Insert/delete given a direct reference to the node _before_ the target | O(1)       | Two pointer relinks, zero traversal. This is the one thing a linked list can do that an array structurally cannot.                                  |
| Search by value                                                        | O(n)       | No address formula to exploit — walk and compare until found or exhausted.                                                                          |

The tail-pointer row is a genuine trade, not a free upgrade: it buys O(1) _insert_ at the end, but
delete-at-tail stays O(n) regardless, because removing the last node needs the node _before_ it, and
a singly linked list only ever points forward. (A doubly linked list closes this gap by paying for a
`prev` pointer on every node — a different trade, for a later chapter.)

The direct-reference row is the real answer to "why choose a linked list over an array" — not raw
speed, arrays win nearly every other row here, but that relinking two pointers next to a node you're
already standing at never requires shifting anything else, which is exactly what arrays are worst
at.

---

## Worked Example: Reversing a Linked List

Reversing means every node's `.next` has to point at what used to be _before_ it. Overwrite a node's
`.next` before saving what it pointed to, and the rest of the list is gone.

**Iterative — three pointers, one pass:**

```python
def reverse_iterative(head):
    prev = None
    curr = head
    while curr is not None:
        next_node = curr.next   # save the rest of the list before it's gone
        curr.next = prev        # relink this node backward
        prev = curr             # advance prev to where curr just was
        curr = next_node        # advance curr to the node we saved
    return prev                 # prev is the new head once curr runs out
```

`prev`/`curr`/`next_node` all move together, one slot per iteration, and the save-before-overwrite
line is the entire trick. **O(n) time, O(1) space** — no stack, no extra structure, just three
pointers marching down the list once.

**Recursive — same relinking, expressed as unwind-time work:**

```python
def reverse_recursive(head):
    if head is None or head.next is None:
        return head                    # empty list or single node: already "reversed"
    new_head = reverse_recursive(head.next)
    head.next.next = head              # the node after head now points back at head
    head.next = None                   # head becomes the new tail
    return new_head
```

This recurses to the last node before any relinking happens, then flips pointers on the way back up
— `head.next.next = head` is `curr.next = prev` told backward. It costs **O(n) space**, not O(1):
one stack frame per node, because Python has no tail-call optimization to collapse them (see
[[03-recursion]] in Part 01). Long enough list, and this version blows the recursion limit before it
blows a time budget — the iterative version has no such ceiling.

---

## Worked Example: Finding the Middle Node

On an array, "find the middle" is `arr[len(arr) // 2]` — O(1) length, O(1) index. A linked list has
no length field; walking it twice (count, then land on the middle) costs two passes. The one-pass
answer is two pointers moving at different speeds:

```python
def find_middle(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next          # advances one node per iteration
        fast = fast.next.next     # advances two nodes per iteration
    return slow                   # middle node once fast runs off the end
```

`slow` covers one step for every two `fast` covers, so when `fast` has covered the whole list,
`slow` has covered exactly half — no counting pass required, one walk, O(n) time, O(1) space. This
is a linked-list-specific trick precisely because it doesn't make sense on an array: an array
already has O(1) access to its length and midpoint, so racing two pointers down it would just spend
extra steps recomputing something already available by lookup.

This single-pass "find the middle" is one narrow use of the fast/slow mechanism. The mechanism
itself — including how the same relative-speed idea detects a **cycle** (Floyd's algorithm) — gets
its own full treatment in [[03-fast-and-slow-pointer]] in Part 14. Don't over-index on this
chapter's version; treat it as the smallest possible demonstration that the technique exists.

---

## Why Linked-List Bugs Are Usually Dangling Pointers, Not Algorithm Mistakes

Almost every linked-list bug in practice isn't a wrong algorithm — it's a wrong _order_ of pointer
assignments. In the iterative reversal above, if `curr.next = prev` ran _before_
`next_node = curr.next` was saved, everything after `curr` becomes unreachable in that same line —
no exception, just silently gone. The list permanently loses its tail, and nothing in the
algorithm's logic was wrong.

Contrast an array bug: an off-by-one produces a wrong _answer_, but every element stays addressable
and inspectable in a debugger. A linked list has no such safety net — overwriting the one pointer
leading to a chunk of the list loses that chunk outright, not just miscounts it.

The practical habit: before any relink (`node.next = something`), ask "do I still have a reference
to everything I'll need after this line runs?" If not, save it to a local first — that's the whole
job of `next_node` above. When linked-list code misbehaves, draw the pointers on paper and check the
order they get reassigned in before blaming the algorithm.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
