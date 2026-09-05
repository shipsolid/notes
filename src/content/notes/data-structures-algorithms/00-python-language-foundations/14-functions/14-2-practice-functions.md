---
title: "Practice: Functions"
description: "The raw practice source behind the Functions chapter — runnable demonstrations of default/positional-only/keyword-only arguments, *args and **kwargs, lambdas, closures, decorators, and first-class function patterns, including the classic mutable-default-argument trap."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031824"
---

# Practice: Functions

This is the raw practice source behind [[14-1-functions|14 — Functions]] — the runnable drills
written while working through argument binding, closures, and decorators before that chapter
distilled the underlying mechanics into prose. Each section below is a standalone, runnable
function; none of them have been rewritten or bug-fixed here — this is a structural pass
(frontmatter, headings) only, not a correctness review.

---

## Defining and Calling Functions

```python
def print_basic_functions():
  def greet(name):
    return f"Hello, {name}!"

  print(greet("Alice"))   # Hello, Alice!

  # Multiple return values (returns a tuple)
  def min_max(numbers):
    return min(numbers), max(numbers)

  lo, hi = min_max([3, 1, 7, 4, 2])
  print(f"min={lo}, max={hi}")  # min=1, max=7

  # Docstring convention
  def add(a, b):
    """Return the sum of a and b."""
    return a + b

  print(add.__doc__)  # Return the sum of a and b.
```

## Default Parameters

```python
def print_default_params():
  def connect(host, port=5432, ssl=True):
    return f"Connecting to {host}:{port} ssl={ssl}"

  print(connect("db.prod"))               # port=5432, ssl=True
  print(connect("db.dev", port=5433))     # override port only
  print(connect("db.local", ssl=False))   # override ssl only

  # WARNING: mutable default arguments are shared across all calls
  def bad_append(item, lst=[]):   # lst is created ONCE, not per call
    lst.append(item)
    return lst

  print(bad_append(1))  # [1]
  print(bad_append(2))  # [1, 2]  ← surprising

  # Fix: use None as the sentinel
  def good_append(item, lst=None):
    if lst is None:
      lst = []
    lst.append(item)
    return lst

  print(good_append(1))  # [1]
  print(good_append(2))  # [2]  ← correct
```

## Positional-Only / Keyword-Only Parameters

```python
def print_param_kinds():
  # /  = everything before it is positional-only
  # *  = everything after it is keyword-only
  def full_example(pos_only, /, normal, *, kw_only):
    return pos_only, normal, kw_only

  result = full_example(1, 2, kw_only=3)
  print(result)  # (1, 2, 3)
  # full_example(pos_only=1, normal=2, kw_only=3)  # TypeError: pos_only is positional-only
```

## \*args and \*\*kwargs

```python
def print_args_kwargs():
  # *args — variadic positional arguments; collected as a tuple
  def total(*args):
    return sum(args)

  print(total(1, 2, 3))        # 6
  print(total(10, 20, 30, 40)) # 100

  # **kwargs — variadic keyword arguments; collected as a dict
  def display(**kwargs):
    for key, val in kwargs.items():
      print(f"  {key}: {val}")

  display(name="Alice", age=30, city="NYC")

  # Both together
  def log(level, *messages, sep=" | ", **meta):
    body = sep.join(messages)
    tags = ", ".join(f"{k}={v}" for k, v in meta.items())
    print(f"[{level}] {body}  {{{tags}}}")

  log("INFO", "Request received", "Processing", sep=" → ", service="api", version=2)

  # Unpacking into a function call
  coords = (3, 7)
  options = {"sep": "-", "end": "\n"}
  print(*coords)             # unpacks as positional
  print("a", "b", **options) # unpacks as keyword args
```

## Lambda Functions

```python
def print_lambda():
  # lambda <params>: <expression>  — anonymous single-expression function
  square = lambda x: x ** 2
  print(square(5))  # 25

  add = lambda x, y: x + y
  print(add(3, 4))  # 7

  # Practical: sort key
  pairs = [(1, "banana"), (3, "apple"), (2, "cherry")]
  pairs.sort(key=lambda pair: pair[1])  # sort by fruit name
  print(pairs)

  # Practical: filter/map (comprehensions are usually clearer)
  nums = [1, 2, 3, 4, 5, 6]
  evens   = list(filter(lambda x: x % 2 == 0, nums))
  doubled = list(map(lambda x: x * 2, nums))
  print("evens:", evens)
  print("doubled:", doubled)
```

## Closures

```python
def print_closures():
  # A closure is a function that captures variables from its enclosing scope.
  def make_multiplier(factor):
    def multiply(n):
      return n * factor   # factor is captured from enclosing scope
    return multiply

  double = make_multiplier(2)
  triple = make_multiplier(3)
  print(double(5))   # 10
  print(triple(5))   # 15

  # Each closure has its own captured state
  def make_counter(start=0):
    count = [start]   # list wrapper lets inner function mutate it without nonlocal
    def increment(step=1):
      count[0] += step
      return count[0]
    return increment

  c1 = make_counter()
  c2 = make_counter(10)
  print(c1(), c1(), c1())  # 1 2 3
  print(c2(), c2())        # 11 12

  # nonlocal — explicit mutable binding in enclosing scope
  def make_counter_nonlocal():
    count = 0
    def increment():
      nonlocal count
      count += 1
      return count
    return increment

  c = make_counter_nonlocal()
  print(c(), c(), c())  # 1 2 3
```

## Decorators

```python
def print_decorators():
  import time
  from functools import wraps

  # A decorator is a function that takes a function and returns a new function.
  # @decorator syntax is syntactic sugar for: fn = decorator(fn)

  def timer(func):
    @wraps(func)   # preserve original name/docstring
    def wrapper(*args, **kwargs):
      start = time.perf_counter()
      result = func(*args, **kwargs)
      elapsed = time.perf_counter() - start
      print(f"{func.__name__} took {elapsed:.4f}s")
      return result
    return wrapper

  @timer
  def slow_sum(n):
    return sum(range(n))

  slow_sum(1_000_000)

  # Decorator with arguments — needs an extra layer
  def repeat(times):
    def decorator(func):
      @wraps(func)
      def wrapper(*args, **kwargs):
        for _ in range(times):
          result = func(*args, **kwargs)
        return result
      return wrapper
    return decorator

  @repeat(times=3)
  def say(msg):
    print(msg)

  say("hello")  # printed 3 times

  # Stacking decorators (applied bottom-up)
  def bold(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
      return "**" + func(*args, **kwargs) + "**"
    return wrapper

  def italic(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
      return "_" + func(*args, **kwargs) + "_"
    return wrapper

  @bold
  @italic
  def title():
    return "Python"

  print(title())  # **_Python_**
```

## First-Class Functions

```python
def print_first_class():
  # Functions are objects: assignable, passable, storable, returnable.

  def shout(text):
    return text.upper()

  def whisper(text):
    return text.lower()

  def apply(func, text):
    return func(text)

  print(apply(shout, "hello"))    # HELLO
  print(apply(whisper, "HELLO"))  # hello

  # Store functions in a dict (dispatch table pattern)
  ops = {
    "add":  lambda a, b: a + b,
    "sub":  lambda a, b: a - b,
    "mul":  lambda a, b: a * b,
  }
  for name, fn in ops.items():
    print(f"{name}(10, 3) = {fn(10, 3)}")
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
