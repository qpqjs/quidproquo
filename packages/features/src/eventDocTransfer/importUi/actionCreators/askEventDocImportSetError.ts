import { AskResponse, askStateDispatchEffect, Nullable } from '@qpqjs/core';

import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiSetErrorEffect } from '../effects/EventDocImportUiSetErrorEffect';

/** Dispatches SetError. */
export function* askEventDocImportSetError(error: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiSetErrorEffect>(EventDocImportUiEffect.SetError, { error });
}
