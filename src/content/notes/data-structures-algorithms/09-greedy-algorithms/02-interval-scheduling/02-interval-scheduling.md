---
title: "2 — Interval Scheduling"
description: "Three concrete interval problems — removal, merging, and room counting — built on one recurring decision: which sort key, start, end, or duration, the greedy choice actually needs."
tags: ["data-structures-algorithms","greedy","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-71"
relations:
  - slug: data-structures-algorithms/09-greedy-algorithms/04-activity-selection/04-activity-selection
    kind: related
---

# 2 — Interval Scheduling

[[01-greedy-strategy|Chapter 1]] established the greedy-choice property and optimal substructure as
the two conditions that license a greedy algorithm at all, and reached for a single example —
non-overlapping intervals — to make the shape concrete before either property had a name.
[[04-activity-selection|Chapter 4]], later in this Part, comes back to that exact example and does
the job this chapter deliberately skips: the formal exchange-argument proof that
earliest-finish-time greedy produces a provably optimal schedule, stated once, cleanly, as the
canonical textbook result. This chapter has a different job. It takes that proof as given and asks
the question the proof alone doesn't answer: given an interval problem, which of start time, end
time, or duration should the greedy choice actually sort by — and how does that answer change once
the problem stops being "maximize how many intervals you can keep" and becomes "merge everything
that touches" or "count the worst simultaneous overlap"? Three worked problems below carry that
question through, in order of how far each one departs from the sort-by-end-time reflex.

---

## Sorting by Start, End, or Duration

Every interval problem in this chapter starts with the same decision: sort the intervals by one of
three keys before doing anything greedy with them. Getting that choice right is most of the battle,
and the three keys are not interchangeable.

**End time** is the default, and for good reason: it's the correct key for maximizing the count of
non-overlapping intervals you can keep. The intuition is short, even though its formal proof is
Chapter 4's job and not this chapter's: whichever remaining interval finishes earliest leaves the
largest possible span of time open for everything that comes after it. Picking it first can never
cost you a choice you'd otherwise have had — at worst it's exactly as constraining as any other
interval you could have picked instead, and it's usually strictly less constraining. Any optimal
solution can be reshaped, one swap at a time, into one that starts with the earliest-finishing
interval, which is what "exchange argument" means, and Chapter 4 works the swap through in full.

**Start time** looks like the obvious alternative — sort chronologically by when things begin — and
for the specific job of maximizing count, it's a trap disguised as the natural choice: an interval
that starts first can still be the longest one on the board, blocking out everything else that would
otherwise fit. It turns out to be exactly the right key for a different job, covered below in Merge
Intervals, where the goal isn't counting but detecting contiguous coverage.

**Duration** is the most tempting wrong answer, precisely because "take the shortest job first" is a
sound instinct in other scheduling contexts — it's optimal for minimizing total completion time
across jobs on a single machine, for instance. For maximizing the count of compatible intervals it
fails, and a small example makes the failure concrete. Take three intervals, using half-open
`[start, end)` so that touching endpoints don't count as overlapping:

| Interval | Span     | Duration |
| -------- | -------- | -------- |
| A        | `[4, 6)` | 2        |
| B        | `[2, 5)` | 3        |
| C        | `[5, 8)` | 3        |

A is shortest, so duration-first greedy takes it. A overlaps B (they share the point `4`) and A
overlaps C (they share the point `5`), so both get discarded — final count: 1. But B and C don't
overlap each other at all; B ends exactly where C begins. The optimal answer keeps `{B, C}` for a
count of 2, and duration-first greedy never finds it because the shortest interval isn't the one
that leaves the most room — it's the one sitting in the middle, blocking both neighbors. Sort the
same three intervals by end time instead — B (ends at 5), A (ends at 6), C (ends at 8) — and
earliest-finish greedy takes B, skips A (starts at 4, before B's end of 5), takes C (starts at 5,
not before B's end), and lands on the actual optimum. Duration doesn't reappear as a sort key
anywhere in this chapter; it's here once, as the counterexample that rules it out.

---

## Worked Example: Non-overlapping Intervals

Given a list of intervals, find the minimum number to remove so that none of the remaining ones
overlap. This is the count-maximization problem from the section above, phrased as a removal count
instead of a keep count — the two are related by `removed = n - kept`, so the greedy strategy is
identical: sort by end time, and greedily keep every interval whose start doesn't precede the end of
the last interval kept.

```python
from typing import List


def erase_overlap_intervals(intervals: List[List[int]]) -> int:
    if not intervals:
        return 0

    intervals.sort(key=lambda iv: iv[1])  # sort by end time
    kept_end = intervals[0][1]
    kept_count = 1

    for start, end in intervals[1:]:
        if start >= kept_end:      # compatible — no overlap with the last kept interval
            kept_count += 1
            kept_end = end
        # else: overlaps the last kept interval; greedily drop this one and move on

    return len(intervals) - kept_count
```

The loop never reconsiders a decision once made — an interval that gets dropped is dropped for good,
and `kept_end` never moves backward. That's the exchange argument from the previous section doing
its work silently: because the kept interval with the earliest possible end time is always the one
on the table, there's never a reason to undo a keep in favor of something seen later.

**Complexity:** O(n log n) time, dominated entirely by the sort; the scan afterward is a single O(n)
pass with O(1) auxiliary state (`kept_end`, `kept_count`).

---

## Worked Example: Merge Intervals

Given a list of intervals, merge all overlapping ones into their minimal covering set. This is the
one problem in this chapter where sorting by end time is the wrong move, and it's worth naming as
the deliberate exception to the reflex the previous two sections just built. Merging isn't about
counting how many intervals survive — it's about detecting contiguous coverage, and detecting
whether the next interval touches the run you're currently building requires walking intervals in
the order they _begin_. Sort by end time instead, and an interval that starts very early but happens
to end very late gets pushed toward the back of the sequence by its end time, arriving long after
intervals it should have absorbed have already been processed — the adjacency test breaks.

```python
from typing import List


def merge_intervals(intervals: List[List[int]]) -> List[List[int]]:
    if not intervals:
        return []

    intervals.sort(key=lambda iv: iv[0])  # sort by start time — the exception
    merged = [intervals[0][:]]

    for start, end in intervals[1:]:
        last = merged[-1]
        if start <= last[1]:              # overlaps, or touches, the run being built
            last[1] = max(last[1], end)
        else:
            merged.append([start, end])

    return merged
```

Each step asks exactly one question — does the next interval, in start order, fall inside or
immediately after the run I'm currently extending? — and start order is what makes that question
answerable in a single forward pass. Note the `<=` rather than `<`: whether touching endpoints count
as mergeable is a problem-statement choice, unlike the removal problem above, where `[start, end)`
half-open semantics made the boundary unambiguous.

**Complexity:** O(n log n) time, dominated by the sort; the merge pass itself is O(n). Space is O(n)
for the output list, beyond whatever the sort implementation uses internally.

---

## Worked Example: Minimum Meeting Rooms

Given a list of meeting intervals, find the maximum number of meetings happening simultaneously at
any point in time — equivalently, the minimum number of rooms needed to host all of them without
conflict. Neither a pure start-time sort nor a pure end-time sort answers this alone; the technique
needs both orderings at once, treated as two independent timelines walked together like a merge
step. That's exactly why it comes last: it's the shape that breaks the binary "start or end" framing
the first two examples set up.

```python
from typing import List


def min_meeting_rooms(intervals: List[List[int]]) -> int:
    starts = sorted(iv[0] for iv in intervals)
    ends = sorted(iv[1] for iv in intervals)

    rooms_in_use = 0
    max_rooms = 0
    s = e = 0

    while s < len(starts):
        if starts[s] < ends[e]:
            rooms_in_use += 1   # a meeting starts before the earliest running one ends
            s += 1
        else:
            rooms_in_use -= 1   # the earliest running meeting has just ended
            e += 1
        max_rooms = max(max_rooms, rooms_in_use)

    return max_rooms
```

Read `starts` and `ends` as two separately sorted event streams, and the `while` loop as a sweep
across time: at each step, whichever event happens first chronologically — some meeting beginning,
or the earliest still-running meeting ending — gets processed next. A start increments the room
count because one more meeting is now competing for space; an end decrements it because a room just
freed up. `max_rooms` tracks the peak of that count across the whole sweep, which is precisely the
answer: the busiest instant determines how many rooms are needed, not the total number of meetings
or their total duration. The `starts[s] < ends[e]` comparison (strict, not `<=`) matters — a meeting
ending at the same instant another begins frees its room in time for the new one, so ties resolve in
favor of processing the end first and reusing the room rather than opening a new one.

**Complexity:** O(n log n) time for the two sorts; the sweep itself is a single O(n) pass over both
arrays combined. Space is O(n) for `starts` and `ends`.

---

## Which Sort Key, and When

Three problems, three different answers to "sort by what," and the pattern that falls out of
stacking them is the actual takeaway of this chapter — the specific problems matter less than
recognizing which shape a new interval problem belongs to before reaching for a sort key at all.

| Sort key             | Correct for                                                                                            | Why                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| End time             | Maximizing the count of compatible intervals (Non-overlapping Intervals; proved formally in Chapter 4) | Earliest finish leaves the most room for everything that follows — exchange argument          |
| Start time           | Merging overlapping intervals into contiguous coverage                                                 | Adjacency against the run being built can only be tested in chronological order               |
| Both, swept together | Counting peak simultaneous overlap (Minimum Meeting Rooms)                                             | Neither ordering alone reveals concurrency; the merged event stream does                      |
| Duration             | Not this family — a trap for count-maximization                                                        | The shortest interval can still sit in the middle, blocking two mutually compatible neighbors |

Every technique in this chapter still sorts by some property of _time_ — start, end, or the sweep
that uses both. [[05-fractional-knapsack|Chapter 5]] is where that assumption finally breaks: the
greedy choice there sorts by value-per-unit-weight, a ratio with no temporal meaning at all, because
the exchange argument that licenses it is about density, not chronology. The lesson this chapter
sets up and Chapter 5 confirms is the same one either way — a greedy algorithm sorts by whatever
quantity makes its particular exchange argument go through, and "earliest finish first" is one
instance of that principle, not the principle itself.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
