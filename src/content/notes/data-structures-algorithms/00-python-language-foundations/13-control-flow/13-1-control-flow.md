---
title: "13 — Control Flow"
description: "Python hands you six different ways to branch or repeat — if/elif, the ternary, match/case, for, while, and the loop's own often-forgotten else clause — and none of them crash when you pick the wrong one, they just quietly hide what the code is actually deciding."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/03-recursion/03-recursion
    kind: related
zettelId: "202607301922-5"
---

# 13 — Control Flow

Every program is, underneath its data structures, a sequence of two decisions repeated over and
over: which branch to take, and whether to keep going. Python's control-flow keywords — `if`,
`match`, `for`, `while`, `break`, `continue`, `else`-on-a-loop — all reduce to those two decisions,
but they aren't interchangeable notation for the same thing. Each one advertises a different shape
of intent: `if`/`elif` says "test these conditions in order," `match` says "the _structure_ of this
value determines the branch," `for` says "I know how many times, or over what, I'm iterating,"
`while` says "I don't know how many times, only when to stop." Using the wrong one still runs — a
`while` can simulate any `for` — but it throws away the information a reader would have used to
understand the code faster than by tracing it. This chapter is about picking the construct that
tells the truth about what the code is deciding, and the handful of places — the loop's `else`
clause chief among them — where Python's own syntax makes that harder than it should be.

---

## Branching: if/elif/else and the Ternary Expression

An `if`/`elif`/`else` chain evaluates its conditions **top to bottom** and commits to the first one
that's true — later conditions are never checked once an earlier one matches, which matters the
moment two conditions could both be true for the same input (grading `score >= 70` before
`score >= 90` would silently misclassify every A). `elif` is not a separate construct from nested
`if`; it's syntactic flattening of `else: if ...`, and reaching for it instead of nesting is almost
always the more readable choice once there are more than two mutually exclusive outcomes — nested
`if` is better reserved for genuinely hierarchical conditions (check membership, and only then check
a spending threshold), not a flat list of alternatives.

The **ternary expression** — `value_if_true if condition else value_if_false` — is `if`/`else`
compressed into something that produces a value rather than executing a statement, which is the tell
for when to reach for it: assignment-shaped decisions ("pick a default," "pick a label") read better
as a ternary; decisions with side effects or more than two branches belong in a real `if` statement.
Ternaries do nest (`"hot" if temp > 30 else ("cold" if temp < 10 else "mild")`), but readability
degrades fast past two levels — at three, a reader has to mentally re-parenthesize the expression to
know which condition governs which branch, which is exactly the parsing work `elif` exists to avoid.
The common, legitimate use is a **default-value guard**:
`value = raw if raw is not None else "default"` reads as one idea, where the equivalent four-line
`if`/`else` block reads as a paragraph about the same idea.

---

## match/case: Structural Pattern Matching (Python 3.10+)

`match`/`case` looks like a `switch` statement borrowed from C-family languages, but it does
meaningfully more: each `case` is a **pattern**, and patterns can destructure the value being
matched — unpack a tuple, bind fields off an object, and constrain both with a **guard** (`if`
clause) — not just compare it for equality. `case 404:` and `case _:` (the wildcard, matching
anything not already matched above it) behave like a `switch`'s value comparison, but
`case ("go", direction):` binds `direction` to the tuple's second element, and
`case Point(x=0, y=y):` binds `y` only when the object's `x` attribute is exactly `0` — the pattern
is simultaneously a type check, a structural check, and a variable binding, one line where
`if`/`elif` needs three statements to express the same.

The deciding question for `match` versus a chain of `if`/`elif` is not "does this have more than two
branches" — it's **does the branch depend on the shape of the value, not just a boolean predicate
about it**. Matching on a plain scalar (`case 404:`) gains readability over `if code == 404:` but
not much else; matching on a tuple's arity and contents, or an object's fields with a guard, is
where `match` earns its keep, because the equivalent `if`/`elif` version needs manual `len()`
checks, manual indexing, and manual attribute access repeated in every branch. `match` has no
compiler- enforced exhaustiveness the way Rust's or Swift's does — forgetting the wildcard `case _:`
simply falls through with no branch taken and no error, which is worth treating as a deliberate
choice, not an oversight, every time a `match` block is written without one.

---

## Worked Example: A Command Dispatcher with match/case

**Problem:** route two different shapes of input — a tuple-based text command and a small movement
event — through a single dispatcher, using structure rather than a chain of type and length checks.

