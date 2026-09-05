---
title: "9 — Trie"
description: "Prefix tree structure that makes 'does any word start with this' as cheap as exact-match lookup — insert/search/startsWith in O(L), autocomplete via DFS, and the memory trade-off against a plain hash set."
tags: ["data-structures-algorithms","trees","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-37"
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: related
  - slug: data-structures-algorithms/14-interview-problem-patterns/18-trie-pattern/18-trie-pattern
    kind: related
---

# 9 — Trie

A hash set of words answers "have I seen exactly `car`" in O(1) average time —
[[06-hashing|Part 02, Chapter 6]] built that guarantee on a function that scatters keys evenly
across buckets. Ask that same hash set "has any word I've stored ever started with `ca`" and it has
no better answer than checking every single key it holds, one `str.startswith` call at a time. A
**trie** (also "prefix tree," pronounced either "try" or "tree" depending who you ask) is the
structure built specifically to close that gap: it arranges strings so that asking about a prefix
costs exactly the same as asking about a whole word. This chapter builds one from a bare node up
through insert, search, and prefix search, then spends it on the one problem it was built for —
autocomplete — and surveys where else "cheapest possible prefix query" turns out to be exactly the
primitive a real system needs.

---

## The Problem Hashing Can't Solve: Prefix Queries

Chapter 6's closing section named the general shape of this gap without making it concrete: hashing
buys O(1) average lookup by throwing away **order** entirely — a hash table's bucket layout has no
relationship to any ordering of its keys, so anything that needs sorted iteration, range queries, or
"most/least recent" has to reach past a plain hash table for a structure that keeps that ordering
around. A prefix query is that same gap, applied to strings instead of numbers: `hash("car")` and
`hash("ca")` are computed independently and land in unrelated buckets — nothing about where `"car"`
sits in the table tells you anything about where `"ca"`, `"c"`, or any other prefix of it would sit.
Two strings that share every character but their last one can hash to opposite ends of the table.

That means "does any stored word start with this prefix" has no shortcut in a hash set — you check
every key:

```python
def any_word_starts_with(words: set[str], prefix: str) -> bool:
    return any(w.startswith(prefix) for w in words)   # O(N · L) — every key, every time
```

**O(N · L)**, where `N` is the number of stored words and `L` is the prefix length — a full scan,
the exact cost hashing exists to eliminate for exact-match lookups, reappearing the instant the
question changes from "is this key present" to "is this key's _prefix_ present." A trie fixes this
by physically arranging storage around prefixes instead of whole keys: every string that shares a
prefix with another literally shares the nodes that represent that prefix, so walking to a prefix's
node is the query — there's no separate step where you'd need to check anything against the other
keys stored nearby, because there's no "nearby" in the hash-table sense at all.

---

## Structure: Shared Prefixes, One Character Per Level

The core idea that makes a trie different from every tree in this Part so far: **a node doesn't
represent a whole key.** It represents one character position along some string, and the path from
the root to a node spells out the prefix that node represents. Each node holds two things:

- **A mapping from "next character" to "next node."** Either a `dict[str, TrieNode]` — any alphabet,
  case-sensitive or not, Unicode included, pay one hash lookup per character — or, when the alphabet
  is known and small (lowercase English letters only, say), a fixed-size `list` of 26 slots indexed
  by `ord(ch) - ord('a')`. The array version trades memory for speed in a specific way: it always
  allocates all 26 slots whether two are used or twenty-six are, but reading a slot is direct
  indexing with no hash computation at all — a real trade in a language where hashing costs more
  than an array read, less of one in Python, where `dict` is already a heavily optimized C
  structure. Both are shown below; the dict version is what the rest of this chapter builds on.
- **A boolean, `is_end_of_word`.** This is the flag that distinguishes "a complete word was inserted
  ending exactly here" from "this is merely a waypoint on the path to some longer word." Without it,
  a trie couldn't tell the difference between a prefix that happens to also be a stored word and a
  prefix that's only ever been _part of_ something longer.

```python
class TrieNode:
    def __init__(self) -> None:
        self.children: dict[str, "TrieNode"] = {}
        self.is_end_of_word: bool = False
```

```python
class TrieNodeArray:
    """Fixed-alphabet variant: lowercase a-z only, 26 slots, no hashing per child lookup."""
    def __init__(self) -> None:
        self.children: list["TrieNodeArray | None"] = [None] * 26
        self.is_end_of_word: bool = False

    @staticmethod
    def index(ch: str) -> int:
        return ord(ch) - ord("a")
```

Notice what each child lookup actually is in the dict version: `node.children[ch]` is itself the
O(1) average-case hash lookup [[06-hashing|Part 02, Chapter 6]] built. A trie doesn't avoid hashing
— it chains L of those O(1) hash lookups together, one per character, and adds the one thing a flat
hash set never had: a tree structure _across_ those lookups, so that the first `k` of them, on their
own, already tell you whether any stored word shares that `k`-character prefix.

**Shared prefixes are physically shared storage.** Insert `"car"`, then insert `"card"`:

```
root
 └─ c
     └─ a
         └─ r  (is_end_of_word = True)   ← "car" ends here
             └─ d  (is_end_of_word = True)   ← "card" ends here
```

`"car"` is stored exactly once — three nodes, `c → a → r` — and `"card"` doesn't repeat any of that;
it just hangs one more node, `d`, off the node that `"car"` already ended at. The `r` node's
`is_end_of_word = True` records "car is itself a complete word," and that flag stays `True` even
after `"card"` is inserted and `r` grows a child — the two facts ("car is a word" and "car is also a
prefix of something longer") are independent and both true at once, which is exactly why the flag
lives on every node rather than only on leaves. A trie with no leaves that are also flagged words
would be a contradiction only if words could never be prefixes of other words — but `"car"`/`"card"`
is the ordinary case, not an edge case.

---

## Insert, Search, and startsWith

All three operations do the identical walk — start at the root, consume the input one character at a
time, follow the matching child — and differ only in what happens once the walk ends.

```python
class Trie:
    def __init__(self) -> None:
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()   # create the path as we walk it
            node = node.children[ch]
        node.is_end_of_word = True               # mark: a complete word ends exactly here

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.is_end_of_word

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None

    def _walk(self, s: str) -> "TrieNode | None":
        """Follow s one character at a time from the root. None if the path breaks early."""
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node
```

`insert` is the only one of the three that ever creates nodes; `search` and `starts_with` share the
exact same read-only walk (`_walk`) and differ only in the one-line check performed once the walk
succeeds — `search` additionally requires `is_end_of_word`, `starts_with` doesn't care.

```python
>>> t = Trie()
>>> t.insert("car")
>>> t.insert("card")
>>> t.insert("care")
>>> t.insert("cat")

>>> t.search("car")
True                 # "car" was inserted, and its node is flagged is_end_of_word
>>> t.search("ca")
False                # "ca" is a real path in the trie, but no word ends there
>>> t.starts_with("ca")
True                 # the path c -> a exists, regardless of any flag
>>> t.search("care")
True
>>> t.starts_with("card")
True
>>> t.starts_with("cars")
False                # the path breaks: no 's' child under "car"
>>> t.search("card")
True
```

`search("ca")` returning `False` while `starts_with("ca")` returns `True` is the entire point of the
flag made concrete: the path `c → a` genuinely exists (it's a shared prefix of every word above),
but no `insert` call ever set `is_end_of_word = True` on that particular node, because `"ca"` itself
was never one of the inserted words.

---

## Complexity: O(L), Independent of N

`insert`, `search`, and `starts_with` are all **O(L) time**, where `L` is the length of the word or
prefix being processed — and, critically, that bound has **no `N` in it at all**. Whether the trie
holds three words or three million, walking `"card"` still touches exactly four nodes, because each
step follows one child pointer determined entirely by the next character, never branching out to
compare against sibling words. `insert` is the same O(L) walk, plus O(1) work per character to
create a node if one isn't already there.

Set this directly against the hash-set version from the first section:

| Operation                    | Hash set of whole words       | Trie                           |
| ---------------------------- | ----------------------------- | ------------------------------ |
| Exact match (`search`)       | O(L) average (hash the key)   | O(L) (walk L nodes)            |
| Prefix query (`starts_with`) | **O(N · L)** — scan every key | **O(L)** — identical to search |
| Insert                       | O(L) average                  | O(L)                           |

A hash lookup is _also_ roughly O(L) — you have to hash every character of the key before you get a
bucket index — so exact-match performance is a wash between the two structures. The entire reason to
reach for a trie is the second row: a hash set **cannot** answer a prefix query without falling back
to an O(N · L) scan of every key it holds, full stop, no cleverer hash-set-only trick avoids it —
the information a prefix query needs (which keys share this beginning) was thrown away the moment
each key was hashed independently. A trie's `starts_with` is exactly as cheap as its `search`: O(L),
the same bound, the same walk, just without the final flag check.

---

## The Space Trade-off

Sharing prefixes is only a win when there's actually something to share. This cuts both ways, and
it's worth stating plainly rather than treating "trie" as a strictly-better upgrade from "hash set":

- **A trie of unrelated random strings shares almost nothing.** `"xqz"`, `"mfk"`, `"plr"` — no
  common prefixes at all — means every single character of every string gets its own fresh
  `TrieNode`, each one carrying a `dict` (or a 26-slot array) plus a boolean. That per-node overhead
  is real: a Python `dict` object costs meaningfully more than the handful of bytes a hash set
  spends storing one reference to an interned string. For a corpus with no meaningful prefix
  overlap, a trie routinely costs **more** total memory than a hash set holding the same strings,
  for zero query benefit — you paid the structural cost and never used the sharing it was supposed
  to buy.
- **A trie of heavily-overlapping words shares deeply.** A real dictionary, an autocomplete corpus
  pulled from actual search queries, a set of file paths under a few common directories — these have
  enormous prefix overlap by construction (English words cluster around common roots and affixes;
  paths cluster under shared directories). There, the number of _distinct nodes_ the trie needs to
  allocate is far smaller than the total character count summed across every word, because every
  shared prefix is one path walked by many words instead of one path stored per word. In that regime
  a trie can end up **more** memory-efficient than a hash set, which pays for every character of
  every string independently no matter how much those strings overlap.

The honest framing: a trie's space cost is a function of how much genuine prefix structure exists in
the data, not a fixed multiplier on word count. Reach for one when the workload is prefix-shaped
_and_ the data has the kind of overlap that makes sharing pay off — a dictionary, a URL/path set, an
autocomplete corpus — not as a default upgrade over a hash set for arbitrary string storage.

---

## Worked Example: Autocomplete

Autocomplete is "find every complete word stored under a given prefix" — which splits cleanly into
the two things a trie is already good at: walk to the prefix's node in O(L) (exactly `_walk` above),
then explore everything beneath that node collecting words as they're found. That second half is a
depth-first walk of the subtree — the same one-node-then-recurse-into-each-child shape as preorder
traversal from [[02-binary-trees|Chapter 2]], adapted from a fixed two-child `left`/`right` shape to
a trie node's variable-width `children` mapping.

```python
class Trie:
    # ... __init__, insert, search, starts_with, _walk as above ...

    def autocomplete(self, prefix: str) -> list[str]:
        """All complete words stored under prefix, prefix included if it's itself a word."""
        node = self._walk(prefix)
        if node is None:
            return []                       # no word in the trie even starts with prefix
        results: list[str] = []
        self._collect(node, prefix, results)
        return results

    def _collect(self, node: "TrieNode", path: str, results: list[str]) -> None:
        """Preorder DFS: visit this node (record it if it's a complete word),
        then recurse into every child — same shape as Chapter 2's preorder,
        with a dict of children standing in for left/right."""
        if node.is_end_of_word:
            results.append(path)
        for ch, child in node.children.items():
            self._collect(child, path + ch, results)
```

```python
>>> t = Trie()
>>> for w in ["car", "care", "cart", "card", "cat", "cats", "dog"]:
...     t.insert(w)

>>> t.autocomplete("ca")
['car', 'care', 'cart', 'card', 'cat', 'cats']   # order depends on dict insertion order
>>> t.autocomplete("cat")
['cat', 'cats']
>>> t.autocomplete("do")
['dog']
>>> t.autocomplete("dx")
[]                                                # no path at all — _walk returns None
```

Walking `"ca"` costs O(2) — two characters, two hops from the root, landing on the node shared by
every word above that starts with `c`, `a`. From there, `_collect` visits exactly the subtree rooted
there: every node reachable from `"ca"`'s node, which is bounded by the total number of characters
across the words that actually share that prefix — not by `N`, the total word count in the whole
trie, and not by any word that doesn't share the prefix at all (`"dog"` is never touched). Total
cost for `autocomplete(prefix)` is O(L) to walk down plus O(K) to collect, where `K` is the size of
the matching subtree — as small as the matching result set genuinely is, never larger.

---

## Real-World Use Cases

Autocomplete is the canonical trie example, but the same "cheap prefix query" primitive shows up
wherever a system needs to reason about the _beginning_ of a key rather than the whole key:

- **Spell-checkers.** "Is this word in the dictionary, or something close to it" starts with exactly
  the `search` this chapter built; the "or something close" part layers a bounded edit-distance walk
  on top — instead of following only the one child matching the next typed character, follow every
  child within a small budget of substitutions/insertions/deletions, pruning branches whose
  accumulated edit cost already exceeds the budget. The trie's job is unchanged: give the walk a
  structure where "everything within a few edits of this prefix" is a small, nearby region of the
  tree instead of a full scan of the whole dictionary.
- **IP routing tables — longest-prefix match.** A router's forwarding table is keyed by network
  prefixes (`10.0.0.0/8`, `10.1.0.0/16`, `10.1.2.0/24`), and the forwarding decision for a
  destination address uses whichever stored prefix is the **longest** match — the most specific
  route wins. This is a trie built over the bits (or bytes) of an address instead of characters of a
  word: walk the bit-trie as far as the destination address matches, remembering the deepest node
  flagged as a valid stored route along the way, and forward using that remembered route once the
  walk ends. It's the same `is_end_of_word`-style flag as this chapter's trie, with "keep the _last_
  flagged node seen, not just the first" standing in for autocomplete's "collect every flagged node
  in the subtree."
- **T9-style predictive text.** Old phone keypads mapped each digit to a small set of letters (`2` →
  `abc`, `7` → `pqrs`); typing a digit sequence narrows down a restricted set of candidate words. A
  trie over the _digit_ sequence (rather than the letter sequence) lets each keystroke walk one
  level deeper, with `autocomplete`'s subtree-collection producing the candidate word list after
  every digit typed — the exact same shape as this chapter's example, with the input alphabet
  swapped from 26 letters to 10 digits and a many-letters-per-digit mapping applied on top.

[[18-trie-pattern|Part 14, Chapter 18]] catalogs the interview-problem shapes that signal "reach for
a trie" — word search on a grid with a dictionary, longest common prefix across a list, and
word-break style problems all rely on nothing more than the
insert/search/`starts_with`/`autocomplete` machinery built in this chapter.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
