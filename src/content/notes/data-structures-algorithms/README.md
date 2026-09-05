---
title: "Data Structures & Algorithms"
description: "A book-shaped table of contents for MAANG-interview DSA prep: Python language foundations, mathematical and algorithmic foundations, arrays/strings, linked structures, stacks/queues, trees, graphs, sorting/searching, dynamic programming, greedy algorithms, backtracking, bit manipulation, advanced data structures, advanced algorithms, interview problem patterns, and MAANG interview mastery — a book-length progression from fundamentals to Google/Meta/Amazon/Apple/Netflix/Microsoft (L4–L6) interview readiness."
tags: ["data-structures-algorithms","book","reference","maang-prep","python"]
hidden: false
zettelId: "202607150122-6"
noteType: moc
---

# Data Structures & Algorithms

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to the concepts, designs, and platform notes that already exist elsewhere in
> this wiki instead of duplicating them. Unwritten chapters are listed as **Planned** rows, not
> empty files.

## Parts

### 00 — Python Language Foundations

The language mechanics this entire book assumes fluency in before Part 01 even starts — automatic,
no-look-up recall of how lists, dicts, comprehensions, and generators actually behave, so that later
Parts can spend their attention on algorithmic reasoning instead of syntax.

- [[01-1-pattern-practice-and-loops|1 — Pattern Practice & Loops]]
- [[02-1-built-in-functions|2 — Built-in Functions]]
- [[data-structures-algorithms/00-python-language-foundations/03-strings/03-1-strings|3 — Strings]]
- [[04-1-lists|4 — Lists]]
- [[05-1-tuples|5 — Tuples]]
- [[06-1-dictionaries|6 — Dictionaries]]
- [[07-1-sets|7 — Sets]]
- [[08-1-collections-module|8 — Collections Module]]
- [[09-1-heapq-and-bisect|9 — heapq & bisect]]
- [[10-1-math-and-random|10 — Math & Random]]
- [[11-1-itertools-and-functools|11 — itertools & functools]]
- [[12-1-python-algorithm-idioms|12 — Python Algorithm Idioms]]
- [[13-1-control-flow|13 — Control Flow]]
- [[14-1-functions|14 — Functions]]
- [[15-1-classes-and-oop|15 — Classes & OOP]]
- [[16-1-error-handling|16 — Error Handling]]
- [[17-1-comprehensions|17 — Comprehensions]]
- [[18-1-generators|18 — Generators]]

### 01 — Mathematical & Algorithmic Foundations

The shared vocabulary every later Part assumes: what makes a solution an algorithm at all, how to
measure its cost, how recursion actually executes, the discrete-math toolkit interview problems lean
on, and the five design paradigms that recur across the whole book.

- [[01-what-is-an-algorithm|1 — What is an Algorithm?]]
- [[02-asymptotic-analysis|2 — Asymptotic Analysis]]
- [[03-recursion|3 — Recursion]]
- [[04-mathematical-foundations|4 — Mathematical Foundations]]
- [[05-algorithm-design-principles|5 — Algorithm Design Principles]]

### 02 — Arrays & Strings

The highest-frequency interview surface — arrays, strings, and the traversal techniques (two
pointers, sliding window, prefix sums, hashing) that turn brute-force scans into linear-time
solutions.

- [[01-arrays|1 — Arrays]]
- [[02-array-algorithms|2 — Array Algorithms]]
- [[03-two-pointers|3 — Two Pointers]]
- [[04-sliding-window|4 — Sliding Window]]
- [[05-prefix-sum-and-difference-arrays|5 — Prefix Sum & Difference Arrays]]
- [[06-hashing|6 — Hashing]]
- [[data-structures-algorithms/02-arrays-and-strings/07-strings/07-strings|7 — Strings]]
- [[08-string-algorithms|8 — String Algorithms]]

### 03 — Linked Data Structures

Pointer-based structures where the core skill is manipulating links without losing a reference —
most bugs here are dangling pointers, not algorithmic mistakes.

- [[01-singly-linked-list|1 — Singly Linked List]]
- [[02-doubly-linked-list|2 — Doubly Linked List]]
- [[03-circular-linked-list|3 — Circular Linked List]]
- [[04-skip-lists|4 — Skip Lists]]
- [[05-lru-cache-design|5 — LRU Cache Design]]

### 04 — Stack, Queue & Deque

LIFO and FIFO structures, plus the monotonic variants that turn a naive O(n²) next-greater-element
scan into O(n).

- [[01-stack|1 — Stack]]
- [[02-queue|2 — Queue]]
- [[03-circular-queue|3 — Circular Queue]]
- [[04-deque|4 — Deque]]
- [[05-monotonic-stack|5 — Monotonic Stack]]
- [[06-monotonic-queue|6 — Monotonic Queue]]
- [[07-expression-evaluation|7 — Expression Evaluation]]

### 05 — Trees

Hierarchical structures where traversal order — DFS variants vs. BFS — is the recurring decision
point, plus the self-balancing and specialized trees that keep operations at O(log n).

