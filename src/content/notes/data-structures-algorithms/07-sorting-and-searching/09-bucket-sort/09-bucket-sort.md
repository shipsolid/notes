---
title: "9 — Bucket Sort"
description: "Non-comparison sort for real-valued, roughly uniformly distributed input — O(n + k) average case derived from expected per-bucket occupancy, an O(n²) worst case with no floor beneath it, and a stability property that depends on the whole pipeline, not the bucketing step alone."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-57"
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/03-sorting-fundamentals/03-sorting-fundamentals
    kind: related
---

# 9 — Bucket Sort

[[07-counting-sort|Chapter 7]] needed the values to be integers within a small, known range, so it
could use the value itself as an array index. [[08-radix-sort|Chapter 8]] relaxed "small range" into
"fixed digit width," processing one digit position at a time instead of the whole value at once.
Both answers assume the values are discrete — integers, or something that decomposes cleanly into
digits. What happens when they aren't? Say the input is n real numbers — sensor readings, normalized
scores, timestamps rescaled to a fraction of a day — and the only thing known in advance is that
they fall somewhere in a known interval and are roughly spread out across it rather than clumped at
one end. There's no integer range to index into and no fixed digit structure to process. Bucket sort
is the answer to exactly that question: don't try to index by the exact value, index by
_approximately where in the interval_ the value falls, then run a small sort within whichever narrow
slice of the interval a given value landed in. Get the distribution assumption right and the
per-slice sorts are each nearly free. Get it wrong and this chapter's worst case is the one the rest
of this Part was supposed to have escaped.

---

## The Core Idea: Distribute by Position, Then Sort Small

Given n values known to lie in `[0, 1)` — any other known interval rescales into this one, covered
briefly at the end of this section — bucket sort works in three passes:

1. **Create k buckets**, each an empty list. The common choice, and the one this chapter uses
   throughout, is **k = n**: one bucket per input element.
2. **Distribute.** For each value `v`, compute `⌊v × k⌋` and append `v` to that bucket. Since
   `v ∈ [0, 1)`, `v × k ∈ [0, k)`, so the floor is always a valid index from `0` to `k − 1`. This
   step never compares two input values against each other — it computes an index directly from one
   value's own magnitude, which is exactly the non-comparison move counting sort and radix sort also
   make, just applied to a continuous range instead of a discrete one.
3. **Sort each bucket, then concatenate in index order.** Bucket `i` holds a small subset of values,
   all of which fall in the sub-interval `[i/k, (i+1)/k)`. Sort each bucket individually — commonly
   with **insertion sort**, since a correctly-sized bucket is expected to hold very few elements,
   and insertion sort's low overhead beats any O(n log n) algorithm's setup cost on tiny inputs (the
   same reasoning [[04-quick-sort|Chapter 4]]'s introsort fallback used to justify its own
   small-array cutoff). Because every value in bucket `i` is strictly less than every value in
   bucket `i + 1` by construction of the sub-intervals, concatenating the sorted buckets in index
   order `0, 1, …, k − 1` produces the fully sorted array with no merge step needed across bucket
   boundaries.

### Why the uniform-distribution assumption is load-bearing

Step 3 is where the entire performance story lives, and it hinges on one word from the setup:
_roughly uniformly distributed_. Here's why, in outline, before the precise version in the
Complexity section below derives it properly.

If the n values really are spread uniformly across `[0, 1)` and k = n, each bucket's sub-interval
has width `1/n`, so each value is roughly as likely to land in any one bucket as any other — the
_expected_ number of elements per bucket works out to `n × (1/n) = 1`. A bucket with O(1) elements
costs O(1) to insertion-sort, and there are n buckets, so the total sorting-within-buckets work is
O(n) — on top of the O(n) distribution pass and O(n) concatenation, the whole algorithm is O(n) on
average.

If the distribution is adversarial instead — say every one of the n values happens to fall in
`[0, 1/k)` — every element lands in bucket 0 and every other bucket stays empty. Bucket 0 now holds
all n elements, and insertion-sorting it costs whatever insertion sort costs on n arbitrary
elements: O(n²). The other k − 1 buckets contribute nothing, but that one bucket alone makes the
whole algorithm O(n²) — no better, asymptotically, than skipping the bucketing step entirely and
just running insertion sort on the raw array. That's the trade this chapter's title makes explicit:
bucket sort's speed is conditional on an assumption about the _shape_ of the data, not just its
_type_, and nothing catches you when that assumption is wrong.

---

## Full Implementation

