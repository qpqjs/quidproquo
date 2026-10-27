---
title: askEventDocAiServiceRequest
description: The frontend transport wrapper for eventDocAi — routes a chat method to the service and relays the trusted docId over the wire.
---

# askEventDocAiServiceRequest

The caller-side transport wrapper every eventDocAi chat request goes through. It reads the [eventDocAi context](./ask-event-doc-ai-context-read.md) (provided around the chat UI), builds the type-scoped method key, and issues a webserver service request — relaying the `docId` as a payload field so routing and the document id never appear in composites or call sites.

You rarely call this directly; the four chat [request builders](./ask-event-doc-ai-chat-requests.md) wrap it with their own payload/response types. Reach for it only when adding a new eventDocAi method.

- Built from webserver `askServiceRequest`; reads context via [askEventDocAiContextRead](./ask-event-doc-ai-context-read.md).

```typescript
import { askEventDocAiServiceRequest } from '@qpqjs/features';

// How a request builder uses it (payload/response typed by the caller):
export function* askMyEventDocAiMethod(payload: MyPayload) {
  return yield* askEventDocAiServiceRequest<MyPayload, MyResponse>('MyMethod', payload);
}
```

## Signature

```typescript
function* askEventDocAiServiceRequest<TPayload, TResponse>(
  method: string,
  payload: TPayload,
): AskResponse<TResponse>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `method` | `string` | The method verb (e.g. `'ChatSend'`). Combined with the context `type` by `buildEventDocAiMethodName` into `eventDocAi/<type>/<method>` — the same key `defineEventDocAi` registers its queue processors under. |
| `payload` | `TPayload` | The request payload. The wrapper appends a `docId` field (`EventDocAiDocRef`) read from context before sending, so payload models stay `docId`-free. |

## Returns

`TResponse` — the handler's response, passed straight back.

## Notes

- The `serviceName`, `type`, and `docId` all come from [askEventDocAiContextRead](./ask-event-doc-ai-context-read.md) — the chat UI provides them once around the panel, so no request call site carries them.
- The backend handler wrapper (`eventDocAiServiceRequest`, internal to the feature) strips the relayed `docId` back off the wire payload and re-provides it as context around the handler, keeping payload models `docId`-free on both sides.
- Routing uses the webserver `askServiceRequest` over the collection's websocket queue declared by [defineEventDocAi](../../../config/features/event-doc-ai.md).

## Related

- [Chat request builders](./ask-event-doc-ai-chat-requests.md) — the four typed methods that wrap this.
- [askEventDocAiContextRead](./ask-event-doc-ai-context-read.md) — supplies the routing values and `docId` this relays.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — registers the matching queue processors.
