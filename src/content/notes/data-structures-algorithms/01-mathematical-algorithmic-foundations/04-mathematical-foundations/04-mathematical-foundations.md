---
title: "4 — Mathematical Foundations"
description: "Combinatorics, modular arithmetic, GCD/LCM, and prime sieves — the discrete-math toolkit that counting, DP, and number-theory interview problems quietly depend on."
tags: ["data-structures-algorithms","foundations","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-4"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
---

# 4 — Mathematical Foundations

"DSA" reads like a programming skill, but a surprising fraction of it is discrete math wearing a
code editor. The moment a problem says "how many ways," "return the answer mod," or "reduce this
fraction," you've left algorithm design and entered combinatorics, modular arithmetic, and number
theory — and no amount of clean Python saves you if the underlying math is wrong. This chapter is
the toolkit: five tools that show up constantly, each with a formula you should be able to derive
under pressure, not just recall.

---

## Combinatorics: Counting Without Enumerating

Every "how many ways to..." problem is asking you to count a set without listing its members, and
almost all of them reduce to one question: **does order matter?**

- **Permutations** — order matters. Arranging `r` items chosen from `n`, no repeats:
  `P(n, r) = n! / (n - r)!`
- **Combinations** — order doesn't matter. Selecting `r` items from `n`, no repeats:
  `C(n, r) = n! / (r! · (n - r)!)`

```python
from math import factorial, perm, comb

def permutations(n: int, r: int) -> int:
    """Ordered arrangements of r items chosen from n, no repeats."""
    return factorial(n) // factorial(n - r)

def combinations(n: int, r: int) -> int:
    """Unordered selections of r items chosen from n, no repeats."""
    return factorial(n) // (factorial(r) * factorial(n - r))

perm(5, 2)  # 20 — same as permutations(5, 2); Python 3.8+ ships both natively
comb(5, 2)  # 10 — same as combinations(5, 2)
```

The "no repeats" clause matters — plenty of problems repeat, and the formulas change shape, not
spirit:

```python
def permutations_with_repetition(n: int, r: int) -> int:
    """Each of r positions can independently be any of n symbols."""
    return n ** r

def combinations_with_repetition(n: int, r: int) -> int:
    """Stars and bars: multisets of size r drawn from n categories."""
    return comb(n + r - 1, r)
```

**Interview tie-in — Unique Paths (LC 62).** A robot on an `m × n` grid can only move right or down;
count the distinct paths to the bottom-right. The DP solution is a correct `O(m·n)` table, but the
combinatorial read is faster to state and to code: every path is a sequence of `(m - 1)` down-moves
and `(n - 1)` right-moves in some order, so you're choosing which slots in that sequence are "down."

```python
def unique_paths(m: int, n: int) -> int:
    return comb(m + n - 2, m - 1)
```

The same "does order matter" lens explains why subset-enumeration problems (Subsets, Combination
Sum, Letter Case Permutation) always total `2ⁿ`: summing `C(n, k)` for every `k` from `0` to `n` —
one term per subset size — is the binomial theorem's `2ⁿ` identity, not a coincidence.

---

## Modular Arithmetic

"Return the answer mod `10^9 + 7`" shows up because the true count is often astronomically large —
permutation counts, Catalan numbers, DP counts over big `n` — and the interviewer wants proof you
can carry a computation through without the exact value ever existing in memory.

**The Python-specific nuance:** Python ints are arbitrary-precision — you'll never overflow, no
wraparound like a fixed-width `int64` in C++/Java rolling over past `9.2 × 10^18`. That does _not_
make the `mod` optional, for two reasons:

1. **It's the contract, not a crash guard.** The expected output is the modded value, matching what
   a C++/Java submission produces. Skip it in Python and you compute the right _exact_ number but
   fail every large test case — you returned the wrong thing, nothing broke.
2. **Bignum arithmetic isn't free.** Multiplying two `b`-bit integers costs more than `O(1)`,
   scaling with digit count. An unmodded running product that grows to thousands of digits silently
   turns a loop you assumed was `O(n)` into something slower per iteration. Reducing mod `m` every
   step keeps each value — and each operation on it — bounded, regardless of language.

The identities you actually need:

```python
MOD = 10**9 + 7

# (a + b) mod m  ==  ((a mod m) + (b mod m)) mod m
# (a * b) mod m  ==  ((a mod m) * (b mod m)) mod m
# division is NOT distributive — you need a modular inverse (below)

def mod_pow(base: int, exp: int, mod: int = MOD) -> int:
    """Fast exponentiation: O(log exp) multiplications instead of O(exp)."""
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = (result * base) % mod
        base = (base * base) % mod
        exp >>= 1
    return result
```

Division under a prime modulus uses Fermat's little theorem: `a⁻¹ mod p == pow(a, p - 2, p)`. That
inverse plus `mod_pow` is what lets you combine this section with the last — computing
`C(n, r) mod p` for `n` far too large for a plain factorial table:

```python
def nCr_mod(n: int, r: int, mod: int = MOD) -> int:
    fact = [1] * (n + 1)
    for i in range(1, n + 1):
        fact[i] = fact[i - 1] * i % mod
    inv_r = mod_pow(fact[r], mod - 2, mod)
    inv_n_minus_r = mod_pow(fact[n - r], mod - 2, mod)
    return fact[n] * inv_r % mod * inv_n_minus_r % mod
```

**Interview tie-in — Super Pow (LC 372)** asks for `a^b mod 1337` where `b` is given as a huge digit
array — a direct application of `mod_pow`'s doubling trick, not repeated multiplication.

---

## GCD and LCM

The greatest common divisor is the largest number dividing two integers with no remainder; the
Euclidean algorithm computes it in `O(log(min(a, b)))` and fits in one line:

```python
def gcd(a: int, b: int) -> int:
    return a if b == 0 else gcd(b, a % b)

def lcm(a: int, b: int) -> int:
    return a * b // gcd(a, b)

# math.gcd and math.lcm ship these natively — reach for the stdlib in practice
```

Two places this shows up constantly:

- **Fraction reduction.** Fraction Addition and Subtraction (LC 592) reduces every intermediate
  numerator/denominator pair by their `gcd`, or the values grow unbounded — the same overflow lesson
  as modular arithmetic, solved here by simplification instead of a modulus.
- **Period / cycle problems.** Nth Magical Number (LC 878): two events recurring every `a` and `b`
  steps coincide every `lcm(a, b)` steps. Counting coincidences up to `n` is inclusion-exclusion
  over that `lcm`, and finding the answer itself is typically binary search over the count — the
  next section's territory.

---

## Prime Sieves

Sieve of Eratosthenes marks composites instead of testing each number individually:

```python
def sieve_of_eratosthenes(n: int) -> list[bool]:
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n ** 0.5) + 1):
        if is_prime[i]:
            for multiple in range(i * i, n + 1, i):
                is_prime[multiple] = False
    return is_prime
```

Complexity is `O(n log log n)` for the whole table — effectively linear. Trial division for a single
number is `O(√n)`, which looks fine until the problem asks "is prime" for many numbers: `q`
trial-division queries cost `O(q · √n)`, while one sieve precompute plus `q` array lookups costs
`O(n log log n + q)`. Once `q` is more than a handful, the sieve wins outright — this is the same
"batch amortizes the per-query cost" trade-off you'll see again with prefix sums.

**Interview tie-in — Count Primes (LC 204)** is the sieve applied directly. A useful variant
precomputes the _smallest prime factor_ for every number, turning each later factorization into
`O(log n)` instead of `O(√n)` — the technique behind batch-factorization problems like Distinct
Prime Factors of Product of Array (LC 2521):

```python
def smallest_prime_factor_sieve(n: int) -> list[int]:
    spf = list(range(n + 1))
    for i in range(2, int(n ** 0.5) + 1):
        if spf[i] == i:  # i is prime
            for multiple in range(i * i, n + 1, i):
                if spf[multiple] == multiple:
                    spf[multiple] = i
    return spf
```

---

## Logs, Exponents, and Where They Show Up

This is a short section on purpose — Chapter 2 (Asymptotic Analysis) is where `O`, `Ω`, and `Θ` get
their formal treatment. What belongs here is just naming the two shapes you'll recognize once you
know where they come from mathematically:

- **`log n`** comes from repeated halving — binary search, the height of a balanced BST, each level
  of a heap push/pop. If a problem's search space shrinks by a constant _fraction_ each step, the
  step count is logarithmic.
- **`2ⁿ`** comes from repeated doubling — every recursive call branching in two without memoization
  (Chapter 3, Recursion), every subset-enumeration problem from the combinatorics section above.

One detail worth internalizing: the base of the log never matters for Big-O — `log₂ n`, `log₁₀ n`,
and `ln n` differ only by a constant factor, which asymptotic notation discards. "Logarithmic" is
enough; naming the base is usually a tell that someone hasn't internalized why it drops out.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