```python
from dataclasses import dataclass


@dataclass
class Move:
    dx: int
    dy: int


def handle_command(command: tuple | Move) -> str:
    match command:
        case ("quit",):
            return "exiting"
        case ("go", direction) if direction in {"north", "south", "east", "west"}:
            return f"heading {direction}"
        case ("pick", item, int(count)) if count > 0:
            return f"picked {count} of {item}"
        case Move(dx=0, dy=0):
            return "holding position"
        case Move(dx=0, dy=dy):
            return f"moving vertically by {dy}"
        case Move(dx=dx, dy=0):
            return f"moving horizontally by {dx}"
        case Move(dx=dx, dy=dy) if dx == dy:
            return "moving diagonally"
        case Move(dx=dx, dy=dy):
            return f"moving by ({dx}, {dy})"
        case _:
            return "unrecognized command"


handle_command(("go", "north"))        # "heading north"
handle_command(("pick", "apple", 3))   # "picked 3 of apple"
handle_command(Move(0, 5))             # "moving vertically by 5"
handle_command(Move(3, 3))             # "moving diagonally"
```

Every `case` here does at least two of "check the type," "check the shape," and "bind a name" at
once — `case ("pick", item, int(count)) if count > 0:` confirms the tuple has exactly three
elements, confirms the third is an `int`, binds both `item` and `count`, and applies a guard, all in
one line. The `if`/`elif` equivalent needs an explicit `isinstance` check, an explicit `len()`
check, explicit indexing for every field, and the guard bolted on last — same logic, structural
assumptions scattered across the branch instead of stated in the pattern itself. That difference —
pattern states the shape it expects; `if`/`elif` merely hopes the shape holds — is the entire case
for `match` here.

---

## Iteration: for, while, and the Tools That Replace Manual Indexing

`for` iterates **any object that implements the iterator protocol** — a list, a string, a `dict`'s
keys, a file's lines, a generator — pulling one item at a time until the iterator is exhausted, with
no index variable involved unless you introduce one. `while` is **condition-driven**: it re-checks a
boolean expression before every iteration and stops the instant it's false, which makes it the right
tool exactly when the iteration count isn't known in advance — reading until a sentinel value,
polling until a condition changes, or simulating the do-while idiom Python doesn't have
(`while True:` with a `break` at the end of the body, so the body always runs at least once).

`range(stop)`, `range(start, stop)`, and `range(start, stop, step)` generate the index sequence a
manual counter would otherwise require, including negative steps for counting down — but reaching
for `range(len(sequence))` just to index into `sequence[i]` is almost always the wrong move once
`enumerate()` and `zip()` exist. `enumerate(iterable, start=1)` hands back `(index, value)` pairs
without a counter to increment and forget to increment correctly; `zip(a, b)` walks sequences in
lockstep, stopping at the shorter one, replacing `for i in range(len(a)): a[i], b[i]` with a single
clean unpacking. A `dict`'s `.items()` extends the same idea to key/value pairs directly.

---

## Worked Example: Parallel Iteration Without an Index Variable

**Problem:** given parallel lists of names and scores, produce a ranked leaderboard, highest score
first.

```python
def rank_report(names: list[str], scores: list[int]) -> list[str]:
    paired = sorted(zip(scores, names), reverse=True)
    lines: list[str] = []
    for rank, (score, name) in enumerate(paired, start=1):
        lines.append(f"{rank}. {name} ({score})")
    return lines


rank_report(["Alice", "Bob", "Carol"], [88, 94, 76])
# ["1. Bob (94)", "2. Alice (88)", "3. Carol (76)"]
```

`zip(scores, names)` does the pairing a manual `range(len(names))` loop would otherwise need to do
by indexing into both lists on every iteration; `enumerate(..., start=1)` then supplies the 1-based
rank without a separate counter variable to initialize, increment, and keep in sync with the loop.
If the input arrived already paired — a `dict[str, int]` mapping name to score — `.items()` would
replace `zip()` outright, since the pairing `zip()` exists to construct would already be the
mapping's native shape. The rule both cases share: reach for `zip()` when separate sequences need
pairing, `.items()` when the pairing already exists as a mapping, and `enumerate()` whenever
position matters — never a hand-maintained index variable for either job.

---

## break, continue, pass, and the Loop's else Clause

`break` exits the nearest enclosing loop immediately, skipping any remaining iterations entirely.
`continue` skips only the rest of the _current_ iteration and proceeds to the next one — the loop
keeps running, it just doesn't finish this pass through the body. `pass` does neither: it's a
syntactic no-op, needed only because Python's grammar requires a non-empty block after a colon —
`if condition: pass` marks "intentionally nothing happens here yet" without skipping an iteration or
exiting anything. Confusing `pass` with `continue` is a real bug source: `pass` falls through to
whatever follows it in the same block, while `continue` jumps straight back to the loop's condition
check.

Every `for` and `while` loop in Python can carry an **`else` clause**, and its trigger condition
surprises almost everyone the first time they encounter it: **the `else` block runs if and only if
the loop finished without hitting a `break`** — including the trivial case of a loop that never
executes its body at all. It has nothing to do with the `if`/`else` `else` and does not mean "after
the loop" — a loop with no `break` in it at all will always run its `else` block, every time, which
is the detail that makes the clause read as pointless right up until a `break` is actually there for
it to be skipped by. The one pattern where it earns its keep is **search-and-report**: loop looking
for something, `break` the moment it's found, and let `else` hold the "never found it" branch — one
`found` flag variable's worth of bookkeeping, folded directly into the loop's own syntax.

