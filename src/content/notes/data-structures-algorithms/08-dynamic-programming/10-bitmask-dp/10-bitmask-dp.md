---
title: "10 — Bitmask DP"
description: "DP whose state is a bitmask over which of n items are already accounted for — worked through the Traveling Salesman Problem and the Assignment Problem — plus the harder skill of recognizing when a subset, not an index or a range, is the axis a problem actually needs."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607241159-59"
relations:
  - slug: data-structures-algorithms/11-bit-manipulation/04-bitmasking/04-bitmasking
    kind: depends_on
  - slug: data-structures-algorithms/08-dynamic-programming/01-dp-fundamentals/01-dp-fundamentals
    kind: depends_on
---

# 10 — Bitmask DP

[[04-bitmasking|Part 11, Chapter 4]] closed with a preview: the Traveling Salesman Problem, solved
by making a subset — not an index, not a pair of indices — the axis a DP table is built over. That
chapter's job stopped at the mechanics: a mask is an integer, `dp[mask][i]` is an array lookup, and
folding a new element into the state costs one OR. It promised the transition would get proved out
properly here, along with how the table is laid out and how to recover the actual tour, not just its
cost. This chapter delivers that, plus the harder thing a single worked example can't teach on its
own: how to recognize, on a problem this book hasn't shown yet, that "which of these n things is
already accounted for" is the state axis it wants — the way
[[01-dp-fundamentals|Part 08, Chapter 1]] used a single integer for Fibonacci and a pair `(X, K)`
for coin change under a coin-count limit. A bitmask is what that axis looks like when the thing a
state has to track isn't a count or a position but a _set_, and the set is small enough — under
about twenty elements — to fit in one machine word.

---

## The State: `dp[mask][...]` as "This Subset Is Done"

Apply [[01-dp-fundamentals|Part 08, Chapter 1]]'s vocabulary to this specific shape of problem.
**State** is the minimal information needed to describe one subproblem. For a recognizable class of
problems, part of that minimal information is inherently a set, not a number: which cities has the
tour already visited, which items has the knapsack already packed and discarded, which jobs has the
schedule already placed. Left as a Python object, that's a `set[int]` — hashable enough to key a
memoization dict, but not usable as a plain array index, and expensive to copy and compare on every
transition.

The move [[04-bitmasking|Part 11, Chapter 4]]'s bijection sets up is to stop treating "which subset"
as a set object and start treating it as the integer that names it. `dp[mask]` — or `dp[mask][i]`
when the state also needs to remember one distinguished element within the subset, the way TSP needs
to remember which city the tour is currently standing at — reads directly off that integer with no
hashing and no set-equality check, just arithmetic and array indexing. The general shape of a
bitmask DP transition is always some version of:

```
dp[mask | (1 << j)][...] = best(dp[mask | (1 << j)][...], dp[mask][...] + cost of adding j)
```

for every `j` not yet a member of `mask`, where `best` is `min` or `max` depending on the problem.
What varies from problem to problem is what else the state needs beyond `mask` (TSP needs a current
city; the assignment problem below needs nothing else at all), and what "cost of adding `j`"
actually costs. The base case is always the state where only the starting element or elements are
set, given an identity value directly rather than derived; the final answer is always read off
`dp[full_mask][...]`, where `full_mask = (1 << n) - 1` is the state where every element has already
been accounted for.

---

## Worked Example: The Traveling Salesman Problem

`n` cities, a cost matrix `cost[i][j]`, find the cheapest tour that visits every city exactly once
and returns to where it started. TSP is the canonical bitmask DP problem because its natural state
is exactly the shape the previous section described, with one extra wrinkle: the tour's cost depends
not only on which cities are already visited, but on which one the tour is currently standing at,
because that's what determines the cost of the next hop.

**State:** `dp[mask][i]` = the minimum cost of a path that has visited exactly the cities in `mask`,
currently standing at city `i` — where `i` must itself be a member of `mask`, since a path can't be
standing somewhere it hasn't visited.

**Transition:** from `(mask, i)`, extend the path to any city `j` not yet in `mask`:

```
dp[mask | (1 << j)][j] = min(dp[mask | (1 << j)][j], dp[mask][i] + cost[i][j])
```

**Base case:** `dp[1 << 0][0] = 0` — city `0` fixed as the start, the mask containing only city `0`,
nothing spent yet. Fixing the start at city `0` rather than trying all `n` possible starts is not a
simplification that loses generality: a tour is a cycle, so it costs the same total regardless of
which city on it is labeled "first."

**Final answer:** `min` over every city `i` of `dp[full_mask][i] + cost[i][0]` — the cost of the
cheapest path that has visited every city, ending anywhere, plus the cost of closing the loop back
to city `0`.

