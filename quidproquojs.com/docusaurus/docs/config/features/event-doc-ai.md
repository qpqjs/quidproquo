---
title: defineEventDocAi
description: Add an AI chat experience to an eventDoc collection — per-document chats, streamed replies, tools, and the websocket handlers that serve them.
---

# defineEventDocAi

Declares an **AI chat feature** attached to an [eventDoc](./event-doc.md) collection. It is the AI sibling of `defineEventDoc`: every chat is scoped to a single document in the collection, its messages are persisted, and the assistant's reply streams back to the browser token by token over a websocket.

`defineEventDocAi` returns an array of QPQ config settings, so spread it into your service config alongside the collection's own `defineEventDoc*` settings. In one call it:

- provisions a **key-value store** listing each document's chats, a second one holding every chat's messages (one row per piece of a message), and a **storage drive** for the few rows whose content is too big for a row,
- registers an **AI** (model + tools) the chat turns prompt through, and
- subscribes a dedicated **queue** of five websocket service-request handlers (`onChatCreate`, `onChatList`, `onChatHistory`, `onChatSend`, `onChatRowContent`) that ship inside @qpqjs/features, and
- registers a **continuation service function** (`<storeName>AiChatContinue`) a chat turn hands itself to when the runtime deadline is near, so a long agentic turn spans as many executions as it needs. Each hop runs on the requesting session, streams to the same websocket correlation, and the last one sends the reply.

The handlers and any tool executors read the wiring from per-processor globals, exactly like `defineEventDocRoutes`' controllers — you do not write the backend, only configure it.

- **On AWS:** deploys the union of the config settings it returns: a DynamoDB table ([defineKeyValueStore](../core/key-value-store.md), partition `docId` / sort `chatId`) for the chat list, a second table for the chat rows (partition `docId#chatId` / sort a sortable row id), an S3 bucket ([defineStorageDrive](../core/storage-drive.md)) for row content too big for a row, the AI registration ([defineAi](../core/ai.md), granting Bedrock model access and registering the `tools`), and an SQS queue ([defineQueue](../core/queue.md)) subscribed to `eventBusName` whose processors are the five chat websocket handlers, plus a Lambda ([defineServiceFunction](../webserver/service-function.md)) for the continuation. Names are derived from `storeName`, so the same config deploys per environment without collisions. Two more are still declared and unused, marked `deleteOnRemove`: the table and bucket that held chats when each chat was one file (`<storeName>AiChats`). The release that stops declaring them deletes them.

