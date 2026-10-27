import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetExportingEffect } from '../effects/EventDocExportUiSetExportingEffect';

/** Dispatches SetExporting. */
export function* askUIEventDocExportSetExporting(isExporting: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetExportingEffect>(EventDocExportUiEffect.SetExporting, { isExporting });
}
