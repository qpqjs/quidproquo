---
title: askEventDocAppendServerEvent
description: Append a server-authored event to a document's log, building the event envelope from a type, typed data, and version.
---

# askEventDocAppendServerEvent

Appends a **server-authored** event to a document's log. It is the backend analog of the editor's client-side action creators: callers pass the effect `type`, the typed `data`, and the schema `version`, and it builds the `EventDocEventInput` envelope (minting a fresh `clientMessageId` for dedup) before delegating to [askEventDocEventAppend](./ask-event-doc-event-append.md). Use it for the rarer case where the server itself authors an event — for example recording a generated secret or a rendered artifact — rather than a client POSTing one.

- **Built from:** `askNewGuid` + [askEventDocEventAppend](./ask-event-doc-event-append.md). Not a single action.
- **Requires the store context** — provide it via [askEventDocProvideStore](./ask-event-doc-provide-store.md) or [askEventDocProvideStoreFromGlobals](./ask-event-doc-provide-store.md#askeventdocprovidestorefromglobals).

```typescript
import { askEventDocAppendServerEvent } from 'quidproquo-features';

export function* recordGeneratedSecret(docId: string, secretRef: string) {
  const actor = yield* askEventDocResolveActor();

  return yield* askEventDocAppendServerEvent(
    docId,
    'SET_SECRET_REF',
    { secretRef },
    1, // schema version
    actor,
  );
}
```

## Signature

```typescript
function* askEventDocAppendServerEvent<T>(
  modelId: string,
  type: string,
  data: T,
  version: number,
  actor: EventDocEventActor,
): AskResponse<EventDocEvent>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `modelId` | `string` | The document id whose log the event is appended to. |
| `type` | `string` | The effect/event type discriminant to record. |
| `data` | `T` | The typed domain data for the event. |
| `version` | `number` | The schema version this event is authored against (see [askEventDocEventAppend](./ask-event-doc-event-append.md) for version rules). |
| `actor` | `EventDocEventActor` | Who the event is stamped as authored by — `{ userId, userDisplayName }`. Typically from [askEventDocResolveActor](./ask-event-doc-resolve-actor.md). |

## Returns

`AskResponse<EventDocEvent>` — the appended event with its server-stamped metadata (`eventId`, `createdAt`, `createdBy`, and the generated `clientMessageId`).

## Notes

- This is a thin envelope-building wrapper over [askEventDocEventAppend](./ask-event-doc-event-append.md), called with `{ validate: false }`: it still claims the next contiguous `eventId` with a conditional write and retries under slot contention, but it skips the pre-write state resolve and `validateEvent` check, trusting server code to author valid events. Version/lifecycle validation is decided later at fold time instead — a server event that a validator would reject is written but silently skipped by every fold.
- A fresh `clientMessageId` is generated on every call, so this path does not participate in client retry dedup — each call is a distinct intended event.

## Related

- [askEventDocEventAppend](./ask-event-doc-event-append.md) — the underlying append this wraps.
- [askEventDocWriteAsset](./ask-event-doc-generate-asset-upload-url.md#askeventdocwriteasset) — the server-side twin for writing asset bytes (often recorded by a server event).
- [askEventDocResolveActor](./ask-event-doc-resolve-actor.md) — resolves the `actor` argument.
- [askEventDocProvideStore](./ask-event-doc-provide-store.md) — provides the required store context.
