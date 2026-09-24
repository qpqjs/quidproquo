---
title: askKeyValueStoreGet
description: Read a single record from a key-value store by its partition key.
---

# askKeyValueStoreGet

Fetches one record from a [key-value store](../../../config/core/key-value-store.md) by its key, or `null` if no record with that key exists.

- **Action type:** `KeyValueStoreActionType.Get`

```typescript
import { askKeyValueStoreGet } from 'quidproquo-core';

interface User {
  userId: string;
  name: string;
}

export function* askGetUser(userId: string) {
  const user = yield* askKeyValueStoreGet<User>('users', userId);
  return user; // User | null
}
```

## Signature

```typescript
function* askKeyValueStoreGet<Value>(
  keyValueStoreName: string,
  key: string,
  options?: KeyValueStoreGetOptions,
): AskResponse<Value | null>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyValueStoreName` | `string` | Name of the store to read from — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md) (or one shared via its `owner` option). |
| `key` | `string` | The partition key value of the record to fetch. |
| `options` | `KeyValueStoreGetOptions` | Optional read options (see below). |

### `KeyValueStoreGetOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `scope` | `string` | – | Optional storage scope. The processor composes it into the partition key value, so scoped and unscoped records live under separate keys in the same store (used by tenant/scoped features). Requires the store's partition key to be string-typed. |

## Returns

`Value | null` — the record if found, otherwise `null`. The `Value` type parameter is the shape of your stored record.

## Errors

| Error | Meaning |
| --- | --- |
| `KeyValueStoreGetErrorTypeEnum.ServiceUnavailable` | DynamoDB internal error or throttling. |
| `KeyValueStoreGetErrorTypeEnum.ResourceNotFound` | The underlying table does not exist. |
| `KeyValueStoreGetErrorTypeEnum.InvalidScope` | The `scope` option is malformed (empty, `.`, over 128 characters, or containing path separators, `..`, `@`, or null bytes), the store's partition key is not string-typed, or the partition-key value contains the reserved `@@QPQ` marker (reserved on string-pk stores, so unscoped calls reject it too). |
| `KeyValueStoreGetErrorTypeEnum.StoreNotFound` | The key value store is not declared in the qpq config (misconfiguration, e.g. a wrong name or a missing `defineKeyValueStore`). |

Errors thrown by actions can be caught with `askCatch` from quidproquo-core. It returns an object — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askKeyValueStoreGet<User>('users', userId));

if (outcome.success) {
  const user = outcome.result; // User | null
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Related

- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store this action reads from.
- [askKeyValueStoreGetAll](./ask-key-value-store-get-all.md) — read every record in the store.
- [askKeyValueStoreQuery](./ask-key-value-store-query.md) — fetch multiple records by key condition, with a sort key.
- [askKeyValueStoreUpsert](./ask-key-value-store-upsert.md) — write the record.
- [askKeyValueStoreDelete](./ask-key-value-store-delete.md) — remove the record.
