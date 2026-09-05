---
title: "5 — Longest Increasing Subsequence"
description: "The O(n²) DP with full state/transition derivation and predecessor-based reconstruction, the O(n log n) patience-sorting reformulation built directly on bisect_left, a proof sketch for why the tails array stays sorted, and when the quadratic version's easy reconstruction is worth trading away for the logarithmic version's speed."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-65"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/01-dp-fundamentals/01-dp-fundamentals
    kind: depends_on
  - slug: data-structures-algorithms/07-sorting-and-searching/01-binary-search/01-binary-search
    kind: depends_on
---

# 5 — Longest Increasing Subsequence

Longest Increasing Subsequence asks a simple question: given an array of integers, what's the length
of the longest subsequence — elements need not be contiguous, but their relative order in the array
must be preserved — that's strictly increasing? `[10, 9, 2, 5, 3, 7, 101, 18]` hides a subsequence
`[2, 5, 7, 101]` of length 4, and no increasing subsequence in that array is longer. The obvious way
to compute that number is a straightforward O(n²) DP, and nothing about it should be surprising once
[[01-dp-fundamentals|Part 08, Chapter 1]]'s vocabulary is in hand. What's genuinely surprising is
that there's a second, sharper solution — O(n log n) — and it isn't a different algorithm bolted
onto the first one as an optimization. It's the same problem, looked at from a different angle,
revealing that LIS secretly contains a binary-search-shaped subproblem the O(n²) version never
exposes. That connection — a dynamic programming problem and
[[01-binary-search|Part 07, Chapter 1]]'s leftmost-insertion-point search turning out to be, almost
literally, the same operation wearing different clothes — is worth making explicit rather than just
asserting "there's a faster way," and it's the actual subject of this chapter. The O(n²) version is
the warm-up; the reformulation is the point.

---

## The O(n²) DP: State, Transition, and a Trace

### State and transition

Following the process [[01-dp-fundamentals|Part 08, Chapter 1]] establishes — define the state
first, and let the transition fall out of it, rather than guessing at a recurrence and hoping it
covers every case — the state here is:

`dp[i]` = the length of the longest increasing subsequence that **ends exactly at index i**. Not
just any increasing subsequence contained in `arr[0..i]` — one specifically required to use `arr[i]`
as its final element.

That specificity is what makes the transition tractable. To compute `dp[i]`, look at every earlier
index `j < i`. If `arr[j] < arr[i]`, then any increasing subsequence ending at `j` can be extended
by appending `arr[i]`, producing a longer one ending at `i`. Take the best such extension:

```
dp[i] = 1 + max(dp[j] for j in range(i) if arr[j] < arr[i])
```

The base case isn't a separate line of code, and it's worth pausing on why. When no earlier `j`
satisfies `arr[j] < arr[i]` — the very first index, or any index whose value is smaller than
everything before it — the `max` above ranges over an empty set. Taking that `max` as 0 (which is
exactly what falls out of initializing `dp[i] = 1` and only overwriting it when a candidate strictly
improves on it, rather than special-casing "no valid j") gives `dp[i] = 1 + 0 = 1`: the element
alone is trivially an increasing subsequence of length 1. That's the base case —
[[01-dp-fundamentals|Part 08, Chapter 1]]'s term for the piece of the recurrence that doesn't depend
on a smaller subproblem — and here it emerges as a natural consequence of the general transition
rather than needing its own branch.

The overlapping-subproblems property [[01-dp-fundamentals|Part 08, Chapter 1]] named is visible
directly in this transition: `dp[j]` for a fixed `j` gets read by every later `dp[i]` with
`arr[j] < arr[i]` — potentially by all of them. Memoizing it once, instead of recomputing "the
longest increasing subsequence ending at `j`" from scratch every time a later index needs it, is the
entire reason this is a DP problem and not a plain exponential recursive search over all `2ⁿ`
subsequences.

