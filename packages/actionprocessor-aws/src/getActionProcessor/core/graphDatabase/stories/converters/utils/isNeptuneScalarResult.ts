import { AnyNeptuneResult, NeptuneScalarResult } from '../../types';

export function isNeptuneScalarResult(anyNeptuneResult: AnyNeptuneResult): anyNeptuneResult is NeptuneScalarResult {
  return typeof anyNeptuneResult !== 'object' || anyNeptuneResult === null;
}
