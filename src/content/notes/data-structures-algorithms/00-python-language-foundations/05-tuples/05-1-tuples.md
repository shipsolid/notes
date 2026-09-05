---
title: "5 — Tuples"
description: "Why Python's tuple looks like a read-only list but is really the language's native mechanism for multi-value returns and dict/set keys, where that immutability guarantee quietly stops — the first element that's itself a list — and why 'copying' a tuple by slicing is frequently not a copy at all."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: related
zettelId: "202607301922-14"
---

# 5 — Tuples

A Python `tuple` looks like a `list` that lost its mutating methods, and that framing undersells
what's actually going on: immutability isn't a restriction bolted onto a list for safety's sake,
it's the property that makes a tuple hashable, safe to hand to another function without a defensive
copy, and — because nothing about it can ever change — frequently free to "copy," since there's
nothing to protect against sharing in the first place. This chapter covers what that immutability
guarantee actually locks down, precisely where it stops (a tuple holding a list is only shallowly
immutable), the read-only operations a tuple shares with a list, and the packing/unpacking machinery
that makes a tuple Python's native mechanism for a function returning more than one value.

---

## Tuples Are Immutable, Not Read-Only Lists

A `tuple` is built with commas — the parentheses are a readability convention, not the mechanism
that actually creates it:

```python
empty: tuple = ()
one_element: tuple[int] = (42,)                # trailing comma is load-bearing, NOT optional
multiple: tuple[int, str, float] = (1, "apple", 3.14)
implicit: tuple[int, int, int] = 10, 20, 30     # tuple packing -- no parens required at all
```

`len()` and indexing behave exactly as they do on a list — the same O(1) address-arithmetic argument
[[01-arrays|Part 02, Chapter 1]] makes for arrays generally applies here directly, since a tuple is
a fixed-size array of pointers under the hood, arguably an even more literal case of that argument
than list's resizable one:

```python
rgb_color: tuple[int, int, int] = (150, 100, 200)
print(rgb_color[0], rgb_color[1], rgb_color[2])   # 150 100 200
```

The one thing a tuple refuses to do, on principle, is let any of those slots change after creation:

```python
try:
    rgb_color[1] = 10
except TypeError as exc:
    print("Error:", exc)   # 'tuple' object does not support item assignment
```

That refusal isn't decoration — it's the property everything else in this chapter depends on.
Because a tuple's contents can never change, Python can compute a stable hash for it once and reuse
that hash forever, which is exactly what qualifies a tuple (and disqualifies a list) as a dict key
or set member — see [[06-1-dictionaries|Chapter 6, this same Part]] and
[[06-hashing|Part 02, Chapter 6]] for the mechanism that hash feeds into.

---

## Worked Example: A Guarded Coordinate Pair

**Problem:** represent a fixed 2D point and compute the distance between two of them, in a way that
makes "this coordinate cannot be silently changed by whatever function receives it" part of the
guarantee, not just a convention followed by agreement.

```python
def euclidean_distance(a: tuple[float, float], b: tuple[float, float]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

point_a: tuple[float, float] = (40.7128, -74.0060)     # New York
point_b: tuple[float, float] = (34.0522, -118.2437)    # Los Angeles

print(euclidean_distance(point_a, point_b))
```

**Complexity:** O(1) — both tuples have a fixed, known size, so the function performs a constant
amount of arithmetic regardless of what the coordinates happen to be. Passing `point_a` into
`euclidean_distance` costs nothing extra either: since it can't be mutated, there's no reason for
Python — or you — to defensively copy it first, the same "safe to share without copying" property
the closing section of this chapter returns to.

---

## What a Tuple Can Still Do

Every read-only operation a list supports, a tuple supports identically — concatenation builds a new
tuple, iteration walks it the same way, and a small set of methods and builtins answer "what's in
here" without ever needing to change it:

