---
title: "What is LangGraph"
description: "LangChain's graph-based orchestration library — agents as a StateGraph of nodes and edges, with durable checkpointing and human-in-the-loop interrupts as native graph mechanics rather than bolted-on features."
tags: ["agentic-ai-projects-and-mastery", "reference", "tool"]
updated: 2026-08-10
hidden: false
zettelId: "202608101824-25"
relations:
  - slug: building-agentic-systems/03-agent-frameworks/03-langgraph/03-langgraph
    kind: related
  - slug: building-agentic-systems/00-building-single-agent-systems/07-human-in-the-loop-systems/07-human-in-the-loop-systems
    kind: related
  - slug: production-agent-systems/00-production-infrastructure/06-workflow-engines/06-workflow-engines
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: compared_to
---

LangGraph is LangChain's library for orchestrating agents as an explicit graph — nodes that do work,
edges that connect them, and a typed state object that threads through every step. For the
conceptual case for graphs-over-DAGs, see
[[building-agentic-systems/03-agent-frameworks/03-langgraph/03-langgraph|the LangGraph chapter]].
This note is the API surface: how you actually build, checkpoint, and interrupt one.

---

## StateGraph construction

Every graph starts from a state schema — a `TypedDict` or Pydantic model every node reads and
writes. `Annotated[..., add_messages]` tells LangGraph to append to that field instead of
overwriting it, which is how message history accumulates across nodes instead of each node
clobbering the last one's output.

```python
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    pending_action: dict | None
```

`StateGraph(AgentState)` is the builder — it doesn't run anything until `.compile()`.

## Nodes and edges

A node is any callable that takes the state and returns a partial update — the return value gets
merged into state according to each field's reducer (default: overwrite; `add_messages`: append).

```python
from langgraph.graph import StateGraph, START, END

def call_model(state: AgentState) -> dict:
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def call_tools(state: AgentState) -> dict:
    last = state["messages"][-1]
    results = [execute_tool(tc) for tc in last.tool_calls]
    return {"messages": results}

builder = StateGraph(AgentState)
builder.add_node("agent", call_model)
builder.add_node("tools", call_tools)
builder.add_edge(START, "agent")   # fixed A → B transitions
builder.add_edge("tools", "agent") # the backward edge that makes this a cycle, not a DAG
```

## Conditional edges

A conditional edge is a router function: it inspects state and returns the name of the next node (or
a mapping key that resolves to one). This is where "call a tool, answer directly, or loop again"
actually gets decided — every other planning pattern in this book ultimately compiles down to a
function shaped like this one.

```python
def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

builder.add_conditional_edges(
    "agent",
    should_continue,
    {"tools": "tools", END: END},  # explicit mapping — router output → next node
)

graph = builder.compile()
```

Omit the mapping dict and LangGraph uses the router's return value as the node name directly — the
explicit form is worth the extra line once you have more than two branches, because it's the part of
the graph a reviewer has to read to understand routing without executing the function.

## Checkpointer setup for persistence

Compile with a `checkpointer` and every super-step (one full pass through whichever nodes ran) gets
serialized to a durable store, keyed by `thread_id`. Without one, state lives only on the call stack
of `.invoke()` — kill the process mid-run and there's nothing to resume.

```python
from langgraph.checkpoint.sqlite import SqliteSaver
# from langgraph.checkpoint.postgres import PostgresSaver  # production default

with SqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
    graph = builder.compile(checkpointer=checkpointer)

    config = {"configurable": {"thread_id": "run-482"}}
    result = graph.invoke({"messages": [user_message]}, config=config)

    # Same thread_id later — resumes from the last completed super-step,
    # not from scratch. This is the mechanism, not just the intent, behind
    # the checkpoint discipline in Failure Recovery.
```

`MemorySaver` is the in-process, non-durable variant — fine for a lab, useless past a process
restart. `PostgresSaver` (or a self-managed store behind the same interface) is what you'd actually
run in production, for the same reason you wouldn't run Temporal against SQLite at scale.

## The interrupt mechanism for human-in-the-loop

Calling `interrupt()` inside a node suspends the graph at that exact point — the current
super-step's state is checkpointed, and `.invoke()` returns without completing. There is no separate
"pause-and-wait" API: suspension **is** a checkpoint the graph hasn't been told to continue from
yet, which is why resuming after a human approves and resuming after a crash are the same operation.

```python
from langgraph.types import interrupt, Command

def human_approval(state: AgentState) -> dict:
    decision = interrupt({
        "question": "Approve this action?",
        "action": state["pending_action"],
    })
    return {"approved": decision == "approve"}

builder.add_node("approval", human_approval)
```

Resuming happens by re-invoking with a `Command`, against the same `thread_id`:

```python
graph.invoke(Command(resume="approve"), config=config)
```

**Version note, flagged rather than glossed over:** earlier LangGraph releases exposed this as
compile-time `interrupt_before` / `interrupt_after` node flags rather than an in-node `interrupt()`
call. Treat the _capability_ — pause at a node boundary, resume from the same checkpoint — as
stable, and verify the current call signature against the installed version before shipping it; this
has moved across releases and will likely move again.

## Where this fits

| Need                                    | Reach for                                                  |
| --------------------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| Single tool call, no cycles, no pause   | A plain function — the graph is overhead you don't need    |
| Cyclic reasoning (ReAct-style)          | `add_edge` back to the agent node                          |
| Crash-safe resumption                   | `checkpointer=` at compile time, `thread_id` per run       |
| Human approval mid-run                  | `interrupt()` in a node, `Command(resume=...)` to continue |
| Multi-agent orchestration, less graph-y | [[agentic-ai-projects-and-mastery/reference/crewai         | CrewAI]] — roles/goals instead of a graph |
