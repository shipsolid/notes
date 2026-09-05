---
title: "2 — Doubly Linked List"
description: "Doubly linked list node structure, O(1) deletion given a node reference, the four-pointer relink for insert/delete, and why deque/OrderedDict are built on this."
tags: ["data-structures-algorithms","linked-lists","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-15"
relations:
  - slug: data-structures-algorithms/03-linked-data-structures/01-singly-linked-list/01-singly-linked-list
    kind: related
---

# 2 — Doubly Linked List

Handed a plain pointer to a node deep inside a singly linked list, deletion has exactly one problem:
you can't do it directly. Splicing a node out means overwriting whoever points to it —
`prev.next = node.next` — but a singly linked node can't reach `prev` from itself, so the only fix
is walking from `head` until you stumble onto whoever's pointing at your target: O(n) work to delete
a node you already hold a reference to. The doubly linked list exists to make that walk unnecessary.

---

## Node Structure: Two Pointers Instead of One

A singly linked node carries a value and one pointer forward; a doubly linked node adds a second:

```python
class Node:
    __slots__ = ("value", "prev", "next")

    def __init__(self, value):
        self.value = value
        self.prev = None
        self.next = None
```

That single addition — `prev` — is the entire structural difference from the previous chapter: it
means **every node now knows its own predecessor**, without anyone tracking it separately or walking
to find it.

---

## The Real Advantage: O(1) Deletion Given a Node Reference

In a singly linked list, deleting a node you're holding still requires finding whoever points at it
— relinking means rewriting the predecessor's `next`, and a singly linked node can't name its own
predecessor. If all you have is `node`, you're stuck walking from `head`.

In a doubly linked list, `node.prev` already exists, so relinking around a deletion is just:

```python
node.prev.next = node.next
node.next.prev = node.prev
```

No traversal, no separately tracked "previous" variable threaded through the call site — the
predecessor is a field on the node itself. That's the trade the second pointer buys: **O(1) deletion
given a node reference**, unconditionally, because the structure already carries what a singly
linked list would have had to walk to reconstruct.

---

## The Cost: Twice the Pointers to Get Right

- **Memory.** Every node stores two pointers instead of one — an extra 8 bytes per node on a 64-bit
  system, roughly 8 MB of pure structure overhead across a million-node list, before the value
  payload.
- **Twice the relinking, twice the bug surface.** The previous chapter's dangling-pointer bugs came
  from misordering pointer updates on a _single_-pointer structure. Here every insert/delete touches
  two pointers per node, and a missed `prev` update doesn't break forward traversal — so it hides
  until something walks backward or removes a neighbor using stale data.

The fix is the same discipline as before — capture every pointer about to be overwritten into a
local variable first — applied to twice as many pointers. Here's the full relink for splicing
between two _existing_ interior nodes.

**Insertion** — `new_node` between `node` and `node.next` (`node <-> nxt` becomes
`node <-> new_node <-> nxt`):

```python
nxt = node.next          # capture first — about to be overwritten
new_node.prev = node     # 1. new_node looks back at node
new_node.next = nxt      # 2. new_node looks forward at nxt
node.next = new_node     # 3. node now looks forward at new_node
nxt.prev = new_node       # 4. nxt now looks back at new_node
```

**Deletion** — removing `node` from `prev_node <-> node <-> next_node`:

```python
prev_node, next_node = node.prev, node.next  # capture first
prev_node.next = next_node   # 1. prev_node skips over node
next_node.prev = prev_node   # 2. next_node skips back over node
node.prev = None              # 3. sever node's own back-reference
node.next = None              # 4. sever node's own forward-reference
```

Steps 3–4 matter more here than in a singly linked list: skip them and the removed node still holds
live references into the list it was cut from — dangling references that defeat reference-counted
cleanup if the node is never touched again.

---

## Worked Example: A Doubly Linked List Class

A minimal class with `insert_after(node, value)` and `remove(node)`, both true O(1) — neither
searches for the node first:

```python
# Node is the same class shown earlier (value, prev, next)

class DoublyLinkedList:
    def __init__(self):
        self.head = None
        self.tail = None

    def append(self, value):
        """Add to the tail. O(1)."""
        node = Node(value)
        if self.tail is None:
            self.head = self.tail = node
        else:
            node.prev = self.tail
            self.tail.next = node
            self.tail = node
        return node

    def insert_after(self, node, value):
        """Insert `value` after `node`. O(1) — no traversal."""
        new_node = Node(value)
        nxt = node.next
        new_node.prev, new_node.next = node, nxt
        node.next = new_node
        if nxt is not None:
            nxt.prev = new_node
        else:
            self.tail = new_node  # node was the tail
        return new_node

    def remove(self, node):
        """Remove `node`. O(1) given the reference — no search for
        its predecessor, unlike a singly linked list."""
        prev_node, next_node = node.prev, node.next
        if prev_node is not None:
            prev_node.next = next_node
        else:
            self.head = next_node  # node was the head
        if next_node is not None:
            next_node.prev = prev_node
        else:
            self.tail = prev_node  # node was the tail
        node.prev = node.next = None  # sever dangling references
```

```python
>>> dll = DoublyLinkedList()
>>> a = dll.append(1)
>>> dll.append(3)
>>> mid = dll.insert_after(a, 2)   # 1 <-> 2 <-> 3, O(1)
>>> dll.remove(mid)                # 1 <-> 3, O(1) — no walk to find `a`
>>> dll.head.value, dll.tail.value
(1, 3)
```

`remove` never touched `self.head` to start walking — it went straight to `node.prev`/`node.next`,
the entire advantage this chapter is about.

It's also not academic: Python's own `collections.deque` and `collections.OrderedDict` are backed by
a doubly linked list internally — `deque` links fixed-size blocks, `OrderedDict` links entries to
preserve insertion order, which is why `deque.popleft()` and `OrderedDict.move_to_end()` are O(1):
each is a constant number of relinks at a location already in hand, not a scan. The next chapter
pairs this exact structure with a hash map to build an LRU cache with O(1) eviction and promotion.

---

## Singly vs. Doubly: A Direct Comparison

| Dimension                          | Singly Linked List                                           | Doubly Linked List                                                |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| Memory per node                    | 1 pointer (`next`) + value                                   | 2 pointers (`next`, `prev`) + value — double the pointer overhead |
| Delete given only a node reference | O(n) — must walk from `head` to find the predecessor         | O(1) — `node.prev` is already in hand                             |
| Reverse traversal                  | Not supported without rebuilding or reversing the list first | O(1) per step — walk `prev` links directly                        |

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
