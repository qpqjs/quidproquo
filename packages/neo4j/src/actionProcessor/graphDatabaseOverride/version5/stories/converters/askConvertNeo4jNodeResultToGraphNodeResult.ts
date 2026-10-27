import { AskResponse, GraphEntityType, GraphNodeResult } from 'quidproquo-core';

import { Neo4jNodeResult } from '../types';

export function* askConvertNeo4jNodeResultToGraphNodeResult(neo4jNodeResult: Neo4jNodeResult): AskResponse<GraphNodeResult> {
  return {
    $entityType: GraphEntityType.Node,
    $id: neo4jNodeResult.elementId,
    $labels: neo4jNodeResult.labels,
    $properties: neo4jNodeResult.properties,
  };
}