```python
def insertion_sort(bucket):
    """Sort one bucket in place. Stable: uses strict '>' so equal keys are never
    shifted past each other."""
    for i in range(1, len(bucket)):
        key = bucket[i]
        j = i - 1
        while j >= 0 and bucket[j] > key:
            bucket[j + 1] = bucket[j]
            j -= 1
        bucket[j + 1] = key
    return bucket


def bucket_sort(arr):
    """Bucket sort for values known to lie in [0, 1), using k = n buckets."""
    n = len(arr)
    k = n
    buckets = [[] for _ in range(k)]

    for v in arr:
        idx = int(v * k)         # floor(v * k) — direct index from the value itself
        if idx == k:              # guard the v == 1.0 edge case (excluded by [0, 1) but cheap to guard)
            idx = k - 1
        buckets[idx].append(v)    # appended in original input order — matters for stability, below

    result = []
    for bucket in buckets:
        insertion_sort(bucket)
        result.extend(bucket)
    return result
```

Ran directly and checked against `sorted()` on 2,000 randomized trials (array lengths 0–30) plus a
50-element adversarial case where every value lands in one bucket — all pass, including the
empty-list edge case (`n = 0` produces `k = 0` buckets and an empty result with no index-by-zero
error, since the distribution loop never executes).

### Trace: `[0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12]`

n = 8, so k = 8 and each bucket's sub-interval has width `1/8 = 0.125`.

| `v`  | `v × 8` | `⌊v × 8⌋` (bucket index) |
| ---- | ------- | ------------------------ |
| 0.78 | 6.24    | 6                        |
| 0.17 | 1.36    | 1                        |
| 0.39 | 3.12    | 3                        |
| 0.26 | 2.08    | 2                        |
| 0.72 | 5.76    | 5                        |
| 0.94 | 7.52    | 7                        |
| 0.21 | 1.68    | 1                        |
| 0.12 | 0.96    | 0                        |

Distributing in input order fills the buckets like this:

| Bucket | Sub-interval     | Contents on arrival | After insertion sort |
| ------ | ---------------- | ------------------- | -------------------- |
| 0      | `[0.000, 0.125)` | `[0.12]`            | `[0.12]`             |
| 1      | `[0.125, 0.250)` | `[0.17, 0.21]`      | `[0.17, 0.21]`       |
| 2      | `[0.250, 0.375)` | `[0.26]`            | `[0.26]`             |
| 3      | `[0.375, 0.500)` | `[0.39]`            | `[0.39]`             |
| 4      | `[0.500, 0.625)` | `[]`                | `[]`                 |
| 5      | `[0.625, 0.750)` | `[0.72]`            | `[0.72]`             |
| 6      | `[0.750, 0.875)` | `[0.78]`            | `[0.78]`             |
| 7      | `[0.875, 1.000)` | `[0.94]`            | `[0.94]`             |

Bucket 1 is the only one that needed its insertion sort to do anything (it arrived already in order,
so even there the inner loop did zero shifts). Bucket 4 stayed empty — nothing pathological about
that, just this particular sample not placing a value in that sub-interval. Concatenating buckets 0
through 7 in index order:

```
[0.12, 0.17, 0.21, 0.26, 0.39, 0.72, 0.78, 0.94]
```

Sorted, with no comparison ever made _between_ values in different buckets — bucket 6's `0.78` never
needed to be compared against bucket 7's `0.94` to know it comes first; the bucket indices alone
already guaranteed it.

---

## Complexity: O(n + k) Average, O(n²) Worst

### Average case, derived precisely

The intuitive version above — "uniform data means O(1) expected elements per bucket, so sorting is
O(1) per bucket" — is the right idea, but it skips a real subtlety: insertion sort's cost on a
bucket of size `n_i` is `Θ(n_i²)`, not `Θ(n_i)`, and `E[n_i²]` is **not** the same quantity as
`(E[n_i])²` in general. The average-case claim needs `E[n_i²]`, so that's what has to be computed.

Model the uniform-distribution assumption precisely: each of the n input values independently and
uniformly lands in one of k buckets (true by construction if the values are uniform over `[0, 1)`
and the k sub-intervals are equal width). For bucket `i`, define an indicator `X_ij = 1` if element
`j` lands in bucket `i`, else `0`, so `n_i = Σⱼ X_ij` and `P(X_ij = 1) = 1/k` for every element `j`.
Expanding the square and using independence across elements for `j ≠ l`:

```
E[n_i²] = E[(Σⱼ X_ij)²] = Σⱼ E[X_ij²] + Σ_{j≠l} E[X_ij]·E[X_il]
        = n·(1/k) + n(n-1)·(1/k²)              (X_ij² = X_ij since X_ij is 0/1)
        = n/k + n(n-1)/k²
```

Summed over all k buckets, the total expected insertion-sort cost is:

```
Σᵢ Θ(E[n_i²]) = k · Θ(n/k + n(n-1)/k²) = Θ(n) + Θ(n²/k)
```

Add the Θ(n) distribution pass and the Θ(k) cost of allocating and concatenating k buckets:

```
E[T(n, k)] = Θ(n) + Θ(k) + Θ(n²/k) = Θ(n + k + n²/k)
```

That `n²/k` term is the one the intuitive version glossed over, and it's exactly why **k has to
scale with n**, not just why the data has to be uniform. With the common choice `k = Θ(n)` (this
chapter uses `k = n`), `n²/k = n²/n = Θ(n)`, so the whole expression collapses to
`Θ(n + k + n) = Θ(n + k)` — matching [[03-sorting-fundamentals|Part 07, Chapter 3]]'s roadmap table
exactly. But pick a k that _doesn't_ scale with n — say a fixed `k = 4` regardless of how large n
gets — and `n²/k` becomes `Θ(n²)` even under perfectly uniform data, no adversarial input required
at all. Verified empirically: with `k = n`, average comparisons per element stayed flat (~0.45) as n
scaled from 100 to 100,000 — the signature of Θ(n) total work, not Θ(n log n) or Θ(n²):

```
       n    avg_comparisons      avg/n
     100               45.1      0.452
    1000              451.4      0.451
   10000             4520.3      0.452
  100000            45356.8      0.454
```

And with k pinned at a constant 4 while n grows, average comparisons scaled with `n²` instead —
`avg/n²` stayed flat around 0.065 across n = 200 to 1,600, confirming the `n²/k` term dominates the
moment k stops growing with n:

```
n=  200  k=4  avg_comparisons=    2589.6  avg/n^2=0.06474
n=  400  k=4  avg_comparisons=   10384.2  avg/n^2=0.06490
n=  800  k=4  avg_comparisons=   41241.6  avg/n^2=0.06444
n= 1600  k=4  avg_comparisons=  160424.4  avg/n^2=0.06267
```

So the O(n + k) average case in the roadmap table carries two conditions, not one: the values have
to be genuinely uniformly distributed over the known interval, **and** the bucket count k has to be
chosen proportional to n. Drop either one and the `n²/k` term stops being absorbable into the linear
terms.

### Worst case: O(n²)

The worst case doesn't need a fixed small k to show up — even with `k = n`, an adversarial
_distribution_ alone is enough. If every one of the n values happens to fall inside a single
sub-interval `[i/k, (i+1)/k)`, that one bucket holds all n elements (`n_i = n`) and every other
bucket holds zero. Sorting a bucket of size n with insertion sort costs O(n²) in general (only its
best case — already-sorted input — collapses to O(n)), and that single bucket's cost dominates the
whole algorithm: O(n) distribution pass + O(n²) for the one overfull bucket + O(1) for the n − 1
empty ones = **O(n²)** overall. No adversarial _ordering_ within that bucket is even required to
reach this class — just adversarial _clustering_ across the bucket boundaries — because insertion
sort's average case is already Θ(m²) on m unsorted elements; only an already-sorted bucket would
dodge it, and nothing about the distribution assumption gives you that for free.

### The trade this makes, stated explicitly

This is the one algorithm in the non-comparison family — counting sort, radix sort, bucket sort —
whose worst case is **not** better than the comparison sorts this Part opened with. Counting sort's
O(n + k) and radix sort's O(d(n + k)) hold **unconditionally**: they depend only on the values
having the right _type_ (a bounded integer range, a fixed digit width), a fact that's true or false
about the data before a single element is inspected, and doesn't degrade based on how the values
happen to be arranged or distributed. Bucket sort's O(n + k) depends on the values having the right
_shape_ — a distributional property that can't be checked as cheaply as a range or digit count, and
that real data is free to violate even when every individual value is perfectly well-formed. Get the
shape assumption right and bucket sort beats the Ω(n log n) comparison floor, same as its
non-comparison siblings. Get it wrong and there's no floor underneath it at all — it falls all the
way to O(n²), the same class as the naive comparison sorts, having spent the bucketing overhead for
nothing. That conditional worst case is the premium bucket sort pays for handling continuous,
real-valued input that counting sort and radix sort can't touch.

---

## Stability: Conditional on the Whole Pipeline

[[03-sorting-fundamentals|Part 07, Chapter 3]]'s properties table flagged bucket sort's stability
and comparison-freedom with an asterisk, attached to this footnote: _the bucketing step is
non-comparison, but most implementations sort within each bucket using a comparison-based sort, and
the classification refers to how buckets are assigned, not to what happens once a value lands in
one._ Here's that resolved precisely, not just repeated.

Three separate things all have to hold for the algorithm as a whole to be stable:

1. **Elements are appended to their bucket in original input order** — the distribution loop above
   does exactly this, since it walks the input array once, front to back, and appends.
2. **The per-bucket sort is itself stable.** The `insertion_sort` above uses strict
   `bucket[j] > key` as its shift condition — an element is only shifted past values _strictly_
   greater than it, so two equal keys already in the correct relative order are never disturbed.
