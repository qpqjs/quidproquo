import { askMap, AskResponse, GraphCypherResponse } from '@qpqjs/core';

import { NeptuneCypherResponse } from '../types';
import { askConvertNeptuneQueryResultToGraphQueryResult } from './askConvertNeptuneQueryResultToGraphQueryResult';

/**
 *
 */
export function* askConvertNeptuneCypherResponseToCypherResponse(neptuneCypherResponse: NeptuneCypherResponse): AskResponse<GraphCypherResponse> {
  return {
    results: yield* askMap(neptuneCypherResponse.results, askConvertNeptuneQueryResultToGraphQueryResult),
  };
}
