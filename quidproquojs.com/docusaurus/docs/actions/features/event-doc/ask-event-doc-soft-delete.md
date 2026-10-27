---
title: askEventDocSoftDelete
description: Soft-delete an event document by appending a DELETE event, keeping its versions and assets intact — and restore it with askEventDocRestore.
---

# askEventDocSoftDelete

Soft-deletes an event document by appending a reserved `DELETE` event to its log. `deletedAt` on the summary record is derived from that event by the fold (not written directly), and [askEventDocList](./ask-event-doc-list.md) hides the document by default once it's set. The document's versions and blob claims stay intact — nothing is destroyed. This is the **public** deletion path. Returns the updated [`EventDocSummary`](./ask-event-doc-get-by-id.md#the-summary-record).

- **Built from:** [askEventDocAppendServerEvent](./ask-event-doc-append-server-event.md) (appends the `DELETE` event) then [askEventDocGetByIdOrThrow](./ask-event-doc-get-by-id.md#askeventdocgetbyidorthrow) (re-reads the re-derived record). Requires the store context — call it inside `askEventDocProvideStore({ storeName, type }, ...)`.

```typescript
import { askEventDocSoftDelete } from '@qpqjs/features';

export function* archiveArticle(id: string, userId: string, schemaVersion: number) {
  const summary = yield* askEventDocSoftDelete(id, userId, schemaVersion);
  return summary; // deletedAt is now set
}
```

## Signature

```typescript
function* askEventDocSoftDelete(
  id: string,
  updatedBy: string,
  schemaVersion: number,
): AskResponse<EventDocSummary>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | Id of the document to soft-delete. |
| `updatedBy` | `string` | User id to record as having authored the `DELETE` event (used as both `userId` and `userDisplayName` on the event's actor). |
| `schemaVersion` | `number` | The schema version to stamp the `DELETE` event with, same as any other event — the fold rejects an event authored against an older schema than the log has already reached. |

## Returns

`EventDocSummary` — the re-derived record, with `deletedAt` set to the `DELETE` event's time.

## Notes

- The reserved `DELETE` validator (`requireNotDeleted`) rejects a `DELETE` on an already-deleted document — but rejection happens at fold time, not at append (see [askEventDocEventAppend](./ask-event-doc-event-append.md)), so calling this on an already-deleted document does not throw: the event is written, the fold silently skips it, and the re-derived summary comes back unchanged.
- Soft-deleted rows are still returned by [askEventDocGetById](./ask-event-doc-get-by-id.md) (filtering is the caller's concern) and by [askEventDocList](./ask-event-doc-list.md) only when `includeDeleted: true`.

---

## askEventDocRestore

Undoes a soft delete by appending a reserved `RESTORE` event. The `DELETE` event stays in the log — history is append-only, so the deletion remains auditable — but the fold stops treating the document as deleted from this point on: `deletedAt` is cleared on the re-derived summary record, and the document goes back into default (non-`includeDeleted`) listings. Everything else (versions, blob claims) is untouched, so the document comes back exactly as it was. Returns the updated `EventDocSummary`.

```typescript
import { askEventDocRestore } from '@qpqjs/features';

export function* unarchiveArticle(id: string, userId: string, schemaVersion: number) {
  const summary = yield* askEventDocRestore(id, userId, schemaVersion);
  return summary; // deletedAt is cleared
}
```

### Signature

```typescript
function* askEventDocRestore(
  id: string,
  updatedBy: string,
  schemaVersion: number,
): AskResponse<EventDocSummary>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | Id of the document to restore. |
| `updatedBy` | `string` | User id to record as having authored the `RESTORE` event. |
| `schemaVersion` | `number` | The schema version to stamp the `RESTORE` event with, for the same reason as `askEventDocSoftDelete`. |

**Returns** `EventDocSummary` — the re-derived record, with `deletedAt` cleared.

The reserved `RESTORE` validator (`requireDeleted`) rejects a `RESTORE` on a document that isn't currently deleted — again at fold time, not append, so calling this on a non-deleted document does not throw; it's a silent no-op. Requires the store context, built the same way as `askEventDocSoftDelete` above.

---

## askEventDocDelete

**Hard delete** — permanently removes the document's summary row from the store. This is for internal cleanup/admin only; the public lifecycle uses soft delete (above). It does not touch the event log or the asset bucket, so a hard delete of the summary alone leaves orphaned events/assets — use deliberately.

```typescript
function* askEventDocDelete(id: string): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | Id of the document whose summary row to delete. |

**Returns** `void`.

Requires the store context. Prefer `askEventDocSoftDelete` for anything user-facing.

## Related

- [askEventDocAppendServerEvent](./ask-event-doc-append-server-event.md) — appends the `DELETE`/`RESTORE` event both actions compose.
- [askEventDocEventAppend](./ask-event-doc-event-append.md) — the underlying append; explains why rejection is silent rather than thrown.
- [askEventDocGetByIdOrThrow](./ask-event-doc-get-by-id.md#askeventdocgetbyidorthrow) — reads the re-derived record back.
- [askEventDocList](./ask-event-doc-list.md) — hides soft-deleted documents by default.
- [askEventDocCreate](./ask-event-doc-create.md) — the create counterpart.
