---
title: askFlatMapParallelBatch
description: Batched-parallel map to arrays, then flatten the results one level.
---

# askFlatMapParallelBatch

Iterates an array with **bounded concurrency**, maps each item to an array via the per-item callback, and concatenates all those arrays into one. It is [askMapParallelBatch](./ask-map-parallel-batch.md) with a flatten on the end — items run `numBatch` at a time, batch by batch, and each callback returns an array whose elements are merged into the final result. Use it when each item expands into several results and you need to cap concurrency against a downstream resource.

- **Built from:** [askMapParallelBatch](./ask-map-parallel-batch.md) followed by a single-level `Array.prototype.flat()`.

```typescript
import { askFlatMapParallelBatch } from '@qpqjs/core';
import { askAiPrompt } from '@qpqjs/core';

const EXPAND_BATCH = 4;

export function* askExpandPrompts(prompts: string[]) {
  // Expand at most 4 prompts at a time; each returns several variations,
  // all flattened into one array.
  const variations = yield* askFlatMapParallelBatch(
    prompts,
    EXPAND_BATCH,
    function* (prompt) {
      const result = yield* askAiPrompt('expander', prompt, []);
      return result.split('\n');
    },
  );

  return variations;
}
```

## Signature

```typescript
function* askFlatMapParallelBatch<T, R>(
  items: T[],
  numBatch: number,
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R[]>,
  delayAfterEachBatchMs?: number,
): AskResponse<R[]>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | — | The array to iterate. |
| `numBatch` | `number` | — | Batch size — the maximum number of items that run **concurrently** at once. Must be at least `1`; anything lower (including `NaN`) throws an `InvalidBatchSizeError` (code `notPositive`). |
| `askCallback` | `(item: T, index: number, srcArray: T[]) => AskResponse<R[]>` | — | A generator called once per item. Receives the item, its zero-based index, and the source array, and returns an **array** of results. |
| `delayAfterEachBatchMs` | `number` | `0` | Optional pause (in milliseconds) inserted after every batch, including the last — passed straight through to [askMapParallelBatch](./ask-map-parallel-batch.md). |

## Returns

`R[]` — the per-item arrays concatenated into a single array (flattened exactly one level), in order.

## Notes

- **Bounded concurrency**, same as [askMapParallelBatch](./ask-map-parallel-batch.md): peak in-flight work is `numBatch`.
- Only one level of nesting is removed.

## Related

- [askFlatMap](./ask-flat-map.md) — the sequential version (one item at a time).
- [askMapParallelBatch](./ask-map-parallel-batch.md) — batched-parallel map without flattening.
- [askMapParallel](./ask-map-parallel.md) — unbounded parallel map.
- [askPlatformDelay](../platform/ask-delay.md) — the delay yielded between batches.
