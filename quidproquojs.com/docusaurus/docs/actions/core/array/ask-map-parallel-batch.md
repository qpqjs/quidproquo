---
title: askMapParallelBatch
description: Map an array with bounded concurrency — a fixed number of items run in parallel per batch.
---

# askMapParallelBatch

Iterates an array and builds a new array from the result of a per-item callback, running a **bounded number of items concurrently at a time**. The array is sliced into batches of `numBatch`; each batch runs fully in parallel (via [askMapParallel](./ask-map-parallel.md)), and only when a batch finishes does the next batch start. This is the safe middle ground between [askMap](./ask-map.md) (one at a time) and [askMapParallel](./ask-map-parallel.md) (all at once) — you get concurrency without overwhelming a rate-limited downstream.

- **Built from:** repeated calls to [askMapParallel](./ask-map-parallel.md) over successive slices of the array, with an optional [askPlatformDelay](../platform/ask-delay.md) between batches.

```typescript
import { askMapParallelBatch } from '@qpqjs/core';
import { askAiPrompt } from '@qpqjs/core';

const RENDER_BATCH = 5;

export function* askRenderContent(contentIds: string[]) {
  // Render at most 5 items at a time so we stay under the model rate limit.
  const renders = yield* askMapParallelBatch(
    contentIds,
    RENDER_BATCH,
    function* (contentId) {
      return yield* askAiPrompt('renderer', contentId, []);
    },
  );

  return renders;
}
```

## Signature

```typescript
function* askMapParallelBatch<T, R>(
  items: T[],
  numBatch: number,
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R>,
  delayAfterEachBatchMs?: number,
): AskResponse<R[]>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | — | The array to iterate. |
| `numBatch` | `number` | — | Batch size — the maximum number of items that run **concurrently** at once. The array is consumed `numBatch` items at a time; each slice runs in parallel and must finish before the next slice begins. Must be at least `1`; anything lower (including `NaN`) throws an `InvalidBatchSizeError` (code `notPositive`) rather than looping forever. |
| `askCallback` | `(item: T, index: number, srcArray: T[]) => AskResponse<R>` | — | A generator called once per item. Receives the item, its zero-based index in the **original** `items` array, and the original array itself (not the batch slice). |
| `delayAfterEachBatchMs` | `number` | `0` | Optional pause (in milliseconds) inserted **after every batch**, including the last. When greater than `0`, the helper `yield*`s [askPlatformDelay](../platform/ask-delay.md) between batches — useful for spacing out calls to a throttled service. |

## Returns

`R[]` — a new array of the callback's return values, in the same order as `items`.

## Notes

- **Bounded concurrency.** Peak in-flight work is `numBatch`, no matter how large `items` is.
- Items within a single batch must be independent of one another (same rule as [askMapParallel](./ask-map-parallel.md)). Across batches, later batches do run after earlier ones complete, so batch _n_ can observe batch _n − 1_'s side effects.
- `delayAfterEachBatchMs` fires after the final batch too, so a non-zero delay adds one extra wait at the end.

## Related

- [askMap](./ask-map.md) — fully sequential (one item at a time).
- [askMapParallel](./ask-map-parallel.md) — fully parallel (all items at once, unbounded).
- [askFlatMapParallelBatch](./ask-flat-map-parallel-batch.md) — the same batching, then flatten the results one level.
- [askPlatformDelay](../platform/ask-delay.md) — the delay yielded between batches.
