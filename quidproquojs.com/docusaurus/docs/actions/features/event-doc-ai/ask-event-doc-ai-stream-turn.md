---
title: askEventDocAiStreamTurn
description: Stream one model reply for a saved chat history, fold it into durable segments, and hand off to a continuation before the runtime deadline.
---

# askEventDocAiStreamTurn

The shared core of a chat turn. Given a history that is already saved, it streams the assistant's reply through [askAiPromptStream](../../core/ai/ask-ai-prompt-stream.md), dispatching each stream part to the browser live, then folds the completed reply into durable segments, saves it, and dispatches it as the finalized message. Both [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) (a new turn) and [askEventDocAiProcessContinue](./ask-event-doc-ai-process-continue.md) (a resumed one) end in this story.

Its other job is staying inside the execution's time limit. It reads [askGetRuntimeRemainingTime](../../core/system/ask-get-runtime-remaining-time.md), keeps back a fixed headroom, and gives the model the rest as `maxDurationMs`. When there is no budget to start, or the budget cut the model off mid-work, it hands the turn to the collection's continuation service function (async) and returns `SERVICE_REQUEST_DEFERRED` so no reply goes out from this execution.

```typescript
import { askEventDocAiStreamTurn } from 'quidproquo-features';

// A resumed turn: the saved history already ends on the partial assistant reply.
export function* askResume(docId: string, chatId: string, history: EventDocAiChatMessage[]) {
  return yield* askEventDocAiStreamTurn(docId, chatId, history, true);
}
```

## Signature

```typescript
function* askEventDocAiStreamTurn(
  docId: string,
  chatId: string,
  history: EventDocAiChatMessage[],
  options: { isContinuation: boolean; lengthResumes: number },
): AskResponse<EventDocAiChatSendResult | ServiceRequestDeferred>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The trusted document the chat is scoped to (from session context). |
| `chatId` | `string` | The chat being replied to. |
| `history` | `EventDocAiChatMessage[]` | The full saved history to prompt with. Must already be persisted; this story only appends the reply. |
| `options.isContinuation` | `boolean` | `true` when resuming. Appends a transport-only nudge as the final user message, because Anthropic rejects a conversation ending on an assistant turn when extended thinking is on. Never saved. |
| `options.lengthResumes` | `number` | How many consecutive resumes the output token cap has already caused. `0` for a new turn; each `length` handoff passes it on incremented, and the turn stops resuming after three. |

## Returns

- `{ complete: true }` when the model finished its answer.
- `{ complete: false }` when a client-side tool call is pending (a tool with no executor). The call is saved in the history; the client renders it and the user's answer arrives as the next chat message.
- `{ complete: false }` also when the turn was cut off by the time budget or output cap but not resumed (an empty reply, or the length-resume limit).
- `SERVICE_REQUEST_DEFERRED` when the turn was handed to the continuation. The reply will come from that execution on the same websocket correlation.

## What it does

1. Reads the remaining runtime and subtracts the headroom. If nothing is left, hands off immediately.
2. Resolves the AI name, model, reasoning budget, and system prompt (generator inline function first, else the static prompt, else a default; never persisted).
3. Converts the history to model messages. File segments become drive-referenced file parts the action processor resolves at prompt time, under the collection's storage scope. Tools do **not** receive `docId` from the model; executors inherit the session context and read the trusted id there.
4. Streams with the time budget as `maxDurationMs`, dispatching each part to the UI (`askUIEventDocAiAppendStreamChunk`) as it arrives.
5. Folds the parts into segments. If any were produced, saves the assistant message and dispatches it as the finalized message (`askUIEventDocAiAppendChatMessage`).
6. Clears the UI's live-stream buffer and touches the chat (bumps `updatedAt`).
7. Returns `{ complete: false }` on a pending client tool. Otherwise, if the reply made progress and the finish reason was `toolCalls` (the time budget tripped) or `length` (the output token cap tripped, and fewer than three such resumes have happened), hands off. Otherwise returns `{ complete: true }`, or `{ complete: false }` if the turn was cut off and not resumed.

An empty reply that was cut off is not resumed: it would just be cut off again.

## Related

- [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) / [askEventDocAiProcessContinue](./ask-event-doc-ai-process-continue.md) — the two entry points.
- [askGetRuntimeRemainingTime](../../core/system/ask-get-runtime-remaining-time.md) — the deadline this budgets against.
- [askAiPromptStream](../../core/ai/ask-ai-prompt-stream.md) — the streamed prompt; [askStreamMap](../../core/stream/ask-stream-map.md) consumes it.
- [askServiceRequest](../web-socket-queue/ask-service-request.md#deferring-the-reply) — how a deferred reply reaches the caller.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — registers the continuation service function this hands off to.
