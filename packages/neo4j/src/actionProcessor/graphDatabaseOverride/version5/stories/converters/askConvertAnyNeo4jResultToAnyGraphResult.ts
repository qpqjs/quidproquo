import { createAnyGraphResultConverter } from '@qpqjs/core';

import { AnyNeo4jResult, Neo4jNodeResult, Neo4jRelationshipResult } from '../types';
import { askConvertNeo4jNodeResultToGraphNodeResult } from './askConvertNeo4jNodeResultToGraphNodeResult';
import { askConvertNeo4jRelationshipResultToGraphRelationshipResult } from './askConvertNeo4jRelationshipResultToGraphRelationshipResult';
import { isNeo4jNodeResult, isNeo4jRelationshipResult } from './utils';

export const askConvertAnyNeo4jResultToAnyGraphResult = createAnyGraphResultConverter<AnyNeo4jResult, Neo4jNodeResult, Neo4jRelationshipResult>({
  vendor: 'neo4j',
  isNode: isNeo4jNodeResult,
  isRelationship: isNeo4jRelationshipResult,
  askConvertNode: askConvertNeo4jNodeResultToGraphNodeResult,
  askConvertRelationship: askConvertNeo4jRelationshipResultToGraphRelationshipResult,
});
