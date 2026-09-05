---
title: "3 — Huffman Coding"
description: "Building a provably optimal prefix-free code by repeatedly merging the two least-frequent symbols off a min-heap — the exchange argument behind it, and where this exact construction runs inside gzip, JPEG, and MP3 today."
tags: ["data-structures-algorithms","greedy","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-72"
relations:
  - slug: data-structures-algorithms/05-trees/11-heap/11-heap
    kind: depends_on
---

# 3 — Huffman Coding

[[01-greedy-strategy|Chapter 1]] named the two conditions — the greedy-choice property and optimal
substructure — that license a sequence of locally-best, never-revisited choices as a correct
algorithm rather than a plausible-looking guess. [[02-interval-scheduling|Chapter 2]] and
[[05-fractional-knapsack|Chapter 5]] both build on that vocabulary, and both share a specific shape:
sort the input once by whatever quantity the exchange argument needs, then scan it once. Huffman
coding is the third instance of the same license, and it doesn't share that shape — there's no
single sort, only a frequency table consumed down to one node through repeated pairwise merges,
driven by a priority queue rather than a sorted list. It's also not graded on a textbook exercise's
terms: this exact construction is the entropy-coding stage inside gzip, JPEG, and MP3, running on
real bytes today rather than showing up only in interview rooms. What follows is the construction,
the exchange argument that makes it provably optimal, and the one property — prefix-freedom — that
makes the whole idea decodable in the first place.

---

## The Problem: Prefix-Free Codes That Beat Fixed-Length

Given `n` distinct characters, each with a known frequency (or weight) `f_i`, assign every character
a binary codeword so as to minimize the total encoded length `Σ f_i · len(code_i)` — equivalently,
the expected code length per symbol if the frequencies are normalized into probabilities. Two
constraints shape the answer, and they pull in the same direction:

**Frequent characters should get short codes.** A fixed-length code — every character gets the same
number of bits, the way plain ASCII does — ignores frequency entirely. Five distinct characters need
`⌈log₂ 5⌉ = 3` bits each under a fixed-length scheme, whether one of them accounts for half the
input or all five are perfectly uniform: `3n` bits total regardless of skew, and skew is exactly
where compression opportunity lives — a character showing up in half the input wastes two bits it
didn't need to spend, every single time it appears.

**The code has to stay decodable without delimiters.** Once codeword lengths vary, decoding a
concatenated bitstream requires knowing where one codeword ends and the next begins, and nothing in
the bitstream itself marks that boundary. The fix isn't punctuation (that would cost bits of its
own); it's a structural guarantee called **prefix-free**: no codeword is a prefix of any other
codeword. Drop that guarantee and decoding breaks in a way no cleverness can patch. Take `a = 0`,
`b = 1`, `c = 01` — every code used, no two symbols sharing a code — and try to decode `01`: read
greedily and it's `a` then `b`; read it whole and it's `c`. Both parses are legal, and nothing in
the stream resolves which one was meant, because `c` is literally `a`'s codeword followed by `b`'s.

That structural guarantee is also the whole reason the greedy construction below works at all: a
prefix-free code corresponds exactly to a binary tree with every character at a **leaf**, nowhere
else, where a codeword is the root-to-leaf path — `0` for every left edge, `1` for every right edge.
Because only leaves carry symbols, no root-to-leaf path can ever be a prefix of another: reaching a
second symbol requires passing through the first symbol's leaf, and leaves have no children to pass
through. Confine every symbol to a leaf and prefix-freedom is automatic, not something checked
afterward — building an optimal prefix-free code is nothing more than building this tree with the
right shape.

---

## The Greedy Construction: Repeatedly Merge the Two Cheapest Nodes

[[11-heap|Part 05, Chapter 11]] derived `push` and `pop` as O(log n) sift operations over an
array-backed complete tree, with the minimum always sitting at index `0`. This chapter takes all of
that as given and spends its greedy step on the one question `heap.md` deliberately didn't need to
ask: what should get pushed, popped, and merged, and why is that specific choice safe?

