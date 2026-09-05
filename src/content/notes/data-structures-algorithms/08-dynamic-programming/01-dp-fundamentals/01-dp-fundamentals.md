---
title: "1 — DP Fundamentals"
description: "Overlapping subproblems and optimal substructure defined precisely and shown to be independent properties, naive Fibonacci's recursion tree counted exactly with a call-counter to make the states-versus-total-calls gap numeric rather than asserted, why state definition — not the recurrence — is the actual design decision, and memoization vs. tabulation named as the two standard ways to implement any DP recurrence."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-58"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/05-algorithm-design-principles/05-algorithm-design-principles
    kind: depends_on
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/03-recursion/03-recursion
    kind: depends_on
---

# 1 — DP Fundamentals

[[05-algorithm-design-principles|Part 01, Chapter 5]] gave dynamic programming one paragraph and a
promise: a minimal staircase-counting example just big enough to show the shape of the idea, plus an
explicit note that state definition, recurrence derivation, and space optimization would get their
own chapter once the survey was done naming paradigms. This is that chapter. What follows is not
"recursion, but faster" — it's the two specific, independent properties a problem has to have before
dynamic programming applies at all, made numeric rather than asserted, and the one design decision
(defining the state) that every other chapter in this Part gets to treat as already solved by the
time it starts writing down a recurrence.

---

## State, Transition, and Base Case

Three terms carry the rest of this Part, and they need fixed meanings before anything else gets
built on top of them.

**State** is the minimal information needed to fully describe one subproblem — everything that
subproblem's answer depends on, and nothing more. For Fibonacci, the state is just the single
integer `n`: knowing `n` is enough to know exactly what `fib(n)` is asking for, no other context
required. Later chapters get away with more dimensions — a 2D grid path problem's state is a pair
`(row, col)`, a knapsack's state is a pair `(item_index, remaining_capacity)` — but the definition
doesn't change: state is whatever minimally pins down a subproblem.

**Transition** (used interchangeably with **recurrence** in this book) is the equation expressing a
state's answer in terms of smaller states' answers:

```
fib(n) = fib(n - 1) + fib(n - 2)
```

**Base case** is the smallest state (or states) whose answer is known directly — fixed by the
problem's definition, not derived by applying the transition to anything smaller. Fibonacci needs
two of them, because its transition looks back two states at a time: `fib(0) = 0` and `fib(1) = 1`.
[[03-recursion|Part 01, Chapter 3]] already covered what base case and recursive case do to the call
stack, frame by frame; that mechanics isn't getting re-derived here. What that chapter didn't need
to ask, and this one does: why does _this particular_ recursive structure explode, and what does the
explosion have to do with calling it dynamic programming?

---

## Overlapping Subproblems, Counted Exactly

Write the transition above as plain recursion and instrument it to print every call, indented by
recursion depth:

```python
def fib(n, depth=0):
    print("  " * depth + f"fib({n})")
    if n <= 1:                        # base case
        return n
    left = fib(n - 1, depth + 1)       # recursive case
    right = fib(n - 2, depth + 1)
    return left + right

fib(5)
```

```
fib(5)
  fib(4)
    fib(3)
      fib(2)
        fib(1)
        fib(0)
      fib(1)
    fib(2)
      fib(1)
      fib(0)
  fib(3)
    fib(2)
      fib(1)
      fib(0)
    fib(1)
```

[[03-recursion|Part 01, Chapter 3]] already named the mechanism: branching factor 2, depth `n`,
roughly `2^n` total calls. That tree makes it visible — `fib(2)` shows up three separate times, and
`fib(1)` shows up five times, each one a full, independent re-derivation of an answer this recursion
already computed somewhere else in the tree. Don't trust that by eye; add a counter instead of a
printer:

```python
call_count = {}

def fib(n):
    call_count[n] = call_count.get(n, 0) + 1
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

fib(5)
print(call_count)
```

```
{5: 1, 4: 1, 3: 2, 2: 3, 1: 5, 0: 3}
```

Six distinct states get touched — `fib(0)` through `fib(5)` — and the calls against them sum to 15,
not 6. That gap, between **6 distinct states** and **15 total calls**, is **overlapping
subproblems** made numeric: the same state gets recomputed many times over by naive recursion,
purely because nothing checks whether it's already been solved before recursing again.

