---
title: "8 — Radix Sort"
description: "LSD radix sort processes multi-digit integers by running the previous chapter's stable counting sort once per digit, achieving O(d(n+k)) time by indexing on digits instead of comparing whole values."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-56"
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/07-counting-sort/07-counting-sort
    kind: depends_on
---

# 8 — Radix Sort

[[07-counting-sort|Part 07, Chapter 7]]'s O(n + k) bound looks unbeatable right up until `k` stops
being small. That chapter's own closing warning was concrete: a hundred integers known to range up
to 10⁹ already makes counting sort the _wrong_ answer, because the counts array alone would need on
the order of a billion slots to sort a hundred values. The algorithm hasn't gotten slower in any
asymptotic sense — it's that `k`, the assumption the whole O(n + k) pitch rests on, quietly stopped
being a small constant and became as large as the values themselves.

Radix sort's answer isn't to abandon counting sort. It's to stop counting by the _whole_ value and
count by one **digit** at a time instead. A single decimal digit only ever takes 10 possible values,
no matter how large the number it belongs to is — so a counting sort keyed on one digit has k = 10,
always, whether the numbers being sorted are two digits long or twenty. Trade one enormous,
expensive counting-sort pass over the full value for several cheap, bounded counting-sort passes,
one per digit position. That trade — depth of range given up for repetition — is this entire
chapter, and by the end of it the "inner loop" won't just resemble counting sort. It will _be_
counting sort, called once per digit with nothing changed but the key function handed to it.

---

## The Core Idea: LSD Radix Sort

There are two directions to process digits in, and only one of them turns out to work without extra
machinery.

**Most-significant-digit (MSD) first** is the direction that matches how people actually compare
numbers: look at the leftmost digit first, and only consult the next digit down if the leftmost ones
tie. But building an algorithm around that instinct means, after grouping the array by its leading
digit, each group still has to be sorted internally by its _remaining_ digits — which means
recursing into every group, tracking variable-length subgroups, and handling the fact that different
groups can have different numbers of digits left to resolve. It works, but it's structurally a
recursive, bucket-tracking algorithm, closer in shape to a multi-way quicksort than to the flat
linear passes this chapter is after.

**Least-significant-digit (LSD) first** is the direction that turns out to need none of that.
Process digits from the _units_ place up through the most significant place, and at each digit
position run one full, flat, stable counting-sort pass over the **entire array** — no recursion, no
sub-bucketing, no per-group bookkeeping. After processing every digit position up through the most
significant one in the largest value, the array is completely sorted. That claim needs a real
argument, not just an assertion, and the argument is exactly the stability argument
[[07-counting-sort|Part 07, Chapter 7]] closed on:

> Radix sort sorts multi-digit numbers by running counting sort once per digit, from least
> significant to most significant, relying on each pass to preserve the ordering every previous pass
> already established for numbers that tie on the digits processed so far.

Spelled out as an induction: after the pass over digit position `i` (the `10^i` place) completes,
claim that the array is correctly sorted **as if only digits `0` through `i` existed** — i.e., two
elements are in the right relative order whenever their low-order `(i+1)`-digit suffixes differ, and
elements whose low-order `(i+1)`-digit suffixes are equal sit in some order (not yet guaranteed
correct beyond that digit range, but consistent). The next pass, over digit position `i+1`, is a
**stable** counting sort keyed on that one digit:

- **If two elements' digit-`(i+1)` values differ**, the counting sort places the smaller digit's
  elements first — correct, because a difference at a more significant digit position determines the
  final order regardless of anything in the lower digits.
- **If two elements' digit-`(i+1)` values are equal**, stability means they keep whatever relative
  order they had walking into this pass — and by the inductive hypothesis, that order is _already_
  the correct order with respect to every digit from `0` to `i`. So ties on digit `i+1` get broken
  by exactly the right lower-order comparison, without the digit-`(i+1)` pass ever having to know
  anything about those lower digits itself.

That's the whole mechanism: each pass only ever has to get _its own_ digit right, and inherits every
lower digit's correct ordering for free, purely because the counting sort underneath it is stable.
Drop stability from any single pass and the chain breaks — an unstable pass can scramble the exact
ordering information every later pass depends on, and there is no way to recover it afterward,
because the information about which element came first was thrown away, not merely reordered.

This is not a new argument invented for radix sort — it is
[[03-sorting-fundamentals|Part 07, Chapter 3]]'s Timsort section, applied one level more granular.
That chapter's multi-key sort ran successive single-key passes — _least-significant key first, most
significant key last_ — and depended entirely on each pass being stable so it wouldn't disturb the
ordering the previous pass established for ties. LSD radix sort is that identical pattern with "key"
narrowed all the way down to "one digit": least-significant digit first, most-significant digit
last, each pass stable, each pass trusting the last one's tie-breaking completely. Same reasoning,
same reliance on stability, just field-by-field in one chapter and digit-by-digit in this one.

