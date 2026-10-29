import { askDateNow, askNewGuid, AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { SystemEffect } from '../effects/SystemEffect';
import { SystemShowErrorEffect } from '../effects/SystemShowErrorEffect';

export function* askSystemShowError(error: string): AskResponse<void> {
  yield* askStateDispatchEffect<SystemShowErrorEffect>(SystemEffect.ShowError, {
    msg: error,
    at: yield* askDateNow(),
    id: yield* askNewGuid(),
  });
}
