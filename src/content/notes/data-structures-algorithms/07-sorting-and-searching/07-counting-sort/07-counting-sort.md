---
title: "7 — Counting Sort"
description: "Non-comparison sort that counts occurrences directly by value, its stable prefix-sum construction, and the O(n + k) trade-off that only pays off when the key range doesn't dwarf the input."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-55"
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/03-sorting-fundamentals/03-sorting-fundamentals
    kind: depends_on
---

# 7 — Counting Sort

[[03-sorting-fundamentals|Part 07, Chapter 3]] proved a hard floor: no comparison-based sort can
beat Ω(n log n) in the worst case, no matter how cleverly it's written, because the decision-tree
argument applies to _any_ algorithm that learns order purely by asking "is A less than B." That
chapter also flagged the loophole — an algorithm that never asks that question isn't bound by an
argument built entirely around it. Counting sort is the first concrete payoff of that loophole. It
sorts in O(n + k) time, genuinely faster than the comparison floor for the right inputs, and it
isn't cheating: it simply refuses to be a comparison sort at all. The trade it makes is explicit —
give up "works on any type with a working `<`," get O(n + k) in exchange. Everything in this chapter
is about exactly when that trade is worth making, and the two implementations that arise from taking
it seriously.

---

## The Core Idea: Count, Don't Compare

Comparison sorts extract order from repeated pairwise questions. Counting sort takes a different
starting assumption: the values to be sorted are integers known to lie in a bounded range `[0, k]`.
Given that assumption, there's a much more direct way to find out how many elements are smaller than
any given value — count them.

The mechanism has two passes over data of size `n`, plus one pass over the range `k`:

1. **Count occurrences.** Walk the input once. For each value `x`, increment `counts[x]` — using the
   value itself as an array index, not as one side of a comparison. After this pass, `counts[v]`
   holds exactly how many times `v` appeared in the input, for every `v` from `0` to `k`.
2. **Reconstruct the output.** Walk the counts array from `0` to `k`. Wherever `counts[v] > 0`, that
   many copies of `v` belong in the output, in that position, because every value strictly less than
   `v` has already been counted and emitted.

Notice what never happens anywhere in that description: at no point does the algorithm ask whether
one element is less than another. It asks "what is this value," uses that value as a direct index,
and lets the counts array itself carry all the ordering information. That's precisely why the
decision-tree argument doesn't apply here — that argument modeled every comparison-based algorithm
as a binary tree of `<` questions and proved the tree needs Ω(n log n) height to have enough leaves
for every possible input permutation. Counting sort's control flow doesn't branch on comparisons
between elements at all; there's no decision tree to bound in the first place. The lower bound isn't
violated — it simply doesn't apply to an algorithm that was never playing the game the bound was
proved about.

---

## The Simple Version: Count, Then Emit

The most direct implementation of the two passes above, sorting a plain array of non-negative
integers:

```python
def counting_sort_simple(arr: list[int]) -> list[int]:
    """Sort a list of non-negative integers in O(n + k), k = max(arr).

    Not stable. Only works on raw integer values — see below for why.
    """
    if not arr:
        return []

    k = max(arr)
    counts = [0] * (k + 1)
    for x in arr:
        counts[x] += 1              # value used directly as index — no comparison

    output = []
    for value in range(k + 1):
        output.extend([value] * counts[value])
    return output
```

```python
>>> counting_sort_simple([4, 2, 2, 8, 3, 3, 1])
[1, 2, 2, 3, 3, 4, 8]
```

Verified: `counts = [0, 1, 2, 2, 1, 0, 0, 0, 1]` after the counting pass (index `0` never appears,
so `counts[0] == 0`; `2` and `3` each appear twice, matching `counts[2] == counts[3] == 2`; `8`
appears once out at index `8`). The reconstruction pass then just walks that array left to right,
emitting `value` exactly `counts[value]` times — zero contributions from `0`, `5`, `6`, `7`, one
`1`, two `2`s, two `3`s, one `4`, one `8`, in that order. That's the whole algorithm: two linear
passes, no comparisons, and a result that's provably sorted because it was built in increasing order
of `value` by construction, not verified afterward.

### Why this version isn't good enough

Two real limitations, and they're related:

**It's not stable, in a way that's easy to miss because raw integers don't expose it.** Stability,
as [[03-sorting-fundamentals|Part 07, Chapter 3]] defined it, is about elements that compare equal
keeping their original relative order. Two bare `3`s are indistinguishable — there's no "identity"
for the algorithm to preserve or lose, so the question doesn't even have a visible answer here.

**It doesn't generalize to sorting records by a key, and that's the version that actually matters in
practice.** Look at the reconstruction loop again: `output.extend([value] * counts[value])`. The
only thing it ever writes into the output is `value` itself — the loop variable, an integer from
`range(k + 1)`. There is no mechanism anywhere in this version for carrying an associated record
along with that value. If the real objects being sorted were `Person` records with an `.age` field,
this reconstruction loop has nothing to extend the output with except the _age itself_ — it has
already thrown away which specific `Person` objects contributed to each count, keeping only how
many. Ask it to sort people by age and hand back `Person` objects, and there's no way to make that
work without changing the algorithm's shape, because the information needed to do so was discarded
in the counting pass. That gap — stability that's invisible on bare integers, but load-bearing the
moment the sort key and the sorted object are different things — is exactly what the next version
fixes.

