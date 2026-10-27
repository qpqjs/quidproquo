---
title: defineMigration
description: Register deploy-time migration stories that run once per deploy to evolve data as your service changes.
---

# defineMigration

Registers a set of **migrations** — stories that run at deploy time to evolve existing data when your service changes (rename a field, backfill a column, reshape records). Each migration runs **at most once** across the lifetime of the service: quidproquo tracks which migrations have already run and only executes the ones that are new in the current deploy.

`defineMigration` is a convenience wrapper that expands into several lower-level config settings. It is built on [defineDeployEvent](../core/deploy-event.md), so its work is triggered by the deploy-event pipeline and ultimately runs through [askProcessEvent](../../actions/core/event/ask-process-event.md), just like every other event source.

- **What it declares:** a [global](../core/global.md) (`qpqMigrations`) holding the migration list, a [key-value store](../core/key-value-store.md) (`qpqMigrations`) that records which migrations have run, a [deploy event](../core/deploy-event.md) (`qpqMigrations`) that reacts to stack changes, and a [queue](../core/queue.md) (`qpqMigrations`) that actually executes each migration story. The queue is configured to run **one migration at a time** (`maxConcurrentExecutions: 1`, `batchSize: 1`, `concurrency: 1`) so migrations never run concurrently.

```typescript
import { defineMigration } from '@qpqjs/webserver';
import { DeployEventType } from '@qpqjs/core';

export default [
  defineMigration([
    {
      runtime: '/entry/migrations/2026-addFullName::addFullName',
      deployType: DeployEventType.Api,
    },
  ]),
];
```

## How it runs

The generated deploy event fires on each qualifying stack status change:

- **On the first (Create) deploy** every migration is recorded as *already run* without executing it — a freshly created service is expected to start from clean [seed](./seed.md) data, so there is nothing to migrate.
- **On later (Update) deploys** each migration whose `deployType` matches the stack that changed and that has **not** already been recorded is enqueued on the `qpqMigrations` queue (which runs its story) and then recorded as run. Migrations already recorded are skipped, so re-deploying is safe.

## Testing locally

Nothing local ever deploys, so a migration never runs on its own while you develop against `go:dev`. Run `qpq migrate` to execute every pending migration against the local dev store, once, through the same queue the deployed path uses. It records what it ran in the same tracking store, so a second call is a no-op until you add a new migration.

## Signature

```typescript
function defineMigration(
  migrations: Migration[],
  options?: QPQConfigAdvancedMigrationSettings,
): QPQConfig;
```

Unlike most `define*` helpers (which return a single config setting), `defineMigration` returns a `QPQConfig` — an array of settings — because it composes several underlying resources.

## Parameters

### `migrations` — `Migration[]` (required)

The list of migrations to register. Each entry:

```typescript
export interface Migration {
  runtime: QpqFunctionRuntime;
  deployType: DeployEventType;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `runtime` | `QpqFunctionRuntime` | The migration story to run, usually a relative path string of the form `'/path/to/file::exportedFunctionName'`. Its source path becomes the migration's identity — this is the key stored in the tracking key-value store, so it is how quidproquo knows a given migration has already run. |
| `deployType` | `DeployEventType` | Which deploy this migration belongs to, so it only runs when the matching stack updates. One of `DeployEventType.Api`, `DeployEventType.Web`, or `DeployEventType.Unknown`. |

### `options` — `QPQConfigAdvancedMigrationSettings` (optional)

Extends the shared `QPQConfigAdvancedSettings`. Forwarded to the underlying key-value store and queue.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `deprecated` | `boolean` | `false` | Marks the underlying resources as deprecated. |

## Notes

- Migrations run **sequentially** (never in parallel), one message per batch.
- Because identity is derived from the story's source path, moving or renaming a migration file makes quidproquo treat it as a brand-new migration that will run again.
- A migration story receives no payload — it is executed for its side effects on your data.

## Related

- [defineSeed](./seed.md) — the companion helper: seeds initial data on the first deploy, whereas migrations evolve existing data on later deploys.
- [defineDeployEvent](../core/deploy-event.md) — the lower-level deploy-time hook this is built on.
- [askProcessEvent](../../actions/core/event/ask-process-event.md) — the pipeline that runs the migration story.
- [defineQueue](../core/queue.md) / [defineKeyValueStore](../core/key-value-store.md) / [defineGlobal](../core/global.md) — the resources `defineMigration` generates.
