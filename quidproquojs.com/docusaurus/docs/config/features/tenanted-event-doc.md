---
title: defineTenantedEventDoc
description: A defineEventDoc with the tenant scope resolver and authoriser pre-wired, so the collection partitions per tenant and every route requires a permission.
---

# defineTenantedEventDoc

A [defineEventDoc](./event-doc.md) with the tenant scope resolver pre-wired as its `scopeResolver` and the tenant authoriser as its `authorise`. The collection's stores and assets partition per tenant: request header, membership check, tenant scope, or the caller's own personal scope when no header is sent. The collection is never unscoped. Inside a tenant, every route also requires the caller to hold the collection's permission for that route, `eventDoc:<storeName>:<action>` where action is `read`, `create`, `write` or `delete`. Personal-scope requests are not permission-checked, since a personal partition has no second party to protect. It takes the same arguments as `defineEventDoc` minus `scopeResolver` and `authorise`, which it fills in for you.

The deploying service must still register both implementations by calling [defineTenant](./tenant.md) (with the same `owner` used everywhere else). Use plain [defineEventDoc](./event-doc.md) for collections that never partition by tenant.

Bundle a collection's keys into roles with `eventDocPermissions`, which builds them from the store name so the catalog and the check cannot drift:

```typescript
import { eventDocPermissions } from 'quidproquo-features';

const articles = eventDocPermissions('articles');

export const APP_ROLE_CATALOG = {
  editor: { code: 'editor', name: 'Editor', permissions: [articles.read, articles.create, articles.write] },
  reader: { code: 'reader', name: 'Reader', permissions: [articles.read] },
};
```

```typescript
import { defineTenantedEventDoc, defineTenant } from 'quidproquo-features';
import { articleDefinition } from './articleDefinition';

export default [
  ...defineTenant({
    owner: { module: 'ca' },
    basePath: '/tenants',
    myTenantsBasePath: '/my-tenants',
    routeAuthSettings: { userDirectoryName: 'users' },
    roles: { catalog: APP_ROLE_CATALOG },
  }),

  ...defineTenantedEventDoc(articleDefinition, '/entry/eventDocs::articleDefinition', {
    basePath: '/articles',
    routeAuthSettings: { userDirectoryName: 'users' },
  }),
];
```

## Signature

```typescript
function defineTenantedEventDoc(
  functions: EventDocFunctions,
  runtime: QpqFunctionRuntime,
  options: TenantedEventDocCollectionOptions,
): QPQConfig;
```

`TenantedEventDocCollectionOptions` is `EventDocCollectionOptions` with `scopeResolver` and `authorise` omitted — see [defineEventDoc](./event-doc.md#parameters) for the remaining options.

## Parameters

Same as [defineEventDoc](./event-doc.md#parameters): `functions`, `runtime`, and `options` (`basePath`, `routeAuthSettings`, `version`, `onPublish`, `onAppend`, without `scopeResolver` and `authorise`, which this always sets to `TENANT_SCOPE_RESOLVER_FN` and `TENANT_EVENT_DOC_AUTHORISER_FN`).

## Returns

Same as [defineEventDoc](./event-doc.md) — a `QPQConfig` array with the collection's `scopeResolver` and `authorise` already pointed at the tenant implementations.

## Related

- [defineEventDoc](./event-doc.md) — the underlying define this pre-configures.
- [defineTenant](./tenant.md) — registers `TENANT_SCOPE_RESOLVER_FN` and `TENANT_EVENT_DOC_AUTHORISER_FN`, the inline functions this wires in by name.
- [defineTenantedWebSocketQueue](./tenanted-web-socket-queue.md) — the same pattern applied to a WebSocket queue's `connectionScopeResolver`.
- [defineTenantedEventDocTransfer](./tenanted-event-doc-transfer.md) — the same pattern applied to a collection's export/import routes.
