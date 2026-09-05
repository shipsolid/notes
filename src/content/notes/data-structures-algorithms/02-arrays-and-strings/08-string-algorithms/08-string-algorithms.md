---
title: "8 — String Algorithms"
description: "Palindrome checks via two pointers and expand-around-center, anagram detection by counting vs. sorting, the naive O(n·m) substring search baseline, and why Python's string immutability turns 'reverse in place' into a trick question."
tags: ["data-structures-algorithms","arrays-strings","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-13"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings
    kind: related
  - slug: data-structures-algorithms/13-advanced-algorithms/05-string-matching-advanced/05-string-matching-advanced
    kind: related
---

# 8 — String Algorithms

[[data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings|The previous chapter]]
established that a Python `str` is an immutable sequence and what that costs at concatenation time.
This chapter is where that fact stops being trivia and starts shaping algorithm design: every
technique below applies the two-pointer and hashing patterns from earlier in this Part
([[03-two-pointers]], [[06-hashing]]) to strings specifically, adjusted for the one thing arrays
don't have to deal with — you can't assign into a string by index.

---

## Palindrome Checking and Expand-Around-Center

**Recognition signal:** "is this a palindrome" or "find the longest palindromic substring."

The base check reuses the opposite-direction two-pointer pattern directly: a string is a palindrome
if the characters converging from both ends never disagree.

```python
def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True
```

**Complexity:** O(n) time, O(1) extra space — no copy of `s` is made, the pointers just read.

Finding the _longest_ palindromic substring is harder: which of the O(n²) substrings is the longest
one that's also a palindrome? Checking every substring with the function above is O(n³) — O(n²)
substrings, O(n) each to verify. **Expand around center** cuts that to O(n²) by running the
palindrome check in reverse: instead of converging from the outside in, start at a candidate center
and grow outward while both sides still match.

```python
def expand_around_center(s: str, left: int, right: int) -> tuple[int, int]:
    while left >= 0 and right < len(s) and s[left] == s[right]:
        left -= 1
        right += 1
    return left + 1, right - 1  # last valid bounds before the mismatch (or an edge)


def longest_palindromic_substring(s: str) -> str:
    if not s:
        return ""
    start, end = 0, 0
    for i in range(len(s)):
        l1, r1 = expand_around_center(s, i, i)      # odd-length, center on s[i]
        l2, r2 = expand_around_center(s, i, i + 1)  # even-length, center between s[i], s[i+1]
        for l, r in ((l1, r1), (l2, r2)):
            if r - l > end - start:
                start, end = l, r
    return s[start:end + 1]
```

Both centers matter: an odd-length palindrome (`"aba"`) has a real character in the middle; an
even-length one (`"abba"`) has its center _between_ two characters. Skipping the between-character
case silently misses every even-length answer.

**Complexity:** 2n - 1 candidate centers, each expansion O(n) worst case → O(n²) time, O(1) extra
space beyond the returned substring. An O(n) algorithm for this exact problem exists — **Manacher's
algorithm** — but it's rare enough at the standard interview bar that it's out of scope for this
chapter; expand-around-center is the version worth having cold.

---

## Anagram Checking: Sorting vs. Counting

**Recognition signal:** "do these two strings use exactly the same characters" — order doesn't
matter, multiplicity does.

**Sorting approach:** if two strings are anagrams, sorting both produces identical sequences.

```python
def is_anagram_sorted(s1: str, s2: str) -> bool:
    return sorted(s1) == sorted(s2)
```

**Complexity:** O(n log n) — dominated by the sort. `sorted()` returns a new list each time (`str`
can't be sorted in place), so this also costs O(n) extra space per string.

**Counting approach:** an anagram check doesn't need an ordering at all — it needs two multisets of
characters to match. Sorting establishes an ordering nobody asked for and pays a logarithmic tax to
get it. A frequency count answers the same question in one linear pass:

```python
from collections import Counter

def is_anagram_counted(s1: str, s2: str) -> bool:
    if len(s1) != len(s2):
        return False
    return Counter(s1) == Counter(s2)
```

For a known, bounded alphabet (lowercase ASCII), a fixed-size array beats `Counter`'s hashing
overhead:

```python
def is_anagram_fixed(s1: str, s2: str) -> bool:
    if len(s1) != len(s2):
        return False
    counts = [0] * 26
    for ch in s1:
        counts[ord(ch) - ord("a")] += 1
    for ch in s2:
        idx = ord(ch) - ord("a")
        counts[idx] -= 1
        if counts[idx] < 0:
            return False
    return True
```

**Complexity:** O(n) time, O(1) extra space (26 slots regardless of `n`) — this is the version to
reach for by default; it wins on both time and space over sorting.

**When sorting still wins:** readability in a throwaway script or a tiny fixed input where the
constant-factor difference never shows up, and — more importantly — **Group Anagrams**, where you
need a canonical _key_ to bucket strings by, not just a yes/no comparison. `sorted(s)` (or
`"".join(sorted(s))`) gives every anagram of a string the identical dict key for free; a raw
character count doesn't hash cleanly as a dict key without first converting it to a tuple. That's
sorting buying canonicalization, not comparison — a genuinely different job.

---

## Naive Substring Search (and Why Smarter Algorithms Exist)

**Recognition signal:** "find `needle` in `haystack`," with no hint that the same text gets searched
repeatedly.

The direct approach: try every starting position in `haystack`, and at each one, compare characters
against `needle` until they either exhaust or mismatch.

```python
def find_substring(haystack: str, needle: str) -> int:
    n, m = len(haystack), len(needle)
    if m == 0:
        return 0
    for i in range(n - m + 1):
        j = 0
        while j < m and haystack[i + j] == needle[j]:
            j += 1
        if j == m:
            return i
    return -1
```

**Complexity:** O(n·m) worst case — a haystack like `"aaaa...a"` searching for `"aaab"` re-walks
almost the full needle length at nearly every starting position before failing.

This is still the right default to implement by hand: it's short, obviously correct, and for
interview-sized, non-adversarial input it runs close to O(n) in practice, since most mismatches
happen within the first character or two. It is _not_ what Python's own `in` operator or
`str.find()` use internally — CPython implements a variant of the Crochemore–Perrin two-way
string-matching algorithm, which is worst-case linear regardless of input. In production code, the
naive loop above is never what you'd ship; `needle in haystack` already gives you the better
algorithm for free.

The naive version breaks down exactly when the interviewer asks for a _guaranteed_ O(n+m) bound, or
when the same `haystack` gets searched against many needles and repeated worst-case rescans become
expensive. That's the setup for **KMP** (prefix-function based, worst-case O(n+m)) and
**Rabin-Karp** (rolling hash, average-case O(n+m), extends naturally to searching for multiple
patterns at once). Both are covered in depth — not here — in Part 13, Chapter 5
([[05-string-matching-advanced]]); this chapter's job is the brute-force baseline and the cue for
when it stops being enough, not the smarter algorithms themselves.

---

## Reversing a String In Place

The two-pointer swap is the textbook "in place" reversal: converge from both ends, swapping as you
go.

```python
def reverse_list(chars: list[str]) -> None:
    left, right = 0, len(chars) - 1
    while left < right:
        chars[left], chars[right] = chars[right], chars[left]
        left += 1
        right -= 1
```

**Complexity:** O(n) time, O(1) extra space — genuinely in place, because `list` is mutable.

Try the same swap directly on a `str` and it fails immediately:
`s[left], s[right] = s[right], s[left]` raises
`TypeError: 'str' object does not support item assignment` — the immutability
[[data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings|the previous chapter]]
introduced isn't a side note here, it's the reason "reverse a string in place" is a mild trick
question in Python. There is no such thing as mutating a `str` in place. The idiomatic version
converts to a list, reverses that list in place, then rejoins:

```python
def reverse_string(s: str) -> str:
    chars = list(s)
    left, right = 0, len(chars) - 1
    while left < right:
        chars[left], chars[right] = chars[right], chars[left]
        left += 1
        right -= 1
    return "".join(chars)
```

**Complexity:** O(n) time; O(n) space for the `list(s)` copy and the `"".join()` result — the swap
step itself is O(1) extra space, but the string as a whole isn't reversed in place, because it can't
be. (This is also why LeetCode's "Reverse String" hands you a `List[str]` instead of a `str` — the
problem is specifically testing the in-place swap, and a real `str` argument would make that
impossible to demonstrate.)

---

## Worked Example: Valid Palindrome With Filtering

**Problem (LeetCode 125):** given a string, determine whether it's a palindrome after ignoring all
non-alphanumeric characters and case.

This combines two techniques from this chapter directly: opposite-direction two pointers, plus
inline filtering instead of a separate cleanup pass.

```python
def is_valid_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True
```

**Complexity:** O(n) time, O(1) extra space. Each pointer only ever moves forward (toward the other)
— whether it's skipping a non-alphanumeric character or advancing past a confirmed match — so the
two inner `while` loops and the outer one together still bound total pointer movement at O(n), not
O(n²).

The tempting-but-costlier alternative: build `filtered = [c.lower() for c in s if c.isalnum()]`
first, then run the plain `is_palindrome` two-pointer check on that. It's correct, and arguably
easier to read under interview pressure — but it allocates an O(n) list up front. The version above
reaches the same answer without ever materializing a cleaned copy of the string. An empty result
after filtering (no alphanumeric characters at all, or an empty input) is vacuously a palindrome:
the `while left < right` loop never runs, and the function returns `True`.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
