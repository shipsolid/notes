---
title: "3 — Recursion"
description: "How recursion actually executes on the call stack, why Python has no tail-call optimization, when to convert recursion to iteration, and a worked factorial-digit-sum example."
tags: ["data-structures-algorithms","foundations","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-3"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/02-asymptotic-analysis/02-asymptotic-analysis
    kind: related
---

# 3 — Recursion

Recursion gets taught as an elegance trick — "look, five lines instead of a loop" — and that framing
hides the part that actually matters in an interview: every recursive call is a real stack frame,
sitting in real memory, and it stays there until the call returns. If you can't say how many frames
are alive at the deepest point of your recursion, you can't say whether your solution actually fits
the constraints you were given. This chapter is about seeing the stack, not just the elegance.

---

## Base Case, Recursive Case, and the Call Stack

Every correct recursive function has exactly two parts: a **base case** — the input small enough to
answer directly, with no further call, which is what stops the recursion — and a **recursive case**,
which reduces the input toward the base case and calls the function again on that smaller input.
Skip the base case, or get the condition wrong, and Python doesn't hang forever on infinite
recursion; it crashes with `RecursionError` once the stack limit is hit (more on that limit below).

Each call gets its own **stack frame** — its own copy of the arguments, its own place to resume once
the call it made returns. Frames don't merge; they stack up until a base case is hit, then unwind in
reverse order. Instrument `factorial` to print on the way in and the way out and that stack becomes
visible:

```python
def factorial(n):
    print(f"{'  ' * (4 - n)}call factorial({n})")
    if n <= 1:                                    # base case
        print(f"{'  ' * (4 - n)}base case: return 1")
        return 1
    result = n * factorial(n - 1)                 # recursive case
    print(f"{'  ' * (4 - n)}return factorial({n}) = {result}")
    return result

factorial(4)
```

```
call factorial(4)
  call factorial(3)
    call factorial(2)
      call factorial(1)
      base case: return 1
    return factorial(2) = 2
  return factorial(3) = 6
return factorial(4) = 24
```

Read the indentation as stack depth: it grows on the way down — four frames deep at the peak, one
per pending multiplication — and shrinks on the way back up as each frame gets its answer and
returns. `factorial(4)` cannot compute `4 * factorial(3)` until `factorial(3)` actually returns, so
its frame has to stay alive, holding `n = 4`, for the whole time its recursive call is in flight.

---

## The Recursion Tree

Stack depth tells you how deep one path goes; the **recursion tree** tells you the total number of
calls. Draw every call as a node and every recursive call as a child edge, and the tree's shape
depends on **branching factor** (recursive calls per frame) and **depth** (reductions until the base
case).

`factorial` has branching factor 1 — a straight line, not really a tree — so its call count equals
its depth: `n` calls for `factorial(n)`. Naive Fibonacci (`fib(n) = fib(n-1) + fib(n-2)`) branches
twice per frame instead of once — same depth `n`, but roughly `2^n` total calls, because every
non-base frame spawns two more. That's the entire reason naive Fibonacci is exponential while
factorial is linear, and it's the same branching-factor × depth reasoning from
[[02-asymptotic-analysis|Chapter 2, Asymptotic Analysis]]: counting recursive calls is counting
nodes in this tree, and the recurrence you'd write for it (`T(n) = 2T(n-1) + O(1)`) is exactly how
that chapter's recurrence-solving connects to code you'll actually be asked to analyze.

---

## Python's Recursion Gotchas

**No tail-call optimization.** Languages with TCO compile a recursive call in tail position — the
last thing a function does, nothing left to compute after it returns — into a jump instead of a new
frame, so "tail recursive" code runs in constant stack space. Python's interpreter never does this
on purpose (Guido van Rossum has said it would make stack traces harder to reason about), so a
tail-recursive-looking function still allocates a full frame per call — the exact
intuition-from-another-language trap that catches people:

```python
def countdown(n):
    if n == 0:
        return
    return countdown(n - 1)   # tail call — still a real stack frame in Python
```

**A hard recursion limit.** `sys.getrecursionlimit()` defaults to 1000 — the maximum stack depth
before Python raises `RecursionError: maximum recursion depth exceeded`, regardless of whether the
recursion was "supposed" to be cheap:

```python
>>> import sys
>>> sys.getrecursionlimit()
1000
>>> countdown(1500)
RecursionError: maximum recursion depth exceeded
```

`sys.setrecursionlimit(n)` can raise the ceiling, but it's a last resort: the C stack backing each
frame is finite too, and pushing the limit too high trades a clean `RecursionError` for a segfault.
If an input size can push recursion past a few thousand frames, convert to iteration instead.

---

## Converting Recursion to Iteration

Any recursive function can be mechanically rewritten to use an explicit data structure instead of
the call stack — whatever the stack was implicitly tracking becomes a stack (or queue) you manage
yourself in a `while` loop. Linear recursion like `factorial` converts trivially to a loop with an
accumulator; the technique matters more where the recursion genuinely branches, like flattening a
nested list:

```python
def flatten(nested):                        # recursive: one frame per nesting level
    result = []
    for item in nested:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result
```

```python
def flatten_iterative(nested):              # iterative: explicit stack of iterators
    result = []
    stack = [iter(nested)]
    while stack:
        try:
            item = next(stack[-1])
        except StopIteration:
            stack.pop()                    # this level exhausted — pop to the parent
            continue
        if isinstance(item, list):
            stack.append(iter(item))       # "recurse" by pushing a new frame
        else:
            result.append(item)
    return result
```

`stack[-1]` at any moment is exactly the frame the recursive version would be executing; pushing an
iterator stands in for making a recursive call, popping stands in for that call returning. Both
versions produce the same output — the difference is that the iterative one's memory is a Python
list you can inspect and bound, not an interpreter-managed stack capped at 1000 frames.

---

## Worked Example: Factorial Digit Sum

**Problem:** sum the digits of `n!`, where `n` can be as large as 100. (`100!` has 158 digits — too
large to reason about by hand, trivial for Python's arbitrary-precision integers.)

A first pass often computes the factorial with a plain loop, then leans on `str()` and `sum()` for
the digit total — a correct three-line solution, but not a recursion example, and this chapter is
about recursion. Recasting both steps as recursive functions fits better:

```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def digit_sum(n):
    if n < 10:
        return n
    return n % 10 + digit_sum(n // 10)

result = digit_sum(factorial(100))
print(result)   # 648
```

`factorial` recurses on the count-down-to-1 pattern from the first section: 100 calls, 100 frames at
peak, well inside the default limit. `digit_sum` recurses on the number itself, peeling off one
digit (`n % 10`) per call and recursing on the rest (`n // 10`) — so its depth is the digit count of
`n!`, not `n`: 158 frames for `100!`. Both are linear in their inputs, `O(n)` and `O(d)`, though the
arithmetic inside each call on a 158-digit integer isn't the free `O(1)` it would be on a machine
word — Python's big-integer operations get costlier as the number grows, worth naming even though it
doesn't change the call count.

The instructive part for this chapter is the depth check: this works comfortably at `n = 100`
because 158 frames is nowhere near the gotchas-section ceiling. Push `n` large enough that
`digit_sum`'s depth clears ~1000 frames and this exact function raises `RecursionError` — the fix is
the iterative version with an explicit accumulator, not a bigger recursion limit.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
