---
title: "8 — Collections Module"
description: "Four small, purpose-built fixes for the frictions plain dict and list leave behind: an auto-vivifying dict, a dict specialized for counting, a double-ended queue's API surface, and an immutable tuple with named fields."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/04-stack-queue-and-deque/04-deque/04-deque
    kind: related
zettelId: "202607301922-17"
---

# 8 — Collections Module

Python's built-in `dict` and `list` are general enough to build almost anything, but that generality
shows up as boilerplate the instant a problem has a more specific shape: guarding every accumulation
with `if key not in d`, hand-rolling frequency counts with `.get(key, 0) + 1`, paying O(n) for
`list.pop(0)` in a queue, or writing `pixel[0]` when `pixel.red` is what the code actually means.
The `collections` module in the standard library is four small, purpose-built fixes for exactly
these frictions: `defaultdict` removes the key-existence check, `Counter` specializes `dict` for
counting and multiset arithmetic, `deque` buys O(1) operations at both ends, and `namedtuple` gives
a tuple named fields without a class's memory or boilerplate cost. Three of these four get their
only treatment in this book right here; `deque`'s internals, complexity, and when-to-reach-for-it
story already live in [[04-deque|Part 04, Chapter 4]], so this chapter's job for that one is
narrower — its API surface only, not a second derivation of ground already covered.

---

## `defaultdict`: Removing the Key-Existence Check

`defaultdict` is a `dict` subclass that takes one constructor argument — a **default factory**, any
zero-argument callable — and calls it automatically the moment code reads a key that doesn't exist
yet, inserting the result under that key instead of raising `KeyError`. `defaultdict(list)` behaves
exactly like a plain `dict`, except that indexing a missing key runs `list()`, stores the resulting
`[]` under that key, and returns it — so `dd[key].append(x)` works on the very first access, with no
`if key not in dd: dd[key] = []` guard anywhere in the calling code.

```python
from collections import defaultdict

dd: defaultdict[str, list[int]] = defaultdict(list)
dd["key1"].append(1)     # "key1" doesn't exist yet -- defaultdict creates it as [] first
print(dd)                 # defaultdict(<class 'list'>, {'key1': [1]})

counts: defaultdict[str, int] = defaultdict(int)   # int() returns 0
for letter in "abacba":
    counts[letter] += 1
print(counts)              # defaultdict(<class 'int'>, {'a': 3, 'b': 2, 'c': 1})
```

The factory argument must be **callable**, not a value — `defaultdict(0)` fails with `TypeError`
because `0` isn't callable, while `defaultdict(int)` works because `int()` is a zero-argument call
that returns `0`. This is also what separates `defaultdict` from `dict.setdefault(key, default)`:
`setdefault` evaluates its `default` argument eagerly on every call, whether the key exists or not,
while `defaultdict`'s factory only ever runs on an actual miss — the difference matters the moment
`default` is expensive to construct (a new list, a network call, a fresh object) rather than a cheap
literal.

### Worked Example: Grouping Files by Type

**Problem:** given a list of `(filename, filetype)` pairs, group filenames by their type.

```python
from collections import defaultdict

def group_by_type(files: list[tuple[str, str]]) -> dict[str, list[str]]:
    groups: defaultdict[str, list[str]] = defaultdict(list)
    for filename, file_type in files:
        groups[file_type].append(filename)
    return dict(groups)

files = [
    ("report.docx", "document"),
    ("summary.pdf", "document"),
    ("budget.xlsx", "spreadsheet"),
    ("photo.jpg", "image"),
]
group_by_type(files)
# {'document': ['report.docx', 'summary.pdf'], 'spreadsheet': ['budget.xlsx'], 'image': ['photo.jpg']}
```

**Complexity:** O(n) time, O(n) space — one factory call (amortized across the whole group) and one
`append` per item, no separate existence check ever executed. Swapping the factory to `set` instead
of `list` (`defaultdict(set)`, `.add()` instead of `.append()`) gives the same grouping pattern with
automatic de-duplication inside each group, at the cost of losing insertion order within a bucket.

