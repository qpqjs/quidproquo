---
title: askKeyValueStoreGetAll
description: Read every record in a key-value store.
---

# askKeyValueStoreGetAll

Returns **all** records in a [key-value store](../../../config/core/key-value-store.md) as an array. Best reserved for small, bounded stores (config-like or reference data) — for large tables prefer [askKeyValueStoreQuery](./ask-key-value-store-query.md) or [askKeyValueStoreScanAll](./ask-key-value-store-scan-all.md).

- **Action type:** `KeyValueStoreActionType.GetAll`

```typescript
import { askKeyValueStoreGetAll } from 'quidproquo-core';

interface FeatureFlag {
  name: string;
  enabled: boolean;
}

export function* askGetAllFlags() {
  const flags = yield* askKeyValueStoreGetAll<FeatureFlag>('feature-flags');
  return flags; // FeatureFlag[]
}
```

## Signature

```typescript
function* askKeyValueStoreGetAll<Value>(
  keyValueStoreName: string,
  options?: KeyValueStoreGetAllOptions,
): AskResponse<Value[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyValueStoreName` | `string` | Name of the store to read from — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md) (or one shared via its `owner` option). |
| `options` | `KeyValueStoreGetAllOptions` | Optional read options (see below). |

### `KeyValueStoreGetAllOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `scope` | `string` | – | Optional storage scope. The processor enforces it as a begins-with prefix filter on the partition key, so only records written under the same scope are returned (used by tenant/scoped features). Requires the store's partition key to be string-typed. When no scope is given, scope-composed records are excluded, so one tenant's data never appears in an unscoped listing. |

## Returns

`Value[]` — every record in the store. Returns an empty array if the store is empty.

## Errors

| Error | Meaning |
| --- | --- |
| `KeyValueStoreGetAllErrorTypeEnum.ServiceUnavailable` | DynamoDB internal error or throttling. |
| `KeyValueStoreGetAllErrorTypeEnum.ResourceNotFound` | The underlying table does not exist. |
| `KeyValueStoreGetAllErrorTypeEnum.InvalidScope` | The `scope` option is malformed (empty, `.`, over 128 characters, or containing path separators, `..`, `@`, or null bytes), the store's partition key is not string-typed, or a scoped call's partition-key value contains the reserved `@@QPQ` marker. |
| `KeyValueStoreGetAllErrorTypeEnum.StoreNotFound` | The key value store is not declared in the qpq config (misconfiguration, e.g. a wrong name or a missing `defineKeyValueStore`). |

Catch errors with `askCatch` — it returns `{ success: true, result }` or `{ success: false, error }`.

## Related

- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store this action reads from.
- [askKeyValueStoreGet](./ask-key-value-store-get.md) — read a single record by key.
- [askKeyValueStoreScanAll](./ask-key-value-store-scan-all.md) — read all records matching a filter, page by page.
- [askKeyValueStoreQuery](./ask-key-value-store-query.md) — read records by key condition.