```python
from math import inf

def tsp(cost: list[list[int]]) -> tuple[int, list[int]]:
    """Minimum-cost tour and the tour itself, via bitmask DP."""
    n = len(cost)
    full = (1 << n) - 1

    # dp[mask][i]: min cost of a path that has visited exactly the cities
    # in mask, currently standing at city i (i must be a member of mask).
    dp = [[inf] * n for _ in range(1 << n)]
    parent = [[-1] * n for _ in range(1 << n)]  # dp[mask][i] was reached from parent[mask][i]

    dp[1 << 0][0] = 0  # start: only city 0 visited, standing at city 0, nothing spent

    for mask in range(1 << n):
        for i in range(n):
            if dp[mask][i] == inf or not (mask & (1 << i)):
                continue  # unreachable state, or i isn't even a member of mask
            for j in range(n):
                if mask & (1 << j):
                    continue  # j already visited — a simple tour can't revisit it
                new_mask = mask | (1 << j)
                new_cost = dp[mask][i] + cost[i][j]
                if new_cost < dp[new_mask][j]:
                    dp[new_mask][j] = new_cost
                    parent[new_mask][j] = i

    best_cost, best_end = inf, -1
    for i in range(n):
        candidate = dp[full][i] + cost[i][0]  # close the tour back to city 0
        if candidate < best_cost:
            best_cost, best_end = candidate, i

    # Walk parent pointers backward from (full, best_end) to recover the visiting order.
    order: list[int] = []
    mask, city = full, best_end
    while city != -1:
        order.append(city)
        mask, city = mask & ~(1 << city), parent[mask][city]
    order.reverse()

    return best_cost, order
```

`dp` and `parent` are written above as lists of lists purely for readability — `dp[mask][i]` is
exactly equivalent to a single flat array of length `n · 2ⁿ` indexed by `mask * n + i`, and nothing
about the transition depends on which layout is chosen. What the 2D shape can't be collapsed away is
the second dimension itself: `dp[mask]` alone isn't enough state, because two different paths that
have visited the identical set of cities can be standing at different cities, and only one of those
endpoints is cheap to extend toward any given unvisited `j`. `dp` only ever stores costs, so
recovering the tour itself needs the parallel `parent` table — one predecessor city per
`dp[mask][i]` entry, populated exactly when that entry improves — and reconstruction is a backward
walk from the winning `(full, best_end)` state, removing one city from the mask at each step, until
the base case's sentinel `-1` is reached.

---

## Complexity: Beating `n!` Without Escaping Exponential

Count the work directly from the loop nesting. There are `2ⁿ` distinct masks. For each mask, the
middle loop tries up to `n` possible current cities `i`. For each `(mask, i)` pair that's actually
reachable, the inner loop tries up to `n` possible next cities `j`. That's `O(n² · 2ⁿ)` time. Space
is one dimension lighter than that, because it only has to hold the table, not the work of filling
it: `n` entries per mask, `2ⁿ` masks, `O(n · 2ⁿ)` total.

Put a real `n` through both this and the brute-force alternative — try every permutation of cities
and keep the cheapest — to see why the exponent is worth paying. At `n = 20`: `2²⁰ ≈ 1,048,576`
masks, times `n² = 400`, is `419,430,400` — about `4 × 10⁸` array operations, a few seconds of real
work in Python and near-instant in a compiled language. The permutation approach, at the same
`n = 20`, is `20! = 2,432,902,008,176,640,000` — roughly `2.4 × 10¹⁸`, about **5.8 billion times**
more work than the bitmask DP's operation count. `20!` is not a number a computer finishes counting
through in this universe's remaining lifetime; `2²⁰ · 400` is a coffee break. The DP wins because it
never actually enumerates orderings — the reason TSP admits a `dp[mask][i]` state at all is that the
cost of finishing a tour from `(mask, i)` doesn't depend on which of the `mask`-many possible
orderings got the path to `i`, only on the fact that it's there having spent `dp[mask][i]`. Every
one of those `~2ⁿ · n!/2ⁿ` distinct orderings collapses onto the same handful of `(mask, i)` states,
and that collapse — not a faster inner loop — is the entire source of the speedup, in exactly the
same way [[01-dp-fundamentals|Part 08, Chapter 1]]'s overlapping-subproblems count showed Fibonacci
states being revisited rather than genuinely distinct.

None of that makes bitmask TSP fast in an absolute sense — it's still exponential, and the exponent
still wins eventually. `n = 25` pushes `n² · 2ⁿ` past `2 × 10¹⁰`, already uncomfortable; `n = 30` is
close to `10¹²`; `n = 40` is not something worth starting. The honest framing, consistent with
[[04-bitmasking|Part 11, Chapter 4]]'s own ceiling, is that bitmask DP moves TSP from "impossible"
to "exactly solvable for `n` in the high teens to low twenties" — a real, large win over brute
force, and still a hard wall a few `n` past where this chapter's arithmetic stops.

---

## Worked Example: The Assignment Problem

`n` workers, `n` tasks, a cost matrix `cost[worker][task]`, assign every worker exactly one task —
each task used once — minimizing total cost. The same "which subset is done" recognition applies,
and the worked example is worth walking through specifically because its state ends up simpler than
TSP's, for a reason worth naming rather than shrugging off as coincidence.

**State:** `dp[mask]` = the minimum cost of assigning the tasks in `mask` to the first
`popcount(mask)` workers — workers `0` through `popcount(mask) - 1` — where `popcount` counts the
set bits in `mask`.

