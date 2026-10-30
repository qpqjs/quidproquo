import { createAnyGraphResultConverter } from '@qpqjs/core';

import { AnyNeptuneResult, NeptuneNodeResult, NeptuneRelationshipResult } from '../types';
import { askConvertNeptuneNodeResultToGraphNodeResult } from './askConvertNeptuneNodeResultToGraphNodeResult';
import { askConvertNeptuneRelationshipResultToGraphRelationshipResult } from './askConvertNeptuneRelationshipResultToGraphRelationshipResult';
import { isNeptuneNodeResult, isNeptuneRelationshipResult } from './utils';

export const askConvertAnyNeptuneResultToAnyGraphResult = createAnyGraphResultConverter<
  AnyNeptuneResult,
  NeptuneNodeResult,
  NeptuneRelationshipResult
>({
  vendor: 'neptune',
  isNode: isNeptuneNodeResult,
  isRelationship: isNeptuneRelationshipResult,
  askConvertNode: askConvertNeptuneNodeResultToGraphNodeResult,
  askConvertRelationship: askConvertNeptuneRelationshipResultToGraphRelationshipResult,
});
