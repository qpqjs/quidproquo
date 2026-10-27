---
title: askStateDispatch
description: Dispatch an action (effect) into the surrounding reducer to update in-story state.
---

# askStateDispatch

Dispatches an action — an **effect** — into the state reducer that surrounds the story, Redux-style. The dispatch itself carries no return value; it exists to update the accumulated state, which you later read back with [askStateRead](./ask-state-read.md). What actually consumes the dispatch depends on the runtime: [askReduceState](./ask-reduce-state.md) captures it and runs it through your reducer, while the React `useQPQ` hooks forward it to a `React.Dispatch`.

- **Action type:** `StateActionType.Dispatch`

```typescript
import { askStateDispatch } from '@qpqjs/core';

// CounterEffects is your effect union, e.g. Effect<'counter/Add', number>
export function* askAddToCounter(amount: number) {
  yield* askStateDispatch<CounterEffects>({ type: 'counter/Add', payload: amount });
}
```

## Signature

```typescript
function* askStateDispatch<T>(action: T): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `action` | `T` | The action/effect to dispatch. In practice `T` is an [`Effect`](#effect-and-askstatedispatcheffect) — a `{ type, payload }` object — matching one of the cases your reducer handles. |

## Returns

`void` — a dispatch produces no value. It updates the surrounding state as a side effect; use [askStateRead](./ask-state-read.md) to observe the result.

## `Effect` and `askStateDispatchEffect`

An **effect** is the unit of state change dispatched here. It is just a typed, tagged payload:

```typescript
type Effect<TType extends string, TPayload = undefined> = {
  type: TType;
  payload: TPayload;
};
```

You typically model your effects as a union of `Effect<...>` types and give each a reducer case:

```typescript
import { Effect } from '@qpqjs/core';

type IncrementEffect = Effect<'counter/Increment'>;        // payload: undefined
type AddEffect = Effect<'counter/Add', number>;            // payload: number
type CounterEffects = IncrementEffect | AddEffect;
```

`askStateDispatchEffect` is a thin convenience wrapper over `askStateDispatch` that builds the `{ type, payload }` object for you from the type and payload arguments — handy for effects, especially payload-less ones:

```typescript
import { askStateDispatchEffect } from '@qpqjs/core';

export function* askBumpCounter() {
  yield* askStateDispatchEffect<IncrementEffect>('counter/Increment'); // payload defaults to undefined
  yield* askStateDispatchEffect<AddEffect>('counter/Add', 5);
}
```

Its signature is:

```typescript
function* askStateDispatchEffect<E extends Effect<any, any>>(
  type: E['type'],
  payload?: E['payload'],
): AskResponse<void>;
```

## Notes

- Dispatch is fire-and-forget from the story's point of view — there is no acknowledgement value, only the state mutation it triggers.
- When [askReduceState](./ask-reduce-state.md) surrounds the story and its reducer does **not** handle a dispatched effect, the effect bubbles outward to a parent `askReduceState` (or the outer runtime) instead of being silently dropped.

## Related

- [askStateRead](./ask-state-read.md) — read the state that dispatches accumulate into.
- [askReduceState](./ask-reduce-state.md) — run a story purely for its dispatched effects and return the reduced state.
- [defineStateDispatchOverWebsockets](../../../config/features/state-dispatch-over-websockets.md) — redirect these dispatches to a connected WebSocket client.
