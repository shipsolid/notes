---
title: "Practice Patterns — Full Source Catalogue 2"
description: "The complete pattern-printing drill corpus behind the Pattern Practice & Loops chapter — every triangle, pyramid, rhombus, letter-art, and name-banner function as runnable Python, grouped by shape family."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031709"
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

## Letter-Art Shape Patterns

Star-art letters — H, B, E, L, O, I, M, W, A, R, J, K — first as hardcoded per-letter logic, then
refactored behind a small set of shared helper functions (`oneStar`, `twoStarSpace`, `lineStarHalf`,
`lineStarFull`, `linePartitionStar`) that the later letters and name banners reuse directly.

### H, B, E, L, O, I — Hardcoded Version

```python
def print_alphabet_shapes_hbelio():
  # Print star-art versions of letters H, B, E, L, O, I for a given row count r.

  r = 7

  # For this pattern to be printed we need more than 3 rows
  if r < 3:
    r = 3

  #  Printing H Pattern
  print(f"H Star Pattern till {r} rows is:\n ")
  for i in range(0, r):
    if i != r // 2:
      if r % 2 == 0:
        print("*" + " " * (r + 1) + "*")
      else:
        print("*" + " " * r + "*")
    else:
      print("* " * (r // 2 + 2))

  # Printing B Pattern
  print(f"\nB Star Pattern till {r} rows is:\n ")
  for i in range(0, r):
    if i != r // 2 and i != 0 and i != r - 1:
      if r % 2 == 0:
        print("*" + " " * (r + 1) + "*")
      else:
        print("*" + " " * r + "*")
    else:
      print("* " * (r // 2 + 2))

  # Printing E Pattern
  print(f"\nE Star Pattern till {r} rows is:\n ")
  for i in range(0, r):
    if i == r // 2 or i == 0 or i == r - 1:
      print("* " * (r // 2 + 2))
    elif (i > 0 and i < r // 2) or (i > r // 2 and i < r):
      print("*")
    else:
      if r % 2 == 0:
        print("*" + " " * (r + 1) + "*")
      else:
        print("*" + " " * r + "*")

  # Printing L Pattern
  print(f"\nL Star Pattern till {r} rows is: \n")
  for i in range(0, r):
    if i == r - 1:
      print("* " * r)
    else:
      print("*")

  # Printing O Pattern
  print(f"\nO Star Pattern till {r} rows is:\n ")
  for i in range(0, r):
    if i == 0 or i == r - 1:
      print("* " * (r // 2 + 2))
    else:
      print("*" + " " * r + "*")

  # Printing I Pattern
  print(f"\nI Star Pattern till {r} rows is:\n ")
  for i in range(0, r):
    if i == 0 or i == r - 1:
      if r % 2 == 0:
        print("* " * (r + 1))
      else:
        print("* " * r)
    else:
      print(" " * (2 * (r // 2)) + "*")
```

### Helper Functions for Letter Shapes

```python
def print_alphabet_shape_helpers():
  # Reusable helper functions for building letter patterns.
  # These reduce repetition across H, B, E, L, O, I, A, R, M, W patterns.

  # For printing only one star
  def oneStar():
    return "*"

  # For printing Two star and Space between this two stars
  def twoStarSpace(r):
    # For Even Rows
    if r % 2 == 0:
      return "*" + " " * (r + 1) + "*"
    # For Odd Rows
    else:
      return "*" + " " * r + "*"

  # For Line of Stars in half for middle line
  def lineStarHalf(r):
    return "* " * ((r // 2) + 2)

  # For Full line of Stars
  def lineStarFull(r):
    return "* " * r

  def linePartitionStar(r):
    return " " * (2 * (r // 2)) + "*"

  r = 7
  print("oneStar():", oneStar())
  print("twoStarSpace(7):", twoStarSpace(r))
  print("lineStarHalf(7):", lineStarHalf(r))
  print("lineStarFull(7):", lineStarFull(r))
  print("linePartitionStar(7):", linePartitionStar(r))
```

### H, B, E, L, O, I — Refactored with Helpers

