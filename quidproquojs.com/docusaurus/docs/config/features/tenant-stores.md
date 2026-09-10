---
title: defineTenantStores
description: Declare the data stores for the tenant feature, the tenant event-doc collection and the materialized record table.
---

# defineTenantStores

Declares the **owner-only stores** that back the tenant (org) feature, without any routes or inline functions. It returns a `QPQConfig` (an array of config settings) that expands to:

1. The **tenant event-doc collection**: a [defineEventDocSummary](./event-doc-summary.md) call for the `tenants` store (summary table, append-only event log, and asset drive). This is the audit-trailed source of truth for tenant state.
2. The **materialized tenant record store**: a [key-value store](../core/key-value-store.md) named `tenantRecords` (partition key `tenantId`). A fast-read table synced from the event doc on publish; it is never written directly by request handlers.
3. The **tenant-to-users membership index**: a [key-value store](../core/key-value-store.md) named `tenantMemberLinks` (partition key `tenantId`). The reverse of the membership links store below, maintained in lock-step so a tenant's member list can be read without scanning every user's row.

The **user-tenant membership links store** (`userTenantLinks`, partition key `userId`) is declared separately, directly by [defineTenant](./tenant.md) — every service refs it via the same `owner`, so it isn't part of this helper.

- **On AWS:** deploys everything [defineEventDocSummary](./event-doc-summary.md) deploys (two DynamoDB tables plus an S3 bucket), plus two more DynamoDB tables (via [defineKeyValueStore](../core/key-value-store.md)) for the record store and the member links index.

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
| `TENANT_MEMBER_LINKS_STORE` | `'tenantMemberLinks'` | The tenant-to-users membership index. |

The membership table's constant, `USER_TENANT_LINKS_STORE` (`'userTenantLinks'`), is also exported, but the store itself is declared by [defineTenant](./tenant.md), not here.

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

The membership store holds `UserTenantLinks` rows:

```typescript
type UserTenantLinks = {
  userId: string;
  tenantIds: string[];
};
```

The member-links index holds `TenantMemberLinks` rows, the reverse of `UserTenantLinks`:

```typescript
type TenantMemberLinks = {
  tenantId: string;
  userIds: string[];
};
```

## Notes

- The tenant event-doc collection is the source of truth; the `tenantRecords` table is a read model. The sync between them is the `askTenantOnPublish` inline function, which [defineTenant](./tenant.md) registers and wires into the collection's `onPublish` hook.
- Creating a tenant appends its id to the caller's `UserTenantLinks` row, so the creator becomes the tenant's first member, and mirrors that link into `tenantMemberLinks` in the same step. Both directions are written together, and stay in lock-step, whenever a member is added or removed.
- `tenantMemberLinks` is owner-only: the scope resolver never reads it, and no non-owner service gets a cross-module reference to it (unlike `userTenantLinks`).
- Services that do **not** own these stores still call [defineTenant](./tenant.md) (with the same `owner`) to get the scope resolver and a cross-module reference to the membership table — they never call `defineTenantStores` themselves.

## Related

- [defineTenant](./tenant.md): composes these stores with the routes and inline functions; the usual entry point.
- [defineEventDocSummary](./event-doc-summary.md): the event-doc store helper this composes for the `tenants` collection.
- [defineKeyValueStore](../core/key-value-store.md): the core setting behind the record table.
