import { AskResponse } from '@qpqjs/core';

import { askEventDocImportReset } from '../actionCreators/askEventDocImportReset';

/** Clears the import screen. */
export function* askEventDocImportUiClear(): AskResponse<void> {
  yield* askEventDocImportReset();
}