| Operation                      | Complexity | Why                                                          |
| ------------------------------ | ---------- | ------------------------------------------------------------ |
| `t[i]`                         | O(1)       | Direct address arithmetic — same as list                     |
| `a + b`                        | O(n + m)   | Builds an entirely new tuple; copies every pointer from both |
| `t.count(value)`               | O(n)       | Linear scan — no structural shortcut for "how many"          |
| `t.index(value)`               | O(n)       | Linear scan; raises `ValueError` if the value is absent      |
| `value in t`                   | O(n)       | Same linear scan as `count` / `index`                        |
| `max(t)` / `min(t)` / `sum(t)` | O(n)       | One full pass; no way to know without checking every element |
| `len(t)`                       | O(1)       | A stored counter, not a scan                                 |

Notice what's missing: `.append()`, `.insert()`, `.remove()`, `.pop()`, `.sort()`, `.reverse()`
don't exist on `tuple` — not an oversight, but the direct consequence of immutability. Every one of
those methods on `list` works by mutating a slot, or shifting a range of slots, in place; a tuple
has no in-place to mutate.

The `in` / `count` / `index` row is worth pausing on specifically: a tuple's fixed size doesn't make
membership testing any faster than a list's — both are O(n) linear scans, because neither carries
any structural hint about where a value might live. Reaching for a tuple does not, by itself, buy
hashing speed; it only buys **eligibility** for a hash-based container later — a `set` of tuples, or
a `dict` keyed by them (see [[06-hashing|Part 02, Chapter 6]]).

---

## Worked Example: Temperature Readings Across Three Regions

**Problem:** three regional sensors each report a small tuple of readings; combine them, then answer
"how many readings hit an exact value," "where's the first one," "was this value ever recorded," and
"what's the min/max/total" — five different questions over the same combined dataset.

```python
north_region: tuple[float, ...] = (21.5, 23.0)
south_region: tuple[float, ...] = (19.8, 22.1)
east_region: tuple[float, ...] = (21.5, 24.0)

all_readings = north_region + south_region + east_region   # concatenation -- a NEW tuple

for temp in all_readings:
    print(f"- Recorded {temp}°C")

target = 21.5
print("Occurrences:", all_readings.count(target))
print("First seen at index:", all_readings.index(target))
print("22.1°C recorded?", 22.1 in all_readings)

print("Max:", max(all_readings))
print("Min:", min(all_readings))
print("Total:", sum(all_readings))
```

**Complexity:** the concatenation is O(n) where n is the combined length of all three source tuples.
Every question after that — `count`, `index`, `in`, and each of `max` / `min` / `sum` — is its own
separate O(n) pass over `all_readings`: six questions here means six full traversals, not one, and a
much larger dataset would favor one explicit loop over six chained builtins.

---

## Reversing and Sorting Without Mutating

A tuple has no `.sort()` or `.reverse()` — both would require rearranging existing slots in place,
which immutability forbids by definition. Getting a reversed order means building a new sequence
instead, and there are two ways to do it with different cost profiles:

```python
steps: tuple[str, ...] = ("start", "load data", "process", "validate", "save", "end")

reversed_via_call = tuple(reversed(steps))   # reversed() -- a lazy iterator, wrapped into a tuple
reversed_via_slice = steps[::-1]             # slicing -- eagerly builds the reversed tuple directly
```

`reversed()` returns an iterator, not a tuple — nothing is actually reversed until something
consumes it, which is why wrapping it in `tuple(...)` is what pays the O(n) cost, not the call to
`reversed()` itself. Slicing with `[::-1]` has no lazy option: it builds the entire reversed tuple
immediately, whether you need one element from it or all of them.

Sorting works the same way conceptually, through a different builtin: `sorted()` always returns a
**list**, never a tuple, so getting a sorted tuple back means wrapping the result —
`tuple(sorted(t))`. There's no `t.sort()` to fall back on, for the same immutability reason
`.reverse()` doesn't exist either.

---

## Worked Example: Lazy Reversal at 100 Million Elements

