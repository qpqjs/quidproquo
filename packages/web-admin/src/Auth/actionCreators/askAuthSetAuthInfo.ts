import { AskResponse, askStateDispatchEffect, AuthenticateUserResponse } from '@qpqjs/core';

import { AuthEffect } from '../effects/AuthEffect';
import { AuthSetAuthInfoEffect } from '../effects/AuthSetAuthInfoEffect';

export function* askAuthSetAuthInfo(authInfo: AuthenticateUserResponse): AskResponse<void> {
  yield* askStateDispatchEffect<AuthSetAuthInfoEffect>(AuthEffect.SetAuthInfo, authInfo);
}
