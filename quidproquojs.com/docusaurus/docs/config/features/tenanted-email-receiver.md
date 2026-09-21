---
title: defineTenantedEmailReceiver
description: Let tenants register email addresses and run a story, inside the tenant's scope, for every message that arrives on one.
---

# defineTenantedEmailReceiver

A [defineEmailReceiver](../webserver/email-receiver.md) whose messages are routed to tenants. A tenant registers addresses on the app's [receiving domain](../webserver/email-receiving-domain.md) through the routes at `basePath` (any local part, `finance.commbank`, `info.anz`, first come, global across tenants), and `onEmail` runs once per delivered registered recipient **inside that tenant's scope** with a `TenantedEmailReceivedEvent`. Mail to an address nobody registered is logged and dropped.

The recipient is what names the tenant, and the mail provider delivered the message there, so routing cannot be spoofed by a sender. Who the message is *from* is the handler's business: `message.from` plus `message.authentication` (SPF/DKIM/DMARC verdicts) is the evidence, and a per-inbox allow list is app data.

Needs [defineTenant](./tenant.md) in the same service: the routes gate on the tenant header and membership, and check `tenant:email:inboxes:manage`, which the app bundles into a role in its `roles.catalog` (`TenantEmailPermission.InboxesManage`).

```typescript
import { defineTenantedEmailReceiver } from 'quidproquo-features';

export default [
  defineTenantedEmailReceiver('inbound', {
    onEmail: '/entry/email/onTenantEmail::onTenantEmail',
    basePath: '/email/inboxes',
    routeAuthSettings: { userDirectoryName: 'app-users' },
  }),
];
```

The handler runs under `TENANT#<id>`, so anything it writes to a scoped drive or store is partitioned by the inbox's tenant:

```typescript
import { AskResponse } from 'quidproquo-core';
import { TenantedEmailReceivedEvent, TenantedEmailReceivedEventResponse } from 'quidproquo-features';

export function* onTenantEmail({ message, recipient, inbox }: TenantedEmailReceivedEvent): AskResponse<TenantedEmailReceivedEventResponse> {
  if (message.authentication.dkim !== 'pass') {
    return;
  }
  // inbox.tenantId is the tenant; the ambient storage scope is already its scope
}
```

## Routes

All three require the tenant header (an inbox belongs to a tenant, never to a person) and `tenant:email:inboxes:manage` in it.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `{basePath}` | The tenant's inboxes as `TenantEmailInboxView[]`: the row plus `addresses`, the full address on every receiving host. |
| `POST` | `{basePath}` | Register an address (body `{ address, label? }`). The local part is lower-cased and must be a plain dot-atom (`a-z 0-9 . _ + -`, no leading/trailing/double dots, at most 64 chars); a host in the body is ignored. `BadRequest` when malformed, `Conflict` when already held by any tenant. |
| `DELETE` | `{basePath}/{address}` | Release an address the tenant holds. Another tenant's address reads as `NotFound`. |

## Signature

```typescript
function defineTenantedEmailReceiver(
  name: string,
  options: TenantedEmailReceiverOptions,
): QPQConfig;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | The receiver's name, passed to the underlying `defineEmailReceiver`. |
| `options.onEmail` | `QpqFunctionRuntime` | The story run per (message, registered recipient), inside the tenant's scope. |
| `options.basePath` | `` `/${string}` `` | Root of the inbox routes. |
| `options.routeAuthSettings` | `RouteAuthSettings` | The user directory the routes authenticate against; membership is checked against it. |
| `options.version` | `number` | Route version prefix, default 1. |

## What it declares

- The `qpq-tenant-email-inboxes` store (unscoped by necessity: a message names an inbox before any scope exists), keyed by local part with a `tenantId` index.
- The inline function registration for `onEmail`.
- The underlying `defineEmailReceiver`, whose handler does the routing.
- The three routes.

## Related

- [defineEmailReceiver](../webserver/email-receiver.md) — the untenanted receiver this builds on, and the `EmailMessage` shape.
- [defineTenant](./tenant.md) — membership, the roles catalog, and the tenant header.