```python
def print_alphabet_shapes_with_helpers():
  # Same H, B, E, L, O, I shapes but built with helper functions to reduce
  # repeated code. Demonstrates refactoring the raw loops above.

  def oneStar():
    return "*"

  def twoStarSpace(r):
    if r % 2 == 0:
      return "*" + " " * (r + 1) + "*"
    else:
      return "*" + " " * r + "*"

  def lineStarHalf(r):
    return "* " * ((r // 2) + 2)

  def lineStarFull(r):
    return "* " * r

  def linePartitionStar(r):
    return " " * (2 * (r // 2)) + "*"

  try:
    r = 7
  except:
    print("Please Enter an Integer Number!!")

  if r < 3:
    r = 3

  #  Printing H Pattern
  print(f"\nH Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    if i == r // 2:
      print(lineStarHalf(r))
    else:
      print(twoStarSpace(r))

  #  Printing B Pattern
  print(f"\nB Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    if i == 0 or i == r // 2 or i == r - 1:
      print(lineStarHalf(r))
    else:
      print(twoStarSpace(r))

  # Printing E Pattern
  print(f"\nE Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    if i == 0 or i == r // 2 or i == r - 1:
      print(lineStarHalf(r))
    else:
      print(oneStar())

  # Printing L Pattern
  print(f"\nL Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    if i == r - 1:
      print(lineStarFull(r))
    else:
      print(oneStar())

  # Printing O Pattern
  print(f"\nO Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    if i == 0 or i == r - 1:
      print(lineStarHalf(r))
    else:
      print(twoStarSpace(r))

  # Printing I Pattern
  print(f"\nI Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    if i == 0 or i == r - 1:
      print(lineStarFull(r))
    else:
      print(linePartitionStar(r))
```

### M and W

```python
def print_m_and_w_patterns():
  # Print star-art M and W letters. Only works well for r = 7.

  r = 7
  if r < 3:
    r = 3

  #  Printing M Pattern
  print(f"\nM Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    print("*", end="")
    if i <= r // 2 and i != 0:
      if i == 1:
        print(" " * i + "*" + " " * (i + 2) + "*" + " *", end="")
      elif i == 2:
        print(" " * i + "*" + " *" + " " * i + "*", end="")
      else:
        print(" " * i + "*" + " " * i + "*", end="")
    else:
      print(" " * r + "*", end="")
    print()

  #  Printing W Pattern
  print(f"\nW Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    print("*", end="")
    if i >= r // 2 and i != 0 and i != r - 1:
      if i == r // 2:
        print(" " * i + "*" + " " * i + "*", end="")
      elif i == r // 2 + 1:
        print("  *" + " * " + " *", end="")
      else:
        print(" *" + " " * (i - 2) + "* " + "*", end="")
    else:
      print(" " * r + "*", end="")
    print()
```

### A and R

```python
def print_a_and_r_patterns():
  # Print star-art A and R letters using helper functions.

  def oneStar():
    return "*"

  def twoStarSpace(r):
    if r % 2 == 0:
      return "*" + " " * (r + 1) + "*"
    else:
      return "*" + " " * r + "*"

  def lineStarHalf(r):
    return "* " * ((r // 2) + 2)

  r = 7
  if r < 3:
    r = 3

  # Printing A Pattern
  print(f"\nA Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    # For First and Middle Rows
    if i == 0 or i == r // 2:
      print(lineStarHalf(r))
    else:
      print(twoStarSpace(r))

  # Printing R Pattern
  print(f"\nR Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    # For First and Middle Rows
    if i == 0 or i == r // 2:
      print(lineStarHalf(r))
    elif i > r // 2:
      print(oneStar(), end="")
      print(" " * i + "*", end="")
      print()
    else:
      print(twoStarSpace(r))
```

### J and K

```python
def print_j_and_k_patterns():
  # Print star-art J and K letters using helper functions.

  def lineStarFull(r):
    return "* " * r

  def linePartitionStar(r):
    return " " * (2 * (r // 2)) + "*"

  r = 7
  if r < 3:
    r = 3

  #  Printing J Pattern
  print(f"\nJ Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    if i == 0:
      print(lineStarFull(r))
    elif i > 0 and i < r // 2:
      print(linePartitionStar(r))
    elif i == r - 1:
      print("* " * ((r // 2) + 1))
    else:
      print("*" + " " * (2 * (r // 2) - 1) + "*")

  #  Printing K Pattern
  print(f"\nK Star Pattern till {r} rows is:\n")
  for i in range(0, r):
    if i >= 0 and i < r // 2:
      print("*" + " " * (r // 2 - i) + "*")
    elif i == r // 2:
      print("*" + "*")
    else:
      print("*" + " " * (i - r // 2) + "*")
```

