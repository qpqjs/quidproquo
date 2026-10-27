---
title: askApplyTransientEventDocEvent
description: Declaratively apply an event-doc event into a never-saved transient group, dropped wholesale by key instead of persisted.
---

# askApplyTransientEventDocEvent

The never-saved sibling of [askApplyEventDocEvent](./ask-apply-event-doc-event.md): the story yields an `eventType` and its `data` under a `transientKey`, and the event lands in a transient group that is never persisted, only dropped wholesale by that key. It is the event-sourced way to represent observations that must not survive past their source, such as websocket progress messages, where dropping the key (usually a connection id) reverts the folded view reactively instead of leaving a stuck UI state behind.

- **Action type:** `EventDocActionType.ApplyTransientEvent`
- Transient applies are client-runtime-only by definition: a server "authors" them only via messages a client story processes, never a backend `ApplyTransientEvent` processor. An unbound or backend apply fails loudly, the same as an unbound `ApplyEvent`.
- The version stamped on the resulting event is not passed by the caller — the binding that applies it stamps its own configured schema version, the same as `askApplyEventDocEvent`.

```typescript
import { askApplyTransientEventDocEvent } from '@qpqjs/features';

export function* askZipReportProgress(connectionId: string, data: ZipProgressData) {
  yield* askApplyTransientEventDocEvent<ZipProgressEffect>(connectionId, ZipEffect.Progress, data);
}
```

## Signature

```typescript
function* askApplyTransientEventDocEvent<E extends Effect<string, any>>(
  transientKey: string,
  eventType: E['type'],
  data: E['payload'],
): AskResponse<void>;
```

Typed like [askApplyEventDocEvent](./ask-apply-event-doc-event.md): an event-doc event IS a special kind of effect (`Effect<type, data>`), so an action creator passes its effect type as `E` and gets `data` checked against it.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `transientKey` | `string` | Names the drop unit for this event, usually a websocket connection id. Dropping a key clears every event committed under it. |
| `eventType` | `E['type']` | The effect/event type discriminant, matched by the reducer that folds the document. |
| `data` | `E['payload']` | The typed domain data for the event, checked against `E`, opaque to this action itself. |

## Returns

`AskResponse<void>` — applying a transient event never returns a value; a binding that fails to apply it surfaces the failure as its own runtime's error state rather than throwing back through this call.

## Notes

- This is the contract only — it carries no default behavior on its own. In the event-doc workspace, the binding registered for a slot routes `ApplyTransientEvent` into that slot's transient group under `transientKey`; outside a workspace bind, calling it fails loudly.
- Transient events never influence the persistable log or validation: they are excluded from the log every save and validator reads, and are dropped wholesale by `transientKey` rather than removed one at a time.

## Related

- [askApplyEventDocEvent](./ask-apply-event-doc-event.md) — the persisted sibling this action mirrors.
