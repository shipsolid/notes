---
title: "9 — heapq & bisect"
description: "How heapq turns 'always know the current smallest (or largest) item' into O(log n) calls over a plain list, how negation borrows that for max-heap behavior, and how bisect turns 'where does this belong in sorted order' into O(log n) search — plus the one place insort quietly costs more than its name suggests."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/05-trees/11-heap/11-heap
    kind: related
zettelId: "202607301922-18"
---

# 9 — heapq & bisect

Two standard-library modules show up constantly in interview code without ever requiring you to
write the algorithm underneath them: `heapq`, which turns "always know the smallest (or largest)
remaining item" into a handful of one-line calls over a plain list, and `bisect`, which turns "find
where this value belongs in a sorted sequence" into a single `O(log n)` call instead of a
hand-rolled loop. Neither module introduces a new concept — `heapq` is a thin wrapper around the
heap invariant, and binary search is exactly what `bisect` calls out to — but knowing the exact
function signatures, what each one returns, and which one silently costs more than its name suggests
is worth having cold, because reaching for the wrong function (or reinventing one that already
exists) is time an interview clock doesn't refund. This chapter treats both modules purely as API
surface: what to call, what it costs, and where each one stops paying off.

---

## `heapq`: A Priority Queue Over a Plain List

[[11-heap|Part 05, Chapter 11]] derives the invariant and the complexity behind every operation
below — parent `<=` children, the minimum always at the root, `O(log n)` push/pop bounded by tree
height, and `O(n)` heapify because most nodes sit near the bottom, where sift-down is cheap or free.
This section doesn't re-derive any of that; it's the function signatures you actually call.

`heapq` has no heap class — every function takes a plain `list` and mutates it in place, using
ordinary `<` comparisons on its elements:

- **`heapq.heapify(arr)`** — reorders `arr` into a valid min-heap in place. **O(n)**. No return
  value.
- **`heapq.heappush(heap, item)`** — append, then sift up. **O(log n)**.
- **`heapq.heappop(heap)`** — pop and return the minimum, sift down to repair the invariant. **O(log
  n)**. Raises `IndexError` on an empty heap.
- **`heap[0]`** — peek the minimum without removing it. **O(1)**. There's no dedicated `heapq.peek`.
- **`heapq.heappushpop(heap, item)`** / **`heapq.heapreplace(heap, item)`** — combined push-then-pop
  and pop-then-push in a single call. Both are covered in full — including the case where they
  diverge — in the heap chapter above; both matter for the worked example below.

```python
import heapq

nums = [5, 3, 8, 1, 2]
heapq.heapify(nums)              # O(n)  -> [1, 2, 8, 3, 5]
heapq.heappush(nums, 0)          # O(log n) -- 0 bubbles to the root
smallest = heapq.heappop(nums)   # O(log n) -- 0
```

One thing worth stating plainly, because it trips people coming from languages with a built-in
priority queue: `heapq` is **min-heap only**. There's no `reverse=True`, no comparator argument, no
max-heap mode — the workaround is a separate, deliberate trick, covered later in this chapter.

---

## Worked Example: Kth Largest Element in a Stream

**Problem:** design a structure that, given an integer `k`, supports adding a new value to a stream
and always reports the k-th largest value seen so far.

The insight: maintain a min-heap that never holds more than `k` elements. Its root — the smallest of
the `k` largest values seen — is by definition the k-th largest overall. Every new value either
doesn't belong in the top `k` (smaller than the current root, heap unchanged) or does (root gets
evicted). That's exactly what `heappushpop` does in one call:

```python
import heapq

class KthLargest:
    def __init__(self, k: int, nums: list[int]) -> None:
        self.k = k
        self.heap = nums[:]
        heapq.heapify(self.heap)             # O(n) once, up front
        while len(self.heap) > k:
            heapq.heappop(self.heap)         # trim down to k elements

    def add(self, val: int) -> int:
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, val)
        else:
            heapq.heappushpop(self.heap, val)  # push val, then evict the new minimum
        return self.heap[0]                     # root == k-th largest so far
```

**Complexity:** O(log k) per `add` — the heap never grows past size `k`, so every push/pop is
bounded by `log k`, not `log n` over the whole stream. O(n) once for the initial `heapify` if seeded
with existing values.

This is the pattern [[11-heap|Part 05, Chapter 11]] names directly when introducing `heappushpop`:
"the classic case is maintaining a fixed-size top-K smallest (or largest) seen so far window." A
size-bounded min-heap answering "k-th largest" is that exact pattern with the roles inverted — the
heap holds the largest `k` values seen, and its root is the answer precisely because it's the
smallest member of that top-`k` set.

---

## The Max-Heap Workaround: Negate on the Way In and Out

`heapq` gives you a min-heap and nothing else, so whenever a problem wants "always know the largest
remaining item," the fix is to invert the ordering before it ever reaches the heap: push `-value`
instead of `value`, and negate again on the way out. Because negation reverses every comparison
(`a <= b` implies `-a >= -b`), "the minimum of the negated values" and "the maximum of the original
values" are the same element:

