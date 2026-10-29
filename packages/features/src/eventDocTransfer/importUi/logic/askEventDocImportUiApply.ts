import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { EventDocTransferPlanRow } from '../../models';
import { askUIEventDocImportSetApplying } from '../actionCreators/askUIEventDocImportSetApplying';
import { askUIEventDocImportSetError } from '../actionCreators/askUIEventDocImportSetError';
import { askUIEventDocImportSetResult } from '../actionCreators/askUIEventDocImportSetResult';
import { askEventDocImportFetch } from '../transport/askEventDocImportFetch';

/** Applies the reviewed plan; the backend re-plans each doc as it goes, so `force` only fires on a doc still diverged at write time. */
export function* askEventDocImportUiApply(serviceName: string, transferId: string, force = false): AskResponse<EventDocTransferPlanRow[]> {
  const result = yield* askUiCatch(askEventDocImportFetch(serviceName, transferId, force), {
    askSetError: askUIEventDocImportSetError,
    askSetBusy: askUIEventDocImportSetApplying,
    errorText: 'Import failed.',
  });

  if (!result.success) {
    return [];
  }

  yield* askUIEventDocImportSetResult(result.result);

  return result.result;
}
