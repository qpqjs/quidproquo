import { AskResponse } from '@qpqjs/core';

import { askEventDocListFetchAll } from '../../../eventDoc/list/transport/askEventDocListFetchAll';
import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { askEventDocExportOpen } from '../actionCreators/askEventDocExportOpen';
import { askEventDocExportSetCandidates } from '../actionCreators/askEventDocExportSetCandidates';
import { askEventDocExportSetError } from '../actionCreators/askEventDocExportSetError';
import { askEventDocExportSetLoading } from '../actionCreators/askEventDocExportSetLoading';

/** Opens the export dialog and loads the collection as candidates. */
export function* askEventDocExportUiOpen(serviceName: string, basePath: string): AskResponse<void> {
  yield* askEventDocExportOpen();

  // Open raises loading, but the helper's error clear resets it, so the flag is handed to the helper to raise again
  // and lower when the fetch settles.
  const result = yield* askUiCatch(askEventDocListFetchAll(serviceName, basePath), {
    askSetError: askEventDocExportSetError,
    askSetBusy: askEventDocExportSetLoading,
    errorText: 'Could not load the documents to choose from.',
  });

  if (!result.success) {
    return;
  }

  yield* askEventDocExportSetCandidates(result.result);
}
