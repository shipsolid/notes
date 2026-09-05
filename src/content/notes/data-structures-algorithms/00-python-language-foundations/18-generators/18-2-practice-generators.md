---
title: "Practice: Generators"
description: "The raw practice source behind the Generators chapter — iterator protocol, yield basics, infinite generators via itertools.islice, yield from delegation, two-way communication with send(), lazy pipelines, and a generator-vs-list memory comparison."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031820"
---

# Practice: Generators

This is the raw practice/source code behind [[18-1-generators|18 — Generators]] — the scratch
functions written while working through the iterator protocol, `yield`, `yield from`, and generator
pipelines before that chapter distilled the material into worked examples with complexity call-outs.
None of the code below has been rewritten or bug-fixed here; this is a structural pass (frontmatter,
headings) only, not a correctness review.

## Iterator Protocol

```python
def print_iterator_protocol():
  # An iterable has __iter__; an iterator has __iter__ + __next__.
  # iter() calls __iter__; next() calls __next__.

  nums = [10, 20, 30]
  it = iter(nums)        # get an iterator from the list

  print(next(it))        # 10
  print(next(it))        # 20
  print(next(it))        # 30

  try:
    next(it)             # raises StopIteration — iterator is exhausted
  except StopIteration:
    print("Iterator exhausted")

  # for-loop is syntactic sugar for the above
  it2 = iter([1, 2, 3])
  while True:
    try:
      print(next(it2), end=" ")
    except StopIteration:
      break
  print()

  # Build a custom iterator class
  class CountUp:
    def __init__(self, start, stop):
      self.current = start
      self.stop    = stop

    def __iter__(self):
      return self   # iterator is its own iterable

    def __next__(self):
      if self.current > self.stop:
        raise StopIteration
      val = self.current
      self.current += 1
      return val

  print(list(CountUp(3, 7)))   # [3, 4, 5, 6, 7]
```

## `yield` — Generator Functions

```python
def print_yield_basics():
  # A function with 'yield' becomes a generator function.
  # Calling it returns a generator object (lazy iterator); body runs on demand.
  def countdown(n):
    while n > 0:
      yield n    # suspend, emit n, resume on next()
      n -= 1
    # implicit StopIteration when function returns

  gen = countdown(3)
  print(type(gen))        # <class 'generator'>
  print(next(gen))        # 3
  print(next(gen))        # 2
  print(list(gen))        # [1]  — remaining values

  # Generators are exhausted after one pass
  squares = (x ** 2 for x in range(5))
  print(list(squares))    # [0, 1, 4, 9, 16]
  print(list(squares))    # []  — already exhausted

  # Multiple yield in one function
  def multi_yield():
    yield "first"
    yield "second"
    yield "third"

  print(list(multi_yield()))   # ['first', 'second', 'third']
```

## Infinite Generators

```python
def print_infinite_generators():
  import itertools

  def naturals(start=0):
    n = start
    while True:
      yield n
      n += 1

  # Never consume an infinite generator directly — always slice/limit
  gen = naturals(1)
  first_five = [next(gen) for _ in range(5)]
  print("first five:", first_five)   # [1, 2, 3, 4, 5]

  # itertools.islice is the idiomatic slicer for generators
  gen2 = naturals(100)
  chunk = list(itertools.islice(gen2, 5))
  print("islice 5:", chunk)          # [100, 101, 102, 103, 104]

  # Fibonacci generator
  def fibonacci():
    a, b = 0, 1
    while True:
      yield a
      a, b = b, a + b

  fibs = list(itertools.islice(fibonacci(), 10))
  print("fibs:", fibs)   # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## `yield from`

```python
def print_yield_from():
  # yield from delegates to a sub-iterable, forwarding all its values.
  def chain(*iterables):
    for it in iterables:
      yield from it   # equivalent to: for item in it: yield item

  print(list(chain([1, 2], [3, 4], [5])))   # [1, 2, 3, 4, 5]

  # Flatten a nested structure recursively
  def flatten(nested):
    for item in nested:
      if isinstance(item, list):
        yield from flatten(item)
      else:
        yield item

  data = [1, [2, [3, 4], 5], [6, 7]]
  print(list(flatten(data)))   # [1, 2, 3, 4, 5, 6, 7]

  # yield from also threads send() values and exceptions through (coroutine use)
```

## Generator `send()` and Two-Way Communication

```python
def print_generator_send():
  # send(value) resumes the generator AND sends a value back in as the result of yield
  def accumulator():
    total = 0
    while True:
      value = yield total   # yield total out; receive next value in
      if value is None:
        break
      total += value

  gen = accumulator()
  next(gen)          # prime the generator (advance to first yield)
  print(gen.send(10))   # 10
  print(gen.send(20))   # 30
  print(gen.send(5))    # 35
```

## Generator as a Pipeline

```python
def print_generator_pipeline():
  # Generators compose naturally into lazy pipelines — no intermediate lists.

  def read_numbers(n):
    for i in range(n):
      yield i

  def filter_even(numbers):
    for n in numbers:
      if n % 2 == 0:
        yield n

  def square(numbers):
    for n in numbers:
      yield n ** 2

  def take(n, gen):
    for _ in range(n):
      yield next(gen)

  # Build the pipeline — nothing runs yet
  source   = read_numbers(1_000_000)
  evens    = filter_even(source)
  squared  = square(evens)
  first_5  = take(5, squared)

  print(list(first_5))   # [0, 4, 16, 36, 64]
  # Only 9 numbers were ever read from source to find the first 5 even squares
```

## Generator vs List — Memory Comparison

```python
def print_generator_vs_list():
  import sys

  def gen_range(n):
    for i in range(n):
      yield i

  N = 100_000
  as_list = list(range(N))
  as_gen  = gen_range(N)

  print(f"list size : {sys.getsizeof(as_list):>12,} bytes")
  print(f"gen  size : {sys.getsizeof(as_gen):>12,} bytes")  # ~200 bytes always

  # Both produce the same sum — generator just doesn't store all values at once
  print("list sum:", sum(as_list))
  print("gen  sum:", sum(gen_range(N)))
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
