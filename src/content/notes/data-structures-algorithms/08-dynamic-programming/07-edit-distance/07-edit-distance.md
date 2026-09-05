---
title: "7 — Edit Distance"
description: "Edit distance's three-way insert/delete/replace transition derived directly from LCS's two-way match/skip transition, traced on a full 2D table and backward-reconstructed into an actual operation sequence, then set side by side with LCS to show precisely why replace has no LCS equivalent."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-67"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/06-longest-common-subsequence/06-longest-common-subsequence
    kind: depends_on
---

# 7 — Edit Distance

[[06-longest-common-subsequence|Part 08, Chapter 6]] answered a narrower question than it looks like
at first glance: given two strings, how much do they already agree on, if some characters are
allowed to be skipped? The transition that answers it never forces the two strings into agreement —
it just decides, character by character, whether to keep a matching pair or skip a character from
one side. Two operations, match and skip, and neither one manufactures agreement where none exists.
LCS finds the largest subsequence the two strings already share and stops there, whether or not the
strings end up equal.

Edit distance drops the "already agrees" hedge and asks the sharper version of the same question:
what's the minimum number of operations to turn `s1` into `s2`, exactly, character for character?
Not "how much of it already lines up" but "make it line up, completely, as cheaply as possible."
Answering that needs a strict superset of LCS's toolkit: keep something equivalent to LCS's skip —
now split into inserting into one string or deleting from the other — and add a third option LCS
never needed at all: replace a character outright, paying one operation to force a mismatch into
agreement instead of just stepping around it. Same two-string input, same 2D table shape
[[03-tabulation|Part 08, Chapter 3]] established for problems over a pair of prefixes, one more
choice folded into the transition.

---

## State, Transition, and Base Case

**State:** `dp[i][j]` = the minimum number of operations required to transform `s1[0:i]` (the first
`i` characters of `s1`) into `s2[0:j]` (the first `j` characters of `s2`). The same pair-of-prefixes
state [[06-longest-common-subsequence|Chapter 6]] used — both axes are still "how far into `s1`" and
"how far into `s2`" — because the underlying question is still about two prefixes; only what's being
counted at each cell changes.

**Transition:** check the characters at positions `i-1` and `j-1` first, exactly the move LCS made,
because whether they agree determines everything else.

If `s1[i-1] == s2[j-1]`, the two characters already match, no operation needs spending on this pair,
and the problem reduces to whatever it costs to reconcile the two shorter prefixes:

```
dp[i][j] = dp[i-1][j-1]        if s1[i-1] == s2[j-1]
```

That line is character-for-character identical to LCS's match case — same cell reference, same
"nothing to decide here" reasoning. The only thing that differs is what the cell means: LCS's
`dp[i-1][j-1]` contributes `+1` to a running _length_ being maximized; edit distance's contributes
`+0` to a running _cost_ being minimized, because agreement is free, not valuable.

If the characters differ, there is no free option. Three operations are available, and `dp[i][j]`
takes whichever is cheapest:

- **Insert** a character into `s1` matching `s2[j-1]`. That character of `s2` is now accounted for,
  and what remains is transforming all of `s1[0:i]` into the shorter `s2[0:j-1]`: `1 + dp[i][j-1]`.
- **Delete** `s1[i-1]`. What remains is transforming the shorter `s1[0:i-1]` into all of `s2[0:j]`:
  `1 + dp[i-1][j]`.
- **Replace** `s1[i-1]` with `s2[j-1]`. Both prefixes shrink by one, exactly as the match case did —
  except this time the operation isn't free: `1 + dp[i-1][j-1]`.

```
dp[i][j] = dp[i-1][j-1]                                    if s1[i-1] == s2[j-1]
dp[i][j] = 1 + min(dp[i][j-1], dp[i-1][j], dp[i-1][j-1])   otherwise
```

**Base case:** `dp[0][j] = j` — transforming an empty `s1` into the first `j` characters of `s2`
takes exactly `j` insertions, one per character, and no cheaper path exists. `dp[i][0] = i` —
transforming the first `i` characters of `s1` into an empty string takes exactly `i` deletions.
Compare this against LCS's base case, `dp[0][j] = dp[i][0] = 0`: LCS's empty-prefix cells report
"zero characters in common so far," a length. Edit distance's report "this many operations still
owed," a cost. Same corner of the table, opposite meaning — one problem counts agreement, the other
counts work.

