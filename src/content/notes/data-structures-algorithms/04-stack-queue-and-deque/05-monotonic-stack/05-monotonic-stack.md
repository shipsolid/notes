---
title: "5 — Monotonic Stack"
description: "A stack that enforces increasing or decreasing order at push time, solving next-greater-element, daily-temperatures, and largest-rectangle-style problems in O(n)."
tags: ["data-structures-algorithms","stacks-queues","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-23"
relations:
  - slug: data-structures-algorithms/04-stack-queue-and-deque/01-stack/01-stack
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/14-monotonic-stack-pattern/14-monotonic-stack-pattern
    kind: related
---

# 5 — Monotonic Stack

"For every element, find the next element to its right that's larger" has an obvious brute force:
for each position, scan rightward until something bigger turns up, or run off the end. It works, and
it's O(n²) — the same stretch of array gets rescanned from scratch for every starting position, even
though most of that rescanning just rediscovers "nothing bigger yet," an answer the position one to
the left already worked out. A monotonic stack is the observation that a plain stack ([[01-stack]],
Chapter 1) already has everything needed to remember that work, if it's used under one extra rule at
push time. One pass, O(n) total.

---

## The Core Idea: A Stack That Enforces Its Own Order

A monotonic stack is not a new data structure. It's the same push/pop/peek stack from Chapter 1,
used under one added invariant: read from bottom to top, its contents are always strictly
increasing, or always strictly decreasing — never both, and never allowed to break, for as long as
the stack exists. The invariant isn't checked after the fact; it's _enforced_ at push time, by
popping off whatever would violate it immediately before the new element joins.

That pop is the entire trick. It isn't overhead paid to keep the stack tidy — it's usually the
answer to the question the stack exists to answer. For "next greater element," the useful invariant
is **decreasing**, bottom to top: every element still on the stack is still waiting for something
bigger than itself to show up. Processing left to right, each new element does one thing on arrival:

- **while** the stack is non-empty **and** its top is smaller than the new element: that top element
  has just found its next greater element — pop it, record the new element as its answer, and check
  the new top.
- once the stack is empty or its top is no longer smaller, push the new element. It joins the stack
  still waiting for its own answer.

Nothing smaller than the new element can survive its arrival, so from bottom to top the stack only
ever holds a decreasing sequence of "still waiting" elements — the invariant maintains itself as a
side effect of how the pop loop is written, not as a separate check. Some problems want the mirror
image — an **increasing** stack, where a _smaller_ incoming element is what triggers the pops
(Largest Rectangle in Histogram, below, is exactly that case). Same rule, comparison flipped.

---

## Worked Example: Next Greater Element

**Problem:** given an array of numbers, return an array where position `i` holds the first element
to the right of `i` that's strictly greater than `nums[i]`, or `-1` if none exists.

```python
def next_greater_elements(nums: list[int]) -> list[int]:
    result = [-1] * len(nums)
    stack: list[int] = []  # indices; nums[stack] strictly decreasing, bottom to top

    for i, num in enumerate(nums):
        while stack and nums[stack[-1]] < num:
            result[stack.pop()] = num
        stack.append(i)

    return result

# next_greater_elements([2, 1, 5, 3, 4]) == [5, 5, -1, 4, -1]
```

The stack holds _indices_, not values — popping needs to know which slot in `result` to fill, and
the value is one `nums[...]` lookup away. Tracing `[2, 1, 5, 3, 4]` element by element makes the
"the answer arrives when something bigger shows up" mechanism visible instead of asserted:

| i   | num | while-loop action                                        | stack after (indices → values) |
| --- | --- | -------------------------------------------------------- | ------------------------------ |
| 0   | 2   | stack empty, no pop                                      | `[0]` → `[2]`                  |
| 1   | 1   | top is 2, not < 1 — no pop                               | `[0, 1]` → `[2, 1]`            |
| 2   | 5   | pop 1 (1<5) → `result[1]=5`; pop 0 (2<5) → `result[0]=5` | `[2]` → `[5]`                  |
| 3   | 3   | top is 5, not < 3 — no pop                               | `[2, 3]` → `[5, 3]`            |
| 4   | 4   | pop 3 (3<4) → `result[3]=4`; top is 5, not < 4 — stop    | `[2, 4]` → `[5, 4]`            |

Loop ends with indices 2 and 4 still on the stack — nothing to their right was ever bigger, so their
`result` slots stay at the initialized `-1`. Final answer: `[5, 5, -1, 4, -1]`.

The step at `i=2` is the one worth staring at: a single incoming `5` resolves _two_ elements in one
iteration, because both `1` and `2` had been sitting on the stack still waiting. That cascading pop
— one arrival closing out an arbitrary number of pending answers — is what makes this O(n) instead
of O(n²), covered precisely in the last section.

**Complexity:** O(n) time, O(n) space for the stack in the worst case (a strictly decreasing input
array, where nothing gets popped until the very end, if ever).

---

## Worked Example: Daily Temperatures

**Problem:** given a list of daily temperatures, return a list where position `i` holds the number
of days until a warmer temperature, or `0` if no warmer day ever comes.

This is the identical shape as Next Greater Element with two changes: the stack stores indices for a
reason beyond convenience this time (the answer is a _distance_, not a value), and the "unresolved"
default is `0` instead of `-1` — no warmer day ever arriving reads naturally as "0 days to wait,"
which needs no sentinel translation the way "-1" does.

```python
def daily_temperatures(temperatures: list[int]) -> list[int]:
    result = [0] * len(temperatures)
    stack: list[int] = []  # indices; temperatures[stack] strictly decreasing, bottom to top

    for i, temp in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < temp:
            prev = stack.pop()
            result[prev] = i - prev   # distance, not value
        stack.append(i)

    return result

# daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]) == [1, 1, 4, 2, 1, 1, 0, 0]
```

The same cascading-pop moment shows up here too: at `i=5` (temp `72`), the stack holds indices
`[2, 3, 4]` (temps `75, 71, 69`). `69 < 72` pops index 4 (`result[4] = 5-4 = 1`), `71 < 72` pops
index 3 (`result[3] = 5-3 = 2`), and `75` stops the loop — index 2 isn't resolved until the `76` two
days later (`result[2] = 6-2 = 4`). Indices `6` and `7` never find anything warmer and keep their
initialized `0`. The pop condition is unchanged from Next Greater Element; only the payload recorded
at pop time changed — `i - prev` instead of `temp` — which is exactly the pattern generalizing
beyond the literal "next greater value" phrasing.

**Complexity:** O(n) time, O(n) space, same reasoning as Next Greater Element.

---

## Worked Example: Largest Rectangle in Histogram

**Problem:** given bar heights of a histogram (each bar width 1), find the area of the largest
rectangle that fits under the skyline.

The invariant flips here: the stack holds indices of bars in strictly **increasing** height order,
bottom to top — each one still a candidate left edge for some rectangle taller than anything seen
since it was pushed. A _shorter_ incoming bar is now what triggers the pop, and the pop no longer
records a value or a distance — it computes the area of the rectangle that the popped bar could have
spanned, using the incoming index as the (exclusive) right edge and the new stack top as the
(exclusive) left edge:

```python
def largest_rectangle_area(heights: list[int]) -> int:
    stack: list[int] = []           # indices; heights[stack] strictly increasing, bottom to top
    best = 0
    extended = heights + [0]        # sentinel forces every remaining bar to resolve

    for i, h in enumerate(extended):
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            best = max(best, height * width)
        stack.append(i)

    return best

# largest_rectangle_area([2, 1, 5, 6, 2, 3]) == 10
```

The moment worth naming, without fully deriving it: bar `2` (index 4) arriving after `6` and `5`
(indices 3 and 2) pops both in sequence — `6` first, width 1, area 6; then `5`, width back to index
1, area 10, the final answer. Each pop asks how far left and right that bar's height could have
reached before something shorter got in the way: the right edge is the incoming (shorter) bar's
index, the left edge is whatever index remains on the stack after the pop — the nearest surviving
bar too short to share this rectangle. The sentinel `0` flushes every bar still standing once the
input ends, so nothing gets silently dropped. Full derivation of the width formula is its own
exercise; the shape to recognize is this chapter's shape — a monotonic invariant, a flipped
comparison, and a pop computing something richer than the value or distance the first two examples
popped.

**Complexity:** O(n) time, O(n) space — same amortized argument as the two examples above, applied
to an increasing instead of a decreasing stack.

---

## Why This Is O(n), Not O(n²)

Every one of these functions nests a `while` loop inside a `for` loop, and nested loops read as
O(n²) on reflex — wrong here, for a reason worth stating precisely rather than citing.

The `for` loop's index advances once per outer iteration, n times total. The `while` loop has no
index of its own — it pops from a stack that grows by one push per outer iteration and shrinks by
however many pops the current element triggers. The bound isn't "how many times can `while` run on
one iteration" (unbounded in principle — a single arrival can pop the entire stack); it's "how many
times can it run, summed across the _entire_ run." Every element is pushed exactly once (n pushes)
and popped at most once, ever — once off the stack it never returns — so total pops are bounded by n
too, however unevenly distributed across iterations (most pop nothing; `i=2` in the Next Greater
Element trace pops two at once). Total work is n pushes plus at most n pops: O(n), not O(n) repeated
n times.

That's the identical amortized argument [[02-asymptotic-analysis]] (Part 01, Chapter 2) and
[[04-sliding-window]] (Part 02, Chapter 4) both use: don't bound the worst single iteration and
multiply by n — that overcounts work shared across the whole run. Bound the total number of times an
operation can happen across every element's entire lifetime — pushed once, popped at most once — and
the nested-loop shape stops looking like O(n²) the moment that lifetime bound is what's being
summed.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
