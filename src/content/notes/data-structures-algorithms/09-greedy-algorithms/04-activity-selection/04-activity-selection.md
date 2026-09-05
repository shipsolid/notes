---
title: "4 — Activity Selection"
description: "Maximizing the count of non-overlapping activities on one resource by sorting on finish time, proved optimal with the book's most rigorous exchange argument."
tags: ["data-structures-algorithms","greedy","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-73"
relations:
  - slug: data-structures-algorithms/09-greedy-algorithms/01-greedy-strategy/01-greedy-strategy
    kind: depends_on
  - slug: data-structures-algorithms/09-greedy-algorithms/02-interval-scheduling/02-interval-scheduling
    kind: related
---

# 4 — Activity Selection

[[01-greedy-strategy|Part 09, Chapter 1]] named the two obligations every greedy algorithm has to
discharge before it can be trusted — the greedy-choice property and optimal substructure — and
pointed here rather than proving either one in place, because activity selection is where that proof
is cleanest to carry out in full. [[02-interval-scheduling|Part 09, Chapter 2]] is the applied side
of the same territory: the broader family of resource-allocation problems — rooms, machines, people
— where "sort by some key, scan once" is the recurring move, and where the practical variety
(multiple resources, deadlines, mixed objectives) matters more than any single proof. This chapter
narrows to the opposite end: one resource, every activity worth exactly the same, maximize count,
and a correctness argument carried through every step rather than cited. It's the classical textbook
problem for a reason — it's the shortest path to seeing an exchange argument in its complete,
unabridged form, and every other greedy proof in this book either reuses this shape or explains
precisely why it can't.

---

## The Problem

**Input:** `n` activities `a_1, ..., a_n`, each with a start time `s_i` and a finish time `f_i`
(`s_i < f_i`), all competing for a single resource that can host only one activity at a time — one
room, one machine, one reviewer, doesn't matter which. Two activities `i` and `j` are **compatible**
if their intervals `[s_i, f_i)` and `[s_j, f_j)` don't overlap — equivalently, `f_i <= s_j` or
`f_j <= s_i`. The half-open interval convention is deliberate: an activity finishing at the exact
instant another starts counts as compatible, because the resource is free again at that instant, not
still occupied by the one that just ended.

**Output:** a subset of pairwise-compatible activities of **maximum cardinality** — not maximum
total duration, not any particular activity guaranteed a seat, just the largest count of activities
that can share the one resource without ever double-booking it.

This is interval scheduling with two simplifying assumptions locked in: exactly one resource, not
`k` of them, and every activity worth identically one unit toward the objective, not a weighted
value. Both restrictions do real work. Lift the first and the problem becomes the multi-resource
scheduling variety [[02-interval-scheduling|Part 09, Chapter 2]] surveys. Lift the second and the
problem becomes the DP problem this chapter's closing section builds toward. With both restrictions
in place, though, the problem has an exact, provably optimal greedy solution — which is exactly why
this is the chapter chosen to carry the proof, rather than either of its two more general cousins.

---

## The Greedy Algorithm

Sort the activities by finish time, ascending, breaking ties by any fixed rule (original index is
fine — the argument below only needs a total order, not a particular tie-break). Scan once, left to
right, tracking the finish time of the most recently selected activity. An activity gets selected
the moment it's compatible with that running finish time; once selected, the running finish time
updates to this activity's own finish time and the scan continues.

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class Activity:
    name: str
    start: int
    finish: int


def select_activities(activities: list[Activity]) -> list[Activity]:
    """Return a maximum-cardinality set of pairwise-compatible activities."""
    ordered = sorted(activities, key=lambda a: a.finish)
    selected: list[Activity] = []
    last_finish = float("-inf")
    for activity in ordered:
        if activity.start >= last_finish:
            selected.append(activity)
            last_finish = activity.finish
    return selected
```

Sorting by finish time is the one ordering that works, and it's worth naming why the two obvious
alternatives fail before trusting it on faith. Sorting by **start time** can pick whatever activity
happens to start first even when it runs long and blocks everything else — an activity spanning
`(0, 10)` beats every activity that starts at `1` on start time alone, and greedily taking it can
cost the rest of the schedule everything. Sorting by **shortest duration** fails for a related
reason: given a short activity `(4, 6)` and two longer but mutually compatible activities `(0, 5)`
and `(5, 10)`, shortest-first takes `(4, 6)`, which overlaps both of the others and locks the
selection at size `1`, where taking the two longer ones instead gives size `2`. Finish time is the
one key that never throws away schedule room it doesn't have to — selecting the compatible activity
that frees the resource earliest can only leave _more_ of the timeline open for what comes after it,
never less. That intuition is the informal version of the proof below.

---

## Proof by Exchange Argument

**Claim.** The greedy algorithm's output is a maximum-cardinality set of pairwise-compatible
activities.

**Setup.** Relabel the input so `a_1, ..., a_n` are already sorted by finish time,
`f_1 <= f_2 <= ... <= f_n` — exactly the order the greedy scan uses. Let `G = (g_1, g_2, ..., g_k)`
be greedy's actual selections, listed in the order it selected them, which — because it scans in
finish-time order — is also sorted by finish time. Let `O = (o_1, o_2, ..., o_m)` be _any_ optimal
solution, also relabeled by increasing finish time. Because `O` is optimal, it's at least as large
as any feasible selection, in particular `m >= k`; the entire proof obligation is closing that
inequality the other way, to `k >= m`, which forces `k = m` and makes `G` optimal too.

**The first exchange.** `g_1` is, by construction, the activity with the smallest finish time among
_all_ `n` input activities — greedy's scan finds it before selecting anything else. `o_1` is only
the smallest-finish activity _within_ `O`, a subset of the full input, so `f(g_1) <= f(o_1)`: a
minimum taken over a superset can't exceed a minimum taken over one of its subsets. Now check that
swapping `o_1` out for `g_1` keeps `O` valid. Every other activity `o_j` (`j >= 2`) that `O` keeps
is compatible with `o_1`, and because `O`'s selections are pairwise non-overlapping and sorted by
finish time, that compatibility means `s(o_j) >= f(o_1)` for every `j >= 2` — `o_1` finishes at or
before every other kept activity starts. Chaining the two inequalities,
`s(o_j) >= f(o_1) >= f(g_1)`, so `g_1` is compatible with everything `O` keeps besides `o_1`. Define
`O' = (g_1, o_2, ..., o_m)`. It's a valid selection of the same size `m`, hence optimal too, and its
first element now matches `G`'s first element exactly.

**The reduced subproblem.** Because `O'` is optimal and fixes `g_1` as its first pick, the tail
`(o_2, ..., o_m)` has to be an optimal solution to the _reduced_ instance: activity selection
restricted to activities with `s >= f(g_1)` — precisely the candidate pool greedy consults for its
second pick, having just committed to `g_1`. If some other selection on that reduced instance beat
`(o_2, ..., o_m)` in size, prepending `g_1` to it would beat `O'` on the full problem, contradicting
`O'`'s optimality. This reduced instance is activity selection again, just with a shrunk candidate
pool — nothing about its shape changed, only its size.

**Closing the induction.** Apply the first-exchange argument again, this time to the reduced
instance and its optimal tail: `g_2` is the earliest-finishing activity among candidates with
`s >= f(g_1)`, exactly what greedy selects next, and the same chain-of-inequalities argument swaps
`o_2` for `g_2` without shrinking the solution. Repeating this once per element of `G` — `k` times —
produces a chain of same-size optimal solutions ending at `(g_1, ..., g_k, o_{k+1}, ..., o_m)`, _if_
`m > k`. But that solution's existence means `o_{k+1}` is compatible with `g_k` (the chained
inequality at step `k` guarantees exactly this), which means the candidate pool greedy consults
after selecting `g_k` — activities with `s >= f(g_k)` — is non-empty. Greedy scans that entire pool
and selects the first compatible activity it finds, so a non-empty pool contradicts greedy having
stopped at exactly `k` selections. `m > k` is therefore impossible. Combined with `m >= k` from the
setup, this forces `m = k`.