The trick is in that definition, not in the transition: workers get assigned in a fixed order, `0`
first, then `1`, and so on, so the identity of "which worker is next" is never a free choice the
state needs to track separately — it's derivable from `mask` alone, as `popcount(mask)`. That's the
contrast with TSP worth sitting with. TSP's current city genuinely can't be derived from `mask`,
because several different cities can each be the endpoint of some path that has visited that exact
set — `i` is real, independent information, so it earns its own array dimension. The assignment
problem's "current worker" carries no such freedom, so it costs nothing to track and needn't be
stored at all.

**Transition:** from `mask` with `popcount(mask) = k` workers already assigned, assign worker `k` to
any task `j` not yet in `mask`:

```
dp[mask | (1 << j)] = min(dp[mask | (1 << j)], dp[mask] + cost[k][j])
```

**Base case:** `dp[0] = 0` — no workers assigned, no tasks used, nothing spent. **Final answer:**
`dp[(1 << n) - 1]` — once every task is in the mask, all `n` workers have necessarily been assigned,
since `popcount` of the full mask is `n`.

```python
from math import inf

def min_assignment_cost(cost: list[list[int]]) -> int:
    """cost[worker][task]; assign each worker exactly one task, minimizing total cost."""
    n = len(cost)
    full = (1 << n) - 1

    # dp[mask]: min cost to assign the tasks in mask to the first
    # popcount(mask) workers (workers 0 .. popcount(mask) - 1).
    dp = [inf] * (1 << n)
    dp[0] = 0

    for mask in range(1 << n):
        if dp[mask] == inf:
            continue
        worker = bin(mask).count("1")  # next worker to assign, derived from mask
        if worker == n:
            continue  # every worker already placed
        for task in range(n):
            if mask & (1 << task):
                continue  # task already taken
            new_mask = mask | (1 << task)
            new_cost = dp[mask] + cost[worker][task]
            if new_cost < dp[new_mask]:
                dp[new_mask] = new_cost

    return dp[full]
```

**Complexity:** `O(n · 2ⁿ)` time — `2ⁿ` masks, up to `n` candidate tasks per mask — and `O(2ⁿ)`
space: one dimension lighter than TSP on both counts, precisely because `popcount(mask)` absorbed
the dimension that TSP's `i` couldn't avoid storing. The skeleton doesn't change if the goal flips
to maximizing value instead of minimizing cost, or if workers should be left idle when every
remaining task is worse than not assigning at all — only the transition's arithmetic and the
comparison's direction do. That's the same "enumeration is the constant, the per-mask logic is the
variable" shape [[04-bitmasking|Part 11, Chapter 4]]'s subset-sum-versus-XOR closing example already
made once; it holds here too, one level up, at the level of the transition rather than the property
being checked.

---

## The Actual Skill: Recognizing the Subset Axis

Once a bitmask state is correctly defined, everything downstream is mechanical in a way that's easy
to underrate precisely because it's mechanical: loop over `2ⁿ` masks, loop over the extra dimension
if there is one, loop over candidate elements to add, apply `min` or `max`. Both worked examples
above use the identical three-level nesting. Neither required an insight at the loop-writing stage.
The insight both required happened earlier, at the point of looking at a problem statement and
recognizing that its answer for any partial solution depends only on _which_ elements have been used
— not on the order they arrived in, and not on any other detail of the path that reached that set.
That recognition is this chapter's actual subject; the loops are what's left over once it's already
been made.

The concrete test is the one both worked examples pass: does the cost of finishing from here depend
on the full history of how the state was reached, or only on the resulting set (plus, sometimes, one
extra piece of information, like TSP's current city)? TSP's cost-to-finish depends only on the
visited set and the current city — not on the order those cities were visited in — which is exactly
why `n!` distinct orderings collapse onto `n · 2ⁿ` distinct `(mask, i)` states without losing any
information the answer actually needs. The assignment problem's cost-to-finish depends only on which
tasks are already taken, full stop. Whenever that test passes and `n` stays under the mid-twenties
ceiling [[04-bitmasking|Part 11, Chapter 4]] already established, a bitmask is the state; when the
test fails — when finishing cost genuinely depends on the order elements arrived in, not just the
resulting set — no amount of bit-trick cleverness rescues a bitmask state, because the state was
never sufficient to begin with, independent of how it's represented in memory.

This is one axis in a small, closed family this Part builds out one chapter at a time. A single
index is the axis when a subproblem is "the answer up to position `k`," the way
[[01-dp-fundamentals|Part 08, Chapter 1]]'s Fibonacci and coin-change examples both used. A range
`(left, right)` is the axis when a subproblem is "the answer restricted to this contiguous slice." A
subset is the axis when a subproblem is "the answer given exactly these elements are already spoken
for" — this chapter's entire contribution. [[11-tree-dp|Part 08, Chapter 11]] adds a fourth: a
subtree, where the transition combines several children's already-solved answers at each node
instead of extending a single smaller state by one step. Same discipline every time — ask what a
subproblem's answer actually depends on before writing a single line of recurrence — applied to a
shape of state this chapter hasn't used yet.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
