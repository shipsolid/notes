---
title: "16 — Error Handling"
description: "Exceptions are Python's mechanism for splitting 'the code that notices a failure' from 'the code that decides what to do about it' — this chapter is what that split actually guarantees, the precise rules `except`, `else`, and `finally` run under, and where a custom exception hierarchy and explicit chaining beat a bare `except:` and a silently swallowed traceback."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
zettelId: "202607301922-8"
---

# 16 — Error Handling

Every function has two kinds of output: the value it returns on success, and everything that can go
wrong on the way there. Python's answer to the second kind is the exception — an object that carries
a failure up the call stack until something written specifically to catch it does so, skipping every
ordinary `return` in between. That's a deliberate design choice, not a workaround: Python leans on
**EAFP** ("easier to ask forgiveness than permission") over **LBYL** ("look before you leap") — try
the operation and handle the failure, rather than pre-checking every precondition before attempting
it. This chapter is the full contract behind that choice: what `try`/`except`/`else`/`finally` each
guarantee, how to raise and re-raise without losing information, how to design a custom exception
hierarchy that communicates failure _type_ instead of failure _text_, and how `raise ... from ...`
keeps or discards the original cause when one failure triggers another.

---

## try/except: Catching What You Can Handle

A `try` block wraps code that might fail; each `except` clause names one failure it knows how to
recover from:

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero")
```

Binding the exception object with `as e` gives access to its message and attributes, instead of just
knowing that _something_ went wrong:

```python
items = [1, 2, 3]
try:
    print(items[10])
except IndexError as e:
    print(f"IndexError: {e}")   # "list index out of range"
```

A single `except` clause can name a **tuple** of exception types when the recovery is identical for
all of them — one handler, several acceptable failure modes, instead of two near-duplicate clauses:

```python
def parse_int(s: str | None) -> int | None:
    try:
        return int(s)
    except (ValueError, TypeError) as e:
        print(f"Conversion failed: {e}")
        return None

parse_int("42")    # 42
parse_int("abc")   # None — ValueError: invalid literal for int()
parse_int(None)    # None — TypeError: int() argument must be a string...
```

`int("abc")` and `int(None)` fail for different reasons — one is a bad _value_, the other a bad
_type_ — but `parse_int` treats both the same way, so one tuple-based clause is more honest here
than two clauses that would do exactly the same thing.

---

## Ordering except Clauses: Top to Bottom, Specific First

Python checks `except` clauses **top to bottom** and stops at the first match, so clause order is
part of the program's logic, not cosmetic. A common temptation is adding a catch-all at the end for
safety:

```python
try:
    x = int("bad")
except ValueError:
    print("ValueError handled specifically")
except Exception as e:
    # Reached only for failures the clause above didn't already claim.
    print(f"Unexpected error: {type(e).__name__}: {e}")
```

That ordering is load-bearing: `except Exception` sits _after_ the narrower clause specifically
because `ValueError` **is** an `Exception` — any subclass matches an `except` naming one of its
ancestors. Swap the order and the broad clause would match first and swallow the specific one
silently, and the narrower branch would never run. Treat a broad `except Exception` as a last-resort
safety net, written last, not as the first or only clause — the closing section of this chapter
covers why that broad net is risky even then.

---

## Worked Example: A Config Loader With Three Distinct Failure Modes

**Problem:** read a single integer setting from a text file, giving the caller enough information to
tell "the file is missing" apart from "the file exists but isn't a valid integer" and "the file
exists but can't be read" — without parsing an error message string to find out which.

```python
def read_config(path: str) -> int | None:
    try:
        with open(path) as f:
            data = f.read()
            return int(data.strip())
    except FileNotFoundError:
        print(f"File not found: {path}")
    except ValueError as e:
        print(f"Bad content — expected integer: {e}")
    except PermissionError:
        print("No permission to read file")
    return None

read_config("/nonexistent/path.txt")   # FileNotFoundError branch
```

This is EAFP in practice: rather than checking `os.path.exists(path)`, confirming read permission,
and validating the content's shape before ever opening the file — three separate LBYL checks, each
with its own race condition against a file that could change between the check and the actual read —
the function just attempts the whole operation and lets three narrow `except` clauses report exactly
which step failed. Each clause maps to one real failure mode a caller might handle differently
(retry after creating a default config file vs. surface a data-corruption warning vs. escalate a
permissions problem), and because `FileNotFoundError` and `PermissionError` are unrelated exception
types while `ValueError` is unrelated to both, the ordering rule from the previous section doesn't
even come into tension here — there's exactly one clause per distinct failure, and no clause is a
supertype of another.

---

## else and finally: What Runs, and When

`else` runs only when the `try` block raised nothing at all; `finally` runs unconditionally —
success, handled failure, or unhandled failure propagating through:

```python
def safe_divide(a: float, b: float) -> float | None:
    try:
        result = a / b
    except ZeroDivisionError:
        print("  Division by zero!")
        result = None
    else:
        print(f"  Success: {a} / {b} = {result}")
    finally:
        print("  (finally always runs)")
    return result

