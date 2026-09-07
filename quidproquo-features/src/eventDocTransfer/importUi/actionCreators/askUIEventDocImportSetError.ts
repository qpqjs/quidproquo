import { AskResponse, askStateDispatchEffect, Nullable } from 'quidproquo-core';

import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiSetErrorEffect } from '../effects/EventDocImportUiSetErrorEffect';

/** Dispatches SetError. */
export function* askUIEventDocImportSetError(error: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiSetErrorEffect>(EventDocImportUiEffect.SetError, { error });
}
