---
title: "2 — Labels and Cardinality"
description: "Label mechanics and series identity in Prometheus — how labels turn one metric name into many time series, the storage/performance cardinality math, and target relabeling vs. metric relabeling with real relabel_configs YAML."
tags: ["prometheus", "data-model", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-7"
relations:
  - slug: prometheus/00-monitoring-foundations/02-time-series-fundamentals/02-time-series-fundamentals
    kind: depends_on
  - slug: prometheus/05-promql-masterclass/01-promql-fundamentals/01-promql-fundamentals
    kind: related
  - slug: observability/reference/cardinality
    kind: related
  - slug: observability/02-metrics-engineering/05-label-design/05-label-schema-design
    kind: related
  - slug: prometheus/04-service-discovery/01-discovery-mechanisms/01-discovery-mechanisms
    kind: related
---

# 2 — Labels and Cardinality

[[prometheus/00-monitoring-foundations/02-time-series-fundamentals/02-time-series-fundamentals|Time Series Fundamentals]]
introduced labels as dimensions and flagged cardinality as "a one-line warning, not the full story."
This chapter is where that story gets told properly: label mechanics, the actual math behind a
cardinality blowup, and the two distinct points in the scrape lifecycle — target relabeling and
metric relabeling — where you get to intervene.

Matcher syntax itself (`=`, `!=`, `=~`, `!~`) is covered in
[[01-promql-fundamentals|PromQL Fundamentals]] — this chapter is about what labels _are_ and what
they _cost_, not how to write selectors against them.

## Label Mechanics

A label is a key-value pair attached to a metric. Label names may only contain ASCII letters,
numbers, and underscores (`[a-zA-Z0-9_]*`), and a single metric can carry more than one:

```
requests_total{path="/auth", method="get"}
requests_total{path="/auth", method="post"}
requests_total{path="/auth", method="patch"}
requests_total{path="/auth", method="delete"}
```

Two label categories are worth knowing by name:

- **Internal labels** — the metric name itself is just another label internally, stored under the
  reserved key `__name__`. `node_cpu_seconds_total{cpu="0"}` is, underneath,
  `{__name__="node_cpu_seconds_total", cpu="0"}`. Any label surrounded by double underscores
  (`__like_this__`) is internal to Prometheus and is stripped before storage unless a relabeling
  rule explicitly promotes it (more on that below).
- **Default labels** — every scraped metric picks up `instance` and `job` automatically, sourced
  from the scrape configuration rather than the instrumented application:

```yaml
job_name: "node"
static_configs:
  - targets: ["192.168.1.168:9100"]
```

produces series like `node_boot_time_seconds{instance="192.168.1.168:9100", job="node"}` — no code
in Node Exporter itself sets `instance` or `job`.

## Why Labels Exist

Without labels, differentiating a metric by dimension means creating a separate metric name per
value. An e-commerce API tracking requests per route without labels would need
`requests_auth_total`, `requests_products_total`, `requests_cart_total`, `requests_orders_total` —
and getting a grand total means summing metric names by hand, in code, not in a query.

With a `path` label instead, there's one metric name and the aggregation is a query:

```
requests_total{path="/auth"}
requests_total{path="/products"}
requests_total{path="/cart"}
requests_total{path="/orders"}
```

```
sum(requests_total)
```

Dynamically, an application increments the right series by supplying the label value at call time
rather than picking a different metric name:

```python
http_requests_total.labels(path="/home", code="200").inc()
http_requests_total.labels(path="/home", code="500").inc()
```

Aggregation then becomes a query concern instead of an instrumentation concern —
`sum(http_requests_total)` for the total, `sum(http_requests_total{code="500"})` for just the
errors.

## Why Labels Cost Something: the Cardinality Math

Every distinct label _combination_ is a distinct time series, in full — not a row in a table with a
shared schema, but its own independently stored stream of samples. That's the mechanical fact
underneath every cardinality conversation:

- A counter with a `hostname` label, scraped across 20 servers, is already **20 time series** for
  what instrumentation-wise looks like "one metric."
- Add a `region` label with 4 values on top of those 20 servers per region, and it's **4 × 20 = 80
  time series** — cardinality multiplies across label dimensions, it doesn't add.
- Histograms make this worse by construction: each `le` bucket is its own series, so a histogram
  with an HTTP-method label and a status-code label and eight bucket boundaries can turn into
  hundreds of series from what reads, in code, like a single `Observe()` call.

Prometheus can carry millions of active series on a single server without drama — but every
dimension you add pushes toward that ceiling faster than intuition suggests, and once you're past it
the fix is horizontal (more Prometheus instances, more operational surface), not a config tweak. The
practical rule that falls out of the math: labels should describe things with a small, bounded set
of values (a handful of paths, a handful of status codes, a handful of regions) — never something
like a user ID or a raw request ID, where the value set is effectively unbounded.

## Target Relabeling vs. Metric Relabeling

Prometheus gives you two distinct interception points in the scrape lifecycle, and mixing them up is
a common source of "why didn't my relabel rule do anything" confusion:

- **Target relabeling** (`relabel_configs`) runs **before the scrape happens**. It operates on the
  target list itself — often including temporary `__meta_*` labels supplied by
  [[01-discovery-mechanisms|service discovery]] — and decides which targets get scraped at all, and
  what their base labels (like `instance`) look like once scraped.
- **Metric relabeling** (`metric_relabel_configs`) runs **after the scrape**, against the labels
  already attached to each returned sample. It can rename, rewrite, or drop labels and entire
  metrics before they ever reach storage — but by this point the scrape already happened, so it
  can't change whether a target was scraped in the first place.

### Target relabeling example — filtering by service-discovery metadata

Say Azure service discovery is returning every VM in a subscription, but this job should only scrape
Linux hosts:

```yaml
scrape_configs:
  - job_name: 'azure-vms'
    azure_sd_configs:
      - subscription_id: '<subscription-id>'
        tenant_id: '<tenant-id>'
        client_id: '<client-id>'
        client_secret: '<client-secret>'
    relabel_configs:
      - source_labels: [__meta_azure_machine_os_type]
        regex: 'Linux'
        action: keep
```

`__meta_azure_machine_os_type` is a temporary label the Azure SD mechanism attaches per discovered
VM — it never reaches storage unless a rule promotes it. `action: keep` with a `regex` match means:
if this VM's OS type doesn't match `Linux`, drop it from the target list entirely, before a single
scrape request is sent.

The same block can add constant labels to every series a job produces, which is how you standardize
on values like environment or OS across targets that don't natively expose them:

```yaml
    relabel_configs:
      - source_labels: [__meta_azure_machine_os_type]
        regex: 'Linux'
        action: keep
      - target_label: os
        replacement: linux
      - target_label: runtime
        replacement: vm
```

`target_label` + `replacement` with no `source_labels` sets a fixed label value on every series that
survives this job's scrape — applied at the job level, so it's universal across every metric that
job collects, regardless of what the instrumented application itself reports.

### Metric relabeling example — fixing label value drift

Suppose the batch app and the Node Exporter for the same host disagree on how they spell a `runtime`
label — one reports `container`, the other reports `docker` — even though they mean the same thing.
Rather than touching either application, normalize it after scrape:

```yaml
    metric_relabel_configs:
      - source_labels: [runtime]
        regex: 'docker'
        target_label: runtime
        replacement: 'container'
```

This only fires on samples where the current `runtime` label matches `docker`, rewriting it to
`container` so both sources aggregate cleanly under one label value.

`metric_relabel_configs` is also the standard place to manage cardinality directly — dropping a
noisy or low-value metric entirely before it ever costs a series:

```yaml
    metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'go_gc_duration_seconds.*'
        action: drop
```

Because this runs after the scrape but before storage, it reduces what Prometheus has to keep and
query — at the cost of losing that data permanently rather than just hiding it, so it's a one-way
door worth applying deliberately rather than by default.

## Where the Discipline Lives

This chapter covers the mechanics — how labels become series, and the two places you can shape that
before it hits storage. It does not attempt to re-derive the governance side of the problem: how to
size a cardinality budget before shipping a label, how to catch a high-churn label (user IDs,
request IDs, raw timestamps) before it becomes an incident, or how to review a label schema before
it goes into a production-bound config. That discipline lives in [[cardinality|tech/cardinality.md]]
and in [[05-label-schema-design|Label Schema Design]] — read those for the budget/governance layer
this chapter deliberately leaves out.

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