The construction: seed a min-heap with one leaf node per character, keyed by frequency. Then, while
more than one node remains in the heap, pop the two smallest, create a new internal node whose
frequency is their sum and whose two children are the popped nodes, and push that merged node back
in. Stop when exactly one node is left — the root of the finished tree.

```python
import heapq
from dataclasses import dataclass
from typing import Optional


@dataclass
class Node:
    freq: int
    char: Optional[str] = None
    left: Optional["Node"] = None
    right: Optional["Node"] = None

    @property
    def is_leaf(self) -> bool:
        return self.char is not None


def build_huffman_tree(frequencies: dict[str, int]) -> Node:
    """Repeatedly merge the two least-frequent nodes until one remains — the root."""
    counter = 0  # tie-breaker: heapq needs a total order, and Node has none of its own
    heap: list[tuple[int, int, Node]] = []
    for char, freq in frequencies.items():
        heapq.heappush(heap, (freq, counter, Node(freq=freq, char=char)))
        counter += 1

    while len(heap) > 1:
        freq1, _, left = heapq.heappop(heap)
        freq2, _, right = heapq.heappop(heap)
        merged = Node(freq=freq1 + freq2, left=left, right=right)
        heapq.heappush(heap, (merged.freq, counter, merged))
        counter += 1

    return heap[0][2]
```

The `counter` tie-breaker is not decoration. `heapq` orders its tuples element by element, and the
moment two nodes have equal frequency, Python falls through to comparing the second element — if
that's the `Node` itself, comparing two dataclass instances raises `TypeError`, since nothing says
one `Node` should sort before another. A strictly increasing counter guarantees every tuple is
comparable without the comparison ever touching a `Node`.

Every merge takes the two cheapest available nodes off the heap — cheapest in the sense that matters
for total cost, since a node's frequency is exactly the weight it contributes to every codeword
built on top of it. Building a full binary tree bottom-up this way from `n` leaves takes exactly
`n - 1` merges: each merge consumes two nodes and produces one, so the node count shrinks by one per
merge, starting at `n` and ending at `1` — `n` leaves, `n - 1` internal nodes, `2n - 1` nodes total,
the standard shape of any full binary tree.

Contrast the mechanism against [[02-interval-scheduling|Chapter 2]] and
[[05-fractional-knapsack|Chapter 5]]'s single-sort-then-scan greedy: there, the processing order is
fixed the moment the sort finishes, because the sort key doesn't change as the algorithm runs. Here
it can't work that way — after the first merge, a brand-new node exists whose frequency didn't
appear anywhere in the original input, and it has to compete for the next merge on equal footing
with everything still unmerged. A one-time sort can't express that; a priority queue that supports
repeated insert-and-extract-min can. The complexity lands in the same family either way
(`O(n log n)`), but the mechanism generating it is genuinely different — `n - 1` heap operations at
`O(log n)` each, rather than one sort followed by a scan.

### Worked Example: Building the Tree, the Code Table, and a Round Trip

Take the string `"abracadabra"` (11 characters) and count frequencies:
`a: 5, b: 2, r: 2, c: 1, d: 1`. Tracing `build_huffman_tree` by hand: `c` and `d` (both `1`) are
smallest, so they merge first into a node of frequency `2`. Next, `b` and `r` (both `2`) merge into
frequency `4`. Now the two smallest available are the `{c, d}` node (`2`) and the `{b, r}` node
(`4`), merging into frequency `6`. Finally, `a` (`5`) and that frequency-`6` node merge into the
root (`11`) — matching the string's length, since every leaf's frequency is counted exactly once at
the root regardless of tree shape.

