---
title: "4 — Deque"
description: "Deque as the shared generalization behind stack and queue: O(1) push/pop at both ends via collections.deque's fixed-size-block internals (not a list, not a per-element linked list), worked rotate/maxlen/extendleft examples, and the O(n) random-access trade-off a list doesn't have to make."
tags: ["data-structures-algorithms","stacks-queues","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-22"
relations:
  - slug: data-structures-algorithms/04-stack-queue-and-deque/01-stack/01-stack
    kind: related
  - slug: data-structures-algorithms/04-stack-queue-and-deque/02-queue/02-queue
    kind: related
---

# 4 — Deque

The [[02-queue]] chapter made a promise it didn't need to cash yet: `collections.deque` supports
`appendleft()` / `pop()` on top of the `append()` / `popleft()` pairing it actually used — this
chapter is where that promise gets cashed. A [[01-stack]] uses one end for everything; a queue
splits two operations across opposite ends; a deque refuses to pick, making all four operations on
both ends equally cheap and leaving the choice of discipline to the caller. Stack and queue aren't
different data structures here — they're two different _policies_ for which methods you allow
yourself to call.

---

## Generalizing Stack and Queue: O(1) at Both Ends

A **deque** (double-ended queue) supports four operations, two per end, all O(1): `appendleft(x)`,
`append(x)`, `popleft()`, `pop()`. Stack and queue are what happen when a caller commits to using
only two of those four — a stack uses `append`/`pop`, same end for both, LIFO; a queue uses
`append`/`popleft`, opposite ends, FIFO. A deque just refuses to pre-commit:

```python
from collections import deque

d = deque()

# Stack policy: append()/pop() only -- same end, LIFO
d.append(1); d.append(2)
d.pop()            # 2 -- last in, first out

# Queue policy: append()/popleft() only -- opposite ends, FIFO
d.append(1); d.append(2)
d.popleft()        # 1 -- first in, first out

# Deque policy: whichever end the problem actually needs
d.appendleft(0)    # front insert -- neither stack nor queue policy allows this
```

Nothing in the type stops a "stack" deque from calling `appendleft` — the restriction is a
convention enforced in code, not a type guarantee. A real LIFO-only or FIFO-only interface would
wrap the deque in a thin class exposing only the two methods that policy allows.

---

## How collections.deque Actually Achieves This

Two mental models for "O(1) at both ends" are tempting and both wrong here. **A linked list of
individual elements** would give O(1) at both ends, but at the cost of a heap allocation and two
pointers _per element_, plus no cache locality — every `next` hop is a pointer chase. **A plain
`list`** is O(1) amortized at the back only (Part 01 Chapter 2's doubling argument); `insert(0, x)`
/ `pop(0)` at the front are O(n), because every element has to shift to keep the array contiguous —
the exact trap the queue chapter built around.

CPython's actual implementation is neither: a **doubly linked list of fixed-size blocks**. Each
block is a small contiguous array (64 slots, in CPython's real implementation) chained to its
neighbors with `next`/`prev` pointers; the deque tracks the current leftmost and rightmost block
plus an index into each. `append(x)` writes into the current right block's next free slot, or
allocates and links a new block if it's full — an O(1) relink, no existing element touched.
`appendleft(x)` mirrors this on the left; `pop()`/`popleft()` clear the end slot and unlink the
block if that empties it, again O(1). Elements _within_ a block keep array-like cache locality, but
the linked list only connects whole blocks, never individual elements — growing either end links or
unlinks a block without ever shifting one, which is the entire reason `appendleft` is O(1) while
`list.insert(0, x)` is O(n).

The one thing this design doesn't buy back is random access: there's no arithmetic mapping index `i`
straight to a block and offset the way a list maps `i` to `base_address + i * size`, so `dq[i]`
walks the block chain from whichever end is nearer — O(n) in the worst case.

---

## Worked Examples From Practice: rotate, maxlen, and appendleft

**`rotate(n)`** shifts every element `n` steps toward the back, wrapping around; negative `n`
rotates toward the front. It's equivalent to `n` repeated `popleft()`/`append()` pairs (or the
mirror pair for negative `n`), so `rotate(n)` costs O(k) for `k = n mod len(d)`:

```python
from collections import deque

letters = deque(["a", "b", "c"])

letters.rotate()     # default n=1: last element wraps to the front
print(letters)        # deque(['c', 'a', 'b'])

letters.rotate(2)     # two more steps toward the back
print(letters)        # deque(['a', 'b', 'c'])

letters.rotate(-1)    # negative n rotates toward the front instead
print(letters)        # deque(['b', 'c', 'a'])
```

**`maxlen`** turns a deque into a fixed-size window: once full, every `append` silently evicts from
the opposite end — no manual bounds check needed.

```python
recent = deque(maxlen=3)

for reading in [10, 12, 9, 15, 11]:
    recent.append(reading)
    print(list(recent))

# [10]
# [10, 12]
# [10, 12, 9]
# [12, 9, 15]    <- window full: 10 evicted from the left to admit 15
# [9, 15, 11]    <- 12 evicted
```

This is the deque-native version of the "last N readings" ring buffer the [[03-circular-queue]]
chapter built by hand with `%` arithmetic — same eviction rule, no index bookkeeping required.

**`extendleft(iterable)`** reverses the iterable's order relative to the input — a common surprise
worth deriving, not just flagging:

```python
d = deque([1, 2, 3])
d.extendleft([4, 5, 6])
print(d)   # deque([6, 5, 4, 1, 2, 3]) -- not [4, 5, 6, 1, 2, 3]
```

`extendleft` calls `appendleft()` once per source item, in the source's original order: `4` is
pushed to the front first, then `5` is pushed _ahead of_ `4`, then `6` ahead of both — each push
displaces every earlier one further out, so the final order reverses the input. `extend()` (right
side) doesn't reverse anything, because `append()` never displaces what's already there.

---

## When to Reach for Deque Over List

- **Insert/remove at the front, or at both ends.** Any code about to write `list.insert(0, x)` or
  `list.pop(0)` hits the exact O(n) trap Chapter 2 named for queues — it applies anywhere the front
  is touched repeatedly, not just in a FIFO.
- **Sliding-window problems.** `maxlen` gives an auto-evicting fixed window for free (above); Ch. 6
  ([[06-monotonic-queue]]) builds O(n) sliding-window max/min on a deque trimmed from both ends.
- **Palindrome checks by symmetric two-ended popping** — compare `popleft()` to `pop()` until fewer
  than two elements remain:

  ```python
  def is_palindrome(s: str) -> bool:
      d = deque(s)
      while len(d) > 1:
          if d.popleft() != d.pop():
              return False
      return True
  ```

  This needs true O(1) removal from both ends at once; `pop(0)` on a list degrades the whole check
  to O(n²).

- **BFS ([[02-queue]], Ch. 2).** `popleft()` from the front while appending neighbors to the back is
  the queue chapter's `bfs_levels` verbatim — `deque` is simply the concrete type a Python queue is
  built from.
- **When not to:** index-heavy access. `dq[n // 2]` walks the block chain in O(n) vs.
  `list[n // 2]`'s direct O(1) read — if indexing dominates over end-operations, `list` wins
  outright.

---

## Complexity Summary

| Operation                   | `deque`                      | `list`                                     |
| --------------------------- | ---------------------------- | ------------------------------------------ |
| `append` (insert back)      | O(1)                         | O(1) amortized                             |
| `appendleft` (insert front) | O(1)                         | O(n) — `insert(0, x)` shifts every element |
| `pop` (remove back)         | O(1)                         | O(1)                                       |
| `popleft` (remove front)    | O(1)                         | O(n) — `pop(0)` shifts every element       |
| `rotate(k)`                 | O(k)                         | no built-in equivalent                     |
| Random access `d[i]`        | O(n) — walks the block chain | O(1) — direct array index                  |

Name the trade explicitly: a deque gives up the O(1) middle-index access a list has, in exchange for
O(1) at both ends a list doesn't have. The question that decides between them is whether an
algorithm touches the ends more than the middle by index — stack and queue already answered "yes,
one or two specific ends," which is why both are really a deque wearing a self-imposed policy.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
