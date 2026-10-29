import { AskResponse } from '@qpqjs/core';

import { askEventDocExportSetManifest } from '../actionCreators/askEventDocExportSetManifest';

/** Returns from the preview to picking by clearing the manifest; the ticks are kept. */
export function* askEventDocExportUiBack(): AskResponse<void> {
  yield* askEventDocExportSetManifest([]);
}
