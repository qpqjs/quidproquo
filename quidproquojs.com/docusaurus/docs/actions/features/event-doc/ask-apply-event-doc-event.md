---
title: askApplyEventDocEvent
description: Declaratively apply an event-doc event, leaving HOW it is applied (optimistic UI append, direct server append, ...) to a registered processor.
---

# askApplyEventDocEvent

A **purely declarative** way to apply an event-doc event: the story yields an `eventType` and its `data`, and a registered processor decides how that turns into an actual write — for example an optimistic local append followed by a POST in a browser editor, or a direct [askEventDocEventAppend](./ask-event-doc-event-append.md) on the backend. Because it has no side effect of its own, verbs written in terms of it (like a domain's `askXSetY` action creators) run unchanged wherever a processor for it is registered — backend, tests, or transforms.

- **Action type:** `EventDocActionType.ApplyEvent`
- **@qpqjs/features ships no default processor** for this action. Each consumer registers the implementation that fits its runtime via `defineActionProcessors`. Calling it with no processor registered fails the same way any unhandled action type does.
- The version stamped on the resulting event is not passed by the caller — the registered processor (the "editor") stamps its own configured schema version and provenance when it applies the event.

```typescript
import { askApplyEventDocEvent } from '@qpqjs/features';

export function* askTenantSetBrand(data: TenantSetBrandData) {
  yield* askApplyEventDocEvent<SetBrandEffect>(TenantEffect.setBrand, data);
}
```

## Signature

```typescript
function* askApplyEventDocEvent<E extends Effect<string, any>>(eventType: E['type'], data: E['payload']): AskResponse<void>;
```

Typed like [askStateDispatchEffect](../../core/state/ask-state-dispatch.md#effect-and-askstatedispatcheffect): an event-doc event IS a special kind of effect (`Effect<type, data>`), so an action creator passes its effect type as `E` and gets `data` checked against it.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `eventType` | `E['type']` | The effect/event type discriminant, matched by the reducer that folds the document and by the registered processor. |
| `data` | `E['payload']` | The typed domain data for the event, checked against `E`, opaque to this action itself. |

## Returns

`AskResponse<void>` — applying an event never returns a value; a processor that fails to apply it surfaces the failure as its own runtime's error state (e.g. UI error state in a browser processor) rather than throwing back through this call.

## Notes

- This is the contract only — it carries no default behavior. A service that yields it must also register a processor for `EventDocActionType.ApplyEvent` (via `defineActionProcessors`) appropriate to where the story runs.
- Prefer this over calling [askEventDocEventAppend](./ask-event-doc-event-append.md) directly when you want the same verb (e.g. a domain's action creator) to work identically in a browser editor with optimistic updates and on the backend with a direct append.

## Related

- [askEventDocEventAppend](./ask-event-doc-event-append.md) — the store-backed backend append a processor for this action typically delegates to.
- [askEventDocAppendServerEvent](./ask-event-doc-append-server-event.md) — builds a server-authored event envelope; a natural implementation for a backend `ApplyEvent` processor.
