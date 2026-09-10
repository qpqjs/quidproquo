---
title: defineTenantStores
description: Declare the data stores for the tenant feature, the tenant event-doc collection and the materialized record table.
---

# defineTenantStores

Declares the **owner-only stores** that back the tenant (org) feature, without any routes or inline functions. It returns a `QPQConfig` (an array of config settings) that expands to:

1. The **tenant event-doc collection**: a [defineEventDocSummary](./event-doc-summary.md) call for the `tenants` store (summary table, append-only event log, and asset drive). This is the audit-trailed source of truth for tenant state.
2. The **materialized tenant record store**: a [key-value store](../core/key-value-store.md) named `tenantRecords` (partition key `tenantId`). A fast-read table synced from the event doc on publish; it is never written directly by request handlers.

The **tenant memberships store** (`tenantMemberships`, partition key `userId`, sort key `tenantId`, with a GSI on `tenantId`/`userId`) is declared separately, directly by [defineTenant](./tenant.md) — every service refs it via the same `owner`, so it isn't part of this helper. One row per `(user, tenant)` link serves both the access check (a keyed get) and, via the GSI, a tenant's member list.

- **On AWS:** deploys everything [defineEventDocSummary](./event-doc-summary.md) deploys (two DynamoDB tables plus an S3 bucket), plus one more DynamoDB table (via [defineKeyValueStore](../core/key-value-store.md)) for the record store.

```typescript
import { defineTenantStores } from 'quidproquo-features';

export default [
  ...defineTenantStores(),
];
```

You rarely call this directly: [defineTenant](./tenant.md) composes it along with the routes and inline functions, gated to the owner's deploy. Call it on its own only when you want the stores without the tenant routes.

## Signature

```typescript
function defineTenantStores(): QPQConfig;
```

## Parameters

None. All store names are fixed constants exported from `quidproquo-features`:

| Constant | Value | Store |
| --- | --- | --- |
| `TENANT_EVENTDOC_STORE` | `'tenants'` | The tenant event-doc collection. |
| `TENANT_RECORD_STORE` | `'tenantRecords'` | The materialized tenant record table. |

The membership table's constant, `TENANT_MEMBERSHIPS_STORE` (`'tenantMemberships'`), is also exported, but the store itself is declared by [defineTenant](./tenant.md), not here.

## Store row shapes

The record store holds `TenantRecord` rows, derived from the tenant event doc on publish:

```typescript
type TenantRecord = {
  tenantId: string;
  name: string;
  brandColors?: Record<string, string>;
  logoUrl?: string;
  createdAt: QpqIsoDateTime;
  updatedAt: QpqIsoDateTime;
  createdByUserId: string;
  status: TenantStatus;
};
```

The membership store holds `TenantMembership` rows, one per `(user, tenant)` link:

```typescript
type TenantMembership = {
  tenantId: string;
  userId: string;
  role: TenantMembershipRole;
  disabled?: boolean;
  joinedAt: QpqIsoDateTime;
  addedByUserId: string;
};
```

`role` is `TenantMembershipRole.owner` or `TenantMembershipRole.member` — see [defineTenant](./tenant.md#routes-mounted) for who can change it. A `disabled` member fails the membership check everywhere (scope resolver, WebSocket scope, tenant routes) but still appears in the member list, so an owner can re-enable them.

## Notes

- The tenant event-doc collection is the source of truth; the `tenantRecords` table is a read model. The sync between them is the `askTenantOnPublish` inline function, which [defineTenant](./tenant.md) registers and wires into the collection's `onPublish` hook.
- Creating a tenant writes a `TenantMembership` row with `role: owner` for the caller, so the creator becomes the tenant's first member. The same table serves both the access check (`userId`+`tenantId` keyed get) and, via its `tenantId`/`userId` GSI, a tenant's member list — there is no separate reverse index to keep in lock-step.
- Services that do **not** own these stores still call [defineTenant](./tenant.md) (with the same `owner`) to get the scope resolver and a cross-module reference to the membership table — they never call `defineTenantStores` themselves.

## Related

- [defineTenant](./tenant.md): composes these stores with the routes and inline functions; the usual entry point.
- [defineEventDocSummary](./event-doc-summary.md): the event-doc store helper this composes for the `tenants` collection.
- [defineKeyValueStore](../core/key-value-store.md): the core setting behind the record table.
