---
title: "11 — itertools & functools"
description: "How two small standard-library modules replace hand-rolled nested loops and memoization boilerplate with composable, lazy building blocks — and where reaching for the library instead of writing the loop yourself stops being free."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/02-memoization/02-memoization
    kind: related
zettelId: "202607301922-3"
---

# 11 — itertools & functools

Every "generate all orderings," "find every subset," or "combine every choice from A with every
choice from B" problem has an honest but tedious brute-force answer: nested loops, or backtracking
written by hand, one enumeration at a time. `itertools` collapses that entire family into a handful
of composable, lazy iterator functions that never materialize more of a sequence than you actually
consume. `functools` solves an unrelated but equally recurring complaint: functions that repeat
work, take more arguments than a given call site wants to supply, or lose their own identity once
wrapped in a decorator. The two modules aren't a matched pair so much as two toolboxes for the same
underlying instinct — stop writing boilerplate for something the language already generalized — and
this chapter is what each tool actually buys, and where the library's convenience quietly costs you
the complexity, or the explanation, you were still on the hook for.

---

## Combinatorial Generation: permutations, combinations, and product

`itertools.permutations(iterable, r=None)` yields every ordering of length `r` (the full length by
default); `combinations(iterable, r)` yields every unordered subset of length `r`;
`combinations_with_replacement(iterable, r)` does the same but allows an element to repeat within a
subset; `product(*iterables, repeat=1)` yields the Cartesian product — every tuple formed by picking
one element from each input. All four are lazy: `permutations(pids)` returns instantly regardless of
`pids`'s size — the `n!` cost is paid only once something actually iterates the result all the way
through.

These four are the standard-library shortcut for exactly the enumeration that
[[04-permutations|Part 10, Chapter 4]] and [[05-combinations|Part 10, Chapter 5]] teach you to write
by hand via backtracking — worth naming directly, because an interviewer asking you to "generate all
permutations" almost always wants the backtracking, not a one-line `itertools` import; the recursive
structure is the thing being tested. Recognizing "return all ..." as an enumeration problem in the
first place is the [[05-algorithm-design-principles|Part 01, Chapter 5]] skill — `itertools` is what
you reach for once that recognition has already happened.

---

## Worked Example: Fuzzing a Scheduler's Inputs

**Problem:** given a small set of process IDs, generate three different test fixtures for a
scheduler fuzz test — every possible execution order, every pair that could deadlock each other, and
every (process, resource) lock grant the scheduler might issue.

```python
from itertools import permutations, combinations, combinations_with_replacement, product

pids = ["p1", "p2", "p3"]
resources = ["disk", "net"]

# Every possible execution order — to fuzz a suspected race condition
all_orders = list(permutations(pids))                      # 3! = 6 orders

# Every pair that could deadlock each other
lock_pairs = list(combinations(pids, 2))                    # C(3, 2) = 3 pairs

# Every pair including a process checked against itself
self_check_pairs = list(combinations_with_replacement(pids, 2))  # 6 pairs

# Every (process, resource) lock the scheduler could grant
grants = list(product(pids, resources))                    # 3 * 2 = 6 grants
```

**Complexity:** `permutations(n)` yields `n!` tuples, `combinations(n, k)` yields `C(n, k)`,
`combinations_with_replacement(n, k)` yields `C(n + k - 1, k)`, and `product(a, b)` yields
`len(a) * len(b)` — none of it the cost of the function call itself (every constructor above is
O(1)), all of it the cost of fully consuming the iterator each one returns. Building
`permutations(range(20))` is instant; asking `list()` to materialize all `20!` of its results is
not.

---

## Infinite Iterators Need islice — count, cycle, repeat

Three itertools functions never stop on their own: `count(start)` counts up forever,
`cycle(iterable)` repeats an iterable's elements forever, and `repeat(value)` with no explicit count
yields the same value forever. Feed any of them straight into `list()` and the call never returns —
Python has no way to know you wanted the first 10 items and not all of them, because "all of them"
isn't a finite set. `itertools.islice(iterable, n)` is the standard pairing: it takes a bounded
slice of what would otherwise be an unbounded stream, recovering the `iterable[:n]` semantics that
an iterator can't support directly (no `__getitem__`, no length).

