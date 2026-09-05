---
title: "9 — Digit DP"
description: "Counting integers in a range by their digit sum, forbidden digits, or repeats without enumerating them one at a time — building N's digits left to right under a tight/bound flag that is the one genuinely new state dimension this technique adds, worked top-down with a hand trace and a complexity argument for why the cost depends on N's digit count, not N itself."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-69"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/02-memoization/02-memoization
    kind: depends_on
---

# 9 — Digit DP

Every problem this Part has solved so far treats the input as an array, a string, or a set of items
to slice into a decided prefix and an undecided remainder. Digit DP treats a _number_ as the input
and slices it the same way: into the digits already placed and the digits not yet decided. What
earns this its own chapter, rather than three paragraphs tacked onto [[02-memoization|Chapter 2]],
is a genuinely new piece of state the earlier chapters never needed — a flag tracking whether the
digits placed so far still match some bound exactly, or have already broken free of it. Everything
else here — the recursive shape, the cache, the base case — is top-down memoization exactly as
[[02-memoization|Chapter 2]] already built it. This chapter's job is explaining that one new flag
and the problem shape it unlocks.

---

## The Problem Shape: Cheap to Check, Expensive to Enumerate

Digit DP answers questions of this form: **how many integers in `[0, N]` satisfy some property of
their digits?**

- How many integers ≤ N have digits summing to exactly some target?
- How many integers ≤ N contain no repeated digit?
- How many integers ≤ N never contain the digit `4`?
- How many integers ≤ N read the same forwards and backwards?

Every one of these shares the same signature: checking whether **one** specific number has the
property is cheap — split it into digits, walk them once, `O(digits)` work. The problem is never
"checking is hard," it's that `N` itself can be enormous. Interview and contest constraints
routinely allow `N` up to `10^18` — a 19-digit number — and looping
`for x in range(N + 1): check(x)` at that scale is `10^18` iterations, each doing real work. That's
not a slow algorithm the way an `O(n^2)` sort is slow next to an `O(n log n)` one — it's
categorically infeasible, the same gap between "correct" and "runs"
[[01-dp-fundamentals|Part 08, Chapter 1]] has been closing all Part long.

The size of `N` is the tell. Nothing about digit sum, repeated digits, or forbidden digits is
inherently hard to compute — the difficulty is entirely in the space being searched, not the
property being tested. `10^18` is unmanageable as a count of integers and utterly trivial as a
string — 19 characters. Digit DP is what happens when a technique commits to working over the
string, not the count.

---

## The Core Idea: Build the Number, Don't Enumerate It

Instead of generating every integer from 0 to N and testing each one, digit DP builds numbers **one
digit position at a time**, left to right — most significant digit first — deciding at each position
which digit to place and recursing into the remaining positions. By the end, one specific number has
been fully constructed, and whatever running state was tracked along the way (a digit sum, a set of
digits seen, a palindrome check) determines whether it counts.

That description alone doesn't yet explain why this beats brute force — building one number digit by
digit is still building one number. The saving comes from memoization catching states that recur
across many different numbers, exactly the way [[02-memoization|Chapter 2]] caught `fib(2)`
recurring across many different call paths. Two different partial numbers that placed different
digits so far can still land on the _same_ combination of "position reached, digit sum so far, bound
status" — and once that combination is solved once, it never needs solving again, regardless of
which specific digits produced it.

But there's a catch straight recursion-plus-cache doesn't handle on its own: **not every digit is
legal at every position.** If N is 347, the number being built is not free to place a 9 in the
hundreds place — doing so produces a number starting 9xx, already bigger than 347 no matter what
fills the remaining positions. The recursion has to know, at every position, how far it's allowed to
go. That's what the tight flag tracks.

### The Tight Flag, Precisely

At any point while building a number digit by digit, exactly one of two situations holds:

- **Tight (still bound):** every digit placed so far is _identical_ to N's digit in that position —
  the number under construction is currently a literal prefix of N. The _next_ digit placed can
  therefore be **at most** N's digit here; going higher would make the number exceed N's regardless
  of what fills the remaining positions.
- **Free (already below):** at some earlier position, a digit strictly smaller than N's digit there
  was placed. The number is now guaranteed smaller than N no matter what follows, because a numeric
  comparison between two same-length numbers is decided by the first position where they differ, and
  that position already resolved in this number's favor. Every remaining position is unconstrained —
  any digit 0–9 is legal.

That's the entire rule: from tight, placing a digit equal to N's digit here keeps the recursion
tight one level deeper; placing anything smaller flips it to free for every position after; placing
anything larger is illegal and never generated. From free, every digit is legal and every recursive
call stays free — a one-way, absorbing state, since "already strictly less than" can't un-happen
partway through a number.

