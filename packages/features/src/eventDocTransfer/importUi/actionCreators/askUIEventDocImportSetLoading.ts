import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiSetLoadingEffect } from '../effects/EventDocImportUiSetLoadingEffect';

/** Dispatches SetLoading. */
export function* askUIEventDocImportSetLoading(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiSetLoadingEffect>(EventDocImportUiEffect.SetLoading, { isLoading });
}
