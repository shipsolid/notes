---
title: "12 — Python Algorithm Idioms"
description: "The sort, search, count, group-by, and filter-map-reduce patterns covered elsewhere in this book, restated as a question of expression, not algorithm: given that you already know which pattern a problem wants, what's the Python-idiomatic way to write it, and which hand-rolled version is quietly hiding a bug the standard library already closed."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/03-sorting-fundamentals/03-sorting-fundamentals
    kind: related
zettelId: "202607301922-4"
---

# 12 — Python Algorithm Idioms

[[03-sorting-fundamentals|Part 07, Chapter 3]] already derives why Timsort is O(n log n), stable,
and adaptive, and Part 14 already builds interview patterns like two-sum and top-K on top of these
same operations. None of that gets re-derived here. This chapter assumes you've already picked the
pattern a problem wants — a sort, a search, a frequency count, a group-by, a filter-map-reduce pass
— and asks a narrower question: given that decision, what's the most idiomatic way to write it in
Python specifically? Every section below puts a hand-rolled version — the one most people reach for
first — next to the standard-library call that says the same thing in fewer lines, and is usually
correct in more edge cases besides. The algorithm doesn't change. The bugs you avoid by not
reinventing it do.

---

## Sorting: `sorted()` and `key=`, Not Hand-Rolled Comparators

Writing your own comparison loop to order a list is almost never the right call — `sorted()` and
`.sort()` already are Timsort, already stable, already O(n log n) worst case
([[03-sorting-fundamentals|Part 07, Chapter 3]] covers exactly why that combination matters). The
only Python-specific decision left is how to shape the `key=` function, not whether to trust the
algorithm underneath it.

For simple field access, `operator.itemgetter` / `operator.attrgetter` are the idiomatic form of
`lambda x: x[i]` / `lambda x: x.attr` — same result, one less Python-level function call per
element. For multiple sort fields going the _same_ direction, a tuple key
(`key=lambda x: (x.dept, x.name)`) is the standard one-pass idiom. The case worth naming separately
is **mixed directions on a non-numeric field** — negating a number for descending order (`-x.score`)
is easy, but there's no `-x.name` for a string. Tuple keys can't express that in one pass; the
idiomatic fix leans on the same stability property `sorting-fundamentals` already established, run
as successive passes, least-significant field first:

### Worked Example: Mixed-Direction Multi-Key Sort

```python
from dataclasses import dataclass

@dataclass
class Employee:
    department: str
    name: str

staff = [
    Employee("Eng", "Priya"),
    Employee("Eng", "Amit"),
    Employee("Sales", "Rahul"),
    Employee("Sales", "Zara"),
]

# Goal: department ASCENDING, name DESCENDING within each department.
# A single tuple key can't express this — negating a str isn't meaningful —
# so lean on stability instead: sort the least-significant field first.
by_name_desc = sorted(staff, key=lambda e: e.name, reverse=True)
result = sorted(by_name_desc, key=lambda e: e.department)

for e in result:
    print(e.department, e.name)
# Eng Priya
# Eng Amit
# Sales Zara
# Sales Rahul
```

The second `sorted()` call only gets the name-descending order right _because_ it's stable — sorting
by department alone would otherwise be free to interleave `"Priya"` and `"Amit"` arbitrarily, since
they tie on department. `functools.cmp_to_key` exists as a last resort for orderings that a key
function genuinely can't express, but it's a legacy escape hatch, not the first idiom to reach for.

---

## Searching & Membership: `in`, `bisect`, and the Set Detour

A one-off `x in some_list` is perfectly idiomatic and needs no further thought. The idiom that
actually matters shows up the moment that check runs inside a loop, against the same collection,
more than once: converting to a `set` first and checking `in` against that isn't just cleaner — it
changes the complexity class the rest of the loop pays.

**Complexity:** `x in list` is O(n) per check, since every call re-scans from the start. `x in set`
is O(1) average per check, the same hash-table trade-off [[06-hashing|Chapter 6, Part 02]] covers in
depth. Converting once costs O(n); every check after that drops from O(n) to O(1) — worth it the
instant there's more than one lookup against the same data.

