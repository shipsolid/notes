---
title: "4 — Auto vs. Manual Instrumentation"
description: "Four ways a span gets created — hand-written, framework-level auto-instrumentation, eBPF, and service-mesh sidecar capture — and the trade-off between code changes and business context each one makes."
tags: ["observability", "instrumentation", "opentelemetry", "book"]
updated: 2026-07-17
hidden: false
zettelId: "202607132153-3"
relations:
  - slug: observability/06-opentelemetry/01-opentelemetry-architecture/01-opentelemetry-sdks-and-semantic-conventions
    kind: depends_on
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: related
  - slug: observability/reference/ebpf
    kind: related
  - slug: patterns/09-cloud-native-patterns/01-sidecar/01-sidecar
    kind: related
  - slug: networks/reference/envoy
    kind: related
---

# 4 — Auto vs. Manual Instrumentation

[[01-opentelemetry-sdks-and-semantic-conventions|The OTel SDK]] gives you `tracer.start_span()`; it
doesn't decide who calls it. Four different answers to "who writes the span" exist in production
today, trading code changes for business-context depth in opposite directions.

---

## Manual instrumentation

A developer calls the OTel API directly, inside application code, to create exactly the span or
metric they want — `tracer.start_span("charge-customer")`, with whatever attributes actually mean
something for that operation.

**Strength:** the span means exactly what the developer intended. "charge-customer failed: card
declined" is business context no generic instrumentation could ever infer, because it requires
knowing what the code is _for_, not just what it called.

**Cost:** every span is a line of code someone has to write, review, and keep from drifting out of
semantic-convention naming — see [[05-label-schema-design]] — across every service, by every team,
forever. Coverage is exactly as good as the discipline behind it, and no better.

---

## Framework-level auto-instrumentation

An OTel auto-instrumentation library loaded alongside the application wraps known frameworks/drivers
— the HTTP server, the SQL driver, the gRPC client — so every request through them gets a span with
zero lines of application code changed. It works by patching or wrapping well-known library entry
points at startup, not by understanding the business logic.

**Strength:** every service gets a consistent baseline the moment the agent is attached — no
per-team effort, no drift, no missed endpoint.

**Cost:** it only sees what the wrapped library sees — an HTTP request came in, a query ran. It has
no way to know _why_, and it can't span anything the framework doesn't already have a hook for (pure
business logic with no I/O in the middle is invisible to it).

---

## eBPF: instrumentation with no agent in the process at all

[[ebpf|eBPF]] programs run inside the Linux kernel, observing syscalls and network traffic without
touching the application process — no SDK, no language-specific agent, not even a restart. Tools
like Grafana Beyla use this to generate traces, metrics, and continuous profiles for services that
were never instrumented at all.

**Strength:** works identically regardless of language or runtime, with zero application-side
footprint — the one approach that requires touching nothing about the service itself.

**Cost:** kernel/network-level visibility is coarser than framework-level auto-instrumentation, let
alone manual spans — it can see "a 500ms round trip happened," not "the cache missed, so it
retried." It answers _that_ something took time, rarely _why_.

---

## Service-mesh sidecar capture

A sidecar proxy sitting in the pod's network path — [[01-sidecar|the Sidecar pattern]], commonly
built on [[envoy|Envoy]] — observes every request and response transparently and can emit
spans/metrics for L7 traffic without any change to the application or the kernel.

**Strength:** consistent, mesh-wide coverage the same way framework auto-instrumentation is
consistent per-service, but enforced at the infrastructure layer instead of depending on every
service adopting an agent.

**Cost:** same ceiling as eBPF's, for the same reason — a proxy sees requests and responses, not the
code that produced them. It also only sees traffic that actually crosses the mesh's network path;
in-process work never shows up at all.

---

## Comparing all four

| Approach                       | Code changes required     | Business-context depth           | Coverage breadth                        | Operational complexity                                   |
| ------------------------------ | ------------------------- | -------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| Manual                         | Yes, per span             | Highest — exactly what you wrote | Only what was deliberately instrumented | Low infra cost, high dev/maintenance cost                |
| Framework auto-instrumentation | None                      | Framework-boundary only          | Every call through a wrapped library    | Low — an agent to attach and keep updated                |
| eBPF                           | None, no agent in-process | Lowest — network/syscall level   | Language- and runtime-agnostic          | Higher — kernel-level tooling, newer operational surface |
| Service-mesh sidecar           | None                      | Network-boundary only            | Everything that crosses the mesh        | Requires a mesh already in place                         |

---

## The pattern that actually gets used

These aren't mutually exclusive, and the common real answer is to layer them: framework
auto-instrumentation or mesh capture as the zero-effort baseline every service gets automatically —
so a brand-new service has request-level traces and RED metrics before anyone writes a line of
instrumentation code — and manual spans added surgically only where business context is worth the
maintenance cost: checkout, payment, anything where "a request happened" is a materially worse
answer than "here's specifically what it did and why it failed." eBPF and mesh capture cover the gap
for services nobody has gotten around to instrumenting at all yet, which is exactly where
zero-code-change coverage matters most.

---

## Why this matters for an Observability Architect

The instrumentation approach a platform defaults to determines how long a new service goes
unobserved. A platform that requires manual instrumentation before a service gets any tracing
coverage has an onboarding gap by construction — every new service ships uninstrumented until
someone gets to it. Defaulting new services to auto-instrumentation or mesh capture, and treating
manual spans as an opt-in enhancement rather than the entry requirement, is what turns "instrument
this service" from a blocking task into something that already happened before anyone asked.

## Metadata

| Dimension | Detail        |
| --------- | ------------- |
| Author    | Amit Singh    |
| Scope     | observability |
