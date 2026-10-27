import { AskResponse, GraphEntityType, GraphRelationshipResult } from 'quidproquo-core';

import { NeptuneRelationshipResult } from '../types';

export function* askConvertNeptuneRelationshipResultToGraphRelationshipResult(
  neptuneRelationshipResult: NeptuneRelationshipResult,
): AskResponse<GraphRelationshipResult> {
  return {
    $entityType: GraphEntityType.Relationship,
    $id: neptuneRelationshipResult['~id'],
    $start: neptuneRelationshipResult['~start'],
    $end: neptuneRelationshipResult['~end'],
    $type: neptuneRelationshipResult['~type'],
    $properties: neptuneRelationshipResult['~properties'],
  };
}
