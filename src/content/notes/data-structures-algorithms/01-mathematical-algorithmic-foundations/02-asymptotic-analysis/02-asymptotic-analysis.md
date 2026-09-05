---
title: "2 — Asymptotic Analysis"
description: "Why Big-O is really shorthand for Big-Theta, how worst/average/best case turns 'what's the complexity' into three different questions, and the feasibility ladder that tells you whether a brute-force idea will even finish running."
tags: ["data-structures-algorithms","foundations","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-2"
---

# 2 — Asymptotic Analysis

Ask any interviewer "what's the time complexity of this loop" and they are almost never asking for a
merely-valid upper bound — they're asking for the tight one. Big-O, Big-Omega, and Big-Theta
describe three different things, and conflating them is how a candidate confidently says "O(n²)"
about an algorithm that actually runs in O(n) and isn't technically wrong — just useless. This
chapter is about the difference between a bound that's true and a bound that communicates something,
and about the single fastest way to tell, from a glance at code or a stated input constraint,
whether a brute-force idea will even finish running before the interview does.

---

## Big-O, Big-Theta, Big-Omega

**Big-O — O(g(n)) — is an upper bound.** Past some input size n₀, f(n) never exceeds c·g(n) for a
constant c: "grows no faster than this." It does not say f(n) actually grows that fast — a
linear-time algorithm is technically O(n²) too, and O(n¹⁰), and O(2ⁿ). All true, all useless for
comparing algorithms, because Big-O alone lets you describe a fast algorithm with a slow-sounding
bound and not be wrong.

**Big-Omega — Ω(g(n)) — is a lower bound.** f(n) never drops below c·g(n) past some n₀ — "grows at
least this fast." It's the mirror image of Big-O, and it's what you reach for to argue a problem
_can't_ be solved faster than some bound: any comparison-based sort is Ω(n log n), full stop,
regardless of implementation.

**Big-Theta — Θ(g(n)) — is a tight bound.** f(n) = O(g(n)) _and_ f(n) = Ω(g(n)) simultaneously —
sandwiched between c₁·g(n) and c₂·g(n). This is what "the complexity of the algorithm" actually
means in the sense everyone intends: not a ceiling, but the true growth rate, up to constant
factors.

When an interviewer says "what's the Big-O of this," they mean Big-Theta. Say "O(n log n)" about
mergesort and you're understood; say "O(n²)" and you're also technically correct — and it'll be
marked wrong, because it fails to communicate what mergesort does. Speak in the tightest bound you
can prove; that's what the question is actually asking for.

---

## Worst, Average, and Best Case

A complexity bound describes a function of input _size_ — but at a fixed size, an algorithm's actual
runtime depends on _which_ input, not just how large it is. "What's the complexity of quicksort" is
an incomplete question until you specify which case:

- **Best case:** the pivot always splits the array into two roughly equal halves. Quicksort does
  O(log n) levels of partitioning, each level doing O(n) work total — **O(n log n)**.
- **Average case:** across random inputs, pivots are "good enough" often enough that the expected
  runtime is also O(n log n) — this is the number people mean when they call quicksort "O(n log n)"
  with no qualifier attached.
- **Worst case:** the pivot is always the smallest or largest remaining element — which happens
  _deterministically_ on an already-sorted (or reverse-sorted) array if the implementation just
  picks the first or last element as pivot. Every partition splits n elements into a group of 1 and
  a group of n−1. That's n levels instead of log n, each doing O(n) work — **O(n²)**.

This is why "what's the complexity" asked cold is underspecified, and why a strong answer names the
case. It's a real production gotcha too, not just an interview trick: naive quicksort degrades to
quadratic on inputs that are already sorted — pre-sorted IDs, timestamps, log lines — which is why
production sorts use randomized pivots or introsort (falls back to heapsort once recursion depth
signals a bad case) instead of trusting average-case behavior on data they don't control.

---

## The Complexity Class Ladder

Every complexity class you'll see in an interview sits on this ladder, cheapest to most expensive:

| Class      | Example algorithm / problem                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| O(1)       | Hash map lookup, array index by position                                             |
| O(log n)   | Binary search on a sorted array                                                      |
| O(√n)      | Trial-division primality test                                                        |
| O(n)       | Single pass / linear scan (find max, sum an array)                                   |
| O(n log n) | Comparison-based sorting (mergesort, heapsort, quicksort average)                    |
| O(n²)      | Nested-loop pairwise comparison (bubble sort, brute-force "any pair sums to target") |
| O(2ⁿ)      | Enumerating all subsets — brute-force subset-sum, power set                          |
| O(n!)      | Enumerating all permutations — brute-force traveling salesman                        |

The table that actually earns its keep in an interview is the feasibility one. Given roughly 10⁸–10⁹
simple operations per second as a budget and a ~1 second time limit, here's the largest n that
finishes:

| Class                   | Largest feasible n (~1s budget)                   |
| ----------------------- | ------------------------------------------------- |
| O(1) / O(log n) / O(√n) | effectively unbounded — n in the billions is fine |
| O(n)                    | ~10⁸                                              |
| O(n log n)              | ~10⁶–10⁷                                          |
| O(n²)                   | ~10⁴                                              |
| O(2ⁿ)                   | ~20–25                                            |
| O(n!)                   | ~10–11                                            |

This is the single most useful heuristic for "will this brute force pass." The moment a problem
states `n ≤ 10⁵`, that constraint is a hint, not a footnote — it's ruling out O(n²) and demanding
O(n log n) or better. `n ≤ 20` is a giant flashing sign that the intended solution is exponential,
almost always bitmask DP over subsets. Read the constraints before you read the problem statement
twice; they tell you which shelf of this ladder you're allowed to stand on.

---

## Reading Complexity Directly From Code

You should be able to derive complexity from code shape without running anything:

- **Sequential loops add — and you drop the lower-order term.** Two independent O(n) loops back to
  back is O(n) + O(n) = O(2n) = O(n). An O(n) loop followed by an O(n²) one sums to O(n²) — as n
  grows the linear term becomes insignificant next to the quadratic one, so you report only the
  dominant term.
- **Nested loops multiply.** A loop of length n containing a loop of length m is O(n·m); two nested
  loops both over n is O(n²); three nested loops over n is O(n³).
- **A loop that halves its range each iteration is O(log n).** `while n > 1: n //= 2` runs ⌈log₂ n⌉
  times — independent of how much work happens inside one iteration, which is a multiplicative
  factor on the log, not an addition to it.
- **Recursion: count calls × work per call.** Write the recurrence and reason informally — no need
  for a full Master Theorem derivation on a whiteboard. Binary search makes one recursive call per
  level with O(1) work outside it: T(n) = T(n/2) + O(1) → O(log n) levels → **O(log n)**. Merge sort
  makes two recursive calls per level plus O(n) work merging: T(n) = 2T(n/2) + O(n) → O(log n)
  levels × O(n) work each → **O(n log n)**. Naive recursive Fibonacci makes two recursive calls per
  level with no useful work combining them: T(n) = 2T(n−1) + O(1) → the call tree doubles at every
  one of n levels → **O(2ⁿ)**. The **Master Theorem** formalizes this for any T(n) = a·T(n/b) + f(n)
  by comparing f(n) against n^(log_b a) — worth knowing it exists for an unusual recurrence, but
  counting branching factor and per-call work by hand is faster in an interview than reciting it.

---

## Space Complexity

- **Auxiliary space vs. input space.** Input space is what you were handed — the array itself.
  Auxiliary space is everything you allocate beyond that: a hash set, a second array, a recursion
  stack. "Space complexity" means auxiliary space — quoting O(n) because "the input is size n" is
  technically true and communicates nothing, since you didn't choose it and can't reduce it.
- **In-place vs. not.** An algorithm is in-place if its auxiliary space is O(1) (or O(log n) for a
  shallow recursion stack) — it rearranges the input within memory it already occupies rather than
  building a new structure. In-place quicksort (O(log n) recursion stack) against mergesort (needs
  an O(n) auxiliary buffer to merge two sorted halves) is the classic contrast: identical O(n log n)
  time, different space profile — a real reason to pick one over the other under a memory
  constraint.
- **Call stack depth counts as space.** Every recursive call pushes a frame; that's real memory, not
  "free" just because there's no explicit array in the code. A recursive function with depth n uses
  O(n) auxiliary space whether or not it allocates anything else — an unbounded recursion is exactly
  how a correct-looking solution blows the stack on a large input. Stack-frame mechanics and
  converting recursion to iteration belong to the Recursion chapter (chapter 3 of this Part); the
  short version here is: count it.

---

## Amortized Analysis: Why list.append() Is O(1)

Dynamic arrays (Python `list`, Java `ArrayList`, C++ `vector`) back their storage with a
fixed-capacity array. Appending when there's spare capacity is O(1) — write to the next slot, bump a
length counter. But capacity runs out eventually, and when it does, the array resizes: allocate a
new backing array (typically 1.5–2× the old capacity), copy every existing element across, then
perform the append. That resize is O(n).

So a single append is either O(1) or O(n) depending on whether it triggers a resize — worst case for
one specific call is O(n). But "what's the worst case of a single call" is the wrong question if
what you actually want to know is "what happens if I call this n times."

Amortized analysis answers that: spread the occasional expensive resize over the many cheap appends
that led up to it. With geometric growth (doubling), resizes happen at sizes 1, 2, 4, 8, ..., n — a
series whose total copying cost across n appends sums to O(1+2+4+...+n) ≈ O(2n) = O(n). Divide that
by n appends and the _amortized_ cost per append is O(1) — not because any single append is
guaranteed cheap, but because the expensive ones become exponentially rarer exactly as fast as they
become more expensive, and the two effects cancel.

This is why "`list.append()` is O(1)" survives a real interview follow-up — as long as you say
"amortized." The honest worst-case answer for one call is O(n), and the follow-up is checking
whether you know the difference. The same shape — cheap guaranteed work per operation, plus
occasional cleanup paid for by everything since the last cleanup — is what "amortized O(1)" means
anywhere else you'll see the phrase.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
