---
title: "6 — Longest Common Subsequence"
description: "Longest Common Subsequence's two-string 2D state and transition, traced on a full table for a worked example (ABCBDAB / BDCABA, LCS length 4) with backward reconstruction of the actual subsequence, the rolling-array space optimization's tension with reconstruction (Hirschberg's algorithm named, not derived), and the family of alignment problems — edit distance, longest common substring, shortest common supersequence — this same 2D shape generalizes to."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-66"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/01-dp-fundamentals/01-dp-fundamentals
    kind: depends_on
  - slug: data-structures-algorithms/08-dynamic-programming/03-tabulation/03-tabulation
    kind: depends_on
---

# 6 — Longest Common Subsequence

Every DP problem this Part has covered so far — Longest Increasing Subsequence, 0/1 Knapsack —
operates on state derived from a **single** input, even when that state needed two dimensions.
[[04-knapsack-problems|Chapter 4]]'s `(item, capacity)` pair is two numbers, but both are drawn from
the same problem: one item list, one capacity budget. Longest Common Subsequence is this Part's
first problem where the input is genuinely **two separate sequences**, and the state has to track a
position in each one independently. Given two sequences, find the length of the longest subsequence
— elements need not be contiguous, but their relative order must be preserved — common to both.
`s1 = "ABCBDAB"` and `s2 = "BDCABA"` share no common _substring_ longer than two characters, but
they share a common _subsequence_ four characters long. That gap between "contiguous match" and
"common subsequence" is the entire subject of this chapter, and it isn't a niche curiosity — LCS is
the shape-setter for a whole family of two-string alignment problems built on the identical 2D
table. [[07-edit-distance|Chapter 7]], immediately next, generalizes it directly by swapping "match
or skip" for "match, insert, delete, or replace."

---

## State, Transition, and Base Case

Following [[01-dp-fundamentals|Chapter 1]]'s process — pin the state down first, and let the
transition fall out of it rather than guessing at a recurrence and hoping it covers every case — the
state needs one index per string, because "how far along am I" now means two independent things at
once.

**State:** `dp[i][j]` = the length of the longest common subsequence of `s1[0:i]` and `s2[0:j]` —
the first `i` characters of `s1` and the first `j` characters of `s2`.

**Transition:** the entire recurrence turns on a single yes/no question — do the characters just
added to each prefix agree?

- If `s1[i-1] == s2[j-1]` — the trailing character of each prefix matches — that character can
  always take part in some LCS of the two prefixes: extend whatever LCS was found using both strings
  _without_ these two trailing characters. `dp[i][j] = 1 + dp[i-1][j-1]`.
- Otherwise, the two trailing characters can't both take part in the same matched pair yet, so the
  best available answer drops one character from either string and keeps the better of the two
  results: `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.

```
dp[i][j] = 1 + dp[i-1][j-1]                  if s1[i-1] == s2[j-1]
dp[i][j] = max(dp[i-1][j], dp[i][j-1])       otherwise
```

**Base case:** `dp[0][j] = 0` for every `j`, and `dp[i][0] = 0` for every `i` — an empty string
shares no common subsequence, of any length, with anything, including another empty string.

---

## The Full 2D Table, Traced

Fill order follows [[03-tabulation|Chapter 3]]'s dependency-order rule exactly: `dp[i][j]` reads
only `dp[i-1][j-1]`, `dp[i-1][j]`, and `dp[i][j-1]` — one row up, or the current row one column back
— so rows fill top to bottom and, within a row, columns fill left to right.

```python
def lcs_length_table(s1: str, s2: str) -> list[list[int]]:
    """Build the full dp[i][j] table: LCS length of s1[:i] and s2[:j]."""
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = 1 + dp[i - 1][j - 1]
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp
```

Running `lcs_length_table("ABCBDAB", "BDCABA")` produces, filled top to bottom:

| `i` (`s1` prefix) | j=0 | 1 (B) | 2 (D) | 3 (C) | 4 (A) | 5 (B) | 6 (A) |
| ----------------- | --- | ----- | ----- | ----- | ----- | ----- | ----- |
| 0 (empty)         | 0   | 0     | 0     | 0     | 0     | 0     | 0     |
| 1 (A)             | 0   | 0     | 0     | 0     | 1     | 1     | 1     |
| 2 (AB)            | 0   | 1     | 1     | 1     | 1     | 2     | 2     |
| 3 (ABC)           | 0   | 1     | 1     | 2     | 2     | 2     | 2     |
| 4 (ABCB)          | 0   | 1     | 1     | 2     | 2     | 3     | 3     |
| 5 (ABCBD)         | 0   | 1     | 2     | 2     | 2     | 3     | 3     |
| 6 (ABCBDA)        | 0   | 1     | 2     | 2     | 3     | 3     | 4     |
| 7 (ABCBDAB)       | 0   | 1     | 2     | 2     | 3     | 4     | 4     |

`dp[7][6] = 4` is the answer — matches the standard textbook result for this exact pair. Notice
`dp[6][6] = dp[7][6] = 4`: adding `s1`'s final character (the trailing `B`) changed nothing about
the achievable length once both full strings are in play, the same signal 0/1 Knapsack's identical
rows gave when item E turned out irrelevant to the optimal value. Reconstruction below confirms it
directly — the trailing `B` of `s1` never gets selected as part of the LCS it recovers.

---

## Reconstructing the Actual Subsequence

The number 4 alone doesn't say _which_ characters produced it — there could be more than one common
subsequence of that length. Reconstruction walks backward from `dp[len(s1)][len(s2)]`, asking the
same question the transition asked forward: did the trailing characters of the current prefixes
match?

```
if s1[i-1] == s2[j-1]: that character is part of the LCS -- move diagonally to (i-1, j-1)
else: move to whichever of (i-1, j) or (i, j-1) produced the larger value at (i, j) --
      the same cell max() picked when dp[i][j] was computed forward
