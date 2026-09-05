---
title: "14 — Functions"
description: "How Python binds arguments, remembers enclosing scope through closures, and treats every function as a plain object — the mechanics underneath default/keyword arguments, *args/**kwargs, decorators, and the mutable-default trap that catches almost everyone once."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/02-memoization/02-memoization
    kind: related
zettelId: "202607301922-6"
---

# 14 — Functions

A function is the first unit of abstraction most code ever gets: a name that stands in for a block
of behavior, parameterized by whatever it needs to vary. Everything in this chapter is really about
one question underneath that idea — what does a function actually capture when it's defined, and
what does it bind when it's called? Default arguments are captured once, at definition time, not
once per call. Closures capture variables from an enclosing scope by reference, not by value.
Decorators capture an entire function and hand back a different one wearing its name. Get the timing
of each capture wrong and the bug that results is almost always the same shape: something that looks
like it should be fresh on every call turns out to be shared, stale, or aliased. This chapter is
about seeing that timing clearly enough to stop guessing.

---

## Defining and Calling Functions

A function definition binds a name to a callable object; `return` hands a value back to the caller,
and with no explicit `return` the function returns `None`. Returning more than one value is just
returning a tuple — Python's ability to unpack a tuple directly into multiple names is what makes
this feel like a distinct feature rather than a special case of a single return value:

```python
def min_max(numbers: list[int]) -> tuple[int, int]:
    return min(numbers), max(numbers)

lo, hi = min_max([3, 1, 7, 4, 2])
print(lo, hi)  # 1 7
```

A docstring — a string literal as the first statement in the function body — is stored on the
function object itself and readable at runtime via `__doc__`. That's not a documentation curiosity;
it's the first sign that a function is an object like any other, with attributes you can inspect,
which is the theme the rest of this chapter builds on.

---

## Parameter Binding: Defaults, Positional-Only, and Keyword-Only

A default value (`def connect(host, port=5432)`) lets a caller omit an argument, but the important
detail is _when_ that default is produced: **once, at `def` time**, when the function object is
created — not once per call. For an immutable default (an `int`, a `str`, `None`) this distinction
is invisible, because nothing about an immutable value can change between calls. It stops being
invisible the moment the default is mutable — the section below on trade-offs shows exactly how that
breaks.

