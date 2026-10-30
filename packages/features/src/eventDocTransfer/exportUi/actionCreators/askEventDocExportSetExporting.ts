import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetExportingEffect } from '../effects/EventDocExportUiSetExportingEffect';

/** Dispatches SetExporting. */
export function* askEventDocExportSetExporting(isExporting: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetExportingEffect>(EventDocExportUiEffect.SetExporting, { isExporting });
}