---

## The Stable Version: Prefix Sums, Right to Left

The fix keeps the same counting pass, but changes what the counts get used for. Instead of walking
the counts array and re-emitting bare values, turn the counts into a **prefix-sum (cumulative count)
array** — `prefix[v]` becomes "how many elements have key `≤ v`" — and use that to compute the
_exact final index_ each original element belongs at, then place the original element itself there.
Nothing gets reconstructed from counts alone; every element that goes into the output is the actual
input element, carried across untouched.

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

Two details worth being precise about, because both are easy to get backwards:

- **The prefix array, not the raw counts array, tells you _where_.** `prefix[v]` is "how many
  elements belong at index `v` or earlier" — exactly the final 1-indexed rank of the _last_ element
  with key `v`. `prefix[k_x] - 1` converts that rank to a 0-indexed array slot.
- **Right to left is what makes it stable, not an arbitrary choice.** Walking the original input
  from the last element to the first, and decrementing `prefix[k_x]` after every placement, means
  that when two elements share a key, the one that appeared _earlier_ in the input gets processed
  _later_ — and therefore claims the _smaller_ of the two remaining slots for that key. That's
  precisely "ties keep their original relative order." Walking left to right instead would place the
  _later_ duplicate into the earlier slot, flipping their order — correct as a sort, but no longer
  stable.

### Trace: sorting tagged records by key

To make stability visible — the way [[04-quick-sort|Part 07, Chapter 4]]'s partition trace used
tagged values to expose exactly where order flips — sort small records that carry a key and a tag,
by key only:

```python
class Tagged:
    def __init__(self, key, tag):
        self.key, self.tag = key, tag
    def __repr__(self):
        return f"{self.key}{self.tag}"

records = [Tagged(3, "a"), Tagged(1, "b"), Tagged(3, "c"), Tagged(0, "d"), Tagged(1, "e"), Tagged(2, "f")]
counting_sort_stable(records, key=lambda t: t.key)
```

Counting pass gives `counts = [1, 2, 1, 2]` (one key-`0`, two key-`1`s, one key-`2`, two key-`3`s),
and the cumulative sum gives `prefix = [1, 3, 4, 6]` before any placement happens. The right-to-left
walk over the original six-element input then plays out as:

| `i` | `arr[i]` | `key` | `prefix[key] - 1` (dest) | `prefix` after decrement |
| --- | -------- | ----- | ------------------------ | ------------------------ |
| 5   | `2f`     | 2     | 3                        | `[1, 3, 3, 6]`           |
| 4   | `1e`     | 1     | 2                        | `[1, 2, 3, 6]`           |
| 3   | `0d`     | 0     | 0                        | `[0, 2, 3, 6]`           |
| 2   | `3c`     | 3     | 5                        | `[0, 2, 3, 5]`           |
| 1   | `1b`     | 1     | 1                        | `[0, 1, 3, 5]`           |
| 0   | `3a`     | 3     | 4                        | `[0, 1, 3, 4]`           |

Reading the "dest" column as final output positions: `0d` at index 0, `1b` at index 1, `1e` at index
2, `2f` at index 3, `3a` at index 4, `3c` at index 5 — output `[0d, 1b, 1e, 2f, 3a, 3c]`, verified
by running the code above. The two things worth noticing: `1b` (input index 1) landed before `1e`
(input index 4) — their original relative order survived, even though the walk that placed them ran
in the opposite direction. And `3a` (input index 0) landed before `3c` (input index 2), for the
identical reason. That's stability made concrete rather than asserted: the algorithm processed the
later duplicate of each key first specifically so the earlier one would claim the earlier slot.

The same function sorts plain integers too, since `key` defaults to the identity function —
`counting_sort_stable([4, 2, 2, 8, 3, 3, 1])` returns `[1, 2, 2, 3, 3, 4, 8]`, identical to the
simple version's output, because bare integers have no visible identity for stability to protect.
The generalization only becomes visible — and only matters — once the sorted objects carry more
information than the key being sorted on.

### Why the stable version is the one worth having cold

The simple version is faster to write and marginally faster to run, but it's also a dead end: it can
only ever sort raw integers and hand back raw integers. The stable version is the one that
generalizes, and it generalizes in a specific direction that matters for the next chapter. **Radix
sort** ([[08-radix-sort|Chapter 8]]) sorts multi-digit numbers by running counting sort once per
digit, from least significant to most significant, relying on each pass to preserve the ordering
every previous pass already established for numbers that tie on the digits processed so far. That
only works if the per-digit counting sort is stable — an unstable pass would scramble exactly the
ordering information the next pass depends on, the same way
[[03-sorting-fundamentals|Part 07, Chapter 3]]'s successive-single-key-pass example depended on
Python's `sorted()` being stable at every step. The simple version literally cannot serve that role:
it can't accept records at all, let alone preserve their order.

