---
title: askEventDocAiChat*Request
description: The four typed eventDocAi chat request builders — create, list, history, and send — issued from the browser over the websocket transport.
---

# Chat request builders

The four typed request builders a chat frontend calls to reach the backend. Each wraps [askEventDocAiServiceRequest](./ask-event-doc-ai-service-request.md) with a specific method verb and payload/response type; the transport wrapper reads the [eventDocAi context](./ask-event-doc-ai-context-read.md) and relays the trusted `docId`, so none of these takes a `docId` argument. They correspond one-to-one with the queue processors [defineEventDocAi](../../../config/features/event-doc-ai.md) registers (`onChatCreate`, `onChatList`, `onChatHistory`, `onChatSend`).

These are the low-level requests. For the client stories that call them and update UI state, see [askEventDocAiNewChat](./ask-event-doc-ai-new-chat.md), [askEventDocAiLoadChats](./ask-event-doc-ai-load-chats.md), [askEventDocAiSelectChat](./ask-event-doc-ai-select-chat.md), and [askEventDocAiSendMessage](./ask-event-doc-ai-send-message.md).

- Each built from [askEventDocAiServiceRequest](./ask-event-doc-ai-service-request.md) (method key `eventDocAi/<type>/<Verb>`).

```typescript
import { askEventDocAiChatCreateRequest, askEventDocAiChatSendRequest } from '@qpqjs/features';

export function* askStartAndAsk(question: string) {
  const chat = yield* askEventDocAiChatCreateRequest({ name: 'Untitled' });
  return yield* askEventDocAiChatSendRequest({ chatId: chat.chatId, message: question });
}
```

## askEventDocAiChatCreateRequest

Creates a new chat for the context's document and returns its summary row.

```typescript
function* askEventDocAiChatCreateRequest(
  payload?: EventDocAiChatCreatePayload,
): AskResponse<EventDocAiChatSummary>;
```

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `payload.name` | `string` | `'New chat'` | Display name for the chat. Omitted → the backend defaults to `'New chat'`. |

**Returns** `EventDocAiChatSummary` — `{ docId, chatId, name, createdAt, updatedAt, createdByUserId }`, the freshly created chat.

## askEventDocAiChatListRequest

Lists all chats for the context's document, most recently updated first. Takes no arguments (the document comes from context).

```typescript
function* askEventDocAiChatListRequest(): AskResponse<EventDocAiChatSummary[]>;
```

**Returns** `EventDocAiChatSummary[]` — the document's chats, sorted by `updatedAt` descending.

## askEventDocAiChatHistoryRequest

Loads the full message history of one chat.

```typescript
function* askEventDocAiChatHistoryRequest(
  payload: EventDocAiChatHistoryPayload,
): AskResponse<EventDocAiChatMessage[]>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `payload.chatId` | `string` | The chat to load history for. |

**Returns** `EventDocAiChatMessage[]` — every persisted message (`{ role, segments[] }`); an empty array if the chat has no saved history.

## askEventDocAiChatSendRequest

Sends a user message to a chat and streams the assistant's reply. The response only signals completion — the reply content arrives via `askUIEventDocAi*` state dispatches while the request is in flight.

```typescript
function* askEventDocAiChatSendRequest(
  payload: EventDocAiChatSendPayload,
): AskResponse<EventDocAiChatSendResult>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `payload.chatId` | `string` | The chat to append to. |
| `payload.message` | `string` | The user's message text. |
| `payload.attachments` | `EventDocAiAttachment[]` (optional) | Document assets to attach — each `{ assetId, filename, mediaType }`. Only the `assetId` crosses the wire; the server resolves the file from the trusted `docId`. |

**Returns** `EventDocAiChatSendResult` — `{ complete: boolean }`. The streamed content is delivered separately via UI state dispatches (see [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md)).

## Notes

- None of these take a `docId` — it is relayed from context by [askEventDocAiServiceRequest](./ask-event-doc-ai-service-request.md).
- Failures surface through the wrapping client stories, which catch them with `askCatch` and dispatch the error text to UI state.

## Related

- [askEventDocAiServiceRequest](./ask-event-doc-ai-service-request.md) — the transport wrapper these share.
- [askEventDocAiNewChat](./ask-event-doc-ai-new-chat.md) / [askEventDocAiLoadChats](./ask-event-doc-ai-load-chats.md) / [askEventDocAiSelectChat](./ask-event-doc-ai-select-chat.md) / [askEventDocAiSendMessage](./ask-event-doc-ai-send-message.md) — client stories that call these and update state.
- [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) — the backend handler behind `ChatSend`.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — registers the matching backend handlers.
