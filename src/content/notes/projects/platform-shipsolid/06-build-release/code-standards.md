---
title: "Code Standards"
description: "This document defines the mandatory code standards for all services and infrastructure in this"
tags: ["ShipSolid", "CI/CD"]
updated: 2026-05-01
hidden: false
zettelId: "202603260022-7"
relations:
  - slug: projects/platform-shipsolid/06-build-release/naming-conventions
    kind: related
  - slug: projects/platform-shipsolid/06-build-release/pre-commit-hooks
    kind: depends_on
  - slug: projects/platform-shipsolid/06-build-release/terraform-driver-styles
    kind: related
---

## Code Standards

This document defines the mandatory code standards for all services and infrastructure in this
monorepo. All contributors must follow these standards. PRs that violate these rules will be
blocked.

---

## 1. Language-Specific Conventions

### .NET 8 (C#)

- Target framework: `net8.0`.
- Use nullable reference types (`<Nullable>enable</Nullable>`).
- Use file-scoped namespaces.
- Use `ILogger<T>` for all logging (no `Console.WriteLine` in production code).
- Use async/await for all I/O-bound operations.
- Follow the
  [Microsoft C# coding conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions).
- Use `record` types for DTOs and value objects where appropriate.
- Configuration via `IOptions<T>` pattern, not static config access.

### Python 3.11+

- Enforce type hints on all public functions and methods.
- Use `pathlib.Path` instead of `os.path`.
- Format with `black` (line length 88). Lint with `ruff`.
- Use `pydantic` for data validation in FastAPI services.
- Use `logging` module with structured output (JSON in production).
- Virtual environments required; never install globally.

### Java 17 (Spring Cloud)

- Follow the [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html).
- Use constructor injection (no field injection with `@Autowired`).
- Use `slf4j` with `logback` for logging.
- Use `record` types for DTOs where applicable.
- Spring profiles for environment-specific configuration.

### Terraform 1.x

- Pin provider versions with pessimistic constraint (`~>` operator).
- Pin Terraform version in `required_version`.
- Use `terraform fmt` before every commit.
- Use `terraform validate` as part of CI.
- All variables must have `description` and `type`.
- Sensitive variables must be marked with `sensitive = true`.

---

## 2. Naming Conventions

### Files and Directories

- Lowercase with hyphens: `my-service-name/`.
- Pillar prefixes are alphabetical: `a-governance/`, `d-apps/`, etc.
- Service directories use a numeric prefix: `01-python-samples/`, `02-dotnet-FakeStoreIngestor/`.

### Code

| Language  | Classes/Types | Methods/Functions | Variables  | Constants        |
| --------- | ------------- | ----------------- | ---------- | ---------------- |
| C#        | PascalCase    | PascalCase        | camelCase  | PascalCase       |
| Python    | PascalCase    | snake_case        | snake_case | UPPER_SNAKE_CASE |
| Java      | PascalCase    | camelCase         | camelCase  | UPPER_SNAKE_CASE |
| Terraform | snake_case    | N/A               | snake_case | N/A              |

### Azure Resources

Follow the pattern: `{project}-{environment}-{resource_type}`. See
[[naming-conventions|naming-conventions.md]] for full details.

---

## 3. Required Patterns

### Health Checks

Every service must expose a health endpoint:

- .NET: Use `MapHealthChecks("/healthz")` with `Microsoft.Extensions.Diagnostics.HealthChecks`.
- Python/FastAPI: `GET /healthz` returning `{"status": "healthy"}`.
- Spring: Actuator health endpoint at `/actuator/health`.
- Health checks must verify downstream dependencies (database, external APIs).

### Structured Logging

- All services must use structured logging (key-value pairs, not string interpolation).
- Log levels: `DEBUG`, `INFO`, `WARN`, `ERROR`. Use them correctly.
- Every log entry must include: `timestamp`, `level`, `service`, `correlation_id`.
- JSON format in production; human-readable in local development.

### OpenTelemetry Instrumentation

- All services must include OpenTelemetry SDK for traces and metrics.
- Propagate `traceparent` header across service boundaries.
- Use semantic conventions for span names and attributes.
- Export to the Grafana Cloud OTLP endpoint (configured via environment variables).

---

## 4. Forbidden Patterns

The following are **strictly prohibited** and will cause PR rejection:

| Pattern                       | Reason                          | Alternative                             |
| ----------------------------- | ------------------------------- | --------------------------------------- |
| Hardcoded secrets             | Security risk                   | Use Azure Key Vault or environment vars |
| `latest` Docker tag           | Non-reproducible builds         | Use semantic version or SHA digest      |
| Root containers               | Security risk                   | Use `USER nonroot` in Dockerfile        |
| Password auth on VMs          | Brute-force risk                | Use SSH keys with Azure AD              |
| `SELECT *` in production code | Performance and schema coupling | Specify columns explicitly              |
| `TODO` without issue link     | Untracked technical debt        | `TODO(#123): description`               |
| Disabling SSL verification    | Man-in-the-middle risk          | Fix certificates properly               |
| Committing `.env` files       | Credential leak                 | Use `.env.example` with placeholders    |

---

## 5. Testing Requirements

### Unit Tests

- **Mandatory** for all services.
- Minimum coverage target: 70% line coverage for new code.
- Test files live alongside source code or in a parallel `tests/` directory.
- Use the standard test framework for each language:
  - .NET: `xUnit` with `FluentAssertions`.
  - Python: `pytest`.
  - Java: `JUnit 5` with `Mockito`.

### Integration Tests

- **Required** for all database-backed services.
- Use service containers (Docker) in CI for database dependencies.
- Integration tests must be idempotent and clean up after themselves.
- Tag integration tests so they can run separately: `[Trait("Category", "Integration")]` (.NET),
  `@pytest.mark.integration` (Python), `@Tag("integration")` (Java).

### Infrastructure Tests

- Terraform plans must pass `terraform validate`.
- Use `checkov` or `tflint` for static analysis of Terraform code.
- Policy-as-code checks run in CI for all infrastructure changes.

---

## 6. Docker Standards

### Dockerfile Requirements

- Use multi-stage builds to minimize final image size.
- Pin base image versions (e.g., `mcr.microsoft.com/dotnet/aspnet:8.0.3`).
- Run as non-root user:

  ```dockerfile
  RUN adduser --disabled-password --gecos "" appuser
  USER appuser
  ```

- Include a `HEALTHCHECK` directive:

  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1
  ```

- Use `.dockerignore` to exclude build artifacts, tests, and documentation.
- Do not install unnecessary packages.
- Order layers from least to most frequently changing.

### Image Tagging

- Format: `ghcr.io/{org}/{service}:{semver}`.
- CI builds tag with Git SHA for traceability.
- Release builds tag with semantic version.

---

## 7. Terraform Standards

> See
> [[projects/platform-shipsolid/06-build-release/terraform-driver-styles|Terraform Driver Styles]]
> for which of the two repo driver patterns (Makefile+workload/env vs per-env wrapper dirs) a new
> root should follow. The standards below apply to both.

### Module Structure

Every module must include:

```
modules/{domain}/{module_name}/
  main.tf
  variables.tf
  outputs.tf
  versions.tf
```

### Variable Validation

All variables must include validation blocks where applicable:

```hcl
variable "environment" {
  type        = string
  description = "Deployment environment"
  validation {
    condition     = contains(["dev", "qa", "prod"], var.environment)
    error_message = "Environment must be dev, qa, or prod."
  }
}
```

### Provider Version Pinning

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
}
```

### State Management

- Remote state in Azure Storage Account.
- State locking enabled.
- One state file per environment per deployment unit.
- Never store state locally in CI.

### Output Documentation

All outputs must have a `description`:

```hcl
output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.this.name
}
```

---

## 8. API Standards

- RESTful APIs: use standard HTTP methods and status codes.
- All APIs must return JSON.
- Version APIs via URL path (`/api/v1/`) or header.
- Include request correlation ID in all responses.
- Rate limiting and circuit breakers for external-facing APIs.
- API documentation via OpenAPI/Swagger (auto-generated where possible).

---

## 9. CI/CD Standards

- All PRs must pass CI before merge.
- CI must include: lint, build, test, security scan.
- Use path-based triggers for monorepo efficiency.
- Secrets injected via GitHub Actions secrets, never committed.
- Container images pushed to GHCR (`ghcr.io`).

---

## Enforcement

- [[projects/platform-shipsolid/06-build-release/pre-commit-hooks|Pre-commit hooks]] enforce
  formatting and linting locally.
- CI pipelines enforce all standards automatically.
- CODEOWNERS ensures the right team reviews each change.
- Violations discovered post-merge must be addressed within one sprint.
