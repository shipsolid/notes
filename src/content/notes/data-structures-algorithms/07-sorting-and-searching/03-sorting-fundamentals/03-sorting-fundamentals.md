---
title: "3 — Sorting Fundamentals"
description: "The four axes every sort gets judged on — stability, in-place vs. auxiliary space, adaptive vs. not, comparison-based vs. not — the Ω(n log n) comparison-sort lower bound proved by the decision-tree argument, Python's Timsort, and a trade-off preview of every algorithm the rest of this Part covers."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-51"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
---

# 3 — Sorting Fundamentals

Ask "which sorting algorithm should I use" in real code and the honest answer is always the same:
call `sorted()`. Python's built-in beats anything you'd write by hand, in every case that matters in
production. So why does the rest of this Part still spend six more chapters deriving quicksort,
merge sort, heap sort, counting sort, radix sort, and bucket sort from scratch? Because the point
was never to out-engineer the built-in — it's that every one of those algorithms is a different
answer to the same handful of design questions, and an interviewer's follow-up ("is that stable?"
"can you do it in-place?") is really asking whether you understand the trade-off you just made, not
whether you memorized a function name. This chapter is the vocabulary and the floor: the properties
every sort in this Part gets evaluated against, the hard limit comparison-based sorting cannot beat
no matter how cleverly it's written, and the one built-in that actually earns the credit those
properties were invented to describe.

---

## Properties: Stability, In-Place, Adaptive, Comparison-Based

Two algorithms can share an identical O(n log n) worst case and still be the wrong or right choice
for a given problem, purely on one of the four axes below. None of these are Big-O questions — all
four are orthogonal to time complexity, which is exactly why they get asked as follow-ups after the
complexity question is already answered.

### Stability

**A sort is stable if elements that compare equal retain their original relative order in the
output.** "Compare equal" means equal _under the key being sorted on_ — two elements can be entirely
different objects and still tie for this purpose, as long as the field you're sorting by matches.

This matters the moment you sort by one field but want ties broken by whatever order the data
arrived in — the single most common real case is a multi-key sort structured as successive
single-key sorts (see the Timsort section below for exactly that pattern). A stable sort lets a
later sort pass respect the ordering a previous pass already established for tied elements; an
unstable one is free to shuffle ties arbitrarily, silently discarding that ordering.

Concretely: stable-sorting a list of people by last name should preserve each person's original
position relative to anyone else sharing that last name.

```python
from dataclasses import dataclass

@dataclass
class Person:
    first: str
    last: str

people = [
    Person("Amit", "Singh"),   # index 0
    Person("Jane", "Doe"),     # index 1
    Person("Raj", "Singh"),    # index 2
    Person("Al", "Doe"),       # index 3
]

by_last_name = sorted(people, key=lambda p: p.last)
for p in by_last_name:
    print(p)
```

```
Person(first='Jane', last='Doe')
Person(first='Al', last='Doe')
Person(first='Amit', last='Singh')
Person(first='Raj', last='Singh')
```

Notice the two "Doe"s come out in their original relative order (index 1 before index 3), and so do
the two "Singh"s (index 0 before index 2) — the sort only had an opinion about last names;
everything else about ordering ties was inherited from the input, because Python's sort is
guaranteed stable. Not every algorithm gives you this for free: heap sort's extraction process and
the standard swap-based partitioning in quicksort routinely reorder equal elements as a side effect
of _how_ they move data, with no way to recover the original order afterward. Whether a given
algorithm is stable is a fact about its mechanics, not something you can bolt on afterward without
giving up something else (usually the in-place property below).

### In-Place vs. Not

**An algorithm is in-place if it needs only O(1) auxiliary space** — or O(log n) if that space is a
recursion stack for a shallow, balanced recursive implementation — **beyond the input array
itself.** This is the exact auxiliary-space distinction from
[[02-asymptotic-analysis|Part 01, Chapter 2]]: input space is what you were handed and isn't a
choice; auxiliary space is everything the algorithm allocates on top of it, and "space complexity"
always means the auxiliary kind. An in-place sort rearranges elements within the memory it already
occupies; a non-in-place one builds a second structure roughly the size of the input to do its work.

The canonical contrast, already set up in that chapter: in-place quicksort needs only an O(log n)
recursion stack (well-implemented, recursing on the smaller partition first to bound depth), while
merge sort needs a full O(n) auxiliary buffer to merge two sorted halves back together — identical
O(n log n) time, genuinely different space profile, and a real reason to pick one over the other
under a hard memory constraint rather than a purely academic one.

