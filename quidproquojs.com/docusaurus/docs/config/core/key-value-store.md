---
title: defineKeyValueStore
description: Define a key-value store — a DynamoDB-style table with a partition key, optional sort keys, and secondary indexes that KVS actions read from and write to.
---

# defineKeyValueStore

Defines a **key-value store**: a named, schema-light table addressed by a partition key and optional sort key(s). Stories never talk to DynamoDB directly — they read and write records on a store by name using the [Key-Value Store action requesters](../../actions/core/key-value-store/ask-key-value-store-get.md), and the runtime maps the store to real storage.

- **On AWS:** deploys a DynamoDB table (`QpqCoreKeyValueStoreConstruct` in `quidproquo-deploy-awscdk`). The table uses **on-demand** billing (`PAY_PER_REQUEST`), the `partitionKey` becomes the table's partition (hash) key, the **first** entry in `sortKeys` becomes the table's sort (range) key, and each **additional** sort key becomes a **Local Secondary Index**. Every entry in `indexes` becomes a **Global Secondary Index** (its `indexName` is the index's partition-key attribute name). Point-in-time recovery (35-day continuous backups) is on by default, `ttlAttribute` maps to the table's TTL attribute, and read/write-throttle CloudWatch alarms are attached. The table is retained on stack teardown unless the service opts into destroy via `defineAwsDataStoreRemovalPolicy`.

```typescript
import { defineKeyValueStore } from 'quidproquo-core';

export default [
  // Partition key only
  defineKeyValueStore('users', 'userId'),
];
```

## Signature

```typescript
function defineKeyValueStore<T extends object = any>(
  keyValueStoreName: string,
  partitionKey: CompositeKvsKey<T>,
  sortKeys?: CompositeKvsKey<T>[],
  options?: QPQConfigAdvancedKeyValueStoreSettings<T>,
): KeyValueStoreQPQConfigSetting<T>;
```

## Parameters

### `keyValueStoreName` — `string` (required)

The name of the store. This is the name you pass as the first argument to every KVS action (e.g. `askKeyValueStoreGet('users', ...)`). It is also the store's `uniqueKey` within the config, and on AWS it is used to derive the physical table name (prefixed with application/module/environment, so the same config deploys to multiple environments without collisions).

### `partitionKey` — `CompositeKvsKey<T>` (required)

The partition (hash) key. Every record is addressed primarily by this attribute. See [Keys](#keys-compositekvskey) for the shorthand and full forms.

### `sortKeys` — `CompositeKvsKey<T>[]` (default `[]`)

Zero or more sort keys. The list is significant:

- The **first** sort key becomes the table's sort (range) key — together with the partition key it forms the composite primary key, and it is what [askKeyValueStoreQuery](../../actions/core/key-value-store/ask-key-value-store-query.md) ranges over.
- Each **additional** sort key becomes a **Local Secondary Index** (same partition key, alternate sort attribute), letting you query the same partition ordered by a different attribute.

### `options` — `QPQConfigAdvancedKeyValueStoreSettings<T>` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `indexes` | `CompositeKvsIndex<T>[]` | `[]` | Global Secondary Indexes — alternate partition/sort key pairs that let you query the store by attributes other than the primary key. See [Indexes (GSIs)](#indexes-gsis). |
| `global` | `boolean` | `false` | Marks the store as globally accessible across the account rather than private to the owning module. |
| `owner` | `CrossModuleOwner` | – | Declares that this store is owned by **another** module/service. Use this to read/write a store deployed elsewhere: the deploy grants this service IAM access to the foreign table instead of creating a new one. |
| `ttlAttribute` | `string` | – | Name of a record attribute holding a Unix-epoch (seconds) timestamp. DynamoDB automatically deletes records once that time passes. |
| `disablePointInTimeRecovery` | `boolean` | `false` | Point-in-time recovery (35-day continuous backups / restore) is on by default; set this to opt out. |
| `cryptoKeyName` | `string` | | Encrypts the table with the named [defineCryptoKey](./crypto-key.md) instead of DynamoDB's default provider-managed encryption, which applies when omitted. The key must be declared in the same config, owned or via `owner`; a foreign key's owning service must be deployed first, since DynamoDB validates the key when the table is created. |
| `scoped` | `boolean` | `false` | Requires every action against this store to carry a scope; a call without one throws `InvalidScopeError`. [askKeyValueStoreScanAllScopes](../../actions/core/key-value-store/ask-key-value-store-scan-all-scopes.md) is the one exempt action. |
| `onStream` | `KvsStreamSettings` | – | Turns on change data capture and runs a story for every insert/modify/remove on the store. See [Change data capture (`onStream`)](#change-data-capture-onstream). |

## Keys (`CompositeKvsKey`)

A key can be given in two forms:

```typescript
// Shorthand: just the attribute name — implies type 'string'
defineKeyValueStore('users', 'userId');

// Full form: name + explicit type, via the kvsKey() helper
import { defineKeyValueStore, kvsKey } from 'quidproquo-core';

defineKeyValueStore('events', kvsKey('deviceId'), [kvsKey('timestamp', 'number')]);
```

`kvsKey(key, type)` builds a `KvsKey` — `{ key, type }`. The `type` is a `KvsKeyType`:

| `KvsKeyType` | Meaning |
| --- | --- |
| `'string'` | Textual key (default when using the shorthand form). |
| `'number'` | Numeric key — sorts and ranges numerically. |
| `'binary'` | Binary key. |

## Indexes (GSIs)

Each entry in `options.indexes` is a `CompositeKvsIndex<T>` — either a bare attribute name (a partition-key-only index) or an object with a `partitionKey`, optional `sortKey`, and optional `name`:

```typescript
import { defineKeyValueStore, kvsKey } from 'quidproquo-core';

defineKeyValueStore('orders', 'orderId', [], {
  indexes: [
    // Query orders by customer, ordered by createdAt
    { partitionKey: 'customerId', sortKey: kvsKey('createdAt', 'number') },
    // Query orders by status (partition-only index)
    'status',
    // Two indexes on the same partition key need an explicit name
    { name: 'byStatusAndTotal', partitionKey: 'status', sortKey: kvsKey('total', 'number') },
  ],
});
```

`name` defaults to the partition-key attribute (`customerId`, `status` above) and is what [askKeyValueStoreQuery](../../actions/core/key-value-store/ask-key-value-store-query.md)'s `indexName` option targets; `defineKeyValueStore` throws if two indexes resolve to the same name. On AWS each index becomes a Global Secondary Index deployed under this name.

A query without `indexName` runs against the table if its keys cover every attribute in the key condition, otherwise the first declared index whose keys do.

### Indexes on a scoped store

A store with `scoped: true` (see [`scoped`](#options--qpqconfigadvancedkeyvaluestoresettingst-optional)) can still declare `indexes`. On AWS, an index whose partition key isn't the table's partition key is keyed on a hidden `@@QPQGSI_<attribute>@@` attribute holding the scope-composed value; the index keeps its declared name and sort key, and stories never see the hidden attribute. A scoped store's index partition key must be a `'string'` or `'number'` key, since a scope can't be composed onto a `'binary'` key — `defineKeyValueStore` throws at config time otherwise.

Adding or removing an index on an already-deployed scoped store needs two deploys: remove the index and deploy, then re-add it and deploy. CloudFormation can't change a GSI's key schema in place, and rows written before the new index exists only appear in it once they're rewritten.

## Change data capture (`onStream`)

```typescript
export type KvsStreamSettings = {
  runtime: QpqFunctionRuntime;
  coalesceByPartitionKey?: boolean;
  batchSize?: number;
  maximumBatchingWindowInSeconds?: number;
};
```

Declaring `onStream` puts the table into DynamoDB's `NEW_AND_OLD_IMAGES` stream mode and deploys a handler lambda subscribed to it. Records for a given partition key are always delivered to the handler in order; different partition keys may be processed concurrently. A table nothing subscribes to gets no stream at all, since a stream on it would be pure cost.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `runtime` | `QpqFunctionRuntime` | – (required) | The handler story, usually a relative path string in the form `'/path/to/file::exportedFunctionName'`. Invoked once per record with a `KvsStreamRecord<T>` (exported from `quidproquo-core`). |
| `coalesceByPartitionKey` | `boolean` | `false` | Collapse each delivered batch down to one record per partition key (the latest), instead of invoking the handler once per record. Off by default, since a generic consumer (audit trail, change notifications) needs to see every change. Turn it on for a projection, where the handler re-derives state from source and only needs to know a key changed. |
| `batchSize` | `number` | `100` | Records per invocation. DynamoDB streams allow up to 1000. |
| `maximumBatchingWindowInSeconds` | `number` | – | How long to wait accumulating records before invoking, 0–300 seconds. Trades latency for fewer invocations, and gives `coalesceByPartitionKey` more to collapse. |

The handler receives a `KvsStreamRecord<T>`:

```typescript
export enum KvsStreamEventType {
  Insert = 'Insert',
  Modify = 'Modify',
  Remove = 'Remove',
}

export type KvsStreamRecord<TItem extends object = any> = {
  keyValueStoreName: string;
  eventType: KvsStreamEventType;
  scope?: string;                  // present when the item was written under a storage scope
  keys: Record<string, unknown>;   // always present, including on Remove
  newImage?: TItem;                // absent on Remove
  oldImage?: TItem;                // absent on Insert
};
```

Images are plain objects, already unmarshalled from DynamoDB's wire format and with any storage scope stripped back out of the key values — a handler is ordinary story code and never sees a raw AttributeValue or a composed partition key.

```typescript
defineKeyValueStore('documents', 'id', [], {
  onStream: {
    runtime: '/entry/kvsStream/onDocumentChanged::onDocumentChanged',
    coalesceByPartitionKey: true,
  },
});
```

## Examples

```typescript
import { defineKeyValueStore, kvsKey } from 'quidproquo-core';

export default [
  // Simple lookup table keyed by id
  defineKeyValueStore('users', 'userId'),

  // Time-series: partition per device, ranged by numeric timestamp,
  // with a TTL attribute so old rows expire automatically
  defineKeyValueStore('device-readings', 'deviceId', [kvsKey('timestamp', 'number')], {
    ttlAttribute: 'expiresAt',
  }),

  // Orders with a GSI to query by customer
  defineKeyValueStore('orders', 'orderId', [], {
    indexes: [{ partitionKey: 'customerId', sortKey: kvsKey('createdAt', 'number') }],
  }),

  // Encrypted store using a store owned by another service
  defineKeyValueStore('billing', 'accountId', [], {
    cryptoKeyName: 'main',
    owner: { module: 'billing-service' },
  }),
];
```

## Related

- **Read a single record:** [askKeyValueStoreGet](../../actions/core/key-value-store/ask-key-value-store-get.md) · [askKeyValueStoreGetAll](../../actions/core/key-value-store/ask-key-value-store-get-all.md)
- **Query & scan:** [askKeyValueStoreQuery](../../actions/core/key-value-store/ask-key-value-store-query.md) · [askKeyValueStoreScan](../../actions/core/key-value-store/ask-key-value-store-scan.md)
- **Write:** [askKeyValueStoreUpsert](../../actions/core/key-value-store/ask-key-value-store-upsert.md) · [askKeyValueStoreUpdate](../../actions/core/key-value-store/ask-key-value-store-update.md) · [askKeyValueStoreDelete](../../actions/core/key-value-store/ask-key-value-store-delete.md)
- **AWS tuning:** [defineAwsDyanmoOverrideForKvs](../config-aws/aws-dyanmo-override-for-kvs.md) (back the store with a pre-existing DynamoDB table), and [defineAwsDataStoreRemovalPolicy](../config-aws/aws-data-store-removal-policy.md) (retain vs destroy the table on teardown).
- [defineEventDocSummary](../features/event-doc-summary.md) — a real `onStream` consumer: rebuilds a document's summary record from its event log on every change.
- **AWS implementation:** `QpqCoreKeyValueStoreConstruct` (DynamoDB table, LSIs, GSIs, TTL, PITR, KMS, IAM grants) and `QpqApiCoreKeyValueStoreStreamConstruct` (the `onStream` handler lambda + event source) in `quidproquo-deploy-awscdk`; KVS action processors in `quidproquo-actionprocessor-awslambda`.
