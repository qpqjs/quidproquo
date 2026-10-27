---
title: askStateMachineSendEvent
description: Send an event to a state-machine instance to drive a transition, run its guards and actions, and persist the new state.
---

# askStateMachineSendEvent

Sends an event to a [state-machine](../../config/xstate/state-machine.md) instance, driving a transition. The runtime rehydrates the instance, evaluates its guards, applies the event, runs any side-effect actions, and persists the new state. This is how a durable workflow moves forward over time.

- **Action type:** `StateMachineActionType.SendEvent`
- **On the runtime:** the processor loads the instance from the backing key-value store, runs **every** configured guard story with `(entity, event)` to resolve each guard to a boolean, and rehydrates the XState actor from the persisted snapshot. It then asks XState whether the current state can take the event (with the resolved guard outcomes); if not, it fails with `BadRequest`. Otherwise it sends the event, persists the new snapshot, and runs the stories mapped to any actions that fired during the transition, passing `(entity, event)`.

```typescript
import { askStateMachineSendEvent } from '@qpqjs/xstate';

export function* payOrder(orderId: string, paymentRef: string) {
  const order = yield* askStateMachineSendEvent('order', orderId, {
    type: 'PAY',
    paymentRef,
  });

  return order; // the updated, re-persisted entity
}
```

## Signature

```typescript
function* askStateMachineSendEvent<T>(
  stateMachineName: string,
  id: string,
  event: StateMachineEvent,
): AskResponse<T>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `stateMachineName` | `string` | Name of the machine — must match a machine declared with [defineStateMachine](../../config/xstate/state-machine.md). |
| `id` | `string` | The id of the instance to advance. |
| `event` | `StateMachineEvent` | The event to send. Its `type` selects the transition; any extra fields are payload passed through to guard and action stories. |

### `StateMachineEvent`

```typescript
type StateMachineEvent = {
  type: string;           // the XState event name (e.g. 'PAY', 'CANCEL')
  [key: string]: unknown; // optional payload available to guards and actions
};
```

## Returns

`T` — the updated, re-persisted entity, with the new machine snapshot stored under the machine's `stateField`. Read the resulting state name with [askStateMachineGetState](./ask-state-machine-get-state.md).

## Notes

- **Guards run first, and all of them.** Before the event is applied, every guard story configured on the machine is executed with `(entity, event)` and reduced to a boolean, then fed to XState. Keep guard stories side-effect-light.
- **Actions run after the transition is persisted.** Each XState action that fires during the transition runs its mapped story with `(entity, event)`; a story error aborts the action with that error.
- **Invalid events fail.** If the current state cannot take the event (no matching transition, its guard resolved false, or the machine has already reached a final state), the action fails with `ErrorTypeEnum.BadRequest` (`Event '<type>' is not valid for current state '<state>'`). Self and internal transitions that keep the same state value are valid and run their actions as normal.
- Fails with `ErrorTypeEnum.NotFound` if the machine name is unknown or the instance does not exist. Guard/action story errors and the persistence upsert error propagate with their own error types. Use [askCatch](../core/system/ask-catch.md) to handle these in-story.

## Related

- [defineStateMachine](../../config/xstate/state-machine.md) — declares the machine, its transitions, guards, and actions.
- [askStateMachineGetState](./ask-state-machine-get-state.md) — read the state the event moved the instance into.
- [askStateMachineCreate](./ask-state-machine-create.md) — create the instance before sending events.
- [askStateMachineGet](./ask-state-machine-get.md) — fetch the full instance entity.
