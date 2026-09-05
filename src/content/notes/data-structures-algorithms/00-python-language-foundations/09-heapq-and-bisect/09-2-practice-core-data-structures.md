---
title: "Core Data Structures Practice — Full Source Catalogue"
description: "The raw practice corpus behind six Part 00 chapters — list, dict, set, tuple, the collections module (deque, Counter, defaultdict, OrderedDict, namedtuple), and heapq/bisect — as runnable Python, grouped by data-structure family instead of write order."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031826"
---

# Core Data Structures Practice — Full Source Catalogue

This is the raw practice corpus behind six chapters in this book part: [[04-1-lists|4 — Lists]],
[[05-1-tuples|5 — Tuples]], [[06-1-dictionaries|6 — Dictionaries]], [[07-1-sets|7 — Sets]],
[[08-1-collections-module|8 — Collections Module]], and
[[09-1-heapq-and-bisect|9 — heapq & bisect]]. It predates the dedicated per-topic practice files
those chapters now each have of their own (`4-lists/practice-lists.md`,
`5-tuples/practice-tuples.md`, `6-dictionaries/practice-dicts.md`, `7-sets/practice-sets.md`,
`8-collections-module/practice-deques.md`) — this note keeps the earlier, broader drill set exactly
as written, just grouped by data-structure family rather than the order it was originally typed in.
None of it has been rewritten or bug-fixed here; this is a structural pass (frontmatter, headings,
grouping) only, not a correctness review.

---

## Core Data Structures: list, dict, set, tuple

The four built-in container types, each with its everyday method surface exercised directly.

### `list` — Dynamic Arrays

```python
def print_list():
  # **Use for:** Mutable sequences, dynamic arrays, stacks, queues.
  # Dynamic arrays that can grow/shrink. Support indexing/slicing.

  print("\nlist() example:")
  arr = [1, 2, 3]
  print("List:", arr)  # [1, 2, 3]

  arr.append(4)       # Add to the end
  print("After append(4):", arr)  # [1, 2, 3, 4]

  arr.insert(0, 0)   # Insert at index 0
  print("After insert(0, 0):", arr)  # [0, 1, 2, 3, 4]

  arr.pop()          # Remove and return the last element
  print("After pop():", arr)  # [0, 1, 2, 3]

  lst = [1, 2, 3]
  lst.append(4)          # [1, 2, 3, 4]
  lst.extend([5, 6])     # [1, 2, 3, 4, 5, 6]
  lst.insert(0, 0)       # [0, 1, 2, 3, 4, 5, 6]
  lst.remove(3)          # Remove first occurrence of 3
  lst.pop()              # Remove & return last element
  lst.pop(0)             # Remove & return element at index 0
  lst.index(2)           # Index of first 2
  lst.count(2)           # Count occurrences of 2
  lst.sort()             # Sort ascending, in-place
  lst.sort(reverse=True) # Sort descending, in-place
  lst.reverse()          # Reverse in-place
  lst.clear()            # []
  lst2 = lst.copy()      # Shallow copy
```

### `dict` — Key-Value Mapping

```python
def print_dict():
  # **Use for:** Key-value pairs, fast lookups, grouping.
  # Unordered (Python 3.6+ maintains insertion order), mutable mapping of keys to values.

  print("\ndict() example:")
  d = {'apple': 1, 'banana': 2, 'orange': 3}
  print("Dictionary:", d)  # {'apple': 1, 'banana': 2, 'orange': 3}

  print("Accessing value for 'banana':", d['banana'])  # 2

  d['grape'] = 4  # Add new key-value pair
  print("After adding 'grape':", d)  # {'apple': 1, 'banana': 2, 'orange': 3, 'grape': 4}

  d = {'a': 1, 'b': 2}
  d['a']                  # 1
  d.get('a')              # 1
  d.get('c', 0)           # 0 (default, no KeyError)
  d['c'] = 3              # Set value
  d.update({'d': 4})      # Merge another dict
  d.pop('c')              # Remove and return value
  d.pop('x', -1)          # Remove with default
  d.popitem()             # Remove and return last (key, value)
  list(d.keys())          # ['a', 'b']
  list(d.values())        # [1, 2]
  list(d.items())         # [('a', 1), ('b', 2)]
  'a' in d                # True
  d2 = d.copy()           # Shallow copy
```

### `set` — Unique Elements & Set Operations

```python
def print_set():
  # **Use for:** Unique elements, set operations, membership testing.
  # Unordered collection of unique elements. Supports mathematical set operations.

  print("\nset() example:")
  s = {1, 2, 3}
  print("Set:", s)  # {1, 2, 3}

  s.add(4)         # Add an element
  print("After add(4):", s)  # {1, 2, 3, 4}

  s.remove(2)      # Remove an element (raises KeyError if not found)
  print("After remove(2):", s)  # {1, 3, 4}

  s = {1, 2, 3}
  s.add(4)       # {1, 2, 3, 4}
  s.remove(2)    # Removes 2; raises KeyError if missing
  s.discard(5)   # Removes if present; no error if missing
  s.pop()        # Remove arbitrary element
  s.clear()      # set()
  s2 = s.copy()  # Shallow copy

  s1, s2 = {1, 2, 3}, {3, 4, 5}
  s1 | s2          # Union:                {1, 2, 3, 4, 5}
  s1 & s2          # Intersection:         {3}
  s1 - s2          # Difference:           {1, 2}
  s1 ^ s2          # Symmetric difference: {1, 2, 4, 5}
  {1, 2} <= s1     # Subset: True
  s1 >= {1, 2}     # Superset: True
```

