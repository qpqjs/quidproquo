import { AskResponse } from '@qpqjs/core';

import { askUIEventDocImportReset } from '../actionCreators/askUIEventDocImportReset';

/** Clears the import screen. */
export function* askEventDocImportUiClear(): AskResponse<void> {
  yield* askUIEventDocImportReset();
}
