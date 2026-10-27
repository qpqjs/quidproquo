---
title: askGraphDatabaseInternalFieldNames
description: Get the engine-internal field-name tokens for referencing node/relationship metadata in openCypher queries.
---

# askGraphDatabaseInternalFieldNames

Returns the set of **internal field-name tokens** the underlying graph engine uses for entity metadata — id, label, type, and relationship endpoints. Use these when you need to reference an engine's internal fields directly inside an openCypher query without hard-coding engine-specific syntax.

Most stories don't need this: for the common case of reading an entity's id, wrap the variable in `qpqElementId(...)` inside your query and the runtime rewrites it for you. Reach for this action only when you need the other tokens (label, type, start/end node) in a portable way.

- **Action type:** `GraphDatabaseActionType.InternalFieldNames`

```typescript
import {
  askGraphDatabaseExecuteOpenCypherQuery,
  askGraphDatabaseInternalFieldNames,
  GraphDatabaseInstanceType,
} from '@qpqjs/core';

export function* askNodesByLabel(label: string) {
  const fields = yield* askGraphDatabaseInternalFieldNames();

  const response = yield* askGraphDatabaseExecuteOpenCypherQuery(
    'social-graph',
    GraphDatabaseInstanceType.Read,
    `MATCH (n) WHERE n.${fields.internalLabel} = $label RETURN n`,
    { label },
  );

  return response.results.map((row) => row.n);
}
```

## Signature

```typescript
function* askGraphDatabaseInternalFieldNames(): AskResponse<GraphDatabaseInternalFieldNames>;
```

## Parameters

None.

## Returns

`GraphDatabaseInternalFieldNames` (importable from @qpqjs/core) — a map of the engine's internal field-name tokens:

```typescript
type GraphDatabaseInternalFieldNames = {
  internalId: string;         // token for an entity's internal id
  internalLabel: string;      // token for a node's label
  internalType: string;       // token for a relationship's type
  internalStartNode: string;  // token for a relationship's start node
  internalEndNode: string;    // token for a relationship's end node
};
```

On the AWS (Neptune) runtime these resolve to Neptune's backtick-wrapped field references — for example `` `~id` ``, `` `~label` ``, `` `~type` ``, `` `~start` ``, and `` `~end` ``. Treat the exact values as engine-specific and always obtain them through this action rather than hard-coding them, so queries stay portable.

## Related

- [askGraphDatabaseExecuteOpenCypherQuery](./ask-graph-database-execute-open-cypher-query.md) — run the query these tokens are embedded in.
- [defineGraphDatabase](../../../config/core/graph-database.md) — declares the database being queried.
