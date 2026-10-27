---
title: askEventDocAiChatList / askEventDocAiChatTouch / askEventDocAiChatUpsert
description: The chat-list store helpers — list a document's chats, bump a chat to the top, and upsert a chat summary row.
---

# Chat-list store helpers

Backend helpers over the chat-list key-value store — the table [defineEventDocAi](../../../config/features/event-doc-ai.md) provisions with partition `docId` and sort `chatId`, one row per chat (`EventDocAiChatSummary`). Each reads the store name from the processor globals, so all three run under the eventDocAi feature's runtime.

- `List` built from [askConfigGetGlobal](../../core/config/ask-config-get-global.md) and [askKeyValueStoreQuery](../../core/key-value-store/ask-key-value-store-query.md).
- `Upsert` built from [askConfigGetGlobal](../../core/config/ask-config-get-global.md) and [askKeyValueStoreUpsert](../../core/key-value-store/ask-key-value-store-upsert.md).
- `Touch` built from [askKeyValueStoreQuery](../../core/key-value-store/ask-key-value-store-query.md), [askDateNow](../../core/date/ask-date-now.md), and `askEventDocAiChatUpsert`.

```typescript
import { askEventDocAiChatList, askEventDocAiChatTouch } from '@qpqjs/features';

export function* askMostRecentChat(docId: string) {
  const chats = yield* askEventDocAiChatList(docId);
  if (chats[0]) {
    yield* askEventDocAiChatTouch(docId, chats[0].chatId);
  }
  return chats[0] ?? null;
}
```

## askEventDocAiChatList

Returns all chats for one document, most recently updated first. Sorting is done in-story (by `updatedAt` descending) rather than via a GSI — per-document chat counts are small and the dev-server query processor can't target a secondary index.

### Signature

```typescript
function* askEventDocAiChatList(docId: string): AskResponse<EventDocAiChatSummary[]>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document whose chats to list. |

**Returns** `EventDocAiChatSummary[]` — the document's chats sorted newest-updated first.

## askEventDocAiChatUpsert

Writes (inserts or replaces) a chat summary row.

### Signature

```typescript
function* askEventDocAiChatUpsert(chat: EventDocAiChatSummary): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `chat` | `EventDocAiChatSummary` | The full summary row (`{ docId, chatId, name, createdAt, updatedAt, createdByUserId }`) to store. |

**Returns** `void`.

## askEventDocAiChatTouch

Bumps a chat's `updatedAt` to now so it sorts to the top of the list. A missing record — e.g. a chat deleted mid-conversation — is a no-op, not an error.

### Signature

```typescript
function* askEventDocAiChatTouch(docId: string, chatId: string): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document the chat belongs to. |
| `chatId` | `string` | The chat to bump. |

**Returns** `void`. Looks the row up, sets `updatedAt` to [askDateNow](../../core/date/ask-date-now.md), and re-upserts it; does nothing if no such row exists.

## EventDocAiChatSummary

| Property | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document the chat is scoped to (partition key). |
| `chatId` | `string` | The chat's id (sort key). |
| `name` | `string` | Display name. |
| `createdAt` | `QpqIsoDateTime` | Creation timestamp. |
| `updatedAt` | `QpqIsoDateTime` | Last-activity timestamp; drives list ordering. |
| `createdByUserId` | `string` | The user who created the chat. |

## Related

- [askEventDocAiChatListRequest](./ask-event-doc-ai-chat-requests.md) — the frontend request backed by `askEventDocAiChatList`.
- [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) — calls `askEventDocAiChatTouch` at the end of each turn.
- [askKeyValueStoreQuery](../../core/key-value-store/ask-key-value-store-query.md) / [askKeyValueStoreUpsert](../../core/key-value-store/ask-key-value-store-upsert.md) — the underlying store actions.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — declares the chat-list store.
