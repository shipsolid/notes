---
title: "1 — PromQL Cheat Sheet"
description: "A grouped, copy-paste reference of node_exporter PromQL queries for CPU, memory, disk, network, swap, inode, and TCP socket questions."
tags: ["prometheus", "appendix", "book"]
updated: "2026-07-18"
hidden: false
zettelId: "202607181229-44"
relations:
  - slug: prometheus/05-promql-masterclass/02-promql-functions/02-promql-functions
    kind: depends_on
  - slug: prometheus/05-promql-masterclass/03-aggregation-operators/03-aggregation-operators
    kind: depends_on
  - slug: prometheus/11-appendices/04-exporter-catalog/04-exporter-catalog
    kind: related
---

# 1 — PromQL Cheat Sheet

## Purpose

This chapter is a lookup table, not a tutorial. It takes a real Grafana node_exporter dashboard
export — the raw JSON query strings, escaped quotes and all — and reformats it into a clean,
question-first reference: "I want to know X, here is the PromQL for it." Group the queries by
resource area (CPU, memory, disk, network, swap, inodes, TCP sockets) and copy the expression you
need.

For a full explanation of the functions used below (`rate()`, `irate()`, `avg_over_time()`,
`increase()`, `sum by`, etc.), see [[02-promql-functions|PromQL Functions]] and
[[03-aggregation-operators|Aggregation Operators]]. This chapter does not re-explain them.

## Template variables

The original dashboard export uses Grafana template variables — these are dashboard-level dropdown
filters, not part of PromQL itself. Substitute real label values when running these directly against
Prometheus (e.g. in the Prometheus UI or `promtool query`):

| Variable                         | Stands in for                                                      | Example substitution        |
| -------------------------------- | ------------------------------------------------------------------ | --------------------------- |
| `$job`                           | the scrape job name                                                | `job="node"`                |
| `$instance`                      | a specific target (`host:port`)                                    | `instance="10.0.1.12:9100"` |
| `$hostname`                      | the `hostname` label exposed by node_exporter                      | `hostname="web-01"`         |
| `$interval`                      | the range-vector duration for `rate()`/`irate()`/`avg_over_time()` | `5m`                        |
| `$device`                        | a network interface name                                           | `device="eth0"`             |
| `$maxmount`                      | a filesystem mountpoint                                            | `mountpoint="/"`            |
| `$app`                           | an application/process group label                                 | `app="checkout-api"`        |
| `$origin_prometheus`, `$envname` | dashboard scoping labels for multi-cluster setups                  | `envname="prod"`            |

Every table below assumes these are already substituted with real values — the label matchers are
omitted from the "PromQL" column for readability except where they carry meaning (e.g. `mode=`,
`fstype=`).

## CPU

| Question                                                               | PromQL                                                                                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| What CPU usage rate (%) is a node running?                             | `(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[$interval])) by (instance)) * 100`                                |
| How busy is the CPU (inverse of idle)?                                 | `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[$interval])) * 100)`                                            |
| What percentage of time is spent waiting on I/O?                       | `avg(rate(node_cpu_seconds_total{mode="iowait"}[$interval])) * 100`                                                  |
| What percentage of time is spent in system/user/iowait mode, per host? | `avg(rate(node_cpu_seconds_total{mode="system"}[$interval])) by (hostname) * 100` (swap `mode=` for `user`/`iowait`) |
| What is the overall (fleet-wide) average CPU used %?                   | `avg(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[$interval])) by (instance)) * 100`                             |
| How many CPU cores does a host have?                                   | `count(node_cpu_seconds_total{mode="system"}) by (instance)`                                                         |
| What is the 1m / 5m / 15m load average?                                | `node_load1`, `node_load5`, `node_load15`                                                                            |

## Memory

| Question                                                        | PromQL                                                                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| What percentage of memory is used?                              | `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`                                       |
| What is total installed memory?                                 | `node_memory_MemTotal_bytes`                                                                                      |
| How much memory is actually used (Total − Available)?           | `node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes`                                                     |
| How much memory is available for new allocations?               | `node_memory_MemAvailable_bytes`                                                                                  |
| How much is held in buffers / free / cache?                     | `node_memory_Buffers_bytes`, `node_memory_MemFree_bytes`, `node_memory_Cached_bytes`                              |
| What is the "basic" memory usage excluding cache/buffers/free?  | `node_memory_MemTotal_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes + node_memory_MemFree_bytes)` |
| What is total memory and average used % across the whole fleet? | `sum(node_memory_MemTotal_bytes)`; used % = `(sum(MemTotal - MemAvailable) / sum(MemTotal)) * 100`                |

## Disk