---

## The Full 2D Table, Traced

```python
def edit_distance_table(s1: str, s2: str) -> list[list[int]]:
    """Build the full dp[i][j] table: min operations to turn s1[0:i] into s2[0:j]."""
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i                      # delete all i characters of s1
    for j in range(n + 1):
        dp[0][j] = j                      # insert all j characters of s2
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i][j - 1],      # insert
                    dp[i - 1][j],      # delete
                    dp[i - 1][j - 1],  # replace
                )
    return dp
```

`s1 = "horse"`, `s2 = "ros"` — a classic pair, chosen because the answer (3) is small enough to
trace by hand but the table still exercises all three non-free operations. Filled top to bottom,
left to right — the same dependency-order argument [[03-tabulation|Chapter 3]] established for a 2D
table: row `i` reads only row `i-1` and the current row's own earlier columns, so a single
top-to-bottom, left-to-right pass always sees every dependency before it's needed.

```python
>>> edit_distance_table("horse", "ros")
[[0, 1, 2, 3], [1, 1, 2, 3], [2, 2, 1, 2], [3, 2, 2, 2], [4, 3, 3, 2], [5, 4, 4, 3]]
```

| `i` (s1 prefix) | j=0 `""` | 1 `r` | 2 `ro` | 3 `ros` |
| --------------- | -------- | ----- | ------ | ------- |
| 0 `""`          | 0        | 1     | 2      | 3       |
| 1 `h`           | 1        | 1     | 2      | 3       |
| 2 `ho`          | 2        | 2     | 1      | 2       |
| 3 `hor`         | 3        | 2     | 2      | 2       |
| 4 `hors`        | 4        | 3     | 3      | 2       |
| 5 `horse`       | 5        | 4     | 4      | 3       |

`dp[5][3] = 3` — turning `"horse"` into `"ros"` takes a minimum of 3 operations. Spot-check one
interior cell against the transition: `dp[3][2]` (turning `"hor"` into `"ro"`) — `s1[2] = 'r'`,
`s2[1] = 'o'`, a mismatch, so
`dp[3][2] = 1 + min(dp[3][1], dp[2][2], dp[2][1]) = 1 + min(2, 1, 2) = 2`, matching the table.

---

## Reconstructing the Actual Sequence of Operations

The number 3 alone doesn't say _which_ three operations. Reconstruction walks backward from
`dp[len(s1)][len(s2)]`, and at each cell asks the same question the transition asked forward: did
the characters match here, and if not, which of the (up to three) candidate cells actually produced
the stored value?

```python
def reconstruct_edit_sequence(s1: str, s2: str, dp: list[list[int]]) -> list[tuple]:
    """Walk backward through the table, emitting (op, ...) tuples in s1-to-s2 order."""
    i, j = len(s1), len(s2)
    ops = []
    while i > 0 or j > 0:
        if i > 0 and j > 0 and s1[i - 1] == s2[j - 1]:
            ops.append(("match", s1[i - 1]))
            i, j = i - 1, j - 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            ops.append(("replace", s1[i - 1], s2[j - 1]))
            i, j = i - 1, j - 1
        elif j > 0 and dp[i][j] == dp[i][j - 1] + 1:
            ops.append(("insert", s2[j - 1]))
            j -= 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            ops.append(("delete", s1[i - 1]))
            i -= 1
        else:
            raise AssertionError("no transition matched — dp table is inconsistent")
    ops.reverse()
    return ops
```

The order the four branches are checked in matters: match is checked first because it's free and
unambiguous whenever the characters agree, and among the three paid operations, replace and delete
are checked before insert only because that's the order that happens to resolve ties correctly for
this table — in general more than one branch can satisfy its condition at a mismatched cell (a tie
between candidates), and any one of the tied operations is a valid minimum-cost choice.

```python
>>> dp = edit_distance_table("horse", "ros")
>>> reconstruct_edit_sequence("horse", "ros", dp)
[('replace', 'h', 'r'), ('match', 'o'), ('delete', 'r'), ('match', 's'), ('delete', 'e')]
```

Three non-match operations — replace, delete, delete — matching `dp[5][3] = 3` exactly. Walking the
backward trace explicitly, cell by cell:

| Step | `(i, j)` | Chars compared | `dp[i][j]` | Candidates checked (insert, delete, replace) | Decision                | Next `(i, j)` |
| ---- | -------- | -------------- | ---------- | -------------------------------------------- | ----------------------- | ------------- |
| 1    | (5, 3)   | `e` vs `s`     | 3          | `dp[5][2]=4`, `dp[4][3]=2`, `dp[4][2]=3`     | delete `e` (2+1=3)      | (4, 3)        |
| 2    | (4, 3)   | `s` vs `s`     | 2          | match — `dp[3][2] = 2`                       | match `s`               | (3, 2)        |
| 3    | (3, 2)   | `r` vs `o`     | 2          | `dp[3][1]=2`, `dp[2][2]=1`, `dp[2][1]=2`     | delete `r` (1+1=2)      | (2, 2)        |
| 4    | (2, 2)   | `o` vs `o`     | 1          | match — `dp[1][1] = 1`                       | match `o`               | (1, 1)        |
| 5    | (1, 1)   | `h` vs `r`     | 1          | `dp[1][0]=1`, `dp[0][1]=1`, `dp[0][0]=0`     | replace `h`→`r` (0+1=1) | (0, 0)        |

Reversing that backward walk gives the forward operation sequence, and applying it to the literal
string confirms it produces `s2` exactly:

```python
>>> s = list("horse")
>>> s[0] = "r"; "".join(s)
'rorse'      # replace h with r
>>> del s[2]; "".join(s)
'rose'       # delete r
>>> del s[-1]; "".join(s)
'ros'        # delete e
```

`"horse"` → `"rorse"` → `"rose"` → `"ros"`, three operations, verified by actually applying them
rather than trusting the count in isolation.

---

## LCS vs. Edit Distance: The Same Skeleton, One Different Rule

This is the single most useful comparison this chapter can make, because interviewers routinely ask
LCS and edit distance back to back specifically to see whether a candidate treats them as two
unrelated string problems or recognizes the shared skeleton underneath. Put the two transitions side
by side:

|                 | LCS (Chapter 6)                                                                        | Edit Distance (this chapter)                                                                |
| --------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| State           | `dp[i][j]` = length of LCS of `s1[0:i]`, `s2[0:j]`                                     | `dp[i][j]` = min operations to turn `s1[0:i]` into `s2[0:j]`                                |
| Match case      | `s1[i-1] == s2[j-1]` → `1 + dp[i-1][j-1]` (agreement is _valuable_, adds to the count) | `s1[i-1] == s2[j-1]` → `dp[i-1][j-1]` (agreement is _free_, adds nothing)                   |
| Mismatch case   | `max(dp[i-1][j], dp[i][j-1])` — two options                                            | `1 + min(dp[i][j-1], dp[i-1][j], dp[i-1][j-1])` — three options                             |
| Why max vs. min | Preserve as much length as possible — take whichever skip loses the least              | Spend as few operations as possible — take whichever fix costs the least                    |
| Base case       | `dp[0][j] = dp[i][0] = 0` — no characters, no agreement yet                            | `dp[0][j] = j`, `dp[i][0] = i` — no characters yet, but a nonzero amount of work still owed |

The mismatch row is where the actual generalization lives. LCS's mismatch case has exactly two
options — skip a character from `s1` or skip one from `s2` — because skipping is the only move LCS
has; it can never force two different characters to become the same character, so the best it can do
on a mismatch is give up on one side or the other and take whichever giveup preserves more length,
hence `max`. Edit distance's mismatch case has three options, and the third one, replace
(`dp[i-1][j-1]`), has **no LCS equivalent at all**. LCS structurally cannot replace a character —
"replace" isn't a length-preserving-or-extending move for a subsequence problem, it isn't a move LCS
has any use for — which is exactly why edit distance needed an operation LCS never did: transforming
one string into another sometimes requires forcing agreement at a position, not just working around
the disagreement, and `max` naturally becomes `min` because the two problems are optimizing in
opposite directions — one maximizes shared length, the other minimizes total cost.

