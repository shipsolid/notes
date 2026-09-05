---
title: "4 — Sliding Window"
description: "Fixed vs. variable window, when to grow or shrink, and the substring/subarray problems this technique solves in linear time."
tags: ["data-structures-algorithms","arrays-strings","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-9"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/03-two-pointers/03-two-pointers
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/02-sliding-window-pattern/02-sliding-window-pattern
    kind: related
---

# 4 — Sliding Window

"Find the maximum sum of any 3 consecutive elements" has an obvious brute force: for every starting
position, sum the next 3 elements, keep the best. It works, and it re-does almost all of its own
work — the sum for position 5 shares two of its three elements with the sum for position 4, and the
brute force throws that overlap away and recomputes it from nothing. Sliding window is the
observation that you never need to: keep a running window over the data and _slide_ it, updating the
running answer with only the element entering and the element leaving, instead of re-scanning the
whole window from scratch. Same answer, one pass.

---

## The Core Idea: A Window That Slides Instead of Restarting

A **window** is a contiguous slice of the array or string, tracked by two indices — `left` and
`right` — that both move forward, never backward. Brute force fixes `left`, walks `right` through
the remaining elements, advances `left`, and repeats: nested loops, O(n·k) for a fixed window of
size k or O(n²) for a variable one. Sliding window keeps a running aggregate — a sum, a count, a
hash set of the window's contents — and pays only for the _change_ between one window and the next,
turning that nested loop into a single pass.

Every sliding-window problem reduces to one decision: **fixed size** (slide by one, one element in,
one out) or **variable size** (grow `right` to explore, shrink `left` only when forced)? The rest of
this chapter works both, plus the detail that causes most bugs: two different reasons a variable
window shrinks, depending on whether you want the longest valid window or the shortest one.

---

## Fixed-Size Window: Maximum Sum Subarray

**Problem:** given an array and an integer k, find the maximum sum of any contiguous subarray of
size k.

Brute force sums k elements at every one of the n−k+1 starting positions — O(n·k). The fix: sum the
first window once, then slide right one position at a time. Each slide adds one incoming element and
subtracts one outgoing element — the rest of the window is untouched, so there's nothing to re-sum.

```python
def max_sum_subarray(nums: list[int], k: int) -> int:
    if len(nums) < k:
        raise ValueError("array shorter than window size")

    window_sum = sum(nums[:k])
    best = window_sum

    for right in range(k, len(nums)):
        left = right - k
        window_sum += nums[right] - nums[left]   # one in, one out
        best = max(best, window_sum)

    return best

# max_sum_subarray([2, 1, 5, 1, 3, 2], 3) == 9   ([5, 1, 3])
```

**Complexity:** O(n) time — the initial sum is O(k), then n−k slides at O(1) each. **O(1) space** —
one running total, no auxiliary structure. The window never shrinks below k or grows past it; it
just translates rightward one index at a time, the simplest member of the family and the one to
reach for whenever the problem hands you a fixed k up front.

---

## Variable-Size Window: Longest Substring Without Repeating Characters

**Problem:** given a string, find the length of the longest substring with no repeated characters.

Here the window size isn't given — it's exactly what you're solving for. The general template for
every variable-size window problem:

```
expand right by one          → always
check the constraint         → after every expansion
shrink left while violated   → repeat until the window is valid again
record the answer            → once the window is valid
```

The constraint here is "no duplicate characters in the window," tracked with a hash set of the
characters currently inside `[left, right]`. Expanding `right` is unconditional; a duplicate found
on expansion is resolved by shrinking `left` one step at a time — removing each evicted character
from the set — until the duplicate is gone and the window is valid again.

```python
def longest_unique_substring(s: str) -> int:
    window: set[str] = set()
    left = 0
    best = 0

    for right in range(len(s)):
        # shrink while the incoming character violates the constraint
        while s[right] in window:
            window.remove(s[left])
            left += 1

        window.add(s[right])
        best = max(best, right - left + 1)   # record after the window is valid

    return best

# longest_unique_substring("abcabcbb") == 3   ("abc")
# longest_unique_substring("pwwkew")   == 3   ("wke")
```

**Complexity:** O(n) time — `right` advances n times, `left` advances at most n times total across
the whole run, not per iteration of `right` (why that's true is its own section, below). **O(min(n,
alphabet size))** space for the set. The shrink condition: _keep shrinking while the window is
invalid,_ stop the moment it's valid again. That direction is about to flip.

---

## Variable-Size Window, Inverted: Minimum Window Substring

