---
title: askWebsocketSendMessage
description: Send a message to a single connected WebSocket client by connection id.
---

# askWebsocketSendMessage

Sends a payload to one connected WebSocket client, addressed by its `connectionId`. Use it from any story to push data out over a [WebSocket API](../../../config/webserver/websocket.md) — for example replying to a client's message or broadcasting an update to a connection you recorded earlier.

- **Action type:** `WebsocketActionType.SendMessage`
- **On AWS:** the payload is `JSON.stringify`'d and delivered through the **API Gateway Management API** `PostToConnection` call against the resolved WebSocket API endpoint. A throttling response from the service surfaces as `Throttled`; sending to a connection that has already closed surfaces as `Disconnected`.

```typescript
import { askWebsocketSendMessage } from '@qpqjs/webserver';

export function* askNotifyClient(connectionId: string) {
  yield* askWebsocketSendMessage('api', connectionId, {
    type: 'notification',
    text: 'Your export is ready',
  });
}
```

## Signature

```typescript
function* askWebsocketSendMessage<T>(
  websocketApiName: string,
  connectionId: string,
  payload: T,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `websocketApiName` | `string` | The `apiName` of the target [WebSocket API](../../../config/webserver/websocket.md) (the `apiName` option of [defineWebsocket](../../../config/webserver/websocket.md), or the `apiName` argument to [defineWebSocketQueue](../../../config/features/web-socket-queue.md)). Identifies which deployed API the connection belongs to. |
| `connectionId` | `string` | Identifier of the client connection to send to. You receive this on the `WebsocketEvent` in your connect/message handlers; persist it (e.g. keyed by user) if you need to send outside the request that created it. |
| `payload` | `T` | The message to send. Serialized to JSON before transmission, so any JSON-serializable value works. |

## Returns

`void` — the story resumes once the message has been handed to the platform for delivery.

## Errors

| Error | Meaning |
| --- | --- |
| `WebsocketSendMessageErrorTypeEnum.Throttled` | The platform rate-limited the send (AWS `ThrottlingException`, "Rate exceeded"). |
| `WebsocketSendMessageErrorTypeEnum.Disconnected` | The target connection no longer exists — the client has disconnected (AWS `GoneException`). |

Wrap the call in [askCatch](../../../actions/core/system/ask-catch.md) to handle these without unwinding the story:

```typescript
import { askCatch } from '@qpqjs/core';
import { askWebsocketSendMessage, WebsocketSendMessageErrorTypeEnum } from '@qpqjs/webserver';

export function* askTrySend(connectionId: string, payload: unknown) {
  const outcome = yield* askCatch(askWebsocketSendMessage('api', connectionId, payload));
  if (!outcome.success && outcome.error.errorType === WebsocketSendMessageErrorTypeEnum.Disconnected) {
    // client is gone — drop the stored connection id
  }
}
```

## Related

- [defineWebsocket](../../../config/webserver/websocket.md) — declares the WebSocket API and its connect/disconnect/message handlers.
- [defineWebSocketQueue](../../../config/features/web-socket-queue.md) — managed messaging layer that tracks connections for you.
- [askCatch](../../../actions/core/system/ask-catch.md) — catch the throttled/disconnected errors above.
