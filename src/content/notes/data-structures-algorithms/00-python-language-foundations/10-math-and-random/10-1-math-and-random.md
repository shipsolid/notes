---
title: "10 — Math & Random"
description: "Python's math module trades general-purpose float arithmetic for a handful of exact, integer-safe helpers, while random trades true unpredictability for a deterministic, seedable stream that only looks random. This chapter is what each module actually guarantees, where those guarantees quietly break, and the worked examples — a perfect-square check, reservoir sampling, Fisher–Yates — that lean on them."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/04-mathematical-foundations/04-mathematical-foundations
    kind: related
  - slug: data-structures-algorithms/13-advanced-algorithms/09-randomized-algorithms/09-randomized-algorithms
    kind: related
zettelId: "202607301922-2"
---

# 10 — Math & Random

Two stdlib modules, `math` and `random`, look like an unrelated grab-bag of utilities — until you
notice they sit on opposite sides of the same fault line. `math` exists at the boundary where
Python's arbitrary-precision integers meet IEEE-754 floats, and it hands you a small set of _exact_
tools (`isqrt`, `factorial`, `gcd`) specifically so correctness-sensitive code never has to trust
float rounding. `random` sits on a different fault line entirely: it manufactures the _appearance_
of unpredictability from a fully deterministic algorithm, which is exactly what makes it seedable
and testable — and exactly what makes it the wrong tool the moment "random" needs to mean
"unguessable." Neither module is complicated. Both have one or two sharp edges that show up
constantly in interview code and in CI runs that fail for no reason anyone can reproduce.

---

## The `math` Module: Where Floats Give Way to Exact Integers

Most of `math` is a thin wrapper over C's floating-point library — `sqrt`, `log`, `log2`, `log10`,
`sin`, `cos`, `degrees`, `radians` all take and return `float`, inheriting float's usual rounding
behavior. That's fine for geometry or physics-flavored problems, but it's the wrong choice the
moment a question is really about integers: "is `n` a perfect square," "what's `n!` exactly,"
"reduce this fraction." For that class of question, `math` ships integer-native counterparts that
never round: `isqrt` (integer square root), `factorial`, `gcd`, `lcm`, `comb`, and `perm` all take
and return `int`, computed with exact arbitrary-precision arithmetic the same way the rest of
Python's `int` type works.

`math.inf` is worth calling out on its own — it's a `float`, not a sentinel type, but it compares
correctly against every real number, which makes it the standard way to initialize a "no answer
found yet" accumulator:

```python
best_cost = math.inf
for edge_cost in candidate_costs:
    best_cost = min(best_cost, edge_cost)
```

Any real cost is smaller than `math.inf`, so the first comparison always replaces it — no special-
cased "is this the first iteration" branch required.

### Worked Example: Perfect Square Check

**Problem:** given a non-negative integer `n`, determine whether it is a perfect square.

The obvious approach — `math.sqrt(n)`, round, square, compare — works for small `n` but is exactly
the trap the previous section warns about: `float` has a 53-bit mantissa, so once `n` is large
enough (roughly `2**53` and up), `math.sqrt(n)` can no longer represent the true root exactly, and
the round-trip silently gives a wrong answer for some inputs. `math.isqrt` sidesteps the whole
problem by computing the integer square root directly, with no float ever entering the calculation:

```python
def is_perfect_square(n: int) -> bool:
    if n < 0:
        return False
    root = math.isqrt(n)
    return root * root == n
```

