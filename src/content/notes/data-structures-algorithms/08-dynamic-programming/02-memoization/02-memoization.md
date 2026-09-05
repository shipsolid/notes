---
title: "2 — Memoization"
description: "Top-down dynamic programming: caching each recursive call's answer to turn Fibonacci's O(2^n) blowup into O(n), deriving the cache's time/space cost and its recursion-depth limit, learning to define a state and its transition from scratch via Climbing Stairs, previewing tuple-keyed multi-dimensional caches, and weighing memoization against tabulation."
tags: ["data-structures-algorithms","dynamic-programming","book"]
updated: 2026-07-28
hidden: false
zettelId: "202607241159-62"
relations:
  - slug: data-structures-algorithms/08-dynamic-programming/01-dp-fundamentals/01-dp-fundamentals
    kind: depends_on
---

# 2 — Memoization

Chapter 1 traced `fib(5)`'s recursion tree by hand and found `fib(2)` computed three separate times,
`fib(1)` five times, `fib(0)` three times — the same state, recomputed from scratch every time it's
needed, with no memory of the fact that some earlier branch already worked it out. That's what
overlapping subproblems cost when nothing is done about it: `fib(n)` has only `n + 1` distinct
states (`fib(0)` through `fib(n)`), yet the naive recursive call count grows as `O(2^n)`, because
every one of those exponentially many calls re-derives an answer some other call already has.

The fix is almost absurdly small: the first time a state's answer is computed, write it down; every
subsequent time that state is asked for, look it up instead of recomputing it. That's
**memoization** — "memo," as in "make a note of this" — and it's **top-down** because the call still
starts exactly where the naive version started, at `fib(n)`, and _lazily_ recurses downward into
whichever smaller states that particular call actually needs. Nothing about the recursive structure
changes. One thing gets added: a cache, and a check against it before doing any work.

---

## Fibonacci, Memoized

The hand-rolled version first, since it makes the mechanism explicit — there's a cache, there's a
lookup, there's a write:

```python
def fib_memo(n, cache=None):
    if cache is None:
        cache = {}
    if n in cache:
        return cache[n]
    if n <= 1:
        result = n
    else:
        result = fib_memo(n - 1, cache) + fib_memo(n - 2, cache)
    cache[n] = result
    return result
```

(A default argument of `cache={}` would also work mechanically — Python evaluates default arguments
exactly once, at function-definition time, so that dict would persist and keep accumulating entries
across unrelated top-level calls. Harmless here, since every cached value is correct regardless of
when it was computed, but it's the same default-mutable-argument surprise that bites people in
contexts where the shared state _isn't_ supposed to leak between calls. Passing `cache=None` and
initializing fresh inside the function sidesteps the question entirely, so that's the version worth
reaching for by habit.)

To see what changed, instrument both the naive version from Chapter 1 and this one with an identical
call counter — increment it on every invocation, cached or not — and run both at the same `n`:

```python
def fib_naive(n, counter):
    counter[0] += 1
    if n <= 1:
        return n
    return fib_naive(n - 1, counter) + fib_naive(n - 2, counter)

def fib_memo_counted(n, cache, counter):
    counter[0] += 1
    if n in cache:
        return cache[n]
    if n <= 1:
        result = n
    else:
        result = fib_memo_counted(n - 1, cache, counter) + fib_memo_counted(n - 2, cache, counter)
    cache[n] = result
    return result

for n in [5, 10, 20, 30]:
    c1 = [0]
    naive_result = fib_naive(n, c1)
    c2 = [0]
    memo_result = fib_memo_counted(n, {}, c2)
    assert naive_result == memo_result
    print(n, naive_result, c1[0], c2[0])
```

Actually run, this prints:

| `n` | `fib(n)` | naive calls | memoized calls |
| --- | -------- | ----------- | -------------- |
| 5   | 5        | 15          | 9              |
| 10  | 55       | 177         | 19             |
| 20  | 6765     | 21,891      | 39             |
| 30  | 832040   | 2,692,537   | 59             |

