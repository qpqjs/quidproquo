---
title: askKeyValueStoreQuery
description: Query a page of records from a key-value store by a key condition, with optional filtering, ordering, and pagination.
---

# askKeyValueStoreQuery

Reads a page of records from a [key-value store](../../../config/core/key-value-store.md) that match a **key condition** — an equality on the partition key, optionally narrowed by a range on the sort key. Returns a single page plus a cursor for the next one.

- **Action type:** `KeyValueStoreActionType.Query`

```typescript
import { askKeyValueStoreQuery, kvsEqual } from 'quidproquo-core';

interface Order {
  customerId: string;
  createdAt: number;
  total: number;
}

export function* askRecentOrders(customerId: string) {
  const page = yield* askKeyValueStoreQuery<Order>(
    'orders',
    kvsEqual('customerId', customerId),
    { limit: 20, sortAscending: false },
  );

  return page.items; // Order[]
}
```

## Signature

```typescript
function* askKeyValueStoreQuery<KvsItem>(
  keyValueStoreName: string,
  keyCondition: KvsQueryOperation,
  options?: KeyValueStoreQueryOptions,
): AskResponse<QpqPagedData<KvsItem>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyValueStoreName` | `string` | Name of the store to query — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md) (or one shared via its `owner` option). |
| `keyCondition` | `KvsQueryOperation` | The key condition — typically `kvsEqual('partitionKey', value)`, optionally combined (via `kvsAnd`) with a range condition on the sort key. See [Query conditions](#query-conditions-kvsqueryoperation). |
| `options` | `KeyValueStoreQueryOptions` | Filtering, ordering, and pagination — see below. |

### `KeyValueStoreQueryOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `filter` | `KvsQueryOperation` | – | An extra condition applied to non-key attributes **after** the key match. Filtered-out rows still count against `limit`. |
| `indexName` | `string` | – | Force the query onto the [index](../../../config/core/key-value-store.md#indexes-gsis) declared with this name, read in its sort order. Without it, the table serves the query if its keys cover the key condition, otherwise the first declared index whose keys do — so an index sharing the table's keys is only reached by naming it here. An undeclared name throws `IndexNotFound`. |
| `sortAscending` | `boolean` | `true` | Order results by the sort key. `false` returns the newest/highest first. |
| `limit` | `number` | – | Maximum number of records to return in this page. |
| `nextPageKey` | `string` | – | Opaque cursor from a previous page's `nextPageKey`; pass it to fetch the following page. |
| `consistentRead` | `boolean` | `false` | Strongly consistent (read-your-own-writes) read. Costs roughly double the read capacity on DynamoDB and cannot be served from a global secondary index. Use it when a caller just wrote and is now querying to decide something (e.g. folding a log right after appending to it); leave it off for ordinary reads. |
| `ttlInSeconds` | `number` | – | Accepted but not implemented: no processor currently applies a TTL to query results, so setting it has no effect. |
| `scope` | `string` | – | Optional storage scope. The processor composes it into the partition-key conditions, so the query only matches records written under the same scope (used by tenant/scoped features). Requires a string-typed partition key, and the key condition must constrain the partition key. |

## Query conditions (`KvsQueryOperation`)

A `KvsQueryOperation` is either a single condition or a logical group. Build them with the exported helpers instead of constructing the objects by hand:

```typescript
import {
  kvsEqual, kvsNotEqual,
  kvsLessThan, kvsLessThanOrEqual, kvsGreaterThan, kvsGreaterThanOrEqual,
  kvsBetween, kvsIn, kvsExists, kvsNotExists,
  kvsBeginsWith, kvsContains, kvsNotContains,
  kvsAnd, kvsOr,
} from 'quidproquo-core';

// key: customerId = X AND createdAt BETWEEN a and b
const keyCondition = kvsAnd([
  kvsEqual('customerId', 'cust-123'),
  kvsBetween('createdAt', 1_700_000_000, 1_800_000_000),
]);
```

Each condition helper maps to a `KvsQueryOperationType`:

| Helper | `KvsQueryOperationType` | DynamoDB condition |
| --- | --- | --- |
| `kvsEqual(key, v)` | `Equal` | `EQ` |
| `kvsNotEqual(key, v)` | `NotEqual` | `NE` |
| `kvsLessThan(key, v)` | `LessThan` | `LT` |
| `kvsLessThanOrEqual(key, v)` | `LessThanOrEqual` | `LE` |
| `kvsGreaterThan(key, v)` | `GreaterThan` | `GT` |
| `kvsGreaterThanOrEqual(key, v)` | `GreaterThanOrEqual` | `GE` |
| `kvsBetween(key, a, b)` | `Between` | `BETWEEN` |
| `kvsIn(key, values)` | `In` | `IN` |
| `kvsExists(key)` | `Exists` | `AttributeExists` |
| `kvsNotExists(key)` | `NotExists` | `AttributeNotExists` |
| `kvsBeginsWith(key, v)` | `BeginsWith` | `BEGINS_WITH` |
| `kvsContains(key, v)` | `Contains` | `CONTAINS` |
| `kvsNotContains(key, v)` | `NotContains` | `NOT_CONTAINS` |

`kvsAnd(conditions)` / `kvsOr(conditions)` combine conditions using the `KvsLogicalOperatorType` (`And` / `Or`) and can be nested. These helpers are the public builders around the internal `KvsQueryCondition` / `KvsLogicalOperator` shapes and their expression compiler — you rarely need the raw types.

## Returns

`QpqPagedData<KvsItem>` — one page of results:

```typescript
interface QpqPagedData<T> {
  items: T[];
  nextPageKey?: string; // present when more pages remain
}
```

When `nextPageKey` is set, pass it back as `options.nextPageKey` to fetch the next page. To drain every page in one call, use [askKeyValueStoreQueryAll](./ask-key-value-store-query-all.md).

## Errors

| Error | Meaning |
| --- | --- |
| `KeyValueStoreQueryErrorTypeEnum.ServiceUnavailable` | DynamoDB internal error or throttling. |
| `KeyValueStoreQueryErrorTypeEnum.ResourceNotFound` | The underlying table does not exist. |
| `KeyValueStoreQueryErrorTypeEnum.InvalidScope` | The `scope` option is malformed (empty, `.`, over 128 characters, or containing path separators, `..`, `@`, or null bytes), the store's partition key is not string-typed, a scoped query's key condition does not constrain the partition key or an [index](../../../config/core/key-value-store.md#indexes-gsis) partition key (or constrains one with an operator that cannot be scoped: an index partition key only takes `=`), a condition names an attribute containing `@@QPQ`, an index partition-key condition value doesn't match that index's declared type, or a partition-key condition value contains the reserved `@@QPQ` marker (reserved on string-pk stores, so unscoped queries reject it too). |
| `KeyValueStoreQueryErrorTypeEnum.StoreNotFound` | The key value store is not declared in the qpq config (misconfiguration, e.g. a wrong name or a missing `defineKeyValueStore`). |
| `KeyValueStoreQueryErrorTypeEnum.IndexNotFound` | The `indexName` option names an index the store doesn't declare. |

Catch errors with `askCatch` — it returns `{ success: true, result }` or `{ success: false, error }`.

## Related

- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store, its sort keys, and its GSIs.
- [askKeyValueStoreQueryAll](./ask-key-value-store-query-all.md) — loop all pages into a single array.
- [askKeyValueStoreQuerySingle](./ask-key-value-store-query-single.md) — return just the first match (or `null`).
- [askKeyValueStoreScan](./ask-key-value-store-scan.md) — read records without a key condition.
- [askKeyValueStoreGet](./ask-key-value-store-get.md) — fetch one record by partition key.
- [askEventDocEventList](../../features/event-doc/ask-event-doc-event-list.md) — reads a document's event log with this query action.
