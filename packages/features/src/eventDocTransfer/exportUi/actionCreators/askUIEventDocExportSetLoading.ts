import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetLoadingEffect } from '../effects/EventDocExportUiSetLoadingEffect';

/** Dispatches SetLoading. */
export function* askUIEventDocExportSetLoading(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetLoadingEffect>(EventDocExportUiEffect.SetLoading, { isLoading });
}
