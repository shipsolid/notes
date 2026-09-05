---
title: "Haystack Agents"
description: "Haystack's Agent component and Pipeline/Tool wiring — the API surface: how a Pipeline gets built and connected, how Agent slots in as one more Component, and how ComponentTool turns an existing retriever into a tool with no re-integration work."
tags: ["agentic-ai-projects-and-mastery", "reference", "tool"]
hidden: false
zettelId: "202608101824-29"
relations:
  - slug: building-agentic-systems/03-agent-frameworks/09-haystack-agents/09-haystack-agents
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/langgraph
    kind: compared_to
  - slug: agentic-ai-engineering/05-retrieval-and-knowledge-systems/01-retrieval-augmented-generation-rag/01-retrieval-augmented-generation-rag
    kind: depends_on
  - slug: agentic-ai-engineering/04-tools-and-environment-interaction/01-tool-calling-architecture/01-tool-calling-architecture
    kind: related
---

Haystack builds agents on top of a pre-existing DAG-of-components model rather than a purpose-built
agent runtime — see
[[building-agentic-systems/03-agent-frameworks/09-haystack-agents/09-haystack-agents|the Haystack Agents chapter]]
for why that "add agents to the retrieval stack you already run" framing is the whole design center.
This note is the API surface: how the `Pipeline` actually gets built and wired, how `Agent` slots in
as one more `Component`, and how `ComponentTool` turns an existing retriever into a tool without
rewriting it.

---

## Pipeline construction

A `Pipeline` is built explicitly: instantiate components, register them under a name, then wire
output sockets to input sockets by name. Nothing runs until `.run()` is called.

```python
from haystack import Pipeline
from haystack.components.retrievers.in_memory import InMemoryBM25Retriever
from haystack.components.rankers import TransformersSimilarityRanker
from haystack.document_stores.in_memory import InMemoryDocumentStore

document_store = InMemoryDocumentStore()

pipeline = Pipeline()
pipeline.add_component("retriever", InMemoryBM25Retriever(document_store=document_store))
pipeline.add_component(
    "ranker", TransformersSimilarityRanker(model="cross-encoder/ms-marco-MiniLM-L-6-v2")
)

# "component_name.socket_name" — output socket on the left, input socket on the right
pipeline.connect("retriever.documents", "ranker.documents")
```

`add_component` only registers the instance under a name — it creates no edges. `connect()` is where
the DAG actually forms, and Haystack checks the output type on the left against the input type on
the right **at connect time**, not at run time: a socket mismatch fails before a single token gets
spent, not mid-run three components downstream.

## Custom components and typed sockets

Any class becomes a pipeline node with the `@component` decorator. The type hints on `run()` define
its input sockets; `@component.output_types(...)` defines the outputs Haystack exposes to
`connect()`. This is the same contract every built-in retriever, ranker, or generator satisfies —
nothing privileged about deepset-maintained components versus your own.

```python
from haystack import component

@component
class QueryRewriter:
    @component.output_types(query=str)
    def run(self, query: str, history: list[str] | None = None) -> dict:
        rewritten = f"{query} (context: {', '.join(history or [])})" if history else query
        return {"query": rewritten}

pipeline.add_component("rewriter", QueryRewriter())
pipeline.connect("rewriter.query", "retriever.query")
```

## The Agent component

`Agent` wraps a `ChatGenerator` and a tool-calling loop behind the exact same `run()` contract as
`retriever` or `ranker` above — inputs and outputs are typed sockets, not a bespoke agent API.

```python
from haystack.components.agents import Agent
from haystack.components.generators.chat import OpenAIChatGenerator

support_agent = Agent(
    chat_generator=OpenAIChatGenerator(model="gpt-4o-mini"),
    tools=[search_kb_tool],       # see Tool registration below
    system_prompt="You are a support agent. Use search_kb before answering.",
    exit_conditions=["text"],     # stop once the model returns plain text, not a tool call
)

pipeline.add_component("support_agent", support_agent)
```

**Version note, flagged rather than glossed over:** `Agent` moved from `haystack-experimental` into
Haystack core across recent 2.x releases, and the exact import path and constructor kwargs have
shifted between those releases. Treat the _shape_ — a Component wrapping a generator + tool loop
behind typed sockets — as stable, and verify the current import path and `exit_conditions` signature
against the installed version before shipping it, the same caveat the LangGraph and Semantic Kernel
API notes draw around their own fast-moving surfaces.

Two consequences fall directly out of "Agent is a Component, not a separate runtime":

