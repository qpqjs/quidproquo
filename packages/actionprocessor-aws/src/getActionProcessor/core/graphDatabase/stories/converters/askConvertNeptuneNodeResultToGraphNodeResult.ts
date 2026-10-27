import { AskResponse, GraphEntityType, GraphNodeResult } from 'quidproquo-core';

import { NeptuneNodeResult } from '../types';

export function* askConvertNeptuneNodeResultToGraphNodeResult(neptuneNodeResult: NeptuneNodeResult): AskResponse<GraphNodeResult> {
  return {
    $entityType: GraphEntityType.Node,
    $id: neptuneNodeResult['~id'],
    $labels: neptuneNodeResult['~labels'],
    $properties: neptuneNodeResult['~properties'],
  };
}