The same pattern covers histograms, graph adjacency lists, and multi-maps generally — swap the
factory and the per-key operation, and the shape stays identical.

---

## `Counter`: A Dict Specialized for Counting

`Counter` is also a `dict` subclass, but specialized for one job: counting hashable objects. Reading
a missing key returns `0` — matching `defaultdict(int)`'s behavior — but with one load-bearing
difference: `counter["missing"]` does **not** insert `"missing"` into the counter the way
`defaultdict(int)["missing"]` would insert it with value `0`. `Counter` answers "how many" without
ever mutating itself on a read.

```python
from collections import Counter

votes = ["Python", "JavaScript", "Python", "Rust", "Python", "Go", "Rust", "Rust"]
vote_counts = Counter(votes)
print(vote_counts)                    # Counter({'Python': 3, 'Rust': 3, 'JavaScript': 1, 'Go': 1})
print(vote_counts["Elixir"])          # 0 -- no KeyError, and "Elixir" is not added to the counter
```

A `Counter` can also be built directly from an existing mapping of counts (`Counter({"a": 10})`) or
from keyword arguments (`Counter(a=10, b=12)`), not only from an iterable of items to tally.

### Worked Example: Ranking Page Visits

**Problem:** given a log of page visits, find the two most-visited pages and the total visit count.

```python
from collections import Counter

visits = ["home", "about", "home", "contact", "home", "about", "profile", "home"]
visit_counts = Counter(visits)

most_visited = visit_counts.most_common(2)   # [('home', 4), ('about', 2)]
total = visit_counts.total()                  # 8
```

**Complexity:** building the `Counter` is O(n). `most_common()` with no argument sorts every
distinct key by count — O(k log k) for `k` distinct keys; `most_common(n)` uses a heap internally
(`heapq.nlargest`) instead of a full sort, dropping that to O(k log n) — worth choosing explicitly
when `n` is small relative to `k`. `total()` (Python 3.10+) is O(k), a single pass summing every
count.

`elements()` is the inverse: it expands a `Counter` into an iterator repeating each key `count`
times (unspecified order, skipping counts ≤ 0) — useful for turning
`Counter({"gold": 2, "silver": 5})` into a flat pool for `random.choice()`-style weighted sampling.

### Worked Example: Multiset Arithmetic

**Problem:** combine step counts from two fitness trackers into a conservative estimate (the smaller
of the two per activity) and an optimistic one (the larger of the two).

`Counter` overloads `+`, `-`, `&`, and `|` as **multiset operators** — the same union/intersection
vocabulary as `set` from [[07-1-sets|Part 00, Chapter 7]], generalized from "present or not" to "how
many":

| Operation    | Operator | Result per key                                             |
| ------------ | -------- | ---------------------------------------------------------- |
| Addition     | `a + b`  | sum of both counts; **zero/negative results dropped**      |
| Subtraction  | `a - b`  | `a`'s count minus `b`'s; **zero/negative results dropped** |
| Intersection | `a & b`  | the smaller of the two counts, for keys in both            |
| Union        | `a \| b` | the larger of the two counts, for keys in either           |

```python
apple_watch = Counter({"walking": 6000, "running": 3000, "stairs": 800})
fitbit = Counter({"walking": 5500, "running": 3500, "stairs": 900, "swimming": 1200})

conservative = apple_watch & fitbit   # Counter({'walking': 5500, 'running': 3000, 'stairs': 800})
optimistic = apple_watch | fitbit     # Counter({'walking': 6000, 'running': 3500, 'swimming': 1200, 'stairs': 900})
```

**Complexity:** O(k) for every operator above, where `k` is the number of distinct keys across both
counters — each is a single pass building a new `Counter`, never a nested comparison. When a true
in-place subtraction is needed — one that keeps negative results instead of discarding them, e.g. to
detect a shortfall — reach for the `.subtract()` method instead of the `-` operator; it mutates in
place and allows negative counts, which `-` deliberately does not.