```python
def build_code_table(root: Node) -> dict[str, str]:
    codes: dict[str, str] = {}

    def walk(node: Node, path: str) -> None:
        if node.is_leaf:
            codes[node.char] = path or "0"  # single-symbol edge case: root is itself a leaf
            return
        walk(node.left, path + "0")
        walk(node.right, path + "1")

    walk(root, "")
    return codes


def encode(text: str, codes: dict[str, str]) -> str:
    return "".join(codes[ch] for ch in text)


def decode(bits: str, root: Node) -> str:
    decoded: list[str] = []
    node = root
    for bit in bits:
        node = node.left if bit == "0" else node.right
        if node.is_leaf:
            decoded.append(node.char)
            node = root  # reset to the top for the next codeword
    return "".join(decoded)
```

`build_code_table` walks the tree once, appending `"0"` at every left branch and `"1"` at every
right branch, and records a codeword only at a leaf — precisely the root-to-leaf path promised
above. The `path or "0"` fallback handles the degenerate single-symbol input, where the walk never
branches at all; without it, that symbol would get the empty string as its code, encoding and
decoding nothing.

Running it:

```python
>>> text = "abracadabra"
>>> frequencies = {"a": 5, "b": 2, "r": 2, "c": 1, "d": 1}
>>> root = build_huffman_tree(frequencies)
>>> codes = build_code_table(root)
>>> codes
{'a': '0', 'c': '100', 'd': '101', 'b': '110', 'r': '111'}
>>> bitstring = encode(text, codes)
>>> bitstring
'01101110100010101101110'
>>> len(bitstring)
23
>>> decode(bitstring, root) == text
True
```

`decode` walks from the root one bit at a time, following `left`/`right` as the tree dictates, and
the moment it lands on a leaf it has an unambiguous symbol — prefix-freedom guarantees no earlier
partial path could have been mistaken for a different, shorter codeword, so the walk never guesses
or backtracks. It resets to `root` and continues, and the entire 23-bit stream decodes back to
`"abracadabra"` with no delimiters anywhere in it.

Twenty-three bits for eleven characters is the number worth sitting with: a fixed-length code over
five symbols needs `⌈log₂ 5⌉ = 3` bits per character regardless of frequency — `33` bits total for
the same string. Huffman's 23 bits is a 30% reduction, and nearly all of it comes from `a` — the
most frequent symbol, at nearly half the string — costing a single bit instead of three. That's the
entire mechanism made concrete: frequency skew converted directly into fewer bits, with no ambiguity
introduced.

**Complexity:** `O(n log n)` for `n` distinct characters. Building the tree costs `n - 1` merges,
each doing two pops and one push against a heap that never holds more than `O(n)` entries, so each
merge is `O(log n)` and the whole build is `O(n log n)`. Building the code table is one traversal of
a tree with `2n - 1` nodes — `O(n)`. Encoding text of length `m` is `O(m)` dictionary lookups;
decoding a bitstring of length `L` is `O(L)`, since each bit advances the walk by one tree edge and
every codeword's length is bounded by the tree's height.

---

## Why This Is Provably Optimal: The Exchange Argument

The claim: among all binary trees with these `n` characters at the leaves, the one this algorithm
builds minimizes `Σ f_i · depth_i`. The proof is the same tool [[05-fractional-knapsack|Chapter 5]]
used for the ratio-greedy claim — an exchange argument — applied to tree structure instead of a
continuous allocation.

**Greedy-choice property, for this problem:** there exists an optimal tree in which the two globally
least-frequent symbols, call them `x` and `y`, are siblings at the tree's maximum depth. Take any
optimal tree `T`. Every full binary tree has at least one pair of sibling leaves at its maximum
depth — if a deepest leaf's sibling weren't also a leaf at that depth, that leaf's parent could be
replaced by the leaf itself, strictly shortening the tree and lowering cost, contradicting `T`'s
optimality. Call that pair `a` and `b`. Because `x` and `y` are the two globally smallest
frequencies, `f_x ≤ f_a` and `f_y ≤ f_b`; because `a` and `b` sit at the maximum depth,
`depth_a ≥ depth_x` and `depth_b ≥ depth_y` for wherever `x` and `y` currently sit. Swap `x` into
`a`'s position: the change in total cost is `(f_x − f_a) · (depth_a − depth_x)`, a product of two
non-positive terms, so cost never increases. The same swap for `y` and `b` likewise never increases
cost, and afterward `x` and `y` occupy the sibling pair `a`, `b` used to hold — at the maximum
depth, with total cost no worse than `T`'s. An optimal tree with `x` and `y` as deepest siblings
exists, which is exactly the pair this algorithm's first merge always picks off the heap.