**The answer to the whole problem is `max(dp)`, not `dp[n-1]`.** This is worth flagging explicitly
because it's a genuinely common bug: `dp[i]` measures subsequences ending at `i`, and nothing
guarantees the overall longest increasing subsequence ends at the array's last index — in the trace
below, it doesn't. Reading off `dp[n-1]` silently answers a narrower question ("what's the longest
increasing subsequence that happens to end at the last element") and returns a wrong, usually
too-small, answer without raising any error at all.

### Trace: `[10, 9, 2, 5, 3, 7, 101, 18]`

```python
def lis_with_predecessors(arr: list[int]) -> tuple[list[int], list[int]]:
    """Return (dp, predecessor) where dp[i] is the LIS length ending at i."""
    n = len(arr)
    dp = [1] * n
    predecessor = [-1] * n

    for i in range(n):
        for j in range(i):
            if arr[j] < arr[i] and dp[j] + 1 > dp[i]:
                dp[i] = dp[j] + 1
                predecessor[i] = j

    return dp, predecessor
```

Running this on `arr = [10, 9, 2, 5, 3, 7, 101, 18]`:

| `i` | `arr[i]` | qualifying `j` (`arr[j] < arr[i]`), with `dp[j]`           | `dp[i]` | `predecessor[i]` |
| --- | -------- | ---------------------------------------------------------- | ------- | ---------------- |
| 0   | 10       | none                                                       | 1       | —                |
| 1   | 9        | none (`10 < 9` is false)                                   | 1       | —                |
| 2   | 2        | none                                                       | 1       | —                |
| 3   | 5        | `j=2` (`dp=1`)                                             | 2       | 2                |
| 4   | 3        | `j=2` (`dp=1`)                                             | 2       | 2                |
| 5   | 7        | `j=2` (1), `j=3` (2), `j=4` (2)                            | 3       | 3                |
| 6   | 101      | `j=0`(1), `j=1`(1), `j=2`(1), `j=3`(2), `j=4`(2), `j=5`(3) | 4       | 5                |
| 7   | 18       | `j=0`(1), `j=1`(1), `j=2`(1), `j=3`(2), `j=4`(2), `j=5`(3) | 4       | 5                |

Final `dp = [1, 1, 1, 2, 2, 3, 4, 4]`. Notice indices 6 and 7 tie at `dp[i] = 4`, and the array's
last index (`i=7`, value 18) is one of the tying entries, not the unique winner — a small warning
sign that `dp[n-1]` was never a safe place to read the answer from. `max(dp) = 4` is the LIS length,
achieved first at `i=6`.

### Reconstructing the subsequence

The length alone is only half the problem in most interview framings — usually the actual
subsequence is wanted too. That's what `predecessor` is for: `predecessor[i]` records which earlier
index the winning extension at `i` came from, so walking those pointers backward from whichever
index achieves `max(dp)` recovers the subsequence itself, not just its length.

```python
def reconstruct(arr: list[int], dp: list[int], predecessor: list[int]) -> list[int]:
    best_i = max(range(len(dp)), key=lambda i: dp[i])  # index achieving max(dp), not necessarily n-1
    subsequence = []
    i = best_i
    while i != -1:
        subsequence.append(arr[i])
        i = predecessor[i]
    subsequence.reverse()
    return subsequence
```

Run on the same array and the `dp`/`predecessor` pair above: `best_i = 6` (`arr[6] = 101`, the first
index tying for `dp[i] = 4`). Walking `predecessor` backward: `predecessor[6] = 5` (`arr[5] = 7`) →
`predecessor[5] = 3` (`arr[3] = 5`) → `predecessor[3] = 2` (`arr[2] = 2`) → `predecessor[2] = -1`,
stop. Collected in reverse-walk order that's `[101, 7, 5, 2]`; reversing gives the subsequence in
its actual left-to-right order:

```
subsequence = [2, 5, 7, 101]
```

Confirmed by actually running both functions together: `dp = [1, 1, 1, 2, 2, 3, 4, 4]`,
`predecessor = [-1, -1, -1, 2, 2, 3, 5, 5]`, `max(dp) = 4`, `subsequence = [2, 5, 7, 101]` — an
increasing subsequence of the original array, in original order, of the length the DP claims is
optimal.

