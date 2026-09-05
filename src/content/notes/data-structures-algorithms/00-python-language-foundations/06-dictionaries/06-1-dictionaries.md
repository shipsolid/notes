---
title: "6 — Dictionaries"
description: "Python's dict is the hash table from the neighboring chapter with a full public API wrapped around it — this is a tour of that surface: creation, safe access, mutation, removal, sorting, aggregation, iteration, copying, and its second job as **kwargs."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: related
zettelId: "202607301922-15"
---

# 6 — Dictionaries

A Python `dict` is a hash table with a public API bolted on top of it — but almost none of the
day-to-day churn of using one (does this key exist, what's the safe way to remove it, how do I sort
by value, what happens when I copy one) ever touches the hashing mechanism directly. For how
`dict`/`set` actually deliver O(1) average lookup — hash functions, buckets, collisions, load factor
— see [[06-hashing|Part 02, Chapter 6]]; this chapter takes that machinery as given and works
through everything you actually _do_ with a `dict` once it exists: creating one, reading and writing
it safely, removing entries five different ways, sorting and aggregating over its values, iterating
in the three shapes that matter, copying without silently sharing state you didn't mean to share,
and the double life `**` gives a dict as keyword arguments.

---

## Creating a Dictionary

There are three everyday ways to get a `dict` into existence: the literal, the empty dict, and
`dict.fromkeys()` for the common case of a set of keys that all start with the same value.

```python
settings = {"resolution": "1920x1080", "fullscreen": True, "volume": 75}
empty: dict = {}

permissions = ["read", "write", "delete", "export"]
default_permissions = dict.fromkeys(permissions, False)
# {'read': False, 'write': False, 'delete': False, 'export': False}
```

`len()` on any of these counts key-value pairs — it has nothing to say about what's nested inside
the values.

`dict.fromkeys()`'s second argument is a single object, not a factory that runs once per key — every
key ends up pointing at the _same_ object. That's silent and harmless for an immutable like `False`,
and a real bug the moment the default is mutable:

```python
buckets = dict.fromkeys(["a", "b", "c"], [])
buckets["a"].append("x")
print(buckets)
# {'a': ['x'], 'b': ['x'], 'c': ['x']}  -- one list, three keys pointing at it
```

Reach for a dict comprehension (`{k: [] for k in keys}`) the instant the default value needs its own
identity per key instead of a shared one.

---

## Reading a Dictionary Safely

Square-bracket access (`config["resolution"]`) is the fastest way to read a key you're certain
exists, and it raises `KeyError` immediately if you're wrong — usually the correct failure mode for
a genuine bug (loud and immediate beats silently returning `None` and failing three lines later).

For keys that are legitimately optional, `.get(key, default)` returns the default instead of
raising, and `.get(key)` alone returns `None`:

```python
config = {"resolution": "1920x1080", "fullscreen": True}

resolution = config.get("resolution", "unset")   # "1920x1080" -- key present
brightness = config.get("brightness", "unset")   # "unset"     -- key absent, no exception
theme = config.get("theme")                      # None        -- no default given
```

`in` checks membership without touching the value at all, which reads better than a `.get()` call
you're going to throw away:

```python
if "resolution" not in config:
    config["resolution"] = "1920x1080"
```

`.setdefault(key, default)` folds that exact pattern — check, and only insert if missing — into one
call, returning either the existing value or the one it just inserted:

```python
user: dict[str, str] = {"username": "data_builder"}

role = user.setdefault("role", "viewer")            # inserts "viewer", returns "viewer"
username = user.setdefault("username", "data_tester")  # key exists, returns "data_builder" unchanged
```

Nested dicts read the same way, chained left to right — each bracket pair drills one level deeper
into whatever the previous lookup returned:

```python
user_preferences = {
    "userX": {"preferences": {"theme": "dark", "notifications": True}},
}
print(user_preferences["userX"]["preferences"]["theme"])  # "dark"
```

---

## Adding, Updating, and Merging

A plain assignment (`sensors["humidity"] = "60%"`) adds the key if it's new and overwrites it if it
isn't — there's no separate "insert" call, which is different from structures like a set where add
is idempotent by design but doesn't carry a value to overwrite.

`.update()` merges a second dict (or any iterable of key-value pairs) into the first, in place,
argument-wins-on-conflict:

```python
global_settings = {"sampling_rate": 60, "units": "metric", "precision": 2}
device_overrides = {"precision": 3, "units": "imperial", "calibration_offset": 0.05}

global_settings.update(device_overrides)
# {'sampling_rate': 60, 'units': 'imperial', 'precision': 3, 'calibration_offset': 0.05}
```

The `|` and `|=` operators (3.9+) do the same merge with different mutation semantics: `|` builds
and returns a _new_ dict, leaving both operands untouched; `|=` mutates the left-hand dict in place,
functionally equivalent to `.update()` but readable as an operator rather than a method call:

