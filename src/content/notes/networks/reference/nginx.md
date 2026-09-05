---
title: "What is a Reverse Proxy (NGINX)"
description: "Forward vs reverse proxy, and NGINX as the canonical implementation — event-driven architecture, core proxy capabilities, its config model, and the 2026 shift toward NGINX Gateway Fabric as a Kubernetes Gateway API implementation."
tags: ["tech", "networking", "reverse-proxy", "web-server"]
updated: 2026-08-02
hidden: false
zettelId: "202608021430-2"
relations:
  - slug: sre/01-linux-networking-and-operating-systems/13-reverse-proxies/13-reverse-proxies
    kind: related
  - slug: networks/reference/envoy
    kind: compared_to
  - slug: networks/reference/istio
    kind: related
---

A **forward proxy** sits in front of clients and hides the client from the server (classic corporate
egress proxy — the server never sees who's really asking). A **reverse proxy** sits in front of
servers and hides the servers from the client — the client only ever talks to the proxy, which
decides which upstream actually handles the request. NGINX is the most widely deployed
implementation of the reverse-proxy pattern, and the concrete thing to point at when "reverse proxy"
stops being an abstract diagram.

---

## What NGINX does when it proxies a request

```
Client ──▶ NGINX (listens on :443, terminates TLS)
              │
              ├── Match request against a server{}/location{} block
              ├── Rewrite headers (Host, X-Forwarded-For, X-Real-IP)
              ├── Pick an upstream (proxy_pass)
              ├── Optionally serve from proxy_cache instead of hitting upstream
              └── Forward to upstream, stream the response back
```

## Core capabilities

| Capability          | Directive / mechanism                                   | Why it matters                                                            |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| TLS termination     | `ssl_certificate`, `ssl_certificate_key`                | Upstreams don't each need their own cert management                       |
| Load balancing      | `upstream { }` block — round robin, least_conn, ip_hash | Spreads requests without the client knowing there's more than one backend |
| Caching             | `proxy_cache_path`, `proxy_cache`                       | Serves repeat requests without hitting the upstream at all                |
| Compression         | `gzip`                                                  | Reduces bytes on the wire to the client                                   |
| Rate limiting       | `limit_req`, `limit_conn`                               | Bounds abusive or runaway clients before they reach the upstream          |
| Static file serving | `root`, `try_files`                                     | Serves assets directly — no round trip to an app server at all            |

## Why NGINX scales: event-driven, not thread-per-connection

NGINX's worker processes run an async event loop — one worker can hold open thousands of idle
connections because it isn't blocking a thread per connection the way a classic
one-thread/one-process-per-request server (Apache's prefork MPM) does. This is the same
architectural reason [[envoy]] and NGINX both handle high connection counts on modest hardware —
different proxy, same underlying async-I/O bet.

## Config model: server blocks + location blocks

```nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://backend_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

upstream backend_upstream {
    least_conn;
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
}
```

Config is a static file, reloaded (not hot-pushed like [[envoy]]'s xDS) — `nginx -s reload` re-reads
config and spins up new workers without dropping connections, but there's no control-plane API
pushing changes the way Envoy or Istio's istiod does.

## 2026: NGINX Gateway Fabric — the Kubernetes-native path

F5 (which acquired NGINX in 2019) now ships **NGINX Gateway Fabric**, an implementation of the
Kubernetes **Gateway API** — the direction Ingress-controller traffic management is moving. **NGINX
Gateway Fabric 2.6** (May 2026) added F5 WAF support directly on top of Gateway API, making it one
of the first Gateway API implementations with enterprise-grade WAF built in, rather than bolted on
via a separate ModSecurity sidecar.

**Operational flag:** F5 shipped out-of-band security patches in June and July 2026 across the NGINX
product family (NGINX Open Source, Plus, Gateway Fabric, Ingress Controller), including
`ngx_http_v3_module` and `ngx_http_proxy_v2_module`/`ngx_http_grpc_module` CVEs scoring up to 9.2 on
CVSS v4.0. Anything running NGINX at the edge needs a patch cadence that isn't "whenever the next
scheduled maintenance window comes around" — these are internet-facing modules by definition.

## Where it fits next to Envoy / Istio

| Concern         | NGINX                                        | Envoy                                       | Istio (ambient)                       |
| --------------- | -------------------------------------------- | ------------------------------------------- | ------------------------------------- |
| Config model    | Static file, reload                          | Dynamic xDS from a control plane            | istiod pushes xDS to ztunnel/waypoint |
| Primary role    | Edge reverse proxy / ingress                 | Sidecar or edge L7 proxy                    | Mesh-wide L4/L7 policy + mTLS         |
| K8s integration | Ingress controller or Gateway API (Fabric)   | Data plane under Istio/other control planes | Native — is the mesh                  |
| Maturity/reach  | Decades of production use, huge install base | CNCF graduated, mesh-standard               | CNCF graduated                        |

**Why it's relevant here:** the existing
[[sre/01-linux-networking-and-operating-systems/13-reverse-proxies/13-reverse-proxies|reverse-proxies]]
note is a stub — this is the concrete implementation to fill it with. For anything ingress-facing on
AKS, the real decision is NGINX Gateway Fabric (Gateway API, config-file-adjacent mental model) vs.
Istio ambient/Envoy (control-plane-pushed, mesh-native) — not "which proxy is better" in the
abstract, but which config model matches how the platform team wants to operate it.
