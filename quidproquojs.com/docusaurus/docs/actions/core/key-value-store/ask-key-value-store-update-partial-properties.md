---
title: askKeyValueStoreUpdatePartialProperties
description: Patch a record from a partial object, deriving the set/remove operations automatically.
---

# askKeyValueStoreUpdatePartialProperties

Updates a record in a [key-value store](../../../config/core/key-value-store.md) from a **partial object**, without hand-writing update operations. Every property in the object becomes a `Set` (or a `Remove` when the value is `undefined`); the key properties are read to address the record and are not themselves written. A more ergonomic front-end to [askKeyValueStoreUpdate](./ask-key-value-store-update.md).

- **Built from:** derives a `KvsUpdate` (via `kvsSet` / `kvsRemove`) from the object and calls [askKeyValueStoreUpdate](./ask-key-value-store-update.md). It is a helper story, not a distinct action.

```typescript
import { askKeyValueStoreUpdatePartialProperties } from '@qpqjs/core';

interface User {
  userId: string;
  name: string;
  nickname?: string;
}

export function* askRenameUser(userId: string, name: string) {
  // Only userId (the key) + the changed fields need to be provided.
  const updated = yield* askKeyValueStoreUpdatePartialProperties<User, 'userId'>(
    'users',
    'userId',
    { userId, name },
  );

  return updated; // User
}
```

## Signature

```typescript
// Partition key only
function* askKeyValueStoreUpdatePartialProperties<TModel, PartitionKey extends keyof TModel>(
  keyValueStoreName: string,
  partitionKeyName: PartitionKey,
  partialProperties: Partial<TModel> & { [k in PartitionKey]: TModel[PartitionKey] },
  sortKeyName?: undefined,
  options?: KeyValueStoreUpdateOptions,
): AskResponse<TModel>;

// Partition + sort key
function* askKeyValueStoreUpdatePartialProperties<TModel, PartitionKey extends keyof TModel, SortKey extends keyof TModel>(
  keyValueStoreName: string,
  partitionKeyName: PartitionKey,
  partialProperties: Partial<TModel> & { [k in PartitionKey]: TModel[PartitionKey] } & { [k in SortKey]: TModel[SortKey] },
  sortKeyName: SortKey,
  options?: KeyValueStoreUpdateOptions,
): AskResponse<TModel>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyValueStoreName` | `string` | Name of the store — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md). |
| `partitionKeyName` | `keyof TModel` | The property name that holds the partition key. That property must be present in `partialProperties`; it is used to address the record, not written. |
| `partialProperties` | `Partial<TModel>` (with the key properties required) | The record patch. Each non-key property becomes a `Set`; a property explicitly set to `undefined` becomes a `Remove`. |
| `sortKeyName` | `keyof TModel` | (Overload) The property name holding the sort key, when the store has one. Must be present in `partialProperties`. |
| `options` | `KeyValueStoreUpdateOptions` | Optional update options, passed straight through to the underlying update (see [`KeyValueStoreUpdateOptions`](./ask-key-value-store-update.md#keyvaluestoreupdateoptions)). In particular `scope` addresses the record written under that storage scope. |

## Returns

`TModel` — the record after the patch is applied (the return of the underlying update).

## Notes

- The partition-key (and sort-key) properties are skipped when building the operations — they identify the record rather than mutate it.
- A property whose value is `undefined` is turned into a `Remove`; a property with a valid value is turned into a `Set`. A value that isn't a supported store data type (validated via `isValidKvsAdvancedDataType`, e.g. a nested object) throws an `InvalidKvsPartialPropertyError` (code `unsupportedValueType`) before anything is written, rather than being silently skipped.
- Errors surface the same as the underlying update (`KeyValueStoreUpdateErrorTypeEnum`); catch them with `askCatch`.

## Related

- [askKeyValueStoreUpdate](./ask-key-value-store-update.md) — the lower-level action this wraps; use it for increments, nested paths, and set operations.
- [askKeyValueStoreUpsert](./ask-key-value-store-upsert.md) — replace the whole record instead of patching it.
- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store and its keys.