```python
new_settings = global_settings | device_overrides   # new dict; global_settings unchanged
global_settings |= device_overrides                 # in-place; same result as .update()
```

Both forms resolve key collisions the same way: whichever operand is on the right (the argument to
`.update()`, or the right-hand side of `|`) wins. That's exactly the shape you want for config
layering — `base | overrides` — and exactly the shape that silently clobbers data if you get the
operand order backwards.

---

## Removing Items

Five ways to remove, each with a different failure mode worth knowing on purpose rather than by
accident:

```python
sensors = {"temperature": "22°C", "humidity": "60%", "pressure": "1013 hPa"}

del sensors["humidity"]              # raises KeyError if the key is missing
value = sensors.pop("pressure")      # removes and returns the value; KeyError if missing and no default
missing = sensors.pop("wind", None)  # explicit default suppresses the KeyError entirely
last = sensors.popitem()             # removes and returns the most-recently-inserted (key, value) pair
sensors.clear()                      # empties the dict in place; same object, zero entries
```

`popitem()`'s "most recent" behavior relies on the same insertion-order guarantee CPython's `dict`
has kept since 3.7 — which is why it reads as a LIFO pop, and why it's a reasonable building block
for a stack-like structure that also needs O(1) key lookup. `del` and unguarded `.pop()` are the two
forms that can raise; reach for `.pop(key, default)` or a membership check first anywhere a missing
key is an expected outcome rather than a bug.

---

## Worked Example: Sorting a Dictionary by Value

**Problem:** a dict has no ordering guarantee beyond insertion order — producing "sorted by value"
output means pulling the pairs out, sorting them, and rebuilding.

```python
from operator import itemgetter

def rank_by_price(catalog: dict[str, float]) -> dict[str, float]:
    # .items() is a *view* of (key, value) tuples, not a list -- sorted() consumes it lazily.
    # itemgetter(1) reads as "sort by each tuple's index-1 element" -- the value, not the key --
    # and is faster than the equivalent `lambda item: item[1]` because it avoids a Python-level
    # function call per comparison.
    return dict(sorted(catalog.items(), key=itemgetter(1)))

prices = {"keyboard": 29.99, "monitor": 189.99, "mouse": 19.99, "chair": 120.00}
print(rank_by_price(prices))
# {'mouse': 19.99, 'keyboard': 29.99, 'chair': 120.0, 'monitor': 189.99}
```

**Complexity:** O(n log n) time for the sort itself, O(n) space for the rebuilt dict and the
intermediate list of tuples `sorted()` produces internally. The original `prices` dict is never
touched — `dict(sorted(...))` always builds a new object, which is worth relying on deliberately
rather than discovering by accident.

---

## Aggregate Functions Over `.values()`

`len`, `sum`, `max`, `min`, `all`, and `any` all accept `.values()` directly — it's an iterable, and
none of these builtins care that it came from a dict rather than a list:

```python
uptime_hours = {"server1": 120, "server2": 98, "server3": 143, "server4": 0}
values = uptime_hours.values()

print(len(values))   # 4    -- server count
print(sum(values))    # 361  -- combined uptime
print(max(values))    # 143  -- longest-running server
print(min(values))    # 0    -- shortest, possibly offline
print(all(values))    # False -- at least one server has 0 uptime
print(any(values))    # True  -- at least one server has uptime > 0
```

Each of these is its own O(n) pass over the view. That's invisible at four entries and worth
noticing at scale — five aggregate calls chained back-to-back on the same large dict is five full
traversals, not one. If a single pass matters, compute the running total, max, and "any zero" flag
together in one explicit loop instead of composing five builtins.

---

## Iterating and Transforming

Looping over a dict directly iterates its keys — `.keys()` exists and is legal to spell out, but a
bare `for key in d` is the idiom you'll see in nearly every codebase:

```python
status_messages = {200: "OK", 404: "Not Found", 500: "Server Error", 403: "Forbidden"}

for code in status_messages:                # implicit .keys()
    ...
for message in status_messages.values():     # values only
    ...
for code, message in status_messages.items():  # both, unpacked per pair
    ...
```

A dict comprehension applies the same items()-unpack to build a new, transformed dict in one
expression — see [[17-1-comprehensions|Chapter 17, this same Part]] for the comprehension syntax
family more broadly:

```python
file_sizes = {"report.pdf": 4, "photo.png": 2, "data.csv": 12}
sizes_kb = {name: size * 1024 for name, size in file_sizes.items()}
```

`.keys()` (and `.items()`, when the values are hashable) return _view_ objects that support set
algebra directly — `&` for intersection, `|` for union, `-` for difference — because a dict's keys
are already guaranteed unique, which is exactly what a set needs:

