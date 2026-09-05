---
title: "2 — Binary Search on Answer"
description: "Binary searching over a monotonic answer space instead of an array — the generalization that unlocks a large class of optimization problems."
tags: ["data-structures-algorithms","sorting-searching","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-50"
relations:
  - slug: data-structures-algorithms/07-sorting-and-searching/01-binary-search/01-binary-search
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/04-binary-search-pattern/04-binary-search-pattern
    kind: related
---

# 2 — Binary Search on Answer

Binary search over an array only works because the array is sorted — that was the entire premise of
the last chapter. But most interview problems that turn out to be binary search in disguise don't
hand you a sorted array at all. They hand you a range of possible answers — a minimum eating speed,
a maximum ship capacity, a smallest number of days — and ask you to find the best one in that range.
There's no array to sort. What you binary search instead is the space of candidate answers itself,
using a check function that plays exactly the role the sorted array used to: it tells you, with
certainty, which half of the remaining space can be thrown away. Same algorithm, different thing
being halved.

---

## The Generalization: Searching a Space of Answers, Not an Array

Ordinary binary search searches over **array indices**, and the reason it's allowed to discard half
the indices at every step is that the array's **values are sorted**. At `mid`, comparing
`array[mid]` to the target tells you, with certainty, which half of the remaining indices could
possibly contain the target — because sortedness guarantees everything to one side is `<=` the
midpoint value and everything to the other side is `>=` it.

Binary search on answer keeps the halving mechanism identical and swaps out what's being halved. The
search space is no longer array indices — it's a range of **candidate answers**, usually just a
contiguous range of integers: candidate eating speeds from 1 to `max(piles)`, candidate ship
capacities from the heaviest single package to the sum of all packages, candidate "maximum distance
between any two chosen items" from 0 to the full span of the input. There is no array of these
candidates sitting in memory — the range is described by two numbers, `lo` and `hi`, and every
integer in between is implicitly a valid candidate to test.

What replaces "compare `array[mid]` to the target" is a **feasibility check**:
`is_feasible(candidate) -> bool`, answering "would this candidate value actually work, if I
committed to it?" The entire validity of binary search on answer rests on one property of that
check: it has to be **monotonic** over the candidate range. Concretely, that means there exists some
threshold value `t` in `[lo, hi]` such that:

- for every candidate on one side of `t`, `is_feasible` returns `false`,
- for every candidate on the other side (including `t` itself), `is_feasible` returns `true`,
- and the check never flips back and forth as the candidate increases.

That's a step function — `false, false, false, ..., true, true, true` (or the mirror image). And a
step function over a range is structurally the _exact same thing_ as a sorted array for the purposes
of binary search: at any `mid`, evaluating `is_feasible(mid)` tells you with certainty which half of
the remaining range contains the threshold, precisely the way `array[mid] < target` told you which
half of the remaining indices contained the target in the previous chapter. Sortedness of values and
monotonicity of a predicate are the same underlying guarantee — "the space can be halved with
certainty at every step" — wearing two different costumes. Binary search doesn't care that one
version compares numbers in an array and the other evaluates a function; it only cares that that one
guarantee holds.

There are two mirror-image shapes this takes, depending on which side of the threshold the problem
wants:

- **Minimum feasible value.** The predicate looks like `false false false true true true` as the
  candidate increases — infeasible below some threshold, feasible at and above it. The problem wants
  the threshold itself: the smallest value where feasibility first turns on. This is the shape of
  "minimize the maximum load," "minimize the speed," "minimize the capacity."
- **Maximum feasible value.** The predicate looks like `true true true false false false` as the
  candidate increases — feasible below some threshold, infeasible at and beyond it. The problem
  wants one step before the flip: the largest value that's still feasible. This is the shape of
  "maximize the minimum distance," "maximize the number of X you can fit."

Both are the leftmost/rightmost boundary-finding from the previous chapter, replayed over a
different kind of space — `lo = mid + 1` / `hi = mid` is still doing the identical job of shrinking
toward a flip point, it's just a flip in a predicate's truth value instead of a flip from "less than
target" to "greater than or equal to target."

---

## The Recognition Signal

This pattern hides behind a small, recognizable set of phrasings. Look for:

- "**Minimize the maximum** [something]" — e.g., minimize the maximum load per truck, minimize the
  largest chunk.
- "**Maximize the minimum** [something]" — e.g., maximize the minimum distance between placed items.
- "Find the **minimum/maximum value of X** such that [some condition] holds" — minimum speed such that
  all piles finish in time, minimum capacity such that all packages ship on schedule, maximum number
  of days you can wait such that a resource still lasts.
- "What is the **smallest/largest possible** [value]" phrased as an optimization over a numeric
  parameter, rather than over which elements to pick.

The phrasing alone isn't sufficient — plenty of optimization problems are phrased this way and
aren't binary search on answer. The **decisive second signal** is: can you write a function
`is_feasible(candidate)` that answers "would this candidate work?" _without_ trying every other
candidate first — ideally in roughly `O(n)` or `O(n log n)`, a single pass or a sort over the input?
If checking one candidate's feasibility secretly requires evaluating all the other candidates too,
there's no monotonic structure to exploit and no time saved by binary searching. The whole win of
this pattern is turning "try every candidate answer, one at a time, from `lo` to `hi`" — a linear
scan over a potentially huge range — into "test `O(log(range))` candidates, each in one pass."

If both signals are present — the optimization phrasing _and_ a cheap, standalone feasibility check
— that's the pattern. The full catalog of problem phrasings that map to this shape lives in
[[04-binary-search-pattern|Part 14, Chapter 4]]; this chapter is about the mechanics once you've
spotted it.

---

## The Template

Define `lo` and `hi` as the smallest and largest values the answer could possibly take — these
usually fall directly out of the problem's constraints (the slowest sensible eating speed is 1 pile
per hour; the fastest useful one finishes the largest pile in a single hour, so `hi = max(piles)`).
Then binary search `[lo, hi]` exactly like the leftmost/rightmost variants from the previous
chapter, substituting `is_feasible(mid)` for the array comparison.

