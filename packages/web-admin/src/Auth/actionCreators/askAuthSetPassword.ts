import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthEffect } from '../effects/AuthEffect';
import { AuthSetPasswordEffect } from '../effects/AuthSetPasswordEffect';

export function* askAuthSetPassword(password: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthSetPasswordEffect>(AuthEffect.SetPassword, password);
}
