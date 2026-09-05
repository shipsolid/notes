---
title: "ADR Template"
description: "- **Status**: Proposed | Accepted | Rejected | Superseded"
tags: ["ShipSolid", "Templates"]
hidden: false
zettelId: "202603241245-17"
relations:
  - slug: projects/platform-shipsolid/10-templates/rfc-template
    kind: related
  - slug: projects/platform-shipsolid/10-templates/post-mortems-template
    kind: related
  - slug: projects/platform-shipsolid/10-templates/confluence-content-templates
    kind: related
---

<!-- adr-XXX-title-of-decision.md -->

## ADR-XXX: Title of the Architectural Decision

<!-- Proposed | Accepted | Rejected | Superseded -->

- **Status**: Proposed | Accepted | Rejected | Superseded
- **Date**: YYYY-MM-DD
- **Authors**: [Name(s), Role(s)]
- **Deciders**: [Name(s), Role(s)]
- **Supersedes**: [ADR-### if applicable]
- **Related RFC**: [Link to relevant [[projects/platform-shipsolid/10-templates/rfc-template|RFC]]
  if any]
- **Project/Context**: [Service or system this applies to]

---

## 1. Context

_Describe the background and situation that led to this decision._

- What system or problem is being addressed?
- What constraints, assumptions, or requirements shaped this?
- Any incidents, audits, or business goals influencing it?

> Example: Our Azure-based Function App services require consistent tracing. Multiple OpenTelemetry
> exporters were evaluated to integrate with Grafana Cloud Tempo. This ADR documents the decision
> for using `OTLP over HTTP` as the exporter protocol.

---

## 2. Decision

_Clearly state the architectural decision._

> Example: We will use **OpenTelemetry .NET SDK** with **OTLP over HTTP exporter** to send trace
> data to **Grafana Tempo** via the Grafana Cloud endpoint. Instrumentation will be done manually
> for custom spans and via auto-instrumentation for supported libraries.

---

## 3. Rationale

_Explain why this decision was made._

- Compare alternatives
- Highlight pros and cons
- Reference evaluations, benchmarks, proof of concepts, or team alignment

> We chose OTLP/HTTP over gRPC because:
>
> - More reliable under network restrictions (corporate proxies, firewalls)
> - Native support in .NET SDK
> - Better interoperability with Azure monitoring tools

---

## 4. Alternatives Considered

| Alternative            | Reason for Rejection                          |
| ---------------------- | --------------------------------------------- |
| OTLP over gRPC         | Not compatible with proxy/firewall settings   |
| Azure Monitor Exporter | Vendor lock-in, lacks trace correlation       |
| Zipkin Format          | Limited feature set, not fully OTLP-compliant |

---

## 5. Consequences

_Describe the consequences of this decision._

- Code changes needed (SDKs, exporters)
- Infrastructure dependencies (collectors, endpoints)
- Impacts on CI/CD, deployment, or operations
- Training or documentation needs

---

## 6. Reconsideration Criteria

_What circumstances might lead us to revisit this decision?_

- Grafana Cloud changes pricing or support
- OTLP support changes in the ecosystem
- Performance bottlenecks are observed
- Team adopts another backend like Azure Monitor or AWS X-Ray

---

## 7. References

- OpenTelemetry .NET SDK Docs
- Grafana Cloud Trace Export Guide
- PoC Report / Evaluation Summary
- Related RFC or Issue
- If this ADR was prompted by an incident, link the
  [[projects/platform-shipsolid/10-templates/post-mortems-template|post-mortem]] here

---

> A condensed, Confluence-native version of this template lives in
> [[projects/platform-shipsolid/10-templates/confluence-content-templates|Confluence Content Templates]]
> (Template 1).

---
