---
title: defineWebsocket
description: Define a WebSocket API with connect, disconnect, and message route handlers.
---

# defineWebsocket

Defines a **WebSocket API**: a persistent, bidirectional connection endpoint served on its own subdomain. You supply story entry points that run when a client connects, disconnects, or sends a message, and the runtime wires them to the platform's WebSocket transport. Stories push messages back to connected clients with [askWebsocketSendMessage](../../actions/webserver/websocket/ask-websocket-send-message.md).

- **On AWS:** deploys an **API Gateway v2 WebSocket API** (`QpqApiWebserverWebsocketConstruct` in `quidproquo-deploy-awscdk`) fronted by a single Lambda proxy integration. Three routes — `$connect`, `$disconnect`, and `$default` — all target that Lambda, which dispatches to the matching handler in `eventProcessors`. The API is mapped to a custom domain on every root from [defineDns](./dns.md) (the `{ subdomain: apiSubdomain, service }` target, or `{ subdomain: apiSubdomain }` when `onRootDomain` is set) and served from the `prod` stage. Routes use `authorizationType: NONE`; do your own auth inside the `onConnect`/`onMessage` handlers. When `deprecated` is set, nothing is deployed.

```typescript
import { defineWebsocket } from 'quidproquo-webserver';

export default [
  defineWebsocket('ws', {
    onConnect: '/entry/ws/onConnect::onConnect',
    onDisconnect: '/entry/ws/onDisconnect::onDisconnect',
    onMessage: '/entry/ws/onMessage::onMessage',
  }),
];
```

## Routing model

API Gateway's WebSocket API has three built-in route keys, and `defineWebsocket` maps each to one of your event processors:

| Route key | Fires when | Handler |
| --- | --- | --- |
| `$connect` | A client opens the WebSocket connection (the handshake). | `eventProcessors.onConnect` |
| `$disconnect` | A client's connection closes (client- or server-initiated). | `eventProcessors.onDisconnect` |
| `$default` | The client sends any message frame (there are no per-message custom routes — every inbound frame goes here). | `eventProcessors.onMessage` |

Each handler is a story (generator) that receives a `WebsocketEvent` (exported from `quidproquo-webserver`) and returns `void`:

```typescript
export type WebsocketEvent<T extends string | Blob | ArrayBuffer = string> = {
  eventType: WebSocketEventType; // Connect | Disconnect | Message
  messageId: string;
  connectionId: string;          // identifies the client; pass to askWebsocketSendMessage
  requestTime: string;
  requestTimeEpoch: number;
  userAgent: string;
  sourceIp: string;
  apiName: string;
  body?: T;                      // present on message events
};
```

`connectionId` is the handle for a single client connection — store it (e.g. in a key-value store keyed by user) during `onConnect` so later stories can send messages to that client with [askWebsocketSendMessage](../../actions/webserver/websocket/ask-websocket-send-message.md).

## Signature

```typescript
function defineWebsocket(
  apiSubdomain: string,
  eventProcessors: QpqWebSocketEventProcessors,
  options?: QPQConfigAdvancedWebSocketSettings,
): WebSocketQPQWebServerConfigSetting;
```

## Parameters

### `apiSubdomain` — `string` (required)

The subdomain the WebSocket API is served on; with the default shape the host is `apiSubdomain.<service>.<base>` (or `apiSubdomain.<base>` when `onRootDomain` is set). It alone is the setting's `uniqueKey`.


### `eventProcessors` — `QpqWebSocketEventProcessors` (required)

The story entry points for the connection lifecycle. All three are optional — omit any route you don't need to handle.

```typescript
export interface QpqWebSocketEventProcessors {
  onConnect?: QpqFunctionRuntime;
  onDisconnect?: QpqFunctionRuntime;
  onMessage?: QpqFunctionRuntime;
}
```

Each value is a `QpqFunctionRuntime` — a reference to a story entry point, written as a relative path string in the form `'/path/to/file::exportedFunctionName'`.

### `options` — `QPQConfigAdvancedWebSocketSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `apiName` | `string` | `'api'` | Logical name for the API. Used to derive the deployed WebSocket API's resource/export names and passed to [askWebsocketSendMessage](../../actions/webserver/websocket/ask-websocket-send-message.md) as `websocketApiName` when sending to connections on this API. |
| `onRootDomain` | `boolean` | `false` | When `true`, the API's custom domain is built from the base domain rather than the module's service domain. |
| `cloudflareApiKeySecretName` | `string` | – | Name of the secret holding a Cloudflare API key, for DNS setups fronted by Cloudflare. |
| `maxConcurrentExecutions` | `number` | – | Reserved concurrency for the API's Lambda. Caps and guarantees concurrent event processing: never throttled below it, never scales above it. One compute unit serves all of the API's event processors (connect/disconnect/message), so this bounds the API as a whole. Carved out of the deploy account's shared concurrency pool. |
| `deprecated` | `boolean` | `false` | When `true`, the API is not deployed. Use to retire an API without deleting its config. |
| `owner` | `CrossModuleOwner<'websocketApiName'>` | – | Declares that this WebSocket API is owned by **another** module/service, so this service references it rather than deploying its own. |

## Returns

A `WebSocketQPQWebServerConfigSetting` config setting (`configSettingType: WebSocket`) with `uniqueKey` = `apiSubdomain`. Return it (or spread it) from a config array.

## Notes

- `defineWebsocket` gives you the raw connect/disconnect/message hooks. If you want a batteries-included messaging layer — connection tracking, authentication, ping/pong, and typed client/server messages — use [defineWebSocketQueue](../features/web-socket-queue.md), which wires those three handlers to a built-in service for you.

## Related

- [defineWebSocketQueue](../features/web-socket-queue.md) — a higher-level WebSocket setup that provides `eventProcessors` for you and manages connections and messaging.
- [defineStateDispatchOverWebsockets](../features/state-dispatch-over-websockets.md) — pushes core State-domain dispatches to clients over the WebSocket queue.
- [askWebsocketSendMessage](../../actions/webserver/websocket/ask-websocket-send-message.md) — send a message to a connected client by `connectionId`.
