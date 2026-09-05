---
title: "Observability Architecture: Questions to Ask"
description: "A chronological sequence of 216 questions an architect asks when designing a production-grade observability platform — from business context through multi-tenancy, SLOs, onboarding, and validation."
tags: ["observability", "system-design", "maang-prep", "architecture"]
hidden: false
zettelId: "202606301457"
relations:
  - slug: observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy
    kind: related
  - slug: projects/platform-shipsolid/00-start-here/vision-and-mission
    kind: related
  - slug: system-design/08-observability/01-observability-architecture/01-observability-architecture
    kind: related
  - slug: prometheus/06-alerting/02-alerting-rules/02-alerting-rules
    kind: related
---

For
[[system-design/08-observability/01-observability-architecture/01-observability-architecture|observability architecture]],
the most effective way to learn is to ask the right questions in the order an architect would
naturally design a system. Below is a chronological sequence that takes you from first principles to
operating a production-grade platform.

## Phase 1: Understand the Business

Before thinking about technology, ask:

1. What business problem are we solving?

   <details><summary>Hint</summary>

   Typically one of three: reducing MTTR, enabling proactive detection before customers notice, or
   eliminating war-room firefighting. Anchor every technology choice to one of these outcomes — if a
   capability doesn't move one of these needles, deprioritize it.

   </details>

2. Who are the consumers of observability data?

   <details><summary>Hint</summary>

   Three distinct audiences: on-call engineers (need fast incident context), developers (need
   deployment feedback), management/SRE leads (need SLO/trend dashboards). Each needs a different
   interface — don't design one dashboard to serve all three.

   </details>

