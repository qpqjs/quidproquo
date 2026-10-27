---
title: askEventDocAiContextRead / askEventDocAiContextProvide
description: Read and provide the eventDocAi session context — the service, document type, and trusted docId a chat turn is scoped to.
---

# askEventDocAiContextRead & askEventDocAiContextProvide

The eventDocAi **session context** carries the three values every chat operation is scoped to: the `serviceName` requests route through, the collection `type`, and the **trusted** `docId` the chat belongs to. Both stories are built from the core [context actions](../../core/context/ask-context-read.md) over a single shared context identifier (`event-doc-ai-context`).

Read the context anywhere inside a story that runs under it; provide it to establish the scope around a nested story. On the frontend the chat UI provides it around the chat panel; on the backend the handler wrapper re-provides it around each handler (and tool runtimes inherit it), so nested logic and tools read the trusted `docId` from context instead of trusting anything the caller or the model sent.

- Built from core [askContextRead](../../core/context/ask-context-read.md) and [askContextProvideValue](../../core/context/ask-context-provide-value.md).

```typescript
import { askEventDocAiContextProvide, askEventDocAiContextRead } from '@qpqjs/features';

// Provide the scope around a story, then any nested read sees it.
export function* askScopedChatWork() {
  return yield* askEventDocAiContextProvide(
    { serviceName: 'app', type: 'project', docId: 'doc-123' },
    function* () {
      const { docId } = yield* askEventDocAiContextRead();
      // docId === 'doc-123' — the trusted document this turn is scoped to
      return docId;
    },
  );
}
```

## askEventDocAiContextRead

Reads the current `EventDocAiContext`. If no provider is above it in the story, the context identifier's default is returned (`{ serviceName: '', type: '', docId: '' }`).

### Signature

```typescript
function* askEventDocAiContextRead(): AskResponse<EventDocAiContext>;
```

### Returns

`EventDocAiContext` — the scope the surrounding story runs under.

| Property | Type | Description |
| --- | --- | --- |
| `serviceName` | `string` | The service the eventDocAi websocket requests route through. |
| `type` | `string` | The eventDoc collection's document type. |
| `docId` | `string` | The trusted id of the document the chat is scoped to. |

## askEventDocAiContextProvide

Provides an `EventDocAiContext` around a nested story and returns that story's result. Everything the story yields — including tool executors, which inherit the session context — reads the same trusted values.

### Signature

```typescript
function* askEventDocAiContextProvide<T>(
  context: EventDocAiContext,
  story: AskResponse<T>,
): AskResponse<T>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `context` | `EventDocAiContext` | The scope to establish (`{ serviceName, type, docId }`). |
| `story` | `AskResponse<T>` | The story to run under that context. Its return value is passed straight back through. |

### Returns

`T` — the wrapped story's result, unchanged.

## Notes

- The `docId` here is **trusted**: on the backend it is derived from the wire payload's relay field and re-provided by the handler wrapper, never taken from a tool's arguments. This is why tools read it from context — see [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md).
- The frontend transport wrapper [askEventDocAiServiceRequest](./ask-event-doc-ai-service-request.md) reads this context to relay the `serviceName`/`type`/`docId` over the wire.

## Related

- [askEventDocAiServiceRequest](./ask-event-doc-ai-service-request.md) — reads this context to route and relay requests.
- [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) — runs under a provided context so tools inherit the trusted `docId`.
- [askContextRead](../../core/context/ask-context-read.md) / [askContextProvideValue](../../core/context/ask-context-provide-value.md) — the core actions these wrap.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — the feature these chats belong to.
