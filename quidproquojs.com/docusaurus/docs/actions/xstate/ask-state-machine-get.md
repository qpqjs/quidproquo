---
title: askStateMachineGet
description: Fetch the full persisted entity of a state-machine instance by id.
---

# askStateMachineGet

Fetches a [state-machine](../../config/xstate/state-machine.md) instance by its `id` and returns the whole persisted entity — your own data plus the stored machine snapshot. Use this when you need the instance's data fields; to read just the current state name, prefer [askStateMachineGetState](./ask-state-machine-get-state.md).

- **Action type:** `StateMachineActionType.Get`
- **On the runtime:** the processor reads the row keyed by `id` from the machine's backing key-value store and returns it verbatim. It does not rehydrate the XState actor, so the machine's `stateField` still holds the raw persisted snapshot.

```typescript
import { askStateMachineGet } from '@qpqjs/xstate';

interface Order {
  id: string;
  customerId: string;
  total: number;
}

export function* loadOrder(orderId: string) {
  const order = yield* askStateMachineGet<Order>('order', orderId);
  return order;
}
```

## Signature

```typescript
function* askStateMachineGet<T>(
  stateMachineName: string,
  id: string,
): AskResponse<T>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `stateMachineName` | `string` | Name of the machine — must match a machine declared with [defineStateMachine](../../config/xstate/state-machine.md). |
| `id` | `string` | The id of the instance to fetch. |

## Returns

`T` — the persisted entity: the `item` you created it with, plus its `id` and the persisted XState snapshot under the machine's `stateField` (default `__machineState`). To interpret the snapshot as a state name, call [askStateMachineGetState](./ask-state-machine-get-state.md).

## Notes

- Fails with `ErrorTypeEnum.NotFound` if the machine name is unknown, or if no instance with that `id` exists. Use [askCatch](../core/system/ask-catch.md) to handle a missing instance in-story.

## Related

- [defineStateMachine](../../config/xstate/state-machine.md) — declares the machine and its backing store.
- [askStateMachineGetState](./ask-state-machine-get-state.md) — read the current state name/done flag instead of the raw entity.
- [askStateMachineCreate](./ask-state-machine-create.md) — create the instance in the first place.
- [askStateMachineSendEvent](./ask-state-machine-send-event.md) — advance the instance.
