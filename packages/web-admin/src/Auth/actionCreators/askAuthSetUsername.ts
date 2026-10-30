import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthEffect } from '../effects/AuthEffect';
import { AuthSetUsernameEffect } from '../effects/AuthSetUsernameEffect';

export function* askAuthSetUsername(username: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthSetUsernameEffect>(AuthEffect.SetUsername, username);
}
