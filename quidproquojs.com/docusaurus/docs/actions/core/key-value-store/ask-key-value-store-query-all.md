---
title: askKeyValueStoreQueryAll
description: Query a key-value store and collect every matching record across all pages into one array.
---

# askKeyValueStoreQueryAll

Runs [askKeyValueStoreQuery](./ask-key-value-store-query.md) repeatedly, following each page's `nextPageKey`, and returns **all** matching records as a single array. Use it when you want the whole result set and don't want to manage pagination yourself.

- **Built from:** loops [askKeyValueStoreQuery](./ask-key-value-store-query.md) until there are no more pages. It is a helper story, not a distinct action.

```typescript
import { askKeyValueStoreQueryAll, kvsEqual } from '@qpqjs/core';

interface Order {
  customerId: string;
  createdAt: number;
}

export function* askAllCustomerOrders(customerId: string) {
  const orders = yield* askKeyValueStoreQueryAll<Order>('orders', kvsEqual('customerId', customerId));
  return orders; // Order[]
}
```

## Signature

```typescript
function* askKeyValueStoreQueryAll<T>(
  keyValueStoreName: string,
  keyCondition: KvsQueryOperation,
  options?: Omit<KeyValueStoreQueryOptions, 'nextPageKey'>,
): AskResponse<T[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyValueStoreName` | `string` | Name of the store to query — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md). |
| `keyCondition` | `KvsQueryOperation` | The key condition — see [Query conditions](./ask-key-value-store-query.md#query-conditions-kvsqueryoperation). |
| `options` | `Omit<KeyValueStoreQueryOptions, 'nextPageKey'>` | The same query options as [askKeyValueStoreQuery](./ask-key-value-store-query.md#keyvaluestorequeryoptions) **except** `nextPageKey`, which the helper manages internally. `limit` here caps the size of each underlying page, not the total. |

## Returns

`T[]` — every record matching the key condition (and `filter`, if given), across all pages. Returns an empty array if nothing matches.

## Notes

- This loads the entire result set into memory. For very large result sets, prefer paging manually with [askKeyValueStoreQuery](./ask-key-value-store-query.md).
- Errors surface the same as the underlying query (`KeyValueStoreQueryErrorTypeEnum`); catch them with `askCatch`.

## Related

- [askKeyValueStoreQuery](./ask-key-value-store-query.md) — the single-page action this wraps.
- [askKeyValueStoreQuerySingle](./ask-key-value-store-query-single.md) — return just the first match.
- [askKeyValueStoreScanAll](./ask-key-value-store-scan-all.md) — the scan equivalent (no key condition).
- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store.