For searching _within_ an already-sorted sequence, `bisect` is the idiomatic binary search — no
reason to hand-roll the low/high/mid loop. `bisect.insort` is the idiomatic way to keep a list
sorted across repeated inserts, instead of appending and re-sorting the whole thing each time:

### Worked Example: Set Intersection and `bisect.insort`

```python
def common_elements(a: list[int], b: list[int]) -> set[int]:
    return set(a) & set(b)   # O(n + m) — not the O(n * m) of a nested-loop scan

import bisect

sorted_scores: list[int] = []
for score in (88, 45, 91, 67):
    bisect.insort(sorted_scores, score)   # keeps the list sorted after every insert
print(sorted_scores)   # [45, 67, 88, 91]

pos = bisect.bisect_left(sorted_scores, 67)
print(sorted_scores[pos] == 67)   # True — located without a linear scan
```

`list.index()` is the idiomatic membership-with-position lookup for small or one-off cases, but it
raises `ValueError` on a miss — wrap it in `try`/`except`, or check `in` first, rather than letting
the exception surface as an accident.

---

## Counting: `Counter` Over a Hand-Rolled Frequency Map

`freq[item] = freq.get(item, 0) + 1` in a loop works, but `Counter(iterable)` is the same one-pass
hash-map build ([[06-hashing|Chapter 6, Part 02]] covers why each update is O(1) average) expressed
in one line, and it comes with `.most_common(k)` for free — internally backed by `heapq.nlargest`
when `k` is smaller than the full count, which is a better idiom than hand-sorting the whole
frequency dict just to take the top few.

`Counter` also supports multiset arithmetic — `+`, `-`, `&`, `|` between two counters — which is the
idiomatic way to express "does one collection's contents cover another's" instead of writing a
manual loop with `.get()`:

### Worked Example: Sub-Multiset Check via `Counter` Subtraction

```python
from collections import Counter

def contains_all_chars(container: str, needle: str) -> bool:
    """True if every character in `needle` appears in `container`
    at least as many times as it appears in `needle`."""
    return not (Counter(needle) - Counter(container))
```

The gotcha worth naming: `Counter` subtraction silently **drops non-positive counts** — unlike a
manual dict subtraction, which would leave zero or negative entries sitting around. So
`Counter(needle) - Counter(container)` is empty exactly when every character `needle` needs is fully
covered by `container`, and an empty `Counter` is falsy, which is what makes `not (...)` read
correctly as "nothing left uncovered."

---

## Grouping: `defaultdict(list)` vs. `itertools.groupby`

These solve related but different problems, and picking the wrong one is the most common bug in this
chapter. `defaultdict(list)` groups by key **regardless of where equal keys sit** in the input — one
pass, O(n), no ordering requirement. `itertools.groupby` only merges keys that are **already
adjacent** in the iterable; it never looks ahead or behind to reunite a key it's already closed a
group for. Feed it unsorted data expecting `defaultdict`-style behavior and it fails silently — no
exception, just wrong groups.

### Worked Example: The `groupby` Adjacency Bug, and Two Fixes

```python
from itertools import groupby

words = ["apple", "banana", "avocado", "blueberry", "cherry"]

# BUG: groupby only merges *adjacent* equal keys. "apple" (a) and "avocado" (a)
# are three positions apart, so they become two separate "a" groups — and
# building a dict from them keeps only the last one, silently.
buggy = {k: list(v) for k, v in groupby(words, key=lambda w: w[0])}
print(buggy)   # {'a': ['avocado'], 'b': ['blueberry'], 'c': ['cherry']}
               # "apple" and "banana" vanished. No error, no warning.

# Fix #1: sort by the grouping key first, so equal keys become adjacent.
grouped = {
    k: list(v)
    for k, v in groupby(sorted(words, key=lambda w: w[0]), key=lambda w: w[0])
}
print(grouped)   # {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}

# Fix #2 (usually simpler): skip groupby entirely for unsorted input.
from collections import defaultdict
groups: dict[str, list[str]] = defaultdict(list)
for w in words:
    groups[w[0]].append(w)
print(dict(groups))   # same correct result, one pass, no pre-sort needed
```