This is the one genuinely new idea digit DP adds to the vocabulary
[[01-dp-fundamentals|Part 08, Chapter 1]] built up — not a new kind of transition or base case, but
a boolean dimension of state whose entire job is enforcing "don't exceed N" without ever explicitly
comparing the finished number to N at the end. The bound is enforced locally, one digit at a time,
rather than checked globally after the fact.

---

## The State: Position, Tight, and Whatever the Problem Needs

The general shape of a digit DP state is:

```
dp[position][tight][...problem-specific extra state...]
```

`position` is how far into N's digits the recursion has gotten — the same "how much of the input has
been consumed" dimension every DP chapter in this Part has used. `tight` is the new boolean this
chapter introduced. Everything else is exactly what the specific problem needs tracked, and it
varies by property being counted:

- **Digit sum equals a target** needs the running digit sum so far.
- **No repeated digit** needs which digits have been used — a small bitmask over 10 digits, the same
  set-as-integer state [[10-bitmask-dp|Chapter 10]] builds out in full a few chapters ahead.
- **No digit `4` anywhere** needs no extra state — the constraint is enforced directly on each
  candidate digit, never carried forward.
- **Palindrome** needs the digits placed so far, since a palindrome check can't be verified from a
  single running scalar the way a sum can.

Every one of these is the same three-question checklist from
[[01-dp-fundamentals|Part 08, Chapter 1]] applied to a new kind of subproblem: state, transition,
base case. Digit DP just fixes two of the state's dimensions in advance — `position` and `tight` are
always there — and leaves the rest to be derived from the property being counted, the same
derivation [[01-dp-fundamentals|Part 08, Chapter 1]]'s "at most K coins" example walked through for
an ordinary DP state gaining a dimension.

---

## Worked Example: Count Integers ≤ N With a Given Digit Sum

**Problem:** given `N` and a target digit sum `target`, count how many integers in `[0, N]` have
decimal digits summing to exactly `target`.

**State:** `solve(position, tight, digit_sum)` — the number of ways to complete the remaining digits
given `position` digits already placed, still bound to N's prefix if `tight`, with `digit_sum` the
sum of digits placed so far.

**Base case:** once `position` reaches the length of N, the number is fully determined; it counts
iff `digit_sum` equals `target`.

**Transition:** at each position, legal digits run from `0` up to N's digit there if `tight`, or up
to `9` if free. For each legal digit `d`, recurse one position deeper with the updated digit sum,
propagating `tight` forward as "still tight, and `d` equals the limit."

```python
import functools


def count_with_digit_sum(n: int, target: int) -> int:
    """Count integers in [0, n] whose decimal digits sum to exactly `target`."""
    digits = list(map(int, str(n)))
    length = len(digits)

    @functools.lru_cache(maxsize=None)
    def solve(position: int, tight: bool, digit_sum: int) -> int:
        if digit_sum > target:            # prune -- digits only add, sum never shrinks
            return 0
        if position == length:            # every digit placed -- does this number count?
            return 1 if digit_sum == target else 0

        limit = digits[position] if tight else 9
        total = 0
        for d in range(0, limit + 1):
            still_tight = tight and (d == limit)
            total += solve(position + 1, still_tight, digit_sum + d)
        return total

    return solve(0, True, 0)
```

`digits`, `length`, and `target` are captured by closure rather than threaded through as extra
arguments, which keeps the cache key to exactly the three dimensions the state actually needs —
`(position, tight, digit_sum)` — nothing more. That also means the cache must be built fresh inside
`count_with_digit_sum` on every call: `digits` and `target` differ from one call to the next, so a
cache shared across calls would return stale answers for a state that meant something different last
time — the same mutable-shared-cache hazard [[02-memoization|Chapter 2]] flagged for a
default-argument cache leaking across unrelated calls, now in its digit-DP form: scope the cache to
the call that needs it.

### A Hand Trace: N = 23, target = 4

`digits = [2, 3]`, `length = 2`. The call tree, indented by position, with only the surviving
branches shown in full:

```
solve(0, tight=True, sum=0)            limit = digits[0] = 2
  d=0 -> solve(1, tight=False, sum=0)    limit = 9, free to place any digit
  d=1 -> solve(1, tight=False, sum=1)
  d=2 -> solve(1, tight=True,  sum=2)    limit = digits[1] = 3
           d=0 -> solve(2, tight=False, sum=2) = 0   (2 != 4)
           d=1 -> solve(2, tight=False, sum=3) = 0   (3 != 4)
           d=2 -> solve(2, tight=False, sum=4) = 1   (4 == 4)
           d=3 -> solve(2, tight=True,  sum=5) = 0   (5 != 4)
         solve(1, tight=True, sum=2) = 0+0+1+0 = 1
```

