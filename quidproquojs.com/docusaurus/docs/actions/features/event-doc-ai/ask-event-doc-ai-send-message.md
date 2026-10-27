---
title: askEventDocAiSendMessage
description: Client story — send a chat message and stream the assistant's reply into UI state, creating a chat implicitly if none is active.
---

# askEventDocAiSendMessage

Client-side story that sends a user message and drives the streamed reply into UI state. If no chat is active it creates one implicitly via [askEventDocAiNewChat](./ask-event-doc-ai-new-chat.md). It optimistically appends the user message, flips the "sending" flag, and issues [askEventDocAiChatSendRequest](./ask-event-doc-ai-chat-requests.md) — the assistant's reply streams in through `askUIEventDocAiAppendStreamChunk` dispatches while the request is in flight, and the finalized message is dispatched by the backend before the request resolves.

The primary entry point a chat composer calls. One of the four client stories exposed as `sharedEventDocAiApi`.

- Built from [askCatch](../../core/system/ask-catch.md), [askStateRead](../../core/state/ask-state-read.md), [askEventDocAiNewChat](./ask-event-doc-ai-new-chat.md), [askEventDocAiChatSendRequest](./ask-event-doc-ai-chat-requests.md), and the `askUIEventDocAiAppendChatMessage` / `askUIEventDocAiClearStream` / `askUIEventDocAiSetSending` / `askUIEventDocAiSetError` UI actions.

```typescript
import { askEventDocAiSendMessage } from '@qpqjs/features';

export function* askOnComposerSubmit(text: string) {
  yield* askEventDocAiSendMessage(text);
}
```

## Signature

```typescript
function* askEventDocAiSendMessage(
  message: string,
  attachments?: EventDocAiAttachment[],
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `message` | `string` | – | The user's message text. |
| `attachments` | `EventDocAiAttachment[]` | `[]` | Document assets to attach — each `{ assetId, filename, mediaType }`. Presented to the model attachments-first, then the text. |

## Returns

`void`. Behaviour:

- Reads `activeChatId` from state ([askStateRead](../../core/state/ask-state-read.md)); if there is none, creates a chat with [askEventDocAiNewChat](./ask-event-doc-ai-new-chat.md) and aborts silently if creation fails.
- Clears any prior error, optimistically appends the user message, clears the stream buffer, and sets the sending flag.
- Issues [askEventDocAiChatSendRequest](./ask-event-doc-ai-chat-requests.md); the reply streams in via UI dispatches during the request. On failure the error text is dispatched via `askUIEventDocAiSetError`. The sending flag and stream buffer are cleared afterwards.

## Related

- [askEventDocAiChatSendRequest](./ask-event-doc-ai-chat-requests.md) — the request it issues.
- [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) — the backend turn that produces the streamed reply.
- [askEventDocAiNewChat](./ask-event-doc-ai-new-chat.md) — created implicitly when no chat is active.
- [askEventDocAiLoadChats](./ask-event-doc-ai-load-chats.md) / [askEventDocAiSelectChat](./ask-event-doc-ai-select-chat.md) — the sibling client stories.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — the feature these chats belong to.
