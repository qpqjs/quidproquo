import { askCatch, AskResponse } from 'quidproquo-core';

import { askEventDocListFetchAll } from '../../../eventDoc/list/transport/askEventDocListFetchAll';
import { askUIEventDocExportOpen } from '../actionCreators/askUIEventDocExportOpen';
import { askUIEventDocExportSetCandidates } from '../actionCreators/askUIEventDocExportSetCandidates';
import { askUIEventDocExportSetError } from '../actionCreators/askUIEventDocExportSetError';

/** Opens the export dialog and loads the collection as candidates. */
export function* askEventDocExportUiOpen(serviceName: string, basePath: string): AskResponse<void> {
  yield* askUIEventDocExportOpen();

  const result = yield* askCatch(askEventDocListFetchAll(serviceName, basePath));

  if (!result.success) {
    yield* askUIEventDocExportSetError('Could not load the documents to choose from.');
    return;
  }

  yield* askUIEventDocExportSetCandidates(result.result);
}
