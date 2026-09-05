---
title: "6 — Monotonic Queue"
description: "Sliding window maximum in O(n): a deque of indices kept decreasing by value, trimmed from the back for domination and from the front for window expiry — the second eviction rule a monotonic stack structurally can't support."
tags: ["data-structures-algorithms","stacks-queues","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-24"
relations:
  - slug: data-structures-algorithms/04-stack-queue-and-deque/04-deque/04-deque
    kind: related
  - slug: data-structures-algorithms/02-arrays-and-strings/04-sliding-window/04-sliding-window
    kind: related
---

# 6 — Monotonic Queue

[[05-monotonic-stack]] solved "next bigger element to the right" by keeping a stack whose invariant
died only one way: something bigger arrives, and everything smaller underneath it can be discarded
because it will never again be the useful answer. Sliding window maximum needs almost the same
invariant, but discards elements a second way, and it's the way a stack structurally cannot support.
A window doesn't just add new elements on the right — it also drops old ones off the left, on a
schedule that has nothing to do with whether those old elements were ever beaten by a bigger value.
Something can be undefeated and still expire. A stack, which only exposes and only removes from one
end, has no way to reach in and evict an element that's buried anywhere but the top. [[04-deque]] is
what fixes that: two open ends instead of one, so the same "pop what can never be useful again" rule
from the stack chapter can run on the back while a second, independent rule — "pop what's aged out
of the window" — runs on the front, every step, without either rule ever touching the middle.

---

## The Problem: Sliding Window Maximum

**Problem:** given an array `nums` and a window size `k`, return an array where position `i` holds
the maximum of `nums[i : i+k]` — the max of every contiguous window of size `k`, in order, as the
window slides from the start of the array to the end. For an array of length `n`, there are
`n - k + 1` such windows.

Brute force is the obvious thing: for each of the `n - k + 1` starting positions, scan the `k`
elements in that window and take the max.

```python
def max_sliding_window_brute(nums: list[int], k: int) -> list[int]:
    return [max(nums[i:i + k]) for i in range(len(nums) - k + 1)]

# max_sliding_window_brute([5, 3, 4, 2, 6], 3) == [5, 4, 6]
```

This is O(n·k) — the same shape of waste [[04-sliding-window]] (Part 02, Chapter 4) named for the
fixed-size sum problem: the max for window `i+1` shares `k - 1` of its `k` elements with the max for
window `i`, and the brute force throws that overlap away every single step. Unlike the sum version,
though, there's no `+= nums[right] - nums[left]` fix available — a max isn't reversible the way a
sum is. Removing the outgoing element from a running sum is one subtraction; removing it from a
running max, when it might have _been_ the max, means you no longer know what the second-best
candidate was without looking again. That's the real problem this chapter solves: how to track a
running max over a moving window without ever re-scanning the window to recover what a sum gets for
free.

---

## Why a Monotonic Stack Alone Isn't Enough

The instinct, reasonably, is to reach for [[05-monotonic-stack]]'s trick: process left to right,
keep a structure that's always decreasing, and the front of that structure is always the current max
candidate. That part transfers cleanly — the same "pop anything the new arrival dominates" rule
applies here verbatim: if `nums[i]` is greater than or equal to some earlier candidate still under
consideration, that earlier candidate can never again be the max of any future window, because
`nums[i]` is both bigger and will still be around for at least as long. Discard it for good, exactly
like popping a smaller element off a decreasing stack.

Where the transfer breaks is the window's left edge. In the monotonic stack chapter, nothing to the
left of the current position ever stops being relevant on its own — an element only leaves the stack
by losing a comparison to something bigger. Sliding window maximum adds a second,
comparison-independent way to leave: simply falling outside `[i - k + 1, i]` as `i` advances. An
element can be the largest thing anyone has seen and still need to be discarded, not because
something bigger showed up, but because the window moved past it.

A stack cannot do this. Its only door is the top; whatever is buried at the bottom — even if it's
the single largest value in the whole array — is unreachable without popping everything on top of it
first, which would destroy candidates that are still legitimately inside the window. There is no
operation in a stack's interface that means "remove that specific old thing over there, leave
everything else intact." A structure that can be trimmed from _both ends independently_ isn't an
optimization here — it's the minimum interface the problem requires. That's exactly what
[[04-deque]] provides, and exactly why "queue" is a slightly misleading name for what gets built:
the front end is popped for a reason that has nothing to do with FIFO ordering, and the back end is
popped for a reason that has nothing to do with LIFO ordering. It's a deque wearing yet another
self-imposed policy, the same move as [[04-deque]]'s closing argument about stack and queue — just a
third policy, monotonic on one axis and window-bounded on the other.

---

## The Core Idea: A Deque of Indices, Decreasing by Value

The deque holds **indices**, not values, in strictly decreasing order of their corresponding values,
front to back — `nums[dq[0]] > nums[dq[1]] > ...`. The front is always the index of the current
window's maximum, read directly with no search. Two independent trimming rules run on every step,
one per end:

- **Back — value-dominated.** Before appending the new index `i`, pop from the back every index
  whose value is less than or equal to `nums[i]`. Identical justification to the monotonic stack's
  pop: anything popped here is both smaller than `nums[i]` and older, so it can never again be the
  max of any window that also contains `i` — every future window that still contains the popped
  index also contains `i`, and `i` already beats it.
- **Front — window-expired.** Before recording the answer for the current window, pop from the front
  any index that has fallen to or before `i - k` — outside the window `[i - k + 1, i]`. This has
  nothing to do with value; the index at the front could easily still be the largest value seen so
  far and get evicted anyway, purely because the window's left edge has moved past it.

Because the window's left edge advances by exactly one position per step, at most one index can
expire on any given iteration — an `if` at the front suffices; there's never a backlog of two or
more stale front indices to clear in a `while`. The back trim, by contrast, can clear an arbitrary
number of indices in one step (a new maximum crossing several previously-decreasing candidates at
once), so that side does need a `while`.

```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()   # indices; nums[dq] strictly decreasing, front to back
    result: list[int] = []

    for i, num in enumerate(nums):
        # back: discard indices whose value the new arrival dominates
        while dq and nums[dq[-1]] <= num:
            dq.pop()
        dq.append(i)

        # front: discard the index if it has fallen out of the window
        if dq[0] <= i - k:
            dq.popleft()

        # a window only exists once i has reached at least k - 1
        if i >= k - 1:
            result.append(nums[dq[0]])

    return result

# max_sliding_window([5, 3, 4, 2, 6], 3) == [5, 4, 6]
```

Order matters here and is worth stating explicitly: the back trim and the append run _before_ the
front check, because the front check needs to see the deque's final shape for this step — including
the index just appended — not an intermediate one. The answer is only recorded once `i >= k - 1`,
i.e. once at least `k` elements have been seen and the first full window exists; before that, the
deque is correctly maintained but there's no complete window yet to report a max for.

The mirror version — sliding window **minimum** — flips exactly one comparison: keep the deque
increasing by value, front to back, and pop from the back while `nums[dq[-1]] >= num`. Nothing about
the front-eviction rule changes; window expiry doesn't care whether the deque is tracking a max or a
min.

---

## Worked Example: Sliding Window Maximum, Traced

Trace `nums = [5, 3, 4, 2, 6]`, `k = 3`, through `max_sliding_window` above. Three windows exist —
`[5,3,4]`, `[3,4,2]`, `[4,2,6]` — with maxes `5, 4, 6`, small enough to hold the whole state in view
and shaped specifically so every rule fires at least once: a back pop that discards a dominated
value, and a front pop, a few steps later, that discards a value for a completely different reason —
window expiry — on an entry that was never beaten by anything.

| i   | nums[i] | back pop (value-dominated)           | front pop (window-expired)                | deque after (indices → values) | window complete? → max |
| --- | ------- | ------------------------------------ | ----------------------------------------- | ------------------------------ | ---------------------- |
| 0   | 5       | none — deque empty                   | n/a — `i < k-1`                           | `[0]` → `[5]`                  | no                     |
| 1   | 3       | none — `5` not `≤ 3`                 | n/a — `i < k-1`                           | `[0, 1]` → `[5, 3]`            | no                     |
| 2   | 4       | pop `1` (`3 ≤ 4`)                    | none — `0 ≤ 2-3 = -1`? no                 | `[0, 2]` → `[5, 4]`            | yes → `nums[0] = 5`    |
| 3   | 2       | none — `4` not `≤ 2`                 | pop `0` (`0 ≤ 3-3 = 0` — expired)         | `[2, 3]` → `[4, 2]`            | yes → `nums[2] = 4`    |
| 4   | 6       | pop `3` (`2 ≤ 6`), pop `2` (`4 ≤ 6`) | none — deque already emptied by back pops | `[4]` → `[6]`                  | yes → `nums[4] = 6`    |

Final result: `[5, 4, 6]`.

The step at `i=2` is the familiar move from the previous chapter: `3` at index `1` gets discarded
because `4` is both bigger and newer — a value-dominated pop, indistinguishable from a monotonic
stack's pop. The step at `i=3` is the move a stack cannot make: index `0`'s value, `5`, was never
beaten by anything in the array — it is in fact the largest value that ever appears — and it still
gets discarded, purely because the window `[1, 3]` no longer includes index `0`. If the deque only
supported popping from one end, that `5` would either block the front forever (index `0` sitting
unreachable at the bottom, under everything pushed after it) or would need a full stack unwind to
remove it, destroying the still-valid indices `2` and `3` in the process. Popping it from the front,
in O(1), while indices `2` and `3` sit untouched at the back, is the entire reason this is a deque
problem and not a stack problem.

---

## Why This Is O(n)

Every index enters the deque exactly once, via a single `dq.append(i)` call in its own iteration.
Every index leaves the deque at most once, ever, from whichever end discards it first — a
value-dominated pop from the back, a window-expiry pop from the front, or (for the handful of
indices still present when the loop ends) never, in which case it's never popped at all. There is no
path back onto the deque once an index is gone. That's the identical amortized shape as the
monotonic stack's argument in the previous chapter and the two-pointer argument in
[[04-sliding-window]] (Part 02, Chapter 4): don't bound the work done in one iteration and multiply
by n — some iterations pop nothing, others (`i=4` in the trace above) pop several — bound the total
number of times _any_ index can ever be pushed or popped across the entire run. That total is at
most n pushes plus n pops, split across two ends instead of the one end a stack has, but the count
doesn't care which end did the popping. Total deque operations are O(n) for an array of length n,
regardless of k. k changes _which_ indices get evicted and _when_ — it changes nothing about the
count of pushes and pops each index is entitled to.

One difference from the previous chapter is worth naming, because it falls directly out of the
front-eviction rule: a monotonic stack's worst case is O(n) space — a strictly decreasing input
pushes everything and pops nothing until the very end. A monotonic queue's deque, by contrast, can
never hold more than k indices at any instant, because every index outside the current window gets
actively evicted from the front the moment it expires, on top of whatever value-domination already
trimmed from the back. Space is O(k) (more precisely `O(min(n, k))`), a strictly tighter bound than
the stack chapter's, purely because this structure has a second reason to shrink that the stack
never had.

---

## Monotonic Stack vs. Monotonic Queue

Same enforced-order invariant, two different structures, because the two problem shapes discard
elements for different reasons.

| Aspect                 | Monotonic Stack (Ch. 5)                                                                                           | Monotonic Queue (this chapter)                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Underlying structure   | stack — one open end                                                                                              | deque — two open ends                                                                                                                             |
| Grows from             | the one end (top)                                                                                                 | the back only                                                                                                                                     |
| Shrinks from           | the same end — value-dominated pops only                                                                          | both ends — back: value-dominated; front: window-expired                                                                                          |
| Why an element leaves  | only ever loses to something bigger (or smaller, for the increasing variant)                                      | loses a comparison, _or_ simply ages out of the window — two independent reasons                                                                  |
| Left boundary          | none — every surviving earlier element stays a candidate indefinitely                                             | moves every step — the window's left edge is a second, comparison-free eviction trigger                                                           |
| Where the answer lives | computed at the moment an element gets popped (e.g., `result[popped] = num`)                                      | sitting at the front at every step, read without popping anything                                                                                 |
| Worst-case space       | O(n) — a monotonic input never pops until the end                                                                 | O(k) — bounded by the window, since expiry evicts on top of domination                                                                            |
| Canonical problems     | next greater element, daily temperatures, largest rectangle in histogram                                          | sliding window maximum / minimum                                                                                                                  |
| Reach for it when      | "now" only ever moves forward with no fixed-size trailing boundary — nothing leaves except by losing a comparison | the problem hands you a window (fixed or variable) whose left edge moves — something needs an eviction rule value comparisons alone can't express |

Read against [[04-deque]]'s framing, both chapters are the same move: take a structure with more
capability than the immediate problem needs, and add a self-imposed policy that fits the problem's
actual invalidation rule. The stack chapter's policy is "discard only by losing a comparison." This
chapter's policy is "discard by losing a comparison, or by aging out of a window" — a strictly
richer rule, needing a strictly richer structure to enforce it, and nothing more exotic than a
deque, trimmed from both ends, gets there.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
