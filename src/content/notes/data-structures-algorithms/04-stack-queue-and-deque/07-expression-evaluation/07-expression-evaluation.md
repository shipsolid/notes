---
title: "7 — Expression Evaluation"
description: "Infix vs. postfix vs. prefix notation, evaluating postfix/RPN with a single stack, the two-stack method for direct infix evaluation with operator precedence and parentheses, a full Basic-Calculator implementation, and shunting-yard as an alternative infix-to-postfix conversion strategy."
tags: ["data-structures-algorithms","stacks-queues","book"]
updated: 2026-07-27
hidden: false
zettelId: "202607241159-25"
relations:
  - slug: data-structures-algorithms/04-stack-queue-and-deque/01-stack/01-stack
    kind: related
---

# 7 — Expression Evaluation

A calculator app, a SQL query planner, and the Python interpreter parsing `3 + 4 * 2` are all
solving the same problem: turning a flat string of tokens into the correct order of operations, with
no human standing over the shoulder to say "do the multiplication first." Every stack idea in this
Part — push and pop, LIFO ordering, an opener matched to its closer — was building toward exactly
this. Expression evaluation is where the abstraction stops being a toy interview trick and becomes
what compilers, interpreters, and calculator apps actually run at parse time.

---

## Infix, Postfix, and Why Postfix Needs No Precedence Rules

There are three ways to write down the same arithmetic, and they differ only in _where the operator
sits relative to its operands_:

- **Infix** — `3 + 4 * 2`. The operator sits between its two operands. This is what every human
  writes and reads, and it's ambiguous the instant there's more than one operator: does `+` or `*`
  fire first? Reading the string left to right doesn't tell you — you also need an external table of
  **operator precedence** (`*` and `/` bind tighter than `+` and `-`) and **associativity** (equal
  precedence resolves left to right, so `8 - 3 - 2` is `(8 - 3) - 2 = 3`, not `8 - (3 - 2) = 7`),
  plus parentheses to override both when the default isn't what's meant.
- **Postfix**, a.k.a. **Reverse Polish Notation (RPN)** — `3 4 2 * +`. The operator comes _after_
  its two operands. The same expression, `3 + 4 * 2`, becomes `3 4 2 * +` — read it as "3, and 4 2
  multiplied, added." No precedence table, no parentheses, no ambiguity: by the time an operator is
  read, its two operands were already the two most recently seen values, full stop. The evaluation
  order is _encoded in the token order itself_ — which is exactly why a single stack, scanning once
  left to right, can evaluate it directly. This is the form calculator hardware (classic HP RPN
  calculators), stack-based virtual machines, and PostScript actually run internally — precedence
  parsing is a one-time cost paid at compile time, not something the machine re-derives on every
  evaluation.
- **Prefix**, a.k.a. **Polish notation** — `+ 3 * 4 2`. The operator comes _before_ its operands.
  Same unambiguous, precedence-free property as postfix, just evaluated from the other end
  (typically right to left with a stack, or recursively). Lisp's `(+ 3 (* 4 2))` is prefix with
  explicit parentheses. It's mentioned here for completeness — it isn't the form this chapter builds
  on, since postfix is the one that shows up in stack-based interview problems and real stack
  machines.

The throughline: **infix needs precedence rules to disambiguate; postfix and prefix don't, because
position alone already tells you the order.** The rest of this chapter is about two different ways
to get from a human-shaped infix string to a computed answer — evaluate postfix directly with one
stack, or evaluate infix directly with two.

---

## Evaluating Postfix With a Single Stack

The algorithm is one loop, one stack, and one rule for what to do with each kind of token:

- **See a number** → push it.
- **See an operator** → pop the top two values off the stack, apply the operator, push the result
  back on.

Scan left to right, exactly once. At the end, exactly one value remains on the stack: the answer.

```python
def eval_postfix(expression: str) -> float:
    tokens = expression.split()
    stack: list[float] = []

    ops = {
        "+": lambda a, b: a + b,
        "-": lambda a, b: a - b,
        "*": lambda a, b: a * b,
        "/": lambda a, b: a / b,
    }

    for token in tokens:
        if token in ops:
            right = stack.pop()   # pushed second, so popped first
            left = stack.pop()    # pushed first, so popped second
            stack.append(ops[token](left, right))
        else:
            stack.append(float(token))

    return stack.pop()
```

