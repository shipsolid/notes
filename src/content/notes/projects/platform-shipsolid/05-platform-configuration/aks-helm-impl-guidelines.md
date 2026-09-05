---
title: "AKS Helm Implementation Guidelines"
description: "**Applies to:** Services deploying to Azure Kubernetes Service (AKS) via Helm charts on the ShipSolid"
tags: ["ShipSolid", "Configuration"]
updated: 2026-05-01
hidden: false
zettelId: "202603241255"
relations:
  - slug: projects/platform-shipsolid/05-platform-configuration/alerting
    kind: related
  - slug: projects/platform-shipsolid/05-platform-configuration/alerts-standards
    kind: related
---

## AKS + Helm Observability Implementation Guidelines

**Applies to:** Services deploying to Azure Kubernetes Service (AKS) via Helm charts on the
ShipSolid platform.

> This guide covers platform-side configuration — what your Helm chart must include to integrate
> correctly with the Grafana Alloy DaemonSet, [[mimir|Mimir]], [[loki|Loki]], and [[tempo|Tempo]].
> For application-level instrumentation, see the contracts and language-specific guidelines (ACA,
> Faro/RUM).

---

## Platform Components Running on AKS

The SRE team operates the following platform components in every AKS cluster:

| Component            | Kind       | Purpose                                                                                |
| -------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `grafana-alloy`      | DaemonSet  | Collects pod logs, scrapes metrics (annotation + ServiceMonitor), receives OTLP traces |
| `kube-state-metrics` | Deployment | Exposes Kubernetes object state as Prometheus metrics                                  |
| `node-exporter`      | DaemonSet  | Exposes node-level hardware and OS metrics                                             |
| `cert-manager`       | Deployment | TLS certificate management for ingress                                                 |

Your Helm chart does **not** need to deploy these. You only need to configure your workload to
integrate with them.

---

## 1. Required Pod Annotations

Add the following annotations to your pod template spec to enable automatic metric scraping by
Alloy:

```yaml
# helm/templates/deployment.yaml
spec:
  template:
    metadata:
      annotations:
        k8s.grafana.com/scrape: "true"
        k8s.grafana.com/metrics.portNumber: "{{ .Values.metrics.port }}"
        k8s.grafana.com/metrics.path: "/metrics"
```

**`values.yaml` defaults:**

```yaml
metrics:
  port: 9090
```

If your application exposes metrics on the same port as the main app (e.g., port 8080 with
`/metrics`), set `metrics.port` to `8080`.

---

## 2. Kubernetes Downward API for OTLP Endpoint

Inject the node IP so the application can reach the Alloy DaemonSet for OTLP trace export:

```yaml
# helm/templates/deployment.yaml
spec:
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          env:
            - name: NODE_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.hostIP
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "http://$(NODE_IP):4317"
            - name: OTEL_SERVICE_NAME
              value: "{{ .Values.service.name }}"
            - name: OTEL_RESOURCE_ATTRIBUTES
              value: "deployment.environment={{ .Values.environment }},service.version={{ .Chart.AppVersion }}"
```

**`values.yaml`:**

```yaml
service:
  name: my-service

environment: dev   # override per environment: dev, qa, prod
```

---

## 3. Resource Labels for Cost Attribution

All workloads must carry the standard label set for cost attribution, RBAC scoping, and dashboard
filtering. Add these to both the Deployment metadata and the pod template:

```yaml
# helm/templates/deployment.yaml
metadata:
  labels:
    app.kubernetes.io/name: "{{ .Chart.Name }}"
    app.kubernetes.io/version: "{{ .Chart.AppVersion }}"
    app.kubernetes.io/component: "{{ .Values.component }}"    # api, worker, scheduler
    app.kubernetes.io/part-of: "{{ .Values.product }}"       # mdixai, daia, passport
    app.kubernetes.io/managed-by: "Helm"
    shipsolid.com/team: "{{ .Values.team }}"                    # SRE_Team, MDIxAI_Team, etc.
    shipsolid.com/env: "{{ .Values.environment }}"
    shipsolid.com/region: "{{ .Values.region }}"                # ca-east, us-east, eu-west
```

**`values.yaml`:**

```yaml
product: my-product
component: api
team: my-team
region: ca-east
```

