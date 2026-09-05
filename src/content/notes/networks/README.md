---
title: "Computer Networks"
description: "A book-shaped table of contents for computer networking, from first principles to production systems: Ethernet through IP, TCP/UDP/QUIC, DNS, the HTTP ecosystem, security, cloud/Kubernetes networking, performance engineering, observability/debugging, and distributed-systems networking — cross-linking existing kubernetes/sre/system-design/tech notes instead of duplicating them."
tags: ["networks", "book", "reference", "maang-prep"]
hidden: false
zettelId: "202607150122"
noteType: moc
---

# Computer Networks

> If this were a book, this page is the table of contents. Each Part below is a chapter; each
> chapter links out to the concepts, designs, and platform notes that already exist elsewhere in
> this wiki instead of duplicating them. Unwritten chapters are listed as **Planned** rows, not
> empty files.

## Parts

### 00 — Networking Fundamentals

Why networks exist and how the OSI/TCP-IP models frame everything after this Part — read this before
any Part below, since the L4/L7 vocabulary from Chapter 3 recurs constantly.

- [[01-why-computer-networks-matter|1 — Why Computer Networks Matter]] — _(stub)_
- [[02-data-communication-basics|2 — Data Communication Basics]] — _(stub)_
- **3 — Network Models** — the OSI 7-layer model, why L4/L7 are the load-bearing layers in
  interviews, and a general protocol/L7-termination reference table
  - [[03-1-osi-layer-model|OSI Layer Model (L1-L7)]]
  - [[03-2-protocol-inventory|Protocol Inventory]]
- [[04-network-devices|4 — Network Devices]] — _(stub)_

### 01 — Ethernet and Local Networks

The link layer — framing, addressing, and switching on a single physical segment, before Part III
introduces routing between segments.

- [[01-ethernet|1 — Ethernet]] — _(stub)_
- [[02-arp|2 — ARP]] — _(stub)_
- [[03-switching|3 — Switching]] — _(stub)_

### 02 — Internet Protocol (IP)

Addressing and routing between networks — IPv4/IPv6 header mechanics and how a packet actually finds
its way across the internet.

- [[01-ipv4|1 — IPv4]] — _(stub)_
- [[02-ipv6|2 — IPv6]] — _(stub)_
- [[networks/02-internet-protocol/03-routing/03-routing|3 — Routing]] — _(stub)_
- [[04-routing-protocols|4 — Routing Protocols]] — _(stub)_

### 03 — Transport Layer

TCP and UDP's reliability, flow-control, and congestion-control mechanics, plus QUIC as the modern
rewrite of the reliability model over UDP. See also [[sre/readme|sre/README.md]] Part 01 for the
same protocols from the Linux-tooling angle.

- [[01-udp|1 — UDP]] — _(stub)_
- [[02-tcp-fundamentals|2 — TCP Fundamentals]] — _(stub)_
- [[03-reliable-transmission|3 — Reliable Transmission]] — _(stub)_
- [[04-tcp-optimization|4 — TCP Optimization]] — _(stub)_
- [[05-quic|5 — QUIC]] — _(stub)_

### 04 — DNS

Name resolution end to end — record types, resolver hierarchy, and the caching/geo-routing levers
that make DNS a performance and reliability control point, not just a lookup table.

- [[01-dns-fundamentals|1 — DNS Fundamentals]] — _(stub)_
- [[02-dns-records|2 — DNS Records]] — _(stub)_
- [[03-dns-performance|3 — DNS Performance]] — _(stub)_

### 05 — HTTP Ecosystem

The application-layer protocols distributed systems actually speak — HTTP's own version history, and
the REST/GraphQL/gRPC/WebSocket API styles built on top of it. See also
[[system-design/readme|system-design/README.md]] Part 04 for the architectural-tradeoff angle on RPC
style selection.

- [[01-http-fundamentals|1 — HTTP Fundamentals]] — _(stub)_
- [[02-http1-vs-http2|2 — HTTP Versions]] — the connection-scaling argument behind preferring HTTP/2
  (and therefore gRPC) at 100K+ agent fan-in
- [[networks/05-http-ecosystem/03-rest/03-rest|3 — REST]] — _(stub)_
- [[04-graphql|4 — GraphQL]] — _(stub)_
- [[networks/05-http-ecosystem/05-grpc/05-grpc|5 — gRPC]] — call shapes, status-code backpressure,
  deadline propagation, and the connection-level load-balancing gotcha
- [[06-websockets|6 — WebSockets]] — _(stub)_

### 06 — Security

Cryptography primitives through TLS/HTTPS mechanics to the authentication protocols and
network-security controls that depend on them.

- [[01-cryptography-fundamentals|1 — Cryptography Fundamentals]] — _(stub)_
- [[02-tls-offload|2 — TLS]] — TLS offload/termination architecture, the offload-vs-defense-in-depth
  trade-off, and where mTLS re-encryption fits
- [[03-https|3 — HTTPS]] — _(stub)_
- [[04-authentication-protocols|4 — Authentication Protocols]] — _(stub)_
- [[networks/06-security/05-network-security/05-network-security|5 — Network Security]] — _(stub)_

