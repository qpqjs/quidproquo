---
title: askMap
description: Map an array to a new array, running a story per item, one at a time.
---

# askMap

Iterates an array and builds a new array from the result of a per-item callback — the async/story equivalent of `Array.prototype.map`. Each item's callback is itself a generator, so it can `yield*` other actions (read a record, call an API, etc.). Items are processed **sequentially**, one after another, in order.

- **Built from:** a plain `for` loop that `yield*`s the callback for each item and collects the results.

```typescript
import { askMap } from '@qpqjs/core';
import { askFileReadTextContents } from '@qpqjs/core';

export function* askLoadTemplates(filepaths: string[]) {
  // Read each template in turn and return the array of contents.
  const contents = yield* askMap(filepaths, function* (filepath) {
    return yield* askFileReadTextContents('templates', filepath);
  });

  return contents;
}
```

## Signature

```typescript
function* askMap<T, R>(
  items: T[],
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R>,
): AskResponse<R[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `items` | `T[]` | The array to iterate. |
| `askCallback` | `(item: T, index: number, srcArray: T[]) => AskResponse<R>` | A generator called once per item. Receives the item, its zero-based index, and the source array. Whatever it returns becomes the corresponding element of the result array. |

## Returns

`R[]` — a new array of the callback's return values, in the same order as `items`.

## Notes

- **Sequential.** Each callback fully completes before the next item starts, so item _n_ can observe side effects of item _n − 1_. Use this when order matters or when you must not overwhelm a downstream resource.
- For concurrency, use [askMapParallel](./ask-map-parallel.md) (all items at once) or [askMapParallelBatch](./ask-map-parallel-batch.md) (a bounded number at a time).

## Related

- [askMapParallel](./ask-map-parallel.md) — the same mapping, but every item runs concurrently.
- [askMapParallelBatch](./ask-map-parallel-batch.md) — concurrency capped to a fixed batch size.
- [askFilter](./ask-filter.md) — keep only items whose story returns `true`.
- [askFlatMap](./ask-flat-map.md) — map to arrays, then flatten one level.
- [askReduce](./ask-reduce.md) — fold the array into a single accumulated value.
- [askArraySome](./ask-array-some.md) — stop early once any item's story returns `true`.
