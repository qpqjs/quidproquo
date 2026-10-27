import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiToggleSelectedEffect } from '../effects/EventDocExportUiToggleSelectedEffect';

/** Dispatches ToggleSelected. */
export function* askUIEventDocExportToggleSelected(id: string): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiToggleSelectedEffect>(EventDocExportUiEffect.ToggleSelected, { id });
}