safe_divide(10, 2)   # else branch, then finally
safe_divide(10, 0)   # except branch, then finally
```

Putting the success path in `else` rather than at the end of `try` matters for one reason: code
inside `try` is _watched_ for the named exceptions, so a bug in success-handling code placed there
could get miscaught as if it were the very failure being guarded against. Code in `else` runs only
after `try` has already succeeded, so it sits outside what the `except` clauses above it are
watching.

`finally`'s classic job is guaranteed cleanup — releasing a resource whether or not the code using
it raised:

```python
def process_file(path: str) -> str:
    f = None
    try:
        f = open(path)
        return f.read()
    except FileNotFoundError:
        return ""
    finally:
        if f:
            f.close()   # guaranteed close even if read() raises
```

That pattern — open, guard with `try`, close in `finally` — is exactly what the `with` statement
automates. A **context manager** is any object implementing `__enter__`/`__exit__`; `open()` returns
one, and `with` guarantees `__exit__` (which closes the file) runs on the way out of the block,
exception or not, with zero manual bookkeeping:

```python
def process_file_clean(path: str) -> str:
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        return ""
```

Prefer `with` over a hand-written `try`/`finally` for anything acquire-then-release-shaped — file
handles, locks, network connections. It can't be broken by forgetting to write the `finally` clause,
because there's no `finally` left to forget.

---

## Raising and Re-raising

`raise` signals a failure explicitly, with a message aimed at whoever's debugging it, not just
whoever's catching it:

```python
def set_age(age: int) -> int:
    if not isinstance(age, int):
        raise TypeError(f"age must be int, got {type(age).__name__}")
    if age < 0 or age > 150:
        raise ValueError(f"age {age} is out of range [0, 150]")
    return age
```

The type chosen here is doing real work, not just picking whichever built-in sounds close enough:
`TypeError` says _the caller passed the wrong kind of thing_; `ValueError` says _the type was right,
but this particular value isn't acceptable_. A caller further up the stack can act on that
distinction — a `TypeError` usually points at a bug in the caller's own code, while a `ValueError`
more often means bad input data that's worth reporting back to a user rather than treating as a
crash.

Inside an `except` block, a bare `raise` — no argument — re-raises the exception currently being
handled, traceback intact:

```python
def logged_operation() -> float:
    try:
        return 1 / 0
    except ZeroDivisionError:
        print("LOG: zero division occurred")
        raise   # re-raise without losing the original traceback

try:
    logged_operation()
except ZeroDivisionError:
    print("Caught re-raised exception")
```

This is the standard shape for "log it, then let someone else decide what to do": the log line runs
locally, where context is richest, and the exception still propagates to whatever caller actually
knows how to recover. A bare `raise` only works while an exception is actively being handled — used
outside an `except` block (or after the handled exception has already been cleared) it raises
`RuntimeError: No active exception to re-raise`.

One scoping gotcha worth carrying forward: the name bound by `except ... as e` is deleted
automatically the moment that `except` block ends — Python does this specifically so the exception,
and everything it drags along via its traceback, doesn't stay alive in a variable longer than
needed. Referencing `e` after the block, or expecting it to survive into a later `elif`-style branch
or a subsequent loop iteration, raises `NameError`, not the value you were expecting. If something
from `e` needs to outlive the block, assign it to a plain variable inside the `except` clause first.

---

## Custom Exceptions: Failure as a Type, Not a String

A custom exception hierarchy turns "parse the error message to figure out what happened" into "catch
the specific type" — the same benefit a typed function signature gives over passing everything as an
untyped blob:

```python
class AppError(Exception):
    """Base for all application errors."""

