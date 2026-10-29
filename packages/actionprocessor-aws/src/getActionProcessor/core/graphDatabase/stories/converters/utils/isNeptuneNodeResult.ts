import { AnyNeptuneResult, NeptuneNodeResult } from '../../types';

export function isNeptuneNodeResult(anyNeptuneResult: AnyNeptuneResult): anyNeptuneResult is NeptuneNodeResult {
  return typeof anyNeptuneResult === 'object' && anyNeptuneResult !== null && anyNeptuneResult['~entityType'] === 'node';
}
