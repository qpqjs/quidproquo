---
title: askEventDocAiProcessContinue
description: Resume a chat turn a previous execution handed off before its runtime deadline.
---

# askEventDocAiProcessContinue

Resumes a turn that an earlier execution handed off. It loads the saved chat history, which already ends on the partial assistant reply, and runs [askEventDocAiStreamTurn](./ask-event-doc-ai-stream-turn.md) as a continuation so the model picks up from its own recorded tool calls and results. This is the story behind the `<storeName>AiChatContinue` service function that [defineEventDocAi](../../../config/features/event-doc-ai.md) registers.

The service function entry (`eventDocAiChatContinue`) is invoked async with the requesting session, so the websocket connection, correlation, storage scope, and actor all carry over. It rebuilds the eventDocAi context around this story, then either sends the result to the original correlation with `askServiceRequestRespond`, or returns silently if the turn was handed off again.

```typescript
import { askEventDocAiProcessContinue } from 'quidproquo-features';

export function* askResumeTurn(docId: string, chatId: string) {
  return yield* askEventDocAiProcessContinue(docId, chatId);
}
```

## Signature

```typescript
function* askEventDocAiProcessContinue(docId: string, chatId: string): AskResponse<EventDocAiChatSendResult | ServiceRequestDeferred>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document the chat is scoped to. Trusted: it came from the handing-off execution's context, not from a client. |
| `chatId` | `string` | The chat to resume. |

## Returns

See [askEventDocAiStreamTurn](./ask-event-doc-ai-stream-turn.md#returns).

## Related

- [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) — the turn that hands off.
- [askEventDocAiStreamTurn](./ask-event-doc-ai-stream-turn.md) — the shared streaming and handoff.
- [askServiceFunctionExecute](../../webserver/service-function/ask-service-function-execute.md) — the async invoke that starts a continuation.