---

## Name Banners (Letters Composed into Words)

The letter-shape functions above, laid out side by side on a shared row loop to spell a full word in
one horizontal band. Each only works reliably at the row count (`r = 7`) it was hand-tuned against —
exactly the hardcoded-special-case trap the chapter's closing section calls out.

### HELLO

```python
def print_hello_pattern():
  # Print the word HELLO using star-art letters in a single horizontal band.
  # Only works reliably for r = 7.

  def oneStar():
    return "*"

  def twoStarSpace(r):
    if r % 2 == 0:
      return "*" + " " * (r + 1) + "*"
    else:
      return "*" + " " * r + "*"

  def lineStarHalf(r):
    return "* " * ((r // 2) + 2)

  def lineStarFull(r):
    return "* " * r

  def linePartitionStar(r):
    return " " * (2 * (r // 2)) + "*"

  r = 7
  if r < 3:
    r = 3

  print(f"\nHELLO Star Pattern till {r} rows is:\n")

  for i in range(0, r):
    # Printing H Pattern
    if i == r // 2:
      print(lineStarHalf(r), end="")
    else:
      print(twoStarSpace(r), end="")

    if i == r // 2:
      print(" " * 3, end="")
    else:
      print(" " * 4, end="")

    # Printing E Pattern
    if i == 0 or i == r // 2 or i == r - 1:
      print(lineStarHalf(r), end="")
    else:
      print(oneStar(), end="")

    print(" " * 4, end="")

    # Printing First L Pattern
    if i == r - 1:
      print(lineStarFull(r), end="")
    else:
      if i == 0 or i == r - ((r // 2) + 1):
        print(oneStar(), end="")
      else:
        print(" " * (2 * (r // 2) + 3) + oneStar(), end="")

    print(" " * 4, end="")

    # Printing Second L Pattern
    if i == r - 1:
      print(lineStarFull(r), end="")
    else:
      if i != r - 1:
        print(" " * (2 * (r // 2) + r) + oneStar(), end="")
      else:
        print(" " * (2 * (r // 2) + 3) + oneStar(), end="")

    print(" " * 4, end="")

    # Printing O Pattern
    if i == 0:
      print(" " * (2 * (r // 2) + r) + lineStarHalf(r), end="")
    elif i == r - 1:
      print(lineStarHalf(r), end="")
    else:
      print(" " * (2 * (r // 2) + r) + twoStarSpace(r), end="")

    print()
```

### MADHURIMA

