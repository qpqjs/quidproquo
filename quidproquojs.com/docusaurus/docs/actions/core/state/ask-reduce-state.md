---
title: askReduceState
description: Run a story purely for its dispatched effects and return the reduced state.
---

# askReduceState

Runs an inner story purely for its state effects and returns the computed state. Every [askStateDispatch](./ask-state-dispatch.md) the inner story yields is captured here (it never reaches the outer runtime), fed through your `reducer`, and accumulated. Any [askStateRead](./ask-state-read.md) the story issues returns the current accumulated state. When the inner story finishes, `askReduceState` returns the final state. This is the pure-logic, backend counterpart to the React `useQPQ` reducer hooks: it lets any story run the same dispatch/read logic without a live State processor.

- **Built from:** `askOverrideActions` — it intercepts the inner story's `StateActionType.Dispatch` and `StateActionType.Read` actions, handling each with your `reducer` and the accumulated state instead of letting them bubble to the runtime.

```typescript
import {
  askReduceState,
  askStateDispatch,
  askStateDispatchEffect,
  askStateRead,
  buildMutableEffectReducer,
  Effect,
} from '@qpqjs/core';

// 1. Model the state and the effects that change it.
interface CounterState {
  count: number;
}

type IncrementEffect = Effect<'counter/Increment'>;
type AddEffect = Effect<'counter/Add', number>;
type CounterEffects = IncrementEffect | AddEffect;

// 2. Define a reducer: one handler per effect type.
const counterReducer = buildMutableEffectReducer<CounterState, CounterEffects>({
  'counter/Increment': (state) => {
    state.count += 1;
  },
  'counter/Add': (state, amount) => {
    state.count += amount;
  },
});

// 3. Write a story that dispatches effects (and can read state mid-flight).
function* countingLogic() {
  yield* askStateDispatch<CounterEffects>({ type: 'counter/Increment', payload: undefined });
  yield* askStateDispatchEffect<AddEffect>('counter/Add', 5);

  const soFar = yield* askStateRead<CounterState>();
  // soFar === { count: 6 }

  yield* askStateDispatch<CounterEffects>({ type: 'counter/Increment', payload: undefined });
}

// 4. Reduce the story into a final state.
export function* askComputeCount() {
  const finalState = yield* askReduceState<CounterState, CounterEffects>(
    { count: 0 },
    counterReducer,
    countingLogic,
  );

  return finalState.count; // 7
}
```

## Signature

```typescript
function* askReduceState<State, Effect>(
  initialState: State,
  reducer: QpqReducer<State, Effect>,
  story: () => AskResponse<void>,
): AskResponse<State>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `initialState` | `State` | The starting state. Dispatched effects are reduced onto this value. |
| `reducer` | `QpqReducer<State, Effect>` | A reducer that maps `(state, effect)` to `[nextState, handled]` — see [reducers](#reducers) below. Usually built with [`buildEffectReducer`](#buildeffectreducer--buildmutableeffectreducer) or `buildMutableEffectReducer`. |
| `story` | `() => AskResponse<void>` | A **factory** that returns the inner story to run. Its `askStateDispatch` / `askStateRead` actions are intercepted; every other action bubbles through to the outer runtime unchanged. |

## Returns

`State` — the accumulated state after the inner story runs to completion. Reads inside the story see the state as-of that point; the returned value is the final state.

## Reducers

A quidproquo reducer is a plain function that returns a tuple of `[nextState, handled]`:

```typescript
type QpqReducer<State, Effect> = (state: State, effect: Effect) => [State, boolean];
```

The second element, `handled`, is what makes effects composable: `true` means this reducer owned the effect and `nextState` is authoritative; `false` means it ignored the effect (and returned `state` unchanged). Inside `askReduceState`, an unhandled effect (`false`) is **relayed outward** — to a parent `askReduceState` or the runtime — rather than dropped, so nested reducers can each own their own slice of effects.

### `buildEffectReducer` / `buildMutableEffectReducer`

You rarely write the tuple by hand. Both helpers turn a map of `{ [effectType]: handler }` into a `QpqReducer`, returning `[handledState, true]` when a handler matches the effect's `type` and `[state, false]` otherwise:

- **`buildEffectReducer`** — handlers are **immutable**: each returns the next state. Good for simple, flat state.

  ```typescript
  const counterReducer = buildEffectReducer<CounterState, CounterEffects>({
    'counter/Increment': (state) => ({ ...state, count: state.count + 1 }),
    'counter/Add': (state, amount) => ({ ...state, count: state.count + amount }),
  });
  ```

- **`buildMutableEffectReducer`** — handlers **mutate a draft** and return nothing; it wraps them in [Immer](https://immerjs.github.io/immer/)'s `produce`, so you get immutable updates while writing imperative code. Best for deeply nested state.

  ```typescript
  const counterReducer = buildMutableEffectReducer<CounterState, CounterEffects>({
    'counter/Increment': (state) => { state.count += 1; },
    'counter/Add': (state, amount) => { state.count += amount; },
  });
  ```

In both, each handler receives `(state, payload)` — the effect's `payload` is passed directly, already narrowed to the type for that effect case.

### `combineQpqReducers`

Composes two reducers into one that handles the **union** of their effects. It tries the first reducer; if that returns `handled: true` it wins, otherwise the (possibly-updated) state is passed to the second:

```typescript
import { combineQpqReducers } from '@qpqjs/core';

const appReducer = combineQpqReducers(counterReducer, markReducer);
// handles CounterEffects | MarkEffects
```

Chain calls to combine more than two. The result is a `QpqReducer` you can pass straight to `askReduceState`.

## `replayEffects`

`askReduceState` reduces effects **live** as a story dispatches them. `replayEffects` is its synchronous, event-sourcing counterpart: given a stored **array** of effects, it reduces them into state with no story and no generator involved:

```typescript
import { replayEffects } from '@qpqjs/core';

const state = replayEffects({ count: 0 }, counterReducer, [
  { type: 'counter/Add', payload: 5 },
  { type: 'counter/Increment', payload: undefined },
]);
// { count: 6 }
```

Effects the reducer doesn't handle leave the state unchanged and are skipped. Use it to rebuild current state from a persisted effect log.

## Notes

- The inner story runs with **no live State runtime**: because every state action is captured here, a `story` that only dispatches/reads state completes synchronously (the generator finishes on the first `next()`).
- Non-state actions are **not** captured — they bubble to the outer runtime as normal, so a story can freely mix state dispatches with other actions like `askRandomNumber` or `askNetworkRequest`.
- `askReduceState` nests: an inner call owns its own state and reducer, and effects its reducer doesn't handle bubble up to the enclosing `askReduceState`. Reads always resolve against the nearest enclosing call's state.
- Dispatch and read outcomes are correctly shaped for `askCatch` (they wrap exactly once), so wrapping `askStateDispatch`/`askStateRead` in `askCatch` behaves as expected.

## Related

- [askStateDispatch](./ask-state-dispatch.md) — dispatch the effects this story reduces.
- [askStateRead](./ask-state-read.md) — read the accumulated state mid-story.
- [defineStateDispatchOverWebsockets](../../../config/features/state-dispatch-over-websockets.md) — stream reduced dispatches to a WebSocket client.