### 07 — Cloud Networking

Networking as configured in a cloud/Kubernetes environment — VPCs, Kubernetes' own networking model,
service mesh, load balancing, and CDNs. See also [[kubernetes/readme|kubernetes/README.md]] Part 04
for CKA-level Kubernetes networking depth, and [[envoy|Envoy]] /
[[01-sidecar|patterns/09-cloud-native-patterns/01-sidecar]] for the service-mesh data-plane
mechanics this Part's Service Mesh chapter builds on.

- [[01-virtual-networking|1 — Virtual Networking]] — _(stub)_
- [[02-kubernetes-networking|2 — Kubernetes Networking]] — _(stub)_
- [[networks/07-cloud-networking/03-service-mesh/03-service-mesh|3 — Service Mesh]] — _(stub)_
- [[networks/07-cloud-networking/04-load-balancing/04-load-balancing|4 — Load Balancing]] — _(stub)_
- [[05-cdn|5 — CDN]] — _(stub)_

### 08 — Performance Engineering

The levers available once a network is working correctly and the goal shifts to making it fast —
connection reuse, compression, caching, and how to actually benchmark a network path.

- [[networks/08-performance-engineering/01-network-performance/01-network-performance|1 — Network Performance]]
  — _(stub)_
- [[02-connection-management|2 — Connection Management]] — _(stub)_
- [[networks/08-performance-engineering/03-compression/03-compression|3 — Compression]] — _(stub)_
- [[04-caching|4 — Caching]] — _(stub)_
- [[05-network-benchmarking|5 — Network Benchmarking]] — _(stub)_

### 09 — Observability and Debugging

The practical toolkit for finding out what a network is actually doing — packet capture, Linux
networking commands, and protocol-specific debugging tools.

- [[01-packet-analysis|1 — Packet Analysis]] — _(stub)_
- [[02-linux-networking|2 — Linux Networking]] — _(stub)_
- [[03-dns-debugging|3 — DNS Debugging]] — _(stub)_
- [[04-http-debugging|4 — HTTP Debugging]] — _(stub)_
- [[05-kubernetes-network-debugging|5 — Kubernetes Network Debugging]] — _(stub)_

### 10 — Distributed Systems Networking

How networking failure modes show up specifically in distributed systems — RPC, message brokers,
event streaming, and the CAP-theorem consequences of an unreliable network.

- [[01-rpc-systems|1 — RPC Systems]] — _(stub)_
- [[networks/10-distributed-systems-networking/02-message-brokers/02-message-brokers|2 — Message Brokers]]
  — _(stub)_
- [[03-event-streaming|3 — Event Streaming]] — _(stub)_
- [[04-cap-and-networking|4 — CAP and Networking]] — _(stub)_
- [[05-cross-region-communication|5 — Cross-Region Communication]] — _(stub)_

### 11 — Networking Interview Mastery

A synthesis Part — common interview questions, real production incidents, and case studies from
companies that operate networks at planet scale.

- [[01-common-maang-networking-questions|1 — Common MAANG Networking Questions]] — _(stub)_
- [[02-production-incidents|2 — Production Incidents]] — _(stub)_
- [[03-cloud-networking-case-studies|3 — Cloud Networking Case Studies]] — _(stub)_
- [[04-networking-design-interviews|4 — Networking Design Interviews]] — _(stub)_
- [[05-review-and-cheat-sheets|5 — Review & Cheat Sheets]] — _(stub)_

### 12 — Appendix

Quick-reference tables and cheat sheets for use alongside every chapter above — protocol headers,
addressing ranges, tool syntax, and terminology.

- [[01-common-ports|1 — Common Ports]] — _(stub)_
- [[02-http-status-codes|2 — HTTP Status Codes]] — _(stub)_
- [[03-tcp-flags|3 — TCP Flags]] — _(stub)_
- [[04-icmp-message-types|4 — ICMP Message Types]] — _(stub)_
- [[05-cidr-cheat-sheet|5 — CIDR Cheat Sheet]] — _(stub)_
- [[06-ipv4-reserved-ranges|6 — IPv4 Reserved Ranges]] — _(stub)_
- [[07-ipv6-address-types|7 — IPv6 Address Types]] — _(stub)_
- [[08-tls-cipher-suites|8 — TLS Cipher Suites]] — _(stub)_
- [[09-dns-record-types|9 — DNS Record Types]] — _(stub)_
- [[10-wireshark-filters|10 — Wireshark Filters]] — _(stub)_
- [[11-tcpdump-cheat-sheet|11 — tcpdump Cheat Sheet]] — _(stub)_
- [[12-curl-cheat-sheet|12 — curl Cheat Sheet]] — _(stub)_
- [[13-linux-networking-commands|13 — Linux Networking Commands]] — _(stub)_
- [[14-kubernetes-networking-commands|14 — Kubernetes Networking Commands]] — _(stub)_
- [[15-cloud-networking-terminology|15 — Cloud Networking Terminology]] — _(stub)_
- [[networks/12-appendix/16-common-interview-pitfalls/16-common-interview-pitfalls|16 — Common Interview Pitfalls]]
  — _(stub)_

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | networks   |
