---
title: "7 — Sets"
description: "Python's set trades away order and duplicates for O(1) average membership and a small algebra of whole-collection operations — union, intersection, difference — that turns 'compare two collections' from a nested loop into one line."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: related
zettelId: "202607301922-16"
---

# 7 — Sets

A Python `set` is an unordered collection of distinct, hashable elements — no duplicates, no
indexing, no guaranteed iteration order, in exchange for O(1) average membership checks and a small
algebra of whole-collection operations that would otherwise take nested loops to hand-roll. This
chapter is the type's own API surface: how to build one, mutate it, compare it against another set,
and combine two sets into a third — not the hash-table mechanics that make membership checks fast in
the first place (that lives in [[06-hashing|Part 02, Chapter 6]]). Treat `set` as the tool you reach
for the moment a problem's shape is "does this exist" or "what do these two collections have in
common" rather than "in what order did these arrive" or "how many times did this occur."

---

## Creating Sets

A set literal uses curly braces with comma-separated elements — `{1, 2, 3}` — or the `set()`
constructor over any iterable. The two are **not** interchangeable at the empty case: `{}` creates
an empty `dict`, not an empty set, because curly braces were claimed by dictionaries first. An empty
set must be spelled `set()`.

Every element a set holds must be **hashable** — the same requirement covered in
[[06-hashing|Part 02, Chapter 6]] for dict keys. Immutable types (`int`, `str`, `tuple`,
`frozenset`) qualify; mutable ones (`list`, `dict`, a plain `set`) do not, because a hashable
object's hash value must never change while it's stored in a hash-based structure.

```python
my_set = {1, 2, 3, "s1", "s2"}
empty_set = set()          # NOT {} — that's a dict
string_set = set("Hello")  # {'H', 'e', 'l', 'o'} — iterates characters, dedupes
```

### Worked Example: Deduplicating a Record List

**Problem:** given a list of visitor IDs recorded with repeats (one entry per page view), return the
distinct set of visitors.

```python
def unique_visitors(visitor_id_list: list[str]) -> set[str]:
    return set(visitor_id_list)

visitor_id_list = ["user123", "user456", "user123", "user789", "user456", "user101"]
unique_visitors(visitor_id_list)
# {'user123', 'user456', 'user789', 'user101'}
```

**Complexity:** O(n) time, O(k) space, where `k` is the number of distinct elements — every element
is hashed once and inserted; duplicates collapse to the same bucket for free. This is the same
constant-work-per-element cost that makes `dict` insertion O(1) average, applied to a structure that
only cares about keys, not key-value pairs.

---

## Modifying a Set

Sets are mutable containers with their own vocabulary for adding and removing elements —
deliberately different from list's `append`/`remove` so the two aren't confused at a glance:

- **`add(x)`** — insert a single element; a no-op if `x` is already present.
- **`update(iterable)`** — insert every element of another iterable (list, tuple, or set); the
  set-level equivalent of `list.extend()`.
- **`remove(x)`** — delete `x`; raises `KeyError` if it isn't present.
- **`discard(x)`** — delete `x` if present, silently do nothing if not. Use this over `remove()`
  whenever you're not certain the element exists.
- **`pop()`** — remove and return an arbitrary element; raises `KeyError` on an empty set.
  "Arbitrary" is load-bearing — a set has no defined order, so there's no "first" element to pop.
- **`clear()`** — remove every element, leaving an empty set in place.

```python
fruits = {"apple", "banana"}
fruits.add("orange")               # {'apple', 'banana', 'orange'}

try:
    fruits.add(["pear", "grape"])  # lists are mutable -> unhashable
except TypeError as e:
    print(f"Error adding list: {e}")

tools = {"hammer", "wrench", "screwdriver"}
tools.discard("wrench")            # removed, no error
tools.discard("drill")             # not present, still no error — remove() would KeyError here
```

Adding a mutable element (a `list`) always raises `TypeError` before it ever reaches the hash table
— Python checks hashability up front. If you need a set of composite values, reach for `tuple` or
`frozenset` elements instead (covered later in this chapter).

---

## Membership and Iteration

Iterating a set with `for x in my_set` visits every element, but the order is not guaranteed and
should never be relied on for output that must be reproducible — if a problem needs sorted or
insertion-ordered output, sort explicitly or use a `list`/`dict` instead.

