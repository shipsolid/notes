---
title: "7 — Strings"
description: "Why treating a Python string as 'just an array of characters' is only half true — immutability turns naive concatenation quietly quadratic, and that one property shapes every string algorithm that follows."
tags: ["data-structures-algorithms","arrays-strings","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-12"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: related
---

# 7 — Strings

Most of what [[01-arrays|Chapter 1]] said about arrays applies to strings for free — a string is a
sequence, indexable, sliceable, walkable with two pointers or a sliding window. Treating a string as
"just an array of characters" is right about 90% of the time, and the other 10% is this chapter:
Python strings are **immutable**, and that one property quietly turns a pattern that's O(n) on a
list into O(n²) on a string, if you don't know to watch for it.

---

## Strings Are Arrays of Characters — With One Crucial Difference

Every array technique in this Part — two pointers, sliding window, prefix sums, hashing — applies to
strings exactly as written, because indexing and slicing work identically. The difference that
matters: a Python `list` supports item assignment (`nums[i] = x`) and in-place mutation; a `str`
does not. `s[i] = 'x'` raises `TypeError: 'str' object does not support item assignment`, full stop.
Every "modification" to a string actually builds an entirely new string object — Python strings
behave like a read-only array that happens to support convenient slicing syntax.

That's not a limitation to work around case by case — it's the single fact that explains every other
section in this chapter.

---

## The Immutability Gotcha: Why s += char in a Loop Is O(n²)

This is the most common real bug this chapter exists to prevent. Building a string incrementally
looks innocent:

```python
def build_naive(chars):
    result = ""
    for c in chars:
        result += c      # looks like O(1) — it is not
    return result
```

`result += c` does not append to `result` in place — there is no "in place" for a `str`. It
allocates a **brand new string** of length `len(result) + 1` and copies every existing character
into it, then rebinds `result` to point at the new object. The copy on iteration `i` costs O(i);
summed over `n` iterations, that's `O(1 + 2 + ... + n) = O(n²)` total — a loop that reads like O(n)
and runs like O(n²), with nothing in the syntax to warn you.

The fix uses the one Python string-building operation that's genuinely linear: batch the pieces in a
mutable `list`, and join once at the end.

```python
def build_efficient(chars):
    parts = []
    for c in chars:
        parts.append(c)      # O(1) amortized — same doubling-array argument as list.append()
    return "".join(parts)    # O(n) — one allocation, one copy, computed length up front
```

`"".join(parts)` can compute the total output length before allocating anything (it just sums the
input lengths first), so it allocates exactly once and copies each character exactly once —
genuinely O(n) total, not O(n²). Some CPython versions optimize the naive `+=` loop when `result`
has a refcount of 1 (rewriting the concatenation in place under the hood) — useful to know, not
something to depend on: it's an implementation detail of one interpreter, not a language guarantee,
and the `list` + `join` version is correct everywhere regardless.

---

## Common Operation Complexities

| Operation                        | Complexity           | Why                                                                            |
| -------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `s[i]` (index)                   | O(1)                 | Same contiguous layout as an array                                             |
| `s[a:b]` (slice)                 | O(b - a)             | Copies the sliced range into a new string                                      |
| `s1 + s2`                        | O(len(s1) + len(s2)) | Allocates a new string, copies both                                            |
| `x in s` (substring check)       | O(n · m) naive       | Covered in depth, with the smarter algorithms, in the next chapter and Part 13 |
| `s.split(...)` / `sep.join(...)` | O(n)                 | One pass to scan/build                                                         |
| `len(s)`                         | O(1)                 | Length is cached on the string object, not recomputed by scanning              |

The slicing and concatenation rows are the ones that catch people: `s[a:b]` inside a loop, called
`n` times, is another disguised O(n²) — identical shape to the `+=` gotcha above, just spelled with
slice syntax instead of a plus sign.

---

## ASCII, Unicode, and Character Arithmetic

`ord(c)` returns a character's Unicode code point as an integer; `chr(i)` is the inverse. The single
most common use in interview code is mapping a lowercase letter to a small array index for a
frequency count:

```python
ord('a')                    # 97
ord('a') - ord('a')         # 0  — 'a' maps to index 0
ord('z') - ord('a')         # 25 — 'z' maps to index 25, fits a fixed-size 26-slot array
```

This is exactly the trick behind the fixed-size-array anagram check in the next chapter — a 26-slot
array indexed by `ord(ch) - ord('a')` instead of a general-purpose hash map, when the alphabet is
known and bounded.

Python 3's `str` is a sequence of Unicode code points, and `len(s)` counts code points — not bytes.
`len("café")` is 4, not the 5 bytes `"café"` takes as UTF-8. This matters the moment a problem
involves non-ASCII input or byte-level parsing (network protocols, binary formats): `len()` and
indexing operate on the code-point view, and converting to `.encode('utf-8')` switches to a `bytes`
object with entirely different length semantics. For the ASCII-only inputs almost all interview
problems use, this distinction never surfaces — worth knowing it exists before it surprises you on
the one problem that isn't ASCII-only.

---

## Worked Example: Capital Usage Validator

**Problem:** given a word, determine whether its capitalization is "correct" under one of three
rules: every letter is uppercase (`"USA"`), every letter is lowercase (`"leetcode"`), or only the
first letter is uppercase (`"Google"`). Anything else is invalid.

A first-pass solution reached for three checks stitched together with `or` — but called a method
that doesn't actually exist on `str` (`iscapitalize`), which means that version raises
`AttributeError` the moment it runs, not a subtler logic bug. The three real `str` methods that
cover exactly these three cases, with no manual character-by-character loop needed at all:

```python
def valid_capital_usage(word: str) -> bool:
    return word.isupper() or word.islower() or word.istitle()
```

- `.isupper()` — every cased character is uppercase (covers `"USA"`).
- `.islower()` — every cased character is lowercase (covers `"leetcode"`).
- `.istitle()` — the string follows title-case rules: first letter of each word capitalized, the
  rest lowercase (covers `"Google"` — a single word, so this reduces to "first letter capital, rest
  lower").

**Complexity:** O(n) time — each `is*()` method scans the string once; Python evaluates the `or`
chain short-circuit, so at most one full scan runs on a valid input matching the first rule checked,
and at most three scans on an invalid one. O(1) extra space.

This is a case where knowing the standard library cold beats writing a manual loop: all three rules
map directly onto existing `str` predicates, and the only bug in the original attempt was reaching
for a method name that was never real to begin with instead of the three that already existed.

The next chapter, [[08-string-algorithms|String Algorithms]], picks up from here — palindrome
checks, anagram detection, and substring search all build directly on strings-as-character-arrays
plus the immutability rules established in this chapter.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
