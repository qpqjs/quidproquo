---
title: askScanGenericDataResource
description: Scan up to a maximum number of items from a named data-resource table.
---

# askScanGenericDataResource

Reads items out of a **generic data resource** — a named table addressed directly by name — up to a maximum count. A "generic data resource" is a low-level, schema-agnostic data operation: you pass a raw `tableName` rather than reading through a typed [key-value store](../../../config/core/key-value-store.md). It is a generic building block used by tooling (for example the admin log viewer) that needs to enumerate arbitrary tables without a compile-time model of them.

- **Action type:** `GenericDataResourceActionTypeEnum.Scan`

:::warning Not implemented by any runtime
No action processor currently implements this action on any platform (AWS, dev server, or browser). Yielding it from a story will fail at runtime with an unknown-action error. The action type exists so tooling (like the admin log viewer) can label historical log entries. Use a [key-value store](../../../config/core/key-value-store.md) for application data.
:::

```typescript
import { askScanGenericDataResource } from '@qpqjs/webserver';

export function* readRecords(tableName: string) {
  const items = yield* askScanGenericDataResource(tableName, 100);

  for (const item of items) {
    // ...
  }

  return items;
}
```

## Signature

```typescript
function* askScanGenericDataResource(
  tableName: string,
  maxItems: number,
): AskResponse<object[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `tableName` | `string` | The name of the data-resource table to scan. |
| `maxItems` | `number` | The maximum number of items to return. |

## Returns

`object[]` — the scanned items (up to `maxItems`).

## Related

- [askPutGenericDataResource](./ask-put-generic-data-resource.md) — write an item into a data-resource table.
- [defineKeyValueStore](../../../config/core/key-value-store.md) — the typed, first-class alternative for modelling application data.
