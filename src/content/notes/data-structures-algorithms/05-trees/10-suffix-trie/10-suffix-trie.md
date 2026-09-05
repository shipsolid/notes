---
title: "10 — Suffix Trie"
description: "Suffix-indexed trie variant for substring and pattern-matching queries."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-27"
relations:
  - slug: data-structures-algorithms/05-trees/09-trie/09-trie
    kind: related
  - slug: data-structures-algorithms/13-advanced-algorithms/05-string-matching-advanced/05-string-matching-advanced
    kind: related
---

# 10 — Suffix Trie

Chapter 9's trie answered one question well: given a set of whole words, does any of them start with
this prefix? That's the right question when the "words" are dictionary entries, autocomplete
candidates, or IP routing prefixes — a fixed collection of separate strings. But a different
question shows up constantly in string processing: given a _single_ string, does some arbitrary
chunk of it — a substring, not necessarily a prefix or suffix of the whole thing — occur anywhere
inside it? A suffix trie answers that question by making a small, almost sleight-of-hand move: it
stops treating the input as one string, and instead treats it as a _set_ of strings — every suffix
of itself — and feeds that set into the exact trie from Chapter 9.

---

## The Core Idea: Every Substring Is a Prefix of Some Suffix

Take `"banana"`. Its suffixes are what you get by chopping off characters from the front, one at a
time, until nothing's left:

```
banana
 anana
  nana
   ana
    na
     a
```

Six suffixes for a six-character string — in general, a string of length `n` has exactly `n`
suffixes (including the full string itself, and excluding the empty string). A **suffix trie**
inserts every one of them into an ordinary trie, using precisely the `insert()` from Chapter 9 —
nothing about the insert operation changes.

The payoff is a small but genuinely useful piece of reasoning: **every substring of the original
string is, by definition, a prefix of at least one of its suffixes.** Take any substring — say
`"nan"` from `"banana"`. It has to start somewhere in the original string (index 2, here), and
everything from that starting index to the end of the string _is_ a suffix (`"nana"`). `"nan"` is
the first three characters of that suffix — a prefix of it. This isn't a special property of
`"nan"`; it's true of every substring of every string, because "the suffix starting where the
substring starts" always exists and always has the substring as its prefix.

So once all `n` suffixes are sitting in the trie, "does this substring exist anywhere in the
original string" stops being a new problem. It's exactly Chapter 9's `startsWith()` — walk the query
characters down the trie, and if every character finds an edge, the substring occurs somewhere in
the original string. The trie doesn't even need to know, or care, which suffix originally supplied
the path being walked. That's the whole idea. Everything else in this chapter is about what that
idea costs, and what people actually reach for instead once it starts to hurt.

---

## Construction Cost: O(n²) Naively

Chapter 9 established that inserting a single string of length `L` costs `O(L)`. A suffix trie
inserts `n` strings — the suffixes — of lengths `n, n-1, n-2, ..., 2, 1`. The total work is the sum
of those lengths:

```
n + (n-1) + (n-2) + ... + 2 + 1 = n(n+1)/2 = O(n²)
```

That quadratic term is the honest cost of the naive construction, and it's worth naming precisely
_why_ it's quadratic rather than linear, because the reason is structural, not incidental. A trie's
whole efficiency argument rests on shared prefixes collapsing into shared paths — `"car"` and
`"cart"` share the `c-a-r` chain in Chapter 9's trie, so the shared portion is stored once. Suffixes
of the same string share far less than you'd hope. `"a"` — the last character of `"banana"` — is a
complete suffix on its own, sharing nothing with the six-character suffix `"banana"` except that it
happens to be its final letter; there is no meaningful prefix overlap between a length-6 string and
a length-1 string for the trie to exploit. Compare that to Chapter 9's use case, where the whole
point was a _dictionary_ of genuinely distinct, comparably-sized words sharing real common prefixes
(`"car"`, `"card"`, `"care"`, `"careful"`). Suffixes of one string are a much worse case for the
trie's core assumption, and the `O(n²)` node count is the direct consequence: each new suffix mostly
carves out its own path, rather than reusing an existing one.

`O(n²)` space follows the same logic — the total number of trie nodes created is bounded by the
total characters inserted across all suffixes, which is that same `n(n+1)/2` sum.

For a short string like `"banana"` this is nothing — 21 characters of total suffix length is a
non-issue. But `n²` growth is exactly the kind of cost that looks academic right up until it isn't:
a suffix trie over a 100,000-character document is on the order of five billion characters of total
suffix length. A genome-scale string, or a large log corpus, makes the naive suffix trie non-viable
long before it makes any other trie in this book non-viable. This is the central honest takeaway of
the whole chapter — the idea is correct and the mechanism is exactly Chapter 9's trie, but the naive
construction doesn't scale, and knowing _why_ it doesn't (no meaningful prefix sharing between
suffixes of wildly different lengths) is what motivates everything in the next section.

---

## Substring Queries: O(m)

The query side is the one piece of genuinely good news, and it doesn't depend on `n` at all. Once
the trie is built — however expensive that build was — answering "does substring `S` of length `m`
occur anywhere in the original string" costs exactly `O(m)`: walk `S` character by character down
the trie from the root, following edges, exactly like Chapter 9's `startsWith()`. If the walk falls
off the trie (no edge for the next character) before consuming all of `S`, the substring doesn't
occur. If the walk consumes all of `S`, it does — the path that succeeded belongs to whichever
suffix (or suffixes) happen to have `S` as a prefix, and the trie was never tracking which one that
was, because it didn't need to.

