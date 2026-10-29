import { AskResponse, AuthenticateUserChallenge } from '@qpqjs/core';

import { askSaveAuthToken } from '../../platformLogic';
import { askAuthUISetAuthInfo } from '../actionCreators/askAuthUISetAuthInfo';
import { askAuthUISetPassword } from '../actionCreators/askAuthUISetPassword';

export function* askAuthLogout(): AskResponse<void> {
  yield* askSaveAuthToken({
    challenge: AuthenticateUserChallenge.NONE,
  });

  yield* askAuthUISetPassword('');
  yield* askAuthUISetAuthInfo({
    challenge: AuthenticateUserChallenge.NONE,
  });
}