3. What decisions will this data help people make?

   <details><summary>Hint</summary>

   Incident triage (is this my service or upstream?), capacity (do I need to scale?), release (did
   this deploy degrade any SLIs?), and budget (what's driving ingest cost?).

   </details>

4. What does "good observability" mean for this organization?

   <details><summary>Hint</summary>

   Define it in outcome terms: "an on-call engineer can identify the root cause of a P1 within 15
   minutes without SSHing into a box." If the org can't state it that concretely, closing that gap
   is the first deliverable.

   </details>

5. What are the SLAs and SLOs?

   <details><summary>Hint</summary>

   SLAs are contractual commitments to customers. SLOs are internal targets set tighter than SLAs to
   buffer error budget. Start with the customer-facing SLA, subtract a buffer, and derive SLOs for
   the critical-path services that underpin it.

   </details>

6. Which applications are business-critical?

   <details><summary>Hint</summary>

   Classify by revenue impact, customer visibility, and dependency fan-in. P0: revenue-generating,
   customer-facing, no fallback. P1: internal but blocking P0s. Everything else is P2+.
   Observability investment should be proportional to this classification.

   </details>

7. What incidents happen most frequently today?

   <details><summary>Hint</summary>

   Pull from your incident management system (SNOW, PagerDuty). Rank by frequency × impact. The top
   3 recurrers almost always reveal the first instrumentation gaps to close.

   </details>

8. What does success look like after implementation?

   <details><summary>Hint</summary>

   Define before you build: MTTR target, alert-to-noise ratio target, onboarding time target,
   cost-per-service cap. Without these, you'll ship something that looks good but can't be
   evaluated.

   </details>

9. What is the current observability maturity level?

   <details><summary>Hint</summary>

   Use a maturity model: Level 0 = logs only, ad hoc. Level 1 = structured logging, basic metrics.
   Level 2 = distributed tracing, SLOs defined. Level 3 = correlated signals, SLO-driven alerting.
   Level 4 = AIOps, automated remediation. Knowing where you are sets the realistic roadmap.

   </details>

10. What budget and team capacity are available for this initiative?

    <details><summary>Hint</summary>

    Capacity constrains timeline and scope. Map each phase to team-weeks; flag phases that require
    specialist skills (distributed tracing, Alloy config) vs those that can be delegated to service
    teams. Budget determines managed cloud vs self-hosted.

    </details>

11. Are there regulatory or compliance requirements (GDPR, SOC2, HIPAA, PCI)?

    <details><summary>Hint</summary>

    GDPR: PII must not appear in logs or traces — scrub at the pipeline. SOC2/HIPAA: access to audit
    logs must itself be audited. PCI: cardholder data must not transit observability pipelines.
    Identify these before instrumentation design, not after.

    </details>

12. What is the appetite for vendor lock-in versus open-source tooling?

    <details><summary>Hint</summary>

    Default to OTel-native instrumentation regardless of backend — this gives portability at the
    data layer. Lock-in at the storage/visualization layer (Grafana Cloud, Datadog) is acceptable if
    instrumentation stays vendor-neutral.

    </details>

---

## Phase 2: Understand the Applications

13. What applications exist?

    <details><summary>Hint</summary>

    Build a service inventory before doing anything else. If one doesn't exist, reconstruct from
    network traffic, CI/CD pipelines, or Kubernetes service discovery. The inventory is the
    dependency graph you'll instrument.

    </details>

14. Which are monoliths and which are microservices?

    <details><summary>Hint</summary>

    Monoliths need structured logging and process-level metrics. Microservices additionally need
    distributed tracing to track request flow across service boundaries. Don't apply the same
    instrumentation strategy to both.

    </details>

15. Where are they hosted?

    <details><summary>Hint</summary>

    Location determines collection topology: cloud-native services use DaemonSet collectors; on-prem
    services need gateway collectors with VPN/private link. Hybrid environments need both.

    </details>

16. What programming languages are used?

    <details><summary>Hint</summary>

    OTel SDK maturity varies by language: Java, Go, Python, and Node.js have stable
    auto-instrumentation. .NET is stable. Ruby and PHP are less mature. Language diversity
    multiplies the instrumentation surface — prioritize languages serving P0 services first.

    </details>

17. Which protocols do they use (HTTP, gRPC, Kafka, etc.)?

    <details><summary>Hint</summary>

    HTTP/gRPC have excellent auto-instrumentation via OTel. Kafka consumers need manual span
    creation for producer-consumer correlation. Custom TCP protocols need custom instrumentation.
    Flag each protocol gap in the service inventory.

    </details>

18. How do services communicate?

    <details><summary>Hint</summary>

    Map synchronous (HTTP/gRPC) vs asynchronous (Kafka, SQS, event bus) paths separately. Async
    paths break standard trace context propagation — you need W3C TraceContext injected into message
    headers and extracted at the consumer.

    </details>

19. Which components are stateful?

    <details><summary>Hint</summary>

    Databases, caches, and message brokers need USE metrics (Utilization, Saturation, Errors).
    They're often the bottleneck in incident investigations. Ensure query latency, connection pool
    saturation, and replication lag are instrumented.

    </details>

20. Which dependencies are external?

    <details><summary>Hint</summary>

    External dependencies are outside your instrumentation boundary. Instrument the client side
    (latency, error rate, circuit-breaker state) and treat the dependency as a black box. Set
    synthetic monitors for their availability.

    </details>

21. What is the deployment frequency for each application?

    <details><summary>Hint</summary>

    High-frequency deployments (multiple per day) require release markers on dashboards and SLI
    change-detection. A deployment that degrades an SLI by 0.5% can exhaust weekly error budget in
    hours — you need automated rollback signals tied to SLO burn rate.

    </details>

22. Are any applications multi-tenant?

    <details><summary>Hint</summary>

    Multi-tenant apps need tenant ID as a label — but tenant ID is typically high-cardinality.
    Prefer log-level tenant attribution and aggregate metrics by tenant bucket (small/medium/large)
    rather than raw ID. Raw tenant ID in metric labels will blow up your cardinality budget.

    </details>

23. What are the data residency or sovereignty requirements?

    <details><summary>Hint</summary>

    EU data must stay in EU regions; APAC in APAC. This constrains whether you can use a single
    global Grafana Cloud stack or need regional stacks with federation for cross-region aggregation.
    Decide topology before picking a single-stack vendor.

    </details>

24. How many distinct teams own services, and do they operate independently?

    <details><summary>Hint</summary>

    Team count drives the multi-tenancy model. If > 5 teams, you need namespace/folder isolation in
    Grafana, per-team alerting namespaces, and a self-service onboarding process. Treating 20 teams
    as one is the fastest path to a shared-dashboard mess.

    </details>

---

## Phase 3: Identify Telemetry

25. What metrics should be collected?

    <details><summary>Hint</summary>

    Start with the Four Golden Signals (latency, traffic, errors, saturation) for every
    external-facing service, and USE metrics for every resource. Add business metrics (order rate,
    payment success rate) for P0 services. Everything else is secondary.

    </details>

26. What logs should be collected?

    <details><summary>Hint</summary>

    Structured JSON logs at INFO+ for normal operations, WARN/ERROR for exceptions, DEBUG on demand
    (never always-on in production). Include trace ID, span ID, service name, environment, and
    request ID in every log line.

    </details>

27. What traces should be collected?

    <details><summary>Hint</summary>

    All inbound requests to P0 services. Sample everything that results in an error or latency
    outlier. Apply head-based sampling for normal traffic (1–5%) and tail-based for anomaly capture.
    Never trace every request in high-volume services without sampling.

    </details>

28. Which events are important?

    <details><summary>Hint</summary>

    Deployments, config changes, scaling events, circuit-breaker trips, and scheduled job
    executions. These are the "what changed?" signals that correlate with metric inflections on
    dashboards. Inject them as Grafana annotations.

    </details>

29. Which telemetry already exists?

    <details><summary>Hint</summary>

    Audit first: most cloud services expose Prometheus metrics natively; Kubernetes exposes cAdvisor
    and kube-state-metrics; cloud providers have native metrics (Azure Monitor). Avoid duplicating
    what's already there.

    </details>

30. What telemetry is missing?

    <details><summary>Hint</summary>

    Trace propagation across async boundaries, business-level metrics, SLI-aligned metrics (not just
    "is it up"), and synthetic probes for external availability. These are the most common gaps.

    </details>

31. Which telemetry provides the highest value?

    <details><summary>Hint</summary>

    Rank by: (1) directly maps to an SLI, (2) appeared in the last 5 post-mortems, (3) reduces mean
    time to diagnose. Anything that doesn't hit one of these three criteria is noise.

    </details>

32. What is the expected metric cardinality per service?

    <details><summary>Hint</summary>

    Estimate: (number of label combinations) × (active instances). A service with 5 labels each with
    10 values = 100,000 potential series. In practice, active series are far fewer — but unbounded
    labels (user ID, request ID) can blow past any budget instantly.

    </details>

33. Which labels have unbounded or high-churn values (user IDs, request IDs, raw timestamps)?

    <details><summary>Hint</summary>

    Common offenders: `user_id`, `customer_id`, `request_id`, `session_id`, `pod_name` (in
    auto-scaled environments), raw URL path (before normalization). These belong in logs and trace
    attributes, not metric labels. Drop or hash them at the pipeline.

    </details>

34. What is the acceptable active series budget for the platform as a whole?

    <details><summary>Hint</summary>

    Set a hard budget before onboarding any services: e.g., 500k active series per environment, 50k
    per team. Enforce with Alloy's `metric_relabel_configs` or Mimir per-tenant limits. Alert when a
    team hits 80% of their quota.

    </details>

35. Which telemetry signals can be derived from others (e.g., logs → metrics via Loki recording
    rules)?

    <details><summary>Hint</summary>

    Loki recording rules can generate request-rate metrics from log lines when the app doesn't
    expose Prometheus metrics. The OTel Span Metrics connector derives RED metrics from trace spans.
    Use derivation when adding instrumentation to the app is blocked.

    </details>

---

## Phase 4: Instrumentation

36. Can automatic instrumentation be used?

    <details><summary>Hint</summary>

    Yes for HTTP, gRPC, and most database clients in Java, Python, Go, and Node.js via OTel
    auto-instrumentation agents. Default to auto-instrumentation first — it covers 80% of the
    surface with zero code changes and uses stable semantic conventions.

    </details>

37. Is manual instrumentation needed?

    <details><summary>Hint</summary>

    Yes for: business events (payment processed, user registered), async Kafka consumer spans,
    custom attributes not captured by auto-instrumentation, and background workers/scheduled jobs
    that the auto-agent can't see.

    </details>

38. Which OpenTelemetry SDK should be used?

    <details><summary>Hint</summary>

    Match the SDK to the language. Use the stable release channel, not RC or alpha. Pin to a
    specific minor version in your dependency manifest. For new services, start with the SDK's
    zero-code auto-instrumentation before adding manual spans.

    </details>

39. Which semantic conventions apply?

    <details><summary>Hint</summary>

    Use OTel semantic conventions (semconv) for all standard attributes: `http.method`,
    `http.status_code`, `db.system`, `messaging.system`, etc. This ensures data is compatible with
    off-the-shelf dashboards and reduces schema drift between teams.

    </details>

40. How should resources be identified?

    <details><summary>Hint</summary>

    Every telemetry signal must carry resource attributes: `service.name`, `service.version`,
    `service.namespace`, `deployment.environment`, `k8s.cluster.name`, `k8s.namespace.name`. Set
    these via the OTel SDK Resource or via Alloy's resource processor. Consistent resource
    attributes are the foundation of correlation.

    </details>

41. Which attributes should be attached?

    <details><summary>Hint</summary>

    On spans: `user.id` (hashed, not raw), `tenant.id` (bucketed), `feature.flag.name` if relevant.
    On metrics: environment, service, region. On logs: all of the above plus `trace_id`. Keep
    attribute count per signal under 20 — every attribute is storage cost.

    </details>

42. Which telemetry should not be collected?

    <details><summary>Hint</summary>

    Health-check endpoint spans (noisy, zero value). Debug-level traces for hot paths in production.
    Raw PII in any signal. High-frequency polling metrics at <15s scrape intervals unless the use
    case explicitly requires it.

    </details>

43. Where will exemplars be emitted, and how will they link metric data points to trace spans?

    <details><summary>Hint</summary>

    Configure the Prometheus SDK or OTel SDK to attach exemplars to histogram buckets. Exemplars
    carry the trace ID of the request that produced that observation, enabling a one-click jump from
    a latency spike in Grafana to the corresponding trace in Tempo.

    </details>

44. What is the head-based versus tail-based sampling decision for traces?

    <details><summary>Hint</summary>

    Head-based: decision at trace start — simple, low overhead, but can't sample based on outcome
    (you'll miss rare errors). Tail-based: decision after the full trace is assembled — can target
    100% error traces + 1% normal traffic. Default: head-based at 5% + 100% error traces via OTel
    Collector's tail-sampling processor.

    </details>

45. How will SDK versions be pinned and upgraded across services?

    <details><summary>Hint</summary>

    Pin to a specific minor version in your base Dockerfile/requirements.txt/go.mod. Track OTel SDK
    changelogs for breaking changes. Treat SDK upgrades as a release event — run your standard
    integration test suite against the new version before rolling out.

    </details>

46. How will instrumentation correctness be validated before it reaches production?

    <details><summary>Hint</summary>

    Run the service locally with `OTEL_EXPORTER_OTLP_ENDPOINT` pointed at a dev collector. Use
    `otel-cli` or Jaeger UI to verify spans are emitting with correct attributes. Write integration
    tests that assert trace propagation headers are present on outbound calls.

    </details>

---

## Phase 5: Collection

47. How will telemetry leave the application?

    <details><summary>Hint</summary>

    Via OTLP/gRPC or OTLP/HTTP to the nearest collector. Never write directly to a storage backend
    from the application — the collector is the buffer, filter, and router layer between your app
    and the backend.

    </details>

48. Push or pull?

    <details><summary>Hint</summary>

    Push (OTLP) for traces and logs — always. Metrics: pull (Prometheus scrape) if the app is
    already Prometheus-native; push (OTLP) for new services. Pull requires the scraper to reach the
    app; push works across network boundaries. In Kubernetes, Prometheus scrape via Alloy is the
    default for metrics.

    </details>

49. Which protocols are supported?

    <details><summary>Hint</summary>

    OTLP/gRPC is the primary standard. Prometheus remote-write for metrics from existing stacks.
    Loki push API for logs from legacy shippers. Normalize everything to OTLP at the collector
    boundary — one protocol to one backend is far simpler to operate.

    </details>

50. Should we use OTLP?

    <details><summary>Hint</summary>

    Yes, as the primary protocol. OTLP is the vendor-neutral standard, supported by Alloy, the OTel
    Collector, Grafana Cloud, and every major backend. Deviating from OTLP requires translation
    layers that add latency and failure modes.

    </details>

51. Where should collectors run?

    <details><summary>Hint</summary>

    Agent-mode collectors run on every node (DaemonSet in Kubernetes) for node-level metrics and log
    file tailing. Gateway-mode collectors run as a Deployment for cross-team routing, tail sampling,
    and backend fan-out. Both are needed in production.

    </details>

52. Sidecar, DaemonSet, or Gateway?

    <details><summary>Hint</summary>

    DaemonSet for per-node collection (node metrics, log files, Kubernetes metadata enrichment).
    Gateway for global operations (routing, tail sampling, PII scrubbing, backend fan-out). Sidecar
    only for hard isolation requirements — avoid by default; DaemonSet is operationally simpler.

    </details>

53. Should we use Grafana Alloy or the OpenTelemetry Collector?

    <details><summary>Hint</summary>

    Grafana Alloy if your backend is Grafana Cloud (native integration, River config language,
    Prometheus-compatible scraping). OTel Collector if you need maximum vendor neutrality or your
    team already operates it. They're compatible at the OTLP protocol level — you can run both if
    needed.

    </details>

54. What happens if a collector fails?

    <details><summary>Hint</summary>

    The app SDK's export queue buffers in memory for a configurable duration (default 5 minutes of
    retries). Beyond that, telemetry is dropped — this is acceptable for observability data. Never
    let collector failure block application traffic. Use the dead-man's-switch alert to detect
    silent pipelines.

    </details>

55. How will backpressure be handled when the downstream backend is slow or unavailable?

    <details><summary>Hint</summary>

    Configure `sending_queue` and `retry_on_failure` in the OTel Collector/Alloy exporter. Set a max
    queue size in bytes, not in items (easier to reason about memory). Use persistent queue
    (disk-backed) only for critical signals where dropping is not acceptable.

    </details>

56. What are the retry and timeout settings for failed exports?

    <details><summary>Hint</summary>

    Initial retry interval: 5s. Max retry interval: 30s. Total timeout before drop: 5 minutes. These
    are the OTel Collector defaults and are reasonable starting points. Increase for backends with
    scheduled maintenance windows; decrease if you want faster failure detection.

    </details>

57. How will collector instances be load-balanced for high ingest volume?

    <details><summary>Hint</summary>

    For OTLP/gRPC push: put a load balancer (k8s Service, Envoy) in front of gateway collectors. For
    tail sampling specifically, use the OTel Collector's `loadbalancingexporter` — it must route all
    spans of a trace to the same collector instance using consistent hashing by trace ID.

    </details>

58. What is the expected throughput capacity per collector, and how many are needed?

    <details><summary>Hint</summary>

    A single OTel Collector instance handles approximately 10k–50k spans/sec and 50k–200k metric
    data points/sec depending on processors configured. Benchmark in your environment; add 3×
    headroom for burst. DaemonSet instances are sized per node; gateway instances are sized for
    global peak.

    </details>

59. Should a fan-in (aggregating gateway) or fan-out (per-team collectors) topology be used?

    <details><summary>Hint</summary>

    Fan-in (multiple app collectors → single gateway) simplifies routing and PII scrubbing but
    creates a central failure point. Recommended: DaemonSet fan-in to a small gateway tier (2–3
    instances for HA), then fan-out from gateway to backends. This balances operational simplicity
    against resilience.

    </details>

---

## Phase 6: Processing

60. Should telemetry be filtered?

    <details><summary>Hint</summary>

    Yes. Drop health-check spans, debug-level logs in production, and metrics with no dashboard or
    alert consumers. "Collect everything" is a cost strategy, not an observability strategy. Filter
    at the pipeline, not at the backend.

    </details>

61. Should it be enriched?

    <details><summary>Hint</summary>

    Yes. Add Kubernetes metadata (pod name, namespace, node, cluster) via the k8s attributes
    processor. Add environment (dev/qa/prod) from a resource attribute or label. Enrichment at the
    collector is cheaper than enriching at query time.

    </details>

62. Should sensitive information be removed?

    <details><summary>Hint</summary>

    Always. Use the `transform` or `redaction` processor to scrub PII from log bodies and span
    attributes before data leaves the cluster. Define a PII pattern list (email regex, credit card
    regex, phone regex) and apply it at every pipeline stage.

    </details>

63. Should logs be parsed?

    <details><summary>Hint</summary>

    Parse structured JSON logs with the JSON parser and extract fields as log attributes. Parse
    semi-structured logs with regex or Loki's pipeline stages. Parsed fields become queryable — but
    add them selectively; every parsed field that becomes a label increases Loki cardinality.

    </details>

64. Should metrics be aggregated?

    <details><summary>Hint</summary>

    Pre-aggregate high-cardinality metrics at the collector before shipping. For example, aggregate
    per-pod metrics to per-deployment. This reduces active series in Mimir/Prometheus and lowers
    ingest cost. Use OTel's `metricstransform` processor or Alloy's `prometheus.relabel` component.

    </details>

65. Should traces be sampled?

    <details><summary>Hint</summary>

    Yes in production. 100% trace collection is prohibitively expensive at scale. Start with 5% head
    sampling + 100% error/slow traces. Tune after measuring storage cost. Never sample in
    development — full visibility is needed to catch bugs.

    </details>

66. Which processors are required?

    <details><summary>Hint</summary>

    Minimum: `batch` (reduce export calls), `memory_limiter` (prevent OOM), `resource` (add/override
    resource attributes), `k8sattributes` (Kubernetes metadata enrichment). Add `transform` for PII
    scrubbing and `filter` for noise removal as needed.

    </details>

67. How will metric cardinality be capped at the pipeline level before it reaches the backend?

    <details><summary>Hint</summary>

    Use `metric_relabel_configs` in Alloy's prometheus scrape block to drop high-cardinality labels
    before they enter the pipeline. Set per-tenant series limits in Mimir's `limits.yaml`. Alert
    when a single job contributes > 10% of the total series budget.

    </details>

68. How will PII be detected and scrubbed from log payloads and span attributes?

    <details><summary>Hint</summary>

    Define a regex-based pattern library for known PII (email, phone, SSN, credit card). Apply via
    OTel Collector's `redaction` processor on span attributes and log bodies. Run a quarterly audit
    query in Loki/Tempo to detect PII patterns that slipped through. Treat PII in telemetry as a P1
    security incident.

    </details>

69. What is the batching window and timeout configuration for each signal type?

    <details><summary>Hint</summary>

    `send_batch_size: 8192`, `send_batch_max_size: 0`, `timeout: 200ms` as starting defaults for the
    `batch` processor. For traces with tail sampling, increase timeout to allow spans to accumulate
    for the sampling decision (typically 5–10s).

    </details>

70. How will transform cost (CPU and memory per processor) be estimated and controlled?

    <details><summary>Hint</summary>

    Measure CPU/memory per processor stage in staging under production-like load. The `transform`
    and `routing` processors are the most expensive. Disable processors that aren't actively used.
    Pipeline cost scales linearly with ingest volume.

    </details>

---

## Phase 7: Routing

71. Where should metrics go?

    <details><summary>Hint</summary>

    Grafana Mimir (cloud) or self-hosted Prometheus + Thanos for long-term storage. Use remote-write
    from Alloy to Mimir. Multi-environment: separate Mimir tenants per environment, queried via
    Grafana's data source federation.

    </details>

72. Where should logs go?

    <details><summary>Hint</summary>

    Loki. Ship via Loki push API or OTLP from Alloy. Index only the labels needed for filtering
    (service, environment, level, trace_id). Everything else goes into the log body, not as a label.

    </details>

73. Where should traces go?

    <details><summary>Hint</summary>

    Grafana Tempo (cloud) or self-hosted Tempo. Ship via OTLP from Alloy. Tempo is object-storage
    backed and cost-efficient for traces. Configure trace search via Tempo's TraceQL.

    </details>

74. Should telemetry be sent to multiple destinations?

    <details><summary>Hint</summary>

    Yes for disaster recovery: primary backend (Grafana Cloud), secondary (regional object storage).
    Yes for cost: route low-value telemetry to cheaper cold storage. No for live debugging: don't
    duplicate expensive signals to multiple live backends simultaneously.

    </details>

75. What happens if one destination becomes unavailable?

    <details><summary>Hint</summary>

    The exporter's retry queue absorbs the failure for up to the configured max retry window (5
    minutes default). Beyond that, data is dropped. For P0 signal types, configure a fallback
    exporter in the OTel Collector pipeline. Alert on exporter send failures.

    </details>