```python
a = {"x": 1, "y": 2}
b = {"y": 20, "z": 30}
print(a.keys() & b.keys())  # {'y'} -- keys common to both
```

These views stay live: mutating the underlying dict after taking a view changes what the view
reports too, since it isn't a snapshot copy.

---

## Worked Example: Aliasing vs. Shallow vs. Deep Copy

**Problem:** three different things all look like "copying a dict," and only one of them actually
isolates nested mutable state.

```python
import copy

original = {"theme": "dark", "options": {"autosave": True}}

alias = original                 # same object -- not a copy at all
alias["theme"] = "light"
assert original["theme"] == "light"  # the "copy" was never independent

original = {"theme": "dark", "options": {"autosave": True}}
shallow = original.copy()        # new outer dict, but nested values are shared references
shallow["options"]["autosave"] = False
assert original["options"]["autosave"] is False  # the nested dict leaked through

original = {"theme": "dark", "options": {"autosave": True}}
deep = copy.deepcopy(original)   # recursively rebuilds every nested mutable structure
deep["options"]["autosave"] = False
assert original["options"]["autosave"] is True   # fully isolated this time
```

**Complexity:** `.copy()` (equivalently `dict(original)`) is O(n) in the number of top-level
key-value pairs — it only ever clones one level. `copy.deepcopy()` is O(total size of the nested
structure), since it walks every mutable object it reaches; that's the correct cost to pay when the
values are themselves dicts, lists, or other mutable containers you intend to change independently.
Reach for `.copy()` when the dict's values are immutable (numbers, strings, tuples of immutables)
and there's nothing for a shallow copy to leak.

---

## Worked Example: Unpacking Dictionaries into Function Calls

**Problem:** a dict of arguments needs to become a function call without hand-writing each keyword.

```python
def greet(greeting: str, name: str) -> None:
    print(f"{greeting}, {name}!")

payload = {"greeting": "Hello", "name": "Traveler"}
greet(**payload)   # identical to greet(greeting="Hello", name="Traveler")

wrong_payload = {"salutation": "Hey", "name": "Guest"}
try:
    greet(**wrong_payload)
except TypeError as e:
    print("caught:", e)  # unexpected keyword argument 'salutation'
```

`**` unpacking requires the dict's keys to match the function's parameter names exactly — there's no
partial or fuzzy match, just a `TypeError` the moment one key doesn't line up.

The signature-side mirror image, `**kwargs`, does the reverse job: it _collects_ any keyword
arguments the caller passes that aren't already named parameters, into a single dict inside the
function:

```python
def html_tag(tag: str, content: str, **attrs: str) -> str:
    # attrs = {"href": "...", "style": "..."} for the call below
    rendered = " ".join(f'{key}="{value}"' for key, value in attrs.items())
    return f"<{tag} {rendered}>{content}</{tag}>"

print(html_tag("a", "Click Here", href="https://example.com", style="color: red;"))
# <a href="https://example.com" style="color: red;">Click Here</a>
```

`**payload` on the way in and `**attrs` on the way out are the same mechanism run in opposite
directions — a dict becomes named arguments, and unnamed arguments become a dict — which is why
"pass a dict of options through as kwargs" and "accept arbitrary extra options" are both one-line
idioms instead of two different features.

---

## Where the Dict API Bites Back

A handful of dict behaviors read as convenience until the moment they aren't:

- **Keys must be hashable.** `d[[1, 2]] = "x"` raises `TypeError: unhashable type: 'list'` — dict
  keys need the same hashability a hash table requires generally (see
  [[06-hashing|Part 02, Chapter 6]]), so lists and other dicts can't be keys, but tuples of hashable
  elements can.
- **Insertion order is a `dict`-specific promise, not a hashing one.** CPython has iterated `dict`
  in insertion order since 3.7, which is why `popitem()` behaves like a LIFO pop — but that
  guarantee belongs to `dict` specifically, not to hash tables as a technique, so don't assume it
  carries over to every hash-based structure you meet.
- **`.get(key, default)` evaluates `default` unconditionally**, on every call, whether the key is
  present or not. `config.get("x", expensive_call())` pays for `expensive_call()` even on a hit —
  guard the call yourself (`config["x"] if "x" in config else expensive_call()`) if that cost
  matters.
- **Shallow `.copy()` only clones the outer dict.** Nested lists or dicts are shared references
  between the original and the copy — the Worked Example above is the exact shape of the bug this
  produces in practice, and it's worth checking for by hand whenever a dict's values are themselves
  mutable.
- **`|`, `|=`, and `.update()` all resolve collisions the same way** — the right-hand or argument
  side always wins, silently. Convenient when that's the intent (config layering), a landmine when
  the operand order is a typo.

None of these are reasons to avoid `dict` — they're the fine print on an otherwise O(1) convenience,
worth reading once so it doesn't cost a debugging session later.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
