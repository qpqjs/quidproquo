import { AskResponse } from '@qpqjs/core';

import { askEventDocExportReset } from '../actionCreators/askEventDocExportReset';

/** Closes the export dialog and drops its state, including the short-lived download link. */
export function* askEventDocExportUiClose(): AskResponse<void> {
  yield* askEventDocExportReset();
}