76. What is the failover routing strategy when the primary backend is unreachable?

    <details><summary>Hint</summary>

    Use the OTel Collector's `failover` connector or a primary/secondary exporter pair with the
    `routing` processor checking backend health. For Grafana Cloud, rely on the vendor SLA and use
    persistent queue during outages rather than routing to a secondary.

    </details>

77. Should a secondary destination receive a copy for disaster recovery?

    <details><summary>Hint</summary>

    For metrics: replicate to a cold S3 bucket via Alloy's remote-write with a thanos-receive
    secondary. For traces: Tempo already writes to object storage — configure a second bucket in a
    different region. For logs: dual-ship to Loki Cloud + an S3 bucket for audit retention.

    </details>

78. Is metadata-driven routing needed (e.g., route by team label or environment tag)?

    <details><summary>Hint</summary>

    Yes in multi-team environments. Route by `deployment.environment` (dev/qa/prod to separate Mimir
    tenants) and `team.id` (to separate Loki streams). Alloy's `loki.process` and
    `otelcol.processor.routing` support label-based routing decisions.

    </details>

---

## Phase 8: Storage

79. How long should metrics be retained?

    <details><summary>Hint</summary>

    13 months minimum (to compare year-over-year). High-resolution (15s) for 30 days; downsample to
    5-minute resolution for 13 months. Grafana Mimir's compactor handles downsampling automatically.

    </details>

80. How long should logs be retained?

    <details><summary>Hint</summary>

    30 days at full resolution in Loki for operational use. Archive to object storage (S3/Azure
    Blob) for 1–7 years depending on compliance requirements. Compliance-retained logs should be
    immutable (WORM bucket policy).

    </details>

81. How long should traces be retained?

    <details><summary>Hint</summary>

    7–14 days for operational debugging. Traces are the most storage-intensive signal — 14 days is
    typically sufficient since root-cause investigations happen within hours or days of an incident.
    Archive sampled error traces for 30 days if post-mortem timelines require it.

    </details>

82. Which backend should store each telemetry type?

    <details><summary>Hint</summary>

    Metrics → Mimir. Logs → Loki. Traces → Tempo. All three are purpose-built for their signal type
    and integrate natively in Grafana. Avoid general-purpose storage (Elasticsearch, ClickHouse)
    unless you have specific query requirements that justify the operational overhead.

    </details>

83. What storage tier should be used?

    <details><summary>Hint</summary>

    Hot (SSD-backed) for recent data (last 7 days for traces, last 30 days for metrics). Warm
    (object storage: S3/Azure Blob) for older data. Loki, Mimir, and Tempo all support
    object-storage backends natively — use this to keep costs manageable.

    </details>

84. What is the expected storage growth?

    <details><summary>Hint</summary>

    Estimate: (active series) × (bytes per sample) × (scrape interval) × (retention days). For 500k
    series at 15s scrape, ~2 bytes/sample: ≈ 1 TB/month uncompressed, ~100–200 GB compressed. Logs:
    highly variable by verbosity. Traces: depends on sampling rate and span attribute size.

    </details>

85. What hot/warm/cold tiering strategy applies for each signal type?

    <details><summary>Hint</summary>

    Hot (0–7 days): fast local disk or block storage, full-resolution queries. Warm (7–30 days):
    object storage, standard resolution. Cold (30+ days): deep archive (Azure Cool/Archive tier),
    accessed only for compliance or post-mortems. Automate transitions with lifecycle policies.

    </details>

