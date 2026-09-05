---
title: "12 — Interval DP"
description: "The matrix-chain-multiplication template — range state, increasing-length fill order, every split point tried — generalized to palindrome partitioning's nested interval DP and burst balloons' burst-last reframing, closing on the O(n³) ceiling that sets this family apart from cheaper 1D DP shapes."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-61"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/08-matrix-chain-multiplication/08-matrix-chain-multiplication
    kind: depends_on
---

# 12 — Interval DP

[[08-matrix-chain-multiplication|Part 08, Chapter 8]] introduced this Part's first state defined
over a _range_ rather than a position: `dp[i][j]`, the optimal cost of fully parenthesizing the
matrix chain from index `i` through `j`, filled not row by row but by increasing interval length,
with the transition trying every split point `k` where the range breaks into two
independently-solved sub-ranges — `dp[i][k]` and `dp[k+1][j]` — plus a cost for combining them at
that particular split. That's a one-paragraph recap, not a re-derivation; the fill-order argument
for why length has to increase before a cell's dependencies are ready belongs to that chapter.
What's worth naming here is that none of that template was actually specific to matrix
parenthesization. State over a range, fill order driven by interval length, transition enumerating
every split — that's a reusable shape, and this chapter is where it gets a name of its own:
**interval DP**, the family Matrix Chain Multiplication happened to introduce through its first and
most literal member.

Generalized, the template reads: `dp[i][j]` answers some question about the range `i..j`; the base
cases are the smallest legal ranges; and the transition is "take the best over every split `k`
between `i` and `j` of whatever combining the two sub-ranges at that split produces." Two worked
examples make that generalization concrete instead of abstract — one where the range-splitting
structure shows up in a helper table rather than the top-level answer, and one where recognizing
that a split even needs searching is the entire difficulty of the problem.

---

## Palindrome Partitioning II: An Interval DP Hiding Inside a 1D One

Palindrome Partitioning II asks: given a string `s`, partition it into palindromic substrings —
pieces that read the same forwards and backwards — using the fewest cuts possible. `"aab"` needs one
cut, into `"aa"` and `"b"`; `"aaa"` needs zero, because the whole string is already a palindrome.

The natural first attempt reaches for a 1D state: `dp[i]` = the minimum cuts needed to partition the
prefix `s[0:i+1]`. The transition tries every earlier split point `j`: if the suffix `s[j+1:i+1]` is
itself a palindrome, `dp[i]` could be as low as `dp[j] + 1` — pay one cut to close off that
palindromic suffix, and let `dp[j]` handle everything before it. Take the minimum over every legal
`j`, including the case where the whole prefix is already a palindrome and `dp[i] = 0`.

```
dp[i] = 0                                   if s[0:i+1] is a palindrome
dp[i] = min(dp[j] + 1 for j in 0..i-1
            if s[j+1:i+1] is a palindrome)   otherwise
```

That's a 1D recurrence over positions, not a 2D one over ranges — it looks like it belongs in an
earlier chapter, not this one. It belongs here anyway, because answering "is `s[j+1:i+1]` a
palindrome" cheaply needs its own table, and that table is interval DP in miniature. Define
`is_pal[i][j]` = whether `s[i:j+1]` is a palindrome. A range of length 1 is trivially a palindrome.
A range of length 2 is a palindrome exactly when its two characters match. Past that, `s[i:j+1]` is
a palindrome exactly when its outer characters match _and_ the interior range `s[i+1:j]` is also a
palindrome:

```
is_pal[i][j] = True                                if j == i
is_pal[i][j] = (s[i] == s[j])                       if j == i + 1
is_pal[i][j] = s[i] == s[j] and is_pal[i+1][j-1]    otherwise
```

That's the exact shape [[08-matrix-chain-multiplication|Chapter 8]] established, with one
simplification: the split isn't searched over every `k` — it's fixed, always shrinking to
`(i+1, j-1)`. `is_pal[i][j]` still can't be computed before `is_pal[i+1][j-1]`, a strictly shorter
range, so the fill order is still "increasing interval length, base cases first"; this cell just
never has to choose _which_ smaller sub-range to consult, only whether to trust the one sub-range it
always consults.

```python
def min_cuts_palindrome_partition(s: str) -> int:
    """Minimum cuts to partition s into palindromic substrings.

    is_pal is an interval DP in its own right: filled by increasing
    substring length, exactly the order Matrix Chain Multiplication
    established, but with a fixed split (i+1, j-1) instead of a search
    over every k. dp then walks prefixes, reusing is_pal as an O(1)
    lookup at every candidate cut point.
    """
    n = len(s)
    is_pal = [[False] * n for _ in range(n)]
    for i in range(n):
        is_pal[i][i] = True                        # length 1

    for length in range(2, n + 1):                  # increasing interval length
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j]:
                is_pal[i][j] = length == 2 or is_pal[i + 1][j - 1]

    dp = [0] * n
    for i in range(n):
        if is_pal[0][i]:
            dp[i] = 0
            continue
        dp[i] = min(dp[j] + 1 for j in range(i) if is_pal[j + 1][i])
    return dp[n - 1]
```

