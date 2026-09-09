---
title: askEventDocCreate
description: Create an event-sourced document — seed its INIT_STATE event and derive the summary record.
---

# askEventDocCreate

Creates a new event document. It seeds the document's log with an `INIT_STATE` event carrying the document's identity (`id`, `code`, `name`), then derives the queryable **summary record** from that event and writes it — the same fold-and-upsert path every later append uses, so create and append can never drift. Returns the new [`EventDocSummary`](./ask-event-doc-get-by-id.md#the-summary-record).

- **Built from:** [askEventDocSeedInitState](#askeventdocseedinitstate) (writes the `INIT_STATE` event) then the summary reducer + [askEventDocUpsert](#askeventdocupsert) (persists the derived record). Requires the store context — call it inside `askEventDocProvideStore({ storeName, type }, ...)`, or from a built-in route where the context is already provided.

```typescript
import { askEventDocCreate } from 'quidproquo-features';

export function* createArticle(name: string, code: string) {
  const summary = yield* askEventDocCreate(name, code, {
    userId: 'user-123',
    userDisplayName: 'Ada Lovelace',
  });

  return summary; // EventDocSummary — id, code, name, versions: [...]
}
```

## Signature

```typescript
function* askEventDocCreate(
  name: string,
  code: string,
  actor: EventDocEventActor,
): AskResponse<EventDocSummary>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | Human-readable name for the document. Stored on the summary and editable later via a `SET_NAME` event. |
| `code` | `string` | The document's stable business **code** — a caller-chosen key (e.g. a slug or reference) that stays constant across versions, expected unique within the collection (and any owner scope). Editable later via a `SET_CODE` event. |
| `actor` | `EventDocEventActor` | Who is creating the document — recorded on the `INIT_STATE` event and as the record's `createdBy`/`updatedBy`. |

### `EventDocEventActor`

```typescript
type EventDocEventActor = {
  userId: string;         // stable, authoritative user key
  userDisplayName: string; // display-only snapshot, as it was at event time
};
```

A point-in-time snapshot of who produced an event, captured server-side at append time. Denormalised so history renders without a user lookup.

## Returns

`EventDocSummary` — the freshly derived summary record. Its `versions` array holds the first (draft) version pointer; `status` is `Draft`; `createdAt`/`updatedAt` are the `INIT_STATE` time.

## Notes

- The record is validated against `eventDocSummaryViewSchema` before it is written; a schema violation throws (`ErrorTypeEnum` from quidproquo-core).
- Not concurrency-safe against duplicate codes on its own. If two callers may create the same `code` at once, prefer [askEventDocGetByCodeOrCreate](./ask-event-doc-get-by-code.md#askeventdocgetbycodeorcreate) and serialise, or add a conditional create.

---

## askEventDocSeedInitState

Seeds a new document's log with its `INIT_STATE` event, carrying the identity (`id`/`code`/`name`). This is the create-only primitive `askEventDocCreate` composes; clients never send `INIT_STATE` themselves. It writes the event and returns it.

```typescript
function* askEventDocSeedInitState(
  modelId: string,
  code: string,
  name: string,
  actor: EventDocEventActor,
): AskResponse<EventDocEvent>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `modelId` | `string` | The new document's id (the log's partition). Usually a fresh GUID. |
| `code` | `string` | The document's business code (see above). |
| `name` | `string` | The document's name. |
| `actor` | `EventDocEventActor` | Who is creating the document. |

**Returns** `EventDocEvent` — the written `INIT_STATE` event, with `payload.metadata.eventId === 0` (the log's opening position) and `version === 1`.

Use `askEventDocCreate` unless you are building a custom create flow that needs the raw event; `askEventDocSeedInitState` alone writes the log but does **not** derive or persist the summary record.

## askEventDocUpsert

The bare storage write for a summary record — a thin wrapper over the key-value store upsert (with retry). Business rules and validation live in the logic layer (e.g. `askEventDocCreate`, [askEventDocSoftDelete](./ask-event-doc-soft-delete.md)); this just persists whatever record you hand it.

```typescript
function* askEventDocUpsert(view: EventDocSummaryView): AskResponse<void>;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `view` | `EventDocSummaryView` | The summary view to write (create or overwrite) — `type` is resolved from the store context and stamped on internally. |

**Returns** `void`.

Prefer the higher-level lifecycle actions over calling `askEventDocUpsert` directly — writing an un-derived record can put the summary out of sync with the event log.

## Related

- [askEventDocGetByCodeOrCreate](./ask-event-doc-get-by-code.md#askeventdocgetbycodeorcreate) — create-on-first-use built on top of this.
- [askEventDocGetById / askEventDocGetByIdOrThrow](./ask-event-doc-get-by-id.md) — read the record back.
- [askEventDocSoftDelete](./ask-event-doc-soft-delete.md) — retire a document.
- **Appending events after create:** `askEventDocEventAppend` (quidproquo-features) applies each later event through the same reducer.
- [defineEventDocSummary](../../../config/features/event-doc-summary.md) — declares the store this writes to.
- [askNewGuid](../../core/guid/ask-new-guid.md) / [askDateNow](../../core/date/ask-date-now.md) — the core actions the create path uses for id and timestamps.
