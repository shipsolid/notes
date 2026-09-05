---
title: "MDIxAI Alerts — Standards (extracted from current state)"
description: "Rule group fields are identical across the 4 env files except for the env suffix."
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-14
hidden: false
zettelId: "202605061547"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/platform-configuration
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/alerting
    kind: depends_on
  - slug: projects/platform-shipsolid/05-platform-configuration/aks-helm-impl-guidelines
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/grafana-tf-how-to
    kind: related
---

## MDIxAI Alerts — Standards (extracted from current state)

> Reverse-engineered from `alerts/mdixai.{dev,qa,train,prod}.json` as of 2026-05-06. Treat this as a
> **starting baseline**, not a finished contract — open gaps are called out at the bottom for
> refinement. Pair this doc with the inventory in
> [[platform-configuration|platform-configuration.md]].

---

## 1. File shape

| Field         | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Top-level     | `{ apiVersion: 1, groups: [ ... ] }`                                     |
| Group count   | 1 per env file                                                           |
| Group fields  | `name`, `folder`, `folderUID`, `interval`, `orgId`, `rules`, `ruleGroup` |
| Rules per env | 24                                                                       |

Rule group fields are identical across the 4 env files except for the env suffix. One file per env;
never mix envs in one file.

## 2. Folder & group naming

| Field               | Convention               | Example          |
| ------------------- | ------------------------ | ---------------- |
| `folder`            | `Golden-<Product>`       | `Golden-MDIxAI`  |
| `folderUID`         | `golden-<product>`       | `golden-mdixai`  |
| Rule group `name`   | `<product>.<env>:<eval>` | `mdixai.prod:1m` |
| Evaluation interval | `1m`                     | `1m`             |

## 3. Rule UID

Convention: `<product><env><nn>` — lowercase, no separators, two-digit index.

Examples: `mdixaiprod01`, `mdixaidev24`. Index is stable across envs (rule 01 in dev = rule 01 in
prod, same signal, same threshold).

UID is the contract Grafana keys on — never renumber.

## 4. Rule title schema

```
[<env>] [<product>] [<category>] [<signal>] [<threshold_tag>] [<priority>] [<owner>]
```

- All segments **lowercase**, square-bracketed, single-space separated.
- Silences and notification policies that match titles by regex must also be lowercase.

| Segment         | Allowed values (today)                                                                                                                          | Notes                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `env`           | `dev`, `qa`, `train`, `prod`                                                                                                                    | Matches the env file                          |
| `product`       | `mdixai`                                                                                                                                        | Lowercase product code                        |
| `category`      | `az_container_apps`, `az_container_apps.api`, `az_container_apps.container`, `app_gateway`, `azure_key_vault`, `sql_mi`, `synthetics.<service>` | Dot-namespaced for sub-scopes                 |
| `signal`        | `cpu`, `mem`, `restarts`, `failed_requests`, `latency`, `latency_backend`, `unhealthy_hosts`, `availability`, `probe_data`                      | One signal per rule                           |
| `threshold_tag` | `gt_<n>pct_<window>`, `gt_<n>_<window>`, `lt_<n>pct_<window>`, `p95_gt_<n>ms_<window>`, `missing_<window>`, `eq_0_<window>`                     | Window matches the LogQL/PromQL `[<window>]`  |
| `priority`      | `p2`, `p3` (currently in use); `p1`, `p4` reserved                                                                                              | Only encoded here — no `severity` label (gap) |
| `owner`         | `sre_team`                                                                                                                                      | Only encoded here — no `team` label (gap)     |

Example: `[prod] [mdixai] [synthetics.auth_service] [availability] [lt_80pct_15m] [p2] [sre_team]`

## 5. Evaluation timing

| Field           | Value | Reasoning                                                                 |
| --------------- | ----- | ------------------------------------------------------------------------- |
| `interval`      | `1m`  | Rule group re-eval cadence                                                |
| `for`           | `15m` | Universal — 15 consecutive hot 1-min evals before fire                    |
| MTTD            | ~15m  | Suppresses revision swaps, HPA churn, cold-start, GC, single probe misses |
| Cost multiplier | 15×   | vs a 15m eval cadence; acceptable at 24 rules — **watch as group grows**  |

Probe-missing rules use a `[1h]` LogQL window with `for: 15m`, so effective MTTD on probe-agent
outage is ~15m + up-to-1h sliding window = up to ~75 min. Not a bug, but document it on the runbook.

