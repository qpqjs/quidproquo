---
title: defineGraphDatabase
description: Define a graph database — a named graph store that stories query with openCypher.
---

# defineGraphDatabase

Defines a **graph database**: a named graph store that stories query using [openCypher](https://opencypher.org/). Stories never talk to the underlying engine directly — they run queries by name with [askGraphDatabaseExecuteOpenCypherQuery](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md), and the runtime maps the name to the real cluster.

A graph database always lives inside a **virtual network** (VPC). You must declare that network separately and pass its name as the second argument — the database is deployed into it and is only reachable from workloads (lambdas) attached to the same network.

- **On AWS:** deploys an Amazon Neptune Serverless cluster (`QpqCoreApiGraphDatabaseConstruct` in `@qpqjs/deploy-aws`). The cluster is placed in the private subnets of the named virtual network's VPC, scales serverlessly (1–2.5 NCUs), exports audit logs to CloudWatch (one-week retention), and is reachable only from lambdas carrying the network's workload security group. Data stores are retained via a final **snapshot** on stack teardown unless the service opts into destroy with `defineAwsDataStoreRemovalPolicy`.

```typescript
import { defineGraphDatabase } from '@qpqjs/core';

export default [
  defineGraphDatabase('social-graph', 'main-network'),
];
```

## Signature

```typescript
function defineGraphDatabase(
  name: string,
  virualNetworkName: string,
  options?: QPQConfigAdvancedGraphDatabaseSettings,
): GraphDatabaseQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The name of the graph database. This is the name you pass as the first argument to [askGraphDatabaseExecuteOpenCypherQuery](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md). It is also the database's `uniqueKey` within the config, and on AWS it is used to derive the physical Neptune cluster name (prefixed with application/module/environment, so the same config deploys to multiple environments without collisions).

### `virualNetworkName` — `string` (required)

The name of the **virtual network** (VPC) the database is deployed into. Only workloads attached to this same network can reach the cluster. This must match a virtual network declared for the service.

> **Note:** the parameter is spelled `virualNetworkName` (missing the second "t") in the source. This has no effect on usage — you pass the network name as a plain string — but it is the literal property name on the config setting.

### `options` — `QPQConfigAdvancedGraphDatabaseSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `owner` | `CrossModuleOwner<'graphDatabaseName'>` | – | Declares that this database is owned by **another** module/service. Use this to query a database deployed elsewhere: the deploy grants this service access to the foreign cluster instead of creating a new one. `{ module, application, feature, environment, graphDatabaseName }` — all optional; unset parts default to the current service. |

## Examples

```typescript
import { defineGraphDatabase } from '@qpqjs/core';

export default [
  // A graph database in this service's own network
  defineGraphDatabase('social-graph', 'main-network'),

  // Query a graph database owned by another module
  defineGraphDatabase('shared-graph', 'main-network', {
    owner: { module: 'graph-service' },
  }),
];
```

## Related

- [askGraphDatabaseExecuteOpenCypherQuery](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md) — run an openCypher query against a database defined here.
- [defineVirtualNetwork](./virtual-network.md) — the private network an in-network graph database runs inside.
- [defineGraphDatabaseNeo4j](../neo4j/graph-database-neo4j.md) — the same graph database action backed by Neo4j instead of Neptune.
- **AWS tuning:** [defineAwsDataStoreRemovalPolicy](../config-aws/aws-data-store-removal-policy.md) — retain (via a final snapshot) vs destroy the Neptune cluster on teardown.
- **AWS implementation:** `QpqCoreApiGraphDatabaseConstruct` (Neptune Serverless cluster, VPC placement, IAM grants) in `@qpqjs/deploy-aws`.