86. How is multi-tenant storage isolation enforced?

    <details><summary>Hint</summary>

    Mimir, Loki, and Tempo support tenant isolation via the `X-Scope-OrgID` header. Each tenant's
    data is stored in a separate prefix in the object storage bucket. Query isolation is enforced by
    the gateway rejecting cross-tenant queries. Never allow tenants to query without a tenant header
    set.

    </details>

87. Is object storage (S3 / Azure Blob) used for long-term retention, and what is the compaction
    strategy?

    <details><summary>Hint</summary>

    Yes — all three backends in their scalable mode write to object storage. Use separate buckets
    per signal type and per environment. Enable versioning on compliance-retained buckets.
    Compaction (Mimir) and chunk merging (Loki) reduce long-term storage cost significantly.

    </details>

88. How are per-tenant storage quotas defined and enforced?

    <details><summary>Hint</summary>

    Via Mimir's `limits.yaml` (`ingestion_rate`, `max_series_per_tenant`) and Loki's per-tenant
    limits (`ingestion_rate_mb`, `max_streams_per_tenant`). Quotas are enforced at ingest time — the
    backend rejects over-limit writes with a 429. Alert at 80% of quota to give teams time to
    remediate.

    </details>

---

## Phase 9: Querying

89. How will engineers query metrics?

    <details><summary>Hint</summary>

    PromQL in Grafana for ad-hoc exploration and dashboard expressions. Provide a standard set of
    PromQL snippets (error rate, p99 latency, saturation) for the most common queries. Mimir's
    multi-tenancy means engineers query only their tenant's data.

    </details>

90. How will logs be searched?

    <details><summary>Hint</summary>

    LogQL in Grafana Explore or pre-built Loki dashboards. Two query patterns: (1) filter by label
    then search body (`{service="payments"} |= "error"`), (2) parse fields and aggregate. Full-body
    search is expensive — always start with label filters.

    </details>

91. How will traces be analyzed?

    <details><summary>Hint</summary>

    TraceQL in Grafana's Tempo data source. Common patterns: find traces by trace ID (from a log
    line), find all traces with duration > 2s for a service, find traces with a specific span error.
    Correlate to metrics via exemplars: click a latency spike → jump to trace.

    </details>

92. Which query languages are needed?

    <details><summary>Hint</summary>

    PromQL (metrics), LogQL (logs), TraceQL (traces). All three are available natively in Grafana.
    Don't introduce a fourth query language unless there's a hard requirement that none of these
    three can meet.

    </details>

93. How should dashboards be organized?

    <details><summary>Hint</summary>

    Three tiers: (1) Platform overview — one per environment, owned by the SRE/platform team. (2)
    Service dashboards — one per service, owned by the service team. (3) On-call triage dashboards —
    curated set of signal-correlation views for incident response. Folder structure in Grafana
    should be team-aligned.

    </details>

94. How are expensive queries (full log scans, high-cardinality metric queries) controlled or
    rate-limited?

    <details><summary>Hint</summary>

    Set query time limits in Mimir (`query_timeout`) and Loki (`query_timeout`, `query_limit`). Use
    Mimir's cardinality API to detect high-cardinality label selectors before they hit production.
    Rate-limit users from running full-scan LogQL queries in shared environments.

    </details>

95. Is query federation needed across multiple backends or environments?

    <details><summary>Hint</summary>

    Yes if you have separate backends per environment or per region. Grafana supports
    multi-datasource federation natively — configure one data source per Mimir tenant and use
    Grafana's mixed data source for cross-environment dashboards. For cross-region, use Mimir's
    query-federation or Thanos querier.

    </details>

96. Are there cardinality guards to prevent query-time explosions on high-series label selectors?

    <details><summary>Hint</summary>

    Configure Mimir's `max_fetched_series_per_query` and `max_fetched_chunks_per_query` limits.
    These prevent a single bad PromQL query from OOM-ing the query frontend. Set Loki's
    `max_entries_limit_per_query`. Surface these limits as friendly error messages in Grafana, not
    opaque 500s.

    </details>

---

## Phase 10: Correlation

97. How are metrics linked to logs?

    <details><summary>Hint</summary>

    Via shared labels: every log line must carry `service`, `environment`, and `pod` labels that
    match the metric labels. In Grafana, configure data links on metric panels that open a Loki
    Explore query pre-filtered to the same service/time window.

    </details>

98. How are logs linked to traces?

    <details><summary>Hint</summary>

    Inject `trace_id` and `span_id` into every log line (OTel's log bridge API does this
    automatically). In Grafana, the Loki data source detects `trace_id` fields and renders a link to
    Tempo. The link is zero-config if both data sources are configured and the field name matches.

    </details>

99. How are traces linked to metrics?

    <details><summary>Hint</summary>

    Via exemplars: histogram metrics carry exemplar data points with the `trace_id` of the request.
    In Grafana, click any exemplar dot on a latency histogram panel to jump directly to that trace
    in Tempo.

    </details>

100.  Which labels are mandatory across all three signal types?

                                  <details><summary>Hint</summary>

      `service.name`, `deployment.environment`, `k8s.cluster.name` on every signal. Recommended:
      `service.version`, `k8s.namespace.name`. These are the correlation anchors — without them,
      cross-signal navigation breaks. Enforce via pipeline validation, not documentation.

                                  </details>

101.  Which IDs should be propagated (trace ID, span ID, request ID)?

                                  <details><summary>Hint</summary>

      W3C TraceContext (`traceparent`, `tracestate`) for distributed trace propagation across
      services. Propagate via HTTP headers, Kafka message headers, and gRPC metadata. Do not use B3
      headers for new services (legacy format). Ensure the OTel SDK is configured to extract and
      inject TraceContext on all outbound calls.

                                  </details>

102.  How are exemplars used to jump from a metric data point to its originating trace?

                                  <details><summary>Hint</summary>

      Configure your Prometheus SDK or OTel SDK to emit exemplars on histogram observations. In
      Grafana, enable "Exemplars" on histogram panels. Each dot represents a single request — click
      it to open the trace. This is the most powerful metric-to-trace jump available.

                                  </details>

103.  Is a service dependency graph maintained, and how is it derived from trace data?

                                  <details><summary>Hint</summary>

      Tempo generates a service graph automatically from trace data (the `spanmetrics` and
      `servicegraph` processors). Visualize in Grafana's Service Graph panel. The graph shows call
      rates, error rates, and latency between services — use it during incident triage to identify
      the failing hop.

                                  </details>

---

## Phase 11: Visualization

104. What dashboards are needed?

     <details><summary>Hint</summary>

     Minimum viable set: (1) Platform health (collector status, ingest rate, backend availability).
     (2) Per-service RED dashboard (rate, errors, duration). (3) Infrastructure USE dashboard (CPU,
     memory, disk, network). (4) SLO burn-rate dashboard per P0 service. (5) On-call triage
     overview.

     </details>

105. Who owns each dashboard?

     <details><summary>Hint</summary>

     Platform team: platform health, on-call triage, SLO overview. Service teams: their service RED
     dashboards and application-specific business metric views. Clear ownership means someone is
     paged when a dashboard breaks after a schema change.

     </details>

106. Which KPIs matter?

     <details><summary>Hint</summary>

     Operational KPIs: MTTR, alert-to-noise ratio, SLO compliance rate, onboarding time per service.
     Business KPIs: whatever the business measures (order success rate, checkout latency, API
     availability). Both sets belong in observability dashboards.

     </details>

107. Which RED metrics are needed?

     <details><summary>Hint</summary>

     Rate (requests/sec), Errors (error rate %), Duration (p50/p90/p99/p999 latency). Apply RED to
     every service that receives external requests. Express error rate as:
     `sum(rate(http_requests_total{service="X",status=~"5.."}[5m])) / sum(rate(http_requests_total{service="X"}[5m]))`.

     </details>

108. Which USE metrics are needed?

     <details><summary>Hint</summary>

     Utilization (% of resource in use), Saturation (queue depth, wait time), Errors (I/O errors,
     dropped packets). Apply USE to every infrastructure resource: CPU, memory, disk I/O, network
     interface, database connections.

     </details>

109. Which Golden Signals are required?

     <details><summary>Hint</summary>

     Latency, Traffic, Errors, Saturation — across all P0 services. These are the minimum signals
     for an on-call engineer to assess system health in under 60 seconds. Put them on a single pane
     of glass in the primary on-call dashboard.

     </details>

110. Are dashboards managed as code (Terraform, Grafonnet, JSON model files in Git)?

     <details><summary>Hint</summary>

     Yes — use Grafana's JSON model exported to Git, or Terraform's `grafana_dashboard` resource, or
     Grafonnet (Jsonnet library). Dashboard-as-code enables PR review, change history, and
     environment promotion. Never create production dashboards manually and expect them to survive.

     </details>

111. What is the folder and team organization in Grafana?

     <details><summary>Hint</summary>

     One folder per team. Inside each folder: service dashboards, SLO dashboards, and on-call views.
     A shared `Platform` folder for global dashboards. Use Grafana's RBAC to allow teams to edit
     their own folder but not others'.

     </details>

112. How are dashboard variables templatized for multi-service or multi-environment reuse?

     <details><summary>Hint</summary>

     Use Grafana template variables for `$env`, `$service`, `$namespace`, `$cluster`. Source them
     from metric labels or Grafana's built-in datasource queries. Apply `$__rate_interval` for rate
     calculations to make dashboards zoom-level-aware. One parameterized dashboard serves N
     services.

     </details>

