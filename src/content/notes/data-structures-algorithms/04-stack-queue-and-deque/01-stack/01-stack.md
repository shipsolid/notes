---
title: "1 — Stack"
description: "LIFO fundamentals: push/pop/peek in O(1), why list.append()/list.pop() are the right end and list.pop(0) isn't, the call stack as a literal stack, and worked bracket-matching and iterative-DFS examples."
tags: ["data-structures-algorithms","stacks-queues","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-19"
relations:
  - slug: data-structures-algorithms/01-mathematical-algorithmic-foundations/03-recursion/03-recursion
    kind: related
---

# 1 — Stack

A stack is the smallest data structure in this book, which is exactly why it earns a full chapter:
the restriction _is_ the design. It stores a sequence like a list does, but refuses to let you touch
anything except one end — a guarantee, not a limitation, that turns out to make function calls, undo
buffers, expression parsing, and depth-first traversal all work the same way underneath.

---

## LIFO: Access Restricted to One End

A stack supports exactly three operations, and every one of them touches the same end — the **top**:

- **`push(x)`** — add `x` to the top.
- **`pop()`** — remove and return whatever is currently on top.
- **`peek()`** (sometimes `top()`) — read the top value without removing it.

The ordering this produces is **LIFO — last in, first out**: whatever was pushed most recently comes
back out first — the opposite of a queue (next chapter), which is FIFO. There is no `pop(i)` for an
arbitrary index, no `insert` in the middle, no reading the third element from the bottom. That's not
an oversight — it's the interface, and every algorithm below leans on it being true.

---

## Implementing a Stack in Python

Python's `list` is a stack once you commit to using only one end of it:

```python
stack = []
stack.append(10)      # push
stack.append(20)      # push
stack.append(30)      # push

stack.pop()            # 30 — pop
stack[-1]              # 20 — peek, without removing
```

`list.append()` and `list.pop()` **with no index argument** are both **O(1) amortized** — the same
amortized-doubling argument from Part 01 Chapter 2 and Part 02 Chapter 1 applies unmodified, because
both operate on the **end** of the underlying array: `append` writes into reserved capacity (or
triggers a geometric resize, amortized away over many pushes), and `pop()` decrements the length and
returns the last slot. Neither moves any other element.

**The gotcha:** `list.pop(0)` and `list.insert(0, x)` look like reasonable stack operations if you
picture the stack growing at index `0` — but they operate on the **front**, so every remaining
element shifts by one position to close or open the gap. This is silent: the code runs, produces
correct LIFO order, and quietly turns an O(1) algorithm into O(n²) the first time it's called in a
loop:

```python
stack.insert(0, 5)     # O(n) — shifts every existing element right by one
stack.pop(0)           # O(n) — shifts every remaining element left by one
```

The fix is picking the end that's actually cheap — the end — and never touching the other one.
**`collections.deque`** supports push/pop/peek from either end in O(1), and is the safer default
whenever the other end might be needed too — the next chapter's queue and deque both need front-end
operations that make plain `list` dangerous:

```python
from collections import deque

stack = deque()
stack.append(10)       # push
stack.pop()             # 10 — pop from the same end you pushed to
```

---

## The Call Stack Is a Literal Stack

[[03-recursion|Part 01, Chapter 3]] built up the idea of a stack frame without naming the data
structure directly: every recursive call gets "its own copy of the arguments, its own place to
resume once the call it made returns," and frames "stack up until a base case is hit, then unwind in
reverse order." Reread that with this chapter's vocabulary and it's an exact description of push and
pop: **every function call is a `push`** — the interpreter allocates a new frame, records where to
resume in the caller, and puts it on top of the call stack. **Every `return` is a `pop`** — the top
frame is removed and control resumes exactly where the now-restored frame left off.

That's not a teaching analogy — "the call stack" is the actual name of the actual stack the
interpreter maintains, and `factorial(4)`'s traced output from the recursion chapter is a stack
trace in the most literal sense:

```
call factorial(4)              push
  call factorial(3)            push
    call factorial(2)          push
      call factorial(1)        push
      base case: return 1      pop
    return factorial(2) = 2    pop
  return factorial(3) = 6      pop
return factorial(4) = 24       pop
```

Four pushes down, four pops back up, in exactly reversed order — LIFO, because `factorial(4)`'s
frame can't pop until `factorial(3)`'s does. This is also why `RecursionError` exists:
`sys.getrecursionlimit()` caps how many pushes without a matching pop the interpreter allows before
deciding the stack has grown too deep to be safe.

---

## Worked Example: Valid Parentheses

The canonical stack interview problem: given a string of brackets — `()[]{}` — determine whether
every opening bracket is closed by the matching type, in the correct order.

**Approach:** walk the string once. Every opening bracket gets pushed. Every closing bracket pops
the stack and checks that what came off matches the closer's expected type. The string is valid iff
the stack is completely empty exactly when the string ends — not before (an unmatched closer with
nothing to pop) and not after (an unmatched opener still sitting on the stack).

```python
def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []

    for char in s:
        if char in pairs.values():          # opening bracket
            stack.append(char)
        elif char in pairs:                 # closing bracket
            if not stack or stack.pop() != pairs[char]:
                return False                # popped nothing, or wrong type
        # any other character is ignored here; real inputs are usually brackets-only

    return not stack                        # empty iff every opener was matched

is_valid("({[]})")   # True
is_valid("([)]")     # False — closes '(' with ')' before '[' is closed
is_valid("(()")      # False — one opener never gets popped
```

`stack.pop() != pairs[char]` is where LIFO earns its keep: the most recently opened bracket must be
the next one closed — exactly the order a stack hands things back in. A queue (FIFO) would check the
_oldest_ unclosed bracket first, the wrong order for nested structure.

---

## Worked Example: Iterative DFS

Part 01 Chapter 3 showed that any recursion can be mechanically rewritten with an explicit stack in
place of the interpreter's call stack (`flatten` → `flatten_iterative`). Depth-first traversal of a
tree or graph is the same conversion — worth seeing once here in its lightest form. Full graph DFS,
with visited-sets and edge classification, is Part 06 (Graphs)'s job, not this chapter's.

Recursive DFS relies on the call stack implicitly — `visit(node)` then recurse into each child, the
same shape as `flatten`. The iterative version makes that stack explicit and manages it by hand:

```python
def dfs_iterative(root, visit):
    if root is None:
        return
    stack = [root]
    while stack:
        node = stack.pop()          # LIFO: most recently pushed child visited next
        visit(node)
        for child in reversed(node.children):
            stack.append(child)     # reversed() keeps left-to-right visit order
```

`stack.pop()` stands in for "the recursive call the interpreter would currently be inside" — the
same substitution `flatten_iterative` made for nested lists. `reversed(node.children)` only matters
for visit _order_: pushing left-to-right and popping from the top would visit the rightmost child
first, since the last one pushed is the first one popped — reversing restores the recursive
version's natural left-to-right order.

---

## Complexity Summary

| Operation              | Complexity | Why                                                  |
| ---------------------- | ---------- | ---------------------------------------------------- |
| `push`                 | O(1)\*     | Amortized — same doubling argument as dynamic arrays |
| `pop`                  | O(1)       | Removes from the end; no shifting                    |
| `peek`                 | O(1)       | Reads the end directly                               |
| Search / access middle | O(n)       | Must pop everything above the target to reach it     |

\* An individual `push` that triggers a resize costs O(n) for that one call, but the cost averages
to O(1) per push over any long sequence (Part 01 Ch2, Part 02 Ch1).

That last row isn't a flaw to route around — it's the whole point. A stack that let you reach into
the middle in O(1) would just be a list wearing a stack's name. Restricting access to one end is
what makes push, pop, and peek unconditionally cheap — and what makes the call stack, bracket
matching, and iterative DFS all reach for the same three operations.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
