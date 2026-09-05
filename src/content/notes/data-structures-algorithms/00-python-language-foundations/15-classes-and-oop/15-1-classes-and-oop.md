---
title: "15 — Classes & OOP"
description: "A Python class bundles state and behavior behind one name and a small set of dunder-method hooks that make instances look and act like built-ins — this chapter is what those hooks buy you, and the two places (a mutable class attribute, an __eq__ without a matching __hash__) where the bundling quietly breaks under you."
tags: ["data-structures-algorithms","python-foundations","book"]
updated: 2026-07-31
hidden: false
relations:
  - slug: data-structures-algorithms/02-arrays-and-strings/06-hashing/06-hashing
    kind: related
zettelId: "202607301922-7"
---

# 15 — Classes & OOP

A `class` is a template for bundling data and the functions that operate on it into a single unit —
an object that carries its own state and knows how to act on it, instead of passing a plain value
through a pile of loose functions that all assume the same shape. Python leans on this harder than
most languages let on: every `int`, every `list`, every exception you've ever caught is already an
instance of some class, and the same handful of hooks — `__init__`, `__eq__`, `__repr__`, `__add__`
— that make your own objects behave are exactly the hooks the built-in types use internally. This
chapter is those hooks: how state splits between an instance and its class, how behavior is
inherited and overridden, how `@property` and `@dataclass` remove boilerplate without removing
control, and the couple of places — a mutable class attribute, an `__eq__` defined without a
matching `__hash__` — where the convenience quietly turns into a bug.

---

## Instance Attributes vs. Class Attributes

Every class has two places to keep data: attributes set inside `__init__` via `self` belong to the
_instance_ — one copy per object — while attributes assigned directly in the class body belong to
the _class_ — one copy shared by every instance that doesn't shadow it:

```python
class Dog:
    species = "Canis lupus familiaris"   # class attribute — shared by all instances

    def __init__(self, name: str, age: int) -> None:
        self.name = name   # instance attribute — one copy per Dog
        self.age = age

    def bark(self) -> str:
        return f"{self.name} says: Woof!"

d1 = Dog("Rex", 3)
d2 = Dog("Buddy", 5)

d1.bark()          # "Rex says: Woof!"
Dog.species        # "Canis lupus familiaris" — via the class
d1.species         # "Canis lupus familiaris" — via the instance, same object
```

Reading `d1.species` works because attribute lookup on an instance falls back to the class when the
instance itself has no matching entry — there's no copy made, `d1.species` and `Dog.species` are the
_same_ string object. That fallback is harmless here because strings are immutable. It stops being
harmless the moment the class attribute is a mutable container: `class Dog: tricks = []` gives every
`Dog` instance the same list object, so `d1.tricks.append("sit")` silently shows up on `d2.tricks`
too, because there was never a per-instance list to begin with — only ever the one. It's the exact
"the default is captured once, not once per call" trap covered for function arguments in
[[14-1-functions|Part 00, Chapter 14]], wearing a different hat: there, the culprit is a mutable
default argument evaluated once at `def` time; here, it's a mutable class attribute evaluated once
at class body execution time. The fix is the same shape too — initialize the mutable value inside
`__init__` (`self.tricks = []`) so each instance gets its own.

---

## Alternative Constructors: `@classmethod` and `@staticmethod`

Both decorators attach a function to a class's namespace instead of to instances, but they differ in
what they receive:

- **`@classmethod`** receives the class itself as its first argument (conventionally named `cls`),
  not an instance — the standard use is an alternative constructor, a named way to build an instance
  that `__init__`'s single signature can't express cleanly.
- **`@staticmethod`** receives neither `self` nor `cls` — it's a plain function that happens to live
  in the class's namespace because it's conceptually related, with no need to touch instance or
  class state at all.