## Worked Example: Round-Robin Task Scheduling

**Problem:** distribute a queue of tasks across a fixed pool of workers in round-robin order,
wrapping back to the first worker once the pool is exhausted.

```python
from itertools import cycle

def assign_round_robin(tasks: list[str], workers: list[str]) -> list[tuple[str, str]]:
    return list(zip(tasks, cycle(workers)))

tasks = ["task-a", "task-b", "task-c", "task-d", "task-e"]
workers = ["worker-1", "worker-2"]
print(assign_round_robin(tasks, workers))
# [('task-a', 'worker-1'), ('task-b', 'worker-2'), ('task-c', 'worker-1'),
#  ('task-d', 'worker-2'), ('task-e', 'worker-1')]
```

**Complexity:** O(n) time and O(1) extra space beyond the output, where `n` is the number of tasks —
`zip` stops at its shorter argument (`tasks`), pulling exactly `n` items out of the otherwise
infinite `cycle`, which itself only ever holds the `k` worker names it was built from. `zip` is
doing the same "bound the infinite stream" job `islice` would; it just reads more naturally here,
since a finite sequence (`tasks`) is already there to pair against.

---

## Filtering, Chaining, and Running Totals

`chain(*iterables)` concatenates several iterables into one lazy stream without copying any into a
new list first. `compress(data, selectors)` filters `data` by a parallel boolean mask instead of a
predicate — keep the `i`-th element of `data` only where the `i`-th element of `selectors` is
truthy. `dropwhile(predicate, iterable)` and `takewhile(predicate, iterable)` are complementary
halves of one scan: `dropwhile` discards elements until the predicate first goes false, then yields
everything after, even a later true; `takewhile` yields only while the predicate holds and stops
permanently at the first failure. Neither re-checks the predicate after its one flip, unlike
`filter()`, which re-evaluates it on every element independently.

`accumulate(iterable, func=operator.add)` is the one worth pausing on: a running fold that yields
the cumulative result after each element, not only the final one. With the default `add`,
`accumulate([1, 2, 3])` yields `1, 3, 6` — a prefix-sum array, computed lazily instead of with a
hand-rolled loop. Anywhere [[05-prefix-sum-and-difference-arrays|Part 02, Chapter 5]] builds
`prefix[i] = prefix[i - 1] + nums[i]` by hand, `accumulate(nums)` is the identical array in one
call, with the added flexibility of swapping `add` for any two-argument function — a running maximum
via `accumulate(nums, max)`, a running product via `accumulate(nums, lambda a, b: a * b)`.

## Worked Example: Prefix Sums for Free

```python
from itertools import accumulate

def range_sum_queries(nums: list[int], queries: list[tuple[int, int]]) -> list[int]:
    prefix = [0] + list(accumulate(nums))   # prefix[i] == sum(nums[:i])
    return [prefix[r + 1] - prefix[l] for l, r in queries]

nums = [2, 4, 1, 5, 3]
print(range_sum_queries(nums, [(0, 2), (1, 3), (2, 4)]))
# [7, 10, 9]
```

**Complexity:** O(n) time and O(n) space to build `prefix` once via `accumulate`, then O(1) time per
query — identical to the hand-rolled prefix-sum array, because `accumulate` isn't a different
algorithm, it's the same running total with the loop already written for you.

---

## groupby: The Sorted-Input Trap

`itertools.groupby(iterable, key)` groups **consecutive** elements sharing the same key — not a
general "group by key across the whole sequence" operation, whatever the name suggests. The moment
two runs of the same key are separated by even one differently-keyed element, `groupby` reports them
as two distinct groups, having already moved past the first run and forgotten it existed. The fix is
always the same: sort by the same key first, so every element sharing a key is guaranteed adjacent
before `groupby` ever sees it.

## Worked Example: Grouping Words by First Letter — Correctly and Incorrectly

