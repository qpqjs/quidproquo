---
title: defineTenantedWebSocketQueue
description: A defineWebSocketQueue with the tenant scope resolution pre-wired as the connection scope resolver.
---

# defineTenantedWebSocketQueue

A [defineWebSocketQueue](./web-socket-queue.md) with tenant scope resolution pre-wired as its `connectionScopeResolver`: a tenant id claimed in the WebSocket Authenticate handshake is membership-checked before it is stored, and a handshake with no claim stores the user's own personal scope instead of leaving the connection unscoped. It also pre-wires the tenant read check as the `topicAuthoriser`, so subscribing to a document's head-moved topic needs `eventDoc:<store>:read` in the connection's tenant, exactly as reading the document does. It takes the same arguments as `defineWebSocketQueue` minus `connectionScopeResolver` and `topicAuthoriser`, which it fills in for you.

The deploying service must still register the resolver implementation by calling [defineTenant](./tenant.md) (with the same `owner` used everywhere else).

```typescript
import { defineTenantedWebSocketQueue, defineTenant } from '@qpqjs/features';

export default [
  ...defineTenant({
    owner: { module: 'ca' },
    basePath: '/tenants',
    routeAuthSettings: { userDirectoryName: 'users' },
  }),

  defineTenantedWebSocketQueue('my-event-bus', 'api', {
    userDirectoryName: 'users',
  }),
];
```

## Signature

```typescript
function defineTenantedWebSocketQueue(
  eventBusName: string,
  apiName: string,
  advancedSettings?: QPQConfigAdvancedTenantedWebsocketQueueSettings,
): QPQConfig;
```

`QPQConfigAdvancedTenantedWebsocketQueueSettings` is `QPQConfigAdvancedWebsocketQueueSettings` with `connectionScopeResolver` and `topicAuthoriser` omitted — see [defineWebSocketQueue](./web-socket-queue.md#advancedsettings--qpqconfigadvancedwebsocketqueuesettings-optional) for the remaining options.

## Parameters

Same as [defineWebSocketQueue](./web-socket-queue.md#parameters): `eventBusName`, `apiName`, and `advancedSettings` (without `connectionScopeResolver` and `topicAuthoriser`, which this always sets to `TENANT_CONNECTION_SCOPE_RESOLVER_FN` and `TENANT_TOPIC_AUTHORISER_FN`).

## Returns

Same as [defineWebSocketQueue](./web-socket-queue.md#returns) — a `QPQConfig` array with the connection-scope resolver already pointed at the tenant scope resolution.

## Related

- [defineWebSocketQueue](./web-socket-queue.md) — the underlying define this pre-configures.
- [Event doc workspace sync](./event-doc-workspace-sync.md): the feature whose subscriptions the topic authoriser gates.
- [defineTenant](./tenant.md) — registers `TENANT_CONNECTION_SCOPE_RESOLVER_FN` (the inline function this wires in by name) plus the rest of the tenant setup.
