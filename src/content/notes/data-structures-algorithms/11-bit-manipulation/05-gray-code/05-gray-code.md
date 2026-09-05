---
title: "5 — Gray Code"
description: "A permutation of 0..2^n-1 where every consecutive pair — including the wrap from the last value back to the first — differs in exactly one bit, generated in O(1) per value by a single XOR, and the reason physical rotary encoders needed that guarantee before it became an interview trick."
tags: ["data-structures-algorithms","bit-manipulation","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-85"
relations:
  - slug: data-structures-algorithms/11-bit-manipulation/01-bitwise-operations/01-bitwise-operations
    kind: depends_on
  - slug: data-structures-algorithms/11-bit-manipulation/04-bitmasking/04-bitmasking
    kind: related
---

# 5 — Gray Code

Binary counting is the encoding everyone reaches for by default, and it hides a property most code
never has to think about: how many bits change between one value and the next. Most of the time
that's irrelevant — a CPU register doesn't care that going from 3 to 4 rewrites three bits instead
of one. But wire that same counter to something physical — a shaft encoder reading angular position,
a bank of mechanical contacts, an analog-to-digital converter — and the number of bits that change
mid-transition stops being cosmetic and becomes a source of real, measurable error. Gray code is
binary counting's answer to that problem: a reordering of the same `0..2^n - 1` integers, generated
in O(1) per value from a single XOR, where every consecutive pair — including the wrap from the last
value back to the first — differs in exactly one bit. This chapter derives the formula, its inverse,
and the recursive construction the formula is quietly encoding, then names the one thing this
genuinely tests in an interview: whether XOR is something internalized or something memorized.

---

## Why Ordinary Binary Counting Doesn't Have This Property

Take the transition from 3 to 4 in ordinary 3-bit binary: `011` becomes `100` — all three bits flip
at once. That's not a special case; it's what happens at the tail of every carry chain. Incrementing
`n` by one always follows the same mechanical rule: find the lowest 0 bit, flip it to 1, and flip
every bit below it — which, by definition of "lowest 0 bit," were all 1s — down to 0. Most
increments only have to flip one trailing 1 (or none at all), but every power-of-two boundary — 3→4,
7→8, 15→16 — flips a run as long as the streak of trailing 1s that preceded it. The number of bits
that change per step is unbounded; it's just not bounded by anything ordinary code ever notices.

Code doesn't notice because a CPU reads a whole register atomically — there's no such thing as
observing it mid-flip. A physical position sensor doesn't get that guarantee. A rotary encoder
reports shaft angle as an n-bit binary word read off n physical contact tracks or photodiodes, and
the readout hardware can't switch all n tracks at the exact same instant — mechanical and electrical
tolerances mean the switches land microseconds apart. Sample the encoder during the `011 → 100`
transition and, depending on exactly which tracks have already flipped, any of several intermediate
values is momentarily readable — `001`, `010`, `101`, `110` — not just the two true endpoints. A
misread like that doesn't average out; it's a spurious position jump reported to whatever's reading
the sensor.

Frank Gray patented the reflected binary code at Bell Labs in 1953 to solve exactly this problem for
early pulse-code-modulation hardware, and the same guarantee is why it's still the default encoding
for rotary and mechanical position sensors today: if only one bit can ever be mid-flip at a time, a
misread mid-transition can only return one of the two adjacent values, never something unrelated.
The same property shows up twice more in contexts this book touches — Karnaugh maps order
truth-table rows in Gray code specifically so that visually adjacent cells differ by exactly one
variable, and error-correction contexts favor Gray-adjacent symbol assignments so a single-bit
transmission error corresponds to confusing a value with its immediate neighbor rather than an
arbitrary one.

---

## The Formula: Binary → Gray in One XOR

The encoding itself is one line:

```python
def to_gray(n: int) -> int:
    """Convert an unsigned binary integer to its Gray code encoding."""
    return n ^ (n >> 1)
```

Reading `n ^ (n >> 1)` bit by bit: bit `i` of the result is `n_i XOR n_{i+1}` —
[[01-bitwise-operations|Part 11, Chapter 1]]'s definition of XOR, applied between each bit of `n`
and its higher neighbor rather than between two separate numbers. So Gray-code bit `i` doesn't
encode the _value_ of binary bit `i` at all — it encodes whether binary bits `i` and `i+1` differ. A
Gray code is a record of where the transitions are in the binary string, read top-down, not a record
of the bits themselves.

That reframing is what turns the one-bit-difference guarantee into something provable rather than
just observed. XOR has a property worth stating explicitly: flipping both of its inputs leaves the
result unchanged — `a XOR b == (NOT a) XOR (NOT b)` for any bits `a, b`, because XOR only asks
whether its two inputs agree, and flipping both preserves whether they agree. Now trace what happens
to every neighbor-pair `(n_i, n_{i+1})` when `n` increments to `n + 1`. Incrementing flips a
trailing run of 1-bits to 0, plus one pivot 0-bit to 1, exactly as the previous section described.
For any pair where both bits sit inside that flipped region, they flip together — the XOR invariance
above means gray bit `i` doesn't change. For any pair sitting entirely above the flipped region,
neither bit changes, so gray bit `i` trivially doesn't change either. Only one pair straddles the
boundary: the pivot bit itself, paired with its higher neighbor. The pivot flips; its neighbor,
sitting just above the flipped region, doesn't. That's the one pair where exactly one side of the
XOR changes — and it's the only gray bit that can.

That's the actual "why" behind the guarantee, not just the formula that produces it: Gray code
doesn't avoid multi-bit binary transitions by magic, it avoids them by encoding _differences between
neighbors_ instead of raw values, and a differences-encoding is invariant to any change that moves
both sides of a comparison the same way.

---

## The Inverse: Gray → Binary

Recovery has to run the other direction: given a Gray-coded value, reconstruct the binary number it
came from. The bit-level identity from the previous section, `gray_i = n_i XOR n_{i+1}`, rearranges
to `n_i = gray_i XOR n_{i+1}` — binary bit `i` depends on gray bit `i` **and** on the binary bit
immediately above it, not on `gray_i` alone. That dependency is why decoding has to walk from the
most significant bit down to the least significant one: `n_{i+1}` has to already be known before
`n_i` can be computed, and the only bit with no such dependency is the top one, where the "neighbor
above" is implicitly 0 — there is no bit above the MSB — so the top binary bit always equals the top
gray bit, unchanged.

```python
def from_gray(g: int) -> int:
    """Convert a Gray-coded integer back to its original binary value."""
    decoded_bit = 0   # the already-decoded binary bit immediately above this one
    binary = 0
    for i in range(g.bit_length() - 1, -1, -1):
        decoded_bit ^= (g >> i) & 1
        binary |= decoded_bit << i
    return binary
```

`decoded_bit` is a running cumulative XOR carried from the top bit down — after processing position
`i` it holds `n_i`, and it becomes the "`n_{i+1}`" the next, lower iteration needs. That's the
loop-level version of the same fact [[01-bitwise-operations|Part 11, Chapter 1]] established about
XOR generally: it's associative and order-independent as an operator, but _this algorithm's_
correctness depends on visiting bit positions in a specific order, because each step's output feeds
the next step's input. A flat reduction — XOR-ing every gray bit together at once, discarding
position entirely — doesn't recover `n`; the telescoping cancellation collapses it down to just
`n`'s lowest bit (every interior term appears twice and cancels, leaving only the unpaired ends).
The sequential, top-down version above is what actually inverts the encoding, precisely because it's
the one that preserves the positional information the flat reduction throws away.

**Complexity:** both directions are O(1) — a fixed, small number of machine-word operations
regardless of how large `n` is. `to_gray` is a shift and an XOR; `from_gray` is O(bit-width), which
is O(1) for any fixed integer width.

---

## Worked Example: Generating the Full Sequence for n = 3, Two Ways

For `n = 3` there are `2^3 = 8` values to sequence, `000` through `111`. Two ways to produce that
sequence — and they'd better agree, since they're describing the same object from two different
constructions.

**Method 1 — direct formula.** Apply `to_gray` to every integer in order:

```python
def gray_code_sequence(n: int) -> list[int]:
    """All Gray-coded values for an n-bit range, in traversal order."""
    return [i ^ (i >> 1) for i in range(1 << n)]

gray_code_sequence(3)
# [0, 1, 3, 2, 6, 7, 5, 4]
# binary: 000, 001, 011, 010, 110, 111, 101, 100
```

Check any consecutive pair, including the wrap from `100` (last) back to `000` (first): they differ
in exactly one bit, same as every other adjacent pair in the list. The wrap-around isn't handled as
a special case — it falls out of the formula for free, because `gray(2^n - 1)` and `gray(0)` always
differ in exactly the top bit.

**Method 2 — reflect-and-prefix.** Build the sequence for `n` bits from the sequence for `n - 1`
bits: take the smaller sequence, mirror it (reverse the list), prefix every entry in the _original_
half with `0` and every entry in the _mirrored_ half with `1`, then concatenate.

```python
def reflect_and_prefix(n: int) -> list[str]:
    """n-bit Gray code sequence as bit strings, built by mirroring the (n-1)-bit sequence."""
    if n == 0:
        return [""]
    smaller = reflect_and_prefix(n - 1)
    return [f"0{code}" for code in smaller] + [f"1{code}" for code in reversed(smaller)]

[int(code, 2) for code in reflect_and_prefix(3)]
# [0, 1, 3, 2, 6, 7, 5, 4]
```

Trace it by hand: `n = 1` gives `["0", "1"]`. `n = 2` mirrors that to `["1", "0"]`, prefixes the
original with `0` and the mirror with `1`: `["00", "01", "11", "10"]` — values `[0, 1, 3, 2]`.
`n = 3` mirrors _that_ four-element sequence to `["10", "11", "01", "00"]`, then prefixes:
`["000", "001", "011", "010"]` from the `0`-prefixed original half, `["110", "111", "101", "100"]`
from the `1`-prefixed mirrored half. Concatenated, it's identical to Method 1's output, value for
value.

The two constructions agree because they prove the same one-bit-difference property from opposite
directions. The reflect step is what _guarantees_ it structurally: within each half, adjacency is
inherited unchanged from the smaller sequence (same prefix bit, smaller sequence already correct by
induction); across the midpoint, the last entry of the first half and the first entry of the second
half are the _same_ code from the smaller sequence, just prefixed with `0` and `1` respectively —
identical except for that one prefix bit, by construction, not by coincidence; and the wrap from the
last entry back to the first is symmetric for the same reason, since the mirror ends where the
original started. The XOR formula is what you'd actually write in an interview — O(1) per value, no
recursion or auxiliary list. Reflect-and-prefix is how you'd _derive_ that formula's correctness, or
reconstruct it from scratch if it's gone fuzzy — the induction is visible in the construction in a
way it isn't in the closed-form XOR expression.

**Complexity:** O(1) to produce any one value, either way. Generating the _entire_ sequence is
O(2^n) regardless of method, because there are `2^n` values to produce and each one is O(1) — the
same exponential ceiling [[04-bitmasking|Part 11, Chapter 4]] names for subset enumeration, and not
a coincidence: an n-bit Gray code sequence and the `2^n` subsets of an n-element set are in
one-to-one correspondence — each code _is_ a bitmask — just visited in an order where adjacent masks
differ by one element instead of an arbitrary number. "Small n only" is the same ceiling under a
different name.

---

## When This Comes Up, and What It's Actually Testing

Gray code is a low-frequency interview ask in the literal sense — few candidates will ever be asked
to derive the XOR formula cold, and fewer still will be asked to prove why it works. That rarity is
exactly what makes it a good signal when it does come up: there's no pattern-matching shortcut to
`n ^ (n >> 1)` the way there is for recognizing a sliding-window problem from its phrasing.
Producing it — or reconstructing it live from the reflect-and-prefix derivation when the formula
itself has gone fuzzy — means XOR's actual bit-level behavior is something internalized rather than
memorized as a black-box trick off a bit-tricks cheat sheet. That's a cheap, high-signal probe of
the same skill [[03-xor-problems|Part 11, Chapter 3]] builds on: knowing that XOR compares, not just
combines.

The formula itself is genuinely narrow — Gray code and its inverse are the only place in this book
this exact trick applies. What isn't narrow is the reflect-and-prefix _shape_: build the answer for
a smaller instance, mirror or duplicate it, and prefix or tag each half to distinguish it from the
other. That's the same move behind generating a power set iteratively — start with `[[]]`, and for
each new element, append a copy of every existing subset with that element added, doubling the list
each time, structurally identical to "mirror and prefix" with the mirror step made implicit because
subset membership doesn't care about order the way a bit string does. It recurs anywhere a
combinatorial structure of size `2^n` (or `n!`, or another product-of-smaller-instances count) gets
built by taking the size-`(n - 1)` answer as a known-correct starting point and extending it once,
rather than constructing the size-`n` answer from raw materials. Recognizing "take the smaller case,
transform it, don't rebuild from scratch" as the transferable move — not "memorize this specific
mirroring trick for Gray code" — is the actual takeaway worth carrying into whatever
combinatorial-generation problem shows up next, Gray code or not.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
