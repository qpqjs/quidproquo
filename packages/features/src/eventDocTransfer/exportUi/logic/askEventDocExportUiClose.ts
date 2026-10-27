import { AskResponse } from 'quidproquo-core';

import { askUIEventDocExportReset } from '../actionCreators/askUIEventDocExportReset';

/** Closes the export dialog and drops its state, including the short-lived download link. */
export function* askEventDocExportUiClose(): AskResponse<void> {
  yield* askUIEventDocExportReset();
}
