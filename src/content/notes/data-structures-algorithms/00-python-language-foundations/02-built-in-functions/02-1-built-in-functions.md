---
title: "2 — Built-in Functions"
description: "Which built-ins earn a place as pure reflex — sorted with key=, enumerate, zip — versus the situational-but-decisive ones like ord/chr and modular pow, and why an interviewer can tell the difference from across the table."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: related
zettelId: "202607301922-11"
---

# 2 — Built-in Functions

Every DSA solution leans on the same small set of Python built-ins, and they split cleanly into two
tiers. The first — `sorted()` with a `key=`, `enumerate()`, `zip()` — appears in nearly every
non-trivial solution, often more than once, and needs to be reflexive: burning thirty seconds
re-deriving `enumerate` syntax mid-interview reads as a knowledge gap, not a thinking pause. The
second tier — `map()`/`filter()`, the type-conversion constructors, `ord()`/`chr()`, `divmod()`/
`pow()` with a modulus — is situational: most solutions never touch them, but the ones that do
(character arithmetic, modular exponentiation, input parsing) get visibly shorter and cleaner in the
hands of someone who reaches for them instead of hand-rolling the equivalent. This chapter draws
that line explicitly, tier by tier.

---

## sorted() and .sort() — the key= Reflex

`sorted(iterable, key=None, reverse=False)` returns a **new** list; the original is untouched.
`list.sort()` does the opposite on every axis that matters: it mutates in place and returns `None`.
Confusing the two is a real bug, not a style nit — pass a list into a helper function, call
`.sort()` on it expecting a fresh copy, and the caller's list is now silently reordered underneath
them.

The argument that does all the work is `key=` — a function applied to each element to derive the
value it's sorted _by_, not the value itself. `sorted(arr, key=abs)` orders by magnitude while
leaving the original signs alone; `sorted(words, key=len)` orders strings by length instead of
alphabetically; `sorted(pairs, key=lambda p: p[1])` orders tuples by their second field.
`reverse=True` flips the order without writing a custom comparator. Once `key=` is fluent, "sort by
some derived property" stops being a special case and becomes the default way anything gets sorted.

**Complexity:** both `sorted()` and `list.sort()` are O(n log n), backed by Timsort — the built-in
every algorithm in [[03-sorting-fundamentals]] gets measured against, and the O(n log n) floor
itself is the comparison-sort lower bound covered in [[02-asymptotic-analysis]]. The `key` function
is called exactly once per element, not once per comparison, so a moderately expensive key (like a
squared distance) doesn't turn an O(n log n) sort into something quadratic.

---

## Worked Example: Sorting Points by Distance from Origin

**Problem:** given a list of 2D points, return them ordered by distance from the origin — the setup
step behind most "k closest points" variants.

```python
def sort_by_distance(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
    return sorted(points, key=lambda p: p[0] ** 2 + p[1] ** 2)
```

**Complexity:** O(n log n) time for the sort, O(n) space for the returned list; each key evaluation
is O(1).

The key deliberately skips the square root — squared distance sorts into the same order as true
distance because square root is monotonic on non-negative numbers, so dropping it is a free
optimization, not an approximation. That's the general shape of a good `key=`: the cheapest
computation that still preserves the order you actually need.

---

## Aggregate Reflexes: min, max, sum, len, any, all

These collapse an iterable to a single value in one O(n) pass, and they're usually the first thing
worth trying before writing a manual loop. `min()`/`max()` take either an iterable or two-or-more
positional arguments — `min(a, b)` inside a DP recurrence is a different call shape from `min(arr)`,
and both are common enough to recognize instantly. Both also accept `key=`, exactly like `sorted()`:
`min(words, key=len)` finds the shortest word in one pass instead of sorting the whole list to read
off the first element.

`sum()` takes an optional start value (`sum(nums, 0)`), which matters once you're summing anything
that isn't a plain number. `any()` and `all()` short-circuit — `any()` stops at the first truthy
element, `all()` stops at the first falsy one — so checking a condition across a collection with
`all(x > 0 for x in arr)` is often cheaper than it looks, because it doesn't have to visit every
element to fail fast. `len()` is O(1) in CPython for `list`, `dict`, `set`, and `str` — it's a
stored field, not a count computed on demand — worth knowing precisely, because assuming `len()` is
O(n) is a sign of the wrong mental model for how these containers work. `math.prod()` (3.8+) is the
same idea as `sum()` for products — unglamorous, but it replaces a manual `reduce`-style loop in
combinatorics problems.