```

```python
def reconstruct_lcs(dp: list[list[int]], s1: str, s2: str) -> str:
    """Walk backward through the table to recover an actual LCS string."""
    i, j = len(s1), len(s2)
    chars = []
    while i > 0 and j > 0:
        if s1[i - 1] == s2[j - 1]:
            chars.append(s1[i - 1])       # part of the LCS
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1                         # dropped a character from s1
        else:
            j -= 1                         # dropped a character from s2
    chars.reverse()
    return "".join(chars)
```

Walking it by hand, starting at `i = 7, j = 6`:

| Step | `(i, j)` | `s1[i-1]` | `s2[j-1]` | Match?  | `dp[i-1][j]` | `dp[i][j-1]` | Decision             | Next `(i, j)` |
| ---- | -------- | --------- | --------- | ------- | ------------ | ------------ | -------------------- | ------------- |
| 1    | (7, 6)   | B         | A         | no      | 4            | 4            | tie → drop s1's char | (6, 6)        |
| 2    | (6, 6)   | A         | A         | **yes** | —            | —            | take 'A', diagonal   | (5, 5)        |
| 3    | (5, 5)   | D         | B         | no      | 3            | 2            | drop s1's char       | (4, 5)        |
| 4    | (4, 5)   | B         | B         | **yes** | —            | —            | take 'B', diagonal   | (3, 4)        |
| 5    | (3, 4)   | C         | A         | no      | 1            | 2            | drop s2's char       | (3, 3)        |
| 6    | (3, 3)   | C         | C         | **yes** | —            | —            | take 'C', diagonal   | (2, 2)        |
| 7    | (2, 2)   | B         | D         | no      | 0            | 1            | drop s2's char       | (2, 1)        |
| 8    | (2, 1)   | B         | B         | **yes** | —            | —            | take 'B', diagonal   | (1, 0)        |

`j` reaches 0 with `i = 1` still unvisited, so the loop stops (`j > 0` fails). Characters were
collected, in visit order, as `A, B, C, B`; reversing to the order they occur in the string gives
**`B, C, B, A`** → `"BCBA"`.

```python
>>> dp = lcs_length_table("ABCBDAB", "BDCABA")
>>> dp[7][6]
4
>>> reconstruct_lcs(dp, "ABCBDAB", "BDCABA")
'BCBA'
```

`"BCBA"` checks out directly against both strings: in `s1 = "ABCBDAB"` it's the characters at
positions 2, 3, 4, 6 (`B, C, B, A`); in `s2 = "BDCABA"` it's positions 1, 3, 5, 6 (`B, C, B, A`) —
the same four characters, in the same relative order, actually present in both strings, exactly as
the definition requires.

---

## Complexity: O(m·n), and the Tension Between Rolling Arrays and Reconstruction

**Time:** O(m·n) — one cell per `(i, j)` pair, O(1) work per cell, the same shape of bound as Unique
Paths and 0/1 Knapsack, both 2D tables from [[03-tabulation|Chapter 3]] and
[[04-knapsack-problems|Chapter 4]]. **Space:** O(m·n) for the full table, collapsing to **O(min(m,
n))** with the rolling-array trick — but only if the length alone is needed, not the actual
subsequence.

The collapse itself needs one adjustment [[03-tabulation|Chapter 3]]'s Unique Paths example didn't:
Unique Paths' transition read only the cell directly above and the cell directly to the left, both
still sitting in a single reused row. LCS's match branch also reads `dp[i-1][j-1]` — a **diagonal**
dependency a single reused row would have already overwritten by the time column `j` is reached.
Keeping two rows instead of one sidesteps the problem cleanly:

```python
def lcs_length_rolling(s1: str, s2: str) -> int:
    """Length-only, O(min(m, n)) space: two rolling rows instead of the full table."""
    m, n = len(s1), len(s2)
    prev = [0] * (n + 1)
    for i in range(1, m + 1):
        curr = [0] * (n + 1)
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                curr[j] = 1 + prev[j - 1]
            else:
                curr[j] = max(prev[j], curr[j - 1])
        prev = curr
    return prev[n]
