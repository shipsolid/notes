---
title: "Practice: Error Handling"
description: "The raw practice corpus behind the Error Handling chapter — runnable functions covering try/except basics, multiple except clauses, else/finally, raise and re-raise, custom exception hierarchies, and exception chaining."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031821"
---

# Practice: Error Handling

This is the raw practice source behind [[16-1-error-handling|16 — Error Handling]] — the runnable
functions written while working through `try`/`except`/`else`/`finally`, raising and re-raising,
custom exception hierarchies, and exception chaining that the chapter distills into worked examples.
None of the code below has been rewritten or bug-fixed here; this is a structural pass (frontmatter,
headings) only, not a correctness review.

## try / except Basics

```python
def print_try_except():
  # Basic: catch a specific exception
  try:
    result = 10 / 0
  except ZeroDivisionError:
    print("Cannot divide by zero")

  # Access the exception object with 'as'
  try:
    items = [1, 2, 3]
    print(items[10])
  except IndexError as e:
    print(f"IndexError: {e}")   # list index out of range

  # Catch multiple exception types in one clause
  def parse_int(s):
    try:
      return int(s)
    except (ValueError, TypeError) as e:
      print(f"Conversion failed: {e}")
      return None

  print(parse_int("42"))    # 42
  print(parse_int("abc"))   # Conversion failed: ...
  print(parse_int(None))    # Conversion failed: ...
```

## Multiple except Clauses

```python
def print_multiple_except():
  def read_config(path):
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

  read_config("/nonexistent/path.txt")   # FileNotFoundError

  # Catch a broad base class only as a last resort
  try:
    x = int("bad")
  except ValueError:
    print("ValueError handled specifically")
  except Exception as e:
    # Catches everything else — avoid being this broad by default
    print(f"Unexpected error: {type(e).__name__}: {e}")
```

## else and finally

```python
def print_else_finally():
  # else  — runs if no exception was raised in try
  # finally — runs always, whether or not an exception occurred

  def safe_divide(a, b):
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

  safe_divide(10, 2)   # else + finally
  safe_divide(10, 0)   # except + finally

  # Common finally pattern: ensure cleanup even on error
  def process_file(path):
    f = None
    try:
      f = open(path)
      return f.read()
    except FileNotFoundError:
      return ""
    finally:
      if f:
        f.close()   # guaranteed close even if read raises

  # Context managers (with statement) do this automatically — prefer them
  def process_file_clean(path):
    try:
      with open(path) as f:
        return f.read()
    except FileNotFoundError:
      return ""

  process_file_clean("/tmp/nonexistent.txt")
```

## raise

```python
def print_raise():
  # Raise a built-in exception
  def set_age(age):
    if not isinstance(age, int):
      raise TypeError(f"age must be int, got {type(age).__name__}")
    if age < 0 or age > 150:
      raise ValueError(f"age {age} is out of range [0, 150]")
    return age

  print(set_age(25))

  try:
    set_age(-5)
  except ValueError as e:
    print(e)

  try:
    set_age("thirty")
  except TypeError as e:
    print(e)

  # Re-raise the current exception (propagate after logging)
  def logged_operation():
    try:
      return 1 / 0
    except ZeroDivisionError:
      print("LOG: zero division occurred")
      raise   # re-raise without losing original traceback

  try:
    logged_operation()
  except ZeroDivisionError:
    print("Caught re-raised exception")
```

## Custom Exceptions

```python
def print_custom_exceptions():
  # Custom exception hierarchy
  class AppError(Exception):
    """Base for all application errors."""

  class ValidationError(AppError):
    def __init__(self, field, message):
      self.field = field
      super().__init__(f"Validation failed for '{field}': {message}")

  class NetworkError(AppError):
    def __init__(self, url, status_code):
      self.url = url
      self.status_code = status_code
      super().__init__(f"HTTP {status_code} for {url}")

  class RetryableNetworkError(NetworkError):
    """Transient network error — caller may retry."""

  def fetch(url):
    # Simulated error
    if "timeout" in url:
      raise RetryableNetworkError(url, 503)
    if "error" in url:
      raise NetworkError(url, 404)

  def validate(data):
    if "email" not in data:
      raise ValidationError("email", "field is required")

  # Catch by base class to handle all app errors uniformly
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

## Exception Chaining

```python
def print_exception_chaining():
  # raise X from Y — explicit chaining; Y is the cause
  def load_config(path):
    try:
      with open(path) as f:
        return int(f.read())
    except FileNotFoundError as e:
      raise RuntimeError(f"Config not found: {path}") from e

  try:
    load_config("/nonexistent/config.txt")
  except RuntimeError as e:
    print(f"RuntimeError: {e}")
    print(f"Caused by: {e.__cause__}")

  # raise X from None — suppress the original cause (clean re-wrap)
  def safe_parse(text):
    try:
      return int(text)
    except ValueError:
      raise ValueError(f"Expected a number, got: {text!r}") from None

  try:
    safe_parse("abc")
  except ValueError as e:
    print(f"ValueError: {e}")
    print(f"Cause suppressed: {e.__cause__}")  # None
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
