import { AskResponse, askStateRead, AuthenticateUserChallenge, AuthenticateUserResponse } from '@qpqjs/core';

import { askPlatformRequest, askSaveAuthToken } from '../../platformLogic';
import { askAuthSetAuthInfo } from '../actionCreators/askAuthSetAuthInfo';
import { askAuthSetPassword } from '../actionCreators/askAuthSetPassword';
import { AuthLoginPayload } from '../types/AuthLoginPayload';
import { AuthState } from '../types/AuthState';

export function* askAuthLogin(): AskResponse<void> {
  const { username, password } = yield* askStateRead<AuthState>('');

  const response = yield* askPlatformRequest<AuthenticateUserResponse, AuthLoginPayload>('POST', '/login', {
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
  yield* askAuthSetPassword('');

  if (response.data.challenge === AuthenticateUserChallenge.NONE) {
    yield* askSaveAuthToken(response.data);
  } else {
    yield* askSaveAuthToken({
      challenge: AuthenticateUserChallenge.NONE,
    });
  }

  yield* askAuthSetAuthInfo(response.data);
}
