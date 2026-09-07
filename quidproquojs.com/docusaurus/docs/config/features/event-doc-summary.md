---
title: defineEventDocSummary
description: Declare the stores for an event-sourced document collection — its summary table, append-only event log, and asset bucket.
---

# defineEventDocSummary

Declares the **stores** that back an event-document collection, without any routes. It returns a `QPQConfig` (an array of config settings) that expands to five underlying core stores:

1. A **summary key-value store** (partition key `type`, sort key `id`) — the queryable record for each document, derived by folding the identity/lifecycle events of its log. Rows are the [`EventDocSummary`](../../actions/features/event-doc/ask-event-doc-get-by-id.md) shape and carry the version history. A secondary index on `(type, updatedAt)` supports the recently-updated ordering [askEventDocList](../../actions/features/event-doc/ask-event-doc-list.md) returns. It is a pure projection: nothing on the append path writes it directly. The events store below declares an [`onStream`](../core/key-value-store.md#change-data-capture-onstream) handler that rebuilds a document's summary row from its log whenever an event is appended, so the summary is eventually (not immediately) consistent with the log.
2. An **append-only events store** (`<storeName>EventLog`, partition key `pk`, numeric sort key `sk`) — the live ordered log every document is folded from, keyed on the event's contiguous position (`INIT_STATE` is `0`, every append is head + 1, claimed by a conditional write with retry under contention). Log order IS commit order. It has **no** secondary index on purpose: the local dev-server query processor can't target one, so all event reads go through the main table.
3. A **snapshots store** (`<storeName>SS`, partition key `pk`, sort key `sk`) — per-view folded states at points along the log (`pk = docId#view`, `sk` the same contiguous event id the log is ordered by). Populated only for the document types you enable via `options.snapshotFunctions`; a type with no entry there simply is not snapshotted. For a type with a registered functions object, the `onStream` handler runs ONE incremental fold per delivery — resuming from the newest usable snapshot and folding only the gap since it — and persists both the snapshot set and the summary row from that same fold (the fold's `summary` view IS the queryable record). The whole-log summary re-derivation remains only as the fallback: types with no registered functions, Remove stream records (a transfer rewrote the log, so snapshots can't seed), and folds that decline.
4. A **legacy events store** (`<storeName>Events`, partition key `pk`, numeric sort key `sk`) — the pre-sortable-id log, kept declared but unread/unwritten at runtime so its data stays reachable until it is migrated into the events store above.
5. A **storage drive** (`<storeName>edocs`, lower-cased) — the collection's blob bucket, holding each document's immutable uploaded assets (and later its derived runtime artifacts) under per-document prefixes.

Point-in-time recovery is enabled on all tables.

- **On AWS:** deploys four DynamoDB tables (via [defineKeyValueStore](../core/key-value-store.md)) and one S3 bucket (via [defineStorageDrive](../core/storage-drive.md)). All physical names are derived from `keyValueStoreName`, so a collection needs only that one name.

```typescript
import { defineEventDocSummary } from 'quidproquo-features';

export default [
  ...defineEventDocSummary('content'),
];
```

Use `defineEventDocSummary` when you want to define the store separately from the routes — most importantly, when **several document types share one store**. Call it once, then call [defineEventDocRoutes](./event-doc-routes.md) per type. For the common single-type case, [defineEventDoc](./event-doc.md) does both in one call.

## Signature

```typescript
function defineEventDocSummary(keyValueStoreName: string, options?: EventDocSummaryOptions): QPQConfig;
```

## Parameters

### `keyValueStoreName` — `string` (required)

The collection's base store name. It is used directly as the summary store name and as the `storeName` that route definitions and store-context calls reference. The events table name (`` `${name}Events` ``) and asset bucket name (`` `${name}edocs`.toLowerCase() ``) are both derived from it, so the whole collection is addressed by this single name. It must match the `storeName` passed to any [defineEventDocRoutes](./event-doc-routes.md) (or [askEventDocProvideStore](#related)) for the same collection.

### `options` — `EventDocSummaryOptions` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `snapshotFunctions` | `Record<string, string>` | `{}` | Registered dynamic-functions names (see [defineDynamicFunctions](../core/dynamic-functions.md)) of each collection's `EventDocFunctions` object, keyed by document `type` — keyed because one events table can host several collections and its one stream serves them all. When a row's type has an entry, the stream projector invokes that object's `foldSnapshotViews` with the doc's log prefix (or, once a usable snapshot exists, just the gap since it, plus that snapshot's per-view state as `seedViews`) and writes the folded views to the snapshots store; a type with no entry is not snapshotted. [defineEventDoc](./event-doc.md) threads the single-type case through automatically — call this directly only for a multi-type store. |

## Examples

```typescript
import { defineEventDocSummary } from 'quidproquo-features';
import { defineEventDocRoutes } from 'quidproquo-features';

// One shared store, two document types served on different paths.
export default [
  ...defineEventDocSummary('content'),
  ...defineEventDocRoutes({ storeName: 'content', type: 'article', basePath: '/articles' }),
  ...defineEventDocRoutes({ storeName: 'content', type: 'page', basePath: '/pages' }),
];
```

```typescript
import { defineDynamicFunctions } from 'quidproquo-core';
import { defineEventDocRoutes, defineEventDocSummary, eventDocFunctionsName } from 'quidproquo-features';

// A shared store where "article" documents are snapshotted and "page" documents are not.
export default [
  ...defineEventDocSummary('content', { snapshotFunctions: { article: eventDocFunctionsName('content', 'article') } }),
  defineDynamicFunctions(eventDocFunctionsName('content', 'article'), '/entry/eventDocs::articleDefinition'),
  ...defineEventDocRoutes({ storeName: 'content', type: 'article', basePath: '/articles' }),
  ...defineEventDocRoutes({ storeName: 'content', type: 'page', basePath: '/pages' }),
];
```

## Related

- [defineEventDocRoutes](./event-doc-routes.md) — mounts the HTTP routes against a store declared here (one per type).
- [defineEventDoc](./event-doc.md) — declares this store *and* its routes together for the single-type case.
- [defineKeyValueStore](../core/key-value-store.md) / [defineStorageDrive](../core/storage-drive.md) — the core config settings this helper composes.
- **Reading the store from a custom story:** wrap data calls in `askEventDocProvideStore({ storeName, type }, ...)` (from quidproquo-features) so getters like [askEventDocGetById](../../actions/features/event-doc/ask-event-doc-get-by-id.md) resolve the right collection.