```typescript
import { defineEventDocAi } from '@qpqjs/features';
import { AiModel } from '@qpqjs/core';

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
| `scoped` | `boolean` | `false` | Set when the collection's routes have a scope resolver. The chat-list store, the chat-rows store and the drive then refuse unscoped calls, and chats are filed under the connection's storage scope, as the collection's documents are. |
| `authorise` | `string` | – | Name of the collection's `authorise` inline function (the one its routes declare; see [defineEventDocRoutes](./event-doc-routes.md)). Run for `read` before every chat method, with `{ docId, storeName, action }`: a chat has no HTTP event, so it is told which document the chat is opened on and can decide per document. It throws to refuse. Omitted, chats are gated by scope alone. |
| `eventBusName` | `string` | – (required) | The websocket events bus the chat queue subscribes to (application-specific). |
| `userDirectoryName` | `string` | – (required) | The user directory used to resolve the acting user (chats record `createdByUserId`; the send handler gates on connection auth). |
| `aiName` | `string` | `` `${storeName}-ai` `` | Name of the AI registration ([defineAi](../core/ai.md)) the turns prompt through. Override to share or namespace the AI. |
| `model` | `AiModel` | `AiModel.ClaudeSonnet46` | The model each chat turn is sent to. |
| `systemPrompt` | `string` | – | A static system prompt for every turn. Used when no `systemPromptGenerator` is set (or the generator returns empty). Falls back to a built-in default (`"You are a helpful assistant. Use tools when appropriate."`) if neither is provided. |
| `systemPromptGenerator` | `string` | – | Name of a `defineInlineFunction` invoked on **every** turn to build the system prompt. It receives an `EventDocAiSystemPromptInput` (`{ docId }`, the trusted document id) and returns a string. The text must be identical every turn: the system prompt heads the cached prefix, and any change rewrites the whole conversation to cache. Per-turn document state belongs in `turnContextGenerator` or in tools. A non-empty result overrides `systemPrompt`; an empty result falls back to it. |
| `turnContextGenerator` | `string` | – | Name of a `defineInlineFunction` invoked on **every** turn to build the turn context. Same input as the system prompt generator; the returned text is sent as a user message after the saved history, never persisted and never cached, so this is where live document state goes (a version number and a changed-outside-this-chat note is usually enough when the chat has read tools). An empty result sends no context message. |
| `tools` | `AiToolDefinition[]` | `[]` | Tools the model may call, registered on the AI. Executors are `defineInlineFunction` names supplied by the caller. Tool runtimes inherit the chat's session context, so they read the trusted `docId` from context rather than trusting the model to pass it. |
| `reasoningEffort` | `Nullable<AiReasoningEffort>` | `AiReasoningEffort.Medium` | How hard the model thinks before it answers (`Low`, `Medium`, `High`, `XHigh`, `Max`). Pass `null` to turn thinking off. On Claude 4.6 and older the effort becomes a thinking token budget (1,024 to 32,768 tokens); Opus 4.7 and newer and Sonnet 5 take it directly. Reasoning streams to the chat as `reasoning` segments so the user sees progress instead of a silent wait. |
| `maxOutputTokens` | `number` | `65536` | Output token cap per model call, defaulting to the Claude Sonnet ceiling on Bedrock (a model with a lower ceiling rejects the request, so lower it for those). The provider default (8192) is too small for a reasoning block plus a large tool input; a call that hits it is cut off mid-JSON. A turn cut off this way is resumed up to three times before it gives up. |
| `cacheTtl` | `AiCacheTtl` | `AiCacheTtl.Dynamic` | Requested lifetime of the prompt cache entries each turn writes. `AiCacheTtl.Dynamic` keeps the system prompt and the saved history for an hour on Bedrock, so they survive a user's pause between messages, and the tool loop for five minutes, since it is discarded when the turn ends. `AiCacheTtl.FiveMinutes` suits chats with short, rapid turns; `AiCacheTtl.OneHour` pins the hour on the system prompt and saved history. The tool loop is always five minutes, whatever is requested. A model that cannot cache for an hour gets the default instead of a failed request. |
| `sendUsageToFrontend` | `boolean` | `false` | Whether usage reaches the browser on the finalised message and the chat history. Off, the finalise signal carries no usage and a chat's usage rows are left out of every page of history. On, each assistant message arrives with its `usage` (the tokens, and `chargeMicroUsd` when the chat has a `usageReport`) and `model`, and `selectEventDocAiChatUsage` sums the open chat. Usage is saved to the chat either way. The live stream's finish parts never carry usage, and what a call cost the platform (`costMicroUsd`) is never saved or sent. |
| `usageReport` | `EventDocAiUsageReport` | – | `{ reportName, chargeRates, defaultChargeRates }`. Counts every model call in that [report](./reports.md) with [askAiUsageReport](../../actions/features/ai-usage/ask-ai-usage-report.md), under the chat's scope (the tenant or person the document belongs to), with the chat's `type` as the source and the client charged at `chargeRates` (`AiModelTokenRates`, US dollars per million tokens per model), or at `defaultChargeRates` (with a warning) for a model missing from them. Each reply is also saved with its charge as `usage.chargeMicroUsd`. Each execution is one count, made as soon as the model stops streaming, before the reply is saved. A stream that errored or was stopped is counted by the steps that finished. Omitted, the chat counts nothing. |

## The chat model

- A **chat** is scoped to one document (`docId`) in the collection. Its summary — `{ docId, chatId, name, createdAt, updatedAt, createdByUserId }` (`EventDocAiChatSummary`) — is a row in the chat-list key-value store (partition `docId`, sort `chatId`).
- A chat's **messages** are stored as rows in the chat-rows key-value store, one row per piece of a message (`EventDocAiChatRow`): a `text` or `reasoning` block, a `file` (an attachment), one `toolUse` (a tool call with its input and output) or a reply's `usage` (`EventDocAiChatRowKind`). A message is several rows because one reply, with a whole turn of tool calls, can be far bigger than a row may be; rows that share a `messageId` are one `EventDocAiChatMessage` (`{ role, segments[] }`) again when read. A row whose content is over 64 KB (a tool call that returned a whole document, say) has that content saved to the chat drive as one file at `` `${docId}/${chatId}/${rowId}.json` ``, and the row only marks that it is there (`data: { type: 'storageDrive' }`, the same shape a snapshot row uses). The chat is only ever added to: nothing rewrites earlier rows. Assistant messages also record the `model` that produced them and the `usage` of the execution that did (token counts, cache reads and writes included, and `chargeMicroUsd` when the chat has a `usageReport`), so what a chat is charged can be read from its rows. What it cost the platform is not kept here; it is in the usage report; a turn that spanned several executions is several assistant messages, each with its own usage. A reply that was stopped before the end records the usage of the steps that finished.
- **Opening a chat** never sends it whole, because a websocket message over 128 KB is not delivered. The browser asks for the newest page of rows (up to 50 rows and about 100 KB), then for the page before the oldest row it has, until none are left; the newest messages show at once and the older ones fill in above. A row whose content is on the drive arrives as a marker, and the browser then asks for a 60 second link to it and downloads it. Rows that hold their own content, which is nearly all of them, cost nothing more.
- **Sending a message** adds the user message to the chat, loads the whole chat for the model (reading back the content of any row held on the drive), streams the assistant's reply through [askAiPromptStream](../../actions/core/ai/ask-ai-prompt-stream.md), dispatches each stream part to the UI live, then folds the completed reply into durable segments, adds its rows, and bumps the chat's `updatedAt`. The finished reply is not sent to the browser again: a small `FinalizeStream` signal turns the reply the browser streamed into a finalized message. A stream part too big for one websocket message is held back, and the browser reloads the chat when the send ends. Stream parts are transport-only and never persist; only the folded segments are saved. The turn context (the `turnContextGenerator` output and, on a resumed turn, the continuation nudge) is sent after the history and is never saved either.
- **Attachments** are eventDoc assets (uploaded via the collection's asset routes) referenced by bare `assetId`. The send flow validates each id against the session's trusted `docId` before it can reach the model, so a client can never point the AI at another document's files.

The five verbs (chat create, list, history, send, and row content) are exposed to the browser as websocket service requests. See the [Event Doc AI actions](../../actions/features/event-doc-ai/ask-event-doc-ai-process-send.md) for the requesters, and the `askUIEventDocAi*` UI actions for driving the chat SPA's state.

### Failed, declined and unexplained turns

A turn whose AI request fails (an expired credential, a model the account cannot use, a provider outage) is saved with the reply "I am sorry, but I am currently having issues. Please pass this message on to an administrator:" followed by the provider's own error message in quotes. A turn the model declines (the provider reports a content filter, which is also how an Anthropic `refusal` arrives) is saved with the text "The model declined to answer this request." as its reply, so the person sees why nothing came back instead of an empty turn. A turn that stops for a reason the framework cannot name and produced nothing but reasoning is saved with "The model stopped without answering." and the provider's raw stop reason in brackets. Both are ordinary text segments in the history, so the conversation continues normally after them.

## Examples

```typescript
import { defineEventDocAi } from '@qpqjs/features';
import { AiModel } from '@qpqjs/core';

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
    turnContextGenerator: '/entry/ai/buildProjectContext::buildProjectContext',
    tools: [
      /* AiToolDefinition[]; executors registered via defineInlineFunction */
    ],
    reasoningEffort: AiReasoningEffort.High,
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
