---
title: askEventDocEventAppend
description: Append a client-authored event to a document's log at the next contiguous position, validating it against the document's state and retrying under write contention.
---

# askEventDocEventAppend

Appends a single client-authored event to a document's ordered event stream — the write half of the event-sourcing core. The event's id is its **contiguous position** in the log (`INIT_STATE` is `0`, every append is head + 1), so log order IS commit order: a cursor "after N" is exact, and a snapshot "at N" holds exactly events `0..N`.

The append is **expected-version optimistic concurrency**: it resolves the log's current head with a consistent read (and, when `options.validate` is true and the collection has registered validation functions, the document state at that head), validates the event against that state, then writes it at `head + 1` with a **conditional** write. Two writers that resolved the same head race for that slot; exactly one wins, and the other gets back the namespaced Upsert `Conflict`. A losing lap does not start over — it folds only the handful of events that beat it onto the state it already holds, re-validates, and claims the new head + 1 — and retries up to a bounded number of times before giving up (see [Notes](#notes)).

**Validation against the resolved state happens here, at append time, when enabled.** Dedup (a repeated `clientMessageId`) and version monotonicity are still decided when the log is folded, against the accepted events before the one in question, and the fold's own acceptance rules remain in place as defence in depth. But the collection's registered `validateEvent` runs against the exact state the event will land on, before the write — the gate that stops a bad event from ever entering the log, not just from being read back. A collection with no registered validation functions (or a caller that passes `{ validate: false }`, e.g. trusted server-authored appends) skips the state resolve and the check, and behaves as write-and-go instead.