```python
from itertools import groupby

words = ["apple", "banana", "avocado", "blueberry", "cherry", "artichoke"]

# Unsorted: "artichoke" (key 'a') arrives after "cherry" (key 'c') broke the run
for key, group in groupby(words, key=lambda w: w[0]):
    print(key, list(group))
# a ['apple']
# b ['banana']
# a ['avocado']         <- a second, separate "a" group
# b ['blueberry']
# c ['cherry']
# a ['artichoke']       <- a third "a" group

# Sorted by the same key first: every "a" word is now adjacent
for key, group in groupby(sorted(words, key=lambda w: w[0]), key=lambda w: w[0]):
    print(key, list(group))
# a ['apple', 'avocado', 'artichoke']
# b ['banana', 'blueberry']
# c ['cherry']
```

**Complexity:** O(n) for the `groupby` scan itself either way — what changes is the O(n log n) sort
you have to pay up front to make that O(n) scan produce a correct answer. `groupby` never sorts for
you; conflating "grouped" with "grouped correctly" is the single most common bug this function
produces in practice, precisely because unsorted input fails silently — wrong groups, no exception
raised.

---

## functools.lru_cache: Memoization as a Decorator

`@functools.lru_cache(maxsize=...)` wraps a function in a cache keyed on its arguments: the first
call with a given set of arguments runs the function body and stores the result; every later call
with the _same_ arguments returns the stored result without re-running the body. Arguments must be
hashable — `f([1, 2])` raises `TypeError`, since a `list` can't be a dict key, which is exactly what
the cache is keyed on internally. `maxsize=None` makes the cache unbounded; a finite `maxsize` makes
it an actual **L**east-**R**ecently-**U**sed cache, evicting the least-recently-used entry once full
— the same eviction policy [[05-lru-cache-design|LRU Cache Design, Part 03, Chapter 5]] builds by
hand from a hash map plus a doubly linked list. `cache_info()` reports `hits`, `misses`, `maxsize`,
and current size directly; `cache_clear()` resets it.

This is memoization, but only the decorator half of it — for using this as an actual DP technique
rather than just a decorator (deriving the state and transition yourself, reasoning about recursion
depth, and weighing it against tabulation), see [[02-memoization|Part 08, Chapter 2]].

## Worked Example: Caching a Pure Geometric Check

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def is_perfect_square(n: int) -> bool:
    if n < 0:
        return False
    root = int(n ** 0.5)
    return root * root == n or (root + 1) ** 2 == n

candidates = [16, 16, 17, 25, 25, 26, 16]
results = [is_perfect_square(n) for n in candidates]
print(results)                       # [True, True, False, True, True, False, True]
print(is_perfect_square.cache_info())
# CacheInfo(hits=3, misses=4, maxsize=128, currsize=4)
```

**Complexity:** each distinct `n` costs O(1) (one square root, one comparison) exactly once; every
repeat call for an `n` already seen is an O(1) dict lookup instead. Of the 7 calls above, only the 4
distinct values (`16, 17, 25, 26`) ever run the function body — the 3 repeats are hits, matching
`cache_info()` exactly.

---

## functools.reduce and partial: Folding and Specializing Functions

`reduce(func, iterable, initial=...)` folds a sequence into a single value by repeatedly applying a
two-argument function to a running accumulator and the next element — `reduce(add, [1, 2, 3, 4])` is
`((1 + 2) + 3) + 4`. An explicit `initial` seeds the accumulator instead of the iterable's first
element, and matters twice over: it defines the result for an empty iterable (without it, `reduce`
on `[]` raises `TypeError`), and lets the accumulator start at a value the iterable never contains.
Python's own style guidance leans against `reduce` for the cases it's usually reached for first —
`sum()`, `any()`, `all()`, and `max()` already cover addition, existence, universality, and
running-maximum folds directly, and a plain loop is often easier for a reviewer to trace than a
`reduce(lambda ...)` call. Where `reduce` earns its keep is a fold whose combiner isn't one of those
built-ins:

## Worked Example: Composing a Transformation Pipeline

```python
from functools import reduce
from typing import Callable

def pipeline(value: int, *funcs: Callable[[int], int]) -> int:
    return reduce(lambda acc, f: f(acc), funcs, value)