Traced on `s = "aab"`: the length-1 pass sets every `is_pal[i][i]` to `True`. The length-2 pass
checks `(0, 1)` — `s[0] = s[1] = 'a'`, so `is_pal[0][1] = True` — and `(1, 2)` — `s[1] = 'a'`,
`s[2] = 'b'`, no match, `is_pal[1][2]` stays `False`. There's no length-3 hit, since `s[0] = 'a'`
and `s[2] = 'b'` don't match either. Then `dp[0] = 0` (single character), `dp[1] = 0`
(`is_pal[0][1]` is `True` — `"aa"` needs no cut), and `dp[2]`: `is_pal[0][2]` is `False`, so scan
`j`: `j = 0` needs `is_pal[1][2]`, which is `False`; `j = 1` needs `is_pal[2][2]`, which is `True`,
giving `dp[1] + 1 = 1`. `dp[2] = 1`, matching the one-cut answer by hand.

```python
>>> min_cuts_palindrome_partition("aab")
1
```

That's the entire point of leading with this example: the interval-DP shape doesn't only show up as
a problem's top-level state. It's just as often the _helper_ a problem needs precomputed before some
other DP — 1D, in this case — can afford to ask its questions in O(1) instead of re-deriving "is
this a palindrome" from scratch on every candidate cut.

---

## Burst Balloons: Why "Last" Beats "First"

Burst Balloons hands over an array of balloon values and a rule: bursting balloon `i` pays
`nums[left] * nums[i] * nums[right]` coins, where `left` and `right` are balloon `i`'s _current_
neighbors — whatever balloons are still standing on either side at the moment it's burst, not its
original neighbors in the array. Burst every balloon, in whatever order maximizes total coins
earned.

The instinctive framing is "which balloon do I burst first?" It's a reasonable question and a bad
state, because the moment a balloon bursts, its former neighbors are no longer separated by it —
they become each other's new neighbors, and every subsequent burst's payout depends on that updated
adjacency. A state built around "first" would have to carry the entire current arrangement of
surviving balloons to mean anything, which isn't a fixed-shape state at all — it's the whole
remaining array, and there's no bounded-dimension `dp[...]` that captures it.

The fix is to ask the opposite question: which balloon in a given range bursts _last_? That
reframing has a property "first" doesn't: if balloon `k` is the last one burst within some range,
then by definition every other balloon strictly between the range's boundaries has already been
burst by the time `k` goes — which means `k`'s neighbors, at the moment it bursts, are exactly the
range's boundary balloons, not some intermediate survivor whose identity depends on burst order.
"Last" pins down the neighbors without needing to know anything about the order the rest of the
range was cleared in.

That licenses a genuine `dp[i][j]`: pad the array with a value-1 sentinel balloon on each end —
`balloons = [1] + nums + [1]` — so every real balloon always has a well-defined neighbor to multiply
against, even at the array's edges. Define `dp[i][j]` = the maximum coins obtainable from bursting
every balloon strictly between indices `i` and `j`, leaving `i` and `j` themselves unburst. For
every candidate last-balloon `k` strictly between `i` and `j`, everything strictly between `i` and
`k` and everything strictly between `k` and `j` is handled recursively — `dp[i][k]` and `dp[k][j]` —
and `k` itself pays out against boundaries `i` and `j`, because those are exactly its neighbors at
the moment it goes last:

```
dp[i][j] = max over k in (i, j) of:
    dp[i][k] + dp[k][j] + balloons[i] * balloons[k] * balloons[j]
```

```python
def max_coins(nums: list[int]) -> int:
    """Maximum coins from bursting every balloon.

    dp[i][j] = max coins from bursting everything strictly between
    padding balloons i and j. Framed around which balloon bursts LAST
    in the range, not first -- "last" pins down k's neighbors as
    exactly i and j, which "first" can never guarantee.
    """
    balloons = [1] + nums + [1]
    n = len(balloons)
    dp = [[0] * n for _ in range(n)]

    for gap in range(2, n):                      # increasing distance i to j
        for i in range(n - gap):
            j = i + gap
            for k in range(i + 1, j):             # every choice of last-burst balloon
                coins = balloons[i] * balloons[k] * balloons[j]
                dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + coins)
    return dp[0][n - 1]
```