`groupby` earns its place when the input is already sorted (or already grouped by construction — the
tail end of a merge, a sorted log stream) and lazy, iterator-based grouping without materializing
the whole thing upfront actually matters. Otherwise, `defaultdict(list)` is both simpler and
cheaper: O(n) instead of the O(n log n) a pre-sort would cost just to make `groupby` safe to use.

---

## Filter, Map, Reduce: Comprehensions First, `reduce` as the Escape Hatch

A list comprehension is the idiomatic default over `filter()`/`map()` with a `lambda` — it reads
left to right as "what am I keeping, what am I transforming," without an extra layer of function
calls wrapping a lambda wrapping the actual expression. When the result doesn't need to be a
materialized list, a generator expression feeding a named aggregate (`sum`, `any`, `all`, `min`,
`max`, `math.prod`) is the idiomatic "reduce" step. `functools.reduce` is the escape hatch for
accumulations that aren't already one of those named built-ins — reaching for it when a built-in
already does the job is the functional-programming equivalent of hand-rolling a sort.

### Worked Example: Comprehension Over `filter`/`map`, and When `reduce` Earns Its Place

```python
nums = [1, 2, 3, 4, 5]

# filter()/map() + lambda vs. a comprehension — same result, one nested call fewer:
evens_squared_functional = list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, nums)))
evens_squared = [x ** 2 for x in nums if x % 2 == 0]
print(evens_squared)   # [4, 16]

# reduce() reinventing a named built-in — don't:
from functools import reduce
import math

product = reduce(lambda acc, x: acc * x, nums)   # works, but...
product = math.prod(nums)                         # ...this is what it should be (3.8+)
print(product)   # 120

# Where reduce actually earns its place: no built-in names this operation.
def compose(*funcs):
    return reduce(lambda f, g: lambda x: g(f(x)), funcs)

pipeline = compose(lambda x: x + 1, lambda x: x * 2, str)
print(pipeline(3))   # "8"  -- (3 + 1) * 2, then stringified
```

`sum()`, `any()`, and `all()` aren't just shorter than the equivalent `reduce()` call — `any()`/
`all()` short-circuit on the first decisive element, and all three are implemented in C, which
`reduce` with a Python-level lambda is not.

---

## Where the One-Liner Doesn't Save You From Yourself

Reaching for the idiomatic call removes an entire category of bug, but not every category:

- **`key=` is already computed once per element**, not once per comparison — Python's `sorted()`
  does this internally, so there's no need to hand-build a Schwartzian-transform tuple to avoid
  recomputing an expensive key. What it doesn't do is cache across _separate_ `sorted()` calls; an
  expensive key function recomputed across several passes (as in the mixed-direction example above)
  is still paying full price each time.
- **The `groupby` adjacency rule is the single most common bug in this chapter** — it produces a
  plausible-looking, silently wrong dict rather than raising, which makes it the one idiom on this
  page most worth double-checking with a second look at the input's actual order before shipping.
- **`Counter.most_common()`'s tie order depends on insertion order**, which is only reliable because
  Python's `dict` (and therefore `Counter`) has preserved insertion order as a language guarantee
  since 3.7 — it's a real guarantee at this point, not the same implementation-detail caveat
  `[[06-hashing|Chapter 6, Part 02]]` raises about hash-bucket iteration order in general, but it's
  still worth knowing _why_ the ties come out stable rather than assuming it by accident.
- **Sets and `Counter` keys both require hashable elements** — a list of lists, or a list of dicts,
  can't go into a `set` or become `Counter` keys directly. The `set`-for-membership and
  `Counter`-for-counting idioms above aren't free for arbitrary nested data; they need a tuple (or
  another hashable stand-in) first.
- **`reduce` cuts both ways on readability.** A `reduce` call with a multi-line accumulator lambda
  is harder to read than the explicit loop it replaced — the idiom is "prefer `reduce` over a manual
  loop when the accumulator logic is a single small expression," not "prefer `reduce`
  unconditionally because it's functional."

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
