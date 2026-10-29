import { isGraphScalarResult } from '@qpqjs/core';

import { AnyNeo4jResult, Neo4jRelationshipResult } from '../../types';

export function isNeo4jRelationshipResult(anyNeo4jResult: AnyNeo4jResult): anyNeo4jResult is Neo4jRelationshipResult {
  // Scalars (including null) can never be relationships.
  if (isGraphScalarResult(anyNeo4jResult)) {
    return false;
  }

  // Only relationships carry start/end element ids.
  return 'startNodeElementId' in anyNeo4jResult;
}