Run on `nums = [3, 1, 5, 8]`:

```python
>>> max_coins([3, 1, 5, 8])
167
```

167 is reachable by an actual burst order, not just the table's say-so: burst `1` first (neighbors
`3` and `5`, paying `3*1*5 = 15`), then `5` (neighbors now `3` and `8`, paying `3*5*8 = 120`), then
`3` (neighbors now the two boundary sentinels, `1` and `8`, paying `1*3*8 = 24`), then `8` last of
all (neighbors both padding `1`s, paying `1*8*1 = 8`). `15 + 120 + 24 + 8 = 167`. In the DP's own
terms, that order says balloon `8` (padded index 4) is the _last_ balloon burst across the whole
range, so the top-level split is
`dp[0][5] = dp[0][4] + dp[4][5] + balloons[0]*balloons[4]*balloons[5] = dp[0][4] + 0 + 1*8*1`, and
`dp[0][4] = 159` is exactly the coins from optimally clearing `3, 1, 5` between padding `1` and
balloon `8` — `15 + 120 + 24`. The table doesn't need to be walked cell by cell to be trusted; the
burst order it implies reproduces 167 by direct simulation.

---

## Complexity: O(n³), and Where This Family Sometimes Escapes It

Burst Balloons pays the family's default price in full: O(n²) intervals `(i, j)`, and for each one,
a genuine search over up to O(n) candidate values of `k` — no way to know which balloon bursts last
without checking all of them. O(n²) × O(n) = **O(n³)** time, and **O(n²)** space for the table,
matching [[08-matrix-chain-multiplication|Chapter 8]]'s complexity exactly, cell for cell in shape
if not in value.

Palindrome Partitioning II's `is_pal` table looks like it should cost the same and doesn't, and the
reason is worth stating precisely rather than waved past. `is_pal[i][j]`'s transition never searches
over a `k` — it always consults exactly one fixed sub-range, `(i+1, j-1)`. That's O(1) work per cell
instead of O(n), so `is_pal` costs O(n²) to fill, not O(n³), and the `dp[i]` prefix-cuts array on
top of it costs another O(n²) — one scan of up to `n` earlier split points per position, summed
across `n` positions. Total: **O(n²)** time, **O(n²)** space, a full factor of `n` cheaper than
Burst Balloons for a problem that's still, unmistakably, built out of an interval DP.

Both numbers are worth keeping, because the gap between them is the actual lesson. O(n³) is what
this family costs _whenever a split has to be searched for_ — whenever combining `dp[i][k]` and
`dp[k][j]` genuinely depends on which `k` was chosen, the way Burst Balloons' payout does and the
way Matrix Chain Multiplication's parenthesization cost does. It drops to O(n²) exactly when a
problem's inner structure pins the split down to one fixed candidate instead of a search — a
property of the _problem_, not something a general optimization technique retrofits onto a search
that's genuinely required. Reach for interval DP expecting O(n³) by default, and treat anything
cheaper as a specific structural gift, not the norm.

---

## Recognizing Interval DP

The signal worth carrying forward: reach for interval DP when _the answer for a range depends on
trying every way to split that range into two parts, where the split choice itself affects a value
that depends on the whole range's boundary_ — Matrix Chain Multiplication's parenthesization cost
and Burst Balloons' `balloons[i] * balloons[k] * balloons[j]` payout are both boundary-dependent in
exactly that way. Contrast that against the far more common 1D DP shape, the one nearly every
earlier chapter in this Part has used: _the answer for position `i` depends only on a few specific
earlier positions_ — `i-1`, or `i-1` and `i-2`, or a small fixed window, none of it requiring a
search over every possible split. That's a structurally cheaper question to ask, and it's why 1D DP
problems dominate the easy and medium tiers of interview prep while range-splitting problems cluster
at the hard tier: recognizing that a split has to be searched, rather than read off a fixed offset,
is most of the difficulty.

The O(n³) default this family carries has a practical ceiling worth naming explicitly, because it
doesn't show up the way an O(n²) 1D DP's cost does. An O(n²) DP — LCS, edit distance, both from
earlier in this Part — stays comfortably usable well into the thousands for `n`. O(n³) does not:
past roughly `n ≈ 500` to `1000`, depending on the constant factor and the time budget, an interval
DP stops being a viable brute-force-with-memoization answer, full stop, regardless of how correct
the recurrence is. That ceiling is specific to this family — it's the direct cost of the split
search this section just named as the recognition signal — and it's worth checking against a
problem's stated constraints before committing to an interval-DP solution rather than discovering
the timeout after the recurrence is already written.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