### Adaptive

**An algorithm is adaptive if it runs faster — structurally, not just luckily — on input that's
already partially sorted.** Adaptive doesn't mean "happens to do less work sometimes"; it means the
algorithm actively notices existing order and shortens its own work in response, rather than
performing the same fixed sequence of steps regardless of input arrangement.

Insertion sort is the clean example: its inner loop shifts an element left only as far as it needs
to, and stops the instant it finds the correct spot. On an already-sorted array that inner loop
never shifts anything, so the whole sort collapses to a single O(n) pass. Selection sort, by
contrast, is **not** adaptive — every pass scans the entire unsorted remainder looking for the
minimum, regardless of whether that remainder is already in order, so it costs the same O(n²)
whether the input is sorted, reverse-sorted, or shuffled.

Naive quicksort is the cautionary case: it isn't merely non-adaptive, it's actively pathological on
sorted input. [[02-asymptotic-analysis|Part 01, Chapter 2]] already derived why — always picking the
first or last element as pivot turns an already-sorted array into the exact input that produces
maximally unbalanced partitions, degrading from O(n log n) to O(n²) precisely _because_ the input
was sorted. That's "sensitive to existing order" in the worst possible direction, which is why
production implementations use randomized pivots rather than trusting average-case behavior on data
they don't control.

### Comparison-Based vs. Non-Comparison-Based

**A comparison-based sort learns everything it knows about relative order from one primitive:
comparing two elements with `<` (or an equivalent three-way comparator) and branching on the
result.** It never inspects _what_ a value actually is — only how it stacks up against another value
it's been handed. Quicksort, merge sort, heap sort, insertion sort, and Timsort are all
comparison-based: swap in any type with a working `<` — numbers, strings, custom objects with
`__lt__` — and the algorithm runs unmodified.

**A non-comparison-based sort exploits something extra and specific about the values themselves.**
Counting sort assumes the values are integers within a known, bounded range, and uses that range
directly as an array index instead of ever comparing two values to each other. Radix sort processes
values digit-by-digit (or byte-by-byte), using each digit as a bucket index. Bucket sort assumes the
values are roughly uniformly distributed over a known interval and uses that assumption to place
each value directly into an approximately correct bucket before doing a smaller sort within it. None
of these algorithms ever ask "is A less than B" as their fundamental operation — they ask "where
does this value's _content_ say it belongs," which is a strictly more powerful question to ask, but
only answerable when that extra structure is actually there to exploit. That distinction is exactly
why the lower bound in the next section applies to one category and not the other.

### Properties at a Glance

This table is a map for the rest of this Part, not a proof — each fact gets derived properly in that
algorithm's own chapter.

