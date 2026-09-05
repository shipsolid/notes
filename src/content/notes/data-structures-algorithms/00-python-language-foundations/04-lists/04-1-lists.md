---
title: "4 — Lists"
description: "How Python's list works as a dynamic array wearing friendly syntax, why an alias is not a copy and a shallow copy is not always deep enough, and the handful of methods that turn 'store some values' into the workhorse structure behind almost every problem in this book."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/01-arrays/01-arrays
    kind: related
zettelId: "202607301922-13"
---

# 4 — Lists

Ask a candidate what a Python `list` is and most say "an array" and stop there — true only with real
disclaimers attached: dynamic, pointer-indirected, and mutable in ways a fixed-size array never is.
This chapter is the practitioner's tour of that mutability — how a list gets built, read, grown,
shrunk, walked, sorted, sliced, and copied — plus the two mistakes almost everyone makes at least
once: treating an alias as a copy, and treating a shallow copy as a deep one. None of this is
algorithmically deep by itself; it's the vocabulary every pattern in the rest of this book assumes
automatic recall of, so that later chapters can spend their attention on the algorithm instead of
the syntax.

---

## Creating and Accessing Lists

A Python `list` is an ordered, mutable, resizable sequence — the default container for "a bunch of
values" unless something more specific is called for. Nothing stops it from being **homogeneous**
(all the same type) or **heterogeneous** (mixed types in one list), because a `list` doesn't store
values directly — it stores pointers to objects, and any object qualifies:

```python
hourly_temperatures: list[float] = [21.5, 22.0, 22.3, 21.8, 21.0]
file_info: list[object] = ["report.pdf", 2.4, True]   # name, size in MB, downloaded?

print(len(hourly_temperatures))   # 5 -- length is O(1), a stored counter, not a scan
```

Reading an element is **indexing**, and Python supports both directions: index `0` is the first
element, index `-1` is the last, `-2` the second-to-last, and so on — negative indices are
`len(lst) + index` under the hood, not a separate mechanism:

```python
notifications = ["Update available", "New message", "Battery low", "Backup completed"]
print(notifications[0])    # "Update available"
print(notifications[-1])   # "Backup completed" -- same as notifications[len(notifications) - 1]
```

Both directions are O(1) — direct address arithmetic, the same argument
[[01-arrays|Part 02, Chapter 1]] makes for arrays generally, because a Python `list` _is_ a dynamic
array underneath its friendly syntax. Ask for an index that doesn't exist and Python raises
`IndexError` rather than silently returning `None` or a garbage value — a deliberate design choice
worth handling explicitly instead of guarding around:

```python
meetings = ["Team Sync", "Client Call", "Project Review"]
try:
    print(meetings[3])
except IndexError:
    print("That meeting does not exist.")
```

---

## Worked Example: Growing, Shrinking, and Updating a List

**Problem:** a running event log needs new entries appended as they happen, occasional entries
removed by position or by value, and existing entries updated in place — the shape of nearly every
"maintain some running state" interview setup.

```python
event_log = ["System start", "User login"]
event_log.append("File uploaded")              # add one item at the end

morning = ["Make bed", "Exercise", "Breakfast"]
afternoon = ["Meeting", "Code review", "Emails"]
full_day = morning + afternoon                  # concatenation: builds a NEW list
morning.extend(afternoon)                       # extend: mutates morning IN PLACE, same result

tasks = ["Fix critical bug", "Send email", "Clean workspace"]
tasks.insert(1, "Write report")                 # insert at an arbitrary position

timers = [300, 600, 120, 45]
cancelled = timers.pop(1)                       # remove + return by index
last = event_log.pop()                          # remove + return the last item (stack-style)

shopping = ["rice", "pasta", "tofu", "pasta"]
shopping.remove("pasta")                        # remove by VALUE -- only the first match

playlist = ["Song A", "Song B", "Song C"]
playlist[1] = "Song X"                          # update by index -- no method needed

download_cache = ["img1.png", "doc2.pdf"]
download_cache.clear()                          # empty it, keep the same list object
```

`append` vs. `extend` is the mistake worth internalizing early: `event_log.append(afternoon)` would
push the _entire list_ `afternoon` as one nested element, not its three items — `append` always adds
exactly one element, whatever that element is.

**Complexity:**

| Operation                 | Complexity     | Why                                                     |
| ------------------------- | -------------- | ------------------------------------------------------- |
| `append(x)`               | O(1) amortized | Writes to the next free slot; occasional resize is O(n) |
| `extend(iterable)`        | O(k)           | k = length of the iterable being merged in              |
| `insert(i, x)` / `pop(i)` | O(n)           | Every element after index `i` shifts one slot           |
| `pop()` (no argument)     | O(1)           | Removes the last slot — nothing else shifts             |
| `remove(value)`           | O(n)           | Linear scan to find the first match, then a shift       |
| `x[i] = value`            | O(1)           | Direct index write, no shifting                         |

