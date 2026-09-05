---
title: "Practice: Built-in Functions"
description: "The raw practice snippets behind the Built-in Functions chapter — sorted()/key=, aggregate reflexes, enumerate/reversed/range/zip, map()/filter(), and the numeric/identity/type-conversion builtins — each demoed with printed output for quick reference."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031819"
---

# Practice: Built-in Functions

This is the raw practice source behind [[02-1-built-in-functions|2 — Built-in Functions]] — the
runnable demo functions written while working out which built-ins deserve reflexive fluency versus
which are merely situational. Each function below prints its own labeled output so the behavior is
visible without a debugger. None of them have been rewritten or bug-fixed here; this is a structural
pass (frontmatter, headings, fencing) only, not a correctness review.

---

## sorted() and list.sort()

```python
def print_sorted():
  """
  Covers sorted() and list.sort().
  Understanding the difference (new list vs in-place) prevents subtle bugs
  when you pass a list to a helper function and expect the original to be untouched.
  """
  # sorted(iterable, key=None, reverse=False)
  # Returns a NEW sorted list — original is unchanged.
  # key: a function applied to each element to derive the sort value.
  # reverse=True flips to descending order.

  print("\nsorted() returns a new list, original is unchanged.")
  arr = [3, 1, 4, 1, 5]
  print("Original array:", arr)
  print(sorted(arr))                         # [1, 1, 3, 4, 5]  — ascending (default)
  print(sorted(arr, reverse=True))           # [5, 4, 3, 1, 1]  — descending

  print("\nsorted() with key=lambda: sort by absolute value.")
  # key=lambda: sort by absolute value, not raw value.
  # abs(-3)=3, abs(1)=1, abs(-4)=4, abs(2)=2, abs(-1)=1
  # Order by |x|:  1, -1, 2, -3, -4
  arr = [-3, 1, -4, 2, -1]
  print("Original array:", arr)
  print(sorted(arr, key=lambda x: abs(x)))  # [1, -1, 2, -3, -4]

  print("\nsorted() with key=len: sort strings by their length.")
  # key=len: sort strings by their length instead of alphabetically.
  # len("pie")=3, len("apple")=5, len("banana")=6
  words = ["apple", "pie", "banana"]
  print("Original array:", words)
  print(sorted(words, key=len))             # ['pie', 'apple', 'banana']

  print("\narr.sort() sorts the list IN-PLACE, original is changed.")
  print("Original array:", arr)
  # sorted() returns a new list; .sort() mutates the original and returns None.
  # .sort() sorts the list IN-PLACE — no new list is created, returns None.
  arr.sort()                          # arr is now [-4, -3, -1, 1, 2]
  print(arr)
```

---

## Aggregate Reflexes: min, max, sum, len, count, any, all

A small manual counting helper sits alongside the demo function below, used to contrast a
hand-rolled loop against `arr.count()` and the other aggregate builtins.

```python
def count_element_in_array(arr, element):
  """
  Counts occurrences of `element` in `arr` using a manual loop.
  Parameters: arr (list) — the list to search; element — the value to count.
  Returns: int — how many times element appears in arr.
  """
  cnt = 0
  for el in arr:
    if el == element:
      cnt += 1
  return cnt

def print_min_max_sum_prod_len_count_any_all():
  """
  Covers the most-used aggregate builtins: min, max, sum, len, count, any, all, math.prod.
  These are the first tools to reach for when reducing a collection to a single value.
  """

  import math

  arr = [3, 1, 4, 1, 5]
  print("\nmin(), max(), sum(), len(), count(), any(), all() examples:")
  print("Array:", arr)
  print("min(arr):", min(arr))           # 1
  print("max(arr):", max(arr))           # 5
  print("sum(arr):", sum(arr))           # 14
  print("len(arr):", len(arr))           # 5
  print("arr.count(1):", arr.count(1))   # 2 (number of times '1' appears)
  print("count_element_in_array(arr, 1):", count_element_in_array(arr, 1))  # 2 (custom count function)
  print("math.prod(arr):", math.prod(arr))

  bools = [True, True, False]
  print("\nBoolean array:", bools)
  print("any(bools):", any(bools))       # True (at least one True)
  print("all(bools):", all(bools))       # False (not all are True)
```

---

## Iteration Helpers: enumerate, reversed, range, zip

```python
def print_enumerate_reversed_range_zip():
  """
  Covers iteration helpers: enumerate, reversed, range, and zip.
  These let you loop with index awareness, reverse order, numeric sequences, and
  paired iterables — all without manual index bookkeeping.
  """
  arr = ['a', 'b', 'c']
  # Enumerate(iterable, start=0) returns an iterator of (index, value) pairs.
  print("\nenumerate() example:")
  print("Array:", arr)
  for index, value in enumerate(arr):
    print(f"Index: {index}, Value: {value}")

  # You can convert the enumerate object to a list or dict.
  print(f"list(enumerate(arr)):", list(enumerate(arr)))  # [(0, 'a'), (1, 'b'), (2, 'c')]
  print(f"dict(enumerate(arr)):", dict(enumerate(arr)))  # {0: 'a', 1: 'b', 2: 'c'}
  # You can specify a different starting index with the 'start' parameter.
  print(f"list(enumerate(arr, start=1)):", list(enumerate(arr, start=1)))  # [(1, 'a'), (2, 'b'), (3, 'c')]

  print(f"list(reversed(arr)):", list(reversed(arr)))  # ['c', 'b', 'a']

  # range(stop), range(start, stop), range(start, stop, step) generates a sequence of numbers.
  print(f"list(range(5)):", list(range(5)))  # [0, 1, 2, 3, 4]
  print(f"list(range(1, 5)):", list(range(1, 5)))  # [1, 2, 3, 4]
  print(f"list(range(0, 10, 2)):", list(range(0, 10, 2)))  # [0, 2, 4, 6, 8]

  # zip(*iterables) returns an iterator of tuples,
  # where the i-th tuple contains the i-th element from each of the argument iterables.
  print(f"list(zip(arr, reversed(arr))):", list(zip(arr, reversed(arr))))  # [('a', 'c'), ('b', 'b'), ('c', 'a')]

  list(reversed([1, 2, 3]))  # [3, 2, 1]  — reversed() works on any sequence; wrap in list() to materialise it
  "hello"[::-1]              # "olleh"    — slice with step=-1 reverses a string in-place (no reversed() needed for strings)
```

