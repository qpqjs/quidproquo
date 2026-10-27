import { AskResponse } from 'quidproquo-core';

import { askUIEventDocExportSetManifest } from '../actionCreators/askUIEventDocExportSetManifest';

/** Returns from the preview to picking by clearing the manifest; the ticks are kept. */
export function* askEventDocExportUiBack(): AskResponse<void> {
  yield* askUIEventDocExportSetManifest([]);
}