`solve(1, False, 0)` and `solve(1, False, 1)` are each free to place any digit 0–9 in the last
position, so each is really asking "how many single digits `d` make `sum + d == 4`?" — exactly one
answer apiece: `d = 4` for the first, `d = 3` for the second. Both resolve to `1`.

```
solve(0, True, 0) = solve(1, False, 0) + solve(1, False, 1) + solve(1, True, 2)
                  = 1                  + 1                  + 1
                  = 3
```

Checked against direct enumeration of `0..23`: digit sums equal to 4 occur at `4`, `13` (`1+3=4`),
and `22` (`2+2=4`) — three numbers, matching `count_with_digit_sum(23, 4) == 3` exactly.

---

## Complexity: Independent of N's Magnitude

**Time:** state count is `digits × 2 × extra_state_size` — digit positions, times the tight flag's
two values, times however many values the problem-specific dimension can take. For digit sum, that
dimension is the running sum, ranging from `0` to `9 × digits` (the largest sum `digits` digits can
produce), so `extra_state_size = 9 × digits + 1`. Each state costs at most 10 units of work — one
per candidate digit. Total time: `O(digits × 2 × extra_state_size × 10)`, which for digit sum
tightens to `O(digits²)` since `extra_state_size` itself scales with `digits`; problems whose extra
state is a small constant instead — "no digit 4," which needs none at all — stay at `O(digits)`.

Made numeric rather than asserted, the way [[01-dp-fundamentals|Part 08, Chapter 1]] insisted on
counting Fibonacci's calls instead of trusting the blowup by eye:

| digits in N | positions | tight values | digit-sum values (`0` to `9×digits`) | states (`positions × 2 × sums`) | N up to |
| ----------- | --------- | ------------ | ------------------------------------ | ------------------------------- | ------- |
| 2           | 2         | 2            | 19                                   | 76                              | 99      |
| 5           | 5         | 2            | 46                                   | 460                             | 99,999  |
| 10          | 10        | 2            | 91                                   | 1,820                           | ~10^10  |
| 19          | 19        | 2            | 172                                  | 6,536                           | ~10^18  |

State count grows **linearly** in the number of digits while the range of numbers it covers grows
**exponentially** — the same shape of gap Chapter 1 found between `fib`'s `n + 1` distinct states
and its `2^n` naive call count, pointed the other way here: it's `N` itself that would explode under
brute force, while the digit count stays small. At `N = 10^18`, digit DP visits at most 6,536
states, comfortably under 100,000 total operations, to answer a question brute-force enumeration
would need a quintillion iterations for. **Whether N is 23 or 999,999,999,999,999,999, the
digit-count-bounded state space is what digit DP pays for — never N.**

**Space:** O(states) for the cache, plus O(digits) for the recursion stack — `digits` tops out
around 19 or 20 for any range this technique gets used on, nowhere near
[[02-memoization|Chapter 2]]'s `fib(1000)` recursion-depth ceiling. Digit DP's recursion depth is
never a practical concern.

### From "≤ N" to a Range [L, R]

Real problems usually ask for a count over `[L, R]`, not `[0, N]`. That reduces to two calls of the
`[0, N]` version and one subtraction — the same prefix-difference move used throughout this book
whenever a range query is built from a running-total query:
`count(L, R) = count(0, R) - count(0, L - 1)`. `count_with_digit_sum` is called twice, once against
`R` and once against `L - 1`; the technique itself only ever needs to answer "how many, up to this
one bound."

---

## Recognizing Digit DP

The signal is a specific phrasing, not a specific property: **"count integers in a range whose
digits satisfy X,"** where checking `X` against one number is easy and the range is too large to
enumerate. Digit sum, forbidden digits, no repeated digits, palindromic digits, digit product,
digits in non-decreasing order — all decompose naturally into "decide one digit, carry forward
whatever running fact `X` needs, move to the next position," each a different choice of extra state
on top of the same `position` / `tight` skeleton this chapter built.

The check that rules digit DP _out_ is whether the property can be verified incrementally, one digit
at a time, from a bounded amount of running state. **"Is the number prime"** is the clean
counterexample: primality is a global fact about the number's numeric value — divisible by anything
between 2 and its square root — with no way to track "primeness so far" as a small running quantity
the way a digit sum accumulates. Counting primes up to `N` is solved with a sieve, not digit DP,
precisely because the property doesn't decompose digit-by-digit. That's the test for any new "count
numbers with property X" prompt: can `X` be checked incrementally, carrying forward only a small
amount of state? Yes, and the `position` / `tight` skeleton is the entire remaining design problem.
No, and digit DP was never the right tool to reach for.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
