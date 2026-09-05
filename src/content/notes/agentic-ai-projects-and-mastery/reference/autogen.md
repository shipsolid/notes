---
title: "AutoGen"
description: "Microsoft's open-source framework for conversational multi-agent systems — the concrete API surface: AssistantAgent/UserProxyAgent setup, GroupChat/GroupChatManager wiring, tool registration, and the parameters that actually terminate a run."
tags: ["agentic-ai-projects-and-mastery", "reference", "tool"]
hidden: false
zettelId: "202608101824-26"
relations:
  - slug: building-agentic-systems/03-agent-frameworks/05-autogen/05-autogen
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: compared_to
  - slug: building-agentic-systems/01-multi-agent-systems/03-communication-protocols/03-communication-protocols
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/mcp-toolbox
    kind: related
---

AutoGen is Microsoft's open-source framework for multi-agent systems built on a **shared message
transcript** rather than an explicit graph — see
[[building-agentic-systems/03-agent-frameworks/05-autogen/05-autogen|the AutoGen chapter]] for why
that framing choice matters and how it compares to LangGraph. This note is the API-level reference:
how the classes get constructed, wired into a `GroupChat`, given tools, and stopped.

---

## Core agent classes

`ConversableAgent` is the base class — sends and receives chat messages, holds an optional
`llm_config`. `AssistantAgent` and `UserProxyAgent` are thin presets over it: `AssistantAgent` is
LLM-backed and proposes answers or code; `UserProxyAgent` is the human-in-the-loop / execution
boundary — runs code, relays to a human, or auto-replies, usually with `llm_config=False`. The split
keeps execution a distinct, auditable object separate from the agent proposing the work.

## Minimal two-agent setup

```python
import os
import autogen

llm_config = {
    "config_list": [{"model": "gpt-4o", "api_key": os.environ["OPENAI_API_KEY"]}],
    "temperature": 0,
}

assistant = autogen.AssistantAgent(
    name="assistant",
    system_message="You are a senior Python engineer. Write correct, tested code.",
    llm_config=llm_config,
)

user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",                       # ALWAYS | TERMINATE | NEVER
    max_consecutive_auto_reply=10,
    is_termination_msg=lambda msg: msg.get("content", "").rstrip().endswith("TERMINATE"),
    code_execution_config={"work_dir": "coding", "use_docker": False},
)

user_proxy.initiate_chat(assistant, message="Write a function that reverses a linked list.")
```

`human_input_mode` is the per-agent human-gate switch: `ALWAYS` blocks every turn on approval,
`TERMINATE` only asks before the agent would otherwise end the chat, `NEVER` runs fully autonomous.
`use_docker: False` is a dev-sandbox setting — production `code_execution_config` should point at a
container, not the host process.

## Function / tool registration

Explicit registration separates _who proposes_ the call from _who runs it_:

```python
from typing import Annotated

def get_weather(city: Annotated[str, "City name"]) -> str:
    return f"{city}: 72F, clear"

autogen.register_function(
    get_weather,
    caller=assistant,       # the agent whose LLM sees the tool schema and proposes the call
    executor=user_proxy,    # the agent whose code actually runs it
    name="get_weather",
    description="Look up current weather for a city",
)
```

Decorator form does the same split inline:

```python
@user_proxy.register_for_execution()
@assistant.register_for_llm(description="Look up current weather for a city")
def get_weather(city: Annotated[str, "City name"]) -> str:
    return f"{city}: 72F, clear"
```

Only the caller's `llm_config` needs the tool schema; only the executor needs the real
credentials/sandbox to run the function body. Registering both roles on the same agent collapses
that separation — harmless for a script, a real gap once the tool can mutate state.

## GroupChat and GroupChatManager

`GroupChat` generalizes the pair to N agents sharing one transcript. `GroupChatManager` sits over
it, picking the next speaker each round and checking whether the chat should stop.

```python
coder = autogen.AssistantAgent(name="coder", llm_config=llm_config,
                                system_message="Write the implementation.")
critic = autogen.AssistantAgent(name="critic", llm_config=llm_config,
                                 system_message="Review the coder's output for bugs.")
executor = autogen.UserProxyAgent(name="executor", human_input_mode="NEVER",
                                   code_execution_config={"work_dir": "coding", "use_docker": False})

groupchat = autogen.GroupChat(
    agents=[coder, critic, executor],
    messages=[],
    max_round=12,
    speaker_selection_method="auto",   # round_robin | random | manual | auto | a callable
    allow_repeat_speaker=False,
)

manager = autogen.GroupChatManager(
    groupchat=groupchat,
    llm_config=llm_config,
    is_termination_msg=lambda msg: "TERMINATE" in msg.get("content", ""),
)

executor.initiate_chat(manager, message="Implement and test a token-bucket rate limiter.")
```

| Field                      | On                 | Effect                                                                                                                            |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `speaker_selection_method` | `GroupChat`        | `round_robin`/`random` are deterministic/uniform; `manual` waits on a human; `auto` runs an extra LLM call reading the transcript |
| `allow_repeat_speaker`     | `GroupChat`        | Whether the same agent can be picked twice in a row — `False` forces rotation                                                     |
| `max_round`                | `GroupChat`        | Hard cap on turns, the transcript's analog of a max-iterations guard                                                              |
| `llm_config`               | `GroupChatManager` | Under `auto`, speaker selection is itself an LLM call — it inherits LLM failure modes, it is not a safe deterministic dispatcher  |

## Termination conditions

A `GroupChat` needs at least one of these or it runs until the token bill notices:

| Mechanism                    | Where it's set                                 | Behavior                                                                                                     |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `max_round`                  | `GroupChat`                                    | Hard cap, independent of message content                                                                     |
| `is_termination_msg`         | Any `ConversableAgent` (including the manager) | Callable checked per message; convention is a literal `"TERMINATE"` string the assistant is prompted to emit |
| `max_consecutive_auto_reply` | `UserProxyAgent`                               | Caps unattended auto-replies before forcing a stop or a human turn                                           |
| `human_input_mode="ALWAYS"`  | Any `ConversableAgent`                         | Forces human approval every turn — the hardest stop available                                                |

**Caution:** `is_termination_msg` is evaluated per-agent, not globally. Set it on the
`GroupChatManager` too, not just on the `UserProxyAgent` — otherwise one participant can decide the
task is done while the manager keeps routing turns to someone else.

## Versioning note

Everything above is the classic `pyautogen` / `AG2` API surface. Microsoft's 0.4 rearchitecture
(`autogen-agentchat`) keeps the `AssistantAgent` / `UserProxyAgent` names but replaces `GroupChat` /
`GroupChatManager` with `RoundRobinGroupChat` / `SelectorGroupChat` team objects driven by an async
`run()`, and moves tool registration to passing a `FunctionTool` (or typed callable) directly into
an agent's `tools=` list instead of a separate `register_function` call. Confirm which package a
codebase actually imports — `pyautogen`, `ag2`, or `autogen-agentchat` — before assuming any snippet
above compiles unmodified; see the fork/rearchitecture context in
[[building-agentic-systems/03-agent-frameworks/05-autogen/05-autogen|the AutoGen chapter]]. For the
role/task/crew alternative to a group chat, see [[crewai|CrewAI]]; for tool registration when the
tools come from an MCP server instead of local Python functions, see [[mcp-toolbox|MCP Toolbox]].
