---
title: "17 — Comprehensions"
description: "How a comprehension collapses a loop-and-append into a single expression, the exact point — nesting depth, side effects, an unreadable one-liner — where that collapse stops paying off, and the memory trade a generator expression makes to never build the whole collection at all."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/00-python-language-foundations/04-lists/04-1-lists
    kind: related
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
zettelId: "202607301922-9"
---

# 17 — Comprehensions

A list comprehension and a `for` loop that appends can produce the identical list — the only
difference is that the comprehension describes the result instead of narrating the steps that build
it. That shift, from imperative loop to declarative expression, is worth exactly as much as it costs
to read: cheap and clear for `[x ** 2 for x in nums]`, actively harmful past two levels of nesting
or the first condition that doesn't fit on one line. This chapter covers every comprehension form
Python has — list, nested, dict, set, and generator expression — the walrus operator's one
legitimate job inside them, and the trade-off that matters most in an interview: a list
comprehension builds the whole collection in memory before you can touch the first element; a
generator expression builds nothing until you ask for the next value.

---

## Comprehensions Are Expressions, Not Loops

Every comprehension follows the same shape: `[expression for item in iterable if condition]` for a
list, with the brackets swapped for `{}` (dict or set) or `()` (generator expression) depending on
what should come out the other end. It's mechanically identical to the loop it replaces:

```python
evens = [x for x in range(10) if x % 2 == 0]

# the exact same result, written as a loop:
result: list[int] = []
for x in range(10):
    if x % 2 == 0:
        result.append(x)
```

Two things about a comprehension aren't obvious from that equivalence. First, it runs in its own
scope: in Python 3, the loop variable inside a comprehension never leaks into the surrounding
function — `[i for i in range(5)]` leaves no `i` behind afterward, unlike a bare
`for i in range(5): pass`, which does. Second, any speed difference between the two forms isn't
magic: CPython compiles a comprehension into its own small code object using a dedicated
`LIST_APPEND` (or `SET_ADD`, `MAP_ADD`) bytecode instruction, which skips the repeated
`result.append` attribute lookup the loop form pays on every iteration. That's a real
constant-factor win — never a change in Big-O. A comprehension over n items is exactly as O(n) as
the loop it replaces; it is never doing algorithmically different work, only denser work.

---

## Worked Example: Filtering and Transforming Together

**Problem:** keep only the words longer than four characters, upper-cased.

```python
words = ["hello", "world", "python", "code"]
long_upper = [w.upper() for w in words if len(w) > 4]
print(long_upper)   # ['HELLO', 'WORLD', 'PYTHON']
```

**Complexity:** O(n) time — one pass over `words`, ignoring the O(k) cost of each `.upper()` call on
a word of length k — and O(n) space for the new list, identical to the loop-plus-`append()` version.
The comprehension buys readability and one fewer mutable variable to track, not a better bound;
equal complexity between a comprehension and the loop it replaces is the normal case, not an
exception worth double-checking each time.

---

## Nested Comprehensions and the Readability Cliff