- It has typed `messages` in / `messages` out sockets like anything else in the graph, so it
  connects with the same `pipeline.connect(...)` calls as a retriever or ranker.
- Its internal loop — call the generator, execute a tool, feed the result back, repeat — never
  appears as a node or edge in the _outer_ pipeline. To the DAG, `support_agent` is one hop, however
  many tool round-trips happen inside it.

`exit_conditions` is Haystack's name for the stop-condition mechanism every execution loop needs:
`"text"` stops on a plain-text response, a specific tool name (e.g. `["submit_ticket"]`) stops once
that tool fires, and an internal max-iteration cap is enforced regardless — the same three families
(final answer, terminal action, iteration ceiling) as any other framework's loop guard.

## Tool registration

A `Tool` is name + description + JSON-schema parameters + a callable — the same contract
[[agentic-ai-engineering/04-tools-and-environment-interaction/01-tool-calling-architecture/01-tool-calling-architecture|Tool Calling Architecture]]
describes generically:

```python
from haystack.tools import Tool

def search_kb(query: str) -> str:
    hits = document_store.filter_documents(
        {"field": "content", "operator": "contains", "value": query}
    )
    return "\n".join(doc.content for doc in hits[:3])

search_kb_tool = Tool(
    name="search_kb",
    description="Search the internal knowledge base for passages relevant to the query",
    parameters={
        "type": "object",
        "properties": {"query": {"type": "string"}},
        "required": ["query"],
    },
    function=search_kb,
)
```

The mechanism behind the conceptual chapter's "no re-integration work" claim is `ComponentTool`: it
wraps an _existing Component_ — a retriever, or a whole sub-`Pipeline` run as one unit — directly as
a Tool, generating the JSON schema from the component's own typed `run()` signature instead of a
hand-written one.

```python
from haystack.tools import ComponentTool

retriever_tool = ComponentTool(
    component=InMemoryBM25Retriever(document_store=document_store),
    name="search_kb",
    description="Search the internal knowledge base for passages relevant to the query",
)

support_agent = Agent(
    chat_generator=OpenAIChatGenerator(model="gpt-4o-mini"),
    tools=[retriever_tool],
)
```

No `search_kb()` wrapper function, no re-declared schema — the component's own input sockets become
the tool's parameters. This is "the tool is the exact retriever your team already tuned in
production," literally, not as a marketing claim.

## Minimal end-to-end sketch

```python
from haystack import Pipeline
from haystack.components.agents import Agent
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.components.retrievers.in_memory import InMemoryBM25Retriever
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.dataclasses import ChatMessage
from haystack.tools import ComponentTool

document_store = InMemoryDocumentStore()
# document_store.write_documents([...])  # indexing omitted — not the point of this sketch

kb_tool = ComponentTool(
    component=InMemoryBM25Retriever(document_store=document_store),
    name="search_kb",
    description="Search the internal knowledge base",
)

support_agent = Agent(
    chat_generator=OpenAIChatGenerator(model="gpt-4o-mini"),
    tools=[kb_tool],
    system_prompt="Answer using search_kb. If nothing relevant is found, say so.",
    exit_conditions=["text"],
)

pipeline = Pipeline()
pipeline.add_component("support_agent", support_agent)

result = pipeline.run(
    {"support_agent": {"messages": [ChatMessage.from_user("What's our refund policy?")]}}
)
print(result["support_agent"]["messages"][-1].text)
```

Swap `pipeline.run(...)` for `support_agent.run(...)` directly and you get the identical
tool-calling loop with no pipeline at all — the Agent component works stand-alone. The pipeline only
earns its keep once you're wiring the agent next to retrievers, rankers, or other agents in the same
graph.

## Where this fits

| Need                                                       | Reach for                                                                                                                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing Haystack retrieval pipeline already in production | `Agent` dropped in as one more `Component`; wrap existing retrievers as tools with `ComponentTool`                                                                    |
| Outer-graph visibility into every tool-call iteration      | [[agentic-ai-projects-and-mastery/reference/langgraph\|LangGraph]] — iterations are traceable graph super-steps, not hidden inside one node                           |
| Crash-safe resume mid-agent-loop                           | Not a Haystack pipeline primitive — see [[production-agent-systems/02-reliability-security-and-governance/11-failure-recovery/11-failure-recovery\|Failure Recovery]] |
| Greenfield project, no existing retrieval stack            | Less encumbered starting from LangGraph or a hand-rolled loop — nothing to reuse from Haystack yet                                                                    |
