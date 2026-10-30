import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiResetEffect } from '../effects/EventDocImportUiResetEffect';

/** Dispatches Reset. */
export function* askEventDocImportReset(): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiResetEffect>(EventDocImportUiEffect.Reset, {});
}
