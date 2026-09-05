---
title: "1 — What is an Algorithm?"
description: "What separates an algorithm from a program — finiteness, definiteness, effectiveness — and why interviewers are grading the precision of your procedure, not just whether your code runs."
tags: ["data-structures-algorithms","foundations","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159"
---

# 1 — What is an Algorithm?

Most candidates who fail a DSA interview didn't fail because their code was wrong — they failed
because they never had an algorithm in the first place, just a sequence of edits they arrived at by
trial and error. "It passed the examples" and "I have a correct algorithm" are different claims, and
an interviewer is listening for which one you're making. Everything in this chapter is about closing
that gap before it costs you a round.

---

## What Makes Something an Algorithm

An algorithm is a finite, unambiguous procedure that transforms well-defined input into well-defined
output, where every step is something that can actually be carried out. Four properties do the work
in that sentence, and each one rules out something people commonly confuse for an algorithm:

- **Finiteness.** The procedure terminates after a bounded number of steps, for every valid input.
  "Keep refining the guess until it looks good" is not an algorithm — there's no bound on when it
  stops. A `while` loop with no proven termination condition is a hope, not an algorithm.
- **Definiteness.** Every step is precise enough that two different people (or two different
  machines) executing it get the identical result. "Sort the roughly-larger half first" is not
  definite — "roughly" hides a decision that isn't specified anywhere.
- **Well-defined inputs and outputs.** The domain of valid inputs and the expected output for each
  are stated up front, not discovered by running the code and seeing what comes out. This is why
  "what should happen on an empty array?" is never a nitpick in an interview — if you can't answer
  it, the input domain isn't actually well-defined yet.
- **Effectiveness.** Each step must be something that can be done in principle with pencil, paper,
  and finite time — no step that secretly requires solving an undecidable problem or having infinite
  precision arithmetic.

A **program** is one particular encoding of an algorithm in a specific language, with specific
memory layout and specific edge-case handling. The algorithm is the idea; the program is the
artifact. This is why "walk me through your approach before you type anything" is a reasonable
interview ask — the interviewer wants to evaluate the algorithm independent of your syntax fluency,
and wants to catch a broken idea before it's buried in fifteen lines of code.

---

## Algorithm vs. Data Structure

Every DSA problem lives on two axes, and conflating them is the single most common source of muddled
interview answers:

- A **data structure** is a way of storing and organizing data so that certain operations are cheap.
  An array gives cheap random access; a hash map gives cheap key lookup; a heap gives cheap
  access-to-minimum.
- An **algorithm** is a procedure that operates on data — it doesn't inherently know or care how
  that data is stored, except that its complexity bound depends entirely on which structure it's
  handed.

The reason "pick the right data structure, then the right algorithm" is the standard interview
heuristic is that the data structure choice usually _determines_ which algorithms are even cheap to
run. Binary search is `O(log n)` only because the data structure underneath — a sorted array — makes
"is the target left or right of the midpoint" a cheap, constant-time question. Hand the same
algorithm a linked list instead of an array, and the `O(1)` random-access step it depends on becomes
`O(n)`, which quietly destroys the whole complexity argument. The algorithm didn't change; the
structure it was built to exploit did.

This is also why "brute force, then optimize" almost always means "swap the data structure, and the
algorithm falls out for free." Turning an `O(n²)` two-sum into an `O(n)` one isn't a cleverer loop —
it's trading a bare array for a hash set, which turns "is this value present" from a linear scan
into a constant-time lookup.

---

## Correctness: Solving It, Not Just Passing Your Test Cases

An algorithm is **correct** if it produces the specified output for _every_ input in its stated
domain — not the three inputs you happened to trace through by hand. This distinction matters more
than it sounds like it should, because passing every example you tried is exactly what a broken
algorithm and a correct one both do, right up until someone finds the input where they diverge.

Three inputs are worth explicitly interrogating before you believe "it works," because they're where
hand-waving hides:

- **The empty case.** Empty array, empty string, zero-length input — what does the spec say should
  happen, and does your procedure actually reach that branch or just happen to not crash on it?
- **The single-element case.** Off-by-one errors in loop bounds are invisible on large inputs and
  glaring on inputs of size one.
- **The boundary case.** The target is the first element, the last element, or not present at all —
  these are where `<` vs. `<=` bugs live.

The standard tool for proving correctness rigorously — beyond "I checked these cases and they
worked" — is the **loop invariant**: a condition you show is true before the loop starts, stays true
after every iteration, and, combined with the loop's termination condition, implies the
postcondition you actually wanted. That's a full topic on its own and out of scope here; the point
to take from this chapter is narrower: correctness is a claim about _all_ valid inputs, and a loop
invariant is the standard shape that claim takes when you have to defend it precisely instead of
gesturing at it.

---

## Why Interviewers Care About This

An interviewer is not grading whether your code happens to run — they're grading whether you can
_state_ a precise procedure and defend that it terminates, that it's unambiguous, and that it's
correct on the full input domain, not just the happy path you traced on the whiteboard. This is why
certain phrases are an immediate red flag regardless of how confident they're delivered:

- "I'll just check all the cases" — without saying what the cases are, how many there are, or how
  you enumerate them, this is finiteness and definiteness both missing at once.
- "It should work for most inputs" — correctness is not a probability statement; either it's proven
  for the stated domain or it isn't a correct algorithm yet, it's a heuristic that hasn't failed on
  your test cases yet.
- Jumping straight to code with no stated precondition, postcondition, or invariant — the
  interviewer has no way to tell whether you have an algorithm or are pattern-matching from memory,
  and if you get stuck mid-way through typing, neither do you.

The fix is mechanical: before writing a single line, state the precondition (what must be true of
the input), the postcondition (what will be true of the output), and the core invariant that gets
you from one to the other. That's a precise algorithm. Everything after that is encoding.

---

## Worked Example: Binary Search as a Precise Procedure

Here's the difference between a hand-wavy description and a precise algorithm, applied to the
simplest classic example.

**Hand-wavy version:** "Look at the middle, and keep narrowing down until you find it."

That sentence doesn't specify what "the middle" is when there's an even number of elements, doesn't
say what happens if the target isn't there, and doesn't say what "narrowing down" actually updates.
It sounds like an algorithm and isn't one — there's no way to code it without inventing three more
decisions the sentence never made.

**Precise version:**

- **Precondition:** `arr` is sorted in non-decreasing order; `target` is the value being searched
  for.
- **State:** two pointers, `lo = 0` and `hi = arr.length - 1`, defining the current candidate range
  `[lo, hi]`.
- **Loop invariant:** if `target` is present in `arr`, its index lies within `[lo, hi]`.
- **Step**, repeated while `lo <= hi`:
  1. Compute `mid = lo + (hi - lo) // 2`.
  2. If `arr[mid] == target`, return `mid`.
  3. If `arr[mid] < target`, set `lo = mid + 1` (the target, if present, must be to the right).
  4. Otherwise set `hi = mid - 1` (the target, if present, must be to the left).
- **Termination:** each iteration strictly shrinks `hi - lo`, so the loop ends in at most `O(log n)`
  iterations.
- **Postcondition:** either an index `i` with `arr[i] == target` was returned, or the loop exited
  with `lo > hi`, which — by the invariant — means `target` is not present, and the algorithm
  returns a not-found signal.

Notice what the precise version bought: a stated precondition (sortedness) that explains _why_ this
algorithm is even applicable, an invariant that makes the termination argument checkable step by
step, and a postcondition that covers the not-found case explicitly instead of leaving it implied.
That's what "describe your algorithm before you code it" is actually asking for.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