- [[01-tree-fundamentals|1 — Tree Fundamentals]]
- [[02-binary-trees|2 — Binary Trees]]
- [[03-binary-search-trees|3 — Binary Search Trees]]
- [[04-avl-trees|4 — AVL Trees]]
- [[05-red-black-trees|5 — Red-Black Trees]]
- [[06-segment-trees|6 — Segment Trees]]
- [[07-fenwick-trees-bit|7 — Fenwick Trees (BIT)]]
- [[08-interval-trees|8 — Interval Trees]]
- [[09-trie|9 — Trie]]
- [[10-suffix-trie|10 — Suffix Trie]]
- [[11-heap|11 — Heap]]
- [[12-priority-queue|12 — Priority Queue]]

### 06 — Graphs

Traversal generalizes directly from trees, with one addition: a graph can have cycles, so every
algorithm here tracks visited state. This Part covers representation, traversal, ordering, shortest
paths, connectivity, and flow.

- [[01-graph-representation|1 — Graph Representation]]
- [[02-graph-traversal|2 — Graph Traversal]]
- [[03-topological-sorting|3 — Topological Sorting]]
- [[04-shortest-path|4 — Shortest Path]]
- [[05-minimum-spanning-tree|5 — Minimum Spanning Tree]]
- [[06-union-find-disjoint-set|6 — Union Find (Disjoint Set)]]
- [[07-strongly-connected-components|7 — Strongly Connected Components]]
- [[08-bridges-and-articulation-points|8 — Bridges & Articulation Points]]
- [[09-eulerian-and-hamiltonian-paths|9 — Eulerian & Hamiltonian Paths]]
- [[10-network-flow|10 — Network Flow]]

### 07 — Sorting & Searching

Binary search and its 'search on the answer' generalization, plus the comparison-based and
non-comparison sorting algorithms and their tradeoffs, and the selection algorithms that beat full
sorting when only an order statistic is needed.

- [[01-binary-search|1 — Binary Search]]
- [[02-binary-search-on-answer|2 — Binary Search on Answer]]
- [[03-sorting-fundamentals|3 — Sorting Fundamentals]]
- [[04-quick-sort|4 — Quick Sort]]
- [[05-merge-sort|5 — Merge Sort]]
- [[06-heap-sort|6 — Heap Sort]]
- [[07-counting-sort|7 — Counting Sort]]
- [[08-radix-sort|8 — Radix Sort]]
- [[09-bucket-sort|9 — Bucket Sort]]
- [[10-selection-algorithms|10 — Selection Algorithms]] — _(stub)_

### 08 — Dynamic Programming

The single highest-leverage pattern in MAANG interviews — recognizing overlapping subproblems and
optimal substructure, then choosing top-down memoization or bottom-up tabulation, across the
recurring problem shapes: knapsack, LIS/LCS, interval, digit, and bitmask DP.

- [[01-dp-fundamentals|1 — DP Fundamentals]]
- [[02-memoization|2 — Memoization]]
- [[03-tabulation|3 — Tabulation]]
- [[04-knapsack-problems|4 — Knapsack Problems]]
- [[05-longest-increasing-subsequence|5 — Longest Increasing Subsequence]]
- [[06-longest-common-subsequence|6 — Longest Common Subsequence]]
- [[07-edit-distance|7 — Edit Distance]]
- [[08-matrix-chain-multiplication|8 — Matrix Chain Multiplication]]
- [[09-digit-dp|9 — Digit DP]]
- [[10-bitmask-dp|10 — Bitmask DP]]
- [[11-tree-dp|11 — Tree DP]]
- [[12-interval-dp|12 — Interval DP]]

### 09 — Greedy Algorithms

Problems where a locally optimal choice at each step provably leads to a globally optimal solution —
the hard part is proving the greedy-choice property holds before trusting it.

- [[01-greedy-strategy|1 — Greedy Strategy]]
- [[02-interval-scheduling|2 — Interval Scheduling]]
- [[03-huffman-coding|3 — Huffman Coding]]
- [[04-activity-selection|4 — Activity Selection]]
- [[05-fractional-knapsack|5 — Fractional Knapsack]]

### 10 — Backtracking & Search

Exhaustive search with pruning — building a solution incrementally and abandoning a branch the
moment it can't lead anywhere, across the canonical constraint-satisfaction and enumeration
problems.

- [[01-backtracking|1 — Backtracking]] — _(stub)_
- [[02-n-queens|2 — N Queens]] — _(stub)_
- [[03-sudoku-solver|3 — Sudoku Solver]] — _(stub)_
- [[04-permutations|4 — Permutations]] — _(stub)_
- [[05-combinations|5 — Combinations]] — _(stub)_
- [[06-branch-and-bound|6 — Branch & Bound]] — _(stub)_

### 11 — Bit Manipulation

Low-level bitwise operations and the tricks built on them — a small, high-signal toolkit that turns
a handful of interview problems from O(n) space into O(1).

- [[01-bitwise-operations|1 — Bitwise Operations]]
- [[02-bit-tricks|2 — Bit Tricks]]
- [[03-xor-problems|3 — XOR Problems]]
- [[04-bitmasking|4 — Bitmasking]]
- [[05-gray-code|5 — Gray Code]]