> Alloy picks up these labels from pod metadata and injects them into all telemetry signals (logs,
> metrics, traces) as stream labels and attributes.

---

## 4. ServiceMonitor (Fine-Grained Scrape Control)

Use a `ServiceMonitor` instead of pod annotations when you need:

- A custom scrape interval (default is 30s)
- TLS on the metrics endpoint
- Multiple metrics endpoints per pod
- A dedicated scrape job name in Mimir

```yaml
# helm/templates/servicemonitor.yaml
{{- if .Values.metrics.serviceMonitor.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ .Chart.Name }}
  namespace: {{ .Release.Namespace }}
  labels:
    app.kubernetes.io/name: {{ .Chart.Name }}
    release: kube-prometheus-stack   # Must match the Prometheus operator's label selector
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Chart.Name }}
  endpoints:
    - port: metrics
      path: /metrics
      interval: {{ .Values.metrics.serviceMonitor.interval | default "30s" }}
      scrapeTimeout: {{ .Values.metrics.serviceMonitor.scrapeTimeout | default "10s" }}
{{- end }}
```

**`values.yaml`:**

```yaml
metrics:
  serviceMonitor:
    enabled: false        # Set to true to use ServiceMonitor instead of annotations
    interval: 30s
    scrapeTimeout: 10s
```

Ensure your `Service` resource exposes a named port `metrics` matching the metrics port:

```yaml
# helm/templates/service.yaml
spec:
  ports:
    - name: metrics
      port: 9090
      targetPort: 9090
```

---

## 5. Resource Requests and Limits

Set resource requests and limits for all containers. Alloy uses these to generate resource
utilization percentage metrics.

```yaml
# helm/templates/deployment.yaml
resources:
  requests:
    cpu: "{{ .Values.resources.requests.cpu }}"
    memory: "{{ .Values.resources.requests.memory }}"
  limits:
    cpu: "{{ .Values.resources.limits.cpu }}"
    memory: "{{ .Values.resources.limits.memory }}"
```

**`values.yaml` defaults (adjust per service profile):**

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

> Without limits set, the CPU/memory utilization alerts (e.g., `mem > 90% of limit`) will not fire
> correctly because there is no limit to compare against.

---

## 6. Liveness and Readiness Probes

Probes are required for Kubernetes to correctly report pod health — and for Alloy to emit accurate
`kube_pod_container_status_ready` metrics.

```yaml
# helm/templates/deployment.yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: {{ .Values.service.port }}
  initialDelaySeconds: 15
  periodSeconds: 20
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: {{ .Values.service.port }}
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

Ensure your application exposes `/health/live` and `/health/ready` endpoints. For ASP.NET Core, add:

```csharp
builder.Services.AddHealthChecks();
app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");
```

---

## 7. Helm Values per Environment

Maintain environment-specific values files and override in your CI/CD pipeline:

```
helm/
├── Chart.yaml
├── templates/
└── values/
    ├── values.yaml          # shared defaults
    ├── values-dev.yaml      # dev overrides
    ├── values-qa.yaml       # qa overrides
    └── values-prod.yaml     # prod overrides
```

**Example `values-prod.yaml`:**

```yaml
environment: prod
replicaCount: 3

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi

metrics:
  serviceMonitor:
    enabled: true
```

**Deploy command:**

```bash
helm upgrade --install {release-name} ./helm \
  -f helm/values/values.yaml \
  -f helm/values/values-{env}.yaml \
  --namespace {product}-{env} \
  --set image.tag=${IMAGE_TAG}
```

---

## 8. Helm Chart Observability Checklist

- [ ] Pod annotations include `k8s.grafana.com/scrape: "true"` and correct port
- [ ] `NODE_IP` is injected via Downward API
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES` are set
- [ ] Standard labels (`app.kubernetes.io/*`, `shipsolid.com/*`) are on Deployment and pod template
- [ ] `resources.requests` and `resources.limits` are set on all containers
- [ ] Liveness and readiness probes are configured
- [ ] ServiceMonitor is enabled if fine-grained scrape control is needed
- [ ] Environment-specific values files exist for dev, qa, prod
- [ ] Helm chart has been deployed to dev and telemetry verified in Grafana before promoting to prod
