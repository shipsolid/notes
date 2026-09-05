---
title: "18 — Generators"
description: "How yield turns a function into a resumable object that produces one value at a time instead of building the whole sequence up front, why that swap is O(1) auxiliary memory instead of O(n), and the narrow set of situations — large or infinite sequences, streaming pipelines — where that actually matters."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607301922-10"
---

# 18 — Generators

A list comprehension or an explicit `list.append()` loop has to finish building the entire sequence
before you can use any of it — every element sits in memory at once, whether you need the first one
or all million. A **generator function** breaks that assumption: call it, and none of its body runs
yet; ask it for a value, and it runs just far enough to produce exactly one, then freezes in place —
local variables, position in the loop, everything — until you ask again. The memory a generator
occupies is a small constant, the same whether it will eventually produce ten values or ten billion,
because it never holds more than "where I am right now." That's the entire interview payoff of this
chapter: O(1) auxiliary space instead of O(n), and it matters exactly when a sequence is large,
unbounded, or the middle stage of a pipeline where most of it will never be read at all.

---

## Generators Are Iterators You Get for Free

Every `for` loop in Python runs on the **iterator protocol**: `iter(obj)` returns an iterator, and
`next(iterator)` advances it one step, raising `StopIteration` when there's nothing left. Building
an iterator by hand means writing a class that tracks its own position across calls:

```python
class CountUp:
    def __init__(self, start: int, stop: int) -> None:
        self.current = start
        self.stop = stop

    def __iter__(self) -> "CountUp":
        return self

    def __next__(self) -> int:
        if self.current > self.stop:
            raise StopIteration
        value = self.current
        self.current += 1
        return value
```

A **generator function** — any function containing `yield` — produces an object that implements this
same protocol automatically. Calling it doesn't run the body; it returns a generator object that
remembers exactly where execution paused, and each `next()` call resumes the body from that point
until the next `yield` or the function returns (which raises `StopIteration` for you, implicitly).

**Worked Example: Iterator Class vs. Generator Function**

```python
from collections.abc import Iterator

def count_up(start: int, stop: int) -> Iterator[int]:
    current = start
    while current <= stop:
        yield current
        current += 1

print(list(count_up(3, 7)))   # [3, 4, 5, 6, 7] — same result as CountUp(3, 7)
```

**Complexity:** identical O(1) auxiliary space either way — a handful of local variables versus a
handful of instance attributes. The generator function doesn't change what gets stored; it changes
who writes the bookkeeping. `__iter__`, `__next__`, and the `StopIteration` dance disappear, and
Python's frame-suspension machinery does that job instead.

---

## `yield`: Suspend, Emit, Resume

A function with one or more `yield` statements is a generator function no matter how many `yield`s
it has or where they sit in the control flow:

```python
def multi_yield() -> Iterator[str]:
    yield "first"
    yield "second"
    yield "third"

print(list(multi_yield()))   # ['first', 'second', 'third']
```

Each call to `next()` runs the body forward to the next `yield`, hands back that value, and suspends
— the whole call stack of local state stays alive in the generator object, not on the interpreter's
active call stack, which is what makes resuming cheap and exact.

**Worked Example: Materializing vs. Streaming a Range**

```python
import sys

def gen_range(n: int) -> Iterator[int]:
    for i in range(n):
        yield i

N = 100_000
as_list = list(range(N))
as_gen = gen_range(N)

print(sys.getsizeof(as_list))   # ~800,056 bytes — scales with N
print(sys.getsizeof(as_gen))    # ~208 bytes — constant, independent of N
```

**Complexity:** O(n) space for the list — its backing array holds a reference per element, so size
grows linearly with `N`. O(1) space for the generator — `sys.getsizeof` reports the same small,
constant size (a couple hundred bytes on CPython) whether `N` is a hundred or a hundred million,
because a suspended generator stores only its frame — local variables and instruction pointer — not
the values it hasn't produced yet. Both compute the same `sum()` in the end; only one of them pays
for storing every value simultaneously to do it.

One consequence worth flagging early, expanded on in the closing section: `as_gen` above can be
iterated exactly once. Call `list(as_gen)` and it produces every value as expected — but call
`list(as_gen)` again right after and it returns `[]`, because the generator has no values left to
replay, unlike `as_list`, which can be read from as many times as you like.

---

## Infinite Sequences and `itertools.islice`

Because a generator only computes a value when asked, it can represent a sequence with no defined
end — something a list fundamentally cannot do, since building one requires knowing when to stop:

```python
def naturals(start: int = 0) -> Iterator[int]:
    n = start
    while True:
        yield n
        n += 1
```

Never call `list()` or hand this directly to a `for` loop with no `break` — both try to exhaust
something that never exhausts. The idiomatic way to pull a bounded number of values out of an
unbounded generator is `itertools.islice`, which itself returns a generator that stops after `n`
items instead of forcing the whole thing into memory first.

**Worked Example: Fibonacci via `islice`**

```python
import itertools

def fibonacci() -> Iterator[int]:
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fibs = list(itertools.islice(fibonacci(), 10))
print(fibs)   # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

**Complexity:** O(k) time and O(1) auxiliary space to produce the first `k` terms of a sequence with
no upper bound, `k` here being 10 — a genuinely infinite generator, not a large-but-finite one.
There is no list-based equivalent: any attempt to materialize `fibonacci()` up front never returns.

---

## `yield from`: Delegating to a Sub-Generator

`yield from iterable` forwards every value the iterable produces, one at a time, as if the enclosing
generator had yielded each one itself — shorthand for `for item in iterable: yield item`, plus (not
covered further here) forwarding of `send()` and `throw()` calls through the delegation chain:

```python
def chain(*iterables) -> Iterator:
    for it in iterables:
        yield from it

