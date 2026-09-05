---
title: "Object-Oriented Programming for MAANG Interviews"
description: "A book-shaped table of contents for OOP: paradigm foundations, the four pillars, object relationships, SOLID/GRASP design principles, memory and runtime internals, GoF design patterns, language-specific OOP, and OOP at system scale — cross-linking existing pattern, concurrency, and low-level-design notes instead of duplicating them."
tags: ["object-oriented-programming", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607150122-3"
noteType: moc
---

# Object-Oriented Programming for MAANG Interviews

> For MAANG interviews, OOP should be taught from first principles to language implementation and
> design trade-offs, not merely by explaining the four pillars. Interviewers assess whether you
> understand _why_ OOP exists, _when_ to use it, and its limitations alongside modern paradigms.
> This book is arranged in chronological learning order — fundamentals first, then advanced design
> and interview-level discussion.

## Parts

### 00 — Foundations of Object-Oriented Thinking

Where OOP sits among programming paradigms, why it exists at all, and the base vocabulary (objects,
classes, state, identity) everything else in this book builds on.

- [[01-evolution-of-programming-paradigms|1 — Evolution of Programming Paradigms]] — _(stub)_
- [[02-why-oop-exists|2 — Why OOP Exists]] — _(stub)_
- [[03-objects-and-classes|3 — Objects and Classes]] — _(stub)_

### 01 — Core Building Blocks

The mechanical pieces a class is made of — fields, methods, constructors, visibility, and the
lifecycle an object goes through from creation to collection.

- [[01-fields-and-methods|1 — Fields and Methods]] — _(stub)_
- [[02-access-modifiers|2 — Access Modifiers]] — _(stub)_
- [[object-oriented-programming/01-core-building-blocks/03-object-lifecycle/03-object-lifecycle|3 — Object Lifecycle]]
  — _(stub)_

### 02 — Four Pillars of OOP

Encapsulation, abstraction, inheritance, and polymorphism — the four ideas every OOP explainer leads
with, covered here at interview depth rather than as a definitions list.

- [[01-encapsulation|1 — Encapsulation]] — _(stub)_
- [[object-oriented-programming/02-four-pillars-of-oop/02-abstraction/02-abstraction|2 — Abstraction]]
  — _(stub)_
- [[03-inheritance|3 — Inheritance]] — _(stub)_
- [[04-polymorphism|4 — Polymorphism]] — _(stub)_

### 03 — Relationships Between Objects

How objects reference and own each other — association, aggregation, composition, and dependency —
and why picking the wrong one is a common design-interview trap.

- [[01-association|1 — Association]] — _(stub)_
- [[object-oriented-programming/03-relationships-between-objects/02-aggregation/02-aggregation|2 — Aggregation]]
  — _(stub)_
- [[03-composition|3 — Composition]] — _(stub)_
- [[04-dependency|4 — Dependency]] — _(stub)_

### 04 — Object Design Principles

SOLID and GRASP as the two principle sets that turn "it compiles" into "it's well designed," plus
the metrics used to measure whether a design actually got better.

- [[object-oriented-programming/04-object-design-principles/01-solid-principles/01-solid-principles|1 — SOLID Principles]]
  — _(stub)_ — see also [[03-solid-revisited|SOLID Revisited]] in the Patterns book for the
  architecture-scale view.
- [[object-oriented-programming/04-object-design-principles/02-grasp-principles/02-grasp-principles|2 — GRASP Principles]]
  — _(stub)_
- [[03-object-oriented-metrics|3 — Object-Oriented Metrics]] — _(stub)_

### 05 — Advanced Object-Oriented Concepts

The concepts that separate "used OOP" from "understands OOP" in a senior interview — equality vs.
identity, immutability, cloning semantics, and serialization pitfalls.

- [[01-interfaces-vs-abstract-classes|1 — Interfaces vs Abstract Classes]] — _(stub)_
- [[02-object-equality|2 — Object Equality]] — _(stub)_
- [[object-oriented-programming/05-advanced-object-oriented-concepts/03-immutability/03-immutability|3 — Immutability]]
  — _(stub)_
- [[04-object-cloning|4 — Object Cloning]] — _(stub)_
- [[05-object-serialization|5 — Object Serialization]] — _(stub)_

### 06 — Memory and Runtime

What actually happens under the hood — stack vs. heap layout, how virtual dispatch is implemented,
and how garbage collectors reclaim unreachable objects.

- [[01-memory-layout|1 — Memory Layout]] — _(stub)_
- [[02-dynamic-dispatch|2 — Dynamic Dispatch]] — _(stub)_
- [[03-garbage-collection|3 — Garbage Collection]] — _(stub)_

### 07 — Design Patterns Through OOP

The 23 canonical Gang-of-Four patterns, grouped by intent. Full implementations and trade-offs
already live in the Patterns book — these chapters are the OOP-first framing and interview lens.

- [[object-oriented-programming/07-design-patterns-through-oop/01-creational-patterns/01-creational-patterns|1 — Creational Patterns]]
  — _(stub)_ — see also
  [[patterns/01-object-oriented-design-patterns/01-creational-patterns/01-creational-patterns|Creational Patterns]].
- [[object-oriented-programming/07-design-patterns-through-oop/02-structural-patterns/02-structural-patterns|2 — Structural Patterns]]
  — _(stub)_ — see also
  [[patterns/01-object-oriented-design-patterns/02-structural-patterns/02-structural-patterns|Structural Patterns]].
- [[object-oriented-programming/07-design-patterns-through-oop/03-behavioral-patterns/03-behavioral-patterns|3 — Behavioral Patterns]]
  — _(stub)_ — see also
  [[patterns/01-object-oriented-design-patterns/03-behavioral-patterns/03-behavioral-patterns|Behavioral Patterns]].

### 08 — Language-Specific OOP

How the same OOP ideas actually get implemented — and where they diverge — across Java, C#, C++,
Python, and JavaScript/TypeScript.

- [[01-java-oop|1 — Java OOP]] — _(stub)_
- [[02-csharp-oop|2 — C# OOP]] — _(stub)_
- [[03-cpp-oop|3 — C++ OOP]] — _(stub)_
- [[04-python-oop|4 — Python OOP]] — _(stub)_
- [[05-javascript-and-typescript-oop|5 — JavaScript & TypeScript OOP]] — _(stub)_

### 09 — OOP in Large Systems

What happens to object modeling once it has to survive process boundaries, concurrent access, and
years of accumulated shortcuts — DDD, distributed systems, concurrency, and anti-patterns.

- [[01-domain-driven-design-basics|1 — Domain-Driven Design Basics]] — _(stub)_ — see also
  [[03-service-decomposition|Service Decomposition]].
- [[02-oop-in-distributed-systems|2 — OOP in Distributed Systems]] — _(stub)_ — see also
  [[03-service-decomposition|Service Decomposition]] and
  [[system-design/12-architecture-patterns/02-microservices/02-microservices|Microservices]].
- [[03-oop-and-concurrency|3 — OOP and Concurrency]] — _(stub)_ — see also
  [[operating-system/readme|Operating System]]'s Concurrency Part and [[patterns/readme|Patterns]]'s
  Concurrency Patterns Part.
- [[04-oop-anti-patterns|4 — OOP Anti-Patterns]] — _(stub)_

### 10 — Interview Mastery

Where everything above gets applied under interview conditions — conceptual FAQs, classic coding
problems, and the OOD interview process itself.

- [[object-oriented-programming/10-interview-mastery/01-frequently-asked-interview-questions/01-frequently-asked-interview-questions|1 — Frequently Asked Interview Questions]]
  — _(stub)_
- [[02-coding-problems|2 — Coding Problems]] — _(stub)_ — see also the worked case studies in
  [[low-level-design/readme#11 — Classic LLD Interview Problems|Low-Level Design]]:
  [[01-parking-lot|Parking Lot]], [[02-elevator-system|Elevator System]],
  [[03-library-management-system|Library Management System]],
  [[11-vending-machine|Vending Machine]], [[08-chess|Chess]], [[10-atm|ATM]],
  [[09-tic-tac-toe|Tic Tac Toe]], and [[17-notification-service|Notification Service]].
- [[03-object-oriented-design-interviews|3 — Object-Oriented Design Interviews]] — _(stub)_

### 11 — Appendix

Quick-reference material — UML notation, cheat sheets, a pattern-selection matrix, a
language-feature comparison table, and a large interview-question bank.

- [[01-uml-class-diagrams|1 — UML Class Diagrams]] — _(stub)_
- [[02-uml-sequence-diagrams|2 — UML Sequence Diagrams]] — _(stub)_
- [[03-uml-state-diagrams|3 — UML State Diagrams]] — _(stub)_
- [[04-uml-activity-diagrams|4 — UML Activity Diagrams]] — _(stub)_
- [[05-common-oop-interview-pitfalls|5 — Common OOP Interview Pitfalls]] — _(stub)_
- [[06-oop-cheat-sheet|6 — OOP Cheat Sheet]] — _(stub)_
- [[07-solid-cheat-sheet|7 — SOLID Cheat Sheet]] — _(stub)_
- [[08-design-pattern-selection-matrix|8 — Design Pattern Selection Matrix]] — _(stub)_
- [[09-language-feature-comparison|9 — Language Feature Comparison]] — _(stub)_
- [[10-maang-oop-interview-questions|10 — 200+ MAANG OOP Interview Questions]] — _(stub)_

## Where This Fits

Study this book alongside the broader interview curriculum, not in isolation:

- **Before OOP:** Programming fundamentals, Data Structures, Algorithms.
- **After OOP:** Design Patterns, System Design, Distributed Systems, Clean Code, Refactoring,
  Domain-Driven Design, and Engineering Patterns.

This sequence mirrors how OOP concepts get applied in real software engineering, and how they are
commonly evaluated in senior MAANG interviews.

## Metadata

|        |                             |
| ------ | --------------------------- |
| Author | Amit Singh                  |
| Scope  | object-oriented-programming |