113. How are dashboard changes reviewed and promoted across environments?

     <details><summary>Hint</summary>

     Dashboards are stored in Git. CI validates JSON syntax and checks for required panels (error
     rate, latency, saturation). Merge to main auto-applies to staging. A manual approval step
     promotes to production. Never hotpatch production dashboards — fix in Git.

     </details>

---

## Phase 12: Alerting

114. What should generate alerts?

     <details><summary>Hint</summary>

     Only conditions that require human action within minutes: SLO burn rate violations,
     availability below SLA threshold, resource saturation above 90%. Not: brief latency spikes that
     auto-recover, informational log patterns, anything without a runbook.

     </details>

115. What severity levels exist?

     <details><summary>Hint</summary>

     P1 (Critical): service down or SLO burn rate unsustainable — page immediately. P2 (High):
     degraded performance, error budget burning faster than target — respond within 1 hour. P3
     (Medium): warning trend, no current impact — address during business hours. P4 (Low):
     informational, review weekly.

     </details>

116. Which alerts are actionable?

     <details><summary>Hint</summary>

     An alert is actionable if: (1) there is a runbook for it, (2) a human can take a defined action
     to resolve or mitigate it, (3) it doesn't auto-resolve within 5 minutes without intervention.
     Review every alert against these three criteria quarterly.

     </details>

117. How should alerts be routed?

     <details><summary>Hint</summary>

     By service ownership (team label) → team Slack channel and on-call rotation. By severity (P1) →
     PagerDuty/Grafana IRM immediate page. By environment (prod vs dev/qa) → separate routing trees.
     Use Alertmanager routing trees or Grafana IRM contact points.

     </details>

118. Who receives them?

     <details><summary>Hint</summary>

     P1 in prod: on-call engineer via PagerDuty page. P2 in prod: team Slack channel. P3: async
     Slack notification. P4: weekly digest. Dev/QA alerts: team Slack only, no pages. Never page for
     non-production environments.

     </details>

119. How do we reduce alert fatigue?

     <details><summary>Hint</summary>

     Inhibition rules (silence child alerts when parent fires), deduplication (group related
     alerts), evaluation window tuning (avoid alerts on transient 1-minute spikes), and ruthless
     pruning (delete any alert firing for 30+ days without a corresponding incident). Alert volume
     is a KPI — track it monthly.

     </details>

120. Are SLO burn-rate alerts implemented using multi-window, multi-burn-rate thresholds?

     <details><summary>Hint</summary>

     Yes — this is the most important alerting pattern. Two-window, two-threshold: (1) fast: 5min +
     1hr window at 14.4× burn → page immediately. (2) slow: 6hr + 3day window at 1× burn → ticket.
     This gives both early warning and sustained burn detection. Use Grafana's SLO feature or
     Prometheus recording rules.

     </details>

121. How are alerts linked to runbooks?

     <details><summary>Hint</summary>

     Every alert rule must include a `runbook_url` annotation pointing to a specific runbook (not a
     generic doc). The runbook URL appears in PagerDuty/IRM notifications. If an alert fires and no
     runbook exists, create one before closing the incident.

     </details>

122. What inhibition rules prevent cascading alert storms from a single root cause?

     <details><summary>Hint</summary>

     Example: inhibit all service-level alerts when a cluster-level "node not ready" alert is
     firing. Inhibit downstream service alerts when an upstream dependency alert fires. Define
     inhibition rules per dependency topology, not generically.

     </details>

123. How are alerts tested (unit-tested via promtool or integration-tested) before reaching
     production?

     <details><summary>Hint</summary>

     Use `promtool test rules` for unit-testing Prometheus recording rules and alert expressions
     with synthetic input data. Test that the alert fires and resolves under expected conditions.
     Alert rule changes go through the same PR → staging → production pipeline as dashboards.

     </details>

124. Is there a dead-man's-switch alert to detect when the telemetry pipeline goes silent?

     <details><summary>Hint</summary>

     Yes. Configure an "always firing" synthetic alert that must be silenced by an active heartbeat
     from the collection pipeline. If the pipeline stops sending (collector crash, network
     partition), the heartbeat disappears and the dead-man alert fires. This catches silent
     telemetry loss that no other alert would detect.

     </details>

---

## Phase 13: Incident Response

125. How is an incident detected?

     <details><summary>Hint</summary>

     Via automated alerts (preferred) or customer reports (worst case). Automated detection should
     fire within 2–5 minutes of a threshold breach. Measure time-to-detect as an SLI. If customer
     reports are the primary detection mechanism, your alerting is broken.

     </details>

126. How is an incident investigated?

     <details><summary>Hint</summary>

     Structured triage flow: (1) Check the on-call triage dashboard — one service or the whole
     platform? (2) Check SLO burn rate — how fast is error budget draining? (3) Correlate the
     timeline: what changed? (4) Drill into the affected service with RED + trace exploration.

     </details>

127. Which dashboards are used first?

     <details><summary>Hint</summary>

     The platform-wide on-call triage dashboard (all P0 services' error rates and latency on one
     pane). This immediately scopes the blast radius. Then the specific service RED dashboard for
     the affected service.

     </details>

128. Which logs are checked next?

     <details><summary>Hint</summary>

     After confirming the service via metrics: filter Loki logs by `service` + `level=error` in the
     incident time window. Look for repeated error patterns, stack traces, or upstream dependency
     failures. Use `trace_id` from a failed trace to find the correlated log lines.

     </details>

129. Which traces help identify root cause?

     <details><summary>Hint</summary>

     Traces with error spans show exactly which hop in the call chain failed and why. Filter Tempo
     for error traces on the affected service in the incident window. A single error trace often
     reveals the root cause in < 5 minutes — which is why tail sampling must capture 100% of error
     traces.

     </details>

130. How is MTTR reduced?

     <details><summary>Hint</summary>

     By shortening each phase: detection (alert within 2 minutes), triage (on-call dashboard within
     5 minutes), root cause (correlated signals within 15 minutes), mitigation (runbook automation).
     MTTR reduction is the primary ROI metric for the observability platform.

     </details>

131. Is AIOps used for alert correlation and noise reduction across signals?

     <details><summary>Hint</summary>

     Yes for noise reduction — Grafana IRM, BigPanda, or OpsGenie AI correlate related alerts into a
     single incident, suppressing the storm. A single cloud zone failure can generate hundreds of
     redundant alerts. AIOps should reduce alert-to-incident ratio to < 5:1.

     </details>

132. What is the escalation path if the first responder cannot resolve within a defined window?

     <details><summary>Hint</summary>

     L1 on-call: first 15 minutes. L2 (service team lead): 15–30 minutes if unresolved. L3
     (platform/architect): 30+ minutes or P1 with customer impact. Escalation paths must be codified
     in IRM, not tribal knowledge. Test them quarterly via DR drills.

     </details>

133. Are runbooks automated, semi-automated, or manual — and is that the right split for each
     scenario?

     <details><summary>Hint</summary>

     Partial automation is the target state: runbooks should have manual steps replaced by scripts
     where possible (scale up a Deployment, restart a stuck pod, drain a queue). Full automation is
     for well-understood, repeating failure modes only — unknown failure modes need human judgment.

     </details>

134. How are post-mortems fed back into improvements in alerts, dashboards, and runbooks?

     <details><summary>Hint</summary>

     Every P1/P2 incident generates a blameless post-mortem within 48 hours. Action items land in
     the backlog as alert improvements, dashboard additions, or runbook updates. Review open
     post-mortem action items monthly — unclosed items are observability debt.

     </details>

---

## Phase 14: Reliability

135. What happens if Grafana is unavailable?

     <details><summary>Hint</summary>

     Metrics and alerts continue to work (Prometheus/Mimir evaluate rules independently of Grafana).
     On-call engineers lose the visualization layer but can query Mimir/Loki/Tempo directly via
     their HTTP APIs or CLI tools (`logcli`, `tempoQuery`). Pre-document backup query commands in
     runbooks.

     </details>

136. What happens if Alloy fails?

     <details><summary>Hint</summary>

     Applications buffer outbound telemetry in the SDK's export queue (typically 5 minutes). After
     that, telemetry is dropped. Deploy Alloy as a DaemonSet with `restartPolicy: Always` and
     resource limits that prevent OOM. Alert on Alloy pod restarts and export failure rates.

     </details>

137. What happens if Mimir is unavailable?

     <details><summary>Hint</summary>

     Metrics are lost for the outage duration (remote write queue is finite). Alerting based on
     Prometheus rules stops. Mitigate: multi-zone Mimir deployment (3 availability zones). For
     Grafana Cloud, rely on the vendor SLA and use the persistent queue in Alloy.

     </details>

138. What happens if Loki is unavailable?

     <details><summary>Hint</summary>

     Logs are dropped — unlike metrics, logs cannot be replayed from a queue once dropped. Mitigate:
     write logs to a local file buffer + ship to Loki via a persistent queue. For
     compliance-retained logs, dual-ship to object storage to ensure durability independent of Loki
     availability.

     </details>

139. What happens if Tempo is unavailable?

     <details><summary>Hint</summary>

     Traces are dropped. Traces are the most drop-tolerant signal (already sampled) — brief outages
     are acceptable. Alert on Tempo's ingestion endpoint health. For critical trace data (100% error
     traces), configure a secondary OTLP endpoint in Alloy as a fallback.

     </details>

140. How is high availability achieved?

     <details><summary>Hint</summary>

     Each component (Mimir, Loki, Tempo) runs in distributed mode across 3+ replicas in separate
     availability zones. Alloy runs as a DaemonSet (one per node). Grafana runs as a Deployment with
     2+ replicas behind a load balancer. Object storage provides inherent durability.

     </details>