| Algorithm              | Stable? | In-Place?              | Adaptive?                   | Comparison-Based? |
| ---------------------- | ------- | ---------------------- | --------------------------- | ----------------- |
| Bubble sort            | Yes     | Yes — O(1)             | Yes (with early-exit flag)  | Yes               |
| Insertion sort         | Yes     | Yes — O(1)             | Yes (strongly)              | Yes               |
| Selection sort         | No¹     | Yes — O(1)             | No                          | Yes               |
| Quicksort (standard)   | No      | Yes — O(log n) stack   | No — pathological on sorted | Yes               |
| Merge sort             | Yes     | No — O(n) buffer       | No (vanilla version)        | Yes               |
| Heap sort              | No      | Yes — O(1)             | No                          | Yes               |
| **Timsort** (Python's) | Yes     | No — O(n) merge buffer | Yes (strongly)              | Yes               |
| Counting sort          | Yes     | No — O(n + k)          | N/A — depends on range k    | No                |
| Radix sort             | Yes     | No — O(n + k)          | N/A                         | No                |
| Bucket sort            | Yes²    | No — O(n + k)          | N/A                         | No²               |

¹ The standard swap-into-place implementation of selection sort is not stable — swapping the found
minimum into its final position can jump it past an equal element already sitting earlier in the
array. A stable variant exists (shift instead of swap) but gives up the O(1)-swap trick to get it.

² Bucket sort's stability and comparison-freedom both come with an asterisk: the _bucketing_ step is
non-comparison (it indexes by value, not by comparing pairs), but most implementations sort _within_
each bucket using a small comparison-based sort — commonly insertion sort. The classification refers
to how buckets are assigned, not to what happens once a value lands in one.

---

## The Comparison-Sort Lower Bound: Ω(n log n)

Every comparison-based sort in the table above — no matter how cleverly written — needs at least Ω(n
log n) comparisons in the worst case. This isn't an empirical observation about the algorithms that
happen to exist; it's a hard floor, provable independent of any specific algorithm, using nothing
but the fact that the algorithm is restricted to asking "is A less than B."

### The decision-tree model

Model any comparison-based sorting algorithm as a binary decision tree:

- **Every internal node is one comparison** between two elements — "is `a[i] < a[j]`?"
- **Every edge is one outcome** of that comparison (true or false), leading to whichever comparison
  the algorithm does next.
- **Every leaf is one fully-determined output** — a specific permutation of the input that the
  algorithm commits to once it has asked enough comparisons to be sure.

Running the algorithm on a specific input traces exactly one root-to-leaf path: each comparison's
outcome picks the next comparison, until the path bottoms out at a leaf naming the sorted order.

### Why the tree needs at least n! leaves

An input of n distinct elements has **n! possible orderings**, and a correct sorting algorithm has
to be able to produce _any_ of them, depending on which permutation it's handed. If two different
input permutations ever led to the same leaf, the algorithm would be claiming the same output order
is correct for two genuinely different starting arrangements — which means it would get at least one
of them wrong. So every one of the n! permutations needs its own leaf: **the tree must have at least
n! leaves.**

### Why n! leaves force height ≥ log₂(n!)

A binary tree of height h has at most 2^h leaves — every level below the root can at most double the
leaf count of the level above it. Turn that around: a tree with at least L leaves needs height at
least log₂(L). With L = n!:

```
height ≥ log₂(n!)
```

And height here isn't an abstract tree property — it's the **worst-case number of comparisons**, the
length of the longest root-to-leaf path the algorithm can be forced to walk on some adversarial
input.

### Why log₂(n!) = Θ(n log n)

Stirling's approximation gives n! ≈ √(2πn) · (n/e)ⁿ, so taking logs:

```
ln(n!) ≈ n·ln(n) − n + O(log n)
```

Converting to base 2 (dividing by ln 2, a constant factor that doesn't change the growth class):

```
log₂(n!) ≈ n·log₂(n) − n·log₂(e) + O(log n) = Θ(n log n)
```

The n·log₂(n) term dominates every other term as n grows, so **log₂(n!) is Θ(n log n)** — not just
bounded by it, but tightly matching it in both directions. Combined with the previous step:

```
worst-case comparisons ≥ height ≥ log₂(n!) = Θ(n log n)  →  worst case is Ω(n log n)
```

### Making it concrete: n = 3

For 3 elements there are 3! = 6 possible orderings, so the decision tree needs at least 6 leaves. A
binary tree needs height ≥ log₂(6) ≈ 2.58 to have 6 leaves — and since height has to be a whole
number of comparisons, that rounds up to **3**. This matches a well-known small-case fact: no
comparison-based algorithm can sort 3 arbitrary elements in fewer than 3 comparisons in the worst
case, and simple algorithms (insertion sort among them) actually achieve exactly 3.

The bound generalizes cleanly and checks out numerically for larger n too:

```python
import math

def min_comparisons(n: int) -> int:
    """Ceiling of log2(n!) — the decision-tree lower bound on worst-case comparisons."""
    return math.ceil(math.log2(math.factorial(n)))

for n in (3, 4, 5, 10, 20):
    print(n, math.factorial(n), min_comparisons(n))
```

```
3 6 3
4 24 5
5 120 7
10 3628800 22
20 2432902008176640000 62
```

### Why this is the whole point of this chapter

This bound is exactly why merge sort and heap sort — both O(n log n) in the worst case, both covered
later in this Part — are called **asymptotically optimal comparison sorts**: they're not just fast,
they've hit a floor that no comparison-based algorithm, however clever, can ever get under. Any
claim of a comparison-based sort beating O(n log n) in the worst case is a claim that beats a proven
lower bound — which means either the claim is wrong, or the algorithm secretly isn't purely
comparison-based.

And that second clause is exactly what's going on with counting sort, radix sort, and bucket sort,
all covered later in this Part. They achieve better-than-O(n log n) time (O(n + k), or O(d·(n + k))
for d digits), and they are **not violating this lower bound** — they're simply not playing by its
rules to begin with. The Ω(n log n) bound applies to algorithms restricted to learning order purely
through pairwise comparisons; counting sort, radix sort, and bucket sort all rely on an extra,
explicit assumption about the data (a bounded integer range, a fixed digit count, a known
distribution) to extract information a comparison could never give them directly. Take away that
assumption — sort arbitrary incomparable-except-by-`<` objects — and they stop applying entirely.
That's the trade every non-comparison sort makes: give up generality, buy a speed the lower bound
doesn't cover.

---

## Python's Built-In Sort: Timsort

`list.sort()` and `sorted()` are both implemented via **Timsort**, written by Tim Peters for CPython
in 2002 and later adopted by Java's `Collections.sort` / `Arrays.sort` for object arrays (Java's
primitive-array sorts still use a dual-pivot quicksort). Timsort is a hybrid of merge sort and
insertion sort, specifically engineered around one observation: real-world data is rarely random. It
tends to already contain **natural runs** — contiguous stretches that are already sorted ascending
or descending — and a sort that notices and exploits those runs can do dramatically less work than
one that treats every input as an adversarial shuffle.

**How it works, at a level worth knowing:** Timsort scans the array for naturally-occurring
ascending or descending runs (reversing descending ones in place, which is O(run length)). Runs
shorter than a computed threshold (`minrun`, typically between 32 and 64) get extended up to that
length using binary insertion sort — insertion sort is fast on nearly-sorted small inputs, which is
exactly what a short run is. Those runs are then merged pairwise using the same balanced-merge
discipline as merge sort, with a stack-based invariant that keeps merges roughly balanced in size,
plus an optimization called _galloping mode_ that speeds up merging when one run keeps "winning"
many elements in a row.

**The properties this buys:**

- **Adaptive** — a single already-sorted (or single reverse-sorted) input is detected as one giant
  natural run and finished in O(n), the best case. Partially-sorted input with a handful of long
  runs merges far faster than random data with the same length.
- **Stable** — a deliberate design choice, not an accident of the merge step. Python's sort is used
  constantly for multi-key sorts structured as _successive single-key passes_: sort by the
  least-significant key first, then stable-sort by the next-most-significant key, and so on up to
  the primary key — each later pass's ties are correctly resolved by whatever order the earlier pass
  already established, precisely because nothing in between shuffles them.
- **O(n log n) worst case, O(n) best case** — worst case matches the comparison-sort lower bound
  exactly (Timsort is comparison-based — it never inspects the _value_ of an element, only
  comparisons between them), and the best case is only possible _because_ it's adaptive.

### `sorted()` vs. `.sort()`

```python
data = [5, 2, 9, 1, 5, 6]

ordered = sorted(data)   # returns a new list; leaves the original untouched
print(ordered)            # [1, 2, 5, 5, 6, 9]
print(data)                # [5, 2, 9, 1, 5, 6]  — unchanged

data.sort()                # sorts in place; returns None
print(data)                # [1, 2, 5, 5, 6, 9]

data.sort(reverse=True)    # in-place descending — no separate "reverse-sort" needed
print(data)                # [9, 6, 5, 5, 2, 1]
```

`sorted()` works on any iterable and always returns a new `list`; `.sort()` only exists on `list`
itself and mutates in place, returning `None` — the classic bug is writing `data = data.sort()` and
ending up with `None`.

### Custom ordering with `key=`

```python
pairs = [("banana", 2), ("apple", 1), ("cherry", 3)]

pairs.sort(key=lambda item: item[1])
print(pairs)   # [('apple', 1), ('banana', 2), ('cherry', 3)]
```

`key=` takes a function applied to each element once, and sorts by the function's _return value_ —
not a custom comparator called O(n log n) times. This is why Python dropped `cmp=` entirely in
Python 3: a key function is computed once per element (O(n) calls total) instead of on every
comparison, and it composes cleanly with `reverse=`. For simple field access, `operator.itemgetter`
/ `operator.attrgetter` are the idiomatic (and slightly faster, since they skip a Python-level
lambda call) equivalents of `lambda x: x[i]` / `lambda x: x.attr`:

```python
from operator import itemgetter

pairs.sort(key=itemgetter(1))   # identical to key=lambda item: item[1]
```

### Multi-key sorts: tuple keys, and why stability makes them work

The idiomatic way to sort by more than one field in a single pass is a **tuple key** — Python
compares tuples element-by-element, so the first tuple element acts as the primary key and later
elements only get consulted to break ties:

```python
pairs.sort(key=lambda item: (item[1], item[0]))   # primary: count: secondary: name
print(pairs)   # [('apple', 1), ('banana', 2), ('cherry', 3)]
```

But the _reason_ stability matters in practice is the other route to the same result: doing it as
**successive single-key passes**, primary key last, and letting stability carry the earlier pass's
ordering through:

```python
scores = [("Singh", 88), ("Doe", 91), ("Lee", 88), ("Kim", 91)]

# Goal: sort by score descending; ties broken by name ascending.

by_name = sorted(scores, key=lambda s: s[0])                 # tie-break key first
print(by_name)   # [('Doe', 91), ('Kim', 91), ('Lee', 88), ('Singh', 88)]

final = sorted(by_name, key=lambda s: s[1], reverse=True)     # primary key second
print(final)     # [('Doe', 91), ('Kim', 91), ('Lee', 88), ('Singh', 88)]

# Equivalent single-pass tuple key, for comparison:
tuple_key_result = sorted(scores, key=lambda s: (-s[1], s[0]))
print(final == tuple_key_result)   # True
```

Both approaches land on the identical order. The two-pass version only works _because_ the second
`sorted()` call is stable: sorting by score alone would otherwise be free to place `("Kim", 91)`
before or after `("Doe", 91)` arbitrarily, since they tie on the key being sorted by in that pass. A
stable sort is the one thing standing between "ties happen to come out in the order from the
previous pass" and "ties come out however the algorithm's internals felt like ordering them" — this
is the single most common place a real codebase leans on stability without ever calling it that.

### The takeaway for the rest of this Part

Reaching for the built-in is _always_ the right call in real code — nothing in the chapters ahead
beats Timsort in practice, and none of them are trying to. Quicksort, merge sort, heap sort,
counting sort, radix sort, and bucket sort exist in this Part to be understood, derived, and
reproduced on a whiteboard — because that's what the interview actually tests — not to replace
`sorted()` anywhere that matters.

---

## What's Coming in This Part

Every remaining sorting chapter in this Part is a different point on the same trade-off surface —
not a strictly-better algorithm than the last one, but a different answer to which of the properties
above you're willing to give up:

| Chapter                          | Avg Case   | Worst Case | Space    | Stable? | The trade-off in one line                                                                |
| -------------------------------- | ---------- | ---------- | -------- | ------- | ---------------------------------------------------------------------------------------- |
| [[04-quick-sort]] (Chapter 4)    | O(n log n) | O(n²)      | O(log n) | No      | Fastest in practice and in-place, at the cost of a worst case you have to defend against |
| [[05-merge-sort]] (Chapter 5)    | O(n log n) | O(n log n) | O(n)     | Yes     | Guaranteed worst case and stability, paid for with an O(n) buffer                        |
| [[06-heap-sort]] (Chapter 6)     | O(n log n) | O(n log n) | O(1)     | No      | Guaranteed worst case _and_ in-place, but gives up stability to get both                 |
| [[07-counting-sort]] (Chapter 7) | O(n + k)   | O(n + k)   | O(n + k) | Yes     | Beats the comparison-sort floor by assuming a bounded integer range k                    |
| [[08-radix-sort]] (Chapter 8)    | O(d(n+k))  | O(d(n+k))  | O(n + k) | Yes     | Beats the floor by processing fixed-width digits instead of comparing whole values       |
| [[09-bucket-sort]] (Chapter 9)   | O(n + k)   | O(n²)      | O(n + k) | Yes¹    | Beats the floor _on average_ by assuming a roughly uniform distribution over a range     |

¹ Stable if the per-bucket sort used is stable and buckets are emitted in index order — see the
footnote on the properties table above.

Quicksort and merge sort are the two comparison sorts everyone already half-knows — Chapter 4 and
Chapter 5 exist to pin down exactly _why_ one is in-place-but-unstable-with-a-bad-worst-case and the
other is stable-and-guaranteed-but-needs-a-buffer, instead of leaving that as a vague "quicksort is
faster" intuition. Heap sort (Chapter 6) is the answer to "can I get merge sort's worst-case
guarantee without merge sort's O(n) space" — yes, but stability is what pays for it. Counting sort,
radix sort, and bucket sort (Chapters 7–9) are the non-comparison family previewed in the
lower-bound section above: each one trades generality (arbitrary comparable values) for speed, by
assuming something concrete about what the values actually are. And [[10-selection-algorithms]]
(Chapter 10) closes the Part out with the observation that a full sort is sometimes strictly more
work than the problem asked for — quickselect finds the k-th smallest element in expected O(n),
without ever fully sorting anything, by reusing quicksort's partitioning step and throwing away the
half that can't contain the answer.

None of these trade-offs are re-derived here — each gets its own chapter, its own worked recurrence
or proof, and its own from-scratch implementation next.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
