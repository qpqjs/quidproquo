---
title: defineEventDocAi
description: Add an AI chat experience to an eventDoc collection — per-document chats, streamed replies, tools, and the websocket handlers that serve them.
---

# defineEventDocAi

Declares an **AI chat feature** attached to an [eventDoc](./event-doc.md) collection. It is the AI sibling of `defineEventDoc`: every chat is scoped to a single document in the collection, its messages are persisted, and the assistant's reply streams back to the browser token by token over a websocket.

`defineEventDocAi` returns an array of QPQ config settings, so spread it into your service config alongside the collection's own `defineEventDoc*` settings. In one call it:

- provisions a **storage drive** for chat histories (one JSON file per chat) and a **key-value store** listing each document's chats,
- registers an **AI** (model + tools) the chat turns prompt through, and
- subscribes a dedicated **queue** of four websocket service-request handlers (`onChatCreate`, `onChatList`, `onChatHistory`, `onChatSend`) that ship inside quidproquo-features, and
- registers a **continuation service function** (`<storeName>AiChatContinue`) a chat turn hands itself to when the runtime deadline is near, so a long agentic turn spans as many executions as it needs. Each hop runs on the requesting session, streams to the same websocket correlation, and the last one sends the reply.

The handlers and any tool executors read the wiring from per-processor globals, exactly like `defineEventDocRoutes`' controllers — you do not write the backend, only configure it.

- **On AWS:** deploys the union of the five config settings it returns — a DynamoDB table ([defineKeyValueStore](../core/key-value-store.md), partition `docId` / sort `chatId`) for the chat list, an S3 bucket ([defineStorageDrive](../core/storage-drive.md)) for chat-history JSON, the AI registration ([defineAi](../core/ai.md), granting Bedrock model access and registering the `tools`), and an SQS queue ([defineQueue](../core/queue.md)) subscribed to `eventBusName` whose processors are the four chat websocket handlers, plus a Lambda ([defineServiceFunction](../webserver/service-function.md)) for the continuation. Names are derived from `storeName`, so the same config deploys per environment without collisions.

```typescript
import { defineEventDocAi } from 'quidproquo-features';
import { AiModel } from 'quidproquo-core';

export default [
  // ...the collection's own defineEventDoc* settings

  ...defineEventDocAi({
    storeName: 'project',
    type: 'project',
    serviceName: 'app',
    eventBusName: 'app-ws-events',
    userDirectoryName: 'users',
    // optional: model, system prompt, tools, reasoning budget
  }),
];
```

## Signature

```typescript
function defineEventDocAi(options: EventDocAiOptions): QPQConfig;
```

`QPQConfig` here is the array of config settings described above.

## Parameters

All options are a single `EventDocAiOptions` object.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `storeName` | `string` | – (required) | The eventDoc collection these chats attach to. Must match the collection's `defineEventDoc` store name — the same document store the chats are scoped against. Also the seed for the chat drive, chat-list store, and queue names. |
| `type` | `string` | – (required) | The collection's document type. Combined with each method verb by `buildEventDocAiMethodName` (`eventDocAi/<type>/<method>`) so multiple collections' chats coexist on one service. |
| `serviceName` | `string` | – (required) | The service the websocket requests route through. Must match the `serviceName` the frontend provides to the chat context (see [askEventDocAiContextProvide](../../actions/features/event-doc-ai/ask-event-doc-ai-context-read.md)). |
| `eventBusName` | `string` | – (required) | The websocket events bus the chat queue subscribes to (application-specific). |
| `userDirectoryName` | `string` | – (required) | The user directory used to resolve the acting user (chats record `createdByUserId`; the send handler gates on connection auth). |
| `aiName` | `string` | `` `${storeName}-ai` `` | Name of the AI registration ([defineAi](../core/ai.md)) the turns prompt through. Override to share or namespace the AI. |
| `model` | `AiModel` | `AiModel.ClaudeSonnet46` | The model each chat turn is sent to. |
| `systemPrompt` | `string` | – | A static system prompt for every turn. Used when no `systemPromptGenerator` is set (or the generator returns empty). Falls back to a built-in default (`"You are a helpful assistant. Use tools when appropriate."`) if neither is provided. |
| `systemPromptGenerator` | `string` | – | Name of a `defineInlineFunction` invoked on **every** turn to build the system prompt. It receives an `EventDocAiSystemPromptInput` (`{ docId }`, the trusted document id) and returns a string — so the prompt can carry live document state. A non-empty result overrides `systemPrompt`; an empty result falls back to it. |
| `tools` | `AiToolDefinition[]` | `[]` | Tools the model may call, registered on the AI. Executors are `defineInlineFunction` names supplied by the caller. Tool runtimes inherit the chat's session context, so they read the trusted `docId` from context rather than trusting the model to pass it. |
| `reasoningBudgetTokens` | `number` | `4096` | Extended-thinking token budget. Pass `0` to disable reasoning entirely. Reasoning streams to the chat as `reasoning` segments so the user sees progress instead of a silent wait. |

