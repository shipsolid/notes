---
title: "LlamaIndex Workflows"
description: "The API surface behind LlamaIndex's event-driven orchestration layer — Workflow/Step/Event class mechanics, Context state and fan-out/fan-in, and how a Workflow sits directly on top of the existing Index/QueryEngine retrieval stack."
tags: ["agentic-ai-projects-and-mastery", "reference", "tool"]
updated: 2026-08-10
hidden: false
zettelId: "202608101824-28"
relations:
  - slug: building-agentic-systems/03-agent-frameworks/08-llamaindex-workflows/08-llamaindex-workflows
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/langgraph
    kind: compared_to
  - slug: agentic-ai-engineering/05-retrieval-and-knowledge-systems/07-agentic-rag/07-agentic-rag
    kind: related
  - slug: production-agent-systems/00-production-infrastructure/06-workflow-engines/06-workflow-engines
    kind: related
---

[[08-llamaindex-workflows|The LlamaIndex Workflows chapter]] covers the conceptual case: events
instead of edges, control flow that falls out of type signatures rather than being authored. This
note is the class-level API — what `Workflow`, `step`, `Event`, and `Context` actually expose, and
how a Workflow reaches into LlamaIndex's older `Index`/`QueryEngine` stack instead of replacing it.

---

## The three base classes

```python
from llama_index.core.workflow import Workflow, step, Context, Event, StartEvent, StopEvent
```

- **`Event`** — a Pydantic model. Subclass it per message shape you need; fields are ordinary
  Pydantic fields.
- **`step`** — a decorator, not a class. It turns an `async def` method into something the
  dispatcher can route events to, by reading the method's type annotations.
- **`Workflow`** — the container class you subclass. It exposes no control-flow API of its own — no
  `add_edge`, no `add_node`. Subclassing it and decorating methods with `@step` is the entire
  authoring surface; `.run(...)` (inherited, never overridden) is how you invoke it.

`StartEvent`/`StopEvent` are pre-defined `Event` subclasses, not special syntax: `StartEvent`
carries whatever kwargs you pass to `.run(...)`, and `StopEvent.result` is whatever `.run(...)`
returns to the caller. A step's input type can be a union — `ev: StartEvent | RetryEvent` — and the
dispatcher calls the step whenever _either_ type arrives. That union is the entire mechanism behind
what [[08-llamaindex-workflows|the conceptual chapter]] calls a retry loop with no cyclic-edge
primitive: nothing says "loop back," only a second type the same step happens to accept.

## Context: the state object every step receives

`Context` is injected as the second parameter of every step — you never construct it yourself. It's
the closest thing this framework has to LangGraph's single typed state schema, except state here is
untyped key/value plus whatever each event's own fields carry:

| Context capability                     | Call                                             | Use                                                                                                    |
| -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Key/value state, scoped to the run     | `await ctx.store.set(key, val)` / `.get(key)`    | Stash a retriever, an accumulator — anything that isn't itself an event payload                        |
| Stream a progress update to the caller | `ctx.write_event_to_stream(ProgressEvent(...))`  | UI progress, token-level output from inside a step, without entering the typed control flow            |
| Manually target one specific step      | `ctx.send_event(ev, step="name")`                | Bypass type-based dispatch when routing must go to exactly one step, not "whoever accepts this type"   |
| Fan-in / wait for N events             | `await ctx.collect_events(ev, [EventA, EventB])` | Barrier: returns `None` until one instance of each listed type has arrived, then returns the full list |

**Version flag, not glossed over:** `ctx.store.get`/`.set` is the current form; earlier LlamaIndex
releases exposed `ctx.get`/`ctx.set` directly. Both forms still show up in circulating tutorials —
check the installed version before copying a snippet verbatim, the same caution
[[langgraph|the LangGraph reference note]] gives for `interrupt()`'s signature.

`@step(num_workers=4)` caps concurrent invocations of _that one step_ when several matching events
land together. It's the only lever for bounding concurrency in this model, precisely because
concurrency itself is implicit — any step whose type matches an emitted event runs, no separate
opt-in required.

## Wiring into the Index / QueryEngine stack, with a real retry loop

A step doesn't call a "LlamaIndex tool" — it calls whatever retrieval object you built the ordinary
way and handed to the Workflow, unchanged:

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.core.workflow import Workflow, step, Context, Event, StartEvent, StopEvent

documents = SimpleDirectoryReader("./docs").load_data()
index = VectorStoreIndex.from_documents(documents)

class RetrievedEvent(Event):
    nodes: list          # NodeWithScore, kept loose here for brevity
    query: str

class ValidationFailedEvent(Event):
    query: str
    reason: str

class ResearchWorkflow(Workflow):
    def __init__(self, retriever, synthesizer, **kwargs):
        super().__init__(**kwargs)
        self.retriever = retriever
        self.synthesizer = synthesizer

    @step
    async def retrieve(
        self, ctx: Context, ev: StartEvent | ValidationFailedEvent
    ) -> RetrievedEvent:
        query = ev.query if isinstance(ev, StartEvent) else f"{ev.query} ({ev.reason})"
        nodes = await self.retriever.aretrieve(query)
        return RetrievedEvent(nodes=nodes, query=query)

    @step
    async def synthesize(
        self, ctx: Context, ev: RetrievedEvent
    ) -> ValidationFailedEvent | StopEvent:
        if not ev.nodes:
            return ValidationFailedEvent(query=ev.query, reason="no supporting nodes retrieved")
        response = await self.synthesizer.asynthesize(ev.query, ev.nodes)
        return StopEvent(result=response)

workflow = ResearchWorkflow(
    retriever=index.as_retriever(similarity_top_k=8),
    synthesizer=my_synthesizer,
    timeout=120,
)
result = await workflow.run(query="What is our current error budget policy?")
```

`index.as_retriever()` and the eventual `.asynthesize()` call are the exact same retrieval objects
[[agentic-ai-engineering/05-retrieval-and-knowledge-systems/04-vector-search/04-vector-search|Vector Search]]
describes, untouched — the Workflow only adds the orchestration shell around them: somewhere to put
a validation check, a re-retrieve branch with a rewritten query, a citation step. A bare
`index.as_query_engine().aquery(query)` call has none of those hooks. This is also why LlamaIndex's
own `FunctionAgent` and `AgentWorkflow` classes are implemented as Workflows internally in current
versions — the retrieval primitives didn't move, the orchestration layer got built on top of them.

## Where this sits next to the rest of the orchestration stack

| Need                                                             | Reach for                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Retrieval-heavy agent, want the indices/retrievers for free      | `Workflow` + `VectorStoreIndex`/`QueryEngine` — this note                                       |
| Explicit state machine, mature checkpoint/resume across restarts | [[langgraph                                                                                     | LangGraph]]'s `StateGraph` — see the sibling reference note                       |
| General-purpose durable orchestration, not Python-embedded       | [[production-agent-systems/00-production-infrastructure/06-workflow-engines/06-workflow-engines | Workflow Engines]] (Temporal-class systems)                                       |
| Agent that decides _whether_ to retrieve at all, not just how    | [[agentic-ai-engineering/05-retrieval-and-knowledge-systems/07-agentic-rag/07-agentic-rag       | Agentic RAG]] — a Workflow is one natural implementation vehicle for that pattern |
