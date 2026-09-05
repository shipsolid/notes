---
title: "3 — Strings"
description: "Python's str ships with a wide method surface — case folding, search, split/join, formatting, slicing — that looks like ordinary array manipulation but hands back a brand-new object every single call, and the string module's character-set constants quietly back half the input-validation code you'll ever write."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings
    kind: related
zettelId: "202607301922-12"
---

# 3 — Strings

`str` is Python's built-in text type: an immutable sequence of Unicode characters, indexable and
sliceable like a list but with a method surface built specifically for text — case transforms,
search, split/join, and formatting. This chapter is that API surface as **language mechanics**: what
each method does, what it returns, and the handful of gotchas baked into "every method returns a new
string instead of mutating in place." It is deliberately not about string _algorithms_ — pattern
matching, palindrome checks, anagram detection, and the complexity trade-offs those techniques
involve live in
[[data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings|Part 02, Chapter 7]], which
picks up exactly where this chapter's immutability framing leaves off and takes it somewhere
computational. Read this chapter first if the question is "what does `.find()` actually return," and
that one if the question is "how fast is substring search."

---

## Immutability Sets the Rules for Everything Below

A Python `str` has no method that changes it in place. `s.upper()` does not uppercase `s` — it
builds an entirely new string object and returns it, leaving the original untouched:

```python
s = "Hello, World!"
t = s.upper()
print(s)   # "Hello, World!" — unchanged
print(t)   # "HELLO, WORLD!" — a different object
```

Every method in this chapter follows that same shape: input string (and maybe arguments) in, new
string (or new list, in the case of `split`) out. There's no `s.upper_inplace()` to reach for,
because there's no "in place" for an immutable type — `s[0] = 'h'` raises `TypeError` outright. The
computational consequence of that design — why looping `s += c` is quietly O(n²), and the full
operation-by-operation complexity table — is covered in depth in
[[data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings|Part 02, Chapter 7]]; the
fact to carry forward here is simpler: **read every method signature below as "returns a new value,"
never "mutates."**

---

## Case Transformation and Predicate Methods

Four methods change casing; a family of `is*()` methods test it without changing anything:

```python
s = "Hello World"
s.upper()          # "HELLO WORLD"       — every letter uppercase
s.lower()          # "hello world"       — every letter lowercase
s.capitalize()     # "Hello world"       — only the first char uppercased, rest forced lowercase
s.title()          # "Hello World"       — first char of every word uppercased
```

`capitalize()` and `title()` are the pair people mix up: `capitalize()` looks at the whole string as
one unit (first character up, everything else down, so `"HELLO".capitalize()` is `"Hello"`, not
`"HELLO"`); `title()` treats each whitespace-separated word independently. Neither is "smart" about
apostrophes or hyphens — `"o'brien".title()` produces `"O'Brien"` only by accident of where Python
considers a word boundary, not because it understands the name.

The predicate side answers "is this string entirely made of X" without a manual character loop:

```python
"abc".isalpha()      # True  — every character is alphabetic
"123".isdigit()      # True  — every character is a digit
"abc123".isalnum()   # True  — every character is alphanumeric (letter or digit)
"HELLO".isupper()    # True  — every cased character is uppercase
"hello".islower()    # True  — every cased character is lowercase
"Hello World".istitle()  # True — follows title-case rules
```

Each of these is an O(n) full-string scan under the hood — no faster way to know every character
qualifies than checking every character — but n is almost always small enough that this never shows
up as a bottleneck. What does matter in practice: an empty string returns `False` for all of them
(`"".isalpha()` is `False`, not vacuously `True`), a common off-by-one surprise when validating
optional fields.

---

## Search Methods: find, index, count, and in

Four different ways to ask "is this substring here," each answering a slightly different question:

```python
s = "Hello World"
s.find('World')       # 6   — index of first match, -1 if not found
s.index('World')      # 6   — index of first match, raises ValueError if not found
s.count('l')          # 3   — number of non-overlapping occurrences
'World' in s           # True — membership test, no index
s.startswith('Hello') # True
s.endswith('World')   # True
```

`find` and `index` do the identical search; they differ only in failure behavior — `find` returns
`-1`, `index` raises. That difference is the source of a real bug pattern, not a style nit: `-1` is
a valid Python index (it means "last character"), so silently falling through on a `find()` miss and
then indexing with the result can read the wrong character instead of crashing where the mistake
happened. A second, subtler trap: `if s.find(x):` looks like a presence check but is wrong the
moment the match is at index `0` — `0` is falsy in a boolean context, so a match at the very start
of the string is treated as "not found." The correct idiom is either `if x in s:` when you don't
need the position, or `if s.find(x) != -1:` when you do.

