---
title: defineEventDoc
description: Register an event-sourced document collection's functions object, declare its stores, and mount its HTTP routes, in one call.
---

# defineEventDoc

Registers a document collection's **functions object** (its identity plus its behaviour — fold, references, and optionally render — as a [dynamic-functions](../core/dynamic-functions.md) surface), declares the stores that back it, and mounts the HTTP routes that serve it, all in one call. This is the all-in-one helper for the common **one-store-one-type** case. It returns a `QPQConfig` (an array of config settings) that you spread into a service's infrastructure default export.

An event document is not stored as a mutable row. It is derived by folding an ordered, append-only log of events. `defineEventDoc` provisions that log (plus a queryable summary table and a blob bucket), registers the collection's functions object so the backend can invoke it by name, and mounts the REST routes that create documents, append events, read them back, and resolve their draft/published versions.

- **On AWS:** deploys everything [defineEventDocSummary](./event-doc-summary.md) deploys (DynamoDB tables for the summary, events, and snapshots, plus an S3 bucket for assets), everything [defineEventDocRoutes](./event-doc-routes.md) deploys (the API Gateway routes and their Lambda handlers), and a [defineDynamicFunctions](../core/dynamic-functions.md) registration for `functions` — no infrastructure of its own. It reads `functions`' `storeName`/`type` off the object itself, so `options` carries no identity fields.

```typescript
import { defineEventDoc } from 'quidproquo-features';
import { articleDefinition } from './articleDefinition';

export default [
  ...defineEventDoc(articleDefinition, '/entry/eventDocs::articleDefinition', {
    basePath: '/articles',
    routeAuthSettings: { userDirectoryName: 'editors' },
  }),
];
```

## Registering a collection's functions

`functions` is an `EventDocFunctions` object: `{ storeName, type, getSnapshotCacheKey, foldSnapshotViews, foldDocumentState, collectReferences, collectReferencesFromState, validateEvent, render? }`. The object `createEventDocDefinition` returns — given `storeName`/`type` in its config — satisfies this shape directly, so a collection with no service-only render can register its definition verbatim. A collection that needs a render step only service code can perform (resolving linked docs, reading blob-drive assets) layers it on with `extendEventDocFunctions(definition, { render })`, which returns a new object and never mutates the definition itself.

`runtime` is a [`QpqFunctionRuntime`](../core/dynamic-functions.md#runtime--qpqfunctionruntime-required) path to that SAME export — the dynamic-functions pattern: identity is read off the object here at config time, behaviour is loaded from the path by the processors at request time. Both must point at the exact object being registered, or the registration and the runtime will disagree about what the collection can do.

## When to use `defineEventDoc` vs `defineEventDocSummary` + `defineEventDocRoutes`

`defineEventDoc` defines the store, the functions registration, **and** the routes together, so it assumes exactly one document `type` per store. If you want several document types to share one physical store (one summary table, one events table, one bucket), you must not define the store more than once. In that case, call [defineEventDocSummary](./event-doc-summary.md) **once** for the shared store, then [defineDynamicFunctions](../core/dynamic-functions.md) and [defineEventDocRoutes](./event-doc-routes.md) **per type** — each with the same `storeName` but a different `type`, `basePath`, and functions object, passing `defineEventDocSummary` the whole `snapshotFunctions` map. Use `defineEventDoc` whenever the store backs a single type.

A collection with no definition at all (no render, no references, no snapshots) composes the low-level pair directly instead of calling `defineEventDoc`: `[...defineEventDocSummary(storeName), ...defineEventDocRoutes({ storeName, type, ...options })]`.

## Signature

```typescript
function defineEventDoc(
  functions: EventDocFunctions,
  runtime: QpqFunctionRuntime,
  options: EventDocCollectionOptions,
): QPQConfig;
```

## Parameters

### `functions` — `EventDocFunctions` (required)

The collection's callable surface, read for its identity (`storeName`, `type`) at config time and registered under `runtime` for invocation at request time.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `storeName` | `string` | yes | Name of the summary store to create and serve. Also derives the events table and asset bucket names. |
| `type` | `string` | yes | The document type this collection holds — the store's partition value, so one store can (via the split helpers) hold several types. |
| `getSnapshotCacheKey` | `() => string` | yes | The key this collection's snapshots are filed under (see [Snapshot cache key](#snapshot-cache-key)). `''` is the legacy layout. A member rather than a value because the data layer reaches a definition only through dynamic functions. |
| `foldSnapshotViews` | `(events, seedViews?) => Nullable<EventDocSnapshotViews>` | yes | Every view of a log prefix, era-pinned — what a snapshot stores. Invoked by the event store's stream projector (which also writes the summary row from the fold's `summary` view). |
| `foldDocumentState` | `(events, seedState?) => unknown` | yes | The document view at one point, LATEST-shaped, resumable from a stored snapshot's era-pinned document state. The read side's fold: render, references, as-of reads, and the append hooks' state derivation all go through it. |
| `collectReferences` | `(events) => EventDocLink[]` | yes | The `EventDocLink`s this doc's whole HISTORY depends on; `[]` for a leaf doc type. Invoked by the transfer manifest walk (it exports the whole history). |
| `collectReferencesFromState` | `(state) => EventDocLink[]` | yes | The `EventDocLink`s the CURRENT state depends on; `[]` for a leaf doc type. Invoked by the references route against a snapshot-seeded folded state. |
| `validateEvent` | `(event, state) => Nullable<string> \| AskResponse<Nullable<string>>` | yes | The append pre-write gate: checked against the state the event will land on, before the write (see [askEventDocEventAppend](../../actions/features/event-doc/ask-event-doc-event-append.md)). Return a rejection reason string to refuse the append, `null` to allow it. A collection with no domain rules can pass `() => null`. |
| `render` | `(input: EventDocRenderInput) => EventDocRenderResult \| AskResponse<EventDocRenderResult>` | no | Render the resolved, already-folded document state (`input.state`, resolved snapshot-seeded by the route). Omit and `GET {basePath}/{id}/render` 404s as "no renderer configured". Plain function or story — the dynamic-functions processor runs either. |