3. **Buckets are concatenated in index order.** Every value in bucket `i` is, by construction, less
   than every value in bucket `i + 1`, so concatenating `0, 1, …, k − 1` never interleaves values
   from different buckets — cross-bucket order is fully determined by the (correct) bucket indices
   alone.

Two elements that compare equal necessarily share the same value `v`, so `⌊v × k⌋` sends them to the
exact same bucket — equal keys can never end up split across buckets. Combine that with (1) and (2)
and their relative order inside that shared bucket is preserved exactly as it existed on input;
combine that with (3) and nothing after bucketing has a chance to disturb it. All three conditions
hold together, so **bucket sort as built above is stable** — verified concretely with tagged values,
the same technique [[04-quick-sort|Chapter 4]] used to demonstrate quicksort's instability:

```python
class Tagged:
    def __init__(self, key, tag):
        self.key, self.tag = key, tag
    def __repr__(self):
        return f"{self.key}{self.tag}"

def bucket_sort_tagged(arr, k):
    buckets = [[] for _ in range(k)]
    for item in arr:
        idx = min(int(item.key * k), k - 1)
        buckets[idx].append(item)          # original input order preserved
    result = []
    for bucket in buckets:
        # insertion sort keyed on .key, same strict '>' shift condition as above
        for i in range(1, len(bucket)):
            cur = bucket[i]
            j = i - 1
            while j >= 0 and bucket[j].key > cur.key:
                bucket[j + 1] = bucket[j]
                j -= 1
            bucket[j + 1] = cur
        result.extend(bucket)
    return result

arr = [Tagged(0.20, "a"), Tagged(0.71, "b"), Tagged(0.20, "c"),
       Tagged(0.71, "d"), Tagged(0.05, "e")]
print(bucket_sort_tagged(arr, k=5))
```

```
[0.05e, 0.2a, 0.2c, 0.71b, 0.71d]
```

`0.2a` (index 0 in the input) comes out before `0.2c` (index 2), and `0.71b` (index 1) comes out
before `0.71d` (index 3) — both ties resolved in original input order, exactly as stability
requires.

Now swap step 2 for a non-stable per-bucket sort — a standard swap-based selection sort, or the
Lomuto quicksort from [[04-quick-sort|Chapter 4]] — and stability breaks immediately, even though
the _bucketing_ step didn't change at all and still never performed a single comparison. Two
equal-keyed elements landing in the same bucket can now be reordered by that bucket's internal
swaps, purely because the sort finishing the job inside the bucket doesn't protect ties. That's the
footnote made concrete: stability is a property of the **entire pipeline** — distribution order,
per-bucket sort choice, and concatenation order, all three — not a property the non-comparison
bucketing step confers by itself. Classifying bucket sort as "non-comparison" describes how elements
get _routed_; it says nothing on its own about what happens to two elements that get routed to the
same place.

---

## Generalizing Beyond `[0, 1)`

For an arbitrary known range `[min, max)` instead of `[0, 1)`, the same idea rescales directly:
bucket index = `⌊(v − min) / (max − min) × k⌋`, which maps `min` to bucket `0` and values
approaching `max` to bucket `k − 1`, exactly as before.

---

## Interview Angle

Reciting "create k buckets, distribute, sort each, concatenate" is the easy 20% of what this
algorithm is being asked to test. The signal an interviewer is actually listening for is whether you
volunteer — unprompted — the two conditions the whole speedup rests on: a **known range** to bucket
over, and a **roughly uniform distribution** across it, and whether you're honest about what happens
the moment either one is false. Say "bucket sort is O(n)" without qualifying it and you've made a
claim the algorithm doesn't back — it's O(n) _on average, under an assumption about the input you
don't get to verify for free_. The stronger answer volunteers the failure mode before being asked:
"if the data clusters instead of spreading out, one bucket absorbs everything and I'm back to O(n²)
— so I'd want some evidence the distribution is actually roughly uniform (a histogram, domain
knowledge about how the values were generated) before reaching for this over a guaranteed-safe O(n
log n) sort."

The cleanest way to place bucket sort relative to the rest of this Part is as **counting sort's
continuous-valued analogue**, not as an unrelated third technique. Both algorithms make the
identical move — use the value itself to compute where it goes, instead of comparing it against
other values — and differ only in how fine-grained that placement can be. Counting sort's buckets
are single integer values: because integers have no "space between" two adjacent values, indexing by
the integer directly settles a value's final position outright, with no follow-up sort needed.
Bucket sort's buckets are _ranges_ of real values: indexing only narrows a value down to "somewhere
in this one-k'th slice of the interval," and real numbers within that slice can still differ from
each other, so a small second sort is unavoidable to settle order inside the slice. That's the one
sentence worth having ready: bucket sort is what counting sort's trick turns into once the values
stop being discrete.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
