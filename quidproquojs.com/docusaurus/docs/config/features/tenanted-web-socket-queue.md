---
title: defineTenantedWebSocketQueue
description: A defineWebSocketQueue with the tenant scope resolution pre-wired as the connection scope resolver.
---

# defineTenantedWebSocketQueue

A [defineWebSocketQueue](./web-socket-queue.md) with tenant scope resolution pre-wired as its `connectionScopeResolver`: a tenant id claimed in the WebSocket Authenticate handshake is membership-checked before it is stored, and a handshake with no claim stores the user's own personal scope instead of leaving the connection unscoped. It takes the same arguments as `defineWebSocketQueue` minus `connectionScopeResolver`, which it fills in for you.

The deploying service must still register the resolver implementation by calling [defineTenant](./tenant.md) (with the same `owner` used everywhere else).

```typescript
import { defineTenantedWebSocketQueue, defineTenant } from 'quidproquo-features';

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

`QPQConfigAdvancedTenantedWebsocketQueueSettings` is `QPQConfigAdvancedWebsocketQueueSettings` with `connectionScopeResolver` omitted — see [defineWebSocketQueue](./web-socket-queue.md#advancedsettings--qpqconfigadvancedwebsocketqueuesettings-optional) for the remaining options.

## Parameters

Same as [defineWebSocketQueue](./web-socket-queue.md#parameters): `eventBusName`, `apiName`, and `advancedSettings` (without `connectionScopeResolver`, which this always sets to `TENANT_CONNECTION_SCOPE_RESOLVER_FN`).

## Returns

Same as [defineWebSocketQueue](./web-socket-queue.md#returns) — a `QPQConfig` array with the connection-scope resolver already pointed at the tenant scope resolution.

## Related

- [defineWebSocketQueue](./web-socket-queue.md) — the underlying define this pre-configures.
- [defineTenant](./tenant.md) — registers `TENANT_CONNECTION_SCOPE_RESOLVER_FN` (the inline function this wires in by name) plus the rest of the tenant setup.
