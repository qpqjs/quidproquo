---
title: defineAdminSessionEventDoc
description: Declare the event document that records one audited session per admin dashboard login.
---

# defineAdminSessionEventDoc

Declares the **admin session event document** — the audit record behind the admin dashboard. It creates one event doc per admin login, appending every user-intent event for that session so operator activity in the dashboard is fully auditable.

It is built on the quidproquo **eventDoc** feature — an event document is an append-only, per-instance record backed by storage, routes, and a WebSocket feed — composed directly from [defineEventDocSummary](./event-doc-summary.md) and [defineEventDocRoutes](./event-doc-routes.md) rather than [defineEventDoc](./event-doc.md), since the session collection registers no functions object (no render, no references, no snapshots). This define fixes the store name, type, base path, and auth directory to the admin conventions, so you don't configure them yourself.

`defineAdminSessionEventDoc` returns a `QPQConfig` array. It is spread in automatically by [defineAdminSettings](./admin-settings.md), so you rarely call it directly — but it is exported for services that assemble the admin feature piece by piece.

- **On AWS:** it deploys whatever the underlying eventDoc feature deploys (storage, routes, and WebSocket infrastructure for the session document). The document and its routes are scoped to the log service and never materialise elsewhere.

```typescript
import { defineAdminSessionEventDoc } from '@qpqjs/features';

export default [
  // Audit admin sessions in the 'log' service.
  ...defineAdminSessionEventDoc('log'),
];
```

## Signature

```typescript
function defineAdminSessionEventDoc(
  logServiceName: string,
): QPQConfig;
```

## Parameters

### `logServiceName` — `string` (required)

The name of the service that owns the admin session document. The event doc is wrapped in `defineServiceSettings` keyed on this name, so — like the other admin-only resources declared by [defineAdminSettings](./admin-settings.md) — it only flattens into deployable resources when the deploying service matches. Pass the same `logServiceName` you give [defineAdminSettings](./admin-settings.md).

## Notes

- The event document is created with fixed conventions: store name `qpq-admin-sessions`, doc type `adminSession`, base path `/admin/session`, and `routeAuthSettings.userDirectoryName` set to the admin directory (`qpq-admin`) so only authenticated admins can read or append to it. See [defineAdminUserDirectory](./admin-user-directory.md).
- Because [defineAdminSettings](./admin-settings.md) already spreads this in, declaring both would register the document twice — use one or the other.

## Related

- [defineAdminSettings](./admin-settings.md) — spreads this define in as part of the admin feature.
- [defineAdminUserDirectory](./admin-user-directory.md) — the directory the session document is authenticated against.
