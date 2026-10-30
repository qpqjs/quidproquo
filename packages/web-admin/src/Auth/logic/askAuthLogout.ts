import { AskResponse, AuthenticateUserChallenge } from '@qpqjs/core';

import { askSaveAuthToken } from '../../platformLogic';
import { askAuthSetAuthInfo } from '../actionCreators/askAuthSetAuthInfo';
import { askAuthSetPassword } from '../actionCreators/askAuthSetPassword';

export function* askAuthLogout(): AskResponse<void> {
  yield* askSaveAuthToken({
    challenge: AuthenticateUserChallenge.NONE,
  });

  yield* askAuthSetPassword('');
  yield* askAuthSetAuthInfo({
    challenge: AuthenticateUserChallenge.NONE,
  });
}