**Problem:** a pipeline only needs to peek at the last few items of a very large tuple — does
building the reversed view first cost anything if the caller stops looking almost immediately?

```python
import time

huge_tuple: tuple[int, ...] = tuple(range(100_000_000))

start = time.perf_counter()
for _ in reversed(huge_tuple):
    break
lazy_elapsed = time.perf_counter() - start

start = time.perf_counter()
for _ in huge_tuple[::-1]:
    break
eager_elapsed = time.perf_counter() - start

print(f"reversed(): {lazy_elapsed:.6f}s")
print(f"slicing:    {eager_elapsed:.6f}s")
```

**Complexity:** `reversed()` is O(1) to reach the first element — it hands back an iterator that
computes "the next index back" on demand, so breaking after one iteration never touches the other
99,999,999 elements. `huge_tuple[::-1]` is O(n) no matter how quickly the loop breaks, because
slicing builds the _entire_ reversed tuple before the `for` loop sees its first element. Fully
consuming both costs the same O(n) either way — the gap only shows up when the whole sequence isn't
needed.

---

## Worked Example: Sorting Records by a Derived Key

**Problem:** a tuple of sensor records needs ordering by its second field, and a tuple of products
needs ordering by a value that isn't stored directly — price minus discount — computed fresh for
each element.

```python
records: tuple[tuple[str, int], ...] = (
    ("sensor1", 30),
    ("sensor2", 25),
    ("sensor3", 40),
)
by_reading = tuple(sorted(records, key=lambda r: r[1]))

products: tuple[tuple[str, int, int], ...] = (
    ("product_a", 120, 10),
    ("product_b", 200, 100),
    ("product_c", 150, 20),
)  # (name, price, discount)
by_final_price = tuple(sorted(products, key=lambda p: p[1] - p[2]))
```

**Complexity:** O(n log n) comparisons either way, using Timsort under `sorted()` — the same
algorithm and stability guarantee [[04-1-lists|Chapter 4, this same Part]] covers for `list.sort()`.
The `key=` lambda runs once per element up front, not once per comparison, so `products`'s "price
minus discount" is computed n times total, not n log n times — worth confirming whenever the key
function does real work instead of a cheap field lookup.

---

## Packing, Unpacking, and Multiple Return Values

A tuple doesn't need parentheses to exist — `10, 20, 30` is already a 3-tuple; the comma is what
builds it, which is also why a one-element tuple needs that trailing comma from earlier: without it,
`(42)` is just the integer 42 in redundant parentheses, not a tuple at all.

**Unpacking** reverses packing: assign a tuple straight into as many names as it has elements, one
name per position:

```python
dimensions: tuple[int, int, int] = (10, 5, 2)
length, width, height = dimensions
```

The same unpacking works directly at a function call's argument list with a `*` — spreading a
tuple's elements into positional arguments instead of indexing each one by hand:

```python
def compute_volume(length: int, width: int, height: int) -> int:
    return length * width * height

volume = compute_volume(*dimensions)   # same three values, unpacked in place
```

Returning a tuple is Python's native way to hand back more than one value from a function — there's
no separate "multi-return" syntax, just a tuple that gets unpacked on the caller's side:

```python
def min_max(numbers: list[int]) -> tuple[int, int]:
    return min(numbers), max(numbers)      # packs two values into one tuple, implicitly

low, high = min_max([1, 20, 33, 401, 5])   # unpacks the return value immediately
```

The reverse direction runs at the parameter list instead of the call site: `*args` collects any
number of positional arguments a caller passes into a single tuple inside the function, and it can
sit alongside an ordinary positional parameter as long as it comes last:

```python
def sum_numbers(*args: int) -> int:
    print(args)          # args is a tuple, e.g. (1, 2, 3)
    return sum(args)

def generate_report(title: str, *sections: str) -> None:
    print(f"=== {title} ===")
    for i, section in enumerate(sections, 1):
        print(f"{i}. {section}")

generate_report("System Health", "CPU 47%", "RAM 68%", "Disk I/O normal")
```

