---
title: "What is eBPF"
description: "Extended Berkeley Packet Filter — sandboxed, verified bytecode run inside the Linux kernel without a module or a restart. The foundation under Cilium, Grafana Beyla, and Pyroscope: zero-instrumentation traces, metrics, and continuous profiling."
tags: ["tech", "observability", "ebpf", "linux-kernel", "profiling"]
updated: 2026-07-12
hidden: false
zettelId: "202607121601"
relations:
  - slug: networks/reference/envoy
    kind: related
  - slug: observability/05-continuous-profiling/05-profiling-production-systems/05-continuous-profiling
    kind: related
  - slug: patterns/09-cloud-native-patterns/01-sidecar/01-sidecar
    kind: compared_to
---

eBPF (extended Berkeley Packet Filter) is a Linux kernel technology that runs sandboxed,
kernel-verified programs in response to kernel events — syscalls, network packets, function
entry/exit — without writing a kernel module, recompiling the kernel, or restarting anything it
observes. "Extended" because the original BPF (1992, Van Jacobson & McCanne) only ever did packet
filtering for tools like `tcpdump`; Linux 3.18 (2014) generalized the same in-kernel VM into a
general-purpose, event-driven programming model, and that generalization is what unlocked an entire
category of zero-instrumentation observability tooling over the following decade.

---

## Why "safe to run in the kernel" is the whole story

```
eBPF program (compiled to bytecode)
       │
       ▼
  Kernel verifier
       │  rejects: unbounded loops, out-of-bounds memory access,
       │           anything that could crash or hang the kernel
       ▼
  JIT-compiled, attached to a hook
       │
       ▼
kprobe / uprobe / tracepoint / XDP / cgroup / LSM hook
       │
       ▼
  Maps (key-value state, shared with userspace)
```

The verifier is what makes this safe to run in production at all: every program is statically proven
to terminate and stay in-bounds before it's ever attached. That's the property that lets eBPF-based
tools observe _every_ process on a node from one place, with no per-application deployment step and
no chance of taking the kernel down.

## Attachment points relevant to observability

| Hook type            | What it sees                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| **kprobe/kretprobe** | Kernel function entry/exit — syscalls, scheduler events                                                   |
| **uprobe/uretprobe** | Userspace function entry/exit — e.g. a specific libc or libssl call, or an HTTP library's request handler |
| **Tracepoint**       | Stable, versioned kernel instrumentation points                                                           |
| **XDP**              | Earliest possible point to process a packet, in the NIC driver                                            |
| **cgroup / LSM**     | Per-container resource and security-relevant events                                                       |

## What's built on it

| Project                                   | What it does                                                                                                                                                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cilium**                                | CNI + L3–L7 network policy + service mesh _without_ per-pod Envoy sidecars — enforcement lives in the kernel data path instead                                                                                                                                  |
| **Hubble** (Cilium's observability layer) | Network flow visibility — who talked to whom, at what layer, denied or allowed, with zero app-side instrumentation                                                                                                                                              |
| **Grafana Beyla**                         | Attaches uprobes to HTTP/gRPC library calls in a _running_ binary and emits OTel-native traces/metrics — no code change, no redeploy                                                                                                                            |
| **Parquet/Grafana Pyroscope**             | [[observability/05-continuous-profiling/05-profiling-production-systems/05-continuous-profiling\|Continuous profiling]] — samples stack traces fleet-wide via kernel-level sampling, at <1% overhead, feeding a `profiles` signal alongside metrics/logs/traces |
| **Falco**                                 | Runtime security — syscall-level anomaly detection                                                                                                                                                                                                              |

## Where this sits relative to SDK-based instrumentation

eBPF-based telemetry is not a replacement for rich application-level spans — it has no access to
business context (order ID, tenant, custom span attributes) that only application code can attach.
What it gives instead is a baseline: RED metrics and traces for services that haven't been
instrumented yet, and continuous profiling that would be operationally impossible to hand-roll
(sampling every process on every node, all the time, from inside each app).

```
        Zero-instrumentation baseline          Rich, business-aware detail
        (eBPF: Beyla, Pyroscope, Hubble)   +    (OTel SDK: spans with custom attributes)
                    │                                        │
                    └───────────────  both feed the same  ───┘
                              Mimir / Loki / Tempo backends
```

**Why it matters here:** eBPF-based continuous profiling (Pyroscope / Grafana Cloud Profiles) is the
natural next signal for a ShipSolid OTel-native stack already running metrics/logs/traces on
Mimir/Loki/Tempo — and Beyla is the lowest-friction way to close instrumentation gaps on services
that haven't onboarded an OTel SDK yet, without waiting on an app team's release cycle. It doesn't
replace the [[envoy]]-based
[[patterns/09-cloud-native-patterns/01-sidecar/01-sidecar|sidecar model]] outright, but Cilium is
the concrete eBPF-native alternative to it worth knowing the tradeoffs of.
