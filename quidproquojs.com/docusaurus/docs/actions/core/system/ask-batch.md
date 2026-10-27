---
title: askBatch
description: Process an array of actions together in a single batch.
---

# askBatch

Yields an array of actions as one **batch** so the runtime processes them together rather than one at a time. The runtime runs the batched actions concurrently and resolves the whole batch before your story resumes, so this is how independent actions avoid paying a round-trip each.

- **Action type:** `SystemActionType.Batch`

```typescript
import { askBatch } from '@qpqjs/core';

export function* askLoadDashboard(userId: string) {
  // Both reads are dispatched together instead of sequentially.
  const [profile, settings] = yield* askBatch([
    askKvsGet('profiles', userId),
    askKvsGet('settings', userId),
  ]);

  return { profile, settings };
}
```

## Signature

```typescript
function* askBatch<TReturn extends Array<any> = any[]>(
  actions: Action<any>[],
): AskResponse<TReturn>;
```

`askBatch` takes raw actions, not stories. Each element is a single yielded action (for example the value produced by an action requester). For running whole sub-stories in parallel, use [askRunParallel](./ask-run-parallel.md), which is built on top of this.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `actions` | `Action<any>[]` | The actions to process together. Order is preserved: result index `i` corresponds to `actions[i]`. |

## Returns

`TReturn` — an array of results, one per input action, in the same order. Type it via the generic (e.g. `askBatch<[Profile, Settings]>([...])`) to get a typed tuple back.

## Notes

- An empty batch (`[]`) returns `[]` immediately without yielding anything, so it never touches the story log.
- A batch of exactly one action is short-circuited: the single action is yielded directly instead of being wrapped, so there is no batching overhead for the trivial case.
- On the JS/Node processor the batched actions run via `Promise.all` — they execute concurrently, so only use `askBatch` for actions that are independent of each other.
- If a batched action fails and is not individually protected by [askCatch](./ask-catch.md), the failure surfaces as the batch's error and propagates to your story. When wrapped in `askCatch`, failures come back per-action as `EitherActionResult` values instead.

## Related

- [askRunParallel](./ask-run-parallel.md) — run several **stories** (not raw actions) in parallel; it batches their actions for you.
- [askCatch](./ask-catch.md) — capture errors from batched actions as values.
