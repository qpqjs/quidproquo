import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiSetApplyingEffect } from '../effects/EventDocImportUiSetApplyingEffect';

/** Dispatches SetApplying. */
export function* askUIEventDocImportSetApplying(isApplying: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiSetApplyingEffect>(EventDocImportUiEffect.SetApplying, { isApplying });
}