Same recursive structure, same base cases, same answer at every `n` — and the call count goes from
exploding to `2n - 1`. That formula falls straight out of how the counter behaves: computing
`fib(n)` fresh costs one call for the invocation itself, plus whatever its two recursive calls cost.
The first recursive call, `fib_memo_counted(n - 1, ...)`, does all the real work and populates the
cache for every state from `n - 1` down to `0` along the way. By the time the second recursive call,
`fib_memo_counted(n - 2, ...)`, happens, `n - 2` is already sitting in the cache — that call still
counts (the counter increments before the cache check runs), but it returns immediately. So each
level above the base case adds exactly 2 to the count — one real descent, one O(1) cache hit —
giving `C(n) = C(n - 1) + 2` with `C(1) = 1`, which solves to `C(n) = 2n - 1`. Check it against the
table: `2·5 - 1 = 9`, `2·10 - 1 = 19`, `2·20 - 1 = 39`, `2·30 - 1 = 59`. Exact, not approximate.

Push `n` further and the contrast stops being about counting and starts being about wall-clock time.
At `n = 32`, on this machine, the naive version makes 7,049,155 calls and takes about 0.30 seconds;
the memoized version makes 63 calls and takes about 16 microseconds — roughly four orders of
magnitude, from one added cache.

Python hands this same idea to you for free via `functools.lru_cache`, which wraps a function in an
LRU cache keyed on its arguments:

```python
import functools

@functools.lru_cache(maxsize=None)
def fib_lru(n):
    if n <= 1:
        return n
    return fib_lru(n - 1) + fib_lru(n - 2)
```

`fib_lru.cache_info()` after a fresh call reports hits and misses directly, no manual counter
needed. Running `fib_lru(n)` for the same values, after `fib_lru.cache_clear()` each time:

| `n` | `fib(n)` | misses (`n + 1`) | hits |
| --- | -------- | ---------------- | ---- |
| 5   | 5        | 6                | 3    |
| 10  | 55       | 11               | 8    |
| 20  | 6765     | 21               | 18   |
| 30  | 832040   | 31               | 28   |

`misses` lands exactly on `n + 1` — the true count of distinct states — confirming the O(n)-states
claim directly rather than by inference. `hits + misses` reproduces the same `2n - 1` total the
hand-rolled counter found (`6 + 3 = 9`, `31 + 28 = 59`), but the two implementations get there
differently: the hand-rolled version still pays a full Python function call for a cache hit — the
call happens, the counter increments, _then_ the cache check short-circuits the rest of the body.
`lru_cache` intercepts at the decorator level and never invokes the wrapped function body at all on
a hit, which is why its `misses` counter — the number of times the actual function body ran — is
only `n + 1`, not `2n - 1`. That's the concrete version of "what Python gives you for free": not
just the caching logic, but skipping the call overhead on every hit, not only the recomputation.

---

## Why This Is O(n): Time, Space, and a Real Recursion-Depth Limit

**Time:** there are exactly `n + 1` distinct states (`fib(0)` through `fib(n)`), confirmed directly
above via `lru_cache`'s miss count. Memoization guarantees each one is computed exactly once —
that's the entire point of checking the cache before recursing — and each computation does O(1)
work, given that its two dependencies (`fib(k-1)` and `fib(k-2)`) are already sitting in the cache
by the time they're needed. `n + 1` states × O(1) work per state = **O(n)** total time, down from
`O(2^n)`.

**Space:** the cache holds one entry per distinct state, so O(n) auxiliary space for the cache
itself. On top of that, the recursion stack costs O(n) as well: the very first call, `fib_memo(n)`,
has an empty cache and has to recurse all the way down to the base case before anything comes back —
that's `n` stack frames alive simultaneously at the deepest point, exactly the same stack-depth cost
[[03-recursion|Part 01, Chapter 3]] walked through for straight-line recursion like `factorial`.
Caching doesn't change how deep the _first_ descent has to go; it only stops that descent from being
repeated.

