---
title: askEventDocGetByCode
description: Look up an event document by its stable business code — plus id-only and create-on-miss variants.
---

# askEventDocGetByCode

Finds the single non-deleted document in the current collection whose `code` matches — optionally scoped to an owner (matched on `createdBy`). The **code** is a document's stable business key (see [the event-document model](./ask-event-doc-get-by-id.md#the-event-document-model)); it is expected unique within the collection (and any owner scope), so this returns one record or `null`.

- **Built from:** [askEventDocList](./ask-event-doc-list.md) filtered in memory by `code` (there is no secondary index on `code`, and the dev key-value store can't query one anyway). Requires the store context — call it inside `askEventDocProvideStore({ storeName, type }, ...)`.

```typescript
import { askEventDocGetByCode } from '@qpqjs/features';

export function* findByCode(code: string) {
  const summary = yield* askEventDocGetByCode(code);
  return summary; // EventDocSummary | null
}
```

## Signature

```typescript
function* askEventDocGetByCode<T extends EventDocSummary = EventDocSummary>(
  code: string,
  ownerUserId?: string,
): AskResponse<Nullable<T>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `code` | `string` | The business code to match. |
| `ownerUserId` | `string` (optional) | When given, only documents whose `createdBy` equals this id are considered — scopes the code's uniqueness to one owner. Omit to search the whole collection. |

The generic `T` narrows to a collection-specific extension of [`EventDocSummary`](./ask-event-doc-get-by-id.md#the-summary-record); defaults to `EventDocSummary`.

## Returns

`EventDocSummary | null` — the single matching non-deleted record, or `null` when none match.

## Notes

- Because `code` is expected unique in scope, **more than one match is treated as a data-integrity error** and throws `ErrorTypeEnum.Conflict` (from @qpqjs/core) — it does not pick one arbitrarily.
- Soft-deleted documents are excluded (this filters via [askEventDocList](./ask-event-doc-list.md)'s default).

---

## askEventDocGetByCodeOrCreate

Returns the document with `code` (optionally owner-scoped), **creating it on first use** if none exists. Finds via `askEventDocGetByCode` (so >1 existing match is still a `Conflict`); on a miss it creates the document with the given `name`/`code`/`actor` via [askEventDocCreate](./ask-event-doc-create.md).

```typescript
function* askEventDocGetByCodeOrCreate(
  code: string,
  name: string,
  actor: EventDocEventActor,
  ownerUserId?: string,
): AskResponse<EventDocSummary>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `code` | `string` | The business code to find or create. |
| `name` | `string` | Name to give the document if it must be created. |
| `actor` | [`EventDocEventActor`](./ask-event-doc-create.md#eventdoceventactor) | Who to attribute the creation to (used only on a miss). |
| `ownerUserId` | `string` (optional) | Owner scope for both the lookup and the `createdBy` match. |

**Returns** `EventDocSummary` — the existing or newly created record. Requires the store context.

**Not concurrency-safe** — two simultaneous misses both create. Serialise (e.g. queue concurrency 1) or add a conditional create if callers can race.

## askEventDocGetIdByCode

A thin convenience over `askEventDocGetByCode` for callers that only need the document's `id` and no per-record policy.

```typescript
function* askEventDocGetIdByCode(
  code: string,
  ownerUserId?: string,
): AskResponse<Nullable<string>>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `code` | `string` | The business code to look up. |
| `ownerUserId` | `string` (optional) | Owner scope, as above. |

**Returns** `string | null` — the matching document's `id`, or `null` when none match. Inherits the same `Conflict`-on-duplicate behaviour as `askEventDocGetByCode`.

## Related

- [askEventDocGetById / askEventDocGetByIdOrThrow](./ask-event-doc-get-by-id.md) — read by generated id instead of business code.
- [askEventDocCreate](./ask-event-doc-create.md) — the create used on a miss by `askEventDocGetByCodeOrCreate`.
- [askEventDocList](./ask-event-doc-list.md) — the collection scan these filter over.
- [defineEventDocSummary](../../../config/features/event-doc-summary.md) — declares the store these read from.
