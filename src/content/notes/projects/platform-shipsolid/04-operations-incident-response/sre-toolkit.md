---
title: "SRE Toolkit"
description: "The `srekit` CLI is a Python-based toolkit for SRE operations, located in"
tags: ["ShipSolid", "Operations", "Incident Response"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022-6"
relations:
  - slug: projects/platform-shipsolid/04-operations-incident-response/visualization-alerts
    kind: related
  - slug: projects/platform-shipsolid/04-operations-incident-response/incident-notification
    kind: related
---

## SRE Toolkit (srekit)

The `srekit` CLI is a Python-based toolkit for SRE operations, located in
`i-tooling/python/sre-utils/`.

## Installation

```bash
cd i-tooling/python/sre-utils
pip install -e ".[dev]"
```

## Commands

### Prometheus Queries

```bash
srekit prom query --q 'up'
srekit prom check-cpu --threshold 80 --range 5m
```

### Cardinality Management

Scan for [[cardinality]] budget violations and generate reports:

```bash
srekit cardinality scan --threshold 5000
srekit cardinality report --output report.json
srekit cardinality evaluate policies/cardinality-policy.yaml
```

### SLO Management

```bash
srekit slo status slo-definition.yaml
srekit slo generate-rules --output rules.yaml --alerts
srekit slo calculate-budget --target 0.995 --window 30d --good 99500 --total 100000
```

### Cost Estimation

```bash
srekit cost estimate --metrics 1000000 --logs 500 --traces 100000
srekit cost project --current 500 --growth 0.1 --months 12
srekit cost savings --metrics 1000000 --reduction 0.3
```

### Team Onboarding

```bash
srekit onboard team my-team --tier gold --slack "#my-team-alerts"
srekit onboard service my-team my-service --namespace production
```

## Configuration

```bash
cp config/config.example.yaml config/config.yaml
# Or use environment variables:
export SREKIT__grafana__url=https://your-instance.grafana.net
export SREKIT__grafana__token=glsa_xxx
```