---

## enumerate() and zip() — Pairing and Indexing Without Bookkeeping

`enumerate(iterable, start=0)` yields `(index, value)` pairs lazily, replacing the manual
`i = 0; for x in arr: ...; i += 1` pattern outright — and `start=` handles 1-indexed output without
an extra `+1` scattered through the loop body. `zip(*iterables)` yields tuples of the i-th element
from each argument, which is the reflex for "walk two sequences together" instead of indexing both
with a shared counter. `zip(*matrix)` transposing a matrix in one call is the idiomatic version of
that same trick.

The one gotcha worth flagging up front: `zip()` truncates silently to the length of the _shortest_
iterable — no exception, no warning. A length mismatch turns into quietly missing data at the end of
the longer input, not a crash anywhere near the actual bug. `reversed()` and `range()` are close
relatives in the same "iteration helper" family: `reversed()` needs `list()` to materialize into
something indexable, and a string doesn't need `reversed()` at all — `s[::-1]` reverses it via
slicing directly.

`enumerate()` pairs naturally with a `dict` — `{v: i for i, v in enumerate(nums)}` builds a
value-to-index map in one comprehension. That's a genuinely different tool from the
check-then-insert loop in the Two Sum walkthrough in [[06-hashing]], which processes one element at
a time specifically so a value can't accidentally pair with itself; the comprehension form is faster
to write but throws that safety away — with duplicate values, the last index silently wins, and the
comprehension has no way to notice.

---

## Worked Example: Is the Array Strictly Increasing

**Problem:** given an array, determine whether every element is strictly greater than the one before
it.

```python
def is_strictly_increasing(arr: list[int]) -> bool:
    return all(a < b for a, b in zip(arr, arr[1:]))
```

**Complexity:** O(n) time, O(1) extra space — `zip(arr, arr[1:])` produces a lazy iterator of
consecutive pairs rather than a second full copy of the array, and `all()`'s short-circuiting means
the scan stops at the first out-of-order pair instead of always running to the end.

This `zip(arr, arr[1:])` consecutive-pair idiom generalizes well beyond this one check: consecutive
differences, gap detection, "any two adjacent duplicates" — one pattern covering several problem
statements that read as unrelated on the surface.

---

## map(), filter(), and Why Comprehensions Usually Win

`map(fn, iterable)` applies `fn` to every element; `filter(fn, iterable)` keeps only the elements
where `fn` is truthy. Both return lazy iterators — printing one directly shows a
`<map object at 0x...>`, not values, until it's wrapped in `list()` or otherwise consumed. In modern
Python, the comprehension equivalent is preferred for both: `[x ** 2 for x in arr]` over
`list(map(lambda x: x ** 2, arr))` skips the extra lambda, reads left-to-right, and returns a list
directly.

They haven't disappeared, though — competitive-style input parsing is the one place `map()` still
wins outright: `list(map(int, line.split()))` is the standard one-liner for turning a line of
space-separated numbers into a list of `int`, and it's shorter than the comprehension equivalent for
that specific shape. `map()` also runs over multiple iterables in lockstep —
`map(lambda x, y: x + y, a, b)` — mirroring `zip()`'s pairing but with the transform inlined. Expect
to still see both in older or golfed code; recognizing them at a glance matters even when you'd
write a comprehension yourself.

---

## Type Conversion Constructors

`int()`, `float()`, `str()`, `bool()`, `list()`, `tuple()`, `set()`, and `dict()` are all callable
type constructors doubling as converters, and each has a sharp edge worth knowing in advance.
`int(3.9)` truncates _toward zero_ rather than rounding — `int(-3.9)` is `-3`, not `-4` — a classic
off-by-one source when converting a computed float into an index. `int(s, base)` parses non-base-10
strings directly (`int('ff', 16) == 255`, `int('1010', 2) == 10`), which is the fast path for
hex/binary parsing instead of writing an accumulator loop by hand.

`bool()` follows Python's truthiness rules: `0`, `''`, `[]`, `{}`, and `None` are all falsy;
anything non-empty or non-zero is truthy. The trap is `bool([0])` being `True` — a non-empty list is
truthy regardless of what it contains, which trips up anyone expecting `bool()` to inspect the
values inside a container rather than just whether it's empty. Converting between collection types
is less about arithmetic and more about picking the right guarantee for what comes next: `set()` for
dedup and O(1) membership, `tuple()` when something needs to be hashable (lists can't be dict keys;
tuples can), `dict()` from a list of pairs when the calling code already produced `(key, value)`
tuples.

