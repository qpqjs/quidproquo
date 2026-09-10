---
title: defineTenant
description: Wire up org/tenant support across every service in one call — the registry (stores, publish sync, routes) on the owner, the scope resolver everywhere.
---

# defineTenant

Wires up **everything for org/tenant support**, declared identically in every service that needs it. You always pass the same `owner`; what actually materializes depends on whether the current module is that owner. It returns a `QPQConfig` (an array of config settings) composed of:

- The scope-resolver and connection-scope-resolver [inline functions](../core/inline-function.md) (`TENANT_SCOPE_RESOLVER_FN`, `TENANT_CONNECTION_SCOPE_RESOLVER_FN`) — registered in **every** service, so each can tenant-scope its own collections and WebSocket connections. The tenant collection itself is an ordinary tenanted collection too: a tenant doc lives in whatever scope the request that created it ran under (the creator's personal partition, or the active tenant when an org creates a sub-tenant), and every tenant route resolves its scope with the same resolver. The cross-scope registry surface is the membership table plus the materialized `TenantRecord` store below, both unscoped.
- The `userTenantLinks` membership table ([key-value store](../core/key-value-store.md)) — declared with `owner` everywhere, so non-owner services get a cross-module reference to the owner's table instead of their own copy.
- Everything else, gated to the owner's deploy only via [defineServiceSettings](../core/service-settings.md):
  - The tenant stores ([defineTenantStores](./tenant-stores.md)): the tenant event-doc collection plus the materialized record table.
  - The publish-to-record-store sync: an inline function (`askTenantOnPublish`) that runs on every published tenant document, re-folds the full event log, and upserts the resulting `TenantRecord`. It is a plain upsert of the fold result, so publish retries and repair re-runs are safe.
  - The stock event-doc CRUD at `{basePath}` ([defineEventDocRoutes](./event-doc-routes.md) for the `tenants` store, `tenant` type, with the publish sync wired in as `onPublish`, and `create` excluded — see below).
  - The membership-gated routes at `{myTenantsBasePath}`: list my tenants, create, get record, get logo, and manage members (list, add, remove).

- **On AWS:** on the owner's deploy, this deploys everything [defineTenantStores](./tenant-stores.md) deploys (three DynamoDB tables and an S3 bucket) plus the API Gateway routes and Lambda handlers from [defineEventDocRoutes](./event-doc-routes.md) and the tenant routes below. On every other service's deploy, only the `userTenantLinks` reference resolves (no new table); the inline functions deploy no infrastructure of their own anywhere.

```typescript
import { defineTenant } from 'quidproquo-features';

// Declare identically in every service — the owner service and any other
// service that needs to tenant-scope its own collections.
export default [
  ...defineTenant({
    owner: { module: 'ca' },
    basePath: '/tenants',
    myTenantsBasePath: '/my-tenants',
    routeAuthSettings: { userDirectoryName: 'users' },
  }),
];
```

## Routes mounted

All paths are prefixed with the version segment `/v{version}` (default `/v1`) and use the `routeAuthSettings` you pass:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `{myTenantsBasePath}` | The authenticated user's tenants, as `EventDocSummary` rows. Runs under the request's scope: memberships homed in the caller's current partition hydrate live (drafts included); the rest hydrate from the published `TenantRecord` registry. |
| `POST` | `{myTenantsBasePath}` | Create a tenant (body `{ name }`); the caller becomes its first member. Runs under the request's scope, so the new tenant doc lands in the caller's current partition. This is the only way to create a tenant — the stock `create` route is excluded at `{basePath}` so a new tenant is never made without also linking its creator. |
| `GET` | `{myTenantsBasePath}/{id}` | One tenant's materialized record (the fast path). Members only: non-members get `Forbidden`, a missing record gets `NotFound`. |
| `GET` | `{myTenantsBasePath}/{id}/logo` | A presigned, short-lived URL for the tenant's logo blob. Members only: non-members get `Forbidden`; a missing record or a tenant with no logo gets `NotFound`. Presigned in the scope the tenant doc was published under (recorded on the `TenantRecord`), not the reader's own scope, since the logo asset lives in the doc's home partition. |
| `GET` | `{myTenantsBasePath}/{id}/members` | The tenant's members as `TenantMember[]` (`userId`, `email`, `name`, hydrated from the user directory). Members only: non-members get `Forbidden`. |
| `POST` | `{myTenantsBasePath}/{id}/members` | Add an existing user directory account to the tenant (body `{ email }`). Owner only: non-owners get `Forbidden`. No invite flow — an email with no matching account gets `NotFound`. Idempotent: re-adding a member is a no-op that still returns the `TenantMember`. |
| `DELETE` | `{myTenantsBasePath}/{id}/members/{userId}` | Remove a member from the tenant. Owner only: non-owners get `Forbidden`. The owner can never be removed, even by themself: `BadRequest`. |

On top of these, the stock event-doc route set (get, append, list events, assets, remove, and so on — everything but `create`) is mounted at `{basePath}`, named after the model type like any other collection; see [defineEventDocRoutes](./event-doc-routes.md#routes-mounted) for the list. `{basePath}` and `{myTenantsBasePath}` must be distinct and neither may be a path segment under the other: `{basePath}/{id}` matches any single segment, so a literal sibling path would be ambiguous with a tenant whose id happens to match it.

## Signature

```typescript
function defineTenant(options: TenantOptions): QPQConfig;
```

## Parameters

The single `options` argument is a `TenantOptions` (a `TenantRoutesOptions` plus `owner`):

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `owner` | `CrossModuleOwner & { module: string }` | – (required) | The service that owns the tenant registry, e.g. `{ module: 'ca' }`. Pass the **same** value in every service's `defineTenant` call; the registry (stores, publish sync, management routes) only materializes when the deploying module matches this. |
| `basePath` | `` `/${string}` `` | – (required) | The tenant collection root, e.g. `/tenants`. The stock event-doc CRUD (minus `create`) mounts here. Only used on the owner's deploy, but required on every call for type consistency across services. |
| `myTenantsBasePath` | `` `/${string}` `` | – (required) | URL prefix the membership-gated routes mount under, e.g. `/my-tenants` (list mine, create, get record, get logo). Must not be a child path of `basePath` — see [Routes mounted](#routes-mounted). Only used on the owner's deploy, but required on every call for type consistency across services. |
| `routeAuthSettings` | `RouteAuthSettings` | – (required) | Auth applied to every mounted route (see [route](../webserver/route.md)). Required here, unlike the generic event-doc routes: tenant routes are meaningless unauthenticated, since membership keys off the user. Only used on the owner's deploy. |
| `version` | `number` | `1` | Version number for the `/v{version}` path prefix on every route. Only used on the owner's deploy. |
| `tenantHeaderName` | `string` | `'x-qpq-tenant-id'` | The header the client sends its selected tenant id on. Exposed to the tenant routes as the `tenantHeaderName` global, which the scope resolver reads. |

## Notes

- Tenant state is event-sourced: the `tenants` event-doc collection is the audit-trailed source of truth, and the `tenantRecords` table is a read model synced on publish. Request handlers never write the record table directly.
- The `tenants` collection is scope-resolved like any other tenanted collection (see [defineTenantedEventDoc](./tenanted-event-doc.md)): a doc is only visible/editable from the scope that owns it, including through the stock CRUD at `{basePath}`. There is no cross-scope doc read — listing memberships homed in another scope goes through the published `TenantRecord`, not the doc store.
- The `TenantRecord` produced by the publish sync carries `tenantId`, `name`, `brandColors`, `logo` (an asset ref, resolved to a URL via the get-logo route above), `scope` (the storage scope the doc was published under, used to presign the logo for cross-scope readers), `createdAt`, `updatedAt`, `createdByUserId`, and a `status` derived from the summary (`deleted` when the summary has a `deletedAt`, otherwise `active`).
- `defineTenant` registers the scope resolver but does not apply it to anything. To tenant-scope one of your own collections, pass `TENANT_SCOPE_RESOLVER_FN` as that collection's `scopeResolver` option (or use [defineTenantedEventDoc](./tenanted-event-doc.md), which does this for you).
- The scope resolver always resolves to a typed scope — a membership-checked `TENANT#<id>` for a request that names a tenant, or the caller's own `PERSONAL#<userId>` when it doesn't. A tenant-scoped collection or connection is never left unscoped.
- Every service — owner and non-owner alike — calls `defineTenant` with the same `owner`. There is no separate call for non-owning services anymore: the gating happens internally via [defineServiceSettings](../core/service-settings.md).
- There is only one role beyond plain membership: the tenant's **owner** (its creator), resolved from the tenant doc's `createdByUserId`. Owners manage membership (add/remove); members merely belong. Membership is tracked in both directions — `userTenantLinks` (per-user) and `tenantMemberLinks` (per-tenant, see [defineTenantStores](./tenant-stores.md)) — kept in lock-step so a tenant can list its members without scanning every user's row.

## Related

- [defineTenantStores](./tenant-stores.md): the store half of this helper (owner-only).
- [defineTenantedEventDoc](./tenanted-event-doc.md): a `defineEventDoc` with `TENANT_SCOPE_RESOLVER_FN` pre-wired as `scopeResolver`.
- [defineEventDocRoutes](./event-doc-routes.md): the stock CRUD mounted at `{basePath}`, and home of the `scopeResolver` / `onPublish` / `excludeRoutes` options.
- [defineWebSocketQueue](./web-socket-queue.md): where the tenant connection-scope resolver plugs in.
- [defineTenantedWebSocketQueue](./tenanted-web-socket-queue.md): a `defineWebSocketQueue` with that resolver pre-wired.
- [defineServiceSettings](../core/service-settings.md): the per-module gating mechanism this uses to materialize the registry only on the owner.
