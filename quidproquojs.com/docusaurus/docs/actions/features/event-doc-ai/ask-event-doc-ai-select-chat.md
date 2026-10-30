---
title: askEventDocAiSelectChat
description: Client story — switch the active chat and load its message history into UI state.
---

# askEventDocAiSelectChat

Client-side story that makes a chat active and loads its history. It immediately marks the chat active and clears the message + stream views (so the UI switches instantly), sets the "loading history" flag, then issues [askEventDocAiChatHistoryRequest](./ask-event-doc-ai-chat-requests.md) and dispatches the loaded messages — or an error.

One of the four client stories exposed as `sharedEventDocAiApi`.

- Built from [askCatch](../../core/system/ask-catch.md), [askEventDocAiChatHistoryRequest](./ask-event-doc-ai-chat-requests.md), and the `askEventDocAiSetActiveChat` / `askEventDocAiSetMessages` / `askEventDocAiClearStream` / `askEventDocAiSetLoadingHistory` / `askEventDocAiSetError` UI actions.

```typescript
import { askEventDocAiSelectChat } from '@qpqjs/features';

export function* askOnChatPicked(chatId: string) {
  yield* askEventDocAiSelectChat(chatId);
}
```

## Signature

```typescript
function* askEventDocAiSelectChat(chatId: string): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `chatId` | `string` | The chat to switch to and load history for. |

## Returns

`void`. On success the chat's messages are dispatched via `askEventDocAiSetMessages`; on failure the error text is dispatched via `askEventDocAiSetError`. The loading flag is cleared either way.

## Related

- [askEventDocAiChatHistoryRequest](./ask-event-doc-ai-chat-requests.md) — the request it issues.
- [askEventDocAiLoadChats](./ask-event-doc-ai-load-chats.md) / [askEventDocAiNewChat](./ask-event-doc-ai-new-chat.md) / [askEventDocAiSendMessage](./ask-event-doc-ai-send-message.md) — the sibling client stories.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — the feature these chats belong to.
