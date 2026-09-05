---
title: "2 — Security"
description: "Securing the exporter-to-Prometheus link with TLS and basic auth — self-signed certs, bcrypt password hashing, tls_server_config, and end-to-end curl verification, plus an honest look at what this setup doesn't cover."
tags: ["prometheus", "operations", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-29"
relations:
  - slug: observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy
    kind: related
  - slug: system-design/08-observability/05-telemetry-ingestion-pipeline/05-18-authentication
    kind: compared_to
  - slug: networks/06-security/02-tls/02-tls-offload
    kind: related
---

# 2 — Security

A default Prometheus install talks to its targets in plain text with no credentials at all — any
host that can reach port `9100` can read every metric a Node Exporter exposes, and any host that can
reach Prometheus's own port can scrape or query it. Closing that gap means answering two separate
questions for every scrape target:

- **Encryption** — is the metrics payload protected in transit between Prometheus and the node?
- **Authentication** — is Prometheus (and anyone else) required to prove who they are before they
  can scrape?

This chapter walks through both, end to end, on a systemd-managed Node Exporter host scraped by a
systemd-managed Prometheus server — the same shape as the rest of this book's install material.

## TLS on the exporter side

Node Exporter (and the other first-party exporters) can terminate TLS itself via a `--web.config`
file. The first step is a certificate. For a real target this would come from an internal CA or a
tool like cert-manager; for a self-signed one:

```bash
$ sudo openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
  -keyout node_exporter.key -out node_exporter.crt \
  -subj "/C=US/ST=California/L=Oakland/O=MyOrg/CN=localhost" \
  -addext "subjectAltName = DNS:localhost"
```

Move the cert and key into a directory only the exporter's own user can read:

```bash
# on the node exporter host
mkdir /etc/node_exporter/
touch /etc/node_exporter/config.yml
chmod 700 /etc/node_exporter
chmod 600 /etc/node_exporter/config.yml
chown -R nodeusr:nodeusr /etc/node_exporter
```

`config.yml` is Node Exporter's `--web.config` file — this is where `tls_server_config` lives:

```yaml
tls_server_config:
  cert_file: node_exporter.crt
  key_file: node_exporter.key
```

Point the systemd unit at it and restart:

```bash
$ vi /etc/systemd/system/node_exporter.service
# ExecStart=/usr/local/bin/node_exporter
# becomes:
# ExecStart=/usr/local/bin/node_exporter --web.config=/etc/node_exporter/config.yml

$ systemctl daemon-reload
$ systemctl restart node_exporter
```

A plain `curl` against the exporter now fails with an SSL error — proof TLS is actually being
enforced, not just configured:

```bash
$ curl https://localhost:9100/metrics
# curl: (60) SSL certificate problem: self-signed certificate

$ curl -k https://localhost:9100/metrics
# works — -k skips certificate verification, which is only acceptable for this kind of
# local sanity check, never for a real scrape config
```

## Pointing Prometheus at the TLS endpoint

Prometheus needs the exporter's certificate (or the CA that issued it) to verify the connection, and
the scrape config needs to switch scheme to `https`:

```bash
scp username@node:/etc/node_exporter/node_exporter.crt /etc/prometheus
chown prometheus:prometheus node_exporter.crt
```

```yaml
scrape_configs:
  - job_name: "node"
    scheme: https
    tls_config:
      ca_file: /etc/prometheus/node_exporter.crt
      insecure_skip_verify: true # only for self-signed certs — drop this once a real CA is in place
    static_configs:
      - targets: ["192.168.1.168:9100"]
```

```bash
vi /etc/prometheus/prometheus.yml
systemctl restart prometheus
```

`insecure_skip_verify` disables hostname/chain verification on the Prometheus side — it exists so a
self-signed cert doesn't get rejected outright, but it also means Prometheus isn't actually
confirming it's talking to the node it thinks it is. A cert issued by a real (even internal) CA
removes the need for it entirely.

## Basic auth: hashing the password

TLS alone only encrypts the channel — it does nothing to stop an unauthenticated scrape. Node
Exporter's `--web.config` also supports `basic_auth_users`, keyed by a bcrypt hash rather than a
plain-text password:

```bash
$ sudo apt install apache2-utils
$ htpasswd -nBC 12 "" | tr -d ':\n'
# New password:
# Re-type new password:
# $2y$12$gfAopKVOO8KKO63rJe0Z9efGRx3OqJEZ9vC8IxBP9.cXkurgugc6
```

Or generate the same hash in code, if `htpasswd` isn't available on the box doing the hashing:

```python
import getpass
import bcrypt

password = getpass.getpass("password: ")
hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
print(hashed_password.decode())
```

Both `tls_server_config` and `basic_auth_users` live in the same `config.yml`:

```yaml
tls_server_config:
  cert_file: node_exporter.crt
  key_file: node_exporter.key
basic_auth_users:
  prometheus: $2y$12$dCqkk9uah20wF # <username>: <bcrypt-hash>
```

```bash
vi /etc/node_exporter/config.yml
systemctl restart node_exporter
```

The moment this ships, the target flips to **Unauthorized** in Prometheus's own UI, because the
scrape config hasn't caught up yet:

```yaml
scrape_configs:
  - job_name: "node"
    scheme: https
    basic_auth:
      username: prometheus
      password: password # plain-text here — Prometheus reads it from prometheus.yml at scrape time
```

```bash
vi /etc/prometheus/prometheus.yml
systemctl restart prometheus
```

After the restart, the target goes back to **UP**. Note the asymmetry: the password is bcrypt-hashed
on the exporter side (so a leaked `config.yml` doesn't hand over the credential directly) but sits
in plain text in `prometheus.yml`, which is why file permissions on that config matter as much as
the hash itself.

## End-to-end verification

Putting both pieces together, on a fresh node the full sequence looks like this:

```bash
# 1. hash the password
htpasswd -nBC 10 "" | tr -d ':\n'; echo

# 2. wire it into node_exporter's config.yml
vi /etc/node_exporter/config.yml
# basic_auth_users:
#   prometheus: <hashed-password>
systemctl restart node_exporter

# 3. confirm auth is enforced
curl http://node01:9100/metrics
# Unauthorized
curl -u username:password http://node01:9100/metrics
# metrics returned

# 4. generate and install the cert/key
openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
  -keyout node_exporter.key -out node_exporter.crt \
  -subj "/C=US/ST=California/L=Oakland/O=MyOrg/CN=localhost" \
  -addext "subjectAltName = DNS:localhost"
mv node_exporter.crt node_exporter.key /etc/node_exporter/
chown nodeusr.nodeusr /etc/node_exporter/node_exporter.key
chown nodeusr.nodeusr /etc/node_exporter/node_exporter.crt

# tls_server_config added to config.yml, node_exporter restarted, then:
curl -u prometheus:secret-password -k https://node01:9100/metrics
# metrics returned over TLS, with credentials required

# 5. Prometheus-side scrape config gets scheme: https, tls_config, and basic_auth,
#    prometheus.service restarted, target shows UP
```

The second node in a cluster follows the same steps, minus regenerating the password hash — the same
bcrypt hash can be reused across `basic_auth_users` entries on every host sharing that credential.

## What this setup does not cover

Being direct about the gaps here matters more than the walkthrough itself:

- **This is one-way TLS, not
  [[system-design/08-observability/05-telemetry-ingestion-pipeline/05-18-authentication|mTLS]].**
  Prometheus verifies the exporter's certificate (or skips verification entirely via
  `insecure_skip_verify`); the exporter never verifies Prometheus's identity. A node that trusts the
  right CA cert can still be scraped by any Prometheus instance that knows the basic-auth credential
  — there's no client certificate on the Prometheus side. True mutual TLS would add a
  `client_ca_file` to the exporter's `tls_server_config` and a matching `cert_file`/`key_file` pair
  under Prometheus's own `tls_config`, but that pattern isn't in this book's source material yet.
- **Authorization is out of scope.** Basic auth answers "is this a known credential," not "is this
  caller allowed to see these specific series." There's no scrape-level or query-level ACL here —
  anyone holding the shared `prometheus` credential can read everything the target exposes.
- **Secrets management is unaddressed.** The password lives in plain text in `prometheus.yml` and
  the bcrypt hash in `config.yml`, both ordinary files protected only by Unix permissions. Nothing
  here rotates credentials, pulls them from a vault, or scopes them per-team — that's a real gap in
  this walkthrough, not a design choice.
- **Multi-tenant isolation is a different problem entirely.** Everything above secures a single
  Prometheus talking to a single set of targets it fully trusts. Once multiple teams or customers
  share the same observability platform, the questions change to tenant identification and quota
  fairness — covered in
  [[observability/01-observability-architecture/07-multi-tenant-observability/07-multi-tenancy|Multi-Tenancy]].

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