---

## Complexity of the O(n²) Version

**Time: O(n²).** For each index `i`, the inner loop scans every earlier index `j < i`. Summed over
all `i`, that's `0 + 1 + 2 + ... + (n-1)` comparisons — the same arithmetic series
[[04-quick-sort|Part 07, Chapter 4]]'s worst-case derivation summed for a different reason — which
is `Θ(n²)`.

**Space: O(n).** The `dp` array and the `predecessor` array are each sized `n`, and nothing else
grows with input size. Straightforward on both counts — the interesting complexity story in this
chapter is the one below, not this one.

---

## The O(n log n) Reformulation: Patience Sorting

The O(n²) version's cost comes from one place: for each `i`, it re-scans every earlier `j` to find
the best `dp[j]` among those with `arr[j] < arr[i]`. If that "best value satisfying a threshold"
lookup could be done faster than a linear scan, the whole algorithm would speed up — and that's
exactly what a cleverly-maintained auxiliary array buys, at the cost of no longer tracking `dp[i]`
per index at all. The technique has a name — **patience sorting**, borrowed from the solitaire card
game it resembles, where cards are dealt onto piles under a similar greedy rule — but the name
matters less than the invariant it maintains.

### The `tails` invariant

Maintain an array `tails`, where **`tails[k]` holds the smallest possible tail value of any
increasing subsequence of length `k + 1` found so far**, among the elements scanned up to the
current point in the array.

That phrase — "smallest possible tail value... found so far" — is doing a lot of work, and the part
people get confused about is exactly this: **`tails` is not, in general, an actual subsequence that
occurs in the array.** It's a greedy, evolving best-case scenario — a record of "if I wanted an
increasing subsequence of length `k + 1`, the smallest value I could possibly end it on, given
everything scanned so far" — not a claim that those specific values occur together, in that order,
at increasing array indices. Only `tails`' **length** at any point is guaranteed to equal the LIS
length found among the elements scanned so far; the values inside it are a bookkeeping device, not a
witness.

That distinction is concrete enough to demonstrate, and it's worth demonstrating on a case where it
actually bites (the chapter's main example turns out — somewhat by luck — to leave `tails` as a
valid subsequence at the end, which would undersell the point). Take `arr = [0, 8, 4, 12, 2]` and
track, alongside `tails` itself, which array index currently occupies each slot:

```python
import bisect

arr = [0, 8, 4, 12, 2]
tails, tails_source_idx = [], []

for idx, x in enumerate(arr):
    pos = bisect.bisect_left(tails, x)
    if pos == len(tails):
        tails.append(x)
        tails_source_idx.append(idx)
    else:
        tails[pos] = x
        tails_source_idx[pos] = idx
```

Run to completion: `tails = [0, 2, 12]`, sourced from array indices `[0, 4, 3]`. Index 4 (the `2`)
sits to the _left_ of index 3 (the `12`) in `tails`, but 4 comes _after_ 3 in the actual array — so
reading `tails` off the array in the order its values were sourced would require jumping backward
from index 4 to index 3. That's not a valid subsequence; a subsequence must be read at strictly
increasing array indices. `tails = [0, 2, 12]` is real, and its _length_ (3) is a guarantee — but
the values themselves were never claimed to co-occur as an actual increasing run in the array, only
to represent the best (smallest) tail achievable for each length, independent of which elements
happened to produce it.

### The update rule, and why it's exactly `bisect_left`

For each new element `x` scanned from the array, in order:

- If `x` is larger than every element currently in `tails`, **append** it — `x` extends the longest
  chain found so far by one, achieving a new longest length.
- Otherwise, find the **leftmost position** in `tails` where `x` could be inserted without breaking
  the "smallest possible tail" invariant, and **overwrite** that position with `x`. Overwriting —
  not inserting — is deliberate: replacing a larger tail value with a smaller one at the same length
  can only help future extensions, never hurt them, and `tails`' length must stay exactly the LIS
  length found so far, so growing it here would be wrong.

