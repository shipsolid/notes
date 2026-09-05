---
title: "7 — Fenwick Trees (BIT)"
description: "Binary Indexed Tree for O(log n) prefix-sum queries and point updates with a much smaller constant than a segment tree."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-35"
relations:
  - slug: data-structures-algorithms/05-trees/06-segment-trees/06-segment-trees
    kind: related
  - slug: data-structures-algorithms/11-bit-manipulation/01-bitwise-operations/01-bitwise-operations
    kind: related
---

# 7 — Fenwick Trees (BIT)

Segment trees pay for generality: recursive build, roughly `4n` of array space, and a combining
function that could just as easily be min, max, or gcd as sum — because the tree doesn't know or
care which associative operation it's holding together. Most interview problems asking for a mutable
range sum never touch that generality; they ask for exactly one operation, and paying for the
machinery that would also handle min, max, and gcd is buying insurance nobody collects on. A Fenwick
tree — Binary Indexed Tree, or BIT — is what's left once every bit of that machinery is stripped
out: `n + 1` array slots, no recursion, no node objects, and the entire update/query logic reducible
to two `while` loops built on a single bit trick. What replaces the tree's explicit parent/child
pointers is stranger and more elegant — the tree structure is encoded directly in the binary
representation of the array indices themselves.

---

## The Specialization: Give Up Generality, Gain Simplicity

[[06-segment-trees|Chapter 6, Segment Trees]] built a structure that answers "combine everything in
`[l, r]`" for _any_ associative operation, by storing roughly `4n` nodes in an implicit binary tree
and recombining `O(log n)` of them per query. That generality has a real price: two to four arrays'
worth of overhead relative to the input, and every operation — build, query, update — written as
recursion over tree nodes that don't correspond to anything in the original array.

