---
title: defineTenantedEventDocTransfer
description: A defineEventDocTransfer with the tenant scope resolver pre-wired, so export/import never cross tenant partitions.
---

# defineTenantedEventDocTransfer

A [defineEventDocTransfer](./event-doc-transfer.md) with the tenant scope resolver pre-wired as its `scopeResolver`, so an export reads and an import writes inside the caller's own tenant partition, never unscoped and never across tenants. It takes the same arguments as `defineEventDocTransfer` minus `scopeResolver`, which it fills in for you.

The pairing matters: transferring collections declared with [defineTenantedEventDoc](./tenanted-event-doc.md) through an unscoped transfer would read an empty collection and write into the wrong partition. The deploying service must still register the resolver implementation by calling [defineTenant](./tenant.md) (with the same `owner` used everywhere else). Use plain [defineEventDocTransfer](./event-doc-transfer.md) for services whose collections never partition by tenant.

```typescript
import { defineTenant, defineTenantedEventDoc, defineTenantedEventDocTransfer } from '@qpqjs/features';
import { articleDefinition } from './articleDefinition';

const collections = [articleDefinition];

export default [
  ...defineTenant({
    owner: { module: 'cms' },
    basePath: '/tenants',
    routeAuthSettings: { userDirectoryName: 'users' },
  }),

  ...defineTenantedEventDoc(articleDefinition, '/entry/eventDocs::articleDefinition', {
    basePath: '/articles',
    routeAuthSettings: { userDirectoryName: 'users' },
  }),

  ...defineTenantedEventDocTransfer({
    service: 'cms',
    collections,
    routeAuthSettings: { userDirectoryName: 'users' },
  }),
];
```

## Signature

```typescript
function defineTenantedEventDocTransfer(options: TenantedEventDocTransferOptions): QPQConfig;
```

`TenantedEventDocTransferOptions` is `EventDocTransferOptions` with `scopeResolver` omitted — see [defineEventDocTransfer](./event-doc-transfer.md#parameters) for the remaining options.

## Parameters

Same as [defineEventDocTransfer](./event-doc-transfer.md#parameters): `service`, `collections`, `routeAuthSettings`, `version` (without `scopeResolver`, which this always sets to `TENANT_SCOPE_RESOLVER_FN`).

## Returns

Same as [defineEventDocTransfer](./event-doc-transfer.md) — a `QPQConfig` array with the transfer's `scopeResolver` already pointed at the tenant scope resolver.

## Related

- [defineEventDocTransfer](./event-doc-transfer.md) — the underlying define this pre-configures.
- [defineTenant](./tenant.md) — registers `TENANT_SCOPE_RESOLVER_FN`, the inline function this wires in by name.
- [defineTenantedEventDoc](./tenanted-event-doc.md) — the same pattern applied to a collection's own routes; pair the two so a transfer's partitioning matches its collections'.