That "find the leftmost position `x` could be inserted at" operation, performed against an array
that's maintained sorted, is not merely _similar_ to `bisect_left` — it **is** `bisect_left`,
exactly as [[01-binary-search|Part 07, Chapter 1]]'s "Python's `bisect` Module" section defines it:
the first index `i` such that `tails[i] >= x`. This is the payoff the opening of this chapter
promised: LIS's O(n log n) algorithm isn't "DP plus an unrelated trick someone happened to bolt on."
It's a direct application of the leftmost-insertion-point search that chapter already fully derived,
pointed at a cleverly-maintained auxiliary array instead of the original input.

### Why `tails` stays sorted, and why replacing is always safe

Both claims need an actual argument, not just an assertion that it works out.

**`tails` stays sorted — by induction over the scan.** Base case: `tails` starts empty, which is
trivially sorted. Inductive step: assume `tails` is sorted before processing element `x`. Exactly
one of the two update branches fires:

- **Append.** By definition, this branch only fires when `x` is larger than every element currently
  in `tails` — i.e., larger than `tails`' current last (and largest) element. Appending a value
  larger than the current maximum onto the end preserves sortedness by construction.
- **Replace at position `pos = bisect_left(tails, x)`.** `bisect_left` guarantees `pos` is the
  leftmost index where `x` could sit without violating sort order against the _current_ `tails` —
  meaning `tails[pos - 1] < x <= tails[pos]` (with the lower bound vacuous if `pos == 0`). Writing
  `x` into `tails[pos]` produces a value that's still `> tails[pos - 1]` and still
  `<= tails[pos + 1]` (the old value at that slot), since `x <= tails[pos] <= tails[pos + 1]` by the
  prior sortedness assumption. Sortedness survives.

Either way, `tails` is sorted after the update, which is exactly what lets the _next_ element's
`bisect_left` call be valid — the invariant that justifies binary search over `tails` is maintained
by every single operation that touches it, not assumed once at the start.

**Replacing is always safe, never harmful.** Suppose the replace branch overwrites `tails[pos]`,
previously some value `old > x`, with `x`. Both `old` and `x` represent achievable tail values for
an increasing subsequence of length `pos + 1` — the invariant says `tails[pos]` always holds _some_
achievable tail at that length, and both were achievable given what's been scanned. Since `x < old`,
any future element `y` that could have extended a subsequence ending in `old` (i.e. `old < y`) can
_also_ extend one ending in `x`, because `x < old < y`. The reverse doesn't necessarily hold: some
`y` with `x < y <= old` could extend a chain ending at `x` but not one ending at `old`. So swapping
in the smaller value only ever **widens** the set of future elements that can extend a
length-`(pos + 1)` chain — it never narrows it. That's the entire argument for why "keep the
smallest possible tail at each length" is the right greedy invariant to maintain: a smaller tail is
a strictly better (or equal) position to extend from, for every possible future.

### Trace: `tails`' evolution over the same array

Running the update rule against `arr = [10, 9, 2, 5, 3, 7, 101, 18]` — the identical array the O(n²)
version traced above — element by element:

| `x` | `bisect_left(tails, x)` | action                             | `tails` after    |
| --- | ----------------------- | ---------------------------------- | ---------------- |
| 10  | 0                       | append (tails was empty)           | `[10]`           |
| 9   | 0                       | replace `tails[0] = 10` with `9`   | `[9]`            |
| 2   | 0                       | replace `tails[0] = 9` with `2`    | `[2]`            |
| 5   | 1                       | append                             | `[2, 5]`         |
| 3   | 1                       | replace `tails[1] = 5` with `3`    | `[2, 3]`         |
| 7   | 2                       | append                             | `[2, 3, 7]`      |
| 101 | 3                       | append                             | `[2, 3, 7, 101]` |
| 18  | 3                       | replace `tails[3] = 101` with `18` | `[2, 3, 7, 18]`  |

