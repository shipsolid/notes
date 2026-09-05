---
title: "Alerting Contract"
description: "**Applies to:** All teams authoring or requesting Grafana alert rules on the ShipSolid SRE"
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-13"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/alerts-standards
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/aks-helm-impl-guidelines
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf-how-to
    kind: related
---

## Alerting Contract

**Applies to:** All teams authoring or requesting Grafana alert rules on the ShipSolid SRE
Observability platform.

## How Alerts Work

Alert rules are managed as JSON files in this repository under
`grafana_alerts/payload/{product}/alerts/` and deployed to Grafana Cloud via GitHub Actions using
`gutil.py`. Alerts evaluate every **15 minutes** and route to **BigPanda** via webhook for incident
management.

---

## Alert Title Format

Every alert title must follow this exact format:

```
[{env}] [{product}] [{resource_type}] [{metric}] [{threshold_condition}] [{priority}] [{team}]
```

**Example:**

```
[prod] [MDIxAI] [az_container_apps.container] [mem] [gt_90pct_15m] [p2] [SRE_Team]
```

| Token                 | Description                | Examples                                                     |
| --------------------- | -------------------------- | ------------------------------------------------------------ |
| `env`                 | Deployment environment     | `dev`, `qa`, `train`, `prod`, `demo-train`                   |
| `product`             | Product identifier         | `MDIxAI`, `DAIA`, `IEO`, `Passport`, `OT`                    |
| `resource_type`       | The monitored resource     | `az_container_apps.container`, `aks.node`, `az_sql.database` |
| `metric`              | The metric being monitored | `cpu`, `mem`, `latency`, `error_rate`, `restarts`            |
| `threshold_condition` | Threshold and window       | `gt_90pct_5m`, `lt_10pct_15m`, `gt_100_1h`                   |
| `priority`            | Incident priority          | `p1` (critical), `p2` (high), `p3` (medium), `p4` (low)      |
| `team`                | Owning team                | `SRE_Team`, `DEVOPS_TEAM`, `MDIxAI_Team`                     |

---

## Required Fields

Every alert JSON file must include all of the following fields. Missing fields will cause the
deployment to fail validation in `gutil.py`.

```json
{
    "folderUID": "<grafana-folder-uid>",
    "ruleGroup": "<product>.<env>:<interval>",
    "uid": "<unique-alert-uid>",
    "title": "[env] [product] [resource_type] [metric] [threshold_condition] [priority] [team]",
    "condition": "C",
    "data": [ ... ],
    "noDataState": "KeepLast",
    "execErrState": "Error",
    "for": "5m",
    "annotations": {
        "alert_title": "<human-readable description of the condition>",
        "assigned_to": "<team or business unit>",
        "category": "software",
        "description": "<detailed description of what triggered the alert and its impact>",
        "service_tag": "<prometheus label used to identify the affected service>",
        "sub_category": "application",
        "summary": "<one-sentence summary of the alert condition>"
    },
    "labels": {
        "environment": "<env>",
        "severity": "<critical|warning|info>"
    },
    "isPaused": false,
    "notification_settings": {
        "receiver": "BigPanda webhook"
    }
}
```

### Field Reference

| Field          | Required | Description                                                                                                               |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `folderUID`    | Yes      | Grafana folder UID for the product. Obtain from SRE team.                                                                 |
| `ruleGroup`    | Yes      | Format: `{product}.{env}:{interval}` e.g. `mdixai.prod:15m`                                                               |
| `uid`          | Yes      | Globally unique. Convention: `{product}{env}{sequential-suffix}`. Alphanumeric, hyphens, underscores only. Max 128 chars. |
| `condition`    | Yes      | RefId of the threshold expression node (typically `"C"`)                                                                  |
| `noDataState`  | Yes      | What happens when query returns no data: `KeepLast` (recommended), `NoData`, `Alerting`                                   |
| `execErrState` | Yes      | What happens when query errors: `Error` (recommended), `Alerting`                                                         |
| `for`          | Yes      | How long the condition must be true before firing. Format: `\d+[smhd]`. Use `5m` minimum.                                 |
| `isPaused`     | Yes      | Set `false` for live alerts. Use `true` only during development/testing.                                                  |

### Annotation Reference

| Annotation     | Required | Description                                                                             |
| -------------- | -------- | --------------------------------------------------------------------------------------- |
| `alert_title`  | Yes      | Human-readable condition description for BigPanda incident title                        |
| `assigned_to`  | Yes      | Team/business unit responsible (e.g. `"DIA - AMS MDIxAI"`)                              |
| `category`     | Yes      | Top-level category for BigPanda: `"software"`, `"hardware"`, `"network"`                |
| `description`  | Yes      | Full description of what the alert means and potential impact                           |
| `service_tag`  | Yes      | Prometheus label name that identifies the affected service instance in the metric query |
| `sub_category` | Yes      | Sub-category for BigPanda: `"application"`, `"infrastructure"`, `"platform"`            |
| `summary`      | Yes      | One-sentence summary (used in notification body)                                        |

### Label Reference

| Label         | Required | Values                                                                                 |
| ------------- | -------- | -------------------------------------------------------------------------------------- |
| `environment` | Yes      | `dev`, `qa`, `train`, `prod`                                                           |
| `severity`    | Yes      | `critical` (P1 — page immediately), `warning` (P2/P3 — investigate), `info` (P4 — FYI) |

---

## Priority and Severity Mapping