A Fenwick tree makes a narrower bet. It gives up the ability to combine arbitrary operations and
keeps only the ones that are **invertible under prefix aggregation** — where knowing `prefix(r)` and
`prefix(l - 1)` is enough to reconstruct `range(l, r)` by subtraction. Sum qualifies immediately:
`sum(l..r) = prefix(r) - prefix(l - 1)`, the exact identity
[[05-prefix-sum-and-difference-arrays|Chapter 5's prefix-sum chapter]] built for a static array. XOR
qualifies too — XOR is its own inverse. Product qualifies as long as zero never appears, since
division undoes multiplication. Min and max do **not** qualify — a point that matters enough to get
its own closing section below, because it's the precise, mechanical reason a Fenwick tree can't
replace a segment tree everywhere a segment tree is used.

In exchange for that narrower operation set, the tree disappears as a data structure. There's no
node type, no left/right child pointers, no recursive build. There's a single array of size `n + 1`
and two loops, each doing at most `O(log n)` iterations, built on one bit-manipulation identity.

---

## The Lowbit Trick: i & -i

Every Fenwick operation reduces to computing `i & -i` — the value of the lowest set bit of `i`,
usually called `lowbit(i)`. It's worth deriving why this works rather than memorizing it, because
the derivation is also the reason the whole structure holds together.

Two's complement defines `-i` as `~i + 1` — flip every bit of `i`, then add one. Write `i` as some
arbitrary high bits `X`, followed by a `1`, followed by `k` trailing zeros: `i = X 1 0…0` (`k`
zeros). Flipping every bit gives `~i = X̄ 0 1…1` (`k` ones), where `X̄` is `X` with every bit flipped.
Adding `1` to a number ending in `k` ones carries all the way through them, turning `1…1` (`k` ones)
into `0…0` (`k` zeros) and bumping the bit just above into a `1`: `-i = X̄ 1 0…0` (the same `k`
trailing zeros).

Line the two up and AND them bit by bit:

```
 i  =  X   1   0 0 … 0     (k zeros)
-i  =  X̄   1   0 0 … 0     (k zeros)
      -----------------
i&-i=  0   1   0 0 … 0   =  2^k
```

Every bit in `X` is ANDed with its own complement in `X̄`, and `b & ~b` is always `0` — the high bits
cancel out completely, regardless of what they actually are. The bit at position `k` is `1 & 1 = 1`.
Everything below it is `0 & 0 = 0`. What survives is exactly one bit: the lowest set bit of `i`, as
a value — `lowbit(i) = i & -i = 2^k`.

**The structural insight:** in a Fenwick array, index `i` is responsible for the sum of a contiguous
range of the original array whose length is exactly `lowbit(i)`, ending at `i` — the range
`[i - lowbit(i) + 1, i]`.

| `i` | binary  | `lowbit(i)` | range covered |
| --- | ------- | ----------- | ------------- |
| 1   | `00001` | 1           | `[1, 1]`      |
| 2   | `00010` | 2           | `[1, 2]`      |
| 3   | `00011` | 1           | `[3, 3]`      |
| 4   | `00100` | 4           | `[1, 4]`      |
| 5   | `00101` | 1           | `[5, 5]`      |
| 6   | `00110` | 2           | `[5, 6]`      |
| 7   | `00111` | 1           | `[7, 7]`      |
| 8   | `01000` | 8           | `[1, 8]`      |
| 9   | `01001` | 1           | `[9, 9]`      |
| 10  | `01010` | 2           | `[9, 10]`     |
| 11  | `01011` | 1           | `[11, 11]`    |
| 12  | `01100` | 4           | `[9, 12]`     |
| 16  | `10000` | 16          | `[1, 16]`     |

Index 12 (`1100`, `lowbit = 4`) covers a range of exactly 4 elements — `[9, 12]`. Index 8 (`1000`,
`lowbit = 8`) covers a range of exactly 8 elements — `[1, 8]`. Nothing was configured to make that
true; it falls straight out of how two's-complement negation behaves. This is why a Fenwick tree
needs no parent/child pointers stored anywhere — "which range does index `i` own" and "which index
is `i`'s parent" are both pure functions of `i`'s bit pattern, recomputed in `O(1)` on demand
instead of stored. See [[01-bitwise-operations|Chapter 1, Bitwise Operations]] for the
two's-complement mechanics this trick leans on, generalized past this one identity.

Position `0` is deliberately unusable — `lowbit(0) = 0 & -0 = 0`, which would either loop forever or
silently do nothing depending on which loop hit it — so Fenwick trees are conventionally 1-indexed,
with index `0` left as unused padding. That's the same reservation the prefix-sum chapter made with
`prefix[0] = 0`: not wasted space, a boundary condition purchased in advance.

---

## Update: O(log n)

Adding `delta` to the array's position `i` invalidates the running sum stored at `i` — and at every
index whose covered range includes `i`. Finding "the next index whose range includes `i`" is one bit
operation: `i += i & (-i)`.

```python
def update(self, i: int, delta: int) -> None:
    """Add delta to the value at position i (1-indexed). O(log n)."""
    while i <= self.n:
        self.tree[i] += delta
        i += i & (-i)   # jump to the next index whose range includes i
```

Why does `i += lowbit(i)` land on an index whose range contains `i`? Adding `lowbit(i)` clears `i`'s
lowest set bit and carries into the bit above it — the same two's-complement arithmetic as the
derivation above, run forward instead of backward. The resulting index's covered range starts at or
before `i` and always extends past it, because a Fenwick index's range length roughly doubles every
time you climb one level: index 3 (range length 1) jumps to index 4 (range length 4), which jumps to
index 8 (range length 8), and so on. Each jump strictly increases `i`, and `i` can only be pushed
past `n` after at most `⌊log₂ n⌋ + 1` such jumps — the update touches `O(log n)` array slots, never
more, regardless of where `i` started.

---

## Prefix Query: O(log n)

`prefix_sum(i)` — the sum of everything from position `1` through `i` — is the mirror image of
update: instead of climbing to wider ranges, it walks backward through the ranges that partition
`[1, i]` into `O(log n)` disjoint pieces.

```python
def prefix_sum(self, i: int) -> int:
    """Sum of positions [1, i] (1-indexed). O(log n)."""
    total = 0
    while i > 0:
        total += self.tree[i]
        i -= i & (-i)   # jump to the previous range not yet counted
    return total
```

Index `i`'s own range is `[i - lowbit(i) + 1, i]` — it ends exactly at `i`. Subtracting `lowbit(i)`
this time produces no carry at all: subtracting a power of two from a number that has exactly that
bit set just clears the bit, it doesn't ripple into neighboring bits. That clean subtraction lands
exactly on `i - lowbit(i)`, the index one position before the range just counted began. That index's
own range, in turn, ends exactly there. Repeat until `i` reaches `0`, having visited a strictly
decreasing, non-overlapping sequence of ranges that together tile `[1, original i]` exactly once
each — the same `O(log n)` bound as update, walked in reverse.

---

## Full Implementation

```python
class FenwickTree:
    """1-indexed Binary Indexed Tree over a fixed-size universe of n positions.

    Supports point update and prefix/range sum in O(log n). Position 0 is
    reserved padding — see the lowbit note above for why 0 can't be a real
    index.
    """

    def __init__(self, n: int) -> None:
        self.n = n
        self.tree = [0] * (n + 1)

    def update(self, i: int, delta: int) -> None:
        """Add delta to the value at position i (1-indexed). O(log n)."""
        while i <= self.n:
            self.tree[i] += delta
            i += i & (-i)

    def prefix_sum(self, i: int) -> int:
        """Sum of positions [1, i] (1-indexed). O(log n)."""
        total = 0
        while i > 0:
            total += self.tree[i]
            i -= i & (-i)
        return total

    def range_sum(self, l: int, r: int) -> int:
        """Sum of positions [l, r] inclusive (1-indexed). O(log n).

        Same subtraction identity as Part 02 Chapter 5's prefix-sum chapter —
        prefix(r) - prefix(l - 1) — now safe to call after mutations, because
        each prefix_sum call re-derives its answer from current tree state
        instead of a stale precomputed array.
        """
        return self.prefix_sum(r) - self.prefix_sum(l - 1)

    @classmethod
    def from_array(cls, arr: list[int]) -> "FenwickTree":
        """Build from a 0-indexed array via n point updates. O(n log n)."""
        fenwick = cls(len(arr))
        for idx, val in enumerate(arr):
            fenwick.update(idx + 1, val)   # shift to 1-indexed
        return fenwick

    @classmethod
    def from_array_fast(cls, arr: list[int]) -> "FenwickTree":
        """Build in O(n): copy values in, then push each slot's running total
        to the next index whose range subsumes it — one pass, no repeated
        climbs from scratch the way from_array's n separate updates do.
        """
        n = len(arr)
        fenwick = cls(n)
        fenwick.tree[1:] = list(arr)
        for i in range(1, n + 1):
            parent = i + (i & (-i))
            if parent <= n:
                fenwick.tree[parent] += fenwick.tree[i]
        return fenwick
```

`from_array` is the version worth writing from memory in an interview — `n` calls to `update`, each
`O(log n)`, for `O(n log n)` total. `from_array_fast` is the production-grade upgrade: since every
index's final value only needs to be pushed to _one_ place (the next index whose range contains it),
one linear pass suffices, and the build drops to `O(n)` — the same complexity a segment tree's
bottom-up array build gets, without recursion either way.

A quick self-check, runnable as-is, exercising every method above against a brute-force array:

```python
if __name__ == "__main__":
    arr = [3, 2, -1, 6, 5, 4, -3, 3]
    fenwick = FenwickTree.from_array(arr)
    assert fenwick.tree == FenwickTree.from_array_fast(arr).tree

    assert fenwick.prefix_sum(6) == sum(arr[:6]) == 19
    assert fenwick.range_sum(3, 6) == sum(arr[2:6]) == 14

    fenwick.update(3, 4)          # arr[2] (0-indexed) goes from -1 to 3
    arr[2] += 4
    assert fenwick.prefix_sum(6) == sum(arr[:6]) == 23
    assert fenwick.range_sum(3, 6) == sum(arr[2:6]) == 18
    print("all checks passed")
```

---

## Worked Trace

Take `arr = [3, 2, -1, 6, 5, 4, -3, 3]` (1-indexed positions `1..8`, `n = 8`). Each `tree[i]` holds
the sum of its covered range from the lowbit table above:

| `i`       | 1       | 2       | 3       | 4       | 5       | 6       | 7       | 8       |
| --------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| range     | `[1,1]` | `[1,2]` | `[3,3]` | `[1,4]` | `[5,5]` | `[5,6]` | `[7,7]` | `[1,8]` |
| `tree[i]` | 3       | 5       | -1      | 10      | 5       | 9       | -3      | 19      |

**Update — `update(3, +4)`** (position 3, currently `-1`, gains `4`):

| step | `i` | action         | `tree[i]` before → after | next `i = i + lowbit(i)` |
| ---- | --- | -------------- | ------------------------ | ------------------------ |
| 1    | 3   | `tree[3] += 4` | `-1 → 3`                 | `3 + 1 = 4`              |
| 2    | 4   | `tree[4] += 4` | `10 → 14`                | `4 + 4 = 8`              |
| 3    | 8   | `tree[8] += 4` | `19 → 23`                | `8 + 8 = 16 > n` — stop  |

Three jumps for `n = 8` (`⌊log₂ 8⌋ + 1 = 4` is the ceiling, so this is within bound). Indices 3, 4,
and 8 are exactly the ones whose covered ranges include position 3 — `[3,3]`, `[1,4]`, and `[1,8]` —
confirmed by the lowbit table above.

**Query — `prefix_sum(6)`**, after the update:

| step | `i` | `total += tree[i]` | running total | next `i = i - lowbit(i)` |
| ---- | --- | ------------------ | ------------- | ------------------------ |
| 1    | 6   | `+= 9`             | 9             | `6 - 2 = 4`              |
| 2    | 4   | `+= 14`            | 23            | `4 - 4 = 0` — stop       |

`prefix_sum(6) = 23`. Brute force on the updated array `[3, 2, 3, 6, 5, 4]` (positions 1–6):
`3+2+3+6+5+4 = 23` — matches.

**Range query — `range_sum(3, 6) = prefix_sum(6) - prefix_sum(2)`.** `prefix_sum(2)`: `i = 2`,
`total = tree[2] = 5`, `i -= lowbit(2) = 2 → i = 0`, stop; `prefix_sum(2) = 5`. So
`range_sum(3, 6) = 23 - 5 = 18`. Brute force on positions 3–6, `[3, 6, 5, 4]`: `3+6+5+4 = 18` —
matches. Both traces above were run against the implementation in the previous section, not computed
by hand and asserted to work.

---

## Fenwick vs. Segment Tree: When Each Wins

The concrete reason a Fenwick tree can do range-sum-query but not range-min-query is that its entire
mechanism rests on one identity: `range(l, r) = prefix(r) - prefix(l - 1)`. That identity only holds
when the combining operation has an inverse. Sum's inverse is subtraction, and subtraction is
unconditionally reversible — there's exactly one way to undo an addition. Min has no such inverse.
If `prefix_min(6) = 2` and `prefix_min(3) = 2` as well, subtracting tells you nothing about
`min(4, 5, 6)` — the `2` might have come from index 1, from index 4, or from both; once the minimum
is taken, the information about which element (or how many elements) produced it is gone,
permanently, and there's no operation that reconstructs it from two prefix results the way
subtraction reconstructs a sum. That's not a missing feature of Fenwick trees that a cleverer
variant could patch in — it's that the trick the whole structure depends on requires an invertible
operation, and "minimum of a set" simply isn't one. Max has the identical problem, for the identical
reason.

| Dimension            | Fenwick Tree (BIT)                                                                                        | Segment Tree                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Supported operations | Invertible / prefix-aggregable only — sum, XOR, product (no zero)                                         | Any associative operation — sum, min, max, gcd, custom combiners                                                   |
| Array size           | `n + 1`                                                                                                   | ~`4n` (recursive, safe bound) or `2n` (iterative bottom-up)                                                        |
| Structure            | Implicit — encoded in each index's bit pattern                                                            | Explicit — recursive binary tree, usually array-backed                                                             |
| Build                | `O(n log n)` naive (n updates); `O(n)` with the push-to-parent pass                                       | `O(n)`, always                                                                                                     |
| Point update         | `O(log n)`, one `while` loop, no recursion                                                                | `O(log n)`, recursive (or iterative bottom-up)                                                                     |
| Range query          | `O(log n)`, two prefix sums and a subtraction                                                             | `O(log n)`, recursive descent combining ≤ `2·log n` nodes                                                          |
| Range update         | Needs a second Fenwick tree (difference-array trick) for `O(log n)`                                       | Native, via lazy propagation                                                                                       |
| Code footprint       | ~15 lines, no recursion, no node type                                                                     | ~40–60 lines typically, recursive, explicit tree shape                                                             |
| Wins when            | Operation is sum-like and invertible; memory is tight; simplest-correct-thing-under-time-pressure matters | Operation isn't invertible (min, max, gcd); range updates at scale; several different combiners over the same data |

In an interview, the tell is almost always in the operation's name. "Range sum, point update" or
"range sum, range update" — reach for a Fenwick tree first; it's less code to get exactly right
under time pressure, and a BIT is exactly what an interviewer expects for that phrasing. The moment
the word is "minimum," "maximum," or "gcd," or the moment a single structure has to serve more than
one kind of query over the same data, that's a segment tree's problem to solve, not this one's.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