| Question                                                        | PromQL                                                                                                                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------- | -------- |
| What is the maximum disk read/write rate across instances?      | `max(rate(node_disk_read_bytes_total[$interval])) by (instance)` / `node_disk_written_bytes_total`                                                                           |
| What are total disk IOPS (reads + writes completed per second)? | `sum by (hostname) (irate(node_disk_reads_completed_total{device=~"sd.*"}[$interval]) + irate(node_disk_writes_completed_total{device=~"sd.*"}[$interval]))`                 |
| What is total disk throughput (bytes/sec, read + write)?        | `sum by (hostname) (irate(node_disk_read_bytes_total{device=~"sd.*"}[$interval]) + irate(node_disk_written_bytes_total{device=~"sd.*"}[$interval]))`                         |
| What % of a partition is used?                                  | `(node_filesystem_size_bytes{fstype=~"ext.?                                                                                                                                  | xfs"} - node_filesystem_free_bytes{fstype=~"ext.? | xfs"}) \* 100 / (node_filesystem_avail_bytes{fstype=~"ext.? | xfs"} + (node_filesystem_size_bytes{fstype=~"ext.? | xfs"} - node_filesystem_free_bytes{fstype=~"ext.? | xfs"}))` |
| What is the read/write latency per operation?                   | `rate(node_disk_read_time_seconds_total[$interval]) / rate(node_disk_reads_completed_total[$interval])` (write: swap `read` for `write`) — reference: keep this below ~100ms |
| How much time is spent doing I/O on a device?                   | `rate(node_disk_io_time_seconds_total[$interval])`                                                                                                                           |
| What is the weighted I/O time?                                  | `rate(node_disk_io_time_weighted_seconds_total[$interval])`                                                                                                                  |
| How many I/Os are in flight right now?                          | `node_disk_io_now`                                                                                                                                                           |

## Inodes

| Question                                                              | PromQL                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- | ------ |
| How many free inodes are left on a mountpoint?                        | `avg(node_filesystem_files_free{fstype=~"ext.?                  | xfs"})`                                      |
| What fraction of inodes are free?                                     | `node_filesystem_files_free{fstype=~"ext.?                      | xfs"} / node_filesystem_files{fstype=~"ext.? | xfs"}` |
| What is total available file descriptors, and how many are allocated? | `node_filefd_maximum` (limit), `node_filefd_allocated` (in use) |
| What % of file descriptors are used?                                  | `(node_filefd_allocated / node_filefd_maximum) * 100`           |

## Swap

| Question                                                        | PromQL                                                                                                                                                                                                                                    |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What % of swap is in use?                                       | `((avg_over_time(node_memory_SwapTotal_bytes[$interval]) - avg_over_time(node_memory_SwapFree_bytes[$interval]) - avg_over_time(node_memory_SwapCached_bytes[$interval])) / avg_over_time(node_memory_SwapTotal_bytes[$interval])) * 100` |
| A simpler used-swap % (avoids divide-by-zero on swapless hosts) | `(1 - ((node_memory_SwapFree_bytes + 1) / (node_memory_SwapTotal_bytes + 1))) * 100`                                                                                                                                                      |

## Network

| Question                                                    | PromQL                                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| What is download/upload bandwidth (bits/sec)?               | `max(rate(node_network_receive_bytes_total[$interval]) * 8) by (instance)` / `node_network_transmit_bytes_total`               |
| What is total network throughput (receive + transmit)?      | `sum by (hostname) (irate(node_network_receive_bytes_total[$interval]) + irate(node_network_transmit_bytes_total[$interval]))` |
| What is bandwidth usage per second for a specific device?   | `rate(node_network_receive_bytes_total{device=~"$device"}[$interval]) * 8`                                                     |
| How much traffic has an interface handled in the last hour? | `increase(node_network_receive_bytes_total{device=~"$device"}[60m])` (transmit: swap metric name)                              |

## TCP sockets & connections

| Question                                                          | PromQL                                                                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| How many established TCP connections are there?                   | `node_netstat_Tcp_CurrEstab`                                                                                                              |
| How many connections are in TIME_WAIT?                            | `node_sockstat_TCP_tw`                                                                                                                    |
| How many sockets are in use, and how many TCP/UDP allocations?    | `node_sockstat_sockets_used`, `node_sockstat_TCP_alloc`, `node_sockstat_UDP_inuse`                                                        |
| What is the rate of new active/passive TCP opens?                 | `rate(node_netstat_Tcp_ActiveOpens[$interval])` / `node_netstat_Tcp_PassiveOpens`                                                         |
| What is the segment rate (in/out/retransmitted)?                  | `rate(node_netstat_Tcp_InSegs[$interval])`, `node_netstat_Tcp_OutSegs`, `node_netstat_Tcp_RetransSegs`                                    |
| How often is the kernel dropping connections at the listen queue? | `rate(node_netstat_TcpExt_ListenDrops[$interval])`                                                                                        |
| What is CPU/memory usage broken down by named process group?      | `avg(rate(namedprocess_namegroup_cpu_seconds_total{app="$app"}[$interval])) by (groupname) * 100` / `namedprocess_namegroup_memory_bytes` |
| How long has a host been up?                                      | `time() - node_boot_time_seconds`                                                                                                         |
| How many context switches per second?                             | `rate(node_context_switches_total[$interval])`                                                                                            |

## Metadata

|        |            |
| ------ | ---------- |
| Author | Amit Singh |
| Scope  | prometheus |
