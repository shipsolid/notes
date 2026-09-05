---
title: "Practice: Classes & OOP"
description: "The raw practice corpus behind the Classes & OOP chapter — runnable Python covering instance vs. class attributes, classmethods/staticmethods, inheritance, super(), dunder methods, properties, dataclasses, and multiple inheritance/MRO."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031823"
---

# Practice: Classes & OOP

This is the raw practice corpus behind [[15-1-classes-and-oop|15 — Classes & OOP]] — every
class-and-OOP drill written while building the intuition that chapter distills into worked examples
and prose. Each section below is a standalone, runnable function; none of them have been rewritten
or bug-fixed here — this is a structural pass (frontmatter, headings) only, not a correctness
review.

## Basic Class and `__init__`

```python
def print_basic_class():
  class Dog:
    species = "Canis lupus familiaris"   # class attribute — shared by all instances

    def __init__(self, name, age):
      self.name = name    # instance attributes
      self.age  = age

    def bark(self):
      return f"{self.name} says: Woof!"

    def description(self):
      return f"{self.name} is {self.age} year(s) old"

  d1 = Dog("Rex", 3)
  d2 = Dog("Buddy", 5)

  print(d1.bark())             # Rex says: Woof!
  print(d2.description())      # Buddy is 5 year(s) old
  print(Dog.species)           # class attribute via class
  print(d1.species)            # class attribute via instance
```

## `@classmethod` and `@staticmethod`

```python
def print_class_static_methods():
  class Circle:
    PI = 3.14159

    def __init__(self, radius):
      self.radius = radius

    def area(self):
      return self.PI * self.radius ** 2

    @classmethod
    def from_diameter(cls, diameter):
      # Alternative constructor — receives the class, not an instance
      return cls(diameter / 2)

    @staticmethod
    def is_valid_radius(r):
      # No access to class or instance — just a utility tied to the class namespace
      return r > 0

  c1 = Circle(5)
  c2 = Circle.from_diameter(10)   # alternative constructor
  print(f"area: {c1.area():.2f}")   # area: 78.54
  print(f"radius via diameter: {c2.radius}")  # 5.0
  print(Circle.is_valid_radius(-1))  # False
```

## Inheritance

```python
def print_inheritance():
  class Animal:
    def __init__(self, name):
      self.name = name

    def speak(self):
      raise NotImplementedError("Subclass must implement speak()")

    def __str__(self):
      return f"{self.__class__.__name__}({self.name})"

  class Dog(Animal):
    def speak(self):
      return f"{self.name}: Woof!"

  class Cat(Animal):
    def speak(self):
      return f"{self.name}: Meow!"

  animals = [Dog("Rex"), Cat("Whiskers"), Dog("Buddy")]
  for a in animals:
    print(a.speak())    # polymorphic dispatch

  # isinstance / issubclass
  print(isinstance(animals[0], Dog))     # True
  print(isinstance(animals[0], Animal))  # True — Dog IS-A Animal
  print(issubclass(Dog, Animal))         # True
```

## `super()`

```python
def print_super():
  class Vehicle:
    def __init__(self, make, model):
      self.make  = make
      self.model = model

    def info(self):
      return f"{self.make} {self.model}"

  class ElectricVehicle(Vehicle):
    def __init__(self, make, model, battery_kwh):
      super().__init__(make, model)    # delegate to parent __init__
      self.battery_kwh = battery_kwh

    def info(self):
      return super().info() + f" [{self.battery_kwh} kWh]"

  ev = ElectricVehicle("Tesla", "Model 3", 75)
  print(ev.info())  # Tesla Model 3 [75 kWh]
```

## Dunder (Magic) Methods

```python
def print_dunder_methods():
  class Vector:
    def __init__(self, x, y):
      self.x = x
      self.y = y

    def __repr__(self):
      # Machine-readable; used in REPL and for debugging
      return f"Vector({self.x}, {self.y})"

    def __str__(self):
      # Human-readable; used by print() and str()
      return f"({self.x}, {self.y})"

    def __add__(self, other):
      return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, scalar):
      return Vector(self.x * scalar, self.y * scalar)

    def __eq__(self, other):
      return self.x == other.x and self.y == other.y

    def __len__(self):
      # len() — here we return integer magnitude (truncated)
      return int((self.x ** 2 + self.y ** 2) ** 0.5)

    def __abs__(self):
      return (self.x ** 2 + self.y ** 2) ** 0.5

    def __bool__(self):
      return self.x != 0 or self.y != 0

  v1 = Vector(2, 3)
  v2 = Vector(1, 4)

  print(repr(v1))         # Vector(2, 3)
  print(str(v1))          # (2, 3)
  print(v1 + v2)          # (3, 7)
  print(v1 * 3)           # (6, 9)
  print(v1 == Vector(2, 3))  # True
  print(abs(v1))          # 3.605...
  print(bool(Vector(0, 0)))  # False
```

## `@property`

```python
def print_property():
  class Temperature:
    def __init__(self, celsius):
      self._celsius = celsius   # _ signals "private by convention"

    @property
    def celsius(self):
      return self._celsius

    @celsius.setter
    def celsius(self, value):
      if value < -273.15:
        raise ValueError("Temperature below absolute zero!")
      self._celsius = value

    @property
    def fahrenheit(self):
      return self._celsius * 9 / 5 + 32

  t = Temperature(25)
  print(t.celsius)      # 25     (getter)
  print(t.fahrenheit)   # 77.0   (computed, read-only)
  t.celsius = 100       # setter
  print(t.celsius)      # 100
  try:
    t.celsius = -300
  except ValueError as e:
    print(e)            # Temperature below absolute zero!
```

## Dataclasses (Python 3.7+)

```python
def print_dataclasses():
  from dataclasses import dataclass, field

  @dataclass
  class Point:
    x: float
    y: float
    label: str = ""     # default value

  @dataclass(order=True)  # generates __lt__, __le__, etc.
  class Employee:
    # sort_index is used by auto-generated comparison methods
    sort_index: float = field(init=False, repr=False)
    name:   str  = ""
    dept:   str  = ""
    salary: float = 0.0

    def __post_init__(self):
      self.sort_index = self.salary   # sort by salary

  p = Point(1.0, 2.5, "origin")
  print(p)              # Point(x=1.0, y=2.5, label='origin')
  print(p.x, p.y)

  staff = [
    Employee("Alice", "Eng",  120_000),
    Employee("Bob",   "HR",    80_000),
    Employee("Carol", "Eng",  150_000),
  ]
  staff.sort()   # uses sort_index (salary)
  for e in staff:
    print(f"  {e.name}: {e.salary:,.0f}")
```

## Multiple Inheritance and MRO

```python
def print_multiple_inheritance():
  class Flyable:
    def move(self):
      return "Flying"

  class Swimmable:
    def move(self):
      return "Swimming"

  class Duck(Flyable, Swimmable):
    pass

  d = Duck()
  # Method Resolution Order: Duck → Flyable → Swimmable → object
  print(d.move())              # Flying  (Flyable wins — leftmost first)
  print(Duck.__mro__)          # shows the full resolution chain
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
