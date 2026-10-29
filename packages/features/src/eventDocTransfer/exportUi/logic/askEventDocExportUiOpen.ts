import { AskResponse } from '@qpqjs/core';

import { askEventDocListFetchAll } from '../../../eventDoc/list/transport/askEventDocListFetchAll';
import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { askUIEventDocExportOpen } from '../actionCreators/askUIEventDocExportOpen';
import { askUIEventDocExportSetCandidates } from '../actionCreators/askUIEventDocExportSetCandidates';
import { askUIEventDocExportSetError } from '../actionCreators/askUIEventDocExportSetError';

/** Opens the export dialog and loads the collection as candidates. */
export function* askEventDocExportUiOpen(serviceName: string, basePath: string): AskResponse<void> {
  yield* askUIEventDocExportOpen();

  const result = yield* askUiCatch(askEventDocListFetchAll(serviceName, basePath), {
    askSetError: askUIEventDocExportSetError,
    errorText: 'Could not load the documents to choose from.',
  });

  if (!result.success) {
    return;
  }

  yield* askUIEventDocExportSetCandidates(result.result);
}