---

## map() and filter()

```python
def print_map_filter():
  """
  Covers map() and filter() for transforming and selecting elements.
  Knowing these helps you read older Python code; in new code, prefer
  list comprehensions for readability (see examples at the bottom).
  """
  # map(fn, iterable) — apply fn to every element; returns an iterator.
  # filter(fn, iterable) — keep elements where fn is truthy; returns an iterator.
  arr = [1, 2, 3, 4, 5]
  print("\nmap() and filter() example:")
  print("Array:", arr)

  squares = list(map(lambda x: x ** 2, arr))
  print("map(x**2):", squares)                    # [1, 4, 9, 16, 25]

  evens = list(filter(lambda x: x % 2 == 0, arr))
  print("filter(even):", evens)                   # [2, 4]

  # map over two iterables simultaneously
  a, b = [1, 2, 3], [10, 20, 30]
  sums = list(map(lambda x, y: x + y, a, b))
  print("map over two lists:", sums)              # [11, 22, 33]

  # List comprehension equivalents (preferred in modern Python)
  # Comprehensions are favoured because they are more readable, avoid an extra lambda,
  # and return a list directly — no need to wrap in list().
  print("squares via comprehension:", [x ** 2 for x in arr])
  print("evens via comprehension:", [x for x in arr if x % 2 == 0])
```

---

## Numeric, Character & Identity Builtins

```python
def print_misc_builtins():
  """
  Covers numeric, character, and identity builtins frequently seen in DSA problems.
  Knowing abs, pow, divmod, ord/chr, and the type-inspection functions saves
  writing boilerplate and avoids common off-by-one or type errors.
  """
  # Miscellaneous built-in functions commonly used in DSA.
  print("\nMisc builtins example:")

  print("abs(-7):", abs(-7))                        # 7
  print("round(3.75, 1):", round(3.75, 1))          # 3.8
  print("pow(2, 10):", pow(2, 10))                  # 1024
  print("pow(2, 10, 1000):", pow(2, 10, 1000))      # 24  (modular exponentiation)
  print("divmod(17, 5):", divmod(17, 5))            # (3, 2) — quotient and remainder

  print("ord('A'):", ord('A'))                      # 65
  print("chr(65):", chr(65))                        # 'A'
  print("bin(10):", bin(10))                        # '0b1010'
  print("hex(255):", hex(255))                      # '0xff'
  print("oct(8):", oct(8))                          # '0o10'
  print("int('0b1010', 2):", int('0b1010', 2))      # 10  (parse binary string)
  print("int('ff', 16):", int('ff', 16))            # 255 (parse hex string)

  print("id(42):", id(42))                                          # id() returns the unique memory address of an object — useful when checking if two names point to the same object
  print("hash('hello'):", hash('hello'))                            # hash() returns the hash value used by dicts and sets; mutable types (list, dict) are not hashable

  print("isinstance(42, int):", isinstance(42, int))                # isinstance() checks type safely and supports a tuple of types — prefer over type() for input validation
  print("isinstance(42, (int, float)):", isinstance(42, (int, float)))
  print("type(42):", type(42))                                      # type() returns the exact type — use for debugging; isinstance() is better for type checks in logic
  print("type(42) is int:", type(42) is int)
```

---

## Type Conversion Constructors

```python
def print_type_conversion():
  """
  Covers the built-in type constructors: int, float, str, bool, list, tuple, set, dict.
  Explicit type conversion prevents silent bugs when mixing numeric strings,
  booleans, and collection types in algorithms.
  """
  # Built-in type constructors — convert between types.
  print("\nType conversion example:")

  print("int('42'):", int('42'))               # 42
  print("int(3.9):", int(3.9))                 # 3  (truncates toward zero)
  print("float('3.14'):", float('3.14'))       # 3.14
  print("str(42):", str(42))                   # '42'
  print("bool(0):", bool(0))                   # False
  print("bool([]):", bool([]))                 # False
  print("bool([0]):", bool([0]))               # True  (non-empty list is truthy)

  # Quick reference — converting between collection types
  print("list((1, 2, 3)):", list((1, 2, 3)))
  print("tuple([1, 2, 3]):", tuple([1, 2, 3]))
  print("set([1, 2, 2, 3]):", set([1, 2, 2, 3]))
  print("dict([('a',1),('b',2)]):", dict([('a', 1), ('b', 2)]))
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