```python
class Circle:
    PI = 3.14159

    def __init__(self, radius: float) -> None:
        self.radius = radius

    def area(self) -> float:
        return self.PI * self.radius ** 2

    @classmethod
    def from_diameter(cls, diameter: float) -> "Circle":
        return cls(diameter / 2)   # cls(...) — works for subclasses too, unlike Circle(...)

    @staticmethod
    def is_valid_radius(r: float) -> bool:
        return r > 0

c1 = Circle(5)
c2 = Circle.from_diameter(10)

f"{c1.area():.2f}"          # "78.54"
c2.radius                    # 5.0
Circle.is_valid_radius(-1)   # False
```

Calling `cls(diameter / 2)` rather than hardcoding `Circle(diameter / 2)` matters the moment a
subclass exists: if `FilledCircle(Circle)` inherits `from_diameter` unmodified, `cls` is
`FilledCircle` inside that call, so the alternative constructor keeps producing the right type
instead of silently downgrading every subclass instance back to the base class.

---

## Inheritance and Polymorphic Dispatch

Inheritance expresses an IS-A relationship: a subclass gets everything the parent defines and can
override any of it. Calling the same method name on a list of mixed subclass instances dispatches to
each one's own override — polymorphism — without the caller needing to know which concrete type it's
holding:

```python
class Animal:
    def __init__(self, name: str) -> None:
        self.name = name

    def speak(self) -> str:
        raise NotImplementedError("Subclass must implement speak()")

class Dog(Animal):
    def speak(self) -> str:
        return f"{self.name}: Woof!"

class Cat(Animal):
    def speak(self) -> str:
        return f"{self.name}: Meow!"

animals: list[Animal] = [Dog("Rex"), Cat("Whiskers"), Dog("Buddy")]
for a in animals:
    a.speak()   # each instance dispatches to its own override

isinstance(animals[0], Dog)      # True
isinstance(animals[0], Animal)   # True — Dog IS-A Animal
issubclass(Dog, Animal)          # True
```

`Animal.speak` raising `NotImplementedError` rather than returning something is a deliberate
contract — it turns "forgot to override this" into an immediate, loud failure instead of a silently
wrong answer. None of this dispatch actually _requires_ a shared base class, though: Python is
duck-typed, so any object with a `.speak()` method works in that `for` loop regardless of its
inheritance chain. Inheritance here buys an explicit contract and `isinstance` checks — the
polymorphism itself comes free from dynamic method lookup either way.

---

## `super()`: Delegating to the Parent Without Naming It Twice

`super()` calls the next class in the method resolution order relative to the current one, most
often the immediate parent's version of the method being overridden — used to extend a parent's
behavior rather than replace it outright:

```python
class Vehicle:
    def __init__(self, make: str, model: str) -> None:
        self.make = make
        self.model = model

    def info(self) -> str:
        return f"{self.make} {self.model}"

class ElectricVehicle(Vehicle):
    def __init__(self, make: str, model: str, battery_kwh: float) -> None:
        super().__init__(make, model)   # delegate to the parent, don't re-implement it
        self.battery_kwh = battery_kwh

    def info(self) -> str:
        return super().info() + f" [{self.battery_kwh} kWh]"

ev = ElectricVehicle("Tesla", "Model 3", 75)
ev.info()   # "Tesla Model 3 [75 kWh]"
```

Writing `super().__init__(make, model)` instead of `Vehicle.__init__(self, make, model)` avoids
hardcoding the parent's name — the difference between a one-line change and a multi-file rename once
the hierarchy grows or the parent is refactored. It also cooperates correctly across a multi-parent
hierarchy: `super()` follows the class's actual method resolution order rather than a name typed by
hand, which matters the moment that order isn't a simple straight line — the multiple-inheritance
case covered later in this chapter.

---

## Worked Example: Dunder Methods and the `__eq__` / `__hash__` Trap

**Problem:** make a `Vector` type that supports `+`, `*`, equality, `len()`, `abs()`, and
truthiness, the way Python's own numeric types do — without a single `add()` or `equals()` method
name in sight.