**Conclusion.** `O` was an arbitrary optimal solution, and the argument shows `|O| = |G|` for any
such `O`. Greedy's output matches the optimal count exactly — it _is_ optimal. This is the induction
[[01-greedy-strategy|Part 09, Chapter 1]] promised: greedy-choice property (the first exchange,
showing the locally best choice extends to a full optimum) plus optimal substructure (the
reduced-subproblem step, showing the rest of an optimal solution is itself optimal on what remains)
combine, one swap per selection, into a full proof rather than a plausibility argument.

---

## Worked Example: Six Activities, One Room

Six activities compete for a single conference room, given here in arbitrary input order:

| Activity | Start | Finish |
| -------- | ----- | ------ |
| A        | 1     | 8      |
| B        | 2     | 5      |
| C        | 1     | 3      |
| D        | 4     | 7      |
| E        | 6     | 9      |
| F        | 8     | 10     |

Sorted by finish time: `C(1,3), B(2,5), D(4,7), A(1,8), E(6,9), F(8,10)`. Tracing the greedy scan
with `last_finish` starting at `-inf`:

| Activity | Start | Finish | `start >= last_finish`? | Decision | `last_finish` after |
| -------- | ----- | ------ | ----------------------- | -------- | ------------------- |
| C        | 1     | 3      | `1 >= -inf` — yes       | select   | 3                   |
| B        | 2     | 5      | `2 >= 3` — no           | skip     | 3                   |
| D        | 4     | 7      | `4 >= 3` — yes          | select   | 7                   |
| A        | 1     | 8      | `1 >= 7` — no           | skip     | 7                   |
| E        | 6     | 9      | `6 >= 7` — no           | skip     | 7                   |
| F        | 8     | 10     | `8 >= 7` — yes          | select   | 10                  |

