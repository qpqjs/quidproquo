---
title: askEventDocGetById
description: Read an event document's summary record by id — nullable, or a load-or-throw variant.
---

# askEventDocGetById

Reads one event document's **summary record** by `id` and returns it, or `null` if no document with that id exists in the current collection. Soft-deleted rows are returned as-is — filtering deleted documents is the caller's concern.

- **Built from:** a single-item key-value store query scoped to the collection's `type` + `id`. Requires the store context — call it inside `askEventDocProvideStore({ storeName, type }, ...)`, or from a built-in route where the context is already provided.

```typescript
import { askEventDocGetById } from 'quidproquo-features';

export function* loadArticle(id: string) {
  const summary = yield* askEventDocGetById(id);
  if (!summary) {
    return null; // not found
  }
  return summary;
}
```

## The event-document model

An event document is never stored as a mutable blob. Its authoritative state is an **append-only log of events**; the document you read is *derived by folding that log*.

- **Summary record** ([`EventDocSummary`](#the-summary-record)) — the queryable projection folded from the log's identity/lifecycle events (`INIT_STATE`, `SET_CODE`, `SET_NAME`, `PUBLISH`, `DELETE`, `RESTORE`, …). It holds identity (`id`, `code`, `name`), audit fields, and a `versions` array. Every field on it is derived from the log — including `deletedAt`, set and cleared by `DELETE`/`RESTORE` events rather than written directly — so the whole record can be dropped and rebuilt from the log at any time. The document's editable **content** is folded separately (on the client) from the same log; the backend never reduces content.
- **Draft vs published** — the tail (highest) version with no `publishedAt` is the **draft**; a `PUBLISH` event freezes it and starts the next draft. Each version pointer records the `eventId` (its contiguous position in the log) of its last event (its head), so folding events whose `eventId` is at or before that head reconstructs the version's content as it was. `publishedAt` is when a version was published; `effectiveFrom` is when that publish takes effect (used for as-of time-travel).
- **Code** — the caller-chosen, stable business key set at create (via `INIT_STATE`) and editable with `SET_CODE`. It stays constant across versions and is expected unique within the collection (and any owner scope), so you can address a document by `code` instead of its generated `id`.

The version-pointer reads ([askEventDocGetDraft, askEventDocGetLatestPublished, askEventDocGetPublishedAsOf, askEventDocPublishedVersionAsOf](./ask-event-doc-get-draft.md)) resolve entries in this model.

### The summary record

```typescript
type EventDocSummary = {
  type: string;
  id: string;
  code: string;
  name: string;
  createdAt: string;   // ISO datetime
  updatedAt: string;   // ISO datetime
  deletedAt?: string;  // derived from a DELETE event; cleared by RESTORE
  createdBy: string;
  updatedBy: string;
  versions: EventDocVersion[];
};

type EventDocVersion = {
  version: number;
  eventId: number;       // log id of this version's head event
  publishedAt?: string;  // unset while it is the tail draft
  effectiveFrom?: string; // when the publish takes effect (as-of selection)
};
```

## Signature

```typescript
function* askEventDocGetById<T extends EventDocSummary = EventDocSummary>(
  id: string,
): AskResponse<Nullable<T>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | Id of the document to read. |

The generic `T` lets callers narrow to a collection-specific extension of `EventDocSummary`; it defaults to `EventDocSummary`.

## Returns

`EventDocSummary | null` — the record, or `null` when no document with that id exists in the collection. Soft-deleted records are returned (not filtered).

---

## askEventDocGetByIdOrThrow

Loads the summary record for `id`, throwing `ErrorTypeEnum.NotFound` (from quidproquo-core) instead of returning `null` when it does not exist. Use this in write flows where a missing document is an error.

```typescript
function* askEventDocGetByIdOrThrow(id: string): AskResponse<EventDocSummary>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | Id of the document to load. |

**Returns** `EventDocSummary` — always a record; throws `NotFound` otherwise. Requires the store context.

```typescript
import { askEventDocGetByIdOrThrow } from 'quidproquo-features';

export function* renameArticle(id: string) {
  const summary = yield* askEventDocGetByIdOrThrow(id); // throws NotFound if absent
  return summary;
}
```

Catch the throw with [askCatch](../../core/system/ask-catch.md) if you want to handle "not found" without an exception:

```typescript
const outcome = yield* askCatch(askEventDocGetByIdOrThrow(id));
if (outcome.success) {
  // outcome.result — the EventDocSummary
} else {
  // outcome.error.errorType === ErrorTypeEnum.NotFound
}
```

## Related

- [askEventDocList](./ask-event-doc-list.md) — read every document in the collection.
- [askEventDocGetByCode](./ask-event-doc-get-by-code.md) — look a document up by its business `code` instead of `id`.
- [askEventDocGetDraft / …LatestPublished / …PublishedAsOf / …PublishedEventsAsOf](./ask-event-doc-get-draft.md) — resolve a document's versions.
- [askEventDocCreate](./ask-event-doc-create.md) — create a document. [askEventDocSoftDelete / askEventDocRestore](./ask-event-doc-soft-delete.md) — retire a document, or bring it back.
- [defineEventDocSummary](../../../config/features/event-doc-summary.md) — declares the store these read from.
- [askCatch](../../core/system/ask-catch.md) — handle thrown errors as a result object.
