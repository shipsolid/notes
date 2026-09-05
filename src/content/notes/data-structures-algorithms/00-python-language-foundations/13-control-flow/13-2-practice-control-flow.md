---
title: "Practice: Control Flow"
description: "The runnable practice source behind the Control Flow chapter — if/elif/else and nested if, the ternary expression, match/case structural pattern matching, for and while loops with enumerate/zip/dict iteration, break/continue/pass, the loop's else clause, and nested-loop early exit."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031825"
---

# Practice: Control Flow

This is the raw practice source behind [[13-1-control-flow|13 — Control Flow]] — every branching and
looping drill written while working through if/elif/else, the ternary, match/case, for/while loops,
break/continue/pass, and the loop's own else clause. None of it has been rewritten or bug-fixed
here; this is a structural pass (frontmatter, headings) only, not a correctness review.

## If / Elif / Else (and Nested If)

```python
def print_if_elif_else():
  score = 72

  if score >= 90:
    grade = "A"
  elif score >= 80:
    grade = "B"
  elif score >= 70:
    grade = "C"
  else:
    grade = "F"

  print("Grade:", grade)  # C

  # Nested if
  is_member = True
  cart_total = 150

  if is_member:
    if cart_total >= 100:
      discount = 20
    else:
      discount = 10
  else:
    discount = 0

  print("Discount:", discount)  # 20
```

## Ternary (Conditional Expression)

```python
def print_ternary():
  age = 20
  status = "adult" if age >= 18 else "minor"
  print("Status:", status)  # adult

  # Nested ternary — readable only for two levels max
  temp = 35
  weather = "hot" if temp > 30 else ("cold" if temp < 10 else "mild")
  print("Weather:", weather)  # hot

  # Common use: default value
  raw = None
  value = raw if raw is not None else "default"
  print("Value:", value)  # default
```

## match / case (Structural Pattern Matching, Python 3.10+)

```python
def print_match_case():
  # Simple value match — replaces long if/elif chains on a single variable
  def describe_status(code):
    match code:
      case 200:
        return "OK"
      case 404:
        return "Not Found"
      case 500:
        return "Server Error"
      case _:          # wildcard — matches anything
        return "Unknown"

  print(describe_status(404))   # Not Found
  print(describe_status(999))   # Unknown

  # Match on type + structure (tuple unpacking)
  def handle_command(command):
    match command:
      case ("quit",):
        return "Exiting"
      case ("go", direction):
        return f"Going {direction}"
      case ("pick", item, count):
        return f"Picked {count} of {item}"
      case _:
        return "Unknown command"

  print(handle_command(("go", "north")))         # Going north
  print(handle_command(("pick", "apple", 3)))    # Picked 3 of apple

  # Match on class attributes using guards
  class Point:
    def __init__(self, x, y):
      self.x = x
      self.y = y

  def classify_point(p):
    match p:
      case Point(x=0, y=0):
        return "Origin"
      case Point(x=0, y=y):
        return f"On Y-axis at {y}"
      case Point(x=x, y=0):
        return f"On X-axis at {x}"
      case Point(x=x, y=y) if x == y:
        return f"On diagonal at {x}"
      case Point(x=x, y=y):
        return f"Point ({x}, {y})"

  print(classify_point(Point(0, 0)))   # Origin
  print(classify_point(Point(0, 5)))   # On Y-axis at 5
  print(classify_point(Point(3, 3)))   # On diagonal at 3
  print(classify_point(Point(2, 7)))   # Point (2, 7)
```

## For Loop

```python
def print_for_loop():
  # Iterate over a list
  fruits = ["apple", "banana", "cherry"]
  for fruit in fruits:
    print(fruit)

  # range(stop), range(start, stop), range(start, stop, step)
  for i in range(5):          # 0 1 2 3 4
    print(i, end=" ")
  print()

  for i in range(2, 10, 2):   # 2 4 6 8
    print(i, end=" ")
  print()

  for i in range(10, 0, -3):  # 10 7 4 1
    print(i, end=" ")
  print()

  # enumerate — index + value together
  languages = ["Python", "Go", "Rust"]
  for idx, lang in enumerate(languages, start=1):
    print(f"{idx}. {lang}")

  # zip — iterate two sequences in parallel
  names  = ["Alice", "Bob", "Carol"]
  scores = [88, 94, 76]
  for name, score in zip(names, scores):
    print(f"{name}: {score}")

  # Iterating over a dict
  config = {"host": "localhost", "port": 8080, "debug": True}
  for key, value in config.items():
    print(f"  {key} = {value}")
```

## While Loop

```python
def print_while_loop():
  # Basic while
  count = 0
  while count < 5:
    print(count, end=" ")
    count += 1
  print()  # 0 1 2 3 4

  # while with a sentinel value
  data = [3, 7, -1, 5, 2]
  idx = 0
  while idx < len(data) and data[idx] != -1:
    print(data[idx], end=" ")
    idx += 1
  print()  # 3 7

  # do-while pattern (Python has no do-while, simulate with while True + break)
  import random
  random.seed(42)
  while True:
    roll = random.randint(1, 6)
    print("Rolled:", roll)
    if roll == 6:
      break

  # Countdown
  n = 3
  while n > 0:
    print(f"T-minus {n}")
    n -= 1
  print("Liftoff!")
```

## break / continue / pass

```python
def print_break_continue_pass():
  # break — exit the loop immediately
  for n in range(10):
    if n == 5:
      break
    print(n, end=" ")
  print()  # 0 1 2 3 4

  # continue — skip current iteration, proceed to next
  for n in range(10):
    if n % 2 == 0:
      continue
    print(n, end=" ")
  print()  # 1 3 5 7 9

  # pass — syntactic placeholder; does nothing
  for n in range(5):
    if n == 3:
      pass   # TODO: handle this case later
    else:
      print(n, end=" ")
  print()  # 0 1 2 4

  # break in while
  target = 7
  current = 0
  while True:
    if current == target:
      print(f"Found {target}")
      break
    current += 1
```

## Loop else Clause

```python
def print_loop_else():
  # The else block runs only if the loop completed WITHOUT hitting a break.
  # Useful for "search and report not-found" patterns.

  def find_prime(numbers):
    for n in numbers:
      for divisor in range(2, n):
        if n % divisor == 0:
          break          # not prime — skip else
      else:
        print(f"{n} is prime")  # loop finished without break

  find_prime([4, 5, 6, 7, 8, 11])

  # while-else
  items = [1, 3, 5, 8, 11]
  target = 6
  i = 0
  while i < len(items):
    if items[i] == target:
      print(f"Found {target} at index {i}")
      break
    i += 1
  else:
    print(f"{target} not found in list")  # runs because no break hit
```

## Nested Loops

```python
def print_nested_loops():
  # Multiplication table
  for i in range(1, 4):
    for j in range(1, 4):
      print(f"{i}x{j}={i*j}", end="  ")
    print()

  # Matrix traversal
  matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]
  for row in matrix:
    for cell in row:
      print(cell, end=" ")
    print()

  # Early exit from nested loop using a flag
  found = False
  for row in matrix:
    for cell in row:
      if cell == 5:
        found = True
        break
    if found:
      break
  print("Found 5:", found)
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