This is exactly the property [[05-algorithm-design-principles|Part 01, Chapter 5]]'s
divide-and-conquer does not have. That chapter's merge sort recurrence, `T(n) = 2·T(n/2) + O(n)`,
splits the array into two genuinely disjoint halves — every recursive call operates on a slice of
the array no other call will ever touch, so nothing is ever recomputed and there is nothing to
cache. Overlapping subproblems is precisely the case where the "divide" step's subproblems stop
being disjoint: two different call paths land on the identical state, and naive recursion, having no
memory of the first visit, pays the full cost of solving it again. That's the entire reason naive
divide-and-conquer-style recursion on a DP problem goes exponential where merge sort's stays
`O(n log n)` — and it's why something has to change before this recursion is usable past toy-sized
`n`.

The blowup gets worse fast, and it's worth seeing at more than one `n`:

```python
def fib_calls(n):
    calls = [0]
    def fib(n):
        calls[0] += 1
        if n <= 1:
            return n
        return fib(n - 1) + fib(n - 2)
    fib(n)
    return calls[0]

for n in (5, 10, 15, 20):
    print(n, n + 1, fib_calls(n), 2 ** n)
```

```
5 6 15 32
10 11 177 1024
15 16 1973 32768
20 21 21891 1048576
```

Read the columns as `n`, distinct states (`n + 1`), total calls, and `2^n`. Distinct states grow
**linearly** — 21 of them at `n = 20` — while total calls grow **exponentially**: 21,891 calls to
answer a question that only ever has 21 genuinely different versions. Total calls stay comfortably
under `2^n` at every `n` here (21,891 versus 1,048,576) because the tighter bound is actually
golden-ratio-based — the call count satisfies the same shape of recurrence as Fibonacci itself, and
grows as `φⁿ` (`φ ≈ 1.618`) rather than `2ⁿ`. `O(2^n)` is still the number worth carrying forward:
it's the practical, safe-to-cite bound, and the gap between it and the tighter `φⁿ` growth doesn't
change the conclusion — both are exponential in `n`, and `n + 1` is not.

---

## Optimal Substructure — a Separate Property

**Optimal substructure** holds when an optimal solution to the whole problem can be assembled from
optimal solutions to its subproblems — not just _some_ solution stitched from _some_ sub-answers,
but specifically the _best_ sub-answers combining into the _best_ overall answer. That distinction
is what justifies the entire DP move: once a state's optimal answer is cached, later work is
licensed to trust that cached number outright and never reconsider how it was derived, precisely
because no other route to that state could have produced something worth reconsidering.

This is a genuinely separate property from overlapping subproblems, and a problem can have one
without the other.

Merge sort is the clean demonstration. It has optimal substructure — merging two optimally-sorted
halves produces an optimally-sorted whole, by construction, with no other way to combine two sorted
sequences into a cheaper sorted result — and it has no overlapping subproblems at all, per the
disjoint-halves argument above. Optimal substructure by itself, without overlap, is just a correct
divide-and-conquer algorithm. It doesn't need memoizing, because nothing about it ever repeats.

For a case where optimal substructure is the property actually doing the work, look at
[[04-shortest-path|Part 06, Chapter 4]]'s Dijkstra relaxation step. Reaching a node cheaply through
some earlier node is only worth recording if that earlier node's _own_ distance is the true shortest
distance to it — not merely _some_ distance found so far. The relax step,
`if dist + weight < distances[neighbor]`, is a bet that the shortest path to `neighbor` can be
assembled by extending the shortest path to `node` by one edge, and that bet paying off, every time,
is optimal substructure in action.

Now the contrast that shows the property can fail outright: **longest simple path** between two
nodes in a general graph looks like the same shape — extend the longest path to some earlier node by
one more edge — but it isn't, because "simple" forbids repeating a node, and the longest simple path
to an intermediate node might already use up a node the extension to the target also needs. Gluing
two locally-longest simple paths together can produce a walk that revisits a node, which is no
longer a simple path at all. There is no way to assemble a global optimum from cached local optima
here, because those local optima can actively conflict with each other in a way that shortest-path
sums never do — which is a real part of why longest-simple-path is NP-hard on general graphs while
shortest path is solved in polynomial time.

---

## Why State Definition Is the Actual Hard Part

