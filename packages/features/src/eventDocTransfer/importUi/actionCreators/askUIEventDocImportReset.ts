import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiResetEffect } from '../effects/EventDocImportUiResetEffect';

/** Dispatches Reset. */
export function* askUIEventDocImportReset(): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiResetEffect>(EventDocImportUiEffect.Reset, {});
}