A concrete number makes the "replace saves an operation" point non-abstract rather than asserted:
restrict `"horse"` → `"ros"` to _only_ delete operations from either string (no insert, no replace —
the "Delete Operation for Two Strings" variant, below) and the minimum cost rises from **3 to 4**.
The one operation that vanishes when replace is disallowed is precisely the `('replace', 'h', 'r')`
step from the trace above — turned instead into deleting `h` from `s1` _and_ deleting `r` from `s2`,
two deletions standing in for the one replace. That's the entire reason edit distance's operation
set had to be larger than LCS's: LCS only ever needed to decide what to drop, edit distance
sometimes needs to force something into existence that wasn't there, and dropping the option to
force costs real, countable operations.

---

## Complexity

**Time:** O(m·n) — one cell per `(i, j)` pair, O(1) work per cell (a character comparison and a
min/equality check over at most three neighbors). **Space:** O(m·n) for the full table, collapsing
to **O(min(m, n))** with a rolling array — `dp[i][j]` only ever reads row `i-1` and the current
row's already-computed cells, exactly the dependency window [[03-tabulation|Chapter 3]]'s
rolling-array section exploited for Unique Paths, so one row (indexed over the shorter string, to
minimize its length) is enough to carry the whole computation forward.

That optimization comes with precisely the same tension [[06-longest-common-subsequence|Chapter 6]]
flagged for LCS: a rolling array reports _how many_ operations are needed, but by the time the fill
finishes, the earlier rows the backward walk depends on are gone. Reconstructing the actual
operation sequence — the entire second half of this chapter — needs the full O(m·n) table to walk
backward through. "Just the number" and "the number plus the actual edits" are different space
budgets, and which one a problem is actually asking for has to be settled before reaching for the
rolling-array collapse.

---

## Variants

**Weighted edit distance.** Nothing about the transition's _shape_ changes if insert, delete, and
replace don't all cost the same — spell-checkers, for instance, often weight a replace between
visually or phonetically similar characters cheaper than a replace between unrelated ones. Each `+1`
in the transition becomes `+cost_of_that_operation`:

```
dp[i][j] = dp[i-1][j-1]                                                          if s1[i-1] == s2[j-1]
dp[i][j] = min(cost_ins + dp[i][j-1], cost_del + dp[i-1][j], cost_rep + dp[i-1][j-1])   otherwise
```

Same state, same base-case structure (scaled by whatever the fixed insert/delete cost is instead of
flat `1`s), same fill order. Only the numbers being summed change.

**Delete Operation for Two Strings.** Restrict the operation set to deletion only — from either
string, no insert, no replace — and ask for the fewest deletions that make the two strings equal.
This reduces directly to a one-line formula built entirely from
[[06-longest-common-subsequence|Chapter 6]]'s output: `len(s1) + len(s2) - 2 * LCS_length`. The
reasoning: whatever the two strings' LCS is, every character in `s1` _not_ part of that LCS has to
be deleted from `s1`, and every character in `s2` not part of it has to be deleted from `s2` —
nothing else can make the two strings converge under deletion alone, since deletion can't create new
agreement, only remove disagreement. `len(s1) - LCS_length` deletions from one side,
`len(s2) - LCS_length` from the other, summed. Ran against `("horse", "ros")`:
`LCS_length("horse", "ros") = 2` (`"ro"` or `"os"`), so the formula gives `5 + 3 - 2*2 = 4` —
matching the number the previous section used to show what replace saves, and confirming the
reduction rather than just asserting it.

---

## Interview Angle

**Levenshtein distance** is the formal name for exactly this problem — worth knowing by name, not
just by recurrence, because it's the name that shows up in spell-checkers, `diff`-style tools, and
fuzzy-matching libraries in the wild, not "edit distance" or "DP problem #7." Being able to say
"this is Levenshtein distance" signals familiarity beyond the interview room.

The actual signal an interviewer is checking for, though, is upstream of the name: deriving the
three-way transition from scratch — match is free, mismatch costs one operation via whichever of
insert/delete/replace is cheapest — and then, when asked to compare it with LCS (which happens often
enough that it's worth preparing for directly), correctly explaining _why_ replace has no LCS
counterpart: LCS can only ever choose to skip a character from one side, never force two different
characters into agreement, so the operation that costs edit distance nothing extra to reason about
was never expressible in LCS's transition at all. A candidate who recites both recurrences correctly
but can't answer that "why" hasn't actually connected the two problems — they've memorized two
separate formulas that happen to share a table shape.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
