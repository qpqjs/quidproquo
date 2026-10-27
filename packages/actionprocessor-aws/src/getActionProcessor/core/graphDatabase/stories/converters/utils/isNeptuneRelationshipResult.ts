import { AnyNeptuneResult, NeptuneRelationshipResult } from '../../types';

export function isNeptuneRelationshipResult(anyNeptuneResult: AnyNeptuneResult): anyNeptuneResult is NeptuneRelationshipResult {
  return (
    typeof anyNeptuneResult === 'object' &&
    anyNeptuneResult !== null &&
    anyNeptuneResult['~entityType'] === 'relationship' &&
    typeof anyNeptuneResult['~start'] === 'string' &&
    typeof anyNeptuneResult['~end'] === 'string' &&
    typeof anyNeptuneResult['~type'] === 'string'
  );
}