```python
class Vector:
    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        return f"Vector({self.x}, {self.y})"    # machine-readable — REPL, debugging, logs

    def __str__(self) -> str:
        return f"({self.x}, {self.y})"          # human-readable — print(), str()

    def __add__(self, other: "Vector") -> "Vector":
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, scalar: float) -> "Vector":
        return Vector(self.x * scalar, self.y * scalar)

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Vector) and self.x == other.x and self.y == other.y

    def __len__(self) -> int:
        return int((self.x ** 2 + self.y ** 2) ** 0.5)

    def __abs__(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def __bool__(self) -> bool:
        return self.x != 0 or self.y != 0

v1, v2 = Vector(2, 3), Vector(1, 4)
v1 + v2            # (3, 7) — dispatches through __add__
v1 * 3             # (6, 9)
v1 == Vector(2, 3) # True
abs(v1)            # 3.6055...
bool(Vector(0, 0)) # False
```

`__repr__` and `__str__` answer different questions — `__repr__` is the unambiguous, debug-oriented
form the REPL and `repr()` fall back on when `__str__` is missing; `__str__` is what `print()` and
`str()` prefer when it's defined. Every operator (`+`, `*`, `==`, `len()`, `abs()`, truthiness) is
just Python calling the matching dunder method under the hood — there's no special-cased operator
overloading syntax to learn beyond naming the method correctly.

The trap: defining `__eq__` without also defining `__hash__` makes instances of `Vector`
**unhashable**. Python's rule is that two objects considered equal must hash identically (otherwise
a `dict` or `set` could never find a key it already holds), so as soon as a class defines its own
`__eq__`, Python sets that class's inherited `__hash__` to `None` rather than risk it disagreeing —
`{Vector(1, 1)}` raises `TypeError: unhashable type` on exactly the `Vector` defined above. Fixing
it means defining `__hash__` explicitly (typically `hash((self.x, self.y))`, matching whichever
fields `__eq__` compares) — see [[06-hashing|Part 02, Chapter 6]] for what "hashable" is actually
promising the hash table: that the hash value never changes while the object is stored, which is why
hand-written `__hash__` implementations should only ever combine fields that are themselves
immutable or that you guarantee never change after construction.

---

## Properties: Validated and Computed Attributes

`@property` turns a method into something that reads like a plain attribute, letting a class enforce
an invariant or compute a derived value without the caller ever writing `()`:

```python
class Temperature:
    def __init__(self, celsius: float) -> None:
        self._celsius = celsius   # leading underscore: private by convention only

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError("Temperature below absolute zero!")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:
        return self._celsius * 9 / 5 + 32   # no setter defined — read-only

t = Temperature(25)
t.celsius       # 25          — getter, reads like an attribute
t.fahrenheit    # 77.0        — computed on every access, never stored
t.celsius = 100 # setter runs validation
t.celsius = -300   # raises ValueError: Temperature below absolute zero!
```

The leading underscore on `_celsius` is a naming convention, not enforcement — Python has no true
private attributes, and `t._celsius` still works from outside the class. What actually enforces the
invariant is the setter running on every assignment through `t.celsius = ...`; `fahrenheit` has no
setter at all, which is what makes it read-only — attempting `t.fahrenheit = 100` raises
`AttributeError` instead of silently doing nothing. This is the Pythonic middle ground between raw,
unvalidated attributes and Java-style `get_celsius()`/`set_celsius()` pairs: validation runs on
every assignment, but the call site still looks like a plain attribute.

---

## Worked Example: Dataclasses and Auto-Generated Comparisons

**Problem:** define a handful of small, data-holding classes — a point, a payroll record — without
hand-writing `__init__`, `__repr__`, and `__eq__` for each one.

```python
from dataclasses import dataclass, field

@dataclass
class Point:
    x: float
    y: float
    label: str = ""    # default value, same rules as a function's default argument

@dataclass(order=True)   # also generates __lt__, __le__, __gt__, __ge__
class Employee:
    sort_index: float = field(init=False, repr=False)   # excluded from __init__ and repr
    name: str = ""
    dept: str = ""
    salary: float = 0.0

    def __post_init__(self) -> None:
        self.sort_index = self.salary   # derive the sort key after the real fields are set

p = Point(1.0, 2.5, "origin")
p   # Point(x=1.0, y=2.5, label='origin') — __repr__ generated from the field list

staff = [
    Employee("Alice", "Eng", 120_000),
    Employee("Bob", "HR", 80_000),
    Employee("Carol", "Eng", 150_000),
]
staff.sort()   # uses the generated comparison methods, which compare sort_index first
```