## 6. State handling

| Field          | Universal value | Exceptions                                                        |
| -------------- | --------------- | ----------------------------------------------------------------- |
| `execErrState` | `Error`         | none                                                              |
| `noDataState`  | `KeepLast`      | `NoData` on rule 01 (mem); `Alerting` on rules 20–24 (probe_data) |
| `provenance`   | `file`          | none — UI edits will be blocked once provisioning honors this     |
| `isPaused`     | `false`         | none currently                                                    |

Why each `noDataState`:

- **`KeepLast`** (default) — last-known state holds during a brief data gap, prevents flap on
  transient missing samples.
- **`Alerting`** (probe*data rules) — absence \_is* the signal; we want to fire when no probes land.
- **`NoData`** (rule 01 mem) — currently the only rule using this; **likely unintentional drift**
  (gap, see §11).

## 7. Data-source standards

| Datasource             | UID                 | Used for                                                  |
| ---------------------- | ------------------- | --------------------------------------------------------- |
| Grafana Cloud Prom     | `grafanacloud-prom` | OTel SDK metrics (per-service: cpu, mem, latency, errors) |
| Grafana Cloud Loki     | `grafanacloud-logs` | Synthetic check results (availability, probe data)        |
| Azure Monitor          | `eee3ss4y6vfuoc`    | Container Apps platform metrics, App Gateway, KV, SQL MI  |
| Server-side Expression | `__expr__`          | `threshold`, `math`, `reducer`, `classic_conditions`      |

Rule of thumb already followed:

- **Per-service signals** (CPU, mem, latency, errors at process level) → [[prometheus|Prometheus]],
  group by `service_name` from OTel SDK.
- **Platform signals** (Container App revision, App Gateway, KV, SQL MI) → Azure Monitor.
- **End-user availability** → Loki (Grafana Synthetic Monitoring writes browser-check results to
  Loki).

Only `__expr__` is allowed as the second hop. No raw cross-datasource math beyond SSE.

## 8. Query patterns

### 8a. Prometheus (process-level OTel metrics)

- `relativeTimeRange.from: 900` (15 min) for `[15m]` rules.
- `instant: true`, `range: false`, `intervalMs: 1000`, `maxDataPoints: 43200`.
- `legendFormat: "__auto"` (gap — see §11; explicit `{{service_name}}` would be safer).
- `editorMode: "code"` (PromQL by hand, not builder).
- Selector pattern: `{deployment_environment="aca-dgeg-mdixai-<env>"}`.

### 8b. Loki (synthetics)

- Stream selector: `{job="aca-dgeg-mdixai-<env>"}` — **single source of truth**, do not re-introduce
  `label_deployment_environment`.
- Check filter: `| logfmt | check =~ \`(?i)<PREFIX> ._\``— anchored full-match, the trailing`._` is
  required (Loki label-filter semantics).
- Availability math: `$A / ($A + $B)` where A = success count, B = failure count over the same
  `[15m]` window.
- Probe-missing: `sum(count_over_time({...}[1h]))` against `eq 0`.
- Window in title (`_15m`, `_1h`) **must equal** the `[<window>]` in LogQL — if you re-tune cadence,
  update both.

### 8c. Azure Monitor

- `queryType: "Azure Monitor"`, `aggregation: "Average"`, `timeGrain: "auto"`,
  `region: "canadacentral"`.
- One `resources[]` entry per Azure resource. Multi-resource rules (cpu/mem/restarts on Container
  Apps) use one refId per resource (A, B, C, E, F, G — D reserved for the SSE expression) and
  `classic_conditions` with `or`-chain to fire if any one is hot.
- `subscription` IDs and resource groups (`MF_DM_CC_<ENV>_CORE-RG`) are env-scoped — by design, not
  drift.

### 8d. SSE expression node

- `condition` field on the rule points at the **last** SSE refId (`C` for 2-step chains, `D` for the
  multi-resource Container-App rules).
- `threshold` type for single-input comparisons; `classic_conditions` for the multi-resource `or`
  chains; `math` only for division (`$A / ($A + $B)`); `reducer` (`last`) explicitly when needed.
- Grafana SSE math supports unary functions only (`abs`, `log`, `sqrt`, `is_nan`, `is_null`, …) —
  **do not** add multi-arg `max`/`min`/ternaries. Use `noDataState: KeepLast` to handle NaN, not a
  guard expression.

