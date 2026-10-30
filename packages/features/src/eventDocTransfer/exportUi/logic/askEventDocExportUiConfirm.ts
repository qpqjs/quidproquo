import { AskResponse, Nullable } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { EventDocDocRef, EventDocTransferExportResult } from '../../models';
import { askEventDocExportSetError } from '../actionCreators/askEventDocExportSetError';
import { askEventDocExportSetExporting } from '../actionCreators/askEventDocExportSetExporting';
import { askEventDocExportSetResult } from '../actionCreators/askEventDocExportSetResult';
import { askEventDocExportFetch } from '../transport/askEventDocExportFetch';

/**
 * Builds the bundle. The result is returned as well as stored so the view can start the download in the same click
 * handler; null means it failed and the error is already in state.
 */
export function* askEventDocExportUiConfirm(serviceName: string, targets: EventDocDocRef[]): AskResponse<Nullable<EventDocTransferExportResult>> {
  const result = yield* askUiCatch(askEventDocExportFetch(serviceName, targets), {
    askSetError: askEventDocExportSetError,
    askSetBusy: askEventDocExportSetExporting,
    errorText: 'Export failed.',
  });

  if (!result.success) {
    return null;
  }

  yield* askEventDocExportSetResult(result.result);

  return result.result;
}