141. Is the observability platform itself monitored (meta-monitoring)?

     <details><summary>Hint</summary>

     Yes — meta-monitoring is non-negotiable. Run a separate lightweight monitoring stack (or use
     Grafana Cloud's built-in meta-monitoring) that watches your primary stack. The meta-monitor
     must be independent of the stack it monitors.

     </details>

142. What are the collector health metrics, and are they alerted on?

     <details><summary>Hint</summary>

     Key Alloy/OTel Collector metrics to alert on: `otelcol_exporter_send_failed_spans`,
     `otelcol_exporter_queue_capacity` (saturation), `otelcol_receiver_refused_metric_points`,
     `prometheus_remote_storage_failed_samples_total`. Dashboard these on the platform health
     overview.

     </details>

143. What is the degraded-mode operation plan when telemetry is partially or fully lost?

     <details><summary>Hint</summary>

     Tiered degraded modes: (1) Visualization degraded (Grafana down) — use CLI queries. (2)
     Collection degraded (Alloy down) — metrics/logs lost, alerts still fire from cached Prometheus
     rules. (3) Storage degraded (Mimir/Loki down) — collection queues up, querying fails, alerts
     pause. Each mode has a documented response procedure.

     </details>

---

## Phase 15: Scalability

144. How much telemetry is generated per second?

     <details><summary>Hint</summary>

     Measure current: use `otelcol_receiver_accepted_metric_points` and
     `otelcol_receiver_accepted_spans` from your collectors. Project forward based on onboarding
     roadmap. Design for 3× current peak as your capacity target.

     </details>

145. How many applications are onboarded?

     <details><summary>Hint</summary>

     Track onboarding as a metric: `services_with_traces / total_services`,
     `services_with_slo / total_services`. These coverage metrics are the observability platform's
     own SLIs. Report monthly to stakeholders.

     </details>

146. How many collectors are needed?

     <details><summary>Hint</summary>

     Gateway collectors: start with 3 (for HA), scale horizontally as ingest grows. DaemonSet
     collectors: one per node (automatic). Size each gateway instance for 2× current peak
     throughput. Monitor `otelcol_exporter_queue_capacity` — if consistently > 50%, add instances.

     </details>

147. How will storage scale?

     <details><summary>Hint</summary>

     Object-storage-backed Loki, Mimir, and Tempo scale horizontally by adding ingester/distributor
     replicas. Object storage is effectively infinite. The bottleneck is compactor and query
     throughput, not raw storage. Pre-plan compactor scaling with 6-month projections.

     </details>

148. How will query performance change?

     <details><summary>Hint</summary>

     Query performance degrades with data volume. Mitigate: pre-compute frequently-used PromQL as
     recording rules. Use Loki's bloom filters for log search. Enforce label cardinality limits so
     metric queries don't fan out to millions of series. Cache query results at the Grafana layer
     for dashboard loads.

     </details>

149. Which bottlenecks are likely?

     <details><summary>Hint</summary>

     #1: metric cardinality (Mimir memory pressure). #2: Loki ingest rate (distributor
     backpressure). #3: collector CPU (transform processors on hot path). #4: object storage API
     rate limits during compaction. Profile each at 3× current load before hitting them in
     production.

     </details>

150. What per-tenant cardinality and ingest rate limits are enforced?

     <details><summary>Hint</summary>

     Mimir `limits.yaml`: `ingestion_rate: 50000` (samples/sec),
     `max_global_series_per_tenant: 500000`. Loki: `ingestion_rate_mb: 20`,
     `max_global_streams_per_tenant: 10000`. These prevent a single misbehaving service from
     crowding out other tenants.

     </details>

151. How is the remote write queue sized for burst scenarios?

     <details><summary>Hint</summary>

     Configure `remote_write.queue_config.capacity` and `max_samples_per_send` in Alloy. The queue
     must hold at least 5 minutes of peak ingest during a backend outage without OOM-ing the
     collector. Validate by injecting a 5-minute backend blackhole in staging.

     </details>

152. At 10× current load, which component fails first?

     <details><summary>Hint</summary>

     Run a load test in staging at 10× current ingest rate. Monitor: Mimir ingester memory
     (typically the first to break), Loki distributor CPU, Alloy gateway memory queue, object
     storage PUT request rate. The answer is environment-specific — measure it, don't assume.

     </details>

---

## Phase 16: Security

153. How is telemetry encrypted in transit and at rest?

     <details><summary>Hint</summary>

     In transit: TLS on all OTLP/gRPC and remote-write connections (enforce `tls_config` in Alloy;
     reject plain HTTP exporters). At rest: enable server-side encryption on the object storage
     bucket (AES-256 or Azure Storage Service Encryption).

     </details>

154. How are collectors authenticated to backends?

     <details><summary>Hint</summary>

     Alloy/OTel Collector authenticates to Grafana Cloud via access-policy tokens (`glc_` prefix,
     not `glsa_` service-account tokens). Tokens are stored in Kubernetes Secrets, mounted as
     environment variables. Never embed tokens in config files committed to Git.

     </details>

155. How are tenants isolated from each other's data?

     <details><summary>Hint</summary>

     Mimir, Loki, and Tempo enforce isolation via the `X-Scope-OrgID` HTTP header. The gateway
     injects and validates this header. Tenants cannot override the header value — it's set by the
     gateway based on the authenticated client identity, not the client's self-reported ID.

     </details>

156. How is RBAC implemented for dashboard and data access?

     <details><summary>Hint</summary>

     Grafana's built-in RBAC: Viewers read dashboards, Editors create/modify in their team folder,
     Admins manage data sources. Data-layer RBAC: Mimir per-tenant isolation (already enforced). For
     fine-grained row-level access, Loki's label-based access control policies apply.

     </details>

157. Which secrets must be protected, and how are they supplied to collectors at runtime?

     <details><summary>Hint</summary>

     Grafana Cloud API tokens, Mimir/Loki write tokens, Alertmanager receiver credentials (PagerDuty
     API key, Slack webhook URL). Store in Azure Key Vault or Kubernetes External Secrets Operator.
     Never in config maps, environment variable literals, or Git-tracked files.

     </details>

158. Which compliance requirements apply?

     <details><summary>Hint</summary>

     Map your signals against your compliance framework. GDPR: no PII in metrics labels or log
     bodies. SOC2: audit trail for data access, retention policy enforcement. HIPAA: PHI must not
     appear in any telemetry pipeline. Document which signals were audited and when.

     </details>

159. How are access tokens rotated, and what is the rotation frequency?

     <details><summary>Hint</summary>

     Grafana Cloud access-policy tokens: rotate every 90 days via automated pipeline (GitHub Actions
     or Azure DevOps). Flow: create new token → update Kubernetes Secret → rolling restart of
     collectors → validate → revoke old token. Alert if a token is > 80 days old.

     </details>

160. Is there a network policy controlling which collector pods can egress to which endpoints?

     <details><summary>Hint</summary>

     Yes — apply Kubernetes NetworkPolicy to restrict Alloy DaemonSet pods: allow egress only to the
     Grafana Cloud OTLP/remote-write endpoint IP ranges, Kubernetes API server (for metadata
     enrichment), and internal cluster services. Deny all other egress.

     </details>

161. Is access to observability data audited, and are audit logs retained separately from
     operational logs?

     <details><summary>Hint</summary>

     Grafana Cloud logs API access. Enable access logging on the Mimir/Loki query frontend. Store
     audit logs separately in a WORM-configured bucket so they can't be tampered with. Review
     quarterly for anomalous patterns.

     </details>

---

## Phase 17: Cost

162. What drives observability costs?

     <details><summary>Hint</summary>

     In priority order: (1) metric cardinality (active series × retention = Mimir storage and
     compute cost). (2) Log ingest volume (Loki charges per GB). (3) Trace volume (Tempo charges per
     GB). (4) Query compute (dashboard refresh rate × query cost). Address cardinality first — it's
     almost always the biggest lever.

     </details>

163. Which telemetry is most expensive?

     <details><summary>Hint</summary>

     Metrics if cardinality is uncontrolled. Logs if verbosity is unchecked (DEBUG logs in
     production). Traces if sampling is off (100% collection at scale). The cost hierarchy is
     environment-specific — measure actual cost per signal type in your billing dashboard.

     </details>

164. Can telemetry volume be reduced?

     <details><summary>Hint</summary>

     Yes: drop health-check spans, aggregate per-pod metrics to per-deployment, increase scrape
     interval for non-critical services from 15s to 60s, apply tail sampling, filter DEBUG/TRACE
     logs at the pipeline. A 30–50% cost reduction from these changes is typical.

     </details>

165. Which retention policies optimize cost?

     <details><summary>Hint</summary>

     Downsampling: keep 5m-resolution data for 13 months, raw 15s resolution for only 30 days.
     Tiered storage: Loki chunks move to S3 infrequent-access after 30 days. Trace retention at 14
     days operational + archive of sampled error traces for 30 days. Each tier transition reduces
     cost 60–80% vs hot storage.

     </details>

166. Which sampling strategy minimizes cost without sacrificing root-cause visibility?

     <details><summary>Hint</summary>

     Tail-based sampling with: 100% error traces, 100% slow traces (p99 outliers), 1–5% of normal
     traces. This captures > 95% of valuable debugging information while discarding > 95% of trace
     volume. Never sample errors; aggressively sample the happy path.

     </details>

