import { askCatch, AskResponse } from 'quidproquo-core';

import { EventDocTransferPlanRow } from '../../models';
import { askUIEventDocImportSetApplying } from '../actionCreators/askUIEventDocImportSetApplying';
import { askUIEventDocImportSetError } from '../actionCreators/askUIEventDocImportSetError';
import { askUIEventDocImportSetResult } from '../actionCreators/askUIEventDocImportSetResult';
import { askEventDocImportFetch } from '../transport/askEventDocImportFetch';

/** Applies the reviewed plan; the backend re-plans each doc as it goes, so `force` only fires on a doc still diverged at write time. */
export function* askEventDocImportUiApply(serviceName: string, transferId: string, force = false): AskResponse<EventDocTransferPlanRow[]> {
  yield* askUIEventDocImportSetApplying(true);
  yield* askUIEventDocImportSetError(null);

  const result = yield* askCatch(askEventDocImportFetch(serviceName, transferId, force), askUIEventDocImportSetApplying(false));

  if (!result.success) {
    yield* askUIEventDocImportSetError('Import failed.');
    return [];
  }

  yield* askUIEventDocImportSetResult(result.result);

  return result.result;
}
