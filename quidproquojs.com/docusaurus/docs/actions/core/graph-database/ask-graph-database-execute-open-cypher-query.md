---
title: askGraphDatabaseExecuteOpenCypherQuery
description: Run an openCypher query against a graph database and get back nodes, relationships, and scalar values.
---

# askGraphDatabaseExecuteOpenCypherQuery

Runs an [openCypher](https://opencypher.org/) query against a [graph database](../../../config/core/graph-database.md) and returns the matching rows. Each returned column is normalised into a **node**, a **relationship**, or a **scalar** value, so stories work against one engine-agnostic result shape rather than the raw driver output.

- **Action type:** `GraphDatabaseActionType.ExecuteOpenCypherQuery`
- **On AWS:** the processor resolves the database's Neptune endpoints, picks the reader or writer based on `instance`, POSTs the query to Neptune's `/openCypher` HTTP endpoint, and converts the Neptune response into the [`GraphCypherResponse`](#returns) shape.

```typescript
import { askGraphDatabaseExecuteOpenCypherQuery, GraphDatabaseInstanceType } from '@qpqjs/core';

export function* askFindFriends(userId: string) {
  const response = yield* askGraphDatabaseExecuteOpenCypherQuery(
    'social-graph',
    GraphDatabaseInstanceType.Read,
    'MATCH (u:User { id: $userId })-[:FOLLOWS]->(f:User) RETURN f',
    { userId },
  );

  // Each row is keyed by the RETURN alias — here, `f`.
  return response.results.map((row) => row.f);
}
```

## Signature

```typescript
function* askGraphDatabaseExecuteOpenCypherQuery(
  graphDatabaseName: string,
  instance: GraphDatabaseInstanceType,
  openCypherQuery: string,
  params?: Record<string, any>,
): AskResponse<GraphCypherResponse>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `graphDatabaseName` | `string` | – | Name of the graph database to query — must match a database declared with [defineGraphDatabase](../../../config/core/graph-database.md) (or one shared via its `owner` option). |
| `instance` | `GraphDatabaseInstanceType` | – | Which cluster endpoint to run against — the reader or the writer. See below. |
| `openCypherQuery` | `string` | – | The openCypher query text. Use named parameters (e.g. `$userId`) rather than string-concatenating values. |
| `params` | `Record<string, any>` | `undefined` | Values bound to the named parameters referenced in the query. |

### `GraphDatabaseInstanceType`

Selects which endpoint of the cluster the query runs against.

| Member | Value | Use for |
| --- | --- | --- |
| `GraphDatabaseInstanceType.Read` | `'read'` | Read-only queries (`MATCH … RETURN`). Routed to the read endpoint, which can serve from read replicas. |
| `GraphDatabaseInstanceType.Write` | `'write'` | Queries that mutate the graph (`CREATE`, `MERGE`, `SET`, `DELETE`). Routed to the write (primary) endpoint. |

## Returns

`GraphCypherResponse` — an envelope with a single `results` array. Each element is one **row** returned by the query:

```typescript
interface GraphCypherResponse {
  results: GraphQueryResult[];
}
```

### `GraphQueryResult` — a row

A row is a map keyed by the column names (the aliases in your `RETURN` clause). Each value is normalised into one of three result kinds:

```typescript
interface GraphQueryResult {
  [column: string]: AnyGraphResult;
}

type AnyGraphResult = GraphNodeResult | GraphRelationshipResult | GraphScalarResult;
```

For example, `RETURN u, r, count(*) AS total` produces rows with keys `u` (a node), `r` (a relationship), and `total` (a scalar).

### The result kinds

`AnyGraphResult` is a discriminated union. Node and relationship results carry the shared base fields from `GraphEntity` plus a `$entityType` tag you can switch on; scalars are plain primitives.

```typescript
// Shared base for graph entities
interface GraphEntity {
  $id: string;                       // engine-assigned entity id
  $properties: Record<string, any>;  // the entity's property bag
}

enum GraphEntityType {
  Node = 'node',
  Relationship = 'relationship',
}
```

**`GraphNodeResult`** — a vertex:

```typescript
interface GraphNodeResult extends GraphEntity {
  $entityType: GraphEntityType.Node;
  $labels: string[];   // the node's labels, e.g. ['User']
}
```

**`GraphRelationshipResult`** — an edge:

```typescript
interface GraphRelationshipResult extends GraphEntity {
  $entityType: GraphEntityType.Relationship;
  $start: string;   // $id of the start node
  $end: string;     // $id of the end node
  $type: string;    // the relationship type, e.g. 'FOLLOWS'
}
```

**`GraphScalarResult`** — a primitive returned directly (counts, sums, property values, etc.):

```typescript
type GraphScalarResult = number | string | boolean | null;
```

Because nodes and relationships share `$id` and `$properties` and are tagged by `$entityType`, you can narrow a value safely:

```typescript
import { GraphEntityType } from '@qpqjs/core';

function describe(value: AnyGraphResult): string {
  if (value === null || typeof value !== 'object') {
    return `scalar: ${value}`; // GraphScalarResult
  }

  if (value.$entityType === GraphEntityType.Node) {
    return `node ${value.$id} [${value.$labels.join(', ')}]`;
  }

  return `relationship ${value.$type} ${value.$start} -> ${value.$end}`;
}
```

## Notes

- **Referencing internal ids in a query.** To read an entity's engine id inside a query, wrap the variable in `qpqElementId(...)` — e.g. `RETURN qpqElementId(n) AS id`. The runtime rewrites this to the underlying engine's internal id field, keeping queries portable. The related [askGraphDatabaseInternalFieldNames](./ask-graph-database-internal-field-names.md) action exposes the raw internal field-name tokens for the more advanced cases.
- **Errors.** This action declares no custom error enum. Failures (for example, an unreachable endpoint or a rejected query) surface as generic errors, which you can trap with `askCatch`:

  ```typescript
  const outcome = yield* askCatch(
    askGraphDatabaseExecuteOpenCypherQuery('social-graph', GraphDatabaseInstanceType.Read, 'MATCH (n) RETURN n'),
  );

  if (outcome.success) {
    const response = outcome.result;
    // ...
  } else {
    // outcome.error.errorType / outcome.error.errorText
  }
  ```

## Related

- [defineGraphDatabase](../../../config/core/graph-database.md) — declares the database this action queries.
- [askGraphDatabaseInternalFieldNames](./ask-graph-database-internal-field-names.md) — the internal field-name tokens for referencing engine metadata in queries.