---

## Full Implementation: Radix Sort's Inner Loop Is Counting Sort

This is the payoff of building the stable version of counting sort with a general `key=` parameter
back in [[07-counting-sort|Part 07, Chapter 7]] instead of one hardcoded to sort bare integers.
Reproduced unchanged:

```python
def counting_sort_stable(arr: list, key=None) -> list:
    """Stable sort of `arr` by an integer key in [0, k], in O(n + k) time and O(n + k) space.

    `key` defaults to the identity function, so this also sorts plain integer lists directly.
    Generalizes past raw integers: `arr` can hold any records, as long as `key(x)` returns a
    non-negative integer.
    """
    if not arr:
        return []
    if key is None:
        key = lambda x: x

    k = max(key(x) for x in arr)

    counts = [0] * (k + 1)
    for x in arr:
        counts[key(x)] += 1

    # Turn counts into cumulative counts: prefix[v] = how many elements have key <= v.
    prefix = counts[:]
    for v in range(1, k + 1):
        prefix[v] += prefix[v - 1]

    # Walk the ORIGINAL input right to left, placing each element by its own prefix count,
    # then decrementing that count so the next element with the same key lands just before it.
    output = [None] * len(arr)
    for i in range(len(arr) - 1, -1, -1):
        x = arr[i]
        k_x = key(x)
        output[prefix[k_x] - 1] = x
        prefix[k_x] -= 1

    return output
```

Radix sort's entire contribution is choosing _what key to sort by on each pass_, and looping over
place values until every digit of the largest number has been processed:

```python
def radix_sort(arr: list[int]) -> list[int]:
    """LSD radix sort for non-negative integers, base 10.

    Each pass is exactly counting_sort_stable from the previous chapter, unmodified --
    only the key function changes, from "the whole value" to "the digit at place value `exp`".
    d passes total, d = number of digits in max(arr). Stable overall because every pass is stable
    and each pass's ties are broken by the previous pass's already-correct ordering.
    """
    if not arr:
        return arr[:]

    max_value = max(arr)
    exp = 1                                   # 1, 10, 100, ... -- the place value of the current digit
    while max_value // exp > 0:
        arr = counting_sort_stable(arr, key=lambda x, exp=exp: (x // exp) % 10)
        exp *= 10
    return arr
```

`(x // exp) % 10` is the digit extraction: dividing by `exp` shifts the target digit down to the
units place, and `% 10` strips off everything above it. `key=lambda x, exp=exp: ...` binds the
_current_ loop iteration's `exp` as a default argument rather than letting the lambda capture the
loop variable by reference — necessary here specifically because the lambda is constructed fresh on
every iteration and consumed immediately inside that same iteration's `counting_sort_stable` call,
so the classic "closures in a loop share one late-bound variable" trap doesn't actually bite in this
particular shape, but binding it explicitly costs nothing and removes any doubt for a reader
auditing the loop later. Verified by direct comparison against `sorted()` across 500 randomized
trials of varying length and value range, plus every trace value below.

### Trace: `[170, 45, 75, 90, 802, 2, 24, 66]`

Eight values spanning one, two, and three digits — enough to force every pass to do real work,
including passes where some elements have "no digit there" (treated as digit `0`).

| Pass  | Digit place        | Array after this pass               |
| ----- | ------------------ | ----------------------------------- |
| start | —                  | `[170, 45, 75, 90, 802, 2, 24, 66]` |
| 1     | units (exp=1)      | `[170, 90, 802, 2, 24, 45, 75, 66]` |
| 2     | tens (exp=10)      | `[802, 2, 24, 45, 66, 170, 75, 90]` |
| 3     | hundreds (exp=100) | `[2, 24, 45, 66, 75, 90, 170, 802]` |

Walking each pass and pointing at exactly where stability does the work:

- **Pass 1 (units digit).** Units digits: `170→0, 45→5, 75→5, 90→0, 802→2, 2→2, 24→4, 66→6`. Two
  ties worth watching: `170` and `90` both end in `0`, and in the original array `170` (index 0)
  comes before `90` (index 3) — the output keeps them in that order: `[170, 90, ...]`. Likewise `45`
  and `75` both end in `5`, `45` (index 1) before `75` (index 2) originally, and the output
  preserves it: `[..., 45, 75, ...]`.
