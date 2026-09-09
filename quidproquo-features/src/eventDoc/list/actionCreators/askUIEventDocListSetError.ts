import { AskResponse, askStateDispatchEffect, Nullable } from 'quidproquo-core';

import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListSetErrorEffect } from '../effects/EventDocListSetErrorEffect';

/** Dispatches SetError. */
export function* askUIEventDocListSetError(error: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListSetErrorEffect>(EventDocListEffect.SetError, { error });
}
