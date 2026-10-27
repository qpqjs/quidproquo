---
title: askArraySome
description: Test whether any item's story returns true, short-circuiting on the first match.
---

# askArraySome

Iterates an array and returns `true` as soon as any item's callback returns `true` — the async/story equivalent of `Array.prototype.some`. The per-item callback is a generator, so the test can `yield*` other actions. Items are tested **sequentially**, and iteration **short-circuits**: the moment a callback returns `true`, `askArraySome` returns `true` without touching the remaining items. If none match, it returns `false`.

- **Built from:** a plain `for` loop that `yield*`s the predicate for each item and returns early on the first `true`.

```typescript
import { askArraySome } from '@qpqjs/core';
import { askFileExists } from '@qpqjs/core';

export function* askAnyFileMissing(filepaths: string[]) {
  // Returns true as soon as one path is missing; stops checking the rest.
  return yield* askArraySome(filepaths, function* (filepath) {
    const exists = yield* askFileExists('uploads', filepath);
    return !exists;
  });
}
```

## Signature

```typescript
function* askArraySome<T>(
  items: T[],
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<boolean>,
): AskResponse<boolean>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `items` | `T[]` | The array to test. |
| `askCallback` | `(item: T, index: number, srcArray: T[]) => AskResponse<boolean>` | A generator predicate called once per item, in order. Receives the item, its zero-based index, and the source array. Returning `true` stops iteration immediately. |

## Returns

`boolean` — `true` if the predicate returned `true` for any item, otherwise `false`. Returns `false` for an empty array.

## Notes

- **Short-circuits.** Because it stops at the first match, only the items up to and including the matching one have their callbacks run — handy when the test is expensive.
- **Sequential**, so items are tested one at a time in order.

## Related

- [askFilter](./ask-filter.md) — collect every matching item instead of a single boolean.
- [askMap](./ask-map.md) — transform each item into a new array.
- [askReduce](./ask-reduce.md) — fold the array into a single accumulated value.
