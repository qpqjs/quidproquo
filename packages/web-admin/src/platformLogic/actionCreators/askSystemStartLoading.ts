import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { SystemEffect } from '../effects/SystemEffect';
import { SystemStartLoadingEffect } from '../effects/SystemStartLoadingEffect';

export function* askSystemStartLoading(): AskResponse<void> {
  yield* askStateDispatchEffect<SystemStartLoadingEffect>(SystemEffect.StartLoading);
}
