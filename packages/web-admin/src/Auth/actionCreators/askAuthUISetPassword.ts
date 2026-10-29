import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthEffect } from '../effects/AuthEffect';
import { AuthSetPasswordEffect } from '../effects/AuthSetPasswordEffect';

export function* askAuthUISetPassword(password: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthSetPasswordEffect>(AuthEffect.SetPassword, password);
}
