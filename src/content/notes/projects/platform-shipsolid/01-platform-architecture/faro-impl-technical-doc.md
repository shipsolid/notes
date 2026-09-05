---
title: "Faro / RUM Technical Design"
description: "**Applies to:** Angular 17+ SPAs **SDK versions:** `@grafana/faro-web-sdk ^2."
tags: ["ShipSolid", "Architecture"]
updated: 2026-05-01
hidden: false
zettelId: "202604080018"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/architecture-overview
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/observability-overview
    kind: related
---

## Grafana Faro RUM — Angular Implementation Technical Documentation

**Applies to:** Angular 17+ SPAs **SDK versions:** `@grafana/faro-web-sdk ^2.3.1`,
`@grafana/faro-web-tracing ^2.3.1` **Last updated:** 2026-04-07

---

## Overview

Grafana Faro is a JavaScript SDK for Real User Monitoring (RUM). It captures browser-side telemetry
— performance metrics, uncaught errors, and distributed trace spans — and ships them to a Grafana
Cloud Faro collector endpoint.

This document covers the complete implementation for an Angular SPA, including:

1. SDK installation
2. Faro initializer service
3. Angular bootstrap integration via `APP_INITIALIZER`
4. Source map upload for readable production stack traces
5. Build toolchain changes (`angular.json`, custom webpack)
6. CI/CD pipeline secret injection

---

## Architecture

```txt
Browser (SPA)
  └── Faro SDK (faro-web-sdk + faro-web-tracing)
        ├── Web Instrumentations  →  performance, errors, navigation events
        └── Tracing Instrumentation  →  distributed trace spans on HTTP calls
              └──  POST  →  Faro Collector (Grafana Cloud)

Build pipeline
  └── FaroSourceMapUploaderPlugin (webpack, build-time only)
        └──  POST  →  Faro API (Grafana Cloud)  [uploads .map files]
```

The collector endpoint receives runtime telemetry. The API endpoint receives source maps at build
time only — no credentials are ever shipped to the browser.

---

## 1. Package Installation

Add the following to `package.json`:

```json
{
  "dependencies": {
    "@grafana/faro-web-sdk": "^2.3.1",
    "@grafana/faro-web-tracing": "^2.3.1"
  },
  "devDependencies": {
    "@angular-builders/custom-webpack": "^17.0.2",
    "@grafana/faro-webpack-plugin": "^0.10.0"
  }
}
```

| Package                            | Type    | Purpose                                                              |
| ---------------------------------- | ------- | -------------------------------------------------------------------- |
| `@grafana/faro-web-sdk`            | runtime | Core RUM SDK — session tracking, error capture, performance metrics  |
| `@grafana/faro-web-tracing`        | runtime | Adds OpenTelemetry-compatible distributed tracing for HTTP spans     |
| `@angular-builders/custom-webpack` | dev     | Allows injecting a custom webpack config into the Angular CLI build  |
| `@grafana/faro-webpack-plugin`     | dev     | Build-time plugin that uploads compiled source maps to Grafana Cloud |

Install with:

```bash
npm install @grafana/faro-web-sdk @grafana/faro-web-tracing
npm install -D @angular-builders/custom-webpack @grafana/faro-webpack-plugin
```

---

## 2. Faro Initializer

**File:** `src/app/faro-initializer.ts`

```ts
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export function faroInitializer(): Function {
  return async () => {
    initializeFaro({
      url: 'https://faro-collector-prod-ca-east-0.grafana.net/collect/<YOUR_COLLECTOR_TOKEN>',
      app: {
        name: 'Frontend-MDIxAI',
        version: '1.0.0',
        environment: 'aca-dgeg-mdixai-prod',
      },
      sessionTracking: {
        samplingRate: 1,     // 1 = 100% of sessions; reduce for high-traffic apps
        persistent: true,    // session survives page refreshes
      },
      instrumentations: [
        ...getWebInstrumentations(),       // LCP, CLS, FID, navigation, fetch errors
        new TracingInstrumentation(),      // W3C trace-context propagation on HTTP
      ],
    });
  };
}
```

### Configuration reference

