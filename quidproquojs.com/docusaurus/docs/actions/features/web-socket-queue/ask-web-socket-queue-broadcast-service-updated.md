---
title: askWebSocketQueueBroadcastServiceUpdated
description: Tell every connected frontend that a service's deployed artifacts changed, so it can offer a module reload.
---

# askWebSocketQueueBroadcastServiceUpdated

Broadcasts a `ServiceUpdated` message to every live connection on a [WebSocket queue](../../../config/features/web-socket-queue.md) API, naming the service whose deployed artifacts changed (for example, a new views bundle going live). A typed wrapper around [askWebSocketQueueBroadcastMessage](./ask-web-socket-queue-broadcast-message.md) for this one built-in message type.

```typescript
import { askWebSocketQueueBroadcastServiceUpdated } from '@qpqjs/features';

export function* askNotifyDeploy(serviceName: string) {
  yield* askWebSocketQueueBroadcastServiceUpdated('api', serviceName);
}
```

## Signature

```typescript
function* askWebSocketQueueBroadcastServiceUpdated(
  websocketApiName: string,
  serviceName: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `websocketApiName` | `string` | The `apiName` of the target [defineWebSocketQueue](../../../config/features/web-socket-queue.md) — every connection currently registered against this API receives the message. |
| `serviceName` | `string` | The qpq service (module) whose deployed artifacts changed. Sent as `payload.serviceName` on a `WebSocketQueueServerMessageEventType.ServiceUpdated` message. |

## Returns

`void`

## Related

- [askWebSocketQueueBroadcastMessage](./ask-web-socket-queue-broadcast-message.md) — the untyped broadcast this wraps.
- [defineWebSocketQueue](../../../config/features/web-socket-queue.md) — declares the WebSocket queue API this broadcasts on.