## 9. Annotations contract

Standard set on **non-synthetic** rules (BigPanda routing depends on these):

| Key            | Required | Purpose                                                                                                                      |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `alert_title`  | yes      | Human-readable title with templated identifiers — `{{ $labels.X }}`                                                          |
| `summary`      | yes      | One-line description with current value — `{{ printf "%.2f" $values.A.Value }}%`                                             |
| `description`  | yes      | Why-this-matters paragraph (consequences + what we monitor)                                                                  |
| `assigned_to`  | yes      | `DIA - AMS MDIxAI` — group BigPanda routes to                                                                                |
| `category`     | yes      | `software` (current only value)                                                                                              |
| `sub_category` | yes      | `application` (current only value)                                                                                           |
| `service_tag`  | yes      | Hint for downstream of which label carries the service identifier — `service_name` (Prom), `Resource`/`resourceName` (Azure) |

Synthetic rules (15–24) deviate — they emit `service_name` instead and **drop** `assigned_to`,
`category`, `sub_category`, `service_tag` (gap, see §11).

### Templating rules

- Identifier templating: `{{ $labels.service_name }}` — never hard-code service names in
  `alert_title` / `summary`.
- Value templating: `{{ printf "%.2f" $values.<refId>.Value }}` for percentages and ms;
  `{{ mulf $values.<refId>.Value 100 | printf "%.1f" }}` for ratio→percent.
- The refId in `$values.<refId>` must match a query node in the rule (not the SSE refId in
  `condition`).

## 10. Labels & routing

| Field                                       | Value                   |
| ------------------------------------------- | ----------------------- |
| `labels.environment`                        | `aca-dgeg-mdixai-<env>` |
| `notification_settings.receiver` (prod)     | `BigPanda webhook`      |
| `notification_settings.receiver` (non-prod) | `Teams_MDIxAI_NonProd`  |

Only one user-defined label is set today (`environment`). Severity, team, and service tier exist
only in the title — see gaps.

## 11. Gaps to refine

Ordered by impact.

### Critical / correctness

1. **Synthetic rules drop the BigPanda annotation set.** Rules 15–24 are missing `assigned_to`,
   `category`, `sub_category`, `service_tag` — they emit `service_name` instead. If BigPanda routing
   for non-synthetic alerts keys on `assigned_to` (`DIA - AMS MDIxAI`), synthetic-driven pages will
   fall through to the default route. Fix: either backfill the standard set on the synthetics or
   change BigPanda correlation to key on the title regex.
2. ~~**Stale title tag — KV.**~~ _Resolved 2026-05-06: title now reads `[lt_99_5pct_15m]` across all
   4 envs._