The property that actually matters for interview problems is membership testing: `x in my_set` is
O(1) average, against O(n) for `x in my_list`, because a set is backed by the same hash table
mechanics as `dict` — see [[06-hashing|Part 02, Chapter 6]] for how that O(1) average is achieved
and where it degrades (load factor, resizing, worst-case collisions all apply to `set` exactly as
they do to `dict`, since CPython implements them on shared machinery). The consequence for this
chapter: any time a problem says "have I seen this value before" over a growing collection,
converting that collection to a `set` up front is very often the single change that takes a solution
from O(n²) to O(n).

**Complexity:** `x in set` is O(1) average / O(n) worst case; `x in list` is always O(n) — no
average/worst split, because a list has no hash structure to degrade.

---

## Set Algebra: Union, Intersection, Difference

Sets support four whole-collection operations, each available as both a method and an infix
operator, plus an in-place `*_update()` / augmented-assignment variant that mutates the left operand
instead of returning a new set:

| Operation            | Method                      | Operator | In-place                                      |
| -------------------- | --------------------------- | -------- | --------------------------------------------- |
| Union                | `a.union(b)`                | `a \| b` | `a.update(b)` / `a \|= b`                     |
| Intersection         | `a.intersection(b)`         | `a & b`  | `a.intersection_update(b)` / `a &= b`         |
| Difference           | `a.difference(b)`           | `a - b`  | `a.difference_update(b)` / `a -= b`           |
| Symmetric difference | `a.symmetric_difference(b)` | `a ^ b`  | `a.symmetric_difference_update(b)` / `a ^= b` |

Union is every element in either set; intersection is only elements in both; difference (`a - b`) is
elements in `a` that are **not** in `b` — one-sided, so `a - b != b - a` in general; symmetric
difference is elements in exactly one of the two sets, the non-overlapping parts of each.

### Worked Example: Shared and Unique Interests

**Problem:** given two groups' declared interests, find what they have in common and what's unique
to each.

```python
group_a = {"hiking", "photography", "traveling", "cooking"}
group_b = {"traveling", "gaming", "cooking", "painting"}

group_a | group_b   # union: {'hiking', 'photography', 'traveling', 'cooking', 'gaming', 'painting'}
group_a & group_b   # intersection: {'traveling', 'cooking'}
group_a - group_b   # difference: {'hiking', 'photography'}  -- unique to A
group_b - group_a   # difference: {'gaming', 'painting'}     -- unique to B
group_a ^ group_b   # symmetric difference: {'hiking', 'photography', 'gaming', 'painting'}
```

**Complexity:** O(len(a) + len(b)) for all four operations — each implementation iterates the
smaller set and probes the larger one, so the cost is linear in the combined input size, never
quadratic.

### Worked Example: Skill-Gap Analysis (In-Place Variants)

**Problem:** narrow a candidate's skill set down to exactly what a job requires, using in-place
updates instead of building intermediate sets.

```python
my_skills = {"Python", "SQL", "HTML", "Java", "C++"}
job_required_skills = {"Python", "SQL", "AWS"}

my_skills.intersection_update(job_required_skills)
# my_skills is now {'Python', 'SQL'} — mutated in place, no new set allocated
```

Prefer the in-place form (`intersection_update`, `|=`, `-=`, `^=`) when you're accumulating into an
existing set across a loop — it avoids allocating a new set object on every iteration, mattering the
same way `list.append()` beats `list = list + [x]` in a hot loop.

---

## Subset, Superset, and Disjoint Relationships

Three predicate methods compare two sets without combining them into a third:

- **`a.issubset(b)`** (or `a <= b`) — every element of `a` is also in `b`.
- **`a.issuperset(b)`** (or `a >= b`) — `a` contains every element of `b` (and possibly more).
- **`a.isdisjoint(b)`** — `a` and `b` share no elements at all.

The `<` and `>` operators (as opposed to `<=` and `>=`) test the **proper** relationship — subset/
superset _and not equal_ — which the method forms don't distinguish on their own.

