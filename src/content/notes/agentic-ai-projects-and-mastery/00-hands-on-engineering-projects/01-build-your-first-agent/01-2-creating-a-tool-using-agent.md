---
title: "1.2 Creating a Tool-Using Agent"
description: "Designing an agent from scratch — defining tools, wiring tool calling, building prompt templates, and generating a final response, without a framework in the way."
tags: ["agentic-ai-projects-and-mastery", "hands-on-engineering-projects", "book"]
hidden: false
zettelId: "202607151031-5"
---

## Creating a Tool-Using Agent

### What you will understand at the end

- How to define tools the LLM can call using JSON Schema
- The exact three-step message exchange that constitutes one tool-use round trip
- Why the agent loop continues until `stop_reason == "end_turn"` — not just once
- How to dispatch tool calls to real (or simulated) Python functions

---

### The problem this lab solves

The Hello Agent (User Story 1.1) calls the LLM once and returns the answer. That works for pure
knowledge questions, but it breaks immediately for operational questions like _"Why is my
application slow?"_

The LLM does not have access to your Prometheus metrics, your Loki logs, or your Tempo traces. It
cannot check. All it can do is guess — and guesses are not useful in an SRE context.

Tool use solves this by giving the LLM a defined interface to request data. The LLM says _"I need
the CPU metrics for the api service"_, your code fetches them, and the LLM reads the result and
continues reasoning.

---

### How tool calling works (step by step)

```text
1. Define tools as a list of JSON Schema objects
   (name, description, input_schema)

2. Send user message + tool list to the LLM

3. LLM responds with stop_reason = "tool_use"
   Content contains one or more tool_use blocks:
   {"type": "tool_use", "id": "t1", "name": "get_metrics", "input": {"service": "api"}}

4. Your code executes the real function
   result = get_metrics(service="api")

5. Return the result as a tool_result block in the next user turn:
   {"type": "tool_result", "tool_use_id": "t1", "content": "<json>"}

6. LLM reads the result and either calls another tool or emits a final answer
   (stop_reason = "end_turn")
```

**The LLM does not run any code.** It generates call parameters. Your code does the execution. This
is a safety guarantee and the reason agents are auditable.

---

### Message history after two tool calls

After the agent calls two tools and gets a final answer, the message list looks like this:

```python
[
  # Turn 1 — user question
  {"role": "user", "content": "Why is my application slow?"},

  # Turn 2 — assistant requests tools
  {"role": "assistant", "content": [
    {"type": "tool_use", "id": "t1", "name": "get_metrics", "input": {"service": "api"}},
    {"type": "tool_use", "id": "t2", "name": "get_logs",    "input": {"service": "api"}},
  ]},

  # Turn 3 — user returns tool results
  {"role": "user", "content": [
    {"type": "tool_result", "tool_use_id": "t1", "content": "{...metrics...}"},
    {"type": "tool_result", "tool_use_id": "t2", "content": "{...logs...}"},
  ]},

  # Turn 4 — assistant final answer (stop_reason = "end_turn")
  # (implicit — the API response, not appended to messages)
]
```

Every turn is visible and inspectable. This is the entire "memory" for a single agent run.

---

### The three tools

This lab provides three simulated observability tools. In a real system these would query
Prometheus, Loki, and Tempo via their HTTP APIs.

#### `get_metrics`

Returns CPU, memory, latency, error rate, and request rate for a named service.

```python
get_metrics("api")
# → {"api": {"cpu": {"current": 87, "threshold": 80, "status": "elevated"}, ...}}
```

The `status` field (`"normal"` / `"elevated"` / `"degraded"`) gives the LLM a pre-computed signal so
it does not have to interpret raw numbers.

#### `get_logs`

Returns recent log entries filtered by severity.

```python
get_logs("api", severity="error")
# → {"service": "api", "severity": "error", "entries": [...], "total_matching": 75}
```

Each entry has a `count` field representing how many times that message appeared. This compresses
the signal — the LLM does not need to read 75 identical timeout lines.

#### `get_traces`

