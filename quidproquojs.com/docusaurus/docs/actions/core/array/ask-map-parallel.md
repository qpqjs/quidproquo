---
title: askMapParallel
description: Map an array to a new array, running every item's story concurrently.
---

# askMapParallel

Iterates an array and builds a new array from the result of a per-item callback, running **all items concurrently**. Like [askMap](./ask-map.md), each item's callback is a generator that can `yield*` other actions — but instead of waiting for one item to finish before starting the next, every item's story is advanced together and their actions are batched each tick. Use it when the per-item work is independent and you want it done as fast as possible.

- **Built from:** `askRunParallel`, which drives every item's story in lockstep and batches their pending actions into a single dispatch per step.

```typescript
import { askMapParallel } from '@qpqjs/core';
import { askKeyValueStoreGet } from '@qpqjs/core';

export function* askLoadUsers(userIds: string[]) {
  // Fetch every user record at the same time.
  const users = yield* askMapParallel(userIds, function* (userId) {
    return yield* askKeyValueStoreGet('users', userId);
  });

  return users;
}
```

## Signature

```typescript
function* askMapParallel<T, R>(
  items: T[],
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R>,
): AskResponse<R[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `items` | `T[]` | The array to iterate. |
| `askCallback` | `(item: T, index: number, srcArray: T[]) => AskResponse<R>` | A generator called once per item. Receives the item, its zero-based index, and the source array. All invocations run concurrently. |

## Returns

`R[]` — a new array of the callback's return values, in the same order as `items` (result order is preserved regardless of completion order).

## Notes

- **Unbounded concurrency.** Every item starts at once. This is ideal for a handful of independent lookups, but for large arrays it can flood downstream resources (rate limits, connection pools) — reach for [askMapParallelBatch](./ask-map-parallel-batch.md) to cap how many run at a time.
- Because all stories advance together, an item's callback must **not** depend on side effects from another item.
- This is the helper the event pipeline uses to process a batch of records concurrently — see [askProcessEvent](../event/ask-process-event.md).

## Related

- [askMap](./ask-map.md) — the sequential version (one item at a time, in order).
- [askMapParallelBatch](./ask-map-parallel-batch.md) — concurrency capped to a fixed batch size, with an optional delay between batches.
- [askFlatMapParallelBatch](./ask-flat-map-parallel-batch.md) — batched parallel map that flattens the results one level.
- [askProcessEvent](../event/ask-process-event.md) — the event pipeline that maps over records with this helper.