```python
def print_madhurima_pattern():
  # Print the word MADHURIMA using star-art letters in a single horizontal band.
  # Only works reliably for r = 7.

  def oneStar():
    return "*"

  def twoStarSpace(r):
    if r % 2 == 0:
      return "*" + " " * (r + 1) + "*"
    else:
      return "*" + " " * r + "*"

  def lineStarHalf(r):
    return "* " * ((r // 2) + 2)

  def lineStarFull(r):
    return "* " * r

  def linePartitionStar(r):
    return " " * (2 * (r // 2)) + "*"

  r = 7
  if r < 3:
    r = 3

  print(f"\nMADHURIMA Star Pattern till {r} rows is:\n")

  for i in range(0, r):
    # Printing M Pattern
    print("*", end="")
    if i <= r // 2 and i != 0:
      if i == 1:
        print(" " * i + "*" + " " * (i + 2) + "*" + " *", end="")
      elif i == 2:
        print(" " * i + "*" + " *" + " " * i + "*", end="")
      else:
        print(" " * i + "*" + " " * i + "*", end="")
    else:
      print(" " * r + "*", end="")

    print(" " * 4, end="")

    # Printing A Pattern
    if i == 0 or i == r // 2:
      print(lineStarHalf(r), end="")
    else:
      print(twoStarSpace(r), end="")

    if i == 0 or i == r // 2:
      print(" " * 3, end="")
    else:
      print(" " * 4, end="")

    # Printing D Pattern
    if i == 0 or i == r - 1:
      print(lineStarHalf(r), end="")
    else:
      print(twoStarSpace(r), end="")

    if i == 0 or i == r - 1:
      print(" " * 2, end="")
    else:
      print(" " * 3, end="")

    # Printing H Pattern
    if i == r // 2:
      print(lineStarHalf(r), end="")
    else:
      print(twoStarSpace(r), end="")

    if i == r // 2:
      print(" " * 2, end="")
    else:
      print(" " * 3, end="")

    # Printing U Pattern
    if i == r - 1:
      print(lineStarHalf(r), end="")
    else:
      print(twoStarSpace(r), end="")

    if i == r - 1:
      print(" " * 2, end="")
    else:
      print(" " * 3, end="")

    # Printing R
    if i == 0 or i == r // 2:
      print(lineStarHalf(r), end="")
    elif i > r // 2:
      print(oneStar(), end="")
      print(" " * i + "*", end="")
    else:
      print(twoStarSpace(r), end="")

    if i == r - 1:
      print(" " * 5, end="")
    elif i == 2 or i == 1:
      print(" " * 4, end="")
    elif i == 0 or i == 3:
      print(" " * 3, end="")
    elif i == 5:
      print(" " * 6, end="")
    else:
      print(" " * 7, end="")

    # Printing I Pattern
    if i == 0 or i == r - 1:
      print(lineStarFull(r), end="")
    else:
      print(linePartitionStar(r), end="")

    if i == 0 or i == r - 1:
      print(" " * 3, end="")
    else:
      print(" " * 10, end="")

    # Printing M Pattern
    print("*", end="")
    if i <= r // 2 and i != 0:
      if i == 1:
        print(" " * i + "*" + " " * (i + 2) + "*" + " *", end="")
      elif i == 2:
        print(" " * i + "*" + " *" + " " * i + "*", end="")
      else:
        print(" " * i + "*" + " " * i + "*", end="")
    else:
      print(" " * r + "*", end="")

    print(" " * 4, end="")

    # Printing A Pattern
    if i == 0 or i == r // 2:
      print(lineStarHalf(r), end="")
    else:
      print(twoStarSpace(r), end="")

    print()
```

### RAWAT

```python
def print_rawat_pattern():
  # Print the word RAWAT using star-art letters in a single horizontal band.
  # Only works reliably for r = 7.

  def oneStar():
    return "*"

  def twoStarSpace(r):
    if r % 2 == 0:
      return "*" + " " * (r + 1) + "*"
    else:
      return "*" + " " * r + "*"

  def lineStarHalf(r):
    return "* " * ((r // 2) + 2)

  def linePartitionStar(r):
    return " " * (2 * (r // 2)) + "*"

  r = 7
  if r < 3:
    r = 3

  print(f"\nRAWAT Star Pattern till {r} rows is:\n")

  for i in range(0, r):
    # Printing R
    if i == 0 or i == r // 2:
      print(lineStarHalf(r), end="")
    elif i > r // 2:
      print(oneStar(), end="")
      print(" " * i + "*", end="")
    else:
      print(twoStarSpace(r), end="")

    # For Space between Letters
    if i == 0 or i == r // 2:
      print(" " * 3, end="")
    elif i == 1 or i == 2:
      print(" " * 4, end="")
    elif i == 5:
      print(" " * 6, end="")
    elif i == r - 1:
      print(" " * 5, end="")
    else:
      print(" " * 7, end="")

    # Printing A Pattern
    if i == 0 or i == r // 2:
      print(lineStarHalf(r), end="")
    else:
      print(twoStarSpace(r), end="")

    if i == 0 or i == r // 2:
      print(" " * 3, end="")
    else:
      print(" " * 4, end="")

    # Printing W Pattern
    print("*", end="")
    if i >= r // 2 and i != 0 and i != r - 1:
      if i == r // 2:
        print(" " * i + "*" + " " * i + "*", end="")
      elif i == r // 2 + 1:
        print("  *" + " * " + " *", end="")
      else:
        print(" *" + " " * (i - 2) + "* " + "*", end="")
    else:
      print(" " * r + "*", end="")

    print(" " * 4, end="")

    # Printing A Pattern
    if i == 0 or i == r // 2:
      print(lineStarHalf(r), end="")
    else:
      print(twoStarSpace(r), end="")

    if i == 0:
      print(" " * 4, end="")
    elif i == r // 2:
      print(" " * 2, end="")
    else:
      print(" " * 3, end="")

    # Printing T Pattern
    if i == 0:
      print(lineStarHalf(r), end="")
    else:
      print(linePartitionStar(r), end="")

    print()
```