- **Pass 2 (tens digit).** Feeding pass 1's output back in, tens digits:
  `170→7, 90→9, 802→0, 2→0, 24→2, 45→4, 66→6, 75→7`. `802` and `2` tie at tens digit `0`; going into
  this pass their order was `802` before `2` (from pass 1's output), and the result keeps
  `[802, 2, ...]`. More tellingly, `170` and `75` tie at tens digit `7` — pass 1 had already placed
  `170` before `75`, and pass 2's output keeps `[..., 170, 75, ...]` even though a plain, non-stable
  comparison of the _tens digit alone_ gives no information about which of two `7`s should come
  first. Stability is the only thing supplying that answer, and it's supplying the _correct_ one,
  because it's really answering "which of these ties on units digit already."
- **Pass 3 (hundreds digit).** Six of the eight values — `2, 24, 45, 66, 75, 90` — share hundreds
  digit `0`; only `170` (digit `1`) and `802` (digit `8`) differ. Look at those six's order going
  into this pass, inherited from pass 2: `2, 24, 45, 66, 75, 90` — already the fully correct final
  order, purely as a byproduct of two passes of stability compounding. This pass doesn't have to do
  anything clever with them at all; it just has to not disturb an order it already inherited
  correctly, group them under digit `0`, and place `170`'s group and `802`'s group around them by
  comparing the one digit that actually differs. That's the entire mechanism, laid completely bare
  on real data: the _last_ pass's job is almost entirely "don't break what the earlier passes
  already got right," and the earlier passes did the actual heavy lifting on ties that the final
  pass has no way to see.

---

## How Many Passes, and What That Costs

**Number of passes:** `d`, the number of digits in the largest value being sorted — equivalently
`d = floor(log₁₀(max_value)) + 1`. The `while max_value // exp > 0` loop above terminates exactly
when `exp` has grown past `max_value`, which happens after precisely `d` iterations; `802` needs 3,
matching the 3-pass trace above.

**Cost per pass:** one call to `counting_sort_stable`, which is O(n + k) — here k = 9 (ten possible
digit values, 0 through 9, so the counts/prefix arrays never exceed size 10 regardless of how big
the _values_ being sorted are).

**Total:** `d` passes of O(n + k) each gives **O(d·(n + k))**, or O(d·n) once k is folded in as the
small constant 10 it always is in base 10.

Whether that's genuinely linear in `n` comes down entirely to whether `d` is a constant independent
of `n`, and that's a question about the _representation_ of the keys, not about the algorithm:

- **Fixed-width keys make `d` a hard, input-independent constant.** A 32-bit unsigned integer,
  whatever its actual value, has at most `⌊log₁₀(2³² − 1)⌋ + 1 = 10` decimal digits — always, by
  construction of the format, not by luck of the data. Sort a million 32-bit integers or a billion
  of them, `d ≤ 10` either way, so the total cost is O(10·(n + 10)) = **O(n)** — genuinely linear,
  and for large enough `n` this really can out-race an O(n log n) comparison sort in wall-clock
  terms. The same argument holds for any fixed-length string or fixed-length record:
  exactly-9-character keys, IPv4 addresses (4 fixed bytes), 10-digit phone numbers — `d` is nailed
  down by the _format_, before a single value is inspected.
- **Unbounded-precision keys make `d` a property of the specific input, with no ceiling promised in
  advance.** If keys are arbitrary-precision integers with no declared bit width, `d` is whatever
  `⌊log₁₀(max_value)⌋ + 1` happens to be for the actual data handed in, and nothing stops that from
  scaling with `n`. Illustrating the concrete failure mode rather than asserting a universal law: if
  the largest key in an n-element input happens to be on the order of `n^c` for some constant `c`,
  then `d ≈ c·log₁₀ n`, and the total cost becomes O(n log n) — the _same asymptotic order_ as a
  comparison sort, with radix sort's extra per-pass bookkeeping (allocating and walking a
  counts/prefix array every single pass) now a pure loss with nothing bought back for it. The moment
  `d` depends on the data instead of being fixed by a type's width, "radix sort beats O(n log n)" is
  no longer a bound you get to assume — it's a claim that needs re-checking against the actual key
  sizes in play.

That distinction — `d` fixed by format vs. `d` determined by the data — is the entire difference
between "radix sort is genuinely linear here" and "radix sort is quietly no better than `sorted()`,
with a worse constant factor."

One implementation detail worth flagging without deriving it in full: nothing forces base 10.
Choosing base 256 (byte-wise digits) instead of base 10 changes k from 10 to 256 and correspondingly
shrinks `d` to "number of bytes in the representation" — 4 passes for a 32-bit integer instead
of 10. Same O(d·(n + k)) shape, a different point on the trade-off between fewer, fatter passes
(bigger k, smaller d) and more, thinner ones (smaller k, bigger d); the counting sort underneath is
unchanged either way, just with `% 256` and `// 256` in place of `% 10` and `// 10`, and `k = 255`
instead of `k = 9`.

---

## Negative Numbers and Non-Integer Keys

