---
title: defineAwsDyanmoOverrideForKvs
description: Point a key-value store at a pre-existing DynamoDB table instead of the one quidproquo would create.
---

# defineAwsDyanmoOverrideForKvs

Overrides the physical **DynamoDB table** backing a [key-value store](../core/key-value-store.md). Normally quidproquo derives the table name from the store name and application/module/environment prefix and creates the table for you. This setting instead binds the store to an **existing** DynamoDB table by name, so the deploy imports that table rather than creating a new one. Use it to adopt a table that already exists (a migration, a manually-managed table, or a table shared across systems).

- **On AWS:** resolved by `getDynamoTableNameOverrride` in `@qpqjs/config-aws` and consumed by `QpqCoreKeyValueStoreConstruct` in `@qpqjs/deploy-awscdk`. When an override matches the store, the construct calls `aws_dynamodb.Table.fromTableName(...)` to import the named table instead of provisioning one, and the store's action processors read and write that table. Because the table is imported (not owned), its schema, keys, indexes, and removal policy are managed outside this config.

:::note Spelling
The exported name is spelled **`defineAwsDyanmoOverrideForKvs`** ("Dyanmo", not "Dynamo") in the source, and that is the name you import.
:::

```typescript
import { defineAwsDyanmoOverrideForKvs } from '@qpqjs/config-aws';

export default [
  // Back the 'sessions' key-value store with a pre-existing DynamoDB table
  defineAwsDyanmoOverrideForKvs('sessions-table-override', { keyValueStoreName: 'sessions' }, 'legacy-sessions-prod'),
];
```

## Signature

```typescript
function defineAwsDyanmoOverrideForKvs(
  name: string,
  kvsStore: CustomFullyQualifiedResource<'keyValueStoreName'>,
  dynamoTableName: string,
  options?: QPQConfigAdvancedAwsDyanmoOverrideForKvsSettings,
): AwsDyanmoOverrideForKvsQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

A unique name for this override setting (its `uniqueKey` within the config). Purely an identifier for the override entry — it is not the store or table name.

### `kvsStore` — `CustomFullyQualifiedResource<'keyValueStoreName'>` (required)

Identifies which key-value store to override. At minimum provide `{ keyValueStoreName: '<store>' }`; the remaining parts (`module`, `application`, `environment`, `feature`) are optional and default to the current service, letting you target a store owned by another module. It is normalised to a fully-qualified resource and matched against the store at deploy time.

### `dynamoTableName` — `string` (required)

The name of the existing DynamoDB table to bind the store to. This exact table name is imported via `Table.fromTableName` — no application/environment prefixing is applied, so pass the real, deployed table name.

### `options` — `QPQConfigAdvancedAwsDyanmoOverrideForKvsSettings` (optional)

Advanced settings. Currently an empty interface that extends the shared `QPQConfigAdvancedSettings` (e.g. `deprecated`), reserved for future options.

## Examples

```typescript
import { defineKeyValueStore } from '@qpqjs/core';
import { defineAwsDyanmoOverrideForKvs } from '@qpqjs/config-aws';

export default [
  defineKeyValueStore('sessions', 'sessionId'),

  // Instead of creating a fresh table, reuse a table created outside quidproquo
  defineAwsDyanmoOverrideForKvs('sessions-override', { keyValueStoreName: 'sessions' }, 'legacy-sessions-prod'),
];
```

## Related

- [defineKeyValueStore](../core/key-value-store.md) — the store whose backing table this setting overrides.
