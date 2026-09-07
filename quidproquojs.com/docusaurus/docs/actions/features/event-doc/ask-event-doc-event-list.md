---
title: askEventDocEventList
description: Read a document's event log — a page of events, the whole log flattened, or just the latest event.
---

# Reading the event log

Three read helpers over a document's event stream. All three resolve the collection's events store from the store context and query it by `pk = modelId`, ascending by event id (except `askEventDocEventLast`, which reads the tail). Event ids are the event's contiguous position in the log (`INIT_STATE` is `0`, every append is head + 1, claimed by a conditional write), so log order IS commit order and ascending-by-id and ascending-by-creation-time always agree. They are the read side of the event-sourcing core, feeding the fold that reconstructs a document from its events.

- **Requires the store context** — provide it via [askEventDocProvideStore](./ask-event-doc-provide-store.md) / [askEventDocProvideStoreFromGlobals](./ask-event-doc-provide-store.md#askeventdocprovidestorefromglobals).
- **Built from:** [askKeyValueStoreQuery](../../core/key-value-store/ask-key-value-store-query.md) against the events store, plus [askEventDocResolveStore](./ask-event-doc-provide-store.md#askeventdocresolvestore). Not single actions.

## askEventDocEventList

Returns one page of events for a document, oldest first. Supports paging and, via `afterEventId`, fetching only the tail since a known event — an incremental refresh.

```typescript
import { askEventDocEventList } from 'quidproquo-features';

export function* refreshSince(docId: string, lastSeenEventId: number) {
  const page = yield* askEventDocEventList(docId, { afterEventId: lastSeenEventId });
  return page.items; // events after lastSeenEventId
}
```

### Signature

```typescript
function* askEventDocEventList(
  modelId: string,
  options?: EventDocEventListOptions,
): AskResponse<QpqPagedData<EventDocEvent>>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `modelId` | `string` | The document id to read events for. |
| `options` | `EventDocEventListOptions` | Optional paging / range options — see below. |

#### `EventDocEventListOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | `number` | (store default) | Max number of events to return in the page. |
| `nextPageKey` | `string` | — | Continuation token from a previous page's `nextPageKey`. |
| `afterEventId` | `number` | — | Return only events whose event id is greater than this one (exclusive). A sort-key range condition on the events store's primary key — no GSI involved. |
| `upToEventId` | `number` | — | Return only events whose event id is less than or equal to this one (inclusive) — the log prefix up to a known event, for folding a document as of that event (a snapshot). Combinable with `afterEventId` for a bounded gap range. |
| `sortDescending` | `boolean` | `false` | Newest first, for a display read that walks backwards in time (e.g. a history panel's latest-page-then-load-older). Folding reads never set this — a fold consumes the log in order. |
| `consistentRead` | `boolean` | `false` | Strongly consistent read. Needed by a caller that just appended and is now folding to decide something — the default eventually-consistent read can otherwise miss that caller's own most recent event. Costs roughly double the read capacity, so leave it off for ordinary reads. |

### Returns

`AskResponse<QpqPagedData<EventDocEvent>>` — `{ items: EventDocEvent[]; nextPageKey?: string }`. Events are ordered ascending by event id (equivalently, creation order); `nextPageKey` is present when more events remain.

## askEventDocEventListAll

Pages through the **whole** log (ascending) and returns it as a flat array — the complete history a from-scratch fold needs. The append-time validator uses this; until state snapshots exist it re-reads the full log per validated append, so treat it as O(log length).

```typescript
import { askEventDocEventListAll } from 'quidproquo-features';

export function* fullHistory(docId: string) {
  return yield* askEventDocEventListAll(docId); // EventDocEvent[]
}
```

### Signature

```typescript
function* askEventDocEventListAll(
  modelId: string,
  options?: { consistentRead?: boolean; upToEventId?: string },
): AskResponse<EventDocEvent[]>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `modelId` | `string` | The document id to read the full log for. |
| `options.consistentRead` | `boolean` | Optional, default `false`. Strongly consistent read — for a caller that just appended and is now folding to decide something, so it does not miss its own most recent event. Leave off for ordinary reads; it doubles the read cost. |
| `options.upToEventId` | `string` | Optional. Return only the log prefix up to and including this event id — for folding a document as of a known event (a snapshot). |

### Returns

`AskResponse<EventDocEvent[]>` — every event for the document, ordered ascending by event id. Internally loops [askEventDocEventList](#askeventdoceventlist) until there is no `nextPageKey`.

## askEventDocEventLast

Returns the newest event in the log, or `null` if the document has no events. Relies on string sort-key ordering (a sortable event id's string form sorts lexicographically in creation order, and the dev server sorts string sort keys the same way DynamoDB does), so it returns the true latest.

```typescript
import { askEventDocEventLast } from 'quidproquo-features';

export function* currentVersion(docId: string) {
  const last = yield* askEventDocEventLast(docId);
  return last ? last.payload.metadata.version : 0;
}
```

### Signature

```typescript
function* askEventDocEventLast(modelId: string): AskResponse<Nullable<EventDocEvent>>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `modelId` | `string` | The document id to read the tail of. |

### Returns

`AskResponse<Nullable<EventDocEvent>>` — the latest [EventDocEvent](./ask-event-doc-event-append.md#eventdocevent), or `null` when the log is empty.

## Related

- [askEventDocEventAppend](./ask-event-doc-event-append.md) — the write side; uses `EventLast` and `EventListAll` internally.
- [askEventDocEventWrite](./ask-event-doc-event-write.md) — the low-level conditional write.
- [askEventDocProvideStore](./ask-event-doc-provide-store.md) — provides the store context these require.
- [askKeyValueStoreQuery](../../core/key-value-store/ask-key-value-store-query.md) — the underlying query action.