---

## Complexity: O(n + k) Time, and the Precondition That's Easy to Forget

**Time: O(n + k).** The counting pass is O(n) — one increment per input element. Building the prefix
array is O(k) — one addition per possible key value. The placement pass is O(n) — one write per
input element. Total: O(n) + O(k) + O(n) = O(n + k), with no dependence on how the input elements
compare to each other, and — unlike every comparison sort in this Part — this bound holds
identically in the best, average, and worst case. There's no adversarial input that makes counting
sort slower, because nothing about its control flow depends on the input's _arrangement_ at all,
only on `n` and `k`.

That looks strictly better than O(n log n) whenever `k` isn't much bigger than `n`. But the bound
has a precondition baked directly into it that's easy to lose sight of, the same way
[[01-binary-search|Chapter 1]]'s O(log n) quietly assumes sortedness: **O(n + k) is only good when
`k` is O(n) or smaller.** If the key range dwarfs the number of elements being sorted, the `k` term
stops being a rounding error and starts being the whole cost.

Concrete and measured, not hypothetical. Sorting `n = 1000` random integers where the key range
roughly matches `n` (`k = 1000`) against the same count sorted with Python's built-in `sorted()`:

```
n=1000, k=1000:      counting sort took 0.000184s
n=1000, k=1000:      sorted() took       0.000073s
```

Counting sort is already not obviously winning here — Timsort's constant factor is small — but it's
at least in the same neighborhood. Now sort the identical `n = 1000` elements, but drawn from a much
wider range (`k = 10,000,000`) instead:

```
n=1000, k=10000000:  counting sort took 0.891184s
n=1000, k=10000000:  sorted() took       0.000076s
```

Nearly a full second against a hundred-and-fifty microseconds — over 10,000× slower, on the exact
same `n`. Nothing about the _data_ changed in a way that should matter to a sort; only the range it
was drawn from did. That's the whole lesson: `k` isn't a rounding error tacked onto `n`, it's a
genuine second variable, and an interview claim of "counting sort is O(n + k), so it's just faster
than comparison sorts" is incomplete without immediately following up with "as long as `k` doesn't
dwarf `n`." Sorting 100 integers known to range up to 10⁹ is a textbook case where counting sort is
the _wrong_ answer — the counts array alone would need on the order of a billion entries to sort a
hundred numbers, while `sorted()` pays exactly O(100 log 100) and doesn't care what the values are.

---

## Space: O(n + k)

The counts/prefix array costs O(k) — one integer slot per possible key value, most of which may end
up holding zero if the input is sparse within its range. The output array costs O(n) — one slot per
input element. Total auxiliary space: O(n + k), on top of the input array itself.

This is a genuinely different space profile from every comparison sort in this Part that claims an
in-place property. [[06-heap-sort|Chapter 6]] sorts in O(1) auxiliary space by rearranging the input
array in place, using the array itself as an implicit heap. Counting sort can't do that: the counts
array has to exist as a separate structure indexed by _value_, not by _position_, and the stable
version's output array has to exist separately from the input because elements are being placed at
final destinations computed from prefix sums that are still being consumed while the placement pass
runs. Trading away in-place-ness is part of the same bargain as trading away comparison-based
generality — counting sort buys its speed with both.

---

## Interview Angle: A Subroutine, Not a General-Purpose Answer

Counting sort rarely gets asked as "implement a sorting algorithm" in isolation, and reaching for it
as a default answer to "how would you sort this" is usually a signal of not having internalized the
`k` precondition above. Its real interview relevance is almost always one of three shapes:

- **Sorting small, known-bounded values directly** — characters (`k = 256` for a byte, `k = 26` for
  lowercase English letters), ages, grades, small counts — anywhere the problem statement hands you
  a guarantee about the range up front, which is exactly the signal that a non-comparison sort is
  even on the table.
- **As a building block inside a larger algorithm**, most commonly anagram or character-frequency
  problems, where counting sort's counting pass alone (without ever finishing the reconstruction) is
  the same mechanism behind a frequency-count solution — recognizing that connection is often the
  actual insight being tested, not the sort itself.
- **As radix sort's inner loop** ([[08-radix-sort|Chapter 8]], next), where counting sort runs once
  per digit and its stability is not a nice-to-have but a correctness requirement for the overall
  digit sort to work at all. This is the single most common place counting sort actually shows up in
  a real system rather than as a standalone answer — nobody reaches for bare counting sort to sort a
  general integer array in production, but a great many radix-sort-based sorts (bucket sorting
  network packet keys, sorting fixed-width IDs) are counting sort wearing a different name at each
  digit position.

The pattern worth internalizing: counting sort is rarely the final answer, but recognizing "the
values are integers in a small bounded range" as a distinct case from "the values are arbitrary and
only comparable" is the actual skill being tested, and it's the same recognition that makes radix
sort's digit-by-digit structure make sense in the next chapter.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