### `tuple` — Immutable Sequences

```python
def print_tuple():
  # **Use for:** Immutable sequences, multiple return values, dict keys.
  # Like a list, but immutable. Can be used as dict keys or set elements.

  print("\ntuple() example:")
  t = (1, 2, 3)
  print("Tuple:", t)  # (1, 2, 3)

  # Tuples can be unpacked into variables.
  a, b, c = t
  print("Unpacked values:", a, b, c)  # Unpacked values: 1 2 3

  # Tuples can be used as dict keys because they are immutable.
  d = {t: "This is a tuple key"}
  print("Dictionary with tuple key:", d)  # {(1, 2, 3): 'This is a tuple key'}
  print("Accessing value with tuple key:", d[t])  # This is a tuple key
```

---

## The `collections` Module: deque, Counter, defaultdict, OrderedDict, namedtuple

Five purpose-built specializations of `list`/`dict` from the standard library, each removing a
specific piece of boilerplate.

### `deque` — Double-Ended Queue

```python
def print_deque():
  # **Use for:** Queue/Stack, sliding window, BFS traversal.
  # O(1) append/pop from both ends vs O(n) for list.insert(0).
  from collections import deque

  print("\ndeque() example:")
  d = deque([1, 2, 3])
  print("Initial deque:", d)

  d.append(4)
  print("After append(4):", d)           # deque([1, 2, 3, 4])

  d.appendleft(0)
  print("After appendleft(0):", d)       # deque([0, 1, 2, 3, 4])

  print(f"d.pop(): {d.pop()}")
  print("After pop():", d)               # deque([0, 1, 2, 3])

  print(f"d.popleft(): {d.popleft()}")
  print("After popleft():", d)           # deque([1, 2, 3])

  d.extend([4, 5, 6])
  print("After extend([4, 5, 6]):", d)   # deque([1, 2, 3, 4, 5, 6])

  d.extendleft([0, -1])                  # note: each element is prepended, so order reverses
  print("After extendleft([0, -1]):", d) # deque([-1, 0, 1, 2, 3, 4, 5, 6])

  d.rotate(2)
  print("After rotate(2):", d)           # deque([5, 6, -1, 0, 1, 2, 3, 4])

  # Quick reference
  d = deque()
  d.append(1)                    # Add to right
  d.appendleft(0)                # Add to left
  d.pop()                        # Remove from right
  d.popleft()                    # Remove from left
  d.extend([2, 3])               # Extend right
  d.extendleft([0])              # Extend left (reversed)
  d.rotate(1)                    # Rotate right by 1
  d.rotate(-1)                   # Rotate left by 1
  deque([1, 2, 3], maxlen=2)     # Fixed-size sliding window: deque([2, 3])
```

### `Counter` — Frequency Counting

```python
def print_counter():
  # **Use for:** Frequency counting, anagram problems, most common elements.
  # Counter(iterable) is a dict subclass for counting hashable objects.
  from collections import Counter

  print("\nCounter() example:")
  arr = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple']
  print("Array:", arr)

  c = Counter(arr)
  print("Counter:", c)                              # Counter({'apple': 3, 'banana': 2, 'orange': 1})
  print("most_common(2):", c.most_common(2))        # [('apple', 3), ('banana', 2)]
  print("c['apple']:", c['apple'])                  # 3
  print("c['grape']:", c['grape'])                  # 0 — missing keys return 0, not KeyError
  print("list(c.elements()):", list(c.elements()))  # each element repeated by its count

  c.update(['banana', 'grape'])
  print("After update(['banana', 'grape']):", c)

  c.subtract(['apple', 'orange'])
  print("After subtract(['apple', 'orange']):", c)

  c1 = Counter(['a', 'b', 'c', 'a'])
  c2 = Counter(['b', 'c', 'd'])
  print("\nCounter arithmetic:")
  print("c1 + c2:", list((c1 + c2).elements()))  # union of counts
  print("c1 - c2:", list((c1 - c2).elements()))  # positive-only difference
  print("c1 & c2:", list((c1 & c2).elements()))  # min of counts
  print("c1 | c2:", list((c1 | c2).elements()))  # max of counts
```

### `defaultdict` — Auto-Vivifying Dict