---

## Composite Shapes: Umbrella & House Patterns

Multi-part shapes built by stacking two of the primitives above — a pyramid on top of a stem or a
rectangle — to form a recognizable silhouette.

### Umbrella Pattern

```python
def print_umbrella_pattern():
  # Full inverted pyramid on top with a handle/stem below.

  def lineStarHalf(r):
    return "* " * ((r // 2) + 2)

  def linePartitionStar(r):
    return " " * (2 * (r // 2)) + "*"

  r = 7
  print(f"Umbrella Pattern till {r} rows is: ")

  # Top: full inverted pyramid
  for i in range(r + 1, 0, -1):
    print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1))

  # Stem
  for i in range(0, r):
    if i > r // 2 and i < r - 1:
      print(linePartitionStar(2 * r) + " " * r + "*")
    elif i == r - 1:
      print(linePartitionStar(2 * r) + " " + lineStarHalf(r - 2))
    else:
      print(linePartitionStar(2 * r))
```

### Full House Pattern

```python
def print_full_house_pattern():
  # Pyramid on top of a solid rectangle (house shape).

  r = 9
  print(f"Full House Pattern till {r} rows is: ")

  for i in range(r + 1, 0, -1):
    if i == r + 1 or i == 0:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1) + "* " * (2 * r + 1))
    else:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1) + "  " * (2 * r) + "*")

  # Printing Rectangle Pattern
  for i in range(0, r):
    print("* " * (4 * r + 2))
```

### Full House Pattern (Hollow Triangle + Filled Rhombus)

```python
def print_full_house_empty_triangle_filled_rhombus():
  # Hollow pyramid (left side only) + solid rhombus body below.

  r = 7
  print(f"Full House (hollow triangle + filled rhombus) till {r} rows is: ")

  for i in range(r + 1, 0, -1):
    if i == r + 1:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1) + "* " * (2 * r))
    elif i == 0:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1) + "* " * (2 * r + 1))
    else:
      print("  " * (i - 1) + "*" + "  " * (2 * (r + 1 - i)) + "* " * (2 * r + 1))

  # Printing Rectangle Pattern
  for i in range(0, r):
    if i == 0 or i == r - 1:
      print("* " * (4 * r + 2))
    else:
      print("*" + " " * (4 * r) + "*" + " " * (4 * r) + "*")
```

### House Outline Pattern

```python
def print_house_outline_pattern():
  # Outline-only pyramid + outline rectangle body (house silhouette).

  r = 7
  print(f"House Outline Pattern till {r} rows is: ")

  for i in range(r + 1, 0, -1):
    if i == r + 1:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1) + "* " * (2 * r))
    elif i == 0:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1) + "* " * (2 * r + 1))
    else:
      print("  " * (i - 1) + "*" + "  " * (2 * (r + 1 - i)) + "*" + "  " * (2 * r - 1) + "*")

  # Printing Rectangle Pattern
  for i in range(0, r):
    if i == 0 or i == r - 1:
      print("* " * (4 * r + 2))
    else:
      print("*" + " " * (4 * r) + "*" + " " * (4 * r) + "*")
```

### House Outline Pattern with Door

