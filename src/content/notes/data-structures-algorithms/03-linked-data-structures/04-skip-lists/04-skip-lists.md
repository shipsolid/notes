---
title: "4 — Skip Lists"
description: "Probabilistic multi-level linked structure giving expected O(log n) search, insert, and delete without tree rebalancing."
tags: ["data-structures-algorithms","linked-lists","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-17"
relations:
  - slug: data-structures-algorithms/05-trees/05-red-black-trees/05-red-black-trees
    kind: related
---

# 4 — Skip Lists

A sorted array gets binary search for free — random access means you can always jump straight to the
midpoint. A sorted singly linked list gets nothing for free: reaching the midpoint means walking
every node from the head, because there's no address to compute for "the node halfway there" without
already holding a pointer to it. Both are ordered, but only one supports jumping ahead. Skip lists
fix that: keep the plain linked list as the foundation, then build shortcuts on top of it so walking
it stops meaning visiting every node.

---

## The Problem: No Random Access Means No Binary Search

Binary search's trick is arithmetic: compute `mid = (lo + hi) // 2` and land on that element in
O(1), because array indexing is O(1). A linked list has no equivalent move — `node.next` is the only
way to advance, so reaching the middle of an n-node list costs O(n/2) hops; a node only knows its
immediate neighbor, not its position in the sequence. That leaves a sorted singly linked list stuck
at O(n) search, even with fully ordered values:

```python
def search_sorted_linked_list(head, target):
    node = head
    while node is not None and node.value < target:
        node = node.next
    return node is not None and node.value == target
```

Every hop is unavoidable — you can't know whether node 50 is worth visiting without first visiting
nodes 1 through 49. A skip list adds exactly the missing thing: pointers that go straight to node
50, and node 100, without needing to know their addresses in advance.

---

## Structure: Express Lanes Over a Sorted List

A skip list stacks several linked lists on the same sorted values, each higher level holding
progressively fewer nodes:

```
Level 3:  HEAD ------------------------------> 40 -----------------------> NIL
Level 2:  HEAD ------------> 20 -------------> 40 -----------> 70 ------> NIL
Level 1:  HEAD ------> 10 -> 20 -------------> 40 -----> 50 -> 70 ------> NIL
Level 0:  HEAD -> 5 -> 10 -> 20 -> 30 -> 35 -> 40 -> 45 -> 50 -> 70 -> 90 -> NIL
```

- **Level 0** is the base list — every value, fully sorted, exactly the plain linked list from
  [[01-singly-linked-list]] (Chapter 1, this same Part). This level is the ground truth.
- **Level 1** holds roughly every 2nd node from level 0, linked to each other directly, skipping the
  nodes level 1 doesn't include.
- **Level 2** holds roughly every 4th node, level 3 roughly every 8th — each level up is, on
  average, half the density of the one below it.

A node is really a small array of forward pointers, one per level it's in. **Search** starts at the
head's highest level and repeats one rule: move right while the next node's value is still less than
the target; drop a level the moment it isn't (or the pointer is `NIL`) — the express-lane analogy
made literal, level 3 the highway that covers the most ground per hop, level 0 the driveway you turn
onto to find the exact house:

```python
class SkipListNode:
    def __init__(self, value, level):
        self.value = value
        self.forward = [None] * (level + 1)   # one next-pointer per level


class SkipList:
    def __init__(self, max_level=16):
        self.max_level = max_level
        self.head = SkipListNode(value=None, level=max_level)  # sentinel, no value
        self.level = 0                                          # highest level in use

    def search(self, target) -> bool:
        node = self.head
        for lvl in range(self.level, -1, -1):          # top level down to 0
            while node.forward[lvl] is not None and node.forward[lvl].value < target:
                node = node.forward[lvl]                # stay on this level, move right
            # node.forward[lvl] is now NIL or >= target: drop a level.
        node = node.forward[0]                          # last step lands on the candidate
        return node is not None and node.value == target
```

The outer loop is one express lane per iteration; dropping `lvl` exits to the next lane down — most
of the distance is covered on higher, sparser levels before the short level-0 walk remains.

---

## Probabilistic Level Assignment: Coin Flips Instead of Rotations

The diagram's clean "every 2nd, every 4th" pattern isn't enforced geometrically — it's _expected_ to
come out roughly that way, statistically, from a random process at insert time.

When a node is inserted, its **height** — how many levels it appears in — is chosen by repeated coin
flips: start at level 0, flip a fair coin; heads, promote and flip again; tails, stop. The
probability of reaching level `k` is 1/2^k, so most nodes stop at level 0 or 1, with a shrinking
fraction reaching higher levels:

```python
import random

def random_level(max_level, p=0.5) -> int:
    level = 0
    while random.random() < p and level < max_level:
        level += 1
    return level
```

This coin flip is the entire mechanism that gives a skip list its shape — no rebalancing step, no
rotation, no invariant actively enforced. A balanced BST ([[04-avl-trees|AVL Trees]],
[[05-red-black-trees|Red-Black Trees]], both Part 05) keeps search paths short by
_deterministically_ restoring an invariant — height balance, or red-black coloring — with rotations
after every mutation that violates it. A skip list relies instead on the coin flips producing, in
expectation, the same geometric thinning shown above: balancing moves from "code that actively fixes
structure" to "a probability distribution that produces good structure on average."

Insertion is search-then-splice: walk down like `search`, remembering the rightmost node touched at
each level (the standard `update[]` array), roll a random height for the new node, then rewire
`forward` pointers up to that height. Deletion mirrors this — locate the node the same way, then
unlink it from every level it appeared in.

---

## Search, Insert, Delete — and Their Expected Complexity

| Operation         | Expected time | Worst-case time | Space                   |
| ----------------- | ------------- | --------------- | ----------------------- |
| Search            | O(log n)      | O(n)            | —                       |
| Insert            | O(log n)      | O(n)            | O(1) amortized per node |
| Delete            | O(log n)      | O(n)            | —                       |
| Overall structure | —             | —               | O(n) expected           |

The **expected** qualifier is load-bearing, not decoration. O(log n) comes from the shape fair coin
flips produce _in expectation_ — roughly half the level-`k` nodes promote to `k+1`, the same
geometric thinning that halves the remaining search distance at each level, the way each step of
binary search halves the remaining range. Nothing forces that shape on any single run: the worst
case — every flip landing heads up to `max_level`, producing one useless tall node and no thinning
elsewhere — is real, just astronomically unlikely at real-world `n`. For `n` in the millions the
odds of search degrading anywhere near O(n) are negligible enough that production systems (Redis,
below) treat the expected bound as the practical one — a fundamentally different claim than a
balanced BST's O(log n) **worst case**, which rotations enforce on every operation. "Expected" and
"worst case" aren't interchangeable.

Space is O(n) expected, not O(n log n) — easy to guess wrong. With n nodes at level 0, the promotion
rule puts roughly n/2 at level 1, n/4 at level 2, n/8 at level 3; the geometric series
`n + n/2 + n/4 + ... = 2n` converges to a small constant multiple of n, not n times the level count,
because each level is geometrically sparser than the one beneath it.

---

## Skip List vs. Balanced BST: Redis's Actual Choice

Skip lists and balanced BSTs ([[04-avl-trees|AVL Trees]], [[05-red-black-trees|Red-Black Trees]],
Part 05) solve overlapping problems — ordered data, O(log n)-ish search/insert/delete, range queries
a hash table can't give you. Choosing between them is a real engineering decision:

- **Implementation complexity.** A correct AVL or red-black tree needs correct rotation logic —
  left, right, double-rotation cases, and for red-black trees a recoloring state machine — with
  every edge case genuinely error-prone to get right. A skip list's insert/delete is mechanical by
  comparison: walk down remembering the rightmost node per level, splice up to a random height — no
  case analysis on shape.
- **Concurrency.** A skip list's levels are independent linked lists, so insert/delete can be made
  lock-free with fine-grained per-node locking or CAS touching only the `forward` pointers adjacent
  to the change. Rebalancing a BST after one insert can cascade rotations toward the root, touching
  nodes far from the insertion point — much harder to make fine-grained-concurrent than skip-list
  splicing.
- **Worst-case guarantee.** The BST wins outright here: O(log n) is _guaranteed_, by an invariant
  rotations actively restore. A skip list only offers O(log n) _expected_ — a hard worst-case
  latency bound regardless of how unlucky the randomness gets should reach for the tree instead.

**Redis's sorted set (`ZSET`) is implemented with a skip list, not a balanced tree** — the concrete
case this trade-off resolves to in production. `ZADD`/`ZRANGE`/`ZRANK` need O(log n)-ish ordered
range queries, a profile a balanced BST would also satisfy, but the maintainers chose the skip list
because it's simpler to implement correctly and reason about, while measuring out to comparable
practical performance — a live counterexample to the reflex that a hard worst-case guarantee always
wins. Sometimes the honest call is that rotation-logic risk isn't worth a bound the workload will
never get close to triggering.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
