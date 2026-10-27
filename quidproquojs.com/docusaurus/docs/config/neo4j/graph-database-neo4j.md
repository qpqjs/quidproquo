---
title: defineGraphDatabaseNeo4j
description: Define a Neo4j-backed graph database that the core graph-database action queries with openCypher.
---

# defineGraphDatabaseNeo4j

Defines a **Neo4j-backed graph database**. It registers everything a service needs to run [openCypher](https://opencypher.org/) queries against a [Neo4j Aura](https://neo4j.com/cloud/aura/) instance while keeping the same story-facing API as a core graph database.

Stories still query the database by name with [askGraphDatabaseExecuteOpenCypherQuery](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md), and they receive the exact same [`GraphCypherResponse`](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md#returns) result shape — nodes, relationships, and scalars. The only difference from the core [defineGraphDatabase](../core/graph-database.md) is the backing engine: `defineGraphDatabase` deploys an Amazon Neptune cluster, whereas `defineGraphDatabaseNeo4j` points the same action at a hosted Neo4j instance. You choose one or the other per database name; the story code that queries it is identical either way.

It ships as a separate package. Import it from `@qpqjs/neo4j`:

```typescript
import { defineGraphDatabaseNeo4j } from '@qpqjs/neo4j';

export default [
  defineGraphDatabaseNeo4j('social-graph'),
];
```

- **On AWS:** this define does **not** deploy a database cluster. Neo4j is hosted externally (Neo4j Aura); the define instead wires up the pieces that let stories reach it. It contributes:
  - a [parameter](../core/parameter.md) named `neo4j-<databaseName>-instance` holding the Aura instance id,
  - a [secret](../core/secret.md) named `neo4j-<databaseName>-password` holding the database password,
  - an **action-processor override** that replaces the core graph-database processor so `askGraphDatabaseExecuteOpenCypherQuery` runs against Neo4j instead of Neptune, and
  - a daily [recurring schedule](../core/recurring-schedule.md) (`keepAlive`, `0 0 * * ? *` — midnight UTC) that runs a trivial `RETURN 1` query to keep the instance warm.

## How it connects

The action-processor override resolves the connection at query time rather than at deploy time. When a story runs [askGraphDatabaseExecuteOpenCypherQuery](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md), the Neo4j processor:

1. reads the instance id from the `neo4j-<databaseName>-instance` parameter and the password from the `neo4j-<databaseName>-password` secret;
2. rewrites the portable `qpqElementId(...)` helper in the query to Neo4j's native `elementId(...)` function;
3. POSTs the query and its `params` to the Aura Query API at `https://<instance>.databases.neo4j.io:443/db/neo4j/query/v2`, authenticating with HTTP Basic auth as user `neo4j`;
4. converts the raw Neo4j response back into the engine-agnostic [`GraphCypherResponse`](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md#returns) — mapping Neo4j nodes, relationships, and scalars onto the same `GraphNodeResult` / `GraphRelationshipResult` / `GraphScalarResult` kinds the core action returns.

Because the result normalisation matches the core engine, switching a database between Neptune and Neo4j requires no change to the querying stories.

## Signature

```typescript
function defineGraphDatabaseNeo4j(
  databaseName: string,
  options?: QPQConfigAdvancedGraphDatabaseNeo4jSettings,
): QPQConfig;
```

Unlike the core `defineGraphDatabase` (which returns a single `GraphDatabaseQPQConfigSetting`), this returns a `QPQConfig` — the array of underlying settings described in the **On AWS** section above. Spread or nest it directly in a service's config array.

## Parameters

### `databaseName` — `string` (required)

The name of the graph database. This is the name stories pass as the first argument to [askGraphDatabaseExecuteOpenCypherQuery](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md). It also derives the names of the generated parameter (`neo4j-<databaseName>-instance`) and secret (`neo4j-<databaseName>-password`).

### `options` — `QPQConfigAdvancedGraphDatabaseNeo4jSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `owner` | `CrossModuleOwner<'graphDatabaseName'>` | – | Declares that this database is owned by **another** module/service, so the generated parameter, secret, and schedule resolve against that owner instead of creating local ones. `{ module, application, feature, environment, graphDatabaseName }` — all optional; unset parts default to the current service. |
| `version` | `Neo4jVersion` | `Neo4jVersion.Version5` | Which Neo4j processor implementation to bind. Selects the action-processor override under `graphDatabaseOverride/<version>`. |

### `Neo4jVersion`

Selects the Neo4j processor version to wire up.

| Member | Value | Description |
| --- | --- | --- |
| `Neo4jVersion.Version5` | `'version5'` | Targets Neo4j 5.x via the Aura Query API v2 (the default). |

## Configuring the instance and password

`defineGraphDatabaseNeo4j` declares the parameter and secret but does not set their values — you supply those where you'd normally set a parameter and a secret for the service:

- **`neo4j-<databaseName>-instance`** — the Aura instance id used to build the endpoint host `<instance>.databases.neo4j.io`. See [defineParameter](../core/parameter.md).
- **`neo4j-<databaseName>-password`** — the password for the `neo4j` user, stored as a [secret](../core/secret.md).

## Examples

```typescript
import { defineGraphDatabaseNeo4j, Neo4jVersion } from '@qpqjs/neo4j';

export default [
  // A Neo4j-backed graph database for this service
  defineGraphDatabaseNeo4j('social-graph'),

  // Pin the processor version explicitly
  defineGraphDatabaseNeo4j('analytics-graph', {
    version: Neo4jVersion.Version5,
  }),

  // Use a database whose parameter/secret are owned by another module
  defineGraphDatabaseNeo4j('shared-graph', {
    owner: { module: 'graph-service' },
  }),
];
```

Query it exactly as you would a core graph database — the story code doesn't know or care that Neo4j backs it:

```typescript
import { askGraphDatabaseExecuteOpenCypherQuery, GraphDatabaseInstanceType } from '@qpqjs/core';

export function* askFindFriends(userId: string) {
  const response = yield* askGraphDatabaseExecuteOpenCypherQuery(
    'social-graph',
    GraphDatabaseInstanceType.Read,
    'MATCH (u:User { id: $userId })-[:FOLLOWS]->(f:User) RETURN f',
    { userId },
  );

  return response.results.map((row) => row.f);
}
```

## Related

- [defineGraphDatabase](../core/graph-database.md) — the core (Neptune-backed) graph database; same query API, different backing engine.
- [askGraphDatabaseExecuteOpenCypherQuery](../../actions/core/graph-database/ask-graph-database-execute-open-cypher-query.md) — run an openCypher query against a database defined here; documents the shared result shape.
- [defineSecret](../core/secret.md) — where the `neo4j-<databaseName>-password` secret's value is supplied.
- [defineParameter](../core/parameter.md) — where the `neo4j-<databaseName>-instance` value is supplied.
- [defineRecurringSchedule](../core/recurring-schedule.md) — the mechanism behind the daily keep-alive.