The pop order is not cosmetic. `stack.pop() != pairs[char]` in
[[01-stack|Chapter 1's bracket matcher]] only ever compared what came off the stack; here, two
values come off and their _order_ changes the answer for non-commutative operators. The operand
pushed first (further down) is always the **left** operand; the one pushed second (right above it)
is always the **right** operand. Get this backwards and `10 5 -` silently computes `5 - 10 = -5`
instead of `10 - 5 = 5` — the same class of easy-to-miss bug as popping bracket types in the wrong
order, just numeric instead of Boolean.

### Trace: `3 4 2 * +`

This is `3 + 4 * 2` in postfix — the multiplication was written first specifically so it binds
tighter, without any precedence table at evaluation time:

| Token | Action                             | Stack after |
| ----- | ---------------------------------- | ----------- |
| `3`   | push                               | `[3]`       |
| `4`   | push                               | `[3, 4]`    |
| `2`   | push                               | `[3, 4, 2]` |
| `*`   | pop 2, pop 4 → `4 * 2 = 8` → push  | `[3, 8]`    |
| `+`   | pop 8, pop 3 → `3 + 8 = 11` → push | `[11]`      |

One value left: `11`, matching `3 + (4 * 2)`. Every operator resolved against exactly the two values
that were sitting on top of the stack the moment it was seen — no lookahead, no backtracking, no
knowledge of `*` outranking `+` required anywhere in this function.

**Complexity:** each of the `n` tokens is visited exactly once, and push/pop are O(1) amortized (Ch.
1), so evaluation is **O(n) time**. The stack holds at most as many operands as haven't yet been
consumed by an operator — **O(n) space** worst case (e.g. a long run of pushed numbers before the
first operator appears).

---

## Evaluating Infix Directly: The Two-Stack Method

Converting infix to postfix first and then running the evaluator above is one legitimate strategy
(the next section names it). But the more commonly asked interview version skips the conversion step
and evaluates infix directly, using **two stacks in concert**:

- an **operand stack** — holds numbers waiting to be combined.
- an **operator stack** — holds operators (and open parentheses) waiting to fire.

This is a direct generalization of [[01-stack|Chapter 1's bracket matcher]]. That algorithm pushed
every opener and, on a closer, popped and checked the type matched. This algorithm does the same
push-on-open, resolve-on-close shape — it just also has to decide, using precedence, _when_ an
operator should fire even without a closing bracket forcing the issue.

**The rule set, scanning left to right:**

- **Number** → push onto the operand stack.
- **`(`** → always push onto the operator stack, no precedence check — exactly like a bracket
  matcher pushing every opener unconditionally.
- **Operator** → while the operator stack is non-empty, its top is _not_ `(`, and the top operator's
  precedence is **≥** the current operator's precedence, **resolve** the top first. Then push the
  current operator.
- **`)`** → **resolve** repeatedly until the operator stack's top is `(`, then pop and discard that
  `(`. This is the direct analogue of `stack.pop() != pairs[char]`: the closer forces everything
  back to its matching opener, except now "everything" means _computed_, not just _popped_.
- **End of string** → resolve whatever operators remain.

**Resolve** is one move, reused everywhere above: pop an operator, pop two operands (right first,
left second — same order as the postfix evaluator), apply, push the result back onto the operand
stack. It's the exact same pop-two-apply-push step as postfix evaluation — the two-stack method is,
underneath, running the postfix algorithm _lazily_, deciding moment to moment (via precedence and
parentheses) exactly when each resolve is allowed to fire.

```python
def precedence(op: str) -> int:
    return 2 if op in ("*", "/") else 1

def eval_infix(tokens: list[str]) -> float:
    operands: list[float] = []
    operators: list[str] = []

    def apply(op, left, right):
        return {"+": left + right, "-": left - right,
                "*": left * right, "/": left / right}[op]

    def resolve_top():
        op = operators.pop()
        right = operands.pop()
        left = operands.pop()
        operands.append(apply(op, left, right))

    for token in tokens:
        if token == "(":
            operators.append(token)
        elif token == ")":
            while operators[-1] != "(":
                resolve_top()
            operators.pop()                 # discard the matching '('
        elif token in "+-*/":
            while (operators and operators[-1] != "("
                   and precedence(operators[-1]) >= precedence(token)):
                resolve_top()
            operators.append(token)
        else:
            operands.append(float(token))

    while operators:
        resolve_top()

    return operands.pop()
```

### Trace: `(3 + 4) * 2`

| Token | Operand stack | Operator stack | Action                                         |
| ----- | ------------- | -------------- | ---------------------------------------------- |
| `(`   | `[]`          | `['(']`        | always push                                    |
| `3`   | `[3]`         | `['(']`        | push number                                    |
| `+`   | `[3]`         | `['(', '+']`   | top is `(` → no resolve, just push             |
| `4`   | `[3, 4]`      | `['(', '+']`   | push number                                    |
| `)`   | `[7]`         | `[]`           | resolve `+` (3+4=7), then pop the matching `(` |
| `*`   | `[7]`         | `['*']`        | operator stack empty → push                    |
| `2`   | `[7, 2]`      | `['*']`        | push number                                    |
| _end_ | `[14]`        | `[]`           | resolve `*` (7×2=14)                           |

Final answer `14` — the parenthesized addition was forced to resolve before the multiplication ever
saw it, purely from `)` triggering a resolve-to-matching-`(`, the same mechanic as Chapter 1's
bracket check with "compute" bolted onto "pop."

**Why `≥` and not `>`:** equal-precedence operators must resolve left to right (left-associative),
so when a new `+` arrives and the operator stack's top is also `+`, the old one has to fire _before_
the new one is pushed — otherwise `8 - 3 - 2` would silently associate right-to-left and give the
wrong answer. An operator that's right-associative instead — exponentiation (`^`) is the standard
example — would need `>` in that same comparison, so an equal-precedence operator on top is _not_
forced to resolve before the new one stacks on top of it. Neither this chapter's calculator nor the
LeetCode Basic Calculator family needs `^`, so `≥` is used throughout below, but the one-character
swap is worth knowing exists.

---

## Worked Example: A Basic Calculator

This is the LeetCode "Basic Calculator" family: implement `calculate(s)` supporting `+`, `-`, `*`,
`/`, and parentheses over a raw string — `"2*(5+5*2)/3+(6/2+8)"` — rather than a pre-tokenized list.
The two-stack method above is the engine; getting from a raw string to that method's clean token
list is the rest of the work:

- **Multi-digit numbers.** `"100"` is one token, not three digit tokens — the scan has to consume a
  whole run of digits before pushing.
- **Whitespace.** Skip it; it carries no meaning.
- **Unary `+`/`-`.** `-2 + 3` and `-(3 + 4)` both open with a sign that isn't between two operands —
  there's no left operand yet. The fix: track whether an operand is currently _expected_ (true at
  the start, right after `(`, and right after any operator) — if a `+`/`-` arrives while an operand
  is expected, push an implicit `0` first, turning the unary sign into an ordinary binary operator
  (`0 - 2` instead of a standalone `-2`).
- **Integer division.** LeetCode's spec (and this implementation) truncates toward zero — `-3 / 2`
  is `-1`, not `-2` — which is `int(a / b)` in Python, not the floor-dividing `//`.

```python
def calculate(s: str) -> int:
    def precedence(op: str) -> int:
        return 2 if op in ("*", "/") else 1

    def apply(op: str, left: int, right: int) -> int:
        if op == "+":
            return left + right
        if op == "-":
            return left - right
        if op == "*":
            return left * right
        return int(left / right)          # truncate toward zero, not floor

    def resolve_top() -> None:
        op = operators.pop()
        right = operands.pop()
        left = operands.pop()
        operands.append(apply(op, left, right))

    operands: list[int] = []
    operators: list[str] = []
    i, n = 0, len(s)
    expect_operand = True                 # true at start, after '(', after an operator

    while i < n:
        char = s[i]

        if char == " ":
            i += 1
            continue

        if char.isdigit():
            j = i
            while j < n and s[j].isdigit():
                j += 1
            operands.append(int(s[i:j]))  # consume the whole multi-digit run
            i = j
            expect_operand = False
            continue

        if char == "(":
            operators.append(char)
            i += 1
            expect_operand = True
            continue

        if char == ")":
            while operators[-1] != "(":
                resolve_top()
            operators.pop()               # discard the matching '('
            i += 1
            expect_operand = False
            continue

        # char is '+', '-', '*', or '/'
        if char in "+-" and expect_operand:
            operands.append(0)            # unary sign → binary op against an implicit 0

        while (operators and operators[-1] != "("
               and precedence(operators[-1]) >= precedence(char)):
            resolve_top()
        operators.append(char)
        i += 1
        expect_operand = True

    while operators:
        resolve_top()

    return operands.pop()
```

### Trace: the unary-minus case, `-2 + 3`

This is the subtle part the plain two-stack method didn't have to handle, so it's worth stepping
through on its own:

| `i` | `char` | `expect_operand` before | Action                                                   | Operands  | Operators |
| --- | ------ | ----------------------- | -------------------------------------------------------- | --------- | --------- |
| 0   | `-`    | `True`                  | unary → push `0`, then push `-` (nothing to resolve yet) | `[0]`     | `['-']`   |
| 1   | `2`    | `False`                 | push number                                              | `[0, 2]`  | `['-']`   |
| 2   | `+`    | `False`                 | resolve `-` first (`0 - 2 = -2`), then push `+`          | `[-2]`    | `['+']`   |
| 3   | ``     | —                       | skip                                                     | `[-2]`    | `['+']`   |
| 4   | `3`    | `True`                  | push number                                              | `[-2, 3]` | `['+']`   |
| end | —      | —                       | resolve `+` (`-2 + 3 = 1`)                               | `[1]`     | `[]`      |

Result `1`, matching `-2 + 3` evaluated the ordinary way. The `expect_operand` flag is doing all the
work: it's `True` only where a sign is being _read as a sign_ rather than as a subtraction between
two already-known values, which is exactly the position where a bare `-` needs the implicit-`0`
rewrite to fit the binary-operator machinery built for the rest of the expression.

This implementation was checked against the standard LeetCode-style regression set before being
written up here — nested parentheses, unary sign directly before an open paren, multi-digit
operands, and truncating division all resolve correctly:

```python
calculate("3 + 4 * 2")                    # 11
calculate("(3 + 4) * 2")                  # 14
calculate("14 - 3 / 2")                   # 13   (int(3/2) == 1, truncated toward zero)
calculate("-2+ 3")                        # 1
calculate("(1+(4+5+2)-3)+(6+8)")          # 23
calculate("2*(5+5*2)/3+(6/2+8)")          # 21
calculate("1-(     -2)")                  # 3    (unary minus immediately after '(')
calculate("- (3 + 4)")                    # -7   (unary minus immediately before '(')
```

**Complexity:** still **O(n) time** — the digit-scanning inner loop looks like a nested loop but
each character is consumed by it exactly once across the whole run, so the two loops together still
do O(n) total work, not O(n²). **O(n) space** for the two stacks, worst case one deeply nested chain
of parentheses or one long run of ascending-precedence operators.

**What this doesn't handle**, as honest scope, not oversight: floating-point literals (only integer
runs are parsed), exponentiation (would need `>` instead of `>=` in the precedence comparison per
the associativity note above), and malformed input validation (unbalanced parens are trusted to be
absent, matching the LeetCode problem's stated constraints). All three are small, mechanical
extensions to the same two-stack skeleton — none of them change the underlying algorithm.

---

## Shunting-Yard: Converting Infix to Postfix (briefly)

The two-stack method above resolves _eagerly_ — every time precedence says an operator on the stack
should fire, it immediately pops two operands, computes, and pushes the result back, so by the end
of the scan the operand stack holds nothing but the final number. Edsger Dijkstra's **shunting-yard
algorithm** reuses almost the identical stack discipline — same precedence comparison, same
push-`(`-unconditionally, same resolve-until-matching-`(` on `)` — for a different job: instead of
computing, it _reorders_. Numbers get appended straight to an output list the moment they're seen;
operators sit on an operator stack under the same precedence rule as above; but the step that would
have been "pop operator, pop two operands, apply, push result" is instead just "pop operator, append
it to the output list." Drain the operator stack at the end and the output list _is_ the infix
expression rewritten as postfix — `3 4 2 * +` for `3 + 4 * 2` — ready to hand to the single-stack
evaluator from earlier in this chapter. It's a two-pass strategy where the two-stack method above is
a one-pass strategy, and it earns its keep specifically when the postfix form itself is the useful
artifact — caching a parsed expression to re-evaluate repeatedly against different operand values,
building an AST, or compiling straight to stack-machine bytecode — rather than a single throwaway
numeric answer. Worth knowing it exists and what it's for; the direct two-stack evaluation earlier
in this chapter is the version that actually gets asked as a coding interview problem, which is
where the full implementation effort in this chapter went.

---

## This Part, Converged

Every chapter in this Part restricted access to a sequence in a different, deliberate way, and each
restriction bought something specific: [[01-stack|Chapter 1]] restricted a stack to one end and got
O(1) undo-style operations plus a literal model of the call stack; [[02-queue|Chapter 2]] split
access across two ends and got FIFO ordering for level-order, breadth-first processing; Chapter 3's
circular queue traded shifting for modulo arithmetic over a fixed buffer; [[04-deque|Chapter 4]]
generalized both into one structure with O(1) at either end; [[05-monotonic-stack|Chapter 5]] and
Chapter 6 enforced an _ordering invariant_ at push time to turn an O(n²) rescan into an amortized
O(n) single pass.

This chapter is where those individually narrow tools stop looking like separate party tricks and
start looking like one discipline: **pick the restricted-access shape that matches how the scan
actually needs to move, and compose more than one of them when the problem has more than one moving
part.** Postfix evaluation needed exactly one stack, because postfix's whole design point is that
one LIFO structure is sufficient once precedence has already been baked into token order. Infix
evaluation needed two — an operand stack playing the same role as the postfix evaluator's stack, and
an operator stack whose job is a direct generalization of Chapter 1's bracket matcher, deciding via
precedence _when_ the first stack is allowed to fire. A real parser — the Python tokenizer building
an AST, a SQL query planner, the calculator app on a phone — is never one stack doing one trick in
isolation; it's several restricted-access structures, each doing the narrow job it's good at, wired
together. That composition, not any single push or pop, is the actual transferable skill this Part
was teaching.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
