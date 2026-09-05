---
title: "4 — Exporter Catalog"
description: "A lookup table of exporters covered in this book — key metrics, metric types, and what each metric tells you — for the two exporters with real worked examples in the source material."
tags: ["prometheus", "appendix", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-40"
relations:
  - slug: prometheus/03-instrumentation/02-exporters/02-exporters
    kind: depends_on
  - slug: prometheus/11-appendices/01-promql-cheat-sheet/01-promql-cheat-sheet
    kind: related
---

# 4 — Exporter Catalog

## Purpose

A quick-reference lookup table for exporters seen in this book's demos. This is deliberately a
table, not a narrative — for install steps, systemd unit files, and TLS/auth walkthroughs, see
[[02-exporters|Exporters]]. This chapter only restates the facts in lookup form: which metrics an
exporter exposes, what type each one is, and what it tells you.

## Catalogued exporters

| Exporter                                            | Key metrics                                                                                               | Metric type         | What it tells you                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Node Exporter** (Linux, default port `9100`)      | `node_cpu_seconds_total{cpu, mode}`                                                                       | Counter             | Cumulative CPU time per core per mode (idle/user/system/iowait/etc.) — rate it to get CPU usage %               |
|                                                     | `node_memory_MemTotal_bytes`, `node_memory_MemAvailable_bytes`                                            | Gauge               | Total installed memory and memory available for new allocations right now                                       |
|                                                     | `node_filesystem_avail_bytes`, `node_filesystem_size_bytes`, `node_filesystem_free_bytes`                 | Gauge               | Available/total/free space per mountpoint+device — divide to get free/used %                                    |
|                                                     | `node_disk_read_bytes_total`, `node_disk_written_bytes_total`                                             | Counter             | Cumulative bytes read/written per disk device — rate it for throughput                                          |
|                                                     | `node_load1`, `node_load5`, `node_load15`                                                                 | Gauge               | 1/5/15-minute system load averages                                                                              |
|                                                     | `node_boot_time_seconds`                                                                                  | Gauge               | Unix timestamp of last boot — `time() - node_boot_time_seconds` gives uptime                                    |
|                                                     | `node_netstat_Tcp_CurrEstab`, `node_sockstat_TCP_tw`                                                      | Gauge               | Current established TCP connections / connections in TIME_WAIT                                                  |
| **Windows Exporter** (Windows, default port `9182`) | `windows_os_info{version, ...}`                                                                           | Informational gauge | Static text describing OS version and type (value is always 1; the label carries the information)               |
|                                                     | `windows_cpu_time_total{core, mode}`                                                                      | Counter             | Cumulative CPU time per core per work mode (idle/user/system) — same shape as `node_cpu_seconds_total` on Linux |
|                                                     | `windows_logical_disk_read_seconds_total`, `windows_logical_disk_write_seconds_total` (labeled by volume) | Counter             | Cumulative seconds spent on disk read/write operations per logical volume                                       |
|                                                     | `windows_logical_disk_free_bytes`                                                                         | Gauge               | Free space on a logical disk, in bytes                                                                          |

## Not yet catalogued

The following exporters are referenced elsewhere in the observability landscape but have no worked
example in this book's source material — no real metric names have been captured for them here, so
none are invented. Each remains a gap until a hands-on demo produces real metric names to record:

| Exporter            | Status             |
| ------------------- | ------------------ |
| Blackbox Exporter   | Not yet catalogued |
| SNMP Exporter       | Not yet catalogued |
| PostgreSQL Exporter | Not yet catalogued |
| MySQL Exporter      | Not yet catalogued |
| Redis Exporter      | Not yet catalogued |
| Kafka Exporter      | Not yet catalogued |
| HAProxy Exporter    | Not yet catalogued |
| NGINX Exporter      | Not yet catalogued |

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