Final selection: `{C, D, F}` — three activities, `(1,3)`, `(4,7)`, `(8,10)`, tiling most of the
timeline with small gaps and no overlap. `B` and `A` both lose to `C` because they start before `C`
frees the room at `3`; `A`'s enormous `(1,8)` span in particular is the same start-time-greedy trap
named above, made concrete — its early start is worthless once something with a much earlier finish
has already claimed the room. `E` loses to `D` on the identical logic, one round later. No
alternative selection of four mutually compatible activities exists among these six — the proof
above guarantees it, and hand-checking every remaining combination confirms it directly.

**Complexity:** O(n log n), dominated entirely by the initial sort. The scan that follows is a
single linear pass — one comparison and at most one assignment per activity — so it costs O(n) and
never dominates the sort for any `n` greater than a small constant.

---

## When Greedy Stops Working: The Weighted Variant

Give every activity a value `w_i` and change the objective from "maximize count" to "maximize total
value of the non-overlapping activities selected," and the greedy algorithm above stops being
correct — not approximately correct, _wrong_, on inputs as small as two activities. Take `A(1, 2)`
with `w = 1` and `B(0, 5)` with `w = 10`, overlapping each other entirely. Sorted by finish time,
`A` comes first and greedy selects it, after which `B` is incompatible (`0 < 2`) and never gets a
chance — final value `1`. The optimal answer is `{B}` alone, value `10`. Finish-time order stopped
being a safe proxy for "leaves the most value on the table for later" the moment value stopped being
uniform across activities — a high-value activity can lose to an earlier, cheaper one it never had a
chance to outcompete, because the greedy scan commits before it ever looks at what it's giving up.

This is the DP problem [[01-dp-fundamentals|Part 08, Chapter 1]] built the vocabulary for: state,
transition, base case. Sort by finish time as before — the ordering is still useful, just no longer
sufficient on its own — and define `p(i)` as the index of the latest activity in that sorted order
that's compatible with activity `i` (the largest `j < i` with `f_j <= s_i`), found in O(log n) per
activity via binary search over the sorted finish times ([[01-binary-search|Part 07, Chapter 1]]'s
technique, applied here rather than re-derived). The state is `OPT(i)`, the best achievable value
using only activities `1` through `i`; the transition is the two-way choice DP fundamentals named as
the actual design decision — include activity `i` and jump to whatever was best before its conflicts
started, or exclude it and keep whatever was already best through `i - 1`:

```python
OPT(i) = max(OPT(i - 1), w_i + OPT(p(i)))
```

with `OPT(0) = 0` as the base case. Building `p(i)` for all `n` activities costs O(n log n), and
filling `OPT` bottom-up afterward costs O(n) more — same total order of growth as the unweighted
problem, but for a fundamentally different reason: no single local choice can be trusted to extend
to a global optimum anymore, so every choice has to be weighed against its alternative and cached,
rather than made once and never revisited. That's the line this whole chapter has been drawing:
greedy is correct exactly when the exchange argument above goes through unmodified, and it stops
being correct the moment an assumption that argument leaned on — here, "every activity worth the
same" — gets lifted.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
