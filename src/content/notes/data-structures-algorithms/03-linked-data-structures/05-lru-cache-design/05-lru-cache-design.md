---
title: "5 — LRU Cache Design"
description: "Combining a hash map and a sentinel-based doubly linked list to get O(1) get/put with least-recently-used eviction — LeetCode 146, and the same shape found in real production caching layers, plus the OrderedDict version you'd actually ship."
tags: ["data-structures-algorithms","linked-lists","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-18"
relations:
  - slug: data-structures-algorithms/03-linked-data-structures/02-doubly-linked-list/02-doubly-linked-list
    kind: related
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: related
---

# 5 — LRU Cache Design

LeetCode numbers it 146, but the shape underneath it is not an interview invention. A CPU's L1
cache, a CDN edge node, an in-process memoization layer — every one of them keeps a bounded amount
of hot data in fast storage and needs a cheap rule for what to throw away when it's full. "Throw
away whichever entry you're least likely to need again" has no crystal ball, so every practical
implementation approximates it with something measurable: the entry untouched the longest. That's
least-recently-used eviction, and this chapter is the data-structure engineering required to make
checking and updating that rule O(1) instead of an O(n) scan on every access.

---

## The Requirement: O(1) Get and Put, With Eviction

An LRU cache is a fixed-capacity key-value store with exactly two operations, both of which must run
in O(1):

- **`get(key)`** — return the value for `key` if present, otherwise a miss sentinel (`-1` on
  LeetCode, `None` in a real system). If present, `key` counts as just accessed.
- **`put(key, value)`** — insert or update `key`. `key` counts as just accessed. If the cache is now
  over capacity, evict the least recently used entry to make room.

The definition worth pinning down precisely: **"recently used" is refreshed by every access, get or
put — not by insertion order alone.** That distinction is what separates an LRU cache from a FIFO
cache. A FIFO cache evicts by insertion order regardless of how often something was read afterward;
an LRU cache evicts the entry that has gone the longest untouched, which means a `get` on an old
entry can save it from eviction even though nothing changed about _when_ it was inserted. The
eviction candidate is a moving target that shifts on every single operation — which is exactly why
"O(1) per operation" is the hard part. A correct-but-slow implementation is trivial (store a
last-accessed timestamp per key, scan for the minimum on eviction); the interview problem is making
both operations O(1) _and_ making eviction O(1), simultaneously, with no scan anywhere.

---

## Why Neither Structure Alone Works

Try each structure alone and the same gap shows up from the opposite direction:

- **A hash map alone** gives O(1) `get`/`put` by key — that's what a hash map is for (see
  [[06-hashing]]). But it has no notion of order; nothing about its bucket layout says which key was
  touched longest ago. Recovering that means a timestamp per key and a scan for the minimum on every
  eviction — O(n), not O(1).
- **A doubly linked list alone** — the structure from [[02-doubly-linked-list]], the previous
  chapter — gives O(1) reordering: unlink a node and splice it back at the front, given a reference
  to that node, plus free O(1) eviction from the tail. But "**given a reference to that node**" is
  doing all the work in that sentence — finding the node for an arbitrary key still means walking
  the list from the head, O(n) lookup, the exact cost a linked list was supposed to avoid.

Each structure is missing precisely what the other one provides. The fix is the textbook combined
case: keep both, and make the hash map's value a **node reference**, not the cached value itself.

```
key ──hash map──▶ node ──┐
                          ├─▶ node.value  (O(1), via the map)
                          └─▶ node.prev / node.next  (O(1) splice, via the list)
```

The hash map turns "find the node for this key" into O(1). The linked list turns "this node was just
used" and "which node has gone longest untouched" into O(1) splice operations at the two ends.
Neither structure had to get smarter — they were just bridged with a shared reference, and the
reference is what makes the previous chapter's "O(1) given a node reference" apply to _any_ key, not
just a node you happen to already be holding.

---

## From Scratch: Hash Map + Doubly Linked List With Sentinels

The list is ordered by recency: the most-recently-used node lives at one end, the
least-recently-used node at the other. `get` and `put` both end with "move this node to the MRU
end"; eviction is always "remove whatever is at the LRU end." Two sentinel nodes — a dummy `head`
and a dummy `tail` that never hold real data — are the standard fix for the previous chapter's
warning about doubly linked lists having "twice the pointers to get right": with sentinels,
`head.next` is _always_ the real most-recently-used node and `tail.prev` is _always_ the real
least-recently-used node, whether the cache holds zero entries, one entry, or is at full capacity.
There is no "is this the first node?" or "is this the only node?" branch anywhere — every real node
always has a non-null `prev` and `next`, so remove and insert are one code path, unconditionally:

