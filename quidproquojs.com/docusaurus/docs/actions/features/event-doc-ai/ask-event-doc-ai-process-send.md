---
title: askEventDocAiProcessSend
description: The backend chat turn — persist the user message, then stream the model's reply, handing off to a continuation before the runtime deadline.
---

# askEventDocAiProcessSend

Starts one conversational turn on the backend. It validates the attachments, appends the user's message to the chat history and **saves** immediately (so a refresh mid-reply still shows the question), then runs [askEventDocAiStreamTurn](./ask-event-doc-ai-stream-turn.md), which streams the reply and hands the turn to the continuation service function when the runtime deadline gets in the way. This is the handler behind the `ChatSend` websocket method (`onChatSend`).

- Built from [askEventDocAiAttachmentsValidate](./ask-event-doc-ai-attachments-validate.md), the history load/save helpers, and [askEventDocAiStreamTurn](./ask-event-doc-ai-stream-turn.md).

```typescript
import { askEventDocAiProcessSend } from 'quidproquo-features';

// From the ChatSend handler — docId is read from the trusted session context.
export function* askOnSend(docId: string, chatId: string, message: string) {
  return yield* askEventDocAiProcessSend(docId, chatId, message);
}
```

## Signature

```typescript
function* askEventDocAiProcessSend(
  docId: string,
  chatId: string,
  message: string,
  attachments?: EventDocAiAttachment[],
): AskResponse<EventDocAiChatSendResult>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `docId` | `string` | – | The trusted document the chat is scoped to (from session context). |
| `chatId` | `string` | – | The chat to append this turn to. |
| `message` | `string` | – | The user's message text. |
| `attachments` | `EventDocAiAttachment[]` | `[]` | Document assets to attach — each `{ assetId, filename, mediaType }`. Validated against `docId` before the model sees them. |

## Returns

`EventDocAiChatSendResult | ServiceRequestDeferred` — see [askEventDocAiStreamTurn](./ask-event-doc-ai-stream-turn.md#returns). The reply content is **not** in the return value; it is delivered to the UI during the turn via state dispatches.

## Related

- [askEventDocAiStreamTurn](./ask-event-doc-ai-stream-turn.md) — the streaming and handoff this delegates to.
- [askEventDocAiProcessContinue](./ask-event-doc-ai-process-continue.md) — the resumed-turn counterpart.
- [askEventDocAiAttachmentsValidate](./ask-event-doc-ai-attachments-validate.md) — the attachment guard.
- [askEventDocAiChatHistoryLoad / Save](./ask-event-doc-ai-chat-history-load.md) — the history read/write.
- [askEventDocAiChatTouch](./ask-event-doc-ai-chat-list.md) — bumps the chat afterwards.
- [askEventDocAiChatSendRequest](./ask-event-doc-ai-chat-requests.md) — the frontend request this handles.
- [askEventDocAiSendMessage](./ask-event-doc-ai-send-message.md) — the client story that issues the send.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — configures the model, prompt, tools, and reasoning budget this reads.
