import { askReduce, AskResponse, GraphQueryResult } from '@qpqjs/core';

import { NeptuneQueryResult } from '../types';
import { askConvertAnyNeptuneResultToAnyGraphResult } from './askConvertAnyNeptuneResultToAnyGraphResult';

/**
 *
 */
export function* askConvertNeptuneQueryResultToGraphQueryResult(neptuneQueryResult: NeptuneQueryResult): AskResponse<GraphQueryResult> {
  return yield* askReduce(Object.entries(neptuneQueryResult), {} as GraphQueryResult, function* askConvertKeyValue(acc, [key, value]) {
    return {
      ...acc,
      [key]: yield* askConvertAnyNeptuneResultToAnyGraphResult(value),
    };
  });
}
