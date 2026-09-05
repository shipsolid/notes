---
title: "Semantic Kernel"
description: "Microsoft's SDK for adding tool-calling and planning to an existing .NET or Python application — the API surface: Kernel construction, KernelFunction/plugin registration, the automatic-function-calling planner, and where .NET/Python SDK parity actually diverges."
tags: ["agentic-ai-projects-and-mastery", "reference", "tool"]
hidden: false
zettelId: "202608101824-27"
relations:
  - slug: building-agentic-systems/03-agent-frameworks/06-semantic-kernel/06-semantic-kernel
    kind: related
  - slug: agentic-ai-projects-and-mastery/reference/crewai
    kind: compared_to
  - slug: agentic-ai-projects-and-mastery/reference/autogen
    kind: compared_to
  - slug: agentic-ai-engineering/04-tools-and-environment-interaction/01-tool-calling-architecture/01-tool-calling-architecture
    kind: related
---

Semantic Kernel (SK) is Microsoft's SDK for embedding tool-calling and planning into an application
that already exists — see
[[building-agentic-systems/03-agent-frameworks/06-semantic-kernel/06-semantic-kernel|the Semantic Kernel chapter]]
for why that "plug into an existing app" framing is the whole design center. This note is the API
surface: how the `Kernel` actually gets constructed, how an existing method becomes a callable tool,
how the planner decides what to call, and where the C# and Python SDKs stop being the same API with
different syntax.

---

## Kernel construction

C# leans on the builder pattern, usually resolved through the same DI container that wires up the
rest of an ASP.NET Core app:

```csharp
using Microsoft.SemanticKernel;

var builder = Kernel.CreateBuilder();
builder.AddAzureOpenAIChatCompletion(
    deploymentName: "gpt-4o",
    endpoint: "https://myresource.openai.azure.com/",
    apiKey: azureApiKey);

Kernel kernel = builder.Build();

// DI-native form, inside Program.cs — the Kernel becomes a scoped service
// alongside every controller and repository already registered:
services.AddKernel()
    .AddAzureOpenAIChatCompletion(deploymentName, endpoint, apiKey);
```

Python has no equivalent DI convention, so construction is explicit and imperative — you build one
where you need it, typically once per request or per worker:

```python
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion

kernel = Kernel()
kernel.add_service(AzureChatCompletion(
    deployment_name="gpt-4o",
    endpoint="https://myresource.openai.azure.com/",
    api_key=azure_api_key,
))
```

Either way, the `Kernel` is cheap to construct — it's an orchestrator object holding a connector
reference and a plugin registry, not a process you stand up and keep alive.

## Plugin and function registration

