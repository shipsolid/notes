---
title: "Low-Level Design for MAANG Interviews"
description: "A book-shaped table of contents for LLD interview prep: OOP fundamentals through SOLID, design principles, UML, design patterns, dependency management, reliability, concurrency, domain modeling, API design, testing, refactoring, classic interview problems, advanced architecture, and performance — cross-linking Object-Oriented Programming and Patterns instead of duplicating them."
tags: ["low-level-design", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607150122-4"
noteType: moc
---

# Low-Level Design for MAANG Interviews

> If this were a book, this page is the table of contents. For MAANG interviews, Low-Level Design
> should be learned in a progression from OOP fundamentals → SOLID → design principles → design
> patterns → UML → concurrency → case studies → interview problems. Unlike System Design, LLD is
> about writing maintainable, extensible, testable code while demonstrating strong object-oriented
> thinking — not about horizontal scale. Each Part below links out to the deeper OOP, pattern, and
> concurrency notes that already exist elsewhere in this wiki instead of duplicating them. Unwritten
> chapters are listed as **stubs**, not empty files.

## Parts

### 00 — Foundations of Object-Oriented Design

The base vocabulary this whole book assumes: what LLD actually evaluates in an interview, and a fast
OOP/object-relationship/lifecycle recap. See
[[object-oriented-programming/readme|Object-Oriented Programming]] for the full-depth treatment of
the four pillars and object relationships this Part only recaps.

- [[01-what-is-low-level-design|1 — What is Low-Level Design?]] — _(stub)_
- [[02-object-oriented-programming-refresher|2 — Object-Oriented Programming Refresher]] — _(stub)_
- [[03-relationships-between-objects|3 — Relationships Between Objects]] — _(stub)_
- [[low-level-design/00-foundations-of-object-oriented-design/04-object-lifecycle/04-object-lifecycle|4 — Object Lifecycle]]
  — _(stub)_

### 01 — Object-Oriented Design Principles

SOLID and GRASP as the two principle sets that turn working code into well-designed code, plus the
heuristics and clean-code habits interviewers expect alongside them. See
[[object-oriented-programming/04-object-design-principles/01-solid-principles/01-solid-principles|SOLID Principles]]
and
[[object-oriented-programming/04-object-design-principles/02-grasp-principles/02-grasp-principles|GRASP Principles]]
for the OOP-book treatment of the same two principle sets.

- [[low-level-design/01-object-oriented-design-principles/01-solid-principles/01-solid-principles|1 — SOLID Principles]]
  — _(stub)_
- [[low-level-design/01-object-oriented-design-principles/02-grasp-principles/02-grasp-principles|2 — GRASP Principles]]
  — _(stub)_
- [[03-oo-design-heuristics|3 — OO Design Heuristics]] — _(stub)_
- [[04-clean-code|4 — Clean Code]] — _(stub)_

### 02 — UML and Modeling

The notation used to communicate a design during a whiteboard interview — class, sequence, state,
activity, object, and package diagrams. See the UML appendix chapters in
[[01-uml-class-diagrams|Object-Oriented Programming]] for the class/sequence/state/activity diagram
reference notation.

- [[01-uml-fundamentals|1 — UML Fundamentals]] — _(stub)_
- [[02-class-diagrams|2 — Class Diagrams]] — _(stub)_
- [[03-sequence-diagrams|3 — Sequence Diagrams]] — _(stub)_
- [[04-state-diagrams|4 — State Diagrams]] — _(stub)_
- [[05-activity-diagrams|5 — Activity Diagrams]] — _(stub)_
- [[06-object-diagrams|6 — Object Diagrams]] — _(stub)_
- [[07-package-diagrams|7 — Package Diagrams]] — _(stub)_

### 03 — Design Patterns

The 23 canonical Gang-of-Four patterns grouped by intent, plus a selection guide for recognizing
which pattern a problem is asking for. Full implementations already live in
[[patterns/01-object-oriented-design-patterns/01-creational-patterns/01-creational-patterns|Patterns]]
and
[[object-oriented-programming/07-design-patterns-through-oop/01-creational-patterns/01-creational-patterns|Object-Oriented Programming]]
— these chapters are the LLD-interview framing and recognition lens.

- [[01-introduction-to-design-patterns|1 — Introduction to Design Patterns]] — _(stub)_
- [[low-level-design/03-design-patterns/02-creational-patterns/02-creational-patterns|2 — Creational Patterns]]
  — _(stub)_
- [[low-level-design/03-design-patterns/03-structural-patterns/03-structural-patterns|3 — Structural Patterns]]
  — _(stub)_
- [[low-level-design/03-design-patterns/04-behavioral-patterns/04-behavioral-patterns|4 — Behavioral Patterns]]
  — _(stub)_
- [[05-pattern-selection-guide|5 — Pattern Selection Guide]] — _(stub)_

### 04 — Dependency Management

How objects get their collaborators — constructor/setter/interface injection, IoC, and the
service-locator anti-pattern debate. See
[[patterns/03-dependency-injection-patterns/01-dependency-management/01-dependency-management|Dependency Management]]
in Patterns for the full injection-style and IoC-container catalog.

- [[01-dependency-injection|1 — Dependency Injection]] — _(stub)_
- [[02-inversion-of-control|2 — Inversion of Control]] — _(stub)_
- [[03-service-locator-vs-di|3 — Service Locator vs DI]] — _(stub)_
- [[04-object-factories|4 — Object Factories]] — _(stub)_

### 05 — Error Handling & Reliability

Designing for the failure paths, not just the happy path — exception hierarchies, validation,
defensive programming, and immutable value objects as a reliability tool.

- [[01-exception-design|1 — Exception Design]] — _(stub)_
- [[02-validation-strategies|2 — Validation Strategies]] — _(stub)_
- [[03-defensive-programming|3 — Defensive Programming]] — _(stub)_
- [[low-level-design/05-error-handling-and-reliability/04-immutability/04-immutability|4 — Immutability]]
  — _(stub)_
- [[low-level-design/05-error-handling-and-reliability/05-value-objects/05-value-objects|5 — Value Objects]]
  — _(stub)_

### 06 — Concurrency Design

Where the interesting design decision is thread safety, not class hierarchy — locks, concurrent
collections, producer-consumer, thread pools, deadlocks, race conditions, and lock-free design. See
[[02-multithreading|Multithreading]] and
[[operating-system/03-concurrency/02-deadlocks/02-deadlocks|Deadlocks]] in Operating System for the
underlying primitives, and [[01-threading-patterns|Threading Patterns]] in Patterns for the
pattern-level treatment.

- [[01-thread-safety|1 — Thread Safety]] — _(stub)_
- [[02-synchronization|2 — Synchronization]] — _(stub)_
- [[03-locks|3 — Locks]] — _(stub)_
- [[04-concurrent-collections|4 — Concurrent Collections]] — _(stub)_
- [[05-producer-consumer|5 — Producer Consumer]] — _(stub)_
- [[06-thread-pools|6 — Thread Pools]] — _(stub)_
- [[low-level-design/06-concurrency-design/07-deadlocks/07-deadlocks|7 — Deadlocks]] — _(stub)_
- [[low-level-design/06-concurrency-design/08-race-conditions/08-race-conditions|8 — Race Conditions]]
  — _(stub)_
- [[09-lock-free-design|9 — Lock-Free Design]] — _(stub)_

### 07 — Domain Modeling

Identifying the entities, value objects, aggregates, and domain services a system is actually made
of before writing any code. See [[01-domain-driven-design-basics|Domain-Driven Design Basics]] in
Object-Oriented Programming and [[02-domain-modeling-patterns|Domain Modeling Patterns]] in Patterns
for the full DDD tactical toolkit.

- [[01-identifying-entities|1 — Identifying Entities]] — _(stub)_
- [[low-level-design/07-domain-modeling/02-value-objects/02-value-objects|2 — Value Objects]] —
  _(stub)_
- [[03-aggregates|3 — Aggregates]] — _(stub)_
- [[04-domain-services|4 — Domain Services]] — _(stub)_
- [[05-repositories|5 — Repositories]] — _(stub)_
- [[06-domain-events|6 — Domain Events]] — _(stub)_

### 08 — API-Oriented Design

Designing the interface layer of a system — request/response shape, mapping, pagination, and error
responses — as its own design discipline, independent of the domain model underneath it.

- [[01-interface-design|1 — Interface Design]] — _(stub)_
- [[02-dtos|2 — DTOs]] — _(stub)_
- [[03-validation-layers|3 — Validation Layers]] — _(stub)_
- [[04-mapping-objects|4 — Mapping Objects]] — _(stub)_
- [[05-pagination|5 — Pagination]] — _(stub)_
- [[06-error-responses|6 — Error Responses]] — _(stub)_

### 09 — Testing Design

Designing for testability, not testing as an afterthought — unit testing, mocking, DI for tests, and
contract testing between collaborators.

- [[01-unit-testing|1 — Unit Testing]] — _(stub)_
- [[02-testable-design|2 — Testable Design]] — _(stub)_
- [[03-mocking|3 — Mocking]] — _(stub)_
- [[04-dependency-injection-for-testing|4 — Dependency Injection for Testing]] — _(stub)_
- [[05-contract-testing|5 — Contract Testing]] — _(stub)_

### 10 — Refactoring

The concrete techniques for improving a design without changing its behavior — spotting code smells
and applying named refactorings like Replace Conditional with Polymorphism.

- [[01-refactoring-techniques|1 — Refactoring Techniques]] — _(stub)_
- [[02-identifying-code-smells|2 — Identifying Code Smells]] — _(stub)_
- [[03-replace-conditional-with-polymorphism|3 — Replace Conditional with Polymorphism]] — _(stub)_
- [[04-extract-object|4 — Extract Object]] — _(stub)_
- [[05-introduce-parameter-object|5 — Introduce Parameter Object]] — _(stub)_
- [[06-builder-refactoring|6 — Builder Refactoring]] — _(stub)_

### 11 — Classic LLD Interview Problems

The worked case studies every LLD prep list is built around — small enough to finish in a 45-minute
round, rich enough to exercise real class relationships, state machines, and concurrency. See
[[02-coding-problems|Coding Problems]] and
[[03-object-oriented-design-interviews|Object-Oriented Design Interviews]] for the OOP-book framing
of the same interview process, and [[05-distributed-rate-limiter|Distributed Rate Limiter]] in
System Design for the cross-service scale variant of the rate-limiter problem covered here at
single-process scope.

- [[01-parking-lot|1 — Parking Lot]] — _(stub)_
- [[02-elevator-system|2 — Elevator System]] — _(stub)_
- [[03-library-management-system|3 — Library Management System]] — _(stub)_
- [[04-hotel-booking-system|4 — Hotel Booking System]] — _(stub)_
- [[05-movie-ticket-booking|5 — Movie Ticket Booking]] — _(stub)_
- [[06-splitwise|6 — Splitwise]] — _(stub)_
- [[07-snake-and-ladder|7 — Snake and Ladder]] — _(stub)_
- [[08-chess|8 — Chess]] — _(stub)_
- [[09-tic-tac-toe|9 — Tic Tac Toe]] — _(stub)_
- [[10-atm|10 — ATM]] — _(stub)_
- [[11-vending-machine|11 — Vending Machine]] — _(stub)_
- [[12-coffee-machine|12 — Coffee Machine]] — _(stub)_
- [[13-cricbuzz|13 — Cricbuzz]] — _(stub)_
- [[14-amazon-locker|14 — Amazon Locker]] — _(stub)_
- [[15-cab-booking|15 — Cab Booking]] — _(stub)_
- [[16-food-delivery|16 — Food Delivery]] — _(stub)_
- [[17-notification-service|17 — Notification Service]] — _(stub)_
- [[18-cache-lru-lfu|18 — Cache (LRU/LFU)]] — _(stub)_
- [[19-rate-limiter|19 — Rate Limiter]] — _(stub)_
- [[20-logging-framework|20 — Logging Framework]] — _(stub)_
- [[21-file-system|21 — File System]] — _(stub)_
- [[22-linux-find|22 — Linux find]] — _(stub)_
- [[23-kafka-like-queue|23 — Kafka-like Queue]] — _(stub)_
- [[24-pub-sub-system|24 — Pub/Sub System]] — _(stub)_

### 12 — Advanced Object-Oriented Design

Architectural styles built on top of solid object modeling — Hexagonal and Clean Architecture, DDD
at the essentials level, event-driven design, CQRS, event sourcing, and plug-in/extensible
frameworks. See [[01-layering-patterns|Layering Patterns]] for the Hexagonal/Clean/Onion catalog,
and [[12-cqrs|CQRS]] / [[13-event-sourcing|Event Sourcing]] in Patterns for the full treatment of
both.

- [[01-hexagonal-architecture|1 — Hexagonal Architecture]] — _(stub)_
- [[02-clean-architecture|2 — Clean Architecture]] — _(stub)_
- [[03-domain-driven-design-essentials|3 — Domain-Driven Design Essentials]] — _(stub)_
- [[04-event-driven-design|4 — Event-Driven Design]] — _(stub)_
- [[05-cqrs-basics|5 — CQRS Basics]] — _(stub)_
- [[06-event-sourcing-basics|6 — Event Sourcing Basics]] — _(stub)_
- [[07-plug-in-architectures|7 — Plug-in Architectures]] — _(stub)_
- [[08-extensible-framework-design|8 — Extensible Framework Design]] — _(stub)_

### 13 — Performance-Oriented Design

Object-level performance work — memory optimization, pooling, lazy initialization, caching
strategies, efficient collection choices, and profiling an OO application under load.

- [[01-memory-optimization|1 — Memory Optimization]] — _(stub)_
- [[02-object-pooling|2 — Object Pooling]] — _(stub)_
- [[03-lazy-initialization|3 — Lazy Initialization]] — _(stub)_
- [[04-caching-strategies|4 — Caching Strategies]] — _(stub)_
- [[05-efficient-collections|5 — Efficient Collections]] — _(stub)_
- [[06-profiling-object-oriented-applications|6 — Profiling Object-Oriented Applications]] —
  _(stub)_

### 14 — MAANG Interview Masterclass

Where everything above gets applied under interview conditions — the repeatable framework,
communication tactics, whiteboard technique, common mistakes, time management, and full
mock-walkthrough transcripts. See
[[03-object-oriented-design-interviews|Object-Oriented Design Interviews]] for the parallel process
framing from the OOP side.

- [[01-lld-interview-framework|1 — LLD Interview Framework]] — _(stub)_
- [[02-communicating-during-lld-interviews|2 — Communicating During LLD Interviews]] — _(stub)_
- [[03-whiteboard-design-techniques|3 — Whiteboard Design Techniques]] — _(stub)_
- [[04-common-interview-mistakes|4 — Common Interview Mistakes]] — _(stub)_
- [[05-time-management-in-45-60-minute-interviews|5 — Time Management in 45–60 Minute Interviews]] —
  _(stub)_
- [[06-complete-mock-interview-walkthroughs|6 — Complete Mock Interview Walkthroughs]] — _(stub)_

### 15 — Appendices

Quick-reference material — cheat sheets, decision matrices, an interview checklist, and per-language
implementation guidelines for turning any chapter above into working code.

- [[01-uml-cheat-sheet|1 — Appendix A: UML Cheat Sheet]] — _(stub)_
- [[02-solid-and-grasp-cheat-sheet|2 — Appendix B: SOLID & GRASP Cheat Sheet]] — _(stub)_
- [[03-design-pattern-decision-matrix|3 — Appendix C: Design Pattern Decision Matrix]] — _(stub)_
- [[04-lld-interview-checklist|4 — Appendix D: LLD Interview Checklist]] — _(stub)_
- [[05-java-implementation-guidelines|5 — Appendix E: Java Implementation Guidelines]] — _(stub)_
- [[06-csharp-implementation-guidelines|6 — Appendix F: C# Implementation Guidelines]] — _(stub)_
- [[07-cpp-implementation-guidelines|7 — Appendix G: C++ Implementation Guidelines]] — _(stub)_
- [[08-go-implementation-guidelines|8 — Appendix H: Go Implementation Guidelines]] — _(stub)_
- [[09-python-implementation-guidelines|9 — Appendix I: Python Implementation Guidelines]] —
  _(stub)_

## Recommended Study Order

1. OOP Foundations
2. SOLID + GRASP
3. UML Modeling
4. Clean Code & Refactoring
5. Design Patterns
6. Dependency Injection & Testability
7. Concurrency
8. Domain Modeling
9. Advanced Architectural Styles
10. Solve 20–30 classic LLD interview problems
11. Conduct timed mock interviews

This sequence aligns with interview expectations at companies such as Google, Meta, Amazon,
Microsoft, Uber, and Stripe, where interviewers assess not only correctness but also extensibility,
maintainability, abstraction quality, and the ability to reason about design trade-offs.

## Metadata

|        |                  |
| ------ | ---------------- |
| Author | Amit Singh       |
| Scope  | low-level-design |