167. Is metric cardinality tracked as the primary ingest cost driver?

     <details><summary>Hint</summary>

     Yes — build a cardinality dashboard using Mimir's `/api/v1/cardinality/label_names` and
     `/label_values` APIs. Surface top-10 metrics by series count, top-10 labels by cardinality.
     Alert when a metric's series count doubles week-over-week.

     </details>

168. How is cost attributed to individual teams or tenants (FinOps tagging)?

     <details><summary>Hint</summary>

     Use `team` or `namespace` labels on all telemetry. In Grafana Cloud, per-tenant usage is
     available via the usage API. Build a cost attribution dashboard showing monthly ingest by
     team/service. Share monthly with team leads — visibility drives behavior change faster than
     quotas alone.

     </details>

169. Is there an ingest budget per team, and how is overrun handled?

     <details><summary>Hint</summary>

     Set soft quotas (alert at 80%) and hard quotas (reject at 100%) per tenant in Mimir/Loki
     limits. When a team hits 80%, automatically open a ticket and schedule a cardinality review.
     Hard quota rejection is the backstop — teams should never reach it if the 80% alert is acted
     on.

     </details>

170. Which dashboards or alerts will surface cost anomalies before billing surprises arrive?

     <details><summary>Hint</summary>

     A FinOps dashboard showing: (1) daily ingest trend by signal type, (2) top-10 services by
     series count (metrics) and GB/day (logs), (3) week-over-week ingest change by team, (4)
     projected monthly cost vs budget. Alert when projected monthly cost exceeds budget by > 10%
     with 14 days remaining.

     </details>

---

## Phase 18: Operations

171. Who owns the observability platform?

     <details><summary>Hint</summary>

     A dedicated platform/SRE team owns the collection pipeline, storage backends, and shared
     dashboards. Service teams own their own instrumentation and service-specific dashboards. The
     boundary: platform team owns everything from the collector gateway inward; service teams own
     everything from their app outward to the collector.

     </details>

172. How are upgrades performed?

     <details><summary>Hint</summary>

     Alloy and backend upgrades follow a staged rollout: dev → qa → prod with a 48-hour bake time at
     each stage. Use Helm chart versioning with explicit image tags (never `latest`). Rollback plan:
     Helm rollback to the previous chart version.

     </details>

173. How is configuration managed?

     <details><summary>Hint</summary>

     All configuration (Alloy River configs, Mimir limits, Loki config, alerting rules) lives in
     Git. Changes go through PR review and CI validation (`alloy fmt`, `promtool check rules`).
     Config is applied via GitOps (ArgoCD or Flux) — no manual `kubectl apply` on production
     configs.

     </details>

174. How is the platform monitored?

     <details><summary>Hint</summary>

     Via meta-monitoring (see Phase 14). Key platform SLIs: collector export success rate (target: >
     99.5%), Mimir ingest success rate (> 99.9%), Loki query success rate (> 99%), Tempo ingest
     success rate (> 99.5%).

     </details>

175. How are new services onboarded?

     <details><summary>Hint</summary>

     Via a golden-path template (Helm chart or OTel SDK configuration snippet) that pre-configures
     `service.name`, `deployment.environment`, resource attributes, and OTLP endpoint. A
     self-service guide walks teams through three steps: annotate the pod, point OTLP at the
     collector, verify in Grafana Explore. Target: < 30 minutes from zero to first trace.

     </details>

176. How are dashboards version controlled?

     <details><summary>Hint</summary>

     Dashboard JSON is stored in Git alongside the service code (or in a central dashboards
     repository). CI validates that dashboard JSON is parseable and contains required panels.
     Dashboard promotion (dev → prod) is a separate merge step.

     </details>

177. Is observability configuration managed via GitOps (ArgoCD, Flux, Terraform VCS)?

     <details><summary>Hint</summary>

     Yes — ArgoCD or Flux syncs Alloy configurations, Prometheus rule CRDs, and Grafana dashboard
     ConfigMaps from Git to the cluster. The cluster state is always a reflection of Git state.
     Direct cluster edits are rolled back by the next GitOps sync.

     </details>

178. Does the platform itself have defined SLOs, and who holds the error budget?

     <details><summary>Hint</summary>

     Yes. Example SLOs: (1) Telemetry delivery: 99.5% of spans delivered within 30s of emission. (2)
     Query availability: Mimir query API available 99.9% of the time. (3) Alert delivery: 99.9% of
     P1 alerts delivered to on-call within 2 minutes of threshold breach.

     </details>

179. Is there a runbook library for common platform operations (collector restart, quota override,
     backend failover)?

     <details><summary>Hint</summary>

     Yes. Common runbooks: collector pod restarting (check memory limits, export backlog), Mimir 429
     rate-limit errors (identify the over-quota tenant, apply temporary limit increase), Loki stream
     limit hit (identify the high-cardinality label, apply pipeline filter), Alertmanager not
     routing (check config reload status).

     </details>

180. How is the on-call rotation structured for the observability platform team?

     <details><summary>Hint</summary>

     One person on-call per week for platform P1/P2 issues. Escalation to the lead/architect for
     novel failures. A shared on-call calendar in PagerDuty/IRM, visible to all service teams. The
     platform on-call also acts as the first point of contact when service teams have
     instrumentation questions during incidents.

     </details>

---

## Phase 19: Architecture Review

181. Where are the single points of failure?

     <details><summary>Hint</summary>

     Gateway collector (if not replicated), Alertmanager (if single instance), object storage region
     (if single-region), and the meta-monitoring stack itself. List these explicitly in the
     architecture doc and assign a mitigation owner to each.

     </details>

182. Which components can fail independently?

     <details><summary>Hint</summary>

     Collection (Alloy) is independent of storage (Mimir/Loki/Tempo). Storage is independent of
     visualization (Grafana). Alerting rules evaluate independently of Grafana availability. Design
     for these independence boundaries — they determine your degraded-mode tiers.

     </details>

183. Which components can scale horizontally?

     <details><summary>Hint</summary>

     Alloy DaemonSet (scales with nodes), Mimir distributor/ingester, Loki distributor/ingester,
     Tempo distributor/ingester, Grafana (stateless, add replicas). The only
     non-trivially-horizontal component is the compactor — run one per tenant with appropriate
     resource limits.

     </details>

184. What assumptions have been made?

     <details><summary>Hint</summary>

     Document explicitly: assumed network bandwidth between collector and backend, assumed growth
     rate per quarter, assumed scrape interval for all services, assumed object storage durability.
     Unwritten assumptions are risks.

     </details>

185. What trade-offs were accepted?

     <details><summary>Hint</summary>

     Common ones to document: head sampling (simplicity) vs tail sampling (accuracy), managed cloud
     (cost) vs self-hosted (control), Grafana Alloy (tighter integration) vs OTel Collector (vendor
     neutrality), per-service dashboards (detail) vs fleet dashboards (overview). Each trade-off
     should have a revisit date.

     </details>

186. How could this design be simplified?

     <details><summary>Hint</summary>

     Ask this every 6 months: Can we eliminate a pipeline stage? Can two components be merged? Can
     we remove a deprecated backend? Complexity is technical debt in operational systems. The
     simplest architecture that meets the SLOs is the right architecture.

     </details>

187. How would this architecture change at 10× scale?

     <details><summary>Hint</summary>

     Gateway collectors need horizontal autoscaling based on queue depth. Mimir needs zone-aware
     replication across 3 AZs. Loki needs ruler-based federation for recording rules. Tempo needs
     trace search optimized with bloom filters. Object storage costs dominate — tiered storage and
     aggressive compaction become critical.

     </details>

188. Are architecture decisions captured in ADRs and linked from the design document?

     <details><summary>Hint</summary>

     Yes. Minimum ADRs to write: collector choice, sampling strategy, storage backend selection,
     tenant isolation model, cardinality budget policy. ADRs explain the "why" that the code cannot
     — without them, the same decisions get re-litigated with every new hire.

     </details>

189. Is there a gap tracker for known observability blind spots?

     <details><summary>Hint</summary>

     Maintain a "dark corners" table: services with no tracing, services with no SLO defined, alert
     rules without runbooks, dashboards without owners, compliance gaps. Review monthly. The gap
     tracker turns "we should get to that" into "we haven't closed this in 60 days."

     </details>

190. How will this architecture evolve as the OpenTelemetry specification matures?

     <details><summary>Hint</summary>

     OTel is still maturing: profiling signals are in beta, the logging bridge API is stabilizing,
     semantic conventions are versioned. Track the OTel specification changelog. Peg your SDK
     version to a stable release. Plan for a breaking semconv migration when the service schema you
     use is revised in a future release.

     </details>

---

## Phase 20: Multi-Tenancy

191. How are tenants defined (by team, service, environment, or business unit)?

     <details><summary>Hint</summary>

     Tenant = team is the most common model for an internal platform. Alternatively: tenant =
     environment (dev/qa/prod), or tenant = business unit. Choose one model and be consistent —
     mixing models creates routing complexity. The tenant ID flows as `X-Scope-OrgID` in
     Mimir/Loki/Tempo.

     </details>

192. What is the per-tenant quota model for ingest, storage, and query?

     <details><summary>Hint</summary>

     Three dimensions: ingest rate (samples/sec for metrics, MB/s for logs), active series/streams,
     and storage capacity. Set quotas proportional to team size and service criticality. Define a
     process for requesting quota increases (ticket with justification + cardinality analysis).

     </details>

193. How is tenant isolation enforced at the collection, storage, and query layers independently?

     <details><summary>Hint</summary>

     Collection: Alloy adds `X-Scope-OrgID` header based on source namespace/team label. Storage:
     Mimir/Loki/Tempo store each tenant's data in a separate object storage prefix. Query: gateway
     validates `X-Scope-OrgID` against authenticated identity and rejects cross-tenant queries. Test
     isolation by attempting a cross-tenant query in staging.

     </details>

