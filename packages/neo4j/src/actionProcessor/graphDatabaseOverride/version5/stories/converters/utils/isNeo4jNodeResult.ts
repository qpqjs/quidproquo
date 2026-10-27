import { AnyNeo4jResult, Neo4jNodeResult } from '../../types';
import { isNeo4jRelationshipResult } from './isNeo4jRelationshipResult';
import { isNeo4jScalarResult } from './isNeo4jScalarResult';

export function isNeo4jNodeResult(anyNeo4jResult: AnyNeo4jResult): anyNeo4jResult is Neo4jNodeResult {
  // There is no positive node marker in the wire format: a node is anything
  // that is neither a scalar nor a relationship.
  return !isNeo4jScalarResult(anyNeo4jResult) && !isNeo4jRelationshipResult(anyNeo4jResult);
}
