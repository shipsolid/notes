---
title: "Practice: Math & Random"
description: "The raw practice snippets behind the Math & Random chapter — a run-and-print tour of the math module (roots, logs, trig, gcd/lcm/factorial) and the random module (uniform draws, sampling, shuffling, seeding)."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031814"
---

# Practice: Math & Random

This is the raw practice source behind [[10-1-math-and-random|10 — Math & Random]] — two
run-and-print demo functions covering the `math` and `random` standard library modules. Where the
chapter distills the worked examples (perfect-square check, reservoir sampling, Fisher–Yates
shuffle) and the sharp edges, this note keeps the original exploratory code each function walks
through, unabridged. Neither function has been rewritten or bug-fixed here; this is a structural
pass (frontmatter, headings) only, not a correctness review.

## The `math` Module

Demonstrates constants (`pi`, `e`, `inf`), rounding, roots, logarithms, trigonometry, and the
number-theory helpers (`gcd`, `lcm`, `factorial`) that return exact integers instead of floats.

```python
def print_math():
  """
  Demonstrates the math module: constants (pi, e, inf), rounding, roots,
  logarithms, trigonometry, and number-theory helpers (gcd, lcm, factorial).
  """
  # **Use for:** GCD/LCM, prime checking, distance calculations, logarithms.
  import math

  print("\nmath module example:")
  print("math.sqrt(16):", math.sqrt(16))           # 4.0
  print("math.isqrt(17):", math.isqrt(17))         # 4  (integer square root, no float) — avoids float precision issues; safe for index arithmetic
  print("math.factorial(5):", math.factorial(5))   # 120
  print("math.gcd(48, 18):", math.gcd(48, 18))     # 6
  print("math.lcm(12, 15):", math.lcm(12, 15))     # 60  (Python 3.9+)
  print("math.prod([1,2,3,4]):", math.prod([1, 2, 3, 4]))  # 24

  print("math.pi:", math.pi)    # 3.14159...
  print("math.e:", math.e)      # 2.71828...
  print("math.inf:", math.inf)  # infinity — useful as a sentinel (e.g. initialise min-cost = math.inf in Dijkstra's so any real edge is smaller)

  print("math.log2(8):", math.log2(8))             # 3.0
  print("math.log10(100):", math.log10(100))       # 2.0
  print("math.log(math.e):", math.log(math.e))     # 1.0
  print("math.ceil(4.3):", math.ceil(4.3))         # 5
  print("math.floor(4.7):", math.floor(4.7))       # 4

  # Quick reference
  math.sqrt(16)        # 4.0
  math.pow(2, 3)       # 8.0  (float); use ** for int
  math.factorial(5)    # 120
  math.gcd(48, 18)     # 6
  math.lcm(12, 8)      # 24
  math.sin(math.pi/2)  # 1.0  — sine of 90°
  math.cos(0)          # 1.0  — cosine of 0°
  math.degrees(math.pi)   # 180.0  — convert radians → degrees
  math.radians(180)       # 3.14159...  — convert degrees → radians
  math.isfinite(10)    # True  — False for inf or nan
  math.isinf(float('inf'))  # True  — True for +inf or -inf
  # pow(2, 10, 1000)        # 24 — three-arg built-in pow: modular exponentiation (2**10 mod 1000);
  #                         #      faster than pow(2,10) % 1000 because it avoids computing the full large int first
```

## The `random` Module

Demonstrates uniform floats, integer ranges, element selection, sampling without replacement,
in-place shuffle, and seeding.

```python
def print_random():
  """
  Demonstrates the random module: uniform floats, integer ranges, element
  selection, sampling without replacement, in-place shuffle, and seeding.
  """
  # **Use for:** Random sampling, shuffling, generating test data.
  import random

  print("\nrandom module example:")
  print("random.random():", random.random())              # float in [0.0, 1.0)
  print("random.randint(1, 10):", random.randint(1, 10))  # int in [1, 10] inclusive
  print("random.randrange(0, 10, 2):", random.randrange(0, 10, 2))  # even number 0–8
  print("random.choice([1,2,3]):", random.choice([1, 2, 3]))
  print("random.sample(range(10), 5):", random.sample(range(10), 5))  # 5 unique elements — draws WITHOUT replacement (no duplicates); use random.choices() if duplicates are ok

  arr = [1, 2, 3, 4, 5]
  random.shuffle(arr)   # in-place
  print("After random.shuffle:", arr)

  print("random.uniform(1.0, 10.0):", random.uniform(1.0, 10.0))  # float in [1.0, 10.0]

  # Quick reference
  random.random()               # Float in [0.0, 1.0)
  random.randint(1, 10)         # Integer in [1, 10]
  random.randrange(0, 10, 2)    # Even numbers 0–8
  random.choice([1, 2, 3, 4])   # Random element — picks one item from the sequence
  random.sample([1,2,3,4,5], 3) # 3 unique random elements — WITHOUT replacement; use random.choices() to allow repeats
  random.uniform(1.0, 10.0)     # Float in [1.0, 10.0]
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
