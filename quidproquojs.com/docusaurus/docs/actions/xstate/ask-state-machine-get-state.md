---
title: askStateMachineGetState
description: Read the current state value of a state-machine instance and whether it has reached a final state.
---

# askStateMachineGetState

Reads the current state of a [state-machine](../../config/xstate/state-machine.md) instance — the state name and whether the machine has finished. This is the lightweight way to ask "what state is this instance in?" without pulling the raw snapshot.

- **Action type:** `StateMachineActionType.GetState`
- **On the runtime:** the processor loads the instance from the machine's backing key-value store, rehydrates an XState actor from the persisted snapshot (under the machine's `stateField`), reads the actor's current snapshot, and returns its state value and status. String state values are returned as-is; nested/parallel state values are JSON-stringified.

```typescript
import { askStateMachineGetState } from '@qpqjs/xstate';

export function* isOrderShipped(orderId: string) {
  const state = yield* askStateMachineGetState('order', orderId);

  if (state.done) {
    return `Order finished in state: ${state.value}`;
  }

  return `Order is currently: ${state.value}`;
}
```

## Signature

```typescript
function* askStateMachineGetState(
  stateMachineName: string,
  id: string,
): AskResponse<StateMachineStateInfo>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `stateMachineName` | `string` | Name of the machine — must match a machine declared with [defineStateMachine](../../config/xstate/state-machine.md). |
| `id` | `string` | The id of the instance to read. |

## Returns

`StateMachineStateInfo` — the current state of the instance.

```typescript
interface StateMachineStateInfo {
  value: string;   // the current state name (nested/parallel values are JSON-stringified)
  done: boolean;   // true once the machine has reached a final state
}
```

## Notes

- `done` is `true` when the XState actor's status is `'done'` — i.e. the machine has reached a `type: 'final'` state.
- Unlike [askStateMachineGet](./ask-state-machine-get.md), this action rehydrates the machine, so it reflects the actual computed state rather than the raw stored snapshot.
- Fails with `ErrorTypeEnum.NotFound` if the machine name is unknown, the instance does not exist, or the instance has no persisted snapshot on its `stateField`.

## Related

- [defineStateMachine](../../config/xstate/state-machine.md) — declares the machine and its states.
- [askStateMachineSendEvent](./ask-state-machine-send-event.md) — drive a transition that changes this state.
- [askStateMachineGet](./ask-state-machine-get.md) — fetch the full entity instead of just the state.
- [askStateMachineCreate](./ask-state-machine-create.md) — create the instance.