A comprehension can flatten a list of lists by using two `for` clauses instead of one:

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [cell for row in matrix for cell in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

The `for` clauses read left to right in the same order they'd appear as nested loops — outer loop
first:

```python
flat = []
for row in matrix:
    for cell in row:
        flat.append(cell)
```

Transposing a matrix pushes one level further — a comprehension whose _expression_ is itself a full
comprehension:

```python
transposed = [[row[i] for row in matrix] for i in range(len(matrix[0]))]
```

Two genuine levels of nesting: an outer comprehension building each output row, an inner one reading
down a column of the original matrix to fill it. This is the practical ceiling. Two levels stay
legible because each one still maps 1:1 onto a nested-loop level a reader can mentally unwind. A
third level, or a second `for` clause paired with a second `if`, is where that mapping breaks down —
there's no longer anywhere to comment or name an intermediate value:

```python
pairs = [(x, y) for x in range(4) for y in range(4) if x != y and x + y == 3]
# [(0, 3), (1, 2), (2, 1), (3, 0)]
```

Two independent loop variables and a two-term compound condition already fight for space on one
line. The rule of thumb worth keeping as a hard line: at most two `for` clauses, at most one `if`
clause. The moment a second condition or a third loop seems necessary, a nested `for` block — or a
small named helper function — reads better, because it gives every intermediate step a place a
debugger can actually stop on.

---

## Worked Example: Transposing a Matrix

```python
def transpose(matrix: list[list[int]]) -> list[list[int]]:
    return [[row[i] for row in matrix] for i in range(len(matrix[0]))]

matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
print(transpose(matrix))
# [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
```

**Complexity:** O(n·m) time and O(n·m) space for an n×m matrix — every cell is read once and written
once into the new structure, identical to a nested-loop version built with manual
`result[i].append(...)` calls. The comprehension form removes that bookkeeping; it doesn't change
either bound.

---

## Dict and Set Comprehensions

The same `for`/`if` machinery builds a dict (`{key_expr: value_expr for item in iterable}`) or a set
(`{expression for item in iterable}`) instead of a list — only the container at the end differs:

```python
squares = {x: x ** 2 for x in range(1, 6)}
# {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

unique_lengths = {len(w) for w in ["hello", "world", "hello", "python"]}
# {5, 6}
```

A set comprehension used purely to deduplicate a collection with no transform applied
(`{x for x in data}`) is functionally identical to `set(data)`, but `set(data)` skips evaluating a
redundant per-element expression and says "just deduplicate this" directly. Reach for the
comprehension form when there's an actual expression being applied on the way in —
`{len(w) for w in words}` extracts unique lengths, which `set(words)` cannot do — not merely to
strip duplicates from data that's already sitting in a list.

---

## Worked Example: Inverting a Dict, and the Collision It Hides

```python
original = {"a": 1, "b": 2, "c": 3}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b', 3: 'c'}

scores = {"Alice": 88, "Bob": 62, "Carol": 95, "Dan": 55}
passed = {name: score for name, score in scores.items() if score >= 70}
# {'Alice': 88, 'Carol': 95}
```

**Complexity:** O(n) time and O(n) space for either — one pass over the source dict's items, one
insert per item.

The inversion has a correctness trap the complexity line doesn't show: it only round-trips cleanly
when the original values are unique. Two keys mapping to the same value collide on insert, and
whichever one iterates last silently wins — no error, no warning. This is the same failure mode
[[02-1-built-in-functions|Chapter 2]] flags for `{v: i for i, v in enumerate(nums)}` used as a
value-to-index map: a check-then-insert loop, like the Two Sum walkthrough in
[[06-hashing|Part 02, Chapter 6]], processes one element at a time specifically so a value can never
accidentally overwrite another. A comprehension is faster to write and has no way to notice the same
collision — worth a second look any time the values being collected into keys aren't already known
to be unique.

---

## Generator Expressions: The Memory Trade-off in Full

`(expression for item in iterable if condition)` — a **generator expression** — looks like a list
comprehension with parentheses instead of brackets, and uses identical `for`/`if` syntax. What comes
back is different: this doesn't build anything. It returns a generator object immediately, in O(1)
time, and does no work at all until something asks it for a value:

```python
gen = (x ** 2 for x in range(1, 6))
print(type(gen))    # <class 'generator'>
print(next(gen))     # 1
print(next(gen))     # 4
print(list(gen))      # [9, 16, 25] -- exhausted after this
```

The memory argument is the entire reason this form exists. A list comprehension has to allocate
storage for every element before you can touch the first one — O(n) space in the final length, the
same auxiliary-space accounting [[02-asymptotic-analysis|Part 01, Chapter 2]] uses for any structure
that holds every input element at once. A generator holds only its current position and local state
— O(1) space regardless of whether it will eventually produce five values or five billion. This is
the exact argument [[18-1-generators|Chapter 18]] makes at length for `yield`-based generator
functions; a generator expression is the same underlying object type, built from comprehension
syntax instead of a `def` and a `yield`, so every memory and exhaustion fact there applies here
unchanged.

The cost of that O(1) memory is that a generator is single-use. Once fully consumed — by a `for`
loop, `list()`, `sum()`, or any other full pass — it has nothing left to give; a second `list(gen)`
on an already-exhausted generator returns `[]`, not the original values again. A list, by contrast,
can be indexed, sliced, `len()`'d, and iterated as many times as needed, because it's a persistent,
materialized object rather than a recipe for producing one on demand.

That trade is what decides which form to reach for: a generator expression when the data is walked
exactly once and fed straight into a consuming function — `sum(x ** 2 for x in range(1, 1001))`
needs no extra parentheses when it's the sole argument to a call — and a list comprehension the
moment the result needs a second pass, random access, a known length up front, or is itself the
value handed back to a caller who will do any of those things. Reaching for a generator "to save
memory" when the caller immediately wraps it in `list()` anyway buys nothing; it just defers the
same O(n) allocation by one line.

`all()` and `any()` add a second reason to prefer a generator beyond memory: both short-circuit,
stopping consumption the instant the answer is known rather than running to completion — a real
saving when the per-element expression is expensive and the answer is usually decided early.

---

## Worked Example: Measuring the Memory Difference

```python
import sys

big_list = [x for x in range(100_000)]
big_gen  = (x for x in range(100_000))

print(f"{sys.getsizeof(big_list):,} bytes")   # ~800,984 bytes -- scales with length
print(f"{sys.getsizeof(big_gen):,} bytes")    # ~200 bytes -- constant, independent of length

nums = [2, 4, 6, 8, 11]
print(all(x % 2 == 0 for x in nums))   # False -- stops at 11, never checks past it
print(any(x > 10 for x in nums))        # True -- stops at 11
```

**Complexity:** O(n) time either way to build and fully consume n items — a generator doesn't make
the iteration itself faster. The difference is purely spatial: O(n) space for `big_list`'s backing
array of n references, O(1) space for `big_gen`, whose reported size stays flat whether the range is
a hundred thousand or a hundred million. Both `all()`/`any()` calls above touch only the first five
elements of `nums` — a separate, complementary saving from short-circuiting, layered on top of the
space difference.

---

## The Walrus Operator: Computing a Filtered Value Once

`:=` — added in Python 3.8 — assigns to a name and produces that same value as the expression's
result, in one step. Inside a comprehension's `if` clause, that lets a filter condition and the
value actually kept share one computation instead of paying for it twice:

```python
import math

nums = [1, 4, 9, 16, 25, -1, 36]

# without walrus: math.sqrt(x) runs once to filter, again to build the output
roots_recomputed = [math.sqrt(x) for x in nums if x >= 0]

# with walrus: computed once, bound to root, reused directly in the expression
roots = [root for x in nums if x >= 0 and (root := math.sqrt(x)) < 7]
# [1.0, 2.0, 3.0, 4.0]
```

Worth flagging as the one real exception to the comprehension-has-its-own-scope rule from earlier: a
`for` target is local to the comprehension, but a name bound by `:=` inside one deliberately is not
— PEP 572 has it leak into the nearest enclosing function scope instead, on the reasoning that a
`:=` target is usually being computed _because_ something outside the comprehension needs it too.
Reusing a name that already means something else in the enclosing scope will silently overwrite it
the moment the comprehension runs.

---

## Worked Example: Filtering on an Expensive Computed Value

```python
def try_int(s: str) -> int | None:
    try:
        return int(s)
    except ValueError:
        return None

data = ["42", "bad", "7", "x", "100"]
parsed = [n for s in data if (n := try_int(s)) is not None]
# [42, 7, 100]
```

**Complexity:** O(n) time, O(k) space where k is the number of surviving elements — `try_int` runs
exactly once per input string either way. The walrus removes a second, redundant call; it doesn't
change how many times the expensive part runs versus a two-step check-then-parse equivalent. The
saving scales with how expensive the shared computation is: for a cheap predicate like `x >= 0`, the
walrus is a style choice; for a network call, a regex match, or a full parse like this one, skipping
the second call is a real, measurable win.

---

## When a Comprehension Is the Wrong Tool

A comprehension's entire contract is "build a collection from an expression" — stretch it past that
contract and the same three failure modes show up reliably:

- **Side effects with a discarded result.** `[print(x) for x in items]` or
  `[cache.update(k, v) for k, v in pairs]` runs for what happens during each iteration, not what
  comes back — building and immediately throwing away an entire list of `None`s just to get a loop.
  A plain `for` loop with no accumulator says "this only has side effects" honestly, and skips the
  wasted O(n) list.
- **Nesting or condition count past the readability line.** Two `for` clauses is the practical
  ceiling established above; three, or a second `if`, or an `if/else` in the expression stacked on
  top of a filtering `if`, reads like code golf rather than syntax. Unrolling it into a real nested
  loop — or a small named helper function — costs a few lines and buys back the ability to comment,
  name an intermediate value, or set a breakpoint on any one step.
- **Needing to stop early.** A comprehension always runs to the end of its iterable — there is no
  `break`. A search that should stop at the first match belongs in a loop, or in `next()` over a
  generator expression, not in a comprehension that keeps scanning after the answer is already
  found.

The generator-versus-list half of this chapter reduces to one question, worth asking every time a
comprehension is about to be written: is this collection consumed once and then discarded, or does
it need `len()`, indexing, sorting, or more than one pass? The first case is a generator
expression's entire job; the second is exactly what a list comprehension is for. Getting that one
question right up front avoids both the wasted O(n) list an unnecessary comprehension builds and the
wasted second pass an over-eager generator forces later on.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