`count()` counts **non-overlapping** matches left to right — `"aaaa".count("aa")` is `2`, not `3`,
because after matching characters 0-1 the scan resumes at index 2, it doesn't back up to check index
1-2.

---

## Splitting, Joining, and the strip Family

```python
s = "Hello World"
s.split()               # ['Hello', 'World']        — splits on any run of whitespace
s.split('l')             # ['He', '', 'o Wor', 'd']   — splits on the literal separator
"-".join(['a', 'b', 'c'])  # "a-b-c"                  — inserts separator between elements
"  hello  ".strip()      # "hello"                    — removes leading/trailing whitespace
```

`split()` with no argument and `split(' ')` are **not** the same call: the no-argument form
collapses any run of whitespace (including multiple spaces, tabs, newlines) and drops
leading/trailing whitespace entirely, while `split(' ')` splits on every literal space character and
keeps empty strings for consecutive spaces (`"a  b".split(' ')` is `['a', '', 'b']`). Reaching for
the wrong one is an easy source of stray empty strings when parsing loosely-formatted text.

`join()` lives on the separator, not on the list — `"-".join(parts)`, not `parts.join("-")` — which
reads backwards the first few times but is the correct design: a separator string knows how to
stitch any iterable of strings together, while a list has no reason to know about string-joining
semantics at all. It's also the one genuinely linear way to build a string from many pieces, for the
same immutability reason this chapter opened with — `join()` computes the total output length up
front and allocates exactly once, instead of reallocating and recopying on every piece the way a
`+=` loop does.

`strip()`, `lstrip()`, and `rstrip()` all take an optional argument that is easy to misread as a
substring to remove — it's actually a **set of characters**, removed from the relevant end for as
long as any of them keep appearing:

```python
"xoxohello".lstrip("xo")   # "hello" — strips leading x/o characters, in any combination
"helloxox".rstrip("xo")    # "hell"  — 'o' is in the strip set, so the trailing 'o' in "hello" goes too
```

The second example is the trap: stripping `"xo"` off `"helloxox"` removes not just the trailing
`xox` but also eats into the word itself, because the final `o` of `"hello"` also belongs to the
strip set. `strip()` has no concept of "the literal substring `xox`" — only "characters in this
set."

---

## Worked Example: Building a Clean Word List from Raw Input

**Problem:** given a raw line of text with inconsistent spacing and trailing punctuation, produce a
lowercase list of words suitable for a frequency count.

```python
def clean_words(line: str) -> list[str]:
    normalized = line.lower().strip()
    return normalized.split()
```

```python
clean_words("  The Quick Brown Fox  jumps ")
# ['the', 'quick', 'brown', 'fox', 'jumps']
```

**Complexity:** O(n) time — `lower()`, `strip()`, and `split()` are each a single linear pass over
the string, and Python does not fuse them into one pass, so this is three separate O(n) scans rather
than one, still O(n) overall since constants drop out. O(n) space for the new lowercased string plus
the resulting list of word strings.

This is the shape almost every text-cleaning function in this book reduces to: chain a small number
of `str` methods, each one doing one linear job, rather than writing a manual character-by-character
loop that tries to do all three at once.

---

## String Formatting: %, .format(), and f-strings

Three formatting mechanisms exist in current Python, in the order they were introduced:

```python
name = "Alice"
"Hello, %s!" % name                  # printf-style — oldest, least used today
"Hello, {name}!".format(name=name)   # .format() — method call, works pre-3.6
f"Hello, {name}!"                    # f-string — Python 3.6+, evaluated inline
```

All three produce the identical string. `%`-formatting is C-derived and still turns up in older
codebases and logging calls; `.format()` is more flexible (named and positional placeholders,
`{:.2f}`-style format specs) but pays a method-call cost and reads awkwardly once a string gets more
than one or two substitutions. f-strings are the current default: the expression inside `{}` is
evaluated in place (`f"{a + b}"` works directly, no keyword juggling required) and the whole thing
compiles to more efficient bytecode than an equivalent `.format()` call, because the interpreter
doesn't need to parse the template string at runtime. Reach for `.format()` specifically when the
template and the values are genuinely separate (a template loaded from a config file, filled in
later) — the one case where f-strings' "evaluate immediately" model doesn't apply.

---

## Slicing: The Same Rules as Any Sequence, With Immutability Attached

`str` slicing uses the identical `[start:stop:step]` syntax as a `list`:

```python
s = "Hello"
s[1:4]     # "ell"
s[:3]      # "Hel"
s[2:]      # "llo"
s[::-1]    # "olleH"  — negative step reverses the whole string
s[::2]     # "Hlo"    — every second character
```

