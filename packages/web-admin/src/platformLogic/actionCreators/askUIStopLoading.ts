import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { SystemEffect } from '../effects/SystemEffect';
import { SystemStopLoadingEffect } from '../effects/SystemStopLoadingEffect';

export function* askUIStopLoading(): AskResponse<void> {
  yield* askStateDispatchEffect<SystemStopLoadingEffect>(SystemEffect.StopLoading);
}
