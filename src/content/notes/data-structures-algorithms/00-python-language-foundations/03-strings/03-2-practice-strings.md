---
title: "Practice: Strings"
description: "The two-function practice script behind the Strings chapter — a quick-reference tour of str's built-in methods (case, search, split/join, format, slicing) and the string module's character-set constants, including the str.maketrans/translate pattern for bulk punctuation removal."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031815"
---

# Practice: Strings

This is the raw practice code behind
[[data-structures-algorithms/00-python-language-foundations/03-strings/03-1-strings|3 — Strings]] —
two runnable functions exploring Python's built-in `str` method surface and the `string` module's
character-set constants, written as a hands-on companion to that chapter's language-mechanics tour.
Where the chapter explains what each method returns and why immutability matters, this note keeps
the exercise scripts themselves: quick-reference calls, slicing demos, and the
`str.maketrans`/`translate` punctuation-stripping pattern. None of it has been rewritten or
bug-fixed here; this is a structural pass (frontmatter, headings) only, not a correctness review.

## Built-in str Methods

```python
def print_str_methods():
  """Demonstrates built-in str methods: case, search, split/join,
  format, slicing, and a quick-reference block of common calls."""
  # Built-in str type methods.
  # **Use for:** Text manipulation, string formatting, parsing.
  # Immutable sequence of Unicode characters.

  print("\nstr methods example:")
  s = "Hello, World!"
  print("String:", s)

  print("s.upper():", s.upper())                         # HELLO, WORLD!
  print("s.lower():", s.lower())                         # hello, world!
  print("s.split(', '):", s.split(', '))                 # ['Hello', 'World!']
  print("s.replace('World','Python'):", s.replace('World', 'Python'))
  print("s.startswith('Hello'):", s.startswith('Hello')) # True
  print("s.endswith('!'):", s.endswith('!'))             # True
  print("s.find('o'):", s.find('o'))                     # 4 — first occurrence; -1 if not found
  print("s.index('o'):", s.index('o'))                   # 4 — raises ValueError if not found
  print("s.count('o'):", s.count('o'))                   # 2
  print("'  hello  '.strip():", '  hello  '.strip())     # 'hello'
  print("'-'.join(['a','b','c']):", '-'.join(['a', 'b', 'c']))  # a-b-c
  print("format:", "Hello, {name}!".format(name='Alice'))
  print("f-string:", f"Hello, {'Alice'}!")

  # Slicing — [start:stop:step]; negative step reverses
  s = "Hello"
  print("\nSlicing:")
  print("s[1:4]:", s[1:4])    # ell
  print("s[:3]:", s[:3])      # Hel
  print("s[2:]:", s[2:])      # llo
  print("s[::-1]:", s[::-1])  # olleH  (reverse)
  print("s[::2]:", s[::2])    # Hlo

  # Quick reference — bare expressions showing return values at a glance
  s = "Hello World"
  s.upper()                   # "HELLO WORLD"
  s.lower()                   # "hello world"
  s.capitalize()              # "Hello world" — only first char uppercased, rest lowercased
  s.title()                   # "Hello World" — first char of every word uppercased
  "  hello  ".strip()         # "hello" — removes leading and trailing whitespace
  s.split()                   # ['Hello', 'World'] — splits on any whitespace by default
  s.split('l')                # ['He', '', 'o Wor', 'd'] — splits on literal 'l'
  "-".join(['a', 'b', 'c'])   # "a-b-c" — inserts separator between each element
  s.replace('World', 'Python')# "Hello Python"
  s.find('World')             # 6 (returns -1 if not found)
  s.index('World')            # 6 (raises ValueError if not found)
  s.startswith('Hello')       # True
  s.endswith('World')         # True
  s.count('l')                # 3 — counts non-overlapping occurrences
  "abc".isalpha()             # True — all characters are alphabetic
  "123".isdigit()             # True — all characters are digits
  "abc123".isalnum()          # True — all characters are alphanumeric (letters or digits)
```

## The string Module

```python
def print_string_module():
  """Covers the string module: pre-built character-set constants and
  the translate/maketrans pattern for bulk character removal."""
  # string module — character set constants.
  # **Use for:** Character validation, building character sets, input filtering.
  import string

  print("\nstring module example:")
  print("ascii_lowercase:", string.ascii_lowercase)   # abcdefghijklmnopqrstuvwxyz
  print("ascii_uppercase:", string.ascii_uppercase)   # ABCDEFGHIJKLMNOPQRSTUVWXYZ
  print("ascii_letters:", string.ascii_letters)       # lowercase + uppercase
  print("digits:", string.digits)                     # 0123456789
  print("hexdigits:", string.hexdigits)               # 0123456789abcdefABCDEF
  print("punctuation:", string.punctuation)
  print("whitespace repr:", repr(string.whitespace))  # space, tab, newline, etc.

  ch = 'a'
  print(f"'{ch}' in ascii_letters:", ch in string.ascii_letters)  # True

  # Common use: remove punctuation from a string
  # str.maketrans('', '', chars) builds a mapping table that deletes every char in the
  # third argument; text.translate(table) applies that mapping to every character in text.
  text = "Hello, World!"
  cleaned = text.translate(str.maketrans('', '', string.punctuation))
  print("remove punctuation:", cleaned)   # Hello World
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
