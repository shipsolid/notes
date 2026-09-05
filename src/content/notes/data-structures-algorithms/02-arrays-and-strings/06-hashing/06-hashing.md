---
title: "6 — Hashing"
description: "How Python's dict/set turn an O(n) or O(n²) scan into O(1) average-case lookups, when that average case breaks down, and where hashing trades away information — order — that a problem still needs."
tags: ["data-structures-algorithms","arrays-strings","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-11"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/03-two-pointers/03-two-pointers
    kind: related
---

# 6 — Hashing

Every "have I seen this before" or "does the complement of this value already exist" question has an
obvious brute-force answer — scan everything you've seen so far, every time, O(n) per check, O(n²)
overall. Hashing exists to answer exactly that question in O(1): trade a linear scan for a single
array lookup, at the cost of one thing you give up on the way in — order. This chapter is what that
trade actually buys, what it costs, and the two or three shapes it takes in almost every problem
that uses it.

---

## How Hashing Actually Works

A **hash table** maps a key to an array index by running the key through a **hash function** — a
deterministic function that turns an arbitrary key into an integer — then using that integer (modulo
the table's current size) as the index into a backing array of **buckets**. Insert, lookup, and
delete all reduce to "compute the hash, jump straight to that bucket" — no scan required, which is
the entire source of the O(1) claim.

Two keys can hash to the same bucket — a **collision** — and every real hash table has to handle
that. Python's `dict` and `set` use **open addressing**: on a collision, probe a deterministic
sequence of alternative slots (derived from the same hash) until an empty one is found, rather than
chaining a list off each bucket. The practical consequence is the same either way: more collisions
means more probing means each operation costs more than the O(1) ideal.

You don't implement any of this by hand in an interview — `dict` and `set` already are hash tables.
What's worth carrying forward is the mental model: a good hash function spreads keys roughly evenly
across buckets, and "hashing is O(1)" is a claim about _that_ spread holding up, not a law of
nature.

---

## Average Case vs. Worst Case

`dict`/`set` operations are **O(1) average case**, not O(1) full stop — the same worst/average
distinction from [[02-asymptotic-analysis]] (Part 01, Chapter 2) applies here directly. Two things
degrade it:

- **Load factor.** As more keys land in a fixed-size backing array, collisions get more frequent and
  probing gets longer. Python's `dict` resizes its backing array (roughly doubling) once the load
  factor crosses a threshold, migrating every existing key to a fresh, larger table — an O(n)
  operation. Exactly like the dynamic array resize from Part 01, this cost is **amortized** across
  the many cheap inserts between resizes, so "insert is O(1)" survives the same way "`list.append()`
  is O(1)" does: amortized, not per-call-guaranteed.
- **Adversarial or degenerate hashing.** If many keys collide — a broken hash function, or an
  attacker deliberately choosing keys that all hash to the same bucket — every operation degrades
  toward O(n), because every lookup has to probe through the entire collision chain. This is a real
  production concern (hash-flooding denial-of-service against naively-hashed inputs), not just an
  interview footnote, which is why languages randomize their string hash seed per process.

The honest claim, matching the amortized-`append()` pattern from Part 01: "hashing gives O(1)
average lookup," said with the same qualifier you'd give `list.append()` — and for the same
underlying reason, occasional expensive work paid for by many cheap operations.

---

## Worked Example: Two Sum

**Problem:** given an unsorted array and a target, return the indices of two numbers that sum to the
target.

```python
def two_sum(nums: list[int], target: int) -> tuple[int, int]:
    seen: dict[int, int] = {}   # value -> index
    for i, x in enumerate(nums):
        complement = target - x
        if complement in seen:
            return seen[complement], i
        seen[x] = i             # insert AFTER checking — see note below
    raise ValueError("no pair sums to target")
```

**Complexity:** O(n) time, O(n) space — one hash map, one pass, no sort required.

The order matters: check for the complement **before** inserting the current value. Inserting first
would let a value pair with itself when `target == 2 * x` and there's only one copy of `x` in the
array — checking first means index `i` can never accidentally match against itself.

Compare directly against the sorted two-pointer version from [[03-two-pointers]] (Chapter 3, this
same Part): identical O(n) time, but that version needed sorted input (or an O(n log n) sort) to
earn O(1) space. This version handles unsorted input in one pass, spending O(n) space instead. Same
problem, opposite resource paid — the choice between them is a hashing-vs-sorting trade-off you'll
see repeatedly across this book.

---

## Worked Example: Group Anagrams

**Problem:** given a list of strings, group the ones that are anagrams of each other.

Two strings are anagrams if they're built from the same multiset of characters — so any function
that maps every anagram of a word to the _identical_ key, and non-anagrams to different keys, turns
"group by anagram" into "bucket by hash key," one pass:

```python
from collections import defaultdict

def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for s in strs:
        key = "".join(sorted(s))   # canonical form: same for every anagram of s
        groups[key].append(s)
    return list(groups.values())
```

**Complexity:** O(n · k log k) time, where `k` is the max string length (sorting each string
dominates); O(n · k) space for the groups. The sorted string is the **canonical key** — every
anagram of `"eat"` sorts to `"aet"` and lands in the same bucket automatically, with no explicit
pairwise comparison between any two strings at all.

A character-count tuple (`tuple(count of 'a', count of 'b', ...)`) is an O(k) alternative to the O(k
log k) sort as the key — worth naming as a follow-up optimization, though the sorted-string key is
what most people reach for first because a `str` hashes for free and a raw list of counts doesn't.

---

## Worked Example: Encoding Combinations

**Problem (adapted from a numeric-encoding practice question):** given a mapping where `1 → 'A'`,
`2 → 'B'`, ..., `26 → 'Z'`, and a digit string, return every possible letter string it could decode
to (splitting the digits into groups of 1 or 2 in every valid way).

The original version of this problem in practice used three hardcoded, nested nearly-identical loops
— one for a 1-letter result, one for 2-letter, one for 3-letter — which only works for inputs short
enough to fit those three cases and duplicates almost all of its own logic across them. It's a good
example of the trade this chapter is about done half right: the digit→letter lookup itself is a
clean O(1) hash map, but the enumeration wrapped around it doesn't generalize past length 3. The fix
isn't a bigger hashing trick — it's backtracking over every valid split, using the hash map only for
the O(1) group-to-letter step:

```python
def decode_combinations(digits: str) -> list[str]:
    digit_to_letter = {str(i): chr(ord('A') + i - 1) for i in range(1, 27)}

    results: list[str] = []

    def backtrack(index: int, path: list[str]) -> None:
        if index == len(digits):
            results.append("".join(path))
            return
        for group_len in (1, 2):
            group = digits[index:index + group_len]
            if group in digit_to_letter:              # O(1) hash lookup, not a scan
                path.append(digit_to_letter[group])
                backtrack(index + group_len, path)
                path.pop()

    backtrack(0, [])
    return results

# decode_combinations("123") == ["AW", "LC", "ABC"]   (order may vary)
```

**Complexity:** the hashing part — checking whether a 1- or 2-digit group is a valid code — is O(1)
per check. The overall complexity is exponential in the digit-group choices (each position can split
1 or 2 digits), which is expected: this is fundamentally an enumeration problem
([[05-algorithm-design-principles|Part 01, Chapter 5]] covers recognizing that "return all ..."
phrasing means backtracking, not a hashing problem to begin with) — hashing here is doing one small,
honest job (O(1) group validity checks) inside a backtracking shell, not carrying the whole
solution.

---

## When Hashing Is the Wrong Tool

Hashing buys O(1) average lookup by throwing away order entirely — a `dict`'s bucket layout has no
relationship to any ordering of its keys. The moment a problem needs any of the following, reach for
a different structure instead:

- **Sorted iteration or range queries** ("all keys between X and Y") — a hash table can't do this
  without a full scan; a balanced BST ([[03-binary-search-trees]], Part 05) or a sorted structure
  with binary search keeps this O(log n).
- **"What was inserted most/least recently"** — insertion order is coincidental in a plain hash
  table's iteration (Python's `dict` happens to preserve insertion order as an implementation detail
  since 3.7, but that's a property of `dict` specifically, not of hashing as a technique) and
  there's no way to ask "least recently used" from a hash map alone — that's what backs the
  [[05-lru-cache-design|LRU Cache]] design in Part 03, which pairs a hash map with a doubly linked
  list specifically to recover that ordering.
- **Approximate membership at very large scale with a fixed memory budget** — an exact hash set's
  memory grows with the number of keys; [[06-bloom-filter|Bloom Filters]] (Part 12) trade a small,
  tunable false-positive rate for O(1) membership checks in a fixed amount of memory, independent of
  how many keys have been added.

The pattern across all three: hashing answers "is this key present" and "what value maps to this
key" as fast as anything can — the instant a problem also cares about _order_, _sequence_, or a
_bounded memory ceiling regardless of scale_, that's a signal to reach past a plain hash table.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