| Priority | Severity Label | Meaning                                               | Expected Response Time |
| -------- | -------------- | ----------------------------------------------------- | ---------------------- |
| P1       | `critical`     | Service down or data loss — immediate action required | < 15 minutes           |
| P2       | `warning`      | Degraded performance or approaching failure threshold | < 1 hour               |
| P3       | `warning`      | Non-critical issue, investigate during business hours | < 4 hours              |
| P4       | `info`         | Informational — no immediate action required          | Next business day      |

---

## Alert Authoring Guidelines

### Threshold Selection

- **Do not alert on noise.** Use a `for` duration of at least `5m` to avoid transient spikes causing
  false positives.
- **Calibrate thresholds in non-prod first.** Deploy with `isPaused: true` in dev/qa, observe the
  baseline, then set meaningful thresholds.
- **CPU/Memory:** Alert at 90% sustained for 15m, not 80% for 1m.
- **Error rates:** Use `rate()` over 5m, not `increase()` over 1m.

### `noDataState` Guidance

| Value      | When to Use                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| `KeepLast` | Metrics-based alerts where occasional scrape gaps are expected (recommended default) |
| `NoData`   | Synthetic/uptime checks where absence of data IS the problem                         |
| `Alerting` | Use sparingly — can cause false pages during planned maintenance                     |

### Query Structure (Two-Node Pattern)

All alerts should use the standard two-node query pattern:

```
Node A: PromQL or data source query → returns a time series
Node C: Threshold expression on A → returns boolean (fires alert when true)
```

Example PromQL for CPU > 90% sustained over 5 minutes:

```promql
100 *
  sum by (service_name) (
    rate(process_cpu_seconds_total{deployment_environment="prod"}[5m])
  )
/ <cpu_cores>
```

Always include `deployment_environment` label in your query to scope alerts to the correct
environment.

---

## File and UID Naming Conventions

### File Naming

```
grafana_alerts/payload/{product}/alerts/{product}.{env}.json
```

Examples:

- `grafana_alerts/payload/mdixai/alerts/mdixai.prod.json`
- `grafana_alerts/payload/daia/alerts/daia.dev.json`

For single-alert files in the `tmp/` staging area:

```
grafana_alerts/payload/{product}/tmp/{env}/{sequence}_{resource_type}_{metric}_{condition}.json
```

Example: `01_az_container_apps_container_cpu_gt_90pct_5m.json`

### UID Naming

UIDs must be globally unique across Grafana. Follow this convention:

```
{product}{env}{sequential-number-or-hash}
```

Examples:

- `mdixaiprod01`, `mdixaiprod02`
- `daiadev13`, `daiadev14`
- `demo-train-deyyztkn4mh34a`

---

## Workflow for Authoring a New Alert

1. **Create the JSON file** in `grafana_alerts/payload/{product}/tmp/{env}/` using the template
   below
2. **Set `isPaused: true`** while testing
3. **Deploy to dev/qa** via GitHub Actions (`alerts-grafana.yml`) using `update_create` action
4. **Verify in Grafana UI** — check the alert fires as expected under synthetic conditions
5. **Move to the production alerts file** (`{product}.{env}.json`) and set `isPaused: false`
6. **Open a PR** for SRE team review before deploying to `prod`

> Newer product alert rules are increasingly authored via the Terraform-managed pipeline instead —
> see
> [[projects/platform-shipsolid/05-platform-configuration/grafana-tf-how-to|grafana_tf — How-To Guides]]
> ("Add Product Alert Rules") for the current recommended path.

### Minimal Template

```json
{
    "folderUID": "",
    "ruleGroup": "{product}.{env}:15m",
    "uid": "{product}{env}XX",
    "title": "[{env}] [{PRODUCT}] [{resource_type}] [{metric}] [{condition}] [{priority}] [{TEAM}]",
    "condition": "C",
    "data": [
        {
            "refId": "A",
            "relativeTimeRange": { "from": 900, "to": 0 },
            "datasourceUid": "grafanacloud-prom",
            "model": {
                "editorMode": "code",
                "expr": "# your PromQL here",
                "instant": true,
                "refId": "A"
            }
        },
        {
            "refId": "C",
            "relativeTimeRange": { "from": 0, "to": 0 },
            "datasourceUid": "__expr__",
            "model": {
                "type": "threshold",
                "expression": "A",
                "conditions": [
                    {
                        "evaluator": { "type": "gt", "params": [90] },
                        "operator": { "type": "and" },
                        "query": { "params": ["C"] },
                        "reducer": { "type": "last", "params": [] }
                    }
                ],
                "refId": "C"
            }
        }
    ],
    "noDataState": "KeepLast",
    "execErrState": "Error",
    "for": "15m",
    "annotations": {
        "alert_title": "",
        "assigned_to": "",
        "category": "software",
        "description": "",
        "service_tag": "service_name",
        "sub_category": "application",
        "summary": ""
    },
    "labels": {
        "environment": "{env}",
        "severity": "warning"
    },
    "isPaused": true,
    "notification_settings": {
        "receiver": "BigPanda webhook"
    }
}
```

---

## Validation Checklist

- [ ] Title follows the `[env] [product] [resource] [metric] [condition] [priority] [team]` format
- [ ] UID is unique and follows the naming convention
- [ ] All required annotation fields are populated (non-empty strings)
- [ ] `environment` label matches the environment in the title and in the PromQL
      `deployment_environment` filter
- [ ] `severity` label matches the priority level
- [ ] `for` duration is at least `5m`
- [ ] `noDataState` is `KeepLast` unless absence of data is the alert condition
- [ ] `isPaused: false` only after the alert has been validated in a lower environment
- [ ] `receiver` is `"BigPanda webhook"` (do not change)
- [ ] PR reviewed by SRE team before deploying to `prod`