Once a state is correctly defined, the transition is usually close to mechanical — it falls out of
asking "what are the choices available from this state, and which smaller states do they lead to?"
The genuine design decision, the one that actually separates a solved DP problem from an unsolved
one, is choosing what the state _is_: how many dimensions it needs, and what each dimension has to
track.

Get that choice wrong in either direction and it shows up as a specific, recognizable failure:

- **Underspecified state** — the state doesn't carry enough information for the transition to be
  answerable from it, so the recurrence produces a wrong or unanswerable result. That's a
  correctness bug, not a performance one.
- **Overspecified state** — the state carries dimensions the transition never actually consults, and
  every unnecessary dimension multiplies how many states get computed and cached for no benefit.
  That's a cost bug: correct, but heavier than the problem requires.

A one-line change in phrasing is enough to move a problem from one dimension to two. "Minimum number
of coins to make change for amount `X`" needs only `X` as state — the answer for `X` depends only on
answers for smaller amounts. Change the problem to "minimum number of coins to make change for
amount `X`, using at most `K` coins total," and `X` alone stops being enough: two different partial
solutions can reach the same remaining amount having already spent a different number of coins, and
only one of them might still have room left under the `K` limit. The state has to become the pair
`(X, K)` before the transition is even answerable. Nothing about the recurrence's _shape_ changed —
coins are still chosen one at a time and the remainder still shrinks — but the state it operates
over gained a dimension the first phrasing never needed. [[04-knapsack-problems|Chapter 4]] is where
a full worked example builds a multi-dimension state like this from scratch; this is the
one-paragraph reason that chapter needs more than one axis at all.

---

## Top-Down vs. Bottom-Up: Two Ways to Implement a Recurrence

Once a state and its transition are both pinned down, there are exactly two standard ways to
actually execute that recurrence in code, and this chapter's job stops at naming them.

**Memoization** is recursion plus a cache: write the recurrence almost exactly as the math reads,
wrap it with a lookup that returns a cached answer immediately if this state has already been
solved, and otherwise compute it once and store it before returning. It runs **top-down** — starting
from the state the problem actually asks for and working backward toward base cases — and it's
**lazy**: only the states genuinely reachable from that original call ever get computed.

**Tabulation** is an explicit table — usually an array or grid shaped like the state space — filled
in **iteratively**, starting from the base cases and working forward, so that by the time any cell
is computed, every smaller state its transition depends on is already sitting in the table. It runs
**bottom-up**, and unlike memoization it typically fills every state in the table's range, whether
or not the original question strictly needed each one.

Both are answers to the identical problem: the overlapping-subproblems blowup traced above. Naive
recursion recomputes `fib(2)` three times and `fib(1)` five times because it never checks whether
that work has already been done; memoization and tabulation are two different disciplines for making
sure the same question never gets asked twice. [[02-memoization|Chapter 2]] and
[[03-tabulation|Chapter 3]] each get a full chapter — implementation patterns, and the
recursion-depth cost memoization pays that tabulation doesn't. This chapter's only job was
establishing that the choice exists, and what problem both sides of it are solving.

---

## Recognizing a DP Problem: A Checklist

Three questions, asked in order, on every problem from this point in the book onward:

1. **Can you define a state?** Is there a minimal, fixed-shape description of "one subproblem" that
   the answer depends on and nothing more?
2. **Does naive recursion on that state recompute the same state repeatedly?** Trace the brute-force
   recursion on a small input, the way the Fibonacci trace above did, and check whether the same
   state shows up on more than one call path. That's overlapping subproblems.
3. **Can a correct or optimal answer to a state be assembled from correct or optimal answers to
   smaller states?** That's optimal substructure — a genuinely separate check from question 2, per
   the merge sort / longest-simple-path contrast above.

Yes to all three, and it's a dynamic programming problem, full stop, regardless of how the problem
statement happens to be phrased on the page. [[05-algorithm-design-principles|Part 01, Chapter 5]]'s
phrasing table ("count the number of ways to...", "minimum/maximum given you must choose at each
step...") is a fast first guess at which paradigm a new problem wants; this three-question checklist
is the actual verification once that guess needs confirming. And once confirmed,
[[02-memoization|Chapter 2]] and [[03-tabulation|Chapter 3]] are the two implementation strategies
from the previous section — the only two ways this book solves a DP problem once its state,
transition, and base case are pinned down.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
