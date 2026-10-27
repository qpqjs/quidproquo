---
title: askFlatMap
description: Map each item to an array, then flatten the results one level.
---

# askFlatMap

Iterates an array, maps each item to an array via the per-item callback, and concatenates all those arrays into one — the async/story equivalent of `Array.prototype.flatMap`. Each item's callback is a generator that returns an array, and the results are flattened one level. Items are processed **sequentially**, in order.

- **Built from:** [askMap](./ask-map.md) followed by a single-level `Array.prototype.flat()`.

```typescript
import { askFlatMap } from '@qpqjs/core';
import { askFileListDirectory } from '@qpqjs/core';

export function* askListAllFiles(directories: string[]) {
  // Map each directory to its file list, then flatten into one array.
  const allFiles = yield* askFlatMap(directories, function* (dir) {
    return yield* askFileListDirectory('uploads', dir);
  });

  return allFiles;
}
```

## Signature

```typescript
function* askFlatMap<T, R>(
  items: T[],
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R[]>,
): AskResponse<R[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `items` | `T[]` | The array to iterate. |
| `askCallback` | `(item: T, index: number, srcArray: T[]) => AskResponse<R[]>` | A generator called once per item. Receives the item, its zero-based index, and the source array, and returns an **array** of results. |

## Returns

`R[]` — the per-item arrays concatenated into a single array (flattened exactly one level), in order.

## Notes

- **Sequential**, because it builds on [askMap](./ask-map.md). For bounded concurrency plus flattening, use [askFlatMapParallelBatch](./ask-flat-map-parallel-batch.md).
- Only one level of nesting is removed; if a callback returns `R[][]`, the result is `R[][]`, not fully flattened.

## Related

- [askMap](./ask-map.md) — map without flattening (returns `R[][]` if callbacks return arrays).
- [askFlatMapParallelBatch](./ask-flat-map-parallel-batch.md) — the batched-parallel version of this helper.
- [askFilter](./ask-filter.md) — select a subset of items.
- [askReduce](./ask-reduce.md) — fold the array into a single value.
