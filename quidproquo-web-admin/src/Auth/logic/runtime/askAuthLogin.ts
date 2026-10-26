import { AskResponse, askStateRead, AuthenticateUserChallenge, AuthenticateUserResponse } from 'quidproquo-core';

import { askPlatformRequest, askSaveAuthToken } from '../../../platformLogic';
import { askAuthUISetAuthInfo, askAuthUISetPassword } from '../authActionCreator';
import { AuthLoginPayload, AuthState } from '../authTypes';

export function* askAuthLogin(): AskResponse<void> {
  const { username, password } = yield* askStateRead<AuthState>('');

  const response = yield* askPlatformRequest<AuthLoginPayload, AuthenticateUserResponse>('POST', '/login', {
    body: {
      username,
      password,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return;
  }

  // The password is only needed for this request; the challenge flows work from the
  // server's session, so nothing downstream should still be able to read it.
  yield* askAuthUISetPassword('');

  if (response.data.challenge === AuthenticateUserChallenge.NONE) {
    yield* askSaveAuthToken(response.data);
  } else {
    yield* askSaveAuthToken({
      challenge: AuthenticateUserChallenge.NONE,
    });
  }

  yield* askAuthUISetAuthInfo(response.data);
}
