---
title: askEventDocAiLoadChats
description: Client story — load the current document's chat list into UI state, with loading and error flags.
---

# askEventDocAiLoadChats

Client-side story that loads the current document's chats and pushes them into the chat SPA's state. It flips the "loading chats" flag, issues [askEventDocAiChatListRequest](./ask-event-doc-ai-chat-requests.md), and dispatches either the chat list or an error message. The document scope comes from the [eventDocAi context](./ask-event-doc-ai-context-read.md) provided around the chat panel.

This is one of the four client stories also exposed as `sharedEventDocAiApi`. It drives UI state through the `askUIEventDocAi*` actions (documented separately).

- Built from [askCatch](../../core/system/ask-catch.md), [askEventDocAiChatListRequest](./ask-event-doc-ai-chat-requests.md), and the `askEventDocAiSetChats` / `askEventDocAiSetLoadingChats` / `askEventDocAiSetError` UI actions.

```typescript
import { askEventDocAiLoadChats } from '@qpqjs/features';

export function* askOnChatPanelOpen() {
  yield* askEventDocAiLoadChats();
}
```

## Signature

```typescript
function* askEventDocAiLoadChats(): AskResponse<void>;
```

## Returns

`void`. On success the chat list is dispatched to state via `askEventDocAiSetChats`; on failure the error text is dispatched via `askEventDocAiSetError`. The loading flag is cleared either way (passed as `askCatch`'s finally story).

## Related

- [askEventDocAiChatListRequest](./ask-event-doc-ai-chat-requests.md) — the request it issues.
- [askEventDocAiNewChat](./ask-event-doc-ai-new-chat.md) / [askEventDocAiSelectChat](./ask-event-doc-ai-select-chat.md) / [askEventDocAiSendMessage](./ask-event-doc-ai-send-message.md) — the sibling client stories.
- [askEventDocAiContextRead](./ask-event-doc-ai-context-read.md) — supplies the document scope.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — the feature these chats belong to.
