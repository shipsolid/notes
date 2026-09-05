---
title: "1 — Pattern Practice & Loops"
description: "Why 'print a pyramid of stars' is really row-to-bound translation practice — the same instinct a DP table, a matrix traversal, or any 2D grid problem later in this book needs without ever calling it out by name."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607301922"
---

# 1 — Pattern Practice & Loops

Pattern-printing drills — triangles, pyramids, diamonds, letter shapes built out of `*` characters —
look like a rite of passage every beginner course inflicts and every working engineer is happy to
forget. They deserve better than that. Strip away the ASCII art and every one of these problems asks
the same question: given a row index, what varies? How many characters print, how many leading
spaces come first, which character shows at which position? The outer loop is always the row. The
entire exercise is translating a shape's row/column relationship into the inner loop's bounds — and
sometimes its body's branching — as a formula in the row index and the total row count. That
translation, done automatically instead of by trial and error, is exactly the skill a DP table fill,
a matrix traversal, or a grid search needs, long before this book ever calls it that.

---

## The General Technique: Row, Then What Varies

Every pattern in this family reduces to the same two-step read:

1. **The outer loop is the row.** `for i in range(n)` (or `range(1, n + 1)`, depending on whether
   the count is more natural starting at 0 or 1) answers "which row am I on" — nothing else.
2. **The inner loop(s) encode what changes per row.** In a genuine triangle or pyramid, the inner
   loop does _not_ run the same number of times on every row — the count itself is a function of
   `i`. Working out that function is the entire task.

The reliable way to find the function is to stop guessing and start tabulating. Write the shape out
by hand for a small `n` — five rows is usually enough — and, for each row, count directly: how many
leading spaces, how many characters. Put those counts next to the row index in a small table and the
formula falls out as ordinary algebra: linear in `i`, linear in `n - i`, or something like `2i + 1`
for a shape that has to grow symmetrically around a center. Nobody derives these formulas from first
principles under time pressure — they pattern-match a small table of `(row, count)` pairs to a line
or a simple expression, the same way you'd eyeball a sequence of numbers and recognize `2, 4, 6, 8`
as `2i`.

A useful reframe: a pattern-printing loop is a **2D iteration where the body's bounds — not just the
body's content — depend on position**. That is a strictly harder skill than "loop `n` times and do
the same thing every time," and it is the part of nested-loop practice that stops being obvious once
the row/column relationship stops being a flat rectangle.

---

## Worked Example: Left-Aligned Triangle

**Problem:** given `n`, print `n` rows where row `i` (1-indexed) contains exactly `i` stars,
left-aligned.

```
*
**
***
****
*****
```

The table-and-formula step is almost too small to need writing down here, which is exactly why this
is the right starting example: row 1 has 1 star, row 2 has 2, row `i` has `i`. No spaces, no
symmetry, one inner quantity to derive.

```python
def left_triangle(n: int) -> None:
    for i in range(1, n + 1):
        print("*" * i)
```

**Complexity:** O(n²) time — the total characters printed across all rows sum to
`1 + 2 + ... + n = n(n+1)/2`, which is Θ(n²) even though no single row costs more than O(n). O(1)
auxiliary space beyond the printed output itself (Python's `"*" * i` allocates one string per row,
not one character object per iteration, so there's no hidden per-character bookkeeping to worry
about).

That "total work across rows is quadratic even though each row looks linear" is worth carrying
forward on its own — it is the reason "print a triangle" and "print a rectangle" have different
complexity even though both are nested loops over roughly `n` rows: multiply row count by _average_
row width, not by the widest row, when the width itself changes per row.

---

## Worked Example: Centered Pyramid

**Problem:** given `n`, print an upward-pointing pyramid, `n` rows tall, centered — each row has an
odd number of stars, growing by two per row, padded with enough leading spaces to stay centered.

```
    *
   ***
  *****
 *******
*********
```

This example needs two quantities per row instead of one, and the row-to-formula table has to be
built for both at once. Tabulate row index `i` (0-indexed) against leading spaces and star count for
`n = 5`:

| `i` | spaces | stars |
| --- | ------ | ----- |
| 0   | 4      | 1     |
| 1   | 3      | 3     |
| 2   | 2      | 5     |
| 3   | 1      | 7     |
| 4   | 0      | 9     |

Spaces count down from `n - 1` to `0` — that's `n - i - 1`. Stars count up by two each row starting
at 1 — that's `2i + 1`. Both are straight lines in `i`; the only work was reading them off the
table.

```python
def centered_pyramid(n: int) -> None:
    for i in range(n):
        spaces = n - i - 1
        stars = 2 * i + 1
        print(" " * spaces + "*" * stars)
```

**Complexity:** O(n²) time, by the same "sum of a linearly-growing quantity across n rows" argument
as the triangle above (the star count alone sums to `n²`, since it's the sum of the first `n` odd
numbers). O(1) auxiliary space per row.

The two formulas aren't independent, which is the actual point of this example: `spaces + stars`
isn't constant, but `spaces` shrinking by exactly as much as `stars` grows (by 1 and 2 respectively
per row, keeping the right edge advancing twice as fast) is what keeps the shape centered instead of
drifting to one side. Getting a centered shape right means deriving both quantities from the same
row index and checking that they stay in the relationship the shape actually requires — not deriving
each one in isolation and hoping they line up.

