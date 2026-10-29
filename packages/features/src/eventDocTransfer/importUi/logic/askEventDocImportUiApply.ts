import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { EventDocTransferPlanRow } from '../../models';
import { askEventDocImportSetApplying } from '../actionCreators/askEventDocImportSetApplying';
import { askEventDocImportSetError } from '../actionCreators/askEventDocImportSetError';
import { askEventDocImportSetResult } from '../actionCreators/askEventDocImportSetResult';
import { askEventDocImportFetch } from '../transport/askEventDocImportFetch';

/** Applies the reviewed plan; the backend re-plans each doc as it goes, so `force` only fires on a doc still diverged at write time. */
export function* askEventDocImportUiApply(serviceName: string, transferId: string, force = false): AskResponse<EventDocTransferPlanRow[]> {
  const result = yield* askUiCatch(askEventDocImportFetch(serviceName, transferId, force), {
    askSetError: askEventDocImportSetError,
    askSetBusy: askEventDocImportSetApplying,
    errorText: 'Import failed.',
  });

  if (!result.success) {
    return [];
  }

  yield* askEventDocImportSetResult(result.result);

  return result.result;
}
