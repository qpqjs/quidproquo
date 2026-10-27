---
title: askKeyValueStoreScanAll
description: Scan an entire key-value store and collect every matching record across all pages into one array.
---

# askKeyValueStoreScanAll

Runs [askKeyValueStoreScan](./ask-key-value-store-scan.md) repeatedly, following each page's `nextPageKey`, and returns **all** records (optionally filtered) as a single array. Like a full-table scan, this reads across every partition — use it sparingly on large stores.

- **Built from:** loops [askKeyValueStoreScan](./ask-key-value-store-scan.md) until there are no more pages. It is a helper story, not a distinct action.

```typescript
import { askKeyValueStoreScanAll, kvsEqual } from '@qpqjs/core';

interface User {
  userId: string;
  status: string;
}

export function* askAllSuspendedUsers() {
  const users = yield* askKeyValueStoreScanAll<User>('users', kvsEqual('status', 'suspended'));
  return users; // User[]
}
```

## Signature

```typescript
function* askKeyValueStoreScanAll<T>(
  storeName: string,
  filterCondition?: KvsQueryOperation,
  options?: KeyValueStoreScanOptions,
): AskResponse<T[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `storeName` | `string` | Name of the store to scan — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md). |
| `filterCondition` | `KvsQueryOperation` | Optional filter applied to every scanned record — see [Query conditions](./ask-key-value-store-query.md#query-conditions-kvsqueryoperation). Omit it to return every record. |
| `options` | `KeyValueStoreScanOptions` | Optional scan options, forwarded to the underlying scan on **every** page (see [`KeyValueStoreScanOptions`](./ask-key-value-store-scan.md#keyvaluestorescanoptions)). In particular `scope` restricts every page to records written under that storage scope. |

## Returns

`T[]` — every record (matching the filter, if given) across all pages. Returns an empty array if nothing matches.

## Notes

- This loads the entire result set into memory and reads the whole table. Prefer a keyed [askKeyValueStoreQueryAll](./ask-key-value-store-query-all.md) whenever records can be addressed by key.
- Errors surface the same as the underlying scan (`KeyValueStoreScanErrorTypeEnum`); catch them with `askCatch`.

## Related

- [askKeyValueStoreScan](./ask-key-value-store-scan.md) — the single-page action this wraps.
- [askKeyValueStoreQueryAll](./ask-key-value-store-query-all.md) — the keyed equivalent (cheaper).
- [askKeyValueStoreGetAll](./ask-key-value-store-get-all.md) — read every record with no filter.
- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store.
