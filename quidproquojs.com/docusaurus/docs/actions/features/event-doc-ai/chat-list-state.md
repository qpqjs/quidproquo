---
title: Event Doc AI chat list state
description: UI state setters for the Event Doc AI chat list and active-chat selection.
---

# Event Doc AI chat list state

These `ask`-generators are **client-side UI state setters** for the Event Doc AI chat feature. They don't touch the network or any backend service — they run inside the browser SPA and mutate the in-memory `EventDocAiState` so the chat UI re-renders. This page covers the four setters that manage the **chat list** (the collection of a user's chats for an eventDoc) and which chat is currently selected.

Each setter dispatches a typed **effect** through the core State action processors: internally it calls `askStateDispatchEffect` → `askStateDispatch`, which the SPA's state runtime folds into `EventDocAiState` via `eventDocAiReducer` (a `buildEffectReducer` over `EventDocAiEffect`). In a browser SPA the State domain is wired through the client state store (see `defineStateDispatchOverWebsockets` / `askStateDispatch` in `quidproquo-core`), so a `yield*` here is a synchronous, local state update — not a round-trip. Every setter returns `AskResponse<void>`.

## State shape

All setters on this page mutate one shared object:

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

An `EventDocAiChatSummary` is one row in the chat list:

```typescript
type EventDocAiChatSummary = {
  docId: string;
  chatId: string;
  name: string;
  createdAt: QpqIsoDateTime;
  updatedAt: QpqIsoDateTime;
  createdByUserId: string;
};
```

---

## askUIEventDocAiSetChats

Replaces the entire chat list — typically called after loading the list from the backend.

- **Effect:** `EventDocAiEffect.SetChats`
- **State change:** sets `chats` to the provided array (wholesale replace).

```typescript
import { askUIEventDocAiSetChats } from 'quidproquo-features';
import type { EventDocAiChatSummary } from 'quidproquo-features';

export function* onChatsLoaded(chats: EventDocAiChatSummary[]) {
  yield* askUIEventDocAiSetChats(chats);
}
```

### Signature

```typescript
function* askUIEventDocAiSetChats(
  chats: EventDocAiChatSummary[],
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `chats` | `EventDocAiChatSummary[]` | The full chat list to show. Overwrites whatever was in `chats`. |

---

## askUIEventDocAiUpsertChat

Inserts or updates a single chat in the list without replacing the rest — used when a new chat is created or an existing one is renamed/touched.

- **Effect:** `EventDocAiEffect.UpsertChat`
- **State change:** removes any existing chat with the same `chatId`, then prepends the provided chat — so `chats` stays de-duplicated and the upserted chat moves to the front of the list.

```typescript
import { askUIEventDocAiUpsertChat } from 'quidproquo-features';
import type { EventDocAiChatSummary } from 'quidproquo-features';

export function* onChatCreated(chat: EventDocAiChatSummary) {
  yield* askUIEventDocAiUpsertChat(chat);
}
```

### Signature

```typescript
function* askUIEventDocAiUpsertChat(
  chat: EventDocAiChatSummary,
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `chat` | `EventDocAiChatSummary` | The chat to insert or update, matched by `chatId`. Lands at the head of `chats`. |

---

## askUIEventDocAiSetActiveChat

Selects (or clears) the currently open chat. This is the value the message pane keys off of.

- **Effect:** `EventDocAiEffect.SetActiveChat`
- **State change:** sets `activeChatId` to the given id, or `null` to deselect.

```typescript
import { askUIEventDocAiSetActiveChat } from 'quidproquo-features';

export function* openChat(chatId: string) {
  yield* askUIEventDocAiSetActiveChat(chatId);
}

export function* closeChat() {
  yield* askUIEventDocAiSetActiveChat(null);
}
```

### Signature

```typescript
function* askUIEventDocAiSetActiveChat(
  chatId: Nullable<string>,
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `chatId` | `Nullable<string>` | The `chatId` to make active, or `null` to clear the selection. |

---

## askUIEventDocAiSetLoadingChats

Toggles the "loading the chat list" flag so the UI can show a spinner while the list is fetched.

- **Effect:** `EventDocAiEffect.SetLoadingChats`
- **State change:** sets `isLoadingChats`.

```typescript
import { askUIEventDocAiSetLoadingChats, askUIEventDocAiSetChats } from 'quidproquo-features';

export function* loadChats() {
  yield* askUIEventDocAiSetLoadingChats(true);
  // ...fetch the list, then...
  yield* askUIEventDocAiSetLoadingChats(false);
}
```

### Signature

```typescript
function* askUIEventDocAiSetLoadingChats(
  isLoading: boolean,
): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `isLoading` | `boolean` | `true` while the chat list is being fetched, `false` when done. |

---

## Returns

Every setter on this page returns `AskResponse<void>` — the story resumes once the effect has been dispatched into the SPA's state store. There is no return value.

## Related

- [Event Doc AI active chat state](./active-chat-state.md) — messages of the selected chat.
- [Event Doc AI streaming & status state](./streaming-and-status-state.md) — in-flight reply, sending, and error flags.

These UI setters build on the core **State** domain (`askStateDispatch`, `askStateDispatchEffect`) and are consumed alongside the Event Doc AI backend stories — `defineEventDocAi` (config), and the chat request stories `askEventDocAiChatListRequest`, `askEventDocAiChatCreateRequest`, `askEventDocAiChatSendRequest`, and `askEventDocAiChatHistoryRequest`.
