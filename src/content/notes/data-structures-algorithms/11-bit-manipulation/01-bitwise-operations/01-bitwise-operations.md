---
title: "1 — Bitwise Operations"
description: "AND, OR, XOR, NOT, and shifts as the primitive operations every bit trick composes from — plus the Python-specific gotcha (arbitrary-precision ints) that catches people coming from C."
tags: ["data-structures-algorithms","bit-manipulation","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-81"
---

# 1 — Bitwise Operations

Every bit trick in this Part — isolating a bit, toggling a flag, packing a set into an integer,
walking a Gray code sequence — is built from six primitive operators: `&`, `|`, `^`, `~`, `<<`, and
`>>`. None of them are complicated in isolation. What trips people up is porting intuition from a
fixed-width language (C, Java) into Python, where integers have no fixed width at all — `~5` and
`-5 >> 1` do not behave the way a C background predicts, and that mismatch is exactly where "reverse
bits" and "single number" style problems go wrong when ported to Python without a mask. This chapter
covers the six operators, two's complement (why `~x == -x - 1`), the arbitrary-precision gotcha in
concrete terms, and a worked masking helper — the foundation the rest of this Part builds on.

---

## The Six Primitive Operators

Every bitwise operation in Python works on the binary representation of an integer, bit by bit,
independent of the integer's decimal value. There are three binary operators that compare two
numbers bit-by-bit, one unary operator that flips every bit, and two shift operators that move bits
left or right.

**AND (`&`), OR (`|`), XOR (`^`)** — each takes two integers and produces a new integer by applying
a boolean rule to every corresponding pair of bits:

| a   | b   | a & b | a \| b | a ^ b |
| --- | --- | ----- | ------ | ----- |
| 0   | 0   | 0     | 0      | 0     |
| 0   | 1   | 0     | 1      | 1     |
| 1   | 0   | 0     | 1      | 1     |
| 1   | 1   | 1     | 1      | 0     |

Read the table as three different questions asked of every bit pair: AND asks "are both set?", OR
asks "is at least one set?", XOR asks "are they different?" That framing is also the fastest way to
remember what each operator is _for_ at a glance:

- **`&` (AND) — masking and checking.** ANDing against a pattern of 1s and 0s keeps the bits where
  the mask has a 1 and zeroes out everywhere the mask has a 0. `x & 1` checks the lowest bit
  (parity); `x & (x - 1)` clears the lowest set bit — both are AND used as a filter.
- **`|` (OR) — setting.** ORing against a pattern turns on every bit where the pattern has a 1,
  leaving the rest untouched. `x | (1 << k)` sets bit `k` without disturbing any other bit.
- **`^` (XOR) — toggling and comparing.** XOR flips a bit if the other operand has a 1 there, and
  leaves it alone if the other operand has a 0 there — which makes `x ^ (1 << k)` a bit-flip, and
  `a ^ b` a "where do these two differ" comparison. XOR's defining property, `x ^ x == 0` and
  `x ^ 0 == x`, is what [[03-xor-problems|Chapter 3]] builds an entire family of problems on.
- **`~` (NOT) — bitwise complement.** Unary, one operand: flips every bit. Covered on its own below,
  because what it produces on a _negative_ number is where two's complement actually matters.
- **`<<` / `>>` (shifts) — multiply / divide by a power of two.** `x << k` is `x * 2**k`; `x >> k`
  is `x // 2**k` for non-negative `x` (floor division, not truncation — the negative-number case is
  its own gotcha, covered below). Shifting is also how you build a positional mask in the first
  place: `1 << k` is the integer with only bit `k` set.

```python
>>> 0b1100 & 0b1010
0b1000
>>> 0b1100 | 0b1010
0b1110
>>> 0b1100 ^ 0b1010
0b0110
>>> 1 << 4
16
>>> 20 >> 2
5
```

---

## Two's Complement and Why `~x == -x - 1`

Positive integers in binary are unambiguous — `5` is `0b101`, full stop. Negative integers need a
representation, and the one every mainstream language settles on is **two's complement**: to
represent `-x` in a fixed width of `n` bits, take the `n`-bit pattern for `x`, flip every bit, and
add 1.

That definition is exactly the operation `~` performs, minus the "add 1" step — which is exactly why
`~x` and `-x` are one apart:

```
two's complement of x  =  (flip every bit of x) + 1  =  -x   (by definition)
        so:              flip every bit of x         =  -x - 1
        i.e:                             ~x           =  -x - 1
```

`~x == -x - 1` isn't a fact to memorize — it _is_ the definition of two's complement, rearranged.
Plug in a couple of values to see it hold: `~0 == -1`, `~5 == -6`, `~(-6) == 5`. The reason two's
complement won over the more obvious "sign bit + magnitude" scheme is that it makes addition,
subtraction, and comparison work with the _same_ circuitry for positive and negative numbers — no
special-casing the sign bit anywhere in the ALU. That's a hardware-design payoff, but it's also why
`~x == -x - 1` is a hardware-_level_ identity, not a Python quirk: every mainstream language that
uses two's complement gives you this same relationship.

---

## The Python-Specific Gotcha: Arbitrary-Precision Integers

Here's the part that isn't covered anywhere else in this book yet, and it matters the moment you
port a bit-manipulation problem from a C-oriented spec (which is where most of them originate —
LeetCode's "reverse bits," "single number," and similar problems were written with a fixed 32-bit
`int` in mind).

**C and Java integers have a fixed width** — 32 bits, 64 bits, whatever the type declares — and bit
patterns wrap around at that width. **Python integers have no fixed width at all.** A Python `int`
is arbitrary-precision: it grows to however many bits it needs, and conceptually keeps an infinite
run of sign-extension bits above the highest digit (all 0s for a non-negative number, all 1s for a
negative one). There is no wraparound, because there's no boundary to wrap around at.

This shows up in two places that will actively mislead a reader coming from C:

**`~5` in Python prints `-6`, not a bit pattern.** That's the _correct_ two's complement value —
`~5 == -5 - 1 == -6`, exactly as derived above — but Python has no fixed width to display it
against, so it prints the decimal result instead of something like `11111010`. In C, `~5` on a
32-bit `int` prints as the decimal value of the 32-bit pattern `0xFFFFFFFA`, which is _also_ `-6`
under two's complement — so the values agree. The trap is in what people expect to _see_, not in the
math: there is no 32-bit pattern to inspect in Python, because Python never allocated one.

**`-5 >> 1` performs an arithmetic shift that keeps extending the sign bit, giving `-3`, not a
wraparound value.** In a fixed-width language, right-shifting a negative number either shifts in 0s
(logical shift) or replicates the sign bit within the fixed width (arithmetic shift) — either way,
bounded by the type's width. Python's `>>` on a negative number is always an arithmetic shift, and
since there's no fixed width, "replicate the sign bit" conceptually extends leftward forever. The
practical effect matches floor division by a power of two: `-5 >> 1 == -3` because `-5 // 2 == -3`
(floor of `-2.5`), not `-2` (truncation toward zero, which is what naive "divide by 2" intuition
predicts).

**Why this matters concretely:** a problem that says "given a 32-bit signed integer, reverse its
bits" or "every element appears twice except one, using O(1) extra space via XOR, treat as a 32-bit
int" is implicitly assuming the fixed-width wraparound behavior of the language it was written for.
Run that logic on Python's arbitrary-precision integers unmodified and negative intermediate values
silently carry an infinite sign-extension tail instead of wrapping at bit 31 — producing a value
that's mathematically consistent with Python's own int model, but wrong for a "return the 32-bit
answer" contract. The fix is an explicit mask: AND the result against `0xFFFFFFFF` (32 ones) to
truncate back down to the width the problem actually means, then, if the problem wants a _signed_
32-bit result, detect whether bit 31 is set and subtract `1 << 32` to reinterpret it as negative.
That two-step "mask, then resignify" pattern is worth internalizing now — it recurs verbatim in
[[02-bit-tricks|Chapter 2]] and in any "assume fixed-width" problem from here on.

---

## Worked Example: `to_binary_string`

A helper that prints the correctly zero-padded two's-complement bit string for a given bit width —
for both positive and negative `n` — makes the masking technique from the previous section concrete
instead of abstract.

```python
def to_binary_string(n: int, width: int) -> str:
    """Return the `width`-bit two's-complement representation of n as a bit string.

    Positive n must fit in width-1 bits (leaving room for the sign bit);
    negative n must satisfy n >= -(1 << (width - 1)).
    """
    if n >= 0:
        if n >= (1 << (width - 1)):
            raise ValueError(f"{n} does not fit in {width}-bit two's complement")
    else:
        if n < -(1 << (width - 1)):
            raise ValueError(f"{n} does not fit in {width}-bit two's complement")

    mask = (1 << width) - 1        # width ones, e.g. 0xFFFFFFFF for width=32
    return format(n & mask, f"0{width}b")


# to_binary_string(5, 8)   == "00000101"
# to_binary_string(-5, 8)  == "11111011"
# to_binary_string(-1, 8)  == "11111111"
```

The entire trick is `n & mask`. For a non-negative `n`, ANDing against `width` ones is a no-op — the
value is already smaller than the mask. For a negative `n`, Python's `int` conceptually has an
infinite run of leading 1-bits (the sign extension from the previous section); ANDing against a
`width`-bit mask of 1s chops that infinite tail down to exactly `width` bits, which is precisely the
fixed-width two's-complement pattern C or Java would have stored natively.
`format(..., f"0{width}b")` then zero-pads the result to `width` characters, since Python's
`bin()`/`format` would otherwise drop leading zeros. This is the same `& 0xFFFFFFFF`-style mask from
the gotcha section, generalized to any width instead of hardcoded to 32.

**Complexity:** O(width) for the `format` call, which builds a `width`-character string — everything
before it (`&`, comparisons) is a single machine-level operation on the underlying bit pattern.

---

## Complexity

In the fixed-width mental model an interviewer expects — the one every other DSA chapter reasons in,
per [[02-asymptotic-analysis|Part 01, Chapter 2]] — every one of AND, OR, XOR, NOT, and both shifts
is **O(1)**: one CPU instruction operates on the whole word regardless of which bits are set. That's
the number to say out loud in an interview, and it's the right mental model for reasoning about an
algorithm's asymptotic complexity.

One honest caveat, stated once and then set aside: Python's own integers are arbitrary-precision, so
a bitwise op on a genuinely huge integer costs O(bits) internally, not true O(1) — CPython has to
touch every machine word backing that integer. This is never the bottleneck in practice for anything
this book covers (interview problems bound their integers to 32 or 64 bits explicitly, or work with
values that never approach a size where this matters), so treat the O(1) claim as correct for every
purpose that follows and don't spend interview time defending the asterisk unless asked.

---

## What This Sets Up

Everything else in this Part composes these six operators into higher-level moves:

- **[[02-bit-tricks|Chapter 2 — Bit Tricks]]** turns AND/OR/XOR/shift combinations into named
  one-liners — checking a bit (`x & (1 << k)`), setting one (`x | (1 << k)`), clearing one
  (`x & ~(1 << k)`), isolating the lowest set bit (`x & -x`), and clearing it (`x & (x - 1)`).
- **[[03-xor-problems|Chapter 3 — XOR Problems]]** builds an entire problem family on the two XOR
  identities named above (`x ^ x == 0`, `x ^ 0 == x`): single-number, missing-number, and
  pairing-style problems all reduce to "XOR everything and let the duplicates cancel."
- **[[04-bitmasking|Chapter 4 — Bitmasking]]** uses an integer as a compact representation of a
  _set_ — bit `k` set means "element `k` is in the set" — which is what makes subset enumeration and
  bitmask DP tractable.
- **[[05-gray-code|Chapter 5 — Gray Code]]** uses XOR to generate binary sequences where consecutive
  values differ by exactly one bit, a property with real hardware motivations (rotary encoders,
  Karnaugh maps) that shows up in interview form as a generation problem.

Everything in those four chapters is these six operators, composed. There's no seventh primitive
coming later — mastering `&`, `|`, `^`, `~`, `<<`, `>>`, and the masking discipline from this
chapter is the entire toolbox.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
