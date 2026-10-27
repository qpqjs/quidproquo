---
title: askEventDocAiChatHistoryLoad / askEventDocAiChatHistorySave
description: Load and save a chat's message history — the JSON file on the chat drive that holds one chat's messages.
---

# askEventDocAiChatHistoryLoad & askEventDocAiChatHistorySave

Backend helpers that read and write one chat's message history. A chat's history lives as a single JSON file on the chat storage drive at `` `${docId}/${chatId}/history.json` `` (an `EventDocAiChatHistoryFile`, `{ messages }`). Load returns the messages; save overwrites the whole file.

These run inside the `onChatHistory` and `onChatSend` handlers — the drive name comes from the processor globals set by [defineEventDocAi](../../../config/features/event-doc-ai.md), so both must run under that feature's runtime.

- `Load` built from [askConfigGetGlobal](../../core/config/ask-config-get-global.md), [askFileExists](../../core/file/ask-file-exists.md), and [askFileReadObjectJson](../../core/file/ask-file-read-object-json.md).
- `Save` built from [askConfigGetGlobal](../../core/config/ask-config-get-global.md) and [askFileWriteObjectJson](../../core/file/ask-file-write-object-json.md).

```typescript
import { askEventDocAiChatHistoryLoad, askEventDocAiChatHistorySave } from '@qpqjs/features';

export function* askAppendSystemNote(docId: string, chatId: string) {
  const history = yield* askEventDocAiChatHistoryLoad(docId, chatId);
  yield* askEventDocAiChatHistorySave(docId, chatId, [
    ...history,
    { role: 'assistant', segments: [{ type: 'text', text: 'Note added.' }] },
  ]);
}
```

## askEventDocAiChatHistoryLoad

Reads a chat's saved messages. A chat with no history file yet returns an empty array (not an error).

### Signature

```typescript
function* askEventDocAiChatHistoryLoad(
  docId: string,
  chatId: string,
): AskResponse<EventDocAiChatMessage[]>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document the chat is scoped to. |
| `chatId` | `string` | The chat whose history to load. |

### Returns

`EventDocAiChatMessage[]` — the persisted messages, or `[]` if the history file does not exist.

## askEventDocAiChatHistorySave

Writes the full message list to the chat's history file, replacing any existing content.

### Signature

```typescript
function* askEventDocAiChatHistorySave(
  docId: string,
  chatId: string,
  messages: EventDocAiChatMessage[],
): AskResponse<void>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document the chat is scoped to. |
| `chatId` | `string` | The chat whose history to overwrite. |
| `messages` | `EventDocAiChatMessage[]` | The complete message list to persist. Save is a full overwrite — pass the whole history, not a delta. |

### Returns

`void`.

## The message format

Each `EventDocAiChatMessage` is `{ role: 'user' | 'assistant'; segments: EventDocAiMessageSegment[] }`. A segment is one of:

| Segment | Shape | Meaning |
| --- | --- | --- |
| `text` | `{ type: 'text'; text: string }` | Plain message text. |
| `reasoning` | `{ type: 'reasoning'; text: string }` | An extended-thinking block. |
| `file` | `{ type: 'file'; attachment: EventDocAiAttachment }` | A referenced document asset (`{ assetId, filename, mediaType }`). |
| `tool-use` | `{ type: 'tool-use'; tools: EventDocAiToolUse[] }` | Tool calls, each `{ toolName, input, output? }` (output absent while still running). |

Streaming `AiStreamPart`s are never persisted — they are folded into these segments before saving (see [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md)).

## Related

- [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) — appends to and saves the history each turn.
- [askEventDocAiChatHistoryRequest](./ask-event-doc-ai-chat-requests.md) — the frontend request that returns this history.
- [askFileReadObjectJson](../../core/file/ask-file-read-object-json.md) / [askFileWriteObjectJson](../../core/file/ask-file-write-object-json.md) — the underlying file actions.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — declares the chat drive these read/write.