- **Built from:** `askDateNow`, `askEventDocAppendBaseResolve` / `askEventDocAppendBaseAdvance` (head + state resolution), `askEventDocValidateAppend`, `askEventDocEventWrite`, and `askRetry` (plus, when the collection configures `onPublish`/`onAppend`, `askEventDocGetByIdOrThrow`, `askEventDocHookStates`, and `askInlineFunctionExecute`). Not a single action.
- **Does not maintain the summary record itself.** The queryable summary is rebuilt from the log by the events store's stream projector ([`onStream`](../../../config/features/event-doc-summary.md)), so it is eventually (not immediately) consistent with a just-written event.
- **Requires the store context** — wrap the call in [askEventDocProvideStore](./ask-event-doc-provide-store.md) (custom routes) or [askEventDocProvideStoreFromGlobals](./ask-event-doc-provide-store.md#askeventdocprovidestorefromglobals) (built-in routes).

```typescript
import { askEventDocEventAppend } from 'quidproquo-features';

export function* appendTitleChange(docId: string) {
  const actor = yield* askEventDocResolveActor();

  const event = yield* askEventDocEventAppend(
    docId,
    {
      type: 'SET_NAME',
      payload: {
        data: { name: 'Q3 Report' },
        metadata: { version: 3, clientMessageId: yield* askNewGuid() },
      },
    },
    actor,
  );

  return event.payload.metadata.eventId;
}
```

## Signature

```typescript
function* askEventDocEventAppend(
  modelId: string,
  input: EventDocEventInput,
  actor: EventDocEventActor,
  options?: EventDocEventAppendOptions, // default { validate: true }
): AskResponse<EventDocEvent>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `modelId` | `string` | The document id whose log the event is appended to. The base resolve throws `NotFound` when the log has no head to append after — every real log opens with `INIT_STATE`, so a missing document (not an empty log) is what this catches. |
| `input` | `EventDocEventInput` | The client-authored event envelope — see below. |
| `actor` | `EventDocEventActor` | Who authored the event; stamped onto the event as `createdBy`. Usually obtained from [askEventDocResolveActor](./ask-event-doc-resolve-actor.md). |
| `options.validate` | `boolean` | Default `true`. Whether to resolve the document state at the append's head and run the collection's registered `validateEvent` before the write. The append route (the client trust boundary) leaves this on; [askEventDocAppendServerEvent](./ask-event-doc-append-server-event.md) passes `false` for trusted server-authored writes, since the fold remains their gate. |

### `EventDocEventInput`

What the client POSTs to append an event. `modelId` and the server-stamped provenance (`eventId`, `createdAt`, `createdBy`) are NOT part of it.

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | The effect/event type discriminant (e.g. `SET_NAME`). The reducer folds it by this. |
| `payload.data` | `T` | The typed domain data for the event. |
| `payload.metadata.version` | `number` | The schema version the client authored against. Expected `>=` the log's highest accepted version so far — the fold, not the append, silently skips an older one when it later folds the log. |
| `payload.metadata.clientMessageId` | `string` | A client-generated id used for dedup: the fold ignores a later event carrying a `clientMessageId` it has already accepted. The append itself does not check this — a retry is written as a new row in the log either way. |

### `EventDocEventActor`

| Property | Type | Description |
| --- | --- | --- |
| `userId` | `string` | The stable, authoritative user key. |
| `userDisplayName` | `string` | The display name captured at append time (denormalised so history renders without a user lookup). |

## Returns

`AskResponse<EventDocEvent>` — the event now durably written to the log at its claimed `eventId`, with server-stamped metadata (`eventId`, `createdAt`, `createdBy`) filled in. Passing pre-write validation does not exempt it from the fold's own rules — a fold may still skip it on a duplicate `clientMessageId` or a stale version.

### `EventDocEvent`

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | The event type discriminant. |
| `payload.data` | `T` | The typed domain data. |
| `payload.metadata` | `EventDocEventMetadata` | Full provenance: `version`, `clientMessageId`, `createdBy`, `createdAt`, and `eventId` (the event's contiguous position in the log — mirrors the storage sort key). |

## Notes

- **Dedup and version monotonicity are still decided at fold time**, against the accepted events before the one in question: a repeated `clientMessageId` is ignored, and an event whose version is older than the log's highest accepted version is ignored. The append does not check either.
- **Domain/lifecycle validation now runs at append time too, when enabled.** When `options.validate` is `true` and the collection has registered `validateEvent` functions, the event is checked against the document state at the head it will land on, before the write; a rejection throws `ErrorTypeEnum.Invalid` and nothing is written. A collection with no registered functions has nothing to validate with and falls back to write-and-go, same as `{ validate: false }`.
- **Write contention is expected and retried, not treated as a bug.** [askEventDocEventWrite](./ask-event-doc-event-write.md)'s conditional (`ifNotExists`) write is the slot two writers that resolved the same head race for; the loser gets `KeyValueStoreUpsertErrorTypeEnum.Conflict`, folds just the events that beat it onto the state it already holds, re-validates, and re-laps at the new head. Retries are bounded (`EVENT_DOC_APPEND_MAX_RETRIES`, with linear backoff and jitter); exhausting them throws `ErrorTypeEnum.Conflict` — sustained contention on one document means something is hammering it, not ordinary concurrent editing. Different documents are different partition keys and never contend with each other.
- **Log order is commit order.** Because the id is the log's next contiguous position rather than a value minted independently by each writer, `afterEventId` cursors and snapshot positions (`upToEventId`) are exact — no two events can claim the same position, and there is no "arbitrary but stable" ordering case to reason about.
- **Does not maintain the summary record.** The summary is rebuilt from the log by the events store's stream projector, so it lags a just-written event until the stream delivers.
- Hooks (`onPublish`/`onAppend`, when the collection configures them) run after the event is durably written and outside the retry loop; a hook failure propagates so the caller knows the side effect — not the append — failed.

## Related

- [askEventDocAppendServerEvent](./ask-event-doc-append-server-event.md) — the server-authored wrapper that builds the input envelope for you.
- [askApplyEventDocEvent](./ask-apply-event-doc-event.md) — a declarative, processor-dispatched alternative when the same verb must also run in a browser editor.
- [askEventDocEventWrite](./ask-event-doc-event-write.md) — the low-level conditional write this composes.
- [askEventDocEventList / EventListAll / EventLast](./ask-event-doc-event-list.md) — reading the log this appends to.
- [askEventDocProvideStore](./ask-event-doc-provide-store.md) — provides the store context this requires.
- [askEventDocResolveActor](./ask-event-doc-resolve-actor.md) — resolves the `actor` argument from the access token.