class ValidationError(AppError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(f"Validation failed for '{field}': {message}")

class NetworkError(AppError):
    def __init__(self, url: str, status_code: int):
        self.url = url
        self.status_code = status_code
        super().__init__(f"HTTP {status_code} for {url}")

class RetryableNetworkError(NetworkError):
    """Transient network error — caller may retry."""
```

Two details turn this into a genuine hierarchy rather than three unrelated classes that happen to
subclass `Exception`. First, every `__init__` still calls `super().__init__(message)`, so `str(e)`
and the default traceback formatting keep working exactly the way they would for a built-in
exception — a custom exception that skips this loses `str(e)` entirely. Second, each `__init__`
stores its own structured attributes (`field`, `url`, `status_code`) _before_ building that message,
so a caller can branch on `e.status_code` directly instead of regex-matching the text of `str(e)` —
the whole point of giving failures a type instead of leaving them as a string.

---

## Worked Example: Dispatching on an Exception Hierarchy

**Problem:** given calls that can fail in one of three related but distinct ways — a transient
network error that's worth retrying, a permanent network error that isn't, and a validation error
that's neither — route each to the right handling logic in one place, without inspecting message
text.

```python
def fetch(url: str) -> None:
    if "timeout" in url:
        raise RetryableNetworkError(url, 503)
    if "error" in url:
        raise NetworkError(url, 404)

def validate(data: dict) -> None:
    if "email" not in data:
        raise ValidationError("email", "field is required")

for call in [
    lambda: fetch("http://api/timeout"),
    lambda: fetch("http://api/error"),
    lambda: validate({"name": "Alice"}),
]:
    try:
        call()
    except RetryableNetworkError as e:
        print(f"  [RETRY] {e}")
    except NetworkError as e:
        print(f"  [NET] {e.status_code} - {e.url}")
    except ValidationError as e:
        print(f"  [VALIDATION] field={e.field} — {e}")
```

The `except` ordering here follows the same rule as the plain-`Exception` example earlier:
`RetryableNetworkError` must be caught before its parent `NetworkError`, or every retryable failure
would match the parent clause first and never reach the retry branch. A caller uninterested in the
distinction can still write a single `except AppError as e:` and treat every application failure
uniformly — the hierarchy costs nothing when fine-grained handling isn't needed, and pays for itself
the moment it is, without changing anything about how `fetch` or `validate` raise in the first
place.

---

## Exception Chaining: Preserving or Suppressing the Cause

Raising a new exception while handling another is common — wrapping a low-level failure in a
higher-level one that means something to the caller. Python tracks _why_ the new exception happened
either way, but shows it differently depending on how the new `raise` is written.

Doing nothing special still chains automatically: raising inside an `except` block without `from`
sets the new exception's `__context__` to the one being handled, and the traceback prints both,
joined by "During handling of the above exception, another exception occurred." `raise ... from ...`
makes that link explicit and intentional instead of incidental — it sets `__cause__`, and the
traceback instead reads "The above exception was the direct cause of the following exception":

```python
def load_config(path: str) -> int:
    try:
        with open(path) as f:
            return int(f.read())
    except FileNotFoundError as e:
        raise RuntimeError(f"Config not found: {path}") from e

try:
    load_config("/nonexistent/config.txt")
except RuntimeError as e:
    print(f"RuntimeError: {e}")
    print(f"Caused by: {e.__cause__}")   # the original FileNotFoundError
```

`from e` is the honest version of "this failure happened because that one did" — worth reaching for
the moment a caller might need the low-level detail (which file, which syscall) _and_ the
higher-level one (config couldn't load) to actually debug the problem.

`raise ... from None` does the opposite: it suppresses the cause entirely, for cases where
re-raising is a deliberate, clean re-wrap and the original exception is noise the caller shouldn't
have to sift through:

```python
def safe_parse(text: str) -> int:
    try:
        return int(text)
    except ValueError:
        raise ValueError(f"Expected a number, got: {text!r}") from None

try:
    safe_parse("abc")
except ValueError as e:
    print(f"ValueError: {e}")
    print(f"Cause suppressed: {e.__cause__}")   # None
```

Here the original `ValueError` (`invalid literal for int() with base 10: 'abc'`) adds nothing a
caller needs beyond the friendlier message already being raised in its place, so `from None` keeps
the traceback focused on the one exception that actually matters to whoever's reading it.

## Letting an Exception Propagate vs. Handling It

Catching an exception isn't automatically the responsible move — sometimes the correct thing to do
is nothing at all, letting it climb the stack to a caller that actually knows what to do about it. A
few habits separate deliberate error handling from a bug hiding behind a `try` block:

- **A bare `except:` — no exception type at all — is worse than `except Exception:`.** It catches
  `BaseException`, which includes `KeyboardInterrupt` and `SystemExit`, so a truly bare `except:`
  can swallow a user's Ctrl-C or block a clean process exit. If a broad net is genuinely needed,
  write `except Exception:` explicitly, and only as the last clause in the chain.
- **`except SomeError: pass` is where bugs go to hide.** Catching a failure and doing nothing about
  it — not logging it, not re-raising it, not returning a sentinel the caller checks — makes the
  program's behavior indistinguishable from success at every call site above it. At minimum, log
  before swallowing; more often, don't swallow at all.
- **Catch only what you can act on, at the layer that can act on it.** A helper three calls deep
  that catches `NetworkError` just to `print()` it and return `None` has taken the decision away
  from every caller above it — some of which might have wanted to retry, alert on it, or fail the
  whole request loudly. The log-then-re-raise pattern from earlier in this chapter exists precisely
  so that decision gets made at the layer with enough context to make it well.
- **Some exceptions are a signal to change the approach, not to add a `try`.** `RecursionError` is
  the clearest case: catching it and retrying the same recursive call accomplishes nothing, because
  the call-stack limit hasn't moved. [[03-recursion|Part 01, Chapter 3]] covers why that limit
  exists and the fix that actually works — converting the recursion to iteration, not wrapping it in
  a handler.
- **Reach for a custom exception when a caller needs to branch on _what kind_ of failure occurred**,
  not merely that one did. A bare `Exception("something went wrong")` forces every caller back to
  parsing a message string — exactly the string-typed failure the hierarchy section of this chapter
  replaced with real, catchable types.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