**Minimum feasible value** — feasible means "this works, try to do even better" (`hi = mid`);
infeasible means "this doesn't work, need something larger" (`lo = mid + 1`):

```python
def binary_search_min_feasible(lo: int, hi: int, is_feasible) -> int:
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if is_feasible(mid):
            hi = mid       # mid works — try to shrink further
        else:
            lo = mid + 1   # mid doesn't work — need to go bigger
    return lo              # smallest feasible value
```

This converges to the smallest value where feasibility flips from `false` to `true` — the loop
invariant is that `hi` is always a feasible value (or one past the range) and `lo` is always a
candidate that hasn't been ruled feasible yet, and they close in on each other until `lo == hi`.

**Maximum feasible value** — the mirror image, but the naive translation has a trap. If feasible
means "try to grow further," the tempting update is `lo = mid`, but combined with floor-division
midpoint (`mid = lo + (hi - lo) // 2`, which rounds _down_), `lo = mid` can leave `lo` unchanged
when `hi = lo + 1`, looping forever. Two ways to fix it:

```python
# Option A — round the midpoint up on this side, so `lo = mid` always makes progress
def binary_search_max_feasible(lo: int, hi: int, is_feasible) -> int:
    while lo < hi:
        mid = lo + (hi - lo + 1) // 2   # round UP
        if is_feasible(mid):
            lo = mid       # mid works — try to grow further
        else:
            hi = mid - 1   # mid doesn't work — need to go smaller
    return lo              # largest feasible value
```

```python
# Option B — invert the predicate and reuse the minimum-feasible search unchanged
def binary_search_max_feasible_via_min(lo: int, hi: int, is_feasible) -> int:
    # search for the smallest value where feasibility flips to FALSE, then step back one
    smallest_infeasible = binary_search_min_feasible(
        lo, hi + 1, lambda x: not is_feasible(x)
    )
    return smallest_infeasible - 1
```