---

## Worked Example: Hollow Rectangle (Row _and_ Column Both Matter)

**Problem:** given `rows` and `cols`, print a rectangle where only the border is starred — the first
and last row, and the first and last column of every row — and the interior is blank.

```
* * * * *
*       *
*       *
* * * * *
```

The first two examples derived the inner loop's _bound_ from the row index — how many characters
print changes per row, but every character within a row is the same. This example is different: the
inner loop always runs `cols` times regardless of row, and instead it's the _body_ — which character
prints at each position — that depends on both the row index `i` and the column index `j` jointly:

```python
def hollow_rectangle(rows: int, cols: int) -> None:
    for i in range(rows):
        for j in range(cols):
            on_border = i == 0 or i == rows - 1 or j == 0 or j == cols - 1
            print("*" if on_border else " ", end="")
        print()
```

**Complexity:** O(rows · cols) time — every cell gets visited exactly once, and the work per cell is
O(1). O(1) auxiliary space, same as the previous two examples.

This is the shape that matters most for what comes later in this book. The first two examples are
"row index determines a count" — one-dimensional reasoning wearing a two-dimensional loop. This one
is genuinely two-dimensional: the decision at position `(i, j)` cannot be made from `i` alone or `j`
alone, only from both together. That is precisely the shape of a boundary check on a grid, an
adjacency-matrix lookup, or a 2D DP table's edge case — "am I on row 0 or the last row, column 0 or
the last column" is the exact same condition, just answering a different question about the cell it
identifies.

---

## Translating the Habit Forward

None of the three examples above needed anything beyond loops, arithmetic on the row index, and
string formatting — but the muscle they build is the one the rest of this book leans on constantly,
usually without re-explaining it:

- **Nested loops multiply, and now you've felt why.** A row loop of length `n` containing a column
  loop of length `m` costs O(n · m) — [[02-asymptotic-analysis|Part 01, Chapter 2]] states this as a
  rule; the hollow rectangle above is what it looks like to have actually written the loop that rule
  describes, cell by cell.
- **A tabulated DP table is filled by exactly this loop shape.**
  [[01-dp-fundamentals|Part 08, Chapter 1]] and [[03-tabulation|Part 08, Chapter 3]] fill a 2D table
  row by row, left to right, with each cell's value depending on the row and column it sits at — the
  same outer-loop-is-row, inner-loop-is-column structure as every example above, just with
  `dp[i][j] = ...` standing in for `"*"` or `" "`. The habit of asking "what does this cell depend
  on — the row, the column, or both" is the same habit, pointed at a recurrence instead of a
  character.
- **Grid and matrix traversal reuses the boundary check directly.** The
  `i == 0 or i == rows - 1 or j == 0 or j == cols - 1` condition from the hollow rectangle is the
  identical check a grid BFS uses to know it's fallen off the edge, or a matrix routine uses to know
  it's touching the first or last row or column. It isn't an analogy — it's the same three-line
  condition, reused verbatim.

---

## Where the Formula Breaks Down

The single most common bug in this entire family of problems is an off-by-one in the loop bound —
`range(n)` where the shape needed `range(1, n + 1)`, or a formula that's exactly one space or one
star short at the first or last row and correct everywhere else. That bug class doesn't stay
confined to pattern printing: it's the identical failure mode behind a DP tabulation loop that fills
every cell except the last row, or a binary search whose bound is off by one and infinite-loops on a
two-element array. The fix in both places is the same discipline this chapter has been building:
verify the formula against the _smallest_ and _largest_ row explicitly, not just a comfortable
middle row where a small arithmetic error is easy to miss.

Symmetric shapes — diamonds, hourglasses — add a second trap: it's tempting to build them by
literally concatenating two triangle loops (increasing, then decreasing) and trust that the seam in
the middle lines up. It usually does, but only because the two halves were each verified
independently first. Get one half's formula subtly wrong and small `n` still looks plausible — the
shape only visibly breaks once `n` grows past whatever range you eyeballed by hand, which is exactly
how a DP base case that's "close enough" for `n = 1..3` turns out wrong at `n = 8`.

The clearest cautionary example, though, comes directly from the kind of source material this
chapter is drawn from: letter-art patterns that spell out a name in stars, or draw individual
letters like H or B as star shapes. Past a certain point of complexity, some of these stop deriving
a row-to-formula relationship at all and instead become a long chain of hardcoded `if`/`elif`
branches, each one tuned by hand to a single specific row count. The code still runs, but it only
runs correctly for the one size it was written against, and every new special case duplicates logic
that a real formula would have unified. That is the same dead end
[[06-hashing|Part 02, Chapter 6]]'s closing worked example warns about from the opposite direction —
three hardcoded, nearly-identical loops for a 1-letter, 2-letter, and 3-letter case, which only
works for inputs short enough to fit those three branches and falls apart the moment a fourth case
is needed. The lesson transfers cleanly: if the number of special cases in a loop is growing with
every new example instead of shrinking to a formula in the row (and column) index, that's the signal
you've stopped generalizing and started pattern-matching by hand — worth noticing here, in a
throwaway star-pattern script, precisely because the exact same signal means something much more
expensive to miss once it shows up inside a DP recurrence or a graph traversal.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
