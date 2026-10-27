---
title: askOverrideActions
description: Intercept and override how selected actions are processed for a wrapped story.
---

# askOverrideActions

Runs a wrapped story while **intercepting** the actions it yields. For any action type you supply a handler for, `askOverrideActions` runs your handler instead of letting the runtime process the action; every other action passes through to the runtime unchanged. The wrapped story's return value is passed straight back out.

This is an advanced, low-level primitive. It is the mechanism [askContextProvideValue](../context/ask-context-provide-value.md) is built on — reach for that (or the other context helpers) for everyday needs, and use `askOverrideActions` directly only when you need to intercept arbitrary action types.

- **Built from:** a generator that sits between the story and the runtime, matching each yielded action against an override map and running the matching handler; it also cracks open [askBatch](./ask-batch.md) batches to apply overrides to the actions nested inside.

```typescript
import { askOverrideActions, MathActionType } from '@qpqjs/core';

export function* askWithFixedRandom(story: AskResponse<number>) {
  // Force every random-number action inside `story` to resolve to 0.42.
  return yield* askOverrideActions(story, {
    [MathActionType.RandomNumber]: function* (action) {
      return 0.42;
    },
  });
}
```

## Signature

```typescript
function* askOverrideActions<T extends AskResponse<any>>(
  storyIterator: T,
  overrides: ActionOverrideMap,
): AskResponse<AskResponseReturnType<T>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `storyIterator` | `AskResponse<...>` | The story whose actions you want to intercept. Its return value flows through unchanged. |
| `overrides` | `ActionOverrideMap` | A map from action type string to a handler. See below. |

### `ActionOverrideMap`

```typescript
type ActionOverrideHandler<TAction extends Action<any> = Action<any>, TResult = any> =
  (action: TAction) => AskResponse<TResult>;

type ActionOverrideMap = {
  [actionType: string]: ActionOverrideHandler<any, any>;
};
```

- **Keys** are action type strings — e.g. a `MathActionType.RandomNumber` value — or `'*'` for a wildcard catch-all.
- **Values** are handler stories (generators). A handler receives the intercepted `action` and returns the value the story should get back in place of that action's normal result. Because a handler is itself a story, it may `yield*` other actions.
- A specific type match takes priority over `'*'`; the wildcard is checked only when no specific handler matches. The `'*'` wildcard is **not** applied to the internal `Batch` action itself — batches are unwrapped so overrides apply to the actions inside them, not to the batch wrapper.

There are two ways to write a handler:

- **Relay** the action with `return yield action` — the value comes back from the parent already in the shape the story expects (raw, or an `EitherActionResult` when the action is running under [askCatch](./ask-catch.md)). Do not reshape it.
- **Compute** your own value and return it. If the intercepted action was running under `askCatch` (it carries `returnErrors: true`), a computed value must be shaped into `{ success: true, result }`; the exported helper `getSuccessfulEitherActionResultIfRequired(value, action.returnErrors)` does this for you.

## Returns

`AskResponseReturnType<T>` — the wrapped story's own return value, unchanged. Overriding actions inside a story does not change what the story ultimately returns.

## Notes

- **Batches are handled transparently.** When the story runs actions in parallel (via [askRunParallel](./ask-run-parallel.md) / [askBatch](./ask-batch.md)), the actions arrive bundled in a single batch. `askOverrideActions` opens the batch, applies overrides to each nested action (recursing into batches-within-batches), sends the remaining non-overridden actions to the runtime as a smaller batch, and reassembles the results in their original order.
- **Error protection is preserved.** Overridden and non-overridden actions still honour `returnErrors`: under `askCatch`, a failure comes back as `{ success: false, error }`; without it, the failure throws up to the story as normal.

## Related

- [askContextProvideValue](../context/ask-context-provide-value.md) — the higher-level context provider built on this primitive; prefer it for propagating values.
- [askContextRead](../context/ask-context-read.md) — reads context values that a provider injects.
- [askBatch](./ask-batch.md) / [askRunParallel](./ask-run-parallel.md) — produce the batches this function transparently unwraps.