**Complexity:** O(log n) time (Newton's method under the hood, on arbitrary-precision integers),
O(1) space — and, more importantly than the complexity, _exact_ for every non-negative `int`
regardless of size, which `int(math.sqrt(n)) ** 2 == n` is not.

---

## Number Theory Built In: `gcd`, `lcm`, and Modular Exponentiation

`math.gcd(a, b)` and `math.lcm(a, b)` are the Euclidean algorithm, `O(log(min(a, b)))`, already in
the standard library — reach for them directly rather than hand-rolling the recursion. Two shapes
they show up in constantly: reducing a fraction to lowest terms after every intermediate
addition/subtraction (so numerator and denominator don't grow without bound), and finding when two
periodic events next coincide (every `lcm(a, b)` steps). [[04-mathematical-foundations]] (Part 01,
Chapter 4) works through both of those derivations and their interview tie-ins in depth — this
chapter is the "here's the function," that chapter is the "here's why it's the right function."

The three-argument built-in `pow(base, exp, mod)` deserves a callout even though it isn't
technically part of the `math` module, because it's the modular-exponentiation trick the source
material flags as a quiet performance win: `pow(base, exp, mod)` computes `(base ** exp) % mod` in
`O(log exp)` multiplications, with every intermediate value already reduced mod `mod` before it
grows — never materializing the astronomically large `base ** exp` integer that the naive version
has to build first.

```python
def modexp_demo(base: int, exp: int, mod: int) -> tuple[int, int]:
    """Same result, two ways — correctness identical, cost very much not."""
    naive = (base ** exp) % mod
    fast = pow(base, exp, mod)
    assert naive == fast
    return naive, fast
```

**Complexity:** the naive path costs `O(exp)` multiplications on integers that grow to
`exp * log2(base)` bits before the final `% mod` ever runs; the three-argument `pow()` is
`O(log exp)` multiplications on values that never exceed `mod`. [[04-mathematical-foundations]]
derives the doubling identity this built-in implements in C — `mod_pow` there and
`pow(base, exp, mod)` here are the same algorithm.

---

## The `random` Module: A Deterministic Machine Pretending to Be Random

`random` is built on the Mersenne Twister — a pseudo-random number generator (PRNG) that is fully
deterministic given its internal state, and unseeded by default it draws that initial state from OS
entropy (`os.urandom`), which is why two runs of the same program normally produce different
sequences. Call `random.seed(n)` and that determinism becomes visible: the entire sequence of
subsequent calls becomes reproducible, which is exactly what a test fixture needs and exactly what a
security token must never have.

The functions split cleanly by what they draw and how:

- `random.random()` — a `float` in `[0.0, 1.0)`; nearly everything else in the module is built from
  this.
- `random.uniform(a, b)` — a `float` in `[a, b]`.
- `random.randint(a, b)` — an `int` in `[a, b]`, both ends inclusive.
- `random.randrange(start, stop, step)` — like Python's `range`: `stop` is exclusive, and `step`
  lets you draw only evens, only multiples of a stride, and so on.
- `random.choice(seq)` — one element, uniformly, from a non-empty sequence.
- `random.sample(population, k)` — `k` **unique** elements, drawn without replacement; raises
  `ValueError` if `k` exceeds the population size.
- `random.choices(population, k=k, weights=...)` — `k` elements **with** replacement (duplicates
  allowed), optionally weighted.
- `random.shuffle(seq)` — permutes a mutable sequence in place; returns `None`.

The `sample` vs. `choices` distinction is the one that bites most often: reach for `sample` when the
question is "give me a random subset" and duplicates would be wrong (dealing cards, picking distinct
winners), and `choices` when repeats are fine or even expected (simulating dice rolls, weighted
random selection with replacement).

---

## Worked Example: Reservoir Sampling

**Problem:** given a stream of unknown, possibly unbounded length, pick one element uniformly at
random using O(1) extra space and a single pass.

`random.sample()` can't do this — it needs a sized sequence up front, and a live stream (or a file
too large to load into memory) doesn't offer one. Reservoir sampling solves it by keeping exactly
one candidate at a time and replacing it with shrinking probability as the stream grows:

```python
from typing import Iterable

def reservoir_sample(stream: Iterable[int]) -> int | None:
    """Pick one element uniformly at random from a stream of unknown length."""
    chosen: int | None = None
    for i, item in enumerate(stream, start=1):
        if random.randint(1, i) == 1:      # probability 1/i of replacing the pick
            chosen = item
    return chosen
```

**Complexity:** O(n) time, O(1) space. The correctness argument is an induction on `i`: after
processing `i` items, each one has been kept with probability `1/i` — the `i`-th item is chosen with
probability `1/i` directly, and each earlier item survives only if it was chosen before _and_ every
subsequent draw skipped replacing it, which multiplies out to the same `1/i`.

---

## Worked Example: Fisher–Yates Shuffle

**Problem:** produce a uniformly random permutation of a list, in place.

`random.shuffle(arr)` already does exactly this, and in production code that's what you call — this
worked example exists to make the algorithm behind it explicit, because "shuffle a list" is itself
an occasional interview question, and because `[[09-randomized-algorithms]]` (Part 13, Chapter 9)
leans on the same "process once, make one random decision per position" shape.

```python
import random

def fisher_yates_shuffle(arr: list[int]) -> None:
    """In-place, uniform-random permutation — what random.shuffle does internally."""
    for i in range(len(arr) - 1, 0, -1):
        j = random.randint(0, i)
        arr[i], arr[j] = arr[j], arr[i]
```

**Complexity:** O(n) time, O(1) extra space. Each position `i`, walking from the end down to index
`1`, swaps with a uniformly chosen index in `[0, i]` — every permutation of the `n` elements is
reachable with equal probability, which a naive "swap every element with any random index" approach
does _not_ guarantee (it over- and under-weights certain permutations, a classic and easy-to-miss
correctness bug).

---

## Pitfalls: Floating-Point Precision and Non-Deterministic Tests

**`math`'s pitfall is precision, and it's silent.** Never compare two floats with `==` —
`0.1 + 0.2 == 0.3` is `False` in Python, for the same IEEE-754 reason in every language that uses
it. Use `math.isclose(a, b, rel_tol=1e-9)` instead, and pick the tolerance deliberately rather than
accepting the default when values are very large or very small. The same caution applies to `sqrt`,
`log`, and every other float-returning function in the module: they're approximations, accurate to
the limits of a 53-bit mantissa, and the moment a problem needs an _exact_ integer answer, reach for
`isqrt`, `factorial`, `gcd`, `comb`, or `perm` instead of a float-based shortcut — the
perfect-square example above is the general pattern, not a special case.

**`random`'s pitfall is reproducibility, and it costs you in CI, not in production.** A test that
calls `random.shuffle` or `random.sample` without first calling `random.seed(n)` will pass locally a
hundred times and then fail once in CI on an input ordering nobody anticipated — the textbook
definition of a flaky test. The fix is to seed explicitly at the top of the test (or use a dedicated
`random.Random(seed)` instance instead of the shared global state, so seeding one test can't leak
into another running in the same process) — but seed for _reproducibility_, not for a false sense of
security: the exact sequence a given seed produces is an implementation detail of CPython's Mersenne
Twister and isn't guaranteed to be identical across Python versions, so assert on properties of the
output (correct length, all elements present, valid range) rather than a hardcoded exact sequence.

The sharper version of the same pitfall: `random` is **not cryptographically secure**. Its Mersenne
Twister state can be reconstructed from a few thousand consecutive outputs, which means anything
that needs to be unguessable — session tokens, password reset codes, API keys — belongs in the
`secrets` module (`secrets.token_hex`, `secrets.choice`), not `random`. "It's in the standard
library and it's called `random`" is not the same guarantee as "safe to use where an adversary is
watching the output."

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
