---
title: "Practice Patterns — Full Source Catalogue 1"
description: "The complete pattern-printing drill corpus behind the Pattern Practice & Loops chapter — every triangle, pyramid, rhombus, letter-art, and name-banner function as runnable Python, grouped by shape family."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031708"
---

# Practice Patterns — Full Source Catalogue

This is the raw practice corpus behind [[01-1-pattern-practice-and-loops|Part 00, Chapter 1]] —
every pattern-printing drill written while building the row/column intuition that chapter distills
into a general technique. Where the chapter extracts the underlying formula for three worked
examples, this note keeps the full, unabridged set: every triangle, pyramid, rhombus, letter, and
name-banner function, grouped by shape family instead of the order they were originally written in.

Each section is a standalone, runnable function — copy the one you need. None of them have been
rewritten or bug-fixed here; this is a structural pass (frontmatter, headings, grouping) only, not a
correctness review. Several of the letter-art and name-banner functions below are the concrete
example [[01-1-pattern-practice-and-loops|the chapter's closing section]] points to when it warns
about hardcoded `if`/`elif` chains that only work for one specific row count instead of generalizing
to a formula.

---

## Numbered Warm-Up Patterns (1–15)

The classic pattern-printing drill set — triangles, pyramids, and number/letter grids, each
isolating one row-to-formula relationship before the shape families below start combining them.

### 1. Solid Rectangle of Stars

```python
def print_pattern1():
  # Given an integer n, print an n x n grid of stars.
  # Example for N=5:
  #   *****
  #   *****
  #   *****
  #   *****
  #   *****

  class Patterns:
    def pattern1(self, n):
      for _ in range(n):
        print("*" * n)

  Patterns().pattern1(5)

  class Patterns:
    # Function to print pattern1
    def pattern1(self, n):
      # Outer loop will run for rows.
      for i in range(n):
        # Inner loop will run for columns.
        for j in range(n):
          print("*", end="")

        """ As soon as N stars are printed, move
        to the next row and give a line break."""
        print()

  Patterns().pattern1(5)
```

### 2. Left-Aligned Star Triangle

```python
def print_pattern2():
  # Given an integer n, print an increasing left-aligned triangle of stars.
  # Example for N=5:
  #   *
  #   **
  #   ***
  #   ****
  #   *****

  class Patterns:
    # Function to print pattern2
    def pattern2(self, n):
      for i in range(1, n + 1):
        print("*" * i)

  # Example usage:
  Patterns().pattern2(5)

  class Solution:
    def pattern2(self, n):
      for i in range(n):
        for j in range(0, i):
          print("*", end="")
        print()

  Solution().pattern2(5)
```

### 3. Increasing Number Triangle

```python
def print_pattern3():
  # Given an integer n, print rows of increasing numbers starting from 1.
  # Example for N=5:
  #   1
  #   12
  #   123
  #   1234
  #   12345

  class Patterns:
    # Function to print pattern3
    def pattern3(self, n):
      for i in range(1, n + 1):
        for j in range(1, i + 1):
          print(j, end="")
        print()

  # Example usage:
  Patterns().pattern3(5)
```

### 4. Repeated Row Number Triangle

```python
def print_pattern4():
  # Given an integer n, each row i repeats the digit i, i times.
  # Example for N=5:
  #   1
  #   22
  #   333
  #   4444
  #   55555

  class Patterns:
    # Function to print pattern4
    def pattern4(self, n):
      for i in range(1, n + 1):
        print(str(i) * i)

  # Example usage:
  Patterns().pattern4(5)
```

### 5. Inverted Left-Aligned Star Triangle

```python
def print_pattern5():
  # Given an integer n, print a decreasing left-aligned triangle of stars.
  # Example for N=5:
  #   *****
  #   ****
  #   ***
  #   **
  #   *

  class Patterns:
    # Function to print pattern5
    def pattern5(self, n):
      for i in range(n, 0, -1):
        print("*" * i)

  # Example usage:
  Patterns().pattern5(5)
```

### 6. Inverted Number Triangle

```python
def print_pattern6():
  # Given an integer n, print rows of decreasing numbers starting from n down to 1.
  # Example for N=5:
  #   12345
  #   1234
  #   123
  #   12
  #   1

  class Patterns:
    # Function to print pattern6 with inline comments
    def pattern6(self, n):
      # Loop from n down to 1
      for i in range(n, 0, -1):
        # Print numbers from 1 to i in the same row
        for j in range(1, i + 1, 1):
          print(j, end="")
        # Move to the next line after each row
        print()

  # Example usage:
  Patterns().pattern6(5)

  class Solution:
    def pattern6(self, n):
      for i in range(n):
        for j in range(n):
          print(j + 1, end="")
        n -= 1
        print()

  Solution().pattern6(5)
```

### 7. Full Pyramid of Stars

```python
def print_pattern7():
  # Given an integer n, print an upward-pointing full pyramid of stars.
  # Example for N=5:
  #       *
  #      ***
  #     *****
  #    *******
  #   *********

  class Patterns:
    # Function to print pattern7
    def pattern7(self, n):
      for i in range(n):
        # Print spaces
        for j in range(n - i - 1):
          print(" ", end="")
        # Print stars
        for k in range(2 * i + 1):
          print("*", end="")
        # Move to next line
        print()

  # Example usage:
  Patterns().pattern7(5)
```

### 8. Inverted Full Pyramid of Stars

```python
def print_pattern8():
  # Given an integer n, print a downward-pointing full pyramid of stars.
  # Example for N=5:
  #   *********
  #    *******
  #     *****
  #      ***
  #       *

  class Patterns:
    # Function to print pattern8
    def pattern8(self, n):
      for i in range(n):
        # Print spaces
        for j in range(i):
          print(" ", end="")
        # Print stars
        for k in range(2 * (n - i) - 1):
          print("*", end="")
        # Move to next line
        print()

  # Example usage:
  Patterns().pattern8(5)
```

### 9. Diamond of Stars

```python
def print_pattern9():
  # Given an integer n, print a diamond (full pyramid + inverted full pyramid).
  # Example for N=5:
  #       *
  #      ***
  #     *****
  #    *******
  #   *********
  #   *********
  #    *******
  #     *****
  #      ***
  #       *

  class Patterns:
    # Function to print pattern9
    def pattern9(self, n):
      # First half (including middle) - pattern7
      for i in range(n):
        # Print spaces
        for j in range(n - i - 1):
          print(" ", end="")
        # Print stars
        for k in range(2 * i + 1):
          print("*", end="")
        # Move to next line
        print()

      # Second half - pattern8
      for i in range(n):
        # Print spaces
        for j in range(i):
          print(" ", end="")
        # Print stars
        for k in range(2 * (n - i) - 1):
          print("*", end="")
        # Move to next line
        print()

  # Example usage:
  Patterns().pattern9(5)
```

### 10. Hourglass Star Triangle

```python
def print_pattern10():
  # Given an integer n, print increasing then decreasing star rows.
  # Example for N=5:
  #   *
  #   **
  #   ***
  #   ****
  #   *****
  #   ****
  #   ***
  #   **
  #   *

  class Patterns:
    # Function to print pattern10
    def pattern10(self, n):
      # First half - increasing stars
      for i in range(1, n + 1):
        print("*" * i)

      # Second half - decreasing stars
      for i in range(n - 1, 0, -1):
        print("*" * i)

  # Example usage:
  Patterns().pattern10(5)
```

### 11. Binary Triangle (0s and 1s)

```python
def print_pattern11():
  # Given an integer n, print a triangle where each cell is 1 if (row+col) is
  # even, else 0.
  # Example for N=5:
  #   1
  #   0 1
  #   1 0 1
  #   0 1 0 1
  #   1 0 1 0 1

  class Patterns:
    # Function to print pattern11
    def pattern11(self, n):
      for i in range(n):
        for j in range(i + 1):
          # If sum of row and column is even, print 1, else print 0
          if (i + j) % 2 == 0:
            print("1", end="")
          else:
            print("0", end="")
          # Add space between numbers except for the last number in the row
          if j < i:
            print(" ", end="")
        # Move to next line
        print()

  # Example usage:
  Patterns().pattern11(5)
```

### 12. Number Mirror Triangle

```python
def print_pattern12():
  # Given an integer n, each row prints ascending then descending numbers
  # with spaces in the middle.
  # Example for N=5:
  #   1        1
  #   12      21
  #   123    321
  #   1234  4321
  #   1234554321

  class Patterns:
    # Function to print pattern12
    def pattern12(self, n):
      for i in range(1, n + 1):
        # Print increasing numbers
        for j in range(1, i + 1):
          print(j, end="")

        # Print spaces in the middle
        spaces = 2 * (n - i)
        for k in range(spaces):
          print(" ", end="")

        # Print decreasing numbers
        for j in range(i, 0, -1):
          print(j, end="")

        # Move to next line
        print()

  # Example usage:
  Patterns().pattern12(5)
```

### 13. Sequential Number Triangle

```python
def print_pattern13():
  # Given an integer n, print sequential numbers row by row.
  # Example for N=5:
  #   1
  #   2 3
  #   4 5 6
  #   7 8 9 10
  #   11 12 13 14 15

  class Patterns:
    # Function to print pattern13
    def pattern13(self, n):
      num = 1
      for i in range(1, n + 1):
        for j in range(i):
          print(num, end="")
          if j < i - 1:
            print(" ", end="")
          num += 1
        print()

  # Example usage:
  Patterns().pattern13(5)
```

### 14. Alphabet Triangle

```python
def print_pattern14():
  # Given an integer n, print a triangle of alphabet characters A, B, C...
  # Example for N=5:
  #   A
  #   AB
  #   ABC
  #   ABCD
  #   ABCDE

  class Patterns:
    # Function to print pattern14
    def pattern14(self, n):
      for i in range(1, n + 1):
        for j in range(i):
          print(chr(65 + j), end="")
        print()

  # Example usage:
  Patterns().pattern14(5)
```

### 15. Inverted Alphabet Triangle

```python
def print_pattern15():
  # Given an integer n, print a decreasing triangle of alphabet characters.
  # Example for N=5:
  #   ABCDE
  #   ABCD
  #   ABC
  #   AB
  #   A

  class Patterns:
    # Function to print pattern15
    def pattern15(self, n):
      for i in range(n, 0, -1):
        for j in range(i):
          print(chr(65 + j), end="")
        print()

  # Example usage:
  Patterns().pattern15(5)
```

---

## Half-Triangle Variations

Solid, hollow, reversed, and spaced half-triangles — one function, eight variants, each toggling a
different combination of "which rows get border-only stars" and "is the growth direction flipped."

```python
def print_half_triangle_patterns():
  # Various half-triangle patterns: solid, hollow, reversed, with spacing.

  # Half Triangle Pattern
  r = 5
  print(f"Half Triangle Star Pattern till {r} rows is: ")
  for i in range(0, r + 1):
    print("* " * i)

  # Half Triangle Hollow Pattern
  r = 13
  print(f"\nHalf Triangle Hollow Pattern till {r} rows is: ")
  for i in range(1, r + 2):
    # For First and Second Row
    if i == 1 or i == 2:
      print("* " * i)
    # For Last Row
    elif i == r + 1:
      print("* " * (i - r // 2))
    # For all other Rows
    else:
      print("*" + " " * (i - 1) + "*")

  # Half Triangle Pattern in reverse
  r = 6
  print(f"\nHalf Triangle Star Pattern in reverse till {r} rows is: ")
  for i in range(r, 0, -1):
    print("* " * i)

  # Half Triangle Reverse Hollow Pattern
  r = 7
  print(f"\nHalf Triangle Reverse Hollow Pattern till {r} rows is: ")
  for i in range(r + 2, 0, -1):
    # For First and Second Row
    if i == 1 or i == 2:
      print("* " * i)
    # For Last Row
    elif i == r + 2:
      print("* " * (i - r // 2))
    # For all other Rows
    else:
      print("*" + " " * (i - 1) + "*")

  # Half Triangle Pattern with space
  r = 7
  print(f"\nHalf Triangle Star Pattern with Space till {r} rows is: ")
  for i in range(r, 0, -1):
    # For Space
    print("  " * i, end="")
    # For Star
    print("* " * (r + 1 - i))

  # Half Triangle Hollow Pattern with space
  r = 7
  print(f"\nHalf Triangle Hollow Star Pattern with Space till {r} rows is: ")
  # Taking j as we need to increase space by 1 each time
  j = 1
  for i in range(0, r):
    # For First, Second and Last row
    if i == 0 or i == 1 or i == r - 1:
      print("  " * (r + 1 - i) + " *" * (i + 1))
    # For Third Row
    elif i == 2:
      print("  " * (r + 2 - i) + "*" + " " * (i) + "*")
    # For All Other Rows
    else:
      print("  " * (r + 2 - i) + "*" + " " * (i + j) + "*")
      # Incrementing j
      j = j + 1

  # Half Triangle Pattern with space in reverse
  r = 7
  print(f"\nHalf Triangle Star Pattern with Space in reverse till {r} rows is: ")
  for i in range(r, 0, -1):
    # For Space
    print("  " * (r + 1 - i), end="")
    # For Star
    print("* " * i)

  # Half Triangle Hollow Pattern with space in reverse
  r = 7
  print(f"\nHalf Triangle Hollow Star Pattern with Space (reverse) till {r} rows is: ")
  # Taking j as we need to increase space by 1 each time
  j = 0
  for i in range(r, 0, -1):
    # For First, Second Last and Last row
    if i == r or i == 2 or i == 1:
      # For Space
      print("  " * (r + 1 - i), end="")
      # For Star
      print("* " * i)
    else:
      print(" " * (r + r // 2 - i + j) + "* " + " " * (i + (r // 2 - 1) - j) + "* ")
      j = j + 1
```

---

## Full Pyramid Variations

Solid, hollow, and inverted full pyramids — the two-dimensional symmetric sibling of the
half-triangle set above.

```python
def print_full_star_pyramid_patterns():
  # Full pyramid, hollow pyramid, inverted pyramid, and inverted hollow pyramid.
  # Note: patterns work best with odd numbers of rows.

  # Full Star Pattern (upward)
  r = 7
  print(f"Full Star Pattern till {r} rows is: ")
  for i in range(r + 1, 0, -1):
    # We add Space and Star
    print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1))

  # Full Star Hollow Pattern
  r = 7
  print(f"\nFull Star Hollow Pattern till {r} rows is: ")
  for i in range(r + 1, 0, -1):
    if i == r + 1 or i == 1:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1))
    else:
      print("  " * (i - 1) + "* " + "  " * (2 * (r + 1 - i) - 1) + "*")

  # Inverted Full Star Pattern
  r = 6
  print(f"\nInverted Full Star Pattern till {r} rows is: ")
  for i in range(1, r + 2):
    # We add Space and Star
    print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1))

  # Inverted Full Star Hollow Pattern
  r = 7
  print(f"\nInverted Full Star Hollow Pattern till {r} rows is: ")
  for i in range(1, r + 2):
    if i == 1 or i == r + 1:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1))
    else:
      print("  " * (i - 1) + "* " + "  " * (2 * (r + 1 - i) - 1) + "*")
```

---

## Rhombus, Diamond & Butterfly Shapes

Shapes built by mirroring a triangle formula around a horizontal axis — a rhombus grows outward from
a middle row, a butterfly's wings do the same but hollow in the middle.

### Rhombus Pattern

```python
def print_rhombus_patterns():
  # Rhombus (full diamond) and its outline variant.

  # Rhombus Pattern with space
  r = 6
  print(f"Rhombus Star Pattern till {r} rows is: ")
  # For upper half
  for i in range(1, r + 1):
    print("  " * (r - i) + "* " * (2 * (i - 1) + 1))
  # For lower half
  for i in range(r - 1, 0, -1):
    print("  " * (r - i) + "* " * (2 * (i - 1) + 1))

  # Outline of Rhombus Pattern with Space between Stars
  r = 7
  print(f"\nOutline of Rhombus Pattern with Space between stars till {r} rows is: ")
  # For upper half
  for i in range(r, 0, -1):
    print("* " * i + "  " * (2 * (r - i)) + "* " * i)
  # For lower half
  for i in range(1, r + 1):
    print("* " * i + "  " * (2 * (r - i)) + "* " * i)
```

### Time Clock and Butterfly Patterns

```python
def print_timeclock_and_butterfly_patterns():
  # Time clock (inverted diamond) and butterfly wing patterns.

  # Time Clock Pattern with space
  r = 5
  print(f"Time Clock Star Pattern till {r} rows is: \n")
  # For upper half
  for i in range(r, 0, -1):
    print("  " * (r - i) + "* " * (2 * (i - 1) + 1))
  # For lower half
  for i in range(1, r + 1):
    print("  " * (r - i) + "* " * (2 * (i - 1) + 1))

  # Butterfly Wings Pattern
  r = 7
  print(f"\nButterfly Wings Pattern till {r} rows is: ")
  # For upper half
  for i in range(1, r + 1):
    print("*" * i + " " * (2 * (r - i)) + "*" * i)
  # For lower half
  for i in range(r - 1, 0, -1):
    print("*" * i + " " * (2 * (r - i)) + "*" * i)

  # Butterfly Wings Pattern with Space between Stars
  r = 7
  print(f"\nButterfly Wings Pattern with Space between stars till {r} rows is: ")
  # For upper half
  for i in range(1, r + 1):
    print("* " * i + "  " * (2 * (r - i)) + "* " * i)
  # For lower half
  for i in range(r - 1, 0, -1):
    print("* " * i + "  " * (2 * (r - i)) + "* " * i)
```

---

## Rectangle Variations

Solid rectangle, hollow rectangle (two-loop and one-loop versions), and a rectangle hollow only on
its middle row.

```python
def print_rectangle_patterns():
  # Rectangle, hollow rectangle (two-loop and one-loop), and middle-hollow rectangle.

  # Rectangle Pattern
  r = 3
  s = 5
  print(f"Rectangle Star Pattern till {r} rows and {s} stars is: ")
  for i in range(1, r + 1):
    print("* " * s)

  # Hollow Rectangle Star Pattern Using Two Loops
  r = 5
  s = 12
  print(f"\nHollow Rectangle Star Pattern till {r} rows and {s} stars is: ")
  for i in range(0, r):
    for j in range(0, s):
      # Giving if Condition for stars and space
      if i == 0 or i == r - 1 or j == 0 or j == s - 1:
        print("*", end=" ")
      else:
        print(" ", end=" ")
    # Printing New line
    print()

  # Hollow Rectangle Star Pattern Using One Loop
  r = 5
  s = 13
  print(f"\nHollow Rectangle Star Pattern (one loop) till {r} rows and {s} stars is: ")
  for i in range(0, r):
    if i == 0 or i == r - 1:
      print("* " * s)
    else:
      print("* " + "  " * (s - 2) + "* ")

  # Hollow Middle Row Rectangle
  r = 5
  s = 11
  print(f"\nHollow Middle Row Rectangle Star Pattern till {r} rows and {s} stars is: ")
  for i in range(1, r + 1):
    # For Odd rows
    if r % 2 != 0:
      if i != r // 2 + 1:
        print("* " * s)
      else:
        print("* " + "  " * (s - 2) + "* ")
    # For even rows
    else:
      if i != r / 2 and i != r / 2 + 1:
        print("* " * s)
      else:
        print("* " + "  " * (s - 2) + "* ")
```

---

## Pascal's Triangle

The one entry in this file driven by a genuine recurrence (binomial coefficients) rather than a
purely geometric row/column formula.

```python
def print_pascals_triangle():
  # Given num_rows, print Pascal's triangle using coefficient calculation.
  # Example for 5 rows:
  #   1
  #   1 1
  #   1 2 1
  #   1 3 3 1
  #   1 4 6 4 1

  def generate_pascals_triangle(num_rows):
    for i in range(num_rows):
      coef = 1
      for j in range(i + 1):
        if j == 0 or i == 0:
          coef = 1
        else:
          coef = (coef * (i - j + 1)) // j
        print(coef, end=" ")
      print()

  num_rows = 5
  generate_pascals_triangle(num_rows)
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
