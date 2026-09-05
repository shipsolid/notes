---
title: "Operating Systems for MAANG Interviews"
description: "A book-shaped table of contents for operating systems at MAANG interview depth: foundations through processes, threads, concurrency, CPU scheduling, memory management, file systems, I/O, security & isolation, Linux internals, cloud/Kubernetes/observability, advanced kernel topics, and interview preparation — cross-linking existing sre/linux-networking, kubernetes-security, and patterns/concurrency notes instead of duplicating them."
tags: ["operating-system", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607150122-2"
noteType: moc
---

# Operating Systems for MAANG Interviews

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to the concepts, designs, and platform notes that already exist elsewhere in
> this wiki instead of duplicating them. Unwritten chapters are listed as **Planned** rows, not
> empty files.

The progression follows how operating systems evolved historically and how interviewers typically
expect candidates to reason about OS internals — first principles through advanced concurrency and
kernel concepts, with extra depth in Linux internals, containerization, and observability for SRE /
Platform / Infrastructure Engineer interviews specifically.

## Parts

### 00 — Foundations

The mental model of what an operating system actually is: why it exists, how the boot process gets a
kernel running, and the vocabulary (kernel space, system calls, ABI/API) that every later Part
builds on.

- [[01-what-is-an-operating-system|1 — What is an Operating System?]] — _(stub)_
- [[02-computer-architecture-essentials|2 — Computer Architecture Essentials]] — _(stub)_
- [[03-os-interfaces|3 — OS Interfaces]] — _(stub)_

### 01 — Processes

The process abstraction — how one is born, how it becomes another program, how the kernel switches
between processes, and how independent processes talk to each other.

- [[01-process-fundamentals|1 — Process Fundamentals]] — _(stub)_
- [[02-process-creation|2 — Process Creation]] — _(stub)_
- [[operating-system/01-processes/03-context-switching/03-context-switching|3 — Context Switching]]
  — _(stub)_
- [[04-interprocess-communication|4 — Interprocess Communication]] — _(stub)_

### 02 — Threads

Threads as the unit of execution inside a process — lifecycle, creation models, and the primitives
used to coordinate multiple threads safely.

- [[01-threads|1 — Threads]] — _(stub)_
- [[02-multithreading|2 — Multithreading]] — _(stub)_
- [[03-synchronization-primitives|3 — Synchronization Primitives]] — _(stub)_

### 03 — Concurrency

What goes wrong when synchronization primitives are used incorrectly — races, deadlocks, the
classical problems interviewers reuse to test reasoning, and the memory-ordering rules underneath.
See
[[patterns/13-concurrency-patterns/02-lock-free-programming/02-lock-free-programming|Lock-Free Programming]]
and [[01-threading-patterns|Threading Patterns]] for the application-level design patterns built on
top of these primitives.

- [[operating-system/03-concurrency/01-race-conditions/01-race-conditions|1 — Race Conditions]] —
  _(stub)_
- [[operating-system/03-concurrency/02-deadlocks/02-deadlocks|2 — Deadlocks]] — _(stub)_
- [[03-classical-synchronization-problems|3 — Classical Synchronization Problems]] — _(stub)_
- [[04-memory-ordering|4 — Memory Ordering]] — _(stub)_

### 04 — CPU Scheduling

How the kernel decides what runs next — from textbook algorithms to Linux's actual CFS
implementation. See [[02-processes-threads-and-scheduling|Processes, Threads, and Scheduling]] for
the Linux CFS scheduler from an SRE/production-debugging angle — not to be confused with the
_Kubernetes pod scheduler_ covered under [[01-scheduler-internals|Scheduler Internals]], which
places pods onto nodes rather than threads onto CPUs.

- [[01-scheduling-fundamentals|1 — Scheduling Fundamentals]] — _(stub)_
- [[02-scheduling-algorithms|2 — Scheduling Algorithms]] — _(stub)_
- [[03-modern-scheduler-design|3 — Modern Scheduler Design]] — _(stub)_

### 05 — Memory Management

Address spaces, paging, virtual memory, and the allocators that back `malloc()` — the layer that
turns physical RAM into the illusion every process gets its own. See
[[03-memory-management|Memory Management]] for why "out of memory" in Kubernetes is rarely about the
number `top` reports.

- [[01-memory-fundamentals|1 — Memory Fundamentals]] — _(stub)_
- [[02-paging|2 — Paging]] — _(stub)_
- [[03-virtual-memory|3 — Virtual Memory]] — _(stub)_
- [[04-page-replacement|4 — Page Replacement]] — _(stub)_
- [[05-memory-allocation|5 — Memory Allocation]] — _(stub)_

### 06 — File Systems

How files, directories, and metadata are actually laid out on disk, and how modern filesystems add
journaling and copy-on-write for crash safety. See
[[04-filesystems-and-storage|Filesystems and Storage]] for how the page cache and I/O scheduler
interact with this layer in production, and [[04-disk-performance|Disk Performance]] for the
IOPS/throughput framing.

- [[01-file-system-basics|1 — File System Basics]] — _(stub)_
- [[02-file-system-internals|2 — File System Internals]] — _(stub)_
- [[03-storage-management|3 — Storage Management]] — _(stub)_

### 07 — Input / Output

Blocking vs. non-blocking I/O and the event-driven multiplexing APIs (`epoll`, `io_uring`) that let
a single thread serve thousands of connections — the mechanism underneath every high-performance web
server and proxy.

- [[01-io-architecture|1 — I/O Architecture]] — _(stub)_
- [[02-event-driven-systems|2 — Event Driven Systems]] — _(stub)_

### 08 — Security

The kernel-enforced boundaries that keep one user or process from touching another's data —
permissions, capabilities, and mandatory access control. See [[05-selinux|SELinux]],
[[04-apparmor|AppArmor]], [[06-capabilities|Capabilities]], and [[03-seccomp|Seccomp]] for these
same primitives explained through the Kubernetes `securityContext` lens;
[[02-linux-fundamentals|Linux Fundamentals]] and
[[07-linux-kernel-isolation|Linux Kernel Isolation]] for namespaces/cgroups as the container
isolation mechanism.

- [[01-operating-system-security|1 — Operating System Security]] — _(stub)_
- [[02-isolation|2 — Isolation]] — _(stub)_

### 09 — Linux Internals

The Linux-specific implementation details and diagnostic toolkit interviewers expect for
SRE/Platform/Infrastructure roles. See
[[01-linux-internals-every-sre-must-know|Linux Internals Every SRE Must Know]] and
[[15-linux-troubleshooting|Linux Troubleshooting]] for the syscall/VFS/scheduler mental model and
the strace/perf/proc toolkit already written up from an incident-response angle, and
[[ebpf|What is eBPF]] for the eBPF foundations this Part's Linux Performance chapter builds on.

- [[01-linux-kernel-overview|1 — Linux Kernel Overview]] — _(stub)_
- [[02-linux-process-management|2 — Linux Process Management]] — _(stub)_
- [[03-linux-performance|3 — Linux Performance]] — _(stub)_

### 10 — Distributed Systems Perspective

How the single-machine OS abstractions from earlier Parts get virtualized, containerized, and
orchestrated at cluster scale. See
[[sre/03-cloud-and-infrastructure/01-virtual-machines/01-virtual-machines|Virtual Machines]] for
hypervisor-level isolation, and [[03-node-monitoring|Node Monitoring]] /
[[08-ebpf-based-observability|eBPF-Based Observability]] for how these OS-level signals get surfaced
as telemetry.

- [[01-os-in-cloud-computing|1 — OS in Cloud Computing]] — _(stub)_
- [[02-operating-systems-for-kubernetes|2 — Operating Systems for Kubernetes]] — _(stub)_
- [[03-operating-systems-for-observability|3 — Operating Systems for Observability]] — _(stub)_

### 11 — Advanced Topics

Kernel-level concurrency and I/O techniques past the interview-fundamentals bar — useful for L6+
infrastructure and platform roles. See
[[patterns/13-concurrency-patterns/02-lock-free-programming/02-lock-free-programming|Lock-Free Programming]]
for CAS/atomics/wait-free queues from the application-design-pattern angle; this Part's chapter goes
kernel-side instead (RCU, spinlocks, seqlocks).

- [[operating-system/11-advanced-topics/01-lock-free-programming/01-lock-free-programming|1 — Lock-Free Programming]]
  — _(stub)_
- [[02-numa-systems|2 — NUMA Systems]] — _(stub)_
- [[03-kernel-synchronization|3 — Kernel Synchronization]] — _(stub)_
- [[04-high-performance-io|4 — High Performance I/O]] — _(stub)_
- [[05-emerging-operating-system-technologies|5 — Emerging Operating System Technologies]] —
  _(stub)_

### 12 — Interview Preparation

Where OS internals meet the whiteboard — classic problems, system-design connections, and
Linux-specific interview questions, synthesized into an L4–L6 masterclass.

- [[01-classic-interview-problems|1 — Classic Interview Problems]] — _(stub)_
- [[02-system-design-connections|2 — System Design Connections]] — _(stub)_
- [[operating-system/12-interview-preparation/03-linux-interview-questions/03-linux-interview-questions|3 — Linux Interview Questions]]
  — _(stub)_
- [[04-maang-interview-masterclass|4 — MAANG Interview Masterclass]] — _(stub)_

## Suggested Study Order (Highest ROI)

1. [00 — Foundations](#00--foundations)
2. [01 — Processes](#01--processes)
3. [02 — Threads](#02--threads)
4. [03 — Concurrency](#03--concurrency)
5. [04 — CPU Scheduling](#04--cpu-scheduling)
6. [05 — Memory Management](#05--memory-management)
7. [06 — File Systems](#06--file-systems)
8. [07 — Input / Output](#07--input--output) — I/O multiplexing (`epoll`, `io_uring`)
9. [09 — Linux Internals](#09--linux-internals)
10. [10 — Distributed Systems Perspective](#10--distributed-systems-perspective) — OS in cloud &
    Kubernetes
11. [11 — Advanced Topics](#11--advanced-topics), Chapter 1 — Lock-Free Programming
12. [12 — Interview Preparation](#12--interview-preparation) — interview problems & mock interviews

This sequence aligns with MAANG interview expectations for L4–L6 software engineering roles, with
additional depth in Linux internals, containerization, and observability that is particularly
valuable for SRE, Platform Engineering, and Infrastructure Engineering interviews.

## Metadata

|        |                  |
| ------ | ---------------- |
| Author | Amit Singh       |
| Scope  | operating-system |