`s[::-1]` is the idiomatic Python way to reverse a string — no library call, no explicit loop, just
the step argument going backwards. What's easy to forget: because `str` is immutable, every slice
above allocates a fresh string and copies the sliced range into it — there's no "view" semantics
like NumPy arrays offer. Slicing repeatedly inside a loop is therefore its own quiet O(n²) trap, the
exact shape covered for concatenation in
[[data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings|Part 02, Chapter 7]]'s
complexity table — same underlying cause (immutability forces a copy), just triggered by `[a:b]`
instead of `+=`.

---

## The string Module: Character-Set Constants

The standard library's `string` module doesn't add new string _behavior_ — it's a small set of
pre-built character-set constants, useful anywhere you'd otherwise hand-type an alphabet:

```python
import string

string.ascii_lowercase   # 'abcdefghijklmnopqrstuvwxyz'
string.ascii_uppercase   # 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
string.ascii_letters     # ascii_lowercase + ascii_uppercase, concatenated
string.digits            # '0123456789'
string.hexdigits         # '0123456789abcdefABCDEF'
string.punctuation       # '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
string.whitespace        # ' \t\n\r\x0b\x0c' (space, tab, newline, carriage return, and two rarer ones)
```

Membership testing against these is the common use — `ch in string.ascii_letters` is O(1) on average
(it's a linear scan of a short fixed string under the hood, but the string is a small constant
length, so it reads and behaves like O(1) in practice) and reads far more clearly than a hand-rolled
range check like `('a' <= ch <= 'z') or ('A' <= ch <= 'Z')`. These constants are exactly what backs
the 26-slot fixed-array trick used for anagram and character-frequency problems in
[[08-string-algorithms|Part 02, Chapter 8]]: the alphabet is bounded and known ahead of time, so
`string.ascii_lowercase` (or just `ord(ch) - ord('a')`) replaces a general-purpose hash map with a
fixed-size array.

---

## Worked Example: Stripping Punctuation with str.maketrans

**Problem:** given a sentence, remove every punctuation character in one pass, without writing a
character-by-character filter loop.

```python
import string

def strip_punctuation(text: str) -> str:
    table = str.maketrans('', '', string.punctuation)
    return text.translate(table)
```

```python
strip_punctuation("Hello, World!")
# "Hello World"
```

`str.maketrans(from_chars, to_chars, delete_chars)` builds a translation table — conceptually a
`dict` mapping each character's Unicode code point to a replacement (or to `None`, for deletion).
Called as `maketrans('', '', string.punctuation)` with empty first and second arguments, every
character named in the third argument maps to `None`, meaning "delete this character on translate."
`text.translate(table)` then walks `text` once, looking up each character in the table (an O(1) dict
lookup per character) and either keeping it, replacing it, or dropping it.

**Complexity:** O(n) time for the `translate()` call, where n is the length of `text` — one lookup
per character, no matter how many characters are in the delete/replace set — plus O(k) to build the
table once, where k is the size of the character set being translated (here,
`len(string.punctuation)`, a small constant). O(n) space for the output string. This is the one
genuinely efficient way to bulk-remove or bulk-replace characters; the naive alternative — looping
over `text`, checking `if ch not in string.punctuation` on each character, and rebuilding via `+=` —
is the same O(n²) concatenation trap from earlier in this chapter, just with an extra membership
check bolted on.

---

## Where the Method Surface Gets People

Three habits are worth building deliberately, because the language gives no warning when you skip
them:

- **Treat `find()`'s `-1` as a real return value, not "falsy for not found."** Check `!= -1`
  explicitly, or use `in` when you only need a yes/no answer — never rely on a bare `if s.find(x):`.
- **Remember `strip()`'s argument is a character set, not a substring.** `text.strip("xox")` removes
  any combination of `x` and `o` from both ends, potentially eating into content that only
  coincidentally starts or ends with those characters — it does not remove the literal substring
  `"xox"`.
- **Default to f-strings, but keep `.format()` in mind for templates defined separately from their
  values** — a config-driven template string has no expression to evaluate inline, so `.format()`'s
  method-call model is the right tool there, not a legacy fallback.

None of this replaces the deeper complexity story — when a slice, a concatenation, or a substring
search actually costs O(n) vs. O(n²) vs. something smarter — that's
[[data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings|Part 02, Chapter 7]]'s job,
immediately followed by the algorithmic techniques in [[08-string-algorithms|Part 02, Chapter 8]].
This chapter's job was narrower: know what each method actually returns, and know which handful of
them hide a surprise.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