Option B is worth internalizing on its own: every "maximize the feasible value" problem is a
"minimize the feasible value" problem on the _complement_ predicate, minus one — the identical
relationship as `bisect_left` versus `bisect_right` from the previous chapter, just restated for a
boolean predicate instead of an ordering comparison. In practice, most interview solutions reach for
Option A because it avoids the extra layer of indirection, but Option B is the one that generalizes
without re-deriving the off-by-one every time.

Both worked examples below are minimum-feasible searches — it's the far more common shape in
practice, since "minimize the resource needed to satisfy a constraint" comes up more often than
"maximize the value while staying feasible."

---

## Worked Example: Koko Eating Bananas

**Problem.** Koko has `piles` of bananas, `piles[i]` bananas in pile `i`. She has `h` hours before
the guards return. Each hour she picks one pile and eats up to `k` bananas from it — if the pile has
fewer than `k` bananas, she finishes that pile and doesn't start another one that same hour. Find
the **minimum integer eating speed `k`** such that she can finish every pile within `h` hours.

**Recognizing the shape.** "Minimum ... such that [condition holds]" — the condition being "finishes
within `h` hours." The candidate answer is the eating speed `k`, not an array index. Feasibility of a
given `k` is cheap to check: for each pile, the hours needed is `ceil(pile / k)` (she can't carry leftover
bananas into finishing a pile faster than one whole hour's worth of eating), summed across all piles.
That's one pass over `piles` — `O(n)` — independent of how large `k` or `h` actually are.

**Why the predicate is monotonic.** Fix a pile of size `p`. As `k` increases, `ceil(p / k)` is
**non-increasing** — a larger denominator can only produce the same or a smaller quotient, never a
larger one. Summing non-increasing terms across all piles gives a total hours function that is
itself non-increasing in `k`. So the moment some speed `k0` gets total hours down to `<= h`, every
speed faster than `k0` gets total hours down to `<= h` too — eating faster never costs more time, it
only ever helps or does nothing. That's the `false false false true true true` step function this
pattern needs, with `k` increasing left to right.

**Bounds.** The slowest speed worth considering is `k = 1`. The fastest speed worth considering is
`k = max(piles)` — at that speed, Koko clears the largest pile in exactly one hour, and every
smaller pile in one hour too, so it is always feasible and there is never a reason to search above
it.

```python
import math

def min_eating_speed(piles: list[int], h: int) -> int:
    def hours_needed(speed: int) -> int:
        return sum(math.ceil(pile / speed) for pile in piles)

    lo, hi = 1, max(piles)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if hours_needed(mid) <= h:
            hi = mid       # mid finishes in time — try a slower (smaller) speed
        else:
            lo = mid + 1   # mid is too slow — need a faster speed
    return lo
```

Traced on `piles = [3, 6, 7, 11]`, `h = 8`: `lo, hi` start at `1, 11`. At `mid = 6`, hours needed is
`1 + 1 + 2 + 2 = 6 <= 8` → feasible, `hi = 6`. At `mid = 3` (`lo=1, hi=6`), hours needed is
`1 + 2 + 3 + 4 = 10 > 8` → infeasible, `lo = 4`. At `mid = 5` (`lo=4, hi=6`), hours needed is
`1 + 2 + 2 + 3 = 8 <= 8` → feasible, `hi = 5`. At `mid = 4` (`lo=4, hi=5`), hours needed is
`1 + 2 + 2 + 3 = 8 <= 8` → feasible, `hi = 4`. Now `lo == hi == 4`, loop ends: minimum speed is `4`.
Four candidate speeds tested against a range of 11, not eleven.

---

## Worked Example: Capacity to Ship Packages Within D Days

**Problem.** `weights[i]` is the weight of the `i`-th package, and packages must ship **in the given
order** — no reordering, no splitting a package across days. Each day, load as many packages as fit
without the running total exceeding the ship's capacity `C`, then the ship departs for that day and
the load resets. Find the **minimum integer capacity `C`** such that all packages ship within `days`
days.

**Recognizing the shape.** Same "minimum ... such that" phrasing as Koko, and again the feasibility
check for a fixed capacity is a cheap, single greedy pass rather than a search of its own: walk the
packages in order, accumulate weight onto the current day; the moment adding the next package would
exceed capacity, close out the current day and start a new one with that package. Count the days
used and compare to the budget. That greedy simulation is the correct feasibility check because
packages ship in a fixed order — there's no benefit to holding a package back for a later day when
it would fit on the current one, so packing "as much as fits, then close the day" is always at least
as good as any other valid packing at that capacity.

**Why the predicate is monotonic.** As capacity increases, each day's greedy pass can pack the same
set of packages as before plus possibly more — a larger capacity ceiling never forces the simulation
to close a day _earlier_ than a smaller capacity would have. So the number of days needed is
**non-increasing** as capacity grows: more room per day can only reduce or maintain the day count,
never increase it. The moment some capacity `C0` gets the day count down to `<= days`, every larger
capacity does too — again `false false false true true true` as capacity increases.

**Bounds.** The capacity can never be smaller than the single heaviest package — if it were, that
package alone could never be loaded on any day, and the schedule is infeasible no matter how many
days are allowed. So `lo = max(weights)`. The capacity never needs to be larger than the sum of
every package's weight — at that capacity the entire shipment fits in a single day, which is always
feasible regardless of the day budget. So `hi = sum(weights)`.

```python
def ship_within_days(weights: list[int], days: int) -> int:
    def days_needed(capacity: int) -> int:
        day_count = 1
        current_load = 0
        for w in weights:
            if current_load + w > capacity:
                day_count += 1
                current_load = 0
            current_load += w
        return day_count

    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if days_needed(mid) <= days:
            hi = mid       # mid ships in time — try a smaller capacity
        else:
            lo = mid + 1   # mid needs too many days — need more capacity
    return lo
```

Traced on `weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`, `days = 5`: `lo = 10` (the heaviest package),
`hi = 55` (the total). The search converges to `C = 15` — five days of `[1,2,3,4,5]`, `[6,7]`,
`[8]`, `[9]`, `[10]` (or an equivalent packing), and no capacity below `15` closes the schedule in
five days or fewer. As with Koko, the greedy `days_needed` pass runs once per candidate capacity
tested, not once per possible capacity value.

Notice both worked examples share the identical control-flow skeleton — `while lo < hi`, `hi = mid`
on feasible, `lo = mid + 1` on infeasible — with nothing problem-specific except what `is_feasible`
computes and how `lo`/`hi` are derived from the input. That skeleton _is_ the pattern; everything
else is filling in the blank.

---

## Complexity

Binary search on answer costs **O(n · log(range))**, where `n` is the input size (the cost of one
`is_feasible` call — a single pass over `piles` or `weights` in both examples above) and `range` is
`hi - lo`, the width of the initial candidate span. The `log(range)` factor comes from the same
halving argument as ordinary binary search, just applied to an integer range instead of an index
range: each iteration eliminates half of the remaining candidates with certainty, so the number of
candidates actually tested is `O(log(range))` regardless of how large `range` is in absolute terms —
searching `[1, 10^9]` costs only about 30 feasibility checks, not a billion.

That log factor is the entire reason this pattern exists. The naive alternative — test every
candidate answer from `lo` to `hi` one at a time until the first (or last) feasible one turns up —
is `O(n · range)`, linear in the size of the answer space rather than logarithmic in it. When
`range` can be in the millions or billions (weights, speeds, distances), that difference is the gap
between a solution that finishes and one that times out. The feasibility check does the same `O(n)`
work either way; binary search on answer only changes _how many times_ that check has to run.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
