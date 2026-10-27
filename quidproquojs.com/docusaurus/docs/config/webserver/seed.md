---
title: defineSeed
description: Register deploy-time seed stories that run once, on the first deploy, to populate a service with initial data.
---

# defineSeed

Registers a set of **seed** stories that run **once, on the first (Create) deploy** of a service, to populate it with initial data — reference tables, default records, a first admin user, and so on. Unlike [migrations](./migration.md), seeds are not tracked across future deploys; they fire only when the service's stacks are first created.

`defineSeed` is a convenience wrapper that expands into several lower-level config settings. It is built on [defineDeployEvent](../core/deploy-event.md), so its work is triggered by the deploy-event pipeline and ultimately runs through [askProcessEvent](../../actions/core/event/ask-process-event.md).

- **What it declares:** a [global](../core/global.md) (`qpqSeeds`) holding the seed list, a [deploy event](../core/deploy-event.md) (`qpqSeeds`) that reacts to stack changes, and a [queue](../core/queue.md) (`qpqSeeds`) that executes each seed story. The queue runs **one seed at a time** (`maxConcurrentExecutions: 1`, `batchSize: 1`, `concurrency: 1`). Note there is **no** tracking key-value store — that is the key difference from `defineMigration`.

```typescript
import { defineSeed } from '@qpqjs/webserver';

export default [
  defineSeed([
    '/entry/seeds/seedRoles::seedRoles',
    '/entry/seeds/seedAdminUser::seedAdminUser',
  ]),
];
```

## How it runs

The generated deploy event fires on each qualifying stack status change, but the seed logic only acts on the **Create** status. On the first deploy, every registered seed is enqueued on the `qpqSeeds` queue (which runs its story). On subsequent (Update) deploys nothing happens — seeds do not re-run.

## Signature

```typescript
function defineSeed(
  seeds: QpqFunctionRuntime[],
): QPQConfig;
```

Like [defineMigration](./migration.md), this returns a `QPQConfig` (an array of settings) rather than a single setting, because it composes several underlying resources.

## Parameters

### `seeds` — `QpqFunctionRuntime[]` (required)

The seed stories to run on the first deploy. Each is a `QpqFunctionRuntime`, usually a relative path string of the form `'/path/to/file::exportedFunctionName'`. A seed story receives no payload — it runs for its side effects (writing initial data). Seeds run **sequentially**, in the order the queue processes them.

`defineSeed` takes no options object.

## defineSeed vs defineMigration

| | `defineSeed` | `defineMigration` |
| --- | --- | --- |
| When it runs | Only on the **first (Create)** deploy | On **every Update** deploy (matching `deployType`), and marks all as run on Create |
| Run tracking | None (fires once at creation) | Tracked in a key-value store; each migration runs at most once |
| Purpose | Populate initial data | Evolve / reshape existing data over time |
| Per-entry config | Just the runtime | Runtime **plus** a `deployType` |

## Related

- [defineMigration](./migration.md) — the companion helper for evolving existing data on later deploys.
- [defineDeployEvent](../core/deploy-event.md) — the lower-level deploy-time hook this is built on.
- [askProcessEvent](../../actions/core/event/ask-process-event.md) — the pipeline that runs the seed story.
- [defineQueue](../core/queue.md) / [defineGlobal](../core/global.md) — the resources `defineSeed` generates.
