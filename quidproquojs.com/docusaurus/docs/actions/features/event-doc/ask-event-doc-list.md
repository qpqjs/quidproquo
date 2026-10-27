---
title: askEventDocList
description: List event documents in the current collection, newest-updated first, hiding soft-deleted rows by default — as a full array or one page at a time.
---

# Listing a collection

Two ways to list the summary records of a collection (all rows sharing the collection's `type`), sorted by `updatedAt` **descending** (most recently updated first). Soft-deleted documents are hidden unless you opt in. Both require the store context — call inside `askEventDocProvideStore({ storeName, type }, ...)`, or from a built-in route where the context is already provided.

## askEventDocList

Reads the **whole** collection into memory, filters and sorts it, and returns it as a flat array. Fine for a handful of documents; costs read capacity proportional to the whole collection, so it does not scale to a large collection — use [askEventDocListPage](#askeventdoclistpage) for that.

- **Built from:** a key-value store query over the collection's `type`, filtered and sorted in memory.

```typescript
import { askEventDocList } from '@qpqjs/features';

export function* listArticles() {
  const items = yield* askEventDocList(); // newest-updated first, deleted hidden
  return items;
}
```

### Signature

```typescript
function* askEventDocList<T extends EventDocSummary = EventDocSummary>(
  options?: EventDocListOptions,
): AskResponse<T[]>;
```

### Parameters

#### `options` — `EventDocListOptions` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `includeDeleted` | `boolean` | `false` | When `true`, soft-deleted documents (those with a `deletedAt`) are included in the result. When `false` (default), they are filtered out. |

The generic `T` lets callers narrow to a collection-specific extension of [`EventDocSummary`](./ask-event-doc-get-by-id.md#the-summary-record); it defaults to `EventDocSummary`.

### Returns

`EventDocSummary[]` — the collection's records, sorted by `updatedAt` descending. Empty array when the collection has no (visible) documents.

### Notes

- Ordering is applied in memory, but the summary store carries a `(type, updatedAt)` index so this stays efficient.
- Because there is no secondary index on `code`, the code-based reads ([askEventDocGetByCode](./ask-event-doc-get-by-code.md) and friends) list the collection via this action and filter in memory.

## askEventDocListPage

Reads **one page** of the collection straight off the store, newest first, without reading or holding the rest of the collection in memory. This is what the built-in `GET {basePath}` list route uses.

- **Built from:** [askKeyValueStoreQuery](../../core/key-value-store/ask-key-value-store-query.md) against the summary store, ordered by its `(type, updatedAt)` index (descending), with soft-deleted rows excluded by a query filter.

```typescript
import { askEventDocListPage } from '@qpqjs/features';

export function* listArticlesPage(nextPageKey?: string) {
  return yield* askEventDocListPage({ nextPageKey }); // QpqPagedData<EventDocSummary>
}
```

### Signature

```typescript
function* askEventDocListPage<T extends EventDocSummary = EventDocSummary>(
  options?: EventDocListPageOptions,
): AskResponse<QpqPagedData<T>>;
```

### Parameters

#### `options` — `EventDocListPageOptions` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `includeDeleted` | `boolean` | `false` | When `true`, soft-deleted documents are included. When `false` (default), they are excluded by a query filter. |
| `limit` | `number` | `10` | Maximum number of records to return in this page. |
| `nextPageKey` | `string` | — | Opaque cursor from a previous page's `nextPageKey`; pass it to fetch the following page. |

### Returns

`AskResponse<QpqPagedData<T>>` — `{ items: T[]; nextPageKey?: string }`, one page ordered by `updatedAt` descending.

### Notes

- Because the exclusion of soft-deleted rows is a query filter (applied **after** rows are read), a page can come back shorter than `limit` while more pages remain. Page on the presence of `nextPageKey`, never on item count, or documents past a short page are silently hidden.
- There is no jump-to-page-N or total count without reading the whole collection — the store hands back an opaque "continue from here" cursor, not an offset, so pages are walked rather than addressed.

## Related

- [askEventDocGetById / askEventDocGetByIdOrThrow](./ask-event-doc-get-by-id.md) — read a single document.
- [askEventDocGetByCode](./ask-event-doc-get-by-code.md) — find one document by its business `code`.
- [askEventDocSoftDelete](./ask-event-doc-soft-delete.md) — sets the `deletedAt` these actions filter on.
- [askKeyValueStoreQuery](../../core/key-value-store/ask-key-value-store-query.md) — the underlying paged query action.
- [defineEventDocSummary](../../../config/features/event-doc-summary.md) — declares the store (and its ordering index) these read from.
