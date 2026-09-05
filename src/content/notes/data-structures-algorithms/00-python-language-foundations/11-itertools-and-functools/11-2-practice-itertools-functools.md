---
title: "Practice: itertools & functools"
description: "The raw itertools and functools practice script behind the itertools & functools chapter — one function walks permutations, combinations, product, chain, cycle/count/repeat, accumulate, compress, dropwhile/takewhile, and groupby; the other covers lru_cache memoization, reduce, partial, and wraps."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031817"
---

# Practice: itertools & functools

This is the raw practice script behind [[11-1-itertools-and-functools|Part 00, Chapter 11]] — the
two demo functions written while working through the standard library's combinatorics, lazy
iteration, memoization, and function-composition tools before the chapter distilled them into worked
examples. Nothing below has been rewritten or bug-fixed; this is a structural pass (frontmatter,
headings) only, not a correctness review.

## Iteration

Combinatorial generation (`permutations`, `combinations`, `combinations_with_replacement`,
`product`), lazy concatenation and filtering (`chain`, `compress`, `dropwhile`, `takewhile`),
running totals (`accumulate`), infinite iterators bounded with `islice` (`cycle`, `count`,
`repeat`), and the sorted-input trap in `groupby` — all from `itertools` with no other imports.

```python
def print_itertools():
  """Demonstrates itertools: infinite iterators, combinatorics, filtering,
  accumulation, and grouping — all from the standard library with no imports
  beyond itertools itself."""
  # **Use for:** Combinations/permutations, Cartesian products, grouping, complex iteration.
  import itertools

  print("\nitertools module example:")
  arr = [1, 2, 3]
  print("Array:", arr)

  # All possible orderings of arr
  print("permutations(arr):", list(itertools.permutations(arr)))

  # All combinations of length 2
  print("combinations(arr, 2):", list(itertools.combinations(arr, 2)))

  # All combinations of length 2 with replacement (allows repeated elements)
  print("combinations_with_replacement(arr, 2):", list(itertools.combinations_with_replacement(arr, 2)))

  # Cartesian product of arr with itself
  print("product(arr, repeat=2):", list(itertools.product(arr, repeat=2)))

  arr1, arr2, arr3 = [1, 2], [3, 4], [5, 6]
  print("product(arr1, arr2, arr3):", list(itertools.product(arr1, arr2, arr3)))

  # Chains arr1, arr2, and arr3 together: [1, 2, 3, 4, 5, 6]
  print("chain(arr1, arr2, arr3):", list(itertools.chain(arr1, arr2, arr3)))

  # cycle produces an infinite iterator — always wrap with islice to avoid an endless loop
  # Cycles through arr indefinitely, but we slice to get the first 10 elements
  print("cycle(arr) sliced:", list(itertools.islice(itertools.cycle(arr), 10)))

  # count is also infinite — islice lets you take a finite slice from an infinite iterator
  # Counts up from 1 indefinitely, but we slice to get the first 10 elements
  print("count(1) sliced:", list(itertools.islice(itertools.count(1), 10)))

  # repeat with no count argument is also infinite — here a count of 3 bounds it
  # Repeats 5 three times: [5, 5, 5]
  print("repeat(5, 3):", list(itertools.repeat(5, 3)))

  # accumulate builds a running total — each element is the sum of all elements seen so far
  # Cumulative sums: [1, 3, 6]
  print("accumulate(arr):", list(itertools.accumulate(arr)))

  # Pass a lambda to change the operation — here a running product instead of a running sum
  # Cumulative products: [1, 2, 6]
  print("accumulate product:", list(itertools.accumulate(arr, lambda x, y: x * y)))

  # compress filters using a boolean mask — the second argument selects which elements to keep
  # Filters arr1 by the selector list: [1]
  print("compress(arr1, [True, False]):", list(itertools.compress(arr1, [True, False])))

  # dropwhile skips elements until the predicate is False for the first time, then yields everything after
  # Drops elements while condition is true, then yields the rest: [3]
  print("dropwhile(x<3, arr):", list(itertools.dropwhile(lambda x: x < 3, arr)))

  # takewhile yields elements only while the predicate is True — stops permanently at the first False
  # Takes elements while condition is true: [1, 2]
  print("takewhile(x<3, arr):", list(itertools.takewhile(lambda x: x < 3, arr)))

  # WARNING: groupby only groups *consecutive* identical keys — it does NOT sort for you.
  # If the input is not pre-sorted by the key, the same key can appear in multiple separate groups.
  # Group by first letter (input must be sorted by the key for groupby to work correctly)
  print("\ngroupby example:")
  words = ['apple', 'banana', 'avocado', 'blueberry', 'cherry']
  for key, group in itertools.groupby(words, key=lambda x: x[0]):
    print(f"  Key: {key}, Group: {list(group)}")
```

## Functional Programming

Memoization via `lru_cache` (recursive Fibonacci), folding a sequence with `reduce`, pre-filling
arguments with `partial`, and preserving a wrapped function's identity inside a decorator with
`wraps` — all from `functools`.

```python
def print_functools():
  """Demonstrates functools: memoisation with lru_cache, folding sequences
  with reduce, pre-filling arguments with partial, and preserving function
  metadata inside decorators with wraps."""
  # **Use for:** Caching (memoization), partial application, reducing sequences.
  import functools

  print("\nfunctools module example:")

  # lru_cache — memoization: caches the return value of each unique input so it is computed only once
  # lru_cache — memoize recursive functions to avoid redundant computation
  @functools.lru_cache(maxsize=None)
  def fibonacci(n):
    if n <= 1:
      return n
    return fibonacci(n - 1) + fibonacci(n - 2)

  print("fibonacci(10):", fibonacci(10))   # 55
  print("fibonacci(20):", fibonacci(20))   # 6765

  # reduce — fold a sequence into a single value
  from functools import reduce
  print("reduce sum [1..4]:", reduce(lambda x, y: x + y, [1, 2, 3, 4]))     # 10
  print("reduce product [1..4]:", reduce(lambda x, y: x * y, [1, 2, 3, 4])) # 24
  print("reduce with initial:", reduce(lambda x, y: x + y, [1, 2, 3], 10))  # 16 — third arg is the initial accumulator value (10 + 1 + 2 + 3)

  # partial application: pre-fill one or more arguments to create a more specialised function
  # — double is just multiply with x already fixed to 2; triple with x fixed to 3
  # partial — fix some arguments of a function
  def multiply(x, y):
    return x * y
  double = functools.partial(multiply, 2)
  triple = functools.partial(multiply, 3)
  print("double(5):", double(5))   # 10
  print("triple(4):", triple(4))   # 12

  # wraps copies __name__, __doc__, and other attributes from func to wrapper, so
  # debuggers, help(), and logging see the original function name — not "wrapper"
  # wraps — preserve function metadata inside a decorator
  def my_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
      return func(*args, **kwargs)
    return wrapper
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
