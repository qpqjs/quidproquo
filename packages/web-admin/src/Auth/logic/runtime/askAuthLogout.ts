import { AskResponse, AuthenticateUserChallenge } from 'quidproquo-core';

import { askSaveAuthToken } from '../../../platformLogic';
import { askAuthUISetAuthInfo, askAuthUISetPassword } from '../authActionCreator';

export function* askAuthLogout(): AskResponse<void> {
  yield* askSaveAuthToken({
    challenge: AuthenticateUserChallenge.NONE,
  });

  yield* askAuthUISetPassword('');
  yield* askAuthUISetAuthInfo({
    challenge: AuthenticateUserChallenge.NONE,
  });
}