The implementation above assumes non-negative integers, because `(x // exp) % 10` and the
`counting_sort_stable` key it's used with both assume the key lands in `[0, k]` — a negative key
would either index a Python list from the _end_ (silently wrong) or, depending on how the digit math
is done, extract a nonsensical "digit" from a negative number's different floor-division behavior.
The standard fix doesn't touch the core algorithm at all: find `min(arr)`, add `-min(arr)` to every
element before sorting (shifting the whole array into non-negative territory without changing
anyone's relative order), run the unmodified `radix_sort` above, then subtract the same offset back
off every element of the result. An alternative that avoids the offset arithmetic: partition the
input into negatives and non-negatives up front, radix-sort the _magnitudes_ of the negative
partition and the non-negative partition separately, then reverse the sorted negative-magnitude
partition (a larger magnitude means a more negative, and therefore smaller, actual value) and place
it ahead of the sorted non-negative partition. Either approach is a thin O(n) wrapper around the
algorithm already derived here, not a reason to rewrite it — worth knowing the shape of the fix
exists, not worth a full second implementation. The same "decompose into a bounded alphabet of
digits" idea extends past integers too: fixed-length strings sort byte-by-byte from the rightmost
character inward exactly like base-256 radix sort, and IEEE-754 floating-point values can be
radix-sorted by reinterpreting their bit pattern as an unsigned integer after a specific
sign-and-exponent bit flip that makes unsigned-integer order match floating-point order — a real,
documented technique, but its bit-level derivation belongs to a lower-level systems chapter, not
this one.

---

## Comparison-Based vs. Not, and the Lower Bound Again

[[03-sorting-fundamentals|Part 07, Chapter 3]] proved that any comparison-based sort needs Ω(n log
n) comparisons in the worst case, using a decision tree where every internal node is one "is A less
than B" question. [[07-counting-sort|Part 07, Chapter 7]] escaped that bound by never building such
a tree at all — its fundamental operation is "use this value directly as an array index," not
"compare two values," so the argument the bound is built on simply has nothing to attach to.

Radix sort escapes the same way, at a finer grain. Its fundamental operation is "extract the digit
at place value `exp` from this one value and use it as a direct index into a 10-slot counts array" —
never, at any point in any pass, does it ask whether one _whole_ value is less than another. Two
nine-digit numbers that differ only in their very first digit are never compared to each other as
complete values; each pass only ever inspects one digit position in isolation, of one element at a
time, against nothing else. Because no pairwise "is A less than B" question is ever asked, there's
no decision tree to bound, and the Ω(n log n) result — proved specifically about algorithms
restricted to that one primitive — doesn't apply, for the identical reason it didn't apply to
counting sort: the bound was never violated, because radix sort was never playing the game the bound
is a statement about.

That's also exactly why the trade is not free. The moment the key can't be decomposed into a bounded
sequence of digits from a small, known alphabet — arbitrary objects with nothing but a working `<`,
or numeric keys whose digit count isn't bounded independent of the input (the previous section's
failure case) — radix sort has nothing left to index by, and the problem falls back to being a
comparison sort with the Ω(n log n) floor fully back in force. Non-comparison sorts don't get to
keep their speed after the assumption that earned it is taken away; that's the whole shape of the
deal [[03-sorting-fundamentals|Part 07, Chapter 3]] first laid out for counting sort and bucket
sort, and it applies to radix sort without modification.

---

## Interview Angle: When It's the Right Answer, and When It's a Trap

**Radix sort is the right answer when the keys are fixed-width and drawn from a small alphabet.** IP
addresses (four fixed bytes — base-256 radix sort in exactly four passes, a real technique used in
routing-table construction and packet-processing pipelines, not a textbook curiosity), phone numbers
(fixed digit count by format), fixed-length product codes or IDs, 32-bit integer keys in general.
`d` is nailed down by the _format itself_ before a single value is inspected, which is precisely the
signal that makes "beats the comparison floor" a claim that actually holds up rather than one that
needs footnoting.

**The trap is reaching for radix sort as the "clever" answer when the keys are variable-length or
unbounded-precision** — arbitrary-precision integers with no declared width, or a batch of strings
whose lengths vary widely, where the longest key in the batch sets `d` for every pass and that
longest key's length isn't bounded by anything the problem statement promised. An interviewer who
asks "can you beat O(n log n) sorting these arbitrary huge integers" is very often testing whether
the candidate notices that `d` has quietly stopped being a constant here, not testing whether they
can recite the radix sort algorithm from memory. Producing the LSD radix sort implementation above
without first checking "is `d` actually bounded for this input" is the same mistake as reaching for
counting sort without checking whether `k` dwarfs `n` — a real, working algorithm applied to an
input where its headline complexity silently stops meaning what it usually means.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
