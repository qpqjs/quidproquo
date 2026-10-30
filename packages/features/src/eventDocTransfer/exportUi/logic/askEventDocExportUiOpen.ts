import { AskResponse } from '@qpqjs/core';

import { askEventDocListFetchAll } from '../../../eventDoc/list/transport/askEventDocListFetchAll';
import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { askEventDocExportOpen } from '../actionCreators/askEventDocExportOpen';
import { askEventDocExportSetCandidates } from '../actionCreators/askEventDocExportSetCandidates';
import { askEventDocExportSetError } from '../actionCreators/askEventDocExportSetError';

/** Opens the export dialog and loads the collection as candidates. */
export function* askEventDocExportUiOpen(serviceName: string, basePath: string): AskResponse<void> {
  yield* askEventDocExportOpen();

  const result = yield* askUiCatch(askEventDocListFetchAll(serviceName, basePath), {
    askSetError: askEventDocExportSetError,
    errorText: 'Could not load the documents to choose from.',
  });

  if (!result.success) {
    return;
  }

  yield* askEventDocExportSetCandidates(result.result);
}
