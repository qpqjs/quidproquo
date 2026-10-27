---
title: defineAwsDataStoreRemovalPolicy
description: Control whether a service's AWS data stores are retained or destroyed when their stack is torn down.
---

# defineAwsDataStoreRemovalPolicy

Sets the **removal policy** for every persistent data store this service deploys — storage-drive S3 buckets, key-value-store DynamoDB tables, user-directory Cognito user pools, and graph-database Neptune clusters. It decides what happens to that data when the resource is deleted or replaced (a `cdk destroy`, a full teardown, or a change that forces resource replacement). It defaults to **retain**, so production data survives teardown; declare it as **destroy** in dev/ephemeral configs where you want a clean tear-down.

- **On AWS:** a single service-wide setting read by each data-store construct in `@qpqjs/deploy-aws` (`QpqCoreStorageDriveConstruct`, `QpqCoreKeyValueStoreConstruct`, `QpqInfCoreUserDirectoryConstruct`, `QpqCoreApiGraphDatabaseConstruct`). `destroy` maps to CDK `RemovalPolicy.DESTROY`; `retain` maps to `RemovalPolicy.RETAIN` for buckets, tables, and user pools, and to `RemovalPolicy.SNAPSHOT` for the Neptune cluster — a final snapshot preserves the graph data without leaving an orphaned live cluster running. When the setting is absent, the resolver falls back to `retain`.

```typescript
import { defineAwsDataStoreRemovalPolicy, AwsDataStoreRemovalPolicy } from '@qpqjs/config-aws';

export default [
  // Dev config: let a teardown remove the data stores
  defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.destroy),
];
```

## Signature

```typescript
function defineAwsDataStoreRemovalPolicy(
  removalPolicy: AwsDataStoreRemovalPolicy,
): AwsDataStoreRemovalPolicyQPQConfigSetting;
```

## Parameters

### `removalPolicy` — `AwsDataStoreRemovalPolicy` (required)

Which policy to apply to all of the service's data stores.

### `AwsDataStoreRemovalPolicy`

| Value | Meaning | AWS effect |
| --- | --- | --- |
| `retain` | Keep the data when the resource is deleted or replaced (the default when this setting is not declared). | S3 buckets, DynamoDB tables, and Cognito user pools are **retained** (orphaned but preserved); the Neptune cluster is retained via a **final snapshot** rather than a live cluster. |
| `destroy` | Delete the data on teardown. | All data stores map to CDK `RemovalPolicy.DESTROY` and are removed with the stack. |

:::note
This is a single, service-wide setting (its `uniqueKey` is fixed) — declaring it more than once in a config is redundant. It applies uniformly to every data store the service owns; there is no per-resource override here.
:::

## Examples

```typescript
import { defineAwsDataStoreRemovalPolicy, AwsDataStoreRemovalPolicy } from '@qpqjs/config-aws';

// A shared dev config module: everything is disposable
export const devDataPolicy = [
  defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.destroy),
];

// Production config: omit the setting entirely (retain is the default),
// or state it explicitly for clarity
export const prodDataPolicy = [
  defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.retain),
];
```

## Related

- [defineStorageDrive](../core/storage-drive.md) — S3 buckets governed by this policy.
- [defineKeyValueStore](../core/key-value-store.md) — DynamoDB tables governed by this policy.
- [defineUserDirectory](../core/user-directory.md) — Cognito user pools governed by this policy.
- [defineGraphDatabase](../core/graph-database.md) — Neptune clusters, retained via a final snapshot under `retain`.
