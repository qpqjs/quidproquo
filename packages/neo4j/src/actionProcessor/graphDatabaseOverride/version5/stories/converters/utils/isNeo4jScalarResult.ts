import { AnyNeo4jResult, Neo4jScalarResult } from '../../types';

export function isNeo4jScalarResult(anyNeo4jResult: AnyNeo4jResult): anyNeo4jResult is Neo4jScalarResult {
  return typeof anyNeo4jResult !== 'object' || anyNeo4jResult === null;
}