Every pack or unpack shown here is O(k) in the number of values involved — cheap next to whatever
the function body actually does, but not free: unpacking a million-element tuple into a million
names still costs O(n), the same honest linear cost as everything else in this chapter.

---

## Worked Example: Why Cloning a Tuple Is (Usually) a No-Op

**Problem:** the alias-vs-copy distinction [[04-1-lists|Chapter 4, this same Part]] draws for lists
applies to tuples too — but the list idiom for "make a real copy" behaves differently once you
actually check it.

```python
modules: tuple[str, ...] = ("core", "auth", "storage")
alias = modules
copied = modules[:]         # the list idiom for "make a real copy"
copied_ctor = tuple(modules)

print(modules is alias)         # True -- same object, plain name binding, unsurprising
print(modules is copied)        # True -- CPython recognizes `modules` is already a tuple
print(modules is copied_ctor)   # True -- and returns the SAME object instead of copying

import copy

settings: tuple[list[object], ...] = (["volume", 70], ["brightness", 50])
deep = copy.deepcopy(settings)
deep[0][1] = 20

print(settings)   # (['volume', 70], ['brightness', 50]) -- untouched
print(deep)        # (['volume', 20], ['brightness', 50])
```

**Complexity:** `modules[:]` and `tuple(modules)` are O(1) here — not because slicing or the
constructor are secretly fast in general, but because CPython special-cases "make a copy of an
already-immutable tuple" as a no-op: since nothing about either object can change, there's no safety
reason to allocate a second one, so it returns the original with its reference count bumped. This is
a CPython implementation detail, not a language guarantee — worth knowing, not worth depending on
across interpreters. `copy.deepcopy()` is the one operation here that pays real cost: O(n) in the
total number of objects reachable through the structure, since it has to rebuild any mutable one
from scratch — a tuple of plain numbers deep-copies to the same object too, but a tuple holding a
list forces the genuine O(n) work `settings` demonstrates above.

---

## Where Tuple Immutability Bites Back

- **Immutability is shallow, not deep.** `(["a"], 1)` is a tuple you can never reassign — but it's
  holding a list you very much can mutate. The tuple's own slots are locked; what those slots point
  to is a separate question, and the moment one of them is a list or dict, "this tuple can't change"
  stops being entirely true.
- **Hashability requires every element to be hashable, not just the tuple itself.**
  `d[(1, [2])] = "x"` raises `TypeError: unhashable type: 'list'` — the same requirement
  [[06-1-dictionaries|Chapter 6, this same Part]] states from the dict side. A tuple of atomic
  values earns its way into being a dict key or a set member ([[06-hashing|Part 02, Chapter 6]]); a
  tuple holding a mutable element never does, no matter how immutable the outer container looks.
- **A tuple buys no hashing speed by itself.** `count()`, `index()`, and `in` are all O(n) linear
  scans — a tuple's fixed size doesn't help it answer "have I seen this" any faster than a list
  does. Turning that into O(1) means putting the tuple somewhere hash-based — a `set` of tuples, or
  a `dict` keyed by them — not relying on the tuple alone.
- **"Growing" a tuple means rebuilding it entirely.** `t = t + (x,)` produces a brand-new tuple
  every time, O(n) per append, against list's amortized O(1) `.append()`. Data that changes shape on
  every loop iteration is usually a sign it wants to be a list until it's finished, then converted
  to a tuple once — not the other way around.

None of this makes a tuple the wrong choice — it makes it the right choice for a fixed-size,
fixed-shape record (a coordinate pair, an RGB triple, a function's multi-value return) and the wrong
one the moment the data needs to grow, shrink, or be checked for membership on a hot path. Compare
directly to [[04-1-lists|Chapter 4, this same Part]]: identical contiguous layout, identical O(1)
indexing, but list spends its mutability budget on in-place growth and never earns hashability in
return.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