### 12 — Advanced Data Structures

Specialized structures that show up less often but signal depth when they’re the right tool — from
static range-query structures to the probabilistic sketches behind large-scale systems.

- [[01-sparse-table|1 — Sparse Table]] — _(stub)_
- [[02-treap|2 — Treap]] — _(stub)_
- [[03-rope|3 — Rope]] — _(stub)_
- [[04-b-tree|4 — B-Tree]] — _(stub)_
- [[05-b-plus-tree|5 — B+ Tree]] — _(stub)_
- [[06-bloom-filter|6 — Bloom Filter]] — _(stub)_
- [[07-count-min-sketch|7 — Count-Min Sketch]] — _(stub)_
- [[08-hyperloglog|8 — HyperLogLog]] — _(stub)_

### 13 — Advanced Algorithms

Techniques past the standard interview loop but common at the L6+ bar or in specialized domains —
optimized divide-and-conquer, computational geometry, advanced string matching, and algorithms over
algebraic structures.

- [[01-divide-and-conquer-optimization|1 — Divide & Conquer Optimization]] — _(stub)_
- [[02-convex-hull|2 — Convex Hull]] — _(stub)_
- [[03-sweep-line|3 — Sweep Line]] — _(stub)_
- [[04-computational-geometry|4 — Computational Geometry]] — _(stub)_
- [[05-string-matching-advanced|5 — String Matching Advanced]] — _(stub)_
- [[06-fft|6 — FFT]] — _(stub)_
- [[07-matrix-exponentiation|7 — Matrix Exponentiation]] — _(stub)_
- [[08-fast-exponentiation|8 — Fast Exponentiation]] — _(stub)_
- [[09-randomized-algorithms|9 — Randomized Algorithms]] — _(stub)_

### 14 — Interview Problem Patterns

The pattern-recognition layer that sits on top of every data structure and algorithm above —
eighteen recurring problem shapes that, once recognized, turn an unfamiliar prompt into a known
template. See [[04-1-fan-out-fan-in|Fan-Out/Fan-In]] for a production-grade, fully-worked example of
the K-way Merge pattern (Ch. 8) applied to real distributed aggregation.

- [[01-two-pointers-pattern|1 — Two Pointers Pattern]] — _(stub)_
- [[02-sliding-window-pattern|2 — Sliding Window Pattern]] — _(stub)_
- [[03-fast-and-slow-pointer|3 — Fast & Slow Pointer]] — _(stub)_
- [[04-binary-search-pattern|4 — Binary Search Pattern]] — _(stub)_
- [[05-merge-intervals|5 — Merge Intervals]] — _(stub)_
- [[06-cyclic-sort|6 — Cyclic Sort]] — _(stub)_
- [[07-top-k-elements|7 — Top K Elements]] — _(stub)_
- [[08-k-way-merge|8 — K-way Merge]] — _(stub)_
- [[09-dfs-pattern|9 — DFS Pattern]] — _(stub)_
- [[10-bfs-pattern|10 — BFS Pattern]] — _(stub)_
- [[11-tree-dfs-pattern|11 — Tree DFS Pattern]] — _(stub)_
- [[12-graph-pattern|12 — Graph Pattern]] — _(stub)_
- [[13-dynamic-programming-pattern|13 — Dynamic Programming Pattern]] — _(stub)_
- [[14-monotonic-stack-pattern|14 — Monotonic Stack Pattern]] — _(stub)_
- [[15-union-find-pattern|15 — Union Find Pattern]] — _(stub)_
- [[16-prefix-sum-pattern|16 — Prefix Sum Pattern]] — _(stub)_
- [[17-heap-pattern|17 — Heap Pattern]] — _(stub)_
- [[18-trie-pattern|18 — Trie Pattern]] — _(stub)_

### 15 — MAANG Interview Mastery

The meta-layer above data structures and patterns — how to perform under interview conditions:
communicating while you think, recognizing which of the preceding 138 chapters applies, and
converting practice into a repeatable, revisable system before interview day.

- [[01-complexity-analysis-in-interviews|1 — Complexity Analysis in Interviews]] — _(stub)_
- [[02-choosing-the-right-data-structure|2 — Choosing the Right Data Structure]] — _(stub)_
- [[03-whiteboard-communication|3 — Whiteboard Communication]] — _(stub)_
- [[04-problem-solving-framework|4 — Problem-Solving Framework]] — _(stub)_
- [[05-optimization-techniques|5 — Optimization Techniques]] — _(stub)_
- [[06-handling-follow-up-questions|6 — Handling Follow-up Questions]] — _(stub)_
- [[07-recognizing-hidden-patterns|7 — Recognizing Hidden Patterns]] — _(stub)_
- [[08-mock-interview-walkthroughs|8 — Mock Interview Walkthroughs]] — _(stub)_
- [[09-top-200-maang-problems-roadmap|9 — Top 200 MAANG Problems Roadmap]] — _(stub)_
- [[10-revision-strategy-and-cheat-sheets|10 — Revision Strategy & Cheat Sheets]] — _(stub)_

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
