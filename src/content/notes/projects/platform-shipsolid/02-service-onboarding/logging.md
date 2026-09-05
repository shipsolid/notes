---
title: "Logging Contract"
description: "**Applies to:** All application teams deploying to AKS clusters monitored by the ShipSolid SRE"
tags: ["ShipSolid", "Onboarding"]
updated: 2026-05-01
hidden: false
zettelId: "202603241245-7"
relations:
  - slug: projects/platform-shipsolid/02-service-onboarding/logging-guidelines
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/logs-instrumentation-guide
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/metrics
    kind: related
  - slug: projects/platform-shipsolid/02-service-onboarding/tracing
    kind: related
---

## Logging Contract

**Applies to:** All application teams deploying to AKS clusters monitored by the ShipSolid SRE
Observability platform.

## Why This Matters

The Alloy log pipeline filters pod logs **before** they reach Loki. For application namespaces, logs
at `TRACE`, `DEBUG`, and `INFO` are **silently dropped**. The pipeline identifies log levels by
matching patterns in the raw log line — it looks for:

- JSON fields: `"level": "info"`, `"level": "warn"`, etc.
- Key=value: `level=INFO`, `level=WARN`
- Bracketed: `[INFO]`, `[WARN]`, `[ERROR]`

**If your log output does not match one of these patterns, the platform cannot determine the level
and the log line may be dropped or retained unpredictably.** Structured JSON output is the most
reliable format.

---

## Requirements

### 1. Use Structured (JSON) Logging

All logs must be emitted as a single JSON object per line to stdout or stderr.

**Required fields in every log line:**

| Field       | Description                      | Example                         |
| ----------- | -------------------------------- | ------------------------------- |
| `timestamp` | ISO 8601 UTC                     | `"2024-11-15T10:23:45.123Z"`    |
| `level`     | Log severity (see below)         | `"warn"`                        |
| `service`   | Name of this service/application | `"mdixai-api"`                  |
| `message`   | Human-readable description       | `"Database connection timeout"` |

Additional context fields are encouraged (e.g. `trace_id`, `span_id`, `request_id`, `user_id`).

### 2. Use Correct Log Levels

| Level   | When to Use                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ERROR` | Unrecoverable failures requiring immediate investigation (e.g. unhandled exception, data loss)                            |
| `WARN`  | Recoverable issues or unexpected conditions that do not stop operation (e.g. retry succeeded, config fallback used)       |
| `INFO`  | Normal operational events of business significance (e.g. service started, job completed) — **filtered out in production** |
| `DEBUG` | Developer diagnostic details — **always filtered out**                                                                    |
| `TRACE` | Fine-grained step tracing — **always filtered out**                                                                       |

> **Do not use `ERROR` for expected conditions** (e.g. validation failures, 404 responses). Over-use
> of `ERROR` causes alert fatigue and obscures real failures.

### 3. No PII in Log Messages

Do not log personally identifiable information including names, email addresses, user IDs,
passwords, tokens, or IP addresses.

---

## Python Implementation

### Recommended: `python-json-logger`

```bash
pip install python-json-logger
```

```python
import logging
import sys
from pythonjsonlogger import jsonlogger

def configure_logging(service_name: str, level: str = "WARNING") -> None:
    handler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S.%fZ",
        rename_fields={
            "asctime": "timestamp",
            "levelname": "level",
            "name": "logger",
        },
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(getattr(logging, level.upper(), logging.WARNING))

    # Inject service name into all log records
    old_factory = logging.getLogRecordFactory()
    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.service = service_name
        return record
    logging.setLogRecordFactory(record_factory)
```

**Usage:**

```python
configure_logging(service_name="mdixai-api")

logger = logging.getLogger(__name__)
logger.warning("Cache miss, falling back to database", extra={"cache_key": "user:42"})
logger.error("Failed to connect to upstream service", extra={"host": "upstream-svc", "attempt": 3})
```

**Resulting log line (visible in Loki):**

```json
{"timestamp": "2024-11-15T10:23:45.123456Z", "level": "WARNING", "logger": "app.db", "service": "mdixai-api", "message": "Cache miss, falling back to database", "cache_key": "user:42"}
```

### Alternative: `structlog`

```bash
pip install structlog
```

```python
import structlog
import logging
import sys

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True, key="timestamp"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
)