print(list(chain([1, 2], [3, 4], [5])))   # [1, 2, 3, 4, 5]
```

The recursive case is where `yield from` earns its keep — flattening an arbitrarily nested structure
without building an intermediate result at each level of nesting:

**Worked Example: Flattening Nested Lists Lazily**

```python
def flatten(nested: list) -> Iterator:
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item

data = [1, [2, [3, 4], 5], [6, 7]]
print(list(flatten(data)))   # [1, 2, 3, 4, 5, 6, 7]
```

**Complexity:** O(d) auxiliary space for maximum nesting depth `d` — one suspended generator frame
per level of `yield from` delegation, live at once, exactly the frame-per-call accounting from
[[03-recursion|Part 01, Chapter 3]] — plus O(1) additional space per item actually yielded. A
non-generator `flatten` that returns a fully-built list instead pays that same O(d) call-stack cost
_and_ an additional O(n) for the materialized output; the generator version only pays for the part
recursion was already spending.

---

## Generators as Pipelines: Composing Without Materializing

Chaining several generator functions costs nothing until something finally consumes the last one —
building the pipeline is just wiring generator objects together, not running any of them:

```python
def read_numbers(n: int) -> Iterator[int]:
    for i in range(n):
        yield i

def filter_even(numbers: Iterator[int]) -> Iterator[int]:
    for n in numbers:
        if n % 2 == 0:
            yield n

def square(numbers: Iterator[int]) -> Iterator[int]:
    for n in numbers:
        yield n ** 2

def take(n: int, gen: Iterator[int]) -> Iterator[int]:
    for _ in range(n):
        yield next(gen)
```

**Worked Example: Lazy Pipeline over a Million-Item Source**

```python
source  = read_numbers(1_000_000)
evens   = filter_even(source)
squared = square(evens)
first_5 = take(5, squared)

print(list(first_5))   # [0, 4, 16, 36, 64]
```

**Complexity:** O(k) time, where `k` is the number of values actually pulled through the chain to
satisfy the final consumer — here, only 9 numbers are ever read from a source of 1,000,000 to
produce the first five even squares, because `take` stops asking as soon as it has 5 results and
nothing upstream runs ahead of that demand. Space is O(1) at every stage regardless of source size:
each generator holds one item's worth of state, never the full 1,000,000-element sequence. Rewrite
any stage to `return` a list instead of `yield`ing, and both numbers change — time becomes O(n)
(every stage must fully run before the next can start) and space becomes O(n) (each intermediate
list is fully materialized) — which is the whole argument for lazy pipelines over intermediate lists
when a source is large and only a prefix of the output is actually needed.

---

## Generator Expressions, Briefly

`(x for x in iterable)` — a **generator expression** — produces the exact same kind of generator
object as a `yield`-based function, built from comprehension syntax instead of a `def`. The syntax
itself, and its relationship to list/set/dict comprehensions, belongs to
[[17-1-comprehensions|Chapter 17]] and isn't re-derived here; the one thing worth restating is that
everything in this chapter about single-pass exhaustion and O(1) memory applies identically to a
generator expression — `squares = (x ** 2 for x in range(5))` is exhausted after one `list(squares)`
exactly like a `yield`-based generator is, because both are the same underlying object type.

---

## Two-Way Communication: `send()`

A generator can also receive values, not just produce them. `value = yield total` both yields
`total` out and, on the next `gen.send(x)` call, binds `x` to `value` and resumes:

```python
def accumulator() -> Iterator[int]:
    total = 0
    while True:
        value = yield total
        if value is None:
            break
        total += value

gen = accumulator()
next(gen)             # prime: advance to the first yield, discard the 0 it returns
print(gen.send(10))   # 10
print(gen.send(20))   # 30
```

The generator must be **primed** with a `next()` (or `gen.send(None)`) before the first real
`send()` — there's no `yield` waiting to receive a value until execution reaches one. This
coroutine-style pattern shows up in older codebases and in `yield from`-based delegation chains, but
it's rare in interview settings and has been largely superseded by `async`/`await` for real
concurrent code — worth recognizing on sight, not worth over-investing in for interview prep.

---

## When a Generator Is the Wrong Tool

A generator trades memory for a set of capabilities a list has and a generator doesn't:

- **Single consumption.** Once exhausted, a generator has nothing left to give — no rewinding, no
  second pass. A function that needs to iterate the same data twice either has to call the generator
  function again from scratch, cache the values into a list itself (at which point the memory saving
  is gone), or reach for `itertools.tee` to fork one generator into several independently-consumable
  ones.
- **No `len()`, no indexing, no slicing.** A generator doesn't know how many values remain — some
  don't know until they stop — so `len(gen)`, `gen[3]`, and `gen[:5]` are all unavailable. Getting
  the fifth item means consuming and discarding the first four with `next()`, or slicing with
  `itertools.islice` (which is itself lazy and one-directional).
- **Harder to debug.** Printing a generator shows its repr, not its contents — inspecting the values
  means consuming them, which destroys the generator for whatever was going to use it next. A stack
  trace for an exception raised deep inside a `yield from` chain points at a suspended frame that
  was paused mid-pipeline, which reads less directly than a normal call stack where every frame is
  actively executing.

The decision rule that falls out of this: reach for a generator when a sequence is large enough that
materializing it is the actual bottleneck, unbounded, or feeds a pipeline where an early stage (like
`take`) may stop pulling before the source is exhausted. Reach for a plain list — the default, not
the exception — when the data is small enough that O(n) memory is a non-issue, when more than one
pass is needed, or when random access, `len()`, or sorting are part of what comes next; a generator
there only adds indirection without buying anything back.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
