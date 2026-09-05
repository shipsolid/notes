---
title: "Database Management Systems"
description: "A book-shaped table of contents for DBMS: relational foundations through SQL mastery, storage internals, transactions, distributed databases, NoSQL, and MAANG interview prep — cross-linking existing system-design/patterns notes instead of duplicating them."
tags: ["dbms", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607150122-5"
noteType: moc
---

# Database Management Systems

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to the concepts, designs, and platform notes that already exist elsewhere in
> this wiki instead of duplicating them. Unwritten chapters are listed as **Planned** rows, not
> empty files.

## Parts

### 00 — Database Foundations

Why DBMSs replaced file-based storage, the three-schema architecture that gives them data
independence, and the major data models (hierarchical, network, relational, object-oriented, NoSQL).

- [[01-why-databases-exist|1 — Why Databases Exist]] — _(stub)_
- [[02-database-architecture|2 — Database Architecture]] — _(stub)_
- [[03-database-models|3 — Database Models]] — _(stub)_

### 01 — Relational Model

The formal vocabulary of the relational model — relations, keys, constraints — and the two
equivalent query formalisms (relational algebra and relational calculus) that SQL is built on top
of.

- [[01-relational-model-fundamentals|1 — Relational Model Fundamentals]] — _(stub)_
- [[02-constraints|2 — Constraints]] — _(stub)_
- [[03-relational-algebra|3 — Relational Algebra]] — _(stub)_
- [[04-relational-calculus|4 — Relational Calculus]] — _(stub)_

### 02 — SQL Mastery

Practical SQL from basic DDL/DML through joins, aggregation, subqueries, CTEs, window functions, and
the advanced object types (views, triggers, sequences) that show up in both production code and SQL
coding interviews.

- [[01-sql-basics|1 — SQL Basics]] — _(stub)_
- [[02-querying-data|2 — Querying Data]] — _(stub)_
- [[03-joins|3 — Joins]] — _(stub)_
- [[dbms/02-sql-mastery/04-aggregation/04-aggregation|4 — Aggregation]] — _(stub)_
- [[05-subqueries|5 — Subqueries]] — _(stub)_
- [[06-common-table-expressions|6 — Common Table Expressions]] — _(stub)_
- [[07-window-functions|7 — Window Functions]] — _(stub)_
- [[dbms/02-sql-mastery/08-advanced-sql/08-advanced-sql|8 — Advanced SQL]] — _(stub)_

### 03 — Database Design

Modeling a domain as an ER diagram, mapping it into relational tables, and using functional
dependencies to drive normalization — plus when denormalization is the right tradeoff instead.

- [[01-er-modeling|1 — ER Modeling]] — _(stub)_
- [[02-mapping-er-to-relational-model|2 — Mapping ER to Relational Model]] — _(stub)_
- [[03-functional-dependencies|3 — Functional Dependencies]] — _(stub)_
- [[04-normalization|4 — Normalization]] — _(stub)_
- [[05-denormalization|5 — Denormalization]] — _(stub)_

### 04 — Storage Internals

How a DBMS physically lays out data on disk — pages, heap files, clustered storage — and the two
index families (B-tree and hash) built on top of that layout.

- [[01-physical-storage|1 — Physical Storage]] — _(stub)_
- [[dbms/04-storage-internals/02-indexing/02-indexing|2 — Indexing]] — _(stub)_
- [[03-b-trees|3 — B-Trees]] — _(stub)_
- [[04-hash-indexes|4 — Hash Indexes]] — _(stub)_

### 05 — Query Processing

How a query moves from parsed text to an execution plan, the optimizer decisions (cost-based vs
rule-based, pushdown) behind that plan, and the join algorithms the executor picks from.

- [[01-query-execution|1 — Query Execution]] — _(stub)_
- [[dbms/05-query-processing/02-query-optimization/02-query-optimization|2 — Query Optimization]] —
  _(stub)_
- [[03-join-algorithms|3 — Join Algorithms]] — _(stub)_

### 06 — Transactions

The transaction lifecycle and ACID guarantees, the concurrency anomalies that arise without control,
and the three families of concurrency control (locking, timestamp ordering, optimistic) that
isolation levels are built from.

- [[01-transaction-fundamentals|1 — Transaction Fundamentals]] — _(stub)_
- [[02-acid-properties|2 — ACID Properties]] — _(stub)_
- [[03-concurrency-problems|3 — Concurrency Problems]] — _(stub)_
- [[04-concurrency-control|4 — Concurrency Control]] — _(stub)_
- [[05-two-phase-locking|5 — Two-Phase Locking]] — _(stub)_
- [[06-timestamp-protocols|6 — Timestamp Protocols]] — _(stub)_
- [[07-optimistic-concurrency-control|7 — Optimistic Concurrency Control]] — _(stub)_
- [[08-isolation-levels|8 — Isolation Levels]] — _(stub)_

### 07 — Recovery

Write-ahead logging as the foundation of crash recovery, and the checkpointing/ARIES machinery a
DBMS uses to recover to a consistent state after a crash.

- [[dbms/07-recovery/01-logging/01-logging|1 — Logging]] — _(stub)_
- [[02-recovery-algorithms|2 — Recovery Algorithms]] — _(stub)_

### 08 — Distributed Databases

Fragmentation and replication across nodes, the two-phase commit protocol for distributed
transactions, and the consensus protocols (Paxos, Raft) that keep replicas agreeing. See also
[[system-design/02-distributed-systems-theory/04-consensus-algorithms/04-consensus-algorithms|Consensus Algorithms]]
and [[01-consensus-patterns|Consensus Patterns]] for the general distributed-systems treatment this
Part specializes to databases.

- [[dbms/08-distributed-databases/01-distributed-databases/01-distributed-databases|1 — Distributed Databases]]
  — _(stub)_
- [[02-two-phase-commit|2 — Two-Phase Commit]] — _(stub)_
- [[03-consensus-basics|3 — Consensus Basics]] — _(stub)_

### 09 — NoSQL Databases

The four major NoSQL categories — key-value, document, column-family, graph — and why each trades
away parts of the relational model for a different scalability profile. See also
[[system-design/03-storage-systems/03-storage-engines/03-storage-engines|Storage Engines]] for how
Cassandra/Bigtable-style engines are built internally.

- [[01-nosql-overview|1 — NoSQL Overview]] — _(stub)_
- [[02-key-value-stores|2 — Key-Value Stores]] — _(stub)_
- [[03-document-databases|3 — Document Databases]] — _(stub)_
- [[04-column-family-databases|4 — Column Family Databases]] — _(stub)_
- [[05-graph-databases|5 — Graph Databases]] — _(stub)_

### 10 — Scalability

Replication topologies, partitioning strategies, and the patterns (saga, outbox, eventual
consistency) that replace distributed ACID transactions at scale, framed through CAP and PACELC. See
also [[07-partitioning-and-sharding|Partitioning and Sharding]],
[[03-cap-theorem-and-pacelc|CAP Theorem and PACELC]], [[15-saga|Saga]], and [[14-outbox|Outbox]].

- [[dbms/10-scalability/01-replication/01-replication|1 — Replication]] — _(stub)_
- [[02-partitioning|2 — Partitioning]] — _(stub)_
- [[dbms/10-scalability/03-distributed-transactions/03-distributed-transactions|3 — Distributed Transactions]]
  — _(stub)_
- [[dbms/10-scalability/04-cap-theorem/04-cap-theorem|4 — CAP Theorem]] — _(stub)_
- [[05-pacelc|5 — PACELC]] — _(stub)_

### 11 — Database Performance

Reading EXPLAIN plans and diagnosing slow queries, the tuning knobs (connection pools, buffer pool,
caching, vacuum/analyze), and the bottlenecks — lock contention, hot partitions, index bloat,
deadlocks — that show up in production.

- [[01-query-performance|1 — Query Performance]] — _(stub)_
- [[02-database-tuning|2 — Database Tuning]] — _(stub)_
- [[03-common-bottlenecks|3 — Common Bottlenecks]] — _(stub)_

### 12 — Database Security

Authentication/authorization via roles and RBAC, encryption at rest/in transit/TDE, and SQL
injection prevention through prepared statements and safe ORM usage.

- [[01-authentication-and-authorization|1 — Authentication & Authorization]] — _(stub)_
- [[02-encryption|2 — Encryption]] — _(stub)_
- [[03-sql-injection|3 — SQL Injection]] — _(stub)_

### 13 — DBMS in System Design

How database choice, data modeling, and scaling decisions actually show up inside a system design
interview, worked through classic case studies. See also
[[system-design/readme|system-design/README.md]] for the broader system design book this Part
specializes to the data layer, and [[02-distributed-cache|Distributed Cache]] for the caching half
of the scaling toolkit.

- [[01-choosing-the-right-database|1 — Choosing the Right Database]] — _(stub)_
- [[02-designing-data-models|2 — Designing Data Models]] — _(stub)_
- [[03-scaling-databases|3 — Scaling Databases]] — _(stub)_
- [[04-interview-case-studies|4 — Interview Case Studies]] — _(stub)_

### 14 — MAANG Interview Preparation

The recurring theory comparison questions, a SQL coding practice set, internals deep dives across
the major engines, and full mock-interview problem sets.

- [[dbms/14-maang-interview-preparation/01-frequently-asked-interview-questions/01-frequently-asked-interview-questions|1 — Frequently Asked Interview Questions]]
  — _(stub)_
- [[02-sql-coding-interview|2 — SQL Coding Interview]] — _(stub)_
- [[03-internal-architecture-deep-dive|3 — Internal Architecture Deep Dive]] — _(stub)_
- [[04-mock-interview-problems|4 — Mock Interview Problems]] — _(stub)_

### 15 — Appendix

Quick-reference cheat sheets, decision matrices, and a glossary — the material you skim the night
before an interview rather than read start to finish.

- [[dbms/15-appendix/01-sql-cheat-sheet/01-sql-cheat-sheet|1 — SQL Cheat Sheet]] — _(stub)_
- [[02-relational-algebra-cheat-sheet|2 — Relational Algebra Cheat Sheet]] — _(stub)_
- [[03-normalization-cheat-sheet|3 — Normalization Cheat Sheet]] — _(stub)_
- [[04-isolation-levels-matrix|4 — Isolation Levels Matrix]] — _(stub)_
- [[05-lock-compatibility-matrix|5 — Lock Compatibility Matrix]] — _(stub)_
- [[06-join-algorithms-comparison|6 — Join Algorithms Comparison]] — _(stub)_
- [[07-index-selection-guide|7 — Index Selection Guide]] — _(stub)_
- [[08-database-selection-decision-matrix|8 — Database Selection Decision Matrix]] — _(stub)_
- [[09-postgresql-explain-cheat-sheet|9 — PostgreSQL EXPLAIN Cheat Sheet]] — _(stub)_
- [[10-mysql-explain-cheat-sheet|10 — MySQL EXPLAIN Cheat Sheet]] — _(stub)_
- [[11-top-200-maang-dbms-interview-questions|11 — Top 200 MAANG DBMS Interview Questions]] —
  _(stub)_
- [[12-dbms-glossary|12 — DBMS Glossary]] — _(stub)_
- [[13-further-reading|13 — Further Reading]] — _(stub)_

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | dbms       |