```

```python
>>> lcs_length_rolling("ABCBDAB", "BDCABA")
4
```

(A true single-array in-place version is also possible — it needs one extra scalar tracking the
about-to-be-overwritten diagonal value at each step of the inner loop — but it saves nothing over
the two-row version asymptotically, only a constant factor of memory.)

The real cost of either collapse is what it throws away. `reconstruct_lcs` above reads cells from
anywhere in the full table — `dp[i-1][j-1]` three cells back diagonally, walking all the way from
`(m, n)` back to `(0, 0)`. Once old rows are discarded after use, that walk has nowhere left to read
from. This is the same shape of trade-off [[04-quick-sort|Part 07, Chapter 4]] made trading
stability away for an in-place partition: a real capability (there, stability; here, reconstruction)
given up for a real resource saving (there, no auxiliary array; here, O(min(m, n)) instead of O(m·n)
space) — except here the trade isn't permanent. Two ways exist to get both the length _and_ the
actual subsequence back: keep the full O(m·n) table (the straightforward answer used throughout this
chapter), or reach for **Hirschberg's algorithm** — a divide-and-conquer technique that reconstructs
the actual LCS in O(m·n) time using only O(min(m, n)) space, by recursively locating a midpoint
split with two rolling-array length passes run from opposite ends of the strings. Not derived here —
worth knowing by name as the answer to "can I get the space savings and the actual sequence back."

---

## The Family of Problems This Same Shape Solves

LCS's `dp[i][j]` — "the answer for the first `i` characters of one string and the first `j`
characters of another" — isn't a one-off shape. It's the template underneath a cluster of two-string
alignment problems that change only the transition, not the state or the fill order.

- **Edit distance** ([[07-edit-distance|Chapter 7]], immediately next) asks a different question
  over the identical `(i, j)` grid: the minimum number of insert/delete/replace operations needed to
  turn one string into the other. Where LCS's transition only ever matches or skips, edit distance's
  transition adds insert and delete as legal moves at every mismatched cell, alongside replace, and
  minimizes a cost instead of maximizing a count. Same two-index state, same dependency-respecting
  fill order, genuinely different recurrence.
- **Longest common substring** looks like LCS with one word changed, but the change is structural:
  contiguity is now required, not just relative order. That single requirement rewrites the mismatch
  branch entirely — instead of `max(dp[i-1][j], dp[i][j-1])` carrying the best answer forward
  through a mismatch, a mismatch **resets the current run to 0**, because a contiguous match can't
  survive a gap. The match branch stays `1 + dp[i-1][j-1]`; only the mismatch case changes, and the
  answer stops being `dp[m][n]` and becomes the maximum value appearing anywhere in the table, since
  the longest run can end in the middle of either string rather than at the final cell.
- **Shortest common supersequence** — the shortest string containing both `s1` and `s2` as
  subsequences — doesn't need a new table at all. Its length falls directly out of the LCS length
  already computed: `len(s1) + len(s2) - LCS_length`. Every character the two strings share only
  needs to appear once in the supersequence — that's precisely what the LCS characters buy — while
  every character unique to either string still has to appear in full, contributing its own length.

None of these three gets solved in full here — LCS's job in this Part is establishing the two-string
2D shape once, correctly, so each variation above reads as a small, legible edit against a
known-good base rather than three unrelated DP problems learned from scratch.

---

## Interview Angle

The signal to catch: "two sequences" and "subsequence" (not "substring") appearing in the same
problem statement is close to a direct announcement of this exact 2D shape. The moment those two
words show up together, `dp[i][j]` sized `(len(s1)+1) x (len(s2)+1)` should be the first thing
written down, before any code.

What actually separates a candidate who has internalized this shape from one who has memorized the
code for this one problem is being able to derive, from scratch and out loud:

1. **The state** — why it needs an independent index into each string, rather than a single combined
   index (unlike, say, Longest Increasing Subsequence's single-index state).
2. **The transition's two cases** — explaining the match case (extend a shorter LCS by one) and the
   mismatch case (best-of-_two_, not best-of-three, since the two trailing characters can't
   currently both be dropped and both be kept) as reasoning, not recitation.
3. **The base case**, stated as a sentence rather than a formula: an empty string has nothing in
   common with anything.

A candidate who writes the code correctly but freezes at "what if you only need the length, not the
actual subsequence — can you save space?" hasn't fully separated what the state buys from what the
code happens to store — exactly the tension the previous section walked through directly instead of
leaving implicit.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