```python
def print_defaultdict():
  # **Use for:** Grouping, building graphs, avoiding KeyError boilerplate.
  # Never raises KeyError — creates the default value on first access.
  from collections import defaultdict

  print("\ndefaultdict() example:")
  d = defaultdict(int)   # int() returns 0
  d['apple'] += 1
  d['banana'] += 2
  print("After increments:", d)
  print("Missing key 'orange':", d['orange'])  # creates key with value 0

  # Grouping by first letter
  words = ['apple', 'avocado', 'banana', 'blueberry', 'cherry']
  groups = defaultdict(list)
  for word in words:
    groups[word[0]].append(word)
  print("Grouped by first letter:", dict(groups))

  # Graph as adjacency list
  graph = defaultdict(set)
  for u, v in [(1, 2), (1, 3), (2, 3)]:
    graph[u].add(v)
    graph[v].add(u)
  print("Graph adjacency list:", dict(graph))
```

### `OrderedDict` — Order-Preserving Dict with Move Semantics

```python
def print_ordereddict():
  # **Use for:** LRU Cache implementation, ordered-dict-specific pop semantics.
  # Maintains insertion order; adds move_to_end / directional popitem.
  from collections import OrderedDict

  print("\nOrderedDict() example:")
  d = OrderedDict()
  d['apple'] = 1
  d['banana'] = 2
  d['orange'] = 3
  print("Keys in insertion order:", list(d.keys()))  # ['apple', 'banana', 'orange']

  d['banana'] = 20              # Update does not change position
  d.move_to_end('apple')        # Move to last
  d.move_to_end('banana', last=False)  # Move to first
  print("After moves:", list(d.keys()))

  d.popitem()            # Remove last (LIFO)
  d.popitem(last=False)  # Remove first (FIFO)
  print("After two popitem()s:", d)
```

### `namedtuple` — Lightweight Immutable Records

```python
def print_namedtuple():
  # **Use for:** Lightweight records, multiple return values, immutable dict keys.
  # Like a class but immutable, with zero-boilerplate field access.
  from collections import namedtuple

  print("\nnamedtuple() example:")
  Point = namedtuple('Point', ['x', 'y'])
  p1 = Point(1, 2)
  p2 = Point(3, 4)

  print("p1:", p1)          # Point(x=1, y=2)
  print("p1.x:", p1.x)      # field access
  print("p1[0]:", p1[0])    # index access (behaves like a tuple)

  Rectangle = namedtuple('Rectangle', ['top_left', 'bottom_right'])
  rect = Rectangle(top_left=p1, bottom_right=p2)
  print("Rectangle:", rect)
  print("rect.top_left:", rect.top_left)
```

---

## Algorithms & Search: heapq and bisect

The two standard-library modules this directory's own chapter,
[[09-1-heapq-and-bisect|9 — heapq & bisect]], covers in depth — this is just the quick-reference
drill form of the same API surface.

### `heapq` — Priority Queue / Min-Heap

```python
def print_heapq():
  # **Use for:** Priority queue, K largest/smallest, merge K sorted, Dijkstra's, top-K problems.
  # Implements a min-heap; negate values for max-heap behaviour.
  import heapq

  print("\nheapq() example:")
  arr = [5, 3, 8, 1, 2]
  print("Original array:", arr)

  heapq.heapify(arr)
  print("After heapify:", arr)   # smallest element at index 0

  heapq.heappush(arr, 0)
  print("After heappush(0):", arr)

  smallest = heapq.heappop(arr)
  print("heappop():", smallest)
  print("After heappop:", arr)

  print("nlargest(3):", heapq.nlargest(3, arr))
  print("nsmallest(2):", heapq.nsmallest(2, arr))

  # Max-heap trick — negate values
  max_heap = []
  for val in [3, 1, 4, 1, 5]:
    heapq.heappush(max_heap, -val)
  max_val = -heapq.heappop(max_heap)
  print("Max-heap max:", max_val)  # 5

  # Quick reference
  h = []
  heapq.heappush(h, 3)           # Push
  heapq.heappop(h)               # Pop smallest
  heapq.heappushpop(h, 4)        # Push then pop smallest (works on empty heap too)
  heapq.heapreplace(h, 5)        # Pop then push (h must be non-empty)
  # h[0]                         # Peek smallest (no removal)
```

### `bisect` — Binary Search & Sorted Insertion

```python
def print_bisect():
  # **Use for:** Binary search, maintaining sorted lists, range queries.
  # Array must be sorted before use.
  import bisect

  print("\nbisect() example:")
  arr = [1, 3, 5, 7, 9]
  print("Sorted array:", arr)

  print("bisect(arr, 4):", bisect.bisect(arr, 4))              # 2 — insertion point to keep sorted
  print("bisect_left(arr, 5):", bisect.bisect_left(arr, 5))    # 2 — leftmost slot for 5
  print("bisect_right(arr, 5):", bisect.bisect_right(arr, 5))  # 3 — rightmost slot for 5

  bisect.insort(arr, 4)  # insert 4 in sorted order, in-place
  print("After insort(arr, 4):", arr)  # [1, 3, 4, 5, 7, 9]

  # Binary search existence check
  target = 5
  pos = bisect.bisect_left(arr, target)
  found = pos < len(arr) and arr[pos] == target
  print(f"Binary search for {target}: found={found}, index={pos}")
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