```python
import heapq

max_heap: list[int] = []
for val in [3, 1, 4, 1, 5]:
    heapq.heappush(max_heap, -val)     # store the negation

largest = -heapq.heappop(max_heap)     # negate again on the way out
print(largest)                          # 5
```

The discipline this demands is total, not partial: **every** value that goes into this heap has to
be negated on the way in and negated again on the way out — every push, every pop, every peek at
`heap[0]`. Nothing in `heapq` enforces this; a list of un-negated values is exactly as valid a
"heap" by the invariant as a list of negated ones, so mixing the two silently corrupts the ordering
with no exception raised anywhere. The usual failure mode is peeking at `heap[0]` somewhere in a
larger function and forgetting the sign flip — it doesn't crash, it just returns the wrong answer.

For heaps of tuples or custom records rather than plain numbers, the same idea generalizes: negate
whichever field defines "priority" before it goes in, since Python compares tuples
element-by-element and `heapq` never looks past the ordering `<` already gives it.

---

## Worked Example: Task Scheduler (Max-Heap by Frequency)

**Problem:** given a list of tasks (each an uppercase letter) and a cooldown `n`, find the minimum
number of time units to run all tasks such that the same task type is separated by at least `n`
units (idle slots allowed).

Greedy idea: at every time step, run whichever remaining task type has the highest remaining count —
draining the most frequent task first keeps it from bottlenecking the schedule near the end.
"Highest remaining count, repeatedly, as the counts change" is a max-heap by count, which means the
negation trick:

```python
import heapq
from collections import Counter

def least_interval(tasks: list[str], n: int) -> int:
    counts = Counter(tasks)
    max_heap = [-c for c in counts.values()]
    heapq.heapify(max_heap)               # O(k) for k distinct task types

    time = 0
    while max_heap:
        cooldown_batch = []               # tasks run this window, awaiting re-entry
        for _ in range(n + 1):
            if max_heap:
                count = -heapq.heappop(max_heap)
                if count > 1:
                    cooldown_batch.append(-(count - 1))
            time += 1
            if not max_heap and not cooldown_batch:
                break                      # nothing left anywhere -- stop without idle padding
        for item in cooldown_batch:
            heapq.heappush(max_heap, item)

    return time
```

**Complexity:** O(T) time where `T` is the final schedule length (at most `26 · (n + 1)` batches,
each doing O(log 26) heap work), O(1) space beyond the heap — bounded by the alphabet, not by the
length of `tasks`.

The heap only ever holds _remaining counts_, negated — every pop still needs the leading `-` to
recover the true count, and every value queued for re-entry has to be re-negated before going back
in. This is the discipline from the previous section applied to a real problem: get the sign wrong
once, in either direction, and the schedule length comes out wrong with no error raised anywhere.

---

## `nlargest` / `nsmallest`: When Building a Heap Isn't Worth It

`heapq.nlargest(k, iterable)` and `heapq.nsmallest(k, iterable)` answer "give me the top k" in a
single call, without you ever touching a heap directly:

```python
import heapq

nums = [5, 3, 8, 1, 2, 9, 4]
heapq.nlargest(3, nums)     # [9, 8, 5]
heapq.nsmallest(2, nums)    # [1, 2]
```

Both run in **O(n log k)** — internally, `nlargest` maintains a size-`k` min-heap over the iterable
exactly the way the `KthLargest` worked example did by hand, and `nsmallest` does the mirror image,
so there's no need to write the negation trick yourself just to get a top-k list back. That
complexity is worth weighing against the alternatives explicitly:

- **`sorted(nums)[-k:]`** — O(n log n), worse than `nlargest` when `k` is meaningfully smaller than
  `n`, but perfectly fine (and more readable) when `k` is close to `n` or the full order is needed
  anyway.
- **A hand-maintained size-`k` heap** (the `KthLargest` pattern above) — the right call the moment
  the top-k has to stay current across a **stream** of incoming values, one at a time, rather than
  being computed once over a fixed collection. `nlargest`/`nsmallest` take a finished iterable;
  they're not built to be called incrementally.

Both functions also accept a `key` argument, mirroring `sorted()`, for ranking by something other
than natural ordering:

```python
heapq.nlargest(2, nums, key=lambda x: -x)   # 2 smallest, via nlargest + an inverted key
```

Rule of thumb: reach for `nlargest`/`nsmallest` for a one-shot top-k over data already in hand;
reach for a hand-maintained heap the instant "top-k so far" has to answer a query after every new
arrival.

---

## `bisect`: Finding a Position in a Sorted Sequence

[[01-binary-search|Part 07, Chapter 1]] derives `bisect_left` and `bisect_right` from first
principles — the half-open `[lo, hi)` convention, the one-character difference (`<` vs. `<=`) that
separates leftmost from rightmost insertion point, and why both run in `O(log n)`. This section is
the module surface on top of that derivation, for a sequence that is already sorted:

- **`bisect.bisect_left(arr, x)`** — leftmost index where `x` could be inserted without breaking
  sort order (the first index `i` with `arr[i] >= x`).
