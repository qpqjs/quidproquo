---
title: askEventDocAiChatMessagesLoad / askEventDocAiChatMessagesAppend
description: Load a whole chat for the model, and add messages to the end of a chat, as rows in the chat-rows store.
---

# askEventDocAiChatMessagesLoad & askEventDocAiChatMessagesAppend

Backend helpers that read and write a chat's messages. A chat is stored as rows in the chat-rows key-value store, one row per piece of a message (see [the chat model](../../../config/features/event-doc-ai.md#the-chat-model)), with the content of any row over 64 KB kept on the chat drive.

These run inside the `onChatSend` handler and the continuation function. The store and drive names come from the processor globals set by [defineEventDocAi](../../../config/features/event-doc-ai.md), so both must run under that feature's runtime.

```typescript
import { askEventDocAiChatMessagesAppend, askEventDocAiChatMessagesLoad } from '@qpqjs/features';

export function* askAppendSystemNote(docId: string, chatId: string) {
  yield* askEventDocAiChatMessagesAppend(docId, chatId, [{ role: 'assistant', segments: [{ type: 'text', text: 'Note added.' }] }]);

  return yield* askEventDocAiChatMessagesLoad(docId, chatId);
}
```

## askEventDocAiChatMessagesLoad

Reads every row of a chat, reads back the content of the rows that hold it on the chat drive (a batch at a time, and only those rows), and groups the rows into messages. Usage rows are left out: this is the chat as the model is sent it. Content whose file cannot be read becomes the text `[content unavailable]`, so one lost file never fails a turn. A chat with no rows returns an empty array.

### Signature

```typescript
function* askEventDocAiChatMessagesLoad(docId: string, chatId: string): AskResponse<EventDocAiChatMessage[]>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document the chat is scoped to. It is part of the rows' partition key, so a chat can only be read through its own document. |
| `chatId` | `string` | The chat to load. |

### Returns

`EventDocAiChatMessage[]`, oldest first.

## askEventDocAiChatMessagesAppend

Adds messages to the end of a chat. Each message becomes one row per piece, with row ids minted together so the rows keep the order the pieces were produced in. Content over 64 KB is written to the chat drive before its row, so a row never points at a file that is not there. Nothing already in the chat is rewritten.

### Signature

```typescript
function* askEventDocAiChatMessagesAppend(docId: string, chatId: string, messages: EventDocAiChatMessage[]): AskResponse<void>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document the chat is scoped to. |
| `chatId` | `string` | The chat to add to. |
| `messages` | `EventDocAiChatMessage[]` | The messages to add, in order. Only these: pass the new messages, not the whole chat. |

## Related

- [defineEventDocAi](../../../config/features/event-doc-ai.md): declares the store and drive these read and write.
- [askEventDocAiChatHistoryRequest](./ask-event-doc-ai-chat-requests.md): how the browser reads a chat, a page of rows at a time.