194. Can tenants see each other's data, and is that intentional?

     <details><summary>Hint</summary>

     No by default. Grafana data source RBAC restricts which Mimir/Loki tenants a user can query.
     The only exception: a global SRE/platform team role that can query all tenants for incident
     response. This cross-tenant access must be logged and audited.

     </details>

195. How are per-tenant dashboards, alerting rules, and on-call policies managed?

     <details><summary>Hint</summary>

     Each team's dashboards live in their Grafana folder (RBAC-enforced). Alerting rules live in a
     per-team Prometheus rule namespace (e.g., `team-payments-alerts`). On-call contact points in
     IRM are team-specific. The platform team provides templates; teams customize within their
     namespace.

     </details>

196. What is the self-service process for a new tenant to onboard onto the platform?

     <details><summary>Hint</summary>

     A GitOps-driven onboarding PR: (1) add tenant config to `tenants.yaml`, (2) CI generates the
     Mimir/Loki limit entries, Grafana folder, and default alerting contact point, (3) PR merged →
     ArgoCD applies → team is live within 10 minutes. Target: zero manual steps for the platform
     team.

     </details>

197. How are tenant quotas reviewed and adjusted over time?

     <details><summary>Hint</summary>

     Monthly quota review: run the cardinality attribution query, share the top-10 consumers report
     with team leads. Quotas are adjusted quarterly based on demonstrated need + growth projection.
     Emergency quota increases are a manual approval process (ticket → platform-lead approval →
     applied within 1 hour).

     </details>

---

## Phase 21: SLO Implementation & Error Budget

198. How are SLIs defined and measured for each critical service?

     <details><summary>Hint</summary>

     SLIs must be measurable from existing telemetry. Common SLIs: availability (1 - error_rate),
     latency (% of requests < 200ms), correctness (% of responses with valid payload). Define SLIs
     in terms of specific PromQL or LogQL expressions, not English prose — the expression is the
     contract.

     </details>

199. Which backend stores SLO recording rules and error budget burn calculations?

     <details><summary>Hint</summary>

     Prometheus recording rules in Mimir (or Grafana Cloud's native SLO feature). Record the error
     rate and burn rate as separate time series: `slo:error_rate:5m`, `slo:burn_rate:1h`, etc. Store
     rule definitions in Git, applied via GitOps. Grafana's SLO feature auto-generates these but
     always export to Git.

     </details>

200. How is error budget burn tracked in real time, not just at the end of a rolling window?

     <details><summary>Hint</summary>

     Use the multi-window burn rate formula: `error_rate / (1 - SLO_target)`. Display on a Grafana
     panel with threshold coloring: green (< 1× burn), yellow (1–5×), red (> 5× burn). A 14.4× burn
     rate exhausts a 30-day budget in 2 hours — you need this number visible at all times during
     incidents.

     </details>

201. What actions are triggered at different burn thresholds (2×, 5×, 14.4× burn rate)?

     <details><summary>Hint</summary>

     14.4× burn (5m + 1h window): P1 page, halt non-critical deployments. 6× burn (1h + 6h window):
     Slack alert to team, engineering manager informed. 3× burn (6h + 3d window): Jira ticket
     created for next sprint. 1× burn (30d window): monthly SLO review agenda item.

     </details>

202. Who owns the error budget policy, and who can approve discretionary budget spend?

     <details><summary>Hint</summary>

     The service team owns day-to-day error budget spend. The SRE/platform team owns the policy (how
     the budget is allocated and what must be done when exhausted). A shared error budget committee
     (service lead + SRE lead) approves policy exceptions (e.g., planned maintenance that
     intentionally spends budget).

     </details>

203. Are SLOs reviewed and recalibrated on a regular cadence (quarterly, per major release)?

     <details><summary>Hint</summary>

     Yes — quarterly SLO review: was the target achievable? Was it too loose (never stressed)? Did
     the SLI formula capture what customers actually experienced? SLOs that are never at risk are
     either too loose or measuring the wrong thing. Tighten them when reliability improves.

     </details>

204. How are SLO violations surfaced during active incident response?

     <details><summary>Hint</summary>

     The on-call triage dashboard's top panel shows current error budget burn rate for all P0
     services. When burn rate is elevated, it immediately communicates business impact. The IRM
     incident card automatically shows SLO status for the affected service, giving the incident
     commander context without a separate lookup.

     </details>

---

## Phase 22: Onboarding & Change Management

205. What is the self-service onboarding path for a new service (golden-path template)?

     <details><summary>Hint</summary>

     A golden-path template: a Helm chart or Kustomize overlay that pre-configures OTel SDK env vars
     (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`) pointing to
     the cluster's Alloy DaemonSet endpoint. Teams annotate their deployment with
     `instrumentation: enabled` and the auto-instrumentation webhook handles the rest.

     </details>

206. How long does it take from "new service deployed" to "first dashboard and alert live"?

     <details><summary>Hint</summary>

     Target: < 30 minutes. Baseline in most orgs today: hours to days. Measure this per-onboarding
     and trend it. The 30-minute target is achievable with: auto-instrumentation + pre-built service
     dashboard template + automated alert rule provisioning triggered by service registration.

     </details>

207. How are breaking changes to the telemetry schema communicated to service teams?

     <details><summary>Hint</summary>

     Maintain a schema changelog in Git or Notion. Breaking changes (renaming a label used in
     alerts, removing a metric) require a deprecation notice 2 sprint cycles in advance, a migration
     guide, and a dual-emit period (old + new signal) before the old signal is dropped.

     </details>

208. Is there a sandbox or staging environment where teams can validate their instrumentation before
     production?

     <details><summary>Hint</summary>

     Yes — a dev/sandbox Grafana Cloud tenant (or a local k3d cluster with Grafana stack) where
     teams can send instrumentation and verify it before the prod rollout. Teams must validate: data
     appears in Explore, trace IDs link correctly, alert rules fire on synthetic test data. Sandbox
     validation is a gate before prod promotion.

     </details>

209. Who approves and merges changes to shared alerting rules and dashboards?

     <details><summary>Hint</summary>

     Shared rules (platform-wide alerts, on-call triage dashboards) require approval from the
     platform team lead. Team-scoped rules require the team lead's approval. All changes go through
     PR review. A CODEOWNERS file in the dashboards repository enforces this approval chain
     automatically.

     </details>

210. How is onboarding time measured, and what is the target?

     <details><summary>Hint</summary>

     Track: time from first commit annotating a service for instrumentation to first span visible in
     Tempo. Instrument this as a metric: emit an event when the first trace is received for a new
     `service.name`. Dashboard the distribution of onboarding durations. Set an SLO: 80% of services
     onboarded in < 30 minutes.

     </details>

---

## Phase 23: Testing & Validation

211. How is alert correctness verified before alerts reach production?

     <details><summary>Hint</summary>

     `promtool test rules` for Prometheus alert expression unit tests — provide synthetic input time
     series and assert that alerts fire/resolve at expected thresholds. For Loki alerts, use LogQL
     in the sandbox environment with injected synthetic log lines. Alert tests run in CI; a failing
     alert test blocks the merge.

     </details>

212. Is there synthetic telemetry (load generators, test spans) for validating the collection
     pipeline end-to-end?

     <details><summary>Hint</summary>

     Yes — a `synthetic-load-generator` deployment (e.g., `telemetrygen` from the OTel project)
     continuously emits test spans, metrics, and logs through the full pipeline. A validation job
     checks every 5 minutes that the synthetic trace appears in Tempo. This catches pipeline breaks
     before real services are affected.

     </details>

213. How are dashboards tested for correctness after a backend schema change?

     <details><summary>Hint</summary>

     Dashboard queries are tested against the sandbox Mimir/Loki/Tempo instance before production
     promotion. A CI step renders each dashboard's panels using Grafana's `/api/ds/query` API
     against the sandbox backend and checks that no panels return errors. Panel errors block
     dashboard promotion.

     </details>

214. Is there a chaos engineering practice targeting the observability platform (kill a collector,
     saturate ingest, drop a backend)?

     <details><summary>Hint</summary>

     Yes — quarterly chaos drills: (1) kill all Alloy pods on one node, verify dead-man alert fires
     within 5 minutes. (2) Inject 5× normal ingest rate, verify quota limits activate without data
     loss. (3) Block egress from collectors to backend, verify retry queue absorbs outage and
     delivers data on recovery. Results feed the reliability backlog.

     </details>

215. How is the full pipeline validated (inject a test trace → verify it appears in the trace
     backend → verify the correlated log appears in the log backend)?

     <details><summary>Hint</summary>

     The synthetic load generator provides continuous validation. For on-demand testing: inject a
     test span with a known trace ID via `otelcli`, wait 30s, query Tempo for the trace ID, verify
     the trace appears. Then query Loki for log lines containing that trace ID. Full round-trip
     validation in < 2 minutes — run this after every collector config change.

     </details>

216. How often is the full observability stack exercised in a DR or failover drill?

     <details><summary>Hint</summary>

     Quarterly at minimum. Drill scenarios: (1) Simulate Grafana Cloud outage — verify on-call
     engineers can query data via CLI. (2) Simulate collector outage — verify dead-man alert fires
     and data recovers on collector restart. (3) Simulate object storage unavailability — verify
     Mimir/Loki ingesters buffer and recover. Drill results are documented in a post-drill report.

     </details>
