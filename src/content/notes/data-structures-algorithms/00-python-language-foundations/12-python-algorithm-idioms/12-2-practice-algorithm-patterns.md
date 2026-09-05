---
title: "Practice: Python Algorithm Idioms"
description: "The raw sort, search, count, group, and filter-map-reduce practice functions behind the Python Algorithm Idioms chapter — five standalone drills demonstrating each pattern before the chapter contrasts hand-rolled versions against their idiomatic standard-library equivalents."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031816"
---

# Practice: Python Algorithm Idioms

This is the raw practice corpus behind [[12-1-python-algorithm-idioms|12 — Python Algorithm Idioms]]
— five standalone drill functions covering sorting, searching, counting, grouping, and
filter/map/reduce, each printing its own worked example to stdout. The chapter takes these same five
patterns and contrasts a hand-rolled version against its idiomatic standard-library equivalent; this
note keeps the plain runnable drills that sit underneath that comparison. None of the logic has been
rewritten or bug-fixed here — this is a structural pass (frontmatter, headings) only, not a
correctness review.

---

## Sorting

```python
def print_sorting():
  # **Use for:** Sorting lists, custom sorting criteria, stable sorting.
  arr = [5, 2, 9, 1, 5, 6]
  print("\nSorting example:")
  print("Original array:", arr)

  sorted_arr = sorted(arr)  # Returns a new sorted list
  print("sorted():", sorted_arr)  # [1, 2, 5, 5, 6, 9]

  arr.sort()  # Sorts in-place, returns None
  print(".sort() in-place:", arr)  # [1, 2, 5, 5, 6, 9]

  # Sort by key
  pairs = [("banana", 2), ("apple", 1), ("cherry", 3)]
  pairs.sort(key=lambda x: x[1])           # by second element
  print("Sort by key:", pairs)

  pairs.sort(key=lambda x: (x[1], x[0]))  # multi-key sort
  print("Multi-key sort:", pairs)

  arr.sort()                                    # In-place ascending
  arr.sort(reverse=True)                        # In-place descending
  sorted(arr)                                   # New list
  sorted(pairs, key=lambda x: x[1])            # By second element
  sorted(pairs, key=lambda x: (x[1], x[0]))   # Multi-key
```

---

## Searching

The example below calls a small linear-search helper before demonstrating `in`, `.index()`, and
`bisect` directly.

```python
def _linear_search(arr, target):
  for i, val in enumerate(arr):
    if val == target:
      return i
  return -1
```

```python
def print_searching():
  # **Use for:** Finding elements, binary search, membership testing.
  arr = [1, 2, 3, 4, 5]
  target = 3
  print("\nSearching example:")
  print("Array:", arr, "Target:", target)
  print("Linear search index:", _linear_search(arr, target))  # 2

  target in arr            # O(n) existence check
  arr.index(target)        # O(n) index lookup

  import bisect
  pos = bisect.bisect_left(arr, target)    # O(log n) on sorted array
  found = pos < len(arr) and arr[pos] == target
  print(f"Binary search found={found}, index={pos}")
```

---

## Counting

```python
def print_counting():
  # **Use for:** Counting occurrences, frequency analysis, top-K elements.
  arr = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple']
  print("\nCounting example:")
  print("Array:", arr)

  from collections import Counter
  c = Counter(arr)
  print("Counter:", c)                   # Counter({'apple': 3, 'banana': 2, 'orange': 1})
  print("Most common:", c.most_common(1))  # [('apple', 3)]

  k = 2
  Counter(arr).most_common(k)            # Top K elements

  # Manual frequency map
  freq = {}
  for item in arr:
    freq[item] = freq.get(item, 0) + 1
  print("Manual freq:", freq)
```

---

## Grouping

```python
def print_grouping():
  # **Use for:** Grouping elements by key, categorization, building adjacency lists.
  arr = ['apple', 'banana', 'avocado', 'blueberry', 'cherry']
  print("\nGrouping example:")
  print("Array:", arr)

  from collections import defaultdict
  groups = defaultdict(list)
  for item in arr:
    groups[item[0]].append(item)  # group by first letter

  print("Grouped by first letter:", dict(groups))
  # {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}
```

---

## Filter, Map, and Reduce

```python
def print_filter_map_reduce():
  # **Use for:** Filtering, transforming, and reducing sequences.
  arr = [1, 2, 3, 4, 5]
  print("\nFilter / Map / Reduce example:")
  print("Array:", arr)

  # Filter: Get even numbers
  evens = [x for x in arr if x % 2 == 0]
  print("Evens:", evens)       # [2, 4]

  # Map: Square each number
  squares = [x ** 2 for x in arr]
  print("Squares:", squares)   # [1, 4, 9, 16, 25]

  # Reduce: cumulative operations
  from functools import reduce
  total   = reduce(lambda x, y: x + y, arr)
  product = reduce(lambda x, y: x * y, arr)
  print("Sum:", total)         # 15
  print("Product:", product)   # 120

  # Quick reference
  filtered = [x for x in arr if x % 2 == 0]   # list comprehension preferred over filter()
  mapped   = [x ** 2 for x in arr]             # list comprehension preferred over map()
  reduce(lambda x, y: x + y, arr)              # sum
  reduce(lambda x, y: x * y, arr)              # product
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