**Complexity:** `staff.sort()` is Python's Timsort, O(n log n) comparisons — the interesting part is
_what_ gets compared: `@dataclass(order=True)` compares fields in declaration order, so putting
`sort_index` first makes it the effective sort key without a `key=` argument.
`field(init=False, repr=False)` keeps a derived field out of the generated `__init__` signature and
`__repr__` output, and `__post_init__` runs immediately after the generated `__init__` finishes —
exactly where a field that depends on other fields belongs.

`@dataclass` generates `__eq__` by default (comparing every field, tuple-style), which triggers the
same rule from the dunder-methods section above: a plain `@dataclass` also gets `__hash__` set to
`None`, because a custom `__eq__` with no explicit hashability decision is the unsafe combination
Python refuses to guess at. Pass `frozen=True` (which also makes every field read-only) to get a
dataclass Python will hash for you — only then is an instance usable as a dict key or as an element
of a [[07-1-sets|Part 00, Chapter 7]] `set`, the same hashability requirement covered in
[[06-hashing|Part 02, Chapter 6]], just reached through a decorator instead of a hand-written
`__hash__`.

---

## Multiple Inheritance and Method Resolution Order

A class can inherit from more than one parent. When two parents define the same method name, Python
needs a deterministic rule for which one wins:

```python
class Flyable:
    def move(self) -> str:
        return "Flying"

class Swimmable:
    def move(self) -> str:
        return "Swimming"

class Duck(Flyable, Swimmable):
    pass

d = Duck()
d.move()          # "Flying" — Flyable is listed first
Duck.__mro__      # (Duck, Flyable, Swimmable, object) — the full resolution order
```

Python resolves this with C3 linearization: roughly, "search the class itself, then each parent
depth-first in the order listed, never placing a class before one of its own subclasses." In
practice the shorthand that covers almost every case is simpler — **leftmost parent wins** — which
is why `Duck(Flyable, Swimmable)` picks `Flyable.move`, and swapping the base-class order swaps the
result. Check `Duck.__mro__` directly the moment a multi-parent hierarchy's behavior surprises you,
rather than reasoning it out from the class definition alone.

---

## When a Class Is (and Isn't) the Right Tool

A class buys three things at once: bundled state, inherited/overridable behavior, and an identity
(two instances with identical fields are still two different objects unless `__eq__` says
otherwise). Reach past a class when a problem doesn't actually need one of them:

- **No behavior, just structure.** A bag of related values with no method that ever touches them is
  better as a plain `dict` or a `@dataclass` — see [[06-1-dictionaries|Part 00, Chapter 6]] for how
  far a plain `dict` goes before more is actually needed.
- **No state at all.** A function that only transforms its arguments needs no `self`, no instance,
  and no class — wrapping it in a class just to "namespace" it adds indirection a module-level
  function doesn't need.
- **You need instances usable as dict keys or set elements.** Defining `__eq__` without `__hash__` —
  by hand or via a non-frozen `@dataclass` — silently makes instances unhashable. Decide up front
  whether identity or value equality is what the type means, and match `__hash__` (or `frozen=True`)
  to that choice, rather than discovering the `TypeError` the first time an instance lands in a
  `set`.
- **A class attribute holds a mutable default.** A list or dict assigned in the class body is shared
  by every instance that doesn't shadow it — the same "captured once, not once per call" trap
  covered for default arguments in [[14-1-functions|Part 00, Chapter 14]]. Initialize mutable state
  inside `__init__` instead.

The pattern underneath all four: a class earns its cost the moment a problem genuinely needs state
_and_ behavior _and_ identity bundled together — the instant it only needs one or two of those, a
function, a `dict`, or a plain `@dataclass` gets there with less to get wrong.

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