```python
def print_house_outline_with_door():
  # Outline house with a door cutout in the lower rectangle.
  # Only works well for r = 7 or r = 9.

  r = 7
  print(f"House Outline with Door Pattern till {r} rows is: ")

  for i in range(r + 1, 0, -1):
    if i == r + 1:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1) + "* " * (2 * r))
    elif i == 0:
      print("  " * (i - 1) + "* " * (2 * (r + 1 - i) + 1) + "* " * (2 * r + 1))
    else:
      print("  " * (i - 1) + "*" + "  " * (2 * (r + 1 - i)) + "*" + "  " * (2 * r - 1) + "*")

  for i in range(0, r):
    if i == 0 or i == r - 1:
      print("* " * (4 * r + 2))
    elif i == r // 2:
      # For First Star
      print("*", end="")
      # For Door Pattern
      if r // 2 % 2 != 0:
        print(" " * (r) + "* " * (r // 2 + r // 2) + " " * (r + r // 2 - 1) + "* ", end="")
      else:
        print(" " * (r) + "* " * (r // 2 + r // 2 - 1) + " " * (r + r // 2) + "* ", end="")
      print(" " * (4 * r - 1) + "*")
    elif i > r // 2:
      print("*", end="")
      print(" " * (r) + "* " + " " * (r + 1) + "* " + " " * (2 * r - 4 - 1), end="")
      print("*" + " " * (4 * r) + "*")
    else:
      print("*" + " " * (4 * r) + "*" + " " * (4 * r) + "*")
```

---

## Symbol & Cross Patterns

A swastika (built from mirrored half-triangles around a central cross) and a hollow rectangle with
an X crossing through its interior.

### Swastika Pattern

```python
def print_swastika_pattern():
  # Swastika-shaped star pattern. Two variants: basic and improved.

  def twoStarSpace(r):
    if r % 2 == 0:
      return "*" + " " * (r + 1) + "*"
    else:
      return "*" + " " * r + "*"

  def lineStarHalf(r):
    return "* " * ((r // 2) + 2)

  def lineStarFull(r):
    return "* " * r

  # Basic Swastika (works for r=7)
  r = 7
  print(f"Swastika Star Pattern till {r} rows is: ")
  for i in range(0, r):
    if i == 0:
      print("*" + " " * (r // 2) + lineStarHalf(r // 4 + 1))
    elif i == r - 1:
      print(lineStarHalf(r // 4 + 1) + " " * (r // 2 - 1) + "*")
    elif i > 0 and i < r // 2:
      print(twoStarSpace(r // 2))
    elif i == r // 2:
      print(lineStarHalf(r))
    else:
      print(" " * (r // 2 + 1) + twoStarSpace(r // 2))

  # Improved Swastika (works for r=9 and even sizes)
  r = 9
  print(f"\nSwastika Star Pattern till {r} rows is: ")
  for i in range(0, r):
    if i == 0:
      if r // 2 % 2 == 0:
        print("*" + " " * (r // 2 + r // 4 - 1) + lineStarHalf(r // 4 + r // 2 - 1))
      else:
        print("*" + " " * (r // 2) + lineStarHalf(r // 4 + 1))
    elif i == r - 1:
      if r // 2 % 2 == 0:
        print(lineStarHalf(r // 4 + r // 4) + " " * (r // 2) + "*")
      else:
        print(lineStarHalf(r // 4 + 1) + " " * (r // 2 - 1) + "*")
    elif i > 0 and i < r // 2:
      print(twoStarSpace(r // 2))
    elif i == r // 2:
      if r // 2 % 2 == 0:
        print(lineStarHalf(r + 1))
      else:
        print(lineStarHalf(r))
    else:
      if r // 2 % 2 == 0:
        print(" " * (r // 2 + 2) + twoStarSpace(r // 2))
      else:
        print(" " * (r // 2 + 1) + twoStarSpace(r // 2))
```

### Hollow Rectangle with Triangle Inside

```python
def print_hollow_rectangle_with_triangle():
  # A hollow rectangle outline with an X/triangle crossing in the middle.

  def lineStarFull(r):
    return "* " * r

  r = 7
  print(f"Rectangle Cross Pattern Star Pattern till {r} rows is: ")
  for i in range(0, r):
    if i == 0 or i == r - 1:
      print(lineStarFull(r // 2 + 1))
    elif i > 0 and i < r // 2:
      print("*" + " " * (r // 2 - i + 1) + "*" + " " * i + "*")
    else:
      print("*" + " " * (i - r // 2) + "*" + " " * (r - i) + "*")
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
