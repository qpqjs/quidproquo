---
title: askReduce
description: Fold an array into a single accumulated value, running a story per item.
---

# askReduce

Iterates an array and folds it into a single accumulated value — the async/story equivalent of `Array.prototype.reduce`. The per-item callback is a generator that receives the running accumulator and the current item and returns the next accumulator. Items are processed **sequentially**, in order, because each step feeds the next.

- **Built from:** a plain `for` loop that `yield*`s the callback for each item, threading the accumulator through.

```typescript
import { askReduce } from '@qpqjs/core';
import { askFileReadObjectJson } from '@qpqjs/core';

export function* askSumInvoiceTotals(invoiceIds: string[]) {
  // Read each invoice and accumulate its total into a running sum.
  const total = yield* askReduce(invoiceIds, 0, function* (acc, invoiceId) {
    const invoice = yield* askFileReadObjectJson('invoices', `${invoiceId}.json`);
    return acc + invoice.total;
  });

  return total;
}
```

## Signature

```typescript
function* askReduce<T, R>(
  items: T[],
  initialValue: R,
  askCallback: (acc: R, item: T, index: number, srcArray: T[]) => AskResponse<R>,
): AskResponse<R>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `items` | `T[]` | The array to fold. |
| `initialValue` | `R` | The starting accumulator value, passed to the callback for the first item. (Unlike `Array.prototype.reduce`, `initialValue` is required.) |
| `askCallback` | `(acc: R, item: T, index: number, srcArray: T[]) => AskResponse<R>` | A generator called once per item. Receives the running accumulator, the current item, its zero-based index, and the source array. Its return value becomes the accumulator for the next item. |

## Returns

`R` — the final accumulator after every item has been processed. If `items` is empty, `initialValue` is returned unchanged.

## Notes

- **Sequential and stateful.** Each step depends on the previous accumulator, so this helper is inherently ordered and has no parallel variant.

## Related

- [askMap](./ask-map.md) — transform each item into a new array (no accumulator).
- [askFilter](./ask-filter.md) — select a subset of items.
- [askArraySome](./ask-array-some.md) — short-circuit boolean test over the array.
