---
title: askWebSocketQueueBroadcastMessage
description: Push a server-initiated message to every live connection on a WebSocket queue's API.
---

# askWebSocketQueueBroadcastMessage

Sends a message to **every live connection** on a named [WebSocket queue](../../../config/features/web-socket-queue.md) API. Unlike a connection-scoped send, this does not need a websocket-triggered context — the caller names the `apiName` explicitly, so any story (a storage event, a queue handler, a cron job) can push to every connected frontend. Connections whose socket died without their `onDisconnect` firing are skipped and their stale record is cleaned up automatically; a single dead connection never aborts the broadcast.

```typescript
import { askWebSocketQueueBroadcastMessage } from '@qpqjs/features';

interface Announcement {
  type: 'Announcement';
  payload: { text: string };
}

export function* askAnnounce(text: string) {
  yield* askWebSocketQueueBroadcastMessage<Announcement>('api', {
    type: 'Announcement',
    payload: { text },
  });
}
```

## Signature

```typescript
function* askWebSocketQueueBroadcastMessage<E extends AnyWebSocketQueueEventMessage>(
  websocketApiName: string,
  message: E,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `websocketApiName` | `string` | The `apiName` of the target [defineWebSocketQueue](../../../config/features/web-socket-queue.md) — every connection currently registered against this API receives the message. |
| `message` | `E extends AnyWebSocketQueueEventMessage` | The typed event message to send, e.g. `{ type, payload }`. |

## Returns

`void`

## Related

- [askWebSocketQueueBroadcastServiceUpdated](./ask-web-socket-queue-broadcast-service-updated.md) — a typed wrapper around this for the built-in `ServiceUpdated` message.
- [defineWebSocketQueue](../../../config/features/web-socket-queue.md) — declares the WebSocket queue API this broadcasts on.
- [askServiceRequest](./ask-service-request.md) — an RPC-style request/response over the same queue, addressed to one service rather than broadcast to every connection.