## The chat model

- A **chat** is scoped to one document (`docId`) in the collection. Its summary — `{ docId, chatId, name, createdAt, updatedAt, createdByUserId }` (`EventDocAiChatSummary`) — is a row in the chat-list key-value store (partition `docId`, sort `chatId`).
- A chat's **message history** is stored as a single JSON file on the chat drive at `` `${docId}/${chatId}/history.json` ``, holding an array of `EventDocAiChatMessage` (`{ role, segments[] }`). Segments are the durable content format: `text`, `reasoning`, `file` (an attachment), and `tool-use` (tool calls paired with results).
- **Sending a message** appends the user message to the history, streams the assistant's reply through [askAiPromptStream](../../actions/core/ai/ask-ai-prompt-stream.md), dispatches each stream part to the UI live, then folds the completed reply into durable segments, appends it, and bumps the chat's `updatedAt`. Stream parts are transport-only — they never persist; only the folded segments are saved.
- **Attachments** are eventDoc assets (uploaded via the collection's asset routes) referenced by bare `assetId`. The send flow validates each id against the session's trusted `docId` before it can reach the model, so a client can never point the AI at another document's files.

The four verbs — chat create, list, history, and send — are exposed to the browser as websocket service requests. See the [Event Doc AI actions](../../actions/features/event-doc-ai/ask-event-doc-ai-process-send.md) for the requesters, and the `askUIEventDocAi*` UI actions for driving the chat SPA's state.

## Examples

```typescript
import { defineEventDocAi } from 'quidproquo-features';
import { AiModel } from 'quidproquo-core';

export default [
  // A per-document assistant with tools and a document-aware system prompt.
  ...defineEventDocAi({
    storeName: 'project',
    type: 'project',
    serviceName: 'app',
    eventBusName: 'app-ws-events',
    userDirectoryName: 'users',
    model: AiModel.ClaudeSonnet46,
    systemPromptGenerator: '/entry/ai/buildProjectPrompt::buildProjectPrompt',
    tools: [
      /* AiToolDefinition[]; executors registered via defineInlineFunction */
    ],
    reasoningBudgetTokens: 8192,
  }),
];
```

## Related

- [defineEventDoc](./event-doc.md) — the collection these chats attach to (`storeName` / `type` must match).
- [defineAi](../core/ai.md) — the AI registration `aiName`/`tools` map to.
- [defineKeyValueStore](../core/key-value-store.md) / [defineStorageDrive](../core/storage-drive.md) / [defineQueue](../core/queue.md) — the infrastructure this config composes.
- [askAiPromptStream](../../actions/core/ai/ask-ai-prompt-stream.md) — the streamed prompt each chat turn runs.
- [askEventDocAiProcessSend](../../actions/features/event-doc-ai/ask-event-doc-ai-process-send.md) — the backend turn orchestrator.
- [Event Doc AI actions](../../actions/features/event-doc-ai/ask-event-doc-ai-context-read.md) — the chat requesters and context wrappers.
