---
title: defineStateDispatchOverWebsockets
description: Push core State-domain dispatches to connected clients over the WebSocket queue.
---

# defineStateDispatchOverWebsockets

Registers an action processor override that redirects the core **State** domain's dispatch effect out to the browser. When a story runs [askStateDispatch](../../actions/core/state/ask-state-dispatch.md) (the effect that [askReduceState](../../actions/core/state/ask-reduce-state.md) emits for each action it reduces), the dispatched action is forwarded to the currently connected WebSocket client instead of being handled purely server-side. This lets a server story and a client share a reducer: state changes reduced on the server are streamed to the client so its local store stays in sync.

- **Built from:** `defineActionProcessors(...)` — it overrides the `StateActionType.Dispatch` processor with the WebSocket queue's `getStateDispatch` implementation. That implementation reads the current connection info and sends a typed `StateDispatch` server message to the client over the [WebSocket queue](./web-socket-queue.md). It takes no arguments.

```typescript
import { defineStateDispatchOverWebsockets } from '@qpqjs/features';

export default [
  defineStateDispatchOverWebsockets(),
];
```

## Signature

```typescript
function defineStateDispatchOverWebsockets(): QPQConfig;
```

Returns a `QPQConfig` array (a single `defineActionProcessors` setting) — spread it into your config alongside a [defineWebSocketQueue](./web-socket-queue.md).

## How it works

The default `StateActionType.Dispatch` processor applies a dispatched action to server-side state. This define swaps in a processor that, for each dispatch:

1. reads the active WebSocket connection info (connection id and correlation id) from context;
2. builds a `StateDispatch` server message carrying the dispatched action;
3. sends it to the client over the WebSocket queue's outbound path.

Because it operates on the connection context the [WebSocket queue](./web-socket-queue.md) establishes, use it together with [defineWebSocketQueue](./web-socket-queue.md) — the dispatch is delivered to the connection that is currently being served.

## Related

- [defineWebSocketQueue](./web-socket-queue.md) — provides the connection context and outbound messaging this override relies on.
- [defineWebsocket](../webserver/websocket.md) — the raw WebSocket API underneath the queue.
- [askStateDispatch](../../actions/core/state/ask-state-dispatch.md) and [askReduceState](../../actions/core/state/ask-reduce-state.md) — the core State-domain effects whose dispatch is redirected to the client.
