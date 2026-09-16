---
title: Event Doc AI active chat state
description: UI state setters for the messages of the currently open Event Doc AI chat.
---

# Event Doc AI active chat state

These `ask`-generators are **client-side UI state setters** for the Event Doc AI chat feature. They run inside the browser SPA and mutate the in-memory `EventDocAiState` so the message pane re-renders. This page covers the setters for the **finalized messages** of the active chat (`chatMessages`) and the flag that gates loading a chat's history.

Each setter dispatches a typed **effect** through the core State action processors: internally it calls `askStateDispatchEffect` → `askStateDispatch`, which the SPA's state runtime folds into `EventDocAiState` via `eventDocAiReducer` (a `buildEffectReducer` over `EventDocAiEffect`). In a browser SPA the State domain is wired through the client state store (see `defineStateDispatchOverWebsockets` / `askStateDispatch` in `quidproquo-core`), so a `yield*` here is a synchronous, local state update. Every setter returns `AskResponse<void>`.

`chatMessages` holds only **finalized** turns. The live, in-flight assistant reply lives separately in `streamSegments` (see [Event Doc AI streaming & status state](./streaming-and-status-state.md)) and is folded into a finalized message once the reply completes.

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

An `EventDocAiChatMessage` is a finalized turn made of render-ready segments:

```typescript
type EventDocAiChatMessage = {
  role: 'user' | 'assistant';
  segments: EventDocAiMessageSegment[];
};

type EventDocAiMessageSegment =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'file'; attachment: EventDocAiAttachment }
  | { type: 'tool-use'; tools: EventDocAiToolUse[] };
```

---

## askUIEventDocAiSetMessages

Replaces the active chat's message list wholesale — typically called after loading a chat's history, or when switching chats.

- **Effect:** `EventDocAiEffect.SetMessages`
- **State change:** sets `chatMessages` to the provided array.

```typescript
import { askUIEventDocAiSetMessages } from 'quidproquo-features';
import type { EventDocAiChatMessage } from 'quidproquo-features';

export function* onHistoryLoaded(messages: EventDocAiChatMessage[]) {
  yield* askUIEventDocAiSetMessages(messages);
}
```

### Signature

```typescript
function* askUIEventDocAiSetMessages(
  messages: EventDocAiChatMessage[],
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `messages` | `EventDocAiChatMessage[]` | The full set of finalized messages to show. Overwrites `chatMessages`. |

---

## askUIEventDocAiAppendChatMessage

Appends a single finalized message to the end of the current thread — used to add the user's message when they send, and to commit the assistant's reply once its stream finishes.

- **Effect:** `EventDocAiEffect.AppendChatMessage`
- **State change:** pushes `message` onto the end of `chatMessages`.

```typescript
import { askUIEventDocAiAppendChatMessage } from 'quidproquo-features';
import type { EventDocAiChatMessage } from 'quidproquo-features';

export function* addUserTurn(text: string) {
  const message: EventDocAiChatMessage = {
    role: 'user',
    segments: [{ type: 'text', text }],
  };

  yield* askUIEventDocAiAppendChatMessage(message);
}
```

### Signature

```typescript
function* askUIEventDocAiAppendChatMessage(
  message: EventDocAiChatMessage,
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `message` | `EventDocAiChatMessage` | The finalized turn to append. Its `segments` are already render-ready (raw stream parts are folded into segments before this point). |

---

## askUIEventDocAiSetLoadingHistory

Toggles the "loading this chat's history" flag so the message pane can show a spinner while a chat's messages are fetched.

- **Effect:** `EventDocAiEffect.SetLoadingHistory`
- **State change:** sets `isLoadingHistory`.

```typescript
import { askUIEventDocAiSetLoadingHistory, askUIEventDocAiSetMessages } from 'quidproquo-features';

export function* openChatHistory() {
  yield* askUIEventDocAiSetLoadingHistory(true);
  // ...fetch this chat's messages, then...
  yield* askUIEventDocAiSetLoadingHistory(false);
}
```

### Signature

```typescript
function* askUIEventDocAiSetLoadingHistory(
  isLoading: boolean,
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `isLoading` | `boolean` | `true` while the active chat's history is being fetched, `false` when done. |

---

## Returns

Every setter on this page returns `AskResponse<void>` — the story resumes once the effect has been dispatched into the SPA's state store. There is no return value.

## Related

- [Event Doc AI chat list state](./chat-list-state.md) — the chat list and active-chat selection.
- [Event Doc AI streaming & status state](./streaming-and-status-state.md) — the in-flight assistant reply that becomes a finalized message here.

These UI setters build on the core **State** domain (`askStateDispatch`, `askStateDispatchEffect`) and are consumed alongside the Event Doc AI backend stories — `defineEventDocAi` (config) and `askEventDocAiChatHistoryRequest` / `askEventDocAiChatSendRequest`.