Two punctuation marks in a parameter list control _how_ an argument can be supplied: `/` marks
everything before it as **positional-only** (the caller cannot use the parameter's name), and `*`
marks everything after it as **keyword-only** (the caller must use the name):

```python
def full_example(pos_only, /, normal, *, kw_only):
    return pos_only, normal, kw_only

full_example(1, 2, kw_only=3)          # (1, 2, 3)
full_example(pos_only=1, normal=2, kw_only=3)  # TypeError — pos_only is positional-only
```

Positional-only parameters exist mainly so a library can rename an internal parameter later without
breaking callers who never should have been passing it by name in the first place — the standard
library itself uses this for exactly that reason.

---

## Variadic Arguments: `*args`, `**kwargs`, and Unpacking

`*args` collects any number of extra positional arguments into a tuple; `**kwargs` collects any
number of extra keyword arguments into a dict. Both can appear on the same signature, alongside
named parameters and defaults, and Python resolves them in a fixed order — named positional, then
`*args`, then keyword-only, then `**kwargs`:

```python
def log(level: str, *messages: str, sep: str = " | ", **meta: object) -> None:
    body = sep.join(messages)
    tags = ", ".join(f"{k}={v}" for k, v in meta.items())
    print(f"[{level}] {body}  {{{tags}}}")

log("INFO", "Request received", "Processing", sep=" -> ", service="api", version=2)
# [INFO] Request received -> Processing  {service=api, version=2}
```

The same two symbols work in reverse at a _call_ site: `*seq` unpacks an iterable into positional
arguments, and `**mapping` unpacks a dict into keyword arguments:

```python
coords = (3, 7)
options = {"sep": "-", "end": "\n"}
print(*coords)              # unpacks as positional args: 3 7
print("a", "b", **options)  # unpacks as keyword args
```

This is the mechanism a dispatch table or a generic wrapper relies on to forward an arbitrary call
through unchanged — the decorator section below depends on it directly.

---

## Lambda: Anonymous Single-Expression Functions

`lambda <params>: <expression>` produces a function object with no name and no `return` statement —
the expression's value _is_ the return value, and there can only be one expression, which is a hard
ceiling on how much logic belongs in one. Its natural habitat is a `key=` argument, where naming a
separate function would add more ceremony than the sort itself:

```python
pairs = [(1, "banana"), (3, "apple"), (2, "cherry")]
pairs.sort(key=lambda pair: pair[1])  # sort by the second element
```

`filter` and `map` with a `lambda` are the classic pairing
(`list(filter(lambda x: x % 2 == 0, nums))`), but a list comprehension
(`[x for x in nums if x % 2 == 0]`) says the same thing with one fewer function call and one fewer
level of indirection to read through — reach for `lambda` when the call site demands a callable, not
as a default way to filter or transform a sequence.

---

## Closures and Captured Scope

A **closure** is an inner function that references a variable from its enclosing (but not global)
scope, and keeps a live reference to that variable even after the enclosing function has returned.
The enclosing scope doesn't get torn down the way a normal function's frame does — it stays alive,
pinned in place, for exactly as long as something still holds a reference to the inner function:

```python
def make_multiplier(factor: int):
    def multiply(n: int) -> int:
        return n * factor  # factor is looked up in the enclosing scope, not copied
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5), triple(5))  # 10 15
```

`double` and `triple` are two separate closures, each holding its own captured `factor` — nothing
about calling `make_multiplier` twice causes the two calls to interfere with each other.

By default, a closure can _read_ an enclosing variable but not _rebind_ it — `count += 1` inside a
nested function raises `UnboundLocalError`, because assignment makes Python treat `count` as a new
local variable unless told otherwise. The `nonlocal` keyword is that explicit instruction: it binds
a name inside the nested function to the nearest enclosing scope's variable of the same name, rather
than the local or global scope.

### Worked Example: A Stateful Counter, Two Ways

Before `nonlocal` existed as clearly as it does today, the standard workaround was to wrap the
mutable state in a one-element list or dict, since _mutating_ an object doesn't require rebinding
the name that points to it:

```python
def make_counter(start: int = 0):
    count = [start]  # mutated in place — no rebinding, so no nonlocal needed
    def increment(step: int = 1) -> int:
        count[0] += step
        return count[0]
    return increment

c1, c2 = make_counter(), make_counter(10)
print(c1(), c1(), c1())  # 1 2 3
print(c2(), c2())        # 11 12
```

`nonlocal` says the same thing without the wrapper object:

```python
def make_counter_nonlocal(start: int = 0):
    count = start
    def increment(step: int = 1) -> int:
        nonlocal count
        count += step
        return count
    return increment
```

Both versions are correct and both produce one independent counter per call to the outer function —
prefer `nonlocal` when you're writing the closure from scratch; recognize the list-wrapper trick
when reading older code, since it's functionally identical, just less direct about its intent.

---

## First-Class Functions and Higher-Order Patterns

Python functions are **first-class values**: they can be assigned to a name, stored in a data
structure, passed as an argument, and returned from another function, exactly like an `int` or a
`str`. A function that accepts or returns another function is a **higher-order function** — `apply`
below is one, and so is `make_multiplier` above:

```python
def shout(text: str) -> str:
    return text.upper()

def apply(func, text: str) -> str:
    return func(text)

apply(shout, "hello")  # HELLO
```

Storing functions as dict values turns a chain of `if/elif` into a lookup — a **dispatch table**:

```python
ops = {
    "add": lambda a, b: a + b,
    "sub": lambda a, b: a - b,
    "mul": lambda a, b: a * b,
}
ops["add"](10, 3)  # 13
```

Adding a new operation means adding a dict entry, not another `elif` branch — the same shape shows
up constantly in interpreters, command routers, and state machines.

---

## Decorators: Wrapping Functions with Functions

A **decorator** is a higher-order function that takes a function and returns a new function, usually
one that wraps the original with some extra behavior before and/or after calling it. The
`@decorator` line above a `def` is pure syntactic sugar for `func = decorator(func)` — nothing about
it is special beyond that rebinding.

```python
import time
from functools import wraps

def timer(func):
    @wraps(func)  # copies __name__, __doc__ from func onto wrapper
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.perf_counter() - start:.4f}s")
        return result
    return wrapper

@timer
def slow_sum(n: int) -> int:
    return sum(range(n))
```

`*args, **kwargs` on `wrapper` is what lets one decorator wrap _any_ function's signature without
knowing it in advance — this is the variadic-argument machinery from earlier doing real work, not
just a syntax demonstration. `@wraps(func)` matters because without it, `slow_sum.__name__` becomes
`"wrapper"` and `slow_sum.__doc__` becomes `None` — the decorator would silently erase the original
function's identity from every introspection tool, traceback, and `help()` call downstream.

### Worked Example: A Decorator That Takes Its Own Arguments

`@timer` takes no arguments, so `timer` only needs one layer: function in, function out. A decorator
that itself needs a parameter — `@repeat(times=3)` — needs an extra layer, because `repeat(times=3)`
has to _return_ a decorator, which then wraps the function:

```python
def repeat(times: int):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def say(msg: str) -> None:
    print(msg)

say("hello")  # printed 3 times
```

Decorators stack, and they apply bottom-up — closest to the function first:

```python
def bold(func):
    @wraps(func)
    def wrapper(*a, **kw): return "**" + func(*a, **kw) + "**"
    return wrapper

def italic(func):
    @wraps(func)
    def wrapper(*a, **kw): return "_" + func(*a, **kw) + "_"
    return wrapper

@bold
@italic
def title() -> str:
    return "Python"

print(title())  # **_Python_**
```

`@bold` above `@italic` reads top-down but _executes_ as `bold(italic(title))` — `italic` wraps the
raw string first, and `bold` wraps whatever `italic` produced. A hand-rolled cache decorator built
on this same pattern is exactly what `functools.lru_cache` gives you for free in the standard
library — see [[02-memoization|Memoization]] (Part 08, Chapter 2) for the recursion-depth and
eviction trade-offs that a caching decorator buys you once the state being cached grows unbounded.

---

## Common Pitfalls and Trade-offs

**Mutable default arguments are shared across every call.** Because a default is created once, at
`def` time, a mutable default is one object, reused as the _same_ object on every call that doesn't
override it:

```python
def bad_append(item, lst=[]):   # lst is created ONCE, not per call
    lst.append(item)
    return lst

bad_append(1)  # [1]
bad_append(2)  # [1, 2]  <- surprising: yesterday's list, still alive
```

The fix is a `None` sentinel, checked and replaced inside the function body — this is the single
most common Python interview gotcha, and the fix is a fixed idiom worth having memorized:

```python
def good_append(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst
```

**Closures over a loop variable capture the variable, not its value at each iteration.** Every
closure created inside a loop shares the _same_ enclosing variable, so by the time any of them is
called, that variable holds whatever value the loop last left it at:

```python
makers = [lambda: i for i in range(3)]
[m() for m in makers]  # [2, 2, 2] — not [0, 1, 2]
```

The fix is to force evaluation at closure-creation time, most commonly with a default argument
(defaults _are_ evaluated at definition time, which for once is exactly the behavior you want):

```python
makers = [lambda i=i: i for i in range(3)]
[m() for m in makers]  # [0, 1, 2]
```

**`*args`/`**kwargs`trade a readable signature for flexibility.** A decorator's`wrapper(\*args,
**kwargs)`has to accept anything, because it can't know in advance what it's wrapping — but a regular function written with`**kwargs`
"just in case" hides its real contract from callers, IDEs, and type checkers alike. Reach for it
when genuinely forwarding an unknown call (decorators, adapters), not as a substitute for naming the
parameters a function actually needs.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
