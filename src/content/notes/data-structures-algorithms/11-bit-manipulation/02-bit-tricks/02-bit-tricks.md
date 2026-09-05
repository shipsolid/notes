---
title: "2 — Bit Tricks"
description: "A toolkit of small, composable bit-level idioms — power-of-two checks, isolating and clearing the lowest set bit, Kernighan's popcount, single-bit get/set/clear/toggle, and the XOR swap — each derived from two's-complement first principles, not memorized as a formula."
tags: ["data-structures-algorithms","bit-manipulation","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-82"
relations:
  - slug: data-structures-algorithms/11-bit-manipulation/01-bitwise-operations/01-bitwise-operations
    kind: depends_on
---

# 2 — Bit Tricks

[[01-bitwise-operations|Chapter 1]] (this same Part) established AND, OR, XOR, NOT, and the two
shifts as the raw instructions a CPU executes on integers. This chapter is the toolkit built on top
of them: a handful of small, composable idioms — checking whether a number is a power of two,
isolating or clearing its lowest set bit, counting how many bits are set, reading or writing a
single bit by position, swapping two values without a temp — that show up constantly once you know
to look for them. None of these is more than a line or two of code, and every one of them falls out
of the same small set of two's-complement facts. The point of this chapter isn't memorizing eight
formulas — an interviewer can tell the difference between "I recall `n & (n - 1)`" and "I can derive
`n & (n - 1)` on the whiteboard from what subtraction does to a binary number," and only the second
one survives a follow-up question that changes the trick slightly.

---

## Power of Two Check

A power of two has exactly one bit set — `8` is `1000`, `16` is `0001 0000`, and so on. That single
fact is enough to build an O(1) test:

```python
def is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0
```

**Complexity:** O(1) — two operations, regardless of how wide `n` is.

**Why it works:** subtracting 1 from a power of two has to flip its one set bit to 0, and because
there's nothing to borrow from above, that borrow propagates through every bit below it, setting all
of them to 1. `8 - 1`: `1000 → 0111`. ANDing the original against that result always yields 0,
because the single set bit in `n` lines up with a 0 in `n - 1`, and every bit below it is 0 in `n`
to begin with. Any number that _isn't_ a power of two has at least one more set bit sitting above
its lowest one, and `n - 1` never touches those higher bits — so the AND leaves them intact and
nonzero. Check it against `6` (`0110`): `n - 1` is `5` (`0101`), and `0110 & 0101 = 0100` — nonzero,
correctly rejecting `6`. The `n > 0` guard matters for exactly one edge case: `0` has no set bits at
all, and `0 - 1` wraps to all-1s in two's complement, so `0 & -1 == 0` would falsely pass without
it.

---

## Isolating and Clearing the Lowest Set Bit

These are two separate one-liners because they get reached for independently all the time, but both
fall out of the same two's-complement identity that powers the check above.

```python
def isolate_lowest_set_bit(n: int) -> int:
    return n & -n

def clear_lowest_set_bit(n: int) -> int:
    return n & (n - 1)
```

**Complexity:** O(1) each.

**Why isolation works:** in two's complement, `-n` is defined as `~n + 1`. Say `n`'s lowest set bit
sits at position `k` — so `n` looks like `[upper bits] 1 [k zeros]`. Flipping every bit (`~n`) turns
that into `[flipped upper bits] 0 [k ones]`. Adding 1 to a run of `k` trailing ones carries all the
way up: the `k` ones become `k` zeros again, and the carry flips the 0 at position `k` into a 1 —
with nothing left to carry further, since that bit started at 0 in `~n`. So `-n` is
`[flipped upper bits] 1 [k zeros]` — identical to `n` at position `k` and below, and the bitwise
complement of `n` everywhere above it. ANDing `n` and `-n`: at position `k` both have `1`, giving
`1`; below `k` both have `0`; above `k` one side is always the complement of the other, and `x & ~x`
is `0` for every such pair. The only surviving bit is position `k` — exactly the lowest set bit,
isolated. Trace `n = 12` (`1100`): `-12` is `1111...0100` (8-bit: `~00001100 = 11110011`,
`+1 = 11110100`); `1100 & 11110100 = 0100 = 4`, the value of the lowest set bit.

**Why clearing works:** it's the same `n - 1` borrow-propagation from the power-of-two check,
generalized — `n - 1` always flips the lowest set bit to 0 and every bit below it to 1, and leaves
every bit above it untouched. ANDing against the original `n` keeps those untouched upper bits and
zeroes out the lowest set bit along with everything below it (which was already 0 in `n`). Trace the
same `n = 12`: `n - 1 = 11` (`1011`), and `1100 & 1011 = 1000 = 8` — `12` with its lowest set bit
cleared. The power-of-two check from the previous section is just this identity applied to the
question "does clearing the lowest set bit leave nothing behind?"

---

## Counting Set Bits: Brian Kernighan's Popcount

The naive way to count set bits shifts through every bit position and checks it:

```python
def popcount_naive(n: int) -> int:
    count = 0
    while n:
        count += n & 1
        n >>= 1
    return count
```

**Complexity:** O(w), where `w` is the bit width of `n` — a number with a single set bit at the top
of a 64-bit integer still costs 64 iterations, because the loop only knows to stop when every bit,
set or not, has been examined.

Brian Kernighan's algorithm reuses the clear-lowest-set-bit identity from the previous section
instead of walking bit positions at all:

```python
def popcount_kernighan(n: int) -> int:
    count = 0
    while n:
        n &= n - 1   # clear the lowest set bit
        count += 1
    return count
```

**Complexity:** O(k), where `k` is the number of _set_ bits — each iteration removes exactly one set
bit via `n & (n - 1)`, and the loop terminates the instant there are none left. A number with one
bit set costs one iteration no matter how wide it is; a number with every bit set costs `w`
iterations, matching the naive approach's worst case exactly. The two algorithms agree on cost only
when the input is dense with set bits — Kernighan's wins precisely when it doesn't have to look at
bits that aren't there.

In practice, reach for the standard library instead of hand-rolling either loop: Python 3.10+ ships
`int.bit_count()` (`n.bit_count()`), which does the same job in compiled code. Kernighan's algorithm
is what an interviewer wants to see you _derive_ — it demonstrates you understand why `n & (n - 1)`
removes exactly one bit, which is the same fact the get/set/clear/toggle table below and the worked
example at the end of this chapter both lean on. Knowing the built-in exists and still being able to
produce Kernighan's version on request are not in tension; the second is what proves the first isn't
cargo-culted.

---

## Get, Set, Clear, Toggle a Bit at Position `i`

All four operations mask position `i` with `1 << i` and combine it with `n` using whichever bitwise
operator has the identity property that leaves every _other_ bit unchanged.

| Operation | Expression      | Why it works                                                                                                               |
| --------- | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Get       | `(n >> i) & 1`  | shifts bit `i` down to position 0, masking away everything else, so the result is `1` iff bit `i` was set                  |
| Set       | `n \| (1 << i)` | `x OR 1 = 1` and `x OR 0 = x` — forces bit `i` to `1` and leaves every other bit untouched                                 |
| Clear     | `n & ~(1 << i)` | `~(1 << i)` is all 1s except a 0 at position `i`; `x AND 1 = x` and `x AND 0 = 0` — forces bit `i` to `0`, leaves the rest |
| Toggle    | `n ^ (1 << i)`  | `x XOR 1` flips `x`, `x XOR 0 = x` — flips bit `i` exactly, leaves every other bit untouched                               |

```python
def get_bit(n: int, i: int) -> int:
    return (n >> i) & 1

def set_bit(n: int, i: int) -> int:
    return n | (1 << i)

def clear_bit(n: int, i: int) -> int:
    return n & ~(1 << i)

def toggle_bit(n: int, i: int) -> int:
    return n ^ (1 << i)
```

**Complexity:** O(1) each — one shift (or complement) and one binary operation, independent of how
wide `n` is or which bit `i` targets.

---

## Swap Two Variables Without a Temp: XOR Swap

```python
a ^= b
b ^= a
a ^= b
```

**Complexity:** O(1), three operations, zero extra storage — which is the entire reason this trick
gets shown at all.

**Why it works:** call the original values `a0` and `b0`. After line one, `a` holds `a0 ^ b0`. Line
two computes `b0 ^ (a0 ^ b0)`, and `b0 ^ b0` cancels to `0`, leaving `b = a0` — XOR's self-inverse
property doing the work. Line three computes `(a0 ^ b0) ^ a0`, and `a0 ^ a0` cancels the same way,
leaving `a = b0`. Three XORs, no third variable, values swapped.

**Why it's a bad idea in practice:** the derivation above silently assumes `a` and `b` are two
distinct storage locations. If they alias — the same variable, or the same array slot referenced
twice, as in `xor_swap(arr, i, i)` — the very first line computes `a ^= a`, which is `0` for _any_
value of `a`, and the "swap" has just zeroed out real data instead of leaving it unchanged. Python's
tuple-unpack swap, `a, b = b, a`, evaluates both sides before rebinding either name, so it's immune
to this failure mode and reads as intent rather than a puzzle. Treat the XOR swap as an
interview-recognition item — know it, know why it breaks under aliasing, and don't reach for it in
code anyone will review.

---

## Worked Example: Minimum Bit Flips to Convert A into B

**Problem:** given two integers `A` and `B`, how many bits do you need to flip in `A` to turn it
into `B`? (This is the **Hamming distance** between their binary representations.)

XOR is the entire insight here: `a ^ b` has a `1` at exactly the bit positions where `a` and `b`
differ, and a `0` everywhere they agree — that's the definition of XOR applied bit by bit. So the
number of bits that differ between `A` and `B` is exactly the popcount of `A ^ B`, which turns a
comparison problem into the counting problem from earlier in this chapter:

```python
def min_bit_flips(a: int, b: int) -> int:
    diff = a ^ b
    count = 0
    while diff:
        diff &= diff - 1   # Kernighan's trick, reused
        count += 1
    return count

# what you'd actually write in practice:
def min_bit_flips_builtin(a: int, b: int) -> int:
    return (a ^ b).bit_count()
```

**Complexity:** O(1) for the XOR itself; O(k) for the popcount pass, where `k` is the number of
differing bits — dominated entirely by whichever popcount strategy backs it.

Trace it: `a = 26` (`11010`), `b = 9` (`01001`). `a ^ b`: `1^0, 1^1, 0^0, 1^0, 0^1` → `10011`
(`19`), which has three set bits — `26` needs exactly three flips to become `9`. This is also a
preview of the next chapter: [[03-xor-problems|XOR Problems]] (Chapter 3, this same Part) is built
entirely around this one property — that XOR isolates _difference_ the same way addition isolates
_sum_ — applied to single-number, missing-number, and pairing problems where a plain hash set would
also work but costs O(n) space that XOR doesn't need.

---

## The Readability Trade-Off

Every trick in this chapter buys speed and (usually) O(1) space at the cost of compressing real
meaning into two or three characters. That trade is worth it _inside_ a problem whose whole point is
bit manipulation — nobody reviewing a popcount solution needs `n & (n - 1)` explained. It stops
being worth it the moment one of these idioms shows up incidentally, inside otherwise ordinary
business logic, where the next reader (including you, in six months) has no reason to expect a
two's-complement identity buried in a conditional. A bare `if n & (n - 1) == 0:` sitting in a
validation function reads as noise, not intent, unless the reader already has this chapter
memorized.

The fix costs one line: whenever a trick from this chapter appears outside a
bit-manipulation-focused problem, name it inline —

```python
if n & (n - 1) == 0:   # clears the lowest set bit; zero result means n is a power of two
    ...
```

— so the review cost of the idiom stays flat instead of scaling with how many of these get composed
together in the same function. The formula is free to write; the comment is what keeps it cheap to
read.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
