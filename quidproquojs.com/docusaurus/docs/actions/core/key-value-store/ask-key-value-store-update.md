---
title: askKeyValueStoreUpdate
description: Apply a set of atomic update operations to an existing record in a key-value store.
---

# askKeyValueStoreUpdate

Applies a list of **update operations** (set, remove, increment, …) to a single record in a [key-value store](../../../config/core/key-value-store.md), addressed by its key. Unlike [askKeyValueStoreUpsert](./ask-key-value-store-upsert.md), which replaces the whole item, this mutates individual attributes in place and returns the updated record.

- **Action type:** `KeyValueStoreActionType.Update`

```typescript
import { askKeyValueStoreUpdate, kvsUpdate, kvsSet, kvsIncrement } from 'quidproquo-core';

interface Account {
  accountId: string;
  balance: number;
  lastActivity: number;
}

export function* askApplyCharge(accountId: string, amount: number, now: number) {
  const updated = yield* askKeyValueStoreUpdate<Account>(
    'accounts',
    kvsUpdate([
      kvsIncrement('balance', -amount),
      kvsSet('lastActivity', now),
    ]),
    accountId,
  );

  return updated; // Account
}
```

## Signature

```typescript
function* askKeyValueStoreUpdate<Value>(
  keyValueStoreName: string,
  updates: KvsUpdate,
  key: KvsCoreDataType,
  sortKey?: KvsCoreDataType,
  options?: KeyValueStoreUpdateOptions,
): AskResponse<Value>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyValueStoreName` | `string` | Name of the store — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md) (or one shared via its `owner` option). |
| `updates` | `KvsUpdate` | The list of update operations to apply. See [Update operations](#update-operations-kvsupdate). |
| `key` | `KvsCoreDataType` | Partition key value of the record to update (`string \| number`). |
| `sortKey` | `KvsCoreDataType` | Sort key value, required only if the store declares a sort key (`string \| number`). |
| `options` | `KeyValueStoreUpdateOptions` | Optional update options (see below). |

### `KeyValueStoreUpdateOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `scope` | `string` | – | Optional storage scope. The processor composes it into the partition key value, so the update only addresses the record written under that scope (used by tenant/scoped features). Requires the store's partition key to be string-typed. |

## Update operations (`KvsUpdate`)

`KvsUpdate` is an array of `KvsUpdateAction`. Build each action with an exported helper rather than writing the object literal, and wrap the list with `kvsUpdate(...)` (an identity helper that keeps the call readable):

```typescript
import {
  kvsUpdate,
  kvsSet, kvsRemove, kvsAdd, kvsDelete,
  kvsSetIfNotExists, kvsIncrement, kvsDecrement,
} from 'quidproquo-core';

const updates = kvsUpdate([
  kvsSet('name', 'Ada'),
  kvsRemove('temporaryFlag'),
  kvsSetIfNotExists('firstSeen', now),
  kvsIncrement('loginCount', 1),
]);
```

| Helper | `KvsUpdateActionType` | Effect |
| --- | --- | --- |
| `kvsSet(path, value)` | `Set` | Create the attribute or overwrite its value. |
| `kvsRemove(path)` | `Remove` | Delete the attribute from the item. |
| `kvsAdd(path, value)` | `Add` | Increment a number or add elements to a set. |
| `kvsDelete(path, value)` | `Delete` | Remove elements from a set or list attribute. |
| `kvsSetIfNotExists(path, value)` | `SetIfNotExists` | Set the attribute only if it does not already exist (`if_not_exists`). |
| `kvsIncrement(path, by, default?)` | `Increment` | Atomically add `by` to a numeric attribute, initializing it to `default` (0) if absent. |
| `kvsDecrement(path, by, default?)` | `Increment` | As `kvsIncrement` but subtracts `by`. |

Each `path` is a `KvsAttributePath` — either a top-level attribute name (`'balance'`) or an array of names/indexes to reach a nested attribute (`['settings', 'theme']`, `['tags', 0]`).

## Returns

`Value` — the record after the updates have been applied.

## Errors

| Error | Meaning |
| --- | --- |
| `KeyValueStoreUpdateErrorTypeEnum.ServiceUnavailable` | DynamoDB internal error or throttling. |
| `KeyValueStoreUpdateErrorTypeEnum.ResourceNotFound` | The underlying table does not exist. |
| `KeyValueStoreUpdateErrorTypeEnum.InvalidScope` | The `scope` option is malformed (empty, `.`, over 128 characters, or containing path separators, `..`, `@`, or null bytes), the store's partition key is not string-typed, the partition-key value contains the reserved `@@QPQ` marker (reserved on string-pk stores, so unscoped calls reject it too), a scoped update names an attribute containing `@@QPQ`, or a scoped update targets an [index](../../../config/core/key-value-store.md#indexes-gsis) partition key with anything other than a whole-value `Set`/`SetIfNotExists`/`Remove` of the declared type (`Increment`, `Add`, `Delete`, and nested paths are refused). |
| `KeyValueStoreUpdateErrorTypeEnum.StoreNotFound` | The key value store is not declared in the qpq config (misconfiguration, e.g. a wrong name or a missing `defineKeyValueStore`). |

Catch errors with `askCatch` — it returns `{ success: true, result }` or `{ success: false, error }`.

## Related

- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store and its keys.
- [askKeyValueStoreUpdatePartialProperties](./ask-key-value-store-update-partial-properties.md) — build the update operations automatically from a partial object.
- [askKeyValueStoreUpsert](./ask-key-value-store-upsert.md) — write/replace a whole record instead of patching attributes.
- [askKeyValueStoreGet](./ask-key-value-store-get.md) — read the record.