Two unary operators round this out: `+counter` returns a copy keeping only positive counts (a
shorthand for `counter + Counter()`), and `-counter` returns only the originally negative counts,
flipped positive — a compact way to read off shortages from a `Counter` that has been decremented
below zero via `.subtract()`.

`Counter` equality also gives a one-line multiset check: `Counter(word1) == Counter(word2)` is
`True` exactly when the two strings are anagrams of each other — comparing character multisets
directly, rather than the sorted-canonical-string key that [[06-hashing|Part 02, Chapter 6]]'s Group
Anagrams example uses to bucket many strings at once. Same underlying idea — a canonical form for
"same multiset of characters" — solving two different questions: grouping many strings there,
checking one pair here.

---

## `deque`: The API Behind Stack, Queue, and Sliding Window

This section is the API surface of `collections.deque` only — what makes every operation below O(1)
internally, and the full complexity comparison against `list`, is covered in
[[04-deque|Part 04, Chapter 4]]. Treat what follows as a method reference, not a second pass at the
concept.

A `deque` constructs from any iterable — a list, a tuple, a generator, even a dict's `.items()` view
— and exposes the same four end operations regardless of what built it:

```python
from collections import deque

dq = deque([1, 2, 3])
dq.append(4)          # deque([1, 2, 3, 4])       -- insert at the right
dq.appendleft(0)       # deque([0, 1, 2, 3, 4])    -- insert at the left
dq.pop()               # 4  -> deque([0, 1, 2, 3]) -- remove from the right
dq.popleft()           # 0  -> deque([1, 2, 3])    -- remove from the left

dq.extend([4, 5])      # deque([1, 2, 3, 4, 5])    -- append() once per item, right to left order kept
dq.extendleft([0, -1]) # deque([-1, 0, 1, 2, 3, 4, 5]) -- appendleft() once per item, REVERSES input order
```

`extendleft` reverses the relative order of its argument, because it calls `appendleft()` once per
source item in the source's original order — each push displaces every earlier one further out. It
is the single most common first-encounter surprise in the API and worth internalizing early:
`extend()` never reverses anything, `extendleft()` always does.

`rotate(n)` shifts every element `n` steps toward the back (negative `n` toward the front), and
`maxlen=N` at construction time turns the deque into a fixed-size window that silently evicts from
the opposite end once full — both covered with full worked examples and their O(k) / O(1) costs in
[[04-deque|Part 04, Chapter 4]].

### Worked Example: A Priority Walk-In Queue

**Problem:** model a restaurant waitlist where regular customers join the back of the line, VIP
customers jump straight to the front, and the host always seats whoever is first in line.

```python
from collections import deque

waitlist: deque[str] = deque()

def arrive(name: str, vip: bool = False) -> None:
    if vip:
        waitlist.appendleft(name)   # VIP: front of the line, bypassing everyone waiting
    else:
        waitlist.append(name)      # regular: back of the line

def seat_next() -> str | None:
    return waitlist.popleft() if waitlist else None

arrive("A")
arrive("B")
arrive("C", vip=True)
seat_next()   # "C" -- VIP, seated first despite arriving last
seat_next()   # "A"
```

**Complexity:** every operation here — `append`, `appendleft`, `popleft` — is O(1), which is
precisely the property a plain `list` cannot offer for the front-insertion half of this problem:
`waitlist. insert(0, name)` on a list would be O(n), shifting every waiting customer down one slot
for every single VIP arrival.

---

## `namedtuple`: Immutable Records with Named Fields

`namedtuple(typename, field_names)` builds a new subclass of `tuple` whose fields can be read by
name (`pixel.red`) as well as by index (`pixel[0]`) — because it _is_ a tuple, it keeps every tuple
property for free: immutability, hashability, equality by value, and positional unpacking
(`r, g, b = pixel`). `field_names` accepts a single space- or comma-separated string or a list of
strings; both spellings produce the identical class.

```python
from collections import namedtuple

Pixel = namedtuple("Pixel", "red green blue")
pixel = Pixel(red=255, green=50, blue=0)

pixel.red        # 255 -- by name
pixel[0]         # 255 -- by index, same value
Pixel._fields    # ('red', 'green', 'blue')
```

