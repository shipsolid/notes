---
title: "1 — Arrays"
description: "Static vs. dynamic arrays, why contiguous memory buys O(1) random access, row-major layout for multi-dimensional arrays, the complexity of every core operation, and where list, array, and numpy diverge."
tags: ["data-structures-algorithms","arrays-strings","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-6"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
---

# 1 — Arrays

Every interview loop touches arrays before it touches anything else, and most candidates can recite
"O(1) access, O(n) insert in the middle" without being able to derive either one. That gap matters,
because two pointers, sliding window, prefix sum, and binary search — the four patterns that carry
most of the rest of this book — aren't separate tricks to memorize. They're four different ways of
spending one physical fact about how an array sits in memory. Get that fact solid here and the "why
does this pattern even work" question that trips people up later answers itself.

---

## Static vs. Dynamic Arrays

A **static array** is a fixed-size, contiguous block of memory allocated once, up front:
`int arr[10]` in C reserves exactly 10 `int`-sized slots and never grows. Ask for the 11th element
and there's no resize path — undefined behavior or a compiler error, not a bigger array.

Python's `list` is not that. It's a **dynamic array** — it looks like it grows for free, but
underneath it's still a fixed-capacity contiguous buffer that gets replaced wholesale once it runs
out of room. `list.append()` writes to the next free slot when capacity allows (O(1)) or triggers a
full reallocate-and-copy to a larger buffer when it doesn't (O(n)). This is the exact doubling
argument from [[02-asymptotic-analysis]] — geometric over-allocation is what turns "occasionally
O(n)" into "amortized O(1) forever." You can watch the resizing happen:

```python
import sys

lst = []
prev_size = sys.getsizeof(lst)
for i in range(15):
    lst.append(i)
    size = sys.getsizeof(lst)
    if size != prev_size:
        print(f"len={len(lst):>2}  bytes={size}  <- reallocated")
    prev_size = size
```

The byte count jumps in irregular chunks, not one pointer-width at a time — CPython over-allocates
so the next several appends are free. The exact growth factor is CPython-specific (roughly 1.125x
for large lists, not a clean 2x), but the _shape_ of the argument — over-allocate, amortize the copy
— is universal to every dynamic array in every language.

---

## Why Contiguous Memory Matters

Contiguous means every element sits at a predictable offset from the start of the block, which is
what makes random access O(1) instead of O(n). Indexing is arithmetic, not search:

```
address(i) = base_address + i * element_size
```

One multiplication and one addition, computed directly by hardware — no traversal, no comparisons.
Compare that to a linked list: `element_size` and `base_address` tell you nothing about where
element `i` lives, because there is no formula — you walk `i` pointers to find out.

This is the one property nearly everything in this book stands on. **Two pointers** and **sliding
window** only work because moving or converging a pointer, or expanding/shrinking a window's edges,
is an O(1) step every time — the same reason indexing is O(1). **Prefix sum** precomputes running
totals so any range-sum query collapses to a single O(1) lookup (`prefix[j] - prefix[i-1]`) instead
of an O(n) re-scan. **Binary search** only works because jumping straight to a range's midpoint is
an O(1) index operation — on a structure where indexing isn't O(1) (a linked list), it degrades,
because _reaching_ the midpoint costs O(n) even though the _decision_ there is still O(1). Every one
of these techniques is spending the same currency: O(1) random access, purchased by contiguous
memory.

---

## Multi-Dimensional Arrays and Memory Layout

There's no such thing as "2D memory" — RAM is one contiguous address space, so a 2D array has to be
flattened into it, and the flattening scheme decides which loop order is fast. **Row-major layout**
(C, Python, NumPy by default) stores an entire row before moving to the next: for an `n_cols`-wide
grid, element `[row][col]` sits at `base + (row * n_cols + col) * element_size`, so walking across a
row touches consecutive addresses while walking down a column jumps `n_cols * element_size` bytes
every single step. NumPy's `.strides` makes the asymmetry concrete, and the slowdown is measurable,
not theoretical:

```python
import time
import numpy as np

grid = np.arange(12, dtype=np.int64).reshape(3, 4)
print(grid.strides)  # (32, 8) -- 32 bytes to drop a row, 8 to move one column

n = 4000
a = np.random.rand(n, n)

start = time.perf_counter()
total = sum(a[i, j] for i in range(n) for j in range(n))   # row-major order: fast
print("row-wise:", time.perf_counter() - start)

start = time.perf_counter()
total = sum(a[i, j] for j in range(n) for i in range(n))   # column-major order: slow
print("column-wise:", time.perf_counter() - start)
```

The CPU pulls memory into cache in 64-byte lines: row-wise traversal reads a value already sitting
in the cache line just fetched, while column-wise traversal reads a value 32+ bytes away, forcing a
fresh cache-line fetch on nearly every access. On most machines the column-wise version runs
noticeably slower — often 2-3x — from cache misses alone, with the identical arithmetic. When a
problem lets you choose traversal order on a grid (matrix rotation, image processing, DP tables),
row-wise is the default that respects the hardware, not just a style preference.

---

## Core Operations and Their Complexity

Every entry in this table traces back to the same two facts: indexing is arithmetic (O(1)), and
preserving contiguity after a middle insert or delete means shifting every element on one side of
the gap.

| Operation                    | Complexity     | Why                                                                 |
| ---------------------------- | -------------- | ------------------------------------------------------------------- |
| Access by index              | O(1)           | Direct address arithmetic — no traversal                            |
| Search, unsorted             | O(n)           | No ordering to exploit — worst case checks every element            |
| Search, sorted               | O(log n)       | Binary search halves the candidate range each comparison            |
| Insert / delete at end       | O(1) amortized | No shift needed; dynamic arrays occasionally resize (O(n))          |
| Insert / delete in middle    | O(n)           | Every element after the gap must shift to keep the array contiguous |
| Insert / delete at beginning | O(n)           | Worst case of "middle" — every remaining element shifts one slot    |

The front-insert case is worth internalizing on its own: `list.insert(0, x)` in Python isn't a
special case of some other operation, it's the worst case of "insert in the middle" pushed to the
very edge of the array — everything shifts, one slot each. If a problem calls for frequent front
insertion, that's a signal the array is the wrong structure and a deque belongs there instead.

---

## Python's Array-Like Options

Three options exist under "array" in Python, trading off in a fixed order: `list` is the default — a
dynamic array of _pointers_ to arbitrary objects, which is why one list can mix an `int`, a `str`,
and a `dict`, at the cost of a pointer-indirection hop for every element. The `array` module
tightens that up: raw C-typed values (`'i'`, `'d'`, etc.) packed contiguously with no per-element
object overhead — a real memory win, though arithmetic on it still runs one Python-level operation
at a time. `numpy.ndarray` is the one that actually matters for numeric work: contiguous,
homogeneous, fixed-dtype storage with strides (as above), plus vectorized C-level operations that
skip the Python interpreter loop entirely — the real reason `numpy` is fast. Default to `list`
unless a problem is explicitly numeric and large enough that packed storage or vectorization changes
the outcome.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