#### Snapshot cache key

A snapshot is a memo of "fold these events with this seed and reducer". The events are immutable, so the memo stays valid until the fold code changes. A change to the MEANING of existing events is a schema version bump with a migration. An additive change — a new defaulted field in a version's seed, a new event type, a new reducer case — needs no migration, but every stored snapshot is now the output of code you no longer run, and a reader resuming from one would see the old shape (a `undefined` where the new field should be).

`snapshotCacheKey` on `createEventDocDefinition` names the fold code. It is part of the snapshot row's partition key (`docId#viewName#key`) and the offloaded blob's path, so after you change it every reader finds no snapshot, refolds the whole log from the seed, and the stream projector files a fresh snapshot under the new key on the document's next append. The bootstrap base handed to the editor carries the key too, so a workspace snapshot held in the browser across a deploy is refetched rather than trusted. Rows under an old key are left to persist.

```typescript
export const contentItemEventDoc = createEventDocDefinition({
  storeName: CONTENT_STORE,
  type: 'content',
  schemaVersion: 1,
  versions: [contentItemV1],
  // Bump when v1's seed or reducer changes in place; every stored snapshot is then refolded.
  snapshotCacheKey: '2026-09-23-image-assets',
  api,
});
```

Refolding is lazy: a document pays one whole-log fold per reader until its next append reprojects it. To pay that up front, an admin job can walk each collection's documents (inside each storage scope) and call `askEventDocReprojectHead(docId)`, which re-runs the projector at the log head under the current key.

### `runtime` — `QpqFunctionRuntime` (required)

A reference to the module exporting `functions`, usually a relative path string of the form `'/path/to/file::exportedObjectName'` — see [defineDynamicFunctions](../core/dynamic-functions.md#runtime--qpqfunctionruntime-required). Must resolve to the SAME object passed as `functions`.

### `options` — `EventDocCollectionOptions` (required)

The same object [defineEventDocRoutes](./event-doc-routes.md#parameters) takes, minus `storeName`/`type` (read off `functions` instead). See the [defineEventDocRoutes parameter reference](./event-doc-routes.md#parameters) for every field: `basePath`, `routeAuthSettings`, `version`, `onPublish`, `onAppend`, `scopeResolver`, `excludeRoutes`.

## Examples

```typescript
import { defineEventDoc } from 'quidproquo-features';
import { articleDefinition } from './articleDefinition';

export default [
  // A single "article" collection with authenticated mutations.
  ...defineEventDoc(articleDefinition, '/entry/eventDocs::articleDefinition', {
    basePath: '/articles',
    routeAuthSettings: { userDirectoryName: 'editors' },
  }),
];
```

## Related

- [defineEventDocSummary](./event-doc-summary.md) — the store half of this helper; call it directly when several types share one store.
- [defineEventDocRoutes](./event-doc-routes.md) — the routes half; call it per type in the split setup.
- [defineDynamicFunctions](../core/dynamic-functions.md) — the registration this threads `functions`/`runtime` through.
- [defineKeyValueStore](../core/key-value-store.md) / [defineStorageDrive](../core/storage-drive.md) — the underlying core config the summary helper composes.
- **Reading a document in your own stories:** [askEventDocGetByIdOrThrow](../../actions/features/event-doc/ask-event-doc-get-by-id.md), [askEventDocList](../../actions/features/event-doc/ask-event-doc-list.md), and the [version reads](../../actions/features/event-doc/ask-event-doc-get-draft.md).
- **Creating a document in your own stories:** [askEventDocCreate](../../actions/features/event-doc/ask-event-doc-create.md).