- **`bisect.bisect_right(arr, x)`** / **`bisect.bisect(arr, x)`** — rightmost such index (`bisect`
  is a plain alias for `bisect_right`); the first index `i` with `arr[i] > x`.
- **`bisect.insort_left(arr, x)`** / **`bisect.insort_right(arr, x)`** / **`bisect.insort(arr, x)`**
  — find the position with the matching `bisect_*` call, then insert `x` there, keeping `arr`
  sorted.

```python
import bisect

arr = [1, 3, 5, 7, 9]
bisect.bisect_left(arr, 5)     # 2
bisect.bisect_right(arr, 5)    # 3
bisect.insort(arr, 4)          # arr -> [1, 3, 4, 5, 7, 9]
```

The detail worth flagging that's easy to miss from the name alone: **`insort` is not O(log n).**
Finding the position is O(log n), but `list.insert` still has to shift every element after that
position one slot to the right to make room — an O(n) operation on a Python list, the same cost
`list.insert(0, x)` always pays. So `insort` is **O(log n) search + O(n) shift = O(n) overall**, no
cheaper than `list.insert` alone. It's still the right tool for a handful of sorted insertions into
a list you're also indexing and slicing normally — but "maintain a sorted collection under many
insertions" at real scale is a signal to reach for a different structure (a heap if only the extreme
values are ever needed, a balanced BST if order statistics or range queries are needed too), not a
sign that `bisect` was used incorrectly.

---

## Worked Example: Time-Based Key-Value Store

**Problem:** implement a key-value store where `set(key, value, timestamp)` stores a value at a
given timestamp (timestamps arrive in increasing order per key), and `get(key, timestamp)` returns
the value associated with the largest stored timestamp `<= timestamp` for that key, or `""` if none
exists.

Each key's timestamps arrive already sorted, so its per-key history is a natural fit for `bisect`:
store `(timestamp, value)` pairs in a list per key, and answer `get` with `bisect_right` against
that list — the same "rightmost insertion point" idea, applied to "find the last entry not after
this point" rather than "find where to insert."

```python
import bisect
from collections import defaultdict

class TimeMap:
    def __init__(self) -> None:
        self.store: dict[str, list[tuple[int, str]]] = defaultdict(list)

    def set(self, key: str, value: str, timestamp: int) -> None:
        self.store[key].append((timestamp, value))    # arrives sorted -- no insort needed

    def get(self, key: str, timestamp: int) -> str:
        entries = self.store[key]
        i = bisect.bisect_right(entries, (timestamp, chr(0x10FFFF)))
        return entries[i - 1][1] if i > 0 else ""
```

**Complexity:** O(log n) per `get` against that key's history, O(1) amortized per `set` (a plain
append, since timestamps already arrive sorted). O(n) total space across all keys.

The trick worth noticing: `bisect_right` compares tuples, and Python compares tuples
element-by-element, so searching for `(timestamp, chr(0x10FFFF))` — a value guaranteed to sort after
any real string at that same timestamp — finds the position just past every entry stamped at exactly
`timestamp`, regardless of what the stored value string looks like. `i - 1` is then the last entry
at or before the query timestamp. Nothing is being inserted here; `bisect_right` is doing the same
job it always does, just to locate a boundary in already-sorted data rather than to place a new
element.

---

## When heapq or bisect Is the Wrong Tool

Both modules earn their `O(log n)` by committing to a specific shape of problem, and both stop
paying off the moment a problem asks for something outside that shape:

- **`heapq` only ever gives you the extreme (min or max) value** — never the second-smallest, never
  a full sorted traversal, never "find this specific value and remove it" faster than an O(n) scan.
  A heap's weak invariant ([[11-heap|Part 05, Chapter 11]] covers exactly why) means nothing is
  known about ordering below the root beyond "children >= parent." If a problem needs the full
  sorted order at the end, or needs to delete an arbitrary element by value rather than always
  taking the current extreme, a heap is buying speed for a question it was never asked — a sorted
  list maintained with `bisect`, or in the worst case a single sort, does the actual job better.
- **`bisect` only works on sequences that are already sorted**, and only ever with a total order it
  can compare directly — searching an unsorted list with `bisect` returns a meaningless index with
  no error raised, since the module has no way to know the input wasn't sorted to begin with. And as
  the O(n) shift cost above showed, `bisect`/`insort` on a plain `list` is the wrong choice the
  moment insertions start to dominate over lookups at any real scale.
- **Neither module takes a general comparator.** Both assume a total order via `<`. The usual fix
  for `heapq` when tie-breaking needs more than one field is pushing tuples —
  `(priority, tiebreaker, item)` — so tuple comparison resolves ties for free; the usual fix for
  `bisect` is searching against a precomputed key sequence rather than the objects themselves.
  (Neither takes a `key=` argument the way `sorted()` does — unlike `nlargest`/`nsmallest` above,
  which do.)

The shared pattern: both are the right call the moment a problem's actual question is "the current
extreme, repeatedly" (`heapq`) or "the position in an already-sorted order" (`bisect`) — and both
are overhead, or outright wrong, the instant the real question is something else wearing a similar
shape.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
