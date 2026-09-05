---
title: "Observability Overview"
description: "The observability pillar combines Alloy collector examples with a Terraform-managed Grafana Cloud"
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202603261321"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/architecture-overview
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/faro-impl-technical-doc
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/pillar-model
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/platform-overview-lab
    kind: related
---

## Observability

The [[projects/platform-shipsolid/01-platform-architecture/pillar-model|observability pillar]]
combines Alloy collector examples with a Terraform-managed Grafana Cloud control plane, sitting
alongside the
[[projects/platform-shipsolid/01-platform-architecture/platform-overview-lab|platform pillar]]'s
Terraform workload roots.

## Main Areas

- `f-observability/01-grafanaCloud-configs/` for Alloy metrics, logs, and traces pipelines
- `f-observability/06-grafana-cloud-v2/envs/` for `dev`, `qa`, and `prod` Terraform wrappers
- `f-observability/06-grafana-cloud-v2/packs/` for alerts, dashboards, governance, recording rules,
  SLOs, and synthetics
- `f-observability/06-grafana-cloud-v2/policy/conftest/` for plan JSON policy checks

## Validation Flow

```bash
bash a-governance/contracts/validate.sh --all-alerts
python3 f-observability/scripts/validate-correlation-contract.py check
terraform -chdir=f-observability/06-grafana-cloud-v2/envs/dev init -reconfigure -backend-config=backend.hcl
terraform -chdir=f-observability/06-grafana-cloud-v2/envs/dev plan -var-file=dev.tfvars -out=tfplan.bin
terraform -chdir=f-observability/06-grafana-cloud-v2/envs/dev show -json tfplan.bin > /tmp/tfplan.json
conftest test /tmp/tfplan.json --policy f-observability/06-grafana-cloud-v2/policy/conftest
```

The correlation validator checks three repo-side assumptions before you ever open Grafana:

- services with `otel=true` and `logs_json=true` emit `trace_id`, `span_id`, service identity, and
  metrics endpoints
- the Alloy Loki pipeline parses the standardized JSON field names
- the repo metadata still marks the same services as correlation-capable

## Promotion Model

The Grafana Cloud v2 workflow plans all three environments on pull requests, then applies
sequentially on `main`:

`dev → qa → prod`

The current live input model is hybrid but explicit:

- service ownership and telemetry expectations come from `d-apps/*/component.yaml`
- the generated observability index lives at `f-observability/generated/service-observability.json`
- environment-specific Grafana inputs still come from `*.tfvars`

The active sample routing model is team-based: use durable on-call aliases such as
`platform-prod-oncall@shipsolid.example`, not direct personal inboxes. The Terraform and Conftest
checks in the repo now reject the older placeholder defaults.

The Grafana Cloud v2 root module also carries environment-aware observability guardrails now:

- cardinality thresholds and team series budgets
- trace sampling defaults
- retention tiers
- alert-fatigue minima for notification policy timing
- team cost attribution recording rules and FinOps dashboards

The federated pack model remains a draft design pattern until an aggregator is implemented.

The remaining open work is still the live proof step: actually drive requests through the sample
services and confirm Grafana log-to-trace and trace-to-log navigation works against Loki and Tempo.

Use `.github/workflows/p00-production-validation.yml` when you want the cross-pillar operator view
of that work. It combines:

- Terraform live-validation preflight
- GitOps rollout readiness
- observability proof prerequisites

## Related Docs

- `f-observability/README.md`
- `f-observability/CLI_REFERENCE.md`
- `f-observability/06-grafana-cloud-v2/README.md`
- `f-observability/06-grafana-cloud-v2/CLI_REFERENCE.md`
- `f-observability/06-grafana-cloud-v2/TECHNICAL_DESIGN.md`
