---
title: askRunParallel
description: Run several stories concurrently and get a typed tuple of their results.
---

# askRunParallel

Runs a tuple of stories in parallel and returns their results as a matching tuple. On each step it collects every still-running story's next action and processes them together, so independent stories advance concurrently instead of one after another. This is the ergonomic, type-safe way to fan out work.

- **Built from:** [askBatch](./ask-batch.md) — it drives each story's generator and batches their outstanding actions on every step, feeding each result back into the right story.

```typescript
import { askRunParallel } from '@qpqjs/core';

export function* askLoadDashboard(userId: string) {
  const [profile, orders, settings] = yield* askRunParallel([
    askGetProfile(userId),
    askListOrders(userId),
    askGetSettings(userId),
  ]);

  return { profile, orders, settings };
}
```

## Signature

```typescript
function* askRunParallel<T extends Array<AskResponse<any>>>(
  storyRuntimes: [...T],
): AskResponse<{ [K in keyof T]: AskResponseReturnType<T[K]> }>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `storyRuntimes` | `[...T]` | A tuple of already-invoked stories (generators), e.g. `[askGetProfile(userId), askListOrders(userId)]`. Pass the stories **called** — not `[fn, ...args]` tuples. |

## Returns

A tuple of each story's return value, positionally matching the input: `{ [K in keyof T]: AskResponseReturnType<T[K]> }`. Because the mapping is over the input tuple, each result keeps its own precise type.

## `askRunParallel` vs. the `askBatch` action

They operate at different levels:

- [askBatch](./ask-batch.md) batches raw **actions** — the individual values a story yields.
- `askRunParallel` runs whole **stories**. It steps each generator and uses `askBatch` under the hood to process their actions together, so multi-action stories interleave correctly.

Reach for `askRunParallel` when you have several stories to run at once; reach for `askBatch` when you specifically have a list of independent actions.

## Notes

- Stories advance in lockstep by step count: each round processes one outstanding action per still-running story, repeating until all stories are done.
- A story with no actions simply returns immediately; it doesn't hold up the others.

## Related

- [askBatch](./ask-batch.md) — the action-level batching primitive this is built on.
- [askParallelDEPRECATED](./ask-parallel-deprecated.md) — the older, untyped predecessor (deprecated).
- [askCatch](./ask-catch.md) — wrap a parallel story to capture its errors as a value.