Because instances are immutable, there is no `pixel.red = 128` — that raises `AttributeError`.
`_replace(**kwargs)` is the sanctioned way to get an "updated" instance: it returns a **new**
`namedtuple` with the given fields swapped, leaving the original untouched, the same
copy-don't-mutate shape `str` methods use (see
[[data-structures-algorithms/00-python-language-foundations/03-strings/03-1-strings|Part 00, Chapter 3]]'s
immutability framing, applied here to a different type for the same reason — a value that can't
change is safe to share and to hash).

Three additional class/instance methods round out the API: `Pixel._make(iterable)` builds an
instance from an existing sequence (useful when data arrives as plain rows, e.g. from a CSV reader);
`pixel._asdict()` converts an instance to a regular `dict`; and a `defaults` keyword argument at
class-creation time supplies default values for the **trailing** fields only — mirroring Python's
own rule that a function's default arguments must come after its required ones:

```python
Dog = namedtuple("Dog", ["name", "age", "location"], defaults=[0, "Home"])
Dog("Balto")   # Dog(name='Balto', age=0, location='Home')
```

### Worked Example: Returning Multiple Named Values from a Function

**Problem:** a function needs to return a success flag alongside a payload or an error — a plain
tuple return makes every call site guess at field order; a `namedtuple` makes the order
self-documenting at zero extra runtime cost.

```python
from collections import namedtuple

Response = namedtuple("Response", "success data error")

def fetch_data() -> Response:
    return Response(success=True, data="payload", error=None)

response = fetch_data()
if response.success:
    print(response.data)
else:
    print(response.error)
```

**Complexity:** O(1) field access, by name or by index — identical to plain tuple indexing, because
name lookup compiles down to the same index lookup at class-definition time, not a runtime string
search. Memory-wise, a `namedtuple` instance carries no per-instance `__dict__` the way a plain
class does, so it costs the same as an equivalent plain tuple, not more — the field names live once
on the class, not once per instance.

`namedtuple` sits between a plain tuple and a `@dataclass`: it buys named, self-documenting fields
over a bare tuple, and it buys tuple-compatibility (hashability, unpacking, minimal memory) that a
mutable `@dataclass` does not have by default. Reach for `@dataclass` instead the moment a record
needs to be mutated after construction or needs its own methods beyond field access — `namedtuple`'s
immutability is a feature only for data that is genuinely a fixed record once created.

---

## Choosing Among the Four

Each of these four tools fixes exactly one friction, and each has exactly one habit worth watching
for:

- **`defaultdict`: a read can silently write.** `dd[key]` — even one written only to inspect a
  value, such as a debug `print(dd[key])` — inserts `key` with the factory's default if it wasn't
  already present. That can quietly grow the dict's size, change what `len(dd)` reports, or break an
  equality check against a plain `dict` built without ever touching that key. Use `dd.get(key)` for
  a read-only check, and convert to `dict(dd)` before comparing or serializing if the extra keys
  would matter.
- **`Counter`: `+`/`-`/`&`/`|` all discard zero and negative results.** If a negative delta is part
  of the answer — "how far below zero did this go" — those operators will silently drop it;
  `.subtract()` is the in-place alternative that keeps negative counts.
- **`deque`: no O(1) random access, and `extendleft` reverses its argument.** Both are explored
  fully, with the internal reason why, in [[04-deque|Part 04, Chapter 4]].
- **`namedtuple`: still positional under the hood.** Constructing one with positional arguments
  instead of keywords reintroduces the exact "field order is hard to remember" problem the type
  exists to solve, and `defaults` only fills in trailing fields, never leading ones.

None of these four replace `dict` or `list` outright — each is a targeted fix for one specific
friction: `defaultdict` removes a key-existence branch, `Counter` specializes counting and multiset
arithmetic, `deque` buys O(1) at both ends a list can't offer, and `namedtuple` buys named,
immutable fields a plain tuple can't. Reach for the one that matches the friction actually present,
not a general-purpose `dict`/`list`/`tuple` out of habit.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
