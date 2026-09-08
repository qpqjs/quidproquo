---
title: defineAdminSettings
description: Wire up the quidproquo admin feature — the log-inspection dashboard and its API, WebSocket sync, storage, and alarms — in one call.
---

# defineAdminSettings

Wires up the **admin feature**: the log-service backend that powers the quidproquo admin dashboard. In a single call it declares the storage, key-value stores, HTTP API routes, WebSocket sync pipeline, error alarms, and globals that let operators authenticate, browse services, and inspect the structured logs (correlations) every quidproquo runtime writes.

`defineAdminSettings` returns a `QPQConfig` — an array of config settings you spread into a service's config. Most of the resources it declares are **owned by the log service** (the `logServiceName` you pass): they only fully materialise when that service deploys, and appear as foreign references everywhere else. This lets many services publish logs into one shared admin service.

- **On AWS:** this define does not deploy infrastructure of its own — it composes other `define*` settings ([defineStorageDrive](../core/storage-drive.md), [defineKeyValueStore](../core/key-value-store.md), [defineQueue](../core/queue.md), [defineEventBus](../core/event-bus.md), routes, and a WebSocket queue), and each of those deploys its usual AWS resources. The reads served over its routes are backed by the [askAdminGetLogs](../../actions/webserver/admin/ask-admin-get-logs.md) family of actions.

```typescript
import { defineAdminSettings } from 'quidproquo-features';
import { defineAdminUserDirectory } from 'quidproquo-features';

export default [
  // The admins' auth directory (see defineAdminUserDirectory)
  ...defineAdminUserDirectory({ owner: { module: 'log' } }),

  // The admin dashboard backend, owned by the 'log' service
  ...defineAdminSettings('log', {
    logRetentionDays: 90,
    services: ['api', 'workers', 'web'],
  }),
];
```

## Signature

```typescript
function defineAdminSettings(
  logServiceName: string,
  advancedSettings?: QPQConfigAdvancedLogSettings,
): QPQConfig;
```

## Parameters

### `logServiceName` — `string` (required)

The name of the service that **owns** the admin resources. Owner-stamped settings (the log storage drives, the admin WebSocket event bus/queues, the key-value stores, the auth and log routes, the alarm pipeline, and the [session event doc](./admin-session-event-doc.md)) only flatten into deployable resources when the deploying service matches this name; elsewhere they resolve as foreign references. Owner resolution runs at IAM-scoping time.


### `advancedSettings` — `QPQConfigAdvancedLogSettings` (optional)

```typescript
export interface QPQConfigAdvancedLogSettings extends QPQConfigAdvancedSettings {
  logRetentionDays?: number;
  coldStorageAfterDays?: number;
  services?: string[];
  maintenanceWebsocketApiName?: string;
}
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `logRetentionDays` | `number` | – (no expiry) | How many days to keep the raw log objects on the logs storage drive before they are deleted. When unset, logs never expire. If `coldStorageAfterDays` is set, the effective retention is padded so that it is at least `coldStorageAfterDays + 180` days — logs always outlive the cold-storage transition window. |
| `coldStorageAfterDays` | `number` | – (no transition) | When greater than 0, adds a lifecycle rule transitioning log objects to the `DEEP_COLD_STORAGE` tier after this many days, to cut storage cost for old logs. |
| `services` | `string[]` | `[]` | The list of service names the admin dashboard should surface, exposed as the `qpq-serviceNames` global. Returned by the `/admin/services` route. |
| `maintenanceWebsocketApiName` | `string` | `''` | Name of the **application** [WebSocket queue](./web-socket-queue.md) (its `apiName`, not the admin's own socket) that maintenance state broadcasts on. Unset means maintenance mutations skip broadcasting. |
| `deprecated` | `boolean` | `false` | Inherited from `QPQConfigAdvancedSettings`; marks the log storage drives and key-value stores as deprecated. |

## What it declares

`defineAdminSettings` returns a `QPQConfig` array composed of:

- **Log storage** — a `QPQ_LOGS_STORAGE_DRIVE_NAME` storage drive (with an `onCreate` handler and the retention / cold-storage lifecycle rules), plus a `QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME` drive (30-day retention) for generated reports.
- **Log indexes** — key-value stores for correlations (indexed by `runtimeType` and `fromCorrelation`, both sorted by `startedAt`, with a `ttl` attribute), log messages, and a log list.
- **Auth routes** — `POST /login`, `POST /refreshToken`, `POST /challenge`, authenticated against the [admin user directory](./admin-user-directory.md).
- **Log routes** — `GET /admin/services`, `POST /log/list`, `GET /log/{correlationId}`, its `/toggle`, `/children`, `/hierarchies`, `/downloadurl`, and the log-log list — all (except the service list) requiring an admin token.
- **Maintenance collection** — an [event-doc collection](./event-doc.md) (`defineEventDoc`) mounted at `/maintenance`, admin-authenticated, storing maintenance windows as an append-only update log. Every append re-broadcasts the active maintenance set to every connection on the `maintenanceWebsocketApiName` application WebSocket queue (via its `onAppend` hook); a newly-opened connection gets the same set pre-auth through that queue's `onConnected` sync.
- **Log chat** — a `defineEventDocAi` instance scoped to `docId` = log correlation id, with two tools (`getLogActions`, `getLogAction`) instead of the log's JSON pasted into the prompt. Runs on `AiModel.ClaudeSonnet46` over the same admin WebSocket connection, not a separate HTTP route.
- **WebSocket sync** — an admin event bus (`qpq-admin-wsq`), a `defineWebSocketQueue`, and queues that fan out client messages (config sync, mark-log-checked, refresh-metadata) using `WebsocketAdminClientMessageEventType`.
- **Alarms** — a `defineNotifyError` publishing to an `admin-notifier` event bus, with a queue handling its Error / Timeout / Throttle events.
- **Globals** — `qpq-serviceNames` and `qpq-log-retention-days`.
- **Audit sessions** — spreads in [defineAdminSessionEventDoc](./admin-session-event-doc.md) for the admin UI's per-login session document.

## Examples

```typescript
import { defineAdminSettings, defineAdminUserDirectory } from 'quidproquo-features';

export default [
  ...defineAdminUserDirectory({ owner: { module: 'log' } }),

  // Retain logs 30 days, move to deep cold storage after 7.
  ...defineAdminSettings('log', {
    logRetentionDays: 30,
    coldStorageAfterDays: 7,
    services: ['api', 'workers'],
  }),
];
```

## Related

- [defineAdminUserDirectory](./admin-user-directory.md) — the directory admins authenticate against; declare it alongside these settings.
- [defineAdminSessionEventDoc](./admin-session-event-doc.md) — the per-login admin session document, spread in by this define.
- [askAdminGetLogs](../../actions/webserver/admin/ask-admin-get-logs.md), [askAdminGetLog](../../actions/webserver/admin/ask-admin-get-log.md), [askAdminGetLogMetadata](../../actions/webserver/admin/ask-admin-get-log-metadata.md) — the actions the admin log routes are built from.
- [defineEventDoc](./event-doc.md) — the helper the maintenance collection is declared with.
- [defineWebSocketQueue](./web-socket-queue.md) — declares the application WebSocket queue named by `maintenanceWebsocketApiName`, including its `onConnected` pre-auth sync.
- [defineStorageDrive](../core/storage-drive.md), [defineKeyValueStore](../core/key-value-store.md), [defineQueue](../core/queue.md), [defineEventBus](../core/event-bus.md) — the core settings this feature composes.
