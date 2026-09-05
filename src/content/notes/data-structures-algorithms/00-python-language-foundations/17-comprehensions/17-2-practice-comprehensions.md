---
title: "Practice: Comprehensions"
description: "Runnable source behind the Comprehensions chapter — list, nested, dict, set, and generator-expression drills, plus the walrus operator's use inside a comprehension's filter clause."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031818"
---

# Practice: Comprehensions

This is the raw practice source behind [[17-1-comprehensions|17 — Comprehensions]] — the list,
nested, dict, set, and generator-expression drills, plus the walrus-operator example, written while
working out each form before the chapter distilled the memory and readability trade-offs into worked
examples. None of the code below has been rewritten or bug-fixed; this is a structural pass
(frontmatter, headings) only, not a correctness review.

## List Comprehensions

```python
def print_list_comprehensions():
  # [expression for item in iterable]
  squares = [x ** 2 for x in range(1, 6)]
  print("squares:", squares)   # [1, 4, 9, 16, 25]

  # [expression for item in iterable if condition]
  evens = [x for x in range(10) if x % 2 == 0]
  print("evens:", evens)       # [0, 2, 4, 6, 8]

  # Transform + filter together
  words    = ["hello", "world", "python", "code"]
  long_upper = [w.upper() for w in words if len(w) > 4]
  print("long_upper:", long_upper)  # ['HELLO', 'WORLD', 'PYTHON']

  # Equivalent for-loop for comparison
  result = []
  for w in words:
    if len(w) > 4:
      result.append(w.upper())
  print("same via loop:", result)

  # Flatten a list of lists
  matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  flat = [cell for row in matrix for cell in row]
  print("flat:", flat)   # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Nested List Comprehensions

```python
def print_nested_list_comprehensions():
  # Transpose a matrix — outer loop = col index, inner loop = row index
  matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  transposed = [[row[i] for row in matrix] for i in range(3)]
  print("transposed:")
  for row in transposed:
    print(" ", row)

  # Cartesian product of two lists
  suits  = ["♠", "♥"]
  values = ["A", "K", "Q"]
  deck = [f"{v}{s}" for s in suits for v in values]
  print("deck snippet:", deck)  # ['A♠', 'K♠', 'Q♠', 'A♥', 'K♥', 'Q♥']

  # Nested comprehension with condition
  pairs = [(x, y) for x in range(4) for y in range(4) if x != y and x + y == 3]
  print("pairs summing to 3:", pairs)  # [(0,3),(1,2),(2,1),(3,0)]
```

## Dict Comprehensions

```python
def print_dict_comprehensions():
  # {key_expr: value_expr for item in iterable}
  squares = {x: x ** 2 for x in range(1, 6)}
  print("squares:", squares)   # {1:1, 2:4, 3:9, 4:16, 5:25}

  # Invert a dict (swap keys and values)
  original = {"a": 1, "b": 2, "c": 3}
  inverted = {v: k for k, v in original.items()}
  print("inverted:", inverted)  # {1:'a', 2:'b', 3:'c'}

  # Filter while building
  scores = {"Alice": 88, "Bob": 62, "Carol": 95, "Dan": 55}
  passed = {name: score for name, score in scores.items() if score >= 70}
  print("passed:", passed)   # {'Alice': 88, 'Carol': 95}

  # Normalise keys (strip + lower)
  raw = {"  Name ": "Alice", "AGE": 30}
  clean = {k.strip().lower(): v for k, v in raw.items()}
  print("clean:", clean)   # {'name': 'Alice', 'age': 30}
```

## Set Comprehensions

```python
def print_set_comprehensions():
  # {expression for item in iterable}  — produces a set (no duplicates)
  words = ["hello", "world", "hello", "python", "world"]
  unique_lengths = {len(w) for w in words}
  print("unique lengths:", unique_lengths)  # {5, 6}

  # Extract unique first characters
  first_chars = {w[0] for w in words}
  print("first chars:", first_chars)  # {'h', 'w', 'p'}

  # Deduplication via set comprehension
  data = [1, 2, 2, 3, 3, 3, 4]
  unique = {x for x in data}
  print("unique:", unique)   # {1, 2, 3, 4}  (faster: just set(data))
```

## Generator Expressions

```python
def print_generator_expressions():
  # (expression for item in iterable)
  # Like a list comprehension but lazy — values produced one at a time.
  # Uses O(1) memory regardless of iterable size.

  gen = (x ** 2 for x in range(1, 6))
  print(type(gen))           # <class 'generator'>
  print(next(gen))           # 1
  print(next(gen))           # 4
  print(list(gen))           # [9, 16, 25]  — exhausted after this

  # Pass directly to a function (no extra parentheses needed)
  total = sum(x ** 2 for x in range(1, 1001))
  print("sum of squares 1..1000:", total)  # 333833500

  # all() / any() short-circuit — generator stops as soon as answer is known
  nums = [2, 4, 6, 8, 11]
  print("all even:", all(x % 2 == 0 for x in nums))   # False (stops at 11)
  print("any > 10:", any(x > 10 for x in nums))        # True (stops at 11)

  # Memory comparison: list vs generator for large data
  import sys
  big_list = [x for x in range(100_000)]
  big_gen  = (x for x in range(100_000))
  print(f"list size: {sys.getsizeof(big_list):,} bytes")
  print(f"gen  size: {sys.getsizeof(big_gen):,} bytes")  # ~100 bytes always
```

## Walrus Operator in Comprehensions (Python 3.8+)

```python
def print_walrus_in_comprehensions():
  # := assigns and returns in one expression — avoids calling an expression twice
  import math

  nums = [1, 4, 9, 16, 25, -1, 36]

  # Without walrus: sqrt called once for filter, once for value
  results_old = [math.sqrt(x) for x in nums if x >= 0]

  # With walrus: compute once, reuse
  results = [root for x in nums if x >= 0 and (root := math.sqrt(x)) < 7]
  print("roots < 7:", results)  # [1.0, 2.0, 3.0, 4.0]

  # Useful when the filtered value is expensive to compute
  data = ["42", "bad", "7", "x", "100"]
  parsed = [n for s in data if (n := _try_int(s)) is not None]
  print("parsed ints:", parsed)  # [42, 7, 100]

def _try_int(s):
  try:
    return int(s)
  except ValueError:
    return None
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