**Optimal substructure:** once `x` and `y` are merged into a node `z` with frequency `f_x + f_y`,
the remaining problem — an optimal tree over the `n − 1` symbols left, `z` standing in for `x` and
`y` — is a smaller instance of the identical problem. Expanding `z`'s leaf back into an internal
node with `x` and `y` as children adds a fixed cost of `f_x + f_y` on top of whatever the reduced
problem's optimal cost was, regardless of that reduced tree's shape, because every other symbol
keeps its depth and only `x`, `y` move one level deeper than `z` sat. A cheaper full-problem tree
would, by the greedy-choice property just proven, itself have `x` and `y` as deepest siblings —
collapse that pair back into `z` and it would beat the reduced problem's optimum too, a
contradiction. So an optimal reduced-problem solution really does expand into an optimal
full-problem solution, which licenses solving the reduced problem the same way, recursively, down to
a single node. That recursion, run bottom-up instead of top-down, is exactly the loop in
`build_huffman_tree`: merge the two cheapest nodes, treat the merged node as a single unit going
forward, repeat.

Prefix-freedom rides along for free through this argument. Every tree considered is a full binary
tree with characters confined to leaves — the swap relocates leaves, and the merge/expand step
always attaches exactly two children to a new internal node — so the "symbols only at leaves"
invariant this chapter opened with is never broken. The optimality proof and the decodability
guarantee are two payoffs of the same tree-shape constraint, not two things argued independently.

---

## Where Huffman Coding Actually Runs — and Where It Stops Working

This isn't an algorithm that only shows up in textbooks. DEFLATE — behind gzip, zip, and PNG — runs
LZ77 back-reference matching first to squeeze out repeated substrings, then Huffman-codes the
resulting stream of literals, lengths, and distances with two separate trees per block. Baseline
JPEG runs a discrete cosine transform and quantization to discard perceptually unimportant
high-frequency detail, then Huffman-codes the quantized, run-length-encoded coefficients that
remain. MP3 runs a psychoacoustic model to discard inaudible frequency content, quantizes what's
left, and Huffman-codes the result with tables selected per audio granule. The pattern repeats:
Huffman coding is always the last stage, entropy-coding whatever statistical redundancy survives
after a format-specific transform has already done the heavy lifting — a general-purpose "squeeze
the remaining skew out of a symbol stream" tool, bolted onto very different pipelines because the
same guarantee is useful regardless of what produced the stream.

The limitation sits in exactly what this chapter built: one static tree, built once from one
frequency table, held fixed for the rest of the stream it covers. That table has to come from
somewhere — a full pass over the data before encoding starts, with the resulting tree traveling
alongside the compressed data, or a fixed table agreed on in advance — and either way it stops
adapting the moment it's built. If the true symbol distribution drifts partway through a stream — a
text file that changes language, an image with sharply different regions — the fixed tree quietly
stops being optimal for whatever comes later, and plain Huffman coding has no mechanism to notice.

Two techniques close that gap, named here but beyond this chapter's scope: **adaptive Huffman
coding** (the Vitter/FGK family) rebuilds the tree incrementally as each symbol is processed, with
no separate counting pass and nothing to transmit up front; **arithmetic coding**, and its modern
successor range coding, drop the constraint this whole chapter operated under — that every codeword
needs a whole number of bits — encoding a message as a single fractional-precision number instead
and getting arbitrarily close to the Shannon entropy limit, which is Huffman's ceiling even when
it's built perfectly.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
