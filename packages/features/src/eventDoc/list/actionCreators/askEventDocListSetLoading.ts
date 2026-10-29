import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListSetLoadingEffect } from '../effects/EventDocListSetLoadingEffect';

/** Dispatches SetLoading. */
export function* askEventDocListSetLoading(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListSetLoadingEffect>(EventDocListEffect.SetLoading, { isLoading });
}
