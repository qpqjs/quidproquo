---
title: askEventDocAiNewChat
description: Client story — create a new chat for the current document and make it the active, empty conversation.
---

# askEventDocAiNewChat

Client-side story that creates a new chat for the current document and switches the UI to it. It issues [askEventDocAiChatCreateRequest](./ask-event-doc-ai-chat-requests.md), then upserts the new chat into the list, marks it active, clears the message view, and clears any live stream. Returns the created summary (or `null` on failure).

One of the four client stories exposed as `sharedEventDocAiApi`.

- Built from [askCatch](../../core/system/ask-catch.md), [askEventDocAiChatCreateRequest](./ask-event-doc-ai-chat-requests.md), and the `askEventDocAiUpsertChat` / `askEventDocAiSetActiveChat` / `askEventDocAiSetMessages` / `askEventDocAiClearStream` / `askEventDocAiSetError` UI actions.

```typescript
import { askEventDocAiNewChat } from '@qpqjs/features';

export function* askOnNewChatClicked() {
  const chat = yield* askEventDocAiNewChat();
  if (chat) {
    // chat.chatId is now the active conversation
  }
}
```

## Signature

```typescript
function* askEventDocAiNewChat(): AskResponse<Nullable<EventDocAiChatSummary>>;
```

## Returns

`Nullable<EventDocAiChatSummary>` — the created chat summary, or `null` if creation failed (in which case the error text is dispatched via `askEventDocAiSetError`). On success it also dispatches: upsert the chat into the list, set it active, empty the message list, and clear the stream buffer.

## Notes

- [askEventDocAiSendMessage](./ask-event-doc-ai-send-message.md) calls this implicitly when the user sends the first message with no chat selected.

## Related

- [askEventDocAiChatCreateRequest](./ask-event-doc-ai-chat-requests.md) — the request it issues.
- [askEventDocAiLoadChats](./ask-event-doc-ai-load-chats.md) / [askEventDocAiSelectChat](./ask-event-doc-ai-select-chat.md) / [askEventDocAiSendMessage](./ask-event-doc-ai-send-message.md) — the sibling client stories.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — the feature these chats belong to.
