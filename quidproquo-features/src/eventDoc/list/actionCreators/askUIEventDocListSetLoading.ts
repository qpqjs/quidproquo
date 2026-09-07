import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListSetLoadingEffect } from '../effects/EventDocListSetLoadingEffect';

/** Dispatches SetLoading. */
export function* askUIEventDocListSetLoading(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListSetLoadingEffect>(EventDocListEffect.SetLoading, { isLoading });
}