| Field                          | Description                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | Grafana Cloud Faro collector endpoint. Unique per app/environment.                     |
| `app.name`                     | Appears as the application label in Grafana dashboards.                                |
| `app.version`                  | Used to correlate errors with deployments. Update on each release.                     |
| `app.environment`              | Identifies the deployment environment (prod, qa, staging, etc.).                       |
| `sessionTracking.samplingRate` | `1` = all sessions captured. Lower to `0.1` to sample 10%.                             |
| `sessionTracking.persistent`   | `true` keeps session ID in `sessionStorage` across page navigations.                   |
| `getWebInstrumentations()`     | Spreads all default browser instrumentations (performance, errors, console).           |
| `TracingInstrumentation`       | Instruments `fetch`/`XHR` calls with W3C `traceparent` headers for end-to-end tracing. |

> **Note:** The collector URL token (`collect/<token>`) is not a secret — it is embedded in the
> browser bundle. Treat it as a public write-only key scoped to your Grafana stack.

---

## 3. Angular Bootstrap Integration

**File:** `src/app/app.config.ts`

Register `faroInitializer` as an `APP_INITIALIZER` so Faro starts before the Angular app renders any
routes or components.

```ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { faroInitializer } from './faro-initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers (MSAL, Router, HTTP, i18n, etc.)

    // Grafana Faro — must run before any user interaction
    {
      provide: APP_INITIALIZER,
      useFactory: faroInitializer,
      deps: [],     // inject Angular services here if faroInitializer needs them
      multi: true,
    },
  ],
};
```

### Why `APP_INITIALIZER`?

`APP_INITIALIZER` runs the returned async function before Angular bootstraps the root component.
This ensures:

- Errors thrown during startup are captured.
- The session is established before the first page navigation is recorded.
- Trace context is available before the first HTTP request fires.

---

## 4. Source Map Upload (Readable Production Stack Traces)

Without source maps, production errors in Grafana look like:

```txt
at t.handleError (main.4f2a9c.js:1:48291)
```

With source maps uploaded at build time, Grafana translates this to:

```txt
at GlobalErrorHandler.handleError (src/app/core/errors/globalErrorHandler.ts:11:8)
```

### 4a. Custom Webpack Configuration

**File:** `custom-webpack.config.ts` (project root)

```ts
import FaroSourceMapUploaderPlugin from '@grafana/faro-webpack-plugin';

module.exports = {
  plugins: [
    new FaroSourceMapUploaderPlugin({
      appName: 'Frontend-MDIxAI',
      endpoint: 'https://faro-api-prod-ca-east-0.grafana.net/faro/api/v1',
      appId: '296',
      stackId: '1162129',
      verbose: true,
      apiKey: process.env['FARO_API_KEY'] || '',
      gzipContents: true,
    }),
  ],
};
```

| Field          | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `appName`      | Must match `app.name` in `faro-initializer.ts` exactly.            |
| `endpoint`     | Grafana Cloud Faro API endpoint (distinct from the collector URL). |
| `appId`        | Numeric app ID assigned in Grafana Cloud.                          |
| `stackId`      | Numeric Grafana Cloud stack ID.                                    |
| `apiKey`       | **Secret.** Read from environment variable — never hardcoded.      |
| `gzipContents` | Compresses source maps before upload to reduce transfer size.      |

> **Security:** `apiKey` is only used at build time inside the webpack plugin. It is never included
> in the compiled browser bundle. Store it as a CI/CD pipeline secret (`FARO_API_KEY`).

### 4b. Angular Builder Configuration

**File:** `angular.json`

Switch from the default Angular browser builder to the custom-webpack-aware one, and enable hidden
source maps for non-development configurations.

```json
{
  "architect": {
    "build": {
      "builder": "@angular-builders/custom-webpack:browser",
      "options": {
        "customWebpackConfig": {
          "path": "./custom-webpack.config.ts"
        },
        "outputPath": "dist/mc-cain-app",
        "index": "src/index.html",
        "main": "src/main.ts"
      },
      "configurations": {
        "production": {
          "sourceMap": { "scripts": true, "hidden": true }
        },
        "perf": {
          "sourceMap": { "scripts": true, "hidden": true }
        },
        "qa": {
          "sourceMap": { "scripts": true, "hidden": true }
        },
        "staging": {
          "sourceMap": { "scripts": true, "hidden": true }
        },
        "development": {
          "sourceMap": true
        }
      }
    },
    "serve": {
      "builder": "@angular-builders/custom-webpack:dev-server"
    }
  }
}
```