```python
class _Node:
    __slots__ = ("key", "value", "prev", "next")

    def __init__(self, key=None, value=None):
        self.key = key      # needed so eviction can delete the right map entry
        self.value = value
        self.prev = None
        self.next = None


class LRUCache:
    def __init__(self, capacity: int) -> None:
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self.capacity = capacity
        self._map: dict[int, _Node] = {}   # key -> node reference, not value

        # Sentinels: head.next is always MRU, tail.prev is always LRU.
        self._head = _Node()
        self._tail = _Node()
        self._head.next = self._tail
        self._tail.prev = self._head

    def _remove(self, node: _Node) -> None:
        # Detach node from wherever it sits — no branch on first/last,
        # because sentinels guarantee node.prev and node.next always exist.
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_front(self, node: _Node) -> None:
        # Insert immediately after head — the MRU position.
        node.prev = self._head
        node.next = self._head.next
        self._head.next.prev = node
        self._head.next = node

    def get(self, key: int) -> int:
        node = self._map.get(key)
        if node is None:
            return -1
        self._remove(node)
        self._add_to_front(node)     # this get just made it MRU
        return node.value

    def put(self, key: int, value: int) -> None:
        existing = self._map.get(key)
        if existing is not None:
            existing.value = value
            self._remove(existing)
            self._add_to_front(existing)
            return

        node = _Node(key, value)
        self._map[key] = node
        self._add_to_front(node)

        if len(self._map) > self.capacity:
            lru = self._tail.prev     # sentinel guarantees this is always a real node
            self._remove(lru)
            del self._map[lru.key]    # the stored key is what makes this O(1), not a scan
```

Every operation touches at most a constant number of pointers and one hash-map lookup — no loop, no
scan, anywhere. The node stores its own `key` for exactly one reason: eviction removes a node from
the _list_ end first, and needs to know which map entry to delete without searching for it — another
instance of a reference doing the lookup work that a scan would otherwise have to do.

---

## What Python Gives You for Free: OrderedDict

`collections.OrderedDict` already maintains insertion/access order internally and exposes exactly
the two primitives this cache needs: `move_to_end(key)` to promote a key to the MRU position, and
`popitem(last=False)` to pop from the opposite end — the LRU one. Structurally it's the same hash
map plus doubly linked list from the previous section, implemented in C under the hood; nothing
about the approach changes, only who wrote the splice logic:

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self._cache: OrderedDict[int, int] = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self._cache:
            return -1
        self._cache.move_to_end(key)          # mark as most recently used
        return self._cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = value
        if len(self._cache) > self.capacity:
            self._cache.popitem(last=False)   # evict the least recently used entry
```

That's the entire from-scratch class collapsed into about ten lines — `move_to_end` is the sentinel
splice from the previous section, `popitem(last=False)` is the tail eviction.

Lead with the manual version in an interview anyway. Reaching straight for `OrderedDict` answers "do
you know the stdlib" but not "do you understand why this is O(1)" — the second question is the one
actually being asked. Build the sentinel version first to show you understand _why_ `move_to_end`
and `popitem(last=False)` are O(1) — a linked-list splice, not a hidden scan — then mention
`OrderedDict` as the follow-up: "and this is what I'd actually ship, since it's the same algorithm
with the C-level constant factors already worked out."

---

## Complexity Summary

| Operation         | Time | Space       | Why                                                           |
| ----------------- | ---- | ----------- | ------------------------------------------------------------- |
| `get(key)`        | O(1) | —           | one hash-map lookup + one constant-size pointer splice        |
| `put(key, value)` | O(1) | —           | one hash-map lookup/insert + one constant-size pointer splice |
| Overall cache     | —    | O(capacity) | exactly one node and one map entry per resident key, no more  |

Both the from-scratch version and the `OrderedDict` version are asymptotically identical — O(1) time
per operation, O(capacity) space overall. The only difference is constant factors: `OrderedDict`'s
internal linked list is implemented in C, so it will typically outperform a hand-rolled Python class
in wall-clock terms while doing the exact same pointer-splice work under the hood.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