This is the payoff that makes the `O(n²)` build cost bearable _if_ you're doing it once and querying
many times against a fixed string that's small enough to afford the build — the query cost is
independent of `n` entirely, same as Chapter 9's prefix queries were independent of the dictionary
size. The asymmetry is the whole trade being made: pay a possibly-large one-time construction cost
to get cheap, repeatable substring existence checks afterward.

---

## What Production Systems Actually Use: Suffix Trees and Suffix Arrays

The naive suffix trie is the right _first_ mental model, but nobody ships it. Two more practical
structures solve the same underlying problem — the O(n²) storage blowup — and both are worth knowing
exist, without building either from scratch here.

A **suffix tree** starts from the exact same set of suffixes, but compresses every non-branching
chain of single-character trie nodes into one edge labeled with a whole substring, instead of one
edge per character. Where the naive suffix trie gives `"banana"` and `"a"` two almost entirely
separate paths, a suffix tree collapses the long unbranching stretches into single labeled edges,
which is what brings the space usage down from `O(n²)` to `O(n)`. The construction algorithm that
achieves this in `O(n)` time — Ukkonen's algorithm — is one of the more intricate classical
algorithms in string processing; it's genuinely `O(n)`, but the implementation complexity is real,
which is exactly why this chapter names it rather than builds it.

A **suffix array** takes a different, more pragmatic route: instead of a tree at all, it's a simple
sorted array of the starting indices of every suffix, ordered by the suffixes' lexicographic order.
Substring search becomes a binary search over that array (comparing the query against the suffix
starting at each candidate index), which trades away some of the query flexibility a full suffix
tree offers in exchange for far better memory locality — a flat array of integers, not a graph of
heap-allocated nodes — and a much simpler construction and mental model. This is the structure most
production string-search tooling actually reaches for: search engine indexes, bioinformatics
pipelines doing genome alignment, and other large-corpus substring workloads tend to use suffix
arrays (often paired with an auxiliary LCP — longest common prefix — array) rather than a literal
suffix tree, precisely because the simplicity and cache-friendliness win in practice even though the
asymptotic query complexity is comparable.

Both structures are advanced enough, and specialized enough — genome sequencing, full-text search
indexes, plagiarism detection, and similar large-corpus pattern-matching domains — that they sit
above the standard interview bar; they show up more at L6+ system-design-adjacent string-processing
questions than in a standard coding round. The related family of pattern-matching algorithms this
chapter deliberately doesn't cover — KMP, Rabin-Karp, and the string-matching techniques suffix
arrays get paired with in practice — get real, worked treatment in [[05-string-matching-advanced]]
(Part 13, Chapter 5). This chapter's job was narrower and more foundational: establish that "throw
every suffix of a string into a trie" is a coherent, correct idea, and be honest about exactly where
it stops scaling and what replaces it when it does.

---

## Worked Example

Build a naive suffix trie for `"banana"` and use it to answer one substring query: does `"nan"`
occur anywhere in `"banana"`?

```python
class SuffixTrieNode:
    def __init__(self):
        self.children: dict[str, "SuffixTrieNode"] = {}
        self.is_suffix_end = False


class SuffixTrie:
    """Naive suffix trie: O(n^2) construction, O(m) substring queries."""

    def __init__(self, text: str):
        self.root = SuffixTrieNode()
        self.text = text
        self._build()

    def _build(self) -> None:
        n = len(self.text)
        for start in range(n):                 # n suffixes: text[0:], text[1:], ..., text[n-1:]
            self._insert(self.text[start:])

    def _insert(self, suffix: str) -> None:
        node = self.root
        for ch in suffix:                       # O(len(suffix)) per insert — Chapter 9's insert()
            if ch not in node.children:
                node.children[ch] = SuffixTrieNode()
            node = node.children[ch]
        node.is_suffix_end = True

    def contains_substring(self, query: str) -> bool:
        """O(m) walk — identical shape to Chapter 9's startsWith()."""
        node = self.root
        for ch in query:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True                             # fell off nowhere → query is a prefix of some suffix


trie = SuffixTrie("banana")

print(trie.contains_substring("nan"))   # True  — prefix of the suffix "nana"
print(trie.contains_substring("ana"))   # True  — prefix of the suffix "anana" (and of "ana" itself)
print(trie.contains_substring("ban"))   # True  — prefix of the full string / suffix "banana"
print(trie.contains_substring("nab"))   # False — never occurs as a substring of "banana"
```

Tracing `contains_substring("nan")`: the suffixes inserted were `banana`, `anana`, `nana`, `ana`,
`na`, `a`. The suffix `"nana"` contributes the path `root → n → a → n → a` (with `is_suffix_end` set
on the final `a`). Querying `"nan"` walks `n → a → n` — three edges, all present, because they're
exactly the first three characters of the `"nana"` path — and returns `True` after three steps,
regardless of the fact that the path also continues on to a fourth character. The walk never needed
to know it was riding along the suffix that started at index 2; it only needed the edges to exist.
Querying `"nab"` walks `n → a`, then looks for a `b` child of that `a` node and doesn't find one
(the only children of that particular `a` are `n`, from `"nana"`/`"ana"`, and none from `"nab"`,
which never occurs) — the walk falls off the trie and correctly returns `False`.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
