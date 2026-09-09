---
title: askEventDocEventWrite
description: Low-level conditional write of a single event to a document's events store, keyed by its contiguous event id.
---

# askEventDocEventWrite

The low-level write primitive behind the event log. It persists one already-built [EventDocEvent](./ask-event-doc-event-append.md#eventdocevent) into the collection's events store, keyed by `pk = modelId` / `sk = eventId` (a contiguous integer — `INIT_STATE` is `0`, every later event is the previous head plus one). The write is **conditional** (`ifNotExists`), and that condition is the slot two concurrent writers race for: whichever append resolved the losing writer's `headEventId` first claims `headEventId + 1`, and the loser gets `Conflict` back.

Id assignment (advancing past a lost race), dedup, and domain validation all live one layer up in [askEventDocEventAppend](./ask-event-doc-event-append.md) (dedup and domain validation are decided later still, at fold time) — you almost always want that instead. Call this directly only when you are implementing your own append semantics.

- **Built from:** [askKeyValueStoreUpsertWithRetry](../../core/key-value-store/ask-key-value-store-upsert-with-retry.md) with `{ ifNotExists: true }`, plus [askEventDocResolveStore](./ask-event-doc-provide-store.md#askeventdocresolvestore) to find the events store name. Not a single action.
- **Requires the store context** — provide it via [askEventDocProvideStore](./ask-event-doc-provide-store.md) / [askEventDocProvideStoreFromGlobals](./ask-event-doc-provide-store.md#askeventdocprovidestorefromglobals).

```typescript
import { askEventDocEventWrite } from 'quidproquo-features';

export function* persistPrebuiltEvent(docId: string, event: EventDocEvent) {
  yield* askEventDocEventWrite(docId, event);
}
```

## Signature

```typescript
function* askEventDocEventWrite(modelId: string, event: EventDocEvent): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `modelId` | `string` | The document id — becomes the partition key (`pk`) of the stored event. |
| `event` | `EventDocEvent` | A fully-formed event, including `payload.metadata.eventId` — the contiguous id becomes the sort key (`sk`) and the slot that is claimed conditionally. |

## Returns

`AskResponse<void>` — the story resumes once the event is written.

## Notes

- The stored shape is `{ pk: modelId, sk: eventId, data: event }`; the `EventDocStoredEvent` mapping is the only place that knows the key layout, keeping the domain event free of storage concerns.
- Because the write is conditional, a slot already taken surfaces `KeyValueStoreUpsertErrorTypeEnum.Conflict`. [askEventDocEventAppend](./ask-event-doc-event-append.md) treats that as the expected outcome of losing a race for `headEventId + 1` — it catches the conflict and retries at the new head, up to a bounded number of laps, rather than treating it as a bug.

## Related

- [askEventDocEventAppend](./ask-event-doc-event-append.md) — the high-level append that resolves the next contiguous id and writes through this.
- [askEventDocEventList / EventListAll / EventLast](./ask-event-doc-event-list.md) — reading events back.
- [askKeyValueStoreUpsertWithRetry](../../core/key-value-store/ask-key-value-store-upsert-with-retry.md) — the underlying conditional upsert.
- [askEventDocProvideStore](./ask-event-doc-provide-store.md) — provides the required store context.
