---
title: askKeyValueStoreScanAllScopes
description: Migration-only scan across every scope in a key-value store, each record tagged with the scope it came from.
---

# askKeyValueStoreScanAllScopes

Reads a page of records from a [key-value store](../../../config/core/key-value-store.md) across **every** storage scope, plus the unscoped partition, pairing each record with the scope it lives under. This deliberately crosses the scope boundary that [askKeyValueStoreScan](./ask-key-value-store-scan.md) and the rest of the KVS layer hold: an ordinary scan excludes scope-composed records so one tenant's request can never read another's.

Reach for this only from a migration or an equivalent whole-store operation that needs to rewrite every row regardless of scope — never on a request path. Nothing in the framework calls it.

- **Action type:** `KeyValueStoreActionType.ScanAllScopes`

```typescript
import { askKeyValueStoreScanAllScopes } from '@qpqjs/core';

interface User {
  userId: string;
  status: string;
}

export function* askMigrateAllUsers() {
  let nextPageKey: string | undefined;

  do {
    const page = yield* askKeyValueStoreScanAllScopes<User>('users', undefined, nextPageKey);

    for (const { scope, item } of page.items) {
      // rewrite item back into the same scope it came from
    }

    nextPageKey = page.nextPageKey;
  } while (nextPageKey);
}
```

## Signature

```typescript
function* askKeyValueStoreScanAllScopes<KvsItem>(
  keyValueStoreName: string,
  filterCondition?: KvsQueryOperation,
  nextPageKey?: string,
  options?: KeyValueStoreScanAllScopesOptions,
): AskResponse<QpqPagedData<KvsScopedItem<KvsItem>>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyValueStoreName` | `string` | Name of the store to scan — must match a store declared with [defineKeyValueStore](../../../config/core/key-value-store.md) (or one shared via its `owner` option). |
| `filterCondition` | `KvsQueryOperation` | Optional filter applied to every scanned record, within every scope. Built with the `kvs*` condition helpers — see [Query conditions](./ask-key-value-store-query.md#query-conditions-kvsqueryoperation). Omit it to return everything. |
| `nextPageKey` | `string` | Opaque cursor from a previous page's `nextPageKey`; pass it to fetch the following page. |
| `options` | `KeyValueStoreScanAllScopesOptions` | Optional scan options (see below). |

### `KeyValueStoreScanAllScopesOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | `number` | – | Accepted but not implemented: no processor currently caps the page size, so setting it has no effect. |

## Returns

`QpqPagedData<KvsScopedItem<KvsItem>>` — one page of results:

```typescript
interface KvsScopedItem<KvsItem> {
  scope?: string; // absent for an unscoped record
  item: KvsItem;
}

interface QpqPagedData<T> {
  items: T[];
  nextPageKey?: string; // present when more pages remain
}
```

## Errors

| Error | Meaning |
| --- | --- |
| `KeyValueStoreScanAllScopesErrorTypeEnum.ServiceUnavailable` | DynamoDB internal error or throttling. |
| `KeyValueStoreScanAllScopesErrorTypeEnum.ResourceNotFound` | The underlying table does not exist. |
| `KeyValueStoreScanAllScopesErrorTypeEnum.StoreNotFound` | The key value store is not declared in the qpq config (misconfiguration, e.g. a wrong name or a missing `defineKeyValueStore`). |

Catch errors with `askCatch` — it returns `{ success: true, result }` or `{ success: false, error }`.

## Notes

- Drain every page: pagination can advance across scope boundaries as well as within a single scope's records, so stopping after the first page silently skips the rest of the store, not just the rest of one scope.
- The scope is reported rather than dropped because a caller rewriting records across every tenant in one pass has to know which tenant each belongs to, or a write lands in the wrong partition.

## Related

- [defineKeyValueStore](../../../config/core/key-value-store.md) — declares the store being scanned.
- [askKeyValueStoreScan](./ask-key-value-store-scan.md) — the scoped-safe equivalent for request-path code.
- [askKeyValueStoreScanAll](./ask-key-value-store-scan-all.md) — drains all pages of a single-scope scan into one array.
