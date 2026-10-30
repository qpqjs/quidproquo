import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiSetApplyingEffect } from '../effects/EventDocImportUiSetApplyingEffect';

/** Dispatches SetApplying. */
export function* askEventDocImportSetApplying(isApplying: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiSetApplyingEffect>(EventDocImportUiEffect.SetApplying, { isApplying });
}