**Problem:** given a string `s` and a string `t`, find the smallest substring of `s` that contains
every character of `t` (with at least its multiplicity — two `'a'`s in `t` needs at least two `'a'`s
in the window).

This reads like the same template with "longest" swapped for "shortest," and that swap is exactly
where the bug lives if you're not careful. In the previous problem the window shrinks _because it
became invalid_ and stops the moment it's valid again. Here it's the opposite: the window shrinks
_because it's valid_ — shrinking is how you look for something smaller than what you already have,
and you keep doing it until shrinking would make it invalid again.

```
longest-valid-window shrink:   while INVALID: shrink        (stop as soon as valid)
shortest-valid-window shrink:  while VALID:   shrink, record (stop as soon as invalid)
```

A hash map tracks how many of each required character the window still needs; a counter tracks how
many _distinct_ required characters are currently satisfied. The window becomes a candidate answer
only once every required character is satisfied — and from there, shrinking from the left is how you
find out whether an even smaller valid window exists.

```python
from collections import Counter

def min_window_substring(s: str, t: str) -> str:
    if not t or not s:
        return ""

    need = Counter(t)
    missing = len(need)          # count of distinct chars not yet satisfied
    left = 0
    best_len = float("inf")
    best_start = 0

    for right, char in enumerate(s):
        if char in need:
            need[char] -= 1
            if need[char] == 0:
                missing -= 1      # this character is now fully satisfied

        # window is valid (all required chars satisfied) — shrink to look for smaller
        while missing == 0:
            if right - left + 1 < best_len:
                best_len = right - left + 1
                best_start = left

            left_char = s[left]
            if left_char in need:
                need[left_char] += 1
                if need[left_char] > 0:
                    missing += 1   # shrinking broke validity — stop after this step

            left += 1

    return "" if best_len == float("inf") else s[best_start:best_start + best_len]

# min_window_substring("ADOBECODEBANC", "ABC") == "BANC"
```

**Complexity:** O(n) time, O(k) space where k is the alphabet size of `t` (bounded by the `need`
map). Same two-pointer skeleton as the previous problem, opposite shrink trigger — the whole reason
to hold both examples side by side rather than learning either one in isolation.

---

## Recognizing Which Flavor You Need

The problem statement almost always signals which variant is wanted, if you read for these cues:

| Phrasing in the problem                               | Flavor                         |
| ----------------------------------------------------- | ------------------------------ |
| "of size k" / "of length k" given up front            | Fixed-size window              |
| "longest substring/subarray that..."                  | Variable, shrink while invalid |
| "shortest/minimum substring/subarray that..."         | Variable, shrink while valid   |
| "at most k distinct" / "no more than k violations"    | Variable, shrink while invalid |
| "contains all of..." / "at least k occurrences of..." | Variable, shrink while valid   |

The one-line test that resolves ambiguity: what are you recording the answer against? Recording
_only once the window is valid again, right after shrinking past invalidity_ is the longest-flavor
shrink. Recording _while the window is still valid, shrinking further to see if something smaller
survives_ is the shortest-flavor shrink. Mixing the two up produces code that compiles, runs, and
returns a confidently wrong answer on the second test case — a silent failure, which is exactly why
it's worth pausing on before writing the shrink loop rather than after debugging it.

---

## Why This Is O(n), Not O(n²)

The code has a `for` loop with a `while` loop nested inside it, and nested loops read as O(n²) on
reflex — the reflex is wrong here, and it's worth being able to say precisely why, not just cite the
conclusion.

`right` is the outer loop's index: it advances exactly once per outer iteration, n times total,
never backward. `left` is the inner loop's index: it also only ever advances, never resets to 0 —
across the _entire function call_, not per outer iteration, `left` can advance at most n times
total, because it's bounded above by `right` and both are monotonically non-decreasing over an array
of length n.

That's the amortized argument from [[02-asymptotic-analysis]] (Part 01, Chapter 2) applied directly:
don't ask "how much work does the inner `while` do on one specific outer iteration" — some
iterations do nothing, others shrink several steps at once, and bounding the worst single iteration
would overcount. Ask instead "how much total work does the inner loop do summed across _every_ outer
iteration" — bounded by n, because `left` only has n positions to ever visit, full stop, regardless
of how those visits are distributed. Two pointers, each visiting each index a bounded number of
times, sums to O(n) + O(n) = O(n) total — not O(n) _per outer step_, which is the shape that would
actually earn an O(n²). [[03-two-pointers]] leans on the same reasoning for the opposite-direction
techniques — sliding window is the identical amortized argument, applied to a window instead of a
pair of converging ends.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
