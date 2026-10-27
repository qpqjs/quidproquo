import { AskResponse, GraphEntityType, GraphRelationshipResult } from 'quidproquo-core';

import { Neo4jRelationshipResult } from '../types';

export function* askConvertNeo4jRelationshipResultToGraphRelationshipResult(
  neo4jRelationshipResult: Neo4jRelationshipResult,
): AskResponse<GraphRelationshipResult> {
  return {
    $entityType: GraphEntityType.Relationship,
    $id: neo4jRelationshipResult.elementId,
    $start: neo4jRelationshipResult.startNodeElementId,
    $end: neo4jRelationshipResult.endNodeElementId,
    $type: neo4jRelationshipResult.type,
    $properties: neo4jRelationshipResult.properties,
  };
}