```python
ingredients_at_home = {"flour", "sugar", "eggs", "milk"}
pancake_ingredients = {"flour", "milk"}
pancake_ingredients.issubset(ingredients_at_home)   # True

allergens = {"peanuts", "gluten", "soy", "dairy"}
fruit_salad = {"apple", "banana", "grapes", "melon"}
allergens.isdisjoint(fruit_salad)                   # True — no shared elements

A, B, C = {1, 2, 3}, {1, 2}, {1, 2, 3}
B < A   # True  — proper subset (fewer elements, all contained)
C >= A  # True  — superset, improper (equal sets satisfy >=, not >)
```

**Complexity:** O(len(smaller set)) for all three — each only needs to walk the smaller operand and
check membership in the larger one, an O(1) average check per element.

---

## Frozensets: Hashable, Immutable Sets

A regular `set` is mutable, which is exactly why it can't be a dict key or an element of another set
— hashability requires that an object's hash value never change while it's stored in a hash
structure, and a mutable container can't make that promise. `frozenset` is the immutable
counterpart: same API for reading (membership, iteration, `union`/`intersection`/etc.), no mutating
methods at all — `add`, `remove`, `update`, `pop`, and `clear` are simply absent, so calling any of
them raises `AttributeError` rather than silently failing.

```python
fset = frozenset(["tomato", "banana", "cherry"])

try:
    fset.add("orange")
except AttributeError as e:
    print("Frozensets are immutable — you cannot add or remove elements.")
```

Because a `frozenset` is hashable, it can appear as a dict key or live inside another set — the two
places a regular set is rejected outright.

### Worked Example: Recipes Keyed by Ingredient Set

**Problem:** look up a recipe by its exact ingredient list, where the ingredients arrive in no
particular order.

```python
recipes: dict[frozenset[str], str] = {
    frozenset(["flour", "sugar", "eggs"]): "Cake",
    frozenset(["flour", "milk", "eggs"]): "Pancakes",
}

available = frozenset(["milk", "eggs", "flour"])  # order doesn't matter for a frozenset key
recipes.get(available)   # "Pancakes"
```

**Complexity:** O(k) to build each frozenset key (`k` = ingredient count), then O(1) average for the
dict lookup — the frozenset's hash is computed once from its elements and cached, so repeated
lookups with the same key don't re-hash from scratch.

A second common shape: a **set of frozensets**, used to test whether some collected data matches any
of a fixed group of valid combinations — for example, checking whether a set of musical notes forms
one of the seven triads in a C-major harmonization, by wrapping the played notes in `frozenset(...)`
and testing `in` against a `set[frozenset[str]]` of the valid triads. The membership test is the
same O(1) average check either way; the frozenset only exists to make an unordered group of notes
hashable.

---

## When a Set Is (and Isn't) the Right Tool

A set buys O(1) average membership and a compact whole-collection algebra by giving up three things
at once — order, duplicates, and arbitrary (mutable) element types. Reach past `set` when a problem
needs any of them back:

- **Order matters, or you need "first"/"last"/"nth" access.** A set has no index and no reliable
  iteration order to depend on. If insertion order must be preserved while still deduping, a plain
  `dict` (keys only, values ignored) does that in 3.7+ as an implementation detail of `dict`, not of
  sets — or reach for `list` plus an auxiliary "seen" set for O(1) duplicate checks with order kept
  in the list.
- **Counts matter, not just presence.** A set collapses `["a", "a", "b"]` to `{"a", "b"}` and throws
  away _how many_ times each value occurred. If frequency is part of the answer, use
  `collections.Counter` instead of building a set and losing that information.
- **Elements are naturally mutable (lists, dicts).** A set element must be hashable; wrap a list as
  a `tuple` or a group of values as a `frozenset` before storing it, rather than fighting the
  `TypeError`.
- **You need the fastest possible in over a fixed, unchanging universe of keys with a hard memory
  ceiling.** An ordinary set's memory grows with the number of elements stored; when the
  exact-answer guarantee can be relaxed for a small, tunable false-positive rate in return for
  constant memory regardless of scale, that's the trade a Bloom filter makes instead of a hash set.

The pattern underneath all four: `set` answers "is this here" and "what do these collections share"
as fast as anything short of a perfect hash — the moment a problem also cares about _sequence_,
_multiplicity_, or _element mutability_, that's the signal to reach past a plain set.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