That O(n) recursion depth is not a theoretical footnote — it's Python's default recursion limit,
concretely. `sys.getrecursionlimit()` returns `1000` by default, and `fib_memo`, run against that
limit directly:

```python
>>> fib_memo(999)
26863810024485359386146727202142923967616609318986952340123175997617981700247881689338369654483356564191827856161443356312976673642210350324634850410377680367334151172899169723197082763985615764450078474174626
>>> fib_memo(1000)
RecursionError: maximum recursion depth exceeded
```

`fib_memo(999)` returns cleanly — a 209-digit integer — and `fib_memo(1000)`, one larger, blows the
stack. Nothing about the _algorithm_ changed between those two calls; the O(n) recursion depth
simply crossed the interpreter's hard ceiling. This is exactly the gotcha
[[03-recursion|Part 01, Chapter 3]] flagged: Python has no tail-call optimization, so every
recursive call is a real frame regardless of how "cheap" the call looks, and a memoized recursive
solution is not exempt from that limit just because it's fast. For DP problems where `n` can run
into the thousands, that's a real, practical argument for tabulation (next chapter) over memoization
— not a complexity argument, a "does-it-run-at-all" argument.

---

## Defining the State Yourself: Climbing Stairs

Fibonacci handed the recurrence over ready-made. The actual skill this chapter is building is
figuring out the recurrence from a problem statement that doesn't come with one attached — that's
what makes state definition, per Chapter 1, the hard part rather than the recognizable part.

**Problem:** you're climbing a staircase of `n` steps. Each move, you can climb 1 step or 2 steps.
How many distinct sequences of moves reach exactly step `n`?

Nothing here says "Fibonacci." The recurrence has to come from reasoning about the last move, not
from pattern-matching a shape:

- To be standing on step `n`, the move that got you there was either a 1-step, taken from step
  `n - 1`, or a 2-step, taken from step `n - 2` — those are the only two moves that exist, and
  they're mutually exclusive (a given sequence of moves has exactly one last move).
- Every way of reaching step `n - 1` becomes a way of reaching step `n` by appending one more
  1-step; every way of reaching step `n - 2` becomes a way of reaching step `n` by appending one
  more 2-step. No sequence is double-counted, because the two cases are distinguished by what the
  _last_ move was.
- So `ways(n) = ways(n - 1) + ways(n - 2)`.

Base cases need the same care. `ways(1) = 1`: one step, one move, one way. `ways(0) = 1` is less
intuitive — it isn't a real staircase position anyone climbs to on purpose — but it has to be
defined that way for the recurrence to produce the right answer at `n = 2`: there are genuinely two
ways to reach step 2 (`1+1` or `2`), and `ways(2) = ways(1) + ways(0) = 1 + 1 = 2` only comes out
right if `ways(0)` counts as the single "do nothing, you're already there" way. A base case earns
its value by what it needs to make the recurrence produce, not by whether it "means" something on
its own.