Returns distributed traces slower than a threshold.

```python
get_traces("api", min_duration_ms=500)
# → {"service": "api", "traces": [{"operation": "POST /orders", "duration_ms": 1250, "spans": [...]}]}
```

Span-level data (`db.query.orders: 890ms`) tells the LLM which part of the request path is
contributing to slowness — database, cache, or downstream service.

---

### Why description quality drives tool selection

The LLM picks tools by reading their descriptions. Compare these two:

```text
Bad:  "Gets metrics."
Good: "Query application performance metrics including CPU usage, memory, request rates,
       and latencies. Use this to check if resource saturation or high latency is causing slowness."
```

The good description tells the LLM _when_ to call the tool, not just _what_ it does. When the user
asks "why is my application slow?", the phrase "resource saturation or high latency" in the
description gives the LLM the signal to call `get_metrics` first.

Write tool descriptions as if you are training a junior engineer on when to use each tool.

---

### The agent loop

```python
for _ in range(_MAX_ITERATIONS):
    response = client.messages.create(
        model="claude-haiku-4-5",
        tools=TOOLS,
        messages=messages,
    )

    if response.stop_reason == "end_turn":
        return response.content[0].text          # Final answer — done

    if response.stop_reason == "tool_use":
        messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = _execute_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })

        messages.append({"role": "user", "content": tool_results})
        # Loop continues
```

Key points:

- **`_MAX_ITERATIONS`** is a hard ceiling (set to 10 here). Without it a stuck agent runs forever.
- **Multiple tool calls in one turn** are handled by iterating `response.content` and collecting all
  `tool_use` blocks. The LLM can request three tools in a single turn; your code returns all three
  results in a single `tool_result` message.
- **`_execute_tool`** is a simple dispatcher dict. No magic — `name → function`.

---

### Model choice

`claude-haiku-4-5` is used here for the same reason as User Story 1.1: cheap and fast for exercises.
Haiku handles tool use correctly; the output quality for this kind of structured investigation is
sufficient.

If you want richer, more precise summaries, swap to `claude-sonnet-4-6`. The loop is identical —
only the model string changes.

---

### Running the lab

```bash
# Make sure .env is set with ANTHROPIC_API_KEY
python labs/03_tool_agent/tool_agent.py
```

Expected output shape:

```text
Question: Why is my application slow?

Agent response:
CPU is elevated.
Database latency increased.
Timeout errors detected.
```

The exact wording varies per run (the LLM summarises), but the findings are deterministic because
the tool data is static.

---

### Running the tests

```bash
python -m pytest tests/test_03_tool_agent.py -v
```

Tests cover:

| Test                                                 | What it checks                                           |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `test_run_tool_agent_calls_tools_and_returns_string` | Two LLM calls happen; result is a non-empty string       |
| `test_run_tool_agent_tool_results_fed_back`          | Tool results appear in the second `messages.create` call |
| `test_run_tool_agent_raises_without_api_key`         | `EnvironmentError` when key is missing                   |
| `test_run_tool_agent_direct_answer_no_tools`         | Agent returns immediately when LLM answers without tools |
| `test_get_metrics_*`                                 | Metrics tool returns correct structure and filters       |
| `test_get_logs_*`                                    | Logs tool returns entries and respects limit             |
| `test_get_traces_*`                                  | Traces tool filters by duration threshold                |

---

### Concept check

| Question                                   | Answer hint                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| Who executes the tool call?                | Your code — the LLM only generates parameters         |
| What `stop_reason` signals a tool call?    | `"tool_use"`                                          |
| What `stop_reason` signals a final answer? | `"end_turn"`                                          |
| Why do you need a max-iterations guard?    | A stuck agent with no stopping condition runs forever |
| How does the LLM know which tool to pick?  | It reads the tool descriptions                        |

---

**Next:** User Story 1.3 — Building Agents with LangGraph.

## Metadata

|        |                                 |
| ------ | ------------------------------- |
| Author | Amit Singh                      |
| Scope  | agentic-ai-projects-and-mastery |
