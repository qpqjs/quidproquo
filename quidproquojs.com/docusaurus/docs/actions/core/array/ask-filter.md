---
title: askFilter
description: Keep only the items whose per-item story returns true.
---

# askFilter

Iterates an array and returns a new array containing only the items for which the per-item callback returns `true` — the async/story equivalent of `Array.prototype.filter`. Each item's callback is a generator, so the predicate can `yield*` other actions (look up a record, check permissions, etc.). Items are tested **sequentially**, in order.

- **Built from:** a plain `for` loop that `yield*`s the predicate for each item and keeps the item when it returns `true`.

```typescript
import { askFilter } from '@qpqjs/core';
import { askFileExists } from '@qpqjs/core';

export function* askKeepExistingFiles(filepaths: string[]) {
  // Keep only the paths that actually exist on the drive.
  const existing = yield* askFilter(filepaths, function* (filepath) {
    return yield* askFileExists('uploads', filepath);
  });

  return existing;
}
```

## Signature

```typescript
function* askFilter<T>(
  items: T[],
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<boolean>,
): AskResponse<T[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `items` | `T[]` | The array to iterate. |
| `askCallback` | `(item: T, index: number, srcArray: T[]) => AskResponse<boolean>` | A generator predicate called once per item. Receives the item, its zero-based index, and the source array. Return `true` to keep the item, `false` to drop it. |

## Returns

`T[]` — a new array holding the original items (not transformed) for which the predicate returned `true`, in their original order.

## Notes

- **Sequential.** Each predicate completes before the next item is tested. There is no parallel variant of `askFilter` — if you need concurrency, map with [askMapParallel](./ask-map-parallel.md) to produce a boolean per item, then filter with a plain synchronous check.

## Related

- [askMap](./ask-map.md) — transform every item instead of selecting a subset.
- [askArraySome](./ask-array-some.md) — stop early once any item's predicate returns `true`.
- [askReduce](./ask-reduce.md) — fold the array into a single value.
