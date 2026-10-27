import { AnyGraphResult, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { AnyNeo4jResult } from '../types';
import { askConvertNeo4jNodeResultToGraphNodeResult } from './askConvertNeo4jNodeResultToGraphNodeResult';
import { askConvertNeo4jRelationshipResultToGraphRelationshipResult } from './askConvertNeo4jRelationshipResultToGraphRelationshipResult';
import { isNeo4jNodeResult, isNeo4jRelationshipResult, isNeo4jScalarResult } from './utils';

export function* askConvertAnyNeo4jResultToAnyGraphResult(anyNeo4jResult: AnyNeo4jResult): AskResponse<AnyGraphResult> {
  if (isNeo4jScalarResult(anyNeo4jResult)) {
    return anyNeo4jResult;
  }

  if (isNeo4jNodeResult(anyNeo4jResult)) {
    return yield* askConvertNeo4jNodeResultToGraphNodeResult(anyNeo4jResult);
  }

  if (isNeo4jRelationshipResult(anyNeo4jResult)) {
    return yield* askConvertNeo4jRelationshipResultToGraphRelationshipResult(anyNeo4jResult);
  }

  // The guards above cover every AnyNeo4jResult; this is a backstop in case
  // the wire format ever drifts from the declared types.
  return yield* askThrowError(ErrorTypeEnum.GenericError, 'Unable to convert neo4j query result');
}