result = pipeline(5, lambda x: x + 1, lambda x: x * 2, lambda x: x - 3)
print(result)   # ((5 + 1) * 2) - 3 == 9
```

**Complexity:** O(k) time where `k` is the number of functions in the pipeline, assuming each
function is O(1) — one call per function, no intermediate list ever materialized. This is a fold
`sum()`/`max()` genuinely can't express, because the combiner is "apply the next function," not an
associative arithmetic operator.

`functools.partial(func, *args, **kwargs)` pre-fills some of a function's arguments and returns a
new callable needing only the rest — mechanically similar to a `lambda`, but with two advantages a
`lambda` lacks: the result keeps `.func`, `.args`, and `.keywords` as inspectable attributes, and
it's picklable, where a `lambda` is not — the difference that decides whether a pre-filled callback
survives being sent to a `multiprocessing.Pool` worker at all.

## Worked Example: A Sort Key via partial

```python
from functools import partial

def distance_from(origin: tuple[int, int], point: tuple[int, int]) -> float:
    return ((point[0] - origin[0]) ** 2 + (point[1] - origin[1]) ** 2) ** 0.5

points = [(5, 5), (1, 1), (2, 0), (-3, 4)]
points.sort(key=partial(distance_from, (0, 0)))
print(points)   # [(1, 1), (2, 0), (-3, 4), (5, 5)]
```

**Complexity:** O(n log n) for `sort()` itself; `partial` contributes O(1) call overhead per
invocation of the key function and no algorithmic cost of its own — it only rearranges which
arguments get supplied where.

---

## functools.wraps: Keeping a Decorator's Function Honest

A decorator that returns an inner `wrapper` replaces the original function's identity along with its
behavior — without intervention, `help()`, `__name__`, and `__doc__` all report the wrapper's own
metadata, not the wrapped function's:

```python
import functools

def logged(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@logged
def add(x: int, y: int) -> int:
    """Add two numbers."""
    return x + y

print(add.__name__)   # 'wrapper' — wrong, and every logger/debugger sees it too
```

`@functools.wraps(func)`, applied to `wrapper` itself, copies `__name__`, `__doc__`, `__module__`,
and a few other attributes from `func` onto `wrapper` before it's returned — one line, and
`add.__name__` reports `'add'` again. Every non-trivial decorator in this book should carry it; the
cost is one import and one line, and the failure mode without it is silent — confusing stack traces
and broken `help()` output showing up far from where the decorator was actually written.

---

## Where These Tools Cost You

- **itertools results are single-use.** `list(perm)` then `list(perm)` again returns `[]` — the
  underlying iterator has nothing left to yield. Materializing with `list()` buys re-use and
  indexing at the cost of memory proportional to however many results exist:
  `permutations(range(15))` is `15!` ≈ 1.3 trillion tuples, enough to exhaust memory long before it
  exhausts patience. Consume itertools results in a single pass; never assume the iterator has
  anything left after that.
- **None of these functions change the underlying complexity.** `permutations(n)` is still O(n!)
  work to enumerate fully, whichever tool writes the loop — itertools moves _who_ writes the
  iteration, not _what_ it costs. An interviewer asking for the complexity of a brute-force
  permutation search wants `O(n!)`, whether the code says `itertools.permutations` or four nested
  loops.
- **`lru_cache` on a bound method keys its cache on `self` too** — part of the argument tuple — so
  the cache holds a live reference to every `self` it has seen, for as long as the entry survives.
  On a class meant to be garbage-collected, that's a real memory leak with no exception to flag it,
  worse still under `maxsize=None`. Prefer a finite `maxsize` outside pure functions with cheap,
  immutable arguments.
- **`reduce` reads as clever, not clear** — the same objection Guido van Rossum raised trying,
  unsuccessfully, to drop it from Python 3's builtins. Reach for `sum()`/`any()`/`all()`/`max()`
  first; reach for `reduce` only when the combiner genuinely isn't one of them, and expect to still
  explain the fold in a loop's worth of words if asked to trace it by hand.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
