---
title: defineStateMachine
description: Define a persistent XState state machine — a named machine definition, backed by a key-value store, that stories drive with events over time.
---

# defineStateMachine

Defines a **state machine**: a named [XState](https://stately.ai/docs) machine definition plus the storage and side-effect wiring quidproquo needs to run it. Stories never construct an XState actor themselves — they create machine instances and drive them with events by name using the [State Machine action requesters](../../actions/xstate/ask-state-machine-create.md), and the runtime rehydrates, transitions, and re-persists the machine on every action.

Each instance is a row in a key-value store. Its current XState snapshot is serialized into a field on that row, so a machine created by one story can be advanced and read by later stories, requests, or events — the machine survives between invocations rather than living in memory.

- **On AWS:** `defineStateMachine` expands into **two** config settings — a key-value store named `qpq-sm-<machineName>` (keyed by `id`) and the state-machine setting itself. The key-value store deploys a DynamoDB table (see [defineKeyValueStore](../core/key-value-store.md)) partitioned by `id`; that table is where every instance and its persisted snapshot live. The machine definition itself is not deployed as any dedicated infrastructure — it is evaluated in-process by the action processors whenever an instance is created, read, or advanced.

```typescript
import { defineStateMachine } from '@qpqjs/xstate';

export default [
  defineStateMachine('order', {
    config: {
      id: 'order',
      initial: 'pending',
      states: {
        pending: {
          on: { PAY: 'paid', CANCEL: 'cancelled' },
        },
        paid: {
          on: { SHIP: 'shipped' },
        },
        shipped: { type: 'final' },
        cancelled: { type: 'final' },
      },
    },
  }),
];
```

## Signature

```typescript
function defineStateMachine(
  stateMachineName: string,
  options: QPQConfigAdvancedStateMachineSettings,
): QPQConfigSetting[];
```

`defineStateMachine` returns an **array** of config settings (the derived key-value store plus the state-machine setting). Spread it into your config export, or let the array flatten naturally.

## Parameters

### `stateMachineName` — `string` (required)

The name of the machine. This is the name you pass as the first argument to every state-machine action (e.g. `askStateMachineCreate('order', ...)`). It is also the setting's `uniqueKey`, and it derives the backing key-value store's name: `qpq-sm-<stateMachineName>`.

### `options` — `QPQConfigAdvancedStateMachineSettings` (required)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `config` | `MachineConfig<MachineContext, EventObject>` | – (required) | The XState machine definition — states, `initial`, and `on` transitions. This is passed straight to XState's `createMachine`. See [XState machine config](https://stately.ai/docs/machines). |
| `actions` | `StateMachineRuntimeMap` | `{}` | Maps XState action names (referenced from the `config`) to quidproquo stories that run as side effects when that action fires during a transition. See [Actions and guards](#actions-and-guards). |
| `guards` | `StateMachineRuntimeMap` | `{}` | Maps XState guard names (referenced from the `config`) to quidproquo stories that return a boolean, deciding whether a guarded transition is allowed. See [Actions and guards](#actions-and-guards). |
| `stateField` | `string` | `'__machineState'` | The property name under which the persisted XState snapshot is stored on each instance row. Change it only if it would collide with a field of your own data. |
| `owner` | `CrossModuleOwner` | – | Declares that the machine (and its backing store) is owned by another module/service, so this service references it rather than deploying its own. |

### `StateMachineRuntimeMap`

```typescript
interface StateMachineRuntimeMap {
  [name: string]: QpqFunctionRuntime;
}
```

Each value is a `QpqFunctionRuntime` — a reference to a story entry point, usually written as a relative path string in the form `'/path/to/file::exportedFunctionName'`.

## Actions and guards

XState `actions` and `guards` are named in your `config` but implemented as quidproquo stories:

- **Actions** are side effects. Whenever a transition (or the initial entry) fires an action named in your `config`, the runtime loads the mapped story and runs it. The story receives the current instance entity as its argument (and, for event-driven transitions, the triggering event as a second argument). Its result is not fed back into the machine.
- **Guards** decide whether a guarded transition may occur. Before an event is applied, the runtime runs **every** mapped guard story, passing `(entity, event)`, and uses each story's boolean result to answer the corresponding guard in the machine. Guards must be side-effect-light — they are evaluated up front to a plain boolean.

```typescript
import { defineStateMachine } from '@qpqjs/xstate';

export default [
  defineStateMachine('order', {
    config: {
      id: 'order',
      initial: 'pending',
      states: {
        pending: {
          on: {
            PAY: {
              target: 'paid',
              guard: 'hasValidPayment',
              actions: 'notifyWarehouse',
            },
          },
        },
        paid: { on: { SHIP: 'shipped' } },
        shipped: { type: 'final' },
      },
    },
    guards: {
      hasValidPayment: '/entry/order/hasValidPayment::hasValidPayment',
    },
    actions: {
      notifyWarehouse: '/entry/order/notifyWarehouse::notifyWarehouse',
    },
  }),
];
```

## How persistence works

There is no long-lived actor. Every state-machine action follows the same pattern:

1. Look up the machine's config by name and its backing key-value store (`qpq-sm-<name>`).
2. For reads and transitions, load the instance row by `id` and **rehydrate** a fresh XState actor from the snapshot stored under `stateField`.
3. Apply the operation (start, send event, read snapshot).
4. For create and send-event, serialize the new snapshot back onto the row (via `getPersistedSnapshot()`) and upsert it.

Because the snapshot is persisted with XState's own serialization, machine instances are durable across separate requests and deployments — the same instance can be advanced hours or days later.

## Examples

```typescript
import { defineStateMachine } from '@qpqjs/xstate';

export default [
  // Minimal machine — no side effects, default state field
  defineStateMachine('door', {
    config: {
      id: 'door',
      initial: 'closed',
      states: {
        closed: { on: { OPEN: 'open' } },
        open: { on: { CLOSE: 'closed' } },
      },
    },
  }),

  // Machine with guards, actions, and a custom state field
  defineStateMachine('subscription', {
    stateField: '__smSnapshot',
    config: {
      id: 'subscription',
      initial: 'trialing',
      states: {
        trialing: {
          on: { ACTIVATE: { target: 'active', guard: 'paymentOnFile' } },
        },
        active: {
          on: { CANCEL: { target: 'cancelled', actions: 'sendCancelEmail' } },
        },
        cancelled: { type: 'final' },
      },
    },
    guards: {
      paymentOnFile: '/entry/subscription/paymentOnFile::paymentOnFile',
    },
    actions: {
      sendCancelEmail: '/entry/subscription/sendCancelEmail::sendCancelEmail',
    },
  }),
];
```

## Driving an instance from a story

A single config plus the four actions is enough to create a durable instance and move it through its lifecycle across separate invocations:

```typescript
import { askGuidNew } from '@qpqjs/core';
import {
  askStateMachineCreate,
  askStateMachineSendEvent,
  askStateMachineGetState,
} from '@qpqjs/xstate';

export function* processOrder(customerId: string) {
  const orderId = yield* askGuidNew();

  // 1. Create — starts at the machine's initial state ('pending')
  yield* askStateMachineCreate('order', orderId, { customerId, total: 4200 });

  // 2. Send an event — drives the transition pending -> paid
  yield* askStateMachineSendEvent('order', orderId, { type: 'PAY' });

  // 3. Read the current state
  const state = yield* askStateMachineGetState('order', orderId);
  return { orderId, state: state.value, done: state.done }; // -> { state: 'paid', done: false }
}
```

Each action is a self-contained round-trip to the backing store — nothing is held in memory between them — so the same three steps could just as easily be three separate requests or events days apart.

## Related

- **Action requesters that drive this machine:** [askStateMachineCreate](../../actions/xstate/ask-state-machine-create.md), [askStateMachineGet](../../actions/xstate/ask-state-machine-get.md), [askStateMachineGetState](../../actions/xstate/ask-state-machine-get-state.md), [askStateMachineSendEvent](../../actions/xstate/ask-state-machine-send-event.md).
- [defineKeyValueStore](../core/key-value-store.md) — the store type `defineStateMachine` provisions under the hood to persist instances.
- **XState docs:** [Machines](https://stately.ai/docs/machines), [Actions](https://stately.ai/docs/actions), [Guards](https://stately.ai/docs/guards), [Persistence](https://stately.ai/docs/persistence).