3. ~~**Stale annotation text — synthetic availability.**~~ _Resolved 2026-05-06: `alert_title` on
   rules 15–19 now reads "over the last 15 minutes." across all 4 envs (was "3 hours" in prod, "6
   hours" in dev/qa/train)._
4. **`noDataState` drift on rule 01.** Only Prometheus rule using `NoData` (every other Prom rule is
   `KeepLast`). Either intentional and worth documenting in the README, or accidental drift from a
   re-edit. Decide and align.
5. **KV cross-env naming inconsistency** (already flagged in README §"Key Vault availability
   threshold"). Verify `MF-DM-CC-PROD-KV` vs `MF-DM-CC-CORE-<env>-KV` against Azure — if prod's KV
   is genuinely named differently this is correct; otherwise prod silently misses.

### Schema / tooling

6. **No `severity` label.** Severity is encoded only in the title (`[p2]`, `[p3]`). Anything that
   filters or routes by severity programmatically (silences, AM tree, BigPanda correlation) has to
   regex the title — fragile. Add `labels.severity: "p2" | "p3"`.
7. **No `team` / `owner` label.** Same problem as severity. Add `labels.team: "sre_team"`.
8. **No `runbook_url` annotation.** Standard Grafana annotation, missing on every rule. On-call has
   nothing to click on a 02:00 page. Add `annotations.runbook_url` per rule.
9. **No dashboard panel link.** No `grafana_dashboard_url` / `panel_id` to deep-link from the
   notification to the panel showing the offending series. Add per rule.
10. **`legendFormat: "__auto"` on Prometheus queries.** `$labels.service_name` only resolves
    correctly if Prom returns a series with that label. Set `legendFormat: "{{service_name}}"`
    explicitly to make the contract obvious and immune to future label-set changes.
11. **`service_tag` annotation values inconsistent** — rule 01 uses `service_name`, rule 03 uses
    `Resource`, rule 11 uses `resourceName`. Decide a single contract: lowercase label name only,
    e.g. `service_name` for OTel, `resource_name` for Azure. Currently a downstream consumer can't
    trust the value.

### Operational

12. **Container App rules (03/04/05) hard-code 6 resources by refId.** If MDIxAI adds a new
    container app, the alert silently misses it. Two paths: (a) move to a Prometheus-based rule
    grouped by `service_name` (we already do this for some signals), or (b) use Azure Monitor's
    `dimensionFilters` / Resource-Graph query to enumerate apps dynamically. Either beats
    hand-maintaining A/B/C/E/F/G.
13. **`classic_conditions` `or` chain loses per-resource attribution.** Rule 03/04/05 fires once
    with the SSE expression's output; the notification can't say _which_ container app crossed 90%.
    Annotation summary uses `{{ $labels.service_name }}` but classic_conditions doesn't propagate
    the source labels — verify the page actually carries the offending resource name. If not, switch
    to one rule per resource (more rules, cleaner pages) or use SSE math + reduce per-A/B/C.
14. **No inhibition / silencing relationships.** `[restarts] gt_5_15m` (rule 05) almost always
    co-fires with `[mem] gt_90pct_15m` (rule 01) on OOM scenarios — both page. Configure inhibition
    in the notification policy / BigPanda so the symptom (restarts) is suppressed when the cause
    (mem) is firing.
15. **Single global priority (`[sre_team]`, all `p2`/`p3`)** ignores service tier. Auth is
    gate-of-everything; DDH may be best-effort. Consider a `service_tier` label (gold / silver /
    bronze) and let priority follow tier.
16. **Threshold values are hand-coded magic numbers.** `90`, `5`, `0.8`, `5000`, `500` appear in
    both `threshold_tag` (title) and SSE `evaluator.params`. Drift between them is silent (see gap
    2). Either generate the title from the threshold at provisioning time, or add a CI check that
    parses both and asserts equality.
17. **No SLO / FinOps note for the rule group.** 24 rules × 1m eval × multi-source queries = a
    non-trivial query load on Prom/Loki/Azure Monitor. Document the budget; add an alert on
    rule-group eval latency once we have one.
18. **`for: 15m` uniform** even on probe-missing — effective MTTD is up to 75m on probe outage (1h
    LogQL window + 15m hot). Probably fine; document on the runbook so on-call doesn't think the
    rule is broken.

### Provisioning

19. **No CI validation on the JSON.** A typo in `datasourceUid`, `condition`, or `refId` deploys
    silently and the rule goes green. Add a pre-commit / CI step that runs `gutil.py --validate` (or
    equivalent) and asserts: (a) every `condition` refId exists in `data[]`, (b) every refId
    referenced in `$values.X` in annotations exists, (c) all 4 env files diff cleanly except for
    env-scoped fields.
20. **No drift detector.** Manual edits to a deployed rule via the UI are blocked by
    `provenance: file` — but only after provisioning honors the field. Until then, run a periodic
    diff (Grafana API → repo) to flag drift.

---

## 12. Suggested next steps (refinement order)

1. **Fix the obvious drift** — gaps 2, 3, 4, 5 (stale tags / states / naming).
2. **Add the missing labels and annotations** — gaps 6, 7, 8, 9 (`severity`, `team`, `runbook_url`,
   dashboard link). One-time backfill, then enforce in a template.
3. **Backfill BigPanda annotations on synthetic rules** — gap 1.
4. **Add CI validation** — gap 19. Cheap, prevents whole class of silent failures.
5. **Refactor multi-resource Container App rules** — gap 12. Bigger change, do after the rest is
   stable.
6. **Inhibition rules** — gap 14. Lives in notification policy / BigPanda config, not the rule JSON,
   but should be tracked as a paired artifact.

---

## 13. Out of scope (already covered elsewhere)

- Alert inventory, status matrix, per-rule details — see
  [[platform-configuration|platform-configuration.md]].
- Dashboard schema — see README §Dashboards.
- Auto-deploy workflow — see README §Auto-deploy.
- Cardinality budget for new metrics/labels — use the **cardinality-budget-calculator** skill before
  adding labels in production-bound configs.
