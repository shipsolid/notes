---
title: "3 — XOR Problems"
description: "Three algebraic properties of XOR — self-inverse, identity, commutative/associative — that turn a handful of hashing-shaped problems into O(n) time, O(1) space one-liners."
tags: ["data-structures-algorithms","bit-manipulation","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-83"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: compared_to
  - slug: data-structures-algorithms/11-bit-manipulation/01-bitwise-operations/01-bitwise-operations
    kind: depends_on
---

# 3 — XOR Problems

Most "find the one that's different" problems reach for a hash set by reflex: insert everything,
whatever's left unpaired (or whatever collides) is the answer, O(n) time and O(n) space. XOR gets
its own chapter because a handful of its algebraic properties collapse that same class of problem to
O(n) time and O(1) space — no set, no map, just a running value and a loop. The catch is that the
trick only fires under a narrow, specific shape: pairs that cancel. This chapter is that shape,
three worked examples of increasing difficulty, and — just as important — where the shape breaks and
you're back to hashing.

---

## The Three Properties That Do All the Work

Everything in this chapter follows from three facts about XOR (`^`), each provable by checking all
four bit combinations (`0^0`, `0^1`, `1^0`, `1^1`):

- **Self-inverse:** `x ^ x == 0`. XOR-ing anything with itself annihilates it.
- **Identity element:** `x ^ 0 == x`. XOR-ing with zero is a no-op.
- **Commutative and associative:** `a ^ b == b ^ a`, and `(a ^ b) ^ c == a ^ (b ^ c)`. Order and
  grouping don't matter — you can XOR a list of values in any sequence and get the same result.

Chain those three together and a direct consequence falls out: **XOR every element of an array
together, and every value that appears an even number of times cancels itself out to `0`, leaving
only the values with odd multiplicity.** Because grouping doesn't matter (associativity), two equal
values anywhere in the sequence — not necessarily adjacent — annihilate each other (self-inverse)
and vanish from the running total without affecting anything else (identity element). Whatever
survives to the end is exactly, and only, the elements that couldn't fully pair off.

That one sentence is the entire chapter. The three worked examples below are three different ways of
setting up an array so that "what's left after everything pairs off" is the answer to the problem —
each one a slightly different application of the same cancellation, not the same problem solved
three times.

---

## Worked Example: Single Number

**Problem:** every element in an array appears exactly twice, except one element that appears
exactly once. Find it.

This is the direct, textbook application of the cancellation rule with nothing else layered on top.
XOR the whole array: every value with a partner cancels to `0`, `0` XORed with anything is a no-op,
so what survives is the one value with no partner.

```python
from functools import reduce


def single_number(nums: list[int]) -> int:
    result = 0
    for x in nums:
        result ^= x
    return result


# single_number([4, 1, 2, 1, 2]) == 4
```

Or, leaning on the same commutative/associative fact that makes the loop order-independent:

```python
def single_number_functional(nums: list[int]) -> int:
    return reduce(lambda acc, x: acc ^ x, nums, 0)
```

**Complexity:** O(n) time, O(1) space — one pass, one integer accumulator.

Contrast that explicitly against the hash-set alternative: insert a value the first time you see it,
remove it if you see it again, and whatever's left in the set at the end is the answer.

```python
def single_number_hashset(nums: list[int]) -> int:
    seen: set[int] = set()
    for x in nums:
        if x in seen:
            seen.remove(x)
        else:
            seen.add(x)
    return seen.pop()
```

Same O(n) time, but O(n) space in the worst case (before pairs start cancelling, the set can hold up
to roughly half the array). This is the textbook case for this chapter's thesis: a problem that
looks like it needs a hash set — "track what I've seen, report what's left unpaired" — has a
strictly better bit-trick solution once you notice the underlying operation is "cancel pairs," which
is exactly what XOR does natively, without ever materializing a data structure to do it.

---

## Worked Example: Missing Number

**Problem:** an array contains `n` distinct numbers drawn from the range `[0, n]` (that's `n + 1`
possible values, so exactly one is missing). Find the missing number.

This is a different setup of the same cancellation idea, not the same problem. There's no
duplicate-pair structure sitting in the input already — you have to manufacture one. XOR the array
elements together with every integer from `0` to `n`, inclusive. Every number that's actually
present in the array shows up exactly twice across the combined sequence — once as an array element,
once as the integer it matches in the `0..n` range — and cancels. The only value left unpaired is
the missing number, which appears once (as an integer in the range) and never (as an array element).

```python
def missing_number(nums: list[int]) -> int:
    n = len(nums)
    result = n  # account for the value n up front, then pair off 0..n-1 against nums
    for i, x in enumerate(nums):
        result ^= i ^ x
    return result


# nums = [3, 0, 1]  (n = 3, range is 0..3, missing is 2)
# result starts at 3
# i=0: result ^= 0 ^ 3  -> cancels the 3 from the seed with the 3 in the array
# i=1: result ^= 1 ^ 0  -> 1 and 0 each appear once here and once as indices/elements
# i=2: result ^= 2 ^ 1  -> 1 cancels again; 2 has no partner anywhere and survives
# missing_number([3, 0, 1]) == 2
```

Walk the derivation once explicitly: the full XOR chain is
`n ^ (0^nums[0]) ^ (1^nums[1]) ^ ... ^ ((n-1)^nums[n-1])`, which — by commutativity/associativity —
is just `(0 ^ 1 ^ ... ^ n) ^ (nums[0] ^ nums[1] ^ ... ^ nums[n-1])`: the XOR of every
index/candidate `0` through `n`, XORed against the XOR of every actual array element. Every present
number appears once in each half and cancels; the missing number appears only in the first half and
survives.

**Complexity:** O(n) time, O(1) space — one pass, no auxiliary set, and notably no need to sort or
use the closed-form sum `n(n+1)/2` (which works but silently risks integer overflow in languages
without Python's arbitrary-precision ints — XOR has no equivalent failure mode).

---

## Worked Example: Single Number III

**Problem:** exactly **two** elements in the array appear once each; every other element appears
exactly twice. Find both single elements.

This is the chapter's centerpiece because the naive extension of the first trick doesn't work. XOR
the whole array and the pairs still cancel — but what's left is `a ^ b`, the XOR of the _two_ unique
values, not either one alone. `a ^ b` doesn't hand you `a` or `b` directly, but it hands you
something almost as good: every bit where `a ^ b` is `1` is a bit where `a` and `b` differ, and any
single one of those bits is enough to split the entire array into two groups — one containing `a`,
the other containing `b` — such that every duplicated pair stays together in the same group (since a
value can't differ from itself, both copies always share every bit, so both copies land in the same
group and cancel there).

The algorithm:

1. XOR the whole array to get `xor_all = a ^ b`.
2. Isolate any one set bit of `xor_all` — the standard trick from
   [[01-bitwise-operations|Part 11, Chapter 1]] is the lowest set bit,
   `diff_bit = xor_all & (-xor_all)`, using two's-complement negation so `-xor_all` flips every bit
   below the lowest set bit and everything above it, leaving exactly that one bit standing after the
   AND.
3. Partition the array into two groups by whether each element has `diff_bit` set, and XOR each
   group independently. Every duplicated value has both copies in the same group (they agree on
   every bit, including `diff_bit`) and cancels; `a` and `b` disagree on `diff_bit` by construction,
   so they land in different groups, each surviving alone in its own group's XOR.

```python
def single_number_iii(nums: list[int]) -> list[int]:
    xor_all = 0
    for x in nums:
        xor_all ^= x                    # xor_all == a ^ b

    diff_bit = xor_all & (-xor_all)     # isolate the lowest set bit where a and b differ

    group_with_bit = 0
    group_without_bit = 0
    for x in nums:
        if x & diff_bit:
            group_with_bit ^= x
        else:
            group_without_bit ^= x

    return [group_with_bit, group_without_bit]
```

Walk it through a concrete example: `nums = [1, 2, 1, 3, 2, 5]`. The unique values are `3` and `5`;
`1` and `2` each appear twice.

- `xor_all = 1 ^ 2 ^ 1 ^ 3 ^ 2 ^ 5`. The two `1`s cancel, the two `2`s cancel, leaving
  `3 ^ 5 = 0b011 ^ 0b101 = 0b110 = 6`.
- `diff_bit = 6 & (-6)`. In binary, `6 = 0b110`; the lowest set bit is `0b010 = 2`. So
  `diff_bit = 2`.
- Partition by bit `0b010`: `3 = 0b011` has it set, `5 = 0b101` does not. `1 = 0b001` does not have
  it set; `2 = 0b010` does.
  - `group_with_bit` (bit set): `2, 3, 2` → `2 ^ 3 ^ 2 = 3` (the two `2`s cancel, `3` survives).
  - `group_without_bit` (bit clear): `1, 1, 5` → `1 ^ 1 ^ 5 = 5` (the two `1`s cancel, `5`
    survives).
- Result: `[3, 5]` — both unique values recovered, order determined by which group the `diff_bit`
  partition put them in.

**Complexity:** O(n) time, O(1) space — two passes over the array (one to compute `xor_all`, one to
partition and XOR each group) and a constant amount of scratch state, same asymptotic profile as
Single Number and Missing Number despite the extra step.

---

## Where XOR Cancellation Stops Being Enough

All three examples share one structural assumption: the input is built from values that appear an
even number of times, plus exactly one or two odd ones out. That assumption is doing all the work,
and it breaks in two common ways:

- **The problem needs to know _which_ elements were duplicates, not just find the singleton.**
  Cancellation is destructive — once two equal values XOR to `0`, there's no way to recover that
  they were both `7`, or how many times `7` showed up before it started pairing off. If the question
  is "return every value that appears more than once" instead of "find the one that doesn't," XOR
  has nothing left to give you; you need an actual frequency count.
- **Elements can repeat more than twice, with arbitrary multiplicities.** The self-inverse property
  only cancels pairs. Three copies of the same value XOR down to one copy of that value
  (`x^x^x = x`), which looks identical to a genuine singleton — the trick can't distinguish
  "appeared three times" from "appeared once." The instant multiplicities aren't constrained to a
  clean "twice, except one (or two)" pattern, cancellation stops being sufficient.

Both failure modes point to the same fallback: a hash-based frequency count, exactly the
[[06-hashing]] techniques from Part 02, Chapter 6 — a `dict` mapping value to count, checked and
updated in one pass, O(n) time and O(n) space. That's strictly worse than the O(1)-space XOR tricks
in this chapter _when the narrow shape applies_ — which is precisely why it's worth recognizing
"even-multiplicity pairs plus one or two odd ones out" as a distinct pattern instead of reaching for
a hash map by default. The moment that shape doesn't hold, there's no shame in the hash map — it's
the more general tool, XOR is the sharper one for a narrower job.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
