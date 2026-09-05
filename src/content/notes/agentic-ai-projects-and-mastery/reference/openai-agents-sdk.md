---
title: "OpenAI Agents SDK"
description: "Python SDK for OpenAI's Agents framework — the concrete API surface: Agent/Runner construction, the function_tool and handoff() call shapes, Session-backed state, guardrail decorators, and built-in tracing."
tags: ["agentic-ai-projects-and-mastery", "reference", "tool"]
updated: 2026-08-10
hidden: false
zettelId: "202608101824-24"
relations:
  - slug: building-agentic-systems/03-agent-frameworks/02-openai-agents-sdk/02-openai-agents-sdk
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/langgraph
    kind: compared_to
  - slug: production-agent-systems/02-reliability-security-and-governance/11-failure-recovery/11-failure-recovery
    kind: related
---

OpenAI's Agents SDK is the production successor to Swarm — a thin Python package (`openai-agents` on
PyPI, imported as `agents`) built around four primitives: `Agent`, `handoff`, guardrails, and
`Session`, driven by a `Runner`. For the orchestration model those primitives encode — handoff as a
control transfer vs. agent-as-tool, and where a `Session`'s guarantee actually runs out — see
[[building-agentic-systems/03-agent-frameworks/02-openai-agents-sdk/02-openai-agents-sdk|the OpenAI Agents SDK chapter]].
This note is the API surface: what you import, construct, and call.

---

## Install and core objects

```bash
pip install openai-agents
```

| Object                                 | What it is                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Agent`                                | LLM + `instructions` + `tools=[...]` + optional `handoffs=[...]` / `output_type`                 |
| `Runner`                               | Drives the loop; `run()` (async), `run_sync()`, `run_streamed()`                                 |
| `function_tool`                        | Decorator — turns a typed Python function into a tool schema from its signature/docstring        |
| `handoff()`                            | Wraps a target `Agent` with an overridable tool name/description and an `input_filter`           |
| `Session` / `SQLiteSession`            | Message-history store; `Session` is a protocol you can back with your own store                  |
| `RunContextWrapper`                    | App-local state (user id, db handle) threaded through tools/guardrails — never sent to the model |
| `input_guardrail` / `output_guardrail` | Decorators wrapping a check function that can raise a tripwire                                   |
| `trace()` / `add_trace_processor()`    | Groups a run into one trace; lets you export spans to your own collector                         |

## Minimal agent + tool + handoff

```python
from agents import Agent, Runner, function_tool

@function_tool
def get_weather(city: str) -> str:
    """Return current weather for a city."""
    return f"Sunny, 28C in {city}"

billing_agent = Agent(
    name="Billing Agent",
    instructions="Handle billing questions only. Do not discuss weather.",
)

triage_agent = Agent(
    name="Triage Agent",
    instructions="Route billing questions to the Billing Agent; answer everything else yourself.",
    tools=[get_weather],
    handoffs=[billing_agent],   # bare Agent is auto-wrapped; use handoff(billing_agent, ...) to customize
)

result = Runner.run_sync(triage_agent, "What's the weather in Bangalore?")
print(result.final_output)
```

`result` is a `RunResult` — `.final_output` is the last message, `.new_items` is every step the loop
took (tool calls, handoffs, messages), and `.to_input_list()` lets you continue the conversation by
hand on the next call without setting up a `Session` at all.

## Guardrails run at different points in the loop

```python
from agents import Agent, GuardrailFunctionOutput, RunContextWrapper, input_guardrail

@input_guardrail
async def block_pii(ctx: RunContextWrapper, agent: Agent, input: str) -> GuardrailFunctionOutput:
    flagged = "ssn" in input.lower()
    return GuardrailFunctionOutput(output_info={"flagged": flagged}, tripwire_triggered=flagged)

support_agent = Agent(name="Support", instructions="...", input_guardrails=[block_pii])
```

A triggered input guardrail raises `InputGuardrailTripwireTriggered` **before** the model is ever
called for that turn — a cost-avoidance check, not just a safety one. An output guardrail can't
offer that: it runs after the model has already generated a response, so a triggered output tripwire
blocks the response reaching the caller but has already paid for the generation.

## Sessions: what actually persists

```python
from agents import Runner, SQLiteSession

session = SQLiteSession(session_id="user-42", db_path="conversations.db")

await Runner.run(support_agent, "My last order never arrived.", session=session)
await Runner.run(support_agent, "It was order #8842.", session=session)  # sees turn 1 automatically
```

A `Session` backend implements four methods — `get_items()`, `add_items()`, `pop_item()`,
`clear_session()` — so swapping `SQLiteSession` for Redis or Postgres is a small adapter, not a fork
of the Runner. It stores the **message list**, nothing more: `RunContextWrapper` is the separate
channel for state that shouldn't enter the model's context at all (a db handle, a feature flag, a
user id) — collapsing the two by stuffing app state into the conversation as a fake message is how
internal state leaks into what the LLM sees. And a `Session` is not a mid-run checkpoint: resuming
after a crash replays from the last persisted message, not an in-flight tool call — the gap
[[production-agent-systems/02-reliability-security-and-governance/11-failure-recovery/11-failure-recovery|Failure Recovery]]
covers in depth.

## Tracing is on by default

```python
from agents import trace

with trace("support-ticket-workflow"):
    result = await Runner.run(triage_agent, ticket_text)
    # every model call, tool call, and handoff inside this block shares one trace ID
```

Every step gets its own span automatically, visible in OpenAI's tracing dashboard with no extra
instrumentation. `add_trace_processor()` fans the same spans out to your own collector — write a
translator into OTel shape and it slots into an existing Tempo/Grafana pipeline instead of leaving
trace data stranded in a vendor dashboard your incident tooling doesn't query.

## Versioning note

The "OpenAI" in the name describes who ships the SDK, not a hard lock to OpenAI-hosted models —
`Agent(model=...)` takes a LiteLLM-prefixed string, or point the default client at any
Chat-Completions-compatible endpoint. More relevant for stability: this is a young package, and the
tracing and session APIs have both already moved once since the Swarm-era prototype. Pin a version
and read the changelog before upgrading, the discipline you'd apply to any pre-1.0 dependency.

## Related

- [[building-agentic-systems/03-agent-frameworks/02-openai-agents-sdk/02-openai-agents-sdk|The OpenAI Agents SDK chapter]]
  — the orchestration model this API implements, and the handoff-history gotcha
- [[crewai|CrewAI]] — the role/goal/crew alternative when the shape is autonomous collaboration
  rather than a peer-to-peer handoff chain
- [[langgraph|LangGraph]] — contrast `Session` (message history only) against LangGraph's
  `checkpointer` (full super-step state, resumable mid-run)