Final `tails = [2, 3, 7, 18]`, length 4 — matching `max(dp) = 4` from the O(n²) trace exactly, on
the identical input. (This particular final `tails` does happen to read off as a valid increasing
subsequence of the array — index 2, 4, 5, 7 in increasing order — which is why the
`[0, 8, 4, 12, 2]` example above, not this one, is what demonstrates that `tails` isn't reliably a
real subsequence. Both facts are true at once: the length is always trustworthy, the values only
sometimes happen to line up into something real.)

---

## Full O(n log n) Code, Verified Against the O(n²) Version

```python
import bisect

def lis_length(arr: list[int]) -> int:
    """Return the length of the longest strictly increasing subsequence."""
    tails: list[int] = []
    for x in arr:
        pos = bisect.bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)
        else:
            tails[pos] = x
    return len(tails)
```

That's the entire algorithm — the `bisect_left` call is doing the work
[[01-binary-search|Part 07, Chapter 1]] already derived; nothing about its mechanics needs
re-deriving here.

Verified by generating randomized arrays across several sizes and value ranges and confirming this
returns the same length as the O(n²) `dp`-based version on every one:

```python
import random

def lis_length_n2(arr: list[int]) -> int:
    n = len(arr)
    if n == 0:
        return 0
    dp = [1] * n
    for i in range(n):
        for j in range(i):
            if arr[j] < arr[i] and dp[j] + 1 > dp[i]:
                dp[i] = dp[j] + 1
    return max(dp)

random.seed(42)
configs = [(5, 5), (10, 10), (20, 6), (50, 15), (100, 30), (200, 50)]  # (size, value range)
trials = 0
for size, value_range in configs:
    for _ in range(200):
        arr = [random.randint(0, value_range) for _ in range(size)]
        assert lis_length_n2(arr) == lis_length(arr)
        trials += 1

print(f"All {trials} randomized trials agree.")
# All 1200 randomized trials agree.
```

Actually run: **all 1,200 trials across six size/value-range configurations agree.** Note precisely
what that verification does and doesn't establish: it confirms both versions return the same LIS
_length_. It says nothing about the actual subsequence, because `lis_length` above never constructed
one — `tails` was never designed to hand one back. That asymmetry — the O(n²) version reconstructs
the subsequence almost for free via `predecessor`; the O(n log n) version doesn't, by default — is
the real trade-off between the two, not a gap in the faster version's correctness.

---

## Reconstructing the Subsequence in O(n log n)

It's possible, but meaningfully more intricate than the O(n²) version's reconstruction, and the
O(n²) version already fully derived the reconstruction pattern — a second full implementation here
would be redundant depth rather than new insight. The shape of the fix: maintain a `predecessor`
array indexed by **original array position** (not by `tails` position, which gets overwritten and
would lose history), alongside a parallel array recording which array index currently occupies each
`tails` slot. Every time an element `x` at array index `i` is placed into `tails` — whether by
appending or by replacing — set `predecessor[i]` to whichever array index currently occupies
`tails[pos - 1]` (the slot immediately before the one `x` just took), or `-1` if `pos == 0`. Once
the full array has been scanned, find the array index currently occupying `tails`' last slot — that
index is the end of some longest increasing subsequence — and walk `predecessor` backward from there
exactly as the O(n²) version's `reconstruct` function does. The intricacy isn't in the walk-back
step, which is identical; it's in correctly maintaining `predecessor` at _array-index_ granularity
while `tails` itself is being overwritten in place, since the position that currently looks like
"the end of the chain" changes as later elements replace earlier ones.

---

## When Each Version Is the Right Answer

- **O(n²)** when the actual subsequence — not just its length — is needed, and simplicity and
  straightforward reconstruction matter more than squeezing out the last factor of `n`. The
  `predecessor` array falls out of the natural transition with no extra bookkeeping.
- **O(n log n)** when only the length is needed, or `n` is large enough that the quadratic version's
  `n²` comparisons are actually impractical. Reconstruction is still possible (previous section) but
  costs real extra bookkeeping the O(n²) version gets for free — a fair trade when length alone is
  the question being asked, less obviously a good trade when the subsequence itself is the
  deliverable and `n` isn't large enough for the quadratic cost to matter.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