**Source map strategy:**

| Configuration                         | `sourceMap` value                     | Effect                                                                                          |
| ------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `production`, `qa`, `perf`, `staging` | `{ "scripts": true, "hidden": true }` | Maps generated but not referenced from the bundle — uploaded to Grafana, not served to browsers |
| `development`                         | `true`                                | Full inline maps for local debugging                                                            |

`hidden: true` is critical for production. It generates the `.map` files (needed for Grafana upload)
without embedding the `//# sourceMappingURL` comment in the JS bundle, so browsers never fetch them.

---

## 5. CI/CD Pipeline Secret Injection

**File:** `pipeline.yml` (GitHub Actions example)

```yaml
env:
  FARO_API_KEY: ${{ secrets.FARO_API_KEY }}
  NODE_OPTIONS: --max-old-space-size=4096
```

Store `FARO_API_KEY` as a repository or environment secret in your CI/CD system. The `NODE_OPTIONS`
increase is recommended because building with source maps under custom webpack is memory-intensive.

**Required pipeline secret:**

| Secret name    | Where to obtain                                             |
| -------------- | ----------------------------------------------------------- |
| `FARO_API_KEY` | Grafana Cloud → Your Stack → Faro → API Keys → Generate key |

---

## 6. Verification Checklist

After deploying, confirm the integration is working:

- [ ] Open the app in a browser. In the Network tab, verify `POST` requests to
      `faro-collector-prod-ca-east-0.grafana.net/collect/...` return `202 Accepted`.
- [ ] Navigate between routes. Confirm page view events appear in Grafana → Faro → Frontend
      Observability.
- [ ] Trigger a deliberate JS error. Confirm it surfaces in Grafana with a readable TypeScript stack
      trace (validates source map upload).
- [ ] Inspect an outbound HTTP request. Confirm a `traceparent` header is present (validates
      `TracingInstrumentation`).
- [ ] Check the build logs for `FaroSourceMapUploaderPlugin` output (enabled by `verbose: true`).
      Confirm maps uploaded with HTTP 200.

---

## 7. Troubleshooting

| Symptom                             | Likely cause                                    | Fix                                                                                               |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| No events in Grafana                | Wrong collector URL / token                     | Verify `url` in `faro-initializer.ts` matches the Grafana Cloud collector endpoint for your stack |
| Source map upload returns 401       | Missing or wrong `FARO_API_KEY`                 | Confirm the secret is set in CI and the key has write access to Faro API                          |
| Stack traces still minified         | Source maps not uploaded or `appName` mismatch  | Ensure `appName` in webpack config exactly matches `app.name` in initializer                      |
| `traceparent` header missing        | `TracingInstrumentation` not included           | Confirm it is spread in `instrumentations` array                                                  |
| Build out of memory                 | Large app + source maps                         | Increase `--max-old-space-size` in `NODE_OPTIONS`                                                 |
| Session not persisting across pages | `persistent: false` or `sessionStorage` blocked | Set `sessionTracking.persistent: true`; check browser storage policies                            |

---

## 8. Key Decisions and Rationale

**`APP_INITIALIZER` over constructor injection:** Guarantees Faro is active before any route
resolves or HTTP call fires. Constructor-based init would miss errors during the bootstrap phase.

**Hidden source maps over no source maps:** Enables readable errors in Grafana without leaking
original source to end users. The `.map` files exist on the build server and Grafana Cloud only.

**`samplingRate: 1` for 100% capture:** Appropriate for apps with moderate traffic. For high-volume
apps, reduce to `0.1`–`0.5` to control data ingestion costs.

**`apiKey` in `process.env` only:** The webpack plugin runs in Node at build time. The key is never
serialized into the browser bundle regardless of where it appears in `custom-webpack.config.ts`.

---

## Related

- [[projects/platform-shipsolid/01-platform-architecture/architecture-overview|Architecture Overview]]
  — the platform architecture this RUM implementation sits within.
- [[projects/platform-shipsolid/01-platform-architecture/observability-overview|Observability Overview]]
  — pillar overview for the metrics/logs/traces backend this frontend telemetry feeds into.
