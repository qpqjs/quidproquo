---
title: askStateMachineCreate
description: Create and start a persistent instance of a defined state machine, seeded with your data.
---

# askStateMachineCreate

Creates a new instance of a [state machine](../../config/xstate/state-machine.md), starts it at its initial state, and persists it under a given `id`. Use this to begin a durable workflow — an order, a subscription, an onboarding flow — that later stories will advance with [askStateMachineSendEvent](./ask-state-machine-send-event.md).

- **Action type:** `StateMachineActionType.Create`
- **On the runtime:** the processor builds the XState machine from your [defineStateMachine](../../config/xstate/state-machine.md) config, starts an actor, captures its **initial persisted snapshot**, merges `id` and that snapshot (under the machine's `stateField`, default `__machineState`) into your `item`, and upserts the whole record into the machine's backing key-value store. Any entry actions that fire on start run their mapped stories.

```typescript
import { askStateMachineCreate } from '@qpqjs/xstate';

export function* startOrder(orderId: string, customerId: string) {
  const order = yield* askStateMachineCreate('order', orderId, {
    customerId,
    total: 4200,
  });

  // order now includes id, your fields, and the initial machine snapshot
  return order;
}
```

## Signature

```typescript
function* askStateMachineCreate<T>(
  stateMachineName: string,
  id: string,
  item: T,
): AskResponse<T>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `stateMachineName` | `string` | Name of the machine to instantiate — must match a machine declared with [defineStateMachine](../../config/xstate/state-machine.md). |
| `id` | `string` | The unique id for this instance. It becomes the partition key of the row in the backing key-value store and the id you pass to every later state-machine action for this instance. |
| `item` | `T` | Your own instance data. It is stored alongside the machine snapshot; `id` and the snapshot field are added to it automatically. |

## Returns

`T` — the persisted entity: your `item`, plus an `id` property and the initial persisted XState snapshot under the machine's `stateField` (default `__machineState`). Read the human-readable current state with [askStateMachineGetState](./ask-state-machine-get-state.md) rather than parsing the snapshot yourself.

## Notes

- The instance starts at the machine's `initial` state. Entry actions declared on that state fire immediately, running their mapped stories with the new entity as the argument.
- Persistence rides on the machine's key-value store, so creating an instance is durable — it can be fetched and advanced by any later invocation.
- If no machine with `stateMachineName` exists in the deployed config, the action fails with `ErrorTypeEnum.NotFound`. Wrap the call in [askCatch](../core/system/ask-catch.md) if you want to handle that in-story.

## Related

- [defineStateMachine](../../config/xstate/state-machine.md) — declares the machine this instance is created from.
- [askStateMachineSendEvent](./ask-state-machine-send-event.md) — advance the instance by sending it an event.
- [askStateMachineGetState](./ask-state-machine-get-state.md) — read the instance's current state.
- [askStateMachineGet](./ask-state-machine-get.md) — fetch the full instance entity.
