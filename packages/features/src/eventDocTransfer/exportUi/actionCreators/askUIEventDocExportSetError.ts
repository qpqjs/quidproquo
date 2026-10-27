import { AskResponse, askStateDispatchEffect, Nullable } from 'quidproquo-core';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetErrorEffect } from '../effects/EventDocExportUiSetErrorEffect';

/** Dispatches SetError. */
export function* askUIEventDocExportSetError(error: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetErrorEffect>(EventDocExportUiEffect.SetError, { error });
}
