import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetLoadingEffect } from '../effects/EventDocExportUiSetLoadingEffect';

/** Dispatches SetLoading. */
export function* askEventDocExportSetLoading(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetLoadingEffect>(EventDocExportUiEffect.SetLoading, { isLoading });
}