log = structlog.get_logger().bind(service="mdixai-api")
log.warning("cache_miss", cache_key="user:42")
log.error("upstream_connection_failed", host="upstream-svc", attempt=3)
```

### FastAPI / Uvicorn

Override uvicorn's default formatter to emit JSON:

```python
from uvicorn.config import LOGGING_CONFIG

LOGGING_CONFIG["formatters"]["default"] = {
    "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
    "fmt": "%(asctime)s %(levelname)s %(name)s %(message)s",
}
LOGGING_CONFIG["formatters"]["access"] = {
    "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
    "fmt": "%(asctime)s %(levelname)s %(name)s %(message)s",
}
```

---

## .NET Implementation

### Recommended: `Serilog` with JSON console sink

```bash
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Formatting.Compact
```

**`Program.cs`:**

```csharp
using Serilog;
using Serilog.Formatting.Compact;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Warning()                          // Matches platform default: warn+
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Error)
    .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Error)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service", "mdixai-api")
    .Enrich.WithProperty("version", Environment.GetEnvironmentVariable("APP_VERSION") ?? "unknown")
    .WriteTo.Console(new CompactJsonFormatter())      // Emits CLEF JSON — parsed correctly by Alloy
    .CreateLogger();

builder.Host.UseSerilog();
```

**Usage:**

```csharp
private readonly ILogger<OrderController> _logger;

_logger.LogWarning("Inventory low for product {ProductId}, threshold {Threshold}", productId, 10);
_logger.LogError(ex, "Failed to process order {OrderId}", orderId);
```

**Resulting log line:**

```json
{"@t":"2024-11-15T10:23:45.1234567Z","@l":"Warning","@mt":"Inventory low for product {ProductId}, threshold {Threshold}","service":"mdixai-api","ProductId":"SKU-42","Threshold":10}
```

> The `@l` field (Serilog's compact level field) is recognized by the Alloy log filter pipeline.

### Minimum Level Per Environment

Configure log level via environment variable or `appsettings.{Environment}.json`:

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning",
      "Override": {
        "Microsoft": "Error",
        "Microsoft.Hosting.Lifetime": "Warning",
        "System": "Error"
      }
    }
  }
}
```

| Environment    | Recommended Minimum Level              |
| -------------- | -------------------------------------- |
| `dev`          | `Information` (local development only) |
| `qa` / `train` | `Warning`                              |
| `prod`         | `Warning`                              |

---

## Validation Checklist

Before deploying, verify your logging setup:

- [ ] Logs are emitted as one JSON object per line to stdout
- [ ] Each log line contains `timestamp`, `level`, `service`, `message`
- [ ] Log level strings are standard: `trace`, `debug`, `info`/`information`, `warn`/`warning`,
      `error`
- [ ] `ERROR` is not used for expected conditions (validation failures, 404s, auth rejections)
- [ ] No PII appears in log messages or structured fields
- [ ] Application is configured to log at `WARNING` or above in non-dev environments
- [ ] Uvicorn/ASP.NET framework loggers are set to `ERROR` to suppress noisy framework logs

---

## Related

- [[projects/platform-shipsolid/02-service-onboarding/logging-guidelines|Logging Implementation Guidelines]]
  — platform-side pipeline setup (Alloy → Loki) that consumes this contract.
- [[projects/platform-shipsolid/02-service-onboarding/logs-instrumentation-guide|Logs Instrumentation Guide]]
  — application-side code snippets implementing this contract.
- [[projects/platform-shipsolid/02-service-onboarding/metrics|Metrics Contract]] and
  [[projects/platform-shipsolid/02-service-onboarding/tracing|Tracing Contract]] — the companion
  signal contracts every service must also satisfy.