Every row here restates the same dynamic-array fact [[01-arrays|Part 02, Chapter 1]] derives in
full: contiguity is what makes index writes and end-appends O(1), and it's exactly what makes a
middle insert or removal cost O(n) — there's no way to open or close a gap in the middle of a
contiguous block without moving everything on one side of it.

---

## Iterating, Searching, and Counting

The plain `for` loop is the default way to walk a list, and `enumerate()` is the idiomatic way to
walk it when the position matters too — it hands back `(index, value)` pairs without you maintaining
a manual counter, and takes an optional start offset for human-friendly numbering:

```python
instruments = ["guitar", "piano", "drums"]
for instrument in instruments:
    print("I can play the", instrument)

package_contents = ["Keyboard", "Mouse", "Monitor"]
for i, item in enumerate(package_contents, 1):
    print(f"Item {i}: {item}")
```

Lists nest freely — a `list[list[int]]` is a matrix, and walking it is just a `for` loop inside a
`for` loop, row then column:

```python
matrix = [[1, 2, 3], [4, 5, 6]]
for row in matrix:
    for value in row:
        print(value)
```

Three list methods answer "is this value here, and where": `count(value)` returns how many times a
value occurs, `index(value)` returns the position of the first match (raising `ValueError` if it's
absent — check with `in` first if absence is expected rather than exceptional), and the `in` /
`not in` operators answer membership directly:

```python
statuses = ["online", "offline", "online", "error", "online"]
print(statuses.count("online"))          # 3

features = ["dark_mode", "notifications", "autosave"]
if "autosave" in features:
    print(features.index("autosave"))
```

Every one of `count`, `index`, and `in` is an **O(n) linear scan** — a list carries no structural
hint about where a value might live, so there's no way to answer "is this present" faster than
checking elements one at a time in the worst case. The moment membership testing is the hot path of
a function rather than an occasional check, that O(n) is the signal to reach for a hash-based
container instead: see [[06-hashing|Part 02, Chapter 6]] for why a `dict` or `set` turns this exact
same question into O(1).

---

## Worked Example: Sorting In Place vs. Building a Sorted Copy

**Problem:** display a list of file names or sensor readings in order, in two different situations —
one where the original order no longer matters, and one where something else in the program still
depends on the original, unsorted order surviving.

```python
files = ["log.txt", "config.txt", "error.txt"]
files.sort()                       # mutates `files` in place, returns None
files.sort(reverse=True)           # descending, still in place

priorities = [3, 1, 2]
sorted_priorities = sorted(priorities)   # priorities is untouched; a NEW list comes back
# sorted(priorities, reverse=True) for descending, same non-mutating guarantee

events = ["Start", "Load", "Process", "Finish"]
events.reverse()                   # in place, no comparisons -- just flips the order
```

`list.sort()` and `sorted()` do identical sorting work and accept identical arguments (`reverse=`,
and a `key=` callable for custom ordering once functions are in scope) — the only difference is
_where the result lands_: `.sort()` is a method that mutates and returns `None` (a frequent bug is
writing `files = files.sort()`, which silently assigns `None`), while `sorted()` is a builtin that
always returns a fresh list and works on any iterable, not just an existing list.

**Complexity:** O(n log n) time for both, using Timsort — CPython's sort is also **stable**, meaning
elements that compare equal keep their original relative order, which matters the moment you sort by
one key and need a secondary key's prior ordering preserved (sort by the secondary key first, then
the primary — stability carries the earlier order through). `reverse()` is O(n): a single pass
swapping from both ends inward, no comparisons at all, which is why it's cheaper than
`sort(reverse=True)` when the goal is literally "flip the order," not "sort descending."

---

## Worked Example: Slicing, Aliasing, and the Shallow-Copy Trap

**Problem:** three related but distinct needs come up constantly — extract a sub-range of a list,
hand a list to another part of the program without letting it mutate your copy, and correctly copy a
list whose elements are themselves lists.

Slicing (`list[start:end:step]`) extracts a range without mutating the original; `start` is
inclusive, `end` is exclusive, and either bound can be negative or omitted:

```python
letters = ["a", "b", "c", "d", "e", "f", "g"]
print(letters[2:5])     # ['c', 'd', 'e']      -- index 2 up to (not including) 5
print(letters[-4:-1])   # ['d', 'e', 'f']      -- negative bounds count from the end
print(letters[:3])      # ['a', 'b', 'c']      -- omit start -> from the beginning
print(letters[4:])      # ['e', 'f', 'g']      -- omit end -> to the end
print(letters[1:6:2])   # ['b', 'd', 'f']      -- step of 2: every other element
print(letters[::-1])    # ['g', 'f', 'e', 'd', 'c', 'b', 'a'] -- negative step: reversed
```

Assignment does **not** copy a list — `linked = modules` makes `linked` a second name for the _same_
list object, so mutating one mutates both:

```python
modules = ["core", "auth", "storage"]
linked = modules          # alias, not a copy
linked.append("analytics")
print(modules)            # ['core', 'auth', 'storage', 'analytics'] -- also changed!
```

A real copy needs `modules[:]` (full-range slice) or `list(modules)`. But that copy is **shallow**:
it copies the outer list's pointers, not the objects they point to — fine for a list of immutable
values, a trap for a list of lists:

```python
settings = [["volume", 70], ["brightness", 50]]
shallow_copy = settings[:]
shallow_copy[0][1] = 20         # mutates the INNER list -- shared by both!
print(settings)                 # [['volume', 20], ['brightness', 50]] -- changed too

import copy
deep_copy = copy.deepcopy(settings)
deep_copy[0][1] = 20            # now fully independent
print(settings)                 # unaffected
```

**Complexity:** a slice of length k costs O(k) — it copies k pointers into a new list. A shallow
copy of an n-element list is O(n) for the same reason (n pointers, one level deep). `copy.deepcopy`
is O(n) in the _total_ number of objects reachable through the structure, because it recurses into
every nested container it finds — cheap for a flat list of numbers, proportionally more expensive
the deeper and wider the nesting goes.

---

## Unpacking, Joining, and Aggregate Operations

A list's elements can be unpacked directly into named variables — one variable per position,
matching the list's length exactly:

```python
width, height, depth = [10, 20, 5]
```

**Extended unpacking** (`*rest`) relaxes the exact-length requirement by collecting "everything
else" into its own list, which is the natural shape for something like an HTTP response where only
the first field is fixed-position:

```python
status_code, *message_parts = [200, "OK", "Data loaded successfully", "Time: 0.32s"]
print(status_code)      # 200
print(message_parts)    # ["OK", "Data loaded successfully", "Time: 0.32s"]
```

Without a `*`, the count on both sides must match exactly, or Python raises `ValueError` rather than
truncating or padding silently:

```python
user_info = ["Alice", "Engineer", "Canada"]
try:
    name, job, country, age = user_info    # too few values to unpack
except ValueError as e:
    print(e)
```

Two more list operations round out the everyday toolkit. `str.join(list)` is how a list of strings
becomes one string with a separator between each — note it's a method _on the separator_, not on the
list — and `str.split()` reverses it:

```python
folders = ["home", "user", "documents", "project"]
path = "/".join(folders)          # "home/user/documents/project"
print(path.split("/"))            # back to the original list of folders
```

And the aggregate builtins — `sum()`, `max()`, `min()`, `any()`, `all()` — each make a single O(n)
pass over a list to collapse it to one value, the same "no shortcut without extra structure" honesty
as `count`/`index`/`in`: there's no way to know the max of an arbitrary list without looking at
every element at least once.

---

## A Preview: Comprehensions

One more list-building shape is common enough to name here even though it gets its own chapter: a
**list comprehension** — `[n**2 for n in numbers]` to transform every element, or
`[n for n in numbers if n % 2 == 0]` to filter — is compact syntax for exactly the
for-loop-plus-`append()` pattern from earlier in this chapter, nothing more exotic than that. The
syntax variations (nested comprehensions, multiple `for` clauses, the readability line where a
comprehension stops helping and starts hurting) get the full treatment in
[[17-1-comprehensions|Chapter 17]] of this Part; the one thing worth carrying forward from here is
that a comprehension is never doing algorithmically different work than the loop it replaces — only
asymptotically identical work in a denser shape.

---

## When a List Is (or Isn't) the Right Structure

A `list` is the right default because it's ordered, mutable, and heterogeneous with no setup cost —
but "default" isn't "always correct," and three of this chapter's own facts are the tells that it's
time to reach for something else:

- **Frequent membership checks.** `x in some_list` is O(n) every time, covered above — the moment a
  function's hot path is dominated by "have I seen this value," a hash-based `set` or `dict` turns
  the same check into O(1).
- **Frequent front-insertion or front-removal.** `insert(0, x)` and `pop(0)` are both O(n), because
  every remaining element has to shift one slot to keep the list contiguous — a queue-shaped
  workload wants a structure built for O(1) work at both ends instead of a list pretending to be
  one.
- **Shared mutable state across more references than intended.** The alias-vs-copy and
  shallow-vs-deep distinctions from earlier aren't academic — they're the actual root cause behind a
  large share of "why did my other variable also change" bugs, and the fix is always the same
  question: does this need to be the _same_ list, a _shallow_ copy, or a _deep_ one, decided
  deliberately rather than by whichever `=` or `[:]` happened to be typed first.

None of this makes `list` the wrong choice most of the time — it's the wrong choice only when a
specific access pattern (membership, front-access, aliasing risk) is a known, sustained cost rather
than a one-off. Know the three tells, and "just use a list" stays the correct default instead of an
unexamined habit.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
