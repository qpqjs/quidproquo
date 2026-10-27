import { AskResponse, askStateRead, AuthenticateUserResponse } from 'quidproquo-core';

import { askPlatformRequest, askSaveAuthToken } from '../../../../platformLogic';
import { askAuthUISetAuthInfo } from '../../../logic';
import { AuthChallengeSetPasswordPayload, AuthChallengeState } from '../authChallengeTypes';

export function* askAuthChallengeSendPasswords(challenge: string, session: string, email: string): AskResponse<void> {
  const { passwordA } = yield* askStateRead<AuthChallengeState>('');

  const response = yield* askPlatformRequest<AuthChallengeSetPasswordPayload, AuthenticateUserResponse>('POST', '/challenge', {
    body: {
      challenge,
      email,
      newPassword: passwordA,
      session,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return;
  }

  yield* askSaveAuthToken(response.data);
  yield* askAuthUISetAuthInfo(response.data);
}
