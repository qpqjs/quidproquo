---
title: askKeyValueStoreUpsertWithRetry
description: Upsert a record into a key-value store, retrying automatically on transient failures.
---

# askKeyValueStoreUpsertWithRetry

Writes a record with [askKeyValueStoreUpsert](./ask-key-value-store-upsert.md), automatically retrying when the store is temporarily unavailable. Use it for writes that must succeed through transient DynamoDB throttling rather than failing the story on the first hiccup.

- **Built from:** wraps [askKeyValueStoreUpsert](./ask-key-value-store-upsert.md) in `askRetry`, retrying on `KeyValueStoreUpsertErrorTypeEnum.ServiceUnavailable` and `KeyValueStoreUpsertErrorTypeEnum.WriteContention`. It is a helper story, not a distinct action.

```typescript
import { askKeyValueStoreUpsertWithRetry } from 'quidproquo-core';

interface User {
  userId: string;
  name: string;
}

export function* askSaveUserReliably(user: User) {
  yield* askKeyValueStoreUpsertWithRetry('users', user, { maxRetries: 5 });
}
```

## Signature

```typescript
function* askKeyValueStoreUpsertWithRetry<KvsItem>(
  keyValueStoreName: string,
  item: KvsItem,
  options?: KeyValueStoreUpsertWithRetryOptions,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyValueStoreName` | `string` | Name of the store to write to — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md). |
| `item` | `KvsItem` | The full record to write (must include the store's key attributes). |
| `options` | `KeyValueStoreUpsertWithRetryOptions` | Retry settings plus all [askKeyValueStoreUpsert](./ask-key-value-store-upsert.md#keyvaluestoreupsertoptions) options — see below. |

### `KeyValueStoreUpsertWithRetryOptions`

Extends `KeyValueStoreUpsertOptions` (`ttlInSeconds`, `ifNotExists`, `scope`) with:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `maxRetries` | `number` | `3` | Maximum retry attempts. Retries are spaced ~250 ms apart. |

## Returns

`void` — the story resumes once the write has committed (or throws after exhausting the retries).

## Notes

- `ServiceUnavailable` (throttling / transient DynamoDB errors) and `WriteContention` (another write momentarily holding the item) are retried. A `Conflict` from an `ifNotExists` write is **not** retried — that's a genuine key collision, not a transient fault. If every attempt fails, the last error is re-thrown.
- Errors that escape the retries surface the same `KeyValueStoreUpsertErrorTypeEnum` members as the plain upsert; catch them with `askCatch`.

## Related

- [askKeyValueStoreUpsert](./ask-key-value-store-upsert.md) — the single-attempt action this wraps.
- [askKeyValueStoreUpdate](./ask-key-value-store-update.md) — patch attributes instead of replacing the item.
- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store.
- [askEventDocEventWrite](../../features/event-doc/ask-event-doc-event-write.md) — uses this with `ifNotExists` to conditionally claim an event's log slot.