---

## ord(), chr(), and Character Arithmetic

`ord(c)` returns a character's code point as an `int`; `chr(i)` is the inverse. Individually
trivial, but paired together they turn "the alphabet" into a small integer range, which is the real
payoff: `ord(c) - ord('a')` maps any lowercase letter to `0`–`25`, cheap enough to use directly as
an array index. That replaces a 26-branch `if`/`elif` chain — or a `dict` keyed by letter — with a
plain fixed-size list: same O(1) access, a smaller constant, no hashing overhead. This is the exact
trick behind the count array in [[08-string-algorithms]].

`chr(ord(c) + k)` implements a shift directly — a Caesar cipher, or "next letter" — and wrapping
with `% 26` before adding back `ord('a')` handles the `z → a` wraparound in one line instead of a
conditional. This whole pairing is situational: most problems don't need character-to-integer
arithmetic at all. But the moment a problem says "lowercase letters only," or asks for a letter's
position in the alphabet, `ord()`/`chr()` is the one-liner — reaching for a `dict` instead costs
both memory and a beat of thinking time you didn't need to spend.

Two close relatives worth knowing exist even though they're rarer still: `divmod(a, b)` returns
`(a // b, a % b)` in one call instead of two, and `pow(base, exp, mod)` computes modular
exponentiation directly — the three-argument form is a different algorithm internally (repeated
squaring under a modulus), not just a convenience wrapper, and it's the only practical way to
compute something like `pow(2, 10_000_000, 1_000_000_007)` without overflowing memory on the
intermediate value.

---

## Worked Example: Anagram Grouping via a Character-Count Key

**Problem:** the same Group Anagrams problem worked in [[06-hashing]] using a sorted-string
canonical key — reworked here with a character-count key built from `ord()`, to make the trade-off
between the two keys concrete.

```python
from collections import defaultdict

def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: dict[tuple[int, ...], list[str]] = defaultdict(list)
    for s in strs:
        counts = [0] * 26
        for ch in s:
            counts[ord(ch) - ord("a")] += 1
        groups[tuple(counts)].append(s)
    return list(groups.values())
```

**Complexity:** O(n · k) time and space, where `k` is the max string length — building each string's
count tuple is a single O(k) pass, versus O(k log k) for sorting the string into a canonical key.

That asymptotic win doesn't automatically mean this version is faster in practice: a 26-length tuple
takes longer to hash and compare, element by element, than a short string does as a single unit, so
for the short strings most anagram problems actually use, the sorted-string key from [[06-hashing]]
often wins despite the worse Big-O. O(k) beating O(k log k) is a claim about growth rate as `k` gets
large — not a guarantee for every `k` you'll actually see in an interview-sized input.

---

## Reflexive vs. Situational — and Where Each One Bites

The tiering this chapter has been building toward, made explicit:

- **Reflexive** — practice these until they're keystrokes, not lookups: `sorted(..., key=...)`,
  `enumerate()`, `zip()`. They show up inside almost every array, string, or interval solution in
  this book, often nested two deep (`sorted(enumerate(arr), key=...)` is a completely ordinary line
  of interview code).
- **Situational** — know they exist, and reach for them the instant the problem's shape matches:
  `map()`/`filter()` for one-line input parsing, `ord()`/`chr()` for character arithmetic,
  `divmod()`/`pow(base, exp, mod)` for modular arithmetic, the type constructors for explicit,
  deliberate conversions between representations.

The pitfalls cluster around exactly the same line:

- `list.sort()` returns `None` — `arr = arr.sort()` silently throws the list away, a fresh bug every
  time someone assumes it behaves like `sorted()`.
- `zip()` truncates to the shortest iterable with no error at all, turning a length mismatch into
  quietly missing data instead of a crash near the actual bug.
- `int(x)` truncates toward zero; it is not `round()`, and the two disagree on every negative,
  non-integer input.
- `map()` and `filter()` return iterators, not lists — forgetting to wrap one in `list()` surfaces
  as an object repr instead of the values, or as an iterator that's already been silently exhausted
  by an earlier pass over it.

None of these are exotic gotchas — they're the direct cost of a built-in doing exactly what it's
documented to do, applied without checking which tier it belongs to. Reflexive fluency is what keeps
the first tier from being where you lose time; knowing the second tier exists is what keeps a
character-arithmetic or modular-exponentiation problem from turning into fifteen minutes of
reinventing a one-liner.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
