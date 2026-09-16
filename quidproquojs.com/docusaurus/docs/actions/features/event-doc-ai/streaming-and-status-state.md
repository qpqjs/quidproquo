---
title: Event Doc AI streaming & status state
description: UI state setters for the in-flight assistant stream, the sending flag, and errors.
---

# Event Doc AI streaming & status state

These `ask`-generators are **client-side UI state setters** for the Event Doc AI chat feature. They run inside the browser SPA and mutate the in-memory `EventDocAiState` so the chat UI re-renders. This page covers the setters that drive the **live assistant reply** (`streamSegments`), the **sending** flag, and the surfaced **error** message.

Each setter dispatches a typed **effect** through the core State action processors: internally it calls `askStateDispatchEffect` → `askStateDispatch`, which the SPA's state runtime folds into `EventDocAiState` via `eventDocAiReducer` (a `buildEffectReducer` over `EventDocAiEffect`). In a browser SPA the State domain is wired through the client state store (see `defineStateDispatchOverWebsockets` / `askStateDispatch` in `quidproquo-core`), so a `yield*` here is a synchronous, local state update. Every setter returns `AskResponse<void>`.

`streamSegments` is the reply currently in flight, already in the durable segment format. Each `AiStreamPart` arriving over the socket is folded into the last segment as it lands (`foldStreamPart`): text and reasoning deltas extend the current segment, a `ToolInputStart` adds a tool entry with an empty input, and `ToolCall` / `ToolResult` fill in that entry's input and output. Tool argument deltas are not sent to the browser at all, so a large tool input costs the UI one update at the start and one at the end. `isStreaming` is true from the first part until the stream is cleared, so the UI can show activity before any renderable segment exists. When the reply finishes, the backend dispatches the finalized `EventDocAiChatMessage` (via [`askUIEventDocAiAppendChatMessage`](./active-chat-state.md)) and clears the buffer.

## State shape

```typescript
type EventDocAiState = {
  chats: EventDocAiChatSummary[];
  activeChatId: Nullable<string>;

  chatMessages: EventDocAiChatMessage[];
  streamSegments: EventDocAiMessageSegment[];
  isStreaming: boolean;

  isLoadingChats: boolean;
  isLoadingHistory: boolean;
  isSending: boolean;
  error: Nullable<string>;
};
```

`AiStreamPart` is the streaming-chunk union from `quidproquo-core` (text/reasoning deltas, file parts, tool-use events, finish markers, etc.).

---

## askUIEventDocAiAppendStreamChunk

Appends one streaming chunk to the in-flight assistant reply. Called for each part received while a reply streams in.

- **Effect:** `EventDocAiEffect.AppendStreamChunk`
- **State change:** folds `part` into `streamSegments` and sets `isStreaming` to `true`.

```typescript
import { askUIEventDocAiAppendStreamChunk } from 'quidproquo-features';
import type { AiStreamPart } from 'quidproquo-core';

export function* onStreamPart(part: AiStreamPart) {
  yield* askUIEventDocAiAppendStreamChunk(part);
}
```

### Signature

```typescript
function* askUIEventDocAiAppendStreamChunk(
  part: AiStreamPart,
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `part` | `AiStreamPart` | A single streaming chunk of the in-flight reply, folded into `streamSegments`. |

---

## askUIEventDocAiClearStream

Clears the in-flight stream buffer — call this once the reply has been finalized into a chat message, or to discard a stream on error/cancel.

- **Effect:** `EventDocAiEffect.ClearStream`
- **State change:** resets `streamSegments` to `[]` and `isStreaming` to `false`. Takes no arguments.

```typescript
import {
  askUIEventDocAiAppendChatMessage,
  askUIEventDocAiClearStream,
} from 'quidproquo-features';
import type { EventDocAiChatMessage } from 'quidproquo-features';

export function* finalizeReply(reply: EventDocAiChatMessage) {
  yield* askUIEventDocAiAppendChatMessage(reply);
  yield* askUIEventDocAiClearStream();
}
```

### Signature

```typescript
function* askUIEventDocAiClearStream(): AskResponse<void>;
```

Takes no parameters.

---

## askUIEventDocAiSetSending

Toggles the "sending a message" flag so the composer can disable input and show a busy state while a turn is in flight.

- **Effect:** `EventDocAiEffect.SetSending`
- **State change:** sets `isSending`.

```typescript
import { askUIEventDocAiSetSending } from 'quidproquo-features';

export function* sendTurn() {
  yield* askUIEventDocAiSetSending(true);
  // ...dispatch the send and await the reply, then...
  yield* askUIEventDocAiSetSending(false);
}
```

### Signature

```typescript
function* askUIEventDocAiSetSending(
  isSending: boolean,
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `isSending` | `boolean` | `true` while a message is being sent / a reply is streaming, `false` when idle. |

---

## askUIEventDocAiSetError

Sets or clears the error message surfaced to the user (e.g. a failed send or load).

- **Effect:** `EventDocAiEffect.SetError`
- **State change:** sets `error` to the message, or `null` to clear it.

```typescript
import { askUIEventDocAiSetError } from 'quidproquo-features';

export function* showError() {
  yield* askUIEventDocAiSetError('Failed to send message. Please try again.');
}

export function* clearError() {
  yield* askUIEventDocAiSetError(null);
}
```

### Signature

```typescript
function* askUIEventDocAiSetError(
  error: Nullable<string>,
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `error` | `Nullable<string>` | The error text to display, or `null` to clear the current error. |

---

## Returns

Every setter on this page returns `AskResponse<void>` — the story resumes once the effect has been dispatched into the SPA's state store. There is no return value.

## Related

- [Event Doc AI active chat state](./active-chat-state.md) — where a finished stream lands as a finalized message.
- [Event Doc AI chat list state](./chat-list-state.md) — the chat list and active-chat selection.

These UI setters build on the core **State** domain (`askStateDispatch`, `askStateDispatchEffect`) and are consumed alongside the Event Doc AI backend stories — `defineEventDocAi` (config) and `askEventDocAiChatSendRequest`. `AiStreamPart` comes from the core AI streaming domain (`askAiPromptStream`).
