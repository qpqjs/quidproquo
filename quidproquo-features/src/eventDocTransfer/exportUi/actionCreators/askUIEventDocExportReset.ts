import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiResetEffect } from '../effects/EventDocExportUiResetEffect';

/** Dispatches Reset. */
export function* askUIEventDocExportReset(): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiResetEffect>(EventDocExportUiEffect.Reset, {});
}