That's the transition derived, not assumed — the recurrence has the same shape as Fibonacci's
(`ways(n) = ways(n-1) + ways(n-2)`), but arriving at it required reasoning about staircases and last
moves, not recognizing a formula. Once the state (`ways(n)`, "the number of distinct move-sequences
that land exactly on step n") and the transition are pinned down, the code is a direct
transcription:

```python
def ways_memo(n, cache=None):
    if cache is None:
        cache = {}
    if n in cache:
        return cache[n]
    if n <= 1:
        result = 1
    else:
        result = ways_memo(n - 1, cache) + ways_memo(n - 2, cache)
    cache[n] = result
    return result
```

Checked against brute-force recursion for `n = 0` through `10`, and against `functools.lru_cache`,
all three agree at every value:

| `n`  | 0   | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  |
| ---- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ways | 1   | 1   | 2   | 3   | 5   | 8   | 13  | 21  | 34  | 55  | 89  |

And it scales exactly the way the Fibonacci analysis predicts — `ways_memo(30) = 1,346,269` and
`ways_memo(45) = 1,836,311,903`, both returned instantly, no recursion-depth trouble at these sizes.
(For anyone who wants the closed connection: `ways(n)` is literally `fib(n + 1)` under the indexing
this chapter used for Fibonacci — same recurrence, shifted by one — but that's a coincidence of this
particular problem, not something to rely on when the next problem's transition doesn't reduce to
Fibonacci at all.)

---

## When the State Is More Than One Number

Both examples so far key their cache on a single integer. Nothing about memoization requires that —
the cache key just has to uniquely identify a state, and a state is often more than one number.

Consider a variant of 0/1 knapsack: given items with weights and values and a weight capacity,
decide for each item whether to include it, maximizing total value without exceeding capacity. A
state here needs **two** independent pieces of information — which item is currently being decided
(`i`) and how much capacity remains (`remaining`) — because the same item index can be reached with
different amounts of capacity left depending on earlier choices, and each combination is a genuinely
different subproblem. The cache key becomes a tuple:

```python
def knapsack(weights, values, capacity):
    n = len(weights)
    cache = {}

    def solve(i, remaining):
        if i == n or remaining == 0:
            return 0
        if (i, remaining) in cache:
            return cache[(i, remaining)]
        skip = solve(i + 1, remaining)
        take = 0
        if weights[i] <= remaining:
            take = values[i] + solve(i + 1, remaining - weights[i])
        result = max(skip, take)
        cache[(i, remaining)] = result
        return result

    return solve(0, capacity)
```

Run against `weights = [1, 3, 4, 5]`, `values = [1, 4, 5, 7]`, `capacity = 7`: `knapsack(...)`
returns `9` (take the items weighing 3 and 4, values 4 + 5 = 9 — better than any other combination
that fits in capacity 7), and the cache ends up with 12 distinct `(i, remaining)` entries — 12
subproblems actually visited, out of the `n × (capacity + 1) = 4 × 8 = 32` combinations that exist
in principle. Not every combination is reachable from the specific top-level call `solve(0, 7)`, and
memoization never computes the ones that aren't.

`functools.lru_cache` handles this without any manual tuple-building at all — decorate a function
that takes `i` and `remaining` as two separate arguments, and the decorator builds the tuple key
internally:

```python
@functools.lru_cache(maxsize=None)
def solve(i, remaining):
    ...
```

Either form works; the point to take from this section is just that **the cache key is whatever
uniquely identifies the state**, full stop — one integer, a tuple of several, or anything hashable.
[[04-knapsack-problems|Chapter 4]], two chapters ahead, is where this two-dimensional state gets its
first full worked example, with the actual item-selection trace; this section is only the preview of
the mechanism.

---

## Memoization vs. Tabulation, Briefly

Two honest trade-offs worth flagging now, without resolving either — resolving them properly needs
[[03-tabulation|Chapter 3]]'s bottom-up approach to exist first as something to compare against.

Memoization only computes states actually reachable from the top-level call — the knapsack example
above visited 12 of 32 possible `(i, remaining)` states, not all 32, because the recursion never
happened to ask for the other 20. When the full state space is large but only a sparse subset of it
is ever visited for a given input, that's real, saved work. Tabulation, by contrast, fills in every
cell of its table regardless of whether the final answer ever depends on it — simpler control flow,
but no way to skip unreachable states the way lazy top-down recursion does automatically.

Working against memoization: every state computed pays real recursion overhead — a Python function
call, a new stack frame, the eventual unwind — that an iterative bottom-up loop over an array
doesn't pay at all. For problems where the entire state space ends up visited anyway, that overhead
is pure cost with no offsetting benefit. Which of these two effects dominates for a given problem is
exactly the question the next chapter is positioned to answer, once tabulation is on the table as a
real alternative rather than a name.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
