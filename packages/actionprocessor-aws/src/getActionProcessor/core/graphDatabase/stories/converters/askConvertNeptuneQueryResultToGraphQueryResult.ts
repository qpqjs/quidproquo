import { askReduce, AskResponse, GraphQueryResult } from 'quidproquo-core';

import { NeptuneQueryResult } from '../types';
import { askConvertAnyNeptuneResultToAnyGraphResult } from './askConvertAnyNeptuneResultToAnyGraphResult';

export function* askConvertNeptuneQueryResultToGraphQueryResult(neptuneQueryResult: NeptuneQueryResult): AskResponse<GraphQueryResult> {
  return yield* askReduce(Object.keys(neptuneQueryResult), {} as GraphQueryResult, function* askConvertKeyValue(acc, key) {
    return {
      ...acc,
      [key]: yield* askConvertAnyNeptuneResultToAnyGraphResult(neptuneQueryResult[key]),
    };
  });
}
