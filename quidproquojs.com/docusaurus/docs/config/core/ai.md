---
title: defineAi
description: Define a named AI configuration — a set of tools a large language model can call while answering a prompt.
---

# defineAi

Declares a named **AI config**: a bundle of tool definitions that a large language model is allowed to call while it answers. Bind it to a prompt by passing its name as the `aiName` option to [askAiPrompt](../../actions/core/ai/ask-ai-prompt.md) or [askAiPromptStream](../../actions/core/ai/ask-ai-prompt-stream.md). Without an `aiName`, prompts run tool-less; with one, the model can invoke the declared tools and the runtime executes them and feeds the results back.

```typescript
import { defineAi } from '@qpqjs/core';

export default [
  defineAi('support-agent', {
    tools: [
      {
        name: 'lookupOrder',
        description: 'Look up an order by its id and return its current status.',
        executor: '/entry/ai/lookupOrder::lookupOrder',
        inputSchema: {
          type: 'object',
          properties: { orderId: { type: 'string' } },
          required: ['orderId'],
        },
      },
    ],
  }),
];
```

## Signature

```typescript
function defineAi(
  aiName: string,
  options?: QPQConfigAdvancedAiSettings,
): AiQPQConfigSetting;
```

## Parameters

### `aiName` — `string` (required)

The name of the AI config, and its `uniqueKey` within the config. This is the value you pass as the `aiName` option to the AI prompt actions to bind these tools to a request.

### `options` — `QPQConfigAdvancedAiSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `tools` | [`AiToolDefinition[]`](#aitooldefinition) | `[]` | The tools the model may call while answering. |
| `owner` | `CrossModuleOwner<'aiName'>` | – | Declares that this AI config is owned by **another** module/service, so this service binds to it rather than defining its own. `{ module, application, feature, environment, aiName }` — all optional; unset parts default to the current service. |

### `AiToolDefinition`

```typescript
interface AiToolDefinition {
  name: string;
  description: string;
  executor?: string;
  inputSchema: Record<string, unknown>;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Tool name the model uses to call it. |
| `description` | `string` | Natural-language description of what the tool does — the model reads this to decide when to call it, so make it precise. |
| `executor` | `string` (optional) | A `QpqFunctionRuntime` reference (`'/path/to/file::exportedFunction'`) to the story that runs when the model calls the tool. It receives the tool input (validated against `inputSchema`) and returns the tool output. Omit it to declare a **client-side tool**: the model's call isn't run server-side, the turn halts with the call unresolved, and the caller is expected to resolve it out-of-band (e.g. showing a form) and feed the answer back as the next message. |
| `inputSchema` | `Record<string, unknown>` | A JSON Schema describing the tool's input. The model is constrained to produce arguments matching this schema. |

## Notes

- When a bound prompt triggers a tool call for a tool with an `executor`, the AI action processor runs that story and returns its result to the model, looping up to 10 tool-calling steps before finishing. A tool call for a tool with no `executor` is left unresolved for the caller to answer.
- Streaming prompts surface each tool call, result, and approval request as `ToolCall` / `ToolResult` / `ToolApprovalRequest` parts on the stream — see [askAiPromptStream](../../actions/core/ai/ask-ai-prompt-stream.md#aistreamparttype).

## Related

- [askAiPrompt](../../actions/core/ai/ask-ai-prompt.md) — one-shot prompt; pass `aiName` to enable these tools.
- [askAiPromptStream](../../actions/core/ai/ask-ai-prompt-stream.md) — streaming prompt with the same `aiName` binding.
- [defineEventDocAi](../features/event-doc-ai.md) — registers an AI (name + tools) for a per-document chat feature.
