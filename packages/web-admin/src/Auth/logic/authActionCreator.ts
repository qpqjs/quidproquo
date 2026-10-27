import { AskResponse, askStateDispatchEffect, AuthenticateUserResponse } from 'quidproquo-core';

import { AuthEffect, AuthSetAuthInfoEffect, AuthSetPasswordEffect, AuthSetUsernameEffect } from './authTypes';

export function* askAuthUISetUsername(username: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthSetUsernameEffect>(AuthEffect.SetUsername, username);
}

export function* askAuthUISetPassword(password: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthSetPasswordEffect>(AuthEffect.SetPassword, password);
}

export function* askAuthUISetAuthInfo(authInfo: AuthenticateUserResponse): AskResponse<void> {
  yield* askStateDispatchEffect<AuthSetAuthInfoEffect>(AuthEffect.SetAuthInfo, authInfo);
}