---

## Worked Example: Search-and-Report with for...else

**Problem:** determine whether `n` is prime by trial division, using the loop's own `else` clause to
report "no factor was found" instead of a separate boolean flag.

```python
def is_prime(n: int) -> bool:
    if n < 2:
        return False
    for divisor in range(2, n):
        if n % divisor == 0:
            break               # a factor exists — n is composite
    else:
        return True             # loop completed with no break: no factor exists
    return False                # only reached by falling out via break
```

Without `else`, the same logic needs an explicit sentinel: initialize `found_factor = False` before
the loop, set it to `True` next to the `break`, and check it after the loop ends — three extra lines
doing exactly what the `else` clause already expresses in its trigger condition. The trade is
legibility for the reader versus familiarity: an engineer who hasn't seen loop-`else` before will
misread it as "runs after the loop, always" on first encounter — worth using deliberately, and worth
a comment the first time it appears in a codebase that doesn't already use it.

---

## Nested Loops, Early Exit, and the Flag-Variable Smell

A loop nested inside another loop multiplies its cost — an outer loop of length `m` containing an
inner loop of length `n` does `m · n` units of work, not `m + n` — the same rule covered directly in
[[02-asymptotic-analysis|Part 01, Chapter 2]]'s treatment of nested structure, just seen here as the
loop you actually typed rather than an abstract bound.

The sharper practical issue is **early exit**. Python has no labeled `break` or `continue` — unlike
Java or Go, `break` only ever escapes the _nearest_ enclosing loop, so exiting two levels of nesting
at once needs either a flag variable checked after the inner loop (`if found: break`, repeated at
each level) or a restructure that avoids the nesting being escaped in the first place. The
flag-variable version works, but it's a smell worth noticing: the moment a search over nested
structure needs to report a single yes/no answer, extracting it into its own function and using
`return` instead of `break` collapses "break twice, checking a flag each time" into "return once,"
because `return` — unlike `break` — exits every level of nesting in one step, with nothing left to
check afterward. Recognizing that a nested-loop scan is quietly doing brute-force search is also the
first move [[05-algorithm-design-principles|Part 01, Chapter 5]] teaches before reaching for a
cleverer loop at all — sometimes the fix isn't a better-written nested loop, it's a different
paradigm entirely.

```python
def find_in_matrix(matrix: list[list[int]], target: int) -> bool:
    for row in matrix:
        for cell in row:
            if cell == target:
                return True     # exits both loops in one step — no flag, no second break
    return False


# Equivalent, expressed as one flattened generator instead of two nested loops:
def find_in_matrix_flat(matrix: list[list[int]], target: int) -> bool:
    return any(cell == target for row in matrix for cell in row)
```

Both versions are still O(rows · cols) in the worst case — extracting the function changes how the
early exit is expressed, not the work the loop does when the target isn't present at all.

---

## Trade-offs and Gotchas to Carry Forward

Every construct in this chapter has a genuine failure mode that doesn't raise an exception — it just
produces code that's technically correct and quietly harder to trust:

- **The loop's `else` clause is a readability trade, not a free win.** It replaces a flag variable
  cleanly for a reader who already knows the rule, and reads as backwards for one who doesn't —
  reach for it in genuine search-and-report code, not as a reflex replacement for every flag
  variable.
- **Nested ternaries have a two-level ceiling.** Past that, `if`/`elif` costs one extra keyword per
  branch and buys back reading top to bottom instead of re-parenthesizing in your head.
- **`match` has no exhaustiveness check.** A block missing a wildcard `case _:` simply matches
  nothing on an unhandled shape — treat every `match` without one as intentionally partial, not an
  oversight.
- **Python's `break` only escapes one loop.** A flag checked at every nesting level is the honest
  fallback; extracting the search into its own function and using `return` is usually cleaner, since
  `return` exits every level at once.
- **`pass` is not `continue`.** `pass` does nothing and falls through; `continue` jumps back to
  re-check the loop's condition. Mixing them up either runs code meant to be skipped, or skips code
  meant to run.
- **A `while` loop built around a manual counter is often recursion wearing a different hat** — the
  "loop until a base condition, updating state each pass" shape. Whether the iterative or recursive
  form is clearer, and what the recursive form costs in stack frames, is
  [[03-recursion|Part 01, Chapter 3]]'s subject, immediately next to this one for a reason.

None of these constructs is wrong to reach for — each is the right tool for a specific shape of
decision. The bug isn't in the syntax; it's in picking whatever happens to run correctly today over
the one that tells the next reader, including a future you, what the code actually decided and why.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
