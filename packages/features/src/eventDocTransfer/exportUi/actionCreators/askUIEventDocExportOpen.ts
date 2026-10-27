import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiOpenEffect } from '../effects/EventDocExportUiOpenEffect';

/** Dispatches Open. */
export function* askUIEventDocExportOpen(): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiOpenEffect>(EventDocExportUiEffect.Open, {});
}