A plugin is a class; a `KernelFunction` is an existing method with an attribute (C#) or decorator
(Python) added. The business logic inside the method body doesn't change:

```csharp
public class OrderPlugin
{
    private readonly IOrderService _orderService;
    public OrderPlugin(IOrderService orderService) => _orderService = orderService;

    [KernelFunction, Description("Look up an order's current status by ID")]
    public async Task<string> GetOrderStatusAsync(
        [Description("The order ID, e.g. ORD-48213")] string orderId)
    {
        return await _orderService.GetStatusAsync(orderId);   // pre-existing code, unmodified
    }
}

builder.Plugins.AddFromType<OrderPlugin>();
```

```python
from semantic_kernel.functions import kernel_function

class OrderPlugin:
    def __init__(self, order_service):
        self._order_service = order_service

    @kernel_function(description="Look up an order's current status by ID")
    def get_order_status(self, order_id: str) -> str:
        return self._order_service.get_status(order_id)

kernel.add_plugin(OrderPlugin(order_service), plugin_name="Order")
```

SK reads the description and parameter annotations off the method signature and generates the JSON
Schema tool definition every provider's function-calling API expects — the same
name/description/schema triple from
[[agentic-ai-engineering/04-tools-and-environment-interaction/01-tool-calling-architecture/01-tool-calling-architecture|Tool Calling Architecture]],
just declared as an attribute on code that already existed rather than hand-written against a
framework's `BaseTool` class. `Kernel.Plugins.AddFromOpenApi(...)` (C#) / the Python equivalent
generate the same thing directly from an internal service's `swagger.json` — a plugin with zero
hand-written annotations, at the cost of tool descriptions only as good as the OpenAPI spec's own.

## The Planner abstraction

Early SK shipped purpose-built planner classes — `SequentialPlanner`, `ActionPlanner`,
`StepwisePlanner` — each with its own DSL for chaining plugin calls into a plan before executing it:

```csharp
// Legacy — deprecated, shown for recognition only, not for new code
var planner = new SequentialPlanner(kernel);
Plan plan = await planner.CreatePlanAsync("Get order ORD-48213's status and notify the customer");
var result = await plan.InvokeAsync(kernel);
```

Once every major model provider shipped native function calling, SK converged on **automatic
function calling** as the current planning model: hand the registered plugins to the model as tools
and let the model's own tool-choice loop decide what to call and in what order, the same request →
tool call → execute → re-inject cycle every other framework in this book runs.

```csharp
var settings = new AzureOpenAIPromptExecutionSettings
{
    FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()   // model picks the plugin functions
};
var result = await kernel.InvokePromptAsync(
    "What's the status of order ORD-48213?", new(settings));
```

The Python equivalent is the same shape — see the end-to-end sketch below, which uses it directly.
`FunctionChoiceBehavior` also caps how many unattended rounds the Kernel will run before stopping —
the SK name for the max-iterations stop condition every agent execution loop needs. Treat the
bespoke planners as legacy vocabulary you'll still see in older codebases and tutorials, and
automatic function calling as the thing to actually build against — but verify current defaults
against SK's release notes before citing a specific behavior in an interview answer; this is an area
the SDK has visibly moved.

## Minimal end-to-end sketch

```python
import asyncio
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings
from semantic_kernel.functions import kernel_function

class OrderPlugin:
    @kernel_function(description="Look up an order's current status by ID")
    def get_order_status(self, order_id: str) -> str:
        return f"{order_id}: shipped, arriving in 2 days"   # stand-in for real lookup

async def main():
    kernel = Kernel()
    kernel.add_service(AzureChatCompletion(
        deployment_name="gpt-4o", endpoint=ENDPOINT, api_key=API_KEY))
    kernel.add_plugin(OrderPlugin(), plugin_name="Order")

    settings = AzureChatPromptExecutionSettings(
        function_choice_behavior=FunctionChoiceBehavior.Auto())
    result = await kernel.invoke_prompt(
        "What's the status of order ORD-48213?", settings=settings)
    print(result)   # "Order ORD-48213 has shipped and arrives in 2 days."

asyncio.run(main())
```

Everything above the plugin class is boilerplate you write once per app; the plugin class is the
only part that grows as you wrap more of your existing service surface.

## .NET vs Python SDK parity

C# is the reference implementation — new capability generally lands there first and reaches Python
later, sometimes with a different name for the same concept:

| Capability                                                 | .NET                             | Python                                      | Note                                                                        |
| ---------------------------------------------------------- | -------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| Kernel / plugin / KernelFunction core                      | Stable, first-class              | Stable, first-class                         | The API this note covers has solid parity                                   |
| Automatic function calling                                 | Stable                           | Stable                                      | Same model, same `FunctionChoiceBehavior` concept name in both              |
| DI integration                                             | Idiomatic (`IServiceCollection`) | No equivalent convention                    | Python construction is always explicit/imperative                           |
| Process Framework (durable, stateful multi-step workflows) | Shipped first                    | Landed later, narrower surface historically | Verify current Python coverage before assuming parity                       |
| OpenAPI plugin import                                      | Mature                           | Supported                                   | Both generate KernelFunctions from a spec; C# tooling is more mature        |
| MCP as a plugin source                                     | Available                        | Available, trailing                         | Direction is converging toward MCP as the interop layer in both SDKs        |
| Java SDK                                                   | —                                | —                                           | A smaller, separate surface exists; not parity-tracked against either above |

The core Kernel/plugin/function-calling row is stable enough to defend in an interview. The
"later/narrower" rows are directionally correct as of my knowledge, not version-numbered claims —
confirm against current SK release notes before betting an architecture decision on them, the same
caveat the conceptual chapter draws around the AutoGen/Semantic Kernel convergence.

## Related

- [[building-agentic-systems/03-agent-frameworks/06-semantic-kernel/06-semantic-kernel|The Semantic Kernel chapter]]
  — why "plug into an existing app" is the design center this API serves, and the plugin-ecosystem
  parallel with OpenAPI import and MCP-as-plugin-source
- [[crewai|CrewAI]] and [[autogen|AutoGen]] — both build a new agent-first runtime (a Crew, a group
  chat) rather than instrumenting code you already own; Microsoft has signaled convergence between
  AutoGen and Semantic Kernel specifically, worth watching if you're comparing the two today
- [[agentic-ai-engineering/04-tools-and-environment-interaction/01-tool-calling-architecture/01-tool-calling-architecture|Tool Calling Architecture]]
  — the name/description/schema contract `[KernelFunction]` and `@kernel_function` compile down to
